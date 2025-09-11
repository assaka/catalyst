import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage external resize functionality for elements
 * Returns methods to register/unregister elements for external resizing
 */
export const useExternalResize = () => {
  const [resizableElements, setResizableElements] = useState(new Map());

  const registerElement = useCallback((elementId, element, config = {}) => {
    if (!element || !elementId) return;

    setResizableElements(prev => {
      const newMap = new Map(prev);
      newMap.set(elementId, {
        element,
        config: {
          minWidth: 100,
          minHeight: 24,
          maxWidth: 800,
          maxHeight: 200,
          elementType: 'text',
          ...config
        }
      });
      return newMap;
    });
  }, []);

  const unregisterElement = useCallback((elementId) => {
    setResizableElements(prev => {
      const newMap = new Map(prev);
      newMap.delete(elementId);
      return newMap;
    });
  }, []);

  const updateElementConfig = useCallback((elementId, newConfig) => {
    setResizableElements(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(elementId);
      if (existing) {
        newMap.set(elementId, {
          ...existing,
          config: { ...existing.config, ...newConfig }
        });
      }
      return newMap;
    });
  }, []);

  const clearAllElements = useCallback(() => {
    setResizableElements(new Map());
  }, []);

  return {
    resizableElements,
    registerElement,
    unregisterElement,
    updateElementConfig,
    clearAllElements
  };
};