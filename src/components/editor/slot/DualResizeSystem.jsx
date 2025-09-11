import React, { useState, useCallback } from 'react';

/**
 * DualResizeSystem - Clean separation of microslot vs element resizing
 * 
 * PLACEMENT STRATEGY:
 * 1. Microslot Handle (Blue) - Grid container level - controls layout positioning
 * 2. Element Handle (Green) - Element content level - controls element size
 */

// Microslot Resize Handle - Controls grid positioning (existing blue handle)
export const MicroslotResizeHandle = ({ 
  slotId, 
  parentSlot, 
  microSlotSpans, 
  onResize 
}) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const startPos = { x: e.clientX, y: e.clientY };
    const startSpans = { 
      col: microSlotSpans?.col || 12, 
      row: microSlotSpans?.row || 1 
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPos.x;
      const deltaY = moveEvent.clientY - startPos.y;

      const colDelta = Math.round(deltaX / 50);
      const rowDelta = Math.round(deltaY / 25);

      const newCol = Math.min(12, Math.max(1, startSpans.col + colDelta));
      const newRow = Math.min(4, Math.max(1, startSpans.row + rowDelta));

      onResize(slotId, parentSlot, { col: newCol, row: newRow });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, parentSlot, microSlotSpans, onResize]);

  return (
    <div
      className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-blue-600"
      style={{ 
        transform: 'translate(50%, 50%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      onMouseDown={handleMouseDown}
      title={`Resize slot: ${microSlotSpans?.col || 12} cols × ${microSlotSpans?.row || 1} rows`}
    >
      {isResizing && (
        <div className="fixed top-2 right-2 bg-blue-800 text-white px-2 py-1 rounded text-xs z-50">
          Grid: {microSlotSpans?.col || 12}×{microSlotSpans?.row || 1}
        </div>
      )}
    </div>
  );
};

// Element Resize Handle - Controls element dimensions (new green handle)
export const ElementResizeHandle = ({ 
  elementType, 
  currentClasses, 
  onResize 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Don't show element resize for text elements
  if (!['icon', 'button', 'image'].includes(elementType)) {
    return null;
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const startPos = { x: e.clientX, y: e.clientY };
    const startSize = extractCurrentSize(currentClasses, elementType);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPos.x;
      const deltaY = moveEvent.clientY - startPos.y;

      let newWidth = startSize.width + deltaX;
      let newHeight = startSize.height + deltaY;

      // Maintain aspect ratio for icons
      if (elementType === 'icon') {
        const aspectRatio = startSize.width / startSize.height;
        const scale = Math.max(deltaX / startSize.width, deltaY / startSize.height);
        newWidth = startSize.width * (1 + scale);
        newHeight = startSize.height * (1 + scale);
      }

      // Apply constraints
      newWidth = Math.max(16, Math.min(200, newWidth));
      newHeight = Math.max(16, Math.min(200, newHeight));

      setDimensions({ width: newWidth, height: newHeight });
      
      const newClasses = generateSizeClasses(newWidth, newHeight, elementType);
      onResize(newClasses);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentClasses, elementType, onResize]);

  const getHandlePosition = () => {
    switch (elementType) {
      case 'icon':
        return 'bottom-right'; // Corner resize for proportional scaling
      case 'button':
        return 'right'; // Side resize for width control
      case 'image':
        return 'bottom-right'; // Corner resize for proportional scaling
      default:
        return 'bottom-right';
    }
  };

  const position = getHandlePosition();
  
  return (
    <div
      className={`absolute w-2 h-2 bg-green-500 border border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-green-600 ${
        position === 'right' ? 'top-1/2 right-0 -translate-y-1/2 translate-x-1/2' : 
        'bottom-0 right-0 translate-x-1/2 translate-y-1/2'
      }`}
      style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        cursor: position === 'right' ? 'e-resize' : 'se-resize'
      }}
      onMouseDown={handleMouseDown}
      title={`Resize ${elementType}`}
    >
      {isResizing && (
        <div className="fixed top-12 right-2 bg-green-800 text-white px-2 py-1 rounded text-xs z-50">
          {elementType}: {Math.round(dimensions.width)}×{Math.round(dimensions.height)}px
        </div>
      )}
    </div>
  );
};

// Enhanced wrapper for individual elements that need resize handles
export const ElementWithResize = ({ 
  children, 
  elementType,
  currentClasses,
  onElementResize,
  showElementResize = true,
  mode = 'edit'
}) => {
  if (mode !== 'edit' || !showElementResize || !['icon', 'button', 'image'].includes(elementType)) {
    return children;
  }

  return (
    <div className="relative group inline-block">
      {children}
      <ElementResizeHandle
        elementType={elementType}
        currentClasses={currentClasses}
        onResize={onElementResize}
      />
    </div>
  );
};

// Container-level wrapper for microslot resize only
export const MicroslotContainer = ({ 
  children, 
  slotId,
  parentSlot,
  microSlotSpans,
  onMicroslotResize,
  showMicroslotResize = true,
  mode = 'edit'
}) => {
  if (mode !== 'edit') {
    return children;
  }

  return (
    <div className="relative group">
      {children}
      
      {/* Microslot resize handle (blue) - always at container level */}
      {showMicroslotResize && (
        <MicroslotResizeHandle
          slotId={slotId}
          parentSlot={parentSlot}
          microSlotSpans={microSlotSpans}
          onResize={onMicroslotResize}
        />
      )}
    </div>
  );
};

// Utility functions
function extractCurrentSize(classes, elementType) {
  const widthMatch = classes.match(/w-(\d+)/);
  const heightMatch = classes.match(/h-(\d+)/);
  
  const defaults = {
    icon: { width: 64, height: 64 },
    button: { width: 120, height: 40 },
    image: { width: 100, height: 100 }
  };
  
  return {
    width: widthMatch ? parseInt(widthMatch[1]) * 4 : defaults[elementType]?.width || 64,
    height: heightMatch ? parseInt(heightMatch[1]) * 4 : defaults[elementType]?.height || 64
  };
}

function generateSizeClasses(width, height, elementType) {
  const widthClass = `w-${Math.round(width / 4)}`;
  const heightClass = `h-${Math.round(height / 4)}`;
  
  if (elementType === 'icon') {
    return `${widthClass} ${heightClass}`;
  } else if (elementType === 'button') {
    return `${heightClass} px-4`; // Use padding for button width
  } else {
    return `${widthClass} ${heightClass}`;
  }
}

// Named exports are already available above
// Optional: export as default object for convenience
export default {
  MicroslotResizeHandle,
  ElementResizeHandle,
  ElementWithResize,
  MicroslotContainer
};