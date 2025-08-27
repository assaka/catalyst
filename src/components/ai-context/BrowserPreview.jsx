import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet, Code, Layers } from 'lucide-react';
import BrowserPreviewOverlay from './BrowserPreviewOverlay';
import { useOverlayManager } from '../../services/overlay-manager';
import { overlayMergeService } from '../../services/overlay-merge-service';
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
  const [coreCode, setCoreCode] = useState(''); // Immutable base code
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

  const handleOverlayCodeChange = useCallback((newCode) => {
    // This callback is called when overlay code changes
    console.log('🔄 Overlay code changed, updating preview');
    
    // Force iframe refresh to apply new code
    const iframe = document.getElementById('browser-preview-iframe');
    if (iframe && newCode && enablePatches && applyCodePatchesRef.current) {
      // Apply the new code to the preview
      setTimeout(() => {
        applyCodePatchesRef.current(iframe);
      }, 100);
    }
  }, [enablePatches]);

  const handleOverlayPublish = useCallback((publishedData) => {
    console.log('🚀 Overlay published');
    // For the overlay manager, we don't need to track published state
    // The overlay system handles merging automatically
  }, []);

  const handleOverlayRollback = useCallback(() => {
    console.log('↩️ Overlay rolled back to core code');
    // Clear all overlays for this file
    if (fileName) {
      clearFileOverlays(fileName);
    }
    // Force preview refresh to show rolled back state
    const iframe = document.getElementById('browser-preview-iframe');
    if (iframe && applyCodePatchesRef.current) {
      setTimeout(() => {
        applyCodePatchesRef.current(iframe);
      }, 100);
    }
  }, [fileName, clearFileOverlays]);

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

  // Helper function to apply merged code to iframe using data-level merging
  const applyMergedCodeToIframe = useCallback(async (iframe, mergedCode) => {
    try {
      const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      
      if (!iframeDoc) {
        console.log('🔄 BrowserPreview: Iframe document not accessible for code injection');
        return false;
      }

      // Clear any existing overlay patches before applying new ones
      const existingPatches = iframeDoc.querySelectorAll('[data-overlay-preview="true"]');
      existingPatches.forEach(element => element.remove());
      
      console.log(`🧹 Cleared ${existingPatches.length} existing overlay elements`);

      // Create preview-safe code that can be injected into iframe
      const previewCode = overlayMergeService.createPreviewCode(mergedCode, fileName);
      
      // Inject merged code as a script that updates the page content
      const overlayScript = iframeDoc.createElement('script');
      overlayScript.type = 'text/javascript';
      overlayScript.setAttribute('data-overlay-preview', 'true');
      overlayScript.textContent = `
        console.log('🎭 BrowserPreview: Applying merged overlay code');
        
        // Extract changes from merged code and apply them intelligently
        try {
          const mergedCode = ${JSON.stringify(previewCode)};
          
          // Parse text content changes from merged code
          const textMatches = mergedCode.match(/>([^<>{]+)</g) || [];
          const extractedTexts = textMatches.map(match => match.replace(/[<>]/g, '').trim()).filter(text => text.length > 0);
          
          console.log('🔍 Extracted texts from merged code:', extractedTexts);
          
          // Apply text changes to existing DOM elements
          extractedTexts.forEach(newText => {
            // Find elements with similar or matching text content
            const allElements = document.getElementsByTagName('*');
            const textElements = Array.from(allElements).filter(el => {
              const textContent = el.textContent ? el.textContent.trim() : '';
              return textContent.length > 0 && textContent.length < 100 && el.children.length <= 2;
            });
            
            // Smart text replacement
            textElements.forEach(element => {
              const currentText = element.textContent.trim();
              
              // Handle Cart-specific replacements
              if (newText.toLowerCase().includes('cart') && currentText.toLowerCase().includes('cart')) {
                if (!element.hasAttribute('data-overlay-original')) {
                  element.setAttribute('data-overlay-original', currentText);
                }
                element.textContent = newText;
                element.setAttribute('data-overlay-preview', 'text-updated');
                console.log('✅ Updated cart text:', currentText, '->', newText);
              }
              // Handle exact matches for other text
              else if (currentText === newText || 
                       currentText.toLowerCase() === newText.toLowerCase() ||
                       currentText.includes(newText) || newText.includes(currentText)) {
                if (!element.hasAttribute('data-overlay-original')) {
                  element.setAttribute('data-overlay-original', currentText);
                }
                element.textContent = newText;
                element.setAttribute('data-overlay-preview', 'text-updated');
                console.log('✅ Updated text element:', currentText, '->', newText);
              }
            });
          });
          
          // Add visual indicator
          const indicator = document.createElement('div');
          indicator.innerHTML = '🎭 Overlay Preview Active (Data-Level Merge)';
          indicator.style.cssText = \`
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: monospace;
            z-index: 10000;
            pointer-events: none;
          \`;
          indicator.setAttribute('data-overlay-preview', 'true');
          document.body.appendChild(indicator);
          
        } catch (error) {
          console.error('Error applying merged overlay code:', error);
        }
      `;
      
      iframeDoc.head.appendChild(overlayScript);
      
      console.log('✅ BrowserPreview: Merged code injected successfully into iframe');
      return true;
      
    } catch (error) {
      console.error('❌ BrowserPreview: Error injecting merged code into iframe:', error);
      return false;
    }
  }, [fileName]);

  // Direct overlay lookup function - matches filename to customization_overlays table
  const fetchOverlayForFile = useCallback(async (fileName) => {
    try {
      console.log(`🔍 BrowserPreview: Looking for overlay for file: ${fileName}`);
      
      // Use authenticated API client instead of raw fetch to ensure proper authentication
      const customHeaders = {};
      if (storeId && storeId !== 'undefined') {
        customHeaders['x-store-id'] = storeId;
      }
      
      const data = await apiClient.get(`hybrid-patches/modified-code/${encodeURIComponent(fileName)}`, customHeaders);
      
      if (data && data.success && data.data && data.data.modifiedCode) {
        console.log(`✅ BrowserPreview: Found overlay for ${fileName} using path: ${data.data.matchedPath}`);
        return {
          hasOverlay: true,
          modifiedCode: data.data.modifiedCode,
          customizationId: data.data.customizationId,
          lastModified: data.data.lastModified,
          matchedPath: data.data.matchedPath,
          requestedPath: data.data.requestedPath
        };
      }
      
      // Handle case where no overlay found
      console.log(`❌ BrowserPreview: No overlay found for ${fileName}. Tried paths: ${data?.triedPaths?.join(', ') || 'unknown'}`);
      
      return {
        hasOverlay: false,
        message: data?.error || `No overlay found for: ${fileName}`,
        triedPaths: data?.triedPaths
      };
      
    } catch (error) {
      // Handle 404 and other errors
      if (error.status === 404) {
        console.log(`❌ BrowserPreview: No overlay found for ${fileName}. Tried paths: ${error.data?.triedPaths?.join(', ') || 'unknown'}`);
        return {
          hasOverlay: false,
          message: error.data?.error || `No overlay found for: ${fileName}`,
          triedPaths: error.data?.triedPaths
        };
      }
      
      console.warn(`⚠️ BrowserPreview: Error fetching overlay for ${fileName}:`, error.message);
      return {
        hasOverlay: false,
        error: error.message
      };
    }
  }, [storeId]);

  // Apply overlay by directly matching filename to database overlay - no content checking loop
  const applyCodePatches = useCallback(async (iframe) => {
    if (!fileName) return;
    
    try {
      console.log(`🔄 BrowserPreview: Direct overlay lookup for: ${fileName}`);
      
      // Get baseline code (original file content)
      const baselineCode = getMergedContent(fileName) || currentCode;
      if (!baselineCode) {
        console.warn('⚠️ BrowserPreview: No baseline code available');
        return;
      }
      
      // Direct overlay lookup by filename - no loop needed
      const overlayResult = await fetchOverlayForFile(fileName);
      
      if (overlayResult.hasOverlay) {
        console.log(`✅ BrowserPreview: Found overlay for ${fileName} (${overlayResult.modifiedCode.length} chars)`);
        
        // Apply overlay directly to iframe - no merging service needed for single overlay
        const success = await applyMergedCodeToIframe(iframe, overlayResult.modifiedCode);
        
        if (success) {
          console.log('✅ BrowserPreview: Overlay applied successfully');
        } else {
          console.warn('⚠️ BrowserPreview: Failed to apply overlay, using baseline');
          await applyMergedCodeToIframe(iframe, baselineCode);
        }
      } else {
        console.log(`📄 BrowserPreview: No overlay found for ${fileName}, using baseline code`);
        await applyMergedCodeToIframe(iframe, baselineCode);
      }
      
    } catch (error) {
      console.error('❌ BrowserPreview: Error in overlay system:', error);
      // Fallback to baseline code
      try {
        const fallbackCode = getMergedContent(fileName) || currentCode;
        if (fallbackCode) {
          await applyMergedCodeToIframe(iframe, fallbackCode);
          console.log('🔄 BrowserPreview: Fallback to baseline code successful');
        }
      } catch (fallbackError) {
        console.error('❌ BrowserPreview: Fallback also failed:', fallbackError);
      }
    }
  }, [fileName, currentCode, getMergedContent, applyMergedCodeToIframe]);

  // Assign function to ref to break circular dependencies
  useEffect(() => {
    applyCodePatchesRef.current = applyCodePatches;
  }, [applyCodePatches]);

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
              {/* Overlay Toggle */}
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={cn(
                  "px-3 py-1 text-xs rounded-md border font-medium transition-colors",
                  showOverlay || (overlayStats?.activeOverlays > 0)
                    ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-300" 
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                )}
                title={overlayStats?.activeOverlays > 0
                  ? `Show overlay system (${overlayStats.activeOverlays} active, ${overlayStats.totalSize} chars)`
                  : "Show overlay system (non-destructive code patches)"
                }
              >
                <Layers className="w-3 h-3 mr-1 inline" />
                {overlayStats?.activeOverlays > 0 ? `Overlay (${overlayStats.activeOverlays})` : "Overlay"}
              </button>

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

      {/* Overlay System */}
      <BrowserPreviewOverlay
        isVisible={showOverlay}
        onClose={() => setShowOverlay(false)}
        filePath={fileName}
        coreCode={coreCode}
        currentEditedCode={currentCode}
        onCodeChange={handleOverlayCodeChange}
        onPublish={handleOverlayPublish}
        onRollback={handleOverlayRollback}
      />
    </div>
  );
};

export default BrowserPreview;