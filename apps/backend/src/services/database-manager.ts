/**
 * Database Manager Service
 * Handles database operations, migrations, and seeding for Railway deployment
 */

import knex, { Knex } from 'knex';
import { promises as fs } from 'fs';
import path from 'path';
import railwayConfig from '../config/railway';

export interface Migration {
  id: string;
  name: string;
  filename: string;
  timestamp: Date;
  applied: boolean;
  checksum?: string;
  execution_time?: number;
}

export interface SeedFile {
  name: string;
  filename: string;
  environment: string[];
  dependencies?: string[];
  priority: number;
}

export interface DatabaseBackup {
  id: string;
  name: string;
  timestamp: Date;
  size: number;
  type: 'manual' | 'automatic' | 'pre_migration';
  metadata: Record<string, any>;
  status: 'creating' | 'completed' | 'failed';
}

export interface DatabaseStats {
  tables: TableInfo[];
  totalSize: string;
  totalRows: number;
  indexes: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface TableInfo {
  name: string;
  rows: number;
  size: string;
  indexes: number;
  lastModified: Date;
}

class DatabaseManager {
  private knex: Knex;
  private migrationsDir: string;
  private seedsDir: string;
  private backupsDir: string;
  private config: ReturnType<typeof railwayConfig.getConfig>;

  constructor() {
    this.config = railwayConfig.getConfig();
    this.knex = knex(railwayConfig.getDatabaseConfig());
    this.migrationsDir = path.join(process.cwd(), 'database/migrations');
    this.seedsDir = path.join(process.cwd(), 'database/seeds');
    this.backupsDir = path.join(process.cwd(), 'database/backups');
    
    this.ensureDirectories();
    this.createMigrationTable();
  }

  // Connection Management
  async testConnection(): Promise<boolean> {
    try {
      await this.knex.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async getConnectionInfo(): Promise<any> {
    try {
      const result = await this.knex.raw(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = ?
      `, [this.config.database.database]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return { total_connections: 0, active_connections: 0, idle_connections: 0 };
    }
  }

  // Migration Management
  async getMigrations(): Promise<Migration[]> {
    try {
      // Get applied migrations from database
      const appliedMigrations = await this.knex('migrations')
        .select('*')
        .orderBy('timestamp', 'asc');

      // Get migration files from filesystem
      const migrationFiles = await this.getMigrationFiles();
      
      const migrations: Migration[] = [];
      
      // Process applied migrations
      for (const applied of appliedMigrations) {
        migrations.push({
          id: applied.id,
          name: applied.name,
          filename: applied.filename,
          timestamp: applied.timestamp,
          applied: true,
          checksum: applied.checksum,
          execution_time: applied.execution_time,
        });
      }
      
      // Process pending migrations
      const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));
      
      for (const file of migrationFiles) {
        if (!appliedFilenames.has(file.filename)) {
          migrations.push({
            id: this.generateMigrationId(file.filename),
            name: this.extractMigrationName(file.filename),
            filename: file.filename,
            timestamp: file.timestamp,
            applied: false,
          });
        }
      }
      
      return migrations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      throw new Error(`Failed to get migrations: ${error.message}`);
    }
  }

  async runMigrations(targetMigration?: string): Promise<Migration[]> {
    try {
      const migrations = await this.getMigrations();
      const pendingMigrations = migrations.filter(m => !m.applied);
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return [];
      }

      const migrationsToRun = targetMigration 
        ? pendingMigrations.filter(m => m.id <= targetMigration)
        : pendingMigrations;

      const appliedMigrations: Migration[] = [];

      for (const migration of migrationsToRun) {
        console.log(`Running migration: ${migration.name}`);
        const startTime = Date.now();
        
        try {
          // Create backup before migration (in production)
          if (this.config.environment === 'production') {
            await this.createBackup(`pre_migration_${migration.id}`, 'pre_migration');
          }

          // Load and execute migration
          const migrationPath = path.join(this.migrationsDir, migration.filename);
          const migrationModule = require(migrationPath);
          
          await this.knex.transaction(async (trx) => {
            if (typeof migrationModule.up === 'function') {
              await migrationModule.up(trx);
            } else if (typeof migrationModule.default?.up === 'function') {
              await migrationModule.default.up(trx);
            } else {
              throw new Error('Migration file must export an "up" function');
            }
          });

          const executionTime = Date.now() - startTime;
          const fileContent = await fs.readFile(migrationPath, 'utf8');
          const checksum = this.calculateChecksum(fileContent);

          // Record migration in database
          await this.knex('migrations').insert({
            id: migration.id,
            name: migration.name,
            filename: migration.filename,
            timestamp: migration.timestamp,
            checksum,
            execution_time: executionTime,
            applied_at: new Date(),
          });

          migration.applied = true;
          migration.checksum = checksum;
          migration.execution_time = executionTime;
          
          appliedMigrations.push(migration);
          console.log(`Migration ${migration.name} completed in ${executionTime}ms`);
        } catch (error) {
          console.error(`Migration ${migration.name} failed:`, error);
          throw new Error(`Migration failed: ${migration.name} - ${error.message}`);
        }
      }

      return appliedMigrations;
    } catch (error) {
      throw new Error(`Failed to run migrations: ${error.message}`);
    }
  }

  async rollbackMigration(migrationId?: string): Promise<Migration | null> {
    try {
      const appliedMigrations = await this.knex('migrations')
        .select('*')
        .orderBy('timestamp', 'desc');

      if (appliedMigrations.length === 0) {
        console.log('No migrations to rollback');
        return null;
      }

      const migrationToRollback = migrationId
        ? appliedMigrations.find(m => m.id === migrationId)
        : appliedMigrations[0];

      if (!migrationToRollback) {
        throw new Error(`Migration ${migrationId} not found`);
      }

      console.log(`Rolling back migration: ${migrationToRollback.name}`);

      // Create backup before rollback
      if (this.config.environment === 'production') {
        await this.createBackup(`pre_rollback_${migrationToRollback.id}`, 'pre_migration');
      }

      // Load and execute rollback
      const migrationPath = path.join(this.migrationsDir, migrationToRollback.filename);
      const migrationModule = require(migrationPath);

      await this.knex.transaction(async (trx) => {
        if (typeof migrationModule.down === 'function') {
          await migrationModule.down(trx);
        } else if (typeof migrationModule.default?.down === 'function') {
          await migrationModule.default.down(trx);
        } else {
          throw new Error('Migration file must export a "down" function for rollback');
        }
      });

      // Remove migration record
      await this.knex('migrations')
        .where('id', migrationToRollback.id)
        .del();

      console.log(`Migration ${migrationToRollback.name} rolled back successfully`);
      
      return {
        id: migrationToRollback.id,
        name: migrationToRollback.name,
        filename: migrationToRollback.filename,
        timestamp: migrationToRollback.timestamp,
        applied: false,
      };
    } catch (error) {
      throw new Error(`Failed to rollback migration: ${error.message}`);
    }
  }

  // Seed Management
  async getSeeds(): Promise<SeedFile[]> {
    try {
      const seedFiles = await fs.readdir(this.seedsDir);
      const seeds: SeedFile[] = [];

      for (const filename of seedFiles) {
        if (!filename.endsWith('.js') && !filename.endsWith('.ts')) continue;

        const seedPath = path.join(this.seedsDir, filename);
        const seedModule = require(seedPath);
        
        const seed: SeedFile = {
          name: filename.replace(/\.(js|ts)$/, ''),
          filename,
          environment: seedModule.environment || ['development'],
          dependencies: seedModule.dependencies || [],
          priority: seedModule.priority || 0,
        };

        seeds.push(seed);
      }

      // Sort by priority
      return seeds.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to get seeds: ${error.message}`);
    }
  }

  async runSeeds(environment?: string): Promise<void> {
    try {
      const targetEnvironment = environment || this.config.environment;
      const seeds = await this.getSeeds();
      
      const applicableSeeds = seeds.filter(seed => 
        seed.environment.includes(targetEnvironment) || seed.environment.includes('all')
      );

      if (applicableSeeds.length === 0) {
        console.log(`No seeds found for environment: ${targetEnvironment}`);
        return;
      }

      console.log(`Running ${applicableSeeds.length} seeds for environment: ${targetEnvironment}`);

      for (const seed of applicableSeeds) {
        console.log(`Running seed: ${seed.name}`);
        
        const seedPath = path.join(this.seedsDir, seed.filename);
        const seedModule = require(seedPath);
        
        if (typeof seedModule.seed === 'function') {
          await seedModule.seed(this.knex);
        } else if (typeof seedModule.default === 'function') {
          await seedModule.default(this.knex);
        } else {
          throw new Error(`Seed file ${seed.filename} must export a "seed" function`);
        }
        
        console.log(`Seed ${seed.name} completed`);
      }
    } catch (error) {
      throw new Error(`Failed to run seeds: ${error.message}`);
    }
  }

  // Backup Management
  async createBackup(name: string, type: DatabaseBackup['type'] = 'manual'): Promise<string> {
    try {
      const timestamp = new Date();
      const backupId = `${name}_${timestamp.toISOString().replace(/[:.]/g, '-')}`;
      const backupFile = path.join(this.backupsDir, `${backupId}.sql`);

      console.log(`Creating backup: ${backupId}`);

      // Create backup using pg_dump
      const { spawn } = require('child_process');
      const pgDump = spawn('pg_dump', [
        this.config.database.url,
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--verbose',
        '--file', backupFile
      ]);

      return new Promise((resolve, reject) => {
        pgDump.on('close', async (code) => {
          if (code === 0) {
            try {
              const stats = await fs.stat(backupFile);
              
              // Record backup in database
              await this.knex('database_backups').insert({
                id: backupId,
                name,
                timestamp,
                size: stats.size,
                type,
                metadata: {
                  database: this.config.database.database,
                  host: this.config.database.host,
                  version: await this.getDatabaseVersion(),
                },
                status: 'completed',
                file_path: backupFile,
              });

              console.log(`Backup completed: ${backupId} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
              resolve(backupId);
            } catch (error) {
              reject(new Error(`Failed to record backup: ${error.message}`));
            }
          } else {
            reject(new Error(`pg_dump failed with code: ${code}`));
          }
        });

        pgDump.on('error', (error) => {
          reject(new Error(`pg_dump error: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.knex('database_backups')
        .where('id', backupId)
        .first();

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const backupFile = backup.file_path;
      
      // Check if backup file exists
      try {
        await fs.access(backupFile);
      } catch (error) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }

      console.log(`Restoring backup: ${backupId}`);

      // Create pre-restore backup
      await this.createBackup(`pre_restore_${Date.now()}`, 'automatic');

      // Restore using psql
      const { spawn } = require('child_process');
      const psql = spawn('psql', [
        this.config.database.url,
        '--file', backupFile,
        '--single-transaction',
        '--set', 'ON_ERROR_STOP=1'
      ]);

      return new Promise((resolve, reject) => {
        psql.on('close', (code) => {
          if (code === 0) {
            console.log(`Backup restored successfully: ${backupId}`);
            resolve();
          } else {
            reject(new Error(`psql failed with code: ${code}`));
          }
        });

        psql.on('error', (error) => {
          reject(new Error(`psql error: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  async listBackups(): Promise<DatabaseBackup[]> {
    try {
      return await this.knex('database_backups')
        .select('*')
        .orderBy('timestamp', 'desc');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.knex('database_backups')
        .where('id', backupId)
        .first();

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Delete file
      try {
        await fs.unlink(backup.file_path);
      } catch (error) {
        console.warn(`Failed to delete backup file: ${error.message}`);
      }

      // Remove from database
      await this.knex('database_backups')
        .where('id', backupId)
        .del();

      console.log(`Backup deleted: ${backupId}`);
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  // Database Statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get table information
      const tablesResult = await this.knex.raw(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as total_operations,
          n_live_tup as rows,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_stat_user_tables 
        ORDER BY size_bytes DESC
      `);

      // Get index information
      const indexesResult = await this.knex.raw(`
        SELECT COUNT(*) as total_indexes
        FROM pg_indexes 
        WHERE schemaname = 'public'
      `);

      // Get database size
      const sizeResult = await this.knex.raw(`
        SELECT pg_size_pretty(pg_database_size(?)) as total_size
      `, [this.config.database.database]);

      // Get connection info
      const connectionInfo = await this.getConnectionInfo();

      const tables: TableInfo[] = tablesResult.rows.map((row: any) => ({
        name: row.tablename,
        rows: parseInt(row.rows, 10),
        size: row.size,
        indexes: 0, // Would need additional query to get per-table index count
        lastModified: new Date(), // Would need to track this separately
      }));

      const totalRows = tables.reduce((sum, table) => sum + table.rows, 0);

      return {
        tables,
        totalSize: sizeResult.rows[0].total_size,
        totalRows,
        indexes: parseInt(indexesResult.rows[0].total_indexes, 10),
        connections: {
          active: parseInt(connectionInfo.active_connections, 10),
          idle: parseInt(connectionInfo.idle_connections, 10),
          total: parseInt(connectionInfo.total_connections, 10),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }

  // Utility Methods
  private async ensureDirectories(): Promise<void> {
    const dirs = [this.migrationsDir, this.seedsDir, this.backupsDir];
    
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  private async createMigrationTable(): Promise<void> {
    try {
      const hasTable = await this.knex.schema.hasTable('migrations');
      
      if (!hasTable) {
        await this.knex.schema.createTable('migrations', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.string('filename').notNullable();
          table.timestamp('timestamp').notNullable();
          table.string('checksum');
          table.integer('execution_time');
          table.timestamp('applied_at').defaultTo(this.knex.fn.now());
        });
      }

      const hasBackupTable = await this.knex.schema.hasTable('database_backups');
      
      if (!hasBackupTable) {
        await this.knex.schema.createTable('database_backups', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.timestamp('timestamp').notNullable();
          table.bigInteger('size').notNullable();
          table.enum('type', ['manual', 'automatic', 'pre_migration']).notNullable();
          table.json('metadata');
          table.enum('status', ['creating', 'completed', 'failed']).defaultTo('completed');
          table.string('file_path');
          table.timestamp('created_at').defaultTo(this.knex.fn.now());
        });
      }
    } catch (error) {
      console.error('Failed to create migration tables:', error);
    }
  }

  private async getMigrationFiles(): Promise<{ filename: string; timestamp: Date }[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrations = [];

      for (const filename of files) {
        if (filename.endsWith('.js') || filename.endsWith('.ts')) {
          const stat = await fs.stat(path.join(this.migrationsDir, filename));
          migrations.push({
            filename,
            timestamp: stat.mtime,
          });
        }
      }

      return migrations;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private generateMigrationId(filename: string): string {
    // Extract timestamp from filename or generate one
    const timestampMatch = filename.match(/^(\d{14})/);
    if (timestampMatch) {
      return timestampMatch[1];
    }
    
    return Date.now().toString();
  }

  private extractMigrationName(filename: string): string {
    return filename
      .replace(/^\d{14}_/, '') // Remove timestamp prefix
      .replace(/\.(js|ts)$/, '') // Remove extension
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.knex.raw('SELECT version()');
      return result.rows[0].version;
    } catch (error) {
      return 'unknown';
    }
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.knex.destroy();
  }
}

export default DatabaseManager;