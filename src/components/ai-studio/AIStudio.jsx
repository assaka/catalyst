import React from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIStudio, AI_STUDIO_MODES, AI_STUDIO_SIZES } from '@/contexts/AIStudioContext';
import SlidingPanel from './SlidingPanel';
import ModeSelector from './ModeSelector';
import PluginMode from './modes/PluginMode';
import TranslationMode from './modes/TranslationMode';
import LayoutMode from './modes/LayoutMode';
import CodeEditorMode from './modes/CodeEditorMode';

/**
 * AIStudio - Universal AI-powered creation tool
 * Replaces: AIStudio.jsx (old page), PluginAIAssistant.jsx
 * Accessible globally via Ctrl+K
 */
const AIStudio = () => {
  const {
    isOpen,
    mode,
    context,
    size,
    closeAI,
    toggleFullscreen,
    changeMode
  } = useAIStudio();

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Render appropriate mode component
  const renderModeContent = () => {
    switch (mode) {
      case AI_STUDIO_MODES.PLUGIN:
        return <PluginMode context={context} />;
      case AI_STUDIO_MODES.TRANSLATION:
        return <TranslationMode context={context} />;
      case AI_STUDIO_MODES.LAYOUT:
        return <LayoutMode context={context} />;
      case AI_STUDIO_MODES.CODE:
        return <CodeEditorMode context={context} />;
      default:
        return <WelcomeScreen onModeSelect={changeMode} />;
    }
  };

  return (
    <SlidingPanel
      isOpen={isOpen}
      size={size}
      position="right"
      onClose={closeAI}
    >
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
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

        {/* Mode Selector */}
        {mode && (
          <ModeSelector
            currentMode={mode}
            onModeChange={changeMode}
          />
        )}

        {/* Mode Content */}
        <div className="flex-1 overflow-hidden">
          {renderModeContent()}
        </div>
      </div>
    </SlidingPanel>
  );
};

/**
 * WelcomeScreen - Shown when no mode is selected
 */
const WelcomeScreen = ({ onModeSelect }) => {
  const modes = [
    {
      id: AI_STUDIO_MODES.PLUGIN,
      title: 'Plugin Generator',
      description: 'Create or edit plugins with natural language or screenshots',
      icon: '🔌',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: AI_STUDIO_MODES.TRANSLATION,
      title: 'Bulk Translation',
      description: 'Translate content across multiple languages using AI',
      icon: '🌐',
      color: 'from-green-500 to-green-600'
    },
    {
      id: AI_STUDIO_MODES.LAYOUT,
      title: 'Layout Generator',
      description: 'Generate or modify page layouts with AI assistance',
      icon: '📐',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: AI_STUDIO_MODES.CODE,
      title: 'Code Editor',
      description: 'Edit code using natural language descriptions',
      icon: '💻',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">AI</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to AI Studio
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Choose a mode to get started with AI-powered creation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {modes.map((modeOption) => (
          <button
            key={modeOption.id}
            onClick={() => onModeSelect(modeOption.id)}
            className={cn(
              "p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700",
              "bg-white dark:bg-gray-800",
              "hover:border-blue-500 dark:hover:border-blue-400",
              "hover:shadow-lg",
              "transition-all duration-200",
              "text-left group"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg mb-3",
              "bg-gradient-to-br",
              modeOption.color,
              "flex items-center justify-center text-2xl",
              "group-hover:scale-110 transition-transform"
            )}>
              {modeOption.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {modeOption.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {modeOption.description}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+K</kbd> to open AI Studio anytime
        </p>
      </div>
    </div>
  );
};

export default AIStudio;
