export default ({ env }) => ({
  // Email plugin with SendGrid provider
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
        // Optional: Configure additional SendGrid options
        host: env('SENDGRID_HOST', 'smtp.sendgrid.net'),
        port: env.int('SENDGRID_PORT', 587),
      },
      settings: {
        defaultFrom: env('SENDGRID_FROM_EMAIL'),
        defaultFromName: env('SENDGRID_FROM_NAME', 'Strapi App'),
        defaultReplyTo: env('SENDGRID_REPLY_TO'),
        testAddress: env('SENDGRID_TEST_ADDRESS'),
        // Additional email settings
        defaultSubject: env('SENDGRID_DEFAULT_SUBJECT', 'Message from Strapi'),
        templatePath: env('EMAIL_TEMPLATE_PATH', './email-templates'),
        enableTemplateEngine: env.bool('EMAIL_TEMPLATE_ENGINE', true),
      },
    },
  },
  
  // GraphQL plugin
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env.bool('GRAPHQL_PLAYGROUND', false),
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: env.bool('GRAPHQL_TRACING', false),
      },
    },
  },

  // Upload plugin with custom configuration
  upload: {
    config: {
      sizeLimit: 250 * 1024 * 1024, // 250mb
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
    },
  },

  // Users permissions plugin
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: env('JWT_EXPIRES_IN', '7d'),
      },
      ratelimit: {
        interval: { min: 1 },
        max: 10,
        delayAfter: 3,
        skipSuccessful: true,
      },
    },
  },
});