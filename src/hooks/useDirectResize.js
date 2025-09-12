import { useEffect, useState, useCallback } from 'react';

/**
 * Direct element resize hook - no wrapper divs!
 * Attaches resize handles directly to the target element
 */
export const useDirectResize = (elementRef, options = {}) => {
  const {
    minWidth = 50,
    minHeight = 20,
    maxWidth = 400,
    maxHeight = 200,
    onResize,
    disabled = false,
    elementType = 'generic', // 'button', 'icon', 'image', 'generic'
    handlePosition = 'corner' // 'corner', 'right', 'bottom'
  } = options;

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  const createResizeHandle = useCallback(() => {
    const handle = document.createElement('div');
    
    // Base handle styles
    Object.assign(handle.style, {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#10b981',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: 'se-resize',
      zIndex: '50',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      opacity: '0',
      transition: 'opacity 0.2s, transform 0.1s',
      pointerEvents: 'auto'
    });

    // Position based on handlePosition
    switch (handlePosition) {
      case 'right':
        Object.assign(handle.style, {
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'e-resize'
        });
        break;
      case 'bottom':
        Object.assign(handle.style, {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 's-resize'
        });
        break;
      default: // corner
        Object.assign(handle.style, {
          bottom: '-4px',
          right: '-4px',
          cursor: 'se-resize'
        });
    }

    // Add hover effects
    handle.addEventListener('mouseenter', () => {
      handle.style.transform = (handle.style.transform || '') + ' scale(1.1)';
      handle.style.backgroundColor = '#059669';
    });
    
    handle.addEventListener('mouseleave', () => {
      if (!isResizing) {
        handle.style.transform = handle.style.transform.replace(' scale(1.1)', '');
        handle.style.backgroundColor = '#10b981';
      }
    });

    return handle;
  }, [handlePosition, isResizing]);

  const handleMouseDown = useCallback((e) => {
    if (disabled || !elementRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on handle position
      switch (handlePosition) {
        case 'right':
          newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
          break;
        case 'bottom':
          newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
          break;
        default: // corner
          newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
          newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
      }

      // Element-specific resize logic
      if (elementType === 'icon') {
        // Keep icons proportional
        const avgDelta = (deltaX + deltaY) / 2;
        const newSize = Math.min(maxWidth, Math.max(minWidth, Math.min(startWidth, startHeight) + avgDelta));
        newWidth = newSize;
        newHeight = newSize;
      } else if (elementType === 'button') {
        // Buttons: prioritize height changes, adjust font size
        newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
        if (handlePosition === 'corner') {
          newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
        }
      }

      // Apply new dimensions directly to element
      element.style.width = `${newWidth}px`;
      element.style.height = `${newHeight}px`;
      element.style.minWidth = `${newWidth}px`;
      element.style.minHeight = `${newHeight}px`;

      // Element-specific adjustments
      if (elementType === 'button') {
        const fontSize = Math.max(12, Math.min(20, newHeight * 0.4));
        element.style.fontSize = `${fontSize}px`;
      }

      // Callback with new dimensions
      if (onResize) {
        onResize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (resizeHandle) {
        resizeHandle.style.transform = resizeHandle.style.transform.replace(' scale(1.1)', '');
        resizeHandle.style.backgroundColor = '#10b981';
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    disabled, 
    elementRef, 
    handlePosition, 
    maxWidth, 
    maxHeight, 
    minWidth, 
    minHeight, 
    elementType, 
    onResize,
    resizeHandle
  ]);

  // Setup and cleanup resize handle
  useEffect(() => {
    if (!elementRef.current || disabled) return;

    const element = elementRef.current;
    const handle = createResizeHandle();
    setResizeHandle(handle);

    // Make element relatively positioned if not already
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }

    // Add handle to element
    element.appendChild(handle);

    // Show/hide handle on hover
    const handleMouseEnter = () => {
      handle.style.opacity = '1';
    };
    
    const handleMouseLeave = () => {
      if (!isResizing) {
        handle.style.opacity = '0';
      }
    };

    // Attach resize event
    handle.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Cleanup
      if (element.contains(handle)) {
        element.removeChild(handle);
      }
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      handle.removeEventListener('mousedown', handleMouseDown);
      
      // Restore original position if we changed it
      if (!originalPosition || originalPosition === 'static') {
        element.style.position = originalPosition || '';
      }
    };
  }, [elementRef, disabled, createResizeHandle, handleMouseDown, isResizing]);

  return {
    isResizing,
    resizeHandle
  };
};

export default useDirectResize;