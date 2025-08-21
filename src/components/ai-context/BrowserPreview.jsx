import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreSlug } from '@/hooks/useStoreSlug';
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

  // Detect route from file path
  const detectRouteFromFile = useCallback((filePath) => {
    if (!filePath) return null;

    // Use actual store slug from context, or try to extract from current URL, or fallback to default
    const currentStoreSlug = storeSlug || 
                           getStoreSlugFromPublicUrl(window.location.pathname) || 
                           'amazing-store';
    
    // Map file paths to their corresponding routes
    const routeMapping = {
      // Pages directory mappings
      'src/pages/Storefront.jsx': `/public/${currentStoreSlug}`,
      'src/pages/ProductDetail.jsx': `/public/${currentStoreSlug}/product/sample-product`,
      'src/pages/Cart.jsx': `/public/${currentStoreSlug}/cart`,
      'src/pages/Checkout.jsx': `/public/${currentStoreSlug}/checkout`,
      'src/pages/OrderSuccess.jsx': `/public/${currentStoreSlug}/order-success/12345`,
      'src/pages/CustomerAuth.jsx': `/public/${currentStoreSlug}/login`,
      'src/pages/CustomerDashboard.jsx': `/public/${currentStoreSlug}/account`,
      
      // Admin pages
      'src/pages/Dashboard.jsx': '/admin/dashboard',
      'src/pages/Products.jsx': '/admin/products',
      'src/pages/Categories.jsx': '/admin/categories',
      'src/pages/Orders.jsx': '/admin/orders',
      'src/pages/Settings.jsx': '/admin/settings',
      'src/pages/Attributes.jsx': '/admin/attributes',
      'src/pages/Plugins.jsx': '/admin/plugins',
      'src/pages/CmsPages.jsx': '/admin/cms-pages',
      'src/pages/CmsBlocks.jsx': '/admin/cms-blocks',
      'src/pages/Customers.jsx': '/admin/customers',
      
      // Component mappings (try to guess based on component name)
      'src/components/storefront/ProductCard.jsx': `/public/${currentStoreSlug}`,
      'src/components/storefront/CategoryGrid.jsx': `/public/${currentStoreSlug}/category/sample-category`,
      'src/components/storefront/CartSummary.jsx': `/public/${currentStoreSlug}/cart`,
      'src/components/storefront/CheckoutForm.jsx': `/public/${currentStoreSlug}/checkout`,
      'src/components/storefront/Header.jsx': `/public/${currentStoreSlug}`,
      'src/components/storefront/Footer.jsx': `/public/${currentStoreSlug}`,
      'src/components/storefront/Navigation.jsx': `/public/${currentStoreSlug}`,
      
      // Landing and auth pages
      'src/pages/Landing.jsx': '/',
      'src/pages/Auth.jsx': '/admin/login',
    };

    // Check for exact match first
    if (routeMapping[filePath]) {
      return routeMapping[filePath];
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
  }, [storeSlug]);

  // Get preview URL based on file
  const detectedRoute = useMemo(() => {
    return detectRouteFromFile(fileName);
  }, [fileName, detectRouteFromFile]);

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