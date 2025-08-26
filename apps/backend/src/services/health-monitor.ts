/**
 * Health Monitor Service
 * Comprehensive health checks and monitoring for Railway deployment
 */

import { performance } from 'perf_hooks';
import railwayConfig from '../config/railway';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: Date;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  timestamp: Date;
}

export interface ApplicationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: Date;
  uptime: number;
  responseTime: number;
  checks: HealthCheck[];
  metrics: SystemMetrics;
  railway: {
    projectId: string;
    serviceId: string;
    environmentId: string;
    deploymentId: string;
    region: string;
    replica: boolean;
  };
}

interface CheckFunction {
  (): Promise<Omit<HealthCheck, 'name' | 'lastChecked'>>;
}

class HealthMonitorService {
  private checks: Map<string, CheckFunction> = new Map();
  private lastHealthCheck?: ApplicationHealth;
  private healthCheckInterval?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor() {
    this.registerDefaultChecks();
    this.startPeriodicChecks();
  }

  // Register health checks
  registerCheck(name: string, checkFunction: CheckFunction): void {
    this.checks.set(name, checkFunction);
  }

  unregisterCheck(name: string): void {
    this.checks.delete(name);
  }

  // Perform health check
  async performHealthCheck(): Promise<ApplicationHealth> {
    const startTime = performance.now();
    const config = railwayConfig.getConfig();
    
    const checks: HealthCheck[] = [];
    
    // Execute all registered checks
    for (const [name, checkFunction] of this.checks.entries()) {
      try {
        const checkStart = performance.now();
        const result = await checkFunction();
        const checkTime = performance.now() - checkStart;
        
        checks.push({
          name,
          ...result,
          responseTime: Math.round(checkTime),
          lastChecked: new Date(),
        });
      } catch (error) {
        checks.push({
          name,
          status: 'unhealthy',
          responseTime: 0,
          message: error.message,
          lastChecked: new Date(),
        });
      }
    }

    // Determine overall health status
    const overallStatus = this.determineOverallStatus(checks);
    
    // Get system metrics
    const metrics = await this.getSystemMetrics();
    
    const health: ApplicationHealth = {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.environment,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      responseTime: Math.round(performance.now() - startTime),
      checks,
      metrics,
      railway: {
        projectId: config.railway.projectId,
        serviceId: config.railway.serviceId,
        environmentId: config.railway.environmentId,
        deploymentId: config.railway.deploymentId,
        region: config.railway.region,
        replica: config.railway.replica,
      },
    };

    this.lastHealthCheck = health;
    return health;
  }

  // Get last health check result
  getLastHealthCheck(): ApplicationHealth | undefined {
    return this.lastHealthCheck;
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.rss,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        loadAverage: (globalThis as any).loadavg?.() || [0, 0, 0],
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      timestamp: new Date(),
    };
  }

  // Readiness probe (for Railway load balancer)
  async isReady(): Promise<boolean> {
    try {
      const health = await this.performHealthCheck();
      return health.status === 'healthy' || health.status === 'degraded';
    } catch (error) {
      return false;
    }
  }

  // Liveness probe (for Railway container management)
  async isAlive(): Promise<boolean> {
    try {
      // Basic liveness check - just ensure the service is responding
      return true;
    } catch (error) {
      return false;
    }
  }

  // Register default health checks
  private registerDefaultChecks(): void {
    // Database health check
    this.registerCheck('database', async () => {
      try {
        const startTime = performance.now();
        
        // Check if Strapi is available
        if (globalThis.strapi?.db) {
          await globalThis.strapi.db.connection.raw('SELECT 1');
          return {
            status: 'healthy',
            responseTime: Math.round(performance.now() - startTime),
            message: 'Database connection successful',
          };
        } else {
          // Fallback database check using the configuration
          const config = railwayConfig.getConfig();
          const { Client } = require('pg');
          const client = new Client({
            connectionString: config.database.url,
            connectionTimeoutMillis: 5000,
          });
          
          await client.connect();
          await client.query('SELECT 1');
          await client.end();
          
          return {
            status: 'healthy',
            responseTime: Math.round(performance.now() - startTime),
            message: 'Database connection successful',
          };
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: `Database connection failed: ${error.message}`,
          details: { error: error.message },
        };
      }
    });

    // Redis health check (if configured)
    this.registerCheck('redis', async () => {
      try {
        const config = railwayConfig.getConfig();
        if (!config.redis) {
          return {
            status: 'healthy',
            responseTime: 0,
            message: 'Redis not configured',
          };
        }

        const startTime = performance.now();
        const Redis = require('ioredis');
        const redis = new Redis(config.redis.url);
        
        await redis.ping();
        redis.disconnect();
        
        return {
          status: 'healthy',
          responseTime: Math.round(performance.now() - startTime),
          message: 'Redis connection successful',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: `Redis connection failed: ${error.message}`,
          details: { error: error.message },
        };
      }
    });

    // Email service health check
    this.registerCheck('email_services', async () => {
      try {
        const startTime = performance.now();
        
        // Check if email services are configured
        const sendgridKey = process.env.SENDGRID_API_KEY;
        const mailchimpKey = process.env.MAILCHIMP_API_KEY;
        
        if (!sendgridKey && !mailchimpKey) {
          return {
            status: 'degraded',
            responseTime: 0,
            message: 'No email services configured',
          };
        }

        const services = [];
        
        // Test SendGrid
        if (sendgridKey) {
          try {
            const sgClient = require('@sendgrid/client');
            sgClient.setApiKey(sendgridKey);
            await sgClient.request({
              method: 'GET',
              url: '/v3/user/account',
            });
            services.push('SendGrid');
          } catch (error) {
            return {
              status: 'degraded',
              responseTime: Math.round(performance.now() - startTime),
              message: `SendGrid API error: ${error.message}`,
              details: { sendgrid_error: error.message },
            };
          }
        }

        // Test MailChimp
        if (mailchimpKey) {
          try {
            const mailchimp = require('@mailchimp/mailchimp_marketing');
            mailchimp.setConfig({
              apiKey: mailchimpKey,
              server: process.env.MAILCHIMP_SERVER || 'us1',
            });
            await mailchimp.ping.get();
            services.push('MailChimp');
          } catch (error) {
            return {
              status: 'degraded',
              responseTime: Math.round(performance.now() - startTime),
              message: `MailChimp API error: ${error.message}`,
              details: { mailchimp_error: error.message },
            };
          }
        }

        return {
          status: 'healthy',
          responseTime: Math.round(performance.now() - startTime),
          message: `Email services operational: ${services.join(', ')}`,
          details: { active_services: services },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: `Email services check failed: ${error.message}`,
          details: { error: error.message },
        };
      }
    });

    // Storage health check
    this.registerCheck('storage', async () => {
      try {
        const startTime = performance.now();
        const config = railwayConfig.getConfig();
        const fs = require('fs').promises;
        const path = require('path');
        
        let uploadDir = config.storage.local?.uploadDir || './public/uploads';
        if (config.storage.provider === 'railway-volumes' && config.storage.volumes?.mountPath) {
          uploadDir = config.storage.volumes.mountPath;
        }

        // Check if upload directory exists and is writable
        try {
          await fs.access(uploadDir, fs.constants.F_OK | fs.constants.W_OK);
        } catch (error) {
          // Try to create the directory
          await fs.mkdir(uploadDir, { recursive: true });
        }

        // Test write operation
        const testFile = path.join(uploadDir, '.health-check');
        await fs.writeFile(testFile, 'health check');
        await fs.unlink(testFile);

        return {
          status: 'healthy',
          responseTime: Math.round(performance.now() - startTime),
          message: 'Storage system operational',
          details: { 
            provider: config.storage.provider,
            upload_dir: uploadDir,
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: `Storage system error: ${error.message}`,
          details: { error: error.message },
        };
      }
    });

    // Memory health check
    this.registerCheck('memory', async () => {
      try {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        let status: HealthCheck['status'] = 'healthy';
        let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${memoryPercentage.toFixed(1)}%)`;
        
        if (memoryPercentage > 90) {
          status = 'unhealthy';
          message += ' - Critical memory usage';
        } else if (memoryPercentage > 75) {
          status = 'degraded';
          message += ' - High memory usage';
        }

        return {
          status,
          responseTime: 0,
          message,
          details: {
            heap_used_mb: heapUsedMB,
            heap_total_mb: heapTotalMB,
            percentage: Math.round(memoryPercentage),
            rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: `Memory check failed: ${error.message}`,
        };
      }
    });
  }

  private determineOverallStatus(checks: HealthCheck[]): ApplicationHealth['status'] {
    if (checks.length === 0) return 'unhealthy';
    
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private startPeriodicChecks(): void {
    const config = railwayConfig.getConfig();
    
    if (config.monitoring.healthCheck.enabled) {
      this.healthCheckInterval = setInterval(
        async () => {
          try {
            await this.performHealthCheck();
          } catch (error) {
            console.error('Periodic health check failed:', error);
          }
        },
        config.monitoring.healthCheck.interval
      );
    }
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  // HTTP endpoint handlers
  async handleHealthCheck(detailed: boolean = false): Promise<any> {
    const health = await this.performHealthCheck();
    
    if (!detailed) {
      return {
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime,
        version: health.version,
      };
    }
    
    return health;
  }

  async handleReadinessCheck(): Promise<{ ready: boolean; status: string }> {
    const ready = await this.isReady();
    const status = ready ? 'ready' : 'not ready';
    
    return { ready, status };
  }

  async handleLivenessCheck(): Promise<{ alive: boolean; status: string }> {
    const alive = await this.isAlive();
    const status = alive ? 'alive' : 'dead';
    
    return { alive, status };
  }

  // Metrics for monitoring
  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (this.lastHealthCheck) {
      metrics['health_check_response_time_ms'] = this.lastHealthCheck.responseTime;
      metrics['uptime_seconds'] = Math.floor(this.lastHealthCheck.uptime / 1000);
      metrics['memory_usage_percentage'] = this.lastHealthCheck.metrics.memory.percentage;
      metrics['memory_used_bytes'] = this.lastHealthCheck.metrics.memory.used;
      
      // Individual check metrics
      this.lastHealthCheck.checks.forEach(check => {
        const statusValue = check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0;
        metrics[`health_check_${check.name}_status`] = statusValue;
        metrics[`health_check_${check.name}_response_time_ms`] = check.responseTime;
      });
    }
    
    return metrics;
  }
}

export default HealthMonitorService;