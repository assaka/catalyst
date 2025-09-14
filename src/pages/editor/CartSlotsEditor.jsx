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
  Square,
  Plus,
  Image
} from "lucide-react";
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { SlotManager } from '@/utils/slotUtils';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
import slotConfigurationService from '@/services/slotConfigurationService';
import { runDragDropTests } from '@/utils/dragDropTester';
import FilePickerModal from '@/components/ui/FilePickerModal';

// Advanced resize handle for horizontal (grid column) or vertical (height) resizing
// GridResizeHandle component now imported from useSlotConfiguration hook

// Grid column wrapper - now imported from useSlotConfiguration hook

// EditableElement component - now imported from useSlotConfiguration hook

// HierarchicalSlotRenderer component - now imported from useSlotConfiguration hook

// Components now imported from useSlotConfiguration hook

// Main CartSlotsEditor component starts at line ~680
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
  selectedElementId = null,
  onElementResize = null
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
        onResize={onElementResize}
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

  // Filter slots based on their viewMode property from config
  const filteredSlots = childSlots.filter(slot => {
    // If slot doesn't have viewMode defined, show it always
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true;
    }

    // Show slot only if current viewMode is in its viewMode array
    const shouldShow = slot.viewMode.includes(viewMode);
    return shouldShow;
  });
  
  return filteredSlots.map(slot => {
    // Calculate dynamic colSpan based on viewMode for specific slots
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
          {/* Text rendering with ResizeWrapper for corner handle resizing */}
          {slot.type === 'text' && (
            <>
              {mode === 'edit' ? (
                <ResizeWrapper
                  minWidth={20}
                  minHeight={16}
                >
                  <div
                    className="w-full h-full flex items-start"
                  >
                    <span
                      className={slot.className}
                      style={{
                        ...slot.styles,  // Apply all styles (including colors) to the span element
                        cursor: 'pointer',
                        // Ensure italic is applied as inline style if class includes 'italic'
                        ...(slot.className?.includes('italic') && { fontStyle: 'italic' }),
                        // Make text fill the resized container
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
                    // Ensure italic is applied as inline style if class includes 'italic'
                    ...(slot.className?.includes('italic') && { fontStyle: 'italic' })
                  }}
                  dangerouslySetInnerHTML={{
                    __html: String(slot.content || `Text: ${slot.id}`)
                  }}
                />
              )}
            </>
          )}

          {/* Use EditableElement for other types that need the full wrapper structure */}
          {slot.type !== 'text' && (
            <EditableElement
              slotId={slot.id}
              mode={mode}
              onClick={onElementClick}
              className={''}  // Parent div should only have layout/structure classes, not text styling
              style={['button', 'input'].includes(slot.type) ? {} : (slot.styles || {})}  // Don't apply styles to ResizeWrapper for buttons and inputs
              canResize={!['container', 'grid', 'flex'].includes(slot.type)}
              draggable={false}  // Dragging is handled at GridColumn level
              selectedElementId={selectedElementId}
              onElementResize={slot.type === 'button' ? (newSize) => {
                // For buttons, update the slot styles directly
                setCartLayoutConfig(prevConfig => {
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
                ...slot.styles,  // Apply all styles to the button element directly
                width: '100%',   // Fill ResizeWrapper container
                height: '100%',  // Fill ResizeWrapper container
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
                ...slot.styles,  // Apply all styles (including colors) to the input element
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
                    // Don't override container dimensions - let ResizeWrapper control size
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
          )}
        </div>
      </GridColumn>
    );
  });
};

// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'empty',
  slotType = 'cart'  // Default to 'cart' for backward compatibility
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
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showFilePickerModal, setShowFilePickerModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const lastResizeEndTime = useRef(0);
  
  // Database configuration hook
  const {
    saveConfiguration: saveToDatabase,
    loadConfiguration: loadFromDatabase,
    handleResetLayout,
    getDraftOrStaticConfiguration,
    saveStatus,
    resetStatus,
    // Import the slot rendering components from the hook
    GridColumn,
    HierarchicalSlotRenderer
  } = useSlotConfiguration({
    pageType: slotType,
    pageName: slotType.charAt(0).toUpperCase() + slotType.slice(1),
    slotType: `${slotType}_layout`,
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, `${slotType}_layout`);
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

        // Use the hook function to get configuration (either draft or static)
        const configToUse = await getDraftOrStaticConfiguration();

        if (!configToUse) {
          throw new Error(`Failed to load ${slotType} configuration`);
        }

        // Transform database config if it exists
        let finalConfig = configToUse;
        if (configToUse.slots && Object.keys(configToUse.slots).length > 0) {
          const dbConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
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
            finalConfig = dbConfig;
          }
        }

        // Configuration loading is now handled by getDraftOrStaticConfiguration hook

        // Verify the config is serializable
        try {
          JSON.stringify(finalConfig);
          console.log('✅ Configuration is serializable');

        // Repair corrupted hierarchy if needed
        if (finalConfig.slots) {
          let needsRepair = false;
          const repairedSlots = { ...finalConfig.slots };

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
            repairedSlots.sidebar_area = { ...repairedSlots.sidebar_area, parentId: 'main_layout' };
            needsRepair = true;
          }

          // Load appropriate config to get original viewMode values
          let originalConfig;
          switch (slotType) {
            case 'cart':
              const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
              originalConfig = cartConfig;
              break;
            case 'category':
              const { categoryConfig } = await import('@/components/editor/slot/configs/category-config');
              originalConfig = categoryConfig;
              break;
            case 'product':
              const { productConfig } = await import('@/components/editor/slot/configs/product-config');
              originalConfig = productConfig;
              break;
            case 'checkout':
              const { checkoutConfig } = await import('@/components/editor/slot/configs/checkout-config');
              originalConfig = checkoutConfig;
              break;
            case 'success':
              const { successConfig } = await import('@/components/editor/slot/configs/success-config');
              originalConfig = successConfig;
              break;
            default:
              const { cartConfig: fallbackConfig } = await import('@/components/editor/slot/configs/cart-config');
              originalConfig = fallbackConfig;
          }

          // Ensure all slots have proper viewMode arrays from config if missing
          Object.keys(repairedSlots).forEach(slotId => {
            const slot = repairedSlots[slotId];
            // If viewMode is undefined or not an array, preserve from original config
            if (!slot.viewMode || !Array.isArray(slot.viewMode)) {
              const configSlot = originalConfig?.slots?.[slotId];
              if (configSlot && configSlot.viewMode) {
                repairedSlots[slotId] = { ...slot, viewMode: [...configSlot.viewMode] };
                needsRepair = true;
                console.log(`🔧 Repairing viewMode for ${slotId}:`, configSlot.viewMode);
              }
            }
          });

          if (needsRepair) {
            finalConfig = { ...finalConfig, slots: repairedSlots };
            console.log('✅ Hierarchy and viewMode repaired');
          }
        }
        } catch (e) {
          console.error('❌ Configuration contains non-serializable data:', e);
        }

        if (Object.keys(finalConfig.slots).length === 0) {
          console.warn('⚠️ No slots found in final configuration');
        }

        // Simple one-time initialization
        if (isMounted) {
          setCartLayoutConfig(finalConfig);
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
        await slotConfigurationService.saveConfiguration(storeId, configToSave, 'cart');
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

      // Debounced auto-save - clear previous timeout and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveConfiguration(updatedConfig);
      }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle slot container height resize changes
  const handleSlotHeightResize = useCallback((slotId, newHeight) => {
    
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        // Calculate row span based on height (rough approximation: 40px per row)
        const estimatedRowSpan = Math.max(1, Math.round(newHeight / 40));
        
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

      // Debounced auto-save - clear previous timeout and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveConfiguration(updatedConfig);
      }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle slot repositioning using drop zones
  const handleSlotDrop = useCallback(async (draggedSlotId, targetSlotId, dropPosition) => {

    // Mark drag operation as active to prevent config reloads
    isDragOperationActiveRef.current = true;

    if (draggedSlotId === targetSlotId) {
      return;
    }

    // Prevent moving critical layout containers
    if (draggedSlotId === 'main_layout') {
      return;
    }

    // Also prevent moving other root containers into wrong places
    if (['header_container', 'content_area', 'sidebar_area'].includes(draggedSlotId) && dropPosition !== 'after' && dropPosition !== 'before') {
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
              resolve(null);
              return prevConfig;
            }
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

        resolve(newConfig);
        return newConfig;
      });
    });

    if (updatedConfig) {

      try {
        await saveConfiguration(updatedConfig);

        // Mark drag operation as complete after save
        setTimeout(() => {
          isDragOperationActiveRef.current = false;
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

  // Reset layout function now provided by useSlotConfiguration hook

  // Handle creating new slots
  const handleCreateSlot = useCallback((slotType, content = '', parentId = 'main_layout', additionalProps = {}) => {
    const newSlotId = `new_${slotType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newSlot = {
      id: newSlotId,
      type: slotType,
      content: content,
      className: slotType === 'container' ? 'p-4 border border-gray-200 rounded' :
                slotType === 'text' ? 'text-base text-gray-900' :
                slotType === 'image' ? 'w-full h-auto' : '',
      parentClassName: '',
      styles: slotType === 'container' ? { minHeight: '80px' } : {},
      parentId: parentId,
      position: { order: 0 },
      colSpan: slotType === 'container' ? 12 : 6, // Containers full width, others half width
      rowSpan: 1,
      viewMode: ['empty', 'withProducts'], // Show in both modes by default
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        hierarchical: true,
        // Include additional properties for images
        ...additionalProps
      }
    };

    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig.slots };
      updatedSlots[newSlotId] = newSlot;

      // Update order of existing siblings
      Object.values(updatedSlots).forEach(slot => {
        if (slot.id !== newSlotId && slot.parentId === parentId) {
          slot.position = { order: (slot.position?.order || 0) + 1 };
        }
      });

      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots,
        metadata: {
          ...prevConfig.metadata,
          lastModified: new Date().toISOString()
        }
      };

      // Auto-save the new slot
      saveConfiguration(updatedConfig);
      return updatedConfig;
    });

    console.log('✨ Created new slot:', { slotId: newSlotId, type: slotType, parentId });
  }, [saveConfiguration]);

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
            <div className="flex items-center justify-between gap-4">
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

            <div className="flex mb-3 justify-between">
              <Button
                  onClick={() => setShowSlotBorders(!showSlotBorders)}
                  variant={showSlotBorders ? "default" : "outline"}
                  size="sm"
                  title={showSlotBorders ? "Hide slot borders" : "Show slot borders"}
              >
                <Square className="w-4 h-4 mr-2" />
                Borders
              </Button>

              <div className="flex gap-2">
                <Button onClick={() => setShowResetModal(true)} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Reset Layout
                </Button>

                <Button onClick={() => setShowAddSlotModal(true)} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>
            </div>

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

      {/* Add Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Slot</h3>
              <Button
                onClick={() => setShowAddSlotModal(false)}
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
                  handleCreateSlot('container');
                  setShowAddSlotModal(false);
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
                  handleCreateSlot('text', 'New text content');
                  setShowAddSlotModal(false);
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
                  setShowAddSlotModal(false);
                  setShowFilePickerModal(true);
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
      )}

      {/* File Picker Modal */}
      <FilePickerModal
        isOpen={showFilePickerModal}
        onClose={() => setShowFilePickerModal(false)}
        onSelect={(selectedFile) => {
          // Create image slot with selected file
          handleCreateSlot('image', selectedFile.url, 'main_layout', {
            src: selectedFile.url,
            alt: selectedFile.name,
            fileName: selectedFile.name,
            mimeType: selectedFile.mimeType
          });
        }}
        fileType="image"
      />

      {/* Reset Layout Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Reset Layout</h3>
              <Button
                onClick={() => setShowResetModal(false)}
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
                  onClick={() => setShowResetModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const resetConfig = await handleResetLayout();
                      // Update local state with the reset configuration
                      if (resetConfig) {
                        setCartLayoutConfig(resetConfig);
                      }
                      setShowResetModal(false);
                    } catch (error) {
                      console.error('Reset failed:', error);
                      // Keep modal open on error
                    }
                  }}
                  variant="destructive"
                  className="flex-1"
                  disabled={resetStatus === 'resetting'}
                >
                  {resetStatus === 'resetting' ? (
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
      )}
    </div>
  );
};

export default CartSlotsEditor;
