import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Bot, Code2 } from 'lucide-react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import ChatInterface from '@/components/ai-studio/ChatInterface';
import DeveloperPluginEditor from '@/components/plugins/DeveloperPluginEditor';

/**
 * AIStudio Page - Standalone page version
 * Two modes:
 * 1. Creation mode: Chat interface for creating new things
 * 2. Edit mode: File explorer + code editor + AI chat for editing plugins
 * Accessible at /admin/ai-studio
 */
export default function AIStudio() {
  const location = useLocation();
  const { selectedStore } = useStoreSelection();
  const pluginToEdit = location.state?.plugin;
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatOriginalSize, setChatOriginalSize] = useState(45);

  // Pass minimize states to DeveloperPluginEditor
  const [fileTreeMinimized, setFileTreeMinimized] = useState(false);
  const [editorMinimized, setEditorMinimized] = useState(false);

  // Calculate sizes to always total 100%
  const calculateChatSize = () => {
    if (chatMinimized) return 3;
    if (fileTreeMinimized && editorMinimized) return 94; // Scenario 7 (94+3+3=100)
    if (editorMinimized) return 87; // Scenario 4 (87+10+3=100)
    if (fileTreeMinimized) return 47; // Scenario 3 (47+3+50=100) - balanced split
    return 45; // Default (45+10+45=100)
  };

  const calculateFileTreeSize = () => {
    if (fileTreeMinimized) return 3;
    return 10; // Default 10%
  };

  const calculateEditorSize = () => {
    if (editorMinimized) return 3;
    if (chatMinimized && fileTreeMinimized) return 94; // Scenario 5 (3+3+94=100)
    if (chatMinimized) return 87; // Scenario 2 (3+10+87=100)
    if (fileTreeMinimized) return 50; // Scenario 3 (47+3+50=100) - balanced split
    return 45; // Default (45+10+45=100)
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              AI Studio
              {pluginToEdit && (
                <Badge variant="outline" className="ml-2">
                  Editing: {pluginToEdit.name}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {pluginToEdit
                ? 'Edit plugin code with AI assistance, file explorer, and diff viewer'
                : 'Chat with AI to create plugins, translate content, generate layouts, and more'
              }
            </p>
          </div>
          {selectedStore && (
            <Badge variant="outline" className="text-sm">
              Store: {selectedStore.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {pluginToEdit ? (
          // Plugin Edit Mode - Show AI Chat + Developer Editor
          <ResizablePanelGroup direction="horizontal" key={`panels-${chatMinimized}-${fileTreeMinimized}-${editorMinimized}`}>
            {/* AI Chat Assistant (Left) - Minimizable */}
            <ResizablePanel
              defaultSize={calculateChatSize()}
              minSize={3}
              maxSize={chatMinimized ? 3 : 90}
              collapsible={false}
              onResize={(size) => {
                if (!chatMinimized && size > 3) {
                  setChatOriginalSize(size);
                }
              }}
            >
              <div className="h-full flex flex-col border-r bg-white dark:bg-gray-900">
                {!chatMinimized ? (
                  <>
                    <div className="h-12 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          AI Assistant
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatMinimized(true)}
                        title="Minimize chat"
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ChatInterface context={{ plugin: pluginToEdit }} />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex pt-2 justify-center border-r bg-gray-50 dark:bg-gray-800">
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

            {/* Developer Editor with File Explorer (Right) - Gets remaining space */}
            <ResizablePanel
              defaultSize={calculateFileTreeSize() + calculateEditorSize()}
              minSize={6}
            >
              <DeveloperPluginEditor
                plugin={pluginToEdit}
                onSave={(updated) => {
                  console.log('Plugin saved:', updated);
                }}
                onClose={() => window.history.back()}
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
        ) : (
          // Creation Mode - Full Chat Interface
          <ChatInterface />
        )}
      </div>
    </div>
  );
}
