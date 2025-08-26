interface EmailLogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  email?: string;
  template?: string;
  messageId?: string;
  error?: any;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface EmailErrorDetails {
  code: string;
  message: string;
  email?: string;
  template?: string;
  retryable: boolean;
  sendgridResponse?: any;
}

class EmailLogger {
  private logs: EmailLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory
  private logToDatabase = true;
  private logToFile = false;

  constructor() {
    this.setupLogging();
  }

  private setupLogging() {
    const config = {
      logToDatabase: process.env.EMAIL_LOG_TO_DATABASE !== 'false',
      logToFile: process.env.EMAIL_LOG_TO_FILE === 'true',
      maxMemoryLogs: parseInt(process.env.EMAIL_MAX_MEMORY_LOGS || '10000'),
    };

    this.logToDatabase = config.logToDatabase;
    this.logToFile = config.logToFile;
    this.maxLogs = config.maxMemoryLogs;
  }

  async log(level: EmailLogEntry['level'], message: string, details: Partial<EmailLogEntry> = {}) {
    const logEntry: EmailLogEntry = {
      level,
      message,
      timestamp: new Date(),
      ...details,
    };

    // Add to memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Log to Strapi console
    const logMessage = this.formatLogMessage(logEntry);
    switch (level) {
      case 'error':
        strapi.log.error(logMessage);
        break;
      case 'warn':
        strapi.log.warn(logMessage);
        break;
      case 'debug':
        strapi.log.debug(logMessage);
        break;
      default:
        strapi.log.info(logMessage);
    }

    // Log to database if enabled
    if (this.logToDatabase) {
      try {
        await this.logToDatabase(logEntry);
      } catch (error) {
        strapi.log.error('Failed to log email entry to database:', error);
      }
    }

    // Log to file if enabled
    if (this.logToFile) {
      this.logToFileSystem(logEntry);
    }
  }

  private formatLogMessage(entry: EmailLogEntry): string {
    const parts = [
      `[EMAIL] ${entry.message}`,
    ];

    if (entry.email) parts.push(`Email: ${entry.email}`);
    if (entry.template) parts.push(`Template: ${entry.template}`);
    if (entry.messageId) parts.push(`MessageID: ${entry.messageId}`);
    if (entry.error) parts.push(`Error: ${entry.error.message || entry.error}`);

    return parts.join(' | ');
  }

  private async logToDatabaseMethod(entry: EmailLogEntry) {
    try {
      await strapi.entityService.create('api::email-system-log.email-system-log', {
        data: {
          level: entry.level,
          message: entry.message,
          email: entry.email,
          template: entry.template,
          messageId: entry.messageId,
          error: entry.error ? JSON.stringify(entry.error) : null,
          metadata: entry.metadata,
          timestamp: entry.timestamp,
        },
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Database logging failed:', error);
    }
  }

  private logToFileSystem(entry: EmailLogEntry) {
    // This would implement file logging if needed
    // For now, we'll skip file logging implementation
  }

  async logEmailSent(email: string, template?: string, messageId?: string, metadata?: Record<string, any>) {
    await this.log('info', 'Email sent successfully', {
      email,
      template,
      messageId,
      metadata,
    });
  }

  async logEmailFailed(email: string, error: EmailErrorDetails, template?: string, metadata?: Record<string, any>) {
    await this.log('error', `Email failed: ${error.message}`, {
      email,
      template,
      error,
      metadata: {
        ...metadata,
        errorCode: error.code,
        retryable: error.retryable,
      },
    });
  }

  async logTemplateError(template: string, error: any, email?: string) {
    await this.log('error', `Template processing error: ${template}`, {
      template,
      email,
      error,
    });
  }

  async logRateLimitHit(email: string, endpoint: string) {
    await this.log('warn', 'Rate limit exceeded', {
      email,
      metadata: {
        endpoint,
        type: 'rate_limit',
      },
    });
  }

  async logWebhookEvent(eventType: string, email: string, messageId?: string) {
    await this.log('info', `Webhook event received: ${eventType}`, {
      email,
      messageId,
      metadata: {
        webhookEvent: eventType,
      },
    });
  }

  async logDomainIssue(domain: string, issue: string) {
    await this.log('warn', `Domain authentication issue: ${domain}`, {
      metadata: {
        domain,
        issue,
        type: 'domain_auth',
      },
    });
  }

  async logBulkEmailProgress(total: number, sent: number, failed: number, template?: string) {
    await this.log('info', `Bulk email progress: ${sent}/${total} sent, ${failed} failed`, {
      template,
      metadata: {
        bulkEmail: true,
        total,
        sent,
        failed,
        progress: Math.round((sent / total) * 100),
      },
    });
  }

  getRecentLogs(limit = 100, level?: EmailLogEntry['level']): EmailLogEntry[] {
    let logs = this.logs;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLogStats(timeframe = '24h'): Promise<{
    total: number;
    byLevel: Record<string, number>;
    byTemplate: Record<string, number>;
    recentErrors: EmailLogEntry[];
  }> {
    const timeframeHours = {
      '1h': 1,
      '24h': 24,
      '7d': 7 * 24,
      '30d': 30 * 24,
    }[timeframe] || 24;

    const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => log.timestamp >= since);

    const stats = {
      total: recentLogs.length,
      byLevel: {} as Record<string, number>,
      byTemplate: {} as Record<string, number>,
      recentErrors: recentLogs
        .filter(log => log.level === 'error')
        .slice(-10)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    };

    recentLogs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      if (log.template) {
        stats.byTemplate[log.template] = (stats.byTemplate[log.template] || 0) + 1;
      }
    });

    return stats;
  }

  clearLogs() {
    this.logs = [];
  }

  async exportLogs(format: 'json' | 'csv' = 'json', limit = 1000): Promise<string> {
    const logs = this.getRecentLogs(limit);
    
    if (format === 'csv') {
      const csvHeaders = 'timestamp,level,message,email,template,messageId,error\n';
      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.email || '',
        log.template || '',
        log.messageId || '',
        log.error ? `"${JSON.stringify(log.error).replace(/"/g, '""')}"` : '',
      ].join(',')).join('\n');
      
      return csvHeaders + csvRows;
    }
    
    return JSON.stringify(logs, null, 2);
  }
}

export default new EmailLogger();