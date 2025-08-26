export default {
  routes: [
    {
      method: 'GET',
      path: '/services',
      handler: 'service.find',
    },
    {
      method: 'GET',
      path: '/services/featured',
      handler: 'service.findFeatured',
    },
    {
      method: 'GET',
      path: '/services/:id',
      handler: 'service.findOne',
    },
  ],
};