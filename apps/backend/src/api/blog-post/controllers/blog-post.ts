import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::blog-post.blog-post', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    // Handle search
    if (query.search) {
      const searchQuery = `%${query.search}%`;
      query.filters = {
        ...query.filters,
        $or: [
          { title: { $containsi: query.search } },
          { excerpt: { $containsi: query.search } },
          { content: { $containsi: query.search } },
        ],
      };
      delete query.search;
    }

    // Handle category filtering
    if (query.category) {
      query.filters = {
        ...query.filters,
        categories: {
          slug: { $eq: query.category },
        },
      };
      delete query.category;
    }

    // Handle tag filtering
    if (query.tag) {
      query.filters = {
        ...query.filters,
        tags: {
          slug: { $eq: query.tag },
        },
      };
      delete query.tag;
    }

    // Default population
    query.populate = query.populate || {
      featuredImage: true,
      author: {
        populate: {
          avatar: true,
        },
      },
      categories: true,
      tags: true,
      seo: true,
    };

    // Default sorting by published date
    query.sort = query.sort || ['publishedAt:desc'];

    const { results, pagination } = await strapi.entityService.findPage('api::blog-post.blog-post', query);

    return {
      data: results,
      meta: { pagination },
    };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    
    // Increment view count
    await strapi.entityService.update('api::blog-post.blog-post', id, {
      data: {
        viewCount: await strapi.db.query('api::blog-post.blog-post')
          .findOne({ where: { id } })
          .then(post => (post?.viewCount || 0) + 1),
      },
    });

    const entity = await strapi.entityService.findOne('api::blog-post.blog-post', id, {
      populate: {
        featuredImage: true,
        gallery: true,
        author: {
          populate: {
            avatar: true,
          },
        },
        categories: true,
        tags: true,
        seo: true,
        relatedPosts: {
          populate: {
            featuredImage: true,
            author: true,
            categories: true,
          },
        },
      },
    });

    return { data: entity };
  },

  async findRelated(ctx) {
    const { id } = ctx.params;
    const { limit = 3 } = ctx.query;

    const post = await strapi.entityService.findOne('api::blog-post.blog-post', id, {
      populate: {
        categories: true,
        tags: true,
      },
    });

    if (!post) {
      return ctx.notFound('Post not found');
    }

    const categoryIds = post.categories?.map(cat => cat.id) || [];
    const tagIds = post.tags?.map(tag => tag.id) || [];

    const relatedPosts = await strapi.entityService.findMany('api::blog-post.blog-post', {
      filters: {
        id: { $ne: id },
        $or: [
          { categories: { id: { $in: categoryIds } } },
          { tags: { id: { $in: tagIds } } },
        ],
      },
      populate: {
        featuredImage: true,
        author: true,
        categories: true,
      },
      limit: parseInt(limit),
      sort: ['publishedAt:desc'],
    });

    return { data: relatedPosts };
  },
}));