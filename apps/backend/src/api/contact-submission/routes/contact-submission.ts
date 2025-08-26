export default {
  routes: [
    {
      method: 'POST',
      path: '/contact-submissions',
      handler: 'contact-submission.create',
      config: {
        middlewares: ['api::contact-submission.rate-limit'],
      },
    },
  ],
};