import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Generic MicroSlot component for any page editor
 * Handles drag-and-drop, resizing, and micro-slot management
 */
function MicroSlot({ 
  id, 
  children, 
  onEdit, 
  onDelete, 
  isDraggable = true, 
  colSpan = 1, 
  rowSpan = 1, 
  onSpanChange, 
  isEditable = false, 
  onContentChange, 
  onClassChange, 
  elementClasses = {}, 
  elementStyles = {}, 
  componentSizes = {}, 
  onSizeChange, 
  mode = 'edit' 
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const slotRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  // Ensure colSpan and rowSpan are valid numbers
  const safeColSpan = typeof colSpan === 'number' && colSpan >= 1 && colSpan <= 12 ? colSpan : 12;
  const safeRowSpan = typeof rowSpan === 'number' && rowSpan >= 1 && rowSpan <= 4 ? rowSpan : 1;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable || isResizing || mode === 'preview' });

  // Calculate grid span classes
  const getGridSpanClass = () => {
    // Use explicit Tailwind classes for column spans
    const colClasses = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12'
    };
    
    const rowClasses = {
      1: '',
      2: 'row-span-2',
      3: 'row-span-3',
      4: 'row-span-4'
    };
    
    const colClass = colClasses[Math.min(12, Math.max(1, safeColSpan))] || 'col-span-12';
    const rowClass = rowClasses[Math.min(4, Math.max(1, safeRowSpan))] || '';
    
    // Alignment now handled via direct CSS classes in slot configuration
    return `${colClass} ${rowClass}`;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isResizing ? 'nwse-resize' : 'auto',
  };

  // Handle resize start
  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      colSpan: safeColSpan,
      rowSpan: safeRowSpan,
      direction
    });
  }, [safeColSpan, safeRowSpan]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !resizeStart) return;

    const handleMouseMove = (e) => {
      const gridCellWidth = slotRef.current ? slotRef.current.offsetWidth / safeColSpan : 50;
      const gridCellHeight = slotRef.current ? slotRef.current.offsetHeight / safeRowSpan : 50;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const colDelta = Math.round(deltaX / gridCellWidth);
      const rowDelta = Math.round(deltaY / gridCellHeight);
      
      let newColSpan = Math.max(1, Math.min(12, resizeStart.colSpan + colDelta));
      let newRowSpan = Math.max(1, Math.min(4, resizeStart.rowSpan + rowDelta));
      
      // Apply visual feedback (could be enhanced)
      if (slotRef.current) {
        slotRef.current.style.opacity = '0.8';
        slotRef.current.style.borderColor = '#3b82f6';
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      if (slotRef.current) {
        slotRef.current.style.opacity = '';
        slotRef.current.style.borderColor = '';
      }
      
      // Apply final size changes
      if (onSpanChange && resizeStart) {
        const gridCellWidth = slotRef.current ? slotRef.current.offsetWidth / safeColSpan : 50;
        const gridCellHeight = slotRef.current ? slotRef.current.offsetHeight / safeRowSpan : 50;
        
        const deltaX = resizeStart.x - resizeStart.x; // This would be updated in mousemove
        const deltaY = resizeStart.y - resizeStart.y;
        
        const colDelta = Math.round(deltaX / gridCellWidth);
        const rowDelta = Math.round(deltaY / gridCellHeight);
        
        const newColSpan = Math.max(1, Math.min(12, resizeStart.colSpan + colDelta));
        const newRowSpan = Math.max(1, Math.min(4, resizeStart.rowSpan + rowDelta));
        
        if (newColSpan !== safeColSpan || newRowSpan !== safeRowSpan) {
          onSpanChange(id.split('.')[0], id, { col: newColSpan, row: newRowSpan });
        }
      }
      
      setResizeStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, safeColSpan, safeRowSpan, onSpanChange, id]);

  // Handle mouse enter with delay to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (mode === 'preview') return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  }, [mode]);

  // Handle mouse leave with delay  
  const handleMouseLeave = useCallback((e) => {
    const relatedTarget = e.relatedTarget;
    
    // Don't hide if user is interacting with form elements
    if (relatedTarget && (
      relatedTarget.type === 'color' || 
      (relatedTarget.closest && relatedTarget.closest('input[type="color"]')) ||
      relatedTarget.className?.includes('color-picker') ||
      relatedTarget.tagName === 'INPUT'
    )) {
      return;
    }
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const currentStyles = elementStyles[id] || {};
  const currentClasses = elementClasses[id] || '';

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        slotRef.current = node;
      }}
      style={{ ...style, ...currentStyles }}
      className={`
        ${getGridSpanClass()}
        ${currentClasses}
        relative border border-dashed border-gray-300 p-2 min-h-[40px]
        transition-all duration-200
        ${mode === 'edit' ? 'hover:border-gray-400 hover:bg-gray-50/50' : ''}
        ${isDragging ? 'border-blue-400 bg-blue-50/50' : ''}
        ${isResizing ? 'border-blue-500 bg-blue-50' : ''}
        ${isHovered && mode === 'edit' ? 'ring-1 ring-blue-300' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes}
      {...(isDraggable && mode === 'edit' ? listeners : {})}
    >
      {/* Content */}
      <div className="relative min-h-[20px]">
        {children}
      </div>

      {/* Edit Controls (only show when hovered and in edit mode) */}
      {isHovered && mode === 'edit' && (
        <div className="absolute -top-8 left-0 flex gap-1 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-xs z-20">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              🗑️
            </button>
          )}
          <span className="text-gray-500">
            {safeColSpan}×{safeRowSpan}
          </span>
        </div>
      )}

      {/* Resize Handle (only show when hovered and resizable) */}
      {isHovered && mode === 'edit' && onSpanChange && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-nw-resize opacity-75 hover:opacity-100"
          onMouseDown={(e) => handleResizeStart(e, 'se')}
          title="Resize"
        />
      )}

      {/* Drag indicator */}
      {isDraggable && mode === 'edit' && (
        <div className="absolute top-1 right-1 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          ⋮⋮
        </div>
      )}
    </div>
  );
}

export default MicroSlot;