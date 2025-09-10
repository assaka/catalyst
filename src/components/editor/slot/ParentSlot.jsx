import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

/**
 * Generic ParentSlot component for any page editor
 * Handles major slot containers with micro-slot management
 */
function ParentSlot({ 
  id, 
  name, 
  children, 
  microSlotOrder, 
  onMicroSlotReorder, 
  onEdit, 
  isDraggable = true, 
  gridCols = 12, 
  dragAttributes, 
  dragListeners, 
  isDragging: parentIsDragging, 
  mode = 'edit', 
  elementClasses = {}, 
  elementStyles = {} 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  
  // Use passed drag props if available (for major slot dragging)
  const isDragging = parentIsDragging || false;
  const attributes = dragAttributes || {};
  const listeners = dragListeners || {};

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleMicroDragEnd = (event) => {
    const { active, over } = event;
    console.log('🎯 MICRO DRAG END:', { active: active?.id, over: over?.id, parentId: id });
    
    if (!over || active.id === over.id) {
      console.log('🎯 MICRO DRAG END: No over or same ID, returning');
      return;
    }
    
    // Only allow reordering within the same parent
    if (active.id.split('.')[0] === over.id.split('.')[0]) {
      console.log('🎯 MICRO DRAG END: Calling onMicroSlotReorder with:', { id, activeId: active.id, overId: over.id });
      onMicroSlotReorder(id, active.id, over.id);
    } else {
      console.log('🎯 MICRO DRAG END: Different parents, not reordering');
    }
  };

  // Handle mouse enter with a slight delay to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (mode === 'preview') return; // Don't show hover states in preview mode
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, [mode]);
  
  // Handle mouse leave with a small delay to prevent premature hiding
  const handleMouseLeave = useCallback((e) => {
    // Check if we're still within the component or its children
    const relatedTarget = e.relatedTarget;
    
    // Don't hide if user is interacting with color picker
    if (relatedTarget && (
      relatedTarget.type === 'color' || 
      (relatedTarget.closest && relatedTarget.closest('input[type="color"]')) ||
      relatedTarget.className?.includes('color-picker') ||
      relatedTarget.tagName === 'INPUT'
    )) {
      return;
    }
    
    try {
      if (containerRef.current && relatedTarget && typeof relatedTarget.nodeType === 'number' && containerRef.current.contains(relatedTarget)) {
        return; // Don't hide if we're still inside the component
      }
    } catch (error) {
      // If contains() fails, just continue with the timeout
      console.log('Mouse leave check failed, continuing...', error);
    }
    
    // Add a small delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Increased delay for color picker
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Get current styling
  const currentStyles = elementStyles[id] || {};
  const currentClasses = elementClasses[id] || '';

  return (
    <div
      ref={containerRef}
      className={`
        relative group border-2 rounded-lg transition-all duration-200
        ${mode === 'edit' ? 'border-dashed border-gray-300' : 'border-transparent'}
        ${mode === 'edit' ? 'hover:border-gray-400 hover:bg-gray-50/30' : ''}
        ${isDragging ? 'border-blue-400 bg-blue-50/30' : ''}
        ${isHovered && mode === 'edit' ? 'ring-2 ring-blue-200' : ''}
        ${currentClasses}
      `}
      style={{
        ...currentStyles,
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes}
      {...(isDraggable && mode === 'edit' ? listeners : {})}
    >
      {/* Slot Header */}
      {mode === 'edit' && (
        <div className={`
          absolute -top-6 left-2 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium
          transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-70'}
          z-10
        `}>
          <span className="text-gray-600">{name || id}</span>
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="ml-2 text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              ✏️
            </button>
          )}
          {isDraggable && (
            <span className="ml-2 text-gray-400" title="Draggable">⋮⋮</span>
          )}
        </div>
      )}

      {/* Micro-slot Container */}
      <div className="p-4 min-h-[60px]">
        {onMicroSlotReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMicroDragEnd}
          >
            <SortableContext
              items={microSlotOrder || []}
              strategy={rectSortingStrategy}
            >
              <div 
                className={`
                  grid gap-2 min-h-[40px]
                  grid-cols-${Math.min(gridCols, 12)}
                `}
                style={{
                  gridTemplateColumns: `repeat(${Math.min(gridCols, 12)}, 1fr)`,
                }}
              >
                {children}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div 
            className={`
              grid gap-2 min-h-[40px]
              grid-cols-${Math.min(gridCols, 12)}
            `}
            style={{
              gridTemplateColumns: `repeat(${Math.min(gridCols, 12)}, 1fr)`,
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Add Slot Button */}
      {mode === 'edit' && isHovered && (
        <div className="absolute bottom-2 right-2">
          <button
            className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
            title="Add Micro Slot"
            onClick={() => onEdit && onEdit(id, 'add-micro-slot')}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default ParentSlot;