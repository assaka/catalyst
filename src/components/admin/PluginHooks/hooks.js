/**
 * Plugin Hook Definitions
 * 
 * This file defines all available plugin hooks in the Catalyst system.
 * Store owners can create plugins that hook into these locations.
 */

export const PLUGIN_HOOKS = {
  // Homepage hooks
  HOMEPAGE_HEADER: 'homepage_header',
  HOMEPAGE_HERO: 'homepage_hero',
  HOMEPAGE_CONTENT: 'homepage_content',
  HOMEPAGE_SIDEBAR: 'homepage_sidebar',
  HOMEPAGE_FOOTER: 'homepage_footer',

  // Product page hooks
  PRODUCT_PAGE_HEADER: 'product_page_header',
  PRODUCT_PAGE_TITLE: 'product_page_title',
  PRODUCT_PAGE_DESCRIPTION: 'product_page_description',
  PRODUCT_PAGE_IMAGES: 'product_page_images',
  PRODUCT_PAGE_PRICE: 'product_page_price',
  PRODUCT_PAGE_ACTIONS: 'product_page_actions',
  PRODUCT_PAGE_TABS: 'product_page_tabs',
  PRODUCT_PAGE_FOOTER: 'product_page_footer',

  // Category/Collection page hooks
  CATEGORY_PAGE_HEADER: 'category_page_header',
  CATEGORY_PAGE_FILTERS: 'category_page_filters',
  CATEGORY_PAGE_PRODUCTS: 'category_page_products',
  CATEGORY_PAGE_FOOTER: 'category_page_footer',

  // Cart hooks
  CART_HEADER: 'cart_header',
  CART_ITEMS: 'cart_items',
  CART_SIDEBAR: 'cart_sidebar',
  CART_FOOTER: 'cart_footer',
  CART_EMPTY: 'cart_empty',

  // Checkout hooks
  CHECKOUT_HEADER: 'checkout_header',
  CHECKOUT_STEPS: 'checkout_steps',
  CHECKOUT_SHIPPING: 'checkout_shipping',
  CHECKOUT_PAYMENT: 'checkout_payment',
  CHECKOUT_REVIEW: 'checkout_review',
  CHECKOUT_SUCCESS: 'checkout_success',

  // Account page hooks
  ACCOUNT_DASHBOARD: 'account_dashboard',
  ACCOUNT_ORDERS: 'account_orders',
  ACCOUNT_PROFILE: 'account_profile',

  // Global hooks (appear on all pages)
  GLOBAL_HEADER: 'global_header',
  GLOBAL_NAVIGATION: 'global_navigation',
  GLOBAL_FOOTER: 'global_footer',
  GLOBAL_SIDEBAR: 'global_sidebar',

  // Admin hooks (for store owner dashboard)
  ADMIN_DASHBOARD: 'admin_dashboard',
  ADMIN_SIDEBAR: 'admin_sidebar',
  ADMIN_HEADER: 'admin_header'
};

/**
 * Hook metadata for documentation and validation
 */
export const HOOK_METADATA = {
  [PLUGIN_HOOKS.HOMEPAGE_HEADER]: {
    name: 'Homepage Header',
    description: 'Appears at the top of the homepage',
    location: 'Homepage',
    position: 'Header',
    context: ['store', 'user', 'featuredProducts'],
    examples: ['Welcome messages', 'Announcements', 'Promotional banners']
  },

  [PLUGIN_HOOKS.HOMEPAGE_HERO]: {
    name: 'Homepage Hero Section',
    description: 'Main hero area of the homepage',
    location: 'Homepage',
    position: 'Hero',
    context: ['store', 'user', 'featuredProducts', 'collections'],
    examples: ['Hero banners', 'Slideshow', 'Featured content']
  },

  [PLUGIN_HOOKS.HOMEPAGE_CONTENT]: {
    name: 'Homepage Content',
    description: 'Main content area of the homepage',
    location: 'Homepage',
    position: 'Content',
    context: ['store', 'user', 'products', 'collections'],
    examples: ['Product grids', 'Content blocks', 'Featured sections']
  },

  [PLUGIN_HOOKS.HOMEPAGE_FOOTER]: {
    name: 'Homepage Footer',
    description: 'Bottom of the homepage',
    location: 'Homepage',
    position: 'Footer',
    context: ['store', 'user'],
    examples: ['Social links', 'Newsletter signup', 'Additional info']
  },

  [PLUGIN_HOOKS.PRODUCT_PAGE_HEADER]: {
    name: 'Product Page Header',
    description: 'Top of product pages',
    location: 'Product Page',
    position: 'Header',
    context: ['store', 'user', 'product'],
    examples: ['Breadcrumbs', 'Product alerts', 'Navigation helpers']
  },

  [PLUGIN_HOOKS.PRODUCT_PAGE_ACTIONS]: {
    name: 'Product Page Actions',
    description: 'Near the add to cart button',
    location: 'Product Page',
    position: 'Actions',
    context: ['store', 'user', 'product'],
    examples: ['Wishlist buttons', 'Share buttons', 'Size guides']
  },

  [PLUGIN_HOOKS.CART_SIDEBAR]: {
    name: 'Cart Sidebar',
    description: 'Shopping cart sidebar',
    location: 'Cart',
    position: 'Sidebar',
    context: ['store', 'user', 'cart'],
    examples: ['Shipping calculator', 'Promo codes', 'Recommendations']
  },

  [PLUGIN_HOOKS.CHECKOUT_STEPS]: {
    name: 'Checkout Steps',
    description: 'During the checkout process',
    location: 'Checkout',
    position: 'Steps',
    context: ['store', 'user', 'cart', 'order'],
    examples: ['Progress indicators', 'Trust badges', 'Help text']
  },

  [PLUGIN_HOOKS.GLOBAL_HEADER]: {
    name: 'Global Header',
    description: 'Appears on all pages in the header',
    location: 'Global',
    position: 'Header',
    context: ['store', 'user', 'page'],
    examples: ['Announcement bars', 'Free shipping notices', 'Alerts']
  },

  [PLUGIN_HOOKS.GLOBAL_FOOTER]: {
    name: 'Global Footer',
    description: 'Appears on all pages in the footer',
    location: 'Global',
    position: 'Footer',
    context: ['store', 'user', 'page'],
    examples: ['Social media links', 'Additional navigation', 'Trust signals']
  }
};

/**
 * Get hooks by category
 */
export const getHooksByCategory = () => {
  const categories = {
    homepage: [],
    product: [],
    cart: [],
    checkout: [],
    global: [],
    admin: []
  };

  Object.entries(PLUGIN_HOOKS).forEach(([key, hookName]) => {
    if (hookName.startsWith('homepage_')) categories.homepage.push(hookName);
    else if (hookName.startsWith('product_')) categories.product.push(hookName);
    else if (hookName.startsWith('cart_')) categories.cart.push(hookName);
    else if (hookName.startsWith('checkout_')) categories.checkout.push(hookName);
    else if (hookName.startsWith('global_')) categories.global.push(hookName);
    else if (hookName.startsWith('admin_')) categories.admin.push(hookName);
    else categories.global.push(hookName); // Default to global
  });

  return categories;
};

/**
 * Validate if a hook name exists
 */
export const isValidHook = (hookName) => {
  return Object.values(PLUGIN_HOOKS).includes(hookName);
};

/**
 * Get hook display name
 */
export const getHookDisplayName = (hookName) => {
  return HOOK_METADATA[hookName]?.name || hookName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get context data that will be passed to plugins for each hook
 */
export const getHookContext = (hookName, additionalContext = {}) => {
  const baseContext = {
    timestamp: Date.now(),
    hookName,
    userAgent: navigator.userAgent,
    ...additionalContext
  };

  // Add hook-specific context
  const metadata = HOOK_METADATA[hookName];
  if (metadata?.context) {
    // This would be populated with actual data in the component
    metadata.context.forEach(contextKey => {
      if (!baseContext[contextKey]) {
        baseContext[contextKey] = null; // Placeholder
      }
    });
  }

  return baseContext;
};