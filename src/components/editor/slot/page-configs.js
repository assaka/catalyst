import { ShoppingCart, Package, Grid, FileText, Home, Users, Tag } from 'lucide-react';

// Import page-specific slot components
// These would be created for each slot type
// import HeaderSlot from './slots/HeaderSlot';
// import ProductGridSlot from './slots/ProductGridSlot';
// etc.

/**
 * Page configurations for different page types
 * Each config defines the slots, views, and behavior for that page type
 */

export const PAGE_CONFIGS = {
  // Cart Page Configuration
  cart: {
    title: 'Cart Layout Editor',
    defaultView: 'empty',
    views: [
      { id: 'empty', label: 'Empty Cart', icon: ShoppingCart },
      { id: 'withProducts', label: 'With Products', icon: Package }
    ],
    defaultSlots: ['header', 'flashMessage', 'cartContent', 'recommendations'],
    slots: {
      header: {
        name: 'Page Header',
        views: ['empty', 'withProducts'],
        defaultContent: '<h1>Shopping Cart</h1>',
        component: null // Use default HTML rendering
      },
      flashMessage: {
        name: 'Flash Messages',
        views: ['empty', 'withProducts'],
        defaultContent: '<div class="alert">Cart updated</div>',
        component: null
      },
      cartContent: {
        name: 'Cart Content',
        views: ['withProducts'],
        defaultContent: '',
        component: null // Would be CartItemsComponent
      },
      emptyCart: {
        name: 'Empty Cart Message',
        views: ['empty'],
        defaultContent: '<div class="empty-cart">Your cart is empty</div>',
        component: null
      },
      orderSummary: {
        name: 'Order Summary',
        views: ['withProducts'],
        defaultContent: '',
        component: null // Would be OrderSummaryComponent
      },
      recommendations: {
        name: 'Product Recommendations',
        views: ['empty', 'withProducts'],
        defaultContent: '',
        component: null // Would be RecommendationsComponent
      }
    },
    cmsBlocks: [
      'cart_header',
      'cart_above_items',
      'cart_below_items',
      'cart_sidebar',
      'cart_above_total',
      'cart_below_total',
      'cart_footer'
    ]
  },

  // Category Page Configuration
  category: {
    title: 'Category Layout Editor',
    defaultView: 'grid',
    views: [
      { id: 'grid', label: 'Grid View', icon: Grid },
      { id: 'list', label: 'List View', icon: FileText }
    ],
    defaultSlots: ['header', 'breadcrumbs', 'filters', 'sorting', 'products', 'pagination'],
    slots: {
      header: {
        name: 'Category Header',
        views: ['grid', 'list'],
        defaultContent: '<h1>Category Name</h1>',
        component: null
      },
      breadcrumbs: {
        name: 'Breadcrumbs',
        views: ['grid', 'list'],
        defaultContent: '<nav>Home > Category</nav>',
        component: null
      },
      banner: {
        name: 'Category Banner',
        views: ['grid', 'list'],
        defaultContent: '',
        component: null
      },
      filters: {
        name: 'Product Filters',
        views: ['grid', 'list'],
        defaultContent: '',
        component: null // Would be FiltersComponent
      },
      sorting: {
        name: 'Sort Options',
        views: ['grid', 'list'],
        defaultContent: '',
        component: null // Would be SortingComponent
      },
      products: {
        name: 'Product Grid/List',
        views: ['grid', 'list'],
        defaultContent: '',
        component: null, // Would be ProductGridComponent or ProductListComponent
        getData: (data) => data.products || []
      },
      pagination: {
        name: 'Pagination',
        views: ['grid', 'list'],
        defaultContent: '',
        component: null // Would be PaginationComponent
      },
      seoContent: {
        name: 'SEO Content',
        views: ['grid', 'list'],
        defaultContent: '<div class="seo-content">Category description...</div>',
        component: null
      }
    },
    cmsBlocks: [
      'category_header',
      'category_above_products',
      'category_below_products',
      'category_sidebar',
      'category_footer'
    ]
  },

  // Product Page Configuration
  product: {
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
        component: null // Would be ProductGalleryComponent
      },
      info: {
        name: 'Product Information',
        defaultContent: '',
        component: null // Would be ProductInfoComponent
      },
      addToCart: {
        name: 'Add to Cart',
        defaultContent: '',
        component: null // Would be AddToCartComponent
      },
      tabs: {
        name: 'Product Tabs',
        defaultContent: '',
        component: null // Would be ProductTabsComponent
      },
      related: {
        name: 'Related Products',
        defaultContent: '',
        component: null // Would be RelatedProductsComponent
      },
      reviews: {
        name: 'Product Reviews',
        defaultContent: '',
        component: null // Would be ReviewsComponent
      },
      recentlyViewed: {
        name: 'Recently Viewed',
        defaultContent: '',
        component: null // Would be RecentlyViewedComponent
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
  },

  // Homepage Configuration
  homepage: {
    title: 'Homepage Layout Editor',
    defaultView: 'default',
    defaultSlots: ['hero', 'featured', 'categories', 'products', 'newsletter', 'brands'],
    slots: {
      hero: {
        name: 'Hero Banner',
        defaultContent: '',
        component: null // Would be HeroBannerComponent
      },
      featured: {
        name: 'Featured Products',
        defaultContent: '',
        component: null // Would be FeaturedProductsComponent
      },
      categories: {
        name: 'Shop by Category',
        defaultContent: '',
        component: null // Would be CategoryGridComponent
      },
      products: {
        name: 'Product Showcase',
        defaultContent: '',
        component: null // Would be ProductShowcaseComponent
      },
      testimonials: {
        name: 'Customer Testimonials',
        defaultContent: '',
        component: null // Would be TestimonialsComponent
      },
      newsletter: {
        name: 'Newsletter Signup',
        defaultContent: '',
        component: null // Would be NewsletterComponent
      },
      brands: {
        name: 'Brand Logos',
        defaultContent: '',
        component: null // Would be BrandLogosComponent
      },
      blog: {
        name: 'Latest Blog Posts',
        defaultContent: '',
        component: null // Would be BlogPostsComponent
      }
    },
    cmsBlocks: [
      'homepage_top',
      'homepage_middle',
      'homepage_bottom',
      'homepage_sidebar'
    ]
  },

  // Checkout Page Configuration
  checkout: {
    title: 'Checkout Layout Editor',
    defaultView: 'default',
    defaultSlots: ['header', 'steps', 'form', 'summary', 'payment'],
    slots: {
      header: {
        name: 'Checkout Header',
        defaultContent: '<h1>Checkout</h1>',
        component: null
      },
      steps: {
        name: 'Checkout Steps',
        defaultContent: '',
        component: null // Would be CheckoutStepsComponent
      },
      form: {
        name: 'Checkout Form',
        defaultContent: '',
        component: null // Would be CheckoutFormComponent
      },
      summary: {
        name: 'Order Summary',
        defaultContent: '',
        component: null // Would be CheckoutSummaryComponent
      },
      payment: {
        name: 'Payment Methods',
        defaultContent: '',
        component: null // Would be PaymentMethodsComponent
      },
      shipping: {
        name: 'Shipping Methods',
        defaultContent: '',
        component: null // Would be ShippingMethodsComponent
      }
    },
    cmsBlocks: [
      'checkout_header',
      'checkout_above_form',
      'checkout_below_form',
      'checkout_sidebar',
      'checkout_footer'
    ]
  }
};

// Helper function to get page configuration
export function getPageConfig(pageType) {
  return PAGE_CONFIGS[pageType] || PAGE_CONFIGS.homepage;
}

// Helper function to get default slots for a page
export function getDefaultSlots(pageType) {
  const config = getPageConfig(pageType);
  return config.defaultSlots || [];
}

// Helper function to get CMS block positions for a page
export function getCmsBlocks(pageType) {
  const config = getPageConfig(pageType);
  return config.cmsBlocks || [];
}

// Helper function to validate slot configuration
export function validateSlotConfig(pageType, slotConfig) {
  const pageConfig = getPageConfig(pageType);
  const validSlots = Object.keys(pageConfig.slots);
  
  // Filter out invalid slots
  const validatedSlots = slotConfig.majorSlots?.filter(slot => 
    validSlots.includes(slot)
  ) || pageConfig.defaultSlots;
  
  return {
    ...slotConfig,
    majorSlots: validatedSlots
  };
}