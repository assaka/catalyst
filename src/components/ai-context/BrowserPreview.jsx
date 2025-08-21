import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreSlug } from '@/hooks/useStoreSlug';
import { useStore } from '@/components/storefront/StoreProvider';
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

  // Get actual store slug from current context
  const { storeSlug, isStoreContext } = useStoreSlug();
  
  // Get store data from StoreProvider context
  const { store } = useStore() || {};

  // Analyze file content to detect appropriate route
  const analyzeFileContentForRoute = useCallback((filePath, fileContent) => {
    if (!filePath) return null;

    // Use actual store slug from context, or try to extract from current URL, or use store data fallback
    const currentStoreSlug = storeSlug || 
                           getStoreSlugFromPublicUrl(window.location.pathname) || 
                           store?.slug || 
                           store?.code || 
                           'demo-store';

    // Check if content contains React Router route definitions
    const routePatterns = [
      // Look for exact route patterns in the code
      { pattern: /path=["']\/public\/[^"']*\/product\/[^"']*["']/, route: `/public/${currentStoreSlug}/product/sample-product` },
      { pattern: /path=["']\/public\/[^"']*\/cart["']/, route: `/public/${currentStoreSlug}/cart` },
      { pattern: /path=["']\/public\/[^"']*\/checkout["']/, route: `/public/${currentStoreSlug}/checkout` },
      { pattern: /path=["']\/public\/[^"']*\/login["']/, route: `/public/${currentStoreSlug}/login` },
      { pattern: /path=["']\/public\/[^"']*\/account["']/, route: `/public/${currentStoreSlug}/account` },
      { pattern: /path=["']\/public\/[^"']*\/order-success["']/, route: `/public/${currentStoreSlug}/order-success/12345` },
      { pattern: /path=["']\/public\/[^"']*["']/, route: `/public/${currentStoreSlug}` },
      
      // Admin route patterns
      { pattern: /path=["']\/admin\/dashboard["']/, route: '/admin/dashboard' },
      { pattern: /path=["']\/admin\/products["']/, route: '/admin/products' },
      { pattern: /path=["']\/admin\/categories["']/, route: '/admin/categories' },
      { pattern: /path=["']\/admin\/orders["']/, route: '/admin/orders' },
      { pattern: /path=["']\/admin\/settings["']/, route: '/admin/settings' },
      { pattern: /path=["']\/admin\/customers["']/, route: '/admin/customers' },
      { pattern: /path=["']\/admin\/attributes["']/, route: '/admin/attributes' },
      { pattern: /path=["']\/admin\/plugins["']/, route: '/admin/plugins' },
      { pattern: /path=["']\/admin\/cms-pages["']/, route: '/admin/cms-pages' },
      { pattern: /path=["']\/admin\/cms-blocks["']/, route: '/admin/cms-blocks' },
      { pattern: /path=["']\/admin["']/, route: '/admin/dashboard' },
    ];

    // Check file content for route patterns
    if (fileContent) {
      for (const { pattern, route } of routePatterns) {
        if (pattern.test(fileContent)) {
          return route;
        }
      }

      // Check for specific component indicators in content
      if (fileContent.includes('ProductCard') || fileContent.includes('ProductGrid')) {
        return `/public/${currentStoreSlug}`;
      }
      if (fileContent.includes('CartSummary') || fileContent.includes('cart')) {
        return `/public/${currentStoreSlug}/cart`;
      }
      if (fileContent.includes('CheckoutForm') || fileContent.includes('checkout')) {
        return `/public/${currentStoreSlug}/checkout`;
      }
      if (fileContent.includes('CategoryGrid') || fileContent.includes('category')) {
        return `/public/${currentStoreSlug}/category/sample-category`;
      }
    }

    return null;
  }, [storeSlug, store]);

  // Detect route from file path and content
  const detectRouteFromFile = useCallback((filePath, fileContent = '') => {
    if (!filePath) return null;

    // Use actual store slug from context, or try to extract from current URL, or use store data fallback
    const currentStoreSlug = storeSlug || 
                           getStoreSlugFromPublicUrl(window.location.pathname) || 
                           store?.slug || 
                           store?.code || 
                           'demo-store';

    // First try to analyze file content for route information
    const contentBasedRoute = analyzeFileContentForRoute(filePath, fileContent);
    if (contentBasedRoute) {
      return contentBasedRoute;
    }

    // Try to infer route from file name
    const fileName = filePath.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');
    
    // Check if it's a storefront component
    if (filePath.includes('/storefront/') || filePath.includes('/components/storefront/')) {
      return `/public/${currentStoreSlug}`;
    }
    
    // Check if it's an admin component
    if (filePath.includes('/admin/') || filePath.includes('/components/admin/')) {
      return '/admin/dashboard';
    }
    
    // Check if it's a page component
    if (filePath.includes('/pages/')) {
      const pageName = fileName.toLowerCase();
      
      // Admin pages
      if (['dashboard', 'products', 'categories', 'orders', 'settings', 'customers'].includes(pageName)) {
        return `/admin/${pageName}`;
      }
      
      // Public pages
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
    
    // Default fallback - show storefront
    return `/public/${currentStoreSlug}`;
  }, [storeSlug, store]);

  // Get preview URL based on file and content
  const detectedRoute = useMemo(() => {
    return detectRouteFromFile(fileName, currentCode);
  }, [fileName, currentCode, detectRouteFromFile]);

  // Update preview URL when route changes
  useEffect(() => {
    if (detectedRoute) {
      // Use current domain for preview
      const baseUrl = window.location.origin;
      setPreviewUrl(`${baseUrl}${detectedRoute}`);
      setError(null);
    } else {
      setPreviewUrl(null);
      setError('Could not determine preview route for this file');
    }
  }, [detectedRoute]);

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
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Detecting preview route...</p>
          <p className="text-xs mt-1">Analyzing file path: {fileName}</p>
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