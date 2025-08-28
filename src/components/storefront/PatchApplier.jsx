import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * PatchApplier Component
 * Handles patched content when served from backend with patch data injected
 */
const PatchApplier = ({ 
  children,
  fileName,
  storeId
}) => {
  const [searchParams] = useSearchParams();
  const [patchData, setPatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  const patchesEnabled = searchParams.get('patches') === 'true';

  useEffect(() => {
    const fetchPatchData = async () => {
      if (!patchesEnabled) {
        console.log(`📄 PatchApplier: No patches enabled for ${fileName}`);
        setLoading(false);
        return;
      }

      // Check if we have patch data injected from the backend (legacy support)
      const injectedPatchData = window.__CATALYST_PATCH_DATA__;
      
      if (injectedPatchData) {
        console.log(`🔧 PatchApplier: Using injected patch data for ${fileName}:`, injectedPatchData);
        setPatchData(injectedPatchData);
        setLoading(false);
        return;
      }

      // Fetch patch data from backend API
      console.log(`🔍 PatchApplier: Fetching patch data for ${fileName} from backend...`);
      
      try {
        const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
        const params = new URLSearchParams(searchParams);
        
        // Use the patches endpoint to get applied patches (public endpoint)
        const response = await fetch(`${backendUrl}/api/patches/apply/${encodeURIComponent(fileName)}?store_id=${storeId}&preview=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const patchResult = await response.json();
        
        if (patchResult.success) {
          const patchData = {
            hasPatches: patchResult.data.hasPatches,
            fileName,
            appliedPatches: patchResult.data.appliedPatches || [],
            finalCode: patchResult.data.patchedCode,
            previewMode: true
          };
          
          console.log(`✅ PatchApplier: Retrieved patch data for ${fileName}:`, patchData);
          setPatchData(patchData);
        } else {
          console.error(`❌ PatchApplier: Failed to get patch data: ${patchResult.error}`);
          setPatchData({ hasPatches: false, fileName, appliedPatches: [] });
        }
      } catch (error) {
        console.error(`❌ PatchApplier: Error fetching patch data for ${fileName}:`, error);
        setPatchData({ hasPatches: false, fileName, appliedPatches: [], error: error.message });
      }
      
      setLoading(false);
    };

    fetchPatchData();
  }, [patchesEnabled, fileName, storeId, searchParams]);

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

  console.log(`🎯 PatchApplier: Rendering ${patchesEnabled ? 'with server-side patches' : 'original'} component for ${fileName}`);
  
  return (
    <>
      {/* Display patch information banner if patches exist */}
      {patchesEnabled && patchData && patchData.hasPatches && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>✅ Patches Applied:</strong> This component ({fileName}) has been rendered with {patchData.appliedPatches?.length || 0} patch(es) applied server-side.
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
                <strong>ℹ️ No Patches:</strong> This component ({fileName}) was rendered with server-side patch checking, but no patches were found to apply.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </>
  );
};

export default PatchApplier;