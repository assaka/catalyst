/**
 * Modern CartSlotsEditor - Clean implementation with cartConfig
 * Features: drag-and-drop, action bar, slot editing, database persistence
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { ShoppingCart, Package, Save, RefreshCw, CheckCircle, X, Plus, Minus, Trash2, Tag } from "lucide-react";
import Editor from '@monaco-editor/react';

// Import Cart.jsx's exact dependencies
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';

// Clean imports - using cartConfig as single source
import cartConfig from '@/components/editor/slot/configs/cart-config';
import InlineSlotEditor from "@/components/editor/slot/InlineSlotEditor";

// Import generic editor utilities
import {
  createDragStartHandler,
  createDragEndHandler,
  createEditSlotHandler,
  createInlineTextChangeHandler,
  createInlineClassChangeHandler,
  createSaveEditHandler,
  createMicroSlotStyling,
  createSlotPositioning,
  createCustomSlotRenderer
} from '@/components/editor/slot/editor-utils';

// Services for loading slot configuration data
import slotConfigurationService from '@/services/slotConfigurationService';
import { SlotConfiguration } from '@/api/entities';

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
  const [flashMessage, setFlashMessage] = useState(null);
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
        elementClasses: cartLayoutConfig.elementClasses || {},
        elementStyles: cartLayoutConfig.elementStyles || {},
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
            configToLoad = response.data.configuration;
            console.log('✅ Loaded published cart layout configuration for preview:', configToLoad);
          }
        } else {
          // Edit mode: Load draft configuration first, fallback to published
          console.log('✏️ Edit mode: Loading draft configuration');
          const draftResponse = await slotConfigurationService.getDraftConfiguration(selectedStore.id, PAGE_TYPE);
          
          if (draftResponse.success && draftResponse.data && draftResponse.data.configuration) {
            configToLoad = draftResponse.data.configuration;
            console.log('✅ Loaded draft cart layout configuration for editing:', configToLoad);
          } else {
            // Fallback to published configuration
            const response = await slotConfigurationService.getPublishedConfiguration(selectedStore.id, PAGE_TYPE);
            
            if (response.success && response.data && response.data.configuration) {
              configToLoad = response.data.configuration;
              console.log('✅ Loaded published cart layout configuration as fallback:', configToLoad);
            }
          }
        }
        
        if (configToLoad) {
          setCartLayoutConfig(configToLoad);
        } else {
          console.warn('⚠️ No configuration found, using cartConfig defaults');
          // Set default configuration from cartConfig
          setCartLayoutConfig({
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
            elementClasses: {},
            elementStyles: {},
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Could not load slot configuration:', error);
        // Fallback to cartConfig defaults
        setCartLayoutConfig({
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
          elementClasses: {},
          elementStyles: {},
          metadata: {
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        });
      }
    };
    
    loadCartLayoutConfig();
  }, [selectedStore?.id, mode]);

  // Update major slots based on view mode and configuration
  useEffect(() => {
    if (cartLayoutConfig?.majorSlots) {
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
  const handleEditSlot = useMemo(() =>
    createEditSlotHandler(setEditingComponent, setTempCode),
    []
  );

  // Generic auto-save handlers using editor-utils
  const handleInlineTextChange = useMemo(() =>
    createInlineTextChangeHandler({
      setLayoutConfig: setCartLayoutConfig,
      saveConfiguration,
      layoutConfig: cartLayoutConfig,
      slotContentKey: 'slots',
      debounceMs: 500
    }),
    [cartLayoutConfig, saveConfiguration]
  );

  const handleInlineClassChange = useMemo(() =>
    createInlineClassChangeHandler({
      setLayoutConfig: setCartLayoutConfig,
      saveConfiguration,
      layoutConfig: cartLayoutConfig,
      debounceMs: 300
    }),
    [cartLayoutConfig, saveConfiguration]
  );

  const handleSaveEdit = useMemo(() => {
    const saveHandler = createSaveEditHandler({
      setLayoutConfig: setCartLayoutConfig,
      setEditingComponent,
      setTempCode,
      saveConfiguration,
      slotContentKey: 'slots'
    });
    
    return () => saveHandler(editingComponent, tempCode, cartLayoutConfig);
  }, [editingComponent, tempCode, cartLayoutConfig, saveConfiguration]);

  // Generic helper functions using editor-utils
  const getMicroSlotStyling = useMemo(() =>
    createMicroSlotStyling(cartLayoutConfig),
    [cartLayoutConfig]
  );

  const getSlotPositioning = useMemo(() =>
    createSlotPositioning(cartLayoutConfig),
    [cartLayoutConfig]
  );

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

  // Render slot content based on slot type
  const renderSlotContent = useCallback((slotId) => {
    const slotDef = cartConfig.microSlotDefinitions[slotId];
    if (!slotDef) return null;

    switch (slotId) {
      case 'header':
        return (
          <div className="text-center py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {cartLayoutConfig?.slots?.['header.title']?.content || 'My Cart'}
            </h1>
          </div>
        );

      case 'emptyCart':
        if (viewMode !== 'empty') return null;
        return (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {cartLayoutConfig?.slots?.['emptyCart.title']?.content || 'Your cart is empty'}
            </h2>
            <p className="text-gray-600 mb-6">
              {cartLayoutConfig?.slots?.['emptyCart.text']?.content || "Looks like you haven't added anything to your cart yet."}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {cartLayoutConfig?.slots?.['emptyCart.button']?.content || 'Continue Shopping'}
            </Button>
          </div>
        );

      case 'cartItem':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sample Product</h3>
                <p className="text-gray-600">$29.99</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">-</Button>
                <span className="px-2">1</span>
                <Button variant="outline" size="sm">+</Button>
              </div>
              <Button variant="destructive" size="sm">Remove</Button>
            </div>
          </div>
        );

      case 'coupon':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Apply Coupon</h3>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter coupon code" 
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button className="bg-green-600 hover:bg-green-700">Apply</Button>
            </div>
          </div>
        );

      case 'orderSummary':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$29.99</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>$2.40</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>$32.39</span>
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-gray-500 text-center">
            Slot content for {slotId}
          </div>
        );
    }
  }, [viewMode, cartLayoutConfig]);

  // Render using exact Cart.jsx layout structure with slot_configurations
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
        <div className="bg-gray-50 cart-page min-h-screen flex flex-col">
      {/* Save Status Indicator */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-white font-medium ${
          saveStatus === 'saving' ? 'bg-blue-500' : 
          saveStatus === 'saved' ? 'bg-green-500' : 
          'bg-red-500'
        }`}>
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
            <div className="flex justify-between items-center py-3">
              <h1 className="text-lg font-semibold text-gray-900">Cart Layout Editor</h1>
              
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
          <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
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
          {mode === 'edit' && (
            <div className="border-2 border-dashed border-gray-300 p-4 relative">
              <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                header
              </div>
            </div>
          )}
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
                        {mode === 'edit' ? (
                          <InlineSlotEditor
                            slotId={slotId}
                            text={cartLayoutConfig?.slots?.[slotId]?.content || "My Cart"}
                            className={finalClasses}
                            style={{...headerTitleStyling.elementStyles, ...positioning.elementStyles}}
                            onChange={(newText) => handleInlineTextChange(slotId, newText)}
                            onClassChange={handleInlineClassChange}
                            mode={mode}
                          />
                        ) : (
                          <h1 className={finalClasses} style={{...headerTitleStyling.elementStyles, ...positioning.elementStyles}}>
                            {cartLayoutConfig?.slots?.[slotId]?.content || "My Cart"}
                          </h1>
                        )}
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
        
        <CmsBlockRenderer position="cart_above_items" />
        
        {cartItems.length === 0 || viewMode === 'empty' ? (
          // Empty cart state with micro-slots in custom order
          <div className="emptyCart-section">
            {mode === 'edit' && (
              <div className="border-2 border-dashed border-gray-300 p-4 relative mb-4">
                <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                  emptyCart
                </div>
              </div>
            )}
            <div className="text-center py-12">
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
                            {mode === 'edit' ? (
                              <InlineSlotEditor
                                slotId={slotId}
                                text="<ShoppingCart />"
                                className={finalClasses}
                                style={{...iconStyling.elementStyles, ...positioning.elementStyles}}
                                onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                onClassChange={handleInlineClassChange}
                                mode={mode}
                                elementType="icon"
                              />
                            ) : (
                              <ShoppingCart className={finalClasses} style={{...iconStyling.elementStyles, ...positioning.elementStyles}} />
                            )}
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
                            {mode === 'edit' ? (
                              <InlineSlotEditor
                                slotId={slotId}
                                text={cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                                className={finalClasses}
                                style={{...titleStyling.elementStyles, ...positioning.elementStyles}}
                                onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                onClassChange={handleInlineClassChange}
                                mode={mode}
                              />
                            ) : (
                              <h2 className={finalClasses} style={{...titleStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Your cart is empty"}
                              </h2>
                            )}
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
                            {mode === 'edit' ? (
                              <InlineSlotEditor
                                slotId={slotId}
                                text={cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                                className={finalClasses}
                                style={{...textStyling.elementStyles, ...positioning.elementStyles}}
                                onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                onClassChange={handleInlineClassChange}
                                mode={mode}
                              />
                            ) : (
                              <p className={finalClasses} style={{...textStyling.elementStyles, ...positioning.elementStyles}}>
                                {cartLayoutConfig?.slots?.[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </p>
                            )}
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
                            {mode === 'edit' ? (
                              <InlineSlotEditor
                                slotId={slotId}
                                text="Continue Shopping"
                                className={finalClasses}
                                style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                onClassChange={handleInlineClassChange}
                                mode={mode}
                                elementType="button"
                              />
                            ) : (
                              <Button 
                                className={finalClasses}
                                style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                              >
                                Continue Shopping
                              </Button>
                            )}
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
            </div>
          </div>
        ) : (
          // Cart with products layout
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              {mode === 'edit' && (
                <div className="border-2 border-dashed border-gray-300 p-4 relative mb-4">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    cartItem
                  </div>
                </div>
              )}
              <Card>
                <CardContent className="px-4 divide-y divide-gray-200">
                  {cartItems.map(item => {
                    const product = item.product;
                    if (!product) return null;

                    return (
                      <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
                        <img 
                          src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'} 
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
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
              <CmsBlockRenderer position="cart_below_items" />
            </div>
            
            <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
              {/* Coupon Section */}
              {mode === 'edit' && (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    coupon
                  </div>
                </div>
              )}
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
                                {mode === 'edit' ? (
                                  <InlineSlotEditor
                                    slotId={slotId}
                                    text="<Tag className=&quot;w-4 h-4 mr-2&quot; /> Apply"
                                    className={finalClasses}
                                    style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                    onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                    onClassChange={handleInlineClassChange}
                                    mode={mode}
                                    elementType="button"
                                  />
                                ) : (
                                  <Button 
                                    disabled={!couponCode.trim()}
                                    className={finalClasses}
                                    style={{...buttonStyling.elementStyles, ...positioning.elementStyles}}
                                  >
                                    <Tag className="w-4 h-4 mr-2" /> Apply
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
              
              {/* Order Summary Section */}
              {mode === 'edit' && (
                <div className="border-2 border-dashed border-gray-300 p-4 relative">
                  <div className="absolute -top-3 left-2 bg-white px-2 text-sm font-medium text-gray-600">
                    orderSummary
                  </div>
                </div>
              )}
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
                                  {mode === 'edit' ? (
                                    <InlineSlotEditor
                                      slotId={slotId}
                                      text="Proceed to Checkout"
                                      className={finalClasses}
                                      style={{
                                        backgroundColor: '#007bff',
                                        color: '#FFFFFF',
                                        ...buttonStyling.elementStyles,
                                        ...positioning.elementStyles
                                      }}
                                      onChange={(newText) => handleInlineTextChange(slotId, newText)}
                                      onClassChange={handleInlineClassChange}
                                      mode={mode}
                                      elementType="button"
                                    />
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
                                      Proceed to Checkout
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
                      elementClasses: {},
                      elementStyles: {},
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
  );
}