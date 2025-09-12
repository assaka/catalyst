import React, { useRef, cloneElement, Children, isValidElement } from 'react';
import useDirectResize from '@/hooks/useDirectResize';

/**
 * WebflowResizer - Minimal wrapper that adds resize handles to elements
 * No extra classes, clean DOM structure
 */
export const WebflowResizer = ({ 
  children, 
  disabled = false, 
  onResize,
  elementType = 'auto',
  className = '',
}) => {
  const elementRef = useRef(null);
  
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
        return { minWidth: 16, minHeight: 16, maxWidth: 128, maxHeight: 128 };
      case 'image':
        return { minWidth: 40, minHeight: 40, maxWidth: 400, maxHeight: 400 };
      case 'button':
        return { minWidth: 60, minHeight: 32, maxWidth: 300, maxHeight: 80 };
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
  
  // Custom resize handler that updates element dimensions
  const handleResize = (newSize) => {
    if (elementRef.current) {
      const element = elementRef.current;
      
      // Apply new dimensions based on element type
      if (detectedType === 'icon') {
        // For icons, update dimensions and clean up size classes
        element.style.width = `${newSize.width}px`;
        element.style.height = `${newSize.height}px`;
        
        if (element.className) {
          const newClassName = element.className
            .replace(/w-\d+/g, '')
            .replace(/h-\d+/g, '')
            .trim();
          element.className = newClassName;
        }
      } else if (detectedType === 'image') {
        element.style.width = `${newSize.width}px`;
        element.style.height = `${newSize.height}px`;
        element.style.objectFit = 'cover';
      } else if (detectedType === 'button') {
        element.style.width = `${newSize.width}px`;
        element.style.height = `${newSize.height}px`;
        element.style.fontSize = `${Math.max(12, Math.min(18, newSize.height * 0.4))}px`;
      } else {
        element.style.width = `${newSize.width}px`;
        element.style.height = `${newSize.height}px`;
      }
    }
    
    if (onResize) {
      onResize(newSize, detectedType);
    }
  };
  
  // Use the resize hook directly on the element
  const { isResizing } = useDirectResize(elementRef, {
    elementType: detectedType,
    minWidth: constraints.minWidth,
    minHeight: constraints.minHeight,
    maxWidth: constraints.maxWidth,
    maxHeight: constraints.maxHeight,
    onResize: handleResize,
    disabled,
    handlePosition: 'corner'
  });
  
  // Clone the child element with the ref and minimal styling changes
  const enhancedChild = cloneElement(child, {
    ...child.props,
    ref: elementRef,
    className: `${child.props.className || ''} ${className}`.trim(),
    style: {
      ...child.props.style,
      position: 'relative', // Required for resize handles
      transition: isResizing ? 'none' : (child.props.style?.transition || ''),
      userSelect: isResizing ? 'none' : (child.props.style?.userSelect || ''),
    }
  });
  
  return enhancedChild;
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