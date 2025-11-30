import React, { useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AIWorkspaceProvider, useAIWorkspace } from '@/contexts/AIWorkspaceContext';
import { StoreProvider } from '@/components/storefront/StoreProvider';
import { PriceUtilsProvider } from '@/utils/PriceUtilsProvider';
import WorkspaceHeader from '@/components/ai-workspace/WorkspaceHeader';
import WorkspaceAIPanel from '@/components/ai-workspace/WorkspaceAIPanel';
import WorkspaceCanvas from '@/components/ai-workspace/WorkspaceCanvas';
import WorkspaceStorefrontPreview from '@/components/ai-workspace/WorkspaceStorefrontPreview';
import DeveloperPluginEditor from '@/components/plugins/DeveloperPluginEditor';
import FileTreeNavigator from '@/components/editor/FileTreeNavigator';
import CodeEditor from '@/components/ai-studio/CodeEditor';
import { Button } from '@/components/ui/button';
import { Bot, ChevronLeft, FolderTree, Code2 } from 'lucide-react';
import apiClient from '@/api/client';

/**
 * AIWorkspace - Unified Editor + AI workspace
 * Combines AI chat capabilities with visual slot editing in a side-by-side layout
 *
 * Two modes:
 * - Editor Mode: Shows WorkspaceCanvas with full page editor (includes EditorSidebar)
 * - Preview Mode: Shows WorkspaceStorefrontPreview with full storefront
 */

const AIWorkspaceContent = () => {
  const {
    aiPanelCollapsed,
    editorMode,
    pluginToEdit,
    showPluginEditor,
    closePluginEditor,
    showAiStudio,
    selectedFile,
    fileContent,
    selectStudioFile,
    updateStudioFileContent
  } = useAIWorkspace();

  // Panel minimize states for plugin editor
  const [chatMinimized, setChatMinimized] = useState(false);
  const [fileTreeMinimized, setFileTreeMinimized] = useState(false);
  const [editorMinimized, setEditorMinimized] = useState(false);

  // AI Studio state
  const [studioFileTreeMinimized, setStudioFileTreeMinimized] = useState(false);
  const [studioEditorMinimized, setStudioEditorMinimized] = useState(false);
  const [loadingFileContent, setLoadingFileContent] = useState(false);

  // Calculate sizes for plugin editor mode
  const calculateChatSize = () => {
    if (chatMinimized) return 4;
    if (fileTreeMinimized && editorMinimized) return 92;
    if (editorMinimized) return 81;
    if (fileTreeMinimized) return 47;
    return 35;
  };

  const calculateFileTreeSize = () => {
    if (fileTreeMinimized) return 4;
    return 15;
  };

  const calculateEditorSize = () => {
    if (editorMinimized) return 4;
    if (chatMinimized && fileTreeMinimized) return 92;
    if (chatMinimized) return 81;
    if (fileTreeMinimized) return 49;
    return 50;
  };

  // AI Studio size calculations
  const calculateStudioChatSize = () => {
    if (chatMinimized) return 4;
    if (studioFileTreeMinimized && studioEditorMinimized) return 92;
    if (studioEditorMinimized) return 77;
    if (studioFileTreeMinimized) return 50;
    return 28;
  };

  const calculateStudioFileTreeSize = () => {
    if (studioFileTreeMinimized) return 4;
    return 18;
  };

  const calculateStudioEditorSize = () => {
    if (studioEditorMinimized) return 4;
    if (chatMinimized && studioFileTreeMinimized) return 92;
    if (chatMinimized) return 78;
    if (studioFileTreeMinimized) return 68;
    return 54;
  };

  // Handle file selection in AI Studio
  const handleFileSelect = useCallback(async (file) => {
    if (!file || !file.path) return;

    setLoadingFileContent(true);
    try {
      // Fetch file content from the API
      const response = await apiClient.get(`extensions/baselines/${encodeURIComponent(file.path)}`);

      if (response && response.success && response.data) {
        selectStudioFile(file, response.data.content || '');
      } else {
        console.error('Failed to load file content:', response);
        selectStudioFile(file, '// Error loading file content');
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      selectStudioFile(file, '// Error loading file content: ' + error.message);
    } finally {
      setLoadingFileContent(false);
    }
  }, [selectStudioFile]);

  // Handle code changes in AI Studio
  const handleCodeChange = useCallback((newCode) => {
    updateStudioFileContent(newCode);
  }, [updateStudioFileContent]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with page selector, editor toggle, and controls */}
      <WorkspaceHeader />

      {/* Main content area with resizable panels */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showPluginEditor && pluginToEdit ? (
          // Plugin Editor Mode - AI Chat + Developer Editor
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* AI Chat Assistant (Left) - Minimizable */}
            <ResizablePanel
              defaultSize={calculateChatSize()}
              minSize={4}
              maxSize={chatMinimized ? 4 : 90}
              collapsible={false}
            >
              <div className="h-full flex flex-col border-r bg-white dark:bg-gray-900">
                {!chatMinimized ? (
                  <>
                    <div className="h-10 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          AI Assistant
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatMinimized(true)}
                        title="Minimize chat"
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <WorkspaceAIPanel />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex pt-2 justify-center border-r bg-gray-50 dark:bg-gray-800" style={{ minWidth: '50px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatMinimized(false)}
                      title="Expand AI chat"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Bot className="w-5 h-5 text-blue-600" />
                    </Button>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Developer Plugin Editor (Right) */}
            <ResizablePanel
              defaultSize={calculateFileTreeSize() + calculateEditorSize()}
              minSize={8}
            >
              <DeveloperPluginEditor
                plugin={pluginToEdit}
                onSave={(updated) => {
                  console.log('Plugin saved:', updated);
                }}
                onClose={closePluginEditor}
                initialContext="editing"
                chatMinimized={chatMinimized}
                fileTreeMinimized={fileTreeMinimized}
                setFileTreeMinimized={setFileTreeMinimized}
                editorMinimized={editorMinimized}
                setEditorMinimized={setEditorMinimized}
                fileTreeTargetSize={calculateFileTreeSize()}
                editorTargetSize={calculateEditorSize()}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : showAiStudio ? (
          // AI Studio Mode - AI Chat + FileTree + CodeEditor
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* AI Chat Assistant (Left) - Minimizable */}
            <ResizablePanel
              defaultSize={calculateStudioChatSize()}
              minSize={4}
              maxSize={chatMinimized ? 4 : 90}
              collapsible={false}
            >
              <div className="h-full flex flex-col border-r bg-white dark:bg-gray-900">
                {!chatMinimized ? (
                  <>
                    <div className="h-10 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          AI Assistant
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatMinimized(true)}
                        title="Minimize chat"
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <WorkspaceAIPanel />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex pt-2 justify-center border-r bg-gray-50 dark:bg-gray-800" style={{ minWidth: '50px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatMinimized(false)}
                      title="Expand AI chat"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Bot className="w-5 h-5 text-blue-600" />
                    </Button>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* File Tree (Middle) - Minimizable */}
            <ResizablePanel
              defaultSize={calculateStudioFileTreeSize()}
              minSize={4}
              maxSize={studioFileTreeMinimized ? 4 : 30}
              collapsible={false}
            >
              <div className="h-full flex flex-col border-r bg-white dark:bg-gray-900">
                {!studioFileTreeMinimized ? (
                  <>
                    <div className="h-10 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          Files
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStudioFileTreeMinimized(true)}
                        title="Minimize file tree"
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <FileTreeNavigator
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        showDetails={false}
                        className="h-full border-0 rounded-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex pt-2 justify-center border-r bg-gray-50 dark:bg-gray-800" style={{ minWidth: '50px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStudioFileTreeMinimized(false)}
                      title="Expand file tree"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FolderTree className="w-5 h-5 text-emerald-600" />
                    </Button>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Code Editor (Right) - Minimizable */}
            <ResizablePanel
              defaultSize={calculateStudioEditorSize()}
              minSize={4}
              maxSize={studioEditorMinimized ? 4 : 95}
              collapsible={false}
            >
              <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                {!studioEditorMinimized ? (
                  <>
                    <div className="h-10 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {selectedFile?.name || 'Select a file'}
                        </span>
                        {loadingFileContent && (
                          <span className="text-xs text-gray-500">Loading...</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStudioEditorMinimized(true)}
                        title="Minimize editor"
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {selectedFile ? (
                        <CodeEditor
                          value={fileContent}
                          onChange={handleCodeChange}
                          fileName={selectedFile.name}
                          language="javascript"
                          readOnly={false}
                          enableDiffDetection={false}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No file selected</p>
                            <p className="text-sm mt-1">Select a file from the file tree to start editing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex pt-2 justify-center bg-gray-50 dark:bg-gray-800" style={{ minWidth: '50px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStudioEditorMinimized(false)}
                      title="Expand editor"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Code2 className="w-5 h-5 text-blue-600" />
                    </Button>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Normal Mode - AI Panel + Editor/Preview
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* AI Panel (left) - resizable and collapsible */}
            {!aiPanelCollapsed && (
              <>
                <ResizablePanel
                  defaultSize={28}
                  minSize={20}
                  maxSize={45}
                  className="bg-white dark:bg-gray-800"
                >
                  <WorkspaceAIPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />
              </>
            )}

            {/* Content Panel (right) - Editor or Storefront Preview */}
            <ResizablePanel
              defaultSize={aiPanelCollapsed ? 100 : 72}
              minSize={55}
            >
              {editorMode ? (
                // Editor Mode: Show full page editor (includes EditorSidebar built-in)
                <WorkspaceCanvas />
              ) : (
                // Preview Mode: Show full storefront with header, content, footer
                <StoreProvider>
                  <PriceUtilsProvider>
                    <WorkspaceStorefrontPreview />
                  </PriceUtilsProvider>
                </StoreProvider>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

/**
 * Main AIWorkspace component wrapped with provider
 */
const AIWorkspace = () => {
  return (
    <AIWorkspaceProvider>
      <AIWorkspaceContent />
    </AIWorkspaceProvider>
  );
};

export default AIWorkspace;
