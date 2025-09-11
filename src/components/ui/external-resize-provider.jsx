"use client"

import React, { createContext, useContext } from 'react';
import { useExternalResize } from '@/hooks/useExternalResize';
import { ExternalResizeHandles } from './external-resize-handles';

const ExternalResizeContext = createContext();

export const useExternalResizeContext = () => {
  const context = useContext(ExternalResizeContext);
  if (!context) {
    throw new Error('useExternalResizeContext must be used within ExternalResizeProvider');
  }
  return context;
};

/**
 * Provider component that manages and renders all external resize handles
 * Should be placed at the top level of the editor
 */
export const ExternalResizeProvider = ({ children, disabled = false }) => {
  const resizeHook = useExternalResize();
  const { resizableElements } = resizeHook;

  return (
    <ExternalResizeContext.Provider value={resizeHook}>
      {children}
      
      {/* Render all resize handles as portals/overlay */}
      {!disabled && (
        <div className="external-resize-handles-overlay">
          {Array.from(resizableElements.entries()).map(([elementId, { element, config }]) => (
            <ExternalResizeHandles
              key={elementId}
              targetElement={element}
              {...config}
            />
          ))}
        </div>
      )}
    </ExternalResizeContext.Provider>
  );
};