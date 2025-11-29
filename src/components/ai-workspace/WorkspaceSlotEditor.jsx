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
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import { processVariables, generateDemoData } from '@/utils/variableProcessor';

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
 * Get processed content for a slot (with variables replaced)
 */
const getSlotContent = (slot, demoContext) => {
  // For component slots, show component name
  if (slot.type === 'component' && slot.component) {
    return `<${slot.component} />`;
  }

  if (!slot.content || typeof slot.content !== 'string') {
    return null;
  }

  const content = slot.content.trim();
  if (content.length === 0) return null;

  // Process variables with demo context
  if (demoContext) {
    return processVariables(content, demoContext);
  }

  return content;
};

/**
 * Generate demo context for variable processing
 * Uses the full demo data structure from generateDemoData
 */
const getDemoContext = () => {
  const demoData = generateDemoData('product', {
    currency_symbol: '$',
    store_name: 'Demo Store',
    theme: {
      add_to_cart_button_color: '#3B82F6'
    }
  });

  return {
    product: demoData.product,
    products: demoData.products || [],
    category: demoData.category || { name: 'Sample Category' },
    cart: demoData.cart || { total: '$99.99', items_count: 3 },
    settings: demoData.settings,
    productLabels: demoData.productLabels
  };
};

/**
 * ComponentPreview - Renders a component slot using UnifiedSlotRenderer
 * Wrapped in error boundary to handle rendering failures gracefully
 */
const ComponentPreview = ({ slot, demoContext }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create a minimal slots object for rendering
  const slotsForRender = useMemo(() => ({
    [slot.id]: { ...slot, parentId: null }
  }), [slot]);

  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
        <Code className="h-4 w-4" />
        <span className="font-mono">&lt;{slot.component || slot.metadata?.component || 'Component'} /&gt;</span>
        {errorMessage && (
          <span className="text-xs text-red-500 ml-2">({errorMessage})</span>
        )}
      </div>
    );
  }

  try {
    return (
      <div className="component-preview overflow-hidden max-h-[200px] pointer-events-none">
        <ErrorBoundary onError={(error) => {
          setHasError(true);
          setErrorMessage(error?.message || 'Render error');
        }}>
          <UnifiedSlotRenderer
            slots={slotsForRender}
            parentId={null}
            context="editor"
            mode="preview"
            viewMode="default"
            viewportMode="desktop"
            productData={{
              product: demoContext.product,
              settings: demoContext.settings,
              productLabels: demoContext.productLabels
            }}
            categoryData={{
              category: demoContext.category,
              products: demoContext.products,
              settings: demoContext.settings
            }}
          />
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
        <Code className="h-4 w-4" />
        <span className="font-mono">&lt;{slot.component || slot.metadata?.component || 'Component'} /&gt;</span>
      </div>
    );
  }
};

/**
 * Simple Error Boundary component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

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
 * EditableSlot - Compact visual slot editor focused on layout preview
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

  // Get demo context for variable processing
  const demoContext = useMemo(() => getDemoContext(), []);
  const processedContent = getSlotContent(slot, demoContext);

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${resizePreview || colSpan}`,
    opacity: isDragging ? 0.5 : 1
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
        'relative group rounded border transition-all',
        isContainer ? 'min-h-[40px] bg-gray-50/50 dark:bg-gray-800/50 border-dashed' : 'min-h-[24px] bg-white dark:bg-gray-900',
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-300 dark:ring-blue-700'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
        isDragging && 'z-50 shadow-lg',
        isOver && 'border-green-500 bg-green-50/50',
        dragOverContainerId === slot.id && 'border-green-500 bg-green-50 dark:bg-green-900/30'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.id);
      }}
    >
      {/* Hover controls - only visible on hover */}
      <div className={cn(
        'absolute -top-2 left-1 z-10 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-600 px-0.5',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        isSelected && 'opacity-100'
      )}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
          title="Drag"
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </button>

        {/* Expand/collapse for containers */}
        {isContainer && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-400" />
            )}
          </button>
        )}

        {/* Width indicator */}
        <span className="text-[10px] text-gray-400 px-1">{resizePreview || colSpan}</span>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(slot.id);
          }}
          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Rendered content - compact visual preview */}
      {!isContainer && (
        <div className="p-1.5">
          {/* Component slots - render actual component preview */}
          {slot.type === 'component' && (
            <ComponentPreview slot={slot} demoContext={demoContext} />
          )}

          {/* Button slots - show styled button */}
          {slot.type === 'button' && (
            <button
              className={slot.className || "bg-blue-500 text-white px-4 py-2 rounded text-sm"}
              style={{
                backgroundColor: slot.styles?.backgroundColor || (slot.id.includes('cart') ? '#3B82F6' : undefined),
                ...slot.styles
              }}
              dangerouslySetInnerHTML={{ __html: processedContent || 'Button' }}
            />
          )}

          {/* Text/HTML slots - rendered with proper styling */}
          {(slot.type === 'text' || slot.type === 'html') && (
            <div
              className={cn(
                "overflow-hidden",
                slot.className
              )}
              style={slot.styles}
              dangerouslySetInnerHTML={{ __html: processedContent || `<span class="text-gray-400 text-xs">${slot.id}</span>` }}
            />
          )}

          {/* Image slots - show actual demo image */}
          {slot.type === 'image' && (
            <img
              src={demoContext.product?.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"}
              alt="Product"
              className={cn("w-full h-auto object-cover rounded", slot.className)}
              style={{ maxHeight: '120px', ...slot.styles }}
            />
          )}
        </div>
      )}

      {/* Children for containers */}
      {isContainer && isExpanded && (
        <div className={cn(
          'p-1',
          hasChildren ? 'min-h-[30px]' : 'min-h-[40px]'
        )}>
          {hasChildren ? (
            <SortableContext
              items={childSlots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-12 gap-1" style={{ gridAutoRows: 'min-content' }}>
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
            <div className="flex items-center justify-center h-8 text-gray-400 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded">
              Drop here
            </div>
          )}
        </div>
      )}

      {/* Resize handle (right edge) */}
      <div
        onMouseDown={handleResizeStart}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize',
          'opacity-0 group-hover:opacity-100 hover:bg-blue-500/50',
          isResizing && 'opacity-100 bg-blue-500/50'
        )}
        title="Resize"
      />

      {/* Resize preview */}
      {isResizing && resizePreview && (
        <div className="absolute -top-6 right-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
          {resizePreview}/12
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
        'min-h-[300px] p-2 bg-white dark:bg-gray-900 rounded-lg relative border border-gray-200 dark:border-gray-700',
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Grid overlay for visual reference */}
      <div className="absolute inset-2 pointer-events-none grid grid-cols-12 gap-1 opacity-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full bg-gray-400" />
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
          <div className="grid grid-cols-12 gap-1.5 relative pt-3" style={{ gridAutoRows: 'min-content' }}>
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
            <div className="rounded border border-blue-500 bg-white dark:bg-gray-800 shadow-lg p-2 opacity-95">
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {activeDisplayName}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {rootSlots.length === 0 && (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <div className="text-center">
            <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No slots yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSlotEditor;
