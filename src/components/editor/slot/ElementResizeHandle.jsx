import React, { useState, useCallback, useRef } from 'react';

const ElementResizeHandle = ({ 
  elementType, 
  slotId, 
  className,
  onResize, 
  position = 'bottom-right' 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const resizeRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    // Aggressively prevent all default behaviors and event bubbling
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    
    console.log(`🖱️ ElementResizeHandle: Mouse down on ${elementType} for slot ${slotId}`);
    
    const initialPos = { x: e.clientX, y: e.clientY };
    const initialSize = getCurrentSize();
    
    // Get parent container width for percentage calculations
    const parentElement = e.target.closest('[data-slot-id]');
    const parentWidth = parentElement ? parentElement.offsetWidth : 300;

    console.log(`📏 Initial size:`, initialSize, `Parent width: ${parentWidth}px`);

    setIsResizing(true);
    setStartPos(initialPos);
    setStartSize(initialSize);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialPos.x;
      const deltaY = moveEvent.clientY - initialPos.y;

      let newSize;
      if (elementType === 'icon' || elementType === 'image') {
        // For icons/images, calculate percentage-based width
        const newPixelWidth = Math.max(16, Math.min(parentWidth * 0.8, initialSize.width + deltaX));
        const widthPercentage = Math.round((newPixelWidth / parentWidth) * 100);
        newSize = { 
          widthPercentage: Math.max(5, Math.min(80, widthPercentage)),
          width: newPixelWidth, 
          height: newPixelWidth // Maintain aspect ratio
        };
      } else if (elementType === 'button') {
        // For buttons, calculate percentage-based width and scale font size proportionally
        const newPixelWidth = Math.max(60, Math.min(parentWidth * 0.9, initialSize.width + deltaX));
        const widthPercentage = Math.round((newPixelWidth / parentWidth) * 100);
        
        // Calculate font size based on width percentage (scale between text-xs and text-2xl)
        let fontSize = 'text-base';
        if (widthPercentage < 15) fontSize = 'text-xs';
        else if (widthPercentage < 25) fontSize = 'text-sm';
        else if (widthPercentage < 35) fontSize = 'text-base';
        else if (widthPercentage < 50) fontSize = 'text-lg';
        else if (widthPercentage < 70) fontSize = 'text-xl';
        else fontSize = 'text-2xl';
        
        newSize = {
          widthPercentage: Math.max(10, Math.min(90, widthPercentage)),
          width: newPixelWidth,
          height: Math.max(24, Math.min(120, initialSize.height + deltaY)),
          fontSize
        };
      }

      if (newSize && onResize) {
        console.log(`🔄 Resizing ${elementType} to:`, newSize);
        onResize(slotId, elementType, newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, elementType, onResize]);

  // Get current size from className or default values
  const getCurrentSize = () => {
    if (elementType === 'icon' || elementType === 'image') {
      // Check for percentage-based width first
      const widthPercentMatch = className.match(/w-\[(\d+)%\]/);
      if (widthPercentMatch) {
        const percentage = parseInt(widthPercentMatch[1]);
        // Get parent width for pixel calculation
        const parentElement = document.querySelector(`[data-slot-id="${slotId}"]`);
        const parentWidth = parentElement ? parentElement.offsetWidth : 300;
        const pixelWidth = Math.round((percentage / 100) * parentWidth);
        return { width: pixelWidth, height: pixelWidth, widthPercentage: percentage };
      }
      
      // Enhanced size detection for icons/images with Tailwind classes
      const wMatch = className.match(/w-(\d+)/);
      const hMatch = className.match(/h-(\d+)/);
      
      if (wMatch && hMatch) {
        const width = parseInt(wMatch[1]) * 4; // Convert Tailwind units to pixels
        const height = parseInt(hMatch[1]) * 4;
        return { width, height };
      } else if (wMatch) {
        const size = parseInt(wMatch[1]) * 4;
        return { width: size, height: size };
      }
      return { width: 64, height: 64 }; // Default w-16 h-16
    } else if (elementType === 'button') {
      // Check for percentage-based width first
      const widthPercentMatch = className.match(/w-\[(\d+)%\]/);
      if (widthPercentMatch) {
        const percentage = parseInt(widthPercentMatch[1]);
        // Get parent width for pixel calculation
        const parentElement = document.querySelector(`[data-slot-id="${slotId}"]`);
        const parentWidth = parentElement ? parentElement.offsetWidth : 300;
        const pixelWidth = Math.round((percentage / 100) * parentWidth);
        return { width: pixelWidth, height: 36, widthPercentage: percentage };
      }
      
      // For buttons, estimate size based on text size and padding
      const textSizeMatch = className.match(/text-(xs|sm|base|lg|xl|2xl)/);
      const pxMatch = className.match(/px-(\d+)/);
      const pyMatch = className.match(/py-(\d+(?:\.\d+)?)/);
      
      let width = 120; // base width
      let height = 36; // base height
      
      // Adjust based on text size
      if (textSizeMatch) {
        const sizeMap = { 
          xs: { w: 0.7, h: 0.8 }, 
          sm: { w: 0.85, h: 0.9 }, 
          base: { w: 1, h: 1 }, 
          lg: { w: 1.2, h: 1.1 }, 
          xl: { w: 1.4, h: 1.2 },
          '2xl': { w: 1.6, h: 1.3 }
        };
        const multiplier = sizeMap[textSizeMatch[1]] || { w: 1, h: 1 };
        width *= multiplier.w;
        height *= multiplier.h;
      }
      
      // Adjust based on padding
      if (pxMatch) {
        const px = parseInt(pxMatch[1]) * 4; // Convert to pixels
        width += px * 2; // Padding on both sides
      }
      
      if (pyMatch) {
        const py = parseFloat(pyMatch[1]) * 4; // Convert to pixels
        height += py * 2; // Padding on top and bottom
      }
      
      return { width: Math.max(60, width), height: Math.max(24, height) };
    }
    return { width: 64, height: 64 };
  };

  const getHandleStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: '16px',
      height: '16px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      border: '2px solid #ffffff',
      borderRadius: '3px',
      cursor: 'nw-resize',
      zIndex: 1000,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      pointerEvents: 'auto',
      userSelect: 'none',
      opacity: 0.8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    // Position the handle at the corner of the element, slightly outside
    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: '-2px', right: '-2px', cursor: 'se-resize' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '-2px', left: '-2px', cursor: 'sw-resize' };
      case 'top-right':
        return { ...baseStyle, top: '-2px', right: '-2px', cursor: 'ne-resize' };
      case 'top-left':
        return { ...baseStyle, top: '-2px', left: '-2px', cursor: 'nw-resize' };
      default:
        return { ...baseStyle, bottom: '-2px', right: '-2px', cursor: 'se-resize' };
    }
  };

  console.log(`🔵 ElementResizeHandle rendering for ${elementType} in slot ${slotId}`);
  
  return (
    <div
      ref={resizeRef}
      style={getHandleStyle()}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }
      }}
      title={`Drag to resize ${elementType} ${getCurrentSize().widthPercentage ? '(' + getCurrentSize().widthPercentage + '% width)' : ''}`}
      className="group-hover:opacity-100 hover:opacity-100 hover:scale-110 transition-all duration-200"
    >
      {/* Resize icon - diagonal lines */}
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path 
          d="M8 0L0 8M6 0H8V2M0 6V8H2" 
          stroke="white" 
          strokeWidth="1" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default ElementResizeHandle;