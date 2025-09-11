import React, { useState, useCallback, useRef, useEffect } from 'react';

const ElementResizeHandle = ({ 
  slotId, 
  elementType,
  currentSize,
  onResize, 
  position = 'bottom-right',
  maintainAspectRatio = true 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 32, height: 32 });
  const [currentDimensions, setCurrentDimensions] = useState({ width: 32, height: 32 });
  const resizeRef = useRef(null);

  // Initialize current dimensions when currentSize changes
  useEffect(() => {
    const dimensions = extractDimensions(currentSize, elementType);
    setCurrentDimensions(dimensions);
  }, [currentSize, elementType]);

  // Extract dimensions from className or styles
  const extractDimensions = (size, type) => {
    if (!size) return getDefaultSize(type);
    
    // Extract from Tailwind classes like w-16 h-16
    const widthMatch = size.match(/w-(\d+)/);
    const heightMatch = size.match(/h-(\d+)/);
    
    if (widthMatch && heightMatch) {
      // Convert Tailwind size to pixels (4px per unit)
      return {
        width: parseInt(widthMatch[1]) * 4,
        height: parseInt(heightMatch[1]) * 4
      };
    }
    
    return getDefaultSize(type);
  };

  // Get default size based on element type
  const getDefaultSize = (type) => {
    switch (type) {
      case 'icon':
        return { width: 64, height: 64 }; // w-16 h-16
      case 'button':
        return { width: 120, height: 40 }; // auto width, h-10
      default:
        return { width: 200, height: 24 }; // text default
    }
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const initialPos = { x: e.clientX, y: e.clientY };
    const initialSize = extractDimensions(currentSize, elementType);

    setIsResizing(true);
    setStartPos(initialPos);
    setStartSize(initialSize);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialPos.x;
      const deltaY = moveEvent.clientY - initialPos.y;

      let newWidth = initialSize.width + deltaX;
      let newHeight = initialSize.height + deltaY;

      // Maintain aspect ratio for icons and images
      if (maintainAspectRatio && elementType === 'icon') {
        const aspectRatio = initialSize.width / initialSize.height;
        // Use the larger delta to maintain proportions
        const scaleFactor = Math.max(deltaX / initialSize.width, deltaY / initialSize.height);
        newWidth = initialSize.width * (1 + scaleFactor);
        newHeight = initialSize.height * (1 + scaleFactor);
      }

      // Apply constraints
      newWidth = Math.max(16, Math.min(400, newWidth));
      newHeight = Math.max(16, Math.min(300, newHeight));

      // For buttons, maintain minimum readable height
      if (elementType === 'button') {
        newHeight = Math.max(32, newHeight);
      }

      const dimensions = { width: newWidth, height: newHeight };
      setCurrentDimensions(dimensions);

      // Convert to Tailwind classes
      const newSize = convertToTailwindSize(dimensions, elementType);
      onResize(slotId, newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, elementType, currentSize, maintainAspectRatio, onResize]);

  // Convert pixel dimensions to Tailwind size classes
  const convertToTailwindSize = (dimensions, type) => {
    const widthClass = getTailwindSizeClass('w', dimensions.width);
    const heightClass = getTailwindSizeClass('h', dimensions.height);

    if (type === 'icon') {
      // Icons typically use the same width and height
      return `${widthClass} ${heightClass}`;
    } else if (type === 'button') {
      // Buttons often have auto width or specific padding
      return `${heightClass} px-4`; // Use padding for width control
    } else {
      // Text elements might use different sizing
      return `${widthClass} ${heightClass}`;
    }
  };

  // Convert pixel value to closest Tailwind size class
  const getTailwindSizeClass = (prefix, pixels) => {
    const sizes = [
      { px: 16, class: '4' },
      { px: 20, class: '5' },
      { px: 24, class: '6' },
      { px: 28, class: '7' },
      { px: 32, class: '8' },
      { px: 36, class: '9' },
      { px: 40, class: '10' },
      { px: 44, class: '11' },
      { px: 48, class: '12' },
      { px: 56, class: '14' },
      { px: 64, class: '16' },
      { px: 80, class: '20' },
      { px: 96, class: '24' },
      { px: 112, class: '28' },
      { px: 128, class: '32' }
    ];

    // Find closest size
    const closest = sizes.reduce((prev, curr) => 
      Math.abs(curr.px - pixels) < Math.abs(prev.px - pixels) ? curr : prev
    );

    return `${prefix}-${closest.class}`;
  };

  const getHandleStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      background: '#10b981', // Green color for element resize
      border: '2px solid #ffffff',
      borderRadius: '50%',
      cursor: 'se-resize',
      zIndex: 40,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      transform: isResizing ? 'scale(1.3)' : 'scale(1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

    // Position based on element type and position prop
    switch (position) {
      case 'bottom-right':
        return { 
          ...baseStyle, 
          bottom: '-4px', 
          right: '-4px', 
          cursor: 'se-resize' 
        };
      case 'bottom-left':
        return { 
          ...baseStyle, 
          bottom: '-4px', 
          left: '-4px', 
          cursor: 'sw-resize' 
        };
      case 'top-right':
        return { 
          ...baseStyle, 
          top: '-4px', 
          right: '-4px', 
          cursor: 'ne-resize' 
        };
      case 'top-left':
        return { 
          ...baseStyle, 
          top: '-4px', 
          left: '-4px', 
          cursor: 'nw-resize' 
        };
      default:
        return { 
          ...baseStyle, 
          bottom: '-4px', 
          right: '-4px', 
          cursor: 'se-resize' 
        };
    }
  };

  return (
    <>
      <div
        ref={resizeRef}
        style={getHandleStyle()}
        onMouseDown={handleMouseDown}
        title={`Resize ${elementType} (${Math.round(currentDimensions.width)}×${Math.round(currentDimensions.height)}px)`}
        className="hover:bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {/* Resize icon for visual feedback */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '4px',
            background: 'white',
            borderRadius: '1px'
          }}
        />
      </div>
      
      {/* Visual feedback tooltip during resize */}
      {isResizing && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '10px',
            background: 'rgba(16, 185, 129, 0.9)', // Green background
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 1001,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {elementType}: {Math.round(currentDimensions.width)}×{Math.round(currentDimensions.height)}px
          {maintainAspectRatio && <div style={{ fontSize: '10px', opacity: 0.8 }}>Proportional</div>}
        </div>
      )}
    </>
  );
};

export default ElementResizeHandle;