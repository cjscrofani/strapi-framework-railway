import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::service.service', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    // Handle search
    if (query.search) {
      query.filters = {
        ...query.filters,
        $or: [
          { title: { $containsi: query.search } },
          { description: { $containsi: query.search } },
          { longDescription: { $containsi: query.search } },
        ],
      };
      delete query.search;
    }

    // Handle category filtering
    if (query.category) {
      query.filters = {
        ...query.filters,
        category: {
          slug: { $eq: query.category },
        },
      };
      delete query.category;
    }

    // Handle price range filtering
    if (query.minPrice || query.maxPrice) {
      query.filters = {
        ...query.filters,
        price: {},
      };
      
      if (query.minPrice) {
        query.filters.price.$gte = parseFloat(query.minPrice);
        delete query.minPrice;
      }
      
      if (query.maxPrice) {
        query.filters.price.$lte = parseFloat(query.maxPrice);
        delete query.maxPrice;
      }
    }

    // Filter only active services for public API
    query.filters = {
      ...query.filters,
      isActive: true,
    };

    // Default population
    query.populate = query.populate || {
      featuredImage: true,
      gallery: true,
      category: true,
      tags: true,
      features: true,
      seo: true,
    };

    // Default sorting
    query.sort = query.sort || ['sortOrder:asc', 'title:asc'];

    const { results, pagination } = await strapi.entityService.findPage('api::service.service', query);

    return {
      data: results,
      meta: { pagination },
    };
  },

  async findFeatured(ctx) {
    const { limit = 6 } = ctx.query;

    const featuredServices = await strapi.entityService.findMany('api::service.service', {
      filters: {
        isFeatured: true,
        isActive: true,
      },
      populate: {
        featuredImage: true,
        category: true,
        tags: true,
        features: true,
      },
      limit: parseInt(limit),
      sort: ['sortOrder:asc'],
    });

    return { data: featuredServices };
  },
}));