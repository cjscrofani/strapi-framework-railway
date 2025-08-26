/**
 * Railway-Specific Configuration Management
 * Handles Railway's dynamic environment variables and service configuration
 */

import Joi from 'joi';
import { ConnectionString } from 'pg-connection-string';

export interface RailwayConfig {
  environment: 'development' | 'staging' | 'production';
  railway: {
    projectId: string;
    serviceId: string;
    environmentId: string;
    deploymentId: string;
    region: string;
    publicDomain?: string;
    privateDomain?: string;
    replica: boolean;
  };
  database: {
    url: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    connectionPooling: {
      min: number;
      max: number;
      idle: number;
      acquireTimeoutMillis: number;
      createTimeoutMillis: number;
      destroyTimeoutMillis: number;
      reapIntervalMillis: number;
    };
  };
  redis?: {
    url: string;
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    connectTimeout: number;
    lazyConnect: boolean;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
  };
  server: {
    host: string;
    port: number;
    cors: {
      origin: string[] | boolean;
      credentials: boolean;
      methods: string[];
      allowedHeaders: string[];
    };
    rateLimit: {
      windowMs: number;
      max: number;
      skipSuccessfulRequests: boolean;
      skipFailedRequests: boolean;
    };
    security: {
      helmet: boolean;
      contentSecurityPolicy: boolean;
      crossOriginEmbedderPolicy: boolean;
    };
  };
  storage: {
    provider: 'railway-volumes' | 'local' | 's3';
    local?: {
      uploadDir: string;
      maxFileSize: number;
      allowedMimeTypes: string[];
    };
    volumes?: {
      mountPath: string;
      maxSize: string;
    };
  };
  monitoring: {
    healthCheck: {
      enabled: boolean;
      path: string;
      interval: number;
      timeout: number;
    };
    metrics: {
      enabled: boolean;
      path: string;
      collectDefaultMetrics: boolean;
    };
    sentry?: {
      dsn: string;
      environment: string;
      tracesSampleRate: number;
    };
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
    transports: ('console' | 'file' | 'railway')[];
    file?: {
      filename: string;
      maxsize: number;
      maxFiles: number;
    };
  };
}

class RailwayConfigManager {
  private config: RailwayConfig;
  private validationSchema: Joi.ObjectSchema;

  constructor() {
    this.validationSchema = this.createValidationSchema();
    this.config = this.loadAndValidateConfig();
  }

  // Load and validate configuration
  private loadAndValidateConfig(): RailwayConfig {
    const rawConfig = this.loadRawConfig();
    const { error, value } = this.validationSchema.validate(rawConfig, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      throw new Error(`Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    return value as RailwayConfig;
  }

  private loadRawConfig(): any {
    // Parse database URL for Railway PostgreSQL
    const databaseConfig = this.parseDatabaseUrl(
      process.env.DATABASE_URL || 
      process.env.POSTGRES_URL || 
      'postgresql://localhost:5432/strapi'
    );

    // Parse Redis URL if available
    const redisConfig = process.env.REDIS_URL ? this.parseRedisUrl(process.env.REDIS_URL) : undefined;

    // Determine environment
    const environment = this.determineEnvironment();

    // Parse CORS origins
    const corsOrigins = this.parseCorsOrigins(process.env.CORS_ORIGIN);

    return {
      environment,
      railway: {
        projectId: process.env.RAILWAY_PROJECT_ID || 'unknown',
        serviceId: process.env.RAILWAY_SERVICE_ID || 'unknown',
        environmentId: process.env.RAILWAY_ENVIRONMENT_ID || 'unknown',
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
        region: process.env.RAILWAY_REGION || 'us-west1',
        publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
        privateDomain: process.env.RAILWAY_PRIVATE_DOMAIN,
        replica: process.env.RAILWAY_REPLICA === 'true',
      },
      database: {
        ...databaseConfig,
        connectionPooling: {
          min: parseInt(process.env.DB_POOL_MIN || '2', 10),
          max: parseInt(process.env.DB_POOL_MAX || '20', 10),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
          acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
          createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000', 10),
          destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000', 10),
          reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000', 10),
        },
      },
      redis: redisConfig,
      server: {
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT || '1337', 10),
        cors: {
          origin: corsOrigins,
          credentials: process.env.CORS_CREDENTIALS !== 'false',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
          skipSuccessfulRequests: false,
          skipFailedRequests: false,
        },
        security: {
          helmet: process.env.SECURITY_HELMET !== 'false',
          contentSecurityPolicy: process.env.SECURITY_CSP !== 'false',
          crossOriginEmbedderPolicy: false,
        },
      },
      storage: {
        provider: (process.env.STORAGE_PROVIDER as any) || 'railway-volumes',
        local: {
          uploadDir: process.env.UPLOAD_DIR || './public/uploads',
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
          allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf', 'text/plain', 'text/csv',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
        },
        volumes: {
          mountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH || '/app/public/uploads',
          maxSize: process.env.RAILWAY_VOLUME_SIZE || '1GB',
        },
      },
      monitoring: {
        healthCheck: {
          enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
          path: process.env.HEALTH_CHECK_PATH || '/health',
          interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
          timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
        },
        metrics: {
          enabled: process.env.METRICS_ENABLED !== 'false',
          path: process.env.METRICS_PATH || '/metrics',
          collectDefaultMetrics: process.env.METRICS_DEFAULT !== 'false',
        },
        sentry: process.env.SENTRY_DSN ? {
          dsn: process.env.SENTRY_DSN,
          environment: environment,
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        } : undefined,
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || (environment === 'production' ? 'info' : 'debug'),
        format: (process.env.LOG_FORMAT as any) || 'json',
        transports: this.parseLogTransports(process.env.LOG_TRANSPORTS),
        file: process.env.LOG_FILE ? {
          filename: process.env.LOG_FILE,
          maxsize: parseInt(process.env.LOG_FILE_MAX_SIZE || '10485760', 10), // 10MB
          maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10),
        } : undefined,
      },
    };
  }

  private createValidationSchema(): Joi.ObjectSchema {
    return Joi.object({
      environment: Joi.string().valid('development', 'staging', 'production').required(),
      railway: Joi.object({
        projectId: Joi.string().required(),
        serviceId: Joi.string().required(),
        environmentId: Joi.string().required(),
        deploymentId: Joi.string().required(),
        region: Joi.string().required(),
        publicDomain: Joi.string().optional(),
        privateDomain: Joi.string().optional(),
        replica: Joi.boolean().default(false),
      }).required(),
      database: Joi.object({
        url: Joi.string().required(),
        host: Joi.string().required(),
        port: Joi.number().port().required(),
        database: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        ssl: Joi.boolean().required(),
        connectionPooling: Joi.object({
          min: Joi.number().min(1).max(10).default(2),
          max: Joi.number().min(5).max(100).default(20),
          idle: Joi.number().min(1000).default(10000),
          acquireTimeoutMillis: Joi.number().min(1000).default(60000),
          createTimeoutMillis: Joi.number().min(1000).default(30000),
          destroyTimeoutMillis: Joi.number().min(1000).default(5000),
          reapIntervalMillis: Joi.number().min(100).default(1000),
        }).required(),
      }).required(),
      redis: Joi.object({
        url: Joi.string().required(),
        host: Joi.string().required(),
        port: Joi.number().port().required(),
        password: Joi.string().optional(),
        db: Joi.number().min(0).max(15).default(0),
        keyPrefix: Joi.string().default('strapi:'),
        connectTimeout: Joi.number().min(1000).default(10000),
        lazyConnect: Joi.boolean().default(true),
        maxRetriesPerRequest: Joi.number().min(1).default(3),
        retryDelayOnFailover: Joi.number().min(100).default(100),
      }).optional(),
      server: Joi.object({
        host: Joi.string().default('0.0.0.0'),
        port: Joi.number().port().default(1337),
        cors: Joi.object({
          origin: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.boolean()).required(),
          credentials: Joi.boolean().default(true),
          methods: Joi.array().items(Joi.string()).required(),
          allowedHeaders: Joi.array().items(Joi.string()).required(),
        }).required(),
        rateLimit: Joi.object({
          windowMs: Joi.number().min(1000).default(900000),
          max: Joi.number().min(1).default(100),
          skipSuccessfulRequests: Joi.boolean().default(false),
          skipFailedRequests: Joi.boolean().default(false),
        }).required(),
        security: Joi.object({
          helmet: Joi.boolean().default(true),
          contentSecurityPolicy: Joi.boolean().default(true),
          crossOriginEmbedderPolicy: Joi.boolean().default(false),
        }).required(),
      }).required(),
      storage: Joi.object({
        provider: Joi.string().valid('railway-volumes', 'local', 's3').default('railway-volumes'),
        local: Joi.object({
          uploadDir: Joi.string().default('./public/uploads'),
          maxFileSize: Joi.number().min(1024).default(52428800),
          allowedMimeTypes: Joi.array().items(Joi.string()).required(),
        }).optional(),
        volumes: Joi.object({
          mountPath: Joi.string().default('/app/public/uploads'),
          maxSize: Joi.string().default('1GB'),
        }).optional(),
      }).required(),
      monitoring: Joi.object({
        healthCheck: Joi.object({
          enabled: Joi.boolean().default(true),
          path: Joi.string().default('/health'),
          interval: Joi.number().min(1000).default(30000),
          timeout: Joi.number().min(1000).default(5000),
        }).required(),
        metrics: Joi.object({
          enabled: Joi.boolean().default(true),
          path: Joi.string().default('/metrics'),
          collectDefaultMetrics: Joi.boolean().default(true),
        }).required(),
        sentry: Joi.object({
          dsn: Joi.string().required(),
          environment: Joi.string().required(),
          tracesSampleRate: Joi.number().min(0).max(1).default(0.1),
        }).optional(),
      }).required(),
      logging: Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        format: Joi.string().valid('json', 'simple').default('json'),
        transports: Joi.array().items(Joi.string().valid('console', 'file', 'railway')).default(['console']),
        file: Joi.object({
          filename: Joi.string().required(),
          maxsize: Joi.number().min(1024).default(10485760),
          maxFiles: Joi.number().min(1).default(5),
        }).optional(),
      }).required(),
    });
  }

  // Helper methods
  private determineEnvironment(): 'development' | 'staging' | 'production' {
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'staging') return 'staging';
    if (process.env.RAILWAY_ENVIRONMENT_NAME === 'production') return 'production';
    if (process.env.RAILWAY_ENVIRONMENT_NAME === 'staging') return 'staging';
    return 'development';
  }

  private parseDatabaseUrl(url: string): Omit<RailwayConfig['database'], 'connectionPooling'> {
    try {
      const parsed = ConnectionString.parse(url);
      
      return {
        url,
        host: parsed.host || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 5432,
        database: parsed.database || 'strapi',
        username: parsed.user || 'postgres',
        password: parsed.password || '',
        ssl: process.env.NODE_ENV === 'production' || url.includes('ssl=true'),
      };
    } catch (error) {
      throw new Error(`Invalid database URL: ${error.message}`);
    }
  }

  private parseRedisUrl(url: string): RailwayConfig['redis'] {
    try {
      const parsed = new URL(url);
      
      return {
        url,
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        password: parsed.password || undefined,
        db: 0,
        keyPrefix: 'strapi:',
        connectTimeout: 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
      };
    } catch (error) {
      throw new Error(`Invalid Redis URL: ${error.message}`);
    }
  }

  private parseCorsOrigins(origins?: string): string[] | boolean {
    if (!origins) return true;
    if (origins === 'true') return true;
    if (origins === 'false') return false;
    
    return origins.split(',').map(origin => origin.trim());
  }

  private parseLogTransports(transports?: string): ('console' | 'file' | 'railway')[] {
    if (!transports) return ['console'];
    return transports.split(',').map(t => t.trim()) as ('console' | 'file' | 'railway')[];
  }

  // Public API
  getConfig(): RailwayConfig {
    return this.config;
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  isRailwayEnvironment(): boolean {
    return !!process.env.RAILWAY_PROJECT_ID;
  }

  getDatabaseUrl(): string {
    return this.config.database.url;
  }

  getRedisUrl(): string | undefined {
    return this.config.redis?.url;
  }

  getPublicUrl(): string {
    if (this.config.railway.publicDomain) {
      return `https://${this.config.railway.publicDomain}`;
    }
    
    if (this.isRailwayEnvironment()) {
      return `https://${this.config.railway.serviceId}-${this.config.railway.environmentId}.up.railway.app`;
    }
    
    return `http://${this.config.server.host}:${this.config.server.port}`;
  }

  getPrivateUrl(): string {
    if (this.config.railway.privateDomain) {
      return `http://${this.config.railway.privateDomain}`;
    }
    
    return `http://${this.config.server.host}:${this.config.server.port}`;
  }

  // Dynamic configuration updates
  updateConfig(updates: Partial<RailwayConfig>): void {
    const newConfig = { ...this.config, ...updates };
    const { error, value } = this.validationSchema.validate(newConfig);
    
    if (error) {
      throw new Error(`Configuration update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    this.config = value as RailwayConfig;
  }

  // Environment-specific configurations
  getDatabaseConfig() {
    return {
      client: 'postgres',
      connection: {
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        user: this.config.database.username,
        password: this.config.database.password,
        ssl: this.config.database.ssl ? { rejectUnauthorized: false } : false,
      },
      pool: this.config.database.connectionPooling,
      migrations: {
        directory: './database/migrations',
        tableName: 'knex_migrations',
        extension: 'ts',
      },
      seeds: {
        directory: './database/seeds',
      },
      debug: this.isDevelopment(),
      acquireConnectionTimeout: this.config.database.connectionPooling.acquireTimeoutMillis,
    };
  }

  getStrapiDatabaseConfig() {
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: this.config.database.host,
          port: this.config.database.port,
          database: this.config.database.database,
          user: this.config.database.username,
          password: this.config.database.password,
          ssl: this.config.database.ssl ? { rejectUnauthorized: false } : false,
          schema: 'public',
        },
        pool: {
          min: this.config.database.connectionPooling.min,
          max: this.config.database.connectionPooling.max,
          idleTimeoutMillis: this.config.database.connectionPooling.idle,
          acquireTimeoutMillis: this.config.database.connectionPooling.acquireTimeoutMillis,
          createTimeoutMillis: this.config.database.connectionPooling.createTimeoutMillis,
          destroyTimeoutMillis: this.config.database.connectionPooling.destroyTimeoutMillis,
          reapIntervalMillis: this.config.database.connectionPooling.reapIntervalMillis,
        },
        debug: this.isDevelopment(),
      },
    };
  }

  getRedisConfig() {
    if (!this.config.redis) return null;
    
    return {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      keyPrefix: this.config.redis.keyPrefix,
      connectTimeout: this.config.redis.connectTimeout,
      lazyConnect: this.config.redis.lazyConnect,
      maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
      retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
    };
  }

  // Export configuration for different purposes
  exportForDockerCompose(): any {
    return {
      version: '3.8',
      services: {
        app: {
          build: '.',
          ports: [`${this.config.server.port}:${this.config.server.port}`],
          environment: this.exportEnvironmentVariables(),
          volumes: this.config.storage.provider === 'railway-volumes' ? [
            `${this.config.storage.volumes!.mountPath}:${this.config.storage.volumes!.mountPath}`
          ] : undefined,
          depends_on: ['postgres', 'redis'].filter(service => 
            service === 'postgres' || (service === 'redis' && this.config.redis)
          ),
        },
        postgres: {
          image: 'postgres:15',
          environment: {
            POSTGRES_DB: this.config.database.database,
            POSTGRES_USER: this.config.database.username,
            POSTGRES_PASSWORD: this.config.database.password,
          },
          ports: [`${this.config.database.port}:5432`],
          volumes: ['postgres_data:/var/lib/postgresql/data'],
        },
        ...(this.config.redis && {
          redis: {
            image: 'redis:7',
            ports: [`${this.config.redis.port}:6379`],
            volumes: ['redis_data:/data'],
          },
        }),
      },
      volumes: {
        postgres_data: {},
        ...(this.config.redis && { redis_data: {} }),
      },
    };
  }

  exportEnvironmentVariables(): Record<string, string> {
    return {
      NODE_ENV: this.config.environment,
      HOST: this.config.server.host,
      PORT: this.config.server.port.toString(),
      DATABASE_URL: this.config.database.url,
      REDIS_URL: this.config.redis?.url || '',
      CORS_ORIGIN: Array.isArray(this.config.server.cors.origin) 
        ? this.config.server.cors.origin.join(',') 
        : this.config.server.cors.origin.toString(),
      LOG_LEVEL: this.config.logging.level,
      HEALTH_CHECK_ENABLED: this.config.monitoring.healthCheck.enabled.toString(),
      METRICS_ENABLED: this.config.monitoring.metrics.enabled.toString(),
      STORAGE_PROVIDER: this.config.storage.provider,
      RAILWAY_VOLUME_MOUNT_PATH: this.config.storage.volumes?.mountPath || '',
    };
  }
}

// Global instance
const railwayConfig = new RailwayConfigManager();

export default railwayConfig;
export { RailwayConfigManager };