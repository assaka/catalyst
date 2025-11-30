import React from 'react';
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
    closeAiStudio,
    chatMinimized,
    chatMaximized
  } = useAIWorkspace();

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
    <div className="h-screend flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with page selector, editor toggle, and controls */}
      <WorkspaceHeader />

      {/* Main content area with resizable panels */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showPluginEditor && pluginToEdit ? (
          // Plugin Editor Mode - AI Chat + Developer Editor
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* AI Chat Assistant (Left) */}
            {!chatMinimized && (
              <>
                <ResizablePanel
                  defaultSize={chatMaximized ? 100 : calculateChatSize()}
                  minSize={chatMaximized ? 100 : 20}
                  maxSize={chatMaximized ? 100 : 50}
                  collapsible={false}
                >
                  <div className="h-full flex flex-col border-r bg-white dark:bg-gray-900">
                    <WorkspaceAIPanel />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className={chatMaximized ? 'hidden' : ''} />
              </>
            )}

            {/* Developer Plugin Editor (Right) - collapsed when chat is maximized */}
            <ResizablePanel
              defaultSize={chatMinimized ? 100 : (chatMaximized ? 0 : calculateFileTreeSize() + calculateEditorSize())}
              minSize={chatMaximized ? 0 : 8}
              className={chatMaximized ? 'hidden' : ''}
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
                  defaultSize={chatMaximized ? 100 : 28}
                  minSize={chatMaximized ? 100 : 20}
                  maxSize={chatMaximized ? 100 : 45}
                  className="bg-white dark:bg-gray-800"
                >
                  <WorkspaceAIPanel />
                </ResizablePanel>

                <ResizableHandle withHandle className={chatMaximized ? 'hidden' : ''} />
              </>
            )}

            {/* Content Panel (right) - Editor or Storefront Preview */}
            <ResizablePanel
              defaultSize={aiPanelCollapsed ? 100 : (chatMaximized ? 0 : 72)}
              minSize={chatMaximized ? 0 : 55}
              className={chatMaximized ? 'hidden' : ''}
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
