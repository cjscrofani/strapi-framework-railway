import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
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

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  customFields?: Record<string, any>;
}

interface MarketingCampaignData {
  name: string;
  subject: string;
  content: {
    html?: string;
    text?: string;
    templateId?: string;
    templateData?: Record<string, any>;
  };
  recipients: {
    segmentId?: string;
    tags?: string[];
    customFilter?: Record<string, any>;
  };
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    unsubscribeTag?: string;
  };
}

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private templatePath: string;
  private isInitialized: boolean = false;
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey?: string, fromEmail?: string, fromName?: string, templatesPath?: string, webhookSecret?: string) {
    this.apiKey = apiKey || process.env.SENDGRID_API_KEY;
    this.fromEmail = fromEmail || process.env.SENDGRID_FROM_EMAIL;
    this.fromName = fromName || process.env.SENDGRID_FROM_NAME || 'Strapi App';
    this.templatePath = templatesPath || process.env.EMAIL_TEMPLATE_PATH || './email-templates';
    this.initialize();
  }

  private async initialize() {
    if (!this.apiKey) {
      if (typeof strapi !== 'undefined') {
        strapi.log.warn('SendGrid API key not found. Email service will not work.');
      }
      return;
    }

    try {
      sgMail.setApiKey(this.apiKey);
      sgClient.setApiKey(this.apiKey);
      await this.loadTemplates();
      this.isInitialized = true;
      if (typeof strapi !== 'undefined') {
        strapi.log.info('Email service initialized successfully');
      }
    } catch (error) {
      if (typeof strapi !== 'undefined') {
        strapi.log.error('Failed to initialize email service:', error);
      }
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

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      return { success: false, message: 'Email service not initialized' };
    }

    try {
      // Test with SendGrid API - just test the API key validity
      const request = {
        url: '/v3/user/account',
        method: 'GET' as const,
      };
      
      await sgClient.request(request);
      return { success: true, message: 'SendGrid connection successful' };
    } catch (error) {
      return { success: false, message: `SendGrid connection failed: ${error.message}` };
    }
  }

  // Contact Management Methods
  async addContact(contact: ContactData): Promise<any> {
    try {
      const request = {
        url: '/v3/marketing/contacts',
        method: 'PUT' as const,
        body: {
          contacts: [{
            email: contact.email,
            first_name: contact.firstName,
            last_name: contact.lastName,
            custom_fields: contact.customFields,
          }],
        },
      };

      const [response] = await sgClient.request(request);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to add contact: ${error.message}`);
    }
  }

  async updateContact(email: string, updates: Partial<ContactData>): Promise<any> {
    try {
      const request = {
        url: '/v3/marketing/contacts',
        method: 'PUT' as const,
        body: {
          contacts: [{
            email: updates.email || email,
            first_name: updates.firstName,
            last_name: updates.lastName,
            custom_fields: updates.customFields,
          }],
        },
      };

      const [response] = await sgClient.request(request);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  async getContact(email: string): Promise<any> {
    try {
      const request = {
        url: `/v3/marketing/contacts/search`,
        method: 'POST' as const,
        body: {
          query: `email = '${email}'`,
        },
      };

      const [response] = await sgClient.request(request);
      const contacts = response.body.result;
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      throw new Error(`Failed to get contact: ${error.message}`);
    }
  }

  async unsubscribeContact(email: string): Promise<any> {
    try {
      // Add to suppression list
      const request = {
        url: '/v3/asm/suppressions/global',
        method: 'POST' as const,
        body: {
          recipient_emails: [email],
        },
      };

      const [response] = await sgClient.request(request);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to unsubscribe contact: ${error.message}`);
    }
  }

  // Marketing Campaign Methods
  async createMarketingCampaign(campaign: MarketingCampaignData): Promise<{ id: string }> {
    try {
      // Create campaign
      const request = {
        url: '/v3/marketing/campaigns',
        method: 'POST' as const,
        body: {
          name: campaign.name,
          send_to: campaign.recipients,
          email_config: {
            subject: campaign.subject,
            html_content: campaign.content.html,
            plain_content: campaign.content.text,
            sender_id: await this.getDefaultSenderId(),
            suppression_group_id: await this.getDefaultSuppressionGroupId(),
          },
        },
      };

      const [response] = await sgClient.request(request);
      return { id: response.body.id };
    } catch (error) {
      throw new Error(`Failed to create marketing campaign: ${error.message}`);
    }
  }

  async sendMarketingCampaign(campaignId: string): Promise<any> {
    try {
      const request = {
        url: `/v3/marketing/campaigns/${campaignId}/schedules/now`,
        method: 'PUT' as const,
      };

      const [response] = await sgClient.request(request);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to send marketing campaign: ${error.message}`);
    }
  }

  async createTemplate(name: string, content: { html: string; text?: string }): Promise<string> {
    try {
      const request = {
        url: '/v3/templates',
        method: 'POST' as const,
        body: {
          name,
          generation: 'dynamic',
        },
      };

      const [response] = await sgClient.request(request);
      const templateId = response.body.id;

      // Create template version
      const versionRequest = {
        url: `/v3/templates/${templateId}/versions`,
        method: 'POST' as const,
        body: {
          name: `${name} v1`,
          subject: '{{subject}}',
          html_content: content.html,
          plain_content: content.text,
          active: 1,
        },
      };

      await sgClient.request(versionRequest);
      return templateId;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async createAutomation(automation: any): Promise<string> {
    // SendGrid Automation API implementation
    // This is a placeholder - actual implementation would depend on specific automation requirements
    throw new Error('SendGrid automation creation not fully implemented');
  }

  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      const request = {
        url: `/v3/stats?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
        method: 'GET' as const,
      };

      const [response] = await sgClient.request(request);
      return this.processAnalytics(response.body);
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // Private helper methods
  private async getDefaultSenderId(): Promise<number> {
    try {
      const request = {
        url: '/v3/marketing/senders',
        method: 'GET' as const,
      };

      const [response] = await sgClient.request(request);
      const senders = response.body.results;
      
      if (senders && senders.length > 0) {
        return senders[0].id;
      }
      
      throw new Error('No verified senders found');
    } catch (error) {
      throw new Error(`Failed to get sender ID: ${error.message}`);
    }
  }

  private async getDefaultSuppressionGroupId(): Promise<number> {
    try {
      const request = {
        url: '/v3/asm/groups',
        method: 'GET' as const,
      };

      const [response] = await sgClient.request(request);
      const groups = response.body;
      
      if (groups && groups.length > 0) {
        return groups[0].id;
      }
      
      // Create a default suppression group if none exists
      const createRequest = {
        url: '/v3/asm/groups',
        method: 'POST' as const,
        body: {
          name: 'Marketing Emails',
          description: 'General marketing and promotional emails',
          is_default: true,
        },
      };

      const [createResponse] = await sgClient.request(createRequest);
      return createResponse.body.id;
    } catch (error) {
      throw new Error(`Failed to get suppression group ID: ${error.message}`);
    }
  }

  private processAnalytics(data: any): any {
    // Process SendGrid analytics data
    const stats = data[0]?.stats || {};
    
    return {
      campaigns: {
        total: stats.length || 0,
        sent: stats.reduce((acc: number, stat: any) => acc + (stat.metrics?.delivered || 0), 0),
        opens: stats.reduce((acc: number, stat: any) => acc + (stat.metrics?.unique_opens || 0), 0),
        clicks: stats.reduce((acc: number, stat: any) => acc + (stat.metrics?.unique_clicks || 0), 0),
        bounces: stats.reduce((acc: number, stat: any) => acc + (stat.metrics?.bounces || 0), 0),
        unsubscribes: stats.reduce((acc: number, stat: any) => acc + (stat.metrics?.unsubscribes || 0), 0),
        openRate: 0, // Calculate based on above
        clickRate: 0, // Calculate based on above
        bounceRate: 0, // Calculate based on above
        unsubscribeRate: 0, // Calculate based on above
      },
      audience: {
        totalContacts: 0, // Would need additional API call
        activeContacts: 0, // Would need additional API call
      },
    };
  }
}

export default new EmailService();