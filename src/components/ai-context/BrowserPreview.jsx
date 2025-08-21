import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreContext } from '@/utils/storeContext';
import { getStoreSlugFromPublicUrl } from '@/utils/urlUtils';

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

  // Get store context using unified utility
  const { getStoreSlug, getApiConfig } = useStoreContext();

  // Query database for route resolution
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

    // Get current store slug from unified context with URL fallback
    const currentStoreSlug = getStoreSlug() || 
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
  }, [getStoreSlug, resolveRouteFromDatabase]);

  // Detect route from file path and content (now async for database queries)
  const detectRouteFromFile = useCallback(async (filePath, fileContent = '') => {
    if (!filePath) return null;

    // Get current store slug from unified context with URL fallback
    const currentStoreSlug = getStoreSlug() || 
                           getStoreSlugFromPublicUrl(window.location.pathname);

    // First try to analyze file content for route information
    const contentBasedRoute = await analyzeFileContentForRoute(filePath, fileContent);
    if (contentBasedRoute) {
      return contentBasedRoute;
    }

    // Try to infer route from file name and resolve from database
    const fileName = filePath.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');
    
    // Check if it's a storefront component
    if (filePath.includes('/storefront/') || filePath.includes('/components/storefront/')) {
      const dbRoute = await resolveRouteFromDatabase('Storefront');
      return dbRoute || `/public/${currentStoreSlug}`;
    }
    
    // Check if it's an admin component
    if (filePath.includes('/admin/') || filePath.includes('/components/admin/')) {
      const dbRoute = await resolveRouteFromDatabase('Dashboard');
      return dbRoute || '/admin/dashboard';
    }
    
    // Check if it's a page component
    if (filePath.includes('/pages/')) {
      const pageName = fileName.toLowerCase();
      
      // Map page names to components for database lookup
      const pageComponentMap = {
        'dashboard': 'Dashboard',
        'products': 'ProductListing',  
        'categories': 'Categories',
        'orders': 'Orders',
        'settings': 'Settings',
        'customers': 'Customers',
        'storefront': 'Storefront',
        'shop': 'Storefront',
        'home': 'Storefront',
        'productdetail': 'ProductDetail',
        'cart': 'Cart',
        'checkout': 'Checkout',
        'abtesting': 'ABTesting'
      };
      
      const componentName = pageComponentMap[pageName];
      if (componentName) {
        const dbRoute = await resolveRouteFromDatabase(componentName);
        if (dbRoute) {
          return dbRoute;
        }
      }
      
      // Legacy fallbacks if database lookup fails
      if (['dashboard', 'products', 'categories', 'orders', 'settings', 'customers'].includes(pageName)) {
        return `/admin/${pageName}`;
      }
      
      if (['storefront', 'shop', 'home'].includes(pageName)) {
        return `/public/${currentStoreSlug}`;
      }
      
      if (pageName === 'productdetail') {
        return `/public/${currentStoreSlug}/product/sample-product`;
      }
      
      if (pageName === 'cart') {
        return `/public/${currentStoreSlug}/cart`;
      }
      
      if (pageName === 'checkout') {
        return `/public/${currentStoreSlug}/checkout`;
      }
    }
    
    // Default fallback - try to get home route from database or show storefront
    const homeRoute = await resolveRouteFromDatabase('Storefront');
    return homeRoute || `/public/${currentStoreSlug}`;
  }, [getStoreSlug, analyzeFileContentForRoute, resolveRouteFromDatabase]);

  // State for detected route
  const [detectedRoute, setDetectedRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Detect route asynchronously when file or content changes
  useEffect(() => {
    let isCancelled = false;
    
    const resolveRoute = async () => {
      if (!fileName) {
        setDetectedRoute(null);
        return;
      }

      setRouteLoading(true);
      setError(null);
      
      try {
        const route = await detectRouteFromFile(fileName, currentCode);
        if (!isCancelled) {
          setDetectedRoute(route);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Route detection failed:', error);
          setError('Failed to detect route from database');
          setDetectedRoute(null);
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
          {detectedRoute && (
            <p className="text-xs mt-1 text-gray-500">Detected route: {detectedRoute}</p>
          )}
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