import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet, Code, Layers } from 'lucide-react';
import { useOverlayManager } from '../../services/overlay-manager';
import { cn } from '@/lib/utils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { getStoreSlugFromPublicUrl, createPublicUrl } from '@/utils/urlUtils';
import { detectComponentName, resolvePageNameToRoute } from '@/utils/componentNameDetection';
import apiClient from '@/api/client';

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
  const [enablePatches, setEnablePatches] = useState(true); // Enable code patch simulation
  
  // Overlay state management using existing overlay manager
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMode, setOverlayMode] = useState('merged'); // 'baseline', 'merged', 'editor'
  const [coreCode, setCoreCode] = useState(''); // Immutable base code
  const [overlayData, setOverlayData] = useState({ baseline: null, current: null, hasOverlay: false });
  const { manager: overlayManager, stats: overlayStats, getMergedContent, setOriginalCode, createOverlay, clearFileOverlays } = useOverlayManager();
  
  // Use ref to break circular dependencies
  const applyCodePatchesRef = useRef(null);

  // Initialize overlay system when file changes
  useEffect(() => {
    if (fileName && currentCode) {
      // Set original code in overlay manager
      setOriginalCode(fileName, currentCode);
      setCoreCode(currentCode);
    }
  }, [fileName, currentCode, setOriginalCode]);

  // Apply live code changes as overlays
  useEffect(() => {
    if (fileName && currentCode && coreCode && currentCode !== coreCode) {
      // Create or update overlay with current changes
      const overlay = createOverlay(fileName, currentCode, {
        changeType: 'live_edit',
        changeSummary: 'Live code editing',
        priority: 1
      });
      
      if (overlay) {
        console.log('🔄 Applied live code change as overlay');
      }
    }
  }, [currentCode, coreCode, fileName, createOverlay]);

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



  // Detect route from page files only
  const detectRouteFromFile = useCallback(async (filePath, fileContent = '') => {
    try {
      if (!filePath) {
        console.log(`❌ No file path provided`);
        return null;
      }

      // Get current store slug with fallback
      const currentStoreSlug = storeSlug || 
                             getStoreSlugFromPublicUrl(window.location.pathname) ||
                             'amazing-store';

      console.log(`🔍 Detecting route for file: ${filePath}`);
      console.log(`🏪 Current store slug: "${currentStoreSlug}"`);

      // Only process page files (located in /src/pages/)
      const isPageFile = filePath.includes('/pages/') || filePath.includes('\\pages\\');
      console.log(`📑 Is page file: ${isPageFile}`);

      if (!isPageFile) {
        console.log(`⚠️ Not a page file - preview only works for page files`);
        return null;
      }

      const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
      // Handle Windows paths
      const finalFileName = fileName.split('\\').pop() || fileName;
      console.log(`📄 Page file name: "${finalFileName}"`);
      
      // Use page name resolution API to get route from store_routes table
      const detectedPageName = detectComponentName(filePath, fileContent);
      const pageName = detectedPageName || finalFileName;
      
      console.log(`🔍 Resolving page "${pageName}" using store_routes table`);
      const resolvedRoute = await resolveRouteFromPageName(pageName);
      
      if (resolvedRoute) {
        console.log(`🎯 Database route resolution: "${pageName}" -> "${resolvedRoute}"`);
        return resolvedRoute;
      }

      console.log(`⚠️ No route found in store_routes table for page "${pageName}"`);
      return null;
    
    } catch (error) {
      console.error(`🚨 Error in detectRouteFromFile:`, error);
      return null;
    }
  }, [storeSlug]);

  // State for detected route and page name
  const [detectedRoute, setDetectedRoute] = useState(null);
  const [detectedPageName, setDetectedPageName] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Detect route for page files only
  useEffect(() => {
    let isCancelled = false;
    
    const resolveRoute = async () => {
      if (!fileName) {
        setDetectedRoute(null);
        setDetectedPageName(null);
        return;
      }

      // Check if this is a page file first
      const isPageFile = fileName.includes('/pages/') || fileName.includes('\\pages\\');
      
      if (!isPageFile) {
        setDetectedRoute(null);
        setDetectedPageName(null);
        setError('Preview only works for page files (located in /src/pages/)');
        return;
      }

      setRouteLoading(true);
      setError(null);
      
      try {
        // Detect page name from file path
        const fileNameOnly = fileName.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
        const finalFileName = fileNameOnly.split('\\').pop() || fileNameOnly;
        
        if (!isCancelled) {
          setDetectedPageName(finalFileName);
        }
        
        // Resolve route for page file
        const route = await detectRouteFromFile(fileName, currentCode);
        if (!isCancelled) {
          if (route) {
            setDetectedRoute(route);
          } else {
            setError(`No route mapping found for page "${finalFileName}"`);
            setDetectedRoute(null);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Route detection failed:', error);
          setError('Failed to detect route for page file');
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

  // Convert route path to page name for proper URL construction
  const convertRouteToPageName = useCallback((routePath) => {
    if (!routePath) return null;
    
    // Map common route paths to page names for createPublicUrl
    const routeToPageMap = {
      '/': 'STOREFRONT',
      '/cart': 'CART',
      '/checkout': 'CHECKOUT',
      '/shop': 'SHOP',
      '/search': 'SEARCH',
      '/login': 'CUSTOMER_AUTH',
      '/register': 'CUSTOMER_REGISTER',
      '/account': 'CUSTOMER_DASHBOARD',
      '/my-account': 'MY_ACCOUNT',
      '/orders': 'CUSTOMER_ORDERS',
      '/my-orders': 'MY_ORDERS',
      '/profile': 'CUSTOMER_PROFILE'
    };
    
    // Check direct mapping first
    if (routeToPageMap[routePath]) {
      return routeToPageMap[routePath];
    }
    
    // Handle product detail routes like /product/:slug
    if (routePath.startsWith('/product/')) {
      return 'PRODUCT_DETAIL';
    }
    
    // Handle category routes like /category/:slug
    if (routePath.startsWith('/category/')) {
      return 'CATEGORY';
    }
    
    // Handle brand routes like /brand/:slug
    if (routePath.startsWith('/brand/')) {
      return 'BRAND';
    }
    
    // For unmapped routes, try to extract the page name from the path
    const pathParts = routePath.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return pathParts[0].toUpperCase().replace(/-/g, '_');
    }
    
    return null;
  }, []);

  // Update preview URL when route changes
  useEffect(() => {
    if (detectedRoute && storeSlug) {
      try {
        const pageName = convertRouteToPageName(detectedRoute);
        
        if (pageName) {
          // Use createPublicUrl to generate proper /public/:store_code/page format
          const properUrl = createPublicUrl(storeSlug, pageName);
          const baseUrl = window.location.origin;
          setPreviewUrl(`${baseUrl}${properUrl}`);
          console.log(`🎯 Generated preview URL: ${baseUrl}${properUrl} (route: ${detectedRoute} -> page: ${pageName})`);
          setError(null);
        } else {
          // Fallback to direct URL construction if no page mapping found
          const baseUrl = window.location.origin;
          const fallbackUrl = `/public/${storeSlug}${detectedRoute}`;
          setPreviewUrl(`${baseUrl}${fallbackUrl}`);
          console.log(`⚠️ Using fallback URL construction: ${baseUrl}${fallbackUrl}`);
          setError(null);
        }
      } catch (error) {
        console.error('Error generating preview URL:', error);
        setPreviewUrl(null);
        setError('Failed to generate preview URL');
      }
    } else if (!routeLoading) {
      setPreviewUrl(null);
      setError('Could not determine preview route for this file');
    }
  }, [detectedRoute, routeLoading, storeSlug, convertRouteToPageName]);

  // Device view dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%', maxWidth: '100%' },
    tablet: { width: '768px', height: '1024px', maxWidth: '768px' },
    mobile: { width: '375px', height: '667px', maxWidth: '375px' }
  };

  const currentDimensions = deviceDimensions[deviceView];


  // Enhanced overlay status check - now uses server-side merged code
  const checkOverlayStatus = useCallback(async (fileName) => {
    try {
      console.log(`🔍 BrowserPreview: Checking overlay status for file: ${fileName}`);
      
      // Use authenticated API client to check if overlay exists
      const customHeaders = {};
      if (storeId && storeId !== 'undefined') {
        customHeaders['x-store-id'] = storeId;
      }
      
      // Check overlay status with both baseline and merged modes
      const [mergedData, baselineData] = await Promise.all([
        apiClient.get(`hybrid-patches/modified-code/${encodeURIComponent(fileName)}?mode=merged&processed=false`, customHeaders),
        apiClient.get(`hybrid-patches/modified-code/${encodeURIComponent(fileName)}?mode=baseline&processed=false`, customHeaders)
      ]);
      
      const hasOverlay = mergedData?.success && mergedData?.data?.hasOverlay;
      
      if (hasOverlay) {
        console.log(`✅ BrowserPreview: Found server-side overlay for ${fileName}`);
        console.log(`📊 Overlay stats: ${mergedData.data.appliedSnapshots || 0} snapshots applied`);
        
        // Update overlay data state for UI toggle
        const overlayResult = {
          baseline: baselineData?.data?.modifiedCode || null,
          current: mergedData?.data?.modifiedCode || null,
          hasOverlay: true,
          appliedSnapshots: mergedData.data.appliedSnapshots || 0,
          customizationId: mergedData.data.customizationId,
          lastModified: mergedData.data.lastModified
        };
        
        setOverlayData(overlayResult);
        
        return {
          hasOverlay: true,
          appliedSnapshots: mergedData.data.appliedSnapshots || 0,
          customizationId: mergedData.data.customizationId,
          lastModified: mergedData.data.lastModified,
          matchedPath: fileName,
          requestedPath: fileName
        };
      } else {
        console.log(`❌ BrowserPreview: No server-side overlay found for ${fileName}`);
        
        // Update overlay data state to show no overlay
        setOverlayData({
          baseline: null,
          current: null,
          hasOverlay: false
        });
        
        return { hasOverlay: false };
      }
    } catch (error) {
      console.error('❌ BrowserPreview: Error checking overlay status:', error);
      
      setOverlayData({
        baseline: null,
        current: null,
        hasOverlay: false
      });
      
      return { hasOverlay: false };
    }
  }, [storeId]);

  // Server-side overlay application using URL parameters - no DOM manipulation needed
  const applyCodePatches = useCallback(async (iframe) => {
    if (!fileName) return;
    
    try {
      console.log(`🔄 BrowserPreview: Server-side overlay application for: ${fileName} (mode: ${overlayMode})`);
      
      // Check if overlay exists for this file
      const overlayStatus = await checkOverlayStatus(fileName);
      
      if (overlayStatus.hasOverlay) {
        console.log(`✅ BrowserPreview: Server-side overlay found for ${fileName}. Mode: ${overlayMode}`);
        console.log(`📊 Overlay stats: ${overlayStatus.appliedSnapshots || 0} snapshots accumulated`);
        
        // Instead of DOM manipulation, refresh the iframe with overlay parameters
        // The server will serve the properly merged code based on the mode
        const currentUrl = iframe.src || previewUrl;
        if (currentUrl) {
          const url = new URL(currentUrl);
          
          // Add overlay mode parameter to tell server which version to serve
          if (overlayMode === 'baseline') {
            url.searchParams.set('overlay_mode', 'baseline');
          } else {
            url.searchParams.set('overlay_mode', 'merged');
          }
          
          // Add file parameter so server knows which file's overlay to apply
          url.searchParams.set('overlay_file', fileName);
          
          console.log(`🔄 BrowserPreview: Refreshing iframe with server-side overlay mode: ${overlayMode}`);
          iframe.src = url.toString();
        }
      } else {
        console.log(`❌ BrowserPreview: No server-side overlay found for ${fileName} - showing editor content`);
        
        // No overlay exists, remove any overlay parameters and show normal page
        const currentUrl = iframe.src || previewUrl;
        if (currentUrl) {
          const url = new URL(currentUrl);
          url.searchParams.delete('overlay_mode');
          url.searchParams.delete('overlay_file');
          
          if (url.toString() !== currentUrl) {
            console.log(`🔄 BrowserPreview: Refreshing iframe without overlay parameters`);
            iframe.src = url.toString();
          }
        }
      }
    } catch (error) {
      console.error('❌ BrowserPreview: Error applying server-side overlay:', error);
      
      // On error, try to refresh iframe without overlay parameters
      const currentUrl = iframe.src || previewUrl;
      if (currentUrl) {
        const url = new URL(currentUrl);
        url.searchParams.delete('overlay_mode');
        url.searchParams.delete('overlay_file');
        iframe.src = url.toString();
      }
    }
  }, [fileName, overlayMode, checkOverlayStatus, previewUrl]);

  // Assign function to ref to break circular dependencies
  useEffect(() => {
    applyCodePatchesRef.current = applyCodePatches;
  }, [applyCodePatches]);

  // Trigger overlay reapplication when overlay mode changes
  useEffect(() => {
    if (overlayData.hasOverlay && enablePatches) {
      const iframe = document.getElementById('browser-preview-iframe');
      if (iframe && applyCodePatchesRef.current) {
        console.log(`🔄 BrowserPreview: Overlay mode changed to ${overlayMode}, reapplying...`);
        setTimeout(() => {
          if (applyCodePatchesRef.current) {
            applyCodePatchesRef.current(iframe);
          }
        }, 100);
      }
    }
  }, [overlayMode, overlayData.hasOverlay, enablePatches]);

  // Parse code changes from the current file content

  // Handle iframe load - simplified approach
  const handleIframeLoad = useCallback(async () => {
    setIsLoading(false);
    
    // Apply code patches immediately after iframe loads (if enabled)
    const iframe = document.getElementById('browser-preview-iframe');
    if (iframe && currentCode && enablePatches && applyCodePatchesRef.current) {
      console.log('✅ BrowserPreview: Applying patches directly after iframe load');
      
      // Simple delay to ensure iframe document is accessible
      setTimeout(() => {
        if (applyCodePatchesRef.current) {
          applyCodePatchesRef.current(iframe);
        }
      }, 100);
    }
  }, [currentCode, enablePatches]);

  // Watch for currentCode changes and reapply patches
  useEffect(() => {
    const iframe = document.getElementById('browser-preview-iframe');
    
    // Only apply patches if iframe is loaded and we have code changes
    if (iframe && currentCode && enablePatches && !isLoading) {
      const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      
      // Make sure iframe document is ready
      if (iframeDoc && applyCodePatchesRef.current) {
        console.log('🔄 Code changes detected, reapplying patches...');
        applyCodePatchesRef.current(iframe);
      }
    }
  }, [currentCode, enablePatches, isLoading]);

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
      // Patches will be reapplied automatically via handleIframeLoad
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
              {/* Overlay Toggle with Mode Selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    if (overlayData.hasOverlay) {
                      // Toggle between baseline and merged modes
                      const newMode = overlayMode === 'baseline' ? 'merged' : 'baseline';
                      setOverlayMode(newMode);
                      console.log(`🔄 BrowserPreview: Toggled overlay to ${newMode} mode`);
                    } else {
                      // No overlay data available, just show overlay system
                      setShowOverlay(!showOverlay);
                    }
                  }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md border font-medium transition-colors",
                    (overlayData.hasOverlay && overlayMode !== 'baseline') || (showOverlay && !overlayData.hasOverlay)
                      ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-300" 
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                  )}
                  title={overlayData.hasOverlay
                    ? `Toggle overlay changes (${overlayMode === 'baseline' ? 'click to show' : 'click to hide'} server-side overlays)`
                    : "Show overlay system (non-destructive code patches)"
                  }
                >
                  <Layers className="w-3 h-3 mr-1 inline" />
                  {overlayData.hasOverlay 
                    ? (overlayMode === 'baseline' ? "Show Overlay" : "Hide Overlay")
                    : "Overlay"
                  }
                </button>
                
                {/* Advanced Mode Selector - show when overlay is available and user wants more control */}
                {overlayData.hasOverlay && showOverlay && (
                  <select
                    value={overlayMode}
                    onChange={(e) => setOverlayMode(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-1 focus:ring-purple-200 dark:focus:ring-purple-800"
                    title="Advanced mode selector - choose exact content version"
                  >
                    <option value="baseline">Baseline (Original)</option>
                    <option value="merged">Merged (With Changes)</option>
                    <option value="editor">Editor (Live Code)</option>
                  </select>
                )}
                
                {/* Show advanced controls toggle - only when overlay data is available */}
                {overlayData.hasOverlay && (
                  <button
                    onClick={() => setShowOverlay(!showOverlay)}
                    className="px-2 py-1 text-xs rounded-md border bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 transition-colors"
                    title="Show advanced overlay controls"
                  >
                    ⚙️
                  </button>
                )}
              </div>

              <button
                onClick={() => setEnablePatches(!enablePatches)}
                className={cn(
                  "px-3 py-1 text-xs rounded-md border font-medium transition-colors",
                  enablePatches 
                    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300" 
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                )}
                title={enablePatches 
                  ? "Currently showing: Live site + your local code changes. Click to show live site only." 
                  : "Currently showing: Live site only. Click to include your local code changes."
                }
              >
                {enablePatches ? "🔧 Patched Preview" : "📺 Live Preview"}
              </button>
              
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