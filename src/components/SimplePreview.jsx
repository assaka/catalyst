import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Eye, Code } from 'lucide-react';
import apiClient from '@/api/client';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * Simple Preview Component
 * Loads Cart.jsx from file_baselines, applies a patch, and shows the webpage
 */
const SimplePreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [patchInfo, setPatchInfo] = useState(null);
  
  // Get store context
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  
  // Load Cart.jsx with patches applied
  const loadCartWithPatches = async () => {
    setIsLoading(true);
    setError(null);
    setPatchInfo(null);
    
    try {
      console.log('🛒 Loading Cart.jsx with patches...');
      console.log('Store ID:', storeId);
      
      if (!storeId) {
        throw new Error('No store selected. Please select a store first.');
      }
      
      // Step 1: Get the baseline Cart.jsx
      console.log('📄 Step 1: Loading baseline Cart.jsx...');
      const baselineResponse = await apiClient.get('patches/baseline/src%2Fpages%2FCart.jsx');
      
      if (!baselineResponse.success || !baselineResponse.data.hasBaseline) {
        throw new Error('Cart.jsx baseline not found');
      }
      
      console.log('✅ Loaded baseline Cart.jsx:', {
        size: baselineResponse.data.baselineCode?.length,
        hasContent: !!baselineResponse.data.baselineCode
      });
      
      // Step 2: Check for patches and apply them
      console.log('🔧 Step 2: Checking for patches...');
      const patchResponse = await apiClient.get(`patches/apply/src%2Fpages%2FCart.jsx?store_id=${storeId}&preview=true`);
      
      console.log('Patch response:', patchResponse);
      
      if (patchResponse.success && patchResponse.data.hasPatches) {
        console.log('✅ Found patches, using patched version');
        setPatchInfo({
          hasPatches: true,
          patchCount: patchResponse.data.totalPatches || 1,
          appliedPatches: patchResponse.data.appliedPatches || 1
        });
      } else {
        console.log('ℹ️ No patches found, using baseline version');
        setPatchInfo({
          hasPatches: false,
          patchCount: 0
        });
      }
      
      // Step 3: Generate preview URL
      console.log('🎬 Step 3: Generating preview URL...');
      const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
      
      // Get store info for slug
      let storeSlug = 'store';
      try {
        const storeResponse = await apiClient.get(`stores/${storeId}`);
        if (storeResponse.success && storeResponse.data.slug) {
          storeSlug = storeResponse.data.slug;
        }
      } catch (storeError) {
        console.warn('Could not get store slug, using default:', storeError);
      }
      
      const finalPreviewUrl = `${backendUrl}/preview/${storeId}?fileName=src%2Fpages%2FCart.jsx&patches=true&storeSlug=${storeSlug}&pageName=Cart&_t=${Date.now()}`;
      
      console.log('🔗 Generated preview URL:', finalPreviewUrl);
      setPreviewUrl(finalPreviewUrl);
      
    } catch (err) {
      console.error('❌ Error loading Cart preview:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load on mount
  useEffect(() => {
    if (storeId) {
      loadCartWithPatches();
    }
  }, [storeId]);
  
  if (!storeId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-orange-600 dark:text-orange-400 p-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">No Store Selected</p>
          <p className="text-xs mt-2">Please select a store to preview Cart.jsx</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading Cart.jsx with patches...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400 p-4 max-w-md">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Preview Error</p>
          <p className="text-xs mt-2">{error}</p>
          <button
            onClick={loadCartWithPatches}
            className="mt-4 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!previewUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No preview available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with patch info */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Cart.jsx Preview
            </span>
            {patchInfo && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                patchInfo.hasPatches 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                <Code className="w-3 h-3" />
                <span>
                  {patchInfo.hasPatches 
                    ? `${patchInfo.appliedPatches} patch${patchInfo.appliedPatches !== 1 ? 'es' : ''} applied`
                    : 'No patches'}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={loadCartWithPatches}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-1"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Store: {storeId.substring(0, 8)}...</span>
          <span className="mx-2">•</span>
          <span>File: src/pages/Cart.jsx</span>
        </div>
      </div>
      
      {/* URL Display */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b text-xs">
        <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Preview URL:</div>
        <div className="text-blue-600 dark:text-blue-400 break-all font-mono">{previewUrl}</div>
      </div>
      
      {/* Preview iframe */}
      <div className="flex-1">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title="Cart.jsx Preview with Patches"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          onLoad={() => console.log('✅ Preview iframe loaded successfully')}
          onError={(e) => console.error('❌ Preview iframe error:', e)}
        />
      </div>
    </div>
  );
};

export default SimplePreview;