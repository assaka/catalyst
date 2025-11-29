import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

/**
 * SortableSlot - Draggable slot wrapper using @dnd-kit
 * Provides drag handle and visual feedback during drag operations
 */

const SortableSlot = ({
  id,
  children,
  className,
  disabled = false,
  showHandle = true,
  colSpan = 12,
  onSelect,
  isSelected = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id,
    disabled
  });

  // Apply transform styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Calculate grid column class
  const getColSpanClass = () => {
    if (typeof colSpan === 'number') {
      return `col-span-${colSpan}`;
    }
    return colSpan; // Allow passing custom classes
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        getColSpanClass(),
        isDragging && 'ring-2 ring-blue-500 ring-offset-2',
        isOver && 'bg-blue-50 dark:bg-blue-900/20',
        isSelected && 'ring-2 ring-purple-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => onSelect && onSelect(id)}
    >
      {/* Drag handle */}
      {showHandle && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-1 top-1/2 -translate-y-1/2 z-10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'cursor-grab active:cursor-grabbing',
            'p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
            'shadow-sm'
          )}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Drop indicator line */}
      {isOver && !isDragging && (
        <div className="absolute inset-x-0 -top-0.5 h-1 bg-blue-500 rounded-full" />
      )}

      {/* Slot content */}
      <div className={cn(
        'h-full',
        isDragging && 'pointer-events-none'
      )}>
        {children}
      </div>

      {/* Column span indicator (visible on hover in edit mode) */}
      {!disabled && (
        <div className={cn(
          'absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-mono',
          'bg-gray-800/80 text-white rounded-tl',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}>
          {typeof colSpan === 'number' ? `${colSpan}/12` : colSpan}
        </div>
      )}
    </div>
  );
};

export default SortableSlot;
