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
import { ShoppingCart, Package, Save, RefreshCw, CheckCircle, X, Plus, Minus, Trash2, Tag, Code } from "lucide-react";
import Editor from '@monaco-editor/react';

// Import Cart.jsx's exact dependencies
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';

// Clean imports - no longer using cartConfig fallbacks
import { SimpleResizeWrapper } from "@/components/editor/slot/SlotResizeWrapper";
import { ResizeWrapper as ResizeElementWrapper } from "@/components/ui/resize-element-wrapper";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import EditableElement from "@/components/editor/slot/EditableElement";
import { useElementSelection } from "@/components/editor/slot/useElementSelection";
import "@/components/editor/slot/editor-styles.css";

// Import generic editor utilities
import {
  createDragStartHandler,
  createDragEndHandler,
  createEditSlotHandler,
  createCustomSlotRenderer
} from '@/components/editor/slot/editor-utils';

// Services for loading slot configuration data
import slotConfigurationService from '@/services/slotConfigurationService';

// Clean configuration constants
const PAGE_TYPE = 'cart';
const PAGE_NAME = 'Cart';

// Sortable MajorSlot Component
function SortableMajorSlot({ id, children, mode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative ${mode === 'edit' ? 'group' : ''}`}
    >
      {mode === 'edit' && (
        <div 
          {...listeners}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-blue-500 text-white p-1 rounded z-10"
          title={`Drag ${id}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}

// Sortable MicroSlot Component  
function SortableMicroSlot({ id, children, mode, majorSlot }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'microSlot', majorSlot } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative ${mode === 'edit' ? 'group' : ''}`}
    >
      {mode === 'edit' && (
        <div 
          {...listeners}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-green-500 text-white p-0.5 rounded text-xs z-20"
          title={`Drag ${id}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z"/>
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}


// Main Cart Editor Component
export default function CartSlotsEditor({
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
  const [majorSlots, setMajorSlots] = useState(['header', 'emptyCart']);
  
  // Ref to avoid stale closures in debounced functions
  const cartLayoutConfigRef = useRef(cartLayoutConfig);
  
  // Keep ref updated
  useEffect(() => {
    cartLayoutConfigRef.current = cartLayoutConfig;
  }, [cartLayoutConfig]);
  
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
  const saveConfiguration = useCallback(async () => {
    if (!currentStoreId || !cartLayoutConfig) {
      console.error('No store ID or configuration available for saving');
      return;
    }

    setSaveStatus('saving');
    
    try {
      // Create configuration object in slot_configurations format using current cartLayoutConfig
      const configuration = {
        page_name: PAGE_NAME,
        slots: cartLayoutConfig.slots || {},
        majorSlots: majorSlots,
        microSlotOrders: cartLayoutConfig.microSlotOrders || {},
        microSlotSpans: cartLayoutConfig.microSlotSpans || {},
        customSlots: cartLayoutConfig.customSlots || {},
        componentSizes: cartLayoutConfig.componentSizes || {},
        metadata: {
          ...cartLayoutConfig.metadata,
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
      
      // Notify parent component
      onSave(configuration);
      
      console.log('✅ Configuration saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [currentStoreId, cartLayoutConfig, majorSlots, onSave]);

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

  // Update major slots based on view mode and configuration
  useEffect(() => {
    if (cartLayoutConfig?.majorSlots && Array.isArray(cartLayoutConfig.majorSlots)) {
      setMajorSlots(cartLayoutConfig.majorSlots);
    } else {
      const emptySlots = ['header', 'emptyCart'];
      const withProductsSlots = ['header', 'cartItem', 'coupon', 'orderSummary'];
      
      setMajorSlots(viewMode === 'empty' ? emptySlots : withProductsSlots);
    }
  }, [viewMode, cartLayoutConfig]);

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
      setMajorSlots,
      setLayoutConfig: setCartLayoutConfig,
      saveConfiguration,
      majorSlots,
      layoutConfig: cartLayoutConfig,
      arrayMove
    }),
    [setActiveDragSlot, setMajorSlots, setCartLayoutConfig, saveConfiguration, majorSlots, cartLayoutConfig]
  );

  // Generic edit handlers using editor-utils
  const handleEditSlot = useMemo(() => {
    const baseHandler = createEditSlotHandler(setEditingComponent, setTempCode);
    return (slotId, content, elementType) => baseHandler(slotId, content, cartLayoutConfig, elementType);
  }, [cartLayoutConfig]);

  // Custom class change handler that stores classes in slots.{slotId}.className and parentClassName
  const handleInlineClassChange = useCallback((slotId, newClassName, newStyles = {}, isWrapperSlot = false) => {
    if (!cartLayoutConfig) return;
    
    // Determine if this is for parent/wrapper styling
    const classKey = isWrapperSlot ? 'parentClassName' : 'className';
    const styleKey = isWrapperSlot ? 'parentStyles' : 'styles';
    
    try {
      // Create a complete deep copy of cartLayoutConfig to avoid any read-only issues
      const safeCartLayoutConfig = JSON.parse(JSON.stringify(cartLayoutConfig));
      
      // Safely merge existing styles with new styles
      const existingSlot = safeCartLayoutConfig.slots?.[slotId] || {};
      const existingStyles = existingSlot[styleKey] || {};
      
      // Create deep copies to avoid read-only object issues
      const safeExistingStyles = JSON.parse(JSON.stringify(existingStyles));
      const safeNewStyles = JSON.parse(JSON.stringify(newStyles));
      
      // Update the cartLayoutConfig with the new styling in the correct structure
      const updatedConfig = {
        ...safeCartLayoutConfig,
        slots: {
          ...safeCartLayoutConfig.slots,
          [slotId]: {
            ...existingSlot,
            [classKey]: newClassName,
            [styleKey]: {
              ...safeExistingStyles,
              ...safeNewStyles
            }
          }
        }
      };
      
      // Update state immediately for responsive UI
      setCartLayoutConfig(updatedConfig);
    } catch (error) {
      console.warn('Error updating cart layout config:', error);
      return; // Exit early if update fails
    }
    
    // Auto-save with debouncing (save 300ms after user stops clicking toolbar)
    if (window.classChangeTimeout) {
      clearTimeout(window.classChangeTimeout);
    }
    window.classChangeTimeout = setTimeout(() => {
      saveConfiguration();
      console.log('🎨 Auto-saved style change for:', slotId, { 
        [classKey]: newClassName, 
        [styleKey]: newStyles,
        isWrapper: isWrapperSlot 
      });
    }, 1000);
  }, [cartLayoutConfig, saveConfiguration]);

  // Handle text content changes for sidebar with debounced state updates
  const handleSidebarTextChange = useCallback((slotId, newText) => {
    if (!cartLayoutConfigRef.current) return;
    
    console.log('🎯 handleSidebarTextChange called for:', slotId, 'with text:', newText);
    
    // Skip any immediate DOM manipulation - let React handle the UI updates
    // The EditorSidebar already handles immediate local state updates
    
    // Debounce both state update and save operations
    if (window.textChangeTimeout) {
      console.log('🔄 Clearing existing textChangeTimeout');
      clearTimeout(window.textChangeTimeout);
    }
    
    window.textChangeTimeout = setTimeout(() => {
      try {
        console.log('💾 Starting debounced save for:', slotId);
        // Create a complete deep copy of cartLayoutConfig to avoid any read-only issues
        const safeCartLayoutConfig = JSON.parse(JSON.stringify(cartLayoutConfigRef.current));
        
        // Safely get existing slot data
        const existingSlot = safeCartLayoutConfig.slots?.[slotId] || {};
        const safeExistingSlot = JSON.parse(JSON.stringify(existingSlot));
        
        // Update the cartLayoutConfig with the new text content
        const updatedConfig = {
          ...safeCartLayoutConfig,
          slots: {
            ...safeCartLayoutConfig.slots,
            [slotId]: {
              ...safeExistingSlot,
              content: newText
            }
          }
        };
        
        // Update state after debounce delay
        setCartLayoutConfig(updatedConfig);
        
        // Save to database
        saveConfiguration();
        console.log('🎨 Auto-saved text change for:', slotId, { content: newText });
      } catch (error) {
        console.warn('Error updating text content:', error);
      }
    }, 1000); // 1000ms debounce delay
  }, [saveConfiguration]); // Using refs to avoid stale closures and function recreation

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

  // Handle resize for microslots with auto-save
  const handleMicroSlotResize = useCallback((slotId, parentSlot, newSpans) => {
    if (!cartLayoutConfig) return;

    console.log('🔄 Resizing microslot:', slotId, 'to spans:', newSpans);

    try {
      // Create a complete deep copy of cartLayoutConfig to avoid any read-only issues
      const safeCartLayoutConfig = JSON.parse(JSON.stringify(cartLayoutConfig));
      
      // Safely get existing spans data
      const existingMicroSlotSpans = safeCartLayoutConfig.microSlotSpans || {};
      const existingParentSpans = existingMicroSlotSpans[parentSlot] || {};
      const existingSlotSpans = existingParentSpans[slotId] || {};
      
      const safeMicroSlotSpans = JSON.parse(JSON.stringify(existingMicroSlotSpans));
      const safeParentSpans = JSON.parse(JSON.stringify(existingParentSpans));
      const safeSlotSpans = JSON.parse(JSON.stringify(existingSlotSpans));
      const safeNewSpans = JSON.parse(JSON.stringify(newSpans));

      // Update the cartLayoutConfig with the new spans
      const updatedConfig = {
        ...safeCartLayoutConfig,
        microSlotSpans: {
          ...safeMicroSlotSpans,
          [parentSlot]: {
            ...safeParentSpans,
            [slotId]: {
              ...safeSlotSpans,
              ...safeNewSpans
            }
          }
        }
      };

      // Update state immediately for responsive UI
      setCartLayoutConfig(updatedConfig);
    } catch (error) {
      console.warn('Error resizing microslot:', error);
      return; // Exit early if update fails
    }

    // Auto-save with debouncing (save 500ms after user stops resizing)
    if (window.resizeTimeout) {
      clearTimeout(window.resizeTimeout);
    }
    window.resizeTimeout = setTimeout(() => {
      saveConfiguration();
      console.log('💾 Auto-saved resize for:', slotId, newSpans);
    }, 1000);
  }, [cartLayoutConfig, saveConfiguration]);

  // Handle element resize for individual elements (icons, buttons, images)
  const handleElementResize = useCallback((slotId, newClasses) => {
    if (!cartLayoutConfig) return;

    console.log('🔄 Resizing element:', slotId, 'to classes:', newClasses);

    try {
      // Create a complete deep copy of cartLayoutConfig to avoid any read-only issues
      const safeCartLayoutConfig = JSON.parse(JSON.stringify(cartLayoutConfig));
      
      // Safely get existing slot and metadata
      const existingSlot = safeCartLayoutConfig.slots?.[slotId] || {};
      const existingMetadata = existingSlot.metadata || {};
      
      const safeExistingSlot = JSON.parse(JSON.stringify(existingSlot));
      const safeExistingMetadata = JSON.parse(JSON.stringify(existingMetadata));

      // Update the cartLayoutConfig with the new element classes
      const updatedConfig = {
        ...safeCartLayoutConfig,
        slots: {
          ...safeCartLayoutConfig.slots,
          [slotId]: {
            ...safeExistingSlot,
            className: newClasses,
            metadata: {
              ...safeExistingMetadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      // Update state immediately for responsive UI
      setCartLayoutConfig(updatedConfig);
    } catch (error) {
      console.warn('Error resizing element:', error);
      return; // Exit early if update fails
    }

    // Auto-save with debouncing (save 500ms after user stops resizing)
    if (window.elementResizeTimeout) {
      clearTimeout(window.elementResizeTimeout);
    }
    window.elementResizeTimeout = setTimeout(() => {
      saveConfiguration();
      console.log('💾 Auto-saved element resize for:', slotId, newClasses);
    }, 1000);
  }, [cartLayoutConfig, saveConfiguration]);

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
  const getSlotPositioning = useCallback((slotId, parentSlot) => {
    const microSlotSpans = cartLayoutConfig?.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
    const elementClasses = cartLayoutConfig?.slots?.[slotId]?.className || '';
    const elementStyles = cartLayoutConfig?.slots?.[slotId]?.styles || {};
    
    // Build grid positioning classes with alignment support
    let gridClasses = `col-span-${Math.min(12, Math.max(1, microSlotSpans.col || 12))} row-span-${Math.min(4, Math.max(1, microSlotSpans.row || 1))}`;
    
    // Add horizontal alignment classes to parent container
    if (microSlotSpans.align) {
      switch (microSlotSpans.align) {
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
    
    // Add margin and padding support from configuration
    const spacingStyles = {
      ...(microSlotSpans.margin ? { margin: microSlotSpans.margin } : {}),
      ...(microSlotSpans.padding ? { padding: microSlotSpans.padding } : {}),
      ...(microSlotSpans.marginTop ? { marginTop: microSlotSpans.marginTop } : {}),
      ...(microSlotSpans.marginRight ? { marginRight: microSlotSpans.marginRight } : {}),
      ...(microSlotSpans.marginBottom ? { marginBottom: microSlotSpans.marginBottom } : {}),
      ...(microSlotSpans.marginLeft ? { marginLeft: microSlotSpans.marginLeft } : {}),
      ...(microSlotSpans.paddingTop ? { paddingTop: microSlotSpans.paddingTop } : {}),
      ...(microSlotSpans.paddingRight ? { paddingRight: microSlotSpans.paddingRight } : {}),
      ...(microSlotSpans.paddingBottom ? { paddingBottom: microSlotSpans.paddingBottom } : {}),
      ...(microSlotSpans.paddingLeft ? { paddingLeft: microSlotSpans.paddingLeft } : {}),
      ...elementStyles
    };
    
    return {
      gridClasses,
      elementClasses,
      elementStyles: spacingStyles,
      microSlotSpans
    };
  }, [cartLayoutConfig]);

  const renderCustomSlot = useMemo(() =>
    createCustomSlotRenderer({
      layoutConfig: cartLayoutConfig,
      getMicroSlotStyling,
      getSlotPositioning,
      handleEditSlot,
      mode
    }),
    [cartLayoutConfig, getMicroSlotStyling, getSlotPositioning, handleEditSlot, mode]
  );


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
        <SortableContext items={majorSlots || []} strategy={verticalListSortingStrategy}>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FlashMessage Section with Custom Slots */}
        <div className="flashMessage-section mb-6">
          {/* Inline Flash Message for Editor Demo */}
          {flashMessage && (
            <div className="w-full mb-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 border-l-4 p-4 rounded-lg shadow-lg transition-all duration-300">
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
          {cartLayoutConfig?.microSlotOrders?.flashMessage && (
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig.microSlotOrders.flashMessage.map(slotId => 
                slotId.includes('.custom_') ? renderCustomSlot(slotId, 'flashMessage') : null
              )}
            </div>
          )}
        </div>
        
        {/* Header Section with Grid Layout */}
        <div className="header-section mb-8">
          {mode === 'edit' ? (
            <div className="border-2 border-dashed border-gray-300 p-4 relative">
              <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                header
              </div>
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {cartLayoutConfig?.microSlotOrders?.header ? (
              cartLayoutConfig.microSlotOrders.header.map(slotId => {
                const positioning = getSlotPositioning(slotId, 'header');
                
                if (slotId.includes('.custom_')) {
                  return renderCustomSlot(slotId, 'header');
                }
                
                // Render standard header micro-slots
                if (slotId === 'header.title') {
                  const headerTitleStyling = getMicroSlotStyling('header.title');
                  const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                  const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                  const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                  return (
                    <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
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
                    </div>
                  );
                }
                
                return null;
              })
            ) : (
              // Fallback to default layout if no microSlotOrders
              <div className="col-span-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
              </div>
            )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig?.microSlotOrders?.header ? (
                cartLayoutConfig.microSlotOrders.header.map(slotId => {
                  const positioning = getSlotPositioning(slotId, 'header');
                  
                  if (slotId.includes('.custom_')) {
                    return renderCustomSlot(slotId, 'header');
                  }
                  
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
                // Fallback to default layout if no microSlotOrders
                <div className="col-span-12">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
                </div>
              )}
            </div>
          )}
        </div>
        
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
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.microSlotOrders?.emptyCart ? (
                  cartLayoutConfig.microSlotOrders.emptyCart.map(slotId => {
                    const positioning = getSlotPositioning(slotId, 'emptyCart');
                    
                    if (slotId.includes('.custom_')) {
                      return renderCustomSlot(slotId, 'emptyCart');
                    }
                    
                    // Render standard emptyCart micro-slots
                    if (slotId === 'emptyCart.icon') {
                      const iconStyling = getMicroSlotStyling('emptyCart.icon');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'w-16 h-16 mx-auto text-gray-400 mb-4';
                      const finalClasses = iconStyling.elementClasses || defaultClasses;
                      return (
                        <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                          <SimpleResizeWrapper
                            slotId={slotId}
                            parentSlot="emptyCart"
                            spans={positioning.microSlotSpans}
                            onSlotResize={handleMicroSlotResize}
                            elementType="icon"
                            currentClasses={finalClasses}
                            onElementResize={(newClasses) => handleElementResize(slotId, newClasses)}
                            mode={mode}
                          >
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              <ShoppingCart 
                                className={finalClasses} 
                                style={{...iconStyling.elementStyles, ...positioning.elementStyles}} 
                                data-slot-id={slotId}
                              />
                            </div>
                          </SimpleResizeWrapper>
                        </div>
                      );
                    }
                    
                    if (slotId === 'emptyCart.title') {
                      const titleStyling = getMicroSlotStyling('emptyCart.title');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                      const finalClasses = titleStyling.elementClasses || defaultClasses;
                      return (
                        <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                          <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                            <EditableElement slotId={slotId} editable={mode === 'edit'}>
                              <h2 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                              </h2>
                            </EditableElement>
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
                        <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                          <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                            <EditableElement slotId={slotId} editable={mode === 'edit'}>
                              <p className={finalClasses} style={{...textStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </p>
                            </EditableElement>
                          </div>
                        </div>
                      );
                    }
                    
                    if (slotId === 'emptyCart.button') {
                      const buttonStyling = getMicroSlotStyling('emptyCart.button');
                      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
                      const defaultClasses = 'bg-blue-600 hover:bg-blue-700';
                      const finalClasses = buttonStyling.elementClasses || defaultClasses;
                      return (
                        <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                          <SimpleResizeWrapper
                            slotId={slotId}
                            parentSlot="emptyCart"
                            spans={positioning.microSlotSpans}
                            onSlotResize={handleMicroSlotResize}
                            elementType="button"
                            currentClasses={finalClasses}
                            onElementResize={(newClasses) => handleElementResize(slotId, newClasses)}
                            mode={mode}
                          >
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              {mode === 'edit' ? (
                                <ResizeElementWrapper
                                  initialWidth={200}
                                  initialHeight={44}
                                  minWidth={100}
                                  maxWidth={400}
                                >
                                  <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                    <Button 
                                      className={finalClasses}
                                      style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                    >
                                      {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                                    </Button>
                                  </EditableElement>
                                </ResizeElementWrapper>
                              ) : (
                                <ResizeElementWrapper
                                  initialWidth={200}
                                  initialHeight={44}
                                  minWidth={100}
                                  maxWidth={400}
                                  disabled={true}
                                >
                                  <Button 
                                    className={finalClasses}
                                    style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                  >
                                    {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                                  </Button>
                                </ResizeElementWrapper>
                              )}
                            </div>
                          </SimpleResizeWrapper>
                        </div>
                      );
                    }
                    
                    return null;
                  })
                ) : (
                  // Fallback to default layout if no microSlotOrders
                  <>
                    <div className="col-span-12">
                      <ResizeElementWrapper
                        initialWidth={64}
                        initialHeight={64}
                        minWidth={32}
                        maxWidth={128}
                      >
                        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      </ResizeElementWrapper>
                    </div>
                    <div className="col-span-12">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                    </div>
                    <div className="col-span-12">
                      <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                    </div>
                    <div className="col-span-12">
                      <ResizeElementWrapper
                        initialWidth={200}
                        initialHeight={44}
                        minWidth={100}
                        maxWidth={400}
                      >
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Continue Shopping
                        </Button>
                      </ResizeElementWrapper>
                    </div>
                  </>
                )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2 auto-rows-min">
                  {cartLayoutConfig?.microSlotOrders?.emptyCart ? (
                    cartLayoutConfig.microSlotOrders.emptyCart.map(slotId => {
                      const positioning = getSlotPositioning(slotId, 'emptyCart');
                      
                      if (slotId.includes('.custom_')) {
                        return renderCustomSlot(slotId, 'emptyCart');
                      }
                      
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
                        const defaultClasses = 'bg-blue-600 hover:bg-blue-700';
                        const finalClasses = buttonStyling.elementClasses || defaultClasses;
                        return (
                          <div key={slotId} className={positioning.gridClasses}>
                            <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                              <ResizeElementWrapper
                                initialWidth={200}
                                initialHeight={44}
                                minWidth={100}
                                maxWidth={400}
                                disabled={true}
                              >
                                <Button 
                                  className={finalClasses}
                                  style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                >
                                  Continue Shopping
                                </Button>
                              </ResizeElementWrapper>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })
                  ) : (
                    // Fallback to default layout if no microSlotOrders
                    <>
                      <div className="col-span-12">
                        <ResizeElementWrapper
                          initialWidth={64}
                          initialHeight={64}
                          minWidth={32}
                          maxWidth={128}
                          disabled={true}
                        >
                          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        </ResizeElementWrapper>
                      </div>
                      <div className="col-span-12">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                      </div>
                      <div className="col-span-12">
                        <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                      </div>
                      <div className="col-span-12">
                        <ResizeElementWrapper
                          initialWidth={200}
                          initialHeight={44}
                          minWidth={100}
                          maxWidth={400}
                          disabled={true}
                        >
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Continue Shopping
                          </Button>
                        </ResizeElementWrapper>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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
                                <ResizeElementWrapper
                                  initialWidth={80}
                                  initialHeight={80}
                                  minWidth={40}
                                  maxWidth={120}
                                >
                                  <EditableElement slotId="cartItem.productImage" editable={mode === 'edit'}>
                                    <img 
                                      src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'} 
                                      alt={product.name}
                                      className={imageClasses}
                                      style={imageStyling.elementStyles}
                                      data-slot-id="cartItem.productImage"
                                    />
                                  </EditableElement>
                                </ResizeElementWrapper>
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
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.microSlotOrders?.coupon ? (
                      cartLayoutConfig.microSlotOrders.coupon.map(slotId => {
                        const positioning = getSlotPositioning(slotId, 'coupon');
                        
                        if (slotId.includes('.custom_')) {
                          return renderCustomSlot(slotId, 'coupon');
                        }
                        
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
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                {mode === 'edit' ? (
                                  <EditableElement slotId={slotId} editable={mode === 'edit'}>
                                    <Button 
                                      disabled={!couponCode.trim()}
                                      className={finalClasses}
                                      style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                    >
                                      {cartLayoutConfig?.slots?.[slotId]?.content || "Apply"}
                                    </Button>
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
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.microSlotOrders?.coupon ? (
                        cartLayoutConfig.microSlotOrders.coupon.map(slotId => {
                          const positioning = getSlotPositioning(slotId, 'coupon');
                          
                          if (slotId.includes('.custom_')) {
                            return renderCustomSlot(slotId, 'coupon');
                          }
                          
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
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.microSlotOrders?.orderSummary ? (
                      cartLayoutConfig.microSlotOrders.orderSummary.map(slotId => {
                        const positioning = getSlotPositioning(slotId, 'orderSummary');
                        
                        if (slotId.includes('.custom_')) {
                          return renderCustomSlot(slotId, 'orderSummary');
                        }
                        
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
                            <div key={slotId} className={`${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`}>
                              <div className="border-t mt-6 pt-6">
                                <div className={wrapperStyling.elementClasses} style={wrapperStyling.elementStyles}>
                                  {mode === 'edit' ? (
                                    <EditableElement slotId={slotId} editable={mode === 'edit'}>
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
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                      {cartLayoutConfig?.microSlotOrders?.orderSummary ? (
                        cartLayoutConfig.microSlotOrders.orderSummary.map(slotId => {
                          const positioning = getSlotPositioning(slotId, 'orderSummary');
                          
                          if (slotId.includes('.custom_')) {
                            return renderCustomSlot(slotId, 'orderSummary');
                          }
                          
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
                      microSlotOrders: Object.fromEntries(
                        Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
                          key, def.microSlots
                        ])
                      ),
                      microSlotSpans: Object.fromEntries(
                        Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
                          key, def.defaultSpans
                        ])
                      ),
                      customSlots: {},
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
          slotConfig={selectedSlotId ? cartLayoutConfig?.slots?.[selectedSlotId] : null}
          isVisible={mode === 'edit'}
        />
      )}
    </div>
  );
}