/**
 * Modern CartSlotsEditor - Clean implementation using generic editor utilities
 * Features: drag-and-drop, action bar, slot editing, database persistence
 * Requires proper slot configuration - no fallbacks
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import {
  CSS
} from "@dnd-kit/utilities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package, Save, RefreshCw, CheckCircle, X, Plus, Minus, Trash2, Tag, Code, PlusCircle } from "lucide-react";
import Editor from '@monaco-editor/react';

// Import Cart.jsx's exact dependencies
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';

// Clean imports - importing cartConfig for reset functionality
import { cartConfig } from "@/components/editor/slot/configs/cart-config";
import { DirectResizable } from "@/components/ui/DirectResizableElement";
import useDirectResize from '@/hooks/useDirectResize';
import { ExternalResizeProvider, useExternalResizeContext } from "@/components/ui/external-resize-provider";
import { WebflowResizer } from "@/components/ui/WebflowResizer";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import EditableElement from "@/components/editor/slot/EditableElement";
import { useElementSelection } from "@/components/editor/slot/useElementSelection";
import "@/components/editor/slot/editor-styles.css";

// Import generic editor utilities
import {
  createDragStartHandler,
  createDragEndHandler,
  createEditSlotHandler
} from '@/components/editor/slot/editor-utils';

// Import save manager
import { saveManager, CHANGE_TYPES } from '@/components/editor/slot/SaveManager';

// Services for loading slot configuration data
import slotConfigurationService from '@/services/slotConfigurationService';

// Clean configuration constants
const PAGE_TYPE = 'cart';
const PAGE_NAME = 'Cart';

// Enhanced Sortable MicroSlot Component with Smooth Resizing and Grid Positioning
function SortableMicroSlot({ id, children, mode, onResize, cartLayoutConfig }) {
  const microSlotRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'microSlot' } });

  // Get current microslot spans for sizing and positioning
  // Get spans from flat structure - all slots are at root level now
  const currentSpans = { col: 12, row: 1 };
  
  // Build grid positioning classes
  const getGridClasses = () => {
    let gridClasses = `col-span-${Math.min(12, Math.max(1, currentSpans.col || 12))} row-span-${Math.min(4, Math.max(1, currentSpans.row || 1))}`;
    
    // Add alignment if specified
    if (currentSpans.align) {
      switch (currentSpans.align) {
        case 'left':
          gridClasses += ' justify-self-start';
          break;
        case 'center':
          gridClasses += ' justify-self-center';
          break;
        case 'right':
          gridClasses += ' justify-self-end';
          break;
      }
    }
    
    return gridClasses;
  };
  
  // Calculate pixel dimensions based on grid system (approximate)
  const gridCellWidth = 80; // Approximate width per grid column
  const gridCellHeight = 60; // Approximate height per grid row

  // Enhanced resize hook with microslot-specific settings
  const { isResizing } = useDirectResize(microSlotRef, {
    elementType: 'microslot',
    minWidth: gridCellWidth, // Minimum 1 column
    minHeight: gridCellHeight, // Minimum 1 row
    maxWidth: 12 * gridCellWidth, // Maximum 12 columns
    maxHeight: 4 * gridCellHeight, // Maximum 4 rows
    handlePosition: 'corner',
    onResize: (newSize) => {
      // Convert pixel dimensions back to grid columns/rows
      const newCols = Math.max(1, Math.min(12, Math.round(newSize.width / gridCellWidth)));
      const newRows = Math.max(1, Math.min(4, Math.round(newSize.height / gridCellHeight)));
      
      // Call resize callback if dimensions changed
      if (onResize && (newCols !== currentSpans.col || newRows !== currentSpans.row)) {
        onResize(id, { col: newCols, row: newRows });
      }
    },
    disabled: mode !== 'edit' || isDragging
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        microSlotRef.current = node;
      }}
      style={style}
      {...attributes}
      className={`${getGridClasses()} relative ${mode === 'edit' ? 'group border border-dashed border-gray-300 hover:border-blue-400' : ''} ${isResizing ? 'z-30' : ''} ${isDragging ? 'z-40 shadow-lg' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - only show when not resizing */}
      {mode === 'edit' && !isResizing && (
        <div 
          {...listeners}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-green-500 text-white p-0.5 rounded text-xs z-20 hover:bg-green-600"
          title={`Drag ${id}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z"/>
          </svg>
        </div>
      )}
      
      {/* Microslot Info Badge - shows current grid dimensions */}
      {mode === 'edit' && isHovered && !isDragging && (
        <div className="absolute -top-6 left-1 bg-slate-700 text-white text-xs px-2 py-1 rounded shadow-lg z-25 pointer-events-none">
          {currentSpans.col}×{currentSpans.row} grid
        </div>
      )}
      
      {/* Visual feedback during resize */}
      {isResizing && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-blue-400 border-dashed rounded pointer-events-none z-10">
          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Resizing {id.split('.').pop()}
          </div>
        </div>
      )}
      
      <div className={`${isResizing ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  );
}


// Main Cart Editor Component
function CartSlotsEditorContent({
  data,
  onSave = () => {},
  mode = 'edit', // 'edit' or 'preview'
  viewMode: propViewMode, // 'empty' or 'withProducts'
}) {
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  
  // Core state matching Cart.jsx
  const [viewMode, setViewMode] = useState(propViewMode || 'empty');
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  
  // Refs to avoid circular dependencies in save manager
  const cartLayoutConfigRef = useRef(cartLayoutConfig);
  const saveConfigurationRef = useRef(null);
  
  
  // Sample cart data for editor preview
  const [cartItems] = useState([
    {
      id: 'sample-1',
      product_id: 'sample-product-1',
      quantity: 2,
      price: 29.99,
      product: {
        id: 'sample-product-1',
        name: 'Wireless Headphones',
        price: 29.99,
        sale_price: 29.99,
        images: ['https://placehold.co/100x100?text=Product']
      }
    }
  ]);
  
  const [appliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [flashMessage, setFlashMessage] = useState({ 
    type: 'warning', 
    message: 'Nike Air Max 90 has been removed from your cart.' 
  });
  const [loading] = useState(false);
  
  // Sample financial calculations
  const subtotal = 59.98;
  const discount = 0;
  const tax = 4.80;
  const total = 64.78;
  const currencySymbol = '$';
  
  // Editor state
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotType, setNewSlotType] = useState('');
  const [insertAfterSlot, setInsertAfterSlot] = useState(null);

  // Element selection for sidebar
  const { 
    selectedElement, 
    selectionBox, 
    clearSelection, 
    updateElementProperty 
  } = useElementSelection();

  // Track currently selected slot ID
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  

  // Check if sidebar should be visible
  const isSidebarVisible = mode === 'edit' && selectedElement && (
    selectedElement?.hasAttribute('data-slot-id') || 
    selectedElement?.hasAttribute('data-editable') ||
    selectedElement?.closest('[data-slot-id]') ||
    selectedElement?.closest('[data-editable]')
  );

  // Update slot ID when element is selected
  useEffect(() => {
    if (selectedElement) {
      // Try to find the slot ID from the element or its parents
      const findSlotId = (element) => {
        if (!element) return null;
        
        // Check data attributes
        const slotId = element.getAttribute('data-slot-id');
        if (slotId) return slotId;
        
        // Check if element is within a specific slot section
        const parent = element.closest('[data-slot-id]');
        if (parent) return parent.getAttribute('data-slot-id');
        
        // Try to infer from context
        if (element.closest('.emptyCart-section')) {
          if (element.tagName === 'BUTTON') return 'emptyCart.button';
          if (element.classList.contains('w-16')) return 'emptyCart.icon';
          if (element.tagName === 'H1' || element.tagName === 'H2') return 'emptyCart.title';
          if (element.tagName === 'P') return 'emptyCart.text';
        }
        
        if (element.closest('.header-section')) {
          return 'header.title';
        }
        
        return null;
      };
      
      const slotId = findSlotId(selectedElement);
      setSelectedSlotId(slotId);
    } else {
      setSelectedSlotId(null);
    }
  }, [selectedElement]);

  // Save configuration to database
  const saveConfiguration = useCallback(async (configToSave = null) => {
    const config = configToSave || cartLayoutConfig;
    
    if (!currentStoreId || !config) {
      console.error('No store ID or configuration available for saving');
      return;
    }

    setSaveStatus('saving');
    
    try {
      // Create configuration object in slot_configurations format using provided config
      const configuration = {
        page_name: PAGE_NAME,
        slots: config.slots || {},
        componentSizes: config.componentSizes || {},
        metadata: {
          ...config.metadata,
          lastModified: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Save to database using slotConfigurationService
      await slotConfigurationService.saveConfiguration(
        currentStoreId,
        configuration,
        PAGE_TYPE
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
      
      // Update local state with the saved configuration so EditorSidebar gets fresh data
      if (configToSave) {
        setCartLayoutConfig(configToSave);
      }
      
      // Notify parent component
      onSave(configuration);
      
      console.log('✅ Configuration saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [currentStoreId, cartLayoutConfig, onSave]);

  // Keep refs updated - placed after saveConfiguration declaration
  useEffect(() => {
    cartLayoutConfigRef.current = cartLayoutConfig;
    saveConfigurationRef.current = saveConfiguration;
  }, [cartLayoutConfig, saveConfiguration]);
  
  // Set up save manager for this editor (no dependencies to avoid circular issues)
  useEffect(() => {
    saveManager.setSaveCallback(async (changes) => {
      console.log('💾 CartSlotsEditor processing batch save to database:', changes.size, 'changes');
      
      // Since we're updating state immediately in the handlers,
      // the save manager only needs to save to the database
      // This prevents the infinite loop caused by double state updates
      if (saveConfigurationRef.current) {
        await saveConfigurationRef.current();
      }
    });
  }, []); // Empty dependency array to avoid circular dependencies

  // Load cart layout configuration directly (matching Cart.jsx)
  useEffect(() => {
    console.log('🔄 loadCartLayoutConfig useEffect triggered, store:', selectedStore, 'mode:', mode);
    const loadCartLayoutConfig = async () => {
      if (!selectedStore?.id) {
        console.log('❌ No store.id found, skipping slot config loading');
        return;
      }
      console.log('✅ Store ID found, loading slot configuration for store:', selectedStore.id);
      
      try {
        let configToLoad;
        
        if (mode === 'preview') {
          // Preview mode: Load published configuration (like live Cart.jsx)
          console.log('📖 Preview mode: Loading published configuration');
          const response = await slotConfigurationService.getPublishedConfiguration(selectedStore.id, PAGE_TYPE);
          
          if (response.success && response.data && response.data.configuration) {
            const rawConfig = response.data.configuration;
            configToLoad = slotConfigurationService.transformFromSlotConfigFormat(rawConfig);
            console.log('✅ Loaded published cart layout configuration for preview:', configToLoad);
          }
        } else {
          // Edit mode: Load draft configuration first, fallback to published
          console.log('✏️ Edit mode: Loading draft configuration');
          const draftResponse = await slotConfigurationService.getDraftConfiguration(selectedStore.id, PAGE_TYPE);
          
          if (draftResponse.success && draftResponse.data && draftResponse.data.configuration) {
            const rawConfig = draftResponse.data.configuration;
            configToLoad = slotConfigurationService.transformFromSlotConfigFormat(rawConfig);
            console.log('✅ Loaded draft cart layout configuration for editing:', configToLoad);
          } else {
            // Fallback to published configuration
            const response = await slotConfigurationService.getPublishedConfiguration(selectedStore.id, PAGE_TYPE);
            
            if (response.success && response.data && response.data.configuration) {
              const rawConfig = response.data.configuration;
              configToLoad = slotConfigurationService.transformFromSlotConfigFormat(rawConfig);
              console.log('✅ Loaded published cart layout configuration as fallback:', configToLoad);
            }
          }
        }
        
        if (configToLoad) {
          setCartLayoutConfig(configToLoad);
        } else {
          console.error('❌ No configuration found and no cartConfig fallback available');
          // Don't set a fallback - require proper configuration
        }
      } catch (error) {
        console.error('❌ Failed to load slot configuration:', error);
        // Don't set a fallback configuration - let the error bubble up
      }
    };
    
    loadCartLayoutConfig();
  }, [selectedStore?.id, mode]);


  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Generic drag handlers using editor-utils
  const handleDragStart = useMemo(() => 
    createDragStartHandler(setActiveDragSlot), 
    []
  );

  const handleDragEnd = useMemo(() =>
    createDragEndHandler({
      setActiveDragSlot,
      setLayoutConfig: setCartLayoutConfig,
      saveConfiguration,
      layoutConfig: cartLayoutConfig,
      arrayMove
    }),
    [setActiveDragSlot, setCartLayoutConfig, saveConfiguration, cartLayoutConfig]
  );

  // Function to add a new slot
  const handleAddSlot = useCallback((slotType, afterSlot = null) => {
    console.log(`Adding new slot: ${slotType} after ${afterSlot}`);
    
    // Update cart layout config with new slot (simplified - no slot definitions needed)
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        
        // Add slot content from cart config
        slots: {
          ...prevConfig?.slots,
          // Add the specific slot if it exists in cartConfig
          ...(cartConfig.slots[slotType] ? { [slotType]: cartConfig.slots[slotType] } : {})
        }
      };
      
      // Auto-save the updated configuration
      setTimeout(() => {
        if (saveConfigurationRef.current) {
          saveConfigurationRef.current(updatedConfig);
        }
      }, 100);
      
      return updatedConfig;
    });
    
    // Close modal
    setShowAddSlotModal(false);
    setNewSlotType('');
    setInsertAfterSlot(null);
  }, []);

  // Generic edit handlers using editor-utils
  const handleEditSlot = useMemo(() => {
    const baseHandler = createEditSlotHandler(setEditingComponent, setTempCode);
    return (slotId, content, elementType) => baseHandler(slotId, content, cartLayoutConfig, elementType);
  }, [cartLayoutConfig]);

  // Simplified inline class change handler using save manager with immediate state update
  const handleInlineClassChange = useCallback((slotId, newClassName, newStyles = {}, isWrapperSlot = false) => {
    // Immediately update the local state to prevent visual lag
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = { ...prevConfig };
      if (isWrapperSlot) {
        updatedConfig.slots = {
          ...updatedConfig.slots,
          [slotId]: {
            ...updatedConfig.slots?.[slotId],
            parentClassName: newClassName,
            parentStyles: {
              ...updatedConfig.slots?.[slotId]?.parentStyles,
              ...newStyles
            }
          }
        };
      } else {
        updatedConfig.slots = {
          ...updatedConfig.slots,
          [slotId]: {
            ...updatedConfig.slots?.[slotId],
            className: newClassName,
            styles: {
              ...updatedConfig.slots?.[slotId]?.styles,
              ...newStyles
            }
          }
        };
      }
      return updatedConfig;
    });
    
    // Record the change for debounced save - save manager handles the rest
    const changeType = isWrapperSlot ? CHANGE_TYPES.PARENT_CLASSES : CHANGE_TYPES.ELEMENT_CLASSES;
    saveManager.recordChange(slotId, changeType, {
      className: newClassName,
      styles: newStyles
    });
  }, []);

  // Text change handler - update DOM element and save to database
  const handleSidebarTextChange = useCallback((slotId, newText) => {
    console.log('💾 Text change for slot:', slotId, 'New text:', newText);
    console.log('🔍 Current cartLayoutConfig:', cartLayoutConfigRef.current);
    console.log('🔍 Current slot config:', cartLayoutConfigRef.current?.slots?.[slotId]);
    
    // Update the DOM element's text content immediately
    const element = document.querySelector(`[data-slot-id="${slotId}"]`);
    if (element) {
      // Update the text content of the element
      if (element.tagName.toLowerCase() === 'input') {
        element.value = newText;
      } else {
        element.textContent = newText;
      }
      console.log('✅ DOM element updated for slot:', slotId);
    }
    
    // Also save to database
    if (saveConfigurationRef.current) {
      // Update only the specific slot content in the config for saving
      const updatedConfig = {
        ...cartLayoutConfigRef.current,
        slots: {
          ...cartLayoutConfigRef.current?.slots,
          [slotId]: {
            ...cartLayoutConfigRef.current?.slots?.[slotId],
            content: newText
          }
        }
      };
      
      console.log('💾 Updated config for saving:', {
        slotId,
        slotConfig: updatedConfig.slots[slotId],
        allSlots: Object.keys(updatedConfig.slots)
      });
      console.log('💾 Saving updated config to database...');
      // Save to database
      saveConfiguration(updatedConfig);
    }
  }, [saveConfiguration]);

  const handleSaveEdit = useCallback(() => {
    if (editingComponent && cartLayoutConfig) {
      try {
        // Create a complete deep copy of cartLayoutConfig to avoid any read-only issues
        const safeCartLayoutConfig = JSON.parse(JSON.stringify(cartLayoutConfig));
        
        // Safely get existing slot and metadata
        const existingSlot = safeCartLayoutConfig.slots?.[editingComponent] || {};
        const existingMetadata = existingSlot.metadata || {};
        
        const safeExistingSlot = JSON.parse(JSON.stringify(existingSlot));
        const safeExistingMetadata = JSON.parse(JSON.stringify(existingMetadata));
        
        // Update the cartLayoutConfig with the new HTML content
        const updatedConfig = {
          ...safeCartLayoutConfig,
          slots: {
            ...safeCartLayoutConfig.slots,
            [editingComponent]: {
              ...safeExistingSlot,
              content: tempCode,
              metadata: {
                ...safeExistingMetadata,
                lastModified: new Date().toISOString()
              }
            }
          }
        };
        
        setCartLayoutConfig(updatedConfig);
      } catch (error) {
        console.warn('Error saving edit:', error);
        return; // Exit early if update fails
      }
      setEditingComponent(null);
      setTempCode('');
      
      // Save the updated configuration to database
      setTimeout(() => saveConfiguration(), 100);
      
      console.log('💾 Saved HTML content for slot:', editingComponent);
    }
  }, [editingComponent, tempCode, cartLayoutConfig, saveConfiguration]);

  // Simplified microslot resize handler using save manager with immediate state update
  const handleMicroSlotResize = useCallback((slotId, parentSlot, newSpans) => {
    // Immediately update the local state with flat structure
    setCartLayoutConfig(prevConfig => ({
      ...prevConfig,
              [slotId]: {
          ...newSpans
        }
      }
    }));
    
    // Record the change for debounced save - save manager handles the rest
    saveManager.recordChange(slotId, CHANGE_TYPES.SLOT_RESIZE, { 
      parentSlot, 
      spans: newSpans 
    });
  }, []);

  // Simplified element resize handler using save manager with immediate state update
  const handleElementResize = useCallback((slotId, newClasses) => {
    // Immediately update the local state to prevent visual lag
    setCartLayoutConfig(prevConfig => ({
      ...prevConfig,
      slots: {
        ...prevConfig.slots,
        [slotId]: {
          ...prevConfig.slots?.[slotId],
          className: newClasses
        }
      }
    }));
    
    // Record the change for debounced save - save manager handles the rest
    saveManager.recordChange(slotId, CHANGE_TYPES.ELEMENT_RESIZE, { 
      className: newClasses 
    });
  }, []);

  // Custom micro slot styling that reads from slots.{slotId}.className and parentClassName
  const getMicroSlotStyling = useCallback((microSlotId) => {
    // Handle wrapper slots (ending with _wrapper)
    if (microSlotId.endsWith('_wrapper')) {
      const baseSlotId = microSlotId.replace('_wrapper', '');
      return {
        elementClasses: cartLayoutConfig?.slots?.[baseSlotId]?.parentClassName || '',
        elementStyles: cartLayoutConfig?.slots?.[baseSlotId]?.parentStyles || {}
      };
    }
    
    // Handle regular slots
    return {
      elementClasses: cartLayoutConfig?.slots?.[microSlotId]?.className || '',
      elementStyles: cartLayoutConfig?.slots?.[microSlotId]?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Custom slot positioning that reads from slots.{slotId}.className and slots.{slotId}.styles
  const getSlotPositioning = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    const elementClasses = cartLayoutConfig?.elementClasses?.[slotId] || '';
    const elementStyles = cartLayoutConfig?.elementStyles?.[slotId] || {};
    
    return {
      gridClasses: slotConfig?.className || 'col-span-12',
      elementClasses,
      elementStyles: { ...slotConfig?.styles, ...elementStyles }
    };
  }, [cartLayoutConfig]);

  // Function to open add slot modal
  const openAddSlotModal = useCallback((afterSlot = null) => {
    setInsertAfterSlot(afterSlot);
    setShowAddSlotModal(true);
  }, []);

  // Get available slot types for the add modal
  const getAvailableSlotTypes = useCallback(() => {
    return Object.keys(cartConfig.slotDefinitions || {});
  }, []);


  const handleSlotDelete = useCallback((slotId) => {
    // Handle slot deletion - remove from configuration
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = { ...prevConfig };
      if (updatedConfig.slots) {
        delete updatedConfig.slots[slotId];
      }
      
      
      // Auto-save
      setTimeout(() => {
        if (saveConfigurationRef.current) {
          saveConfigurationRef.current(updatedConfig);
        }
      }, 100);
      
      return updatedConfig;
    });
    
    setSelectedSlotForVisualEdit(null);
  }, []);

  // Render using exact Cart.jsx layout structure with slot_configurations
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'grid grid-cols-[1fr_320px]' : 'block'
    }`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={Object.keys(cartConfig.microSlots || {})} strategy={verticalListSortingStrategy}>
          <div className="cart-page flex flex-col min-h-full">
      {/* Save Status Indicator */}
      {saveStatus && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-white font-medium ${
          saveStatus === 'saving' ? 'bg-blue-500' : 
          saveStatus === 'saved' ? 'bg-green-500' : 
          'bg-red-500'
        }`}
        >
          {saveStatus === 'saving' && (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <X className="w-4 h-4" />
              Save Failed
            </>
          )}
        </div>
      )}

      {/* Editor Action Bar - only show in edit mode */}
      {mode === 'edit' && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
            <div className="flex justify-end items-center py-3">
              <div className="flex items-center gap-2">
                {/* View Mode Switcher */}
                <button
                  onClick={() => setViewMode('empty')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'empty'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                  Empty Cart
                </button>
                
                <button
                  onClick={() => setViewMode('withProducts')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'withProducts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" />
                  With Products
                </button>

                <div className="border-l mx-2 h-6" />
                
                <Button 
                  onClick={saveConfiguration} 
                  size="sm" 
                  disabled={saveStatus === 'saving'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </Button>
                
                <Button
                  onClick={() => setShowCodeModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  <Code className="w-4 h-4 mr-1.5" />
                  Code
                </Button>
                
                <Button
                  onClick={() => setShowResetModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exact Cart.jsx Layout Structure */}
      <SeoHeadManager
        title="Cart Layout Editor"
        description="Edit your shopping cart layout and appearance"
        keywords="cart, editor, layout, e-commerce"
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* FlashMessage Section with Custom Slots */}
        <div className="flashMessage-section mb-6">
          {/* Inline Flash Message for Editor Demo */}
          {flashMessage && (
            <div className="w-full mb-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm font-medium">{flashMessage.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFlashMessage(null)}
                    className="p-1 h-auto hover:bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add New Slot Button - Before header */}
        {mode === 'edit' && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddSlotModal(null)}
              className="border-dashed border-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Section
            </Button>
          </div>
        )}

        {/* Header Section with Grid Layout */}
        <div className="header-section mb-8">
          {mode === 'edit' ? (
            <div className="border-2 border-dashed border-gray-300 p-4 relative">
              <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                header
              </div>
              <SortableContext 
                items={cartLayoutConfig?.slots ? Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('header.')) : []} 
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-12 gap-2 auto-rows-min">
                  {cartLayoutConfig?.slots ? (
                Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('header.')).map(slotId => {
                  const positioning = getSlotPositioning(slotId, 'header');
                  
                  // Render standard header micro-slots
                  if (slotId === 'header.title') {
                    const headerTitleStyling = getMicroSlotStyling('header.title');
                    const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                    const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                    const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                    return (
                      <SortableMicroSlot
                        key={slotId}
                        id={slotId}
                        mode={mode}
                        onResize={handleMicroSlotResize}
                        cartLayoutConfig={cartLayoutConfig}
                      >
                        <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                          <EditableElement slotId={slotId} editable={mode === 'edit'}>
                            <h1 
                              className={finalClasses} 
                              style={{...headerTitleStyling.elementStyles, ...positioning.elementStyles}}
                            >
                              {cartLayoutConfig?.slots?.[slotId]?.content || "My Cart"}
                            </h1>
                          </EditableElement>
                        </div>
                      </SortableMicroSlot>
                    );
                  }
                  
                  return null;
                })
            ) : (
                // Fallback to default layout if no                 <div className="col-span-12">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
                </div>
              )}
                </div>
              </SortableContext>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig?.slots ? (
                Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('header.')).map(slotId => {
                  const positioning = getSlotPositioning(slotId, 'header');
                  
                  // Render standard header micro-slots
                  if (slotId === 'header.title') {
                    const headerTitleStyling = getMicroSlotStyling('header.title');
                    const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                    const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                    const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                    return (
                      <div key={slotId} className={positioning.gridClasses}>
                        <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                          <h1 
                            className={finalClasses} 
                            style={{...headerTitleStyling.elementStyles, ...positioning.elementStyles}}
                            data-slot-id={slotId}
                          >
                            {cartLayoutConfig?.slots?.[slotId]?.content || "My Cart"}
                          </h1>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })
              ) : (
                // Fallback to default layout if no                 <div className="col-span-12">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Add New Slot Button - After header */}
        {mode === 'edit' && (
          <div className="mb-6 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddSlotModal('header')}
              className="border-dashed border-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Section After Header
            </Button>
          </div>
        )}
        
        <CmsBlockRenderer position="cart_above_items" />
        
        {cartItems.length === 0 || viewMode === 'empty' ? (
          // Empty cart state with micro-slots in custom order
          <div className="emptyCart-section">
            <div className="text-center py-12">
              {mode === 'edit' ? (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    emptyCart
                  </div>
                  <SortableContext 
                    items={cartLayoutConfig?.slots ? Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('emptyCart.')) : []} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.slots ? (
                    Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('emptyCart.')).map(slotId => {
                    const positioning = getSlotPositioning(slotId, 'emptyCart');
                    
                    // Render standard emptyCart micro-slots
                    if (slotId === 'emptyCart.icon') {
                      const iconStyling = getMicroSlotStyling('emptyCart.icon');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'w-16 h-16 mx-auto text-gray-400 mb-4';
                      const finalClasses = iconStyling.elementClasses || defaultClasses;
                      return (
                        <SortableMicroSlot
                          key={slotId}
                          id={slotId}
                          mode={mode}
                          onResize={handleMicroSlotResize}
                          cartLayoutConfig={cartLayoutConfig}
                        >
                          <div className={`${mode === 'edit' ? 'relative group' : ''}`}>
                            {mode === 'edit' ? (
                              <WebflowResizer
                                elementType="icon"
                                disabled={false}
                                onResize={(newSize, detectedType) => {
                                  // Update element styling in configuration
                                  const newStyles = {
                                    ...iconStyling.elementStyles,
                                    width: `${newSize.width}px`,
                                    height: `${newSize.height}px`
                                  };
                                  // Save the updated styles to the configuration
                                  handleElementResize(slotId, finalClasses, newStyles);
                                }}
                              >
                                <ShoppingCart 
                                  className={finalClasses} 
                                  style={{...iconStyling.elementStyles, ...positioning.elementStyles}} 
                                  data-slot-id={slotId}
                                />
                              </WebflowResizer>
                            ) : (
                              <ShoppingCart 
                                className={finalClasses} 
                                style={{...iconStyling.elementStyles, ...positioning.elementStyles}} 
                                data-slot-id={slotId}
                              />
                            )}
                          </div>
                        </SortableMicroSlot>
                      );
                    }
                    
                    if (slotId === 'emptyCart.title') {
                      const titleStyling = getMicroSlotStyling('emptyCart.title');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                      const finalClasses = titleStyling.elementClasses || defaultClasses;
                      return (
                        <SortableMicroSlot
                          key={slotId}
                          id={slotId}
                          mode={mode}
                          onResize={handleMicroSlotResize}
                          cartLayoutConfig={cartLayoutConfig}
                        >
                          <div className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              {mode === 'edit' ? (
                                <DirectResizable
                                  elementType="generic"
                                  minWidth={150}
                                  minHeight={32}
                                  maxWidth={600}
                                  maxHeight={80}
                                  onResize={(newSize) => {
                                    const fontSize = Math.max(14, Math.min(24, newSize.height * 0.6));
                                    handleElementResize(slotId, `${finalClasses} text-[${fontSize}px]`);
                                  }}
                                >
                                  <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                    <h2 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                      {cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                                    </h2>
                                  </EditableElement>
                                </DirectResizable>
                              ) : (
                                <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                  <h2 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                    {cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                                  </h2>
                                </EditableElement>
                              )}
                            </div>
                          </div>
                        </SortableMicroSlot>
                      );
                    }
                    
                    if (slotId === 'emptyCart.text') {
                      const textStyling = getMicroSlotStyling('emptyCart.text');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'text-gray-600 mb-6';
                      const finalClasses = textStyling.elementClasses || defaultClasses;
                      return (
                        <SortableMicroSlot
                          key={slotId}
                          id={slotId}
                          mode={mode}
                          onResize={handleMicroSlotResize}
                          cartLayoutConfig={cartLayoutConfig}
                        >
                          <div className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              {mode === 'edit' ? (
                                <DirectResizable
                                  elementType="generic"
                                  minWidth={200}
                                  minHeight={24}
                                  maxWidth={800}
                                  maxHeight={60}
                                  onResize={(newSize) => {
                                    const fontSize = Math.max(12, Math.min(18, newSize.height * 0.5));
                                    handleElementResize(slotId, `${finalClasses} text-[${fontSize}px]`);
                                  }}
                                >
                                  <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                    <p className={finalClasses} style={{...textStyling.elementStyles, ...positioning.elementStyles}}>
                                      {cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                                    </p>
                                  </EditableElement>
                                </DirectResizable>
                              ) : (
                                <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                  <p className={finalClasses} style={{...textStyling.elementStyles, ...positioning.elementStyles}}>
                                    {cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                                  </p>
                                </EditableElement>
                              )}
                            </div>
                          </div>
                        </SortableMicroSlot>
                      );
                    }
                    
                    if (slotId === 'emptyCart.button') {
                      const buttonStyling = getMicroSlotStyling('emptyCart.button');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold px-6 py-3';
                      const finalClasses = buttonStyling.elementClasses || defaultClasses;
                      
                      return (
                        <SortableMicroSlot
                          key={slotId}
                          id={slotId}
                          mode={mode}
                          onResize={handleMicroSlotResize}
                          cartLayoutConfig={cartLayoutConfig}
                        >
                          <div className={`${positioning.gridClasses} button-slot-container ${wrapperStyling.elementClasses}`} style={wrapperStyling.elementStyles}>
                            {mode === 'edit' ? (
                              <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                <WebflowResizer
                                  elementType="button"
                                  disabled={false}
                                  onResize={(newSize, detectedType) => {
                                    // Update button styling in configuration
                                    const newStyles = {
                                      ...buttonStyling.elementStyles,
                                      width: `${newSize.width}px`,
                                      height: `${newSize.height}px`,
                                      fontSize: `${Math.max(12, Math.min(18, newSize.height * 0.4))}px`
                                    };
                                    handleElementResize(slotId, finalClasses, newStyles);
                                  }}
                                >
                                  <Button 
                                    className={finalClasses}
                                    style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                  >
                                    {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                                  </Button>
                                </WebflowResizer>
                              </EditableElement>
                            ) : (
                              <Button 
                                className={finalClasses}
                                style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                              >
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                              </Button>
                            )}
                          </div>
                        </SortableMicroSlot>
                      );
                    }
                    
                    return null;
                  })
                ) : (
                    // Fallback to default layout if no                     <>
                      <div className="col-span-12">
                        <DirectResizable
                          elementType="icon"
                          minWidth={32}
                          minHeight={32}
                          maxWidth={128}
                          maxHeight={128}
                        >
                          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        </DirectResizable>
                      </div>
                      <div className="col-span-12">
                        <DirectResizable
                          elementType="generic"
                          minWidth={150}
                          minHeight={32}
                          maxWidth={600}
                          maxHeight={80}
                        >
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                        </DirectResizable>
                      </div>
                      <div className="col-span-12">
                        <DirectResizable
                          elementType="generic"
                          minWidth={200}
                          minHeight={24}
                          maxWidth={800}
                          maxHeight={60}
                        >
                          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                        </DirectResizable>
                      </div>
                      <div className="col-span-12">
                        <DirectResizable
                          elementType="button"
                          minWidth={100}
                          minHeight={44}
                          maxWidth={400}
                          maxHeight={80}
                        >
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Continue Shopping
                          </Button>
                        </DirectResizable>
                      </div>
                    </>
                  )}
                    </div>
                  </SortableContext>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2 auto-rows-min">
                  {cartLayoutConfig?.slots ? (
                    Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('emptyCart.')).map(slotId => {
                      const positioning = getSlotPositioning(slotId, 'emptyCart');
                      
                      // Render standard emptyCart micro-slots
                      if (slotId === 'emptyCart.icon') {
                        const iconStyling = getMicroSlotStyling('emptyCart.icon');
                        const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                        const defaultClasses = 'w-16 h-16 mx-auto text-gray-400 mb-4';
                        const finalClasses = iconStyling.elementClasses || defaultClasses;
                        return (
                          <div key={slotId} className={positioning.gridClasses}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              <ShoppingCart className={finalClasses} style={{...iconStyling.elementStyles, ...positioning.elementStyles}} />
                            </div>
                          </div>
                        );
                      }
                      
                      if (slotId === 'emptyCart.title') {
                        const titleStyling = getMicroSlotStyling('emptyCart.title');
                        const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                        const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                        const finalClasses = titleStyling.elementClasses || defaultClasses;
                        return (
                          <div key={slotId} className={positioning.gridClasses}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              <h2 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                              </h2>
                            </div>
                          </div>
                        );
                      }
                      
                      if (slotId === 'emptyCart.text') {
                        const textStyling = getMicroSlotStyling('emptyCart.text');
                        const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                        const defaultClasses = 'text-gray-600 mb-6';
                        const finalClasses = textStyling.elementClasses || defaultClasses;
                        return (
                          <div key={slotId} className={positioning.gridClasses}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              <p className={finalClasses} style={{...textStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      if (slotId === 'emptyCart.button') {
                        const buttonStyling = getMicroSlotStyling('emptyCart.button');
                        const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                        const defaultClasses = 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold px-6 py-3';
                        const finalClasses = buttonStyling.elementClasses || defaultClasses;
                        
                        return (
                          <div key={slotId} className={`${positioning.gridClasses} button-slot-container ${wrapperStyling.elementClasses}`} style={wrapperStyling.elementStyles}>
                            <Button 
                              className={finalClasses}
                              style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                            >
                              {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                            </Button>
                          </div>
                        );
                      }
                      
                      return null;
                    })
                  ) : (
                    // Fallback to default layout if no                     <>
                      <div className="col-span-12">
                        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      </div>
                      <div className="col-span-12">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                      </div>
                      <div className="col-span-12">
                        <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                      </div>
                      <div className="col-span-12">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Continue Shopping
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Add New Slot Button - After empty cart */}
            {mode === 'edit' && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddSlotModal('emptyCart')}
                  className="border-dashed border-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Section After Empty Cart
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Cart with products layout
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              {mode === 'edit' ? (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    cartItem
                  </div>
                  <Card>
                    <CardContent className="px-4 divide-y divide-gray-200">
                      {cartItems.map(item => {
                        const product = item.product;
                        if (!product) return null;

                        // Get styling for product image slot
                        const imageStyling = getMicroSlotStyling('cartItem.productImage');
                        const imageWrapperStyling = getMicroSlotStyling('cartItem.productImage_wrapper');
                        const imageClasses = imageStyling.elementClasses || 'w-20 h-20 object-cover rounded-lg';

                        return (
                          <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
                            {/* Product Image with wrapper div for alignment */}
                            <div className={imageWrapperStyling.elementClasses} style={imageWrapperStyling.elementStyles}>
                              {mode === 'edit' ? (
                                <EditableElement slotId="cartItem.productImage" editable={mode === 'edit'}>
                                  <WebflowResizer
                                    elementType="image"
                                    disabled={false}
                                    onResize={(newSize, detectedType) => {
                                      // Update image styling in configuration
                                      const newStyles = {
                                        ...imageStyling.elementStyles,
                                        width: `${newSize.width}px`,
                                        height: `${newSize.height}px`
                                      };
                                      handleElementResize("cartItem.productImage", imageClasses, newStyles);
                                    }}
                                  >
                                    <img 
                                      src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'} 
                                      alt={product.name}
                                      className={imageClasses}
                                      style={imageStyling.elementStyles}
                                      data-slot-id="cartItem.productImage"
                                    />
                                  </WebflowResizer>
                                </EditableElement>
                              ) : (
                                <img 
                                  src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'} 
                                  alt={product.name}
                                  className={imageClasses}
                                  style={imageStyling.elementStyles}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{product.name}</h3>
                              <p className="text-gray-600">{currencySymbol}{item.price} each</p>
                              
                              <div className="flex items-center space-x-3 mt-3">
                                <Button size="sm" variant="outline">
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-lg font-semibold">{item.quantity}</span>
                                <Button size="sm" variant="outline">
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="ml-auto">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="px-4 divide-y divide-gray-200">
                    {cartItems.map(item => {
                      const product = item.product;
                      if (!product) return null;

                      // Get styling for product image slot
                      const imageStyling = getMicroSlotStyling('cartItem.productImage');
                      const imageWrapperStyling = getMicroSlotStyling('cartItem.productImage_wrapper');
                      const imageClasses = imageStyling.elementClasses || 'w-20 h-20 object-cover rounded-lg';

                      return (
                        <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
                          {/* Product Image with wrapper div for alignment */}
                          <div className={imageWrapperStyling.elementClasses} style={imageWrapperStyling.elementStyles}>
                            <img 
                              src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'} 
                              alt={product.name}
                              className={imageClasses}
                              style={imageStyling.elementStyles}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <p className="text-gray-600">{currencySymbol}{item.price} each</p>
                            
                            <div className="flex items-center space-x-3 mt-3">
                              <Button size="sm" variant="outline">
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-lg font-semibold">{item.quantity}</span>
                              <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" className="ml-auto">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
              <CmsBlockRenderer position="cart_below_items" />
            </div>
            
            <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
              {/* Coupon Section */}
              {mode === 'edit' ? (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    coupon
                  </div>
                  <Card>
                    <CardContent className="p-4">
                  <SortableContext 
                    items={cartLayoutConfig?.slots ? Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('coupon.')) : []} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.slots ? (
                        Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('coupon.')).map(slotId => {
                        const positioning = getSlotPositioning(slotId, 'coupon');

                        // Render standard coupon micro-slots
                        if (slotId === 'coupon.title') {
                          const titleStyling = getMicroSlotStyling('coupon.title');
                          const finalClasses = titleStyling.elementClasses || 'text-lg font-semibold mb-4';
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <h3 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                Apply Coupon
                              </h3>
                            </div>
                          );
                        }
                        
                        if (slotId === 'coupon.input' && !appliedCoupon) {
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <Input 
                                placeholder="Enter coupon code" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                style={positioning.elementStyles}
                              />
                            </div>
                          );
                        }
                        
                        if (slotId === 'coupon.button' && !appliedCoupon) {
                          const buttonStyling = getMicroSlotStyling('coupon.button');
                          const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                          const defaultClasses = '';
                          const finalClasses = buttonStyling.elementClasses || defaultClasses;
                          return (
                            <SortableMicroSlot
                              key={slotId}
                              id={slotId}
                              mode={mode}
                              onResize={handleMicroSlotResize}
                              cartLayoutConfig={cartLayoutConfig}
                            >
                              <div className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                                <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                  {mode === 'edit' ? (
                                    <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                      <WebflowResizer
                                        elementType="button"
                                        disabled={false}
                                        onResize={(newSize, detectedType) => {
                                          // Update button styling in configuration
                                          const newStyles = {
                                            ...buttonStyling.elementStyles,
                                            width: `${newSize.width}px`,
                                            height: `${newSize.height}px`,
                                            fontSize: `${Math.max(12, Math.min(16, newSize.height * 0.4))}px`
                                          };
                                          handleElementResize(slotId, finalClasses, newStyles);
                                        }}
                                      >
                                        <Button 
                                          disabled={!couponCode.trim()}
                                          className={finalClasses}
                                          style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                        >
                                          {cartLayoutConfig?.slots?.[slotId]?.content || "Apply"}
                                        </Button>
                                      </WebflowResizer>
                                    </EditableElement>
                                  ) : (
                                    <Button 
                                      disabled={!couponCode.trim()}
                                      className={finalClasses}
                                      style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                    >
                                      {cartLayoutConfig?.slots?.[slotId]?.content ? 
                                        <span dangerouslySetInnerHTML={{ __html: cartLayoutConfig.slots[slotId].content }} />
                                        : <><Tag className="w-4 h-4 mr-2" /> Apply</>
                                      }
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </SortableMicroSlot>
                          );
                        }
                        
                        return null;
                      })
                    ) : (
                        // Default coupon layout
                        <>
                          <div className="col-span-12">
                            <h3 className="text-lg font-semibold mb-4">Apply Coupon</h3>
                          </div>
                          <div className="col-span-8">
                            <Input 
                              placeholder="Enter coupon code" 
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            />
                          </div>
                          <div className="col-span-4">
                            <Button disabled={!couponCode.trim()}>
                              <Tag className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </SortableContext>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.slots ? (
                        Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('coupon.')).map(slotId => {
                          const positioning = getSlotPositioning(slotId, 'coupon');

                          // Render standard coupon micro-slots
                          if (slotId === 'coupon.title') {
                            const titleStyling = getMicroSlotStyling('coupon.title');
                            const finalClasses = titleStyling.elementClasses || 'text-lg font-semibold mb-4';
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <h3 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                  Apply Coupon
                                </h3>
                              </div>
                            );
                          }
                          
                          if (slotId === 'coupon.input' && !appliedCoupon) {
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <Input 
                                  placeholder="Enter coupon code" 
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  style={positioning.elementStyles}
                                />
                              </div>
                            );
                          }
                          
                          if (slotId === 'coupon.button' && !appliedCoupon) {
                            const buttonStyling = getMicroSlotStyling('coupon.button');
                            const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                            const defaultClasses = '';
                            const finalClasses = buttonStyling.elementClasses || defaultClasses;
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                  <Button 
                                    disabled={!couponCode.trim()}
                                    className={finalClasses}
                                    style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                  >
                                    <Tag className="w-4 h-4 mr-2" /> Apply
                                  </Button>
                                </div>
                              </div>
                            );
                          }
                          
                          return null;
                        })
                      ) : (
                        // Default coupon layout
                        <>
                          <div className="col-span-12">
                            <h3 className="text-lg font-semibold mb-4">Apply Coupon</h3>
                          </div>
                          <div className="col-span-8">
                            <Input 
                              placeholder="Enter coupon code" 
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            />
                          </div>
                          <div className="col-span-4">
                            <Button disabled={!couponCode.trim()}>
                              <Tag className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Order Summary Section */}
              {mode === 'edit' ? (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    orderSummary
                  </div>
                  <Card>
                    <CardContent className="p-4">
                  <SortableContext 
                    items={cartLayoutConfig?.slots ? Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('orderSummary.')) : []} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.slots ? (
                        Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('orderSummary.')).map(slotId => {
                        const positioning = getSlotPositioning(slotId, 'orderSummary');
                        
                        // Render standard orderSummary micro-slots
                        if (slotId === 'orderSummary.title') {
                          const titleStyling = getMicroSlotStyling('orderSummary.title');
                          const finalClasses = titleStyling.elementClasses || 'text-lg font-semibold mb-4';
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <h3 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                Order Summary
                              </h3>
                            </div>
                          );
                        }
                        
                        if (slotId === 'orderSummary.subtotal') {
                          const subtotalStyling = getMicroSlotStyling('orderSummary.subtotal');
                          const defaultClasses = 'flex justify-between';
                          const finalClasses = subtotalStyling.elementClasses || defaultClasses;
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <div className={finalClasses} style={{...subtotalStyling.elementStyles, ...positioning.elementStyles}}>
                                <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        }
                        
                        if (slotId === 'orderSummary.tax') {
                          const taxStyling = getMicroSlotStyling('orderSummary.tax');
                          const defaultClasses = 'flex justify-between';
                          const finalClasses = taxStyling.elementClasses || defaultClasses;
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <div className={finalClasses} style={{...taxStyling.elementStyles, ...positioning.elementStyles}}>
                                <span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        }
                        
                        if (slotId === 'orderSummary.total') {
                          const totalStyling = getMicroSlotStyling('orderSummary.total');
                          const defaultClasses = 'flex justify-between text-lg font-semibold border-t pt-4';
                          const finalClasses = totalStyling.elementClasses || defaultClasses;
                          return (
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <div className={finalClasses} style={{...totalStyling.elementStyles, ...positioning.elementStyles}}>
                                <span>Total</span>
                                <span>{currencySymbol}{total.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        }
                        
                        if (slotId === 'orderSummary.checkoutButton') {
                          const buttonStyling = getMicroSlotStyling('orderSummary.checkoutButton');
                          const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                          const defaultClasses = 'w-full';
                          const finalClasses = buttonStyling.elementClasses || defaultClasses;
                          return (
                            <SortableMicroSlot
                              key={slotId}
                              id={slotId}
                              mode={mode}
                              onResize={handleMicroSlotResize}
                              cartLayoutConfig={cartLayoutConfig}
                            >
                              <div className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                                <div className="border-t mt-6 pt-6">
                                  <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                    {mode === 'edit' ? (
                                      <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                        <WebflowResizer
                                          elementType="button"
                                          disabled={false}
                                          onResize={(newSize, detectedType) => {
                                            // Update button styling in configuration
                                            const newStyles = {
                                              backgroundColor: '#007bff',
                                              color: '#FFFFFF',
                                              ...buttonStyling.elementStyles,
                                              width: `${newSize.width}px`,
                                              height: `${newSize.height}px`,
                                              fontSize: `${Math.max(14, Math.min(20, newSize.height * 0.4))}px`
                                            };
                                            handleElementResize(slotId, finalClasses, newStyles);
                                          }}
                                        >
                                          <Button 
                                            size="lg" 
                                            className={finalClasses}
                                            style={{
                                              backgroundColor: '#007bff',
                                              color: '#FFFFFF',
                                              ...buttonStyling.elementStyles,
                                              ...positioning.elementStyles
                                            }}
                                          >
                                            {cartLayoutConfig?.slots?.[slotId]?.content || "Proceed to Checkout"}
                                          </Button>
                                        </WebflowResizer>
                                      </EditableElement>
                                    ) : (
                                      <Button 
                                        size="lg" 
                                        className={finalClasses}
                                        style={{
                                          backgroundColor: '#007bff',
                                          color: '#FFFFFF',
                                          ...buttonStyling.elementStyles,
                                          ...positioning.elementStyles
                                        }}
                                      >
                                        {cartLayoutConfig?.slots?.[slotId]?.content || "Proceed to Checkout"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SortableMicroSlot>
                          );
                        }
                        
                        return null;
                      })
                    ) : (
                        // Default order summary layout
                        <>
                          <div className="col-span-12">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between">
                              <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between">
                              <span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between text-lg font-semibold border-t pt-4">
                              <span>Total</span>
                              <span>{currencySymbol}{total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="border-t mt-6 pt-6">
                              <Button 
                                size="lg" 
                                className="w-full"
                                style={{
                                  backgroundColor: '#007bff',
                                  color: '#FFFFFF'
                                }}
                              >
                                Proceed to Checkout
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </SortableContext>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.slots ? (
                        Object.keys(cartLayoutConfig.slots).filter(slotId => slotId.startsWith('orderSummary.')).map(slotId => {
                          const positioning = getSlotPositioning(slotId, 'orderSummary');
                          
                          // Render standard orderSummary micro-slots
                          if (slotId === 'orderSummary.title') {
                            const titleStyling = getMicroSlotStyling('orderSummary.title');
                            const finalClasses = titleStyling.elementClasses || 'text-lg font-semibold mb-4';
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <h3 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                  Order Summary
                                </h3>
                              </div>
                            );
                          }
                          
                          if (slotId === 'orderSummary.subtotal') {
                            const subtotalStyling = getMicroSlotStyling('orderSummary.subtotal');
                            const defaultClasses = 'flex justify-between';
                            const finalClasses = subtotalStyling.elementClasses || defaultClasses;
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <div className={finalClasses} style={{...subtotalStyling.elementStyles, ...positioning.elementStyles}}>
                                  <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          }
                          
                          if (slotId === 'orderSummary.tax') {
                            const taxStyling = getMicroSlotStyling('orderSummary.tax');
                            const defaultClasses = 'flex justify-between';
                            const finalClasses = taxStyling.elementClasses || defaultClasses;
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <div className={finalClasses} style={{...taxStyling.elementStyles, ...positioning.elementStyles}}>
                                  <span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          }
                          
                          if (slotId === 'orderSummary.total') {
                            const totalStyling = getMicroSlotStyling('orderSummary.total');
                            const defaultClasses = 'flex justify-between text-lg font-semibold border-t pt-4';
                            const finalClasses = totalStyling.elementClasses || defaultClasses;
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <div className={finalClasses} style={{...totalStyling.elementStyles, ...positioning.elementStyles}}>
                                  <span>Total</span>
                                  <span>{currencySymbol}{total.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          }
                          
                          if (slotId === 'orderSummary.checkoutButton') {
                            const buttonStyling = getMicroSlotStyling('orderSummary.checkoutButton');
                            const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                            const defaultClasses = 'w-full';
                            const finalClasses = buttonStyling.elementClasses || defaultClasses;
                            return (
                              <div key={slotId} className={positioning.gridClasses}>
                                <div className="border-t mt-6 pt-6">
                                  <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                    <Button 
                                      size="lg" 
                                      className={finalClasses}
                                      style={{
                                        backgroundColor: '#007bff',
                                        color: '#FFFFFF',
                                        ...buttonStyling.elementStyles,
                                        ...positioning.elementStyles
                                      }}
                                    >
                                      Proceed to Checkout
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return null;
                        })
                      ) : (
                        // Default order summary layout
                        <>
                          <div className="col-span-12">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between">
                              <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between">
                              <span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="flex justify-between text-lg font-semibold border-t pt-4">
                              <span>Total</span>
                              <span>{currencySymbol}{total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="col-span-12">
                            <div className="border-t mt-6 pt-6">
                              <Button 
                                size="lg" 
                                className="w-full"
                                style={{
                                  backgroundColor: '#007bff',
                                  color: '#FFFFFF'
                                }}
                              >
                                Proceed to Checkout
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-12">
          <RecommendedProducts />
        </div>
        
        {/* Add New Slot Button - At the end */}
        {mode === 'edit' && (
          <div className="mt-8 mb-8 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddSlotModal('orderSummary')}
              className="border-dashed border-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Section at End
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modals - only show in edit mode */}
      {mode === 'edit' && (
        <>
          {/* Monaco Editor Modal */}
          <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
            <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Slot Content: {editingComponent}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  value={tempCode}
                  onChange={(value) => setTempCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingComponent(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Code Modal */}
          <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
            <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Slot Configuration JSON</DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={JSON.stringify(cartLayoutConfig, null, 2)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    readOnly: true,
                  }}
                  theme="vs-dark"
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(cartLayoutConfig, null, 2));
                  }}
                >
                  Copy to Clipboard
                </Button>
                <Button onClick={() => setShowCodeModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Reset Confirmation Modal */}
          <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Cart Layout</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to reset the cart layout to defaults? This will overwrite all current customizations.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    // Reset to cartConfig defaults
                    const defaultConfig = {
                      slots: cartConfig.slots,
                      // microSlots are now in flattened structure
                      componentSizes: {},
                      metadata: {
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                        version: '1.0'
                      }
                    };
                    
                    setCartLayoutConfig(defaultConfig);
                    setShowResetModal(false);
                    
                    // Save the reset configuration
                    setTimeout(() => saveConfiguration(), 100);
                  }}
                >
                  Reset Layout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add New Slot Modal */}
          <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Choose a section type to add{insertAfterSlot ? ` after "${insertAfterSlot}"` : ' to your cart layout'}.
                </p>
                <div className="space-y-2">
                  {getAvailableSlotTypes().map(slotType => {
                    const slotDef = cartConfig.slotDefinitions[slotType];
                    const childSlots = [];
                    return (
                      <div
                        key={slotType}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          newSlotType === slotType 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setNewSlotType(slotType)}
                      >
                        <div className="font-medium text-sm">{slotDef.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Contains: {childSlots.join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {getAvailableSlotTypes().length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All available sections are already in use.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddSlotModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddSlot(newSlotType, insertAfterSlot)}
                  disabled={!newSlotType}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Framer-style Editor Sidebar */}
      {mode === 'edit' && (
        <EditorSidebar
          selectedElement={selectedElement}
          onUpdateElement={updateElementProperty}
          onClearSelection={clearSelection}
          onClassChange={handleInlineClassChange}
          onInlineClassChange={handleInlineClassChange}
          onTextChange={handleSidebarTextChange}
          slotId={selectedSlotId}
          slotConfig={useMemo(() => 
            selectedSlotId ? cartLayoutConfig?.slots?.[selectedSlotId] : null, 
            [selectedSlotId, cartLayoutConfig?.slots?.[selectedSlotId]]
          )}
          isVisible={mode === 'edit'}
        />
      )}
    </div>
  );
}

// Main exported component with ExternalResizeProvider wrapper
export default function CartSlotsEditor(props) {
  return (
    <ExternalResizeProvider disabled={props.mode !== 'edit'}>
      <CartSlotsEditorContent {...props} />
    </ExternalResizeProvider>
  );
}