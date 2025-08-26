export default (config, { strapi }) => {
  return async (ctx, next) => {
    const rateLimit = strapi.plugins['users-permissions'].config.ratelimit;
    
    if (!rateLimit) {
      return await next();
    }

    const key = `rate_limit:${ctx.request.ip}:${ctx.request.path}`;
    const current = await strapi.cache.get(key) || 0;
    
    if (current >= rateLimit.max) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message: 'Rate limit exceeded',
          details: {
            limit: rateLimit.max,
            windowMs: rateLimit.interval.min * 60 * 1000,
          },
        },
      };
      return;
    }

    await strapi.cache.set(key, current + 1, rateLimit.interval.min * 60);
    
    return await next();
  };
};