export default {
  routes: [
    {
      method: 'POST',
      path: '/webhooks/sendgrid',
      handler: 'email-webhook.handleSendGridWebhook',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/webhooks/sendgrid/stats',
      handler: 'email-webhook.getWebhookStats',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};