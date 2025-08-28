import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

/**
 * Global PatchProvider Component
 * Automatically applies patches to all components based on route and URL parameters
 */
const GlobalPatchProvider = ({ children }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [patchData, setPatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const patchesEnabled = searchParams.get('patches') === 'true';
  const storeId = searchParams.get('storeId');
  const fileName = searchParams.get('fileName');

  // Map routes to file paths for automatic patch detection
  const getFileNameFromRoute = (pathname) => {
    const routeMap = {
      '/cart': 'src/pages/Cart.jsx',
      '/checkout': 'src/pages/Checkout.jsx',
      '/shop': 'src/pages/Storefront.jsx',
      '/products': 'src/pages/ProductDetail.jsx',
    };

    // Extract the last part of the path (e.g., /public/hamid2/cart -> /cart)
    const pathParts = pathname.split('/');
    const lastPart = pathParts.length > 0 ? '/' + pathParts[pathParts.length - 1] : pathname;
    
    // Return explicit fileName from URL params, or derive from route
    return fileName || routeMap[lastPart] || null;
  };

  useEffect(() => {
    const fetchPatchData = async () => {
      if (!patchesEnabled || !storeId) {
        console.log(`📄 GlobalPatchProvider: No patches enabled or storeId missing`);
        setPatchData(null);
        setLoading(false);
        return;
      }

      const targetFileName = getFileNameFromRoute(location.pathname);
      if (!targetFileName) {
        console.log(`📄 GlobalPatchProvider: No file mapping found for route ${location.pathname}`);
        setPatchData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Check if we have patch data injected from the backend (legacy support)
      const injectedPatchData = window.__CATALYST_PATCH_DATA__;
      
      if (injectedPatchData) {
        console.log(`🔧 GlobalPatchProvider: Using injected patch data for ${targetFileName}:`, injectedPatchData);
        setPatchData(injectedPatchData);
        setLoading(false);
        return;
      }

      // Fetch patch data from backend API
      console.log(`🔍 GlobalPatchProvider: Fetching patch data for ${targetFileName} from backend...`);
      
      try {
        const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
        
        // Use the patches endpoint to get applied patches (public endpoint)
        const response = await fetch(`${backendUrl}/api/patches/apply/${encodeURIComponent(targetFileName)}?store_id=${storeId}&preview=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const patchResult = await response.json();
        
        if (patchResult.success) {
          const patchData = {
            hasPatches: patchResult.data.hasPatches,
            fileName: targetFileName,
            appliedPatches: patchResult.data.appliedPatches || [],
            finalCode: patchResult.data.patchedCode,
            previewMode: true
          };
          
          console.log(`✅ GlobalPatchProvider: Retrieved patch data for ${targetFileName}:`, patchData);
          setPatchData(patchData);
        } else {
          console.error(`❌ GlobalPatchProvider: Failed to get patch data: ${patchResult.error}`);
          setPatchData({ hasPatches: false, fileName: targetFileName, appliedPatches: [] });
        }
      } catch (error) {
        console.error(`❌ GlobalPatchProvider: Error fetching patch data for ${targetFileName}:`, error);
        setPatchData({ hasPatches: false, fileName: targetFileName, appliedPatches: [], error: error.message });
      }
      
      setLoading(false);
    };

    fetchPatchData();
  }, [patchesEnabled, storeId, fileName, location.pathname]);

  // Show loading state while patches are being processed
  if (loading && patchesEnabled) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patch data...</p>
        </div>
      </div>
    );
  }

  const targetFileName = getFileNameFromRoute(location.pathname);
  
  console.log(`🎯 GlobalPatchProvider: Rendering ${patchesEnabled ? 'with server-side patches' : 'original'} component for ${targetFileName}`);
  
  return (
    <>
      {/* Display patch information banner if patches exist */}
      {patchesEnabled && patchData && patchData.hasPatches && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>✅ Patches Applied:</strong> This page ({targetFileName}) has been rendered with {patchData.appliedPatches?.length || 0} patch(es) applied server-side.
                {patchData.appliedPatches?.length > 0 && (
                  <span className="block mt-1 text-xs">
                    Applied patches: {patchData.appliedPatches.map(p => p.changeSummary).join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Display no patches message if patches were requested but none found */}
      {patchesEnabled && patchData && !patchData.hasPatches && (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>ℹ️ No Patches:</strong> This page ({targetFileName}) was rendered with server-side patch checking, but no patches were found to apply.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </>
  );
};

export default GlobalPatchProvider;