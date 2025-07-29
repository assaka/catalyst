/**
 * Comprehensive URL utility system for SEO-friendly URLs with layered navigation
 * Supports /public and /admin URL prefixes, UTM tracking, and filter parameters
 */

// URL Architecture Configuration
export const URL_CONFIG = {
  // Base prefixes
  PUBLIC_PREFIX: '/public',
  ADMIN_PREFIX: '/admin',
  
  // SEO-friendly slugs
  PAGES: {
    // Public storefront pages
    STOREFRONT: 'shop',
    PRODUCT_DETAIL: 'product',
    CATEGORY: 'category',
    CART: 'cart',
    CHECKOUT: 'checkout',
    ORDER_SUCCESS: 'order-success',
    CUSTOMER_AUTH: 'login',
    CUSTOMER_DASHBOARD: 'account',
    CUSTOMER_ORDERS: 'orders',
    CUSTOMER_PROFILE: 'profile',
    CMS_PAGE: 'cms-page',
    SITEMAP: 'sitemap',
    XML_SITEMAP: 'sitemap.xml',
    ROBOTS_TXT: 'robots.txt',
    ORDER_CANCEL: 'order-cancel',
    COOKIE_CONSENT: 'cookie-consent',
    
    // Admin pages
    ADMIN_AUTH: 'login',
    DASHBOARD: 'dashboard',
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    ORDERS: 'orders',
    CUSTOMERS: 'customers',
    SETTINGS: 'settings',
    ANALYTICS: 'analytics',
    ATTRIBUTES: 'attributes',
    PLUGINS: 'plugins',
    CMS_BLOCKS: 'cms-blocks',
    TAX: 'tax',
    COUPONS: 'coupons',
    CMS_PAGES: 'cms-pages',
    PRODUCT_TABS: 'product-tabs',
    PRODUCT_LABELS: 'product-labels',
    CUSTOM_OPTION_RULES: 'custom-option-rules',
    SHIPPING_METHODS: 'shipping-methods',
    GOOGLE_TAG_MANAGER: 'google-tag-manager',
    DELIVERY_SETTINGS: 'delivery-settings',
    THEME_LAYOUT: 'theme-layout',
    MARKETPLACE_EXPORT: 'marketplace-export',
    IMAGE_MANAGER: 'image-manager',
    STOCK_SETTINGS: 'stock-settings',
    PAYMENT_METHODS: 'payment-methods',
    SEO_TOOLS: 'seo-tools',
    STORES: 'stores',
    CUSTOMER_ACTIVITY: 'customer-activity'
  },
  
  // Filter parameter mapping for SEO URLs
  FILTER_PARAMS: {
    'category': 'c',
    'price': 'p',
    'brand': 'b',
    'color': 'color',
    'size': 'size',
    'rating': 'r',
    'availability': 'stock',
    'sort': 'sort',
    'page': 'page'
  }
};

/**
 * Create admin URL with proper prefix
 */
export function createAdminUrl(pageName, params = {}) {
  const slug = URL_CONFIG.PAGES[pageName.toUpperCase()] || pageName.toLowerCase();
  const baseUrl = `${URL_CONFIG.ADMIN_PREFIX}/${slug}`;
  
  return addUrlParams(baseUrl, params);
}

/**
 * Create public storefront URL with store context
 */
export function createPublicUrl(storeSlug, pageName, params = {}) {
  const slug = URL_CONFIG.PAGES[pageName.toUpperCase()] || pageName.toLowerCase();
  const baseUrl = `${URL_CONFIG.PUBLIC_PREFIX}/${storeSlug}/${slug}`;
  
  return addUrlParams(baseUrl, params);
}

/**
 * Create SEO-friendly product URL
 * Example: /public/storename/product/wireless-headphones-sony-wh1000xm4
 */
export function createProductUrl(storeSlug, productSlug, productId, params = {}) {
  const baseUrl = `${URL_CONFIG.PUBLIC_PREFIX}/${storeSlug}/${URL_CONFIG.PAGES.PRODUCT_DETAIL}/${productSlug}-${productId}`;
  return addUrlParams(baseUrl, params);
}

/**
 * Create SEO-friendly category URL with layered navigation
 * Example: /public/storename/category/electronics/headphones?brand=sony,apple&price=100-500&color=black
 */
export function createCategoryUrl(storeSlug, categoryPath, filters = {}, params = {}) {
  const categorySlug = Array.isArray(categoryPath) ? categoryPath.join('/') : categoryPath;
  let baseUrl = `${URL_CONFIG.PUBLIC_PREFIX}/${storeSlug}/${URL_CONFIG.PAGES.CATEGORY}/${categorySlug}`;
  
  // Convert filters to SEO-friendly URL structure
  const filterParams = buildFilterParams(filters);
  const allParams = { ...filterParams, ...params };
  
  return addUrlParams(baseUrl, allParams);
}

/**
 * Build filter parameters for layered navigation
 */
export function buildFilterParams(filters) {
  const params = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    const paramKey = URL_CONFIG.FILTER_PARAMS[key] || key;
    
    if (Array.isArray(value)) {
      // Multiple values: brand=sony,apple
      params[paramKey] = value.join(',');
    } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      // Range values: price=100-500
      params[paramKey] = `${value.min}-${value.max}`;
    } else {
      params[paramKey] = value;
    }
  });
  
  return params;
}

/**
 * Parse filter parameters from URL
 */
export function parseFilterParams(searchParams) {
  const filters = {};
  
  Object.entries(URL_CONFIG.FILTER_PARAMS).forEach(([filterKey, paramKey]) => {
    const value = searchParams.get(paramKey);
    if (value) {
      if (value.includes(',')) {
        // Multiple values
        filters[filterKey] = value.split(',');
      } else if (value.includes('-') && (filterKey === 'price' || filterKey === 'rating')) {
        // Range values
        const [min, max] = value.split('-');
        filters[filterKey] = { min: parseFloat(min), max: parseFloat(max) };
      } else {
        filters[filterKey] = value;
      }
    }
  });
  
  return filters;
}

/**
 * Add URL parameters while preserving UTM and tracking parameters
 */
export function addUrlParams(baseUrl, params = {}) {
  if (Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, value.toString());
    }
  });
  
  return url.pathname + url.search;
}

/**
 * Preserve UTM and tracking parameters when navigating
 */
export function preserveTrackingParams(newUrl) {
  const currentParams = new URLSearchParams(window.location.search);
  const newUrlObj = new URL(newUrl, window.location.origin);
  
  // UTM parameters to preserve
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
                         'gclid', 'fbclid', 'ref', 'referrer', 'affiliate_id'];
  
  trackingParams.forEach(param => {
    const value = currentParams.get(param);
    if (value && !newUrlObj.searchParams.has(param)) {
      newUrlObj.searchParams.set(param, value);
    }
  });
  
  return newUrlObj.pathname + newUrlObj.search;
}

/**
 * Get current URL type (public/admin)
 */
export function getCurrentUrlType() {
  const pathname = window.location.pathname;
  if (pathname.startsWith(URL_CONFIG.ADMIN_PREFIX)) {
    return 'admin';
  } else if (pathname.startsWith(URL_CONFIG.PUBLIC_PREFIX)) {
    return 'public';
  }
  return 'legacy'; // For backward compatibility
}

/**
 * Extract store slug from public URL
 */
export function getStoreSlugFromPublicUrl(pathname) {
  const match = pathname.match(new RegExp(`^${URL_CONFIG.PUBLIC_PREFIX}/([^/]+)/`));
  return match ? match[1] : null;
}

/**
 * Parse product details from SEO URL
 */
export function parseProductUrl(pathname) {
  const regex = new RegExp(`^${URL_CONFIG.PUBLIC_PREFIX}/([^/]+)/${URL_CONFIG.PAGES.PRODUCT_DETAIL}/(.+)-(\\d+)$`);
  const match = pathname.match(regex);
  
  if (match) {
    return {
      storeSlug: match[1],
      productSlug: match[2],
      productId: parseInt(match[3])
    };
  }
  
  return null;
}

/**
 * Parse category details from SEO URL
 */
export function parseCategoryUrl(pathname) {
  const regex = new RegExp(`^${URL_CONFIG.PUBLIC_PREFIX}/([^/]+)/${URL_CONFIG.PAGES.CATEGORY}/(.+)$`);
  const match = pathname.match(regex);
  
  if (match) {
    return {
      storeSlug: match[1],
      categoryPath: match[2].split('/')
    };
  }
  
  return null;
}

/**
 * Generate breadcrumb data from URL
 */
export function generateBreadcrumbs(pathname, searchParams) {
  const breadcrumbs = [];
  const urlType = getCurrentUrlType();
  
  if (urlType === 'public') {
    const storeSlug = getStoreSlugFromPublicUrl(pathname);
    if (storeSlug) {
      breadcrumbs.push({
        label: 'Home',
        url: createPublicUrl(storeSlug, 'STOREFRONT')
      });
      
      // Add category breadcrumbs
      const categoryData = parseCategoryUrl(pathname);
      if (categoryData) {
        let currentPath = '';
        categoryData.categoryPath.forEach((segment, index) => {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          breadcrumbs.push({
            label: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            url: createCategoryUrl(storeSlug, currentPath)
          });
        });
      }
    }
  }
  
  return breadcrumbs;
}

/**
 * Create canonical URL for SEO
 */
export function createCanonicalUrl(pathname, searchParams = null) {
  const baseUrl = `${window.location.protocol}//${window.location.host}${pathname}`;
  
  if (!searchParams) {
    return baseUrl;
  }
  
  // Only include SEO-relevant parameters in canonical URL
  const canonicalParams = new URLSearchParams();
  const relevantParams = ['page', 'sort', ...Object.values(URL_CONFIG.FILTER_PARAMS)];
  
  relevantParams.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      canonicalParams.set(param, value);
    }
  });
  
  const queryString = canonicalParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}


// Backward compatibility exports
export function createPageUrl(pageName) {
  console.warn('createPageUrl is deprecated. Use createAdminUrl or createPublicUrl instead.');
  return createAdminUrl(pageName);
}

export function createStoreUrl(storeSlug, pageName) {
  console.warn('createStoreUrl is deprecated. Use createPublicUrl instead.');
  return createPublicUrl(storeSlug, pageName);
}

export function getStoreSlugFromUrl(pathname) {
  console.warn('getStoreSlugFromUrl is deprecated. Use getStoreSlugFromPublicUrl instead.');
  return getStoreSlugFromPublicUrl(pathname) || pathname.match(/^\/([^\/]+)\//)?.[1];
}