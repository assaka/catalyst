import React from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIStudio, AI_STUDIO_SIZES } from '@/contexts/AIStudioContext';
import SlidingPanel from './SlidingPanel';
import ChatInterface from './ChatInterface';

/**
 * AIStudio - Universal AI-powered creation tool
 * Chat-first interface (like Bolt, Lovable, v0)
 * AI understands intent and executes: plugins, translations, layouts, code
 */
const AIStudio = () => {
  const {
    isOpen,
    size,
    closeAI,
    toggleFullscreen
  } = useAIStudio();

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <SlidingPanel
      isOpen={isOpen}
      size={size}
      position="right"
      onClose={closeAI}
    >
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI Studio
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Powered by Claude
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={cn(
                "p-2 rounded-md",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "text-gray-600 dark:text-gray-400",
                "transition-colors"
              )}
              title={size === AI_STUDIO_SIZES.FULLSCREEN ? "Exit Fullscreen" : "Fullscreen"}
            >
              {size === AI_STUDIO_SIZES.FULLSCREEN ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={closeAI}
              className={cn(
                "p-2 rounded-md",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "text-gray-600 dark:text-gray-400",
                "transition-colors"
              )}
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </SlidingPanel>
  );
};

export default AIStudio;
