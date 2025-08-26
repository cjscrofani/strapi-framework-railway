import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::home-page.home-page', ({ strapi }) => ({
  async find(ctx) {
    const { populate } = ctx.query;

    const entity = await strapi.entityService.findMany('api::home-page.home-page', {
      populate: populate || {
        seo: true,
        hero: {
          populate: {
            backgroundImage: true,
            backgroundVideo: true,
            primaryButton: true,
            secondaryButton: true,
          },
        },
        aboutPreview: {
          populate: {
            image: true,
            stats: true,
            button: true,
          },
        },
        servicesPreview: {
          populate: {
            services: {
              populate: {
                featuredImage: true,
                category: true,
              },
            },
          },
        },
        testimonialsSection: {
          populate: {
            testimonials: {
              populate: {
                avatar: true,
              },
            },
          },
        },
        blogPreview: {
          populate: {
            posts: {
              populate: {
                featuredImage: true,
                author: true,
                categories: true,
              },
            },
          },
        },
        ctaSection: {
          populate: {
            button: true,
            backgroundImage: true,
          },
        },
        featuredContent: {
          on: {
            'sections.feature-grid': {
              populate: {
                features: {
                  populate: {
                    icon: true,
                    image: true,
                  },
                },
              },
            },
            'sections.stats-section': {
              populate: {
                stats: true,
              },
            },
            'sections.image-gallery': {
              populate: {
                images: true,
              },
            },
          },
        },
      },
    });

    return { data: entity };
  },
}));