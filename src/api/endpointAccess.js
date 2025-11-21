// Endpoint access configuration based on user roles and authentication status
export const endpointAccessConfig = {
  // Endpoints that require no authentication (public access)
  public: [
    'stores', // Public store listings
    'products', // Public product catalog (handled separately in ProductService)
    'categories', // Public category listings (handled separately in CategoryService)
  ],
  
  // Endpoints accessible to authenticated customers
  customer: [
    'addresses',
    'orders',
    'cart',
    'wishlist',
    'customer-activity',
    'price-alert-subscriptions',
    'stock-alert-subscriptions',
  ],
  
  // Endpoints accessible to both guests and customers (storefront endpoints)
  storefront: [
    'tax',
    'attributes',
    'product-labels',
    'attribute-sets',
    'seo-templates',
    'seo-settings',
    'cookie-consent-settings',
    'cms-blocks',
    'product-tabs',
    'payment-methods',
    'shipping',
    'delivery',
    'coupons',
    'cms-pages',
  ],

  // Endpoints that require store owner/admin authentication
  admin: [
    'users',
    'store-plugins',
    'languages',
    'credit-transactions',
    'consent-logs',
    'customers',
    'redirects',
    'media-assets',
    'plugins',
    'services',
    'custom-option-rules',
  ],
};

// Helper function to determine access level for an endpoint
export function getEndpointAccessLevel(endpoint) {
  if (endpointAccessConfig.public.includes(endpoint)) {
    return 'public';
  }
  if (endpointAccessConfig.storefront.includes(endpoint)) {
    return 'storefront';
  }
  if (endpointAccessConfig.customer.includes(endpoint)) {
    return 'customer';
  }
  if (endpointAccessConfig.admin.includes(endpoint)) {
    return 'admin';
  }
  
  // Default to admin access for unknown endpoints
  return 'admin';
}

// Helper function to check if endpoint should use public API
export function shouldUsePublicAPI(endpoint, hasToken, userRole = 'guest') {
  const accessLevel = getEndpointAccessLevel(endpoint);

  switch (accessLevel) {
    case 'public':
      // For public endpoints like products/categories, check if user is authenticated as admin
      // If admin/store_owner with token, use authenticated API for full features (translations, etc.)
      // Otherwise use public API
      if (hasToken && (userRole === 'store_owner' || userRole === 'admin')) {
        return false; // Use authenticated API for admin users
      }
      return true; // Use public API for guests/customers

    case 'storefront':
      // Use public API for storefront endpoints when no token or when user is a guest/customer
      // But use authenticated API when user is admin/store_owner for management purposes
      return !hasToken || userRole === 'guest' || userRole === 'customer';

    case 'customer':
      // Customer endpoints require authentication - never use public API
      return false;

    case 'admin':
      // Admin endpoints always require authentication - never use public API
      return false;

    default:
      return false;
  }
}

// Helper function to check if user has access to an endpoint
export function hasAccessToEndpoint(endpoint, userRole, isAuthenticated) {
  const accessLevel = getEndpointAccessLevel(endpoint);
  
  switch (accessLevel) {
    case 'public':
    case 'storefront':
      // Everyone has access to public and storefront endpoints
      return true;
      
    case 'customer':
      // Only authenticated users (customers or admins) have access
      return isAuthenticated;
      
    case 'admin':
      // Only store owners/admins have access
      return isAuthenticated && userRole === 'store_owner';
      
    default:
      return false;
  }
}