module.exports = {
  async seed(strapi) {
    try {
      console.log('🌱 Starting content seeding...');

      // Seed Service Categories
      console.log('📂 Seeding service categories...');
      const categories = [
        {
          name: 'Web Development',
          slug: 'web-development',
          description: 'Custom web development services',
          color: '#3B82F6',
          icon: 'code',
          sortOrder: 1,
          publishedAt: new Date(),
        },
        {
          name: 'Mobile Development',
          slug: 'mobile-development', 
          description: 'iOS and Android app development',
          color: '#10B981',
          icon: 'mobile',
          sortOrder: 2,
          publishedAt: new Date(),
        },
        {
          name: 'Consulting',
          slug: 'consulting',
          description: 'Technical consulting services',
          color: '#F59E0B',
          icon: 'lightbulb',
          sortOrder: 3,
          publishedAt: new Date(),
        },
      ];

      for (const category of categories) {
        const existing = await strapi.entityService.findMany('api::service-category.service-category', {
          filters: { slug: category.slug },
        });
        
        if (existing.length === 0) {
          await strapi.entityService.create('api::service-category.service-category', {
            data: category,
          });
          console.log(`✅ Created service category: ${category.name}`);
        }
      }

      // Seed Blog Categories
      console.log('📝 Seeding blog categories...');
      const blogCategories = [
        {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest technology trends and insights',
          color: '#3B82F6',
          sortOrder: 1,
          publishedAt: new Date(),
        },
        {
          name: 'Tutorials',
          slug: 'tutorials',
          description: 'Step-by-step guides and tutorials',
          color: '#10B981',
          sortOrder: 2,
          publishedAt: new Date(),
        },
        {
          name: 'News',
          slug: 'news',
          description: 'Company and industry news',
          color: '#F59E0B',
          sortOrder: 3,
          publishedAt: new Date(),
        },
      ];

      for (const category of blogCategories) {
        const existing = await strapi.entityService.findMany('api::blog-category.blog-category', {
          filters: { slug: category.slug },
        });
        
        if (existing.length === 0) {
          await strapi.entityService.create('api::blog-category.blog-category', {
            data: category,
          });
          console.log(`✅ Created blog category: ${category.name}`);
        }
      }

      // Seed Tags
      console.log('🏷️ Seeding tags...');
      const tags = [
        { name: 'React', slug: 'react', color: '#61DAFB' },
        { name: 'Node.js', slug: 'nodejs', color: '#339933' },
        { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
        { name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
        { name: 'Python', slug: 'python', color: '#3776AB' },
        { name: 'Mobile', slug: 'mobile', color: '#FF6B6B' },
      ];

      for (const tag of tags) {
        const existing = await strapi.entityService.findMany('api::tag.tag', {
          filters: { slug: tag.slug },
        });
        
        if (existing.length === 0) {
          await strapi.entityService.create('api::tag.tag', {
            data: tag,
          });
          console.log(`✅ Created tag: ${tag.name}`);
        }
      }

      // Seed Home Page Content
      console.log('🏠 Seeding home page content...');
      const homePageContent = {
        seo: {
          metaTitle: 'Welcome to Our Platform | Your Company Name',
          metaDescription: 'Discover our innovative solutions and services. We help businesses grow with cutting-edge technology.',
          keywords: 'web development, mobile apps, consulting, technology solutions',
          preventIndexing: false,
        },
        hero: {
          title: 'Build Your Digital Future',
          subtitle: 'Innovative Solutions for Modern Businesses',
          description: '<p>We create exceptional digital experiences that help your business thrive in the digital age. From web development to mobile applications, we have the expertise to bring your vision to life.</p>',
          alignment: 'center',
          overlay: true,
          overlayOpacity: 40,
          primaryButton: {
            text: 'Get Started',
            url: '/contact',
            variant: 'primary',
            size: 'lg',
          },
          secondaryButton: {
            text: 'Learn More',
            url: '/about',
            variant: 'outline',
            size: 'lg',
          },
        },
        aboutPreview: {
          title: 'About Our Company',
          description: '<p>We are a team of passionate developers and designers committed to delivering exceptional digital solutions. With years of experience in the industry, we understand what it takes to create successful digital products.</p>',
          stats: [
            { number: '100+', label: 'Projects Completed', suffix: '', prefix: '', icon: 'check-circle' },
            { number: '50+', label: 'Happy Clients', suffix: '', prefix: '', icon: 'users' },
            { number: '5', label: 'Years Experience', suffix: '+', prefix: '', icon: 'calendar' },
            { number: '24/7', label: 'Support', suffix: '', prefix: '', icon: 'support' },
          ],
          button: {
            text: 'Learn More About Us',
            url: '/about',
            variant: 'primary',
            size: 'md',
          },
        },
        publishedAt: new Date(),
      };

      const existingHomePage = await strapi.entityService.findMany('api::home-page.home-page');
      if (existingHomePage.length === 0) {
        await strapi.entityService.create('api::home-page.home-page', {
          data: homePageContent,
        });
        console.log('✅ Created home page content');
      }

      // Seed Sample Blog Posts
      console.log('📄 Seeding sample blog posts...');
      const samplePosts = [
        {
          title: 'Getting Started with React and TypeScript',
          slug: 'getting-started-with-react-typescript',
          excerpt: 'Learn how to set up a React project with TypeScript for better development experience and type safety.',
          content: '<h2>Introduction</h2><p>React with TypeScript provides an excellent development experience with better tooling, error catching, and code completion.</p><h2>Setting Up Your Project</h2><p>Start by creating a new React app with TypeScript template...</p>',
          readingTime: 5,
          isFeatured: true,
          publishedAt: new Date(),
        },
        {
          title: 'Building Scalable APIs with Node.js',
          slug: 'building-scalable-apis-nodejs',
          excerpt: 'Best practices for creating maintainable and scalable APIs using Node.js and Express.',
          content: '<h2>API Design Principles</h2><p>When building APIs, it\'s important to follow REST principles and implement proper error handling...</p>',
          readingTime: 8,
          isFeatured: false,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      ];

      for (const post of samplePosts) {
        const existing = await strapi.entityService.findMany('api::blog-post.blog-post', {
          filters: { slug: post.slug },
        });
        
        if (existing.length === 0) {
          // Get first admin user as author
          const adminUser = await strapi.query('plugin::users-permissions.user').findOne({
            where: { email: { $contains: 'admin' } },
          });

          // Get categories for assignment
          const techCategory = await strapi.entityService.findMany('api::blog-category.blog-category', {
            filters: { slug: 'technology' },
          });

          await strapi.entityService.create('api::blog-post.blog-post', {
            data: {
              ...post,
              author: adminUser?.id,
              categories: techCategory.length > 0 ? [techCategory[0].id] : [],
            },
          });
          console.log(`✅ Created blog post: ${post.title}`);
        }
      }

      console.log('🎉 Content seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Error seeding content:', error);
      throw error;
    }
  }
};