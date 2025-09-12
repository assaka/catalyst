import React, { useRef, cloneElement, Children, isValidElement, useState, useCallback, useEffect } from 'react';

/**
 * WebflowResizer - Smooth, professional element resizing with Webflow-like UX
 * Uses React-based rendering for better compatibility
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
  const [showTooltip, setShowTooltip] = useState(false);
  
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
  
  // Handle mouse down on resize handle
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
    setGhostSize({ width: startWidth, height: startHeight });
    setShowTooltip(true);
    
    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = 'auto';
    }
    
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
        
        // Ensure constraints are still respected after aspect ratio calculation
        newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth));
        newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight));
      }
      
      setGhostSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setShowTooltip(false);
      
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
          element.style.lineHeight = `${Math.max(ghostSize.height - 8, 20)}px`;
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
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = '';
      }
      
      setGhostSize(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, constraints, detectedType, onResize, ghostSize]);
  
  // Clone the child element with enhanced styling
  const enhancedChild = cloneElement(child, {
    ...child.props,
    ref: elementRef,
    className: `${child.props.className || ''} ${className}`.trim(),
    style: {
      ...child.props.style,
      transition: isResizing ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  });
  
  if (disabled) {
    return enhancedChild;
  }
  
  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        lineHeight: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isResizing && setIsHovered(false)}
    >
      {enhancedChild}
      
      {/* Resize Handle */}
      {isHovered && !disabled && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '12px',
            height: '12px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'se-resize',
            opacity: isResizing ? 1 : 0.8,
            transform: isResizing ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
      )}
      
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
            zIndex: 999,
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '-28px',
            left: '0',
            fontSize: '11px',
            color: '#3b82f6',
            fontWeight: '600',
            fontFamily: 'ui-monospace, monospace',
            background: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb'
          }}>
            {Math.round(ghostSize.width)} × {Math.round(ghostSize.height)}
          </div>
        </div>
      )}
      
      {/* Size tooltip during resize */}
      {showTooltip && ghostSize && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'ui-monospace, monospace',
            zIndex: 9999,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          {Math.round(ghostSize.width)} × {Math.round(ghostSize.height)}
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