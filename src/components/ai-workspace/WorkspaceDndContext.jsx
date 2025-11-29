import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToParentElement, createSnapModifier } from '@dnd-kit/modifiers';

/**
 * WorkspaceDndContext - DnD provider for AI Workspace
 * Uses @dnd-kit for reliable drag-drop with snap-to-grid support
 */

// Create snap modifier for 12-column grid
const createGridSnapModifier = (containerWidth) => {
  const columnWidth = containerWidth / 12;
  return createSnapModifier(columnWidth);
};

// Custom collision detection for grid layout
const gridCollisionDetection = (args) => {
  return closestCenter(args);
};

const WorkspaceDndContext = ({
  children,
  items = [],
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
  strategy = 'grid', // 'vertical' | 'horizontal' | 'grid'
  containerRef
}) => {
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get sorting strategy based on layout type
  const getSortingStrategy = () => {
    switch (strategy) {
      case 'vertical':
        return verticalListSortingStrategy;
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'grid':
      default:
        return rectSortingStrategy;
    }
  };

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);

    // Find the active item
    const item = items.find(i => i.id === active.id);
    setActiveItem(item);

    if (onDragStart) {
      onDragStart(event);
    }
  }, [items, onDragStart]);

  // Handle drag over (for reordering)
  const handleDragOver = useCallback((event) => {
    if (onDragOver) {
      onDragOver(event);
    }
  }, [onDragOver]);

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveItem(null);

    if (onDragEnd) {
      onDragEnd(event);
    }
  }, [onDragEnd]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveItem(null);

    if (onDragCancel) {
      onDragCancel();
    }
  }, [onDragCancel]);

  // Measuring strategy for accurate positioning
  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  // Modifiers for snap-to-grid behavior
  const modifiers = [
    restrictToParentElement,
    // Grid snap will be applied via the resize handle, not during drag
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={gridCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={measuringConfig}
      modifiers={modifiers}
    >
      <SortableContext
        items={items.map(item => item.id || item)}
        strategy={getSortingStrategy()}
      >
        {children}
      </SortableContext>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="opacity-80 shadow-lg rounded border-2 border-blue-500 bg-white p-2">
            <span className="text-sm font-medium">
              {activeItem.type || 'Slot'}: {activeItem.id}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default WorkspaceDndContext;

// Export utilities for use in other components
export { createGridSnapModifier };
