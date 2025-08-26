import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  replyTo?: string;
  from?: string;
  fromName?: string;
  trackClicks?: boolean;
  trackOpens?: boolean;
  categories?: string[];
  customArgs?: Record<string, string>;
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template?: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  error?: string;
  messageId?: string;
  opens?: number;
  clicks?: number;
}

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private templatePath: string;
  private isInitialized: boolean = false;

  constructor() {
    this.templatePath = process.env.EMAIL_TEMPLATE_PATH || './email-templates';
    this.initialize();
  }

  private async initialize() {
    if (!process.env.SENDGRID_API_KEY) {
      strapi.log.warn('SendGrid API key not found. Email service will not work.');
      return;
    }

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await this.loadTemplates();
      this.isInitialized = true;
      strapi.log.info('Email service initialized successfully');
    } catch (error) {
      strapi.log.error('Failed to initialize email service:', error);
    }
  }

  private async loadTemplates() {
    try {
      const templateDir = path.resolve(this.templatePath);
      const templateFolders = await fs.readdir(templateDir);

      for (const folder of templateFolders) {
        const folderPath = path.join(templateDir, folder);
        const stat = await fs.stat(folderPath);

        if (stat.isDirectory()) {
          await this.loadTemplate(folder, folderPath);
        }
      }

      strapi.log.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      strapi.log.warn('Template directory not found or error loading templates:', error.message);
    }
  }

  private async loadTemplate(templateName: string, templatePath: string) {
    try {
      const configPath = path.join(templatePath, 'config.json');
      const htmlPath = path.join(templatePath, 'template.html');
      const textPath = path.join(templatePath, 'template.txt');

      // Load config
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Load HTML template
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      const htmlTemplate = Handlebars.compile(htmlContent);

      // Load text template (optional)
      let textTemplate;
      try {
        const textContent = await fs.readFile(textPath, 'utf-8');
        textTemplate = Handlebars.compile(textContent);
      } catch {
        // Text template is optional
      }

      this.templates.set(templateName, {
        subject: config.subject || 'Message from {{siteName}}',
        html: htmlContent,
        text: textTemplate ? await fs.readFile(textPath, 'utf-8') : undefined,
      });

      strapi.log.debug(`Loaded email template: ${templateName}`);
    } catch (error) {
      strapi.log.error(`Failed to load template ${templateName}:`, error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailLog> {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emailLog: EmailLog = {
      id: emailId,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      template: options.template,
      status: 'pending',
    };

    // Import services
    const emailLogger = require('./email-logger').default;
    const errorHandler = require('./email-error-handler').default;

    try {
      let emailContent: { subject: string; html: string; text?: string };

      // Use template if specified
      if (options.template) {
        const template = this.templates.get(options.template);
        if (!template) {
          throw new Error(`Template '${options.template}' not found`);
        }

        const subjectTemplate = Handlebars.compile(template.subject);
        const htmlTemplate = Handlebars.compile(template.html);
        const textTemplate = template.text ? Handlebars.compile(template.text) : null;

        const templateData = {
          siteName: process.env.SITE_NAME || 'Strapi App',
          siteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          currentYear: new Date().getFullYear(),
          ...options.templateData,
        };

        emailContent = {
          subject: subjectTemplate(templateData),
          html: htmlTemplate(templateData),
          text: textTemplate ? textTemplate(templateData) : undefined,
        };
      } else {
        // Use provided content
        emailContent = {
          subject: options.subject,
          html: options.html || '',
          text: options.text,
        };
      }

      const mailOptions: sgMail.MailDataRequired = {
        to: options.to,
        from: {
          email: options.from || process.env.SENDGRID_FROM_EMAIL,
          name: options.fromName || process.env.SENDGRID_FROM_NAME || 'Strapi App',
        },
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        replyTo: options.replyTo || process.env.SENDGRID_REPLY_TO,
        trackingSettings: {
          clickTracking: {
            enable: options.trackClicks !== false,
          },
          openTracking: {
            enable: options.trackOpens !== false,
          },
        },
        categories: options.categories,
        customArgs: options.customArgs,
      };

      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }

      const response = await sgMail.send(mailOptions);
      
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      emailLog.messageId = response[0]?.headers?.['x-message-id'];

      // Log success
      await emailLogger.logEmailSent(
        Array.isArray(options.to) ? options.to[0] : options.to,
        options.template,
        emailLog.messageId,
        {
          emailId,
          categories: options.categories,
        }
      );

      // Log to database
      await this.logEmail(emailLog);

      return emailLog;

    } catch (error) {
      emailLog.status = 'failed';
      emailLog.error = error.message;

      // Handle error with retry logic
      const recipientEmail = Array.isArray(options.to) ? options.to[0] : options.to;
      await errorHandler.handleEmailError(
        recipientEmail,
        error,
        options.template,
        emailLog.messageId,
        options
      );

      // Log failed email
      await this.logEmail(emailLog);

      throw error;
    }
  }

  async sendTransactionalEmail(type: string, to: string, data: Record<string, any>): Promise<EmailLog> {
    const templates = {
      welcome: {
        template: 'welcome',
        subject: 'Welcome to {{siteName}}!',
      },
      password_reset: {
        template: 'password-reset',
        subject: 'Reset your password',
      },
      email_verification: {
        template: 'email-verification',
        subject: 'Please verify your email',
      },
      contact_confirmation: {
        template: 'contact-confirmation',
        subject: 'Thank you for contacting us',
      },
      newsletter_welcome: {
        template: 'newsletter-welcome',
        subject: 'Welcome to our newsletter!',
      },
    };

    const config = templates[type];
    if (!config) {
      throw new Error(`Unknown transactional email type: ${type}`);
    }

    return this.sendEmail({
      to,
      subject: config.subject,
      template: config.template,
      templateData: data,
      categories: ['transactional', type],
    });
  }

  async sendBulkEmail(emails: SendEmailOptions[]): Promise<EmailLog[]> {
    const results = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push(result);
      } catch (error) {
        strapi.log.error('Bulk email failed for:', email.to, error);
        results.push({
          id: `failed_${Date.now()}`,
          to: Array.isArray(email.to) ? email.to.join(',') : email.to,
          subject: email.subject,
          status: 'failed' as const,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async logEmail(emailLog: EmailLog) {
    try {
      await strapi.entityService.create('api::email-log.email-log', {
        data: {
          messageId: emailLog.messageId,
          recipient: emailLog.to,
          subject: emailLog.subject,
          template: emailLog.template,
          status: emailLog.status,
          sentAt: emailLog.sentAt,
          error: emailLog.error,
          opens: emailLog.opens || 0,
          clicks: emailLog.clicks || 0,
        },
      });
    } catch (error) {
      strapi.log.error('Failed to log email:', error);
    }
  }

  async getEmailStats(messageId: string): Promise<any> {
    try {
      // This would integrate with SendGrid's Event API
      // For now, return basic info from our logs
      return await strapi.entityService.findMany('api::email-log.email-log', {
        filters: { messageId },
      });
    } catch (error) {
      strapi.log.error('Failed to get email stats:', error);
      return null;
    }
  }

  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Test with SendGrid API
      const testEmail = process.env.SENDGRID_TEST_ADDRESS;
      if (testEmail) {
        await this.sendEmail({
          to: testEmail,
          subject: 'Test Connection',
          text: 'This is a test email to verify SendGrid connection.',
          categories: ['test'],
        });
      }
      return true;
    } catch (error) {
      strapi.log.error('Email connection test failed:', error);
      return false;
    }
  }
}

export default new EmailService();