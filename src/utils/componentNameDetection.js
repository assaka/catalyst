/**
 * Component Name Detection Utilities
 * Extracts component/page names from file paths and content for route resolution
 */

/**
 * Extract component name from file path
 * @param {string} filePath - The file path to analyze
 * @returns {string|null} Detected component/page name or null
 */
export function extractComponentNameFromPath(filePath) {
  if (!filePath) return null;
  
  const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
  const pathParts = filePath.toLowerCase().split('/');
  
  // Direct page name mappings
  const pageNameMappings = {
    'dashboard': 'Dashboard',
    'products': 'Products', 
    'productlisting': 'Products',
    'product-listing': 'Products',
    'categories': 'Categories',
    'orders': 'Orders',
    'settings': 'Settings',
    'customers': 'Customers',
    'storefront': 'Home',
    'shop': 'Home',
    'home': 'Home',
    'homepage': 'Home',
    'productdetail': 'Product Detail',
    'product-detail': 'Product Detail',
    'cart': 'Cart',
    'checkout': 'Checkout',
    'abtesting': 'AB Testing',
    'ab-testing': 'AB Testing',
    'attributes': 'Attributes',
    'plugins': 'Plugins',
    'cms-pages': 'CMS Pages',
    'cmspages': 'CMS Pages',
    'cms-blocks': 'CMS Blocks',
    'cmsblocks': 'CMS Blocks',
    'integrations': 'Integrations',
    'seo-tools': 'SEO Tools',
    'seotools': 'SEO Tools',
    'seo-settings': 'SEO Settings',
    'seosettings': 'SEO Settings',
    'meta-tags': 'Meta Tags',
    'metatags': 'Meta Tags',
    'seo': 'SEO Tools'
  };
  
  // Check direct file name mapping
  const lowerFileName = fileName.toLowerCase();
  if (pageNameMappings[lowerFileName]) {
    return pageNameMappings[lowerFileName];
  }
  
  // Check path-based detection
  for (const part of pathParts) {
    if (pageNameMappings[part]) {
      return pageNameMappings[part];
    }
  }
  
  // Special cases based on path patterns
  if (pathParts.includes('admin')) {
    // Admin pages - try to extract page name
    const adminIndex = pathParts.indexOf('admin');
    const pagePart = pathParts[adminIndex + 1];
    if (pagePart && pageNameMappings[pagePart]) {
      return pageNameMappings[pagePart];
    }
  }
  
  if (pathParts.includes('storefront') || pathParts.includes('public')) {
    return 'Home';
  }
  
  // Component name extraction from file name
  if (fileName) {
    // Convert PascalCase/camelCase to readable names
    const readableName = fileName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Check if the readable name maps to a known page
    const lowerReadable = readableName.toLowerCase();
    for (const [key, value] of Object.entries(pageNameMappings)) {
      if (lowerReadable.includes(key)) {
        return value;
      }
    }
    
    return readableName;
  }
  
  return null;
}

/**
 * Extract component name from file content
 * @param {string} fileContent - The file content to analyze
 * @returns {string|null} Detected component/page name or null
 */
export function extractComponentNameFromContent(fileContent) {
  if (!fileContent) return null;
  
  // Look for route definitions and path patterns
  const routePatterns = [
    { pattern: /path=["']\/admin\/dashboard["']/, name: 'Dashboard' },
    { pattern: /path=["']\/admin\/products["']/, name: 'Products' },
    { pattern: /path=["']\/admin\/categories["']/, name: 'Categories' },
    { pattern: /path=["']\/admin\/orders["']/, name: 'Orders' },
    { pattern: /path=["']\/admin\/customers["']/, name: 'Customers' },
    { pattern: /path=["']\/admin\/settings["']/, name: 'Settings' },
    { pattern: /path=["']\/admin\/attributes["']/, name: 'Attributes' },
    { pattern: /path=["']\/admin\/plugins["']/, name: 'Plugins' },
    { pattern: /path=["']\/admin\/cms-pages["']/, name: 'CMS Pages' },
    { pattern: /path=["']\/admin\/cms-blocks["']/, name: 'CMS Blocks' },
    { pattern: /path=["']\/admin\/ab-testing["']/, name: 'AB Testing' },
    { pattern: /path=["']\/admin\/integrations["']/, name: 'Integrations' },
    { pattern: /path=["']\/public\/[^"']*\/product\/[^"']*["']/, name: 'Product Detail' },
    { pattern: /path=["']\/public\/[^"']*\/cart["']/, name: 'Cart' },
    { pattern: /path=["']\/public\/[^"']*\/checkout["']/, name: 'Checkout' },
    { pattern: /path=["']\/public\/[^"']*["']/, name: 'Home' }
  ];
  
  // Check for route patterns
  for (const { pattern, name } of routePatterns) {
    if (pattern.test(fileContent)) {
      return name;
    }
  }
  
  // Look for component indicators in content
  const contentIndicators = [
    { keywords: ['ProductCard', 'ProductGrid', 'ProductList'], name: 'Products' },
    { keywords: ['CartSummary', 'CartItem', 'cart'], name: 'Cart' },
    { keywords: ['CheckoutForm', 'checkout'], name: 'Checkout' },
    { keywords: ['CategoryGrid', 'CategoryList', 'category'], name: 'Categories' },
    { keywords: ['ABTesting', 'ab-testing', 'A/B'], name: 'AB Testing' },
    { keywords: ['Dashboard', 'DashboardWidget'], name: 'Dashboard' },
    { keywords: ['OrderList', 'OrderDetail'], name: 'Orders' },
    { keywords: ['CustomerList', 'CustomerDetail'], name: 'Customers' },
    { keywords: ['Settings', 'SettingsForm'], name: 'Settings' },
    { keywords: ['Storefront', 'StorefrontLayout'], name: 'Home' }
  ];
  
  for (const { keywords, name } of contentIndicators) {
    if (keywords.some(keyword => fileContent.includes(keyword))) {
      return name;
    }
  }
  
  // Look for JSX component names
  const componentMatch = fileContent.match(/(?:export\s+default\s+(?:function\s+)?|const\s+)(\w+)/);
  if (componentMatch) {
    const componentName = componentMatch[1];
    // Convert to readable name
    return componentName.replace(/([A-Z])/g, ' $1').trim();
  }
  
  return null;
}

/**
 * Detect component/page name from both file path and content
 * @param {string} filePath - The file path to analyze
 * @param {string} fileContent - The file content to analyze
 * @returns {string|null} Best detected component/page name or null
 */
export function detectComponentName(filePath, fileContent = '') {
  // Check if this is a page file
  const isPageFile = filePath && (filePath.includes('/pages/') || filePath.includes('\\pages\\'));
  
  if (isPageFile) {
    // For page files, prioritize the filename over content
    const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
    
    // Direct page name mappings for common page files
    const pageNameMappings = {
      'Cart': 'Cart',
      'Checkout': 'Checkout', 
      'ProductDetail': 'Product Detail',
      'Storefront': 'Home',
      'Dashboard': 'Dashboard',
      'Products': 'Products',
      'Categories': 'Categories',
      'Orders': 'Orders',
      'Customers': 'Customers',
      'Settings': 'Settings',
      'Attributes': 'Attributes',
      'Plugins': 'Plugins',
      'CmsBlocks': 'CMS Blocks',
      'CmsPages': 'CMS Pages',
      'ABTesting': 'AB Testing',
      'Integrations': 'Integrations'
    };
    
    if (pageNameMappings[fileName]) {
      return pageNameMappings[fileName];
    }
  }
  
  // Try content-based detection first (more accurate for route patterns)
  const contentName = extractComponentNameFromContent(fileContent);
  if (contentName) {
    return contentName;
  }
  
  // Fallback to path-based detection
  const pathName = extractComponentNameFromPath(filePath);
  if (pathName) {
    return pathName;
  }
  
  return null;
}

/**
 * Resolve page name to route using the new API
 * @param {string} pageName - The page name to resolve
 * @param {Object} apiConfig - API configuration with headers
 * @returns {Promise<Object>} Resolution result with route information
 */
export async function resolvePageNameToRoute(pageName, apiConfig = {}) {
  if (!pageName) {
    return { found: false, error: 'No page name provided' };
  }
  
  try {
    // Get authentication token from localStorage
    const token = localStorage.getItem('token');
    
    // Build headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      ...apiConfig.headers
    };
    
    // Add authentication if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use the new page name resolution API endpoint
    const response = await fetch(`/api/store-routes/find-by-page/${encodeURIComponent(pageName)}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        found: true,
        route: data.data.route,
        matchType: data.data.matchType,
        allRoutes: data.data.routes || [data.data.route],
        pageName
      };
    } else {
      return {
        found: false,
        error: data.message || 'Route not found',
        pageName
      };
    }
  } catch (error) {
    console.error('Error resolving page name to route:', error);
    return {
      found: false,
      error: error.message || 'API request failed',
      pageName
    };
  }
}