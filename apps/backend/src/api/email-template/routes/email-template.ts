export default {
  routes: [
    {
      method: 'GET',
      path: '/email-templates',
      handler: 'email-template.find',
    },
    {
      method: 'GET',
      path: '/email-templates/:id',
      handler: 'email-template.findOne',
    },
    {
      method: 'POST',
      path: '/email-templates',
      handler: 'email-template.create',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'PUT',
      path: '/email-templates/:id',
      handler: 'email-template.update',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'DELETE',
      path: '/email-templates/:id',
      handler: 'email-template.delete',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/email-templates/:id/preview',
      handler: 'email-template.preview',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/email-templates/:id/test',
      handler: 'email-template.sendTest',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/email-templates/:id/duplicate',
      handler: 'email-template.duplicate',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/email-templates/:id/stats',
      handler: 'email-template.getStats',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};