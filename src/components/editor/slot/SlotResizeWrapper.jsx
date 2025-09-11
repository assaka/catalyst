import React, { useState, useCallback, useRef } from 'react';

/**
 * SimpleResizeSystem - Production-ready resize handles that actually work
 * 
 * PRINCIPLES:
 * 1. Handles are positioned EXACTLY on the elements
 * 2. Smooth dragging with proper event handling
 * 3. Simple slot/element relationship - no complex logic
 * 4. Visual feedback that makes sense
 */

// Simple Element Resize Handle - positioned exactly on the element
export const SimpleElementHandle = ({ 
  elementType,
  currentClasses,
  onResize,
  onSlotExpand // Simple callback when element needs more space
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  if (!['icon', 'button', 'image'].includes(elementType)) {
    return null;
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    const currentSize = getCurrentSize(currentClasses, elementType);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height
    });

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStart.x;
      const deltaY = moveEvent.clientY - dragStart.y;
      
      let newWidth = dragStart.width + deltaX;
      let newHeight = dragStart.height + deltaY;
      
      // Element-specific constraints
      if (elementType === 'icon') {
        // Proportional resize for icons
        const avgDelta = (deltaX + deltaY) / 2;
        newWidth = Math.max(16, dragStart.width + avgDelta);
        newHeight = Math.max(16, dragStart.height + avgDelta);
      } else if (elementType === 'button') {
        // For buttons, resize height and adjust font size
        newHeight = Math.max(24, Math.min(80, dragStart.height + deltaY));
        newWidth = Math.max(60, dragStart.width + deltaX);
      }
      
      // Convert to classes and update
      const newClasses = generateClasses(elementType, newWidth, newHeight);
      onResize(newClasses);
      
      // Check if we need more slot space
      if (newWidth > 200 || newHeight > 100) {
        onSlotExpand && onSlotExpand({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [elementType, currentClasses, onResize, onSlotExpand, dragStart]);

  const getHandlePosition = () => {
    switch (elementType) {
      case 'button':
        return 'right'; // Side handle for buttons
      case 'icon':
      case 'image':
        return 'corner'; // Corner handle for proportional resize
      default:
        return 'corner';
    }
  };

  const position = getHandlePosition();
  const handleStyle = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    backgroundColor: '#10b981',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: position === 'right' ? 'e-resize' : 'se-resize',
    zIndex: 50,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    opacity: 0,
    transition: 'opacity 0.2s'
  };

  if (position === 'right') {
    handleStyle.right = '-4px';
    handleStyle.top = '50%';
    handleStyle.transform = 'translateY(-50%)';
  } else {
    handleStyle.bottom = '-4px';
    handleStyle.right = '-4px';
  }

  return (
    <div
      style={handleStyle}
      onMouseDown={handleMouseDown}
      className="group-hover:opacity-100 hover:scale-110 hover:bg-green-600"
      title={`Resize ${elementType}`}
    />
  );
};

// Simple Slot Resize Handle - positioned exactly on slot container
export const SimpleSlotHandle = ({ 
  slotId,
  parentSlot,
  spans,
  onResize
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startSpans = { col: spans?.col || 12, row: spans?.row || 1 };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const colChange = Math.round(deltaX / 50);
      const rowChange = Math.round(deltaY / 25);
      
      const newCol = Math.max(1, Math.min(12, startSpans.col + colChange));
      const newRow = Math.max(1, Math.min(4, startSpans.row + rowChange));
      
      onResize(slotId, parentSlot, { col: newCol, row: newRow });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, parentSlot, spans, onResize]);

  const handleStyle = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '12px',
    height: '12px',
    backgroundColor: '#3b82f6',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'se-resize',
    zIndex: 40,
    transform: 'translate(50%, 50%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    opacity: 0,
    transition: 'opacity 0.2s'
  };

  return (
    <div
      style={handleStyle}
      onMouseDown={handleMouseDown}
      className="group-hover:opacity-100 hover:scale-110 hover:bg-blue-600"
      title={`Resize slot: ${spans?.col || 12}×${spans?.row || 1}`}
    />
  );
};

// Simple wrapper that adds both handles
export const SimpleResizeWrapper = ({
  children,
  // Slot props
  slotId,
  parentSlot,
  spans,
  onSlotResize,
  // Element props
  elementType,
  currentClasses,
  onElementResize,
  // Options
  showSlotHandle = true,
  showElementHandle = true,
  mode = 'edit'
}) => {
  const handleSlotExpansion = useCallback((elementSize) => {
    // Simple logic: if element is getting big, expand slot
    const currentCols = spans?.col || 12;
    const maxCols = 12;
    
    if (elementSize.width > 150 && currentCols < maxCols) {
      const newCols = Math.min(maxCols, currentCols + 1);
      onSlotResize(slotId, parentSlot, { col: newCols, row: spans?.row || 1 });
    }
  }, [spans, slotId, parentSlot, onSlotResize]);

  if (mode !== 'edit') {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="relative group">
      {children}
      
      {/* Blue slot resize handle */}
      {showSlotHandle && (
        <SimpleSlotHandle
          slotId={slotId}
          parentSlot={parentSlot}
          spans={spans}
          onResize={onSlotResize}
        />
      )}
      
      {/* Green element resize handle */}
      {showElementHandle && elementType && (
        <SimpleElementHandle
          elementType={elementType}
          currentClasses={currentClasses}
          onResize={onElementResize}
          onSlotExpand={handleSlotExpansion}
        />
      )}
    </div>
  );
};

// Utility functions
function getCurrentSize(classes, elementType) {
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

function generateClasses(elementType, width, height) {
  const widthClass = `w-${Math.round(width / 4)}`;
  const heightClass = `h-${Math.round(height / 4)}`;
  
  if (elementType === 'button') {
    // For buttons, also adjust font size based on height
    const fontSize = Math.max(12, Math.min(20, height * 0.4));
    return `${heightClass} px-4 text-[${fontSize}px]`;
  } else if (elementType === 'icon') {
    return `${widthClass} ${heightClass}`;
  } else {
    return `${widthClass} ${heightClass}`;
  }
}

export default SimpleResizeWrapper;