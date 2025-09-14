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
  Loader2
} from "lucide-react";
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { SlotManager } from '@/utils/slotUtils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
import slotConfigurationService from '@/services/slotConfigurationService';

// Advanced resize handle for horizontal (grid column) or vertical (height) resizing
const GridResizeHandle = ({ onResize, currentValue, maxValue = 12, minValue = 1, direction = 'horizontal', parentHovered = false, onResizeStart, onResizeEnd }) => {
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
          : 'opacity-60 hover:opacity-90'
      }`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan;
  const showVerticalHandle = onSlotHeightResize && mode === 'edit';

  // Drag and drop handlers
  const handleDragStart = useCallback((e) => {
    if (mode !== 'edit') return;

    setIsDragging(true);
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';

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
    setIsDragging(false);
    console.log('🎯 Finished dragging slot:', slotId);
  }, [slotId]);

  const handleDragOver = useCallback((e) => {
    if (mode !== 'edit') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Only set drag over if it's not the dragging element itself
    if (!isDragging) {
      setIsDragOver(true);
    }
  }, [mode, isDragging]);

  const handleDragLeave = useCallback((e) => {
    // Only remove drag over if leaving the element entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    if (mode !== 'edit' || isDragging) return;

    e.preventDefault();
    setIsDragOver(false);

    const draggedSlotId = e.dataTransfer.getData('text/plain');

    if (draggedSlotId && draggedSlotId !== slotId && onSlotDrop) {
      console.log('🎯 Dropping slot:', { from: draggedSlotId, to: slotId });
      onSlotDrop(draggedSlotId, slotId);
    }
  }, [slotId, onSlotDrop, mode, isDragging]);

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
          ? `border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 ${
              isDragOver
                ? 'border-green-500 bg-green-50/40 shadow-lg shadow-green-200/60 z-10 animate-pulse ring-2 ring-green-300' :
              isDragging
                ? 'border-blue-600 bg-blue-50/60 shadow-xl shadow-blue-200/60 ring-2 ring-blue-200 opacity-80' :
              isHovered
                ? 'border-blue-500 bg-blue-50/30 shadow-md shadow-blue-200/40'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/20'
            }`
          : 'overflow-hidden'
      } relative responsive-slot`}
      data-grid-slot-id={slotId}
      data-col-span={colSpan}
      data-row-span={rowSpan}
      draggable={false}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={gridStyles}
    >
      {/* Hover detection for all elements */}
      {mode === 'edit' && (
        <div 
          className="absolute inset-0 pointer-events-none"
          onMouseEnter={(e) => {
            e.stopPropagation();
            setIsHovered(true);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            setIsHovered(false);
            // Remove all borders on mouseout
            const parentElement = e.currentTarget.closest('[data-grid-slot-id]');
            if (parentElement) {
              parentElement.style.borderColor = '';
              parentElement.style.border = 'none';
            }
          }}
          style={{ 
            pointerEvents: 'auto',
            zIndex: 1
          }}
        />
      )}
      
      {/* Drag Handle - separate from content to not interfere with resize */}
      {mode === 'edit' && (
        <div
          className="absolute top-1 left-1 w-8 h-8 bg-blue-500/20 hover:bg-blue-500/40 rounded cursor-move z-20 flex items-center justify-center transition-all duration-200 hover:scale-110"
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title="Drag to reposition"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Clean content area */}
      <div className={`p-2 relative transition-all duration-200 ${
        mode === 'edit' 
          ? `cursor-pointer rounded-md hover:bg-white/50 ${isHovered ? 'bg-white/30' : ''}` 
          : ''
      }`} style={{ zIndex: 2 }}>
        {children}
      </div>
      
      {/* Resize handles at GridColumn level */}
      {showHorizontalHandle && (
        <GridResizeHandle
          onResize={(newColSpan) => onGridResize(slotId, newColSpan)}
          currentValue={colSpan}
          maxValue={12}
          minValue={1}
          direction="horizontal"
          parentHovered={isHovered}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
        />
      )}
      {showVerticalHandle && (
        <GridResizeHandle
          onResize={(newHeight) => onSlotHeightResize(slotId, newHeight)}
          currentValue={height || 80}
          maxValue={1000}
          minValue={40}
          direction="vertical"
          parentHovered={isHovered}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
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
        draggable={draggable && mode === 'edit'}
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
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onResizeStart,
  onResizeEnd,
  selectedElementId = null
}) => {
  const childSlots = SlotManager.getChildSlots(slots, parentId);
  
  // Filter slots based on their viewMode property from config
  const filteredSlots = childSlots.filter(slot => {
    // If slot doesn't have viewMode defined, show it always
    if (!slot.viewMode || !Array.isArray(slot.viewMode)) {
      return true;
    }
    
    // Show slot only if current viewMode is in its viewMode array
    return slot.viewMode.includes(viewMode);
  });
  
  return filteredSlots.map(slot => {
    // Calculate dynamic colSpan based on viewMode for specific slots
    let colSpan = slot.colSpan || 12;
    
    // Make content_area responsive to viewMode
    if (slot.id === 'content_area') {
      colSpan = viewMode === 'empty' ? 12 : 8; // Full width when empty, 8 cols when with products
    }
    
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
        onGridResize={onGridResize}
        onSlotHeightResize={onSlotHeightResize}
        onSlotDrop={onSlotDrop}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        mode={mode}
      >
        <div className={slot.parentClassName || ''}>
          <EditableElement
            slotId={slot.id}
            mode={mode}
            onClick={onElementClick}
            className={slot.className || ''}
            style={slot.styles || {}}
            canResize={!['container', 'grid', 'flex'].includes(slot.type)}
            draggable={true}
            selectedElementId={selectedElementId}
          >
          {slot.type === 'text' && (
            <span
              className={slot.className}
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
          {slot.type === 'image' && (
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400" />
          )}
          {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
            <div className={`w-full h-full grid grid-cols-12 gap-2 ${slot.className}`} style={slot.styles}>
              <HierarchicalSlotRenderer
                slots={slots}
                parentId={slot.id}
                mode={mode}
                viewMode={viewMode}
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
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [localSaveStatus, setLocalSaveStatus] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  
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

  // Initialize cart configuration - first try to load from database, then fall back to static config
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    const initializeConfig = async () => {
      if (!isMounted) return;

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
        } catch (e) {
          console.error('❌ Configuration contains non-serializable data:', e);
        }

        if (Object.keys(configToUse.slots).length === 0) {
          console.warn('⚠️ No slots found in final configuration');
        }

        // Defer state update to avoid React error #130
        setTimeout(() => {
          if (isMounted) {
            setCartLayoutConfig(configToUse);
          }
        }, 0);
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

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [selectedStore, getSelectedStoreId]);

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

    setLocalSaveStatus('saving');
    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        console.log('💾 Saving configuration to database...');
        await slotConfigurationService.saveConfiguration(storeId, configToSave, 'cart');
        console.log('✅ Configuration saved successfully');
      }

      // Also call parent onSave callback if provided
      if (onSave) {
        await onSave(configToSave);
      }

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
    // Don't open sidebar if currently resizing
    if (isResizing) {
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

        if (isAlignmentChange) {
          // For alignment changes, split classes between className and parentClassName
          const alignmentClasses = ['text-left', 'text-center', 'text-right'];
          const allClasses = className.split(' ').filter(Boolean);

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
          // For non-alignment changes, update className normally
          updatedSlots[slotId] = {
            ...updatedSlots[slotId],
            className: className,
            styles: mergedStyles,
            metadata: {
              ...updatedSlots[slotId].metadata,
              lastModified: new Date().toISOString()
            }
          };

          console.log('✅ Updated slot configuration (regular):', {
            slotId,
            className,
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

  // Handle slot drag and drop repositioning
  const handleSlotDrop = useCallback(async (draggedSlotId, targetSlotId) => {
    console.log('🎯 handleSlotDrop called:', { draggedSlotId, targetSlotId });

    // Don't allow dropping on itself
    if (draggedSlotId === targetSlotId) {
      console.log('⚠️ Cannot drop slot on itself');
      return;
    }

    // Create a new configuration with swapped positions
    const updatedConfig = await new Promise((resolve) => {
      setCartLayoutConfig(prevConfig => {
        if (!prevConfig || !prevConfig.slots) {
          console.error('❌ No valid configuration to update');
          resolve(null);
          return prevConfig;
        }

        const updatedSlots = { ...prevConfig.slots };

        if (updatedSlots[draggedSlotId] && updatedSlots[targetSlotId]) {
          // Create new slot objects to ensure React detects changes
          const draggedSlot = { ...updatedSlots[draggedSlotId] };
          const targetSlot = { ...updatedSlots[targetSlotId] };

          // Store original positions
          const draggedGridColumn = draggedSlot.styles?.gridColumn;
          const draggedGridRow = draggedSlot.styles?.gridRow;
          const targetGridColumn = targetSlot.styles?.gridColumn;
          const targetGridRow = targetSlot.styles?.gridRow;

          // Swap positions - create new style objects
          updatedSlots[draggedSlotId] = {
            ...draggedSlot,
            styles: {
              ...draggedSlot.styles,
              gridColumn: targetGridColumn,
              gridRow: targetGridRow
            },
            metadata: {
              ...draggedSlot.metadata,
              lastModified: new Date().toISOString()
            }
          };

          updatedSlots[targetSlotId] = {
            ...targetSlot,
            styles: {
              ...targetSlot.styles,
              gridColumn: draggedGridColumn,
              gridRow: draggedGridRow
            },
            metadata: {
              ...targetSlot.metadata,
              lastModified: new Date().toISOString()
            }
          };

          console.log('✅ Swapped slot positions:', {
            [draggedSlotId]: {
              from: { gridColumn: draggedGridColumn, gridRow: draggedGridRow },
              to: { gridColumn: targetGridColumn, gridRow: targetGridRow }
            },
            [targetSlotId]: {
              from: { gridColumn: targetGridColumn, gridRow: targetGridRow },
              to: { gridColumn: draggedGridColumn, gridRow: draggedGridRow }
            }
          });
        } else {
          console.error('❌ One or both slots not found:', { draggedSlotId, targetSlotId });
        }

        const newConfig = {
          ...prevConfig,
          slots: updatedSlots,
          metadata: {
            ...prevConfig.metadata,
            lastModified: new Date().toISOString()
          }
        };

        resolve(newConfig);
        return newConfig;
      });
    });

    // Save the updated configuration if it was created successfully
    if (updatedConfig) {
      await saveConfiguration(updatedConfig);
      console.log('💾 Configuration saved after drag and drop');
    }
  }, [saveConfiguration]);

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

            {/* Right side controls */}
            {mode === 'edit' && (
              <Button onClick={() => setIsSidebarVisible(!isSidebarVisible)} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {isSidebarVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
        {/* Cart Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig && cartLayoutConfig.slots && Object.keys(cartLayoutConfig.slots).length > 0 ? (
                <HierarchicalSlotRenderer
                  slots={cartLayoutConfig.slots}
                  parentId={null}
                  mode={mode}
                  viewMode={viewMode}
                  onElementClick={handleElementClick}
                  onGridResize={handleGridResize}
                  onSlotHeightResize={handleSlotHeightResize}
                  onSlotDrop={handleSlotDrop}
                  onResizeStart={() => setIsResizing(true)}
                  onResizeEnd={() => setIsResizing(false)}
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
