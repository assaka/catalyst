import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * AIStudioContext - Global state management for the unified AI Studio
 * Provides access to AI features from anywhere in the application
 */

const AIStudioContext = createContext();

export const AI_STUDIO_MODES = {
  PLUGIN: 'plugin',
  TRANSLATION: 'translation',
  LAYOUT: 'layout',
  CODE: 'code'
};

export const AI_STUDIO_SIZES = {
  COLLAPSED: 'collapsed',
  PARTIAL: 'partial',
  FULLSCREEN: 'fullscreen'
};

export const AIStudioProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [context, setContext] = useState({});
  const [size, setSize] = useState(AI_STUDIO_SIZES.PARTIAL);
  const [history, setHistory] = useState([]);

  /**
   * Open AI Studio with specific mode and context
   * @param {string} mode - One of AI_STUDIO_MODES
   * @param {object} contextData - Context data for the mode
   */
  const openAI = useCallback((mode, contextData = {}) => {
    setMode(mode);
    setContext(contextData);
    setIsOpen(true);

    // Add to history
    setHistory(prev => [...prev, {
      mode,
      context: contextData,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  /**
   * Close AI Studio
   */
  const closeAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggle AI Studio open/closed
   */
  const toggleAI = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Change AI Studio size
   * @param {string} newSize - One of AI_STUDIO_SIZES
   */
  const changeSize = useCallback((newSize) => {
    setSize(newSize);
  }, []);

  /**
   * Toggle between partial and fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    setSize(prev =>
      prev === AI_STUDIO_SIZES.FULLSCREEN
        ? AI_STUDIO_SIZES.PARTIAL
        : AI_STUDIO_SIZES.FULLSCREEN
    );
  }, []);

  /**
   * Change mode while keeping AI Studio open
   * @param {string} newMode - One of AI_STUDIO_MODES
   * @param {object} contextData - Optional new context data
   */
  const changeMode = useCallback((newMode, contextData = null) => {
    setMode(newMode);
    if (contextData !== null) {
      setContext(contextData);
    }
  }, []);

  /**
   * Update context data without changing mode
   * @param {object} updates - Partial context updates
   */
  const updateContext = useCallback((updates) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear generation history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const value = {
    // State
    isOpen,
    mode,
    context,
    size,
    history,

    // Actions
    openAI,
    closeAI,
    toggleAI,
    changeSize,
    toggleFullscreen,
    changeMode,
    updateContext,
    clearHistory,

    // Constants
    modes: AI_STUDIO_MODES,
    sizes: AI_STUDIO_SIZES
  };

  return (
    <AIStudioContext.Provider value={value}>
      {children}
    </AIStudioContext.Provider>
  );
};

/**
 * Hook to access AI Studio context
 */
export const useAIStudio = () => {
  const context = useContext(AIStudioContext);
  if (!context) {
    throw new Error('useAIStudio must be used within AIStudioProvider');
  }
  return context;
};

export default AIStudioContext;
