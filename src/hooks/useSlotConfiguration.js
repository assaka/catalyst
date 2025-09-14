/**
 * useSlotConfiguration - Custom hook for managing slot configuration save/load
 * Reusable across all page editors (Cart, Product, Category, etc.)
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Image } from 'lucide-react';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import { SlotManager } from '@/utils/slotUtils';
import slotConfigurationService from '@/services/slotConfigurationService';

// Helper function to dynamically load page-specific config
async function loadPageConfig(pageType) {
  let config;
  switch (pageType) {
    case 'cart':
      const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = cartConfig;
      break;
    case 'category':
      const { categoryConfig } = await import('@/components/editor/slot/configs/category-config');
      config = categoryConfig;
      break;
    case 'product':
      const { productConfig } = await import('@/components/editor/slot/configs/product-config');
      config = productConfig;
      break;
    case 'checkout':
      const { checkoutConfig } = await import('@/components/editor/slot/configs/checkout-config');
      config = checkoutConfig;
      break;
    case 'success':
      const { successConfig } = await import('@/components/editor/slot/configs/success-config');
      config = successConfig;
      break;
    default:
      const { cartConfig: fallbackConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = fallbackConfig;
  }
  return config;
}

// Helper function to create clean slots from config
function createCleanSlots(config) {
  const cleanSlots = {};
  if (config.slots) {
    Object.entries(config.slots).forEach(([key, slot]) => {
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
  return cleanSlots;
}

// GridResizeHandle Component
function GridResizeHandle({
  onResize,
  currentValue,
  maxValue = 12,
  minValue = 1,
  direction = 'horizontal',
  parentHovered = false,
  onResizeStart,
  onResizeEnd,
  onHoverChange
}) {
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
function EditableElement({
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
function GridColumn({
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
    ...Object.fromEntries(
      Object.entries(slot?.styles || {}).filter(([key]) =>
        !['gridColumn', 'gridRow'].includes(key)
      )
    ),
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
function HierarchicalSlotRenderer({
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
  onSlotStyleUpdate
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
                  <div className="w-full h-full flex items-start">
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
                if (onSlotStyleUpdate) {
                  const newStyles = {
                    width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                    height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                  };
                  onSlotStyleUpdate(slot.id, newStyles);
                }
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
                onSlotStyleUpdate={onSlotStyleUpdate}
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

export function useSlotConfiguration({
  pageType,
  pageName,
  slotType,
  selectedStore,
  updateConfiguration,
  onSave,
  microSlotDefinitions
}) {
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [resetStatus, setResetStatus] = useState(''); // '', 'resetting', 'reset', 'error'
  const saveStatusTimeoutRef = useRef(null);
  const justSavedRef = useRef(false);

  // Generic save configuration function
  const saveConfiguration = useCallback(async ({
    slotContent
  }) => {
    console.log(`💾 ===== SAVE CONFIGURATION STARTED (${pageName}) =====`);
    setSaveStatus('saving');
    
    // Create slot configuration directly
    const slots = {};
    
    // Combine all slot data into the slots structure
    const allSlotIds = new Set([
      ...Object.keys(slotContent || {})
    ]);

    // Process each slot with content only - styles/classes now come from slot config
    allSlotIds.forEach(id => {
      slots[id] = {
        content: slotContent[id] || '',
        metadata: {
          lastModified: new Date().toISOString()
        }
      };
    });
    
    const config = {
      page_name: pageName,
      slot_type: slotType,
      slots,
      metadata: {
        lastModified: new Date().toISOString(),
        version: '1.0',
        pageType: pageType
      }
    };

    try {
      const storeId = selectedStore?.id;
      
      if (!storeId) {
        console.warn('⚠️ No store ID available, cannot save to database');
        return;
      }

      if (storeId && updateConfiguration) {
        try {
          // Set flag to prevent reload after save
          justSavedRef.current = true;
          await updateConfiguration(config);
        } catch (error) {
          console.error('❌ Failed to save configuration:', error);
          throw error;
        }
      } else {
        console.warn('⚠️ Cannot save - missing storeId or updateConfiguration function');
      }
      
      // Call the parent onSave callback
      onSave?.(config);
      
      // Show saved status
      setSaveStatus('saved');
      
      // Clear status after 2 seconds
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save configuration to database:', error);
      
      if (error.response?.status === 413) {
        console.error('❌ Payload too large! Configuration size exceeds server limit');
        alert('Configuration is too large to save to database. Try removing some custom slots or content.');
      } else if (error.response?.status === 400) {
        console.error('❌ Bad request:', error.response?.data?.error);
      }
      
      setSaveStatus('saved'); // Still show saved for localStorage
      
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);
      
      return true;
    }
  }, [pageName, slotType, pageType, selectedStore, updateConfiguration, onSave]);

  // Generic load configuration function
  const loadConfiguration = useCallback(async ({
    setSlotContent
  }) => {
    try {
      const storeId = selectedStore?.id;
      console.log(`📥 Load attempt (${pageName}) - Store ID check:`, {
        selectedStore,
        storeId,
        hasStoreId: !!storeId
      });
      
      if (!storeId) {
        console.log('No store ID found, initializing with default configuration');

        const defaultSpans = {};
        Object.entries(microSlotDefinitions || {}).forEach(([key, def]) => {
          defaultSpans[key] = { ...def.defaultSpans };
        });
        console.log('🎯 LOAD DEBUG: Initialized defaults (no store ID)');
        return;
      }
      
      // Load from database
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const endpoint = `${apiBaseUrl}/api/public/slot-configurations?store_id=${storeId}`;
      
      console.log(`📥 Loading configurations from public endpoint (${pageName}):`, endpoint);
      
      const response = await fetch(endpoint);
      let configurations = [];
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Load Response data:', data);
        
        if (data.success && data.data) {
          configurations = data.data;
        }
      } else {
        console.warn('⚠️ Failed to load from public endpoint:', response.status, response.statusText);
      }
      
      console.log('📥 Load Configurations array:', configurations);
      
      // Find the configuration for this page type
      const pageConfig = configurations?.find(cfg => 
        cfg.configuration?.page_name === pageName && 
        cfg.configuration?.slot_type === slotType
      );
      
      if (pageConfig) {
        const dbRecord = pageConfig;
        console.log('📦 Full database record:', dbRecord);
        const config = dbRecord.configuration;
        
        if (!config) {
          console.error('⚠️ No configuration found in database record');
          return;
        }

        // Load from config.slots structure - only content, styles/classes now in slot config
        if (config.slots) {
          console.log('📥 Loading from slots structure:', config.slots);
          const loadedContent = {};
          
          Object.entries(config.slots).forEach(([slotId, slotData]) => {
            if (slotData.content !== undefined) {
              loadedContent[slotId] = slotData.content;
            }
          });
          
          console.log('📥 Loaded content:', loadedContent);
          
          if (setSlotContent) {
            setSlotContent(prev => ({ ...prev, ...loadedContent }));
          }
        }

        console.log(`✅ Configuration loaded successfully (${pageName})`);
      } else {
        console.log('No configuration found in database, initializing with defaults');

          const defaultSpans = {};
          Object.entries(microSlotDefinitions || {}).forEach(([key, def]) => {
            defaultSpans[key] = { ...def.defaultSpans };
          });
      }
    } catch (error) {
      console.error(`Failed to load configuration from database (${pageName}):`, error);
     }
  }, [pageName, slotType, selectedStore, microSlotDefinitions]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }
  }, []);

  // Apply draft configuration to component state
  const applyDraftConfiguration = useCallback((draftConfig, setters) => {
    if (!draftConfig?.configuration) return;
    
    // Skip reload if we just saved to prevent overriding user changes
    if (justSavedRef.current) {
      console.log('🚫 Skipping config reload - just saved');
      justSavedRef.current = false;
      return;
    }
    
    const config = draftConfig.configuration;
    console.log('🔄 LOADING CONFIG STRUCTURE CHECK:', {
      configKeys: Object.keys(config),
      hasSlotContent: !!config.slotContent,
      hasNewStructure: !!config.slots,
      slots: config.slots,
      fullConfig: config
    });
    
    // Load from the slots structure (the only structure we should use)
    if (config.slots) {
      const extractedContent = {};
      
      Object.entries(config.slots).forEach(([slotId, slotData]) => {
        if (slotData?.content !== undefined) {
          extractedContent[slotId] = slotData.content;
        }
      });
      
      console.log('📦 Loading from slots structure:', {
        styles: extractedStyles,
        content: extractedContent,
        classes: extractedClasses
      });

    } else {
      console.warn('⚠️ No slots structure found in configuration');
    }

  }, [microSlotDefinitions]);

  // Helper function for view mode changes
  const updateSlotsForViewMode = useCallback((requiredSlots, flashMessageContent, setters) => {
   setters.setSlotContent?.(prev => ({
      ...prev,
      'flashMessage.content': flashMessageContent
    }));
  }, []);

  // Generic reset layout function
  const handleResetLayout = useCallback(async () => {
    try {
      setResetStatus('resetting');

      // Clear the draft configuration from database
      const storeId = selectedStore?.id;
      if (storeId) {
        await slotConfigurationService.clearDraftConfiguration(storeId, pageType);
      }

      // Load the clean static configuration for this page type
      const config = await loadPageConfig(pageType);

      if (!config || !config.slots) {
        throw new Error(`${pageType} configuration is invalid or missing slots`);
      }

      // Create clean slots
      const cleanSlots = createCleanSlots(config);

      const cleanConfig = {
        page_name: config.page_name || pageName,
        slot_type: config.slot_type || slotType,
        slots: cleanSlots,
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0',
          pageType: pageType
        },
        cmsBlocks: config.cmsBlocks ? [...config.cmsBlocks] : []
      };

      // Save the clean config to database
      if (updateConfiguration) {
        await updateConfiguration(cleanConfig);
      }

      setResetStatus('reset');
      setTimeout(() => setResetStatus(''), 3000);

      console.log(`✅ ${pageType} layout reset to clean configuration`);

      return cleanConfig;
    } catch (error) {
      console.error(`❌ Failed to reset ${pageType} layout:`, error);
      setResetStatus('error');
      setTimeout(() => setResetStatus(''), 5000);
      throw error;
    }
  }, [selectedStore, pageType, pageName, slotType, updateConfiguration]);

  // Generic load static configuration function
  const loadStaticConfiguration = useCallback(async () => {
    console.log('📂 Loading static configuration as template...');

    const config = await loadPageConfig(pageType);

    if (!config || !config.slots) {
      throw new Error(`${pageType} configuration is invalid or missing slots`);
    }

    const cleanSlots = createCleanSlots(config);

    const configToUse = {
      page_name: config.page_name || pageName,
      slot_type: config.slot_type || slotType,
      slots: cleanSlots,
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0',
        pageType: pageType
      },
      cmsBlocks: config.cmsBlocks ? [...config.cmsBlocks] : []
    };

    console.log(`📦 Using static ${pageType} configuration as template`);
    return configToUse;
  }, [pageType, pageName, slotType]);

  // Generic get draft or static configuration
  const getDraftOrStaticConfiguration = useCallback(async () => {
    const storeId = selectedStore?.id;
    let configToUse = null;

    // Try to load from database first
    if (storeId) {
      try {
        console.log('💾 Attempting to load saved configuration from database...');
        const savedConfig = await slotConfigurationService.getDraftConfiguration(storeId, pageType);

        if (savedConfig && savedConfig.success && savedConfig.data && savedConfig.data.configuration) {
          console.log('📄 Database configuration found:', savedConfig.data.configuration);
          configToUse = savedConfig.data.configuration;
        }
      } catch (dbError) {
        console.log('📝 No saved configuration found, will use static config as fallback:', dbError.message);
      }
    }

    // If no saved config found, load the static configuration
    if (!configToUse) {
      configToUse = await loadStaticConfiguration();
    }

    return configToUse;
  }, [selectedStore, pageType, loadStaticConfiguration]);

  return {
    saveConfiguration,
    loadConfiguration,
    applyDraftConfiguration,
    updateSlotsForViewMode,
    handleResetLayout,
    loadStaticConfiguration,
    getDraftOrStaticConfiguration,
    saveStatus,
    resetStatus,
    justSavedRef,
    cleanup,
    // Slot rendering components
    GridResizeHandle,
    EditableElement,
    GridColumn,
    HierarchicalSlotRenderer
  };
}