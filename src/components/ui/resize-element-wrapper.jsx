"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

const ResizeWrapper = ({ 
  children,
  className,
  minWidth = 50,
  minHeight = 20,
  maxWidth = Infinity,
  maxHeight = Infinity,
  onResize,
  initialWidth,
  initialHeight,
  disabled = false,
  ...props 
}) => {
  const [size, setSize] = useState({ 
    width: initialWidth || 'auto', 
    height: initialHeight || 'auto',
    widthUnit: initialWidth ? '%' : 'auto',
    heightUnit: 'px'
  });
  const [naturalSize, setNaturalSize] = useState({ width: null, height: null });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef(null);

  // Capture natural dimensions and calculate initial percentage
  useEffect(() => {
    if (wrapperRef.current && !naturalSize.width && size.width === 'auto') {
      const rect = wrapperRef.current.getBoundingClientRect();
      
      // Find parent slot container
      let slotContainer = wrapperRef.current.parentElement;
      let searchDepth = 0;
      const maxSearchDepth = 5;
      
      while (slotContainer && searchDepth < maxSearchDepth) {
        const isSlotContainer = slotContainer.hasAttribute('data-grid-slot-id') ||
                                slotContainer.hasAttribute('data-slot-id') ||
                                slotContainer.className.includes('col-span-') ||
                                slotContainer.className.includes('responsive-slot');
        
        if (isSlotContainer) {
          break;
        }
        
        slotContainer = slotContainer.parentElement;
        searchDepth++;
        
        if (slotContainer === document.body) {
          slotContainer = null;
          break;
        }
      }
      
      const parentRect = slotContainer?.getBoundingClientRect();
      
      if (parentRect && parentRect.width > 0 && rect.width > 0) {
        const naturalPercentage = Math.min(100, (rect.width / parentRect.width) * 100);
        
        console.log('🎯 Natural size calculation:', {
          elementWidth: rect.width,
          slotWidth: parentRect.width,
          naturalPercentage: naturalPercentage.toFixed(1) + '%'
        });
        
        setNaturalSize({ width: rect.width, height: rect.height });
        setSize(prev => ({
          ...prev,
          width: Math.round(naturalPercentage * 10) / 10,
          widthUnit: '%'
        }));
      }
    }
  }, [naturalSize.width, size.width]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = wrapperRef.current.getBoundingClientRect();
    
    // Find the closest slot container for relative sizing
    // Look for the immediate container that represents the slot bounds
    let slotContainer = wrapperRef.current.parentElement;
    let searchDepth = 0;
    const maxSearchDepth = 5; // Prevent infinite loops
    
    while (slotContainer && searchDepth < maxSearchDepth) {
      // Check if this is a slot container (has slot identifier or grid column class)
      const isSlotContainer = slotContainer.hasAttribute('data-grid-slot-id') ||
                              slotContainer.hasAttribute('data-slot-id') ||
                              slotContainer.className.includes('col-span-') ||
                              slotContainer.className.includes('responsive-slot');
      
      if (isSlotContainer) {
        break;
      }
      
      slotContainer = slotContainer.parentElement;
      searchDepth++;
      
      if (slotContainer === document.body) {
        slotContainer = null;
        break;
      }
    }
    
    // Use slot container or fall back to immediate parent
    const parentRect = slotContainer?.getBoundingClientRect() || wrapperRef.current.parentElement?.getBoundingClientRect();
    
    console.log('🎯 Resize container detection:', {
      slotContainerFound: !!slotContainer,
      slotContainerClasses: slotContainer?.className || 'none',
      slotContainerWidth: parentRect?.width || 0,
      elementWidth: rect.width
    });
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Allow full width expansion up to parent container
      const maxAllowedWidth = parentRect ? parentRect.width - 20 : Infinity; // 20px padding
      const newWidth = Math.max(minWidth, Math.min(maxAllowedWidth, startWidth + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

      // Calculate percentage width based on parent container
      let widthValue = newWidth;
      let widthUnit = 'px';
      
      if (parentRect && parentRect.width > 0) {
        const widthPercentage = Math.max(1, Math.min(100, (newWidth / parentRect.width) * 100));
        widthValue = Math.round(widthPercentage * 10) / 10; // Round to 1 decimal place
        widthUnit = '%';
        
        console.log('📏 Width calculation:', {
          newWidth,
          parentWidth: parentRect.width,
          percentage: widthPercentage.toFixed(1) + '%'
        });
      }

      // Use min-height for more flexible vertical sizing
      let heightValue = newHeight;
      let heightUnit = 'px';
      
      // For very small heights, use auto to allow natural content flow
      if (newHeight <= 30) {
        heightValue = 'auto';
        heightUnit = '';
      }

      const newSize = { 
        width: widthValue, 
        height: heightValue,
        widthUnit,
        heightUnit
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
    // Use calculated size or natural fit-content
    width: size.width !== 'auto' && size.widthUnit !== 'auto' ? `${size.width}${size.widthUnit || 'px'}` : 'fit-content',
    height: 'auto',
    maxWidth: '100%',
    display: 'inline-block'
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
          ...(size.width !== 'auto' && size.widthUnit !== 'auto' && { width: `${size.width}${size.widthUnit || 'px'}` }),
          ...(size.height !== 'auto' && size.height && { minHeight: `${size.height}${size.heightUnit || 'px'}` }),
          maxWidth: '100%',
          boxSizing: 'border-box',
          display: 'block'
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
          {Math.round(size.width)}{size.widthUnit || 'px'} × {size.height === 'auto' ? 'auto' : Math.round(size.height) + (size.heightUnit || 'px')}
        </div>
      )}
    </div>
  );
};

export { ResizeWrapper };