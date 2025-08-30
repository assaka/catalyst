import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, RefreshCw, ExternalLink, Globe, Monitor, Smartphone, Tablet, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import apiClient from '@/api/client';

/**
 * Browser Preview Component
 * Renders pages as they would appear in a browser with route detection
 */
const BrowserPreview = ({ 
  fileName = '',
  currentCode = '',
  previewMode = 'live',
  storeId: propStoreId = null,
  specificPatchId = null,
  className 
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceView, setDeviceView] = useState('desktop'); // desktop, tablet, mobile
  const [showBrowserChrome, setShowBrowserChrome] = useState(true);
  const [enablePatches, setEnablePatches] = useState(true); // Single toggle: patches on/off
  const [patchData, setPatchData] = useState({ hasPatches: false, patchCount: 0 });
  const [checkingPatches, setCheckingPatches] = useState(false);


  // Get store context for API calls - allow override via props
  const { selectedStore } = useStoreSelection();
  const storeId = propStoreId || selectedStore?.id || localStorage.getItem('selectedStoreId');
  
  // Create API config - store context handled by backend
  const getApiConfig = useCallback(() => {
    const headers = {};
    return { headers };
  }, []);





  // Simple page name detection for display purposes only
  const getPageNameFromFile = useCallback((filePath) => {
    if (!filePath) return null;
    const fileNameOnly = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
    return fileNameOnly.split('\\').pop() || fileNameOnly;
  }, []);

  // Update preview URL - use backend for patch support with fallback
  useEffect(() => {
    const generatePreviewUrl = async () => {
      if (fileName && storeId) {
        try {
          // Get store information with better error handling
          let store, storeSlug;
          try {
            const storeResponse = await apiClient.get(`stores/${storeId}`, getApiConfig().headers);
            store = storeResponse.data;
            storeSlug = store?.slug || 'store';
          } catch (storeError) {
            console.warn('Could not fetch store info, using fallback slug:', storeError);
            storeSlug = 'store'; // fallback
          }
          
          // Extract page name from file path (e.g., src/pages/Cart.jsx -> Cart)
          const pageName = fileName.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';
          
          // Use production Node.js backend for preview with patch support
          const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
          const patchesParam = enablePatches && patchData.hasPatches ? 'true' : 'false';
          
          // Build preview URL using Node.js backend preview endpoint
          let finalUrl = `${backendUrl}/preview/${storeId}?fileName=${encodeURIComponent(fileName)}&patches=${patchesParam}&storeSlug=${storeSlug}&pageName=${pageName}&_t=${Date.now()}`;
          
          // Add specific patch ID if provided
          if (specificPatchId && enablePatches && patchData.hasPatches) {
            finalUrl += `&specificPatch=${specificPatchId}`;
          }
          
          console.log(`🔍 BrowserPreview: Preview URL generation:`);
          console.log(`  - storeId: ${storeId}`);
          console.log(`  - storeSlug: ${storeSlug}`);
          console.log(`  - fileName: ${fileName}`);
          console.log(`  - pageName: ${pageName}`);
          console.log(`  - backendUrl: ${backendUrl}`);
          console.log(`  - enablePatches: ${enablePatches}`);
          console.log(`  - patchData.hasPatches: ${patchData.hasPatches}`);
          console.log(`  - specificPatchId: ${specificPatchId}`);
          console.log(`  - patchesParam: ${patchesParam}`);
          console.log(`  - finalUrl: ${finalUrl}`);
          
          setPreviewUrl(finalUrl);
          setError(null);
        } catch (error) {
          console.error('Error generating preview URL:', error);
          
          // Fallback: Try to create a direct frontend URL if backend preview fails
          try {
            const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'https://catalyst-pearl.vercel.app';
            const fallbackUrl = `${frontendUrl}/public/store/${fileName.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '')}?fallback=true&_t=${Date.now()}`;
            console.warn(`🔄 Using fallback URL: ${fallbackUrl}`);
            setPreviewUrl(fallbackUrl);
            setError(`Preview URL generated with fallback (patches disabled): ${error.message}`);
          } catch (fallbackError) {
            setPreviewUrl(null);
            setError(`Failed to generate preview URL: ${error.message}`);
          }
        }
      } else {
        setPreviewUrl(null);
        if (!fileName) {
          setError('No file selected for preview');
        }
        if (!storeId) {
          setError('No store selected for preview');
        }
      }
    };

    generatePreviewUrl();
  }, [fileName, enablePatches, storeId, patchData.hasPatches, getApiConfig]);

  // Check if patches exist for this file with improved error handling
  const checkPatchStatus = useCallback(async (fileName) => {
    if (!fileName || !storeId) {
      setPatchData({ hasPatches: false, patchCount: 0 });
      return { hasPatches: false, patchCount: 0 };
    }

    setCheckingPatches(true);
    try {
      const customHeaders = getApiConfig().headers;
      
      const encodedFileName = encodeURIComponent(fileName);
      const patchedUrl = `patches/apply/${encodedFileName}?preview=true&store_id=${storeId}`;
      const patchedData = await apiClient.get(patchedUrl, customHeaders);
      
      const hasPatches = patchedData?.success && patchedData?.data?.hasPatches;
      const patchCount = patchedData?.data?.totalPatches || patchedData?.data?.appliedPatches || 0;
      
      console.log(`🔍 Patch status for ${fileName}: ${hasPatches ? `HAS ${patchCount} PATCHES` : 'NO PATCHES'}`);
      setPatchData({ hasPatches, patchCount });
      
      return { hasPatches, patchCount };
    } catch (error) {
      console.error('Error checking patch status:', error);
      // Don't treat API errors as "no patches" - might be network issues
      const fallbackData = { hasPatches: false, patchCount: 0, error: error.message };
      setPatchData(fallbackData);
      return fallbackData;
    } finally {
      setCheckingPatches(false);
    }
  }, [storeId, getApiConfig]);

  // Check patch status when filename changes
  useEffect(() => {
    if (fileName && storeId) {
      checkPatchStatus(fileName);
    }
  }, [fileName, storeId, checkPatchStatus]);

  // Device view dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%', maxWidth: '100%' },
    tablet: { width: '768px', height: '1024px', maxWidth: '768px' },
    mobile: { width: '375px', height: '667px', maxWidth: '375px' }
  };

  const currentDimensions = deviceDimensions[deviceView];

  // Handle iframe load - no patch application needed, URL already contains patches
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    console.log('🎯 Preview iframe loaded successfully via production backend with patches');
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
    // Force iframe refresh by updating the src with a cache-busting parameter
    const iframe = document.getElementById('browser-preview-iframe');
    if (iframe && previewUrl) {
      // Add cache-busting parameter to force refresh
      const url = new URL(previewUrl);
      url.searchParams.set('_refresh', Date.now().toString());
      iframe.src = url.toString();
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
          <p className="text-sm">Generating preview URL...</p>
          <p className="text-xs mt-1">Analyzing file path: {fileName}</p>
          {getPageNameFromFile(fileName) && (
            <p className="text-xs mt-1 text-blue-500 dark:text-blue-400">
              📝 Page: "{getPageNameFromFile(fileName)}"
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
          {getPageNameFromFile(fileName) && (
            <p className="text-xs mt-1 text-gray-500">
              Page: "{getPageNameFromFile(fileName)}"
            </p>
          )}
          <p className="text-xs mt-2 text-gray-400">
            💡 Try creating a route for "{getPageNameFromFile(fileName) || 'this page'}" in your store routes
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
              {/* Patch Status Indicator */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEnablePatches(!enablePatches)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md border font-medium transition-colors flex items-center",
                    checkingPatches
                      ? "bg-gray-50 border-gray-200 text-gray-500"
                      : patchData.hasPatches && enablePatches
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
                      : patchData.hasPatches
                      ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                  )}
                  title={
                    checkingPatches
                      ? "Checking for patches..."
                      : patchData.hasPatches
                      ? (enablePatches
                          ? `${patchData.patchCount} patch(es) applied. Click to disable patches.`
                          : `${patchData.patchCount} patch(es) available. Click to apply patches.`)
                      : patchData.error
                      ? `Error checking patches: ${patchData.error}`
                      : "No patches available for this file"
                  }
                  disabled={!patchData.hasPatches || checkingPatches}
                >
                  {checkingPatches ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Code className="w-3 h-3 mr-1" />
                  )}
                  {checkingPatches
                    ? "Checking..."
                    : patchData.hasPatches 
                    ? (enablePatches ? `Applied (${patchData.patchCount})` : `Apply (${patchData.patchCount})`) 
                    : "No Patches"}
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
            {getPageNameFromFile(fileName) && (
              <span>Page: {getPageNameFromFile(fileName)}</span>
            )}
            <span>Device: {deviceView}</span>
            <span>Patches: {patchData.hasPatches ? (enablePatches ? `On (${patchData.patchCount})` : 'Off') : 'None'}</span>
            {specificPatchId && enablePatches && (
              <span className="text-blue-600 dark:text-blue-400">Specific: {specificPatchId.substring(0, 8)}...</span>
            )}
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