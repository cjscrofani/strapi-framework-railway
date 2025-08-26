/**
 * Unified Email Marketing Service
 * Manages both SendGrid and MailChimp integrations for comprehensive email marketing
 */

import MailChimpService, { MailChimpConfig, MailChimpSubscriber, MailChimpCampaign } from './mailchimp';
import EmailService from './email';

export interface EmailMarketingConfig {
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    templatesPath?: string;
    webhookSecret?: string;
  };
  mailchimp: MailChimpConfig;
  defaultProvider: 'sendgrid' | 'mailchimp' | 'both';
  syncBetweenProviders: boolean;
  fallbackProvider: 'sendgrid' | 'mailchimp';
}

export interface UnifiedSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'subscribed' | 'unsubscribed' | 'pending' | 'bounced';
  source: 'website' | 'api' | 'import' | 'manual';
  tags?: string[];
  customFields?: Record<string, any>;
  preferences?: {
    newsletter: boolean;
    promotions: boolean;
    updates: boolean;
    blog: boolean;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedCampaign {
  id?: string;
  name: string;
  subject: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
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
  schedule?: {
    sendAt?: Date;
    timezone?: string;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  provider: 'sendgrid' | 'mailchimp' | 'both';
}

export interface MarketingAutomation {
  id?: string;
  name: string;
  description?: string;
  trigger: {
    type: 'welcome' | 'abandoned_cart' | 'birthday' | 'tag_added' | 'custom_date' | 'api_trigger';
    conditions?: Record<string, any>;
    delay?: {
      amount: number;
      unit: 'minutes' | 'hours' | 'days' | 'weeks';
    };
  };
  emails: {
    templateId: string;
    subject: string;
    delay?: {
      amount: number;
      unit: 'minutes' | 'hours' | 'days' | 'weeks';
    };
  }[];
  settings: {
    active: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
    exitConditions?: Record<string, any>;
  };
  provider: 'sendgrid' | 'mailchimp';
}

export interface EmailMarketingAnalytics {
  overview: {
    totalSubscribers: number;
    activeSubscribers: number;
    totalCampaigns: number;
    campaignsSent: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
    averageClickRate: number;
    unsubscribeRate: number;
    bounceRate: number;
  };
  campaigns: {
    id: string;
    name: string;
    sentDate: Date;
    recipients: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
    openRate: number;
    clickRate: number;
    provider: string;
  }[];
  audience: {
    growth: {
      date: Date;
      subscribers: number;
      unsubscribes: number;
      netGrowth: number;
    }[];
    segments: {
      name: string;
      count: number;
      percentage: number;
    }[];
    topLocations: {
      country: string;
      count: number;
      percentage: number;
    }[];
  };
  automations: {
    id: string;
    name: string;
    active: boolean;
    triggered: number;
    completed: number;
    completionRate: number;
    provider: string;
  }[];
}

class EmailMarketingService {
  private config: EmailMarketingConfig;
  private mailchimp: MailChimpService;
  private sendgrid: EmailService;

  constructor(config: EmailMarketingConfig) {
    this.config = config;
    this.mailchimp = new MailChimpService(config.mailchimp);
    this.sendgrid = new EmailService(
      config.sendgrid.apiKey,
      config.sendgrid.fromEmail,
      config.sendgrid.fromName,
      config.sendgrid.templatesPath,
      config.sendgrid.webhookSecret
    );
  }

  // Subscriber Management
  async addSubscriber(subscriber: UnifiedSubscriber): Promise<{ success: boolean; errors?: string[] }> {
    const results: { success: boolean; errors?: string[] } = { success: true, errors: [] };
    
    try {
      // Add to MailChimp
      if (this.config.defaultProvider === 'mailchimp' || this.config.defaultProvider === 'both') {
        try {
          const mailchimpData: MailChimpSubscriber = {
            email: subscriber.email,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            status: subscriber.status === 'subscribed' ? 'subscribed' : 'pending',
            tags: subscriber.tags,
            mergeFields: {
              SOURCE: subscriber.source,
              ...subscriber.customFields,
            },
            location: subscriber.location ? {
              country: subscriber.location.country,
              timezone: subscriber.location.timezone,
            } : undefined,
          };

          await this.mailchimp.addSubscriber(mailchimpData);
        } catch (error) {
          results.errors?.push(`MailChimp: ${error.message}`);
          if (this.config.defaultProvider === 'mailchimp') {
            results.success = false;
          }
        }
      }

      // Add to SendGrid
      if (this.config.defaultProvider === 'sendgrid' || this.config.defaultProvider === 'both') {
        try {
          // SendGrid contact management would go here
          // This is a placeholder for SendGrid Contacts API integration
          await this.sendgrid.addContact({
            email: subscriber.email,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            customFields: subscriber.customFields,
          });
        } catch (error) {
          results.errors?.push(`SendGrid: ${error.message}`);
          if (this.config.defaultProvider === 'sendgrid') {
            results.success = false;
          }
        }
      }

      // Log subscriber addition
      await this.logSubscriberActivity('added', subscriber.email, {
        source: subscriber.source,
        tags: subscriber.tags,
        provider: this.config.defaultProvider,
      });

      return results;
    } catch (error) {
      throw new Error(`Failed to add subscriber: ${error.message}`);
    }
  }

  async updateSubscriber(email: string, updates: Partial<UnifiedSubscriber>): Promise<{ success: boolean; errors?: string[] }> {
    const results: { success: boolean; errors?: string[] } = { success: true, errors: [] };
    
    try {
      // Update in MailChimp
      if (this.config.defaultProvider === 'mailchimp' || this.config.defaultProvider === 'both') {
        try {
          const mailchimpUpdates: Partial<MailChimpSubscriber> = {
            email: updates.email,
            firstName: updates.firstName,
            lastName: updates.lastName,
            status: updates.status === 'subscribed' ? 'subscribed' : 'unsubscribed',
            tags: updates.tags,
            mergeFields: updates.customFields,
            location: updates.location,
          };

          await this.mailchimp.updateSubscriber(email, mailchimpUpdates);
        } catch (error) {
          results.errors?.push(`MailChimp: ${error.message}`);
          if (this.config.defaultProvider === 'mailchimp') {
            results.success = false;
          }
        }
      }

      // Update in SendGrid
      if (this.config.defaultProvider === 'sendgrid' || this.config.defaultProvider === 'both') {
        try {
          // SendGrid contact update would go here
          await this.sendgrid.updateContact(email, updates);
        } catch (error) {
          results.errors?.push(`SendGrid: ${error.message}`);
          if (this.config.defaultProvider === 'sendgrid') {
            results.success = false;
          }
        }
      }

      // Log subscriber update
      await this.logSubscriberActivity('updated', email, updates);

      return results;
    } catch (error) {
      throw new Error(`Failed to update subscriber: ${error.message}`);
    }
  }

  async unsubscribeSubscriber(email: string, reason?: string): Promise<{ success: boolean; errors?: string[] }> {
    const results: { success: boolean; errors?: string[] } = { success: true, errors: [] };
    
    try {
      // Unsubscribe from MailChimp
      if (this.config.defaultProvider === 'mailchimp' || this.config.defaultProvider === 'both') {
        try {
          await this.mailchimp.updateSubscriber(email, { status: 'unsubscribed' });
        } catch (error) {
          results.errors?.push(`MailChimp: ${error.message}`);
        }
      }

      // Unsubscribe from SendGrid
      if (this.config.defaultProvider === 'sendgrid' || this.config.defaultProvider === 'both') {
        try {
          await this.sendgrid.unsubscribeContact(email);
        } catch (error) {
          results.errors?.push(`SendGrid: ${error.message}`);
        }
      }

      // Log unsubscribe
      await this.logSubscriberActivity('unsubscribed', email, { reason });

      return results;
    } catch (error) {
      throw new Error(`Failed to unsubscribe: ${error.message}`);
    }
  }

  async getSubscriber(email: string): Promise<UnifiedSubscriber | null> {
    try {
      let subscriber: UnifiedSubscriber | null = null;

      // Try MailChimp first
      if (this.config.defaultProvider === 'mailchimp' || this.config.defaultProvider === 'both') {
        try {
          const mailchimpSub = await this.mailchimp.getSubscriber(email);
          if (mailchimpSub) {
            subscriber = this.convertMailChimpToUnified(mailchimpSub);
          }
        } catch (error) {
          // Continue to try SendGrid if MailChimp fails
        }
      }

      // Try SendGrid if no result from MailChimp
      if (!subscriber && (this.config.defaultProvider === 'sendgrid' || this.config.defaultProvider === 'both')) {
        try {
          const sendgridSub = await this.sendgrid.getContact(email);
          if (sendgridSub) {
            subscriber = this.convertSendGridToUnified(sendgridSub);
          }
        } catch (error) {
          // Log error but don't throw
        }
      }

      return subscriber;
    } catch (error) {
      throw new Error(`Failed to get subscriber: ${error.message}`);
    }
  }

  // Campaign Management
  async createCampaign(campaign: UnifiedCampaign): Promise<{ success: boolean; campaignId?: string; errors?: string[] }> {
    const results: { success: boolean; campaignId?: string; errors?: string[] } = { success: true, errors: [] };
    
    try {
      if (campaign.provider === 'mailchimp' || campaign.provider === 'both') {
        try {
          const mailchimpCampaign: MailChimpCampaign = {
            type: 'regular',
            recipients: {
              listId: this.config.mailchimp.defaultAudienceId,
            },
            settings: {
              subjectLine: campaign.subject,
              title: campaign.name,
              fromName: campaign.fromName || this.config.sendgrid.fromName,
              replyTo: campaign.replyTo || this.config.sendgrid.fromEmail,
              previewText: campaign.previewText,
            },
            content: {
              html: campaign.content.html,
              plain_text: campaign.content.text,
            },
            tracking: {
              opens: campaign.settings.trackOpens,
              htmlClicks: campaign.settings.trackClicks,
              textClicks: campaign.settings.trackClicks,
              goalTracking: false,
              ecomm360: false,
            },
          };

          const created = await this.mailchimp.createCampaign(mailchimpCampaign);
          results.campaignId = created.id;
        } catch (error) {
          results.errors?.push(`MailChimp: ${error.message}`);
          if (campaign.provider === 'mailchimp') {
            results.success = false;
          }
        }
      }

      if (campaign.provider === 'sendgrid' || campaign.provider === 'both') {
        try {
          // SendGrid campaign creation would go here
          // This would use SendGrid Marketing Campaigns API
          const sendgridCampaign = await this.sendgrid.createMarketingCampaign({
            name: campaign.name,
            subject: campaign.subject,
            content: campaign.content,
            recipients: campaign.recipients,
            settings: campaign.settings,
          });
          
          if (!results.campaignId) {
            results.campaignId = sendgridCampaign.id;
          }
        } catch (error) {
          results.errors?.push(`SendGrid: ${error.message}`);
          if (campaign.provider === 'sendgrid') {
            results.success = false;
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async sendCampaign(campaignId: string, provider: 'sendgrid' | 'mailchimp'): Promise<{ success: boolean; errors?: string[] }> {
    const results: { success: boolean; errors?: string[] } = { success: true, errors: [] };
    
    try {
      if (provider === 'mailchimp') {
        await this.mailchimp.sendCampaign(campaignId);
      } else if (provider === 'sendgrid') {
        await this.sendgrid.sendMarketingCampaign(campaignId);
      }

      // Log campaign send
      await this.logCampaignActivity('sent', campaignId, { provider });

      return results;
    } catch (error) {
      results.success = false;
      results.errors = [error.message];
      return results;
    }
  }

  // Analytics and Reporting
  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<EmailMarketingAnalytics> {
    try {
      const [mailchimpStats, sendgridStats] = await Promise.all([
        this.mailchimp.getOverallStats(),
        this.sendgrid.getAnalytics(dateRange),
      ]);

      // Combine analytics from both providers
      const analytics: EmailMarketingAnalytics = {
        overview: {
          totalSubscribers: mailchimpStats.audience.memberCount + (sendgridStats.audience?.totalContacts || 0),
          activeSubscribers: mailchimpStats.audience.subscribedCount + (sendgridStats.audience?.activeContacts || 0),
          totalCampaigns: mailchimpStats.campaigns.total + (sendgridStats.campaigns?.total || 0),
          campaignsSent: mailchimpStats.campaigns.sent + (sendgridStats.campaigns?.sent || 0),
          totalOpens: mailchimpStats.campaigns.opens + (sendgridStats.campaigns?.opens || 0),
          totalClicks: mailchimpStats.campaigns.clicks + (sendgridStats.campaigns?.clicks || 0),
          averageOpenRate: (mailchimpStats.campaigns.openRate + (sendgridStats.campaigns?.openRate || 0)) / 2,
          averageClickRate: (mailchimpStats.campaigns.clickRate + (sendgridStats.campaigns?.clickRate || 0)) / 2,
          unsubscribeRate: (mailchimpStats.campaigns.unsubscribeRate + (sendgridStats.campaigns?.unsubscribeRate || 0)) / 2,
          bounceRate: (mailchimpStats.campaigns.bounceRate + (sendgridStats.campaigns?.bounceRate || 0)) / 2,
        },
        campaigns: [], // Would need to fetch and combine campaign details
        audience: {
          growth: [], // Would need to fetch growth data
          segments: [], // Would need to fetch segment data
          topLocations: [], // Would need to fetch location data
        },
        automations: [], // Would need to fetch automation data
      };

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // Template Management
  async createTemplate(name: string, content: { html: string; text?: string }, provider: 'sendgrid' | 'mailchimp' = 'sendgrid'): Promise<string> {
    try {
      if (provider === 'sendgrid') {
        return await this.sendgrid.createTemplate(name, content);
      } else {
        // MailChimp template creation would go here
        throw new Error('MailChimp template creation not implemented');
      }
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  // Automation Workflows
  async createAutomation(automation: MarketingAutomation): Promise<string> {
    try {
      if (automation.provider === 'mailchimp') {
        // Create MailChimp automation workflow
        const workflow = await this.mailchimp.createAutomation({
          recipients: {
            listId: this.config.mailchimp.defaultAudienceId,
          },
          settings: {
            title: automation.name,
            fromName: this.config.sendgrid.fromName,
            replyTo: this.config.sendgrid.fromEmail,
            authenticate: true,
            autoFooter: true,
            inlineCss: true,
          },
          triggerSettings: {
            workflowType: automation.trigger.type === 'welcome' ? 'signup' : 'api',
            sendImmediately: !automation.trigger.delay,
            triggerOnImport: false,
          },
        });

        return workflow.id;
      } else {
        // SendGrid automation would go here
        return await this.sendgrid.createAutomation(automation);
      }
    } catch (error) {
      throw new Error(`Failed to create automation: ${error.message}`);
    }
  }

  // Health Check
  async healthCheck(): Promise<{ sendgrid: boolean; mailchimp: boolean; overall: boolean }> {
    try {
      const [sendgridHealth, mailchimpHealth] = await Promise.all([
        this.sendgrid.testConnection(),
        this.mailchimp.testConnection(),
      ]);

      return {
        sendgrid: sendgridHealth.success,
        mailchimp: mailchimpHealth.success,
        overall: sendgridHealth.success || mailchimpHealth.success,
      };
    } catch (error) {
      return {
        sendgrid: false,
        mailchimp: false,
        overall: false,
      };
    }
  }

  // Private Helper Methods
  private convertMailChimpToUnified(mailchimpData: any): UnifiedSubscriber {
    return {
      email: mailchimpData.email_address,
      firstName: mailchimpData.merge_fields?.FNAME,
      lastName: mailchimpData.merge_fields?.LNAME,
      status: mailchimpData.status,
      source: mailchimpData.merge_fields?.SOURCE || 'unknown',
      tags: mailchimpData.tags?.map((tag: any) => tag.name) || [],
      customFields: mailchimpData.merge_fields,
      location: mailchimpData.location,
      createdAt: new Date(mailchimpData.timestamp_opt),
      updatedAt: new Date(mailchimpData.last_changed),
    };
  }

  private convertSendGridToUnified(sendgridData: any): UnifiedSubscriber {
    return {
      email: sendgridData.email,
      firstName: sendgridData.first_name,
      lastName: sendgridData.last_name,
      status: sendgridData.list_ids?.length > 0 ? 'subscribed' : 'unsubscribed',
      source: sendgridData.custom_fields?.source || 'unknown',
      tags: sendgridData.list_ids || [],
      customFields: sendgridData.custom_fields,
      createdAt: new Date(sendgridData.created_at),
      updatedAt: new Date(sendgridData.updated_at),
    };
  }

  private async logSubscriberActivity(action: string, email: string, data: any): Promise<void> {
    // This would log to your database or logging system
    console.log(`Subscriber ${action}:`, { email, data, timestamp: new Date() });
  }

  private async logCampaignActivity(action: string, campaignId: string, data: any): Promise<void> {
    // This would log to your database or logging system
    console.log(`Campaign ${action}:`, { campaignId, data, timestamp: new Date() });
  }
}

export default EmailMarketingService;