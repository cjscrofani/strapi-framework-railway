import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-submission.contact-submission', ({ strapi }) => ({
  async create(ctx) {
    const { name, email, phone, subject, message, company } = ctx.request.body.data;
    
    // Validation
    if (!name || !email || !subject || !message) {
      return ctx.badRequest('Missing required fields');
    }

    // Rate limiting by IP
    const userIP = ctx.request.ip;
    const recentSubmissions = await strapi.entityService.findMany('api::contact-submission.contact-submission', {
      filters: {
        ipAddress: userIP,
        createdAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentSubmissions.length >= 3) {
      return ctx.tooManyRequests('Too many submissions. Please wait before submitting again.');
    }

    try {
      // Create submission
      const submission = await strapi.entityService.create('api::contact-submission.contact-submission', {
        data: {
          name,
          email,
          phone,
          subject,
          message,
          company,
          source: 'website',
          ipAddress: userIP,
          userAgent: ctx.request.headers['user-agent'],
          metadata: {
            referer: ctx.request.headers.referer,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Send notification email
      try {
        await strapi.plugins.email.services.email.send({
          to: process.env.CONTACT_EMAIL || 'admin@example.com',
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `New Contact Form Submission: ${subject}`,
          text: `
New contact form submission received:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company || 'Not provided'}
Subject: ${subject}

Message:
${message}

Submitted at: ${new Date().toLocaleString()}
IP Address: ${userIP}
          `,
          html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
<p><strong>Company:</strong> ${company || 'Not provided'}</p>
<p><strong>Subject:</strong> ${subject}</p>
<br>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
<br>
<p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
<p><small>IP Address: ${userIP}</small></p>
          `,
        });

        // Update submission to mark email as sent
        await strapi.entityService.update('api::contact-submission.contact-submission', submission.id, {
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      } catch (emailError) {
        strapi.log.error('Failed to send contact form email:', emailError);
        // Don't fail the submission if email fails
      }

      // Send auto-reply to user
      try {
        await strapi.plugins.email.services.email.send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Thank you for contacting us',
          text: `
Dear ${name},

Thank you for reaching out to us. We have received your message about "${subject}" and will get back to you as soon as possible.

If your inquiry is urgent, please don't hesitate to contact us directly.

Best regards,
The Team
          `,
          html: `
<h2>Thank you for contacting us</h2>
<p>Dear ${name},</p>
<p>Thank you for reaching out to us. We have received your message about "<strong>${subject}</strong>" and will get back to you as soon as possible.</p>
<p>If your inquiry is urgent, please don't hesitate to contact us directly.</p>
<br>
<p>Best regards,<br>The Team</p>
          `,
        });
      } catch (autoReplyError) {
        strapi.log.error('Failed to send auto-reply email:', autoReplyError);
        // Don't fail the submission if auto-reply fails
      }

      ctx.body = {
        data: {
          id: submission.id,
          message: 'Thank you for your message. We will get back to you soon!',
        },
      };
    } catch (error) {
      strapi.log.error('Contact form submission error:', error);
      ctx.throw(500, 'Failed to process submission');
    }
  },
}));