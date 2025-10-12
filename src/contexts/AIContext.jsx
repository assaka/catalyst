import React, { createContext, useContext, useState, useCallback } from 'react';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

export function AIProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState('general');
  const [quickActions, setQuickActions] = useState([]);

  /**
   * Open AI Assistant with specific context and quick actions
   */
  const openAI = useCallback((ctx, actions = []) => {
    setContext(ctx);
    setQuickActions(actions);
    setIsOpen(true);
  }, []);

  /**
   * Close AI Assistant
   */
  const closeAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Update context (when user navigates to different page)
   */
  const updateContext = useCallback((ctx, actions = []) => {
    setContext(ctx);
    setQuickActions(actions);
  }, []);

  const value = {
    isOpen,
    context,
    quickActions,
    openAI,
    closeAI,
    updateContext
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}
