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
  
  // Helper to check if element is an SVG or icon component
  const isSvgElement = (element) => {
    return element.type === 'svg' || 
           element.props?.viewBox !== undefined ||
           element.type?.displayName?.toLowerCase().includes('icon') ||
           element.type?.name?.toLowerCase().includes('icon');
  };

  // Helper to check if element is a button component
  const isButtonElement = (element) => {
    return element.type === 'button' || 
           element.props?.type === 'button' ||
           element.type?.displayName === 'Button' ||
           element.type?.name === 'Button' ||
           (element.props?.className && element.props.className.includes('justify-center')) || // Common button pattern
           (element.props?.role === 'button');
  };

  // Helper to clean conflicting size classes
  const cleanConflictingClasses = (className, element) => {
    if (!className) return className;
    
    let cleanedClasses = className;
    
    if (isButtonElement(element)) {
      // Remove width classes (w-auto, w-fit, w-max, etc.)
      cleanedClasses = cleanedClasses.replace(/\bw-\w+\b/g, '').trim();
    }
    
    if (isSvgElement(element)) {
      // Remove fixed width/height classes for SVGs
      cleanedClasses = cleanedClasses.replace(/\b[wh]-\d+\b/g, '').trim();
      cleanedClasses = cleanedClasses.replace(/\b[wh]-\w+\b/g, '').trim();
    }
    
    // Clean up multiple spaces
    return cleanedClasses.replace(/\s+/g, ' ').trim();
  };

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

  // Debug logging
  console.log('ResizeWrapper rendered:', { disabled, children: children?.type });

  return (
    <div
      ref={wrapperRef}
      className={cn("relative inline-block group", className)}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={(e) => {
        if (!disabled) {
          setIsHovered(false);
          // Remove all borders on mouseout
          if (wrapperRef.current) {
            wrapperRef.current.style.borderColor = '';
            wrapperRef.current.style.border = 'none';
          }
        }
      }}
      style={wrapperStyle}
      {...props}
    >
      {React.cloneElement(children, {
        className: cn(
          // Clean conflicting classes for better control
          cleanConflictingClasses(children.props.className, children),
          "resize-none select-none",
          isResizing && "cursor-se-resize",
          // Add our desired size classes
          isButtonElement(children) && "w-full",
          isSvgElement(children) && "w-full h-full"
        ),
        style: {
          ...children.props.style,
          // Don't set width on child since it's set on wrapper
          ...(size.height !== 'auto' && size.height && { 
            minHeight: `${size.height}${size.heightUnit || 'px'}`,
            height: isSvgElement(children) ? '100%' : undefined
          }),
          width: '100%', // Child takes full width of wrapper
          minWidth: '100%', // Force elements to respect full width
          maxWidth: '100%', // Prevent elements from shrinking
          boxSizing: 'border-box',
          display: 'block',
          border: isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.3)' : '1px dashed transparent',
          borderRadius: '4px',
          transition: 'border-color 0.2s ease-in-out',
          position: 'relative',
          // Special handling for SVG elements
          ...(isSvgElement(children) ? {
            objectFit: 'contain',
            width: '100%',
            height: '100%'
          } : {})
        },
        // Add preserveAspectRatio for SVGs to maintain proper scaling
        ...(isSvgElement(children) ? {
          preserveAspectRatio: children.props?.preserveAspectRatio || "xMidYMid meet"
        } : {})
      })}
      
      {/* Resize handle - positioned exactly at border corner */}
      {!disabled && (
        <div
          className={cn(
            "absolute cursor-se-resize z-20",
            "transition-opacity duration-200",
            "flex items-center justify-center",
"opacity-100"  // Always show for debugging
          )}
          onMouseDown={handleMouseDown}
          style={{
            bottom: '-2px',
            right: '-2px',
            width: '15px',
            height: '15px',
            background: 'rgba(255, 0, 0, 0.9)',  // Bright red for debugging
            borderRadius: '0 0 4px 0',
            border: '2px solid red',
            zIndex: 99999  // Very high z-index
          }}
        >
          {/* Small diagonal grip icon */}
          <svg 
            width="8" 
            height="8" 
            viewBox="0 0 8 8" 
            className="text-white"
          >
            <path 
              d="M1,7 L7,1 M3,7 L7,3 M5,7 L7,5" 
              stroke="currentColor" 
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
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