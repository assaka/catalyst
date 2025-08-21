import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import FileTreeNavigator from '@/components/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/ai-context/CodeEditor';
import AIContextWindow from '@/components/ai-context/AIContextWindow';
import PreviewSystem from '@/components/ai-context/PreviewSystem';
import StorefrontPreview from '@/components/ai-context/StorefrontPreview';
import DiffPreviewSystem from '@/components/ai-context/DiffPreviewSystem';
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

  // Load file from URL parameter on mount
  useEffect(() => {
    const filePath = searchParams.get('file');
    if (filePath) {
      loadFileContent(filePath);
    }
  }, [searchParams]);

  // Load file content
  const loadFileContent = useCallback(async (filePath) => {
    setIsFileLoading(true);
    try {
      // Use the proxy endpoint which fetches from GitHub when local filesystem unavailable
      const data = await apiClient.get(`proxy-source-files/content?path=${encodeURIComponent(filePath)}`);

      if (data && data.success) {
        setSourceCode(data.content);
        setOriginalCode(data.content); // Set baseline for diff detection
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
        setOriginalCode(diagnosticInfo); // Set baseline for diff detection
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
      setOriginalCode(fallbackContent); // Set baseline for diff detection
      
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
    
    // Track modified files
    if (selectedFile && newCode !== sourceCode) {
      setModifiedFiles(prev => {
        if (!prev.includes(selectedFile.path)) {
          return [...prev, selectedFile.path];
        }
        return prev;
      });
    }
  }, [selectedFile, sourceCode]);

  // Handle patch generation from AI Context Window
  const handlePatchGenerated = useCallback((patch) => {
    setCurrentPatch(patch);
  }, []);

  // Handle preview generation and store AST diff as overlay
  const handlePreviewGenerated = useCallback(async (preview) => {
    // Preview is handled by the PreviewSystem component
    console.log('Preview generated:', preview);
    
    // Store AST diff in database when switching to preview mode
    if (selectedFile && sourceCode && currentPatch) {
      setAstDiffStatus({ status: 'saving', message: 'Saving AST diff overlay...' });
      
      try {
        // Calculate the modified code by applying the current patch
        const modifiedCode = applyPatchToCode(sourceCode, currentPatch);
        
        // Create AST diff overlay in database
        const response = await apiClient.post('ast-diffs/create', {
          filePath: selectedFile.path,
          originalCode: sourceCode,
          modifiedCode: modifiedCode,
          changeSummary: `AI-generated changes for: ${selectedFile.path}`,
          changeType: 'modification'
        });
        
        if (response.success) {
          console.log('AST diff overlay created:', response.data);
          setAstDiffStatus({ 
            status: 'success', 
            message: 'AST diff overlay saved successfully',
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

  // Handle patch application
  const handleApplyPatch = useCallback((modifiedCode, patchResult) => {
    setSourceCode(modifiedCode);
    setCurrentPatch(null);
    
    // Mark file as modified
    if (selectedFile) {
      setModifiedFiles(prev => {
        if (!prev.includes(selectedFile.path)) {
          return [...prev, selectedFile.path];
        }
        return prev;
      });
    }

    console.log('Patch applied successfully:', patchResult);
  }, [selectedFile]);

  // Handle patch rejection
  const handleRejectPatch = useCallback(() => {
    setCurrentPatch(null);
  }, []);

  // Handle manual edit detection
  const handleManualEdit = useCallback((diffResult) => {
    setManualEditResult(diffResult);
    console.log('Manual edit detected:', diffResult);
    
    // You could optionally show a notification or update UI to indicate manual editing
    if (diffResult.hasChanges) {
      console.log(`🔍 Manual changes detected: ${diffResult.changeCount} modifications`);
      console.log('📋 Diff summary:', diffResult.summary);
    }
  }, []);

  // Handle preview mode changes from PreviewSystem
  const handlePreviewModeChange = useCallback((mode) => {
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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      
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
              <div className="mt-1 text-xs">
                {manualEditResult.changeCount} change{manualEditResult.changeCount !== 1 ? 's' : ''} • {manualEditResult.summary?.stats?.additions || 0} additions, {manualEditResult.summary?.stats?.deletions || 0} deletions
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
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* AI Context Window - Now First Column */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
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
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <FileTreeNavigator
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              modifiedFiles={modifiedFiles}
              onRefresh={handleFileTreeRefresh}
              className="h-full"
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Code Editor and Preview Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col">
              {selectedFile ? (
                <>
                  {/* Tab Interface Above File Name */}
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setPreviewMode('code');
                          handlePreviewModeChange('code');
                        }}
                        className={cn(
                          "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          previewMode === 'code' 
                            ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        Code
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMode('patch');
                          handlePreviewModeChange('patch');
                        }}
                        className={cn(
                          "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          previewMode === 'patch' 
                            ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        Diff
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMode('live');
                          handlePreviewModeChange('live');
                        }}
                        className={cn(
                          "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          previewMode === 'live' 
                            ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        Preview
                      </button>
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
                      {currentPatch && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded dark:bg-green-900 dark:text-green-300">
                          Preview Available
                        </span>
                      )}
                    </div>
                    
                    {isFileLoading && (
                      <span className="text-xs text-gray-500">Loading...</span>
                    )}
                  </div>

                  {/* Single Content Area - Tab-based Content */}
                  <div className="flex-1">
                    {previewMode === 'code' ? (
                      // Code Editor View
                      <CodeEditor
                        value={sourceCode}
                        onChange={handleCodeChange}
                        fileName={selectedFile.name}
                        onCursorPositionChange={setCursorPosition}
                        onSelectionChange={setSelection}
                        onManualEdit={handleManualEdit}
                        originalCode={originalCode}
                        enableDiffDetection={true}
                        className="h-full"
                      />
                    ) : previewMode === 'patch' ? (
                      // Diff View - Always use DiffPreviewSystem for showing diffs
                      <DiffPreviewSystem
                        diffResult={manualEditResult}
                        fileName={selectedFile?.name || ''}
                        className="h-full"
                      />
                    ) : (
                      // Live Preview View
                      <PreviewSystem
                        originalCode={originalCode}
                        currentCode={sourceCode}
                        patch={currentPatch}
                        fileName={selectedFile?.name || ''}
                        onApplyPatch={handleApplyPatch}
                        onRejectPatch={handleRejectPatch}
                        hasManualEdits={manualEditResult?.hasChanges || false}
                        manualEditResult={manualEditResult}
                        onPreviewModeChange={handlePreviewModeChange}
                        previewMode="live"
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