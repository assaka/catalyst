import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {Code, Diff, Download, Eye, Upload, RefreshCw, CheckCircle, Maximize2, Minimize2} from 'lucide-react';
import { cn } from '@/lib/utils';
import FileTreeNavigator from '@/components/editor/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';
import AIContextWindow from '@/components/editor/ai-context/AIContextWindow';
import DiffPreviewSystem from '@/components/editor/ai-context/DiffPreviewSystem';
import VersionHistory from '@/components/editor/ai-context/VersionHistory';
import GenericSlotEditor from '@/components/editor/slot/GenericSlotEditor.jsx';
import apiClient from '@/api/client';
import { SlotConfiguration } from '@/api/entities';
// Store context no longer needed - backend resolves store automatically
// import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * Get language type from filename
 */
const getLanguageFromFileName = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'javascript';
  }
};

/**
 * Apply JSON Patch operations to source code
 * This is a simple implementation for basic patch operations
 * @param {string} sourceCode - Original source code
 * @param {Array} patch - JSON Patch operations (RFC 6902)
 * @returns {string} Modified source code
 */
const applyPatchToCode = (sourceCode, patch) => {
  if (!patch || !Array.isArray(patch)) return sourceCode;
  
  let lines = sourceCode.split('\n');
  
  // Apply each patch operation
  patch.forEach(operation => {
    try {
      switch (operation.op) {
        case 'add':
          // Simple line-based addition
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber <= lines.length) {
              lines.splice(lineNumber, 0, operation.value);
            }
          }
          break;
          
        case 'replace':
          // Simple line-based replacement
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber < lines.length) {
              lines[lineNumber] = operation.value;
            }
          }
          break;
          
        case 'remove':
          // Simple line-based removal
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber < lines.length) {
              lines.splice(lineNumber, 1);
            }
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to apply patch operation:', operation, error);
    }
  });
  
  return lines.join('\n');
};

// Removed obsolete applySemanticDiffsToCode function - no longer used

// Removed obsolete semantic diff helper functions - no longer used

/**
 * Create a simple hash for code comparison
 */
const createSimpleHash = (content) => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

/**
 * AI Context Window Page
 * Main interface for natural language code editing with AST-aware intelligence
 * Integrates file navigation, code editing, AI processing, and live preview
 */
const AIContextWindowPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Store context no longer needed - backend resolves store automatically
  console.log('🏪 [AIContextWindow] Store ID now resolved server-side automatically');
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [originalCode, setOriginalCode] = useState(''); // Store original baseline for diff detection
  const [baselineCode, setBaselineCode] = useState(''); // Store actual file baseline for semantic diffs
  const [modifiedFiles, setModifiedFiles] = useState([]);
  const [currentPatch, setCurrentPatch] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [selection, setSelection] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [astDiffStatus, setAstDiffStatus] = useState(null); // Track AST diff creation status
  const [manualEditResult, setManualEditResult] = useState(null); // Track manual edit detection
  const [previewMode, setPreviewMode] = useState('code'); // Track preview mode: 'code', 'patch', 'live'
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [rollbackSuccess, setRollbackSuccess] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef(null);

  // Check authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount and when needed
  useEffect(() => {
    const checkAuth = () => {
      const authToken = apiClient.getToken();
      setIsAuthenticated(!!authToken);
    };
    
    checkAuth();
    
    // Check auth status when localStorage changes (e.g., user logs in/out)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load file from URL parameter on mount
  useEffect(() => {
    const filePath = searchParams.get('file');
    if (filePath) {
      loadFileContent(filePath);
    }
  }, [searchParams]);
  
  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Publish functionality removed - will be reimplemented with customizations API
  const publishDiffs = useCallback(async () => {
    console.log('Publish functionality temporarily disabled - will be reimplemented');
  }, []);

  // Handle successful rollback from version history
  const handleRollback = useCallback((rollbackData) => {
    setRollbackSuccess(rollbackData);
    setPublishSuccess(null);
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      setRollbackSuccess(null);
    }, 5000);
  }, []);

  // Helper function to fetch baseline code from database
  // Helper function to normalize line endings for comparison
  const normalizeLineEndings = useCallback((content) => {
    if (typeof content !== 'string') return content;
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }, []);

  const fetchBaselineCode = useCallback(async (filePath, fallbackContent) => {
    try {
      const baselineData = await apiClient.get(`extensions/baseline/${encodeURIComponent(filePath)}`);
      if (baselineData && baselineData.success && baselineData.data.hasBaseline) {
        console.log(`📋 Using database baseline for ${filePath} (${baselineData.data.baselineCode.length} chars)`);
        return normalizeLineEndings(baselineData.data.baselineCode);
      } else {
        console.log(`📋 No database baseline found for ${filePath}, using current content as baseline`);
        return normalizeLineEndings(fallbackContent);
      }
    } catch (baselineError) {
      console.error('Failed to fetch baseline, using current content:', baselineError);
      return normalizeLineEndings(fallbackContent);
    }
  }, [normalizeLineEndings]);

  // Load file content
  const loadFileContent = useCallback(async (filePath) => {
    setIsFileLoading(true);
    try {
      // Load baseline code directly
      const data = await apiClient.get(`extensions/baseline/${encodeURIComponent(filePath)}`);

      if (data && data.success && data.data.hasBaseline) {
        const baselineCode = normalizeLineEndings(data.data.baselineCode);
        
        console.log(`📄 BASELINE CODE LOADED: ${baselineCode.length} characters for ${filePath}`);
        console.log(`📄 BASELINE CODE PREVIEW:`, baselineCode.substring(0, 200) + '...');
        
        // Skip customizations loading - feature is obsolete  
        console.log(`📄 Loading baseline code directly for: ${filePath}`);
        
        // Set the final code (baseline only)
        console.log(`📝 SETTING EDITOR CODE: ${baselineCode.length} characters`);
        console.log(`📝 SETTING ORIGINAL CODE: ${baselineCode.length} characters (for comparison)`);
        setSourceCode(baselineCode);
        
        // Keep original baseline code for comparison
        setOriginalCode(baselineCode);
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop(),
          type: 'file',
          isSupported: true
        });
        
        // Update URL
        setSearchParams({ file: filePath });
      } else if (data && data.success && !data.data.hasBaseline) {
        console.log('No baseline found for file:', filePath);
      } else {
        console.error('Failed to load file:', data?.message || 'Unknown error');
        // Provide detailed diagnostic information
        const diagnosticInfo = `// API Error: ${data.message}
// File Path: ${filePath}
// Status: API responded but file loading failed
// 
// Troubleshooting:
// 1. Check if the file exists at: ${filePath}
// 2. Verify file permissions
// 3. Ensure path is within allowed directories
//
// You can still test the AI Context Window with this placeholder
//
import React, { useState, useEffect } from 'react';

const DiagnosticComponent = () => {
  const [error] = useState('${data.message}');
  
  return (
    <div>
      <h2>File Loading Error</h2>
      <p>Error: {error}</p>
      <p>Attempted to load: ${filePath}</p>
    </div>
  );
};

export default DiagnosticComponent;`;
        
        setSourceCode(normalizeLineEndings(diagnosticInfo));
        const baselineCode = await fetchBaselineCode(filePath, diagnosticInfo);
        setOriginalCode(baselineCode); // Set baseline for diff detection
        setBaselineCode(baselineCode); // Store actual baseline for semantic diffs
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop() || 'unknown.js',
          type: 'file',
          isSupported: true
        });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      
      // Enhanced error handling for API client errors
      let errorInfo = '';
      let errorType = 'Network Error';
      let troubleshooting = [];
      
      if (error.message.includes('Network error: Unable to connect to server')) {
        errorType = 'Backend Server Offline';
        troubleshooting = [
          'The backend server is not responding',
          'Verify backend is deployed and running on Render',
          'Check Render dashboard for deployment status',
          'Review Render logs for server errors'
        ];
      } else if (error.status === 401) {
        errorType = 'Authentication Error';
        troubleshooting = [
          'Please log in as a store owner',
          'Verify authentication token is valid',
          'Try refreshing the page and logging in again'
        ];
      } else if (error.status === 403) {
        errorType = 'Access Denied';
        troubleshooting = [
          'File path may be outside allowed directories',
          'Check if file path starts with "src/"',
          'Verify you have store owner permissions'
        ];
      } else if (error.status === 404) {
        errorType = 'File Not Found';
        troubleshooting = [
          'Check if the file exists at the specified path',
          'Verify the file path is correct',
          'Try selecting a different file from the tree'
        ];
      } else {
        troubleshooting = [
          'Check network connection to backend server',
          'Verify backend is deployed and accessible',
          'Contact system administrator if issue persists'
        ];
      }
      
      errorInfo = `// ${errorType}: ${error.message}
// File Path: ${filePath}
// Backend: ${import.meta.env.VITE_API_BASE_URL || 'Not configured'}
// 
// Troubleshooting Steps:
${troubleshooting.map((step, i) => `// ${i + 1}. ${step}`).join('\n')}
//
// You can still test the AI Context Window with this placeholder
//`;
      
      // Fallback for demo purposes
      const fallbackContent = errorInfo + `
import React, { useState, useEffect } from 'react';

const ExampleComponent = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default ExampleComponent;`;
      
      setSourceCode(normalizeLineEndings(fallbackContent));
      const baselineCode = await fetchBaselineCode(filePath, fallbackContent);
      setOriginalCode(baselineCode); // Set baseline for diff detection
      
      setSelectedFile({
        path: filePath,
        name: filePath.split('/').pop() || 'demo.jsx',
        type: 'file',
        isSupported: true
      });
    } finally {
      setIsFileLoading(false);
    }
  }, [setSearchParams, normalizeLineEndings]);

  // Handle file selection from tree navigator
  const handleFileSelect = useCallback((file) => {
    if (file.path !== selectedFile?.path) {
      // Reset manual edit result when switching files
      setManualEditResult(null);
      loadFileContent(file.path);
    }
  }, [selectedFile, loadFileContent]);


  // Handle code changes in editor
  const handleCodeChange = useCallback((newCode) => {
    setSourceCode(newCode);
    
    // Track modified files - compare against original baseline, not just previous sourceCode
    if (selectedFile) {
      setModifiedFiles(prev => {
        const normalizedNewCode = normalizeLineEndings(newCode);
        const normalizedOriginalCode = normalizeLineEndings(originalCode);
        const hasChanges = normalizedNewCode !== normalizedOriginalCode;
        const isCurrentlyModified = prev.includes(selectedFile.path);
        
        if (hasChanges && !isCurrentlyModified) {
          // File has changes from original and is not yet in the modified list - add it
          return [...prev, selectedFile.path];
        } else if (!hasChanges && isCurrentlyModified) {
          // File has no changes from original but is in the modified list - remove it
          return prev.filter(path => path !== selectedFile.path);
        }
        
        // No change needed
        return prev;
      });
    }
    
    // Update manual edit result when code changes (e.g., from line revert)
    if (manualEditResult) {
      const normalizedNewCode = normalizeLineEndings(newCode);
      const normalizedOriginalCode = normalizeLineEndings(manualEditResult.originalCode || originalCode);
      const updatedManualEdit = {
        ...manualEditResult,
        newCode: newCode,
        hasChanges: normalizedNewCode !== normalizedOriginalCode
      };
      setManualEditResult(updatedManualEdit);
    }
  }, [selectedFile, sourceCode, manualEditResult, originalCode, normalizeLineEndings]);

  // Handle patch generation from AI Context Window
  const handlePatchGenerated = useCallback((patch) => {
    setCurrentPatch(patch);
  }, []);

  // Handle preview generation - simplified without patch storage
  const handlePreviewGenerated = useCallback(async (preview) => {
    console.log('Preview generated:', preview);
    // Preview functionality simplified - no more patch storage
  }, []);

  // Handle manual edit detection with auto-save
  const handleManualEdit = useCallback(async (newCode, originalCode, options = {}) => {
    const normalizedNewCode = normalizeLineEndings(newCode);
    const normalizedBaselineCode = normalizeLineEndings(baselineCode);
    const manualEdit = {
      newCode,
      originalCode, // Keep editor's original for compatibility
      hasChanges: normalizedNewCode !== normalizedBaselineCode, // Compare against baseline
      options
    };
    
    setManualEditResult(manualEdit);
    
    if (manualEdit.hasChanges) {
      console.log(`🔍 Manual changes detected in ${selectedFile?.name || 'file'}`);
      console.log('📋 Changes detected (baseline comparison):', { 
        baselineLength: baselineCode.length, 
        newLength: newCode.length,
        editorOriginalLength: originalCode.length // Editor's previous state
      });
      
      // Auto-save patch to database with debouncing
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('store_owner_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
          if (!token) {
            console.warn('⚠️ No auth token found - skipping auto-save');
            return;
          }

          const filePath = selectedFile?.path || selectedFile?.name;
          if (!filePath) {
            console.warn('⚠️ No file path available - skipping auto-save');
            return;
          }

          // Double-check if there are still changes before auto-saving
          // Compare against baseline, not editor's previous state
          const currentNormalizedNew = normalizeLineEndings(newCode);
          const currentNormalizedBaseline = normalizeLineEndings(baselineCode);
          
          if (currentNormalizedNew === currentNormalizedBaseline) {
            console.log('🔄 No changes detected against baseline - skipping save');
            return;
          }

          console.log('💾 Auto-save disabled - customizations API is obsolete');
          // Auto-save functionality removed with customizations API
        } catch (error) {
          console.error('❌ Error during auto-save:', error);
        }
      }, 2000); // 2 second debounce
    } else {
      console.log('✅ Changes undone - code returned to original state');
      // Clear any pending auto-save when changes are undone
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [selectedFile?.name, selectedFile?.path, baselineCode, normalizeLineEndings]);

  // Handle diff stats changes from DiffPreviewSystem
  const handleDiffStatsChange = useCallback((diffStats) => {
    if (!selectedFile) return;
    
    // Check if there are any actual changes Rin the diff stats
    // Note: DiffService returns 'additions', 'deletions', 'modifications' (not addedLines, etc.)
    console.log('🔍 DiffStats for', selectedFile.name, ':', {
      additions: diffStats?.additions,
      deletions: diffStats?.deletions,
      modifications: diffStats?.modifications,
      unchanged: diffStats?.unchanged
    });
    
    const hasChanges = diffStats && (
      diffStats.additions > 0 ||
      diffStats.deletions > 0 ||
      diffStats.modifications > 0
    );
    
    console.log('🎯 HasChanges:', hasChanges, 'for', selectedFile.name);
    
    setModifiedFiles(prev => {
      const isCurrentlyModified = prev.includes(selectedFile.path);
      
      if (hasChanges && !isCurrentlyModified) {
        // File has changes and is not yet in the modified list - add it
        return [...prev, selectedFile.path];
      } else if (!hasChanges && isCurrentlyModified) {
        // File has no changes but is in the modified list - remove it
        console.log(`✅ Removing ${selectedFile.name} from modified files - all changes reverted`);
        return prev.filter(path => path !== selectedFile.path);
      }
      
      // No change needed
      return prev;
    });
  }, [selectedFile]);

  // Handle download in Preview mode
  const handleDownload = useCallback(() => {
    if (!selectedFile || previewMode !== 'live') return;
    
    try {
      // Create a blob with the current source code
      const blob = new Blob([sourceCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile.name;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log(`📥 Downloaded ${selectedFile.name}`);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }, [selectedFile, sourceCode, previewMode]);

  // Handle preview mode changes - simplified
  const handlePreviewModeChange = useCallback(async (mode) => {
    setPreviewMode(mode);
  }, []);


  // Handle file tree refresh
  const handleFileTreeRefresh = useCallback(() => {
    // Refresh logic would go here
    console.log('File tree refreshed');
  }, []);

  // Test API connection
  const testConnection = useCallback(async () => {
    setConnectionStatus({ status: 'testing', message: 'Testing connection...' });
    
    try {
      // Test authentication and basic API access
      const authToken = localStorage.getItem('store_owner_auth_token');
      
      if (!authToken) {
        setConnectionStatus({
          status: 'error',
          message: 'No authentication token found. Please log in as a store owner.',
          details: 'The AI Context Window requires store owner authentication to access source files.'
        });
        return;
      }

      // Test the baselines endpoint first using API client
      const listData = await apiClient.get('extensions/baselines');
      
      if (!listData.success) {
        setConnectionStatus({
          status: 'error',
          message: 'API responded but failed to list files',
          details: listData.message || 'Unknown API error'
        });
        return;
      }

      // Test loading a specific file
      const testFilePath = 'src/pages/AIContextWindow.jsx';
      try {
        const contentData = await apiClient.get(`extensions/baseline/${encodeURIComponent(testFilePath)}`);
        if (contentData.success && contentData.data.hasBaseline) {
          setConnectionStatus({
            status: 'success',
            message: 'Connection successful!',
            details: `Successfully connected to backend at ${import.meta.env.VITE_API_BASE_URL}. Found ${listData.files?.length || 0} files in baselines.`
          });
        } else {
          setConnectionStatus({
            status: 'warning',
            message: 'API connected but file access limited',
            details: `Can list files but cannot read content: ${contentData.message}`
          });
        }
      } catch (contentError) {
        setConnectionStatus({
          status: 'warning',
          message: 'Partial connection success',
          details: `Can list files but file content access failed: ${contentError.message}`
        });
      }
    } catch (error) {
      // Enhanced error detection for API client errors
      let errorMessage = 'Connection test failed';
      let errorDetails = '';
      
      if (error.message.includes('Network error: Unable to connect to server')) {
        errorMessage = 'Backend server offline';
        errorDetails = `Cannot connect to backend at ${import.meta.env.VITE_API_BASE_URL}. Check Render deployment status.`;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed';
        errorDetails = 'Please refresh and log in again as a store owner.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied';
        errorDetails = 'Verify you have store owner permissions.';
      } else {
        errorDetails = `Error: ${error.message}. Backend: ${import.meta.env.VITE_API_BASE_URL}`;
      }
      
      setConnectionStatus({
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }
  }, []);

  return (
    <div className={`min-h-[calc(100vh-100px)] flex flex-col bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            AI Context Window
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Natural language code editing with AST-aware intelligence
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-4">

          {/* Publish Success */}
          {publishSuccess && (
            <div className="p-2 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <div className="font-medium flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Changes Published Successfully
              </div>
              <div className="text-xs mt-1">
                Version {publishSuccess.versionName} at {new Date(publishSuccess.publishedAt).toLocaleTimeString()}
                {publishSuccess.filesCount && publishSuccess.filesCount > 1 && (
                  <span className="ml-1">• {publishSuccess.filesCount} files</span>
                )}
              </div>
            </div>
          )}

          {/* Rollback Success */}
          {rollbackSuccess && (
            <div className="p-2 rounded-md text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <div className="font-medium flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Rollback Completed
              </div>
              <div className="text-xs mt-1">
                Rolled back to {rollbackSuccess.versionName} at {new Date(rollbackSuccess.rolledBackAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Manual Edit Status */}
          {manualEditResult && manualEditResult.hasChanges && (
            <div className="p-2 rounded-md text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <div className="font-medium flex items-center">
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></span>
                Manual Edit Detected
              </div>
            </div>
          )}

          {/* AST Diff Status */}
          {astDiffStatus && (
            <div className={`p-2 rounded-md text-xs ${
              astDiffStatus.status === 'success' ? 'bg-green-100 text-green-800' :
              astDiffStatus.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <div className="font-medium">
                {astDiffStatus.status === 'saving' && (
                  <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></span>
                )}
                {astDiffStatus.message}
              </div>
              {astDiffStatus.data && (
                <div className="mt-1 text-xs">
                  ID: {astDiffStatus.data.id?.substring(0, 8)}...
                </div>
              )}
            </div>
          )}

          {connectionStatus && (
            <div className={`p-2 rounded-md text-xs ${
              connectionStatus.status === 'success' ? 'bg-green-100 text-green-800' :
              connectionStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              connectionStatus.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <div className="font-medium">{connectionStatus.message}</div>
              {connectionStatus.details && (
                <div className="mt-1">{connectionStatus.details}</div>
              )}
            </div>
          )}
          
          <button
            onClick={testConnection}
            disabled={connectionStatus?.status === 'testing'}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionStatus?.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={publishDiffs}
            disabled={!isAuthenticated || isPublishing || (modifiedFiles.length === 0 && !publishSuccess)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
              "bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed",
              "text-white disabled:text-gray-500"
            )}
            title={`Publish all changes (${modifiedFiles.length} modified file${modifiedFiles.length !== 1 ? 's' : ''}) to version history`}
          >
            {isPublishing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Upload className="w-3 h-3" />
                Publish
              </>
            )}
          </button>
          
          {/* Version History in Header */}
          {selectedFile?.path && (
            <VersionHistory 
              filePath={selectedFile.path}
              onRollback={handleRollback}
              className="inline-block"
            />
          )}
        </div>
        
        {selectedFile && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedFile.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Line {cursorPosition.line + 1}, Column {cursorPosition.column + 1}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {isFullscreen ? (
          // Fullscreen mode - single panel without ResizablePanelGroup
          <div className="h-full w-full">
            <div className="h-[calc(100vh-200px)] flex flex-col">
              {selectedFile ? (
                <>
                  {/* Tab Interface Above File Name */}
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                        <button
                          onClick={() => {
                            setPreviewMode('code');
                            handlePreviewModeChange('code');
                          }}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                            previewMode === 'code' 
                              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Code
                        </button>
                        <button
                          onClick={() => {
                            setPreviewMode('patch');
                            handlePreviewModeChange('patch');
                          }}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                            previewMode === 'patch' 
                              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <Diff className="w-4 h-4 mr-2" />
                          Diff
                        </button>
                        <button
                          onClick={() => {
                            setPreviewMode('hybrid');
                            handlePreviewModeChange('hybrid');
                          }}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                            previewMode === 'hybrid' 
                              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Customize
                        </button>
                      </div>
                      <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Single Content Area - Tab-based Content */}
                  <div className="flex-1 overflow-hidden">
                    {previewMode === 'code' ? (
                      // Advanced Code Editor with Database Persistence
                      <CodeEditor
                        value={sourceCode}
                        onChange={handleCodeChange}
                        fileName={selectedFile.name}
                        onCursorPositionChange={setCursorPosition}
                        onSelectionChange={setSelection}
                        onManualEdit={handleManualEdit}
                        originalCode={originalCode}
                        initialContent={originalCode}
                        enableDiffDetection={true}
                        enableTabs={true}
                        className="h-full"
                      />
                    ) : previewMode === 'patch' ? (
                      // Diff View - Enhanced with AST diff functionality
                      <DiffPreviewSystem
                        originalCode={manualEditResult?.originalCode || originalCode}
                        modifiedCode={manualEditResult?.newCode || sourceCode}
                        fileName={selectedFile?.path || ''}
                        filePath={selectedFile?.path}
                        useAstDiff={true}
                        className="h-full"
                        onCodeChange={handleCodeChange}
                        onDiffStatsChange={handleDiffStatsChange}
                      />
                    ) : (
                      // Smart Editor Selection - GenericSlotEditor for slots files, CodeEditor for others
                      <div className="h-full overflow-y-auto">
                        {selectedFile.name.includes('Slots.jsx') || selectedFile.path.includes('Slots.jsx') ? (
                          // This is a slots file - use GenericSlotEditor
                          <GenericSlotEditor
                            pageName={selectedFile.name.replace('Slots.jsx', '').replace('.jsx', '')}
                            onSave={async (data) => {
                              const pageName = selectedFile.name.replace('Slots.jsx', '').replace('.jsx', '');
                              console.log(`💾 Saving ${pageName} slots configuration...`);
                              
                              // Save to localStorage for now (until backend API is ready)
                              try {
                                const storageKey = `slot_config_${pageName}`;
                                const configData = {
                                  page_name: pageName,
                                  configuration: data.slotDefinitions,
                                  slot_order: data.pageConfig?.slotOrder || [],
                                  slot_positions: data.slotPositions || {},
                                  code: data.slotsFileCode,
                                  updated_at: new Date().toISOString()
                                };
                                
                                localStorage.setItem(storageKey, JSON.stringify(configData));
                                console.log('✅ Configuration saved to localStorage');
                                
                                // TODO: When backend is ready, uncomment this:
                                // const existing = await SlotConfiguration.findAll({
                                //   where: { page_name: pageName },
                                //   limit: 1
                                // });
                                // if (existing.data && existing.data.length > 0) {
                                //   await SlotConfiguration.update(existing.data[0].id, configData);
                                // } else {
                                //   await SlotConfiguration.create(configData);
                                // }
                              } catch (error) {
                                console.error('❌ Failed to save configuration:', error);
                              }
                            }}
                            onCancel={() => {
                              setPreviewMode('code');
                            }}
                            className="min-h-full"
                          />
                        ) : (
                          // Regular file - use CodeEditor
                          <CodeEditor
                            value={sourceCode}
                            onChange={handleCodeChange}
                            fileName={selectedFile.name}
                            language={getLanguageFromFileName(selectedFile.name)}
                            onCursorPositionChange={setCursorPosition}
                            onSelectionChange={setSelection}
                            onManualEdit={handleManualEdit}
                            originalCode={originalCode}
                            initialContent={originalCode}
                            enableDiffDetection={true}
                            enableTabs={true}
                            className="h-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                    <p className="text-lg mb-2">Select a file to begin editing</p>
                    <p className="text-sm mb-4">
                      Choose a file from the navigator or{' '}
                      <button
                        onClick={() => loadFileContent('/demo/example.jsx')}
                        className="text-blue-500 hover:text-blue-600 underline"
                      >
                        load a demo file
                      </button>
                    </p>
                    
                    {!connectionStatus && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 mb-2">
                          <strong>Having trouble loading files?</strong>
                        </p>
                        <p className="text-xs text-blue-600 mb-3">
                          Click "Test Connection" in the header to diagnose API access issues.
                        </p>
                        <button
                          onClick={testConnection}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Test API Connection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Normal mode with ResizablePanelGroup
          <ResizablePanelGroup 
            direction="horizontal" 
            className="h-[calc(100vh-200px)]"
            autoSaveId="ai-context-window-v2"
          >
            {/* AI Context Window - First Column */}
            <ResizablePanel
              defaultSize={25}
              minSize={15}
              maxSize={30}
            >
              <AIContextWindow
                sourceCode={sourceCode}
                filePath={selectedFile?.path || ''}
                onPatchGenerated={handlePatchGenerated}
                onPreviewGenerated={handlePreviewGenerated}
                className="h-full"
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* File Tree Navigator */}
            <ResizablePanel 
              defaultSize={15}
              minSize={10}
              maxSize={15}
            >
              <FileTreeNavigator
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                modifiedFiles={modifiedFiles}
                onRefresh={handleFileTreeRefresh}
                className="h-[calc(100vh-200px)]"
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* Code Editor and Preview Panel */}
            <ResizablePanel 
              defaultSize={60}
              minSize={40}
              maxSize={85}
            >
              <div className="h-[calc(100vh-200px)] flex flex-col">
                {selectedFile ? (
                  <>
                    {/* Tab Interface Above File Name */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                          <button
                            onClick={() => {
                              setPreviewMode('code');
                              handlePreviewModeChange('code');
                            }}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                              previewMode === 'code' 
                                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Code
                          </button>
                          <button
                            onClick={() => {
                              setPreviewMode('patch');
                              handlePreviewModeChange('patch');
                            }}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                              previewMode === 'patch' 
                                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <Diff className="w-4 h-4 mr-2" />
                            Diff
                          </button>
                          <button
                            onClick={() => {
                              setPreviewMode('hybrid');
                              handlePreviewModeChange('hybrid');
                            }}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                              previewMode === 'hybrid' 
                                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Customize
                          </button>
                        </div>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Single Content Area - Tab-based Content */}
                    <div className="flex-1 overflow-hidden">
                      {previewMode === 'code' ? (
                        // Advanced Code Editor with Database Persistence
                        <CodeEditor
                          value={sourceCode}
                          onChange={handleCodeChange}
                          fileName={selectedFile.name}
                          onCursorPositionChange={setCursorPosition}
                          onSelectionChange={setSelection}
                          onManualEdit={handleManualEdit}
                          originalCode={originalCode}
                          initialContent={originalCode}
                          enableDiffDetection={true}
                          enableTabs={true}
                          className="h-full"
                        />
                      ) : previewMode === 'patch' ? (
                        // Diff View - Enhanced with AST diff functionality
                        <DiffPreviewSystem
                          originalCode={manualEditResult?.originalCode || originalCode}
                          modifiedCode={manualEditResult?.newCode || sourceCode}
                          fileName={selectedFile?.path || ''}
                          filePath={selectedFile?.path}
                          useAstDiff={true}
                          className="h-full"
                          onCodeChange={handleCodeChange}
                          onDiffStatsChange={handleDiffStatsChange}
                        />
                      ) : (
                        // Smart Editor Selection - GenericSlotEditor for slots files, CodeEditor for others
                        <div className="h-full overflow-y-auto">
                          {selectedFile.name.includes('Slots.jsx') || selectedFile.path.includes('Slots.jsx') ? (
                            // This is a slots file - use GenericSlotEditor
                            <GenericSlotEditor
                              pageName={selectedFile.name.replace('Slots.jsx', '').replace('.jsx', '')}
                              onSave={async (data) => {
                                const pageName = selectedFile.name.replace('Slots.jsx', '').replace('.jsx', '');
                                console.log(`💾 Saving ${pageName} slots configuration...`);
                                
                                // Save to localStorage for now (until backend API is ready)
                                try {
                                  const storageKey = `slot_config_${pageName}`;
                                  const configData = {
                                    page_name: pageName,
                                    configuration: data.slotDefinitions,
                                    slot_order: data.pageConfig?.slotOrder || [],
                                    slot_positions: data.slotPositions || {},
                                    code: data.slotsFileCode,
                                    updated_at: new Date().toISOString()
                                  };
                                  
                                  localStorage.setItem(storageKey, JSON.stringify(configData));
                                  console.log('✅ Configuration saved to localStorage');
                                } catch (error) {
                                  console.error('❌ Failed to save configuration:', error);
                                }
                              }}
                              onCancel={() => {
                                setPreviewMode('code');
                              }}
                              className="min-h-full"
                            />
                          ) : (
                            // Regular file - use CodeEditor
                            <CodeEditor
                              value={sourceCode}
                              onChange={handleCodeChange}
                              fileName={selectedFile.name}
                              language={getLanguageFromFileName(selectedFile.name)}
                              onCursorPositionChange={setCursorPosition}
                              onSelectionChange={setSelection}
                              onManualEdit={handleManualEdit}
                              originalCode={originalCode}
                              initialContent={originalCode}
                              enableDiffDetection={true}
                              enableTabs={true}
                              className="h-full"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                      <p className="text-lg mb-2">Select a file to begin editing</p>
                      <p className="text-sm mb-4">
                        Choose a file from the navigator or{' '}
                        <button
                          onClick={() => loadFileContent('/demo/example.jsx')}
                          className="text-blue-500 hover:text-blue-600 underline"
                        >
                          load a demo file
                        </button>
                      </p>
                      
                      {!connectionStatus && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 mb-2">
                            <strong>Having trouble loading files?</strong>
                          </p>
                          <p className="text-xs text-blue-600 mb-3">
                            Click "Test Connection" in the header to diagnose API access issues.
                          </p>
                          <button
                            onClick={testConnection}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Test API Connection
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t bg-white dark:bg-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>AI Context Window v1.0</span>
          {selectedFile && (
            <span>
              {sourceCode.split('\n').length} lines
              • {sourceCode.length} characters
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {modifiedFiles.length > 0 && (
            <span>{modifiedFiles.length} modified file{modifiedFiles.length !== 1 ? 's' : ''}</span>
          )}
          {currentPatch && (
            <span className="text-orange-600 dark:text-orange-400">Patch Ready</span>
          )}
          {manualEditResult && manualEditResult.hasChanges && (
            <span className="text-orange-600 dark:text-orange-400">Manual Edit Active</span>
          )}
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};

export default AIContextWindowPage;