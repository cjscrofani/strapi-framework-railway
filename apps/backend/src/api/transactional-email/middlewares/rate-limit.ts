export default (config = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 50, // 50 requests per window
    skipSuccessful = false,
    keyGenerator = (ctx) => `email_rate:${ctx.request.ip}`,
    message = 'Too many email requests, please try again later',
  } = config;

  return async (ctx, next) => {
    const cacheService = strapi.cache || strapi.services['global::cache'];
    
    if (!cacheService) {
      strapi.log.warn('Cache service not available, skipping email rate limiting');
      return await next();
    }

    const key = keyGenerator(ctx);
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get current requests for this key
      const requestsData = await cacheService.get(key) || [];
      
      // Filter out requests outside the current window
      const recentRequests = requestsData.filter(timestamp => timestamp > windowStart);

      // Check if limit is exceeded
      if (recentRequests.length >= maxRequests) {
        ctx.status = 429;
        ctx.body = {
          error: {
            status: 429,
            name: 'TooManyRequestsError',
            message,
            details: {
              limit: maxRequests,
              windowMs,
              retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
            },
          },
        };
        
        // Set rate limit headers
        ctx.set('X-RateLimit-Limit', maxRequests.toString());
        ctx.set('X-RateLimit-Remaining', '0');
        ctx.set('X-RateLimit-Reset', new Date(recentRequests[0] + windowMs).toISOString());
        ctx.set('Retry-After', Math.ceil((recentRequests[0] + windowMs - now) / 1000).toString());
        
        return;
      }

      // Continue with the request
      await next();

      // Record this request (only if successful or skipSuccessful is false)
      if (!skipSuccessful || ctx.status >= 400) {
        recentRequests.push(now);
        await cacheService.set(key, recentRequests, Math.ceil(windowMs / 1000));
      }

      // Set rate limit headers
      ctx.set('X-RateLimit-Limit', maxRequests.toString());
      ctx.set('X-RateLimit-Remaining', Math.max(0, maxRequests - recentRequests.length).toString());
      if (recentRequests.length > 0) {
        ctx.set('X-RateLimit-Reset', new Date(Math.max(...recentRequests) + windowMs).toISOString());
      }

    } catch (error) {
      strapi.log.error('Email rate limit error:', error);
      // Continue without rate limiting if there's an error
      await next();
    }
  };
};