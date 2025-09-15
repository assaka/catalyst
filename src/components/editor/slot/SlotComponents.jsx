/**
 * Generic slot components for all page editors
 * These components are reusable across Cart, Product, Category, Checkout, and Success editors
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Image, Square, Settings, Plus, Loader2, Upload, Save, Code } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import { SlotManager } from '@/utils/slotUtils';
import FilePickerModal from '@/components/ui/FilePickerModal';

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

      <div className="flex items-center gap-2">
        <Button onClick={() => saveConfiguration()} disabled={localSaveStatus === 'saving'} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={onPublish}
          variant="default"
          size="sm"
          className={hasChanges ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}
          disabled={!hasChanges}
          title={hasChanges ? "Publish changes to make them live" : "No changes to publish"}
        >
          <Upload className="w-4 h-4 mr-2" />
          Publish
        </Button>
      </div>
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
    >
      <div
        className={className || ''}
        style={style}
        onClick={handleClick}
        data-slot-id={slotId}
        data-editable={mode === 'edit'}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>
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
  mode = 'edit',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  children
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropZone, setDropZone] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragOverTimeoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverResizeHandle, setIsOverResizeHandle] = useState(false);

  const isContainerType = ['container', 'grid', 'flex'].includes(slot?.type);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan >= 1;
  const showVerticalHandle = onSlotHeightResize && mode === 'edit' && isContainerType;

  const handleDragStart = useCallback((e) => {
    if (mode !== 'edit') return;

    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';

    if (setCurrentDragInfo) {
      setCurrentDragInfo({
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

      let newDropZone = 'after';

      if (y < height * 0.25) {
        newDropZone = 'before';
      } else if (y > height * 0.75) {
        newDropZone = 'after';
      } else {
        const isContainer = ['container', 'grid', 'flex'].includes(slot?.type);

        if (isContainer && currentDragInfo) {
          const draggedSlotParent = currentDragInfo.parentId;
          const draggedSlotId = currentDragInfo.slotId;
          const targetSlotId = slot?.id;

          const canDropInside = draggedSlotParent !== targetSlotId &&
                                draggedSlotId !== targetSlotId;

          if (canDropInside) {
            newDropZone = 'inside';
          } else {
            newDropZone = 'after';
          }
        } else {
          newDropZone = 'after';
        }
      }

      if (newDropZone !== dropZone) {
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
    // Only apply layout-related styles to grid wrapper using whitelist approach
    // All other styles (colors, fonts, etc.) should go to the actual elements
    ...Object.fromEntries(
      Object.entries(slot?.styles || {}).filter(([key]) => {
        // Whitelist of layout-only styles that are safe for grid wrapper
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
        return layoutStyles.includes(key);
      })
    )
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

      {mode === 'edit' && isHovered && !isOverResizeHandle && (
        <div
          className="absolute top-1 right-1 text-blue-500 text-sm opacity-60 pointer-events-none z-30"
          title="Drag to reposition"
        >
          ⋮⋮
        </div>
      )}

      <div className={`p-2 relative transition-all duration-200 ${
        mode === 'edit'
          ? `${isOverResizeHandle ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} rounded-md`
          : ''
      }`} style={{ zIndex: 2 }}>
        {children}
      </div>

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
}

// HierarchicalSlotRenderer Component
export function HierarchicalSlotRenderer({
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
  selectedElementId = null,
  setPageConfig
}) {
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  const filteredSlots = childSlots.filter(slot => {
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true;
    }
    return slot.viewMode.includes(viewMode);
  });

  return filteredSlots.map(slot => {
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
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        mode={mode}
        showBorders={showBorders}
      >
        <div className={slot.parentClassName || ''}>
          {slot.type === 'text' && (
            <>
              {mode === 'edit' ? (
                <ResizeWrapper
                  minWidth={20}
                  minHeight={16}
                >
                  <div className="w-full h-full">
                    <span
                      className={slot.className}
                      style={{
                        ...slot.styles,
                        cursor: 'pointer',
                        ...(slot.className?.includes('italic') && { fontStyle: 'italic' }),
                        display: 'inline-block',
                        width: '100%'
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
                  </div>
                </ResizeWrapper>
              ) : (
                <span
                  className={slot.className}
                  style={{
                    ...slot.styles,
                    ...(slot.className?.includes('italic') && { fontStyle: 'italic' })
                  }}
                  dangerouslySetInnerHTML={{
                    __html: String(slot.content || `Text: ${slot.id}`)
                  }}
                />
              )}
            </>
          )}

          {slot.type !== 'text' && (
            <EditableElement
              slotId={slot.id}
              mode={mode}
              onClick={onElementClick}
              className={''}
              style={['button', 'input'].includes(slot.type) ? {} : (slot.styles || {})}
              canResize={!['container', 'grid', 'flex'].includes(slot.type)}
              draggable={false}
              selectedElementId={selectedElementId}
              onElementResize={slot.type === 'button' ? (newSize) => {
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
                  return { ...prevConfig, slots: updatedSlots };
                });
              } : undefined}
            >
              {slot.type === 'button' && (
                <button
                  className={`${slot.className}`}
                  style={{
                    ...slot.styles,
                    width: '100%',
                    height: '100%',
                    minWidth: 'auto',
                    minHeight: 'auto'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: String(slot.content || `Button: ${slot.id}`)
                  }}
                />
              )}
              {slot.type === 'input' && (
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
              {slot.type === 'image' && (
                <>
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
                </>
              )}
              {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
                <div
                  className={`w-full h-full grid grid-cols-12 gap-2 ${slot.className}`}
                  style={{
                    ...slot.styles,
                    minHeight: mode === 'edit' ? '80px' : slot.styles?.minHeight,
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
                    setPageConfig={setPageConfig}
                  />
                </div>
              )}
            </EditableElement>
          )}
        </div>
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

      <div className="flex gap-2">
        <Button onClick={onResetLayout} variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Reset Layout
        </Button>

        <Button onClick={onShowCode} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          Code
        </Button>

        <Button onClick={onAddSlot} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add New
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