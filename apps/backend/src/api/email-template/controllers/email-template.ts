import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::email-template.email-template', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    // Handle category filtering
    if (query.category) {
      query.filters = {
        ...query.filters,
        category: { $eq: query.category },
      };
      delete query.category;
    }

    // Handle active filtering
    if (query.active !== undefined) {
      query.filters = {
        ...query.filters,
        isActive: { $eq: query.active === 'true' },
      };
      delete query.active;
    }

    // Default population
    query.populate = query.populate || {
      tags: true,
      thumbnailImage: true,
    };

    // Default sorting
    query.sort = query.sort || ['category:asc', 'name:asc'];

    const { results, pagination } = await strapi.entityService.findPage('api::email-template.email-template', query);

    return {
      data: results,
      meta: { pagination },
    };
  },

  async preview(ctx) {
    const { id } = ctx.params;
    const { variables } = ctx.request.body || {};

    try {
      const template = await strapi.entityService.findOne('api::email-template.email-template', id, {
        populate: {
          thumbnailImage: true,
        },
      });

      if (!template) {
        return ctx.notFound('Template not found');
      }

      // Generate preview with sample data
      const sampleData = {
        siteName: process.env.SITE_NAME || 'Strapi App',
        siteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        currentYear: new Date().getFullYear(),
        userName: 'John Doe',
        userEmail: 'john@example.com',
        ...variables,
      };

      const Handlebars = require('handlebars');
      const subjectTemplate = Handlebars.compile(template.subject);
      const htmlTemplate = Handlebars.compile(template.htmlContent);
      const textTemplate = template.textContent ? Handlebars.compile(template.textContent) : null;

      const preview = {
        subject: subjectTemplate(sampleData),
        htmlContent: htmlTemplate(sampleData),
        textContent: textTemplate ? textTemplate(sampleData) : null,
        preheader: template.preheader,
        variables: template.variables,
        sampleData,
      };

      ctx.body = { data: preview };
    } catch (error) {
      strapi.log.error('Template preview error:', error);
      ctx.throw(500, 'Failed to generate preview');
    }
  },

  async sendTest(ctx) {
    const { id } = ctx.params;
    const { recipients, variables } = ctx.request.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return ctx.badRequest('Recipients are required');
    }

    try {
      const template = await strapi.entityService.findOne('api::email-template.email-template', id);

      if (!template) {
        return ctx.notFound('Template not found');
      }

      if (!template.isActive) {
        return ctx.badRequest('Template is not active');
      }

      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      const results = [];

      for (const recipient of recipients) {
        try {
          const result = await emailService.sendEmail({
            to: recipient,
            subject: template.subject,
            template: template.slug,
            templateData: variables,
            categories: ['test', template.category],
          });
          results.push({ recipient, status: 'sent', messageId: result.messageId });
        } catch (error) {
          results.push({ recipient, status: 'failed', error: error.message });
        }
      }

      ctx.body = {
        data: {
          templateId: id,
          results,
          totalSent: results.filter(r => r.status === 'sent').length,
          totalFailed: results.filter(r => r.status === 'failed').length,
        },
      };
    } catch (error) {
      strapi.log.error('Test email error:', error);
      ctx.throw(500, 'Failed to send test emails');
    }
  },

  async duplicate(ctx) {
    const { id } = ctx.params;

    try {
      const template = await strapi.entityService.findOne('api::email-template.email-template', id, {
        populate: {
          tags: true,
          thumbnailImage: true,
        },
      });

      if (!template) {
        return ctx.notFound('Template not found');
      }

      // Create duplicate with modified name
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        preheader: template.preheader,
        variables: template.variables,
        isDefault: false,
        isActive: false,
        tags: template.tags?.map(tag => tag.id) || [],
        metadata: {
          ...template.metadata,
          originalTemplateId: template.id,
          duplicatedAt: new Date().toISOString(),
        },
      };

      const duplicate = await strapi.entityService.create('api::email-template.email-template', {
        data: duplicateData,
      });

      ctx.body = { data: duplicate };
    } catch (error) {
      strapi.log.error('Template duplication error:', error);
      ctx.throw(500, 'Failed to duplicate template');
    }
  },

  async getStats(ctx) {
    const { id } = ctx.params;

    try {
      // Get email logs for this template
      const emailLogs = await strapi.entityService.findMany('api::email-log.email-log', {
        filters: {
          template: { $eq: id },
        },
        sort: ['createdAt:desc'],
      });

      const stats = {
        totalSent: emailLogs.length,
        totalOpened: emailLogs.filter(log => log.opens > 0).length,
        totalClicked: emailLogs.filter(log => log.clicks > 0).length,
        totalBounced: emailLogs.filter(log => log.status === 'bounced').length,
        totalFailed: emailLogs.filter(log => log.status === 'failed').length,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        recentActivity: emailLogs.slice(0, 10),
      };

      if (stats.totalSent > 0) {
        stats.openRate = (stats.totalOpened / stats.totalSent) * 100;
        stats.clickRate = (stats.totalClicked / stats.totalSent) * 100;
        stats.bounceRate = (stats.totalBounced / stats.totalSent) * 100;
      }

      // Update template stats
      await strapi.entityService.update('api::email-template.email-template', id, {
        data: {
          usageCount: stats.totalSent,
          openRate: stats.openRate,
          clickThroughRate: stats.clickRate,
          lastUsed: emailLogs.length > 0 ? emailLogs[0].createdAt : null,
        },
      });

      ctx.body = { data: stats };
    } catch (error) {
      strapi.log.error('Template stats error:', error);
      ctx.throw(500, 'Failed to get template statistics');
    }
  },
}));