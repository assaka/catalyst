"use client"

import React, { useState, useCallback, useRef } from 'react';
import { cn } from "@/lib/utils";

const ResizeWrapper = ({ 
  children,
  className,
  minWidth = 100,
  minHeight = 36,
  maxWidth = 400,
  maxHeight = 200,
  onResize,
  initialWidth,
  initialHeight,
  disabled = false,
  ...props 
}) => {
  const [size, setSize] = useState({ 
    width: initialWidth || 'auto', 
    height: initialHeight || 'auto',
    widthUnit: '%',
    heightUnit: 'px'
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = wrapperRef.current.getBoundingClientRect();
    const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));

      // Calculate percentage width based on parent container
      let widthValue = newWidth;
      let widthUnit = 'px';
      
      if (parentRect && parentRect.width > 0) {
        const widthPercentage = Math.min(100, Math.max(5, (newWidth / parentRect.width) * 100));
        widthValue = widthPercentage;
        widthUnit = '%';
      }

      const newSize = { 
        width: widthValue, 
        height: newHeight,
        widthUnit,
        heightUnit: 'px'
      };
      setSize(newSize);
      
      if (onResize) {
        onResize(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [minWidth, minHeight, maxWidth, maxHeight, onResize, disabled]);

  const wrapperStyle = {
    // Remove fixed dimensions from wrapper to let child handle its own sizing
    width: 'fit-content',
    height: 'fit-content',
  };

  return (
    <div 
      ref={wrapperRef}
      className={cn("relative inline-block group", className)}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      style={wrapperStyle}
      {...props}
    >
      {React.cloneElement(children, {
        className: cn(
          children.props.className,
          "resize-none select-none",
          isResizing && "cursor-se-resize"
        ),
        style: {
          ...children.props.style,
          ...(size.width !== 'auto' && { width: `${size.width}${size.widthUnit || 'px'}` }),
          ...(size.height !== 'auto' && { height: `${size.height}${size.heightUnit || 'px'}` }),
          minWidth: size.width !== 'auto' ? `${size.width}${size.widthUnit || 'px'}` : undefined,
          minHeight: size.height !== 'auto' ? `${size.height}${size.heightUnit || 'px'}` : undefined,
          boxSizing: 'border-box'
        }
      })}
      
      {/* Resize handle - diagonal resize icon in bottom right */}
      {!disabled && (
        <div
          className={cn(
            "absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10",
            "transition-opacity duration-200",
            "flex items-end justify-end",
            isHovered || isResizing ? "opacity-100" : "opacity-0"
          )}
          onMouseDown={handleMouseDown}
          style={{
            transform: 'translate(50%, 50%)'
          }}
        >
          {/* Diagonal lines icon */}
          <div className="w-3 h-3 relative">
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              className="absolute bottom-0 right-0 text-gray-500 hover:text-gray-700"
            >
              <path 
                d="M2,10 L10,2 M5,10 L10,5 M8,10 L10,8" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Size feedback tooltip during resize */}
      {isResizing && !disabled && (
        <div
          className="fixed top-4 right-4 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg z-50 pointer-events-none"
        >
          {Math.round(size.width)}{size.widthUnit || 'px'} × {Math.round(size.height)}{size.heightUnit || 'px'}
        </div>
      )}
    </div>
  );
};

export { ResizeWrapper };