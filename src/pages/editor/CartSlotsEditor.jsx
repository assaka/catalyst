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

// Advanced resize handle for horizontal (grid column) or vertical (height) resizing
const GridResizeHandle = ({ onResize, currentValue, maxValue = 12, minValue = 1, direction = 'horizontal' }) => {
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
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentValue, direction]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    
    const startX = startXRef.current;
    const startY = startYRef.current;
    const startValue = startValueRef.current;
    
    if (direction === 'horizontal') {
      const deltaX = e.clientX - startX;
      const sensitivity = 30; // pixels per col-span unit
      const colSpanDelta = Math.round(deltaX / sensitivity);
      const newColSpan = Math.max(minValue, Math.min(maxValue, startValue + colSpanDelta));
      
      if (newColSpan !== currentValue) {
        onResize(newColSpan);
      }
    } else if (direction === 'vertical') {
      const deltaY = e.clientY - startY;
      const heightDelta = Math.round(deltaY / 2); // 2px increments for smoother resize
      const newHeight = Math.max(20, startValue + heightDelta); // Minimum 20px height
      
      // Always call onResize for height changes since we want smooth updates
      onResize(newHeight);
    }
  }, [currentValue, maxValue, minValue, onResize, direction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

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
      className={`absolute ${positionClass} ${cursorClass} transition-all duration-200 ${
        isHovered || isDragging 
          ? 'opacity-100' 
          : 'opacity-0 group-hover:opacity-70'
      }`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: 9999 }}
      title={`Resize ${direction}ly ${isHorizontal ? `(${currentValue} / ${maxValue})` : `(${currentValue}px)`}`}
    >
      {/* Modern subtle handle */}
      <div className={`w-full h-full rounded-md flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center justify-center gap-0.5 transition-all duration-200 ${
        isDragging 
          ? 'bg-blue-500 shadow-lg scale-110' 
          : isHovered 
            ? 'bg-blue-400 shadow-md' 
            : 'bg-gray-300'
      }`}>
        {/* Three subtle lines for grip */}
        <div className={`${isHorizontal ? 'w-3 h-0.5' : 'w-0.5 h-3'} bg-white rounded-full opacity-70`}></div>
        <div className={`${isHorizontal ? 'w-3 h-0.5' : 'w-0.5 h-3'} bg-white rounded-full opacity-70`}></div>
        <div className={`${isHorizontal ? 'w-3 h-0.5' : 'w-0.5 h-3'} bg-white rounded-full opacity-70`}></div>
      </div>
      
      {/* Subtle indicator when dragging */}
      {isDragging && (
        <div className={`absolute ${isHorizontal ? '-top-6 left-1/2 -translate-x-1/2' : '-left-10 top-1/2 -translate-y-1/2'} bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`}>
          {isHorizontal ? `${currentValue} / ${maxValue}` : `${currentValue}px`}
        </div>
      )}
    </div>
  );
};

// Grid column wrapper with resize handle
const GridColumn = ({ 
  colSpan = 12, 
  rowSpan = 1,
  height,
  slotId, 
  onGridResize,
  onSlotHeightResize,
  mode = 'edit', 
  children 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const showHorizontalHandle = onGridResize && mode === 'edit' && colSpan;
  const showVerticalHandle = onSlotHeightResize && mode === 'edit';
  
  // Generate the col-span class dynamically to ensure Tailwind includes it
  const getColSpanClass = (span) => {
    const classes = {
      1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
      5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
      9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
    };
    return classes[span] || 'col-span-12';
  };

  // Generate the row-span class dynamically to ensure Tailwind includes it
  const getRowSpanClass = (span) => {
    const classes = {
      1: 'row-span-1', 2: 'row-span-2', 3: 'row-span-3', 4: 'row-span-4',
      5: 'row-span-5', 6: 'row-span-6', 7: 'row-span-7', 8: 'row-span-8',
      9: 'row-span-9', 10: 'row-span-10', 11: 'row-span-11', 12: 'row-span-12'
    };
    return classes[span] || 'row-span-1';
  };
  
  const colSpanClass = getColSpanClass(colSpan);
  const rowSpanClass = getRowSpanClass(rowSpan);
  
  return (
    <div 
      className={`group ${colSpanClass} ${rowSpanClass} ${
        mode === 'edit' 
          ? `border border-dashed rounded-md p-2 overflow-hidden ${
              isHovered ? 'border-blue-400' : 'border-transparent'
            }` 
          : 'overflow-hidden'
      } relative responsive-slot`}
      data-grid-slot-id={slotId}
      data-col-span={colSpan}
      data-row-span={rowSpan}
      onMouseEnter={() => mode === 'edit' && setIsHovered(true)}
      onMouseLeave={() => mode === 'edit' && setIsHovered(false)}
      style={{ 
        height: height ? `${height}px` : undefined,
        maxHeight: height ? `${height}px` : undefined
      }}
    >
      {children}
      {/* Horizontal grid resize handle on the column itself */}
      {showHorizontalHandle && (
        <GridResizeHandle
          onResize={(newColSpan) => onGridResize(slotId, newColSpan)}
          currentValue={colSpan}
          maxValue={12}
          minValue={1}
          direction="horizontal"
        />
      )}
      {/* Vertical grid resize handle for slot height */}
      {showVerticalHandle && (
        <GridResizeHandle
          onResize={(newHeight) => onSlotHeightResize(slotId, newHeight)}
          currentValue={height || 80}
          maxValue={1000}
          minValue={40}
          direction="vertical"
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
        onGridResize={onGridResize}
        onSlotHeightResize={onSlotHeightResize}
        mode={mode}
      >
        <div className={slot.parentClassName || ''}>
          <EditableElement
            slotId={slot.id}
            mode={mode}
            onClick={onElementClick}
            className={slot.className}
            style={slot.styles}
            canResize={!['container', 'grid', 'flex'].includes(slot.type)}
            draggable={true}
            selectedElementId={selectedElementId}
          >
          {slot.type === 'text' && (
            <span 
              dangerouslySetInnerHTML={{ 
                __html: String(slot.content || `Text: ${slot.id}`)
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
            <div className="w-full h-full grid grid-cols-12 gap-2">
              <HierarchicalSlotRenderer
                slots={slots}
                parentId={slot.id}
                mode={mode}
                viewMode={viewMode}
                onElementClick={onElementClick}
                onGridResize={onGridResize}
                onSlotHeightResize={onSlotHeightResize}
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
  const [saveStatus, setSaveStatus] = useState('');

  // Initialize cart configuration with both hierarchical and flat structure support
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const initializeConfig = async () => {
      if (!isMounted) return;
      
      try {
        // Start with cart config as the single source of truth
        const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
        
        if (!cartConfig || !cartConfig.slots) {
          throw new Error('Cart configuration is invalid or missing slots');
        }
        
        // Don't include views or other properties with React components
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
        
        const initialConfig = {
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

        console.log('📦 Initialized cart configuration with hierarchical structure:', initialConfig);
        console.log('🔍 Available slots:', Object.keys(initialConfig.slots || {}));
        
        // Verify the config is serializable
        try {
          JSON.stringify(initialConfig);
          console.log('✅ Configuration is serializable');
        } catch (e) {
          console.error('❌ Configuration contains non-serializable data:', e);
        }
        
        if (Object.keys(initialConfig.slots).length === 0) {
          console.warn('⚠️ No slots found in cart configuration');
        }
        
        // Defer state update to avoid React error #130
        setTimeout(() => {
          if (isMounted) {
            setCartLayoutConfig(initialConfig);
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
      } finally {
        // No need to set loading state since we start with false
      }
    };

    initializeConfig();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper functions for slot styling
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig && cartLayoutConfig.slots ? cartLayoutConfig.slots[slotId] : null;
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Save configuration
  const saveConfiguration = useCallback(async (configToSave = cartLayoutConfig) => {
    if (!configToSave || !onSave) return;

    setSaveStatus('saving');
    try {
      await onSave(configToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [cartLayoutConfig, onSave]);


  // Handle element selection for EditorSidebar
  const handleElementClick = useCallback((slotId, element) => {
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
  }, []);

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
        
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          className: className,
          styles: mergedStyles,
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
        
        console.log('✅ Updated slot configuration:', {
          slotId,
          className,
          styles: mergedStyles,
          isAlignmentChange
        });
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
      }, 1000); // Wait 1 second after resize stops

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
      }, 1000); // Wait 1 second after resize stops

      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Create the additional view mode controls for the wrapper
  const additionalControls = (
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
  );

  // Main render - Clean and maintainable  
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible && viewMode === 'withProducts' ? 'grid grid-cols-[calc(100%-320px)_320px]' : 'block'
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Only show controls in edit mode */}
            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                {/* Save Status */}
                {saveStatus && (
                  <div className={`flex items-center gap-2 text-sm ${
                    saveStatus === 'saving' ? 'text-blue-600' : 
                    saveStatus === 'saved' ? 'text-green-600' : 
                    'text-red-600'
                  }`}>
                    {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saveStatus === 'saved' && '✓ Saved'}
                    {saveStatus === 'error' && '✗ Save Failed'}
                  </div>
                )}

                <Button onClick={() => saveConfiguration()} disabled={saveStatus === 'saving'} variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>

                <Button onClick={() => setIsSidebarVisible(!isSidebarVisible)} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  {isSidebarVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
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
    </div>
  );
};

export default CartSlotsEditor;
