interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface EmailFailure {
  email: string;
  template?: string;
  error: any;
  attempts: number;
  lastAttempt: Date;
  nextRetry?: Date;
  retryable: boolean;
}

class EmailErrorHandler {
  private failures: Map<string, EmailFailure> = new Map();
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 30000, // 30 seconds
    maxDelay: 300000, // 5 minutes
    backoffFactor: 2,
  };

  constructor() {
    this.setupRetryJob();
  }

  private setupRetryJob() {
    // Run retry job every 5 minutes
    setInterval(() => {
      this.processRetries().catch(error => {
        strapi.log.error('Error processing email retries:', error);
      });
    }, 5 * 60 * 1000);
  }

  async handleEmailError(
    email: string, 
    error: any, 
    template?: string, 
    messageId?: string,
    emailData?: any
  ): Promise<boolean> {
    const errorCode = this.categorizeError(error);
    const retryable = this.isRetryableError(errorCode, error);
    
    const failureKey = `${email}:${template || 'default'}`;
    const existingFailure = this.failures.get(failureKey);
    
    const failure: EmailFailure = {
      email,
      template,
      error: {
        message: error.message,
        code: errorCode,
        details: error.response?.body || error,
        timestamp: new Date(),
      },
      attempts: existingFailure ? existingFailure.attempts + 1 : 1,
      lastAttempt: new Date(),
      retryable,
    };

    // Calculate next retry time if retryable
    if (retryable && failure.attempts <= this.retryConfig.maxRetries) {
      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, failure.attempts - 1),
        this.retryConfig.maxDelay
      );
      failure.nextRetry = new Date(Date.now() + delay);
      
      this.failures.set(failureKey, failure);
      
      // Log retry schedule
      const emailLogger = require('./email-logger').default;
      await emailLogger.logEmailFailed(email, {
        code: errorCode,
        message: error.message,
        email,
        template,
        retryable: true,
      }, template, {
        messageId,
        nextRetry: failure.nextRetry,
        attempt: failure.attempts,
      });
      
      return false; // Will retry
    } else {
      // Not retryable or max retries exceeded
      if (existingFailure) {
        this.failures.delete(failureKey);
      }
      
      const emailLogger = require('./email-logger').default;
      await emailLogger.logEmailFailed(email, {
        code: errorCode,
        message: error.message,
        email,
        template,
        retryable: false,
      }, template, {
        messageId,
        finalFailure: true,
        totalAttempts: failure.attempts,
      });

      // Handle permanent failures
      await this.handlePermanentFailure(email, errorCode, error);
      
      return true; // Permanent failure
    }
  }

  private categorizeError(error: any): string {
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.response?.status || error.code;
    
    // SendGrid specific error codes
    if (error.response?.body?.errors) {
      const sendgridError = error.response.body.errors[0];
      if (sendgridError.field === 'from' || sendgridError.field === 'to') {
        return 'INVALID_EMAIL';
      }
      if (sendgridError.message?.includes('reputation')) {
        return 'REPUTATION_ISSUE';
      }
      if (sendgridError.message?.includes('quota') || sendgridError.message?.includes('limit')) {
        return 'QUOTA_EXCEEDED';
      }
    }

    // HTTP status codes
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401) return 'AUTHENTICATION_FAILED';
      if (statusCode === 403) return 'FORBIDDEN';
      if (statusCode === 429) return 'RATE_LIMITED';
      return 'CLIENT_ERROR';
    }
    
    if (statusCode >= 500) {
      return 'SERVER_ERROR';
    }

    // Network errors
    if (errorMessage.includes('timeout')) return 'TIMEOUT';
    if (errorMessage.includes('network')) return 'NETWORK_ERROR';
    if (errorMessage.includes('connection')) return 'CONNECTION_ERROR';
    
    // Template errors
    if (errorMessage.includes('template')) return 'TEMPLATE_ERROR';
    if (errorMessage.includes('handlebars')) return 'TEMPLATE_RENDERING_ERROR';

    return 'UNKNOWN_ERROR';
  }

  private isRetryableError(errorCode: string, error: any): boolean {
    const retryableErrors = [
      'SERVER_ERROR',
      'TIMEOUT',
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
      'RATE_LIMITED',
    ];

    const nonRetryableErrors = [
      'INVALID_EMAIL',
      'AUTHENTICATION_FAILED',
      'FORBIDDEN',
      'TEMPLATE_ERROR',
      'TEMPLATE_RENDERING_ERROR',
    ];

    if (nonRetryableErrors.includes(errorCode)) {
      return false;
    }

    if (retryableErrors.includes(errorCode)) {
      return true;
    }

    // Default: retry server errors, don't retry client errors
    const statusCode = error.response?.status;
    if (statusCode) {
      return statusCode >= 500;
    }

    return false;
  }

  private async processRetries() {
    const now = new Date();
    const retryPromises = [];

    for (const [failureKey, failure] of this.failures.entries()) {
      if (failure.nextRetry && failure.nextRetry <= now && failure.retryable) {
        retryPromises.push(this.retryEmailSend(failureKey, failure));
      }
    }

    if (retryPromises.length > 0) {
      strapi.log.info(`Processing ${retryPromises.length} email retries`);
      await Promise.allSettled(retryPromises);
    }
  }

  private async retryEmailSend(failureKey: string, failure: EmailFailure) {
    try {
      const emailService = strapi.services['global::email'] || require('./email').default;
      
      // Attempt to resend the email
      const result = await emailService.sendEmail({
        to: failure.email,
        template: failure.template,
        subject: 'Retry Email', // This would ideally come from stored email data
      });

      // Success! Remove from failures
      this.failures.delete(failureKey);
      
      const emailLogger = require('./email-logger').default;
      await emailLogger.logEmailSent(
        failure.email, 
        failure.template, 
        result.messageId,
        {
          retry: true,
          attempt: failure.attempts + 1,
          originalError: failure.error,
        }
      );

      strapi.log.info(`Email retry successful: ${failure.email}`);
      
    } catch (error) {
      // Retry failed, handle the error
      await this.handleEmailError(
        failure.email,
        error,
        failure.template,
        undefined,
        undefined
      );
    }
  }

  private async handlePermanentFailure(email: string, errorCode: string, error: any) {
    try {
      // Update user record if it's a permanent failure
      if (errorCode === 'INVALID_EMAIL') {
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { email },
        });

        if (user) {
          await strapi.entityService.update('plugin::users-permissions.user', user.id, {
            data: {
              preferences: {
                ...(user.preferences || {}),
                emailValid: false,
                emailError: errorCode,
                emailErrorTimestamp: new Date(),
              },
            },
          });
        }
      }

      // Create permanent failure record
      await strapi.entityService.create('api::email-failure.email-failure', {
        data: {
          email,
          errorCode,
          errorMessage: error.message,
          errorDetails: JSON.stringify(error),
          isPermanent: true,
          createdAt: new Date(),
        },
      });
      
    } catch (dbError) {
      strapi.log.error('Failed to handle permanent failure:', dbError);
    }
  }

  getFailureStats(): {
    total: number;
    retryable: number;
    permanent: number;
    byErrorCode: Record<string, number>;
    oldestFailure?: Date;
  } {
    const failures = Array.from(this.failures.values());
    
    const stats = {
      total: failures.length,
      retryable: failures.filter(f => f.retryable).length,
      permanent: failures.filter(f => !f.retryable).length,
      byErrorCode: {} as Record<string, number>,
      oldestFailure: undefined as Date | undefined,
    };

    failures.forEach(failure => {
      const code = failure.error.code || 'UNKNOWN';
      stats.byErrorCode[code] = (stats.byErrorCode[code] || 0) + 1;
      
      if (!stats.oldestFailure || failure.lastAttempt < stats.oldestFailure) {
        stats.oldestFailure = failure.lastAttempt;
      }
    });

    return stats;
  }

  clearOldFailures(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    let cleared = 0;

    for (const [key, failure] of this.failures.entries()) {
      if (failure.lastAttempt < cutoff) {
        this.failures.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      strapi.log.info(`Cleared ${cleared} old email failures`);
    }

    return cleared;
  }

  async getErrorReport(timeframe = '24h'): Promise<{
    totalFailures: number;
    errorBreakdown: Record<string, number>;
    topFailedEmails: Array<{ email: string; count: number }>;
    retrySuccessRate: number;
  }> {
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeframe] || 24 * 60 * 60 * 1000;

    const since = new Date(Date.now() - timeframeMs);

    // This would query the database for comprehensive stats
    // For now, return in-memory stats
    const currentStats = this.getFailureStats();
    
    return {
      totalFailures: currentStats.total,
      errorBreakdown: currentStats.byErrorCode,
      topFailedEmails: [], // Would be populated from database query
      retrySuccessRate: 0, // Would be calculated from database
    };
  }
}

export default new EmailErrorHandler();