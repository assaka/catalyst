import React, { useRef, cloneElement, Children, isValidElement, useState, useCallback, useEffect } from 'react';

/**
 * WebflowResizer - Smooth, professional element resizing with Webflow-like UX
 * No jittering, smooth interactions, visual feedback
 */
export const WebflowResizer = ({ 
  children, 
  disabled = false, 
  onResize,
  elementType = 'auto',
  className = '',
}) => {
  const containerRef = useRef(null);
  const elementRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const [initialSize, setInitialSize] = useState(null);
  
  // Detect element type automatically if not specified
  const getElementType = (child) => {
    if (elementType !== 'auto') return elementType;
    
    if (!isValidElement(child)) return 'generic';
    
    const type = child.type;
    const props = child.props || {};
    
    // Check for SVG icons (Lucide icons or inline SVGs)
    if (type === 'svg' || 
        (typeof type === 'function' && type.displayName?.includes('Icon')) ||
        (typeof type === 'object' && type.$$typeof === Symbol.for('react.forward_ref'))) {
      return 'icon';
    }
    
    // Check for images
    if (type === 'img') {
      return 'image';
    }
    
    // Check for buttons
    if (type === 'button' || 
        props.className?.includes('btn') || 
        props.className?.includes('button') ||
        (typeof type === 'function' && type.displayName === 'Button')) {
      return 'button';
    }
    
    return 'generic';
  };
  
  // Get resize constraints based on element type
  const getResizeConstraints = (detectedType) => {
    switch (detectedType) {
      case 'icon':
        return { minWidth: 16, minHeight: 16, maxWidth: 200, maxHeight: 200 };
      case 'image':
        return { minWidth: 40, minHeight: 40, maxWidth: 600, maxHeight: 600 };
      case 'button':
        return { minWidth: 60, minHeight: 28, maxWidth: 400, maxHeight: 100 };
      default:
        return { minWidth: 20, minHeight: 20, maxWidth: 800, maxHeight: 600 };
    }
  };
  
  // Only process single child elements
  if (Children.count(children) !== 1 || !isValidElement(children)) {
    return children;
  }
  
  const child = Children.only(children);
  const detectedType = getElementType(child);
  const constraints = getResizeConstraints(detectedType);
  
  // Create resize handles
  const createResizeHandle = useCallback(() => {
    const handle = document.createElement('div');
    
    // Handle styles for smooth Webflow-like experience
    Object.assign(handle.style, {
      position: 'absolute',
      bottom: '-6px',
      right: '-6px',
      width: '12px',
      height: '12px',
      backgroundColor: '#3b82f6',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: 'se-resize',
      opacity: '0',
      transform: 'scale(0.8)',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: '1000',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      pointerEvents: 'auto'
    });
    
    return handle;
  }, []);
  
  // Handle mouse events for resizing
  const handleMouseDown = useCallback((e) => {
    if (disabled || !elementRef.current || !containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = elementRef.current;
    const container = containerRef.current;
    const rect = element.getBoundingClientRect();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    
    setIsResizing(true);
    setInitialSize({ width: startWidth, height: startHeight });
    setGhostSize({ width: startWidth, height: startHeight });
    
    // Disable text selection and interactions
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    container.style.pointerEvents = 'auto';
    
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
      font-size: 12px;
      font-family: monospace;
      z-index: 9999;
      pointer-events: none;
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(tooltip);
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, startWidth + deltaX));
      let newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, startHeight + deltaY));
      
      // Maintain aspect ratio for icons and images
      if (detectedType === 'icon' || detectedType === 'image') {
        const aspectRatio = startWidth / startHeight;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      // Update ghost size for visual feedback
      setGhostSize({ width: newWidth, height: newHeight });
      
      // Update tooltip
      tooltip.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)}`;
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      
      // Apply final size to element
      if (ghostSize && elementRef.current) {
        const element = elementRef.current;
        
        // Apply new dimensions based on element type
        if (detectedType === 'icon') {
          element.style.width = `${ghostSize.width}px`;
          element.style.height = `${ghostSize.height}px`;
          
          // Clean up Tailwind size classes
          if (element.className) {
            const newClassName = element.className
              .replace(/w-\d+/g, '')
              .replace(/h-\d+/g, '')
              .trim();
            element.className = newClassName;
          }
        } else if (detectedType === 'image') {
          element.style.width = `${ghostSize.width}px`;
          element.style.height = `${ghostSize.height}px`;
          element.style.objectFit = 'cover';
        } else if (detectedType === 'button') {
          element.style.width = `${ghostSize.width}px`;
          element.style.height = `${ghostSize.height}px`;
          element.style.fontSize = `${Math.max(11, Math.min(20, ghostSize.height * 0.35))}px`;
          element.style.lineHeight = `${ghostSize.height - 4}px`;
        } else {
          element.style.width = `${ghostSize.width}px`;
          element.style.height = `${ghostSize.height}px`;
        }
        
        // Call resize callback
        if (onResize) {
          onResize(ghostSize, detectedType);
        }
      }
      
      // Clean up
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (container) container.style.pointerEvents = '';
      
      if (tooltip && document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
      
      setGhostSize(null);
      setInitialSize(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, constraints, detectedType, onResize, ghostSize]);
  
  // Setup resize handle
  useEffect(() => {
    if (disabled || !containerRef.current) return;
    
    const container = containerRef.current;
    const handle = createResizeHandle();
    
    // Add handle to container
    container.appendChild(handle);
    
    // Handle visibility on hover
    const showHandle = () => {
      setIsHovered(true);
      handle.style.opacity = '1';
      handle.style.transform = 'scale(1)';
    };
    
    const hideHandle = () => {
      if (!isResizing) {
        setIsHovered(false);
        handle.style.opacity = '0';
        handle.style.transform = 'scale(0.8)';
      }
    };
    
    // Event listeners
    handle.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseenter', showHandle);
    container.addEventListener('mouseleave', hideHandle);
    
    return () => {
      if (container.contains(handle)) {
        container.removeChild(handle);
      }
      handle.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseenter', showHandle);
      container.removeEventListener('mouseleave', hideHandle);
    };
  }, [disabled, createResizeHandle, handleMouseDown, isResizing]);
  
  // Clone the child element with enhanced styling
  const enhancedChild = cloneElement(child, {
    ...child.props,
    ref: elementRef,
    className: `${child.props.className || ''} ${className}`.trim(),
    style: {
      ...child.props.style,
      transition: isResizing ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      transformOrigin: 'top left',
    }
  });
  
  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        lineHeight: 0,
      }}
    >
      {enhancedChild}
      
      {/* Ghost overlay during resize for visual feedback */}
      {isResizing && ghostSize && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${ghostSize.width}px`,
            height: `${ghostSize.height}px`,
            border: '2px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: '999',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '-24px',
            left: '0',
            fontSize: '11px',
            color: '#3b82f6',
            fontWeight: '500',
            fontFamily: 'monospace',
            background: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {Math.round(ghostSize.width)} × {Math.round(ghostSize.height)}
          </div>
        </div>
      )}
      
      {/* Hover outline */}
      {isHovered && !isResizing && (
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            right: '-1px',
            bottom: '-1px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
};

/**
 * Higher-order component to automatically wrap resizable elements
 */
export const withWebflowResize = (WrappedComponent, options = {}) => {
  return React.forwardRef((props, ref) => {
    if (props.disableResize || options.disabled) {
      return <WrappedComponent ref={ref} {...props} />;
    }
    
    return (
      <WebflowResizer {...options} onResize={props.onResize}>
        <WrappedComponent ref={ref} {...props} />
      </WebflowResizer>
    );
  });
};

export default WebflowResizer;