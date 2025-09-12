"use client"

import React, { useRef } from 'react';
import { cn } from "@/lib/utils";
import useDirectResize from '@/hooks/useDirectResize';

/**
 * Example component showing direct resize without wrapper divs
 */
export const DirectResizableButton = ({ 
  children, 
  className, 
  onResize, 
  disabled = false,
  ...props 
}) => {
  const buttonRef = useRef(null);
  
  const { isResizing } = useDirectResize(buttonRef, {
    elementType: 'button',
    minWidth: 80,
    minHeight: 32,
    maxWidth: 300,
    maxHeight: 80,
    handlePosition: 'corner',
    onResize,
    disabled
  });

  return (
    <button
      ref={buttonRef}
      className={cn(
        "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
        isResizing && "select-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const DirectResizableIcon = ({ 
  icon: Icon, 
  className, 
  onResize, 
  disabled = false,
  size = 24,
  ...props 
}) => {
  const iconRef = useRef(null);
  
  const { isResizing } = useDirectResize(iconRef, {
    elementType: 'icon',
    minWidth: 16,
    minHeight: 16,
    maxWidth: 128,
    maxHeight: 128,
    handlePosition: 'corner',
    onResize,
    disabled
  });

  return (
    <div
      ref={iconRef}
      className={cn(
        "inline-flex items-center justify-center text-gray-700",
        isResizing && "select-none",
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {Icon ? <Icon size="100%" /> : <div className="w-full h-full bg-gray-300 rounded" />}
    </div>
  );
};

export const DirectResizableImage = ({ 
  src, 
  alt, 
  className, 
  onResize, 
  disabled = false,
  ...props 
}) => {
  const imageRef = useRef(null);
  
  const { isResizing } = useDirectResize(imageRef, {
    elementType: 'image',
    minWidth: 50,
    minHeight: 50,
    maxWidth: 400,
    maxHeight: 400,
    handlePosition: 'corner',
    onResize,
    disabled
  });

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={cn(
        "object-cover rounded",
        isResizing && "select-none",
        className
      )}
      {...props}
    />
  );
};

/**
 * Generic resizable wrapper - still no nested div, just applies hook to first child
 */
export const DirectResizable = ({ 
  children, 
  elementType = 'generic',
  handlePosition = 'corner',
  onResize,
  disabled = false,
  minWidth = 50,
  minHeight = 20,
  maxWidth = 400,
  maxHeight = 200
}) => {
  const elementRef = useRef(null);
  
  useDirectResize(elementRef, {
    elementType,
    handlePosition,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    onResize,
    disabled
  });

  // Clone the child and attach the ref - no wrapper div!
  return React.cloneElement(React.Children.only(children), {
    ref: elementRef,
    className: cn(children.props.className, "select-none")
  });
};

export default DirectResizableButton;