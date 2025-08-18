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
          // Fallback to empty content for demo
          setSourceCode('// File not found or access denied\n// You can still test the AI Context Window with this placeholder');
          setSelectedFile({
            path: filePath,
            name: filePath.split('/').pop() || 'unknown.js',
            type: 'file',
            isSupported: true
          });
        }
      } else {
        console.error('Failed to load file:', response.statusText);
        // Fallback to empty content for demo
        setSourceCode('// File not found or access denied\n// You can still test the AI Context Window with this placeholder');
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop() || 'unknown.js',
          type: 'file',
          isSupported: true
        });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      // Fallback for demo purposes
      setSourceCode(`// Demo mode - simulating file: ${filePath}
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
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">Select a file to begin editing</p>
                    <p className="text-sm">
                      Choose a file from the navigator or{' '}
                      <button
                        onClick={() => loadFileContent('/demo/example.jsx')}
                        className="text-blue-500 hover:text-blue-600 underline"
                      >
                        load a demo file
                      </button>
                    </p>
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