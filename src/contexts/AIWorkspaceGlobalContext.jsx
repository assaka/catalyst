import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * AIWorkspaceGlobalContext - Global state management for the floating AI panel
 * Provides access to AI features from anywhere in the application
 */

const AIWorkspaceGlobalContext = createContext();

export const AI_WORKSPACE_MODES = {
  PLUGIN: 'plugin',
  TRANSLATION: 'translation',
  LAYOUT: 'layout',
  CODE: 'code'
};

export const AI_WORKSPACE_SIZES = {
  COLLAPSED: 'collapsed',
  PARTIAL: 'partial',
  FULLSCREEN: 'fullscreen'
};

export const AIWorkspaceProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [context, setContext] = useState({});
  const [size, setSize] = useState(AI_WORKSPACE_SIZES.PARTIAL);
  const [history, setHistory] = useState([]);

  /**
   * Open AI panel with specific mode and context
   * @param {string} mode - One of AI_WORKSPACE_MODES
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
   * Close AI panel
   */
  const closeAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggle AI panel open/closed
   */
  const toggleAI = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Change AI panel size
   * @param {string} newSize - One of AI_WORKSPACE_SIZES
   */
  const changeSize = useCallback((newSize) => {
    setSize(newSize);
  }, []);

  /**
   * Toggle between partial and fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    setSize(prev =>
      prev === AI_WORKSPACE_SIZES.FULLSCREEN
        ? AI_WORKSPACE_SIZES.PARTIAL
        : AI_WORKSPACE_SIZES.FULLSCREEN
    );
  }, []);

  /**
   * Change mode while keeping AI panel open
   * @param {string} newMode - One of AI_WORKSPACE_MODES
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
    modes: AI_WORKSPACE_MODES,
    sizes: AI_WORKSPACE_SIZES
  };

  return (
    <AIWorkspaceGlobalContext.Provider value={value}>
      {children}
    </AIWorkspaceGlobalContext.Provider>
  );
};

/**
 * Hook to access AI Workspace global context
 */
export const useAIWorkspace = () => {
  const context = useContext(AIWorkspaceGlobalContext);
  if (!context) {
    throw new Error('useAIWorkspace must be used within AIWorkspaceProvider');
  }
  return context;
};

export default AIWorkspaceGlobalContext;
