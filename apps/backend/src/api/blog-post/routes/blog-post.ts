export default {
  routes: [
    {
      method: 'GET',
      path: '/blog-posts',
      handler: 'blog-post.find',
    },
    {
      method: 'GET',
      path: '/blog-posts/:id',
      handler: 'blog-post.findOne',
    },
    {
      method: 'GET',
      path: '/blog-posts/:id/related',
      handler: 'blog-post.findRelated',
    },
  ],
};