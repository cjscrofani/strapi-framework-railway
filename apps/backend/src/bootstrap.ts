export default async ({ strapi }) => {
  console.log('🚀 Strapi bootstrap starting...');

  try {
    // Initialize cache service
    if (strapi.cache) {
      console.log('📦 Cache service initialized');
    }

    // Set up default permissions for public role
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      // Allow public access to specific endpoints
      const permissions = [
        // Home page
        { controller: 'home-page', action: 'find' },
        { controller: 'home-page', action: 'findOne' },
        
        // About page
        { controller: 'about-page', action: 'find' },
        { controller: 'about-page', action: 'findOne' },
        
        // Services page
        { controller: 'services-page', action: 'find' },
        { controller: 'services-page', action: 'findOne' },
        
        // Blog page
        { controller: 'blog-page', action: 'find' },
        { controller: 'blog-page', action: 'findOne' },
        
        // Contact page
        { controller: 'contact-page', action: 'find' },
        { controller: 'contact-page', action: 'findOne' },
        
        // Services
        { controller: 'service', action: 'find' },
        { controller: 'service', action: 'findOne' },
        { controller: 'service', action: 'findFeatured' },
        
        // Service categories
        { controller: 'service-category', action: 'find' },
        { controller: 'service-category', action: 'findOne' },
        
        // Blog posts
        { controller: 'blog-post', action: 'find' },
        { controller: 'blog-post', action: 'findOne' },
        { controller: 'blog-post', action: 'findRelated' },
        
        // Blog categories
        { controller: 'blog-category', action: 'find' },
        { controller: 'blog-category', action: 'findOne' },
        
        // Tags
        { controller: 'tag', action: 'find' },
        { controller: 'tag', action: 'findOne' },
        
        // Contact submissions (create only)
        { controller: 'contact-submission', action: 'create' },
        
        // Upload (for contact forms)
        { controller: 'upload', action: 'upload' },
      ];

      for (const permission of permissions) {
        try {
          await strapi
            .query('plugin::users-permissions.permission')
            .update({
              where: {
                role: publicRole.id,
                action: `api::${permission.controller}.${permission.controller}.${permission.action}`,
              },
              data: { enabled: true },
            });
        } catch (error) {
          // Permission might not exist yet, that's okay
        }
      }

      console.log('✅ Public permissions configured');
    }

    // Run content seeding in development
    if (strapi.config.environment === 'development') {
      try {
        const seeder = require('../database/seeders/seed-content.js');
        await seeder.seed(strapi);
      } catch (error) {
        console.error('❌ Error running seeder:', error);
      }
    }

    // Register lifecycle hooks
    strapi.db.lifecycles.subscribe({
      models: ['api::blog-post.blog-post'],
      afterCreate: async ({ result }) => {
        // Clear blog-related cache when new post is created
        const cacheKeys = await strapi.cache?.keys('api:GET:/api/blog-posts*');
        if (cacheKeys?.length) {
          for (const key of cacheKeys) {
            await strapi.cache.del(key);
          }
        }
      },
      afterUpdate: async ({ result }) => {
        // Clear specific post cache and list cache
        await strapi.cache?.del(`api:GET:/api/blog-posts/${result.id}`);
        const listKeys = await strapi.cache?.keys('api:GET:/api/blog-posts*');
        if (listKeys?.length) {
          for (const key of listKeys) {
            await strapi.cache.del(key);
          }
        }
      },
    });

    console.log('✅ Strapi bootstrap completed successfully');
    
  } catch (error) {
    console.error('❌ Bootstrap error:', error);
  }
};