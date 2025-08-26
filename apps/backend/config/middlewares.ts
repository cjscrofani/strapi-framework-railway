export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:3000',
        'https://localhost:3000',
        // Add your Railway frontend URL here
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Custom cache middleware for API responses
  {
    name: 'global::cache',
    config: {
      ttl: 3600, // 1 hour
      keyGenerator: (ctx) => {
        const url = new URL(ctx.request.url, `http://${ctx.request.host}`);
        const query = url.searchParams.toString();
        return `api:${ctx.request.method}:${url.pathname}${query ? ':' + query : ''}`;
      },
      skipCache: (ctx) => {
        // Skip cache for admin API
        return ctx.request.url.startsWith('/admin');
      },
    },
  },
];