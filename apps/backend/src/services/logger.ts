/**
 * Logger Service
 * Comprehensive logging system with Railway and Sentry integration
 */

import winston, { Logger, LoggerOptions, format } from 'winston';
import * as Sentry from '@sentry/node';
import railwayConfig from '../config/railway';

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: Error;
  [key: string]: any;
}

export interface LogEntry {
  level: string;
  message: string;
  context?: LogContext;
  timestamp: string;
  service: string;
  environment: string;
  version: string;
}

class LoggerService {
  private logger: Logger;
  private config: ReturnType<typeof railwayConfig.getConfig>;
  private requestLogger: Logger;
  private errorLogger: Logger;
  private auditLogger: Logger;

  constructor() {
    this.config = railwayConfig.getConfig();
    this.initializeSentry();
    this.createLoggers();
  }

  private initializeSentry(): void {
    if (this.config.monitoring.sentry?.dsn) {
      Sentry.init({
        dsn: this.config.monitoring.sentry.dsn,
        environment: this.config.monitoring.sentry.environment,
        tracesSampleRate: this.config.monitoring.sentry.tracesSampleRate,
        beforeSend: (event) => {
          // Filter out sensitive information
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Filter sensitive data from breadcrumbs
          if (breadcrumb.data?.password) {
            breadcrumb.data.password = '[FILTERED]';
          }
          return breadcrumb;
        },
      });
    }
  }

  private createLoggers(): void {
    // Main application logger
    this.logger = winston.createLogger(this.getLoggerConfig('app'));
    
    // Request logger for HTTP requests
    this.requestLogger = winston.createLogger(this.getLoggerConfig('request'));
    
    // Error logger for application errors
    this.errorLogger = winston.createLogger(this.getLoggerConfig('error'));
    
    // Audit logger for security and compliance events
    this.auditLogger = winston.createLogger(this.getLoggerConfig('audit'));
  }

  private getLoggerConfig(type: string): LoggerOptions {
    const { logging } = this.config;
    const isDevelopment = this.config.environment === 'development';

    const baseFormat = format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label']
      })
    );

    let logFormat;
    
    if (logging.format === 'json') {
      logFormat = format.combine(
        baseFormat,
        format.label({ label: type }),
        format.json()
      );
    } else {
      logFormat = format.combine(
        baseFormat,
        format.label({ label: type }),
        format.colorize({ all: isDevelopment }),
        format.printf(({ level, message, timestamp, label, metadata }) => {
          const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
          return `${timestamp} [${label}] ${level}: ${message} ${metaStr}`;
        })
      );
    }

    const transports: winston.transport[] = [];

    // Console transport
    if (logging.transports.includes('console')) {
      transports.push(
        new winston.transports.Console({
          level: logging.level,
          format: logFormat,
        })
      );
    }

    // File transport
    if (logging.transports.includes('file') && logging.file) {
      transports.push(
        new winston.transports.File({
          filename: logging.file.filename,
          level: logging.level,
          format: format.combine(
            baseFormat,
            format.label({ label: type }),
            format.json()
          ),
          maxsize: logging.file.maxsize,
          maxFiles: logging.file.maxFiles,
          tailable: true,
        })
      );
    }

    // Railway transport (custom)
    if (logging.transports.includes('railway')) {
      transports.push(new RailwayTransport({
        level: logging.level,
        format: logFormat,
        service: type,
      }));
    }

    return {
      level: logging.level,
      format: logFormat,
      transports,
      exitOnError: false,
      silent: false,
    };
  }

  // Main logging methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.log('error', message, errorContext);
    this.errorLogger.error(message, errorContext);

    // Send to Sentry
    if (error && this.config.monitoring.sentry?.dsn) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        Sentry.captureException(error);
      });
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.error(`FATAL: ${message}`, error, context);
    
    // For fatal errors, ensure they're logged synchronously before exit
    this.logger.on('finish', () => {
      process.exit(1);
    });
    this.logger.end();
  }

  private log(level: string, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      service: 'strapi-railway-framework',
      environment: this.config.environment,
      version: process.env.npm_package_version || '1.0.0',
    };

    this.logger.log(level, message, context);
  }

  // HTTP Request logging
  logRequest(req: any, res: any, responseTime: number): void {
    const context: LogContext = {
      requestId: req.id || req.headers['x-request-id'],
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection?.remoteAddress,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id,
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

    this.requestLogger.log(level, message, context);
  }

  // Security audit logging
  logAuditEvent(event: string, details: Record<string, any>, context?: LogContext): void {
    const auditContext: LogContext = {
      ...context,
      event,
      ...details,
      auditType: 'security',
    };

    this.auditLogger.info(`AUDIT: ${event}`, auditContext);
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, context?: LogContext): void {
    const dbContext: LogContext = {
      ...context,
      operation,
      table,
      duration,
      success,
      operationType: 'database',
    };

    const level = success ? 'debug' : 'warn';
    const message = `DB ${operation.toUpperCase()} ${table} - ${success ? 'SUCCESS' : 'FAILED'} - ${duration}ms`;

    this.logger.log(level, message, dbContext);
  }

  // Email operation logging
  logEmailOperation(operation: string, provider: string, recipient: string, success: boolean, duration: number, context?: LogContext): void {
    const emailContext: LogContext = {
      ...context,
      operation,
      provider,
      recipient: this.maskEmail(recipient),
      success,
      duration,
      operationType: 'email',
    };

    const level = success ? 'info' : 'warn';
    const message = `EMAIL ${operation.toUpperCase()} via ${provider} - ${success ? 'SUCCESS' : 'FAILED'} - ${duration}ms`;

    this.logger.log(level, message, emailContext);
  }

  // Cache operation logging
  logCacheOperation(operation: string, key: string, hit: boolean, duration: number): void {
    const cacheContext: LogContext = {
      operation,
      key: this.maskSensitiveKey(key),
      hit,
      duration,
      operationType: 'cache',
    };

    this.logger.debug(`CACHE ${operation.toUpperCase()} ${key} - ${hit ? 'HIT' : 'MISS'} - ${duration}ms`, cacheContext);
  }

  // Business logic logging
  logBusinessEvent(event: string, details: Record<string, any>, context?: LogContext): void {
    const businessContext: LogContext = {
      ...context,
      event,
      ...details,
      eventType: 'business',
    };

    this.info(`BUSINESS: ${event}`, businessContext);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const perfContext: LogContext = {
      operation,
      duration,
      ...metadata,
      operationType: 'performance',
    };

    const level = duration > 5000 ? 'warn' : 'debug';
    const message = `PERF: ${operation} completed in ${duration}ms`;

    this.logger.log(level, message, perfContext);
  }

  // Error aggregation and reporting
  captureException(error: Error, context?: LogContext): string {
    const errorId = this.generateErrorId();
    
    this.error(`Exception captured: ${error.message}`, error, {
      ...context,
      errorId,
    });

    return errorId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: LogContext): string {
    const messageId = this.generateErrorId();
    
    if (this.config.monitoring.sentry?.dsn) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        scope.setTag('messageId', messageId);
        Sentry.captureMessage(message, level);
      });
    }

    this.log(level === 'warning' ? 'warn' : level, message, {
      ...context,
      messageId,
    });

    return messageId;
  }

  // Utility methods
  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    const maskedUser = user.length > 3 ? `${user.substring(0, 3)}***` : '***';
    return `${maskedUser}@${domain}`;
  }

  private maskSensitiveKey(key: string): string {
    const sensitivePatterns = ['password', 'token', 'secret', 'api_key', 'session'];
    
    for (const pattern of sensitivePatterns) {
      if (key.toLowerCase().includes(pattern)) {
        return `***${pattern}***`;
      }
    }

    return key;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log aggregation and querying
  async getLogs(filters: {
    level?: string;
    service?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    search?: string;
  }): Promise<LogEntry[]> {
    // This would typically query a log storage system
    // For Railway, logs are available through their dashboard
    // This is a placeholder implementation
    return [];
  }

  // Health checks
  isHealthy(): boolean {
    try {
      // Check if loggers are working
      this.logger.debug('Logger health check');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cleanup
  async close(): Promise<void> {
    await Promise.all([
      new Promise<void>((resolve) => this.logger.close(resolve)),
      new Promise<void>((resolve) => this.requestLogger.close(resolve)),
      new Promise<void>((resolve) => this.errorLogger.close(resolve)),
      new Promise<void>((resolve) => this.auditLogger.close(resolve)),
    ]);

    if (this.config.monitoring.sentry?.dsn) {
      await Sentry.close(2000);
    }
  }
}

// Custom Railway Transport
class RailwayTransport extends winston.Transport {
  private service: string;

  constructor(options: winston.TransportStreamOptions & { service: string }) {
    super(options);
    this.service = options.service;
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // In a real implementation, this would send logs to Railway's logging service
    // For now, we'll just output to stdout with Railway-specific formatting
    const railwayLog = {
      timestamp: new Date().toISOString(),
      level: info.level,
      service: this.service,
      message: info.message,
      metadata: info.metadata || {},
      railway: {
        project_id: process.env.RAILWAY_PROJECT_ID,
        service_id: process.env.RAILWAY_SERVICE_ID,
        environment_id: process.env.RAILWAY_ENVIRONMENT_ID,
        deployment_id: process.env.RAILWAY_DEPLOYMENT_ID,
      },
    };

    console.log(JSON.stringify(railwayLog));
    callback();
  }
}

// Create and export singleton instance
const logger = new LoggerService();

export default logger;
export { LoggerService, LogContext, LogEntry };