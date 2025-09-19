/**
 * Generic slot components for all page editors
 * These components are reusable across Cart, Product, Category, Checkout, and Success editors
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Image, Square, Settings, Plus, Loader2, Save, Code, X, Check, Rocket, Trash2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import { SlotManager } from '@/utils/slotUtils';
import FilePickerModal from '@/components/ui/FilePickerModal';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';

// EditModeControls Component
export function EditModeControls({ localSaveStatus, publishStatus, saveConfiguration, onPublish, hasChanges = false }) {
  return (
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

      {/* Publish Status */}
      {publishStatus && (
        <div className={`flex items-center gap-2 text-sm ${
          publishStatus === 'publishing' ? 'text-blue-600' :
          publishStatus === 'published' ? 'text-green-600' :
          'text-red-600'
        }`}>
          {publishStatus === 'publishing' && <Loader2 className="w-4 h-4 animate-spin" />}
          {publishStatus === 'published' && '🚀 Published'}
          {publishStatus === 'error' && '✗ Publish Failed'}
        </div>
      )}
      <Button onClick={() => saveConfiguration()} disabled={localSaveStatus === 'saving'} variant="outline" size="sm">
        <Save className="w-4 h-4 mr-2" />
        Save
      </Button>
    </>
  );
}

// GridResizeHandle Component
export function GridResizeHandle({ onResize, currentValue, maxValue = 12, minValue = 1, direction = 'horizontal', parentHovered = false, onResizeStart, onResizeEnd, onHoverChange }) {
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
      const sensitivity = 25;
      const colSpanDelta = Math.round(deltaX / sensitivity);
      const newColSpan = Math.max(minValue, Math.min(maxValue, startValue + colSpanDelta));
      onResize(newColSpan);
    } else if (direction === 'vertical') {
      const deltaY = e.clientY - startY;
      const heightDelta = Math.round(deltaY / 1);
      const newHeight = Math.max(20, startValue + heightDelta);
      onResize(newHeight);
    }
  }, [currentValue, maxValue, minValue, onResize, direction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

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
      <div className={`w-full h-full rounded-md flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center justify-center gap-0.5 border shadow-sm transition-colors duration-150 ${
        isDragging
          ? 'bg-blue-600 border-blue-700 shadow-lg'
          : isHovered || parentHovered
            ? 'bg-blue-500 border-blue-600 shadow-md'
            : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
      }`}>
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-90"></div>
      </div>

      {isDragging && (
        <div className={`absolute ${isHorizontal ? '-top-6 left-1/2 -translate-x-1/2' : '-left-10 top-1/2 -translate-y-1/2'}
          bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`}>
          {isHorizontal ? `${currentValue} / ${maxValue}` : `${currentValue}px`}
        </div>
      )}
    </div>
  );
}

// EditableElement Component
export function EditableElement({
  slotId,
  children,
  className,
  style,
  onClick,
  canResize = false,
  draggable = false,
  mode = 'edit',
  selectedElementId = null,
  onElementResize = null
}) {
  const handleClick = useCallback((e) => {
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
      className={className || ''}
      style={style}
      onClick={handleClick}
      data-slot-id={slotId}
      data-editable={mode === 'edit'}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </EditorInteractionWrapper>
  );

  if (canResize && mode === 'edit') {
    return (
      <ResizeWrapper
        minWidth={50}
        minHeight={20}
        onResize={onElementResize}
      >
        {content}
      </ResizeWrapper>
    );
  }

  return content;
}

// GridColumn Component
export function GridColumn({
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
  onSlotDelete, // Add delete handler prop
  mode = 'edit',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  children,
  isNested = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropZone, setDropZone] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragOverTimeoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverResizeHandle, setIsOverResizeHandle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isContainerType = ['container', 'grid', 'flex'].includes(slot?.type);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan >= 1;
  const showVerticalHandle = onSlotHeightResize && mode === 'edit';

  const handleDragStart = useCallback((e) => {
    if (mode !== 'edit') return;

    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';

    if (setCurrentDragInfo) {
      setCurrentDragInfo({
        draggedSlotId: slotId,
        slotId: slotId,
        parentId: slot?.parentId
      });
    }

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

    e.dataTransfer.setDragImage(dragImage, 60, 20);

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

    if (setCurrentDragInfo) {
      setCurrentDragInfo(null);
    }
  }, [slotId, setCurrentDragInfo]);

  const handleDragOver = useCallback((e) => {
    if (mode !== 'edit') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (['container', 'grid', 'flex'].includes(slot?.type)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      if (y > height * 0.25 && y < height * 0.75) {
        e.stopPropagation();
      }
    }

    if (!isDragging) {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }

      if (!isDragOver) {
        setIsDragOver(true);
        setIsDragActive(true);
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      const isContainer = ['container', 'grid', 'flex'].includes(slot?.type);
      let newDropZone = null;

      // Get the dragged slot info to determine valid drop types
      const draggedSlotId = currentDragInfo?.draggedSlotId;
      const draggedSlot = draggedSlotId ? slots[draggedSlotId] : null;
      const draggedParent = draggedSlot?.parentId;
      const targetParent = slot?.parentId;

      // Debug logging for drop zone detection
      console.log(`🔍 Drag detection: ${draggedSlotId} over ${slot?.id}`, {
        draggedParent,
        targetParent,
        y: Math.round(y),
        height: Math.round(height),
        yPercent: Math.round((y / height) * 100)
      });

      if (y < height * 0.33) {
        // Top third - "before"
        newDropZone = 'before';
        e.dataTransfer.dropEffect = 'move';
        console.log(`🔴 BEFORE zone detected: y=${y}, height=${height}, percentage=${Math.round((y/height)*100)}%`);
      } else if (y > height * 0.67) {
        // Bottom third - "after"
        newDropZone = 'after';
        e.dataTransfer.dropEffect = 'move';
        console.log(`🟢 AFTER zone detected: y=${y}, height=${height}, percentage=${Math.round((y/height)*100)}%`);
      } else {
        // Middle area - only allow "inside" for containers
        if (isContainer && draggedSlotId && draggedSlotId !== slot?.id) {
          newDropZone = 'inside';
          e.dataTransfer.dropEffect = 'move';
        } else {
          // Non-container in middle area - show forbidden cursor
          e.dataTransfer.dropEffect = 'none';
          newDropZone = null;
        }
      }

      if (newDropZone !== dropZone) {
        console.log(`🎯 Drop zone changed for ${slot?.id}: ${dropZone} → ${newDropZone}`);
        setDropZone(newDropZone);
      }
    }
  }, [mode, isDragging, slot?.type, isDragOver, dropZone]);

  const handleDragLeave = useCallback((e) => {
    const relatedTarget = e.relatedTarget;
    const currentTarget = e.currentTarget;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      dragOverTimeoutRef.current = setTimeout(() => {
        setIsDragOver(false);
        setDropZone(null);
        setIsDragActive(false);
      }, 200);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    if (mode !== 'edit') return;

    e.preventDefault();
    e.stopPropagation();

    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
    }

    setIsDragOver(false);
    setIsDragActive(false);

    if (isDragging) {
      return;
    }

    const draggedSlotId = e.dataTransfer.getData('text/plain');
    const dropPosition = dropZone || 'after';

    if (draggedSlotId && draggedSlotId !== slotId && onSlotDrop) {
      onSlotDrop(draggedSlotId, slotId, dropPosition);
    }

    setDropZone(null);
  }, [slotId, onSlotDrop, mode, isDragging, dropZone]);

  const gridStyles = {
    gridColumn: `span ${colSpan}`,
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
    zIndex: 2,
    // Add container-specific styles when it's a container type
    ...(['container', 'grid', 'flex'].includes(slot?.type) ? {
      minHeight: mode === 'edit' ? '80px' : slot.styles?.minHeight,
    } : {}),
    // Only apply layout-related styles to grid wrapper using whitelist approach
    // All other styles (colors, fonts, etc.) should go to the actual elements
    ...Object.fromEntries(
      Object.entries(slot?.styles || {}).filter(([key]) => {
        // Whitelist of layout-only styles that are safe for grid wrapper
        // Explicitly exclude color/appearance styles so they go to the actual element
        const layoutStyles = [
          'width', 'minWidth', 'maxWidth',
          'height', 'minHeight', 'maxHeight',
          'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
          'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
          'display', 'position', 'top', 'right', 'bottom', 'left',
          'zIndex', 'overflow', 'overflowX', 'overflowY',
          'flexBasis', 'flexGrow', 'flexShrink',
          'textAlign' // Allow textAlign - can work alongside parentClassName (text-center, etc.)
        ];

        // For content slots (button, text, image, link), exclude width/height from grid wrapper
        // These should only be applied to the actual content element
        const isContentSlot = ['button', 'text', 'image', 'link'].includes(slot?.type);
        const contentExclusionStyles = isContentSlot ? ['width', 'height'] : [];

        // Exclude color and appearance styles from grid wrapper
        const colorStyles = [
          'color', 'backgroundColor', 'background', 'borderColor', 'border',
          'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
          'borderRadius', 'borderStyle', 'borderWidth',
          'fontSize', 'fontWeight', 'fontFamily', 'lineHeight',
          'boxShadow', 'textShadow', 'opacity', 'transform'
        ];
        return layoutStyles.includes(key) && !colorStyles.includes(key) && !contentExclusionStyles.includes(key);
      })
    )
  };

  return (
    <div
      className={`${
        mode === 'edit'
          ? `${showBorders ? (isNested ? 'border border-dashed' : 'border-2 border-dashed') : 'border border-transparent'} rounded-lg overflow-hidden transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-200/60 z-10 ring-2 ring-blue-300' :
              isDragging
                ? 'border-blue-600 bg-blue-50/60 shadow-xl shadow-blue-200/60 ring-2 ring-blue-200 opacity-80' :
              isHovered
                ? `border-blue-500 ${isNested ? 'border' : 'border-2'} border-dashed shadow-md shadow-blue-200/40`
                : showBorders
                ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/20'
                : 'hover:border-blue-400 hover:border-2 hover:border-dashed hover:bg-blue-50/10'
            } p-2 ${isOverResizeHandle ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`
          : 'overflow-hidden'
      } relative responsive-slot ${
        ['container', 'grid', 'flex'].includes(slot?.type)
          ? `w-full h-full grid grid-cols-12 gap-2 ${slot.className}`
          : ''
      }`}
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
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) {
          setIsDragOver(false);
          setIsDragActive(false);
          setDropZone(null);
        }
      }}
      style={gridStyles}
    >
      {mode === 'edit' && isDragActive && dropZone && (
        <>
          {dropZone === 'before' && (
            <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 z-50">
              {console.log(`🔵 Rendering insertion line BEFORE ${slot?.id}`)}
            </div>
          )}
          {dropZone === 'after' && (
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 z-50">
              {console.log(`🔵 Rendering insertion line AFTER ${slot?.id}`)}
            </div>
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

      {mode === 'edit' && isHovered && !isOverResizeHandle && (
        <>
          {/* Delete button - only show for custom slots (not default ones) */}
          {slot?.isCustom === true && onSlotDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteModal(true);
              }}
              className="absolute bottom-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded p-1 z-30 transition-colors duration-200"
              title="Delete slot"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <div
            className="absolute top-1 right-1 text-blue-500 text-sm opacity-60 pointer-events-none z-30"
            title="Drag to reposition"
          >
            ⋮⋮
          </div>
        </>
      )}

      {children}

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative z-[10000]" style={{ zIndex: 100000 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Slot</h3>
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-red-800">This action cannot be undone</p>
                  <p className="text-sm text-red-600">
                    Are you sure you want to delete this {slot?.type || 'slot'}?
                    {slot?.content && (
                      <span className="block mt-1 font-mono text-xs bg-red-100 p-1 rounded">
                        "{slot.content.substring(0, 50)}{slot.content.length > 50 ? '...' : ''}"
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onSlotDelete(slotId);
                    setShowDeleteModal(false);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// HierarchicalSlotRenderer Component
export function HierarchicalSlotRenderer({
  slots,
  parentId = null,
  mode,
  viewMode = 'emptyCart',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onSlotDelete, // Add delete handler prop
  onResizeStart,
  onResizeEnd,
  selectedElementId = null,
  setPageConfig,
  saveConfiguration,
  saveTimeoutRef
}) {
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  const filteredSlots = childSlots.filter(slot => {
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true;
    }
    return slot.viewMode.includes(viewMode);
  });

  // Sort slots by grid coordinates for proper visual ordering (same as storefront)
  const sortedSlots = filteredSlots.sort((a, b) => {
    const hasGridCoordsA = a.position && (a.position.col !== undefined && a.position.row !== undefined);
    const hasGridCoordsB = b.position && (b.position.col !== undefined && b.position.row !== undefined);

    if (hasGridCoordsA && hasGridCoordsB) {
      // Sort by row first, then by column
      const rowA = a.position.row;
      const rowB = b.position.row;

      if (rowA !== rowB) {
        return rowA - rowB;
      }

      const colA = a.position.col;
      const colB = b.position.col;

      if (colA !== colB) {
        return colA - colB;
      }
    }

    // If one has coords and other doesn't, prioritize the one with coords
    if (hasGridCoordsA && !hasGridCoordsB) return -1;
    if (!hasGridCoordsA && hasGridCoordsB) return 1;

    // Default: maintain original order for slots without coordinates
    return 0;
  });

  return sortedSlots.map(slot => {
    let colSpan = slot.colSpan || 12;
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
        onSlotDelete={onSlotDelete}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        mode={mode}
        showBorders={showBorders}
        isNested={true}
      >
          {slot.type === 'text' && mode === 'edit' && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', slot.id);
                e.dataTransfer.effectAllowed = 'move';

                if (setCurrentDragInfo) {
                  setCurrentDragInfo({
                    draggedSlotId: slot.id,
                    slotId: slot.id,
                    parentId: slot.parentId
                  });
                }
              }}
              style={{ display: 'inline-block' }}
              onDragEnd={(e) => {
                if (setCurrentDragInfo) {
                  setCurrentDragInfo(null);
                }
              }}
            >
              <ResizeWrapper
                minWidth={20}
                minHeight={16}
                onResize={(newSize) => {
                setPageConfig(prevConfig => {
                  const updatedSlots = { ...prevConfig?.slots };
                  if (updatedSlots[slot.id]) {
                    updatedSlots[slot.id] = {
                      ...updatedSlots[slot.id],
                      styles: {
                        ...updatedSlots[slot.id].styles,
                        width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                        height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                      }
                    };
                  }

                  const updatedConfig = { ...prevConfig, slots: updatedSlots };

                  // Debounced auto-save - clear previous timeout and set new one
                  if (saveTimeoutRef && saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  if (saveTimeoutRef && saveConfiguration) {
                    saveTimeoutRef.current = setTimeout(() => {
                      saveConfiguration(updatedConfig);
                    }, 500); // Wait 0.5 seconds after resize stops
                  }

                  return updatedConfig;
                });
              }}
            >
              <span
                className={`${slot.parentClassName || ''} ${slot.className || ''}`}
                style={{
                  ...slot.styles,
                  cursor: 'pointer',
                  ...(slot.className?.includes('italic') && { fontStyle: 'italic' }),
                  display: 'inline-block',
                  // Use fit-content for w-fit elements, otherwise 100%
                  width: slot.className?.includes('w-fit') ? 'fit-content' : '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onElementClick(slot.id, e.currentTarget);
                }}
                data-slot-id={slot.id}
                data-editable="true"
                dangerouslySetInnerHTML={{
                  __html: String(slot.content || `Text: ${slot.id}`)
                }}
              />
            </ResizeWrapper>
            </div>
          )}

          {slot.type === 'text' && mode !== 'edit' && (
            <span
              className={`${slot.parentClassName || ''} ${slot.className}`}
              style={{
                ...slot.styles,
                ...(slot.className?.includes('italic') && { fontStyle: 'italic' })
              }}
              dangerouslySetInnerHTML={{
                __html: String(slot.content || `Text: ${slot.id}`)
              }}
            />
          )}

          {slot.type === 'button' && mode === 'edit' && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', slot.id);
                e.dataTransfer.effectAllowed = 'move';

                if (setCurrentDragInfo) {
                  setCurrentDragInfo({
                    draggedSlotId: slot.id,
                    slotId: slot.id,
                    parentId: slot.parentId
                  });
                }
              }}
              style={{ display: 'inline-block' }}
              onDragEnd={(e) => {
                if (setCurrentDragInfo) {
                  setCurrentDragInfo(null);
                }
              }}
            >
              <ResizeWrapper
              minWidth={50}
              minHeight={20}
              onResize={(newSize) => {
                setPageConfig(prevConfig => {
                  const updatedSlots = { ...prevConfig?.slots };
                  if (updatedSlots[slot.id]) {
                    updatedSlots[slot.id] = {
                      ...updatedSlots[slot.id],
                      styles: {
                        ...updatedSlots[slot.id].styles,
                        width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                        height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                      }
                    };
                  }

                  const updatedConfig = { ...prevConfig, slots: updatedSlots };

                  // Debounced auto-save - clear previous timeout and set new one
                  if (saveTimeoutRef && saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  if (saveTimeoutRef && saveConfiguration) {
                    saveTimeoutRef.current = setTimeout(() => {
                      saveConfiguration(updatedConfig);
                    }, 500); // Wait 0.5 seconds after resize stops
                  }

                  return updatedConfig;
                });
              }}
            >
              <button
                className={`${slot.parentClassName || ''} ${slot.className}`}
                style={{
                  ...slot.styles,
                  cursor: 'pointer',
                  minWidth: 'auto',
                  minHeight: 'auto',
                  display: 'inline-block'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onElementClick(slot.id, e.currentTarget);
                }}
                data-slot-id={slot.id}
                data-editable="true"
              >
                {(() => {
                  // For buttons, extract text content only (no HTML wrappers)
                  const content = String(slot.content || `Button: ${slot.id}`);
                  if (content.includes('<')) {
                    // If content contains HTML, extract just the text
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    return tempDiv.textContent || tempDiv.innerText || content;
                  }
                  return content;
                })()}
              </button>
            </ResizeWrapper>
            </div>
          )}

              {slot.type === 'button' && mode !== 'edit' && (
                <button
                  className={`${slot.parentClassName || ''} ${slot.className}`}
                  style={{
                    ...slot.styles,
                    minWidth: 'auto',
                    minHeight: 'auto'
                  }}
                >
                  {(() => {
                    // For buttons, extract text content only (no HTML wrappers)
                    const content = String(slot.content || `Button: ${slot.id}`);
                    if (content.includes('<')) {
                      // If content contains HTML, extract just the text
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = content;
                      return tempDiv.textContent || tempDiv.innerText || content;
                    }
                    return content;
                  })()}
                </button>
              )}

              {slot.type === 'link' && mode === 'edit' && (
                <div
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', slot.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  style={{ display: 'inline-block' }}
                >
                  <ResizeWrapper
                      minWidth={50}
                      minHeight={20}
                      onResize={(newSize) => {
                        setPageConfig(prevConfig => {
                          const updatedSlots = { ...prevConfig?.slots };
                          if (updatedSlots[slot.id]) {
                            updatedSlots[slot.id] = {
                              ...updatedSlots[slot.id],
                              styles: {
                                ...updatedSlots[slot.id].styles,
                                width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                                height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                              }
                            };
                          }

                          const updatedConfig = { ...prevConfig, slots: updatedSlots };

                          // Debounced auto-save - clear previous timeout and set new one
                          if (saveTimeoutRef && saveTimeoutRef.current) {
                            clearTimeout(saveTimeoutRef.current);
                          }
                          if (saveTimeoutRef && saveConfiguration) {
                            saveTimeoutRef.current = setTimeout(() => {
                              saveConfiguration(updatedConfig);
                            }, 500); // Wait 0.5 seconds after resize stops
                          }

                          return updatedConfig;
                        });
                      }}
                    >
                      <div className={slot.className?.includes('w-fit') ? 'w-fit h-full' : 'w-full h-full'}>
                        <a
                          href={slot.href || '#'}
                          className={`${slot.parentClassName || ''} ${slot.className}`}
                          style={{
                            ...slot.styles,
                            cursor: 'pointer',
                            minWidth: 'auto',
                            minHeight: 'auto',
                            display: 'inline-block',
                            width: slot.className?.includes('w-fit') ? 'fit-content' : '100%'
                          }}
                          target={slot.target || '_self'}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onElementClick(slot.id, e.currentTarget);
                          }}
                          data-slot-id={slot.id}
                          data-editable="true"
                        >
                          {(() => {
                            // For links, extract text content only (no HTML wrappers)
                            const content = String(slot.content || `Link: ${slot.id}`);
                            if (content.includes('<')) {
                              // If content contains HTML, extract just the text
                              const tempDiv = document.createElement('div');
                              tempDiv.innerHTML = content;
                              return tempDiv.textContent || tempDiv.innerText || content;
                            }
                            return content;
                          })()}
                        </a>
                      </div>
                    </ResizeWrapper>
                </div>
              )}

              {slot.type === 'link' && mode !== 'edit' && (
                <a
                  href={slot.href || '#'}
                  className={`${slot.parentClassName || ''} ${slot.className}`}
                  style={{
                    ...slot.styles,
                    minWidth: 'auto',
                    minHeight: 'auto'
                  }}
                  target={slot.target || '_self'}
                  rel="noopener noreferrer"
                >
                  {(() => {
                    // For links, extract text content only (no HTML wrappers)
                    const content = String(slot.content || `Link: ${slot.id}`);
                    if (content.includes('<')) {
                      // If content contains HTML, extract just the text
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = content;
                      return tempDiv.textContent || tempDiv.innerText || content;
                    }
                    return content;
                  })()}
                </a>
              )}

              {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
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
                  onSlotDelete={onSlotDelete}
                  onResizeStart={onResizeStart}
                  onResizeEnd={onResizeEnd}
                  selectedElementId={selectedElementId}
                  setPageConfig={setPageConfig}
                  saveConfiguration={saveConfiguration}
                  saveTimeoutRef={saveTimeoutRef}
                />
              )}

          {slot.type === 'image' && mode === 'edit' && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', slot.id);
                e.dataTransfer.effectAllowed = 'move';

                if (setCurrentDragInfo) {
                  setCurrentDragInfo({
                    draggedSlotId: slot.id,
                    slotId: slot.id,
                    parentId: slot.parentId
                  });
                }
              }}
              style={{ display: 'inline-block' }}
              onDragEnd={(e) => {
                if (setCurrentDragInfo) {
                  setCurrentDragInfo(null);
                }
              }}
            >
              <ResizeWrapper
              minWidth={50}
              minHeight={50}
              initialWidth={slot.styles?.width}
              initialHeight={slot.styles?.height}
              onResize={(newSize) => {
                setPageConfig(prevConfig => {
                  const updatedSlots = { ...prevConfig?.slots };
                  if (updatedSlots[slot.id]) {
                    updatedSlots[slot.id] = {
                      ...updatedSlots[slot.id],
                      styles: {
                        ...updatedSlots[slot.id].styles,
                        width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                        height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                      }
                    };
                  }

                  const updatedConfig = { ...prevConfig, slots: updatedSlots };

                  // Debounced auto-save - clear previous timeout and set new one
                  if (saveTimeoutRef && saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  if (saveTimeoutRef && saveConfiguration) {
                    saveTimeoutRef.current = setTimeout(() => {
                      saveConfiguration(updatedConfig);
                    }, 500); // Wait 0.5 seconds after resize stops
                  }

                  return updatedConfig;
                });
              }}
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onElementClick(slot.id, e.currentTarget);
                }}
                data-slot-id={slot.id}
                data-editable="true"
                style={{
                  cursor: 'pointer',
                  display: 'inline-block',
                  width: slot.styles?.width || '100%',
                  height: slot.styles?.height || '100%'
                }}
              >
                {slot.content ? (
                  <img
                    src={slot.content}
                    alt={slot.metadata?.alt || slot.metadata?.fileName || 'Slot image'}
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded w-full h-full">
                    <Image className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">No image selected</span>
                  </div>
                )}
              </div>
            </ResizeWrapper>
            </div>
          )}

          {slot.type === 'input' && mode === 'edit' && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', slot.id);
                e.dataTransfer.effectAllowed = 'move';

                if (setCurrentDragInfo) {
                  setCurrentDragInfo({
                    draggedSlotId: slot.id,
                    slotId: slot.id,
                    parentId: slot.parentId
                  });
                }
              }}
              style={{ display: 'inline-block' }}
              onDragEnd={(e) => {
                if (setCurrentDragInfo) {
                  setCurrentDragInfo(null);
                }
              }}
            >
              <ResizeWrapper
              minWidth={100}
              minHeight={30}
              onResize={(newSize) => {
                setPageConfig(prevConfig => {
                  const updatedSlots = { ...prevConfig?.slots };
                  if (updatedSlots[slot.id]) {
                    updatedSlots[slot.id] = {
                      ...updatedSlots[slot.id],
                      styles: {
                        ...updatedSlots[slot.id].styles,
                        width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                        height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                      }
                    };
                  }

                  const updatedConfig = { ...prevConfig, slots: updatedSlots };

                  // Debounced auto-save - clear previous timeout and set new one
                  if (saveTimeoutRef && saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  if (saveTimeoutRef && saveConfiguration) {
                    saveTimeoutRef.current = setTimeout(() => {
                      saveConfiguration(updatedConfig);
                    }, 500); // Wait 0.5 seconds after resize stops
                  }

                  return updatedConfig;
                });
              }}
            >
              <input
                className={`w-full h-full ${slot.className}`}
                style={{
                  ...slot.styles,
                  minWidth: 'auto',
                  minHeight: 'auto',
                  cursor: 'pointer'
                }}
                placeholder={String(slot.content || '')}
                type="text"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onElementClick(slot.id, e.currentTarget);
                }}
                data-slot-id={slot.id}
                data-editable="true"
              />
            </ResizeWrapper>
            </div>
          )}

          {slot.type === 'image' && mode !== 'edit' && (
            <div
              style={{
                ...slot.styles,
                display: 'inline-block',
                width: slot.styles?.width || '100%',
                height: slot.styles?.height || '100%'
              }}
            >
              {slot.content ? (
                <img
                  src={slot.content}
                  alt={slot.metadata?.alt || slot.metadata?.fileName || 'Slot image'}
                  className="w-full h-full object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded w-full h-full">
                  <Image className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">No image selected</span>
                </div>
              )}
            </div>
          )}

          {slot.type === 'input' && mode !== 'edit' && (
            <input
              className={`w-full h-full ${slot.className}`}
              style={{
                ...slot.styles,
                minWidth: 'auto',
                minHeight: 'auto'
              }}
              placeholder={String(slot.content || '')}
              type="text"
            />
          )}

          {slot.type !== 'button' && slot.type !== 'link' && slot.type !== 'text' && slot.type !== 'image' && slot.type !== 'input' && slot.type !== 'container' && slot.type !== 'grid' && slot.type !== 'flex' && (
                <EditableElement
                  slotId={slot.id}
                  mode={mode}
                  onClick={onElementClick}
                  className={slot.parentClassName || ''}
                  style={slot.styles || {}}
                  canResize={true}
                  draggable={true}
                  selectedElementId={selectedElementId}
                  onElementResize={(newSize) => {
                    setPageConfig(prevConfig => {
                      const updatedSlots = { ...prevConfig?.slots };
                      if (updatedSlots[slot.id]) {
                        updatedSlots[slot.id] = {
                          ...updatedSlots[slot.id],
                          styles: {
                            ...updatedSlots[slot.id].styles,
                            width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                            height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                          }
                        };
                      }

                      const updatedConfig = { ...prevConfig, slots: updatedSlots };

                      // Debounced auto-save - clear previous timeout and set new one
                      if (saveTimeoutRef && saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      if (saveTimeoutRef && saveConfiguration) {
                        saveTimeoutRef.current = setTimeout(() => {
                          saveConfiguration(updatedConfig);
                        }, 500); // Wait 0.5 seconds after resize stops
                      }

                      return updatedConfig;
                    });
                  }}
                >
                  {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
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
                      onSlotDelete={onSlotDelete}
                      onResizeStart={onResizeStart}
                      onResizeEnd={onResizeEnd}
                      selectedElementId={selectedElementId}
                      setPageConfig={setPageConfig}
                      saveConfiguration={saveConfiguration}
                      saveTimeoutRef={saveTimeoutRef}
                    />
                  )}
                </EditableElement>
              )}
      </GridColumn>
    );
  });
}

// BorderToggleButton Component
export function BorderToggleButton({ showSlotBorders, onToggle }) {
  return (
    <Button
      onClick={onToggle}
      variant={showSlotBorders ? "default" : "outline"}
      size="sm"
      title={showSlotBorders ? "Hide slot borders" : "Show slot borders"}
    >
      <Square className="w-4 h-4 mr-2" />
      Borders
    </Button>
  );
}

// EditorToolbar Component
export function EditorToolbar({ onResetLayout, onAddSlot, onShowCode, showSlotBorders, onToggleBorders }) {
  return (
    <div className="flex mb-3 justify-between">
      <BorderToggleButton
        showSlotBorders={showSlotBorders}
        onToggle={onToggleBorders}
      />

      <div className="flex gap-2 ml-3">
        <Button
          onClick={onAddSlot}
          variant="outline"
          size="sm"
          className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>

        <Button
          onClick={onShowCode}
          variant="outline"
          size="sm"
          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200"
        >
          <Code className="w-4 h-4 mr-2" />
          Code
        </Button>

        <Button
            onClick={onResetLayout}
            variant="outline"
            size="sm"
            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200"
        >
          <Settings className="w-4 h-4 mr-2" />
          Reset Layout
        </Button>



      </div>
    </div>
  );
}

// AddSlotModal Component
export function AddSlotModal({
  isOpen,
  onClose,
  onCreateSlot,
  onShowFilePicker
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add New Slot</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
              onCreateSlot('container');
              onClose();
            }}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center">
              <Square className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Container</div>
                <div className="text-sm text-gray-500">A flexible container for other elements</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onCreateSlot('text', 'New text content');
              onClose();
            }}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center">
              <span className="w-5 h-5 mr-3 text-green-600 font-bold">T</span>
              <div>
                <div className="font-medium">Text</div>
                <div className="text-sm text-gray-500">Add text content</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onCreateSlot('button', 'Click me');
              onClose();
            }}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center">
              <span className="w-5 h-5 mr-3 text-blue-600 font-bold">B</span>
              <div>
                <div className="font-medium">Button</div>
                <div className="text-sm text-gray-500">Add a clickable button</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onCreateSlot('link', 'Link text');
              onClose();
            }}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center">
              <span className="w-5 h-5 mr-3 text-indigo-600 font-bold">🔗</span>
              <div>
                <div className="font-medium">Link</div>
                <div className="text-sm text-gray-500">Add a clickable link</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onClose();
              onShowFilePicker();
            }}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center">
              <span className="w-5 h-5 mr-3 text-purple-600">🖼️</span>
              <div>
                <div className="font-medium">Image</div>
                <div className="text-sm text-gray-500">Add an image from File Library</div>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ResetLayoutModal Component
export function ResetLayoutModal({
  isOpen,
  onClose,
  onConfirm,
  isResetting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">Reset Layout</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-red-600">⚠️</div>
            <div>
              <p className="font-medium text-red-800">This action cannot be undone</p>
              <p className="text-sm text-red-600">All current layout changes will be lost and replaced with the default configuration.</p>
              <p className="text-sm text-amber-600 font-medium mt-1">Only affects the current page - other pages remain unchanged.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant="destructive"
              className="flex-1"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Layout'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// FilePickerModalWrapper Component
export function FilePickerModalWrapper({
  isOpen,
  onClose,
  onCreateSlot,
  fileType = "image"
}) {
  return (
    <FilePickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={(selectedFile) => {
        // Create image slot with selected file
        onCreateSlot('image', selectedFile.url, 'main_layout', {
          src: selectedFile.url,
          alt: selectedFile.name,
          fileName: selectedFile.name,
          mimeType: selectedFile.mimeType
        });
      }}
      fileType={fileType}
    />
  );
}

// TimestampsRow Component
export function TimestampsRow({
  draftConfig,
  latestPublished,
  formatTimeAgo,
  currentViewport,
  onViewportChange
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
      <div className="flex justify-between items-center text-xs text-gray-500 pb-6">
        <div className="flex items-center">
          {draftConfig?.updated_at && (
            <span>Last modified: {formatTimeAgo(draftConfig.updated_at)}</span>
          )}
        </div>

        {/* Centered Viewport Mode Selector */}
        <div className="flex items-center">
          {currentViewport && onViewportChange && (
            <ViewportModeSelector
              currentViewport={currentViewport}
              onViewportChange={onViewportChange}
              className=""
            />
          )}
        </div>

        <div className="flex items-center">
          {latestPublished?.published_at && (
            <span>Last published: {formatTimeAgo(latestPublished.published_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// PublishPanelToggle Component
export function PublishPanelToggle({
  hasUnsavedChanges = false,
  showPublishPanel = false,
  onTogglePublishPanel,
  onClosePublishPanel
}) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant={hasUnsavedChanges ? "default" : "outline"}
        size="sm"
        onClick={() => {
          if (onClosePublishPanel) {
            onClosePublishPanel();
          }
          if (onTogglePublishPanel) {
            onTogglePublishPanel(!showPublishPanel);
          }
        }}
        className={`${showPublishPanel ?
          (hasUnsavedChanges ? 'bg-green-600 border-green-600 hover:bg-green-700 ml-3' : 'bg-blue-50 border-blue-200 ml-3') :
          (hasUnsavedChanges ? 'bg-green-500 hover:bg-green-600 text-white border-green-500 ml-3' : '')
        }`}
      >
        <Rocket className="w-4 h-4 mr-2" />
        Publish
      </Button>
    </div>
  );
}

// CodeModal Component - Using advanced CodeEditor with split review
export function CodeModal({
  isOpen,
  onClose,
  configuration = {},
  onSave,
  localSaveStatus
}) {
  const [editorValue, setEditorValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [jsonError, setJsonError] = useState(null);
  const [key, setKey] = useState(0); // Force re-render of CodeEditor

  // Initialize editor value when modal opens
  useEffect(() => {
    if (isOpen) {
      const jsonString = JSON.stringify(configuration, null, 2);
      setEditorValue(jsonString);
      setOriginalValue(jsonString);
      setHasChanges(false);
      setJsonError(null);
      setKey(prev => prev + 1); // Force CodeEditor to re-initialize
    }
  }, [isOpen, configuration]);

  if (!isOpen) return null;

  const handleEditorChange = (value) => {
    setEditorValue(value || '');
    setHasChanges(value !== originalValue);

    // Validate JSON
    try {
      if (value) JSON.parse(value);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(editorValue);
      if (onSave) {
        onSave(parsedConfig);
        setOriginalValue(editorValue);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Invalid JSON:', err);
      setJsonError(err.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Configuration JSON Editor</h2>
            {hasChanges && (
              <Badge className="bg-yellow-100 text-yellow-800">Modified</Badge>
            )}
            {jsonError && (
              <Badge className="bg-red-100 text-red-800">Invalid JSON</Badge>
            )}
            {localSaveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {localSaveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
            {localSaveStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="w-4 h-4" />
                <span>Save Failed</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!!jsonError || localSaveStatus === 'saving'}
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-lg font-semibold'
                  : 'bg-gray-400 hover:bg-gray-500 text-white border border-gray-400 opacity-70'
              }`}
            >
              {localSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </>
              )}
            </button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* JSON Error Display */}
        {jsonError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex-shrink-0">
            <p className="text-sm text-red-700">
              <span className="font-semibold">JSON Error:</span> {jsonError}
            </p>
          </div>
        )}

        {/* CodeEditor with Split Review */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            key={key}
            value={editorValue}
            onChange={handleEditorChange}
            language="json"
            fileName="configuration.json"
            originalCode={originalValue}
            initialContent={originalValue}
            enableDiffDetection={true}
            className="h-full"
            onManualEdit={(newCode, oldCode, context) => {
              // Handle manual edits - this enables diff detection
              console.log('Manual edit detected in CodeModal:', {
                hasChanges: newCode !== oldCode,
                diffDetectionEnabled: context?.enableDiffDetection
              });
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500 flex-shrink-0">
          <span>Use the toolbar above to switch between Editor, Split View, Diff View, and Preview modes</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ViewportModeSelector Component
export function ViewportModeSelector({
  currentViewport = 'desktop',
  onViewportChange,
  className = ''
}) {
  const viewportModes = [
    {
      key: 'mobile',
      label: 'Mobile',
      icon: Smartphone,
      width: '375px',
      description: 'Mobile view (375px)'
    },
    {
      key: 'tablet',
      label: 'Tablet',
      icon: Tablet,
      width: '768px',
      description: 'Tablet view (768px)'
    },
    {
      key: 'desktop',
      label: 'Desktop',
      icon: Monitor,
      width: '100%',
      description: 'Desktop view (100%)'
    }
  ];

  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {viewportModes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.key}
            onClick={() => onViewportChange(mode.key)}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentViewport === mode.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title={mode.description}
          >
            <Icon className="w-4 h-4 mr-1.5" />
          </button>
        );
      })}
    </div>
  );
}

// ResponsiveContainer Component - Wraps content with responsive viewport sizing
export function ResponsiveContainer({
  viewport = 'desktop',
  children,
  className = ''
}) {
  const getViewportStyles = () => {
    switch (viewport) {
      case 'mobile':
        return {
          width: '375px',
          minHeight: '667px',
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        };
      case 'tablet':
        return {
          width: '768px',
          minHeight: '1024px',
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          maxWidth: 'none',
          minHeight: 'auto'
        };
    }
  };

  // For desktop, don't apply any container constraints - use full width
  if (viewport === 'desktop') {
    return (
      <div
        className={`responsive-container ${className}`}
        style={getViewportStyles()}
      >
        {children}
      </div>
    );
  }

  // For mobile and tablet, center the container
  return (
    <div className="w-full bg-gray-50 py-4">
      <div
        className={`responsive-container ${className}`}
        style={getViewportStyles()}
      >
        {children}
      </div>
    </div>
  );
}