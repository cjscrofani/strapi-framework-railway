import crypto from 'crypto';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  'sg_event_id': string;
  'sg_message_id': string;
  useragent?: string;
  ip?: string;
  url?: string;
  category?: string[];
  asm_group_id?: number;
  reason?: string;
  status?: string;
  response?: string;
  attempt?: string;
  type?: string;
  bounce_classification?: string;
  smtp_id?: string;
}

export default {
  async handleSendGridWebhook(ctx) {
    const signature = ctx.request.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = ctx.request.headers['x-twilio-email-event-webhook-timestamp'];
    const body = ctx.request.body;

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      if (!this.verifySignature(body, signature, timestamp, webhookSecret)) {
        strapi.log.warn('Invalid SendGrid webhook signature');
        return ctx.unauthorized('Invalid webhook signature');
      }
    }

    try {
      const events = Array.isArray(body) ? body : [body];
      const processedEvents = [];

      for (const event of events) {
        try {
          const processedEvent = await this.processEvent(event);
          if (processedEvent) {
            processedEvents.push(processedEvent);
          }
        } catch (error) {
          strapi.log.error('Error processing webhook event:', error, event);
        }
      }

      strapi.log.info(`Processed ${processedEvents.length} webhook events`);

      ctx.body = {
        success: true,
        processed: processedEvents.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      strapi.log.error('SendGrid webhook error:', error);
      ctx.throw(500, 'Webhook processing failed');
    }
  },

  verifySignature(payload: any, signature: string, timestamp: string, secret: string): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const timestampPayload = timestamp + payloadString;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(timestampPayload, 'utf8')
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      strapi.log.error('Signature verification error:', error);
      return false;
    }
  },

  async processEvent(event: SendGridEvent) {
    const {
      email,
      timestamp,
      event: eventType,
      sg_event_id: eventId,
      sg_message_id: messageId,
      useragent,
      ip,
      url,
      category,
      asm_group_id: asmGroupId,
      reason,
      status,
      response,
      bounce_classification: bounceClassification,
    } = event;

    // Find existing email log
    let emailLog = await strapi.entityService.findMany('api::email-log.email-log', {
      filters: {
        $or: [
          { messageId: messageId },
          { recipient: email, sendgridEventId: eventId },
        ],
      },
    });

    emailLog = emailLog[0]; // Get first match

    if (!emailLog) {
      // Create new email log if not found
      emailLog = await strapi.entityService.create('api::email-log.email-log', {
        data: {
          messageId,
          recipient: email,
          subject: 'Unknown', // Will be updated if we have more info
          status: this.mapEventToStatus(eventType),
          sendgridEventId: eventId,
          categories: category,
          ipAddress: ip,
          userAgent: useragent,
        },
      });
    }

    // Update email log based on event type
    const updateData: any = {
      sendgridEventId: eventId,
      categories: category,
      customArgs: {
        ...(emailLog.customArgs || {}),
        lastEvent: eventType,
        lastEventTimestamp: new Date(timestamp * 1000).toISOString(),
      },
    };

    switch (eventType) {
      case 'delivered':
        updateData.status = 'delivered';
        updateData.deliveredAt = new Date(timestamp * 1000);
        break;

      case 'open':
        updateData.status = 'opened';
        updateData.openedAt = new Date(timestamp * 1000);
        updateData.opens = (emailLog.opens || 0) + 1;
        updateData.ipAddress = ip;
        updateData.userAgent = useragent;
        break;

      case 'click':
        updateData.status = 'clicked';
        updateData.clickedAt = new Date(timestamp * 1000);
        updateData.clicks = (emailLog.clicks || 0) + 1;
        updateData.customArgs = {
          ...updateData.customArgs,
          clickedUrl: url,
        };
        break;

      case 'bounce':
        updateData.status = 'bounced';
        updateData.bouncedAt = new Date(timestamp * 1000);
        updateData.bounceReason = reason;
        updateData.error = `Bounced: ${bounceClassification || 'Unknown'} - ${reason}`;
        break;

      case 'blocked':
        updateData.status = 'failed';
        updateData.error = `Blocked: ${reason}`;
        break;

      case 'dropped':
        updateData.status = 'failed';
        updateData.error = `Dropped: ${reason}`;
        break;

      case 'spamreport':
        updateData.status = 'spam';
        updateData.customArgs = {
          ...updateData.customArgs,
          spamReported: true,
        };
        break;

      case 'unsubscribe':
        updateData.customArgs = {
          ...updateData.customArgs,
          unsubscribed: true,
          asmGroupId,
        };
        
        // Handle unsubscribe logic
        await this.handleUnsubscribe(email, asmGroupId);
        break;

      case 'group_unsubscribe':
        updateData.customArgs = {
          ...updateData.customArgs,
          groupUnsubscribed: true,
          asmGroupId,
        };
        break;

      case 'group_resubscribe':
        updateData.customArgs = {
          ...updateData.customArgs,
          groupResubscribed: true,
          asmGroupId,
        };
        break;
    }

    // Update the email log
    await strapi.entityService.update('api::email-log.email-log', emailLog.id, {
      data: updateData,
    });

    // Trigger custom event handlers
    await this.triggerCustomHandlers(eventType, event, emailLog);

    return {
      eventId,
      eventType,
      email,
      timestamp: new Date(timestamp * 1000),
      processed: true,
    };
  },

  mapEventToStatus(eventType: string): string {
    const statusMap = {
      delivered: 'delivered',
      open: 'opened',
      click: 'clicked',
      bounce: 'bounced',
      blocked: 'failed',
      dropped: 'failed',
      deferred: 'sent',
      processed: 'sent',
      spamreport: 'spam',
    };

    return statusMap[eventType] || 'sent';
  },

  async handleUnsubscribe(email: string, asmGroupId?: number) {
    try {
      // Find user and update preferences
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email },
      });

      if (user) {
        const preferences = user.preferences || {};
        preferences.emailSubscriptions = preferences.emailSubscriptions || {};
        
        if (asmGroupId) {
          preferences.emailSubscriptions[`group_${asmGroupId}`] = false;
        } else {
          preferences.emailSubscriptions.all = false;
        }

        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: { preferences },
        });

        strapi.log.info(`Updated unsubscribe preferences for user: ${email}`);
      }

      // Create unsubscribe record
      await strapi.entityService.create('api::email-unsubscribe.email-unsubscribe', {
        data: {
          email,
          asmGroupId,
          source: 'webhook',
          unsubscribedAt: new Date(),
        },
      });
    } catch (error) {
      strapi.log.error('Error handling unsubscribe:', error);
    }
  },

  async triggerCustomHandlers(eventType: string, event: SendGridEvent, emailLog: any) {
    try {
      // Emit Strapi events for custom handling
      strapi.eventHub.emit('email.event', {
        type: eventType,
        event,
        emailLog,
      });

      strapi.eventHub.emit(`email.${eventType}`, {
        event,
        emailLog,
      });

      // Custom business logic based on event type
      switch (eventType) {
        case 'bounce':
          if (event.bounce_classification === 'hard') {
            await this.handleHardBounce(event.email);
          }
          break;

        case 'spamreport':
          await this.handleSpamReport(event.email);
          break;

        case 'unsubscribe':
          // Already handled in processEvent
          break;
      }
    } catch (error) {
      strapi.log.error('Error in custom event handlers:', error);
    }
  },

  async handleHardBounce(email: string) {
    try {
      // Mark email as invalid
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email },
      });

      if (user) {
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: {
            blocked: true,
            preferences: {
              ...(user.preferences || {}),
              emailValid: false,
              emailBounced: true,
            },
          },
        });

        strapi.log.info(`Marked email as invalid due to hard bounce: ${email}`);
      }
    } catch (error) {
      strapi.log.error('Error handling hard bounce:', error);
    }
  },

  async handleSpamReport(email: string) {
    try {
      // Update user preferences to avoid sending future emails
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email },
      });

      if (user) {
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: {
            preferences: {
              ...(user.preferences || {}),
              emailSubscriptions: {
                all: false,
                marketingEmails: false,
              },
              spamReported: true,
            },
          },
        });

        strapi.log.info(`Updated preferences due to spam report: ${email}`);
      }
    } catch (error) {
      strapi.log.error('Error handling spam report:', error);
    }
  },

  async getWebhookStats(ctx) {
    try {
      const { timeframe = '7d' } = ctx.query;
      
      const timeframeHours = {
        '1h': 1,
        '24h': 24,
        '7d': 7 * 24,
        '30d': 30 * 24,
      }[timeframe] || 7 * 24;

      const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

      const stats = await strapi.db.query('api::email-log.email-log').findMany({
        where: {
          updatedAt: { $gte: since },
        },
        select: ['status', 'opens', 'clicks'],
      });

      const summary = stats.reduce((acc, log) => {
        acc.total++;
        acc.byStatus[log.status] = (acc.byStatus[log.status] || 0) + 1;
        acc.totalOpens += log.opens || 0;
        acc.totalClicks += log.clicks || 0;
        return acc;
      }, {
        total: 0,
        byStatus: {},
        totalOpens: 0,
        totalClicks: 0,
      });

      ctx.body = {
        timeframe,
        period: `${timeframeHours} hours`,
        stats: summary,
      };
    } catch (error) {
      strapi.log.error('Webhook stats error:', error);
      ctx.throw(500, 'Failed to get webhook statistics');
    }
  },
};