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
    const initialDims = getInitialDimensions();
    console.log('🎬 [RESIZE DEBUG] Component initializing', {
      initialDimensions: initialDims,
      hasWFitClass,
      childType: children?.type,
      slotId: children?.props?.['data-slot-id'],
      className
    });
    return initialDims;
  });
  const [naturalSize, setNaturalSize] = useState({ width: null, height: null });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, frameTime: 0 });
  const wrapperRef = useRef(null);
  const perfStatsRef = useRef({ frameCount: 0, lastUpdate: performance.now() });
  
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
    console.log('🔄 [RESIZE DEBUG] Natural size useEffect triggered', {
      disabled,
      hasNaturalWidth: !!naturalSize.width,
      currentWidth: size.width,
      hasWrapperRef: !!wrapperRef.current
    });

    if (disabled) {
      console.log('⏸️ [RESIZE DEBUG] Natural size capture skipped - component disabled');
      return;
    }

    if (wrapperRef.current && !naturalSize.width && size.width === 'auto') {
      const rect = wrapperRef.current.getBoundingClientRect();
      console.log('📐 [RESIZE DEBUG] Capturing natural dimensions', {
        rectWidth: rect.width,
        rectHeight: rect.height
      });
      
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

        console.log('💾 [RESIZE DEBUG] Setting natural size', {
          naturalWidth: rect.width,
          naturalHeight: rect.height,
          naturalPercentage
        });
        setNaturalSize({ width: rect.width, height: rect.height });

        // For w-fit elements, don't set an initial width - let them size naturally
        // Only apply width when user manually resizes
        if (hasWFitClass) {
          console.log('🏷️ [RESIZE DEBUG] w-fit element detected, keeping width: auto', {
            hasWFitClass
          });
          // Keep width as 'auto' for w-fit elements
          return;
        }

        // For text elements, don't set width automatically - let them be fit-content
        // Only set width if explicitly resized by user (will be in children.props.style.width)
        const existingWidth = children?.props?.style?.width;
        if (isTextElement && !existingWidth) {
          console.log('📏 [RESIZE DEBUG] Text element without explicit width, keeping fit-content', {
            slotId: children?.props?.['data-slot-id'],
            isTextElement,
            existingWidth
          });
          return; // Keep width as 'auto'
        }

        const newWidth = Math.round(naturalPercentage * 10) / 10;
        const newWidthUnit = '%';

        console.log('✅ [RESIZE DEBUG] Setting initial percentage-based width', {
          newWidth,
          newWidthUnit,
          naturalPercentage
        });

        setSize(prev => ({
          ...prev,
          width: newWidth,
          widthUnit: newWidthUnit
        }));
      }
    }
  }, [disabled, naturalSize.width, size.width, children, className, isTextElement]);

  // Monitor parent size changes and auto-shrink text elements to prevent overflow
  useEffect(() => {
    console.log('🔄 [RESIZE DEBUG] ResizeObserver useEffect triggered', {
      disabled,
      isTextElement,
      hasWrapperRef: !!wrapperRef.current
    });

    if (disabled || !isTextElement || !wrapperRef.current) {
      console.log('⏸️ [RESIZE DEBUG] ResizeObserver skipped', {
        disabled,
        isTextElement,
        hasWrapperRef: !!wrapperRef.current
      });
      return;
    }

    console.log('👁️ [RESIZE DEBUG] Setting up ResizeObserver for text element overflow prevention');

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const parentRect = entry.contentRect;
        const currentWidth = size.width;

        console.log('📏 [RESIZE DEBUG] ResizeObserver fired', {
          parentWidth: parentRect.width,
          currentWidth,
          isAuto: currentWidth === 'auto'
        });

        // If text element is wider than parent slot, shrink it to fit
        if (currentWidth !== 'auto' && parentRect.width > 0) {
          const maxAllowedWidth = parentRect.width - 10; // 10px margin
          if (currentWidth > maxAllowedWidth) {
            console.log('⚠️ [RESIZE DEBUG] Text element overflow detected, shrinking', {
              currentWidth,
              maxAllowedWidth,
              parentWidth: parentRect.width
            });

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
    let slotContainer = wrapperRef.current.closest('[data-grid-slot-id]');
    if (!slotContainer) {
      slotContainer = wrapperRef.current.parentElement;
      console.log('🔍 [RESIZE DEBUG] Using parent element for ResizeObserver (no grid slot found)');
    } else {
      console.log('✅ [RESIZE DEBUG] Using grid slot container for ResizeObserver');
    }

    if (slotContainer) {
      observer.observe(slotContainer);
      console.log('👁️ [RESIZE DEBUG] ResizeObserver attached to slot container', {
        slotId: slotContainer.getAttribute('data-grid-slot-id'),
        className: slotContainer.className
      });
    } else {
      console.log('⚠️ [RESIZE DEBUG] No slot container found, ResizeObserver not attached');
    }

    return () => {
      console.log('🧹 [RESIZE DEBUG] Cleaning up ResizeObserver');
      observer.disconnect();
    };
  }, [disabled, isTextElement, size.width, size.height, size.heightUnit, onResize]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;

    console.log('🎯 [RESIZE DEBUG] Mouse down event triggered', {
      timestamp: performance.now(),
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target.className
    });

    const rect = wrapperRef.current.getBoundingClientRect();
    console.log('📏 [RESIZE DEBUG] Element dimensions', {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    });

    // Find the grid slot container for resize bounds
    // Priority: look for the actual grid slot container (data-grid-slot-id)
    let slotContainer = wrapperRef.current.closest('[data-grid-slot-id]');

    // Fallback to searching for other slot indicators if grid slot not found
    if (!slotContainer) {
      console.log('🔍 [RESIZE DEBUG] Searching for slot container...');
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
          console.log('✅ [RESIZE DEBUG] Found slot container at depth', searchDepth, {
            className: searchElement.className,
            id: searchElement.id,
            tagName: searchElement.tagName
          });
          break;
        }

        searchElement = searchElement.parentElement;
        searchDepth++;

        if (searchElement === document.body) {
          console.log('⚠️ [RESIZE DEBUG] Reached document body without finding slot container');
          break;
        }
      }
    } else {
      console.log('✅ [RESIZE DEBUG] Found slot container immediately via closest()');
    }

    // Use slot container or fall back to immediate parent
    const parentRect = slotContainer?.getBoundingClientRect() || wrapperRef.current.parentElement?.getBoundingClientRect();
    console.log('📦 [RESIZE DEBUG] Parent container dimensions', {
      width: parentRect?.width,
      height: parentRect?.height,
      hasSlotContainer: !!slotContainer
    });

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

    console.log('🖥️ [RESIZE DEBUG] Viewport calculations', {
      viewportWidth,
      sidebarWidth,
      effectiveViewportWidth,
      hasResponsiveContainer: !!responsiveContainer
    });

    const elementLeft = rect.left;
    const maxAllowableRight = effectiveViewportWidth;


    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    console.log('🎬 [RESIZE DEBUG] Starting drag operation', {
      startX,
      startY,
      startWidth,
      startHeight,
      elementLeft,
      maxAllowableRight
    });

    setIsResizing(true);

    // Performance tracking
    let frameCount = 0;
    let lastFrameTime = performance.now();
    let totalFrameTime = 0;
    let animationFrameId = null;
    let pendingUpdate = null;

    const handleMouseMove = (moveEvent) => {
      const moveStartTime = performance.now();

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Only apply sizing if there's significant movement (prevents jumping on click)
      const hasSignificantMovement = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
      if (!hasSignificantMovement) {
        console.log('⏸️ [RESIZE DEBUG] Movement too small, skipping', { deltaX, deltaY });
        return;
      }

      console.log('📍 [RESIZE DEBUG] Mouse move', {
        frameCount,
        deltaX,
        deltaY,
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
        movementX: moveEvent.movementX,
        movementY: moveEvent.movementY
      });

      // Check if this is a button element that should have flexible width
      const isButton = isButtonElement(children);
      const isTextElement = children?.type === 'span' || children?.props?.['data-slot-id']?.includes('text');
      const hasWFitClass = children?.props?.className?.includes('w-fit') || className?.includes('w-fit');

      console.log('🏷️ [RESIZE DEBUG] Element type detection', {
        isButton,
        isTextElement,
        hasWFitClass,
        elementType: children?.type,
        slotId: children?.props?.['data-slot-id']
      });

      // Calculate maximum allowed width considering viewport and sidebar constraints
      const maxWidthFromViewport = maxAllowableRight - elementLeft;

      let maxAllowedWidth;
      if (isButton) {
        // For buttons, constrain to slot container with margin for slot borders
        maxAllowedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
      } else if (isTextElement) {
        // For text elements, prevent overflow when slot shrinks
        const slotConstrainedWidth = parentRect ? parentRect.width - 10 : maxWidthFromViewport;
        // If text would overflow the slot, constrain it to slot width
        // Otherwise allow growth up to viewport bounds
        const currentTextWidth = startWidth + deltaX;
        if (currentTextWidth > slotConstrainedWidth) {
          maxAllowedWidth = slotConstrainedWidth;
        } else {
          maxAllowedWidth = maxWidthFromViewport;
        }
      } else {
        // For non-buttons and non-text, use more restrictive bounds with margin for slot borders
        maxAllowedWidth = parentRect ? Math.min(parentRect.width - 10, maxWidthFromViewport) : maxWidthFromViewport;
      }

      console.log('📐 [RESIZE DEBUG] Width constraints', {
        maxWidthFromViewport,
        maxAllowedWidth,
        parentRectWidth: parentRect?.width
      });

      // Use smaller minimum width for text elements to allow more flexibility
      const effectiveMinWidth = isTextElement ? 20 : minWidth;
      const newWidth = Math.max(effectiveMinWidth, Math.min(maxAllowedWidth, startWidth + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

      console.log('📊 [RESIZE DEBUG] Calculated dimensions', {
        newWidth,
        newHeight,
        effectiveMinWidth,
        minHeight,
        maxWidth: maxAllowedWidth,
        maxHeight
      });

      // Calculate width units based on element type and classes
      let widthValue = newWidth;
      let widthUnit = 'px';

      // For text elements and w-fit elements, use pixel units
      if (isTextElement || hasWFitClass) {
        // Text elements and w-fit elements can resize freely within viewport bounds
        const minWidth = 20;
        widthValue = Math.max(minWidth, newWidth);
        widthUnit = 'px';
        console.log('🔤 [RESIZE DEBUG] Using pixel units for text/w-fit', { widthValue, widthUnit });
      } else if (parentRect && parentRect.width > 0) {
        // For other elements, persist percentage-based sizing during resize
        // If element was originally using percentages, continue using percentages
        if (size.widthUnit === '%') {
          const widthPercentage = Math.max(1, Math.min(100, (newWidth / parentRect.width) * 100));
          widthValue = Math.round(widthPercentage * 10) / 10; // Round to 1 decimal place
          widthUnit = '%';
          console.log('📊 [RESIZE DEBUG] Using percentage units', { widthValue, widthUnit, widthPercentage });
        } else {
          // Otherwise use pixel-based sizing
          widthValue = newWidth;
          widthUnit = 'px';
          console.log('📏 [RESIZE DEBUG] Using pixel units (default)', { widthValue, widthUnit });
        }
      }

      // Use min-height for more flexible vertical sizing
      let heightValue = newHeight;
      let heightUnit = 'px';

      // For very small heights, use auto to allow natural content flow
      if (newHeight <= 30) {
        heightValue = 'auto';
        heightUnit = '';
        console.log('⬇️ [RESIZE DEBUG] Height too small, using auto', { newHeight });
      }

      const newSize = {
        width: widthValue,
        height: heightValue,
        widthUnit,
        heightUnit
      };

      // Store pending update instead of applying immediately
      pendingUpdate = newSize;

      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Schedule update for next frame using RAF for smooth performance
      animationFrameId = requestAnimationFrame(() => {
        if (pendingUpdate) {
          const rafStartTime = performance.now();
          const currentTime = performance.now();

          // Calculate FPS
          const timeSinceLastUpdate = currentTime - perfStatsRef.current.lastUpdate;
          const currentFPS = timeSinceLastUpdate > 0 ? Math.round(1000 / timeSinceLastUpdate) : 0;

          console.log('🎨 [RESIZE DEBUG] Applying size update via RAF', {
            frameCount,
            size: pendingUpdate,
            fps: currentFPS
          });

          setSize(pendingUpdate);

          if (onResize) {
            onResize(pendingUpdate);
          }

          const rafEndTime = performance.now();
          const rafDuration = rafEndTime - rafStartTime;

          // Update performance stats for display
          setPerformanceStats({
            fps: currentFPS,
            frameTime: rafDuration
          });

          console.log('⚡ [RESIZE DEBUG] RAF update completed', {
            rafDuration: rafDuration.toFixed(2) + 'ms',
            frameCount,
            fps: currentFPS
          });

          perfStatsRef.current.lastUpdate = currentTime;
          perfStatsRef.current.frameCount = frameCount;
          pendingUpdate = null;
          frameCount++;
        }
      });

      const moveEndTime = performance.now();
      const moveDuration = moveEndTime - moveStartTime;
      totalFrameTime += moveDuration;

      console.log('⏱️ [RESIZE DEBUG] MouseMove handler performance', {
        duration: moveDuration.toFixed(2) + 'ms',
        averageDuration: (totalFrameTime / Math.max(1, frameCount)).toFixed(2) + 'ms',
        frameCount
      });
    };

    const handleMouseUp = () => {
      const totalTime = performance.now() - lastFrameTime;
      const avgFPS = frameCount > 0 ? Math.round((frameCount / totalTime) * 1000) : 0;

      console.log('🏁 [RESIZE DEBUG] Drag operation completed', {
        totalFrames: frameCount,
        totalTime: totalTime.toFixed(2) + 'ms',
        averageFPS: avgFPS,
        averageFrameTime: frameCount > 0 ? (totalFrameTime / frameCount).toFixed(2) + 'ms' : '0ms'
      });

      // Cancel any pending RAF
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      console.log('✅ [RESIZE DEBUG] Event listeners removed, resize handle ready for next operation');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    console.log('👂 [RESIZE DEBUG] Event listeners attached (mousemove, mouseup)');
  }, [minWidth, minHeight, maxWidth, maxHeight, onResize, disabled, children, className, size.widthUnit]);

  // Check if this is an image element
  const isImageElement = children?.type === 'img' ||
                        children?.props?.src ||
                        (children?.props?.className && children.props.className.includes('object-cover'));

  const wrapperStyle = {
    // For buttons, text, and image elements, wrapper should be full width; for others, fit-content
    width: (isButton || isTextElement || isImageElement) ? '100%' : 'fit-content',
    height: 'fit-content',
    // Remove maxWidth constraint for text elements to allow free resizing beyond parent
    // Only apply maxWidth constraint for non-button and non-text elements
    ...(isButton || isTextElement ? { maxWidth: 'none', overflow: 'visible' } : { maxWidth: '100%' }),
    display: (isButton || isTextElement || isImageElement) ? 'block' : 'inline-block',
    position: 'relative',
    // Performance optimizations during resize
    ...(isResizing && {
      willChange: 'width, height',
      transform: 'translateZ(0)', // Force GPU acceleration
    })
  };

  console.log('🎨 [RESIZE DEBUG] Wrapper style computed', {
    isButton,
    isTextElement,
    isImageElement,
    isResizing,
    width: wrapperStyle.width,
    hasGPUAcceleration: isResizing
  });

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
          border: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.3)' : '1px dashed transparent'),
          transition: isResizing ? 'none' : 'border-color 0.2s ease-in-out',
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
            onMouseDown={handleMouseDown}
            style={{
              bottom: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              background: 'rgba(239, 68, 68, 0.9)',
              borderRadius: '0 0 4px 0',
              border: '2px solid rgba(220, 38, 38, 1)',
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
      className={cn("relative group", isTextElement ? "w-full" : "", className)}
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
        style: (() => {
          // For text elements, remove any existing width property to avoid constraints
          const { width: existingWidth, ...baseStyles } = children.props.style || {};
          const stylesWithoutWidth = isTextElement ? baseStyles : children.props.style;

          return {
            ...stylesWithoutWidth,
            // For text elements, always use fit-content (never apply saved width)
            // For elements with w-fit class that haven't been resized, use fit-content
            // For other elements, apply calculated width if available
            // Don't apply width if disabled
            ...(disabled ? {} :
                isTextElement ? { width: 'fit-content' } :
                hasWFitClass && size.width === 'auto' ? { width: 'fit-content' } :
                (size.width !== 'auto' && size.widthUnit !== 'auto') ?
                { width: `${size.width}${size.widthUnit || 'px'}` } : {}),
            ...(size.height !== 'auto' && size.height && {
              minHeight: `${size.height}${size.heightUnit || 'px'}`,
              height: isSvgElement(children) ? `${size.height}${size.heightUnit || 'px'}` : undefined
            }),
            boxSizing: 'border-box',
            display: children.props.style?.display || 'inline-block',
            border: hideBorder ? 'none' : (isHovered || isResizing ? '1px dashed rgba(59, 130, 246, 0.3)' : '1px dashed transparent'),
            borderRadius: '4px',
            transition: isResizing ? 'none' : 'border-color 0.2s ease-in-out',
            position: 'relative',
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
          onMouseDown={handleMouseDown}
          style={{
            bottom: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            background: 'rgba(239, 68, 68, 0.9)',
            borderRadius: '0 0 4px 0',
            border: '2px solid rgba(220, 38, 38, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
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