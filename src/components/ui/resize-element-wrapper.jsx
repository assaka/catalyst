"use client"

/**
 * ResizeWrapper Component
 *
 * High-performance resize handle with extensive debugging
 *
 * Performance Optimizations:
 * 1. RequestAnimationFrame (RAF) - Batches visual updates to sync with browser paint cycle
 * 2. GPU Acceleration - Uses CSS transform: translateZ(0) and willChange during resize
 * 3. Transition Disabling - Removes CSS transitions during active resize for smoother updates
 * 4. Pending Update Pattern - Coalesces multiple mousemove events into single RAF update
 * 5. Frame Cancellation - Cancels pending RAF before scheduling new one to prevent queue buildup
 *
 * Debug Features:
 * - Console logging with emoji prefixes for easy filtering (🎯 🏁 ⚡ 📏 etc.)
 * - Real-time FPS counter displayed during resize
 * - Frame time tracking
 * - Performance metrics in console
 * - Element type detection logging
 * - Container boundary logging
 *
 * To view debug logs, open console and filter by "[RESIZE DEBUG]"
 */

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

  const [size, setSize] = useState(() => {
    return getInitialDimensions();
  });
  const [naturalSize, setNaturalSize] = useState({ width: null, height: null });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, frameTime: 0 });
  const wrapperRef = useRef(null);
  const perfStatsRef = useRef({ frameCount: 0, lastUpdate: performance.now() });
  const saveTimeoutRef = useRef(null);
  
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

  // Check element types
  const isButton = isButtonElement(children);
  // Detect text elements: span, h1-h6, p, or has text/name/price/description in slot ID
  const isTextElement = ['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(children?.type) ||
                        children?.props?.['data-slot-id']?.match(/(text|name|price|description|title|heading)/);

  // Capture natural dimensions and calculate initial percentage
  useEffect(() => {
    if (disabled) {
      return;
    }

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
        const hasWFitClass = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

        setNaturalSize({ width: rect.width, height: rect.height });

        // For w-fit elements, don't set an initial width
        if (hasWFitClass) {
          return;
        }

        // For text elements without explicit width, keep fit-content
        const existingWidth = children?.props?.style?.width;
        if (isTextElement && !existingWidth) {
          return;
        }

        const newWidth = Math.round(naturalPercentage * 10) / 10;
        const newWidthUnit = '%';

        setSize(prev => ({
          ...prev,
          width: newWidth,
          widthUnit: newWidthUnit
        }));
      }
    }
  }, [disabled, naturalSize.width, size.width, children, className, isTextElement]);

  // Monitor parent size changes and auto-shrink text elements to prevent overflow
  // DISABLE during hover and resize to prevent infinite loops
  useEffect(() => {
    if (disabled || !isTextElement || !wrapperRef.current || isHovered || isResizing) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const parentRect = entry.contentRect;
        const currentWidth = size.width;

        // If text element is wider than parent slot, shrink it to fit
        if (currentWidth !== 'auto' && parentRect.width > 0) {
          const maxAllowedWidth = parentRect.width - 10;
          if (currentWidth > maxAllowedWidth) {
            setSize(prevSize => ({
              ...prevSize,
              width: maxAllowedWidth,
              widthUnit: 'px'
            }));

            if (onResize) {
              onResize({
                width: maxAllowedWidth,
                height: size.height,
                widthUnit: 'px',
                heightUnit: size.heightUnit
              });
            }
          }
        }
      }
    });

    // Find the slot container to observe
    let slotContainer = wrapperRef.current.closest('[data-grid-slot-id]') || wrapperRef.current.parentElement;

    if (slotContainer) {
      observer.observe(slotContainer);
    }

    return () => {
      observer.disconnect();
    };
  }, [disabled, isTextElement, size.width, size.height, size.heightUnit, onResize, isHovered, isResizing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;

    // CRITICAL: Prevent parent drag events from firing
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }

    console.log('🎯 [RESIZE DEBUG] Mouse down', { x: e.clientX, y: e.clientY });

    // CRITICAL: Capture pointer events to this element
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const rect = wrapperRef.current.getBoundingClientRect();

    // Find the grid slot container for resize bounds
    let slotContainer = wrapperRef.current.closest('[data-grid-slot-id]');

    // Fallback to searching for other slot indicators
    if (!slotContainer) {
      let searchElement = wrapperRef.current.parentElement;
      let searchDepth = 0;
      const maxSearchDepth = 10;

      while (searchElement && searchDepth < maxSearchDepth) {
        const isSlotContainer = searchElement.hasAttribute('data-slot-id') ||
                                searchElement.className.includes('col-span-') ||
                                searchElement.className.includes('responsive-slot') ||
                                searchElement.className.includes('grid-cols-') ||
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

    // Check if we're in a responsive container (mobile/tablet mode)
    const responsiveContainer = document.querySelector('.responsive-container');
    const responsiveContainerRect = responsiveContainer?.getBoundingClientRect();

    // If responsive container exists and has a constrained width, use it as the viewport
    const effectiveViewportWidth = responsiveContainerRect && responsiveContainerRect.width < (viewportWidth - sidebarWidth)
      ? responsiveContainerRect.right - 20  // Use responsive container's right edge
      : viewportWidth - sidebarWidth;

    const elementLeft = rect.left;
    const maxAllowableRight = effectiveViewportWidth;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);

    // Performance tracking
    let frameCount = 0;
    let lastFrameTime = performance.now();
    let animationFrameId = null;

    // Pre-calculate element types once (not on every mousemove)
    const isButton = isButtonElement(children);
    const isText = children?.type === 'span' || children?.props?.['data-slot-id']?.includes('text');
    const hasWFit = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

    console.log('🎯 [RESIZE DEBUG] Starting drag with element types:', { isButton, isText, hasWFit });

    const handleMouseMove = (moveEvent) => {
      console.log('🖱️ [RESIZE] MouseMove', { x: moveEvent.clientX, y: moveEvent.clientY });

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      console.log('📏 [RESIZE] Delta', { deltaX, deltaY, startX, startY, startWidth, startHeight });

      // Only apply sizing if there's significant movement (prevents jumping on click)
      if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) {
        console.log('⏭️ [RESIZE] Movement too small, skipping');
        return;
      }

      // Cancel any pending animation frame to avoid queueing
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Schedule update for next frame
      animationFrameId = requestAnimationFrame(() => {
        const currentTime = performance.now();

        // Calculate maximum allowed width
        const maxWidthFromViewport = maxAllowableRight - elementLeft;
        let maxAllowedWidth;

        if (isButton) {
          maxAllowedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
        } else if (isText) {
          const slotConstrainedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
          const currentTextWidth = startWidth + deltaX;
          maxAllowedWidth = currentTextWidth > slotConstrainedWidth ? slotConstrainedWidth : maxWidthFromViewport;
        } else {
          maxAllowedWidth = parentRect ? Math.min(parentRect.width - 10, maxWidthFromViewport) : maxWidthFromViewport;
        }

        // Calculate new dimensions
        const effectiveMinWidth = isText ? 20 : minWidth;
        const newWidth = Math.max(effectiveMinWidth, Math.min(maxAllowedWidth, startWidth + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

        console.log('📐 [RESIZE] Calculated dimensions', {
          newWidth,
          newHeight,
          maxAllowedWidth,
          effectiveMinWidth,
          isButton,
          isText
        });

        // Calculate width units
        let widthValue = newWidth;
        let widthUnit = 'px';

        if (isText || hasWFit) {
          widthValue = Math.max(20, newWidth);
          widthUnit = 'px';
        } else if (parentRect && parentRect.width > 0 && size.widthUnit === '%') {
          const widthPercentage = Math.max(1, Math.min(100, (newWidth / parentRect.width) * 100));
          widthValue = Math.round(widthPercentage * 10) / 10;
          widthUnit = '%';
        }

        // Calculate height
        let heightValue = newHeight;
        let heightUnit = 'px';
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

        console.log('✅ [RESIZE] Applying size', newSize);

        // Apply update to visual immediately
        setSize(newSize);

        // Debounce save callback - only call after 1 second of no changes
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          if (onResize) {
            console.log('💾 [RESIZE] Saving after 1s delay', newSize);
            onResize(newSize);
          }
        }, 1000);

        // Update FPS counter
        const timeSinceLastUpdate = currentTime - perfStatsRef.current.lastUpdate;
        const currentFPS = timeSinceLastUpdate > 0 ? Math.round(1000 / timeSinceLastUpdate) : 0;
        setPerformanceStats({
          fps: currentFPS,
          frameTime: timeSinceLastUpdate
        });

        perfStatsRef.current.lastUpdate = currentTime;
        frameCount++;
      });
    };

    const handleMouseUp = (upEvent) => {
      console.log('🏁 [RESIZE DEBUG] Drag completed', { frames: frameCount });

      // Cancel any pending RAF
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Clear debounce timer and save immediately on mouse up
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Save final size immediately on release
      if (onResize && size) {
        console.log('💾 [RESIZE] Saving final size on mouse up', size);
        onResize(size);
      }

      // Release pointer capture
      if (upEvent.pointerId !== undefined && e.currentTarget) {
        try {
          e.currentTarget.releasePointerCapture(upEvent.pointerId);
        } catch (err) {
          console.warn('Could not release pointer', err);
        }
      }

      setIsResizing(false);

      // Remove event listeners
      e.currentTarget.removeEventListener('pointermove', handleMouseMove);
      e.currentTarget.removeEventListener('pointerup', handleMouseUp);
      e.currentTarget.removeEventListener('pointercancel', handleMouseUp);
    };

    // CRITICAL: Attach to handle element using pointer events, not document with mouse events
    const handleElement = e.currentTarget;
    handleElement.addEventListener('pointermove', handleMouseMove);
    handleElement.addEventListener('pointerup', handleMouseUp);
    handleElement.addEventListener('pointercancel', handleMouseUp);

    console.log('👂 [RESIZE DEBUG] Event listeners attached to handle element (pointermove, pointerup, pointercancel)');
  }, [minWidth, minHeight, maxWidth, maxHeight, onResize, disabled, children, className, size.widthUnit]);

  // Check if this is an image element
  const isImageElement = children?.type === 'img' ||
                        children?.props?.src ||
                        (children?.props?.className && children.props.className.includes('object-cover'));

  const wrapperStyle = {
    // For buttons and images, wrapper should be full width
    // For text elements, use inline-block with fit-content so handle positions at text edge
    width: (isButton || isImageElement) ? '100%' : 'fit-content',
    height: 'fit-content',
    // Remove maxWidth constraint for text elements to allow free resizing beyond parent
    // Only apply maxWidth constraint for non-button and non-text elements
    ...(isButton || isTextElement ? { maxWidth: 'none', overflow: 'visible' } : { maxWidth: '100%' }),
    display: (isButton || isImageElement) ? 'block' : 'inline-block',
    position: 'relative',
    // Performance optimizations during resize
    ...(isResizing && {
      willChange: 'width, height',
      transform: 'translateZ(0)', // Force GPU acceleration
    })
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
      style: (() => {
        // Apply width if we have a calculated size (not 'auto')
        const widthStyle = !disabled && (size.width !== 'auto' && size.widthUnit !== 'auto') ?
          { width: `${size.width}${size.widthUnit || 'px'}` } :
          hasWFitClass ? { width: 'fit-content' } : {};

        return {
          ...children.props.style,
          // Apply size directly to the button element - always use calculated width if available
          // Don't apply width if disabled
          ...widthStyle,
          ...(size.height !== 'auto' && size.height && {
            minHeight: `${size.height}${size.heightUnit || 'px'}`,
            height: `${size.height}${size.heightUnit || 'px'}`
          }),
          boxSizing: 'border-box',
          // Use outline instead of border to avoid layout shifts
          outline: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'),
          outlineOffset: '-1px',
          transition: isResizing ? 'none' : 'outline 0.2s ease-in-out',
          position: 'relative',
          // Ensure button displays properly during resize
          display: children.props.style?.display || 'inline-block',
          // Performance optimizations during resize
          ...(isResizing && {
            willChange: 'width, height',
            transform: 'translateZ(0)', // Force GPU acceleration
          })
        };
      })(),
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
        className={cn("relative w-full", isHovered && "ring-2 ring-blue-300")}
        style={wrapperStyle}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
      >
        {buttonElement}
        {/* Resize handle positioned relative to container */}
        {!disabled && (
          <div
            className={cn(
              "absolute cursor-se-resize z-[150]",
              "transition-opacity duration-200",
              "flex items-center justify-center",
              isHovered || isResizing ? "opacity-100" : "opacity-0 hover:opacity-100"
            )}
            draggable={false}
            onPointerDown={handleMouseDown}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            style={{
              bottom: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              background: 'rgba(239, 68, 68, 0.9)',
              borderRadius: '0 0 4px 0',
              border: '2px solid rgba(220, 38, 38, 1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              pointerEvents: 'all'
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
        {/* Size feedback tooltip during resize with performance stats */}
        {isResizing && !disabled && (
          <div
            className="fixed top-4 right-4 bg-black/90 text-white text-xs font-mono px-4 py-2 rounded-lg shadow-2xl z-50 pointer-events-none border border-blue-500/30"
          >
            <div className="font-bold text-blue-300 mb-1">📏 Resize Debug</div>
            <div className="space-y-0.5">
              <div>
                <span className="text-gray-400">Size:</span>{' '}
                <span className="font-semibold text-white">
                  {Math.round(size.width)}{size.widthUnit || 'px'} × {size.height === 'auto' ? 'auto' : Math.round(size.height) + (size.heightUnit || 'px')}
                </span>
              </div>
              <div>
                <span className="text-gray-400">FPS:</span>{' '}
                <span className={`font-semibold ${performanceStats.fps >= 50 ? 'text-green-400' : performanceStats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {performanceStats.fps}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Frame:</span>{' '}
                <span className="text-white">{performanceStats.frameTime.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For non-button elements, use the wrapper div approach
  return (
    <div
      ref={wrapperRef}
      className={cn("relative group", className)}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={(e) => {
        if (!disabled) {
          setIsHovered(false);
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
        style: (() => {
          // For text elements, remove any existing width property to avoid constraints
          const { width: existingWidth, ...baseStyles } = children.props.style || {};
          const stylesWithoutWidth = isTextElement ? baseStyles : children.props.style;

          return {
            ...stylesWithoutWidth,
            // Apply calculated width if available
            // Don't apply width if disabled
            ...(disabled ? {} :
                hasWFitClass && size.width === 'auto' ? { width: 'fit-content' } :
                (size.width !== 'auto' && size.widthUnit !== 'auto') ?
                { width: `${size.width}${size.widthUnit || 'px'}` } : {}),
            ...(size.height !== 'auto' && size.height && {
              minHeight: `${size.height}${size.heightUnit || 'px'}`,
              height: isSvgElement(children) ? `${size.height}${size.heightUnit || 'px'}` : undefined
            }),
            boxSizing: 'border-box',
            display: children.props.style?.display || 'inline-block',
            // Use outline instead of border to avoid layout shifts
            outline: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'),
            outlineOffset: '-1px',
            borderRadius: '4px',
            transition: isResizing ? 'none' : 'outline 0.2s ease-in-out',
            position: 'relative',
            // Allow text wrapping for text elements
            ...(isTextElement ? {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            } : {}),
            // Performance optimizations during resize
            ...(isResizing && {
              willChange: 'width, height',
              transform: 'translateZ(0)', // Force GPU acceleration
            }),
            // Special handling for SVG elements
            ...(isSvgElement(children) ? {
              objectFit: 'contain'
            } : {})
          };
        })(),
        // Add preserveAspectRatio for SVGs to maintain proper scaling
        ...(isSvgElement(children) ? {
          preserveAspectRatio: children.props?.preserveAspectRatio || "xMidYMid meet"
        } : {})
      })}
      
      {/* Resize handle - positioned exactly at border corner */}
      {!disabled && (
        <div
          className={cn(
            "absolute cursor-se-resize z-[150]",
            "transition-opacity duration-200",
            "flex items-center justify-center",
            isHovered || isResizing ? "opacity-100" : "opacity-0 hover:opacity-100"
          )}
          draggable={false}
          onPointerDown={handleMouseDown}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            bottom: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            background: 'rgba(239, 68, 68, 0.9)',
            borderRadius: '0 0 4px 0',
            border: '2px solid rgba(220, 38, 38, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'all'
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

      {/* Size feedback tooltip during resize with performance stats */}
      {isResizing && !disabled && (
        <div
          className="fixed top-4 right-4 bg-black/90 text-white text-xs font-mono px-4 py-2 rounded-lg shadow-2xl z-50 pointer-events-none border border-blue-500/30"
        >
          <div className="font-bold text-blue-300 mb-1">📏 Resize Debug</div>
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-400">Size:</span>{' '}
              <span className="font-semibold text-white">
                {Math.round(size.width)}{size.widthUnit || 'px'} × {size.height === 'auto' ? 'auto' : Math.round(size.height) + (size.heightUnit || 'px')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">FPS:</span>{' '}
              <span className={`font-semibold ${performanceStats.fps >= 50 ? 'text-green-400' : performanceStats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceStats.fps}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Frame:</span>{' '}
              <span className="text-white">{performanceStats.frameTime.toFixed(2)}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ResizeWrapper };