/**
 * Metrics Collector Service
 * Collects and exposes application metrics for Railway monitoring
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import railwayConfig from '../config/railway';

export interface MetricSample {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface HistogramData {
  count: number;
  sum: number;
  buckets: Map<number, number>;
}

export interface TimerData {
  start: number;
  labels?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Map<string, MetricSample> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, HistogramData> = new Map();
  private activeTimers: Map<string, TimerData> = new Map();
  private performanceObserver?: PerformanceObserver;
  private startTime = Date.now();

  constructor() {
    this.initializeDefaultMetrics();
    this.setupPerformanceMonitoring();
    this.startMetricsCollection();
  }

  // Counter methods
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;
    
    this.counters.set(key, newValue);
    this.updateMetric(name, newValue, 'counter', labels);
  }

  // Gauge methods
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    this.gauges.set(key, value);
    this.updateMetric(name, value, 'gauge', labels);
  }

  incrementGauge(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    const currentValue = this.gauges.get(key) || 0;
    const newValue = currentValue + value;
    
    this.gauges.set(key, newValue);
    this.updateMetric(name, newValue, 'gauge', labels);
  }

  decrementGauge(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.incrementGauge(name, -value, labels);
  }

  // Histogram methods
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    let histogram = this.histograms.get(key);
    
    if (!histogram) {
      histogram = {
        count: 0,
        sum: 0,
        buckets: new Map([
          [0.005, 0], [0.01, 0], [0.025, 0], [0.05, 0], [0.1, 0],
          [0.25, 0], [0.5, 0], [1, 0], [2.5, 0], [5, 0], [10, 0],
          [Infinity, 0]
        ])
      };
      this.histograms.set(key, histogram);
    }

    histogram.count++;
    histogram.sum += value;

    // Update buckets
    for (const [bucket, _] of histogram.buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, (histogram.buckets.get(bucket) || 0) + 1);
      }
    }

    this.updateMetric(name, histogram.sum, 'histogram', labels);
  }

  // Timer methods
  startTimer(name: string, labels?: Record<string, string>): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeTimers.set(timerId, {
      start: performance.now(),
      labels,
    });
    
    return timerId;
  }

  endTimer(timerId: string, name?: string): number {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      throw new Error(`Timer ${timerId} not found`);
    }

    const duration = (performance.now() - timer.start) / 1000; // Convert to seconds
    this.activeTimers.delete(timerId);

    if (name) {
      this.observeHistogram(name, duration, timer.labels);
    }

    return duration;
  }

  // Time a function execution
  time<T>(name: string, fn: () => T, labels?: Record<string, string>): T;
  time<T>(name: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T>;
  time<T>(name: string, fn: () => T | Promise<T>, labels?: Record<string, string>): T | Promise<T> {
    const timerId = this.startTimer(name, labels);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then(res => {
            this.endTimer(timerId, name);
            return res;
          })
          .catch(err => {
            this.endTimer(timerId, name);
            this.incrementCounter('function_errors_total', 1, { ...labels, function: name });
            throw err;
          });
      } else {
        this.endTimer(timerId, name);
        return result;
      }
    } catch (error) {
      this.endTimer(timerId, name);
      this.incrementCounter('function_errors_total', 1, { ...labels, function: name });
      throw error;
    }
  }

  // HTTP request metrics
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    const labels = {
      method: method.toUpperCase(),
      path: this.normalizePath(path),
      status: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`,
    };

    this.incrementCounter('http_requests_total', 1, labels);
    this.observeHistogram('http_request_duration_seconds', duration / 1000, labels);
    
    if (statusCode >= 400) {
      this.incrementCounter('http_requests_errors_total', 1, labels);
    }
  }

  // Database metrics
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    const labels = {
      operation: operation.toLowerCase(),
      table,
      status: success ? 'success' : 'error',
    };

    this.incrementCounter('database_queries_total', 1, labels);
    this.observeHistogram('database_query_duration_seconds', duration / 1000, labels);
    
    if (!success) {
      this.incrementCounter('database_errors_total', 1, labels);
    }
  }

  // Email metrics
  recordEmailSent(provider: string, success: boolean, duration: number): void {
    const labels = {
      provider,
      status: success ? 'success' : 'error',
    };

    this.incrementCounter('emails_sent_total', 1, labels);
    this.observeHistogram('email_send_duration_seconds', duration / 1000, labels);
    
    if (!success) {
      this.incrementCounter('email_errors_total', 1, labels);
    }
  }

  // Cache metrics
  recordCacheOperation(operation: string, hit: boolean, duration: number): void {
    const labels = {
      operation,
      result: hit ? 'hit' : 'miss',
    };

    this.incrementCounter('cache_operations_total', 1, labels);
    this.observeHistogram('cache_operation_duration_seconds', duration / 1000, labels);
    
    if (hit) {
      this.incrementCounter('cache_hits_total', 1, { operation });
    } else {
      this.incrementCounter('cache_misses_total', 1, { operation });
    }
  }

  // Get all metrics in Prometheus format
  getPrometheusMetrics(): string {
    let output = '';
    const now = Date.now();

    // Add help and type information for each metric
    const metricTypes: Map<string, { type: string; help: string }> = new Map([
      ['http_requests_total', { type: 'counter', help: 'Total number of HTTP requests' }],
      ['http_request_duration_seconds', { type: 'histogram', help: 'HTTP request duration in seconds' }],
      ['http_requests_errors_total', { type: 'counter', help: 'Total number of HTTP request errors' }],
      ['database_queries_total', { type: 'counter', help: 'Total number of database queries' }],
      ['database_query_duration_seconds', { type: 'histogram', help: 'Database query duration in seconds' }],
      ['database_errors_total', { type: 'counter', help: 'Total number of database errors' }],
      ['emails_sent_total', { type: 'counter', help: 'Total number of emails sent' }],
      ['email_send_duration_seconds', { type: 'histogram', help: 'Email send duration in seconds' }],
      ['email_errors_total', { type: 'counter', help: 'Total number of email errors' }],
      ['cache_operations_total', { type: 'counter', help: 'Total number of cache operations' }],
      ['cache_operation_duration_seconds', { type: 'histogram', help: 'Cache operation duration in seconds' }],
      ['cache_hits_total', { type: 'counter', help: 'Total number of cache hits' }],
      ['cache_misses_total', { type: 'counter', help: 'Total number of cache misses' }],
      ['nodejs_memory_usage_bytes', { type: 'gauge', help: 'Node.js memory usage in bytes' }],
      ['nodejs_cpu_usage_seconds', { type: 'counter', help: 'Node.js CPU usage in seconds' }],
      ['process_uptime_seconds', { type: 'counter', help: 'Process uptime in seconds' }],
      ['function_errors_total', { type: 'counter', help: 'Total number of function errors' }],
    ]);

    // Group metrics by name
    const groupedMetrics: Map<string, MetricSample[]> = new Map();
    
    for (const metric of this.metrics.values()) {
      const existing = groupedMetrics.get(metric.name) || [];
      existing.push(metric);
      groupedMetrics.set(metric.name, existing);
    }

    // Generate Prometheus format
    for (const [metricName, samples] of groupedMetrics) {
      const metricInfo = metricTypes.get(metricName);
      
      if (metricInfo) {
        output += `# HELP ${metricName} ${metricInfo.help}\n`;
        output += `# TYPE ${metricName} ${metricInfo.type}\n`;
      }

      for (const sample of samples) {
        const labels = this.formatLabels(sample.labels);
        output += `${metricName}${labels} ${sample.value} ${sample.timestamp}\n`;
      }
      
      output += '\n';
    }

    // Add histogram buckets
    for (const [key, histogram] of this.histograms) {
      const { name, labels } = this.parseKey(key);
      
      // Add buckets
      for (const [bucket, count] of histogram.buckets) {
        const bucketLabels = { ...labels, le: bucket === Infinity ? '+Inf' : bucket.toString() };
        const formattedLabels = this.formatLabels(bucketLabels);
        output += `${name}_bucket${formattedLabels} ${count} ${now}\n`;
      }
      
      // Add count and sum
      const baseLabels = this.formatLabels(labels);
      output += `${name}_count${baseLabels} ${histogram.count} ${now}\n`;
      output += `${name}_sum${baseLabels} ${histogram.sum} ${now}\n`;
    }

    return output;
  }

  // Get metrics as JSON
  getMetricsAsJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Simple metrics
    for (const [key, value] of [...this.counters, ...this.gauges]) {
      const { name, labels } = this.parseKey(key);
      if (!result[name]) result[name] = [];
      result[name].push({ value, labels, timestamp: Date.now() });
    }

    // Histograms
    for (const [key, histogram] of this.histograms) {
      const { name, labels } = this.parseKey(key);
      if (!result[name]) result[name] = [];
      
      result[name].push({
        type: 'histogram',
        count: histogram.count,
        sum: histogram.sum,
        buckets: Object.fromEntries(histogram.buckets),
        labels,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  // Private methods
  private initializeDefaultMetrics(): void {
    const config = railwayConfig.getConfig();
    
    if (config.monitoring.metrics.collectDefaultMetrics) {
      // Start collecting default Node.js metrics
      setInterval(() => {
        this.collectNodeMetrics();
      }, 10000); // Collect every 10 seconds
    }
  }

  private collectNodeMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory metrics
    this.setGauge('nodejs_memory_usage_bytes', memoryUsage.rss, { type: 'rss' });
    this.setGauge('nodejs_memory_usage_bytes', memoryUsage.heapUsed, { type: 'heap_used' });
    this.setGauge('nodejs_memory_usage_bytes', memoryUsage.heapTotal, { type: 'heap_total' });
    this.setGauge('nodejs_memory_usage_bytes', memoryUsage.external, { type: 'external' });
    
    // CPU metrics
    this.setGauge('nodejs_cpu_usage_seconds', cpuUsage.user / 1000000, { type: 'user' });
    this.setGauge('nodejs_cpu_usage_seconds', cpuUsage.system / 1000000, { type: 'system' });
    
    // Process uptime
    this.setGauge('process_uptime_seconds', process.uptime());
    this.setGauge('process_start_time_seconds', this.startTime / 1000);
  }

  private setupPerformanceMonitoring(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          this.observeHistogram(
            'performance_measure_duration_seconds',
            entry.duration / 1000,
            { name: entry.name }
          );
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 30000);
  }

  private cleanupOldMetrics(): void {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const cutoff = Date.now() - maxAge;
    
    for (const [key, metric] of this.metrics) {
      if (metric.timestamp < cutoff && metric.type === 'gauge') {
        this.metrics.delete(key);
      }
    }
  }

  private updateMetric(name: string, value: number, type: MetricSample['type'], labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    
    this.metrics.set(key, {
      name,
      value,
      labels,
      timestamp: Date.now(),
      type,
    });
  }

  private createKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
      
    return `${name}{${sortedLabels}}`;
  }

  private parseKey(key: string): { name: string; labels?: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) {
      return { name: key };
    }

    const name = match[1];
    const labelsStr = match[2];
    
    if (!labelsStr) {
      return { name };
    }

    const labels: Record<string, string> = {};
    const labelPairs = labelsStr.match(/(\w+)="([^"]+)"/g) || [];
    
    for (const pair of labelPairs) {
      const [, key, value] = pair.match(/(\w+)="([^"]+)"/) || [];
      if (key && value) {
        labels[key] = value;
      }
    }

    return { name, labels };
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const formatted = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `{${formatted}}`;
  }

  private normalizePath(path: string): string {
    // Replace IDs and UUIDs with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }
    
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.activeTimers.clear();
  }
}

export default MetricsCollector;