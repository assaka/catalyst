import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  GripVertical, Trash2, Settings, Type, Image, Box, Code, MousePointer,
  ChevronDown, ChevronRight, LayoutGrid, Layers, Link2, Navigation,
  FileText, ShoppingCart, CreditCard, User
} from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';

/**
 * WorkspaceSlotEditor - A stable, hierarchical slot editor
 *
 * Features:
 * - @dnd-kit for reliable drag-drop
 * - Nested drag-drop into containers
 * - Snap-to-grid resize (1-12 columns)
 * - Hierarchical slot display with collapsible containers
 * - Auto-save position/size on changes
 */

// Slot type icons
const SLOT_ICONS = {
  text: Type,
  button: MousePointer,
  image: Image,
  container: Layers,
  grid: LayoutGrid,
  flex: Layers,
  html: Code,
  component: Settings,
  link: Link2,
  nav: Navigation,
  cms: FileText
};

// Component type icons for better visual distinction
const COMPONENT_ICONS = {
  Breadcrumbs: Navigation,
  CmsBlockRenderer: FileText,
  AddToCartButton: ShoppingCart,
  BuyNowButton: CreditCard,
  CustomerInfo: User
};

/**
 * Get display name for a slot
 */
const getSlotDisplayName = (slot) => {
  // Priority: displayName > component name > formatted ID
  if (slot.metadata?.displayName) {
    return slot.metadata.displayName;
  }
  if (slot.component) {
    return slot.component;
  }
  // Fallback to formatted ID
  return slot.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Get raw content for a slot (shows actual HTML/template)
 */
const getSlotContent = (slot) => {
  if (!slot.content || typeof slot.content !== 'string') {
    return null;
  }

  // For component slots, show component name
  if (slot.type === 'component' && slot.component) {
    return `<${slot.component} />`;
  }

  // Return raw content (preserve HTML and templates)
  const content = slot.content.trim();
  if (content.length === 0) return null;

  return content;
};

/**
 * Parse colSpan value - handles number, object, or string formats
 * Returns numeric value (1-12) or null if not defined
 */
const parseColSpan = (colSpan, slotType) => {
  // If colSpan is explicitly defined, parse it
  if (typeof colSpan === 'number') {
    return Math.max(1, Math.min(12, colSpan));
  }

  if (typeof colSpan === 'object' && colSpan !== null) {
    const defaultVal = colSpan.default;
    if (typeof defaultVal === 'number') {
      return Math.max(1, Math.min(12, defaultVal));
    }
    // Handle string like 'col-span-12 lg:col-span-6'
    if (typeof defaultVal === 'string') {
      const match = defaultVal.match(/col-span-(\d+)/);
      if (match) {
        return Math.max(1, Math.min(12, parseInt(match[1], 10)));
      }
    }
    // Empty object like colSpan: {} - use type-based default
  }

  if (typeof colSpan === 'string') {
    // Handle class string like 'col-span-12 lg:col-span-6'
    const match = colSpan.match(/col-span-(\d+)/);
    if (match) {
      return Math.max(1, Math.min(12, parseInt(match[1], 10)));
    }
  }

  // Type-based defaults for undefined colSpan
  if (slotType === 'container' || slotType === 'grid' || slotType === 'flex') {
    return 12; // Containers span full width
  }
  if (slotType === 'button' || slotType === 'link') {
    return 4; // Buttons are smaller
  }
  if (slotType === 'text') {
    return 6; // Text is medium
  }

  return 6; // Default to half width for other types
};

/**
 * Get icon for slot based on type and component
 */
const getSlotIcon = (slot) => {
  if (slot.type === 'component' && slot.component && COMPONENT_ICONS[slot.component]) {
    return COMPONENT_ICONS[slot.component];
  }
  return SLOT_ICONS[slot.type] || Box;
};

/**
 * Check if slot is a container type
 */
const isContainerType = (type) => ['container', 'grid', 'flex'].includes(type);

/**
 * EditableSlot - Individual slot with drag handle, resize, and nested children
 */
const EditableSlot = ({
  slot,
  slots,
  isSelected,
  onSelect,
  onResize,
  onDelete,
  onMoveToContainer,
  containerWidth,
  level = 0,
  selectedSlotId,
  dragOverContainerId
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
  const [isExpanded, setIsExpanded] = useState(true);
  const startXRef = useRef(0);
  const startColSpanRef = useRef(0);

  // Check if this is a container with children
  const isContainer = isContainerType(slot.type);
  const childSlots = useMemo(() => {
    if (!isContainer) return [];
    return SlotManager.getChildSlots(slots, slot.id);
  }, [slots, slot.id, isContainer]);
  const hasChildren = childSlots.length > 0;

  // Droppable for containers
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${slot.id}`,
    disabled: !isContainer,
    data: { containerId: slot.id }
  });

  // Get colSpan value using the parser (pass slot type for smart defaults)
  const colSpan = parseColSpan(slot.colSpan, slot.type);
  const Icon = getSlotIcon(slot);
  const displayName = getSlotDisplayName(slot);
  const rawContent = getSlotContent(slot);

  // Calculate column width
  const columnWidth = containerWidth ? containerWidth / 12 : 80;

  // Handle resize start
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startColSpanRef.current = colSpan;

    let currentPreview = colSpan;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const columnDelta = Math.round(deltaX / columnWidth);
      let newColSpan = startColSpanRef.current + columnDelta;
      newColSpan = Math.max(1, Math.min(12, newColSpan));
      currentPreview = newColSpan;
      setResizePreview(newColSpan);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      setIsResizing(false);
      if (currentPreview !== colSpan) {
        onResize(slot.id, currentPreview);
      }
      setResizePreview(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [colSpan, columnWidth, onResize, slot.id]);

  // Combined ref for sortable + droppable
  const combinedRef = useCallback((node) => {
    setNodeRef(node);
    if (isContainer) {
      setDroppableRef(node);
    }
  }, [setNodeRef, setDroppableRef, isContainer]);

  // Get position values
  const posCol = slot.position?.col || 1;
  const posRow = slot.position?.row || 1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Use position.col for start, colSpan for width
    gridColumn: `${posCol} / span ${resizePreview || colSpan}`,
    gridRow: posRow,
    opacity: isDragging ? 0.5 : 1
  };

  // Type-specific background colors
  const getBgColor = () => {
    if (isContainer) return 'bg-blue-50 dark:bg-blue-900/20';
    if (slot.type === 'component') return 'bg-purple-50 dark:bg-purple-900/20';
    if (slot.type === 'text' || slot.type === 'html') return 'bg-green-50 dark:bg-green-900/20';
    if (slot.type === 'button' || slot.type === 'link') return 'bg-orange-50 dark:bg-orange-900/20';
    return 'bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      data-slot-id={slot.id}
      data-slot-type={slot.type}
      data-col-span={resizePreview || colSpan}
      data-editable="true"
      data-container={isContainer ? 'true' : undefined}
      data-level={level}
      className={cn(
        'relative group rounded-lg border-2 transition-all',
        'min-h-[48px]',
        getBgColor(),
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
        isDragging && 'z-50 shadow-xl',
        isOver && 'border-green-500 ring-2 ring-green-200',
        dragOverContainerId === slot.id && 'border-green-500 bg-green-50 dark:bg-green-900/30'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.id);
      }}
    >
      {/* Slot header with drag handle and info */}
      <div className={cn(
        'flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700',
        level > 0 && 'text-sm'
      )}>
        {/* Expand/collapse for containers */}
        {isContainer && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        )}

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-grab active:cursor-grabbing"
          title="Drag to reorder or into a container"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        {/* Slot icon and name */}
        <Icon className="h-4 w-4 text-gray-500 shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
          {displayName}
        </span>

        {/* Slot type badge */}
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded',
          isContainer ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
          slot.type === 'component' ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200' :
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        )}>
          {slot.type}
        </span>

        {/* Position and size indicator */}
        <span className="text-xs text-gray-400 font-mono" title={`Position: col ${posCol}, row ${posRow}`}>
          c{posCol}
        </span>
        <span className="text-xs text-blue-500 font-mono" title={`Width: ${resizePreview || colSpan} columns`}>
          w{resizePreview || colSpan}
        </span>

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

      {/* Raw HTML/Template content for non-container slots */}
      {!isContainer && rawContent && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <pre className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 font-mono bg-white/70 dark:bg-black/30 overflow-x-auto max-h-[120px] overflow-y-auto whitespace-pre-wrap break-all">
            {rawContent}
          </pre>
        </div>
      )}

      {/* className display */}
      {slot.className && (
        <div className="px-3 py-1.5 text-xs bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-400 dark:text-gray-500">class: </span>
          <code className="text-blue-600 dark:text-blue-400 font-mono break-all">{slot.className}</code>
        </div>
      )}

      {/* Children for containers */}
      {isContainer && isExpanded && (
        <div className={cn(
          'p-2',
          hasChildren ? 'min-h-[40px]' : 'min-h-[60px]'
        )}>
          {hasChildren ? (
            <SortableContext
              items={childSlots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-12 gap-2" style={{ gridAutoRows: 'min-content' }}>
                {childSlots.map((childSlot) => (
                  <EditableSlot
                    key={childSlot.id}
                    slot={childSlot}
                    slots={slots}
                    isSelected={selectedSlotId === childSlot.id}
                    onSelect={onSelect}
                    onResize={onResize}
                    onDelete={onDelete}
                    onMoveToContainer={onMoveToContainer}
                    containerWidth={containerWidth}
                    level={level + 1}
                    selectedSlotId={selectedSlotId}
                    dragOverContainerId={dragOverContainerId}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div className="flex items-center justify-center h-12 text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
              Drop slots here
            </div>
          )}
        </div>
      )}

      {/* Resize handle (right edge) - for all slots */}
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
 * Custom collision detection that prefers droppable containers
 */
const customCollisionDetection = (args) => {
  // First check for droppable containers (for nesting)
  const pointerCollisions = pointerWithin(args);

  // Find if we're over a droppable container
  const droppableCollision = pointerCollisions.find(
    c => c.id.toString().startsWith('droppable-')
  );

  if (droppableCollision) {
    return [droppableCollision];
  }

  // Otherwise use rect intersection for sorting
  return rectIntersection(args);
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
  const [dragOverContainerId, setDragOverContainerId] = useState(null);

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

  // Get root slots (no parentId)
  const rootSlots = useMemo(() => {
    return SlotManager.getRootSlots(slots || {});
  }, [slots]);

  const rootSlotIds = useMemo(() => rootSlots.map(s => s.id), [rootSlots]);

  // Get all slot IDs for the sortable context (including nested)
  const allSlotIds = useMemo(() => {
    return Object.keys(slots || {});
  }, [slots]);

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

  // Handle drag over - detect when hovering over a container
  const handleDragOver = useCallback((event) => {
    const { over } = event;

    if (over && over.id.toString().startsWith('droppable-')) {
      const containerId = over.data?.current?.containerId;
      setDragOverContainerId(containerId);
    } else {
      setDragOverContainerId(null);
    }
  }, []);

  // Handle drag end - save new positions or move into container
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverContainerId(null);

    if (!over || active.id === over.id) return;

    const draggedSlot = slots[active.id];
    if (!draggedSlot) return;

    // Check if dropping into a container
    if (over.id.toString().startsWith('droppable-')) {
      const targetContainerId = over.data?.current?.containerId;

      // Don't allow dropping a container into itself or its children
      if (targetContainerId === active.id) return;

      // Check if target is a child of the dragged slot
      let parent = slots[targetContainerId];
      while (parent) {
        if (parent.parentId === active.id) return;
        parent = slots[parent.parentId];
      }

      // Move slot into the container
      const updatedSlots = {
        ...slots,
        [active.id]: {
          ...draggedSlot,
          parentId: targetContainerId,
          position: { col: 1, row: SlotManager.getChildSlots(slots, targetContainerId).length + 1 }
        }
      };
      onSlotsChange(updatedSlots);
      return;
    }

    // Regular reordering within same level
    const overSlot = slots[over.id];
    if (!overSlot) return;

    // Get slots at the same level
    const parentId = draggedSlot.parentId;
    const siblingSlots = parentId === null
      ? rootSlots
      : SlotManager.getChildSlots(slots, parentId);

    const oldIndex = siblingSlots.findIndex(s => s.id === active.id);
    const newIndex = siblingSlots.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      // Moving to a different parent - check if target is in same parent
      if (overSlot.parentId !== parentId) {
        // Move to target's parent
        const updatedSlots = {
          ...slots,
          [active.id]: {
            ...draggedSlot,
            parentId: overSlot.parentId,
            position: { col: 1, row: (overSlot.position?.row || 0) + 1 }
          }
        };
        onSlotsChange(updatedSlots);
      }
      return;
    }

    // Reorder the array
    const newArray = arrayMove(siblingSlots, oldIndex, newIndex);

    // Update positions based on new order
    const updatedSlots = { ...slots };
    newArray.forEach((slot, index) => {
      updatedSlots[slot.id] = {
        ...updatedSlots[slot.id],
        position: { col: 1, row: index + 1 }
      };
    });

    onSlotsChange(updatedSlots);
  }, [slots, rootSlots, onSlotsChange]);

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

  // Handle delete - use SlotManager for recursive delete
  const handleDelete = useCallback((slotId) => {
    const updatedSlots = SlotManager.deleteSlot(slots, slotId);
    onSlotsChange(updatedSlots);
  }, [slots, onSlotsChange]);

  // Handle move to container
  const handleMoveToContainer = useCallback((slotId, containerId) => {
    const slot = slots[slotId];
    if (!slot) return;

    const updatedSlots = {
      ...slots,
      [slotId]: {
        ...slot,
        parentId: containerId,
        position: { col: 1, row: SlotManager.getChildSlots(slots, containerId).length + 1 }
      }
    };
    onSlotsChange(updatedSlots);
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
  const activeDisplayName = activeSlot ? getSlotDisplayName(activeSlot) : '';
  const ActiveIcon = activeSlot ? getSlotIcon(activeSlot) : Box;

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-h-[400px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg relative',
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Grid overlay for visual reference */}
      <div className="absolute inset-4 pointer-events-none grid grid-cols-12 gap-1 opacity-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full border-l border-dashed border-gray-400" />
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allSlotIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-12 gap-4 relative pt-2" style={{ gridAutoRows: 'min-content' }}>
            {rootSlots.map((slot) => (
              <EditableSlot
                key={slot.id}
                slot={slot}
                slots={slots}
                isSelected={selectedSlotId === slot.id}
                onSelect={handleSelect}
                onResize={handleResize}
                onDelete={handleDelete}
                onMoveToContainer={handleMoveToContainer}
                containerWidth={containerWidth}
                level={0}
                selectedSlotId={selectedSlotId}
                dragOverContainerId={dragOverContainerId}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSlot && (
            <div className="rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-2xl p-3 opacity-95">
              <div className="flex items-center gap-2">
                <ActiveIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {activeDisplayName}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {activeSlot.type}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {rootSlots.length === 0 && (
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
