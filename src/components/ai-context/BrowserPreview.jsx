import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { getStoreSlugFromPublicUrl } from '@/utils/urlUtils';
import { detectComponentName, resolvePageNameToRoute } from '@/utils/componentNameDetection';

/**
 * Browser Preview Component
 * Renders pages as they would appear in a browser with route detection
 */
const BrowserPreview = ({ 
  fileName = '',
  currentCode = '',
  previewMode = 'live',
  className 
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceView, setDeviceView] = useState('desktop'); // desktop, tablet, mobile
  const [showBrowserChrome, setShowBrowserChrome] = useState(true);

  // Get store context for API calls
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  const storeSlug = selectedStore?.slug || selectedStore?.name?.toLowerCase().replace(/\s+/g, '-');
  
  // Create API config with store headers
  const getApiConfig = useCallback(() => {
    const headers = {};
    if (storeId && storeId !== 'undefined') {
      headers['x-store-id'] = storeId;
    }
    return { headers };
  }, [storeId]);

  // Resolve page name to route using the new API
  const resolveRouteFromPageName = useCallback(async (pageName) => {
    try {
      const apiConfig = getApiConfig();
      const resolution = await resolvePageNameToRoute(pageName, apiConfig);
      
      if (resolution.found && resolution.route) {
        console.log(`🎯 Resolved "${pageName}" to route: ${resolution.route.route_path} (${resolution.matchType})`);
        return resolution.route.route_path;
      } else {
        console.warn(`⚠️ Could not resolve page name "${pageName}" to route:`, resolution.error);
      }
    } catch (error) {
      console.warn('Failed to resolve page name to route:', error);
    }
    return null;
  }, [getApiConfig]);

  // Legacy database route resolution for fallback
  const resolveRouteFromDatabase = useCallback(async (targetComponent) => {
    try {
      const apiConfig = getApiConfig();
      
      // Query store routes API to find matching route
      const response = await fetch(`/api/store-routes?target_value=${encodeURIComponent(targetComponent)}&active_only=true`, apiConfig);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          // Return the first matching route
          return data.data[0].route_path;
        }
      }
    } catch (error) {
      console.warn('Failed to resolve route from database:', error);
    }
    return null;
  }, [getApiConfig]);

  // Analyze file content to detect appropriate route
  const analyzeFileContentForRoute = useCallback(async (filePath, fileContent) => {
    if (!filePath) return null;

    // Get current store slug with URL fallback
    const currentStoreSlug = storeSlug || 
                           getStoreSlugFromPublicUrl(window.location.pathname);

    // Component mapping for database queries
    const componentPatterns = [
      { pattern: /path=["']\/public\/[^"']*\/product\/[^"']*["']/, component: 'ProductDetail' },
      { pattern: /path=["']\/public\/[^"']*\/cart["']/, component: 'Cart' },
      { pattern: /path=["']\/public\/[^"']*\/checkout["']/, component: 'Checkout' },
      { pattern: /path=["']\/admin\/ab-testing["']/, component: 'ABTesting' },
      { pattern: /path=["']\/admin\/dashboard["']/, component: 'Dashboard' },
      { pattern: /path=["']\/admin\/products["']/, component: 'ProductListing' },
      { pattern: /path=["']\/admin\/categories["']/, component: 'Categories' },
      { pattern: /path=["']\/admin\/orders["']/, component: 'Orders' },
      { pattern: /path=["']\/admin\/settings["']/, component: 'Settings' },
      { pattern: /path=["']\/admin\/customers["']/, component: 'Customers' },
      { pattern: /path=["']\/admin\/attributes["']/, component: 'Attributes' },
      { pattern: /path=["']\/admin\/plugins["']/, component: 'Plugins' },
      { pattern: /path=["']\/admin\/cms-pages["']/, component: 'CmsPages' },
      { pattern: /path=["']\/admin\/cms-blocks["']/, component: 'CmsBlocks' },
      { pattern: /path=["']\/public\/[^"']*["']/, component: 'Storefront' },
    ];

    // Check file content for route patterns and resolve from database
    if (fileContent) {
      for (const { pattern, component } of componentPatterns) {
        if (pattern.test(fileContent)) {
          const dbRoute = await resolveRouteFromDatabase(component);
          if (dbRoute) {
            return dbRoute;
          }
          // Fallback to legacy behavior if database lookup fails
          return pattern.source.includes('admin') 
            ? `/admin/${component.toLowerCase()}` 
            : `/public/${currentStoreSlug}`;
        }
      }

      // Check for specific component indicators in content
      const contentIndicators = [
        { keywords: ['ProductCard', 'ProductGrid'], component: 'Storefront' },
        { keywords: ['CartSummary', 'cart'], component: 'Cart' },
        { keywords: ['CheckoutForm', 'checkout'], component: 'Checkout' },
        { keywords: ['CategoryGrid', 'category'], component: 'Categories' },
        { keywords: ['ABTesting', 'ab-testing'], component: 'ABTesting' }
      ];

      for (const { keywords, component } of contentIndicators) {
        if (keywords.some(keyword => fileContent.includes(keyword))) {
          const dbRoute = await resolveRouteFromDatabase(component);
          if (dbRoute) {
            return dbRoute;
          }
        }
      }
    }

    return null;
  }, [storeSlug, resolveRouteFromDatabase]);

  // Detect route from file path and content using new page name resolution
  const detectRouteFromFile = useCallback(async (filePath, fileContent = '') => {
    try {
      if (!filePath) {
        console.log(`❌ No file path provided`);
        return `/public/amazing-store`; // Return a default route instead of null
      }

    // Get current store slug with URL fallback - ensure we have a fallback
    const currentStoreSlug = storeSlug || 
                           getStoreSlugFromPublicUrl(window.location.pathname) ||
                           'amazing-store'; // Default fallback store slug

    console.log(`🔍 Detecting route for file: ${filePath}`);
    console.log(`📄 File content length: ${fileContent?.length || 0} characters`);
    console.log(`🏪 Current store slug: "${currentStoreSlug}"`);

    // Check if this is a page file (located in /src/pages/)
    const isPageFile = filePath.includes('/pages/') || filePath.includes('\\pages\\');
    console.log(`📑 Is page file: ${isPageFile}`);

    // For page files, use direct route mapping based on known patterns
    if (isPageFile) {
      const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
      console.log(`📄 Page file name: "${fileName}"`);
      
      // Direct page file to route mapping
      const pageRouteMapping = {
        'Cart': `/public/${currentStoreSlug}/cart`,
        'Checkout': `/public/${currentStoreSlug}/checkout`,
        'ProductDetail': `/public/${currentStoreSlug}/product/sample-product`,
        'Storefront': `/public/${currentStoreSlug}`,
        'Dashboard': `/admin/dashboard`,
        'Products': `/admin/products`,
        'Categories': `/admin/categories`,
        'Orders': `/admin/orders`,
        'Customers': `/admin/customers`,
        'Settings': `/admin/settings`,
        'Attributes': `/admin/attributes`,
        'Plugins': `/admin/plugins`,
        'CmsBlocks': `/admin/cms-blocks`,
        'CmsPages': `/admin/cms-pages`,
        'ABTesting': `/admin/ab-testing`,
        'Integrations': `/admin/integrations`
      };
      
      if (pageRouteMapping[fileName]) {
        const pageRoute = pageRouteMapping[fileName];
        console.log(`🎯 Found direct page route mapping: "${fileName}" -> "${pageRoute}"`);
        return pageRoute;
      } else {
        console.log(`⚠️ No direct mapping found for page "${fileName}", trying component name detection...`);
      }
    }

    // Use the new component name detection to get page name
    const detectedPageName = detectComponentName(filePath, fileContent);
    
    if (detectedPageName) {
      console.log(`📝 Detected page name: "${detectedPageName}"`);
      
      // Try to resolve using the new page name resolution API
      const resolvedRoute = await resolveRouteFromPageName(detectedPageName);
      if (resolvedRoute) {
        console.log(`✅ Resolved page "${detectedPageName}" to route: ${resolvedRoute}`);
        return resolvedRoute;
      } else {
        console.log(`⚠️ Could not resolve page "${detectedPageName}" to database route, trying fallbacks...`);
      }
    } else {
      console.log(`⚠️ No page name detected from file path or content`);
    }

    // Fallback: Try to analyze file content for direct route patterns
    const contentBasedRoute = await analyzeFileContentForRoute(filePath, fileContent);
    if (contentBasedRoute) {
      return contentBasedRoute;
    }

    // Legacy fallback logic for common file path patterns
    const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
    
    // Try to extract page name from file name as a last resort
    const fileBasedPageName = detectComponentName(filePath, '');
    
    if (fileBasedPageName && fileBasedPageName !== 'Home') {
      console.log(`🔍 Trying file-based page name: "${fileBasedPageName}"`);
      const fileBasedRoute = await resolveRouteFromPageName(fileBasedPageName);
      if (fileBasedRoute) {
        console.log(`✅ Found file-based route: ${fileBasedRoute}`);
        return fileBasedRoute;
      } else {
        console.log(`❌ No file-based route found for: "${fileBasedPageName}"`);
      }
    } else {
      console.log(`⚠️ No valid file-based page name. fileBasedPageName: "${fileBasedPageName}"`);
    }
    
    // Check if it's a storefront component - but try to use the detected component name
    console.log(`🏪 Checking if storefront component. Path: ${filePath}`);
    if (filePath.includes('/storefront/') || filePath.includes('/components/storefront/')) {
      // If we detected a specific page, try it first, otherwise fall back to Home
      const targetPageName = detectedPageName || fileBasedPageName || 'Home';
      console.log(`🏪 Storefront component detected. Target page: "${targetPageName}"`);
      
      const storefrontRoute = await resolveRouteFromPageName(targetPageName);
      if (storefrontRoute) {
        console.log(`✅ Found route for ${targetPageName}: ${storefrontRoute}`);
        return storefrontRoute;
      }
      
      // If no database route found, create direct public URL based on page name
      if (targetPageName === 'Cart') {
        // Ensure we always use the correct store slug
        const cartStoreSlug = currentStoreSlug === 'undefined' ? 'amazing-store' : currentStoreSlug;
        const directCartUrl = `/public/${cartStoreSlug}/cart`;
        console.log(`🛒 Creating direct cart URL: ${directCartUrl} (store slug: ${cartStoreSlug})`);
        return directCartUrl;
      } else if (targetPageName === 'Checkout') {
        const directCheckoutUrl = `/public/${currentStoreSlug}/checkout`;
        console.log(`💳 Creating direct checkout URL: ${directCheckoutUrl}`);
        return directCheckoutUrl;
      } else if (targetPageName === 'Product Detail') {
        const directProductUrl = `/public/${currentStoreSlug}/product/sample-product`;
        console.log(`📦 Creating direct product URL: ${directProductUrl}`);
        return directProductUrl;
      }
      
      // Default to home
      return `/public/${currentStoreSlug}`;
    }
    
    // Check if it's an admin component - but try to use the detected component name
    console.log(`⚙️ Checking if admin component. Path: ${filePath}`);
    if (filePath.includes('/admin/') || filePath.includes('/components/admin/')) {
      const targetPageName = detectedPageName || fileBasedPageName || 'Dashboard';
      const adminRoute = await resolveRouteFromPageName(targetPageName);
      return adminRoute || '/admin/dashboard';
    }
    
    // Default fallback - try detected page name first, then home page
    console.log(`🎯 Reaching default fallback section. detectedPageName: "${detectedPageName}"`);
    if (detectedPageName) {
      console.log(`🔍 Trying database route resolution for detected page: "${detectedPageName}"`);
      const detectedRoute = await resolveRouteFromPageName(detectedPageName);
      if (detectedRoute) {
        console.log(`✅ Found database route for ${detectedPageName}: ${detectedRoute}`);
        return detectedRoute;
      }
      
      // If we have a detected page name but no database route, create direct URLs
      console.log(`🔧 Creating direct URL for detected page: "${detectedPageName}"`);
      if (detectedPageName === 'Cart') {
        // Ensure we always use the correct store slug
        const cartStoreSlug = currentStoreSlug === 'undefined' ? 'amazing-store' : currentStoreSlug;
        const cartUrl = `/public/${cartStoreSlug}/cart`;
        console.log(`🛒 Generated Cart URL: ${cartUrl} (store slug: ${cartStoreSlug})`);
        return cartUrl;
      } else if (detectedPageName === 'Checkout') {
        return `/public/${currentStoreSlug}/checkout`;
      } else if (detectedPageName === 'Product Detail') {
        return `/public/${currentStoreSlug}/product/sample-product`;
      } else if (detectedPageName === 'Products') {
        return `/admin/products`;
      } else if (detectedPageName === 'Dashboard') {
        return `/admin/dashboard`;
      } else if (detectedPageName === 'Orders') {
        return `/admin/orders`;
      } else if (detectedPageName === 'Customers') {
        return `/admin/customers`;
      } else if (detectedPageName === 'Settings') {
        return `/admin/settings`;
      }
    }
    
    // Final fallback based on file name
    const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
    const lowerFileName = fileName.toLowerCase();
    
    console.log(`🔧 Final fallback for file name: "${fileName}"`);
    
    // Create URLs based on file name patterns
    if (lowerFileName === 'cart') {
      console.log(`🛒 Direct cart URL fallback`);
      return `/public/${currentStoreSlug}/cart`;
    } else if (lowerFileName === 'checkout') {
      console.log(`💳 Direct checkout URL fallback`);
      return `/public/${currentStoreSlug}/checkout`;
    } else if (lowerFileName.includes('product') && !lowerFileName.includes('admin')) {
      console.log(`📦 Direct product URL fallback`);
      return `/public/${currentStoreSlug}/product/sample-product`;
    } else if (lowerFileName.includes('admin') || filePath.includes('/admin/')) {
      console.log(`⚙️ Admin dashboard fallback`);
      return `/admin/dashboard`;
    }
    
    // Final home page fallback
    const homeRoute = await resolveRouteFromPageName('Home');
    const finalRoute = homeRoute || `/public/${currentStoreSlug}`;
    console.log(`🏠 Using final route: ${finalRoute}`);
    
    // Ensure we NEVER return null
    if (!finalRoute) {
      console.log(`🚨 Emergency fallback - returning basic store URL`);
      return `/public/amazing-store`;
    }
    
    return finalRoute;
    
    } catch (error) {
      console.error(`🚨 Error in detectRouteFromFile:`, error);
      const fallbackStoreSlug = storeSlug || 'amazing-store';
      
      // Try to determine route based on just the file name as emergency fallback
      const fileName = filePath?.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
      if (fileName.toLowerCase() === 'cart') {
        return `/public/${fallbackStoreSlug}/cart`;
      } else if (fileName.toLowerCase() === 'checkout') {
        return `/public/${fallbackStoreSlug}/checkout`;
      } else if (fileName.toLowerCase().includes('admin')) {
        return `/admin/dashboard`;
      }
      
      return `/public/${fallbackStoreSlug}`;
    }
  }, [storeSlug, resolveRouteFromPageName, analyzeFileContentForRoute]);

  // State for detected route and page name
  const [detectedRoute, setDetectedRoute] = useState(null);
  const [detectedPageName, setDetectedPageName] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Detect route asynchronously when file or content changes
  useEffect(() => {
    let isCancelled = false;
    
    const resolveRoute = async () => {
      if (!fileName) {
        setDetectedRoute(null);
        setDetectedPageName(null);
        return;
      }

      setRouteLoading(true);
      setError(null);
      
      try {
        // Detect page name first
        const pageName = detectComponentName(fileName, currentCode);
        if (!isCancelled) {
          setDetectedPageName(pageName);
        }
        
        // Then resolve route
        const route = await detectRouteFromFile(fileName, currentCode);
        if (!isCancelled) {
          setDetectedRoute(route);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Route detection failed:', error);
          setError('Failed to detect route from database');
          setDetectedRoute(null);
          setDetectedPageName(null);
        }
      } finally {
        if (!isCancelled) {
          setRouteLoading(false);
        }
      }
    };

    resolveRoute();
    
    return () => {
      isCancelled = true;
    };
  }, [fileName, currentCode, detectRouteFromFile]);

  // Update preview URL when route changes
  useEffect(() => {
    if (detectedRoute) {
      // Use current domain for preview
      const baseUrl = window.location.origin;
      setPreviewUrl(`${baseUrl}${detectedRoute}`);
      setError(null);
    } else if (!routeLoading) {
      setPreviewUrl(null);
      setError('Could not determine preview route for this file');
    }
  }, [detectedRoute, routeLoading]);

  // Device view dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%', maxWidth: '100%' },
    tablet: { width: '768px', height: '1024px', maxWidth: '768px' },
    mobile: { width: '375px', height: '667px', maxWidth: '375px' }
  };

  const currentDimensions = deviceDimensions[deviceView];

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load preview. The route may not be accessible or the server may be down.');
  }, []);

  // Refresh preview
  const refreshPreview = useCallback(() => {
    setIsLoading(true);
    setError(null);
    // Force iframe refresh by updating the src
    const iframe = document.getElementById('browser-preview-iframe');
    if (iframe && previewUrl) {
      iframe.src = previewUrl + '?preview=' + Date.now();
    }
  }, [previewUrl]);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  if (!previewUrl && !error) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Globe className={cn("w-8 h-8 mx-auto mb-2 opacity-50", routeLoading && "animate-pulse")} />
          <p className="text-sm">
            {routeLoading ? 'Resolving route from database...' : 'Detecting preview route...'}
          </p>
          <p className="text-xs mt-1">Analyzing file path: {fileName}</p>
          {detectedPageName && (
            <p className="text-xs mt-1 text-blue-500 dark:text-blue-400">
              📝 Detected page: "{detectedPageName}"
            </p>
          )}
          {routeLoading && (
            <p className="text-xs mt-1 text-blue-500 dark:text-blue-400">
              🔄 Querying store routes API
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-orange-600 dark:text-orange-400 p-4">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-2 text-gray-500">File: {fileName}</p>
          {detectedPageName && (
            <p className="text-xs mt-1 text-gray-500">
              Detected page: "{detectedPageName}" (no route found)
            </p>
          )}
          {detectedRoute && (
            <p className="text-xs mt-1 text-gray-500">Attempted route: {detectedRoute}</p>
          )}
          <p className="text-xs mt-2 text-gray-400">
            💡 Try creating a route for "{detectedPageName || 'this page'}" in your store routes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-gray-100 dark:bg-gray-800", className)}>
      {/* Browser Chrome Header */}
      {showBrowserChrome && (
        <div className="bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-2">
          <div className="flex items-center justify-between">
            {/* Browser Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {/* Address Bar */}
            <div className="flex-1 mx-4">
              <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                {previewUrl}
              </div>
            </div>

            {/* Browser Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshPreview}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh preview"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </button>
              
              <button
                onClick={openInNewTab}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowBrowserChrome(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Hide browser chrome"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device View Controls */}
          <div className="flex items-center justify-center mt-2 space-x-2">
            <button
              onClick={() => setDeviceView('desktop')}
              className={cn(
                "p-1 rounded text-xs",
                deviceView === 'desktop' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
              )}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setDeviceView('tablet')}
              className={cn(
                "p-1 rounded text-xs",
                deviceView === 'tablet' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
              )}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setDeviceView('mobile')}
              className={cn(
                "p-1 rounded text-xs",
                deviceView === 'mobile' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
              )}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Show browser chrome button when hidden */}
      {!showBrowserChrome && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowBrowserChrome(true)}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-md"
            title="Show browser chrome"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading preview...</p>
            </div>
          </div>
        )}

        <div 
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg transition-all duration-300"
          style={{
            width: currentDimensions.width,
            height: currentDimensions.height,
            maxWidth: currentDimensions.maxWidth,
            minHeight: deviceView === 'desktop' ? '100%' : currentDimensions.height
          }}
        >
          <iframe
            id="browser-preview-iframe"
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Preview of ${fileName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>🌐 Live Preview</span>
            {detectedPageName && (
              <span>Page: {detectedPageName}</span>
            )}
            <span>Route: {detectedRoute}</span>
            <span>Device: {deviceView}</span>
          </div>
          <div className="text-xs">
            File: {fileName.split('/').pop()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserPreview;