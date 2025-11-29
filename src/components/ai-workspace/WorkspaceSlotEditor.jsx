import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2, Settings, Type, Image, Box, Code, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * WorkspaceSlotEditor - A stable, grid-based slot editor
 *
 * Features:
 * - @dnd-kit for reliable drag-drop
 * - Snap-to-grid resize (1-12 columns)
 * - Data attribute based event delegation
 * - Auto-save position/size on changes
 */

// Slot type icons
const SLOT_ICONS = {
  text: Type,
  button: MousePointer,
  image: Image,
  container: Box,
  grid: Box,
  html: Code,
  component: Settings
};

/**
 * EditableSlot - Individual slot with drag handle and resize
 */
const EditableSlot = ({
  slot,
  isSelected,
  onSelect,
  onResize,
  onDelete,
  children,
  containerWidth
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slot.id });

  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState(null);
  const startXRef = useRef(0);
  const startColSpanRef = useRef(0);

  // Get colSpan value (handle both object and number formats)
  const getColSpan = () => {
    if (typeof slot.colSpan === 'object') {
      return slot.colSpan.default || 12;
    }
    return slot.colSpan || 12;
  };

  const colSpan = getColSpan();
  const Icon = SLOT_ICONS[slot.type] || Box;

  // Calculate column width
  const columnWidth = containerWidth ? containerWidth / 12 : 80;

  // Handle resize start
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startColSpanRef.current = colSpan;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const columnDelta = Math.round(deltaX / columnWidth);
      let newColSpan = startColSpanRef.current + columnDelta;
      newColSpan = Math.max(1, Math.min(12, newColSpan));
      setResizePreview(newColSpan);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      setIsResizing(false);
      if (resizePreview && resizePreview !== colSpan) {
        onResize(slot.id, resizePreview);
      }
      setResizePreview(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [colSpan, columnWidth, onResize, slot.id, resizePreview]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${resizePreview || colSpan}`,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot-id={slot.id}
      data-slot-type={slot.type}
      data-col-span={resizePreview || colSpan}
      data-editable="true"
      className={cn(
        'relative group rounded-lg border-2 transition-all min-h-[60px]',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-transparent hover:border-gray-300',
        isDragging && 'z-50 shadow-xl'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.id);
      }}
    >
      {/* Slot toolbar - visible on hover or selection */}
      <div className={cn(
        'absolute -top-8 left-0 right-0 flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-t border shadow-sm z-10 transition-opacity',
        (isSelected || isDragging) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        {/* Slot info */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Icon className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate">{slot.id}</span>
          <span className="text-xs text-blue-500 font-mono ml-auto">{resizePreview || colSpan}/12</span>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(slot.id);
          }}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500"
          title="Delete slot"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Slot content */}
      <div className={cn('p-2', slot.className)}>
        {children || (
          <div className="text-sm text-gray-400 italic">
            {slot.content || `[${slot.type}]`}
          </div>
        )}
      </div>

      {/* Resize handle (right edge) */}
      <div
        onMouseDown={handleResizeStart}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-2 cursor-col-resize transition-colors',
          'hover:bg-blue-500/30',
          isResizing && 'bg-blue-500/50'
        )}
        title="Drag to resize"
      >
        <div className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full',
          'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500',
          isResizing && 'bg-blue-500'
        )} />
      </div>

      {/* Resize preview overlay */}
      {isResizing && resizePreview && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono">
            {resizePreview}/12 columns
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main WorkspaceSlotEditor component
 */
const WorkspaceSlotEditor = ({
  slots,
  onSlotsChange,
  onSlotSelect,
  selectedSlotId,
  gridColumns = 12,
  className
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeId, setActiveId] = useState(null);

  // Get container width for resize calculations
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert slots object to sorted array
  const slotArray = useMemo(() => {
    return Object.values(slots || {})
      .filter(slot => !slot.parentId) // Only root-level slots for now
      .sort((a, b) => {
        const rowA = a.position?.row || 0;
        const rowB = b.position?.row || 0;
        if (rowA !== rowB) return rowA - rowB;
        const colA = a.position?.col || 0;
        const colB = b.position?.col || 0;
        return colA - colB;
      });
  }, [slots]);

  const slotIds = useMemo(() => slotArray.map(s => s.id), [slotArray]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Minimum drag distance before activation
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  // Handle drag end - save new positions
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = slotArray.findIndex(s => s.id === active.id);
    const newIndex = slotArray.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array
    const newArray = arrayMove(slotArray, oldIndex, newIndex);

    // Update positions based on new order
    const updatedSlots = { ...slots };
    newArray.forEach((slot, index) => {
      const row = Math.floor(index / 2) + 1; // Approximate row
      const col = (index % 2) * 6 + 1; // Alternate columns

      updatedSlots[slot.id] = {
        ...updatedSlots[slot.id],
        position: { col, row }
      };
    });

    onSlotsChange(updatedSlots);
  }, [slotArray, slots, onSlotsChange]);

  // Handle resize - save new colSpan
  const handleResize = useCallback((slotId, newColSpan) => {
    const updatedSlots = {
      ...slots,
      [slotId]: {
        ...slots[slotId],
        colSpan: typeof slots[slotId].colSpan === 'object'
          ? { ...slots[slotId].colSpan, default: newColSpan }
          : newColSpan
      }
    };
    onSlotsChange(updatedSlots);
  }, [slots, onSlotsChange]);

  // Handle delete
  const handleDelete = useCallback((slotId) => {
    const { [slotId]: deleted, ...rest } = slots;
    onSlotsChange(rest);
  }, [slots, onSlotsChange]);

  // Handle slot selection
  const handleSelect = useCallback((slotId) => {
    onSlotSelect?.(slotId);
  }, [onSlotSelect]);

  // Clear selection on container click
  const handleContainerClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onSlotSelect?.(null);
    }
  }, [onSlotSelect]);

  // Active slot for drag overlay
  const activeSlot = activeId ? slots[activeId] : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-h-[400px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg',
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Grid overlay for visual reference */}
      <div className="absolute inset-4 pointer-events-none grid grid-cols-12 gap-1 opacity-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full border-l border-dashed border-gray-400" />
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slotIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-4 relative pt-8">
            {slotArray.map((slot) => (
              <EditableSlot
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={handleSelect}
                onResize={handleResize}
                onDelete={handleDelete}
                containerWidth={containerWidth}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSlot && (
            <div
              className="rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-2xl p-2 opacity-90"
              style={{
                width: (containerWidth / 12) * (typeof activeSlot.colSpan === 'object' ? activeSlot.colSpan.default : activeSlot.colSpan || 12)
              }}
            >
              <div className="text-sm text-gray-600">
                {activeSlot.content || `[${activeSlot.type}]`}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {slotArray.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No slots yet. Add slots to start editing.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSlotEditor;
