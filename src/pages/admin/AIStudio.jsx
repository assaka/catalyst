import React from 'react';
import { Sparkles } from 'lucide-react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Badge } from '@/components/ui/badge';
import ChatInterface from '@/components/ai-studio/ChatInterface';

/**
 * AIStudio Page - Standalone page version
 * Same chat interface as the global floating version
 * Accessible at /admin/ai-studio
 */
export default function AIStudio() {
  const { selectedStore } = useStoreSelection();

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
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Chat with AI to create plugins, translate content, generate layouts, and more
            </p>
          </div>
          {selectedStore && (
            <Badge variant="outline" className="text-sm">
              Store: {selectedStore.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
