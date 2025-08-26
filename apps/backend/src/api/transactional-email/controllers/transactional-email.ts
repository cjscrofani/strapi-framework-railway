export default {
  async sendWelcomeEmail(ctx) {
    const { email, name, activationLink } = ctx.request.body;

    if (!email || !name) {
      return ctx.badRequest('Email and name are required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const result = await emailService.sendTransactionalEmail('welcome', email, {
        userName: name,
        userEmail: email,
        activationLink,
      });

      ctx.body = {
        success: true,
        messageId: result.messageId,
        message: 'Welcome email sent successfully',
      };
    } catch (error) {
      strapi.log.error('Welcome email error:', error);
      ctx.throw(500, 'Failed to send welcome email');
    }
  },

  async sendPasswordResetEmail(ctx) {
    const { email, name, resetLink, expirationTime } = ctx.request.body;

    if (!email || !resetLink) {
      return ctx.badRequest('Email and reset link are required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const result = await emailService.sendTransactionalEmail('password_reset', email, {
        userName: name || email.split('@')[0],
        resetLink,
        expirationTime: expirationTime || '24 hours',
      });

      ctx.body = {
        success: true,
        messageId: result.messageId,
        message: 'Password reset email sent successfully',
      };
    } catch (error) {
      strapi.log.error('Password reset email error:', error);
      ctx.throw(500, 'Failed to send password reset email');
    }
  },

  async sendEmailVerification(ctx) {
    const { email, name, verificationLink, expirationTime } = ctx.request.body;

    if (!email || !verificationLink) {
      return ctx.badRequest('Email and verification link are required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const result = await emailService.sendTransactionalEmail('email_verification', email, {
        userName: name || email.split('@')[0],
        verificationLink,
        expirationTime: expirationTime || '24 hours',
      });

      ctx.body = {
        success: true,
        messageId: result.messageId,
        message: 'Email verification sent successfully',
      };
    } catch (error) {
      strapi.log.error('Email verification error:', error);
      ctx.throw(500, 'Failed to send email verification');
    }
  },

  async sendContactConfirmation(ctx) {
    const { email, name, subject, message, responseTime } = ctx.request.body;

    if (!email || !name || !subject || !message) {
      return ctx.badRequest('Email, name, subject, and message are required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const result = await emailService.sendTransactionalEmail('contact_confirmation', email, {
        name,
        subject,
        message,
        responseTime: responseTime || '24 hours',
      });

      ctx.body = {
        success: true,
        messageId: result.messageId,
        message: 'Contact confirmation email sent successfully',
      };
    } catch (error) {
      strapi.log.error('Contact confirmation email error:', error);
      ctx.throw(500, 'Failed to send contact confirmation email');
    }
  },

  async sendNewsletterWelcome(ctx) {
    const { email, name, preferences, unsubscribeLink } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const result = await emailService.sendTransactionalEmail('newsletter_welcome', email, {
        userName: name || email.split('@')[0],
        preferences: preferences || {},
        unsubscribeLink,
      });

      ctx.body = {
        success: true,
        messageId: result.messageId,
        message: 'Newsletter welcome email sent successfully',
      };
    } catch (error) {
      strapi.log.error('Newsletter welcome email error:', error);
      ctx.throw(500, 'Failed to send newsletter welcome email');
    }
  },

  async sendCustomEmail(ctx) {
    const { 
      to, 
      template, 
      subject, 
      templateData,
      attachments,
      categories,
      customArgs 
    } = ctx.request.body;

    if (!to || (!template && !subject)) {
      return ctx.badRequest('Recipient and either template or subject are required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const emailOptions = {
        to: Array.isArray(to) ? to : [to],
        subject,
        template,
        templateData,
        attachments,
        categories: categories || ['custom'],
        customArgs,
      };

      const results = [];
      
      for (const recipient of emailOptions.to) {
        try {
          const result = await emailService.sendEmail({
            ...emailOptions,
            to: recipient,
          });
          results.push({ 
            recipient, 
            status: 'sent', 
            messageId: result.messageId 
          });
        } catch (error) {
          results.push({ 
            recipient, 
            status: 'failed', 
            error: error.message 
          });
        }
      }

      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      ctx.body = {
        success: failed === 0,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
        message: `Email sending completed: ${successful} successful, ${failed} failed`,
      };
    } catch (error) {
      strapi.log.error('Custom email error:', error);
      ctx.throw(500, 'Failed to send custom email');
    }
  },

  async sendBulkEmails(ctx) {
    const { emails, template, defaultSubject, templateData } = ctx.request.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return ctx.badRequest('Emails array is required');
    }

    if (!template && !defaultSubject) {
      return ctx.badRequest('Either template or defaultSubject is required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      
      const emailOptions = emails.map(emailData => {
        if (typeof emailData === 'string') {
          // Simple email address
          return {
            to: emailData,
            subject: defaultSubject,
            template,
            templateData: {
              ...templateData,
              userEmail: emailData,
              userName: emailData.split('@')[0],
            },
            categories: ['bulk'],
          };
        } else {
          // Email object with custom data
          return {
            to: emailData.email,
            subject: emailData.subject || defaultSubject,
            template,
            templateData: {
              ...templateData,
              ...emailData.data,
              userEmail: emailData.email,
            },
            categories: ['bulk', ...(emailData.categories || [])],
            customArgs: emailData.customArgs,
          };
        }
      });

      const results = await emailService.sendBulkEmail(emailOptions);
      
      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      ctx.body = {
        success: failed === 0,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
        message: `Bulk email sending completed: ${successful} successful, ${failed} failed`,
      };
    } catch (error) {
      strapi.log.error('Bulk email error:', error);
      ctx.throw(500, 'Failed to send bulk emails');
    }
  },

  async getEmailStatus(ctx) {
    const { messageId } = ctx.params;

    if (!messageId) {
      return ctx.badRequest('Message ID is required');
    }

    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      const stats = await emailService.getEmailStats(messageId);

      if (!stats) {
        return ctx.notFound('Email not found');
      }

      ctx.body = { data: stats };
    } catch (error) {
      strapi.log.error('Email status error:', error);
      ctx.throw(500, 'Failed to get email status');
    }
  },

  async testEmailConnection(ctx) {
    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      const isConnected = await emailService.testConnection();

      ctx.body = {
        connected: isConnected,
        service: 'SendGrid',
        timestamp: new Date().toISOString(),
        message: isConnected ? 'Email service is working correctly' : 'Email service connection failed',
      };
    } catch (error) {
      strapi.log.error('Email connection test error:', error);
      ctx.body = {
        connected: false,
        service: 'SendGrid',
        timestamp: new Date().toISOString(),
        message: 'Email service connection test failed',
        error: error.message,
      };
    }
  },

  async getAvailableTemplates(ctx) {
    try {
      const emailService = strapi.services['global::email'] || require('../../services/email').default;
      const templates = emailService.getAvailableTemplates();

      // Also get templates from database
      const dbTemplates = await strapi.entityService.findMany('api::email-template.email-template', {
        filters: { isActive: true },
        fields: ['name', 'slug', 'subject', 'category', 'description'],
      });

      ctx.body = {
        fileSystemTemplates: templates,
        databaseTemplates: dbTemplates,
        totalTemplates: templates.length + dbTemplates.length,
      };
    } catch (error) {
      strapi.log.error('Available templates error:', error);
      ctx.throw(500, 'Failed to get available templates');
    }
  },
};