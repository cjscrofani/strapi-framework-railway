import cacheService from '../services/cache';

export default (config = {}) => {
  const {
    ttl = 3600, // 1 hour default
    keyGenerator = (ctx) => `api:${ctx.request.method}:${ctx.request.url}`,
    skipCache = (ctx) => false,
    skipMethods = ['POST', 'PUT', 'PATCH', 'DELETE'],
  } = config;

  return async (ctx, next) => {
    // Skip caching for certain methods
    if (skipMethods.includes(ctx.request.method)) {
      return await next();
    }

    // Skip caching if custom condition is met
    if (skipCache(ctx)) {
      return await next();
    }

    // Skip caching if user is authenticated (for personalized content)
    if (ctx.state.user) {
      return await next();
    }

    const cacheKey = keyGenerator(ctx);
    
    try {
      // Try to get from cache
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        strapi.log.debug(`Cache HIT for key: ${cacheKey}`);
        ctx.set('X-Cache', 'HIT');
        ctx.set('X-Cache-Key', cacheKey);
        ctx.body = cachedResponse.body;
        ctx.status = cachedResponse.status || 200;
        
        // Set cache headers
        const cacheAge = Math.floor((Date.now() - cachedResponse.timestamp) / 1000);
        ctx.set('Age', cacheAge.toString());
        ctx.set('Cache-Control', `public, max-age=${ttl}`);
        
        return;
      }

      strapi.log.debug(`Cache MISS for key: ${cacheKey}`);
      ctx.set('X-Cache', 'MISS');
      ctx.set('X-Cache-Key', cacheKey);
      
      // Continue with the request
      await next();
      
      // Cache the response if successful
      if (ctx.status >= 200 && ctx.status < 300 && ctx.body) {
        const responseData = {
          body: ctx.body,
          status: ctx.status,
          timestamp: Date.now(),
        };
        
        await cacheService.set(cacheKey, responseData, ttl);
        strapi.log.debug(`Cached response for key: ${cacheKey}`);
        
        // Set cache headers
        ctx.set('Cache-Control', `public, max-age=${ttl}`);
        ctx.set('Age', '0');
      }
      
    } catch (error) {
      strapi.log.error('Cache middleware error:', error);
      // Continue without caching if there's an error
      await next();
    }
  };
};