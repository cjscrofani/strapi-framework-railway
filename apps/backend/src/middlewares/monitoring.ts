/**
 * Monitoring Middleware
 * Collects metrics and monitors requests for Railway deployment
 */

import { Context, Next } from 'koa';
import HealthMonitorService from '../services/health-monitor';
import MetricsCollector from '../services/metrics-collector';
import railwayConfig from '../config/railway';

// Global instances
let healthMonitor: HealthMonitorService;
let metricsCollector: MetricsCollector;

// Initialize monitoring services
export function initializeMonitoring(): void {
  healthMonitor = new HealthMonitorService();
  metricsCollector = new MetricsCollector();
  
  // Add process event handlers
  process.on('uncaughtException', (error) => {
    metricsCollector.incrementCounter('uncaught_exceptions_total', 1);
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    metricsCollector.incrementCounter('unhandled_rejections_total', 1);
    console.error('Unhandled Rejection:', reason);
  });

  // Register custom health checks for Strapi services
  registerStrapiHealthChecks();
}

// Get monitoring service instances
export function getHealthMonitor(): HealthMonitorService {
  if (!healthMonitor) {
    initializeMonitoring();
  }
  return healthMonitor;
}

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    initializeMonitoring();
  }
  return metricsCollector;
}

// Request monitoring middleware
export function requestMonitoring() {
  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    let error: Error | null = null;

    try {
      await next();
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const statusCode = error ? 500 : (ctx.response.status || 200);
      
      // Record HTTP request metrics
      metricsCollector.recordHttpRequest(
        ctx.method,
        ctx.path,
        statusCode,
        duration
      );

      // Track active requests
      metricsCollector.decrementGauge('http_requests_active', 1);
      
      // Track request by user agent
      const userAgent = ctx.get('user-agent');
      if (userAgent) {
        const agentType = getUserAgentType(userAgent);
        metricsCollector.incrementCounter('http_requests_by_user_agent', 1, { type: agentType });
      }

      // Track geographical data if available
      const country = ctx.get('cf-ipcountry') || ctx.get('x-country');
      if (country) {
        metricsCollector.incrementCounter('http_requests_by_country', 1, { country });
      }
    }

    // Track active requests at start
    metricsCollector.incrementGauge('http_requests_active', 1);
  };
}

// Health check routes middleware
export function healthCheckRoutes() {
  return async (ctx: Context, next: Next) => {
    const config = railwayConfig.getConfig();
    
    // Health check endpoint
    if (ctx.path === config.monitoring.healthCheck.path) {
      const detailed = ctx.query.detailed === 'true';
      
      try {
        const health = await healthMonitor.handleHealthCheck(detailed);
        
        // Set appropriate HTTP status based on health
        if (health.status === 'healthy') {
          ctx.status = 200;
        } else if (health.status === 'degraded') {
          ctx.status = 200; // Still OK for load balancer
        } else {
          ctx.status = 503; // Service Unavailable
        }
        
        ctx.body = health;
        ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
      } catch (error) {
        ctx.status = 503;
        ctx.body = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        return;
      }
    }

    // Readiness probe endpoint
    if (ctx.path === '/ready') {
      try {
        const result = await healthMonitor.handleReadinessCheck();
        ctx.status = result.ready ? 200 : 503;
        ctx.body = result;
        ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
      } catch (error) {
        ctx.status = 503;
        ctx.body = { ready: false, status: 'error', error: error.message };
        return;
      }
    }

    // Liveness probe endpoint
    if (ctx.path === '/live') {
      try {
        const result = await healthMonitor.handleLivenessCheck();
        ctx.status = result.alive ? 200 : 503;
        ctx.body = result;
        ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
      } catch (error) {
        ctx.status = 503;
        ctx.body = { alive: false, status: 'error', error: error.message };
        return;
      }
    }

    // Metrics endpoint
    if (ctx.path === config.monitoring.metrics.path) {
      try {
        const acceptHeader = ctx.get('accept');
        
        if (acceptHeader && acceptHeader.includes('application/json')) {
          // Return JSON format
          ctx.body = metricsCollector.getMetricsAsJSON();
          ctx.set('Content-Type', 'application/json');
        } else {
          // Return Prometheus format (default)
          ctx.body = metricsCollector.getPrometheusMetrics();
          ctx.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        }
        
        ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
      } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to collect metrics', message: error.message };
        return;
      }
    }

    // Continue to next middleware
    await next();
  };
}

// Database query monitoring middleware (for Knex/Strapi)
export function databaseMonitoring() {
  return (queryBuilder: any) => {
    const originalThen = queryBuilder.then;
    const startTime = Date.now();
    
    queryBuilder.then = function(onResolve: Function, onReject?: Function) {
      return originalThen.call(this, 
        (result: any) => {
          const duration = Date.now() - startTime;
          const operation = getQueryOperation(this.toString());
          const table = getQueryTable(this.toString());
          
          metricsCollector.recordDatabaseQuery(operation, table, duration, true);
          
          if (onResolve) {
            return onResolve(result);
          }
          return result;
        },
        (error: Error) => {
          const duration = Date.now() - startTime;
          const operation = getQueryOperation(this.toString());
          const table = getQueryTable(this.toString());
          
          metricsCollector.recordDatabaseQuery(operation, table, duration, false);
          
          if (onReject) {
            return onReject(error);
          }
          throw error;
        }
      );
    };
    
    return queryBuilder;
  };
}

// Error tracking middleware
export function errorTracking() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      // Record error metrics
      const errorType = error.constructor.name;
      const statusCode = error.status || error.statusCode || 500;
      
      metricsCollector.incrementCounter('application_errors_total', 1, {
        type: errorType,
        status: statusCode.toString(),
        path: ctx.path,
        method: ctx.method,
      });

      // Track specific error patterns
      if (statusCode === 404) {
        metricsCollector.incrementCounter('not_found_errors_total', 1, {
          path: ctx.path,
          method: ctx.method,
        });
      } else if (statusCode >= 500) {
        metricsCollector.incrementCounter('server_errors_total', 1, {
          type: errorType,
          path: ctx.path,
          method: ctx.method,
        });
      }

      // Log error for debugging
      console.error(`Error in ${ctx.method} ${ctx.path}:`, error);
      
      throw error;
    }
  };
}

// Performance monitoring for functions
export function monitorFunction<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  labels?: Record<string, string>
): T {
  return ((...args: any[]) => {
    return metricsCollector.time(name, () => fn(...args), labels);
  }) as T;
}

// Performance monitoring for async functions
export function monitorAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  labels?: Record<string, string>
): T {
  return ((...args: any[]) => {
    return metricsCollector.time(name, () => fn(...args), labels);
  }) as T;
}

// Custom health checks for Strapi services
function registerStrapiHealthChecks(): void {
  // Email services health check
  healthMonitor.registerCheck('strapi_email_services', async () => {
    try {
      // Check if email service is configured in Strapi
      if (globalThis.strapi?.plugins?.email) {
        return {
          status: 'healthy',
          responseTime: 0,
          message: 'Email service is available',
        };
      }
      
      return {
        status: 'degraded',
        responseTime: 0,
        message: 'Email service not configured in Strapi',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: `Email service check failed: ${error.message}`,
      };
    }
  });

  // Content API health check
  healthMonitor.registerCheck('strapi_content_api', async () => {
    try {
      if (globalThis.strapi?.entityService) {
        // Test a simple entity service operation
        const result = await globalThis.strapi.entityService.findMany('api::user.user', {
          limit: 1,
        });
        
        return {
          status: 'healthy',
          responseTime: 0,
          message: 'Content API is operational',
        };
      }
      
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: 'Content API not available',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: `Content API check failed: ${error.message}`,
      };
    }
  });

  // Admin panel health check
  healthMonitor.registerCheck('strapi_admin', async () => {
    try {
      if (globalThis.strapi?.admin) {
        return {
          status: 'healthy',
          responseTime: 0,
          message: 'Admin panel is available',
        };
      }
      
      return {
        status: 'degraded',
        responseTime: 0,
        message: 'Admin panel not available',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: `Admin panel check failed: ${error.message}`,
      };
    }
  });
}

// Utility functions
function getUserAgentType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return 'bot';
  } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('postman') || ua.includes('insomnia') || ua.includes('curl')) {
    return 'api_client';
  } else {
    return 'browser';
  }
}

function getQueryOperation(queryString: string): string {
  const query = queryString.toLowerCase();
  
  if (query.includes('select')) return 'select';
  if (query.includes('insert')) return 'insert';
  if (query.includes('update')) return 'update';
  if (query.includes('delete')) return 'delete';
  if (query.includes('create')) return 'create';
  if (query.includes('drop')) return 'drop';
  if (query.includes('alter')) return 'alter';
  
  return 'unknown';
}

function getQueryTable(queryString: string): string {
  const query = queryString.toLowerCase();
  
  // Try to extract table name from query
  const fromMatch = query.match(/from\s+["`]?(\w+)["`]?/);
  if (fromMatch) return fromMatch[1];
  
  const intoMatch = query.match(/into\s+["`]?(\w+)["`]?/);
  if (intoMatch) return intoMatch[1];
  
  const updateMatch = query.match(/update\s+["`]?(\w+)["`]?/);
  if (updateMatch) return updateMatch[1];
  
  return 'unknown';
}

// Cleanup function
export function destroyMonitoring(): void {
  if (healthMonitor) {
    healthMonitor.destroy();
  }
  
  if (metricsCollector) {
    metricsCollector.destroy();
  }
}

// Export instances for external use
export { healthMonitor, metricsCollector };