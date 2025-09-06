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
    defaultSlots: ['flashMessage', 'header', 'emptyCart', 'cartItem', 'coupon', 'orderSummary'],
    slots: {
      flashMessage: {
        name: 'Flash Messages',
        views: ['empty', 'withProducts'],
        defaultContent: '<div class="alert alert-info">Cart updated successfully!</div>',
        component: null,
        microSlots: ['flashMessage.content'],
        gridCols: 12,
        defaultSpans: {
          'flashMessage.content': { col: 12, row: 1 }
        }
      },
      header: {
        name: 'Page Header',
        views: ['empty', 'withProducts'],
        defaultContent: '<h1 class="text-2xl font-bold">Shopping Cart</h1>',
        component: null,
        microSlots: ['header.title'],
        gridCols: 12,
        defaultSpans: {
          'header.title': { col: 12, row: 1 }
        }
      },
      emptyCart: {
        name: 'Empty Cart Message',
        views: ['empty'],
        defaultContent: '<div class="empty-cart text-center py-8"><p class="text-gray-500 mb-4">Your cart is empty</p><button class="btn btn-primary">Continue Shopping</button></div>',
        component: null,
        microSlots: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
        gridCols: 12,
        defaultSpans: {
          'emptyCart.icon': { col: 2, row: 1 },
          'emptyCart.title': { col: 10, row: 1 },
          'emptyCart.text': { col: 12, row: 1 },
          'emptyCart.button': { col: 12, row: 1 }
        }
      },
      cartItem: {
        name: 'Cart Items',
        views: ['withProducts'],
        defaultContent: '',
        component: null,
        microSlots: ['cartItem.image', 'cartItem.details', 'cartItem.quantity', 'cartItem.price', 'cartItem.remove'],
        gridCols: 12,
        defaultSpans: {
          'cartItem.image': { col: 2, row: 2 },
          'cartItem.details': { col: 4, row: 2 },
          'cartItem.quantity': { col: 3, row: 1 },
          'cartItem.price': { col: 2, row: 1 },
          'cartItem.remove': { col: 1, row: 1 }
        }
      },
      coupon: {
        name: 'Coupon Section',
        views: ['withProducts'],
        defaultContent: '<div class="coupon-section"><input type="text" placeholder="Enter coupon code" class="form-control"><button class="btn btn-secondary">Apply</button></div>',
        component: null,
        microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied', 'coupon.removeButton'],
        gridCols: 12,
        defaultSpans: {
          'coupon.title': { col: 12, row: 1 },
          'coupon.input': { col: 8, row: 1 },
          'coupon.button': { col: 4, row: 1 },
          'coupon.applied': { col: 8, row: 1 },
          'coupon.removeButton': { col: 4, row: 1 }
        }
      },
      orderSummary: {
        name: 'Order Summary',
        views: ['withProducts'],
        defaultContent: '<div class="order-summary"><h3>Order Summary</h3><div class="summary-line">Subtotal: $0.00</div><div class="summary-line">Tax: $0.00</div><div class="summary-total">Total: $0.00</div><button class="btn btn-primary btn-block">Proceed to Checkout</button></div>',
        component: null,
        microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.tax', 'orderSummary.shipping', 'orderSummary.discount', 'orderSummary.total', 'orderSummary.checkout'],
        gridCols: 12,
        defaultSpans: {
          'orderSummary.title': { col: 12, row: 1 },
          'orderSummary.subtotal': { col: 12, row: 1 },
          'orderSummary.tax': { col: 12, row: 1 },
          'orderSummary.shipping': { col: 12, row: 1 },
          'orderSummary.discount': { col: 12, row: 1 },
          'orderSummary.total': { col: 12, row: 1 },
          'orderSummary.checkout': { col: 12, row: 1 }
        }
      },
      recommendations: {
        name: 'Product Recommendations',
        views: ['empty', 'withProducts'],
        defaultContent: '<div class="recommendations"><h3>You might also like</h3></div>',
        component: null,
        microSlots: ['recommendations.title', 'recommendations.products'],
        gridCols: 12,
        defaultSpans: {
          'recommendations.title': { col: 12, row: 1 },
          'recommendations.products': { col: 12, row: 3 }
        }
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