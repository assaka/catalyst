import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AIWorkspaceProvider, useAIWorkspace } from '@/contexts/AIWorkspaceContext';
import { StoreProvider } from '@/components/storefront/StoreProvider';
import { PriceUtilsProvider } from '@/utils/PriceUtilsProvider';
import WorkspaceHeader from '@/components/ai-workspace/WorkspaceHeader';
import WorkspaceAIPanel from '@/components/ai-workspace/WorkspaceAIPanel';
import WorkspaceCanvas from '@/components/ai-workspace/WorkspaceCanvas';
import WorkspaceStorefrontPreview from '@/components/ai-workspace/WorkspaceStorefrontPreview';
import DeveloperPluginEditor from '@/components/plugins/DeveloperPluginEditor';
import ChatInterface from '@/components/ai-studio/ChatInterface';
import { Button } from '@/components/ui/button';
import { Bot, ChevronLeft } from 'lucide-react';

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
    openPluginEditor,
    showAiStudio,
    closeAiStudio
  } = useAIWorkspace();

  // Panel minimize state for AI chat only (Files and Editor panels don't minimize)
  const [chatMinimized, setChatMinimized] = useState(false);

  // Handle plugin cloned from ChatInterface (Create New Plugin)
  const handlePluginCloned = (clonedPlugin) => {
    // Convert to format expected by DeveloperPluginEditor
    const pluginForEditor = {
      id: clonedPlugin.id,
      name: clonedPlugin.name,
      ...clonedPlugin
    };
    // Open plugin editor with the cloned plugin
    openPluginEditor(pluginForEditor);
    // Close AI Studio mode since we're now in plugin editor mode
    closeAiStudio();
  };

  // Calculate sizes for plugin editor mode (simplified - no minimize for Files/Editor)
  const calculateChatSize = () => {
    if (chatMinimized) return 4;
    return 35;
  };

  const calculateFileTreeSize = () => {
    return 15;
  };

  const calculateEditorSize = () => {
    if (chatMinimized) return 81;
    return 50;
  };

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
                fileTreeTargetSize={calculateFileTreeSize()}
                editorTargetSize={calculateEditorSize()}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : showAiStudio ? (
          // AI Studio Mode - Full ChatInterface for creating plugins
          // When a plugin is created/selected, it will open in DeveloperPluginEditor via handlePluginCloned
          <div className="h-full">
            <ChatInterface onPluginCloned={handlePluginCloned} />
          </div>
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
