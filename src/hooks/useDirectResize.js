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
  const [sizeTooltip, setSizeTooltip] = useState(null);

  const createResizeHandle = useCallback(() => {
    const handle = document.createElement('div');
    
    // Base handle styles - improved visual design
    Object.assign(handle.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      backgroundColor: '#3b82f6',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: 'se-resize',
      zIndex: '1000',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      opacity: '0',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'auto',
      willChange: 'opacity, transform'
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

    // Add hover effects with better transitions
    handle.addEventListener('mouseenter', () => {
      handle.style.transform = (handle.style.transform || '') + ' scale(1.2)';
      handle.style.backgroundColor = '#2563eb';
      handle.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.4)';
    });
    
    handle.addEventListener('mouseleave', () => {
      if (!isResizing) {
        handle.style.transform = handle.style.transform.replace(' scale(1.2)', '');
        handle.style.backgroundColor = '#3b82f6';
        handle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
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
    
    // Create size tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(tooltip);
    setSizeTooltip(tooltip);

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

      // Apply smooth transitions with requestAnimationFrame
      requestAnimationFrame(() => {
        // Apply new dimensions directly to element
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;
        element.style.minWidth = `${newWidth}px`;
        element.style.minHeight = `${newHeight}px`;
        
        // Add visual feedback during resize
        element.style.transition = 'none'; // Disable transitions during drag
        element.style.userSelect = 'none';
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.8';
        element.style.transform = 'scale(1.02)';
        element.style.filter = 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))';
        
        // Element-specific adjustments
        if (elementType === 'button') {
          const fontSize = Math.max(12, Math.min(20, newHeight * 0.4));
          element.style.fontSize = `${fontSize}px`;
        }
        
        // Update tooltip with current size
        if (tooltip) {
          tooltip.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)}px`;
        }
      });

      // Callback with new dimensions
      if (onResize) {
        onResize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      // Restore element interactivity and transitions
      element.style.transition = '';
      element.style.userSelect = '';
      element.style.pointerEvents = '';
      element.style.opacity = '';
      element.style.transform = '';
      element.style.filter = '';
      
      // Remove size tooltip
      if (tooltip && document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
      setSizeTooltip(null);
      
      if (resizeHandle) {
        resizeHandle.style.transform = resizeHandle.style.transform.replace(' scale(1.2)', '');
        resizeHandle.style.backgroundColor = '#3b82f6';
        resizeHandle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
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
    
    // Make element relatively positioned if not already
    const computedStyle = window.getComputedStyle(element);
    const originalPosition = computedStyle.position;
    if (originalPosition === 'static') {
      element.style.position = 'relative';
    }
    
    const handle = createResizeHandle();
    setResizeHandle(handle);

    // Add handle to element
    try {
      element.appendChild(handle);
    } catch (error) {
      console.error('Failed to append resize handle:', error);
      return;
    }

    // Show/hide handle on hover
    const handleMouseEnter = () => {
      if (handle && handle.style) {
        handle.style.opacity = '1';
      }
    };
    
    const handleMouseLeave = () => {
      if (!isResizing && handle && handle.style) {
        handle.style.opacity = '0';
      }
    };

    // Attach resize event
    handle.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Cleanup
      try {
        if (element && handle && element.contains(handle)) {
          element.removeChild(handle);
        }
        
        // Clean up any leftover tooltips
        if (sizeTooltip && document.body.contains(sizeTooltip)) {
          document.body.removeChild(sizeTooltip);
        }
        
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
      
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        
        // Restore element styles
        element.style.transition = '';
        element.style.userSelect = '';
        element.style.pointerEvents = '';
        element.style.opacity = '';
        element.style.transform = '';
        element.style.filter = '';
      }
      
      if (handle) {
        handle.removeEventListener('mousedown', handleMouseDown);
      }
      
      // Restore original position if we changed it
      if (element && originalPosition === 'static') {
        element.style.position = '';
      }
    };
  }, [elementRef.current, disabled, createResizeHandle, handleMouseDown, isResizing]);

  return {
    isResizing,
    resizeHandle
  };
};

export default useDirectResize;