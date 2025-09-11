"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

/**
 * Direct element manipulation system - no wrapper divs!
 * Attaches controls directly to elements using CSS positioning and custom properties
 */
export const DirectElementControls = ({ 
  targetElement,
  onResize,
  onMove,
  disabled = false,
  elementType = 'text' // 'text', 'button', 'icon'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const intervalRef = useRef(null);

  // Update position when target element changes
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

  // Track element and show/hide controls
  useEffect(() => {
    if (!targetElement || disabled) return;

    updatePosition();

    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => !isDragging && !isResizing && setIsActive(false);
    const handleUpdate = () => updatePosition();

    // Attach event listeners directly to the element
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    // Position tracking
    intervalRef.current = setInterval(updatePosition, 100);
    
    return () => {
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetElement, disabled, updatePosition, isDragging, isResizing]);

  // Apply grid positioning directly to element
  const applyGridPosition = useCallback((colSpan = 12, rowSpan = 1, colStart = null) => {
    if (!targetElement) return;
    
    // Apply grid classes directly to the element
    const currentClasses = targetElement.className.split(' ').filter(Boolean);
    const newClasses = currentClasses.filter(cls => 
      !cls.startsWith('col-span-') && 
      !cls.startsWith('row-span-') && 
      !cls.startsWith('col-start-')
    );
    
    newClasses.push(`col-span-${colSpan}`, `row-span-${rowSpan}`);
    if (colStart) newClasses.push(`col-start-${colStart}`);
    
    targetElement.className = newClasses.join(' ');
    
    if (onMove) {
      onMove({ colSpan, rowSpan, colStart });
    }
  }, [targetElement, onMove]);

  // Resize element directly
  const resizeElement = useCallback((width, height) => {
    if (!targetElement) return;
    
    targetElement.style.width = `${width}px`;
    targetElement.style.height = `${height}px`;
    targetElement.style.minWidth = `${width}px`;
    targetElement.style.minHeight = `${height}px`;
    
    if (onResize) {
      onResize({ width, height });
    }
  }, [targetElement, onResize]);

  // Handle resize
  const handleResize = useCallback((e) => {
    if (disabled || !targetElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = position.width;
    const startHeight = position.height;

    setIsResizing(true);
    setIsActive(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.max(50, startWidth + deltaX);
      const newHeight = Math.max(20, startHeight + deltaY);

      resizeElement(newWidth, newHeight);
      
      setPosition(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, targetElement, position, resizeElement]);

  // Handle drag to move element within grid
  const handleDrag = useCallback((e) => {
    if (disabled || !targetElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setIsActive(true);

    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Visual feedback during drag
      targetElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      targetElement.style.zIndex = '1000';
      targetElement.style.opacity = '0.8';
    };

    const handleMouseUp = (upEvent) => {
      setIsDragging(false);
      
      // Reset visual feedback
      targetElement.style.transform = '';
      targetElement.style.zIndex = '';
      targetElement.style.opacity = '';

      // Calculate new grid position based on final position
      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;
      
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 30) {
        // Determine new grid position based on movement
        const colChange = Math.round(deltaX / 100); // Approximate column width
        const currentColSpan = parseInt(targetElement.className.match(/col-span-(\d+)/)?.[1] || '12');
        const newColSpan = Math.max(1, Math.min(12, currentColSpan + colChange));
        
        applyGridPosition(newColSpan, 1);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, targetElement, applyGridPosition]);

  if (!targetElement || disabled || !isActive) {
    return null;
  }

  const handleStyle = {
    position: 'fixed',
    zIndex: 2000,
    pointerEvents: 'auto'
  };

  return (
    <>
      {/* Resize handle - bottom right */}
      <div
        className={cn(
          "w-3 h-3 cursor-se-resize",
          "bg-blue-500 border border-white rounded-sm shadow-lg",
          "hover:scale-125 hover:bg-blue-600",
          "transition-all duration-200"
        )}
        style={{
          ...handleStyle,
          top: position.top + position.height - 6,
          left: position.left + position.width - 6,
        }}
        onMouseDown={handleResize}
        title="Resize element"
      />

      {/* Drag handle - top center */}
      <div
        className={cn(
          "w-6 h-2 cursor-move",
          "bg-green-500 border border-white rounded-sm shadow-lg",
          "hover:scale-110 hover:bg-green-600",
          "transition-all duration-200",
          "flex items-center justify-center"
        )}
        style={{
          ...handleStyle,
          top: position.top - 8,
          left: position.left + position.width / 2 - 12,
        }}
        onMouseDown={handleDrag}
        title="Move element"
      >
        <div className="w-1 h-1 bg-white rounded-full opacity-60" />
      </div>

      {/* Grid position controls */}
      <div
        className={cn(
          "px-2 py-1 text-xs font-mono",
          "bg-gray-900 text-white border border-gray-600 rounded shadow-lg",
          "transition-all duration-200"
        )}
        style={{
          ...handleStyle,
          top: position.top - 30,
          left: position.left,
        }}
      >
        <div className="flex gap-1">
          <button
            onClick={() => applyGridPosition(6, 1)}
            className="px-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
            title="Half width"
          >
            6
          </button>
          <button
            onClick={() => applyGridPosition(12, 1)}
            className="px-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
            title="Full width"
          >
            12
          </button>
        </div>
      </div>

      {/* Element type indicator */}
      <div
        className={cn(
          "px-2 py-1 text-xs font-semibold",
          "bg-purple-500 text-white rounded shadow-lg",
          "transition-all duration-200"
        )}
        style={{
          ...handleStyle,
          top: position.top + position.height + 4,
          left: position.left + position.width - 40,
        }}
      >
        {elementType}
      </div>
    </>
  );
};