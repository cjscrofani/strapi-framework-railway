export default {
  routes: [
    // Welcome email
    {
      method: 'POST',
      path: '/emails/welcome',
      handler: 'transactional-email.sendWelcomeEmail',
      config: {
        policies: [],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Password reset email
    {
      method: 'POST',
      path: '/emails/password-reset',
      handler: 'transactional-email.sendPasswordResetEmail',
      config: {
        policies: [],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Email verification
    {
      method: 'POST',
      path: '/emails/verify-email',
      handler: 'transactional-email.sendEmailVerification',
      config: {
        policies: [],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Contact form confirmation
    {
      method: 'POST',
      path: '/emails/contact-confirmation',
      handler: 'transactional-email.sendContactConfirmation',
      config: {
        policies: [],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Newsletter welcome
    {
      method: 'POST',
      path: '/emails/newsletter-welcome',
      handler: 'transactional-email.sendNewsletterWelcome',
      config: {
        policies: [],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Custom email sending (authenticated)
    {
      method: 'POST',
      path: '/emails/send',
      handler: 'transactional-email.sendCustomEmail',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Bulk email sending (authenticated)
    {
      method: 'POST',
      path: '/emails/bulk',
      handler: 'transactional-email.sendBulkEmails',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: ['api::transactional-email.rate-limit'],
      },
    },

    // Email status tracking
    {
      method: 'GET',
      path: '/emails/status/:messageId',
      handler: 'transactional-email.getEmailStatus',
      config: {
        policies: ['global::is-authenticated'],
      },
    },

    // Test email connection
    {
      method: 'GET',
      path: '/emails/test-connection',
      handler: 'transactional-email.testEmailConnection',
      config: {
        policies: ['global::is-authenticated'],
      },
    },

    // Get available templates
    {
      method: 'GET',
      path: '/emails/templates',
      handler: 'transactional-email.getAvailableTemplates',
      config: {
        policies: [],
      },
    },
  ],
};