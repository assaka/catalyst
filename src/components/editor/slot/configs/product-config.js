// Product Page Configuration
export const productConfig = {
  title: 'Product Layout Editor',
  defaultView: 'default',
  defaultSlots: ['breadcrumbs', 'gallery', 'info', 'tabs', 'related', 'reviews'],
  slots: {
    breadcrumbs: {
      name: 'Breadcrumbs',
      defaultContent: '<nav>Home > Category > Product</nav>',
      component: null
    },
    gallery: {
      name: 'Product Gallery',
      defaultContent: '',
      component: null
    },
    info: {
      name: 'Product Information',
      defaultContent: '',
      component: null
    },
    addToCart: {
      name: 'Add to Cart',
      defaultContent: '',
      component: null
    },
    tabs: {
      name: 'Product Tabs',
      defaultContent: '',
      component: null
    },
    related: {
      name: 'Related Products',
      defaultContent: '',
      component: null
    },
    reviews: {
      name: 'Product Reviews',
      defaultContent: '',
      component: null
    },
    recentlyViewed: {
      name: 'Recently Viewed',
      defaultContent: '',
      component: null
    }
  },
  cmsBlocks: [
    'product_above_gallery',
    'product_below_gallery',
    'product_above_info',
    'product_below_info',
    'product_above_tabs',
    'product_below_tabs',
    'product_footer'
  ]
};

export default productConfig;