import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Code, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrowserPreview from './BrowserPreview';
import apiClient from '@/api/client';
import storeResolver from '@/utils/storeResolver';

/**
 * Preview Tab Component
 * Specialized preview that applies specific patches for store/URL combinations
 */
const PreviewTab = ({ 
  fileName = '',
  className 
}) => {
  const [previewConfig, setPreviewConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availablePatches, setAvailablePatches] = useState([]);
  
  // Get store ID using storeResolver
  const [storeId, setStoreId] = useState(null);
  
  // Resolve store ID on mount
  useEffect(() => {
    const resolveStoreId = async () => {
      try {
        const resolvedStoreId = await storeResolver.getCurrentStoreId();
        setStoreId(resolvedStoreId);
        console.log('🏪 PreviewTab: Resolved store ID:', resolvedStoreId);
      } catch (error) {
        console.error('❌ PreviewTab: Failed to resolve store ID:', error);
        setError('Failed to resolve store ID. Please ensure you are authenticated.');
      }
    };
    
    resolveStoreId();
  }, []);

  // Fetch patches for current store and file
  const fetchPatches = useCallback(async (fileName, storeId) => {
    if (!fileName || !storeId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching patches for ${fileName} in store ${storeId}`);
      
      // Use direct database query or API endpoint
      const encodedFileName = encodeURIComponent(fileName);
      const patchesUrl = `patches/apply/${encodedFileName}?store_id=${storeId}&preview=true`;
      
      const response = await apiClient.get(patchesUrl);
      
      if (response.success && response.data.hasPatches) {
        const patches = response.data.patches || [];
        setAvailablePatches(patches);
        
        // Select first available patch for this file
        const firstPatch = patches.find(p => p.file_path === fileName) || patches[0];
        
        if (firstPatch) {
          const config = {
            storeId: storeId,
            patchId: firstPatch.id,
            pageName: getPageNameFromFile(fileName),
            description: `${getPageNameFromFile(fileName)} preview with patch: ${firstPatch.patch_name || 'Unnamed patch'}`
          };
          
          console.log('✅ Found patches, using:', config);
          setPreviewConfig(config);
        } else {
          setError(`No patches found for ${fileName}`);
        }
      } else {
        setError(`No patches available for ${fileName} in this store`);
      }
      
    } catch (error) {
      console.error('Error fetching patches:', error);
      setError(`Failed to fetch patches: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Helper function to extract page name from file path
  const getPageNameFromFile = useCallback((filePath) => {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace(/\.(jsx?|tsx?)$/, '') || 'Page';
  }, []);

  // Initialize preview configuration by fetching patches
  useEffect(() => {
    if (fileName && storeId) {
      fetchPatches(fileName, storeId);
    } else {
      setPreviewConfig(null);
      if (!fileName) {
        setError('No file selected');
      } else if (!storeId) {
        setError('No store selected. Please select a store first.');
      }
    }
  }, [fileName, storeId, fetchPatches]);

  // Direct preview URL generation and iframe
  const DirectPreviewIframe = useCallback(({ config }) => {
    console.log('🎬 Enhanced PreviewTab: Direct preview with config:', config);
    console.log('  - fileName:', fileName);
    console.log('  - storeId:', config.storeId);
    console.log('  - specificPatchId:', config.patchId);
    
    // Generate preview URL directly
    const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
    const encodedFileName = encodeURIComponent(fileName);
    const previewUrl = `${backendUrl}/preview/${config.storeId}?fileName=${encodedFileName}&patches=true&specificPatch=${config.patchId}&storeSlug=store&pageName=${config.pageName}&_t=${Date.now()}`;
    
    console.log('🔗 Generated preview URL:', previewUrl);
    
    return (
      <div className="h-full flex flex-col">
        {/* Configuration Display */}
        <div className="p-2 bg-green-50 dark:bg-green-900/20 border-b text-xs">
          <div className="font-medium text-green-700 dark:text-green-300 mb-1">Dynamic Configuration:</div>
          <div className="text-green-600 dark:text-green-400">
            ✅ Store ID: {config.storeId.substring(0, 8)}...
            {' | '}
            ✅ Patch ID: {config.patchId.substring(0, 8)}...
            {' | '}
            📄 Found {availablePatches.length} patches
          </div>
        </div>
        
        {/* URL Display */}
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b text-xs">
          <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Preview URL:</div>
          <div className="text-blue-600 dark:text-blue-400 break-all">{previewUrl}</div>
        </div>
        
        {/* Direct iframe */}
        <div className="flex-1">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={`Enhanced Preview of ${fileName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        </div>
      </div>
    );
  }, [fileName]);

  if (!fileName) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a file to preview</p>
          <p className="text-xs mt-1">Specialized preview with specific patch application</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-orange-600 dark:text-orange-400 p-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Enhanced Preview Error</p>
          <p className="text-xs mt-2">{error}</p>
          <p className="text-xs mt-2 text-gray-500">File: {fileName}</p>
          <p className="text-xs mt-2 text-gray-500">Store ID: {storeId || 'Not resolved'}</p>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-left">
            <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">This tab dynamically fetches patches from:</p>
            <p className="text-blue-600 dark:text-blue-400">• Current store using storeResolver</p>
            <p className="text-blue-600 dark:text-blue-400">• patch_diffs table for selected file</p>
            <p className="text-blue-600 dark:text-blue-400">• API endpoint: patches/apply/{fileName}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!previewConfig) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Initializing preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Preview Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Enhanced Preview
            </span>
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
              <Code className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Patch: {previewConfig.patchId.substring(0, 8)}...
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {previewConfig.description}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Store: {previewConfig.storeId.substring(0, 8)}...</span>
          <span className="mx-2">•</span>
          <span>Page: {previewConfig.pageName}</span>
          <span className="mx-2">•</span>
          <span>File: {fileName.split('/').pop()}</span>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        <DirectPreviewIframe config={previewConfig} />
      </div>
    </div>
  );
};

export default PreviewTab;