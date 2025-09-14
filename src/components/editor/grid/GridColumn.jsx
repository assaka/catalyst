import React, { useState, useRef, useCallback } from 'react';
import GridResizeHandle from './GridResizeHandle';

const GridColumn = ({
  colSpan = 12,
  rowSpan = 1,
  height,
  slotId,
  slot,
  onGridResize,
  onSlotHeightResize,
  onResizeStart,
  onResizeEnd,
  onSlotDrop,
  mode = 'edit',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropZone, setDropZone] = useState(null); // 'before', 'after', 'inside'
  const [isDragActive, setIsDragActive] = useState(false);
  const dragOverTimeoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverResizeHandle, setIsOverResizeHandle] = useState(false);

  // Show grid-level resize handles for all slot types to control grid positioning
  // Individual elements also have ResizeWrapper for corner handles (element-level resizing)
  const isContainerType = ['container', 'grid', 'flex'].includes(slot?.type);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan >= 1; // Show for all types
  const showVerticalHandle = onSlotHeightResize && mode === 'edit' && isContainerType; // Keep height resize only for containers

  // Drag and drop handlers
  const handleDragStart = useCallback((e) => {
    if (mode !== 'edit') return;

    // Stop propagation to prevent parent elements from also being dragged
    e.stopPropagation();

    setIsDragging(true);
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';

    // Store drag info in parent component's state
    if (setCurrentDragInfo) {
      setCurrentDragInfo({
        slotId: slotId,
        parentId: slot?.parentId
      });
    }

    // Create a beautiful custom drag image instead of ugly default
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        white-space: nowrap;
        pointer-events: none;
        transform: rotate(-2deg);
        border: 2px solid rgba(255, 255, 255, 0.2);
      ">
        📦 ${slotId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    document.body.appendChild(dragImage);

    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, 60, 20);

    // Clean up the temporary element
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 100);

  }, [slotId, mode]);

  const handleDragEnd = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(false);
    setIsDragOver(false);
    setIsDragActive(false);
    setDropZone(null);

    // Clear drag info
    if (setCurrentDragInfo) {
      setCurrentDragInfo(null);
    }
  }, [slotId, setCurrentDragInfo]);

  const handleDragOver = useCallback((e) => {
    if (mode !== 'edit') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // For containers, only stop propagation if we're in the middle area (inside drop zone)
    // This allows drag events to bubble up to parent containers when dragging near edges
    if (['container', 'grid', 'flex'].includes(slot?.type)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      // Only stop propagation if we're in the middle area (inside zone)
      if (y > height * 0.25 && y < height * 0.75) {
        e.stopPropagation();
      }
    }

    // Only set drag over if it's not the dragging element itself
    if (!isDragging) {
      // Clear any existing timeout
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }

      // Set drag state immediately if not already set
      if (!isDragOver) {
        setIsDragOver(true);
        setIsDragActive(true);
      }

      // Determine drop zone based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      // Calculate drop zones
      let newDropZone = 'after'; // default

      if (y < height * 0.25) {
        newDropZone = 'before';
      } else if (y > height * 0.75) {
        newDropZone = 'after';
      } else {
        // Check if "Drop inside" should be available
        // Only allow "inside" when:
        // 1. Target is a container type
        // 2. Dragged element is NOT already a sibling of this container
        const isContainer = ['container', 'grid', 'flex'].includes(slot?.type);

        if (isContainer && currentDragInfo) {
          // Check if dragged slot and target slot are siblings (same parent)
          const draggedSlotParent = currentDragInfo.parentId;
          const draggedSlotId = currentDragInfo.slotId;
          const targetSlotId = slot?.id;
          const targetSlotParent = slot?.parentId;

          // Show "Drop inside" only if:
          // - Target is actually a container (already checked above)
          // - Dragged slot is NOT already a child of this target
          // - Not trying to drop a slot into itself
          const canDropInside = draggedSlotParent !== targetSlotId &&
                                draggedSlotId !== targetSlotId;

          if (canDropInside) {
            newDropZone = 'inside';
          } else {
            // If trying to drop into same parent or itself, use 'after'
            newDropZone = 'after';
          }
        } else {
          newDropZone = 'after';
        }
      }

      // Only update dropZone if it's different
      if (newDropZone !== dropZone) {
        setDropZone(newDropZone);
      }
    }
  }, [mode, isDragging, slot?.type, isDragOver, dropZone]);

  const handleDragLeave = useCallback((e) => {
    // Only remove drag over if leaving the element entirely and moving to a non-child element
    const relatedTarget = e.relatedTarget;
    const currentTarget = e.currentTarget;

    // Don't clear drag state if moving to a child element
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      // Use longer timeout to prevent rapid flickering
      dragOverTimeoutRef.current = setTimeout(() => {
        setIsDragOver(false);
        setDropZone(null);
        setIsDragActive(false);
      }, 200); // Longer delay to prevent any flickering
    }
  }, []);

  const handleDrop = useCallback((e) => {
    if (mode !== 'edit') return;

    e.preventDefault();
    e.stopPropagation();

    // Clear any pending drag leave timeouts
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
    }

    setIsDragOver(false);
    setIsDragActive(false);

    // Don't process drop if this is the element being dragged
    if (isDragging) {
      return;
    }

    const draggedSlotId = e.dataTransfer.getData('text/plain');
    const dropPosition = dropZone || 'after'; // Use current dropZone state

    if (draggedSlotId && draggedSlotId !== slotId && onSlotDrop) {
      onSlotDrop(draggedSlotId, slotId, dropPosition);
    }

    // Reset drop zone
    setDropZone(null);
  }, [slotId, onSlotDrop, mode, isDragging, dropZone]);

  // Use user-defined CSS Grid properties from slot.styles, fallback to colSpan/rowSpan
  const gridStyles = {
    // Always use the current colSpan prop for responsive resizing
    gridColumn: `span ${colSpan}`,
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,

    // Apply other user-defined styles (but not gridColumn/gridRow to avoid conflicts)
    ...Object.fromEntries(
      Object.entries(slot?.styles || {}).filter(([key]) =>
        !['gridColumn', 'gridRow'].includes(key)
      )
    ),

    // Override with height if provided
    height: height ? `${height}px` : slot?.styles?.height,
    maxHeight: height ? `${height}px` : slot?.styles?.maxHeight
  };

  return (
    <div
      className={`${
        mode === 'edit'
          ? `${showBorders ? 'border-2 border-dashed' : 'border border-transparent'} rounded-lg overflow-hidden transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-200/60 z-10 ring-2 ring-blue-300' :
              isDragging
                ? 'border-blue-600 bg-blue-50/60 shadow-xl shadow-blue-200/60 ring-2 ring-blue-200 opacity-80' :
              isHovered
                ? 'border-blue-500 border-2 border-dashed shadow-md shadow-blue-200/40'
                : showBorders
                ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/20'
                : 'hover:border-blue-400 hover:border-2 hover:border-dashed hover:bg-blue-50/10'
            }`
          : 'overflow-hidden'
      } relative responsive-slot`}
      data-grid-slot-id={slotId}
      data-col-span={colSpan}
      data-row-span={rowSpan}
      draggable={mode === 'edit' && !isOverResizeHandle}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={(e) => {
        e.preventDefault();
        // Don't stop propagation on dragEnter to allow bubbling to parent containers
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Clear drag states when mouse leaves
        if (!isDragging) {
          setIsDragOver(false);
          setIsDragActive(false);
          setDropZone(null);
        }
      }}
      style={gridStyles}
    >
      {/* Drop Zone Indicators */}
      {mode === 'edit' && isDragActive && dropZone && (
        <>
          {dropZone === 'before' && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-40 opacity-80" />
          )}
          {dropZone === 'after' && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-40 opacity-80" />
          )}
          {dropZone === 'inside' && (
            <div className="absolute inset-1 border-2 border-dashed border-blue-500 bg-blue-50/20 rounded z-40 opacity-80 flex items-center justify-center">
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                Drop inside
              </div>
            </div>
          )}
        </>
      )}

      {/* Drag indicator - only visible on hover and not over resize handle */}
      {mode === 'edit' && isHovered && !isOverResizeHandle && (
        <div
          className="absolute top-1 right-1 text-blue-500 text-sm opacity-60 pointer-events-none z-30"
          title="Drag to reposition"
        >
          ⋮⋮
        </div>
      )}

      {/* Clean content area */}
      <div className={`p-2 relative transition-all duration-200 ${
        mode === 'edit'
          ? `${isOverResizeHandle ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} rounded-md`
          : ''
      }`} style={{ zIndex: 2 }}>
        {children}
      </div>

      {/* Resize handles at GridColumn level - only show on slot hover */}
      {showHorizontalHandle && isHovered && (
        <GridResizeHandle
          onResize={(newColSpan) => onGridResize(slotId, newColSpan)}
          currentValue={colSpan}
          maxValue={12}
          minValue={1}
          direction="horizontal"
          parentHovered={isHovered}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          onHoverChange={setIsOverResizeHandle}
        />
      )}
      {showVerticalHandle && isHovered && (
        <GridResizeHandle
          onResize={(newHeight) => onSlotHeightResize(slotId, newHeight)}
          currentValue={height || 80}
          maxValue={1000}
          minValue={40}
          direction="vertical"
          parentHovered={isHovered}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          onHoverChange={setIsOverResizeHandle}
        />
      )}
    </div>
  );
};

export default GridColumn;