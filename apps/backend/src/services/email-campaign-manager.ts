/**
 * Email Campaign Manager
 * Manages scheduled campaigns, automated workflows, and campaign analytics
 */

import cron from 'node-cron';
import EmailMarketingService, { UnifiedCampaign, MarketingAutomation } from './email-marketing';

export interface ScheduledCampaign {
  id: string;
  campaignId: string;
  name: string;
  scheduledAt: Date;
  status: 'scheduled' | 'sent' | 'cancelled' | 'failed';
  provider: 'sendgrid' | 'mailchimp';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  spam_reports: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  spamRate: number;
  lastUpdated: Date;
}

export interface AutomationTrigger {
  id: string;
  automationId: string;
  triggerType: 'welcome' | 'abandoned_cart' | 'birthday' | 'tag_added' | 'custom_date' | 'api_trigger';
  subscriberEmail: string;
  triggerData: Record<string, any>;
  scheduledAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  processedAt?: Date;
}

class EmailCampaignManager {
  private emailMarketing: EmailMarketingService;
  private scheduledCampaigns: Map<string, ScheduledCampaign> = new Map();
  private campaignMetrics: Map<string, CampaignMetrics> = new Map();
  private automationTriggers: Map<string, AutomationTrigger> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(emailMarketing: EmailMarketingService) {
    this.emailMarketing = emailMarketing;
    this.startScheduleChecker();
    this.startAutomationProcessor();
    this.startMetricsCollector();
  }

  // Campaign Scheduling
  async scheduleCampaign(
    campaign: UnifiedCampaign,
    scheduledAt: Date,
    maxRetries: number = 3
  ): Promise<string> {
    try {
      // Create the campaign
      const result = await this.emailMarketing.createCampaign(campaign);
      
      if (!result.success || !result.campaignId) {
        throw new Error(`Failed to create campaign: ${result.errors?.join(', ')}`);
      }

      const scheduledCampaign: ScheduledCampaign = {
        id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId: result.campaignId,
        name: campaign.name,
        scheduledAt,
        status: 'scheduled',
        provider: campaign.provider,
        retryCount: 0,
        maxRetries,
        createdAt: new Date(),
      };

      this.scheduledCampaigns.set(scheduledCampaign.id, scheduledCampaign);
      
      // Schedule cron job
      this.scheduleExecutionJob(scheduledCampaign);

      // Persist to database
      await this.saveScheduledCampaign(scheduledCampaign);

      return scheduledCampaign.id;
    } catch (error) {
      throw new Error(`Failed to schedule campaign: ${error.message}`);
    }
  }

  async cancelScheduledCampaign(scheduledCampaignId: string): Promise<boolean> {
    try {
      const campaign = this.scheduledCampaigns.get(scheduledCampaignId);
      if (!campaign) {
        throw new Error('Scheduled campaign not found');
      }

      if (campaign.status !== 'scheduled') {
        throw new Error('Can only cancel scheduled campaigns');
      }

      // Cancel cron job
      const cronJob = this.cronJobs.get(scheduledCampaignId);
      if (cronJob) {
        cronJob.stop();
        this.cronJobs.delete(scheduledCampaignId);
      }

      // Update status
      campaign.status = 'cancelled';
      this.scheduledCampaigns.set(scheduledCampaignId, campaign);

      // Update database
      await this.updateScheduledCampaign(campaign);

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel campaign: ${error.message}`);
    }
  }

  async getScheduledCampaigns(): Promise<ScheduledCampaign[]> {
    return Array.from(this.scheduledCampaigns.values());
  }

  // Campaign Execution
  private async executeCampaign(scheduledCampaign: ScheduledCampaign): Promise<void> {
    try {
      const result = await this.emailMarketing.sendCampaign(
        scheduledCampaign.campaignId,
        scheduledCampaign.provider
      );

      if (result.success) {
        scheduledCampaign.status = 'sent';
        scheduledCampaign.sentAt = new Date();
      } else {
        throw new Error(result.errors?.join(', ') || 'Unknown error');
      }
    } catch (error) {
      scheduledCampaign.retryCount += 1;
      scheduledCampaign.error = error.message;

      if (scheduledCampaign.retryCount >= scheduledCampaign.maxRetries) {
        scheduledCampaign.status = 'failed';
      } else {
        // Reschedule with exponential backoff
        const backoffMinutes = Math.pow(2, scheduledCampaign.retryCount) * 5;
        const retryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        scheduledCampaign.scheduledAt = retryAt;
        this.scheduleExecutionJob(scheduledCampaign);
      }
    }

    // Update campaign
    this.scheduledCampaigns.set(scheduledCampaign.id, scheduledCampaign);
    await this.updateScheduledCampaign(scheduledCampaign);
  }

  private scheduleExecutionJob(campaign: ScheduledCampaign): void {
    const cronExpression = this.dateToCron(campaign.scheduledAt);
    
    const job = cron.schedule(cronExpression, async () => {
      await this.executeCampaign(campaign);
      job.stop();
      this.cronJobs.delete(campaign.id);
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    this.cronJobs.set(campaign.id, job);
  }

  // Automation Management
  async createAutomation(automation: MarketingAutomation): Promise<string> {
    try {
      const automationId = await this.emailMarketing.createAutomation(automation);
      
      // Save automation configuration
      await this.saveAutomation(automationId, automation);
      
      return automationId;
    } catch (error) {
      throw new Error(`Failed to create automation: ${error.message}`);
    }
  }

  async triggerAutomation(
    automationId: string,
    triggerType: AutomationTrigger['triggerType'],
    subscriberEmail: string,
    triggerData: Record<string, any> = {},
    delay?: { amount: number; unit: 'minutes' | 'hours' | 'days' | 'weeks' }
  ): Promise<string> {
    try {
      let scheduledAt = new Date();
      
      if (delay) {
        const multipliers = { minutes: 1, hours: 60, days: 1440, weeks: 10080 };
        const delayMinutes = delay.amount * multipliers[delay.unit];
        scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
      }

      const trigger: AutomationTrigger = {
        id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        automationId,
        triggerType,
        subscriberEmail,
        triggerData,
        scheduledAt,
        status: 'pending',
        createdAt: new Date(),
      };

      this.automationTriggers.set(trigger.id, trigger);
      await this.saveAutomationTrigger(trigger);

      return trigger.id;
    } catch (error) {
      throw new Error(`Failed to trigger automation: ${error.message}`);
    }
  }

  // Analytics and Metrics
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    try {
      // Try to get from cache first
      let metrics = this.campaignMetrics.get(campaignId);
      
      if (!metrics || this.isMetricsStale(metrics)) {
        // Fetch fresh metrics
        const analytics = await this.emailMarketing.getAnalytics();
        const campaignData = analytics.campaigns.find(c => c.id === campaignId);
        
        if (campaignData) {
          metrics = {
            campaignId,
            sent: campaignData.recipients,
            delivered: campaignData.recipients - campaignData.bounces,
            opens: campaignData.opens,
            clicks: campaignData.clicks,
            bounces: campaignData.bounces,
            unsubscribes: campaignData.unsubscribes,
            spam_reports: 0, // Would need specific API call
            openRate: campaignData.openRate,
            clickRate: campaignData.clickRate,
            deliveryRate: ((campaignData.recipients - campaignData.bounces) / campaignData.recipients) * 100,
            bounceRate: (campaignData.bounces / campaignData.recipients) * 100,
            unsubscribeRate: (campaignData.unsubscribes / campaignData.recipients) * 100,
            spamRate: 0, // Would need specific API call
            lastUpdated: new Date(),
          };

          this.campaignMetrics.set(campaignId, metrics);
          await this.saveCampaignMetrics(metrics);
        }
      }

      return metrics || null;
    } catch (error) {
      throw new Error(`Failed to get campaign metrics: ${error.message}`);
    }
  }

  async getOverallAnalytics(): Promise<any> {
    try {
      return await this.emailMarketing.getAnalytics();
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // A/B Testing
  async createABTest(
    campaignA: UnifiedCampaign,
    campaignB: UnifiedCampaign,
    testPercentage: number = 20,
    winnerCriteria: 'open_rate' | 'click_rate' = 'open_rate',
    testDuration: number = 24 // hours
  ): Promise<{ testId: string; campaignAId: string; campaignBId: string }> {
    try {
      // Create both campaigns
      const [resultA, resultB] = await Promise.all([
        this.emailMarketing.createCampaign(campaignA),
        this.emailMarketing.createCampaign(campaignB),
      ]);

      if (!resultA.success || !resultB.success) {
        throw new Error('Failed to create A/B test campaigns');
      }

      const testId = `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store A/B test configuration
      await this.saveABTest({
        id: testId,
        campaignAId: resultA.campaignId!,
        campaignBId: resultB.campaignId!,
        testPercentage,
        winnerCriteria,
        testDuration,
        status: 'active',
        createdAt: new Date(),
      });

      // Schedule winner selection
      setTimeout(async () => {
        await this.selectABTestWinner(testId);
      }, testDuration * 60 * 60 * 1000);

      return {
        testId,
        campaignAId: resultA.campaignId!,
        campaignBId: resultB.campaignId!,
      };
    } catch (error) {
      throw new Error(`Failed to create A/B test: ${error.message}`);
    }
  }

  private async selectABTestWinner(testId: string): Promise<void> {
    // Implementation would compare metrics and select winner
    // Then send the winning campaign to the remaining audience
  }

  // Background Processors
  private startScheduleChecker(): void {
    // Check for scheduled campaigns every minute
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const pendingCampaigns = Array.from(this.scheduledCampaigns.values())
        .filter(c => c.status === 'scheduled' && c.scheduledAt <= now);

      for (const campaign of pendingCampaigns) {
        await this.executeCampaign(campaign);
      }
    });
  }

  private startAutomationProcessor(): void {
    // Process automation triggers every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      const now = new Date();
      const pendingTriggers = Array.from(this.automationTriggers.values())
        .filter(t => t.status === 'pending' && t.scheduledAt <= now);

      for (const trigger of pendingTriggers) {
        await this.processAutomationTrigger(trigger);
      }
    });
  }

  private startMetricsCollector(): void {
    // Collect metrics every hour
    cron.schedule('0 * * * *', async () => {
      const campaigns = await this.getRecentCampaigns();
      for (const campaign of campaigns) {
        await this.getCampaignMetrics(campaign.id);
      }
    });
  }

  private async processAutomationTrigger(trigger: AutomationTrigger): Promise<void> {
    try {
      // Implementation would depend on the automation type
      // This is a placeholder for the automation execution logic
      
      trigger.status = 'sent';
      trigger.processedAt = new Date();
      
      this.automationTriggers.set(trigger.id, trigger);
      await this.updateAutomationTrigger(trigger);
    } catch (error) {
      trigger.status = 'failed';
      this.automationTriggers.set(trigger.id, trigger);
      await this.updateAutomationTrigger(trigger);
    }
  }

  // Utility Methods
  private dateToCron(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  private isMetricsStale(metrics: CampaignMetrics): boolean {
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    return Date.now() - metrics.lastUpdated.getTime() > staleThreshold;
  }

  // Database Operations (placeholder implementations)
  private async saveScheduledCampaign(campaign: ScheduledCampaign): Promise<void> {
    // Implementation would save to your database
    console.log('Saving scheduled campaign:', campaign.id);
  }

  private async updateScheduledCampaign(campaign: ScheduledCampaign): Promise<void> {
    // Implementation would update in your database
    console.log('Updating scheduled campaign:', campaign.id);
  }

  private async saveAutomation(id: string, automation: MarketingAutomation): Promise<void> {
    // Implementation would save to your database
    console.log('Saving automation:', id);
  }

  private async saveAutomationTrigger(trigger: AutomationTrigger): Promise<void> {
    // Implementation would save to your database
    console.log('Saving automation trigger:', trigger.id);
  }

  private async updateAutomationTrigger(trigger: AutomationTrigger): Promise<void> {
    // Implementation would update in your database
    console.log('Updating automation trigger:', trigger.id);
  }

  private async saveCampaignMetrics(metrics: CampaignMetrics): Promise<void> {
    // Implementation would save to your database
    console.log('Saving campaign metrics:', metrics.campaignId);
  }

  private async saveABTest(test: any): Promise<void> {
    // Implementation would save to your database
    console.log('Saving A/B test:', test.id);
  }

  private async getRecentCampaigns(): Promise<{ id: string }[]> {
    // Implementation would fetch recent campaigns from your database
    return [];
  }

  // Cleanup
  async stop(): Promise<void> {
    // Stop all cron jobs
    for (const job of this.cronJobs.values()) {
      job.stop();
    }
    this.cronJobs.clear();
  }
}

export default EmailCampaignManager;