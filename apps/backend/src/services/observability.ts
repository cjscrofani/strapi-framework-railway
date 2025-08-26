/**
 * Observability Service
 * Combines logging, metrics, tracing, and alerting for comprehensive system monitoring
 */

import { AsyncLocalStorage } from 'async_hooks';
import { performance, PerformanceObserver } from 'perf_hooks';
import logger, { LogContext } from './logger';
import MetricsCollector from './metrics-collector';
import HealthMonitorService from './health-monitor';
import railwayConfig from '../config/railway';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  tags: Record<string, any>;
  logs: TraceLog[];
}

export interface TraceLog {
  timestamp: number;
  level: string;
  message: string;
  fields: Record<string, any>;
}

export interface PerformanceTrace {
  traceId: string;
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  tags: Record<string, any>;
  spans: PerformanceSpan[];
  success: boolean;
  error?: string;
}

export interface PerformanceSpan {
  spanId: string;
  parentSpanId?: string;
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  tags: Record<string, any>;
  logs: TraceLog[];
}

export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'availability' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number; // seconds
  severity: Alert['severity'];
  enabled: boolean;
  channels: string[]; // notification channels
}

class ObservabilityService {
  private traceStorage = new AsyncLocalStorage<TraceContext>();
  private activeTraces = new Map<string, PerformanceTrace>();
  private alertRules = new Map<string, AlertRule>();
  private recentAlerts = new Map<string, Alert>();
  private metricsCollector: MetricsCollector;
  private healthMonitor: HealthMonitorService;
  private performanceObserver: PerformanceObserver;
  private config: ReturnType<typeof railwayConfig.getConfig>;

  constructor(metricsCollector: MetricsCollector, healthMonitor: HealthMonitorService) {
    this.metricsCollector = metricsCollector;
    this.healthMonitor = healthMonitor;
    this.config = railwayConfig.getConfig();
    this.setupPerformanceObserver();
    this.setupDefaultAlertRules();
    this.startAlertProcessor();
  }

  // Distributed Tracing
  startTrace(operation: string, tags: Record<string, any> = {}): string {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const context: TraceContext = {
      traceId,
      spanId,
      operation,
      startTime: performance.now(),
      tags: {
        ...tags,
        service: 'strapi-railway-framework',
        environment: this.config.environment,
        version: process.env.npm_package_version || '1.0.0',
      },
      logs: [],
    };

    const trace: PerformanceTrace = {
      traceId,
      operation,
      duration: 0,
      startTime: Date.now(),
      endTime: 0,
      tags: context.tags,
      spans: [],
      success: true,
    };

    this.activeTraces.set(traceId, trace);
    this.traceStorage.enterWith(context);

    logger.debug(`Started trace: ${operation}`, {
      traceId,
      spanId,
      operation,
      operationType: 'trace_start',
    });

    return traceId;
  }

  startSpan(operation: string, tags: Record<string, any> = {}): string {
    const parentContext = this.traceStorage.getStore();
    if (!parentContext) {
      throw new Error('No active trace context');
    }

    const spanId = this.generateSpanId();
    const span: PerformanceSpan = {
      spanId,
      parentSpanId: parentContext.spanId,
      operation,
      duration: 0,
      startTime: performance.now(),
      endTime: 0,
      tags,
      logs: [],
    };

    const trace = this.activeTraces.get(parentContext.traceId);
    if (trace) {
      trace.spans.push(span);
    }

    // Create new context for this span
    const spanContext: TraceContext = {
      ...parentContext,
      spanId,
      parentSpanId: parentContext.spanId,
      operation,
      startTime: performance.now(),
      tags: { ...parentContext.tags, ...tags },
      logs: [],
    };

    this.traceStorage.enterWith(spanContext);

    logger.debug(`Started span: ${operation}`, {
      traceId: parentContext.traceId,
      spanId,
      parentSpanId: parentContext.spanId,
      operation,
      operationType: 'span_start',
    });

    return spanId;
  }

  finishSpan(success: boolean = true, error?: Error): void {
    const context = this.traceStorage.getStore();
    if (!context) return;

    const endTime = performance.now();
    const duration = endTime - context.startTime;

    const trace = this.activeTraces.get(context.traceId);
    if (trace) {
      const span = trace.spans.find(s => s.spanId === context.spanId);
      if (span) {
        span.duration = duration;
        span.endTime = endTime;
        span.logs = [...context.logs];
      }
    }

    logger.debug(`Finished span: ${context.operation}`, {
      traceId: context.traceId,
      spanId: context.spanId,
      operation: context.operation,
      duration: Math.round(duration),
      success,
      error: error?.message,
      operationType: 'span_finish',
    });

    // Record metrics
    this.metricsCollector.observeHistogram('span_duration_seconds', duration / 1000, {
      operation: context.operation,
      success: success.toString(),
    });

    if (!success && error) {
      this.metricsCollector.incrementCounter('span_errors_total', 1, {
        operation: context.operation,
        error_type: error.name,
      });
    }
  }

  finishTrace(success: boolean = true, error?: Error): PerformanceTrace | null {
    const context = this.traceStorage.getStore();
    if (!context) return null;

    const trace = this.activeTraces.get(context.traceId);
    if (!trace) return null;

    const endTime = Date.now();
    trace.duration = endTime - trace.startTime;
    trace.endTime = endTime;
    trace.success = success;
    
    if (error) {
      trace.error = error.message;
    }

    this.activeTraces.delete(context.traceId);

    logger.info(`Finished trace: ${context.operation}`, {
      traceId: context.traceId,
      operation: context.operation,
      duration: trace.duration,
      spanCount: trace.spans.length,
      success,
      error: error?.message,
      operationType: 'trace_finish',
    });

    // Record metrics
    this.metricsCollector.observeHistogram('trace_duration_seconds', trace.duration / 1000, {
      operation: context.operation,
      success: success.toString(),
    });

    if (!success) {
      this.metricsCollector.incrementCounter('trace_errors_total', 1, {
        operation: context.operation,
      });
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(trace);

    return trace;
  }

  // Trace logging
  addTraceLog(level: string, message: string, fields: Record<string, any> = {}): void {
    const context = this.traceStorage.getStore();
    if (!context) return;

    const traceLog: TraceLog = {
      timestamp: performance.now(),
      level,
      message,
      fields,
    };

    context.logs.push(traceLog);

    logger.debug(`Trace log: ${message}`, {
      traceId: context.traceId,
      spanId: context.spanId,
      level,
      ...fields,
      operationType: 'trace_log',
    });
  }

  // Automatic instrumentation
  instrument<T extends (...args: any[]) => any>(
    fn: T,
    operation: string,
    tags: Record<string, any> = {}
  ): T {
    return ((...args: any[]) => {
      const spanId = this.startSpan(operation, tags);
      
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result
            .then((res: any) => {
              this.finishSpan(true);
              return res;
            })
            .catch((error: Error) => {
              this.finishSpan(false, error);
              throw error;
            });
        }
        
        this.finishSpan(true);
        return result;
      } catch (error) {
        this.finishSpan(false, error as Error);
        throw error;
      }
    }) as T;
  }

  // Wrap async functions with tracing
  trace<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: string,
    tags: Record<string, any> = {}
  ): T {
    return (async (...args: any[]) => {
      const traceId = this.startTrace(operation, tags);
      
      try {
        const result = await fn(...args);
        this.finishTrace(true);
        return result;
      } catch (error) {
        this.finishTrace(false, error as Error);
        throw error;
      }
    }) as T;
  }

  // Alert Management
  registerAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const ruleId = this.generateAlertRuleId();
    const alertRule: AlertRule = {
      ...rule,
      id: ruleId,
    };
    
    this.alertRules.set(ruleId, alertRule);
    
    logger.info(`Alert rule registered: ${rule.name}`, {
      ruleId,
      condition: rule.condition,
      threshold: rule.threshold,
      severity: rule.severity,
      operationType: 'alert_rule_register',
    });
    
    return ruleId;
  }

  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    
    if (removed) {
      logger.info(`Alert rule removed: ${ruleId}`, {
        ruleId,
        operationType: 'alert_rule_remove',
      });
    }
    
    return removed;
  }

  triggerAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    context: Record<string, any> = {}
  ): string {
    const alertId = this.generateAlertId();
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      context,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.recentAlerts.set(alertId, alert);

    logger.warn(`Alert triggered: ${title}`, {
      alertId,
      type,
      severity,
      message,
      ...context,
      operationType: 'alert_trigger',
    });

    // Record metrics
    this.metricsCollector.incrementCounter('alerts_triggered_total', 1, {
      type,
      severity,
    });

    // Send notifications (in a real implementation)
    this.sendNotifications(alert);

    return alertId;
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.recentAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.recentAlerts.set(alertId, alert);

    logger.info(`Alert acknowledged: ${alert.title}`, {
      alertId,
      operationType: 'alert_acknowledge',
    });

    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.recentAlerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.acknowledged = true;
    this.recentAlerts.set(alertId, alert);

    logger.info(`Alert resolved: ${alert.title}`, {
      alertId,
      operationType: 'alert_resolve',
    });

    return true;
  }

  // Performance Analysis
  getActiveTraces(): PerformanceTrace[] {
    return Array.from(this.activeTraces.values());
  }

  getTraceById(traceId: string): PerformanceTrace | null {
    return this.activeTraces.get(traceId) || null;
  }

  getRecentAlerts(): Alert[] {
    return Array.from(this.recentAlerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getUnresolvedAlerts(): Alert[] {
    return this.getRecentAlerts().filter(alert => !alert.resolved);
  }

  // System Health Checks
  async performHealthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    metrics: Record<string, number>;
    alerts: number;
  }> {
    const health = await this.healthMonitor.performHealthCheck();
    const metrics = this.metricsCollector.getMetricsAsJSON();
    const unresolvedAlerts = this.getUnresolvedAlerts();

    const services: Record<string, boolean> = {};
    health.checks.forEach(check => {
      services[check.name] = check.status === 'healthy';
    });

    return {
      healthy: health.status === 'healthy',
      services,
      metrics: this.extractKeyMetrics(metrics),
      alerts: unresolvedAlerts.length,
    };
  }

  // Private Methods
  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          this.metricsCollector.observeHistogram(
            'performance_measure_duration_seconds',
            entry.duration / 1000,
            { name: entry.name }
          );
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  private setupDefaultAlertRules(): void {
    // High error rate
    this.registerAlertRule({
      name: 'High Error Rate',
      condition: 'error_rate > threshold',
      threshold: 5, // 5% error rate
      timeWindow: 300, // 5 minutes
      severity: 'high',
      enabled: true,
      channels: ['log', 'sentry'],
    });

    // High response time
    this.registerAlertRule({
      name: 'High Response Time',
      condition: 'avg_response_time > threshold',
      threshold: 5000, // 5 seconds
      timeWindow: 300,
      severity: 'medium',
      enabled: true,
      channels: ['log'],
    });

    // Memory usage
    this.registerAlertRule({
      name: 'High Memory Usage',
      condition: 'memory_usage > threshold',
      threshold: 85, // 85% memory usage
      timeWindow: 600, // 10 minutes
      severity: 'high',
      enabled: true,
      channels: ['log'],
    });

    // Database connection issues
    this.registerAlertRule({
      name: 'Database Connection Issues',
      condition: 'db_errors > threshold',
      threshold: 10,
      timeWindow: 300,
      severity: 'critical',
      enabled: true,
      channels: ['log', 'sentry'],
    });
  }

  private startAlertProcessor(): void {
    // Check alert conditions every minute
    setInterval(async () => {
      await this.processAlertRules();
    }, 60000);

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);
  }

  private async processAlertRules(): Promise<void> {
    const metrics = this.metricsCollector.getMetricsAsJSON();
    const health = await this.healthMonitor.getLastHealthCheck();

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateAlertCondition(rule, metrics, health);
        
        if (shouldAlert) {
          this.triggerAlert(
            'custom',
            rule.severity,
            rule.name,
            `Alert condition met: ${rule.condition}`,
            { rule: rule.id, threshold: rule.threshold }
          );
        }
      } catch (error) {
        logger.error(`Failed to process alert rule ${rule.name}`, error as Error, {
          ruleId: rule.id,
          operationType: 'alert_rule_process_error',
        });
      }
    }
  }

  private async evaluateAlertCondition(
    rule: AlertRule,
    metrics: Record<string, any>,
    health: any
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In a real implementation, this would be more sophisticated
    
    switch (rule.condition) {
      case 'error_rate > threshold':
        const errorRate = this.calculateErrorRate(metrics);
        return errorRate > rule.threshold;
        
      case 'avg_response_time > threshold':
        const avgResponseTime = this.calculateAverageResponseTime(metrics);
        return avgResponseTime > rule.threshold;
        
      case 'memory_usage > threshold':
        const memoryUsage = health?.metrics?.memory?.percentage || 0;
        return memoryUsage > rule.threshold;
        
      case 'db_errors > threshold':
        const dbErrors = this.countDatabaseErrors(metrics);
        return dbErrors > rule.threshold;
        
      default:
        return false;
    }
  }

  private checkPerformanceAlerts(trace: PerformanceTrace): void {
    // Check for slow operations
    if (trace.duration > 10000) { // 10 seconds
      this.triggerAlert(
        'performance',
        'medium',
        'Slow Operation Detected',
        `Operation ${trace.operation} took ${trace.duration}ms`,
        { traceId: trace.traceId, operation: trace.operation, duration: trace.duration }
      );
    }

    // Check for failed traces
    if (!trace.success) {
      this.triggerAlert(
        'error',
        'high',
        'Operation Failed',
        `Operation ${trace.operation} failed: ${trace.error}`,
        { traceId: trace.traceId, operation: trace.operation, error: trace.error }
      );
    }
  }

  private sendNotifications(alert: Alert): void {
    // In a real implementation, this would send notifications
    // via various channels (email, Slack, PagerDuty, etc.)
    logger.info(`Sending alert notifications for: ${alert.title}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      operationType: 'alert_notification',
    });
  }

  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    for (const [id, alert] of this.recentAlerts) {
      if (alert.timestamp.getTime() < cutoffTime && alert.resolved) {
        this.recentAlerts.delete(id);
      }
    }
  }

  private calculateErrorRate(metrics: Record<string, any>): number {
    // Simplified error rate calculation
    const httpErrors = metrics.http_requests_errors_total?.[0]?.value || 0;
    const httpTotal = metrics.http_requests_total?.[0]?.value || 0;
    
    return httpTotal > 0 ? (httpErrors / httpTotal) * 100 : 0;
  }

  private calculateAverageResponseTime(metrics: Record<string, any>): number {
    // Simplified average response time calculation
    const httpDuration = metrics.http_request_duration_seconds;
    
    if (httpDuration?.[0]?.sum && httpDuration[0]?.count) {
      return (httpDuration[0].sum / httpDuration[0].count) * 1000; // Convert to ms
    }
    
    return 0;
  }

  private countDatabaseErrors(metrics: Record<string, any>): number {
    return metrics.database_errors_total?.[0]?.value || 0;
  }

  private extractKeyMetrics(metrics: Record<string, any>): Record<string, number> {
    return {
      http_requests_total: metrics.http_requests_total?.[0]?.value || 0,
      http_errors_total: metrics.http_requests_errors_total?.[0]?.value || 0,
      database_queries_total: metrics.database_queries_total?.[0]?.value || 0,
      cache_hits_total: metrics.cache_hits_total?.[0]?.value || 0,
      memory_usage_percentage: metrics.nodejs_memory_usage_bytes?.[0]?.value || 0,
    };
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.activeTraces.clear();
    this.alertRules.clear();
    this.recentAlerts.clear();
  }
}

export default ObservabilityService;