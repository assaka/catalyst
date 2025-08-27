import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {Code, Diff, Download, Eye} from 'lucide-react';
import { cn } from '@/lib/utils';
import FileTreeNavigator from '@/components/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/ai-context/CodeEditor';
import AIContextWindow from '@/components/ai-context/AIContextWindow';
import StorefrontPreview from '@/components/ai-context/StorefrontPreview';
import DiffPreviewSystem from '@/components/ai-context/DiffPreviewSystem';
import BrowserPreview from '@/components/ai-context/BrowserPreview';
import apiClient from '@/api/client';

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

/**
 * AI Context Window Page
 * Main interface for natural language code editing with AST-aware intelligence
 * Integrates file navigation, code editing, AI processing, and live preview
 */
const AIContextWindowPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [originalCode, setOriginalCode] = useState(''); // Store original baseline for diff detection
  const [modifiedFiles, setModifiedFiles] = useState([]);
  const [currentPatch, setCurrentPatch] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [selection, setSelection] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [astDiffStatus, setAstDiffStatus] = useState(null); // Track AST diff creation status
  const [manualEditResult, setManualEditResult] = useState(null); // Track manual edit detection
  const [previewMode, setPreviewMode] = useState('code'); // Track preview mode: 'code', 'patch', 'live'
  
  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef(null);

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

  // Helper function to fetch baseline code from database
  const fetchBaselineCode = useCallback(async (filePath, fallbackContent) => {
    try {
      const baselineData = await apiClient.get(`hybrid-patches/baseline/${encodeURIComponent(filePath)}`);
      if (baselineData && baselineData.success && baselineData.data.hasBaseline) {
        console.log(`📋 Using database baseline for ${filePath} (${baselineData.data.baselineCode.length} chars)`);
        return baselineData.data.baselineCode;
      } else {
        console.log(`📋 No database baseline found for ${filePath}, using current content as baseline`);
        return fallbackContent;
      }
    } catch (baselineError) {
      console.error('Failed to fetch baseline, using current content:', baselineError);
      return fallbackContent;
    }
  }, []);

  // Load file content
  const loadFileContent = useCallback(async (filePath) => {
    setIsFileLoading(true);
    try {
      // Use the proxy endpoint which fetches from GitHub when local filesystem unavailable
      const data = await apiClient.get(`proxy-source-files/content?path=${encodeURIComponent(filePath)}`);

      if (data && data.success) {
        setSourceCode(data.content);
        
        // Fetch the database baseline for proper diff detection
        const baselineCode = await fetchBaselineCode(filePath, data.content);
        setOriginalCode(baselineCode);
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop(),
          type: 'file',
          isSupported: true
        });
        
        // Update URL
        setSearchParams({ file: filePath });
      } else {
        console.error('Failed to load file:', data.message);
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
        
        setSourceCode(diagnosticInfo);
        const baselineCode = await fetchBaselineCode(filePath, diagnosticInfo);
        setOriginalCode(baselineCode); // Set baseline for diff detection
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
      
      setSourceCode(fallbackContent);
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
  }, [setSearchParams]);

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
        const hasChanges = newCode !== originalCode;
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
      const updatedManualEdit = {
        ...manualEditResult,
        newCode: newCode,
        hasChanges: newCode !== (manualEditResult.originalCode || originalCode)
      };
      setManualEditResult(updatedManualEdit);
    }
  }, [selectedFile, sourceCode, manualEditResult, originalCode]);

  // Handle patch generation from AI Context Window
  const handlePatchGenerated = useCallback((patch) => {
    setCurrentPatch(patch);
  }, []);

  // Handle preview generation and store AST diff as overlay
  const handlePreviewGenerated = useCallback(async (preview) => {
    // Preview is handled by the BrowserPreview component
    console.log('Preview generated:', preview);
    
    // Store AST diff in database when switching to preview mode
    if (selectedFile && sourceCode && currentPatch) {
      setAstDiffStatus({ status: 'saving', message: 'Saving AST diff overlay...' });
      
      try {
        // Calculate the modified code by applying the current patch
        const modifiedCode = applyPatchToCode(sourceCode, currentPatch);
        
        // Create hybrid customization patch in database
        const response = await apiClient.post('hybrid-patches/create', {
          filePath: selectedFile.path,
          originalCode: sourceCode,
          modifiedCode: modifiedCode,
          changeSummary: `AI-generated changes for: ${selectedFile.path}`,
          changeType: 'ai_modification'
        });
        
        if (response.success) {
          console.log('Hybrid customization patch created:', response.data);
          setAstDiffStatus({ 
            status: 'success', 
            message: 'Hybrid customization patch saved successfully',
            data: response.data 
          });
          // Clear status after 3 seconds
          setTimeout(() => setAstDiffStatus(null), 3000);
        } else {
          console.error('Failed to create AST diff overlay:', response.message);
          setAstDiffStatus({ 
            status: 'error', 
            message: `Failed to save overlay: ${response.message}` 
          });
        }
      } catch (error) {
        console.error('Error creating AST diff overlay:', error);
        setAstDiffStatus({ 
          status: 'error', 
          message: `Error saving overlay: ${error.message}` 
        });
      }
    }
  }, [selectedFile, sourceCode, currentPatch]);

  // Handle manual edit detection with auto-save
  const handleManualEdit = useCallback(async (newCode, originalCode, options = {}) => {
    const manualEdit = {
      newCode,
      originalCode,
      hasChanges: newCode !== originalCode,
      options
    };
    
    setManualEditResult(manualEdit);
    
    if (manualEdit.hasChanges) {
      console.log(`🔍 Manual changes detected in ${selectedFile?.name || 'file'}`);
      console.log('📋 Changes detected:', { originalLength: originalCode.length, newLength: newCode.length });
      
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

          console.log('💾 Auto-saving patch to database...');
          
          const response = await fetch('/api/hybrid-patches/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filePath: filePath,
              originalCode: originalCode,
              modifiedCode: newCode,
              changeSummary: 'Auto-saved changes',
              changeType: 'manual_edit',
              metadata: {
                source: 'ai_context_window',
                fileName: selectedFile?.name,
                timestamp: new Date().toISOString()
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Patch auto-saved successfully:', result);
          } else {
            const error = await response.text();
            console.error('❌ Failed to auto-save patch:', response.status, error);
          }
        } catch (error) {
          console.error('❌ Error during auto-save:', error);
        }
      }, 2000); // 2 second debounce
    } else {
      console.log('✅ Changes undone - code returned to original state');
    }
  }, [selectedFile?.name, selectedFile?.path]);

  // Handle diff stats changes from DiffPreviewSystem
  const handleDiffStatsChange = useCallback((diffStats) => {
    if (!selectedFile) return;
    
    // Check if there are any actual changes in the diff stats
    const hasChanges = diffStats && (
      diffStats.addedLines > 0 ||
      diffStats.removedLines > 0 ||
      diffStats.modifiedLines > 0
    );
    
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

  // Handle preview mode changes
  const handlePreviewModeChange = useCallback(async (mode) => {
    setPreviewMode(mode);
    
    // If switching to patch mode and we have a selected file, ensure hybrid patches are loaded
    if (mode === 'patch' && selectedFile?.path) {
      try {
        console.log(`🔍 Loading hybrid customization patches for Diff tab: ${selectedFile.path}`);
        
        const hybridPatchData = await apiClient.get(`hybrid-patches/${encodeURIComponent(selectedFile.path)}`);
        
        if (hybridPatchData && hybridPatchData.success && hybridPatchData.data) {
          const patches = hybridPatchData.data.patches || [];
          console.log(`📋 Found ${patches.length} hybrid customization patches for ${selectedFile.path}:`, patches);
          
          if (patches.length > 0) {
            const fileWithPatches = {
              ...selectedFile,
              hybridPatches: patches
            };
            
            // Dispatch the hybridPatchesLoaded event to update DiffPreviewSystem
            window.dispatchEvent(new CustomEvent('hybridPatchesLoaded', {
              detail: {
                file: fileWithPatches,
                patches: patches
              }
            }));
            
            console.log(`✅ Reloaded ${patches.length} patches for ${selectedFile.path} when switching to Diff tab`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to reload hybrid customization patches for ${selectedFile.path}:`, error.message);
      }
    }
  }, [selectedFile]);


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

      // Test the list endpoint first using API client
      const listData = await apiClient.get('proxy-source-files/list?path=src');
      
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
        const contentData = await apiClient.get(`proxy-source-files/content?path=${encodeURIComponent(testFilePath)}`);
        if (contentData.success) {
          setConnectionStatus({
            status: 'success',
            message: 'Connection successful!',
            details: `Successfully connected to backend at ${import.meta.env.VITE_API_BASE_URL}. Found ${listData.files?.length || 0} files in src directory.`
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
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-gray-50 dark:bg-gray-900">
      
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
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)] ">
          {/* AI Context Window - First Column */}
          <ResizablePanel 
            size={25}
            minSize={15}
            maxSize={50}
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
            size={10}
            minSize={10}
            maxSize={20}
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
            size={60}
            minSize={40}
            maxSize={85}
          >
            <div className="h-[calc(100vh-200px)] flex flex-col">
              {selectedFile ? (
                <>
                  {/* Tab Interface Above File Name */}
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                      <div className="flex">
                        <button
                          onClick={() => {
                            setPreviewMode('code');
                            handlePreviewModeChange('code');
                          }}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors",
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
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors",
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
                            setPreviewMode('live');
                            handlePreviewModeChange('live');
                          }}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            previewMode === 'live' 
                              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="p-2 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedFile.name}
                      </span>
                      {modifiedFiles.includes(selectedFile.path) && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Modified" />
                      )}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                        Preview Ready
                      </span>
                      {/* Download Button - Only show in Preview mode */}
                      {previewMode === 'live' && (
                        <button
                          onClick={handleDownload}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title="Download current file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {isFileLoading && (
                      <span className="text-xs text-gray-500">Loading...</span>
                    )}
                  </div>

                  {/* Single Content Area - Tab-based Content */}
                  <div className="flex-1">
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
                      // Live Preview View - Enhanced with AST diff and route resolution
                      <BrowserPreview
                        fileName={selectedFile?.path || ''}
                        filePath={selectedFile?.path}
                        currentCode={sourceCode}
                        previewMode="live"
                        useAstDiff={true}
                        astDiffData={astDiffStatus?.data}
                        className="h-full"
                      />
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