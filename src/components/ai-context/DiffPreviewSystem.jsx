import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitCompare,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

// Import diff service
import UnifiedDiffFrontendService from '../../services/unified-diff-frontend-service';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

// Utility function to extract component name from file path or code
const extractComponentName = (fileName, code) => {
  // Try to extract from file name first
  if (fileName && fileName.includes('.')) {
    const nameWithoutExt = fileName.split('.')[0];
    const componentName = nameWithoutExt.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    if (componentName) return componentName;
  }
  
  // Try to extract from code (look for component export or class name)
  const exportMatches = code.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)|const\s+(\w+)\s*=.*=>/);
  if (exportMatches) {
    const componentName = exportMatches[1] || exportMatches[2];
    return componentName.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }
  
  return fileName || 'Unknown';
};

// Function to resolve page URL using store routes API
// Helper function to fetch the storefront URL for a store
const fetchStorefrontURL = async (storeId) => {
  try {
    const response = await fetch(`/api/stores/${storeId}/domains/storefront-url`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.storefront_url) {
        return {
          success: true,
          url: data.storefront_url,
          source: data.source
        };
      }
    }
  } catch (error) {
    console.error('Error fetching storefront URL:', error);
  }
  
  // Fallback to localhost for development/preview
  return {
    success: false,
    url: window.location.origin,
    source: 'localhost_fallback'
  };
};

const resolvePageURL = async (pageName, storeId) => {
  try {
    // Get the storefront URL first
    const storefrontResult = await fetchStorefrontURL(storeId);
    const baseUrl = storefrontResult.url;
    
    const response = await fetch(`/api/store-routes/public/find-by-page/${encodeURIComponent(pageName)}?store_id=${storeId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.route) {
        return {
          success: true,
          path: data.data.route.route_path,
          url: `${baseUrl}${data.data.route.route_path}`,
          storefront_source: storefrontResult.source
        };
      }
    }
    
    // Fallback: create a generic path based on page name
    const fallbackPath = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      success: false,
      path: fallbackPath,
      url: `${baseUrl}${fallbackPath}`,
      fallback: true,
      storefront_source: storefrontResult.source
    };
  } catch (error) {
    console.error('Error resolving page URL:', error);
    const fallbackPath = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
    // Use localhost as final fallback if storefront URL fetch fails
    return {
      success: false,
      path: fallbackPath,
      url: `${window.location.origin}${fallbackPath}`,
      fallback: true,
      error: error.message,
      storefront_source: 'error_fallback'
    };
  }
};

// Function to fetch AST diff data from patches API
const fetchAstDiffData = async (filePath, storeId) => {
  try {
    console.log('🔍 [DiffPreview] Fetching patches for:', filePath, 'storeId:', storeId);
    
    // Get the auth token using the same logic as FileTreeNavigator fix
    const getAuthToken = () => {
      const loggedOut = localStorage.getItem('user_logged_out') === 'true';
      if (loggedOut) return null;
      
      const currentPath = window.location.pathname.toLowerCase();
      const isAdminContext = currentPath.startsWith('/admin/') ||
                            currentPath === '/dashboard' || 
                            currentPath === '/auth' ||
                            currentPath === '/ai-context-window' ||
                            currentPath.startsWith('/editor/') ||
                            currentPath.includes('/dashboard') || 
                            currentPath.includes('/products') || 
                            currentPath.includes('/categories') || 
                            currentPath.includes('/settings') ||
                            currentPath.includes('/file-library');
      
      const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
      const customerToken = localStorage.getItem('customer_auth_token');
      
      if (isAdminContext && storeOwnerToken) {
        return storeOwnerToken;
      } else if (storeOwnerToken) {
        return storeOwnerToken;
      } else if (customerToken) {
        return customerToken;
      }
      
      return null;
    };
    
    const token = getAuthToken();
    console.log('🔑 [DiffPreview] Auth token available:', !!token);
    
    if (!token) {
      console.error('❌ [DiffPreview] No authentication token available');
      throw new Error('No authentication token available. Please log in.');
    }
    
    // Fetch patches for the file (store ID now resolved server-side)
    const apiUrl = `/api/patches/${encodeURIComponent(filePath)}`;
    console.log('📡 [DiffPreview] API URL:', apiUrl);
    
    const patchResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 [DiffPreview] Patch response status:', patchResponse.status, patchResponse.statusText);
    
    if (!patchResponse.ok) {
      console.error('❌ [DiffPreview] Patch response not OK:', patchResponse.status);
      throw new Error(`Failed to fetch patches: ${patchResponse.status}`);
    }
    
    const patchData = await patchResponse.json();
    console.log('📋 [DiffPreview] Patch response data:', patchData);
    
    if (patchData.success && patchData.data && patchData.data.patches && patchData.data.patches.length > 0) {
      console.log('✅ [DiffPreview] Found patches:', patchData.data.patches.length);
      // Use the most recent patch (first in array as they're ordered by creation time DESC)
      const latestPatch = patchData.data.patches[0];
      console.log('🔍 [DiffPreview] Latest patch:', latestPatch.id, latestPatch.patch_name);
      
      // Also get the baseline code (store ID now resolved server-side)
      const baselineResponse = await fetch(`/api/patches/baseline/${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let baselineCode = null;
      if (baselineResponse.ok) {
        const baselineData = await baselineResponse.json();
        if (baselineData.success && baselineData.data.hasBaseline) {
          baselineCode = baselineData.data.baselineCode;
        }
      }
      
      // Get the modified code (store ID now resolved server-side)
      const modifiedResponse = await fetch(`/api/patches/modified-code/${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let modifiedCode = null;
      if (modifiedResponse.ok) {
        const modifiedData = await modifiedResponse.json();
        if (modifiedData.success && modifiedData.data.modifiedCode) {
          modifiedCode = modifiedData.data.modifiedCode;
        }
      }
      
      return {
        success: true,
        patch: latestPatch,
        baselineCode,
        modifiedCode,
        astDiff: latestPatch.ast_diff
      };
    } else {
      console.log('❌ [DiffPreview] No patches found. Response structure:', {
        success: patchData.success,
        hasData: !!patchData.data,
        hasPatches: patchData.data && !!patchData.data.patches,
        patchesLength: patchData.data && patchData.data.patches ? patchData.data.patches.length : 'N/A'
      });
      return {
        success: false,
        message: 'No patches found for this file',
        patches: []
      };
    }
  } catch (error) {
    console.error('❌ [DiffPreview] Error fetching AST diff data:', error);
    return {
      success: false,
      error: error.message,
      patches: []
    };
  }
};

// SplitViewPane component for enhanced split view
const SplitViewPane = ({ 
  lines, 
  diffLines, 
  side, 
  showLineNumbers, 
  onLineRevert, 
  originalLines,
  modifiedLines,
  onExpandCollapsed
}) => {
  // Create a mapping of line numbers to diff types for highlighting
  const getDiffTypeForLine = (lineIndex) => {
    const diffLine = diffLines.find(dl => {
      if (side === 'original') {
        return dl.lineNumber === lineIndex + 1;
      } else {
        return dl.newLineNumber === lineIndex + 1;
      }
    });
    
    return diffLine?.type || 'context';
  };

  const getLineStyle = (lineIndex, diffType) => {
    switch (diffType) {
      case 'addition':
        return side === 'modified' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100';
      case 'deletion':
        return side === 'original' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-gray-100';
      case 'collapsed':
        return 'bg-blue-50 border-l-4 border-blue-300';
      case 'context':
      default:
        return 'bg-background hover:bg-muted/30';
    }
  };


  return (
    <div className="font-mono min-w-max">
      {diffLines.map((diffLine, index) => {
        // Only show relevant lines for each side
        const shouldShow = (() => {
          if (diffLine.type === 'collapsed') return true; // Always show collapsed indicators
          if (side === 'original') {
            return diffLine.type !== 'addition'; // Show deletions and context
          } else {
            return diffLine.type !== 'deletion'; // Show additions and context
          }
        })();

        if (!shouldShow) {
          return null;
        }

        const actualLineNumber = side === 'original' ? diffLine.lineNumber : diffLine.newLineNumber;
        const actualLineIndex = actualLineNumber ? actualLineNumber - 1 : null;
        const lineContent = diffLine.type === 'collapsed' ? diffLine.content : (actualLineIndex !== null ? lines[actualLineIndex] || '' : '');

        return (
          <div
            key={index}
            className={`flex items-center px-2 py-1 text-sm min-w-max ${getLineStyle(actualLineIndex, diffLine.type)} group ${
              diffLine.type === 'collapsed' ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''
            }`}
            onClick={diffLine.type === 'collapsed' && onExpandCollapsed ? () => onExpandCollapsed(diffLine.startIndex, diffLine.endIndex) : undefined}
            title={diffLine.type === 'collapsed' ? 'Click to expand hidden lines' : undefined}
          >
            {/* Show revert button before line numbers for modified lines on the original side */}
            {side === 'original' && onLineRevert && originalLines && modifiedLines && 
             actualLineIndex !== null && originalLines[actualLineIndex] !== undefined && modifiedLines[actualLineIndex] !== undefined &&
             originalLines[actualLineIndex] !== modifiedLines[actualLineIndex] && diffLine.type !== 'collapsed' ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 mr-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex-shrink-0"
                onClick={() => onLineRevert(actualLineIndex, originalLines[actualLineIndex])}
                title="Revert this line to original"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            ) : (
              <div className="w-8 mr-1 flex-shrink-0" />
            )}
            
            {showLineNumbers && (
              <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
                {diffLine.type === 'collapsed' ? '' : (actualLineNumber || '')}
              </div>
            )}
            
            {/* Icon indicator for collapsed/changes */}
            <div className="w-6 flex items-center justify-center flex-shrink-0">
              {diffLine.type === 'collapsed' ? (
                <EyeOff className="w-3 h-3 text-blue-600" />
              ) : diffLine.type === 'addition' && side === 'modified' ? (
                <Plus className="w-3 h-3 text-green-600" />
              ) : diffLine.type === 'deletion' && side === 'original' ? (
                <Minus className="w-3 h-3 text-red-600" />
              ) : null}
            </div>
            
            <div className="flex-1 pl-2 min-w-0">
              {diffLine.type === 'collapsed' ? (
                <span className="text-blue-600 italic font-medium">
                  {lineContent}
                </span>
              ) : (
                <span className={`${diffLine.type === 'addition' && side === 'modified' ? 'text-green-700' : 
                                  diffLine.type === 'deletion' && side === 'original' ? 'text-red-700' : 
                                  'text-foreground'} whitespace-nowrap block`}>
                  {lineContent || ' '}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DiffPreviewSystem = ({ 
  patches = [], 
  originalCode = '', 
  modifiedCode = '',
  fileName = 'file',
  className = '',
  onCodeChange,
  onDiffStatsChange, // New callback to notify parent about diff state changes
  filePath = null, // File path for fetching AST diff data from API
  useAstDiff = true // Whether to use AST diff data from API
}) => {
  // Get selected store from context
  const { getSelectedStoreId, selectedStore } = useStoreSelection();
  
  const [selectedView, setSelectedView] = useState('unified');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [contextLines, setContextLines] = useState(3);
  const [currentModifiedCode, setCurrentModifiedCode] = useState(modifiedCode);
  const [copyStatus, setCopyStatus] = useState({ copied: false, error: null });
  const [previewStatus, setPreviewStatus] = useState({ loading: false, error: null, url: null });
  const [astDiffData, setAstDiffData] = useState(null);
  const [fetchingAstDiff, setFetchingAstDiff] = useState(false);
  const [astDiffError, setAstDiffError] = useState(null);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for refreshing patch data

  const diffServiceRef = useRef(new UnifiedDiffFrontendService());
  const originalBaseCodeRef = useRef(originalCode); // Preserve original base code
  const originalScrollRef = useRef(null);
  const modifiedScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  // Update current modified code when props change
  useEffect(() => {
    setCurrentModifiedCode(modifiedCode);
  }, [modifiedCode]);
  
  // Preserve original base code reference
  useEffect(() => {
    originalBaseCodeRef.current = originalCode;
  }, [originalCode]);

  // Fetch AST diff data when filePath changes and useAstDiff is enabled
  useEffect(() => {
    console.log('🔄 [DiffPreview] useEffect triggered:', { useAstDiff, filePath, hasFilePath: !!filePath });
    if (useAstDiff && filePath && filePath.trim() !== '') {
      const fetchData = async () => {
        console.log('📡 [DiffPreview] Starting fetchData for:', filePath);
        setFetchingAstDiff(true);
        setAstDiffError(null);
        
        try {
          const storeId = getSelectedStoreId();
          console.log('🏪 [DiffPreview] Store ID:', storeId);
          const result = await fetchAstDiffData(filePath, storeId);
          console.log('📊 [DiffPreview] fetchAstDiffData result:', result);
          
          if (result.success) {
            console.log('✅ [DiffPreview] Setting astDiffData:', {
              hasResult: !!result,
              hasPatch: !!result.patch,
              hasUnifiedDiff: !!result.patch?.unified_diff,
              patchKeys: result.patch ? Object.keys(result.patch) : null,
              unifiedDiffPreview: result.patch?.unified_diff ? result.patch.unified_diff.substring(0, 100) + '...' : 'MISSING'
            });
            setAstDiffData(result);
            
            // Update the codes if they were fetched from the API
            if (result.baselineCode) {
              console.log('📄 [DiffPreview] Setting baseline code from API response', {
                baselineLength: result.baselineCode.length,
                hasOriginalCode: !!originalCode
              });
              originalBaseCodeRef.current = result.baselineCode;
            }
            if (result.modifiedCode) {
              console.log('📝 [DiffPreview] Setting modified code from API response', {
                modifiedLength: result.modifiedCode.length
              });
              setCurrentModifiedCode(result.modifiedCode);
            }
          } else {
            console.log('❌ [DiffPreview] Setting error:', result.error || result.message);
            setAstDiffError(result.error || result.message || 'Failed to fetch AST diff data');
            setAstDiffData(null);
          }
        } catch (error) {
          setAstDiffError(error.message);
          setAstDiffData(null);
        } finally {
          setFetchingAstDiff(false);
        }
      };
      
      fetchData();
    }
  }, [filePath, useAstDiff, originalCode, modifiedCode, selectedStore?.id, refreshTrigger]);

  // Handle synchronized scrolling between split view panes
  const handleSyncScroll = useCallback((source, scrollTop, scrollLeft) => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    
    requestAnimationFrame(() => {
      try {
        if (source === 'original' && modifiedScrollRef.current) {
          modifiedScrollRef.current.scrollTop = scrollTop;
          modifiedScrollRef.current.scrollLeft = scrollLeft;
        } else if (source === 'modified' && originalScrollRef.current) {
          originalScrollRef.current.scrollTop = scrollTop;
          originalScrollRef.current.scrollLeft = scrollLeft;
        }
      } catch (error) {
        console.warn('Scroll sync error:', error);
      }
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 10);
    });
  }, []);

  // Set up scroll event listeners for synchronized scrolling
  useEffect(() => {
    let cleanup = null;
    
    // Use a small delay to ensure refs are properly attached
    const timeoutId = setTimeout(() => {
      const originalViewport = originalScrollRef.current;
      const modifiedViewport = modifiedScrollRef.current;
      
      if (!originalViewport || !modifiedViewport) {
        return;
      }
      
      const handleOriginalScroll = (e) => {
        if (!isScrollingRef.current) {
          handleSyncScroll('original', e.target.scrollTop, e.target.scrollLeft);
        }
      };
      
      const handleModifiedScroll = (e) => {
        if (!isScrollingRef.current) {
          handleSyncScroll('modified', e.target.scrollTop, e.target.scrollLeft);
        }
      };
      
      originalViewport.addEventListener('scroll', handleOriginalScroll, { passive: true });
      modifiedViewport.addEventListener('scroll', handleModifiedScroll, { passive: true });
      
      // Set cleanup function
      cleanup = () => {
        originalViewport.removeEventListener('scroll', handleOriginalScroll);
        modifiedViewport.removeEventListener('scroll', handleModifiedScroll);
      };
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, [handleSyncScroll, selectedView]);

  // Handle line revert functionality
  const handleLineRevert = useCallback(async (lineIndex, originalLine) => {
    console.log('🔄 Reverting line', lineIndex, 'from:', currentModifiedCode.split('\n')[lineIndex]);
    console.log('🔄 Reverting to:', originalBaseCodeRef.current.split('\n')[lineIndex]);
    
    const currentLines = currentModifiedCode.split('\n');
    const originalLines = originalBaseCodeRef.current.split('\n');
    
    // Revert the specific line to its original content
    if (lineIndex < currentLines.length && lineIndex < originalLines.length) {
      const originalContent = originalLines[lineIndex] || '';
      currentLines[lineIndex] = originalContent;
      const newCode = currentLines.join('\n');
      
      console.log('🔄 New code after revert has', newCode.split('\n').length, 'lines');
      
      setCurrentModifiedCode(newCode);
      
      // Surgically revert patches for this specific line
      try {
        console.log('✂️ Surgically reverting patches for line', lineIndex);
        const storeId = getSelectedStoreId();
        const modifiedContent = currentLines[lineIndex] || '';
        
        const token = localStorage.getItem('store_owner_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
          console.error('❌ No authentication token found in any of: store_owner_auth_token, auth_token, token');
          return;
        }
        
        console.log('🌐 Making surgical revert request:', {
          url: `/api/patches/revert-line/${encodeURIComponent(fileName)}`,
          method: 'PATCH',
          headers: {
            'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'Missing',
            'Content-Type': 'application/json',
            'X-Store-Id': storeId
          },
          body: {
            lineNumber: lineIndex,
            originalContent: originalContent,
            modifiedContent: modifiedContent
          }
        });
        
        const response = await fetch(`/api/patches/revert-line/${encodeURIComponent(fileName)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Store-Id': storeId
          },
          body: JSON.stringify({
            lineNumber: lineIndex,
            originalContent: originalContent,
            modifiedContent: modifiedContent
          })
        });

        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            'content-type': response.headers.get('content-type'),
            'access-control-allow-origin': response.headers.get('access-control-allow-origin')
          }
        });
        
        const result = await response.json();
        if (result.success) {
          console.log('✅ Successfully reverted line', lineIndex, '- Modified:', result.data.modifiedPatches, 'Deleted:', result.data.deletedPatches);
          
          // Add a small delay to ensure database changes are reflected
          setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
          }, 100);
        } else {
          console.error('❌ Failed to revert patches:', result.error);
        }
      } catch (error) {
        console.error('❌ Error reverting patches for line:', error);
      }
      
      // Notify parent component of the change
      if (onCodeChange) {
        onCodeChange(newCode);
      }
    }
  }, [currentModifiedCode, onCodeChange, fileName]);

  // Handle preview functionality with enhanced route resolution
  const handlePreview = useCallback(async () => {
    setPreviewStatus({ loading: true, error: null, url: null });
    
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        throw new Error('No store selected');
      }
      
      // Extract component name from file name or code
      const componentName = extractComponentName(fileName, currentModifiedCode);
      
      // Try multiple resolution strategies for better page name matching
      const resolutionStrategies = [
        componentName, // Original name
        componentName.replace(/([a-z])([A-Z])/g, '$1 $2'), // CamelCase to spaces
        componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(), // CamelCase to kebab-case
        componentName.replace(/(Component|Page)$/, ''), // Remove common suffixes
        componentName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/(Component|Page)$/, '').trim() // Combined transformations
      ];
      
      let urlResult = null;
      let lastError = null;
      
      // Try each resolution strategy until one succeeds
      for (const pageName of resolutionStrategies) {
        if (pageName && pageName.trim() !== '') {
          try {
            urlResult = await resolvePageURL(pageName.trim(), storeId);
            if (urlResult.success) {
              break; // Found a successful resolution
            }
            lastError = urlResult.error;
          } catch (error) {
            lastError = error.message;
            continue;
          }
        }
      }
      
      // If no exact match found but we have a fallback, use it
      if (!urlResult?.success && urlResult?.fallback) {
        console.log('Using fallback URL for preview:', urlResult.url);
      }
      
      if (urlResult && (urlResult.success || urlResult.fallback)) {
        // Enhanced preview URL with AST diff data if available
        let previewUrl = urlResult.url;
        
        // Add preview parameters
        const previewParams = new URLSearchParams({
          preview: 'true',
          editor: 'true'
        });
        
        // Include AST diff data if available
        if (astDiffData && astDiffData.astDiff) {
          previewParams.set('ast_patch', encodeURIComponent(JSON.stringify(astDiffData.astDiff)));
        }
        
        // Include modified code
        if (currentModifiedCode) {
          previewParams.set('patch', encodeURIComponent(btoa(currentModifiedCode)));
        }
        
        // Include file path for context
        if (filePath) {
          previewParams.set('file_path', encodeURIComponent(filePath));
        }
        
        previewUrl += '?' + previewParams.toString();
        
        // Open preview with enhanced features
        const previewWindow = window.open(
          previewUrl, 
          '_blank', 
          'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
        );
        
        if (previewWindow) {
          // Log the storefront URL source for debugging
          if (urlResult.storefront_source) {
            console.log(`Preview opened using ${urlResult.storefront_source} URL:`, urlResult.url.split('?')[0]);
          }
          
          setPreviewStatus({ 
            loading: false, 
            error: null, 
            url: previewUrl,
            storefrontSource: urlResult.storefront_source
          });
        } else {
          throw new Error('Failed to open preview window (popup blocked?)');
        }
      } else {
        throw new Error(lastError || 'Could not resolve page URL for any component name variant');
      }
      
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewStatus({ 
        loading: false, 
        error: error.message || 'Failed to generate preview', 
        url: null 
      });
      
      // Reset error after 3 seconds
      setTimeout(() => {
        setPreviewStatus(prev => ({ ...prev, error: null }));
      }, 3000);
    }
  }, [fileName, currentModifiedCode, selectedStore?.id, astDiffData, filePath]);

  // Calculate diff using DiffService (always compare against original base code)
  const diffResult = useMemo(() => {
    console.log('🔧 [DiffPreview] Calculating diff result:', {
      hasBaseCode: !!originalBaseCodeRef.current,
      baseCodeLength: originalBaseCodeRef.current?.length || 0,
      hasModifiedCode: !!currentModifiedCode,
      modifiedCodeLength: currentModifiedCode?.length || 0,
      hasAstDiffData: !!astDiffData,
      hasStoredUnifiedDiff: !!astDiffData?.patch?.unified_diff,
      useAstDiff,
      astDiffDataKeys: astDiffData ? Object.keys(astDiffData) : null,
      patchKeys: astDiffData?.patch ? Object.keys(astDiffData.patch) : null,
      unifiedDiffValue: astDiffData?.patch?.unified_diff ? astDiffData.patch.unified_diff.substring(0, 100) + '...' : 'NOT FOUND'
    });
    
    // PRIORITY 1: If we have stored unified_diff from patch, use it directly
    if (astDiffData?.patch?.unified_diff) {
      console.log('🎯 [DiffPreview] Using stored unified_diff directly from patch');
      const storedUnifiedDiff = astDiffData.patch.unified_diff;
      const stats = diffServiceRef.current.getDiffStats(storedUnifiedDiff);
      const parsedDiff = diffServiceRef.current.parseUnifiedDiff(storedUnifiedDiff);
      
      console.log('📊 [DiffPreview] Direct unified diff result:', {
        unifiedDiffLength: storedUnifiedDiff.length,
        parsedDiffLength: parsedDiff.length,
        stats
      });
      
      return {
        success: true,
        unifiedDiff: storedUnifiedDiff,
        parsedDiff: parsedDiff,
        stats: stats || { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
        metadata: {
          algorithm: 'unified',
          source: 'stored_unified_diff',
          message: 'Using stored unified diff from patch directly'
        }
      };
    }
    
    // PRIORITY 2: Wait for API data if useAstDiff is enabled
    if (useAstDiff && filePath && !astDiffData) {
      console.log('⏳ [DiffPreview] Waiting for AST diff data...');
      return {
        success: true,
        unifiedDiff: '',
        parsedDiff: [],
        stats: { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
        metadata: { 
          algorithm: 'unified',
          source: 'waiting',
          message: 'Waiting for API data'
        }
      };
    }
    
    // If we have both baseline and modified code, generate diff normally
    if (baseCode && currentModifiedCode) {
      console.log('✅ [DiffPreview] Using direct baseline + modified code approach');
      
      // Check if this is just a line ending issue
      const isLineEndingOnly = diffServiceRef.current.isLineEndingOnlyDiff(baseCode, currentModifiedCode);
      
      if (isLineEndingOnly) {
        console.log('📋 [DiffPreview] Detected line-ending-only diff, showing as no changes');
        return {
          success: true,
          unifiedDiff: null,
          parsedDiff: [],
          stats: { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
          metadata: { 
            algorithm: 'unified',
            isLineEndingOnly: true,
            message: 'No content changes detected (line endings normalized)'
          }
        };
      }

      const result = diffServiceRef.current.createDiff(baseCode, currentModifiedCode);
      const stats = diffServiceRef.current.getDiffStats(result.unifiedDiff);
      
      console.log('📊 [DiffPreview] Generated diff result:', {
        success: result.success,
        hasUnifiedDiff: !!result.unifiedDiff,
        unifiedDiffLength: result.unifiedDiff?.length || 0,
        hasParsedDiff: !!result.parsedDiff,
        parsedDiffLength: result.parsedDiff?.length || 0,
        stats
      });
      
      return {
        ...result,
        stats: stats || { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
        unifiedDiff: result.unifiedDiff,
        metadata: {
          algorithm: 'unified',
          source: 'direct_comparison',
          message: 'Generated from baseline and modified code'
        }
      };
    }
    
    // Fallback: If no baseline/modified code but we have a patch with unified_diff, use that
    if (astDiffData?.patch?.unified_diff) {
      console.log('📋 [DiffPreview] Using stored unified_diff from patch as fallback');
      const unifiedDiff = astDiffData.patch.unified_diff;
      
      // Try to reconstruct both original and modified code from the unified diff
      const reconstructed = diffServiceRef.current.reconstructFromUnifiedDiff(unifiedDiff);
      
      if (reconstructed.success) {
        console.log('🔄 [DiffPreview] Successfully reconstructed code from unified diff:', {
          originalCodeLength: reconstructed.originalCode?.length || 0,
          modifiedCodeLength: reconstructed.modifiedCode?.length || 0,
          originalLines: reconstructed.metadata.originalLines,
          modifiedLines: reconstructed.metadata.modifiedLines
        });
        
        // Set the reconstructed code so other views can use it
        originalBaseCodeRef.current = reconstructed.originalCode;
        setCurrentModifiedCode(reconstructed.modifiedCode);
        
        // Now create the diff normally using the reconstructed code
        const result = diffServiceRef.current.createDiff(reconstructed.originalCode, reconstructed.modifiedCode);
        const stats = diffServiceRef.current.getDiffStats(result.unifiedDiff);
        
        return {
          ...result,
          stats: stats || { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
          unifiedDiff: result.unifiedDiff,
          metadata: {
            algorithm: 'unified',
            source: 'reconstructed_from_patch',
            message: 'Reconstructed original and modified code from stored unified diff'
          }
        };
      } else {
        console.log('⚠️ [DiffPreview] Failed to reconstruct from unified diff, using raw approach');
        // Fall back to the old approach if reconstruction fails
        const stats = diffServiceRef.current.getDiffStats(unifiedDiff);
        const parsedDiff = diffServiceRef.current.parseUnifiedDiff(unifiedDiff);
        
        return {
          success: true,
          unifiedDiff: unifiedDiff,
          parsedDiff: parsedDiff,
          stats: stats || { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
          metadata: {
            algorithm: 'unified',
            source: 'stored_patch',
            message: 'Using stored unified diff from patch (reconstruction failed)'
          }
        };
      }
    }
    
    // No data available
    return { 
      success: true,
      diff: [], 
      stats: { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
      unifiedDiff: '',
      metadata: null
    };
  }, [currentModifiedCode, fileName, astDiffData, useAstDiff, filePath]);

  // Notify parent when diff stats change
  useEffect(() => {
    if (onDiffStatsChange) {
      onDiffStatsChange(diffResult.stats);
    }
  }, [diffResult.stats, onDiffStatsChange]);

  // Generate full file display lines with changes highlighted
  const generateFullFileDisplayLines = (parsedDiff) => {
    console.log('✨ [DiffPreview] generateFullFileDisplayLines starting:', {
      hasOriginal: !!originalBaseCodeRef.current,
      hasModified: !!currentModifiedCode,
      parsedDiffHunks: parsedDiff.length
    });

    const originalLines = originalBaseCodeRef.current.split('\n');
    const modifiedLines = currentModifiedCode.split('\n');
    const displayLines = [];
    
    // Process each hunk separately to maintain proper separation
    let lastProcessedLine = 0;
    
    parsedDiff.forEach((hunk, hunkIndex) => {
      console.log(`🔧 Processing hunk ${hunkIndex + 1}:`, {
        oldStart: hunk.oldStart,
        oldLength: hunk.oldLength,
        newStart: hunk.newStart,
        newLength: hunk.newLength,
        changes: hunk.changes?.length || 0
      });
      
      const hunkStartLine = hunk.oldStart;
      const contextBefore = 3; // Show 3 lines of context before changes
      const contextAfter = 3; // Show 3 lines of context after changes
      
      // Add context lines before this hunk (if there's a gap from last processed line)
      const contextStart = Math.max(lastProcessedLine + 1, hunkStartLine - contextBefore);
      const hunkActualStart = hunkStartLine;
      
      // Add context lines before the hunk
      for (let i = contextStart - 1; i < hunkActualStart - 1; i++) {
        if (i >= 0 && i < originalLines.length) {
          const lineNumber = i + 1;
          displayLines.push({
            type: 'context',
            lineNumber: lineNumber,
            newLineNumber: lineNumber,
            content: originalLines[i],
            originalContent: originalLines[i],
            modifiedContent: modifiedLines[i] || originalLines[i]
          });
        }
      }
      
      // Process the actual changes in this hunk
      let oldLineNum = hunk.oldStart; // 1-indexed
      let newLineNum = hunk.newStart; // 1-indexed
      
      hunk.changes.forEach((change, changeIndex) => {
        console.log(`  Change ${changeIndex + 1}: ${change.type} - "${change.content}" (old: ${oldLineNum}, new: ${newLineNum})`);
        
        switch (change.type) {
          case 'delete':
            displayLines.push({
              type: 'deletion',
              lineNumber: oldLineNum,
              newLineNumber: null,
              content: change.content,
              originalContent: change.content,
              modifiedContent: null
            });
            oldLineNum++;
            break;
            
          case 'add':
            displayLines.push({
              type: 'addition',
              lineNumber: null,
              newLineNumber: newLineNum,
              content: change.content,
              originalContent: null,
              modifiedContent: change.content
            });
            newLineNum++;
            break;
            
          case 'context':
            displayLines.push({
              type: 'context',
              lineNumber: oldLineNum,
              newLineNumber: newLineNum,
              content: change.content,
              originalContent: change.content,
              modifiedContent: change.content
            });
            oldLineNum++;
            newLineNum++;
            break;
        }
      });
      
      // Add context lines after this hunk
      const hunkEndLine = Math.max(oldLineNum - 1, newLineNum - 1);
      const contextEnd = Math.min(hunkEndLine + contextAfter, originalLines.length);
      
      for (let i = hunkEndLine; i < contextEnd; i++) {
        if (i >= 0 && i < originalLines.length) {
          const lineNumber = i + 1;
          displayLines.push({
            type: 'context',
            lineNumber: lineNumber,
            newLineNumber: lineNumber,
            content: originalLines[i],
            originalContent: originalLines[i],
            modifiedContent: modifiedLines[i] || originalLines[i]
          });
        }
      }
      
      lastProcessedLine = contextEnd;
      
      // Add a visual separator between hunks (except for the last hunk)
      if (hunkIndex < parsedDiff.length - 1) {
        displayLines.push({
          type: 'hunk_separator',
          lineNumber: null,
          newLineNumber: null,
          content: '...',
          originalContent: null,
          modifiedContent: null
        });
      }
    });
    
    console.log('✅ [DiffPreview] generateFullFileDisplayLines completed:', {
      totalLines: displayLines.length,
      additions: displayLines.filter(line => line.type === 'addition').length,
      deletions: displayLines.filter(line => line.type === 'deletion').length,
      context: displayLines.filter(line => line.type === 'context').length,
      hunks: parsedDiff.length,
      separators: displayLines.filter(line => line.type === 'hunk_separator').length
    });
    
    return displayLines;
  };

  // Convert parsed unified diff with full code context
  const convertParsedUnifiedDiffToDisplayLines = (parsedDiff) => {
    console.log('🔧 [DiffPreview] convertParsedUnifiedDiffToDisplayLines starting:', {
      parsedDiffLength: parsedDiff.length,
      firstHunk: parsedDiff[0],
      hasBaselineCode: !!originalBaseCodeRef.current,
      hasModifiedCode: !!currentModifiedCode
    });
    
    if (!parsedDiff || parsedDiff.length === 0) {
      console.log('⚠️ [DiffPreview] No parsed diff data provided');
      return [];
    }

    // If we have full baseline and modified code, generate complete file view with changes highlighted
    if (originalBaseCodeRef.current && currentModifiedCode) {
      console.log('✨ [DiffPreview] Generating full file context with changes highlighted');
      return generateFullFileDisplayLines(parsedDiff);
    }

    // Fallback to hunk-only view if we don't have full code
    console.log('⚠️ [DiffPreview] Using hunk-only view - full code not available');
    const displayLines = [];
    
    parsedDiff.forEach((hunk, hunkIndex) => {
      console.log(`🔧 [DiffPreview] Processing hunk ${hunkIndex}:`, {
        oldStart: hunk.oldStart,
        oldLength: hunk.oldLength,
        newStart: hunk.newStart,
        newLength: hunk.newLength,
        changesCount: hunk.changes?.length || 0
      });
      
      if (!hunk.changes || hunk.changes.length === 0) {
        console.log(`⚠️ [DiffPreview] Hunk ${hunkIndex} has no changes`);
        return;
      }
      
      let oldLineNumber = hunk.oldStart;
      let newLineNumber = hunk.newStart;
      
      hunk.changes.forEach((change, changeIndex) => {
        console.log(`  Change ${changeIndex}: ${change.type} - "${change.content}"`);
        
        switch (change.type) {
          case 'context':
            displayLines.push({
              type: 'context',
              lineNumber: oldLineNumber,
              newLineNumber: newLineNumber,
              content: change.content,
              originalContent: change.content,
              modifiedContent: change.content
            });
            oldLineNumber++;
            newLineNumber++;
            break;
            
          case 'delete':
            displayLines.push({
              type: 'deletion',
              lineNumber: oldLineNumber,
              newLineNumber: null,
              content: change.content,
              originalContent: change.content,
              modifiedContent: null
            });
            oldLineNumber++;
            break;
            
          case 'add':
            displayLines.push({
              type: 'addition',
              lineNumber: null,
              newLineNumber: newLineNumber,
              content: change.content,
              originalContent: null,
              modifiedContent: change.content
            });
            newLineNumber++;
            break;
            
          default:
            console.log(`⚠️ [DiffPreview] Unknown change type: ${change.type}`);
            break;
        }
      });
    });
    
    console.log('✅ [DiffPreview] convertParsedUnifiedDiffToDisplayLines completed:', {
      displayLinesLength: displayLines.length,
      sampleDisplayLines: displayLines.slice(0, 3)
    });
    
    return displayLines;
  };

  // Convert DiffService diff to displayable lines for UI
  const convertDiffToDisplayLines = (diff) => {
    // Check if we have the required data for full diff conversion
    if (!originalBaseCodeRef.current || !currentModifiedCode) {
      return [];
    }

    const originalLines = originalBaseCodeRef.current.split('\n');
    const modifiedLines = currentModifiedCode.split('\n');
    const displayLines = [];
    
    let originalIndex = 0;
    let modifiedIndex = 0;
    
    diff.forEach((change, index) => {
      switch (change.type) {
        case 'equal':
          displayLines.push({
            type: 'context',
            lineNumber: originalIndex + 1,
            newLineNumber: modifiedIndex + 1,
            content: change.value,
            originalContent: change.value
          });
          originalIndex++;
          modifiedIndex++;
          break;
          
        case 'delete':
          const deleteValues = Array.isArray(change.value) ? change.value : [change.value];
          deleteValues.forEach(value => {
            displayLines.push({
              type: 'deletion',
              lineNumber: originalIndex + 1,
              newLineNumber: null,
              content: value,
              originalContent: value
            });
            originalIndex++;
          });
          break;
          
        case 'insert':
          const insertValues = Array.isArray(change.value) ? change.value : [change.value];
          insertValues.forEach(value => {
            displayLines.push({
              type: 'addition',
              lineNumber: null,
              newLineNumber: modifiedIndex + 1,
              content: value,
              originalContent: null
            });
            modifiedIndex++;
          });
          break;
      }
    });
    
    return displayLines;
  };

  // Get display lines from diff
  const displayLines = useMemo(() => {
    if (!diffResult.parsedDiff || diffResult.parsedDiff.length === 0) {
      console.log('🔄 [DiffPreview] No parsed diff available for display lines:', {
        hasParsedDiff: !!diffResult.parsedDiff,
        parsedDiffLength: diffResult.parsedDiff?.length || 0,
        diffResultKeys: Object.keys(diffResult || {}),
        diffResultSource: diffResult.metadata?.source
      });
      return [];
    }
    
    // If using stored unified diff directly, use specialized converter
    if (diffResult.metadata?.source === 'stored_unified_diff') {
      console.log('🎯 [DiffPreview] Converting stored unified diff to display lines', {
        parsedDiffLength: diffResult.parsedDiff.length,
        firstHunk: diffResult.parsedDiff[0]
      });
      const displayLines = convertParsedUnifiedDiffToDisplayLines(diffResult.parsedDiff);
      console.log('🔄 [DiffPreview] Generated display lines from stored diff:', {
        displayLinesLength: displayLines.length,
        sampleLines: displayLines.slice(0, 3)
      });
      return displayLines;
    }
    
    // If we successfully reconstructed from patch, use standard converter
    if (diffResult.metadata?.source === 'reconstructed_from_patch') {
      console.log('🔄 [DiffPreview] Using standard converter for reconstructed diff');
      return convertDiffToDisplayLines(diffResult.parsedDiff);
    }
    
    // If we're using stored unified diff (fallback), use the specialized converter
    if (diffResult.metadata?.source === 'stored_patch') {
      console.log('🔄 [DiffPreview] Using stored patch converter for display lines', {
        parsedDiffLength: diffResult.parsedDiff.length,
        firstHunk: diffResult.parsedDiff[0]
      });
      const displayLines = convertParsedUnifiedDiffToDisplayLines(diffResult.parsedDiff);
      console.log('🔄 [DiffPreview] Generated display lines:', {
        displayLinesLength: displayLines.length,
        sampleLines: displayLines.slice(0, 3)
      });
      return displayLines;
    }
    
    // Otherwise use the standard diff converter
    console.log('🔄 [DiffPreview] Using standard diff converter');
    return convertDiffToDisplayLines(diffResult.parsedDiff);
  }, [diffResult.parsedDiff, currentModifiedCode, diffResult.metadata]);

  // Process display lines for collapsing unchanged fragments
  const processedDisplayLines = useMemo(() => {
    console.log('🔧 [DiffPreview] Processing display lines:', {
      displayLinesLength: displayLines.length,
      collapseUnchanged,
      firstDisplayLine: displayLines[0]
    });
    
    if (!collapseUnchanged || displayLines.length === 0) {
      console.log('🔄 [DiffPreview] Returning unprocessed display lines:', displayLines.length);
      return displayLines;
    }

    const processed = [];
    let contextGroup = [];
    const maxContextLines = 3; // Show 3 context lines before/after changes
    const minCollapsibleLines = 8; // Only collapse if there are at least this many context lines

    // First pass: identify change positions to better handle context around them
    const changePositions = [];
    displayLines.forEach((line, index) => {
      if (line.type === 'addition' || line.type === 'deletion') {
        changePositions.push(index);
      }
    });

    console.log('🔧 [DiffPreview] Found', changePositions.length, 'changes at positions:', changePositions);

    // Second pass: process lines with improved context grouping
    for (let i = 0; i < displayLines.length; i++) {
      const line = displayLines[i];
      
      // Check if we're near any changes (within maxContextLines distance)
      const nearChange = changePositions.some(changePos => 
        Math.abs(i - changePos) <= maxContextLines
      );
      
      if (line.type === 'context' && !nearChange) {
        // This is context that's far from changes - eligible for collapsing
        contextGroup.push({ ...line, index: i });
      } else {
        // Process any accumulated context group before this important line
        if (contextGroup.length >= minCollapsibleLines) {
          // Large context group - show first few, collapsed indicator, last few
          processed.push(...contextGroup.slice(0, maxContextLines));
          
          const collapsedCount = contextGroup.length - (maxContextLines * 2);
          if (collapsedCount > 0) {
            processed.push({
              type: 'collapsed',
              collapsedCount,
              startIndex: contextGroup[maxContextLines].index,
              endIndex: contextGroup[contextGroup.length - maxContextLines - 1].index,
              content: `... ${collapsedCount} unchanged lines hidden (click to expand)`,
              originalContent: null,
              lineNumber: null,
              newLineNumber: null
            });
            
            processed.push(...contextGroup.slice(-maxContextLines));
          } else {
            // If somehow we don't have enough to collapse after removing context, show all
            processed.push(...contextGroup);
          }
        } else if (contextGroup.length > 0) {
          // Small context group - show all
          processed.push(...contextGroup);
        }
        
        contextGroup = [];
        
        // Add the important line (change or context near changes)
        processed.push({ ...line, index: i });
      }
    }
    
    // Process any remaining context group at the end
    if (contextGroup.length >= minCollapsibleLines) {
      processed.push(...contextGroup.slice(0, maxContextLines));
      const collapsedCount = contextGroup.length - maxContextLines;
      if (collapsedCount > 0) {
        processed.push({
          type: 'collapsed',
          collapsedCount,
          startIndex: contextGroup[maxContextLines].index,
          endIndex: contextGroup[contextGroup.length - 1].index,
          content: `... ${collapsedCount} unchanged lines hidden (click to expand)`,
          originalContent: null,
          lineNumber: null,
          newLineNumber: null
        });
      }
    } else if (contextGroup.length > 0) {
      processed.push(...contextGroup);
    }

    console.log('✅ [DiffPreview] Collapse processing completed:', {
      originalLines: displayLines.length,
      processedLines: processed.length,
      collapsedSections: processed.filter(line => line.type === 'collapsed').length
    });

    return processed;
  }, [displayLines, collapseUnchanged]);

  // Handle expanding collapsed sections
  const handleExpandCollapsed = useCallback((startIndex, endIndex) => {
    const sectionKey = `${startIndex}-${endIndex}`;
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  // Final display lines considering expanded sections
  const finalDisplayLines = useMemo(() => {
    console.log('🎯 [DiffPreview] Creating final display lines:', {
      processedDisplayLinesLength: processedDisplayLines.length,
      collapseUnchanged,
      expandedSectionsSize: expandedSections.size,
      processedSample: processedDisplayLines.slice(0, 2)
    });
    
    if (!collapseUnchanged || expandedSections.size === 0) {
      console.log('✅ [DiffPreview] Using processed display lines as final:', processedDisplayLines.length);
      return processedDisplayLines;
    }

    const final = [];
    for (const line of processedDisplayLines) {
      if (line.type === 'collapsed') {
        const sectionKey = `${line.startIndex}-${line.endIndex}`;
        if (expandedSections.has(sectionKey)) {
          // Show the expanded lines
          const expandedLines = displayLines.slice(line.startIndex, line.endIndex + 1);
          final.push(...expandedLines);
        } else {
          final.push(line);
        }
      } else {
        final.push(line);
      }
    }
    return final;
  }, [processedDisplayLines, expandedSections, displayLines, collapseUnchanged]);

  const copyDiff = async () => {
    try {
      setCopyStatus({ copied: false, error: null });
      
      if (!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === '') {
        setCopyStatus({ copied: false, error: 'No diff content to copy' });
        setTimeout(() => setCopyStatus({ copied: false, error: null }), 3000);
        return;
      }

      await navigator.clipboard.writeText(diffResult.unifiedDiff);
      setCopyStatus({ copied: true, error: null });
      
      // Reset the copied status after 2 seconds
      setTimeout(() => {
        setCopyStatus({ copied: false, error: null });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy diff:', error);
      setCopyStatus({ copied: false, error: 'Failed to copy to clipboard' });
      
      // Reset error status after 3 seconds
      setTimeout(() => setCopyStatus({ copied: false, error: null }), 3000);
    }
  };

  const exportDiff = () => {
    const blob = new Blob([diffResult.unifiedDiff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'file'}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const DiffLine = ({ line, index, onExpandCollapsed }) => {
    const getLineStyle = () => {
      switch (line.type) {
        case 'addition':
          return 'bg-green-50 border-l-4 border-green-500';
        case 'deletion':
          return 'bg-red-50 border-l-4 border-red-500';
        case 'modification':
          return 'bg-yellow-50 border-l-4 border-yellow-500';
        case 'collapsed':
          return 'bg-blue-50 border-l-4 border-blue-300 cursor-pointer hover:bg-blue-100 transition-colors';
        case 'hunk_separator':
          return 'bg-gray-100 border-l-4 border-gray-300 text-center';
        default:
          return 'bg-background';
      }
    };

    const getLineIcon = () => {
      switch (line.type) {
        case 'addition':
          return <Plus className="w-3 h-3 text-green-600" />;
        case 'deletion':
          return <Minus className="w-3 h-3 text-red-600" />;
        case 'modification':
          return <ArrowRight className="w-3 h-3 text-yellow-600" />;
        case 'collapsed':
          return <EyeOff className="w-3 h-3 text-blue-600" />;
        case 'hunk_separator':
          return <RotateCcw className="w-3 h-3 text-gray-500" />;
        default:
          return null;
      }
    };

    const handleCollapsedClick = () => {
      if (line.type === 'collapsed' && onExpandCollapsed) {
        onExpandCollapsed(line.startIndex, line.endIndex);
      }
    };

    return (
      <div 
        className={`flex items-center px-2 py-1 text-sm font-mono min-w-max ${getLineStyle()}`}
        onClick={line.type === 'collapsed' ? handleCollapsedClick : undefined}
        title={line.type === 'collapsed' ? 'Click to expand hidden lines' : undefined}
      >
        {lineNumbers && (
          <>
            <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
              {line.lineNumber || ''}
            </div>
            <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
              {line.newLineNumber || ''}
            </div>
          </>
        )}
        
        <div className="w-6 flex items-center justify-center flex-shrink-0">
          {getLineIcon()}
        </div>
        
        <div className="pl-2 whitespace-nowrap">
          {line.type === 'collapsed' ? (
            <span className="text-blue-600 italic font-medium">
              {line.content}
            </span>
          ) : line.type === 'modification' ? (
            <div className="space-y-1">
              <div className="text-red-600 line-through whitespace-nowrap">
                {line.originalContent}
              </div>
              <div className="text-green-600 whitespace-nowrap">
                {line.content}
              </div>
            </div>
          ) : line.type === 'hunk_separator' ? (
            <span className="text-gray-500 italic font-medium text-center w-full block">
              {line.content}
            </span>
          ) : (
            <span className={`whitespace-nowrap ${
              line.type === 'addition' ? 'text-green-600' :
              line.type === 'deletion' ? 'text-red-600' :
              'text-foreground'
            }`}>
              {line.content}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Component to render formatted raw diff
  const FormattedRawDiff = ({ unifiedDiff }) => {
    if (!unifiedDiff || unifiedDiff.trim() === '') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p>No differences to display</p>
          </div>
        </div>
      );
    }

    const lines = unifiedDiff.split('\n');
    
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => {
          const getLineStyle = () => {
            if (line.startsWith('@@')) {
              return 'bg-blue-50 text-blue-800 font-semibold border-l-4 border-blue-400';
            } else if (line.startsWith('+')) {
              return 'bg-green-50 text-green-800 border-l-4 border-green-400';
            } else if (line.startsWith('-')) {
              return 'bg-red-50 text-red-800 border-l-4 border-red-400';
            } else if (line.startsWith('+++') || line.startsWith('---')) {
              return 'bg-gray-100 text-gray-700 font-medium border-l-4 border-gray-300';
            } else {
              return 'text-foreground';
            }
          };

          const getLineIcon = () => {
            if (line.startsWith('@@')) {
              return <Settings className="w-3 h-3 text-blue-600 mr-2" />;
            } else if (line.startsWith('+')) {
              return <Plus className="w-3 h-3 text-green-600 mr-2" />;
            } else if (line.startsWith('-')) {
              return <Minus className="w-3 h-3 text-red-600 mr-2" />;
            } else if (line.startsWith('+++') || line.startsWith('---')) {
              return <FileText className="w-3 h-3 text-gray-600 mr-2" />;
            } else {
              return <div className="w-3 h-3 mr-2" />; // Spacer for alignment
            }
          };

          return (
            <div 
              key={index}
              className={`flex items-start px-3 py-1 whitespace-nowrap leading-5 ${getLineStyle()}`}
            >
              <div className="flex items-center flex-shrink-0">
                {getLineIcon()}
                <span className="w-12 text-right text-muted-foreground text-xs mr-3">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 overflow-x-auto">
                <span className="whitespace-pre">{line || ' '}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const PatchSummary = ({ patch, index }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{patch.name || `Patch ${index + 1}`}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {patch.description || 'No description available'}
          </p>
        </div>
        <Badge variant={patch.type === 'json-patch' ? 'default' : 'secondary'}>
          {patch.type}
        </Badge>
      </div>
      
      {patch.stats && (
        <div className="flex items-center space-x-4 mt-3 text-sm">
          <div className="flex items-center text-green-600">
            <Plus className="w-3 h-3 mr-1" />
            +{patch.stats.additions || 0}
          </div>
          <div className="flex items-center text-red-600">
            <Minus className="w-3 h-3 mr-1" />
            -{patch.stats.deletions || 0}
          </div>
          {patch.stats.changes > 0 && (
            <div className="flex items-center text-yellow-600">
              <ArrowRight className="w-3 h-3 mr-1" />
              ~{patch.stats.changes}
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Diff Preview</h3>
            
            {/* AST Diff Data Status Indicators */}
            {useAstDiff && filePath && (
              <div className="flex items-center space-x-2 ml-4">
                {fetchingAstDiff ? (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Loading AST
                  </Badge>
                ) : astDiffError ? (
                  <Badge variant="destructive" className="text-red-600 border-red-200 bg-red-50" title={astDiffError}>
                    <XCircle className="w-3 h-3 mr-1" />
                    AST Error
                  </Badge>
                ) : astDiffData ? (
                  <Badge variant="default" className="text-green-600 border-green-200 bg-green-50">
                    <Zap className="w-3 h-3 mr-1" />
                    AST Ready
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <Plus className="w-3 h-3 mr-1" />
                +{diffResult.stats.additions}
              </div>
              <div className="flex items-center text-red-600">
                <Minus className="w-3 h-3 mr-1" />
                -{diffResult.stats.deletions}
              </div>
              <div className="flex items-center text-yellow-600">
                <ArrowRight className="w-3 h-3 mr-1" />
                ~{diffResult.stats.modifications}
              </div>
              <div className="flex items-center text-blue-600 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {diffResult.stats.unchanged}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyDiff}
              className={`transition-all duration-200 ${
                copyStatus.copied 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : copyStatus.error 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : ''
              }`}
              disabled={!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === ''}
            >
              {copyStatus.copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm" onClick={exportDiff}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePreview}
              className={`transition-all duration-200 ${
                previewStatus.loading 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : previewStatus.error 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : ''
              }`}
              disabled={previewStatus.loading || !currentModifiedCode}
            >
              {previewStatus.loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {copyStatus.error && (
        <Alert className="mx-4 mb-2 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {copyStatus.error}
          </AlertDescription>
        </Alert>
      )}
      
      {previewStatus.error && (
        <Alert className="mx-4 mb-2 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Preview Error: {previewStatus.error}
          </AlertDescription>
        </Alert>
      )}
      
      {previewStatus.url && !previewStatus.loading && !previewStatus.error && (
        <Alert className="mx-4 mb-2 border-green-200 bg-green-50">
          <ExternalLink className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>
                Preview opened successfully
                {previewStatus.storefrontSource && (
                  <span className="ml-1 text-green-700">
                    (using {previewStatus.storefrontSource === 'localhost_fallback' ? 'localhost' : 
                           previewStatus.storefrontSource === 'primary_domain' ? 'custom domain' :
                           previewStatus.storefrontSource === 'render_service' ? 'Render service' :
                           previewStatus.storefrontSource === 'slug_fallback' ? 'default domain' :
                           previewStatus.storefrontSource})
                  </span>
                )}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPreviewStatus(prev => ({ ...prev, url: null }))}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {astDiffError && (
        <Alert className="mx-4 mb-2 border-yellow-200 bg-yellow-50">
          <XCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <span>AST Diff Error: {astDiffError}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAstDiffError(null)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <XCircle className="w-3 h-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <div className="flex-1">
        <Tabs value={selectedView} onValueChange={setSelectedView} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="unified">Unified Diff</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="raw">Raw Diff</TabsTrigger>
            <TabsTrigger value="patches">Patches</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              {/* Controls */}
              <div className="border-b p-2 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={(e) => setLineNumbers(e.target.checked)}
                      />
                      <span>Line numbers</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={collapseUnchanged}
                        onChange={(e) => setCollapseUnchanged(e.target.checked)}
                      />
                      <span>Collapse Unchanged</span>
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      <span>Context:</span>
                      <select
                        value={contextLines}
                        onChange={(e) => setContextLines(Number(e.target.value))}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        <option value={1}>1</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Diff Content */}
              <div className="flex-1 min-h-0">
                <div 
                  className="w-full"
                  style={{ 
                    overflowX: 'scroll',
                    overflowY: 'scroll',
                    scrollbarWidth: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarColor: '#cbd5e1 #f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="min-w-max w-fit" style={{ minHeight: 'calc(100vh - 300px)', minWidth: '800px', height: 'calc(100vh - 300px)' }}>
                  {finalDisplayLines.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p>No differences to display</p>
                        <p className="text-sm mt-1">
                          The original and modified code are identical
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono">
                      {finalDisplayLines.map((line, index) => (
                        <DiffLine key={index} line={line} index={index} onExpandCollapsed={handleExpandCollapsed} />
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="split" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              {/* Split View Controls */}
              <div className="border-b p-2 bg-muted/50">
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                    />
                    <span>Line numbers</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={collapseUnchanged}
                      onChange={(e) => setCollapseUnchanged(e.target.checked)}
                    />
                    <span>Collapse Unchanged</span>
                  </label>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 min-h-0">
                <div className={`${(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? 'border-r' : ''} flex flex-col min-h-0`}>
                  <div className="border-b p-2 bg-red-50 flex-shrink-0">
                    <h4 className="font-medium text-red-900">Original ({originalBaseCodeRef.current.split('\n').length} lines)</h4>
                  </div>
                  {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? (
                    <div 
                      className="flex-1 min-h-0"
                      ref={originalScrollRef}
                      style={{ 
                        overflowX: 'scroll',
                        overflowY: 'scroll',
                        scrollbarWidth: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarColor: '#cbd5e1 #f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div className="min-w-max w-fit" style={{ minHeight: 'calc(100vh - 350px)', minWidth: '600px', height: 'calc(100vh - 350px)' }}>
                        <SplitViewPane
                          lines={originalBaseCodeRef.current?.split('\n') || []}
                          diffLines={finalDisplayLines}
                          side="original"
                          showLineNumbers={lineNumbers}
                          onLineRevert={handleLineRevert}
                          originalLines={originalBaseCodeRef.current?.split('\n') || []}
                          modifiedLines={currentModifiedCode?.split('\n') || []}
                          onExpandCollapsed={handleExpandCollapsed}
                        />
                      </div>
                    </div>
                  ) :
                      <pre className="p-4 text-sm font-mono whitespace-pre">
                          No modifications
                      </pre>
                  }
                </div>
                <div className="flex flex-col min-h-0">
                  <div className="border-b p-2 bg-green-50 flex justify-between items-center flex-shrink-0">
                    <h4 className="font-medium text-green-900">Modified ({currentModifiedCode.split('\n').length} lines)</h4>
                  </div>
                   {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? (
                      <div 
                        className="flex-1 min-h-0"
                        ref={modifiedScrollRef}
                        style={{ 
                          overflowX: 'scroll',
                          overflowY: 'scroll',
                          scrollbarWidth: 'auto',
                          WebkitOverflowScrolling: 'touch',
                          scrollbarColor: '#cbd5e1 #f8fafc',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div className="min-w-max w-fit" style={{ minHeight: 'calc(100vh - 350px)', minWidth: '600px', height: 'calc(100vh - 350px)' }}>
                          <SplitViewPane
                            lines={currentModifiedCode?.split('\n') || []}
                            diffLines={finalDisplayLines}
                            side="modified"
                            showLineNumbers={lineNumbers}
                            onLineRevert={handleLineRevert}
                            originalLines={originalBaseCodeRef.current?.split('\n') || []}
                            modifiedLines={currentModifiedCode?.split('\n') || []}
                            onExpandCollapsed={handleExpandCollapsed}
                          />
                        </div>
                      </div>
                   ) :
                       <pre className="p-4 text-sm font-mono whitespace-pre">
                          No modifications
                      </pre>
                  }
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              <div className="border-b p-2 bg-muted/50 flex items-center justify-between">
                <h4 className="font-medium">Git-style Unified Diff</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {diffResult.metadata?.algorithm || 'unified'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyDiff}
                    className={`transition-all duration-200 ${
                      copyStatus.copied 
                        ? 'bg-green-50 text-green-700' 
                        : copyStatus.error 
                          ? 'bg-red-50 text-red-700'
                          : ''
                    }`}
                    disabled={!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === ''}
                    title={copyStatus.error || (copyStatus.copied ? 'Copied!' : 'Copy to clipboard')}
                  >
                    {copyStatus.copied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <div 
                  className="w-full"
                  style={{ 
                    overflowX: 'scroll',
                    overflowY: 'scroll',
                    scrollbarWidth: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarColor: '#cbd5e1 #f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="min-w-max w-fit" style={{ minHeight: 'calc(100vh - 300px)', minWidth: '800px', height: 'calc(100vh - 300px)' }}>
                    <div className="p-2">
                      <FormattedRawDiff unifiedDiff={diffResult.unifiedDiff} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="patches" className="flex-1 m-0 p-4">
            <div className="space-y-4">
              {/* Show AST Diff Data if available */}
              {astDiffData && astDiffData.patch && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-blue-600" />
                        AST Diff Patch
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {astDiffData.patch.changeSummary || 'Auto-saved changes with AST analysis'}
                      </p>
                      {astDiffData.patch.changeDescription && (
                        <p className="text-xs text-blue-600 mt-1">
                          {astDiffData.patch.changeDescription}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      AST
                    </Badge>
                  </div>
                  
                  {astDiffData.patch.astDiff ? (
                    <div className="mt-3 text-sm">
                      <div className="text-blue-700 font-medium mb-2">AST Changes:</div>
                      <pre className="text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(astDiffData.patch.astDiff, null, 2)}
                      </pre>
                    </div>
                  ) : astDiffData.patch.unified_diff ? (
                    <div className="mt-3 text-sm">
                      <div className="text-blue-700 font-medium mb-2">Unified Diff (AST not available):</div>
                      <pre className="text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-x-auto max-h-32 whitespace-pre">
                        {astDiffData.patch.unified_diff}
                      </pre>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-500">
                      No diff data available for this patch
                    </div>
                  )}
                </Card>
              )}
              
              {patches.length === 0 && !astDiffData ? (
                <Card className="p-8 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No patches available</p>
                  <p className="text-sm mt-1">
                    {useAstDiff && filePath ? 
                      'AST patches will appear here when code changes are detected' :
                      'Patches will appear here when generated by the AI'
                    }
                  </p>
                </Card>
              ) : (
                patches.map((patch, index) => (
                  <PatchSummary key={index} patch={patch} index={index} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DiffPreviewSystem;