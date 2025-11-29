import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * AIWorkspaceContext - Shared state management for the AI Workspace
 * Bridges AI chat panel and visual editor, enabling seamless integration
 */

const AIWorkspaceContext = createContext();

// Available page types that can be edited
export const PAGE_TYPES = {
  PRODUCT: 'product',
  CATEGORY: 'category',
  CART: 'cart',
  HEADER: 'header',
  CHECKOUT: 'checkout',
  SUCCESS: 'success',
  ACCOUNT: 'account',
  LOGIN: 'login',
  HOMEPAGE: 'homepage'
};

// Default view modes for each page type
export const DEFAULT_VIEW_MODES = {
  product: 'default',
  category: 'grid',
  cart: 'emptyCart',
  header: 'desktop',
  checkout: 'default',
  success: 'empty',
  account: 'overview',
  login: 'login',
  homepage: 'default'
};

// Viewport modes for responsive editing
export const VIEWPORT_MODES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile'
};

// AI command operations
export const AI_OPERATIONS = {
  ADD: 'add',
  MODIFY: 'modify',
  REMOVE: 'remove',
  MOVE: 'move',
  RESIZE: 'resize',
  REORDER: 'reorder'
};

export const AIWorkspaceProvider = ({ children }) => {
  // Page/Editor State
  const [selectedPageType, setSelectedPageType] = useState(PAGE_TYPES.PRODUCT);
  const [editorMode, setEditorMode] = useState(false);
  const [viewportMode, setViewportMode] = useState(VIEWPORT_MODES.DESKTOP);
  const [viewMode, setViewMode] = useState(DEFAULT_VIEW_MODES.product);

  // Configuration State
  const [currentConfiguration, setCurrentConfiguration] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // AI Integration State
  const [aiCommandQueue, setAiCommandQueue] = useState([]);
  const [lastAiOperation, setLastAiOperation] = useState(null);
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  /**
   * Select a page type and update view mode accordingly
   */
  const selectPage = useCallback((pageType) => {
    setSelectedPageType(pageType);
    setViewMode(DEFAULT_VIEW_MODES[pageType] || 'default');
    setSelectedSlotId(null);
  }, []);

  /**
   * Toggle editor mode on/off
   */
  const toggleEditorMode = useCallback(() => {
    setEditorMode(prev => !prev);
    if (editorMode) {
      // Exiting editor mode - clear selection
      setSelectedSlotId(null);
    }
  }, [editorMode]);

  /**
   * Apply an AI-generated slot change
   * @param {object} operation - The slot operation from AI
   */
  const applyAiSlotChange = useCallback((operation) => {
    setLastAiOperation(operation);
    setAiCommandQueue(prev => [...prev, operation]);
    setHasUnsavedChanges(true);

    // The actual slot manipulation will be handled by the editor component
    // This just queues the operation and triggers re-render
  }, []);

  /**
   * Clear the AI command queue after processing
   */
  const clearAiCommandQueue = useCallback(() => {
    setAiCommandQueue([]);
  }, []);

  /**
   * Undo the last AI operation
   */
  const undoLastAiOperation = useCallback(() => {
    if (lastAiOperation) {
      // Store for potential redo
      const undoneOperation = lastAiOperation;
      setLastAiOperation(null);
      return undoneOperation;
    }
    return null;
  }, [lastAiOperation]);

  /**
   * Update configuration (called by editor)
   */
  const updateConfiguration = useCallback((config) => {
    setCurrentConfiguration(config);
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Mark configuration as saved
   */
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  /**
   * Toggle AI panel collapsed state
   */
  const toggleAiPanel = useCallback(() => {
    setAiPanelCollapsed(prev => !prev);
  }, []);

  /**
   * Add a chat message
   */
  const addChatMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, {
      ...message,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }]);
  }, []);

  /**
   * Clear chat history
   */
  const clearChatHistory = useCallback(() => {
    setChatMessages([]);
  }, []);

  // Memoized value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Page/Editor State
    selectedPageType,
    editorMode,
    viewportMode,
    viewMode,
    setViewportMode,
    setViewMode,

    // Configuration State
    currentConfiguration,
    hasUnsavedChanges,
    selectedSlotId,
    isLoading,
    setSelectedSlotId,
    setIsLoading,

    // AI Integration
    aiCommandQueue,
    lastAiOperation,
    aiPanelCollapsed,
    chatMessages,
    isProcessingAi,
    setIsProcessingAi,

    // Actions
    selectPage,
    toggleEditorMode,
    applyAiSlotChange,
    clearAiCommandQueue,
    undoLastAiOperation,
    updateConfiguration,
    markAsSaved,
    toggleAiPanel,
    addChatMessage,
    clearChatHistory,

    // Constants
    pageTypes: PAGE_TYPES,
    viewportModes: VIEWPORT_MODES,
    defaultViewModes: DEFAULT_VIEW_MODES,
    aiOperations: AI_OPERATIONS
  }), [
    selectedPageType,
    editorMode,
    viewportMode,
    viewMode,
    currentConfiguration,
    hasUnsavedChanges,
    selectedSlotId,
    isLoading,
    aiCommandQueue,
    lastAiOperation,
    aiPanelCollapsed,
    chatMessages,
    isProcessingAi,
    selectPage,
    toggleEditorMode,
    applyAiSlotChange,
    clearAiCommandQueue,
    undoLastAiOperation,
    updateConfiguration,
    markAsSaved,
    toggleAiPanel,
    addChatMessage,
    clearChatHistory
  ]);

  return (
    <AIWorkspaceContext.Provider value={value}>
      {children}
    </AIWorkspaceContext.Provider>
  );
};

/**
 * Hook to access AI Workspace context
 */
export const useAIWorkspace = () => {
  const context = useContext(AIWorkspaceContext);
  if (!context) {
    throw new Error('useAIWorkspace must be used within AIWorkspaceProvider');
  }
  return context;
};

export default AIWorkspaceContext;
