"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

/**
 * External resize handles that position themselves outside the target element
 * while keeping the DOM structure clean (no wrapper elements)
 */
const ExternalResizeHandles = ({ 
  targetElement,
  minWidth = 100,
  minHeight = 24,
  maxWidth = 800,
  maxHeight = 200,
  onResize,
  disabled = false,
  elementType = 'text' // 'text', 'button', 'icon'
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const intervalRef = useRef(null);

  // Update position when target element changes or resizes
  const updatePosition = useCallback(() => {
    if (!targetElement) return;
    
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setPosition({
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height
    });
  }, [targetElement]);

  // Track target element position
  useEffect(() => {
    if (!targetElement || disabled) return;

    updatePosition();
    
    // Update position periodically and on scroll/resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    // Start position tracking interval
    intervalRef.current = setInterval(updatePosition, 100);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetElement, disabled, updatePosition]);

  // Handle mouse events on target element for visibility
  useEffect(() => {
    if (!targetElement || disabled) return;

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => !isResizing && setIsVisible(false);
    
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetElement, disabled, isResizing]);

  const handleMouseDown = useCallback((e) => {
    if (disabled || !targetElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = position.width;
    const startHeight = position.height;

    setIsResizing(true);
    setIsVisible(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));

      // Apply size directly to target element
      if (targetElement) {
        targetElement.style.width = `${newWidth}px`;
        targetElement.style.height = `${newHeight}px`;
        targetElement.style.minWidth = `${newWidth}px`;
        targetElement.style.minHeight = `${newHeight}px`;
        targetElement.style.boxSizing = 'border-box';
      }

      // Update position for handles
      setPosition(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));

      // Call resize callback if provided
      if (onResize) {
        onResize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, targetElement, position.width, position.height, minWidth, minHeight, maxWidth, maxHeight, onResize]);

  if (!targetElement || disabled || (!isVisible && !isResizing)) {
    return null;
  }

  const handleStyle = {
    position: 'fixed',
    zIndex: 1000,
    pointerEvents: 'auto'
  };

  return (
    <>
      {/* Main resize handle - bottom right corner */}
      <div
        className={cn(
          "w-4 h-4 cursor-se-resize",
          "transition-opacity duration-200",
          "flex items-center justify-center",
          "bg-blue-500 border-2 border-white rounded-full shadow-lg",
          "hover:scale-110 hover:bg-blue-600",
          isVisible || isResizing ? "opacity-100" : "opacity-0"
        )}
        style={{
          ...handleStyle,
          top: position.top + position.height - 8,
          left: position.left + position.width - 8,
        }}
        onMouseDown={handleMouseDown}
        title={`Resize ${elementType}`}
      >
        <svg width="8" height="8" viewBox="0 0 12 12" className="text-white">
          <path 
            d="M2,10 L10,2 M5,10 L10,5 M8,10 L10,8" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      </div>

      {/* Additional handles for better UX */}
      {elementType === 'text' && (
        <>
          {/* Right edge handle */}
          <div
            className={cn(
              "w-2 h-6 cursor-e-resize",
              "bg-green-500 border-2 border-white rounded shadow-lg",
              "hover:scale-110 hover:bg-green-600",
              "transition-opacity duration-200",
              isVisible || isResizing ? "opacity-100" : "opacity-0"
            )}
            style={{
              ...handleStyle,
              top: position.top + position.height / 2 - 12,
              left: position.left + position.width - 4,
            }}
            title="Resize width"
          />
        </>
      )}
    </>
  );
};

export { ExternalResizeHandles };