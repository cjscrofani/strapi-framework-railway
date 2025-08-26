/**
 * File Storage Manager Service
 * Handles file uploads, processing, and management with Railway volumes
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import railwayConfig from '../config/railway';

export interface FileUpload {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  hash: string;
  metadata: FileMetadata;
  thumbnails?: ThumbnailInfo[];
  uploadedAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // For videos
  pages?: number; // For PDFs
  encoding?: string;
  colorSpace?: string;
  compressionLevel?: number;
  exif?: Record<string, any>;
  userId?: string;
  tags?: string[];
  description?: string;
}

export interface ThumbnailInfo {
  size: string; // e.g., '150x150', 'medium', 'large'
  path: string;
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface UploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  generateThumbnails?: boolean;
  thumbnailSizes?: ThumbnailSize[];
  compress?: boolean;
  quality?: number;
  stripMetadata?: boolean;
  userId?: string;
  tags?: string[];
  description?: string;
}

export interface ThumbnailSize {
  name: string;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  sizeByType: Record<string, number>;
  sizeByUser: Record<string, number>;
  availableSpace: number;
  usedSpace: number;
  storageHealth: 'healthy' | 'warning' | 'critical';
}

class FileStorageManager {
  private config: ReturnType<typeof railwayConfig.getConfig>;
  private uploadDir: string;
  private thumbnailDir: string;
  private tempDir: string;
  private allowedMimeTypes: string[];
  private maxFileSize: number;

  constructor() {
    this.config = railwayConfig.getConfig();
    this.setupDirectories();
    this.allowedMimeTypes = this.config.storage.local?.allowedMimeTypes || [];
    this.maxFileSize = this.config.storage.local?.maxFileSize || 52428800; // 50MB
  }

  // File Upload
  async uploadFile(fileBuffer: Buffer, originalName: string, options: UploadOptions = {}): Promise<FileUpload> {
    try {
      // Validate file
      const mimeType = await this.detectMimeType(fileBuffer);
      await this.validateFile(fileBuffer, mimeType, originalName, options);

      // Generate unique filename
      const hash = this.generateFileHash(fileBuffer);
      const fileExtension = path.extname(originalName).toLowerCase();
      const filename = `${hash}${fileExtension}`;
      const filePath = path.join(this.uploadDir, filename);
      const fileUrl = this.generateFileUrl(filename);

      // Check if file already exists
      const existingFile = await this.findFileByHash(hash);
      if (existingFile) {
        // File already exists, return existing record
        return existingFile;
      }

      // Process image if needed
      let processedBuffer = fileBuffer;
      let metadata: FileMetadata = {
        userId: options.userId,
        tags: options.tags,
        description: options.description,
      };

      if (this.isImageFile(mimeType)) {
        const imageResult = await this.processImage(fileBuffer, options);
        processedBuffer = imageResult.buffer;
        metadata = { ...metadata, ...imageResult.metadata };
      } else if (this.isDocumentFile(mimeType)) {
        metadata = { ...metadata, ...await this.extractDocumentMetadata(fileBuffer, mimeType) };
      }

      // Save file
      await fs.writeFile(filePath, processedBuffer);

      // Generate thumbnails if requested and applicable
      let thumbnails: ThumbnailInfo[] = [];
      if (options.generateThumbnails && this.isImageFile(mimeType)) {
        thumbnails = await this.generateThumbnails(filePath, filename, options.thumbnailSizes);
      }

      // Create file record
      const fileUpload: FileUpload = {
        id: this.generateFileId(),
        originalName,
        filename,
        path: filePath,
        url: fileUrl,
        mimeType,
        size: processedBuffer.length,
        hash,
        metadata,
        thumbnails,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await this.saveFileRecord(fileUpload);

      return fileUpload;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // File Retrieval
  async getFile(fileId: string): Promise<FileUpload | null> {
    try {
      return await this.findFileById(fileId);
    } catch (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async getFileBuffer(fileId: string): Promise<Buffer> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      return await fs.readFile(file.path);
    } catch (error) {
      throw new Error(`Failed to get file buffer: ${error.message}`);
    }
  }

  async getFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const fs = require('fs');
      return fs.createReadStream(file.path);
    } catch (error) {
      throw new Error(`Failed to get file stream: ${error.message}`);
    }
  }

  // File Management
  async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileUpload> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      file.metadata = { ...file.metadata, ...metadata };
      file.updatedAt = new Date();

      await this.updateFileRecord(file);
      return file;
    } catch (error) {
      throw new Error(`Failed to update file metadata: ${error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        return false;
      }

      // Delete physical file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn(`Failed to delete physical file: ${error.message}`);
      }

      // Delete thumbnails
      if (file.thumbnails) {
        for (const thumbnail of file.thumbnails) {
          try {
            await fs.unlink(thumbnail.path);
          } catch (error) {
            console.warn(`Failed to delete thumbnail: ${error.message}`);
          }
        }
      }

      // Remove from database
      await this.deleteFileRecord(fileId);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Image Processing
  private async processImage(buffer: Buffer, options: UploadOptions): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
    try {
      let pipeline = sharp(buffer);
      const imageInfo = await pipeline.metadata();

      const metadata: FileMetadata = {
        width: imageInfo.width,
        height: imageInfo.height,
        colorSpace: imageInfo.space,
        encoding: imageInfo.format,
      };

      // Strip metadata if requested
      if (options.stripMetadata) {
        pipeline = pipeline.withoutMetadata();
      }

      // Compress if requested
      if (options.compress) {
        const quality = options.quality || 85;
        
        if (imageInfo.format === 'jpeg') {
          pipeline = pipeline.jpeg({ quality });
        } else if (imageInfo.format === 'png') {
          pipeline = pipeline.png({ compressionLevel: 9 });
        } else if (imageInfo.format === 'webp') {
          pipeline = pipeline.webp({ quality });
        }
        
        metadata.compressionLevel = quality;
      }

      const processedBuffer = await pipeline.toBuffer();

      return {
        buffer: processedBuffer,
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Thumbnail Generation
  private async generateThumbnails(filePath: string, filename: string, customSizes?: ThumbnailSize[]): Promise<ThumbnailInfo[]> {
    try {
      const defaultSizes: ThumbnailSize[] = [
        { name: 'small', width: 150, height: 150, fit: 'cover', format: 'jpeg', quality: 80 },
        { name: 'medium', width: 300, height: 300, fit: 'cover', format: 'jpeg', quality: 80 },
        { name: 'large', width: 600, height: 600, fit: 'inside', format: 'jpeg', quality: 85 },
      ];

      const sizes = customSizes || defaultSizes;
      const thumbnails: ThumbnailInfo[] = [];

      for (const size of sizes) {
        const thumbnailFilename = this.generateThumbnailFilename(filename, size.name);
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
        const thumbnailUrl = this.generateThumbnailUrl(thumbnailFilename);

        let pipeline = sharp(filePath)
          .resize(size.width, size.height, { fit: size.fit || 'cover' });

        if (size.format === 'jpeg') {
          pipeline = pipeline.jpeg({ quality: size.quality || 80 });
        } else if (size.format === 'png') {
          pipeline = pipeline.png();
        } else if (size.format === 'webp') {
          pipeline = pipeline.webp({ quality: size.quality || 80 });
        }

        await pipeline.toFile(thumbnailPath);

        const thumbnailStats = await fs.stat(thumbnailPath);
        const thumbnailInfo = await sharp(thumbnailPath).metadata();

        thumbnails.push({
          size: size.name,
          path: thumbnailPath,
          url: thumbnailUrl,
          width: thumbnailInfo.width || 0,
          height: thumbnailInfo.height || 0,
          fileSize: thumbnailStats.size,
        });
      }

      return thumbnails;
    } catch (error) {
      throw new Error(`Failed to generate thumbnails: ${error.message}`);
    }
  }

  // File Search and Listing
  async listFiles(options: {
    userId?: string;
    mimeType?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'uploadedAt' | 'size' | 'name';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ files: FileUpload[]; total: number }> {
    try {
      // This would typically query a database
      // For now, returning placeholder structure
      return {
        files: [],
        total: 0,
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async searchFiles(query: string, options: {
    userId?: string;
    mimeType?: string;
    limit?: number;
  } = {}): Promise<FileUpload[]> {
    try {
      // This would typically perform a full-text search
      // For now, returning placeholder
      return [];
    } catch (error) {
      throw new Error(`Failed to search files: ${error.message}`);
    }
  }

  // Storage Management
  async getStorageStats(): Promise<StorageStats> {
    try {
      const stats: StorageStats = {
        totalFiles: 0,
        totalSize: 0,
        sizeByType: {},
        sizeByUser: {},
        availableSpace: 0,
        usedSpace: 0,
        storageHealth: 'healthy',
      };

      // Get directory size
      try {
        const dirStats = await this.getDirectorySize(this.uploadDir);
        stats.usedSpace = dirStats.size;
        stats.totalFiles = dirStats.files;
      } catch (error) {
        console.warn('Failed to get directory stats:', error);
      }

      // Get available space (Railway volume size)
      const volumeSize = this.parseVolumeSize(this.config.storage.volumes?.maxSize || '1GB');
      stats.availableSpace = volumeSize - stats.usedSpace;

      // Determine storage health
      const usagePercentage = (stats.usedSpace / volumeSize) * 100;
      if (usagePercentage > 90) {
        stats.storageHealth = 'critical';
      } else if (usagePercentage > 75) {
        stats.storageHealth = 'warning';
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  async cleanupOrphanedFiles(): Promise<number> {
    try {
      let deletedCount = 0;

      // Get all physical files
      const physicalFiles = await this.getAllPhysicalFiles();
      
      // Get all database records
      const databaseFiles = await this.getAllFileRecords();
      const databaseFileSet = new Set(databaseFiles.map(f => f.filename));

      // Delete orphaned physical files
      for (const physicalFile of physicalFiles) {
        if (!databaseFileSet.has(path.basename(physicalFile))) {
          try {
            await fs.unlink(physicalFile);
            deletedCount++;
          } catch (error) {
            console.warn(`Failed to delete orphaned file: ${physicalFile}`, error);
          }
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(`Failed to cleanup orphaned files: ${error.message}`);
    }
  }

  // Utility Methods
  private setupDirectories(): void {
    if (this.config.storage.provider === 'railway-volumes' && this.config.storage.volumes) {
      this.uploadDir = this.config.storage.volumes.mountPath;
      this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      this.tempDir = path.join(this.uploadDir, 'temp');
    } else {
      this.uploadDir = this.config.storage.local?.uploadDir || './public/uploads';
      this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      this.tempDir = path.join(this.uploadDir, 'temp');
    }

    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.uploadDir, this.thumbnailDir, this.tempDir];
    
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  private generateFileId(): string {
    return crypto.randomUUID();
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateFileUrl(filename: string): string {
    const baseUrl = railwayConfig.getPublicUrl();
    return `${baseUrl}/uploads/${filename}`;
  }

  private generateThumbnailFilename(originalFilename: string, size: string): string {
    const ext = path.extname(originalFilename);
    const name = path.basename(originalFilename, ext);
    return `${name}_${size}${ext}`;
  }

  private generateThumbnailUrl(filename: string): string {
    const baseUrl = railwayConfig.getPublicUrl();
    return `${baseUrl}/uploads/thumbnails/${filename}`;
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    // Simple MIME type detection based on file signatures
    const signatures: Record<string, string> = {
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      'ffd8ffe2': 'image/jpeg',
      '89504e47': 'image/png',
      '47494638': 'image/gif',
      '52494646': 'image/webp', // RIFF header, need to check WEBP
      '25504446': 'application/pdf',
      '504b0304': 'application/zip',
    };

    const header = buffer.toString('hex', 0, 4).toLowerCase();
    return signatures[header] || 'application/octet-stream';
  }

  private async validateFile(buffer: Buffer, mimeType: string, filename: string, options: UploadOptions): Promise<void> {
    // Check file size
    const maxSize = options.maxFileSize || this.maxFileSize;
    if (buffer.length > maxSize) {
      throw new Error(`File size ${buffer.length} exceeds maximum allowed size ${maxSize}`);
    }

    // Check MIME type
    const allowedTypes = options.allowedMimeTypes || this.allowedMimeTypes;
    if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Check filename
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      throw new Error('Invalid filename characters');
    }
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isDocumentFile(mimeType: string): boolean {
    return mimeType === 'application/pdf' || 
           mimeType === 'application/msword' ||
           mimeType.includes('officedocument');
  }

  private async extractDocumentMetadata(buffer: Buffer, mimeType: string): Promise<Partial<FileMetadata>> {
    const metadata: Partial<FileMetadata> = {};

    if (mimeType === 'application/pdf') {
      // Extract PDF metadata
      try {
        // This would require a PDF parsing library
        metadata.pages = 1; // Placeholder
      } catch (error) {
        console.warn('Failed to extract PDF metadata:', error);
      }
    }

    return metadata;
  }

  private parseVolumeSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) {
      return 1024 * 1024 * 1024; // Default 1GB
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return value * (units[unit] || 1);
  }

  private async getDirectorySize(dirPath: string): Promise<{ size: number; files: number }> {
    let totalSize = 0;
    let fileCount = 0;

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          const subDirStats = await this.getDirectorySize(filePath);
          totalSize += subDirStats.size;
          fileCount += subDirStats.files;
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }

    return { size: totalSize, files: fileCount };
  }

  private async getAllPhysicalFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const addFiles = async (dir: string) => {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            await addFiles(itemPath);
          } else {
            files.push(itemPath);
          }
        }
      } catch (error) {
        console.warn(`Failed to read directory ${dir}:`, error);
      }
    };

    await addFiles(this.uploadDir);
    return files;
  }

  // Database operations (placeholder implementations)
  private async saveFileRecord(file: FileUpload): Promise<void> {
    console.log('Saving file record:', file.id);
  }

  private async updateFileRecord(file: FileUpload): Promise<void> {
    console.log('Updating file record:', file.id);
  }

  private async findFileById(id: string): Promise<FileUpload | null> {
    console.log('Finding file by ID:', id);
    return null;
  }

  private async findFileByHash(hash: string): Promise<FileUpload | null> {
    console.log('Finding file by hash:', hash);
    return null;
  }

  private async deleteFileRecord(id: string): Promise<void> {
    console.log('Deleting file record:', id);
  }

  private async getAllFileRecords(): Promise<FileUpload[]> {
    console.log('Getting all file records');
    return [];
  }
}

export default FileStorageManager;