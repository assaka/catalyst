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
    e.preventDefault();
    e.stopPropagation();
    
    const initialPos = { x: e.clientX, y: e.clientY };
    const initialSize = getCurrentSize();

    setIsResizing(true);
    setStartPos(initialPos);
    setStartSize(initialSize);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialPos.x;
      const deltaY = moveEvent.clientY - initialPos.y;

      let newSize;
      if (elementType === 'icon' || elementType === 'image') {
        // For icons/images, maintain aspect ratio
        const delta = Math.max(deltaX, deltaY);
        const newDimension = Math.max(16, Math.min(128, initialSize.width + delta));
        newSize = { width: newDimension, height: newDimension };
      } else if (elementType === 'button') {
        // For buttons, allow independent width/height
        newSize = {
          width: Math.max(60, initialSize.width + deltaX),
          height: Math.max(24, initialSize.height + deltaY)
        };
      }

      if (newSize && onResize) {
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
      const sizeMatch = className.match(/w-(\d+)/);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]) * 4; // Convert Tailwind units to pixels
        return { width: size, height: size };
      }
      return { width: 64, height: 64 }; // Default w-16 h-16
    } else if (elementType === 'button') {
      // For buttons, estimate size based on text size and padding
      const textSizeMatch = className.match(/text-(xs|sm|base|lg|xl)/);
      const pxMatch = className.match(/px-(\d+)/);
      const pyMatch = className.match(/py-(\d+)/);
      
      let width = 100; // base width
      let height = 40; // base height
      
      if (textSizeMatch) {
        const sizeMap = { xs: 0.8, sm: 0.9, base: 1, lg: 1.2, xl: 1.4 };
        const multiplier = sizeMap[textSizeMatch[1]] || 1;
        width *= multiplier;
        height *= multiplier;
      }
      
      return { width, height };
    }
    return { width: 64, height: 64 };
  };

  const getHandleStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      background: '#3b82f6',
      border: '1px solid #ffffff',
      borderRadius: '50%',
      cursor: 'se-resize',
      zIndex: 40,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      transform: isResizing ? 'scale(1.3)' : 'scale(1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    };

    // Position the handle based on the position prop
    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: '-4px', right: '-4px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '-4px', left: '-4px', cursor: 'sw-resize' };
      case 'top-right':
        return { ...baseStyle, top: '-4px', right: '-4px', cursor: 'ne-resize' };
      case 'top-left':
        return { ...baseStyle, top: '-4px', left: '-4px', cursor: 'nw-resize' };
      default:
        return { ...baseStyle, bottom: '-4px', right: '-4px' };
    }
  };

  return (
    <div
      ref={resizeRef}
      style={getHandleStyle()}
      onMouseDown={handleMouseDown}
      title={`Resize ${elementType} (${getCurrentSize().width}×${getCurrentSize().height}px)`}
      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
    />
  );
};

export default ElementResizeHandle;