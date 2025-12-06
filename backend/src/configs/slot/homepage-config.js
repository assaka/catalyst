// Homepage Configuration
// Backend version - CommonJS format

const homepageConfig = {
  title: 'Homepage Layout Editor',
  defaultView: 'default',
  defaultSlots: ['hero', 'featured', 'categories', 'products', 'newsletter', 'brands'],
  slots: {
    hero: {
      name: 'Hero Banner',
      defaultContent: '',
      component: null
    },
    featured: {
      name: 'Featured Products',
      defaultContent: '',
      component: null
    },
    categories: {
      name: 'Shop by Category',
      defaultContent: '',
      component: null
    },
    products: {
      name: 'Product Showcase',
      defaultContent: '',
      component: null
    },
    testimonials: {
      name: 'Customer Testimonials',
      defaultContent: '',
      component: null
    },
    newsletter: {
      name: 'Newsletter Signup',
      defaultContent: '',
      component: null
    },
    brands: {
      name: 'Brand Logos',
      defaultContent: '',
      component: null
    },
    blog: {
      name: 'Latest Blog Posts',
      defaultContent: '',
      component: null
    }
  },
  cmsBlocks: [
    'homepage_top',
    'homepage_middle',
    'homepage_bottom',
    'homepage_sidebar'
  ]
};

module.exports = { homepageConfig };
