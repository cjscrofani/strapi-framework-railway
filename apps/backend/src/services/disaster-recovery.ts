/**
 * Disaster Recovery Service
 * Comprehensive backup, restore, and disaster recovery system for Railway deployment
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';
import railwayConfig from '../config/railway';
import DatabaseManager from './database-manager';
import FileStorageManager from './file-storage-manager';
import logger from './logger';

export interface BackupManifest {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'emergency';
  timestamp: Date;
  size: number;
  components: BackupComponent[];
  metadata: BackupMetadata;
  status: 'creating' | 'completed' | 'failed' | 'verifying' | 'verified';
  verification: BackupVerification;
  retention: RetentionPolicy;
}

export interface BackupComponent {
  type: 'database' | 'files' | 'config' | 'logs';
  path: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

export interface BackupMetadata {
  version: string;
  environment: string;
  railwayProjectId: string;
  railwayServiceId: string;
  railwayEnvironmentId: string;
  databaseVersion: string;
  nodeVersion: string;
  applicationVersion: string;
  createdBy: string;
  trigger: 'manual' | 'scheduled' | 'pre_deployment' | 'disaster';
}

export interface BackupVerification {
  verified: boolean;
  verificationDate?: Date;
  checksumValid: boolean;
  restoreTestPassed?: boolean;
  issues: string[];
}

export interface RetentionPolicy {
  keepDaily: number; // days
  keepWeekly: number; // weeks  
  keepMonthly: number; // months
  keepYearly: number; // years
  autoDelete: boolean;
}

export interface RestoreOptions {
  targetEnvironment: 'staging' | 'production';
  components: ('database' | 'files' | 'config' | 'logs')[];
  pointInTime?: Date;
  verifyBeforeRestore: boolean;
  createBackupBeforeRestore: boolean;
  restoreMode: 'replace' | 'merge';
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  scenarios: DisasterScenario[];
  contacts: EmergencyContact[];
  procedures: RecoveryProcedure[];
  testingSchedule: TestingSchedule;
  lastTested: Date;
  approved: boolean;
}

export interface DisasterScenario {
  type: 'database_corruption' | 'data_center_outage' | 'security_breach' | 'application_failure' | 'human_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedDowntime: string;
  recoveryProcedure: string;
  rpoTarget: number; // Recovery Point Objective in minutes
  rtoTarget: number; // Recovery Time Objective in minutes
}

export interface EmergencyContact {
  role: string;
  name: string;
  email: string;
  phone: string;
  primary: boolean;
}

export interface RecoveryProcedure {
  step: number;
  description: string;
  commands: string[];
  estimatedTime: string;
  dependencies: string[];
  verification: string;
}

export interface TestingSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextTest: Date;
  lastTest?: Date;
  testTypes: ('backup' | 'restore' | 'failover' | 'communication')[];
}

class DisasterRecoveryService {
  private config: ReturnType<typeof railwayConfig.getConfig>;
  private backupDir: string;
  private manifestDir: string;
  private databaseManager: DatabaseManager;
  private fileStorageManager: FileStorageManager;
  private encryptionKey: string;

  constructor(databaseManager: DatabaseManager, fileStorageManager: FileStorageManager) {
    this.config = railwayConfig.getConfig();
    this.databaseManager = databaseManager;
    this.fileStorageManager = fileStorageManager;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.manifestDir = path.join(this.backupDir, 'manifests');
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.ensureDirectories();
  }

  // Backup Operations
  async createFullBackup(name?: string, metadata: Partial<BackupMetadata> = {}): Promise<string> {
    const backupId = this.generateBackupId();
    const backupName = name || `full_backup_${new Date().toISOString().split('T')[0]}`;
    
    logger.info(`Starting full backup: ${backupName}`, { backupId, operationType: 'backup_start' });

    const manifest: BackupManifest = {
      id: backupId,
      name: backupName,
      type: 'full',
      timestamp: new Date(),
      size: 0,
      components: [],
      metadata: {
        version: '1.0.0',
        environment: this.config.environment,
        railwayProjectId: this.config.railway.projectId,
        railwayServiceId: this.config.railway.serviceId,
        railwayEnvironmentId: this.config.railway.environmentId,
        databaseVersion: await this.getDatabaseVersion(),
        nodeVersion: process.version,
        applicationVersion: process.env.npm_package_version || '1.0.0',
        createdBy: metadata.createdBy || 'system',
        trigger: metadata.trigger || 'manual',
        ...metadata,
      },
      status: 'creating',
      verification: {
        verified: false,
        checksumValid: false,
        issues: [],
      },
      retention: this.getDefaultRetentionPolicy(),
    };

    try {
      // Create backup directory
      const backupPath = path.join(this.backupDir, backupId);
      await fs.mkdir(backupPath, { recursive: true });

      // Backup database
      const dbComponent = await this.backupDatabase(backupId, backupPath);
      manifest.components.push(dbComponent);

      // Backup files
      const filesComponent = await this.backupFiles(backupId, backupPath);
      manifest.components.push(filesComponent);

      // Backup configuration
      const configComponent = await this.backupConfiguration(backupId, backupPath);
      manifest.components.push(configComponent);

      // Backup logs
      const logsComponent = await this.backupLogs(backupId, backupPath);
      manifest.components.push(logsComponent);

      // Calculate total size
      manifest.size = manifest.components.reduce((total, comp) => total + comp.size, 0);
      manifest.status = 'completed';

      // Save manifest
      await this.saveBackupManifest(manifest);

      // Verify backup
      await this.verifyBackup(backupId);

      logger.info(`Full backup completed: ${backupName}`, {
        backupId,
        size: manifest.size,
        components: manifest.components.length,
        operationType: 'backup_complete',
      });

      return backupId;
    } catch (error) {
      manifest.status = 'failed';
      await this.saveBackupManifest(manifest);
      
      logger.error(`Full backup failed: ${backupName}`, error as Error, {
        backupId,
        operationType: 'backup_failed',
      });
      
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async createIncrementalBackup(lastBackupId: string, name?: string): Promise<string> {
    const backupId = this.generateBackupId();
    const backupName = name || `incremental_backup_${new Date().toISOString().split('T')[0]}`;
    
    logger.info(`Starting incremental backup: ${backupName}`, { 
      backupId, 
      lastBackupId, 
      operationType: 'backup_incremental_start' 
    });

    try {
      const lastManifest = await this.getBackupManifest(lastBackupId);
      if (!lastManifest) {
        throw new Error(`Last backup ${lastBackupId} not found`);
      }

      const manifest: BackupManifest = {
        id: backupId,
        name: backupName,
        type: 'incremental',
        timestamp: new Date(),
        size: 0,
        components: [],
        metadata: {
          ...lastManifest.metadata,
          createdBy: 'system',
          trigger: 'scheduled',
        },
        status: 'creating',
        verification: {
          verified: false,
          checksumValid: false,
          issues: [],
        },
        retention: this.getDefaultRetentionPolicy(),
      };

      const backupPath = path.join(this.backupDir, backupId);
      await fs.mkdir(backupPath, { recursive: true });

      // Only backup changed files and recent database changes
      const filesComponent = await this.backupIncrementalFiles(backupId, backupPath, lastManifest.timestamp);
      if (filesComponent) {
        manifest.components.push(filesComponent);
      }

      // Backup database changes since last backup
      const dbComponent = await this.backupIncrementalDatabase(backupId, backupPath, lastManifest.timestamp);
      if (dbComponent) {
        manifest.components.push(dbComponent);
      }

      manifest.size = manifest.components.reduce((total, comp) => total + comp.size, 0);
      manifest.status = 'completed';

      await this.saveBackupManifest(manifest);
      await this.verifyBackup(backupId);

      logger.info(`Incremental backup completed: ${backupName}`, {
        backupId,
        size: manifest.size,
        components: manifest.components.length,
        operationType: 'backup_incremental_complete',
      });

      return backupId;
    } catch (error) {
      logger.error(`Incremental backup failed: ${backupName}`, error as Error, {
        backupId,
        operationType: 'backup_incremental_failed',
      });
      
      throw new Error(`Incremental backup failed: ${error.message}`);
    }
  }

  async createEmergencyBackup(reason: string): Promise<string> {
    const backupId = this.generateBackupId();
    const backupName = `emergency_backup_${Date.now()}`;
    
    logger.warn(`Creating emergency backup: ${reason}`, { 
      backupId, 
      reason, 
      operationType: 'backup_emergency_start' 
    });

    return this.createFullBackup(backupName, {
      trigger: 'disaster',
      createdBy: 'emergency_system',
    });
  }

  // Restore Operations
  async restoreBackup(backupId: string, options: RestoreOptions): Promise<boolean> {
    logger.info(`Starting backup restore: ${backupId}`, {
      backupId,
      targetEnvironment: options.targetEnvironment,
      components: options.components,
      operationType: 'restore_start',
    });

    try {
      const manifest = await this.getBackupManifest(backupId);
      if (!manifest) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Verify backup before restore
      if (options.verifyBeforeRestore) {
        const verificationResult = await this.verifyBackup(backupId);
        if (!verificationResult) {
          throw new Error('Backup verification failed');
        }
      }

      // Create backup before restore if requested
      if (options.createBackupBeforeRestore) {
        await this.createFullBackup(`pre_restore_${Date.now()}`, {
          trigger: 'manual',
          createdBy: 'restore_system',
        });
      }

      const backupPath = path.join(this.backupDir, backupId);

      // Restore components in order
      for (const componentType of options.components) {
        const component = manifest.components.find(c => c.type === componentType);
        if (!component) {
          logger.warn(`Component ${componentType} not found in backup`, { backupId, componentType });
          continue;
        }

        switch (componentType) {
          case 'database':
            await this.restoreDatabase(backupPath, component, options);
            break;
          case 'files':
            await this.restoreFiles(backupPath, component, options);
            break;
          case 'config':
            await this.restoreConfiguration(backupPath, component, options);
            break;
          case 'logs':
            await this.restoreLogs(backupPath, component, options);
            break;
        }
      }

      logger.info(`Backup restore completed: ${backupId}`, {
        backupId,
        targetEnvironment: options.targetEnvironment,
        components: options.components,
        operationType: 'restore_complete',
      });

      return true;
    } catch (error) {
      logger.error(`Backup restore failed: ${backupId}`, error as Error, {
        backupId,
        operationType: 'restore_failed',
      });
      
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  // Backup Component Methods
  private async backupDatabase(backupId: string, backupPath: string): Promise<BackupComponent> {
    const dbBackupPath = path.join(backupPath, 'database.sql');
    const dbBackupId = await this.databaseManager.createBackup(`backup_${backupId}`, 'manual');
    
    // Move the created backup to our backup directory
    const sourceBackup = await this.findDatabaseBackupFile(dbBackupId);
    await fs.copyFile(sourceBackup, dbBackupPath);
    
    const stats = await fs.stat(dbBackupPath);
    const checksum = await this.calculateFileChecksum(dbBackupPath);

    // Encrypt if configured
    let finalPath = dbBackupPath;
    if (process.env.BACKUP_ENCRYPT === 'true') {
      finalPath = `${dbBackupPath}.enc`;
      await this.encryptFile(dbBackupPath, finalPath);
      await fs.unlink(dbBackupPath);
    }

    return {
      type: 'database',
      path: finalPath,
      size: stats.size,
      checksum,
      encrypted: process.env.BACKUP_ENCRYPT === 'true',
      compressed: false,
    };
  }

  private async backupFiles(backupId: string, backupPath: string): Promise<BackupComponent> {
    const filesBackupPath = path.join(backupPath, 'files.tar.gz');
    
    // Create compressed archive of uploads directory
    await this.createArchive(
      this.config.storage.local?.uploadDir || './public/uploads',
      filesBackupPath
    );

    const stats = await fs.stat(filesBackupPath);
    const checksum = await this.calculateFileChecksum(filesBackupPath);

    return {
      type: 'files',
      path: filesBackupPath,
      size: stats.size,
      checksum,
      encrypted: false,
      compressed: true,
    };
  }

  private async backupConfiguration(backupId: string, backupPath: string): Promise<BackupComponent> {
    const configBackupPath = path.join(backupPath, 'config.json');
    
    const configData = {
      environment: this.config.environment,
      database: {
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        // Don't backup credentials
      },
      storage: this.config.storage,
      monitoring: this.config.monitoring,
      logging: this.config.logging,
      railway: this.config.railway,
    };

    await fs.writeFile(configBackupPath, JSON.stringify(configData, null, 2));

    const stats = await fs.stat(configBackupPath);
    const checksum = await this.calculateFileChecksum(configBackupPath);

    return {
      type: 'config',
      path: configBackupPath,
      size: stats.size,
      checksum,
      encrypted: false,
      compressed: false,
    };
  }

  private async backupLogs(backupId: string, backupPath: string): Promise<BackupComponent> {
    const logsBackupPath = path.join(backupPath, 'logs.tar.gz');
    const logsDir = path.join(process.cwd(), 'logs');
    
    try {
      await fs.access(logsDir);
      await this.createArchive(logsDir, logsBackupPath);
    } catch (error) {
      // Create empty archive if logs directory doesn't exist
      await this.createEmptyArchive(logsBackupPath);
    }

    const stats = await fs.stat(logsBackupPath);
    const checksum = await this.calculateFileChecksum(logsBackupPath);

    return {
      type: 'logs',
      path: logsBackupPath,
      size: stats.size,
      checksum,
      encrypted: false,
      compressed: true,
    };
  }

  // Incremental Backup Methods
  private async backupIncrementalFiles(backupId: string, backupPath: string, since: Date): Promise<BackupComponent | null> {
    const filesBackupPath = path.join(backupPath, 'files_incremental.tar.gz');
    const changedFiles = await this.findChangedFiles(since);
    
    if (changedFiles.length === 0) {
      return null;
    }

    await this.createIncrementalArchive(changedFiles, filesBackupPath);

    const stats = await fs.stat(filesBackupPath);
    const checksum = await this.calculateFileChecksum(filesBackupPath);

    return {
      type: 'files',
      path: filesBackupPath,
      size: stats.size,
      checksum,
      encrypted: false,
      compressed: true,
    };
  }

  private async backupIncrementalDatabase(backupId: string, backupPath: string, since: Date): Promise<BackupComponent | null> {
    // This would implement incremental database backup
    // For PostgreSQL, this could use WAL files or logical replication
    // For now, creating a full backup as incremental database backup is complex
    return this.backupDatabase(backupId, backupPath);
  }

  // Restore Component Methods
  private async restoreDatabase(backupPath: string, component: BackupComponent, options: RestoreOptions): Promise<void> {
    logger.info('Restoring database from backup', { component: component.path });
    
    let dbFilePath = component.path;
    
    // Decrypt if necessary
    if (component.encrypted) {
      const decryptedPath = `${component.path}.decrypted`;
      await this.decryptFile(component.path, decryptedPath);
      dbFilePath = decryptedPath;
    }

    // Use database manager to restore
    await this.databaseManager.restoreBackup(path.basename(dbFilePath));
  }

  private async restoreFiles(backupPath: string, component: BackupComponent, options: RestoreOptions): Promise<void> {
    logger.info('Restoring files from backup', { component: component.path });
    
    const targetDir = this.config.storage.local?.uploadDir || './public/uploads';
    
    if (options.restoreMode === 'replace') {
      // Clear existing files
      await fs.rmdir(targetDir, { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
    }

    // Extract archive
    await this.extractArchive(component.path, targetDir);
  }

  private async restoreConfiguration(backupPath: string, component: BackupComponent, options: RestoreOptions): Promise<void> {
    logger.info('Restoring configuration from backup', { component: component.path });
    
    const configData = JSON.parse(await fs.readFile(component.path, 'utf8'));
    
    // This would restore configuration settings
    // Implementation depends on how configuration is managed
    logger.warn('Configuration restore not fully implemented');
  }

  private async restoreLogs(backupPath: string, component: BackupComponent, options: RestoreOptions): Promise<void> {
    logger.info('Restoring logs from backup', { component: component.path });
    
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (options.restoreMode === 'replace') {
      await fs.rmdir(logsDir, { recursive: true });
    }
    
    await fs.mkdir(logsDir, { recursive: true });
    await this.extractArchive(component.path, logsDir);
  }

  // Verification Methods
  async verifyBackup(backupId: string): Promise<boolean> {
    logger.info(`Verifying backup: ${backupId}`, { backupId, operationType: 'backup_verify_start' });

    try {
      const manifest = await this.getBackupManifest(backupId);
      if (!manifest) {
        throw new Error('Backup manifest not found');
      }

      manifest.status = 'verifying';
      await this.saveBackupManifest(manifest);

      let allValid = true;
      const issues: string[] = [];

      // Verify each component
      for (const component of manifest.components) {
        try {
          // Check file exists
          await fs.access(component.path);

          // Verify checksum
          const currentChecksum = await this.calculateFileChecksum(component.path);
          if (currentChecksum !== component.checksum) {
            issues.push(`Checksum mismatch for ${component.type}: expected ${component.checksum}, got ${currentChecksum}`);
            allValid = false;
          }

          // Additional verification for database backups
          if (component.type === 'database') {
            const isValid = await this.verifyDatabaseBackup(component.path);
            if (!isValid) {
              issues.push(`Database backup validation failed for ${component.path}`);
              allValid = false;
            }
          }
        } catch (error) {
          issues.push(`Failed to verify ${component.type}: ${error.message}`);
          allValid = false;
        }
      }

      manifest.verification = {
        verified: allValid,
        verificationDate: new Date(),
        checksumValid: allValid,
        issues,
      };

      manifest.status = allValid ? 'verified' : 'failed';
      await this.saveBackupManifest(manifest);

      logger.info(`Backup verification ${allValid ? 'passed' : 'failed'}: ${backupId}`, {
        backupId,
        verified: allValid,
        issues: issues.length,
        operationType: 'backup_verify_complete',
      });

      return allValid;
    } catch (error) {
      logger.error(`Backup verification error: ${backupId}`, error as Error, {
        backupId,
        operationType: 'backup_verify_failed',
      });
      
      return false;
    }
  }

  // Utility Methods
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
    await fs.mkdir(this.manifestDir, { recursive: true });
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getDefaultRetentionPolicy(): RetentionPolicy {
    return {
      keepDaily: 7,
      keepWeekly: 4,
      keepMonthly: 12,
      keepYearly: 2,
      autoDelete: true,
    };
  }

  private async getDatabaseVersion(): Promise<string> {
    try {
      // This would get the actual database version
      return 'PostgreSQL 15';
    } catch (error) {
      return 'unknown';
    }
  }

  private async saveBackupManifest(manifest: BackupManifest): Promise<void> {
    const manifestPath = path.join(this.manifestDir, `${manifest.id}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  private async getBackupManifest(backupId: string): Promise<BackupManifest | null> {
    try {
      const manifestPath = path.join(this.manifestDir, `${backupId}.json`);
      const data = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(filePath);
    hash.update(data);
    return hash.digest('hex');
  }

  private async createArchive(sourcePath: string, archivePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-czf', archivePath, '-C', path.dirname(sourcePath), path.basename(sourcePath)]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  private async createEmptyArchive(archivePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-czf', archivePath, '--files-from', '/dev/null']);
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  private async extractArchive(archivePath: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xzf', archivePath, '-C', targetPath]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  private async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    const input = await fs.readFile(inputPath);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);
    await fs.writeFile(outputPath, encrypted);
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const data = await fs.readFile(inputPath);
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    await fs.writeFile(outputPath, decrypted);
  }

  private async findDatabaseBackupFile(backupId: string): Promise<string> {
    // This would find the database backup file created by DatabaseManager
    // For now, returning a placeholder path
    return `/tmp/${backupId}.sql`;
  }

  private async findChangedFiles(since: Date): Promise<string[]> {
    // This would find files changed since the given date
    // Implementation would use fs.stat to check modification times
    return [];
  }

  private async createIncrementalArchive(files: string[], archivePath: string): Promise<void> {
    // Create archive with only changed files
    const fileList = files.join('\n');
    const tempListFile = '/tmp/file_list.txt';
    
    await fs.writeFile(tempListFile, fileList);
    
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-czf', archivePath, '--files-from', tempListFile]);
      
      tar.on('close', async (code) => {
        await fs.unlink(tempListFile);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  private async verifyDatabaseBackup(backupPath: string): Promise<boolean> {
    try {
      // This would verify the database backup file
      // For PostgreSQL, we could try to parse the SQL dump
      const data = await fs.readFile(backupPath, 'utf8');
      return data.includes('PostgreSQL') || data.includes('CREATE TABLE');
    } catch (error) {
      return false;
    }
  }

  // Public API Methods
  async listBackups(): Promise<BackupManifest[]> {
    try {
      const manifestFiles = await fs.readdir(this.manifestDir);
      const manifests: BackupManifest[] = [];

      for (const file of manifestFiles) {
        if (file.endsWith('.json')) {
          const backupId = file.replace('.json', '');
          const manifest = await this.getBackupManifest(backupId);
          if (manifest) {
            manifests.push(manifest);
          }
        }
      }

      return manifests.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to list backups', error as Error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const manifest = await this.getBackupManifest(backupId);
      if (!manifest) {
        return false;
      }

      // Delete backup files
      const backupPath = path.join(this.backupDir, backupId);
      await fs.rmdir(backupPath, { recursive: true });

      // Delete manifest
      const manifestPath = path.join(this.manifestDir, `${backupId}.json`);
      await fs.unlink(manifestPath);

      logger.info(`Backup deleted: ${backupId}`, { backupId, operationType: 'backup_delete' });
      return true;
    } catch (error) {
      logger.error(`Failed to delete backup: ${backupId}`, error as Error, { backupId });
      return false;
    }
  }

  async cleanupOldBackups(): Promise<number> {
    const manifests = await this.listBackups();
    const retentionPolicy = this.getDefaultRetentionPolicy();
    let deletedCount = 0;

    const now = new Date();
    const dailyCutoff = new Date(now.getTime() - retentionPolicy.keepDaily * 24 * 60 * 60 * 1000);
    const weeklyCutoff = new Date(now.getTime() - retentionPolicy.keepWeekly * 7 * 24 * 60 * 60 * 1000);
    const monthlyCutoff = new Date(now.getTime() - retentionPolicy.keepMonthly * 30 * 24 * 60 * 60 * 1000);
    const yearlyCutoff = new Date(now.getTime() - retentionPolicy.keepYearly * 365 * 24 * 60 * 60 * 1000);

    for (const manifest of manifests) {
      let shouldDelete = false;

      if (manifest.timestamp < yearlyCutoff) {
        shouldDelete = true;
      } else if (manifest.timestamp < monthlyCutoff && manifest.type === 'incremental') {
        shouldDelete = true;
      } else if (manifest.timestamp < weeklyCutoff && manifest.type === 'incremental') {
        shouldDelete = true;
      } else if (manifest.timestamp < dailyCutoff && manifest.type === 'incremental') {
        shouldDelete = true;
      }

      if (shouldDelete && retentionPolicy.autoDelete) {
        const deleted = await this.deleteBackup(manifest.id);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    logger.info(`Cleaned up ${deletedCount} old backups`, { deletedCount, operationType: 'backup_cleanup' });
    return deletedCount;
  }
}

export default DisasterRecoveryService;