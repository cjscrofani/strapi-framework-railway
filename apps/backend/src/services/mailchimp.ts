/**
 * MailChimp Marketing API Integration Service
 * Handles audience management, campaigns, and automation workflows
 */

import mailchimp from '@mailchimp/mailchimp_marketing';

export interface MailChimpConfig {
  apiKey: string;
  server: string; // e.g., 'us1', 'us2', etc.
  defaultAudienceId: string;
}

export interface MailChimpSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  tags?: string[];
  mergeFields?: Record<string, any>;
  interests?: Record<string, boolean>;
  location?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    timezone?: string;
  };
}

export interface MailChimpCampaign {
  id?: string;
  type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variate';
  recipients: {
    listId: string;
    segmentOpts?: any;
  };
  settings: {
    subjectLine: string;
    title: string;
    fromName: string;
    replyTo: string;
    previewText?: string;
    templateId?: number;
    folderId?: string;
  };
  content?: {
    html?: string;
    plain_text?: string;
    template?: {
      id: number;
      sections?: Record<string, any>;
    };
  };
  tracking?: {
    opens: boolean;
    htmlClicks: boolean;
    textClicks: boolean;
    goalTracking: boolean;
    ecomm360: boolean;
    googleAnalytics?: string;
    clicktale?: string;
    salesforce?: any;
    capsule?: any;
  };
}

export interface MailChimpAutomationWorkflow {
  id?: string;
  recipients: {
    listId: string;
    storeId?: string;
  };
  settings: {
    title: string;
    fromName: string;
    replyTo: string;
    authenticate: boolean;
    autoFooter: boolean;
    inlineCss: boolean;
  };
  triggerSettings: {
    workflowType: 'emailSeries' | 'dateAdded' | 'api' | 'welcomeSeries' | 'groupAdd' | 'groupRemove' | 'mandrill' | 'signup' | 'recurring';
    workflowEmailsCount?: number;
    sendImmediately?: boolean;
    triggerOnImport?: boolean;
    runtime?: {
      days?: string[];
      hours?: {
        type: 'send_between' | 'send_at';
        start?: string;
        end?: string;
      };
    };
  };
}

export interface MailChimpStats {
  campaigns: {
    total: number;
    sent: number;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  audience: {
    memberCount: number;
    subscribedCount: number;
    unsubscribedCount: number;
    cleanedCount: number;
    pendingCount: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  automation: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalEmails: number;
    emailsSent: number;
  };
}

class MailChimpService {
  private config: MailChimpConfig;
  private client: typeof mailchimp;

  constructor(config: MailChimpConfig) {
    this.config = config;
    this.client = mailchimp;
    
    // Configure MailChimp client
    this.client.setConfig({
      apiKey: config.apiKey,
      server: config.server,
    });
  }

  // Audience Management
  async addSubscriber(subscriber: MailChimpSubscriber, audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      
      const memberData = {
        email_address: subscriber.email,
        status: subscriber.status,
        merge_fields: {
          FNAME: subscriber.firstName || '',
          LNAME: subscriber.lastName || '',
          ...subscriber.mergeFields,
        },
        interests: subscriber.interests || {},
        location: subscriber.location || {},
        tags: subscriber.tags || [],
      };

      const response = await this.client.lists.addListMember(listId, memberData);
      
      // Add tags if specified
      if (subscriber.tags && subscriber.tags.length > 0) {
        await this.addTagsToMember(subscriber.email, subscriber.tags, listId);
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to add subscriber: ${error.message}`);
    }
  }

  async updateSubscriber(email: string, updates: Partial<MailChimpSubscriber>, audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      const subscriberHash = this.getEmailHash(email);
      
      const updateData = {
        email_address: updates.email || email,
        status_if_new: updates.status || 'subscribed',
        merge_fields: {
          FNAME: updates.firstName || '',
          LNAME: updates.lastName || '',
          ...updates.mergeFields,
        },
        interests: updates.interests || {},
        location: updates.location || {},
      };

      const response = await this.client.lists.setListMember(listId, subscriberHash, updateData);
      
      // Update tags if specified
      if (updates.tags && updates.tags.length > 0) {
        await this.addTagsToMember(email, updates.tags, listId);
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to update subscriber: ${error.message}`);
    }
  }

  async removeSubscriber(email: string, audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      const subscriberHash = this.getEmailHash(email);
      
      return await this.client.lists.deleteListMember(listId, subscriberHash);
    } catch (error) {
      throw new Error(`Failed to remove subscriber: ${error.message}`);
    }
  }

  async getSubscriber(email: string, audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      const subscriberHash = this.getEmailHash(email);
      
      return await this.client.lists.getListMember(listId, subscriberHash);
    } catch (error) {
      if (error.status === 404) {
        return null; // Subscriber not found
      }
      throw new Error(`Failed to get subscriber: ${error.message}`);
    }
  }

  async getAudienceStats(audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      return await this.client.lists.getList(listId);
    } catch (error) {
      throw new Error(`Failed to get audience stats: ${error.message}`);
    }
  }

  // Tag Management
  async addTagsToMember(email: string, tags: string[], audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      const subscriberHash = this.getEmailHash(email);
      
      const tagData = {
        tags: tags.map(tag => ({ name: tag, status: 'active' })),
      };

      return await this.client.lists.updateListMemberTags(listId, subscriberHash, tagData);
    } catch (error) {
      throw new Error(`Failed to add tags: ${error.message}`);
    }
  }

  async removeTagsFromMember(email: string, tags: string[], audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      const subscriberHash = this.getEmailHash(email);
      
      const tagData = {
        tags: tags.map(tag => ({ name: tag, status: 'inactive' })),
      };

      return await this.client.lists.updateListMemberTags(listId, subscriberHash, tagData);
    } catch (error) {
      throw new Error(`Failed to remove tags: ${error.message}`);
    }
  }

  // Campaign Management
  async createCampaign(campaign: MailChimpCampaign): Promise<any> {
    try {
      const campaignData = {
        type: campaign.type,
        recipients: campaign.recipients,
        settings: campaign.settings,
      };

      const createdCampaign = await this.client.campaigns.create(campaignData);
      
      // Set content if provided
      if (campaign.content) {
        await this.client.campaigns.setContent(createdCampaign.id, campaign.content);
      }

      return createdCampaign;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async sendCampaign(campaignId: string): Promise<any> {
    try {
      return await this.client.campaigns.send(campaignId);
    } catch (error) {
      throw new Error(`Failed to send campaign: ${error.message}`);
    }
  }

  async scheduleCampaign(campaignId: string, scheduleTime: string): Promise<any> {
    try {
      return await this.client.campaigns.schedule(campaignId, { schedule_time: scheduleTime });
    } catch (error) {
      throw new Error(`Failed to schedule campaign: ${error.message}`);
    }
  }

  async getCampaignStats(campaignId: string): Promise<any> {
    try {
      return await this.client.reports.getCampaignReport(campaignId);
    } catch (error) {
      throw new Error(`Failed to get campaign stats: ${error.message}`);
    }
  }

  // Automation Workflows
  async createAutomation(workflow: MailChimpAutomationWorkflow): Promise<any> {
    try {
      return await this.client.automations.create(workflow);
    } catch (error) {
      throw new Error(`Failed to create automation: ${error.message}`);
    }
  }

  async startAutomation(workflowId: string): Promise<any> {
    try {
      return await this.client.automations.start(workflowId);
    } catch (error) {
      throw new Error(`Failed to start automation: ${error.message}`);
    }
  }

  async pauseAutomation(workflowId: string): Promise<any> {
    try {
      return await this.client.automations.pause(workflowId);
    } catch (error) {
      throw new Error(`Failed to pause automation: ${error.message}`);
    }
  }

  async getAutomationStats(workflowId: string): Promise<any> {
    try {
      return await this.client.reports.getAutomationReport(workflowId);
    } catch (error) {
      throw new Error(`Failed to get automation stats: ${error.message}`);
    }
  }

  // Template Management
  async getTemplates(): Promise<any> {
    try {
      return await this.client.templates.list();
    } catch (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  async getTemplate(templateId: number): Promise<any> {
    try {
      return await this.client.templates.getTemplate(templateId);
    } catch (error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }
  }

  // Analytics and Reporting
  async getOverallStats(): Promise<MailChimpStats> {
    try {
      const [campaigns, audience, automations] = await Promise.all([
        this.client.campaigns.list(),
        this.client.lists.getList(this.config.defaultAudienceId),
        this.client.automations.list(),
      ]);

      const campaignStats = campaigns.campaigns.reduce((acc, campaign) => {
        if (campaign.status === 'sent') {
          acc.sent += 1;
          acc.opens += campaign.report_summary?.opens || 0;
          acc.clicks += campaign.report_summary?.clicks || 0;
          acc.bounces += campaign.report_summary?.bounces || 0;
          acc.unsubscribes += campaign.report_summary?.unsubscribed || 0;
        }
        return acc;
      }, { sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 });

      return {
        campaigns: {
          total: campaigns.total_items || 0,
          sent: campaignStats.sent,
          opens: campaignStats.opens,
          clicks: campaignStats.clicks,
          bounces: campaignStats.bounces,
          unsubscribes: campaignStats.unsubscribes,
          openRate: campaignStats.sent > 0 ? (campaignStats.opens / campaignStats.sent) * 100 : 0,
          clickRate: campaignStats.sent > 0 ? (campaignStats.clicks / campaignStats.sent) * 100 : 0,
          bounceRate: campaignStats.sent > 0 ? (campaignStats.bounces / campaignStats.sent) * 100 : 0,
          unsubscribeRate: campaignStats.sent > 0 ? (campaignStats.unsubscribes / campaignStats.sent) * 100 : 0,
        },
        audience: {
          memberCount: audience.stats?.member_count || 0,
          subscribedCount: audience.stats?.member_count_since_send || 0,
          unsubscribedCount: audience.stats?.unsubscribe_count_since_send || 0,
          cleanedCount: audience.stats?.cleaned_count_since_send || 0,
          pendingCount: audience.stats?.campaign_count || 0,
          avgOpenRate: audience.stats?.avg_open_rate || 0,
          avgClickRate: audience.stats?.avg_click_rate || 0,
        },
        automation: {
          totalWorkflows: automations.total_items || 0,
          activeWorkflows: automations.automations?.filter(a => a.status === 'sending').length || 0,
          totalEmails: automations.automations?.reduce((acc, auto) => acc + (auto.emails?.length || 0), 0) || 0,
          emailsSent: 0, // This would need additional API calls to calculate
        },
      };
    } catch (error) {
      throw new Error(`Failed to get overall stats: ${error.message}`);
    }
  }

  // Utility Methods
  private getEmailHash(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  // Health Check
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const ping = await this.client.ping.get();
      return {
        success: true,
        message: `MailChimp connection successful: ${ping.health_status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `MailChimp connection failed: ${error.message}`,
      };
    }
  }

  // Batch Operations
  async batchSubscribe(subscribers: MailChimpSubscriber[], audienceId?: string): Promise<any> {
    try {
      const listId = audienceId || this.config.defaultAudienceId;
      
      const operations = subscribers.map(subscriber => ({
        method: 'POST',
        path: `/lists/${listId}/members`,
        body: JSON.stringify({
          email_address: subscriber.email,
          status: subscriber.status,
          merge_fields: {
            FNAME: subscriber.firstName || '',
            LNAME: subscriber.lastName || '',
            ...subscriber.mergeFields,
          },
          interests: subscriber.interests || {},
          location: subscriber.location || {},
        }),
      }));

      return await this.client.batches.start({ operations });
    } catch (error) {
      throw new Error(`Failed to batch subscribe: ${error.message}`);
    }
  }
}

export default MailChimpService;