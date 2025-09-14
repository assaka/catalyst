/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import {
  Save,
  Settings,
  Eye,
  EyeOff,
  ShoppingCart,
  Package,
  Loader2,
  Square
} from "lucide-react";
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { SlotManager } from '@/utils/slotUtils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
import slotConfigurationService from '@/services/slotConfigurationService';
import { runDragDropTests } from '@/utils/dragDropTester';

// Advanced resize handle for horizontal (grid column) or vertical (height) resizing
const GridResizeHandle = ({ onResize, currentValue, maxValue = 12, minValue = 1, direction = 'horizontal', parentHovered = false, onResizeStart, onResizeEnd, onHoverChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startValueRef = useRef(currentValue);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startValueRef.current = currentValue;
    
    // Notify parent that resize has started (to prevent sidebar opening)
    if (onResizeStart) {
      onResizeStart();
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentValue, direction, onResizeStart]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    
    const startX = startXRef.current;
    const startY = startYRef.current;
    const startValue = startValueRef.current;
    
    if (direction === 'horizontal') {
      const deltaX = e.clientX - startX;
      const sensitivity = 25; // pixels per col-span unit (reduced for more responsive feel)
      const colSpanDelta = Math.round(deltaX / sensitivity);
      const newColSpan = Math.max(minValue, Math.min(maxValue, startValue + colSpanDelta));
      
      // Always call onResize for smooth horizontal resizing
      onResize(newColSpan);
    } else if (direction === 'vertical') {
      const deltaY = e.clientY - startY;
      const heightDelta = Math.round(deltaY / 1); // 1px increments for smoothest resize
      const newHeight = Math.max(20, startValue + heightDelta); // Minimum 20px height
      
      // Always call onResize for smooth height changes
      onResize(newHeight);
    }
  }, [currentValue, maxValue, minValue, onResize, direction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Notify parent that resize has ended
    if (onResizeEnd) {
      onResizeEnd();
    }
  }, [handleMouseMove, onResizeEnd]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const isHorizontal = direction === 'horizontal';
  const cursorClass = isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize';
  const positionClass = isHorizontal 
    ? '-right-1 top-1/2 -translate-y-1/2 w-2 h-8' 
    : '-bottom-1 left-1/2 -translate-x-1/2 h-2 w-8';

  return (
    <div
      className={`absolute ${positionClass} ${cursorClass} transition-opacity duration-200 ${
        isHovered || isDragging || parentHovered
          ? 'opacity-100'
          : 'opacity-0 hover:opacity-90'
      }`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange?.(false);
      }}
      style={{ zIndex: 9999 }}
      title={`Resize ${direction}ly ${isHorizontal ? `(${currentValue} / ${maxValue})` : `(${currentValue}px)`}`}
    >
      {/* Clean, intuitive resize handle */}
      <div className={`w-full h-full rounded-md flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center justify-center gap-0.5 border shadow-sm transition-colors duration-150 ${
        isDragging 
          ? 'bg-blue-600 border-blue-700 shadow-lg' 
          : isHovered || parentHovered
            ? 'bg-blue-500 border-blue-600 shadow-md' 
            : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
      }`}>
        {/* Simple grip dots */}
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
      </div>
      
      {/* Simple drag indicator */}
      {isDragging && (
        <div className={`absolute ${isHorizontal ? '-top-6 left-1/2 -translate-x-1/2' : '-left-10 top-1/2 -translate-y-1/2'} 
          bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`}>
          {isHorizontal ? `${currentValue} / ${maxValue}` : `${currentValue}px`}
        </div>
      )}
    </div>
  );
};

// Grid column wrapper - uses user-defined CSS Grid properties with drag & drop
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
  // Only show grid-level resize handles for container types
  // Individual elements (button, text, image) should use element-level ResizeWrapper instead
  const isContainerType = ['container', 'grid', 'flex'].includes(slot?.type);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan >= 1 && isContainerType;
  const showVerticalHandle = onSlotHeightResize && mode === 'edit' && isContainerType;
  

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

    console.log('🎯 Started dragging slot:', slotId);
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
    console.log('🎯 Finished dragging slot:', slotId);
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
          // - Dragged slot's parent is NOT the target slot (not already inside)
          // - Dragged slot and target slot are NOT siblings (different levels)
          const canDropInside = draggedSlotParent !== targetSlotId &&
                                draggedSlotParent !== targetSlotParent;

          console.log('🎯 Drop inside check:', {
            draggedSlotId,
            draggedSlotParent,
            targetSlotId,
            targetSlotParent,
            canDropInside,
            isContainer
          });

          if (canDropInside) {
            newDropZone = 'inside';
          } else {
            // If trying to drop into same parent or similar level, use 'after'
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
      console.log('⚠️ Ignoring drop on self');
      return;
    }

    const draggedSlotId = e.dataTransfer.getData('text/plain');
    const dropPosition = dropZone || 'after'; // Use current dropZone state

    if (draggedSlotId && draggedSlotId !== slotId && onSlotDrop) {
      console.log('🎯 Dropping slot:', { from: draggedSlotId, to: slotId, position: dropPosition });
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

// Enhanced editable element with drag and element resize capabilities
const EditableElement = ({
  slotId,
  children,
  className,
  style,
  onClick,
  canResize = false,
  draggable = false,
  mode = 'edit',
  selectedElementId = null
}) => {
  const handleClick = useCallback((e) => {
    // Don't handle clicks in preview mode
    if (mode === 'preview') return;
    
    e.stopPropagation();
    if (onClick) {
      onClick(slotId, e.currentTarget);
    }
  }, [slotId, onClick, mode]);

  const content = (
    <EditorInteractionWrapper
      mode={mode}
      draggable={draggable}
      isSelected={selectedElementId === slotId}
    >
      <div
        className={className || ''}
        style={style}
        onClick={handleClick}
        data-slot-id={slotId}
        data-editable={mode === 'edit'}
        draggable={false}  // Explicitly prevent dragging at this level
        onDragStart={(e) => e.preventDefault()}  // Prevent any drag initiation
      >
        {children}
      </div>
    </EditorInteractionWrapper>
  );

  // Show resize wrapper only in edit mode when canResize is true
  if (canResize && mode === 'edit') {
    return (
      <ResizeWrapper
        minWidth={50}
        minHeight={20}
      >
        {content}
      </ResizeWrapper>
    );
  }

  return content;
};






// Component to render hierarchical slots
const HierarchicalSlotRenderer = ({
  slots,
  parentId = null,
  mode,
  viewMode = 'empty',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onResizeStart,
  onResizeEnd,
  selectedElementId = null
}) => {
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  // Debug logging to see what's happening
  if (parentId === null) {
    console.log('🔍 Root slots debug:', {
      totalSlots: Object.keys(slots || {}).length,
      childSlots: childSlots.length,
      childSlotIds: childSlots.map(s => s.id),
      viewMode
    });
  } else {
    // Debug child slots for any parent
    console.log(`🔍 Child slots for ${parentId}:`, {
      parentId,
      childCount: childSlots.length,
      childSlotIds: childSlots.map(s => s.id),
      childSlots: childSlots.map(s => ({ id: s.id, parentId: s.parentId }))
    });
  }

  // Filter slots based on their viewMode property from config
  const filteredSlots = childSlots.filter(slot => {
    // If slot doesn't have viewMode defined, show it always
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true;
    }

    // Show slot only if current viewMode is in its viewMode array
    const shouldShow = slot.viewMode.includes(viewMode);
    if (parentId === null) {
      console.log(`🔍 Slot ${slot.id} viewMode check:`, {
        slotViewMode: slot.viewMode,
        currentViewMode: viewMode,
        shouldShow,
        parentId: slot.parentId
      });
    }
    return shouldShow;
  });

  if (parentId === null) {
    console.log('🔍 After filtering:', {
      filteredCount: filteredSlots.length,
      filteredIds: filteredSlots.map(s => s.id)
    });
  }
  
  return filteredSlots.map(slot => {
    // Calculate dynamic colSpan based on viewMode for specific slots
    let colSpan = slot.colSpan || 12;
    
    // Note: Removed hardcoded colSpan override for content_area to allow proper resizing
    // The colSpan should come from the slot data (which includes user resize changes)
    
    const rowSpan = slot.rowSpan || 1;
    const height = slot.styles?.minHeight ? parseInt(slot.styles.minHeight) : undefined;
    
    return (
      <GridColumn
        key={slot.id}
        colSpan={colSpan}
        rowSpan={rowSpan}
        height={height}
        slotId={slot.id}
        slot={slot}
        currentDragInfo={currentDragInfo}
        setCurrentDragInfo={setCurrentDragInfo}
        onGridResize={onGridResize}
        onSlotHeightResize={onSlotHeightResize}
        onSlotDrop={onSlotDrop}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        mode={mode}
        showBorders={showBorders}
      >
        <div className={slot.parentClassName || ''}>
          <EditableElement
            slotId={slot.id}
            mode={mode}
            onClick={onElementClick}
            className={''}  // Parent div should only have layout/structure classes, not text styling
            style={slot.type === 'button' ?
              // For buttons, exclude width/height from wrapper - apply only to button element
              Object.fromEntries(
                Object.entries(slot.styles || {}).filter(([key]) =>
                  !['width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight'].includes(key)
                )
              ) :
              (slot.styles || {})}
            canResize={!['container', 'grid', 'flex'].includes(slot.type)}
            draggable={false}  // Dragging is handled at GridColumn level
            selectedElementId={selectedElementId}
          >
          {slot.type === 'text' && (
            <span
              className={slot.className}  // Text styling goes only on the span
              style={{
                ...slot.styles,
                // Ensure italic is applied as inline style if class includes 'italic'
                ...(slot.className?.includes('italic') && { fontStyle: 'italic' })
              }}
              dangerouslySetInnerHTML={{
                __html: String(slot.content || `Text: ${slot.id}`)
              }}
              ref={(el) => {
                if (el && slot.id === 'header_title') {
                  console.log(`🎨 Applying styles to ${slot.id}:`, {
                    className: slot.className,
                    computedStyle: window.getComputedStyle(el).fontStyle,
                    hasItalic: slot.className?.includes('italic'),
                    inlineStyle: el.style.fontStyle,
                    element: el
                  });
                }
              }}
            />
          )}
          {slot.type === 'button' && (
            <button
              className={slot.className}
              style={slot.styles}
              dangerouslySetInnerHTML={{
                __html: String(slot.content || `Button: ${slot.id}`)
              }}
            />
          )}
          {slot.type === 'input' && (
            <input
              className={slot.className}
              style={slot.styles}
              placeholder={String(slot.content || '')}
              type="text"
            />
          )}
          {slot.type === 'image' && (
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400" />
          )}
          {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
            <div
              className={`w-full h-full grid grid-cols-12 gap-2 ${slot.className}`}
              style={{
                ...slot.styles,
                minHeight: mode === 'edit' ? '80px' : slot.styles?.minHeight, // Minimum height for drop zones in edit mode
              }}
            >
              <HierarchicalSlotRenderer
                slots={slots}
                parentId={slot.id}
                mode={mode}
                viewMode={viewMode}
                showBorders={showBorders}
                currentDragInfo={currentDragInfo}
                setCurrentDragInfo={setCurrentDragInfo}
                onElementClick={onElementClick}
                onGridResize={onGridResize}
                onSlotHeightResize={onSlotHeightResize}
                onSlotDrop={onSlotDrop}
                onResizeStart={onResizeStart}
                onResizeEnd={onResizeEnd}
                selectedElementId={selectedElementId}
              />
            </div>
          )}
          </EditableElement>
        </div>
      </GridColumn>
    );
  });
};

// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // Validation function to ensure slot configuration integrity - defined early to avoid reference errors
  const validateSlotConfiguration = useCallback((slots) => {
    if (!slots || typeof slots !== 'object') return false;

    // Check for required properties in each slot
    for (const [slotId, slot] of Object.entries(slots)) {
      if (!slot.id || slot.id !== slotId) {
        console.error(`❌ Slot ${slotId} has invalid or missing id`);
        return false;
      }

      if (!slot.type) {
        console.error(`❌ Slot ${slotId} missing type`);
        return false;
      }

      // Ensure viewMode is always an array
      if (slot.viewMode && !Array.isArray(slot.viewMode)) {
        console.error(`❌ Slot ${slotId} has invalid viewMode (not an array)`);
        return false;
      }

      // Validate parentId references
      if (slot.parentId && slot.parentId !== null && !slots[slot.parentId]) {
        console.error(`❌ Slot ${slotId} references non-existent parent ${slot.parentId}`);
        return false;
      }
    }

    // Ensure main_layout has null parentId
    if (slots.main_layout && slots.main_layout.parentId !== null) {
      console.error('❌ main_layout must have parentId: null');
      return false;
    }

    return true;
  }, []);

  // State management - Initialize with empty config to avoid React error #130
  const [cartLayoutConfig, setCartLayoutConfig] = useState({
    page_name: 'Cart',
    slot_type: 'cart_layout',
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: 'cart'
    },
    cmsBlocks: []
  });

  // Track if configuration has been loaded once
  const configurationLoadedRef = useRef(false);
  const isDragOperationActiveRef = useRef(false);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSlotBorders, setShowSlotBorders] = useState(true);
  const [localSaveStatus, setLocalSaveStatus] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const lastResizeEndTime = useRef(0);
  
  // Database configuration hook
  const {
    saveConfiguration: saveToDatabase,
    loadConfiguration: loadFromDatabase,
    saveStatus
  } = useSlotConfiguration({
    pageType: 'cart',
    pageName: 'Cart',
    slotType: 'cart_layout',
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, 'cart_layout');
      }
    },
    onSave
  });

  // Initialize cart configuration - ONCE on mount only
  useEffect(() => {
    let isMounted = true;

    const initializeConfig = async () => {
      if (!isMounted || configurationLoadedRef.current) return;

      try {
        console.log('🔄 CartSlotsEditor: Starting configuration initialization...');
        console.log('🏪 Store context check:', {
          selectedStore: selectedStore,
          storeId: selectedStore?.id,
          getSelectedStoreId: getSelectedStoreId ? getSelectedStoreId() : 'function not available'
        });

        let configToUse = null;

        // Try to load saved configuration from database first
        const storeId = getSelectedStoreId();
        if (storeId) {
          try {
            console.log('💾 Attempting to load saved configuration from database...');
            const savedConfig = await slotConfigurationService.getDraftConfiguration(storeId, 'cart');
            console.log('📥 Raw database response:', savedConfig);

            if (savedConfig && savedConfig.success && savedConfig.data && savedConfig.data.configuration) {
              console.log('📄 Database configuration found:', savedConfig.data.configuration);
              const dbConfig = slotConfigurationService.transformFromSlotConfigFormat(savedConfig.data.configuration);
              console.log('🔄 Transformed configuration:', dbConfig);

              if (dbConfig && dbConfig.slots && Object.keys(dbConfig.slots).length > 0) {
                console.log('✅ Found saved configuration in database:', dbConfig);
                // Check specifically for header_title italic
                const headerTitle = dbConfig.slots.header_title;
                if (headerTitle) {
                  console.log('🎨 Header title from DB:', {
                    className: headerTitle.className,
                    hasItalic: headerTitle.className?.includes('italic'),
                    styles: headerTitle.styles
                  });
                }
                configToUse = dbConfig;
              } else {
                console.log('📝 Database config exists but has no slots:', dbConfig);
              }
            } else {
              console.log('📝 No valid configuration structure in database response');
            }
          } catch (dbError) {
            console.log('📝 No saved configuration found, will use static config as fallback:', dbError.message);
          }
        }

        // If no saved config found, load the static configuration as template
        if (!configToUse) {
          console.log('📂 Loading static configuration as template...');
          const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');

          if (!cartConfig || !cartConfig.slots) {
            throw new Error('Cart configuration is invalid or missing slots');
          }

          // Create a deep clone to ensure no React components or functions are included
          const cleanSlots = {};
          if (cartConfig.slots) {
            Object.entries(cartConfig.slots).forEach(([key, slot]) => {
              // Only copy serializable properties, ensure no undefined values
              cleanSlots[key] = {
                id: slot.id || key,
                type: slot.type || 'container',
                content: slot.content || '',
                className: slot.className || '',
                parentClassName: slot.parentClassName || '',
                styles: slot.styles ? { ...slot.styles } : {},
                parentId: slot.parentId === undefined ? null : slot.parentId,
                layout: slot.layout || null,
                gridCols: slot.gridCols || null,
                colSpan: slot.colSpan || 12,
                rowSpan: slot.rowSpan || 1,
                viewMode: slot.viewMode ? [...slot.viewMode] : [],
                metadata: slot.metadata ? { ...slot.metadata } : {}
              };
            });
          }

          configToUse = {
            page_name: cartConfig.page_name || 'Cart',
            slot_type: cartConfig.slot_type || 'cart_layout',
            slots: cleanSlots,
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              version: '1.0',
              pageType: 'cart'
            },
            cmsBlocks: cartConfig.cmsBlocks ? [...cartConfig.cmsBlocks] : []
          };
          console.log('📦 Using static configuration as template');
        }

        console.log('🔍 Final configuration to use:', {
          source: configToUse && configToUse.metadata && configToUse.metadata.source === 'database' ? 'database' : 'static',
          slotsCount: Object.keys(configToUse.slots || {}).length,
          slots: Object.keys(configToUse.slots || {})
        });

        // Verify the config is serializable
        try {
          JSON.stringify(configToUse);
          console.log('✅ Configuration is serializable');

        // Repair corrupted hierarchy if needed
        if (configToUse.slots) {
          let needsRepair = false;
          const repairedSlots = { ...configToUse.slots };

          // Ensure main_layout has correct parentId
          if (repairedSlots.main_layout && repairedSlots.main_layout.parentId !== null) {
            console.log('🔧 Repairing main_layout parentId');
            repairedSlots.main_layout = { ...repairedSlots.main_layout, parentId: null };
            needsRepair = true;
          }

          // Ensure header_container and content_area are children of main_layout
          ['header_container', 'content_area'].forEach(slotId => {
            if (repairedSlots[slotId] && repairedSlots[slotId].parentId !== 'main_layout') {
              console.log(`🔧 Repairing ${slotId} parentId`);
              repairedSlots[slotId] = { ...repairedSlots[slotId], parentId: 'main_layout' };
              needsRepair = true;
            }
          });

          // Ensure sidebar_area is also a child of main_layout if it exists
          if (repairedSlots.sidebar_area && repairedSlots.sidebar_area.parentId !== 'main_layout') {
            console.log('🔧 Repairing sidebar_area parentId');
            repairedSlots.sidebar_area = { ...repairedSlots.sidebar_area, parentId: 'main_layout' };
            needsRepair = true;
          }

          // Load cart config to get original viewMode values
          const { cartConfig: originalCartConfig } = await import('@/components/editor/slot/configs/cart-config');

          // Ensure all slots have proper viewMode arrays from config if missing
          Object.keys(repairedSlots).forEach(slotId => {
            const slot = repairedSlots[slotId];
            // If viewMode is undefined or not an array, preserve from cartConfig
            if (!slot.viewMode || !Array.isArray(slot.viewMode)) {
              const configSlot = originalCartConfig?.slots?.[slotId];
              if (configSlot && configSlot.viewMode) {
                repairedSlots[slotId] = { ...slot, viewMode: [...configSlot.viewMode] };
                needsRepair = true;
                console.log(`🔧 Repairing viewMode for ${slotId}:`, configSlot.viewMode);
              }
            }
          });

          if (needsRepair) {
            configToUse = { ...configToUse, slots: repairedSlots };
            console.log('✅ Hierarchy and viewMode repaired');
          }
        }
        } catch (e) {
          console.error('❌ Configuration contains non-serializable data:', e);
        }

        if (Object.keys(configToUse.slots).length === 0) {
          console.warn('⚠️ No slots found in final configuration');
        }

        // Simple one-time initialization
        if (isMounted) {
          console.log('🔄 Loading configuration (one time only)');
          setCartLayoutConfig(configToUse);
          configurationLoadedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Failed to initialize cart configuration:', error);
        // Set a minimal fallback configuration
        setTimeout(() => {
          if (isMounted) {
            setCartLayoutConfig({
            page_name: 'Cart',
            slot_type: 'cart_layout',
            slots: {},
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              version: '1.0',
              pageType: 'cart',
              error: 'Failed to load configuration'
            },
            cmsBlocks: []
          });
          }
        }, 0);
      }
    };

    initializeConfig();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once on mount

  // Helper functions for slot styling
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig && cartLayoutConfig.slots ? cartLayoutConfig.slots[slotId] : null;
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Save configuration using the slot configuration service
  const saveConfiguration = useCallback(async (configToSave = cartLayoutConfig) => {
    if (!configToSave) return;

    // Validate configuration before saving
    if (!validateSlotConfiguration(configToSave.slots)) {
      console.error('❌ Cannot save invalid configuration');
      setLocalSaveStatus('error');
      setTimeout(() => setLocalSaveStatus(''), 5000);
      return;
    }

    setLocalSaveStatus('saving');

    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        console.log('💾 Saving configuration to database...');

        // Log the configuration being saved for debugging
        console.log('📋 Configuration to save:', {
          slotsCount: Object.keys(configToSave.slots).length,
          slots: Object.keys(configToSave.slots),
          hasViewModes: Object.entries(configToSave.slots).every(([id, slot]) =>
            slot.viewMode === undefined || Array.isArray(slot.viewMode)
          )
        });

        await slotConfigurationService.saveConfiguration(storeId, configToSave, 'cart');
        console.log('✅ Configuration saved successfully');
      }

      // Also call parent onSave callback if provided
      // TEMPORARILY DISABLED: This might be causing config reversion
      // if (onSave) {
      //   await onSave(configToSave);
      // }

      setLocalSaveStatus('saved');
      setTimeout(() => setLocalSaveStatus(''), 3000);
    } catch (error) {
      console.error('❌ Save failed:', error);
      setLocalSaveStatus('error');
      setTimeout(() => setLocalSaveStatus(''), 5000);
    }
  }, [cartLayoutConfig, onSave, getSelectedStoreId]);


  // Handle element selection for EditorSidebar
  const handleElementClick = useCallback((slotId, element) => {
    // Don't open sidebar if currently resizing or within 200ms of resize end
    const timeSinceResize = Date.now() - lastResizeEndTime.current;
    if (isResizing || timeSinceResize < 200) {
      return;
    }
    
    // If element is a ResizeWrapper, find the actual content element inside
    let actualElement = element;
    
    if (element && element.classList && element.classList.contains('resize-none')) {
      // This is a ResizeWrapper child, look for the actual content element
      const button = element.querySelector('button');
      const svg = element.querySelector('svg');
      const input = element.querySelector('input');
      
      // Use the most specific element found
      actualElement = button || svg || input || element;
    }
    
    console.log('🎯 Selected element for EditorSidebar:', {
      slotId,
      elementType: actualElement.tagName,
      elementClasses: actualElement.className,
      isWrapper: element !== actualElement,
      outerHTML: actualElement.outerHTML.substring(0, 200) + '...',
      textContent: actualElement.textContent
    });
    
    setSelectedElement(actualElement);
    setIsSidebarVisible(true);
  }, [isResizing]);

  // Handle text changes from EditorSidebar for hierarchical slots
  const handleTextChange = useCallback((slotId, newText) => {
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          content: newText,
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      
      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      // Auto-save
      saveConfiguration(updatedConfig);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle class changes from EditorSidebar for hierarchical slots
  const handleClassChange = useCallback((slotId, className, styles, isAlignmentChange = false) => {
    console.log('🎨 handleClassChange called:', { slotId, className, styles, isAlignmentChange });

    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };

      if (updatedSlots[slotId]) {
        // Merge existing styles with new styles
        const existingStyles = updatedSlots[slotId].styles || {};
        const mergedStyles = { ...existingStyles, ...styles };

        // Define categories of classes
        const alignmentClasses = ['text-left', 'text-center', 'text-right'];
        const textStyleClasses = ['font-bold', 'font-semibold', 'font-medium', 'font-normal', 'font-light',
                                  'italic', 'underline', 'line-through', 'uppercase', 'lowercase', 'capitalize'];
        const colorClasses = className.split(' ').filter(cls =>
          cls.startsWith('text-') && !alignmentClasses.includes(cls)
        );

        const allClasses = className.split(' ').filter(Boolean);

        if (isAlignmentChange || allClasses.some(cls => alignmentClasses.includes(cls))) {
          // For alignment changes, only alignment goes to parent, everything else to element
          const alignmentClassList = allClasses.filter(cls => alignmentClasses.includes(cls));
          const elementClassList = allClasses.filter(cls => !alignmentClasses.includes(cls));

          updatedSlots[slotId] = {
            ...updatedSlots[slotId],
            className: elementClassList.join(' '),
            parentClassName: alignmentClassList.join(' '),
            styles: mergedStyles,
            metadata: {
              ...updatedSlots[slotId].metadata,
              lastModified: new Date().toISOString()
            }
          };

          console.log('✅ Updated slot configuration (alignment):', {
            slotId,
            elementClassName: elementClassList.join(' '),
            parentClassName: alignmentClassList.join(' '),
            styles: mergedStyles
          });
        } else {
          // For text styling (bold, italic, colors), keep existing parentClassName
          // and only update className for the text element
          updatedSlots[slotId] = {
            ...updatedSlots[slotId],
            className: className,
            styles: mergedStyles,
            metadata: {
              ...updatedSlots[slotId].metadata,
              lastModified: new Date().toISOString()
            }
          };

          console.log('✅ Updated slot configuration (text styling):', {
            slotId,
            className,
            preservedParentClassName: updatedSlots[slotId].parentClassName,
            styles: mergedStyles
          });
        }
      }

      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      // Auto-save
      saveConfiguration(updatedConfig);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Debounced save ref
  const saveTimeoutRef = useRef(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle grid resize changes for hierarchical slots
  const handleGridResize = useCallback((slotId, newColSpan) => {
    console.log('🔄 handleGridResize called:', { slotId, newColSpan });
    
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        // Update hierarchical slot colSpan
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          colSpan: newColSpan
        };
      }
      
      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      console.log('✅ Updated slot:', updatedConfig.slots[slotId]);

      // Debounced auto-save - clear previous timeout and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Saving configuration after resize...');
        saveConfiguration(updatedConfig);
      }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle slot container height resize changes
  const handleSlotHeightResize = useCallback((slotId, newHeight) => {
    console.log('📐 handleSlotHeightResize called:', { slotId, newHeight });
    
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        // Calculate row span based on height (rough approximation: 40px per row)
        const estimatedRowSpan = Math.max(1, Math.round(newHeight / 40));
        console.log(`📏 Height ${newHeight}px ≈ ${estimatedRowSpan} row spans`);
        
        // Update the slot's height and rowSpan
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          rowSpan: estimatedRowSpan,
          styles: {
            ...updatedSlots[slotId].styles,
            minHeight: `${newHeight}px`
          }
        };
      }
      
      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      console.log('✅ Updated slot with height:', updatedConfig.slots[slotId]);

      // Debounced auto-save - clear previous timeout and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Saving configuration after slot height resize...');
        saveConfiguration(updatedConfig);
      }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle slot repositioning using drop zones
  const handleSlotDrop = useCallback(async (draggedSlotId, targetSlotId, dropPosition) => {
    console.log('🎯 handleSlotDrop called:', { draggedSlotId, targetSlotId, dropPosition });
    console.log('📊 Current state before drop:', {
      totalSlots: Object.keys(cartLayoutConfig?.slots || {}).length,
      draggedSlotCurrent: cartLayoutConfig?.slots?.[draggedSlotId],
      targetSlotCurrent: cartLayoutConfig?.slots?.[targetSlotId]
    });

    // Mark drag operation as active to prevent config reloads
    isDragOperationActiveRef.current = true;


    if (draggedSlotId === targetSlotId) {
      console.log('⚠️ Cannot drop slot on itself');
      return;
    }

    // Prevent moving critical layout containers
    if (draggedSlotId === 'main_layout') {
      console.log('⚠️ Cannot move main layout container');
      return;
    }

    // Also prevent moving other root containers into wrong places
    if (['header_container', 'content_area', 'sidebar_area'].includes(draggedSlotId) && dropPosition !== 'after' && dropPosition !== 'before') {
      console.log('⚠️ Cannot move root containers inside other elements');
      return;
    }

    const updatedConfig = await new Promise((resolve) => {
      setCartLayoutConfig(prevConfig => {
        console.log('🔄 setCartLayoutConfig callback executed:', {
          hasPrevConfig: !!prevConfig,
          hasPrevSlots: !!prevConfig?.slots,
          slotsCount: Object.keys(prevConfig?.slots || {}).length,
          draggedExists: !!prevConfig?.slots?.[draggedSlotId],
          targetExists: !!prevConfig?.slots?.[targetSlotId]
        });

        if (!prevConfig?.slots) {
          console.error('❌ No valid configuration to update');
          resolve(null);
          return prevConfig;
        }

        // Create a deep clone to avoid mutations
        const updatedSlots = JSON.parse(JSON.stringify(prevConfig.slots));
        const draggedSlot = updatedSlots[draggedSlotId];
        const targetSlot = updatedSlots[targetSlotId];

        if (!draggedSlot || !targetSlot) {
          console.error('❌ Slot not found:', { draggedSlotId, targetSlotId });
          resolve(null);
          return prevConfig;
        }

        // Store ALL original properties to preserve them
        const originalProperties = {
          id: draggedSlot.id,
          type: draggedSlot.type,
          content: draggedSlot.content,
          className: draggedSlot.className,
          parentClassName: draggedSlot.parentClassName,
          styles: draggedSlot.styles || {},
          layout: draggedSlot.layout,
          gridCols: draggedSlot.gridCols,
          colSpan: draggedSlot.colSpan,
          rowSpan: draggedSlot.rowSpan,
          viewMode: draggedSlot.viewMode,
          metadata: draggedSlot.metadata || {},
          position: draggedSlot.position || {}
        };

        // Calculate new position based on drop zone
        let newParentId, newOrder;

        switch (dropPosition) {
          case 'before':
            newParentId = targetSlot.parentId;
            newOrder = (targetSlot.position?.order || 0);
            break;
          case 'after':
            newParentId = targetSlot.parentId;
            newOrder = (targetSlot.position?.order || 0) + 1;
            break;
          case 'inside':
            // Only allow dropping inside containers
            if (!['container', 'grid', 'flex'].includes(targetSlot.type)) {
              console.log('⚠️ Cannot drop inside non-container slot:', {
                targetSlotType: targetSlot.type,
                targetSlotId
              });
              resolve(null);
              return prevConfig;
            }
            console.log('✅ Dropping inside container:', {
              targetSlotId,
              targetSlotType: targetSlot.type,
              draggedSlotId,
              draggedSlotCurrentParent: draggedSlot.parentId,
              willChangeParentTo: targetSlotId
            });
            newParentId = targetSlotId;
            newOrder = 0;
            break;
          default:
            console.error('❌ Invalid drop position:', dropPosition);
            resolve(null);
            return prevConfig;
        }

        // Update dragged slot position while preserving ALL essential properties
        updatedSlots[draggedSlotId] = {
          ...originalProperties,
          parentId: newParentId,
          position: {
            ...originalProperties.position,
            order: newOrder
          },
          metadata: {
            ...originalProperties.metadata,
            lastModified: new Date().toISOString()
          }
        };

        // Ensure we preserve viewMode array properly
        if (Array.isArray(originalProperties.viewMode)) {
          updatedSlots[draggedSlotId].viewMode = [...originalProperties.viewMode];
        }

        // Shift other slots in the target parent to make room
        Object.keys(updatedSlots).forEach(slotId => {
          const slot = updatedSlots[slotId];
          if (slot.id !== draggedSlotId &&
              slot.parentId === newParentId &&
              (slot.position?.order || 0) >= newOrder) {
            updatedSlots[slotId] = {
              ...slot,
              position: {
                ...slot.position,
                order: (slot.position?.order || 0) + 1
              }
            };
          }
        });

        // Clean up old parent - shift slots down
        Object.keys(updatedSlots).forEach(slotId => {
          const slot = updatedSlots[slotId];
          if (slot.id !== draggedSlotId &&
              slot.parentId === originalProperties.parentId &&
              (slot.position?.order || 0) > (originalProperties.position?.order || 0)) {
            updatedSlots[slotId] = {
              ...slot,
              position: {
                ...slot.position,
                order: (slot.position?.order || 0) - 1
              }
            };
          }
        });

        console.log('✅ Repositioned slot:', {
          slot: draggedSlotId,
          from: { parent: originalProperties.parentId, order: originalProperties.position?.order },
          to: { parent: newParentId, order: newOrder },
          dropPosition: dropPosition,
          actualNewParent: updatedSlots[draggedSlotId].parentId,
          preservedViewMode: updatedSlots[draggedSlotId].viewMode,
          updatedSlot: updatedSlots[draggedSlotId]
        });

        // Debug: Log all affected slots
        console.log('🔍 All affected slots after repositioning:', {
          draggedSlot: { id: draggedSlotId, ...updatedSlots[draggedSlotId] },
          siblingsInNewParent: Object.values(updatedSlots).filter(s => s.parentId === newParentId).map(s => ({ id: s.id, order: s.position?.order })),
          siblingsInOldParent: Object.values(updatedSlots).filter(s => s.parentId === originalProperties.parentId).map(s => ({ id: s.id, order: s.position?.order }))
        });

        // Validate the updated configuration before applying
        if (!validateSlotConfiguration(updatedSlots)) {
          console.error('❌ Configuration validation failed after drag, reverting changes');
          resolve(null);
          return prevConfig;
        }

        const newConfig = {
          ...prevConfig,
          slots: updatedSlots,
          metadata: {
            ...prevConfig.metadata,
            lastModified: new Date().toISOString()
          }
        };

        console.log('📦 Final configuration to return:', {
          configSlotsCount: Object.keys(newConfig.slots).length,
          draggedSlotFinal: newConfig.slots[draggedSlotId],
          willResolve: true
        });

        resolve(newConfig);
        return newConfig;
      });
    });

    console.log('🎬 After setCartLayoutConfig promise resolved:', {
      hasUpdatedConfig: !!updatedConfig,
      updatedConfigSlotsCount: updatedConfig ? Object.keys(updatedConfig.slots || {}).length : 0,
      draggedSlotInUpdated: updatedConfig?.slots?.[draggedSlotId]
    });

    if (updatedConfig) {
      console.log('💾 About to save configuration...');
      console.log('📋 Config to save details:', {
        slots: Object.keys(updatedConfig.slots),
        draggedSlot: updatedConfig.slots[draggedSlotId]
      });

      try {
        await saveConfiguration(updatedConfig);
        console.log('✅ Configuration saved successfully');

        // Mark drag operation as complete after save
        setTimeout(() => {
          isDragOperationActiveRef.current = false;
          console.log('🏁 Drag operation protection ended');
        }, 2000); // 2 second protection after save
      } catch (error) {
        console.error('❌ Failed to save configuration:', error);
        isDragOperationActiveRef.current = false;
      }
    } else {
      console.warn('⚠️ No updated configuration to save - drag operation was cancelled');
      isDragOperationActiveRef.current = false;
    }

  }, [saveConfiguration, validateSlotConfiguration]);

  // Debug mode - keyboard shortcut to run tests (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        console.log('🐛 Debug mode activated - Running drag and drop tests...');
        await runDragDropTests(handleSlotDrop, validateSlotConfiguration, cartLayoutConfig);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cartLayoutConfig, handleSlotDrop, validateSlotConfiguration]);

  // Main render - Clean and maintainable  
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'pr-80' : ''
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Mode Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('empty')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'empty'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                  Empty Cart
                </button>
                <button
                  onClick={() => setViewMode('withProducts')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'withProducts'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" />
                  With Products
                </button>
              </div>

              {/* Edit mode controls */}
              {mode === 'edit' && (
                <>
                  {/* Save Status */}
                  {localSaveStatus && (
                    <div className={`flex items-center gap-2 text-sm ${
                      localSaveStatus === 'saving' ? 'text-blue-600' :
                      localSaveStatus === 'saved' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {localSaveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {localSaveStatus === 'saved' && '✓ Saved'}
                      {localSaveStatus === 'error' && '✗ Save Failed'}
                    </div>
                  )}

                  <Button onClick={() => saveConfiguration()} disabled={localSaveStatus === 'saving'} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Cart Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <Button
                onClick={() => setShowSlotBorders(!showSlotBorders)}
                variant={showSlotBorders ? "default" : "outline"}
                className={"mb-3"}
                size="sm"
                title={showSlotBorders ? "Hide slot borders" : "Show slot borders"}
            >
              <Square className="w-4 h-4 mr-2" />
              Borders
            </Button>

            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig && cartLayoutConfig.slots && Object.keys(cartLayoutConfig.slots).length > 0 ? (
                <HierarchicalSlotRenderer
                  slots={cartLayoutConfig.slots}
                  parentId={null}
                  mode={mode}
                  viewMode={viewMode}
                  showBorders={showSlotBorders}
                  currentDragInfo={currentDragInfo}
                  setCurrentDragInfo={setCurrentDragInfo}
                  onElementClick={handleElementClick}
                  onGridResize={handleGridResize}
                  onSlotHeightResize={handleSlotHeightResize}
                  onSlotDrop={handleSlotDrop}
                  onResizeStart={() => setIsResizing(true)}
                  onResizeEnd={() => {
                    lastResizeEndTime.current = Date.now();
                    // Add a small delay to prevent click events from firing immediately after resize
                    setTimeout(() => setIsResizing(false), 100);
                  }}
                  selectedElementId={selectedElement ? selectedElement.getAttribute('data-slot-id') : null}
                />
              ) : (
                <div className="col-span-12 text-center py-12 text-gray-500">
                  {cartLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
                </div>
              )}
            </div>

            <CmsBlockRenderer position="cart_above_items" />

            <CmsBlockRenderer position="cart_below_items" />
          </div>
        </div>
      </div>

      {/* EditorSidebar - only show in edit mode */}
      {mode === 'edit' && isSidebarVisible && selectedElement && (
        <EditorSidebar
          selectedElement={selectedElement}
          slotId={selectedElement?.getAttribute ? selectedElement.getAttribute('data-slot-id') : null}
          slotConfig={cartLayoutConfig && cartLayoutConfig.slots && selectedElement?.getAttribute ? cartLayoutConfig.slots[selectedElement.getAttribute('data-slot-id')] : null}
          onTextChange={handleTextChange}
          onClassChange={handleClassChange}
          onInlineClassChange={handleClassChange}
          onClearSelection={() => {
            setSelectedElement(null);
            setIsSidebarVisible(false);
          }}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default CartSlotsEditor;
