import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AIWorkspaceProvider, useAIWorkspace } from '@/contexts/AIWorkspaceContext';
import WorkspaceHeader from '@/components/ai-workspace/WorkspaceHeader';
import WorkspaceAIPanel from '@/components/ai-workspace/WorkspaceAIPanel';
import WorkspaceCanvas from '@/components/ai-workspace/WorkspaceCanvas';

/**
 * AIWorkspace - Unified Editor + AI workspace
 * Combines AI chat capabilities with visual slot editing in a side-by-side layout
 */

const AIWorkspaceContent = () => {
  const { aiPanelCollapsed } = useAIWorkspace();

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with page selector, editor toggle, and controls */}
      <WorkspaceHeader />

      {/* Main content area with resizable panels */}
      <div className="flex-1 min-h-0 overflow-hidden">
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

          {/* Editor Canvas (right) */}
          <ResizablePanel
            defaultSize={aiPanelCollapsed ? 100 : 72}
            minSize={55}
          >
            <WorkspaceCanvas />
          </ResizablePanel>
        </ResizablePanelGroup>
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
