import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import FileTreeNavigator from '@/components/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/ai-context/CodeEditor';
import AIContextWindow from '@/components/ai-context/AIContextWindow';
import PreviewSystem from '@/components/ai-context/PreviewSystem';

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
  const [modifiedFiles, setModifiedFiles] = useState([]);
  const [currentPatch, setCurrentPatch] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [selection, setSelection] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

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
      // For now, we'll use a simple fetch to the source files API
      // In a real implementation, this would integrate with the file system
      const response = await fetch(`/api/source-files/content?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSourceCode(data.content);
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
          setSelectedFile({
            path: filePath,
            name: filePath.split('/').pop() || 'unknown.js',
            type: 'file',
            isSupported: true
          });
        }
      } else {
        console.error('Failed to load file:', response.statusText);
        
        // Determine specific error type based on status
        let errorType = 'Unknown Error';
        let troubleshooting = [];
        
        switch (response.status) {
          case 401:
            errorType = 'Authentication Error';
            troubleshooting = [
              'Check if you are logged in as a store owner',
              'Verify authentication token in browser storage',
              'Try refreshing the page and logging in again'
            ];
            break;
          case 403:
            errorType = 'Access Denied';
            troubleshooting = [
              'File path may be outside allowed directories',
              'Check if file path starts with "src/"',
              'Verify file permissions'
            ];
            break;
          case 404:
            // Check if this is a server connectivity issue vs actual file not found
            const isServerIssue = response.url && !response.url.includes('/api/source-files/');
            errorType = isServerIssue ? 'Server Not Running' : 'File Not Found';
            troubleshooting = isServerIssue ? [
              'Backend server appears to be offline',
              'Start the backend server (usually: npm run dev or npm start)',
              'Verify the server is running on the correct port (typically 3000)',
              'Check server logs for startup errors'
            ] : [
              'Check if the file exists at the specified path',
              'Verify the file path is correct',
              'Try selecting a different file from the tree'
            ];
            break;
          case 500:
            errorType = 'Server Error';
            troubleshooting = [
              'Check if the backend server is running',
              'Verify server logs for detailed error information',
              'Contact system administrator if issue persists'
            ];
            break;
          default:
            errorType = `HTTP ${response.status} Error`;
            troubleshooting = [
              'Check network connection',
              'Verify backend server is accessible',
              'Try refreshing the page'
            ];
        }
        
        const diagnosticInfo = `// ${errorType}: ${response.statusText}
// File Path: ${filePath}
// HTTP Status: ${response.status}
// 
// Troubleshooting Steps:
${troubleshooting.map((step, i) => `// ${i + 1}. ${step}`).join('\n')}
//
// Authentication Token: ${localStorage.getItem('store_owner_auth_token') ? 'Present' : 'Missing'}
//
// You can still test the AI Context Window with this placeholder
//
import React, { useState } from 'react';

const ErrorDiagnostic = () => {
  return (
    <div className="p-4 border rounded bg-red-50">
      <h3 className="text-red-800 font-semibold">${errorType}</h3>
      <p className="text-red-600">Status: ${response.status} ${response.statusText}</p>
      <p className="text-red-600">File: ${filePath}</p>
      <div className="mt-2">
        <p className="text-sm text-red-700">Troubleshooting:</p>
        <ul className="text-sm text-red-700 list-disc ml-4">
          ${troubleshooting.map(step => `<li>${step}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  );
};

export default ErrorDiagnostic;`;
        
        setSourceCode(diagnosticInfo);
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop() || 'unknown.js',
          type: 'file',
          isSupported: true
        });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      
      // Enhanced network error handling
      let errorInfo = '';
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorInfo = `// Network Error: Cannot connect to backend server
// File Path: ${filePath}
// 
// The backend server appears to be offline.
// 
// To fix this issue:
// 1. Start the backend server: npm run dev (in backend directory)
// 2. Or start full stack: npm start (in root directory)
// 3. Verify server is running on port 3000
// 4. Check server logs for any startup errors
//
// You can still test the AI Context Window with this placeholder
//`;
      } else {
        errorInfo = `// Network Error: ${error.message}
// File Path: ${filePath}
// 
// Connection to backend failed. Ensure the server is running.
//
// You can still test the AI Context Window with this placeholder
//`;
      }
      
      // Fallback for demo purposes
      setSourceCode(errorInfo + `
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

export default ExampleComponent;`);
      
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

  // Handle preview generation
  const handlePreviewGenerated = useCallback((preview) => {
    // Preview is handled by the PreviewSystem component
    console.log('Preview generated:', preview);
  }, []);

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

      // Test the list endpoint first
      const listResponse = await fetch('/api/source-files/list?path=src', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!listResponse.ok) {
        let errorDetails = '';
        switch (listResponse.status) {
          case 401:
            errorDetails = 'Authentication failed. Please refresh and log in again.';
            break;
          case 403:
            errorDetails = 'Access denied. Verify you have store owner permissions.';
            break;
          case 404:
            errorDetails = 'Backend server not running. Start with: npm run dev (backend) or npm start';
            break;
          case 500:
            errorDetails = 'Server error. Check backend logs for details.';
            break;
          default:
            errorDetails = `HTTP ${listResponse.status}: ${listResponse.statusText}`;
        }
        
        setConnectionStatus({
          status: 'error',
          message: `API connection failed (${listResponse.status})`,
          details: errorDetails
        });
        return;
      }

      const listData = await listResponse.json();
      
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
      const contentResponse = await fetch(`/api/source-files/content?path=${encodeURIComponent(testFilePath)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        if (contentData.success) {
          setConnectionStatus({
            status: 'success',
            message: 'Connection successful!',
            details: `Successfully connected to backend API. Found ${listData.files?.length || 0} files in src directory.`
          });
        } else {
          setConnectionStatus({
            status: 'warning',
            message: 'API connected but file access limited',
            details: `Can list files but cannot read content: ${contentData.message}`
          });
        }
      } else {
        setConnectionStatus({
          status: 'warning',
          message: 'Partial connection success',
          details: `Can list files but file content access failed (${contentResponse.status})`
        });
      }
    } catch (error) {
      // Enhanced error detection for common connectivity issues
      let errorMessage = 'Connection test failed';
      let errorDetails = '';
      
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Backend server not running';
        errorDetails = 'Cannot connect to backend server. Start with: npm run dev (backend) or npm start';
      } else if (error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Network connection failed';
        errorDetails = 'Backend server appears to be offline. Check if it\'s running on port 3000.';
      } else {
        errorDetails = `Network error: ${error.message}. Ensure backend server is running.`;
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

        {/* Connection Status and Test Button */}
        <div className="flex items-center space-x-4">
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

          {/* Code Editor */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full flex flex-col">
              {selectedFile ? (
                <>
                  {/* Editor Header */}
                  <div className="p-2 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedFile.name}
                      </span>
                      {modifiedFiles.includes(selectedFile.path) && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Modified" />
                      )}
                    </div>
                    
                    {isFileLoading && (
                      <span className="text-xs text-gray-500">Loading...</span>
                    )}
                  </div>

                  {/* Code Editor */}
                  <CodeEditor
                    value={sourceCode}
                    onChange={handleCodeChange}
                    fileName={selectedFile.name}
                    onCursorPositionChange={setCursorPosition}
                    onSelectionChange={setSelection}
                    className="flex-1"
                  />
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

          <ResizableHandle />

          {/* AI Context Window */}
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

          {/* Preview System */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <PreviewSystem
              originalCode={sourceCode}
              patch={currentPatch}
              fileName={selectedFile?.name || ''}
              onApplyPatch={handleApplyPatch}
              onRejectPatch={handleRejectPatch}
              className="h-full"
            />
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
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};

export default AIContextWindowPage;