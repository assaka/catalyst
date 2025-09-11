import React, { useState, useCallback, useRef, useEffect } from 'react';

const ResizeHandle = ({ 
  slotId, 
  parentSlot, 
  microSlotSpans, 
  onResize, 
  position = 'bottom-right' 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSpans, setStartSpans] = useState({ col: 12, row: 1 });
  const [currentSpans, setCurrentSpans] = useState({ col: 12, row: 1 });
  const resizeRef = useRef(null);

  // Initialize current spans when microSlotSpans changes
  useEffect(() => {
    setCurrentSpans({ 
      col: microSlotSpans?.col || 12, 
      row: microSlotSpans?.row || 1 
    });
  }, [microSlotSpans]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const initialPos = { x: e.clientX, y: e.clientY };
    const initialSpans = { 
      col: microSlotSpans?.col || 12, 
      row: microSlotSpans?.row || 1 
    };

    setIsResizing(true);
    setStartPos(initialPos);
    setStartSpans(initialSpans);

    // Add global mouse event listeners
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialPos.x;
      const deltaY = moveEvent.clientY - initialPos.y;

      // Calculate new spans based on movement
      // Each grid cell is approximately 50px wide and 25px tall
      const colDelta = Math.round(deltaX / 50);
      const rowDelta = Math.round(deltaY / 25);

      const newCol = Math.min(12, Math.max(1, initialSpans.col + colDelta));
      const newRow = Math.min(4, Math.max(1, initialSpans.row + rowDelta));

      // Update current spans for visual feedback
      setCurrentSpans({ col: newCol, row: newRow });

      // Always call onResize to update the spans
      onResize(slotId, parentSlot, { col: newCol, row: newRow });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setCurrentSpans({ col: microSlotSpans?.col || 12, row: microSlotSpans?.row || 1 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, parentSlot, microSlotSpans, onResize]);

  const getHandleStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: '12px',
      height: '12px',
      background: '#3b82f6',
      border: '2px solid #ffffff',
      borderRadius: '50%',
      cursor: 'nw-resize',
      zIndex: 30,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      transform: isResizing ? 'scale(1.2)' : 'scale(1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

    // Position the handle based on the position prop
    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: '-6px', right: '-6px', cursor: 'se-resize' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '-6px', left: '-6px', cursor: 'sw-resize' };
      case 'top-right':
        return { ...baseStyle, top: '-6px', right: '-6px', cursor: 'ne-resize' };
      case 'top-left':
        return { ...baseStyle, top: '-6px', left: '-6px', cursor: 'nw-resize' };
      case 'right':
        return { 
          ...baseStyle, 
          top: '50%', 
          right: '-6px', 
          transform: isResizing ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
          cursor: 'e-resize' 
        };
      case 'bottom':
        return { 
          ...baseStyle, 
          bottom: '-6px', 
          left: '50%', 
          transform: isResizing ? 'translateX(-50%) scale(1.2)' : 'translateX(-50%) scale(1)',
          cursor: 's-resize' 
        };
      default:
        return { ...baseStyle, bottom: '-6px', right: '-6px', cursor: 'se-resize' };
    }
  };

  return (
    <>
      <div
        ref={resizeRef}
        style={getHandleStyle()}
        onMouseDown={handleMouseDown}
        title={`Resize ${slotId} (${microSlotSpans?.col || 12} cols × ${microSlotSpans?.row || 1} rows)`}
        className="hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {/* Optional resize icon for larger handles */}
        {position === 'bottom-right' && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '1px'
            }}
          />
        )}
      </div>
      
      {/* Visual feedback tooltip during resize */}
      {isResizing && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {slotId}: {currentSpans.col} cols × {currentSpans.row} rows
        </div>
      )}
    </>
  );
};

export default ResizeHandle;