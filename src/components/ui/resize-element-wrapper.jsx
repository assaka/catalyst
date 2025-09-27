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
  hideBorder = false,
  ...props
}) => {
  // Check if element has w-fit class to determine initial units
  const hasWFitClass = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

  // Extract initial dimensions from existing styles
  const getInitialDimensions = () => {
    const existingWidth = children?.props?.style?.width;
    const existingHeight = children?.props?.style?.height;

    let width = initialWidth || 'auto';
    let widthUnit = 'auto';
    let height = initialHeight || 'auto';
    let heightUnit = 'px';

    // Check if this is a button element (simplified check without helper function)
    const isButton = children?.type === 'button' ||
                     children?.props?.type === 'button' ||
                     (children?.props?.className && (
                       children.props.className.includes('btn') ||
                       children.props.className.includes('button') ||
                       children.props.className.includes('Add to Cart')
                     ));

    if (existingWidth && existingWidth !== 'auto') {
      const match = existingWidth.match(/^(\d+(?:\.\d+)?)(.*)/);
      if (match) {
        width = parseFloat(match[1]);
        widthUnit = match[2] || 'px';

        // For buttons with percentage width, reset to auto to recalculate in pixels
        if (isButton && widthUnit === '%') {
          width = 'auto';
          widthUnit = 'auto';
        }
      }
    } else if (initialWidth) {
      widthUnit = hasWFitClass ? 'px' : '%';
    }

    if (existingHeight && existingHeight !== 'auto') {
      const match = existingHeight.match(/^(\d+(?:\.\d+)?)(.*)/);
      if (match) {
        height = parseFloat(match[1]);
        heightUnit = match[2] || 'px';
      }
    }

    return { width, height, widthUnit, heightUnit };
  };

  const [size, setSize] = useState(getInitialDimensions());
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
    if (!element || !element.type) return false;

    const isButton = element.type === 'button' ||
           element.props?.type === 'button' ||
           element.type?.displayName === 'Button' ||
           element.type?.name === 'Button' ||
           (element.props?.role === 'button') ||
           // Check if element has data-slot-id and is a button-like element
           (element.props?.['data-slot-id'] && element.type === 'button') ||
           // Check for common button CSS patterns
           (element.props?.className && (
             element.props.className.includes('btn') ||
             element.props.className.includes('button') ||
             element.props.className.includes('justify-center')
           ));

    return isButton;
  };

  // Helper to clean conflicting size classes
  const cleanConflictingClasses = (className, element) => {
    if (!className) return className;

    let cleanedClasses = className;

    if (isButtonElement(element)) {
      // Only remove width classes if w-fit is NOT present (preserve w-fit for natural sizing)
      if (!className.includes('w-fit')) {
        cleanedClasses = cleanedClasses.replace(/\bw-\w+\b/g, '').trim();
      }
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

        // Check if element has w-fit class (should use pixels for natural sizing)
        const hasWFitClass = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

        // Check if this is a button element - buttons should always use pixels
        const isButton = children?.type === 'button' ||
                        children?.props?.type === 'button' ||
                        (children?.props?.className && (
                          children.props.className.includes('btn') ||
                          children.props.className.includes('button') ||
                          children.props.className.includes('Add to Cart')
                        ));

        setNaturalSize({ width: rect.width, height: rect.height });
        setSize(prev => ({
          ...prev,
          width: (hasWFitClass || isButton) ? rect.width : Math.round(naturalPercentage * 10) / 10,
          widthUnit: (hasWFitClass || isButton) ? 'px' : '%'
        }));
      }
    }
  }, [naturalSize.width, size.width]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = wrapperRef.current.getBoundingClientRect();
    
    // Find the grid slot container for resize bounds
    // Priority: look for the actual grid slot container (data-grid-slot-id)
    let slotContainer = wrapperRef.current.closest('[data-grid-slot-id]');

    // Fallback to searching for other slot indicators if grid slot not found
    if (!slotContainer) {
      let searchElement = wrapperRef.current.parentElement;
      let searchDepth = 0;
      const maxSearchDepth = 10; // Increased search depth for nested structures

      while (searchElement && searchDepth < maxSearchDepth) {
        const isSlotContainer = searchElement.hasAttribute('data-slot-id') ||
                                searchElement.className.includes('col-span-') ||
                                searchElement.className.includes('responsive-slot') ||
                                searchElement.className.includes('grid-cols-') ||
                                // Additional patterns for button containers
                                searchElement.className.includes('grid') ||
                                searchElement.id?.includes('slot');

        if (isSlotContainer) {
          slotContainer = searchElement;
          break;
        }

        searchElement = searchElement.parentElement;
        searchDepth++;

        if (searchElement === document.body) {
          break;
        }
      }
    }
    
    // Use slot container or fall back to immediate parent
    const parentRect = slotContainer?.getBoundingClientRect() || wrapperRef.current.parentElement?.getBoundingClientRect();

    // Keep viewport calculation for non-button elements
    const viewportWidth = window.innerWidth;
    const mainContainer = document.querySelector('.min-h-screen');
    const hasSidebarPadding = mainContainer?.classList.contains('pr-80');
    const sidebarWidth = hasSidebarPadding ? 320 : 0;
    const effectiveViewportWidth = viewportWidth - sidebarWidth;
    const elementLeft = rect.left;
    const maxAllowableRight = effectiveViewportWidth - 20;

    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Only apply sizing if there's significant movement (prevents jumping on click)
      const hasSignificantMovement = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
      if (!hasSignificantMovement) return;


      // For buttons, allow more generous horizontal expansion
      // Check if this is a button element that should have flexible width
      const isButton = isButtonElement(children);
      const hasWFitClass = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

      // Calculate maximum allowed width considering viewport and sidebar constraints
      const maxWidthFromViewport = maxAllowableRight - elementLeft;

      let maxAllowedWidth;
      if (isButton && hasWFitClass) {
        // For w-fit buttons, constrain to slot container with margin for slot borders
        maxAllowedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
      } else if (isButton) {
        // For regular buttons, constrain to slot container with margin for slot borders
        maxAllowedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
      } else {
        // For non-buttons, use more restrictive bounds with margin for slot borders
        maxAllowedWidth = parentRect ? Math.min(parentRect.width - 10, maxWidthFromViewport) : maxWidthFromViewport;
      }

      const newWidth = Math.max(minWidth, Math.min(maxAllowedWidth, startWidth + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));


      // Calculate width units based on element type and classes
      let widthValue = newWidth;
      let widthUnit = 'px';

      // For buttons, prefer pixel units to allow unrestricted horizontal resizing
      if (isButton || hasWFitClass) {
        // Use pixels for buttons and w-fit elements to allow flexible sizing
        widthValue = newWidth;
        widthUnit = 'px';
      } else if (parentRect && parentRect.width > 0) {
        // For non-button elements, use percentage-based sizing
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

  const isButton = isButtonElement(children);
  const wrapperStyle = {
    // Wrapper should always be fit-content to not affect parent layout
    width: 'fit-content',
    height: 'fit-content',
    // Only apply maxWidth constraint for non-button elements
    ...(isButton ? {} : { maxWidth: '100%' }),
    display: 'inline-block',
    position: 'relative'
  };

  // For button elements, apply sizing and resize functionality directly to the button
  // without creating an extra wrapper div
  if (isButton) {

    const buttonElement = React.cloneElement(children, {
      ref: wrapperRef,
      className: cn(
        // Remove w-fit class when we have a calculated width to allow width override
        (size.width !== 'auto' && size.widthUnit !== 'auto') ?
          children.props.className?.replace(/\bw-fit\b/g, '').trim() :
          children.props.className,
        "resize-none select-none relative group",
        isResizing && "cursor-se-resize"
      ),
      style: {
        ...children.props.style,
        // Apply size directly to the button element - always use calculated width if available
        width: (size.width !== 'auto' && size.widthUnit !== 'auto') ?
               `${size.width}${size.widthUnit || 'px'}` :
               (hasWFitClass ? 'fit-content' : children.props.style?.width || 'auto'),
        ...(size.height !== 'auto' && size.height && {
          minHeight: `${size.height}${size.heightUnit || 'px'}`,
          height: `${size.height}${size.heightUnit || 'px'}`
        }),
        boxSizing: 'border-box',
        border: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.3)' : '1px dashed transparent'),
        transition: 'border-color 0.2s ease-in-out',
        position: 'relative',
        // Ensure button displays properly during resize
        display: children.props.style?.display || 'inline-block'
      },
      onMouseEnter: (e) => {
        if (!disabled) {
          setIsHovered(true);
        }
        // Call original onMouseEnter if it exists
        if (children.props.onMouseEnter) {
          children.props.onMouseEnter(e);
        }
      },
      onMouseLeave: (e) => {
        if (!disabled) {
          setIsHovered(false);
        }
        // Call original onMouseLeave if it exists
        if (children.props.onMouseLeave) {
          children.props.onMouseLeave(e);
        }
      }
      // Note: Don't override children or dangerouslySetInnerHTML - let them be handled by the original element
    });

    return (
      <div
        className={cn("relative inline-block", isHovered && "ring-2 ring-blue-300")}
        style={wrapperStyle}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
      >
        {buttonElement}
        {/* Resize handle positioned relative to container */}
        {!disabled && (
          <div
            className={cn(
              "absolute cursor-se-resize z-50",
              "transition-opacity duration-200",
              "flex items-center justify-center",
              isHovered || isResizing ? "opacity-100" : "opacity-0 hover:opacity-100"
            )}
            onMouseDown={handleMouseDown}
            style={{
              bottom: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              background: 'rgba(59, 130, 246, 0.9)',
              borderRadius: '0 0 4px 0',
              border: '2px solid rgba(59, 130, 246, 1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
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
  }

  // For non-button elements, use the wrapper div approach
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
          isResizing && "cursor-se-resize"
        ),
        style: {
          ...children.props.style,
          width: size.width !== 'auto' ? `${size.width}${size.widthUnit || 'px'}` : 'auto',
          height: size.height !== 'auto' ? `${size.height}${size.heightUnit || 'px'}` : 'auto',
          border: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.3)' : 'none'),
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
            isHovered || isResizing ? "opacity-100" : "opacity-0 hover:opacity-100"
          )}
          onMouseDown={handleMouseDown}
          style={{
            bottom: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            background: 'rgba(59, 130, 246, 0.8)',
            borderRadius: '0 0 4px 0',
            border: '1px solid rgba(59, 130, 246, 1)'
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