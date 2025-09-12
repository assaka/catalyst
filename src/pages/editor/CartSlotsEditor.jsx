/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import { 
  Save, 
  Settings, 
  Eye, 
  EyeOff, 
  ShoppingCart,
  Package,
  Loader2,
  Tag,
  Plus,
  Minus,
  Trash2
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import { cartConfig } from "@/components/editor/slot/configs/cart-config";

// Simple editable element that opens EditorSidebar on click
const EditableElement = ({ slotId, children, className, style, onClick, canResize = false, mode = 'edit' }) => {
  const handleClick = useCallback((e) => {
    // Don't handle clicks in preview mode
    if (mode === 'preview') return;
    
    e.stopPropagation();
    if (onClick) {
      onClick(slotId, e.currentTarget);
    }
  }, [slotId, onClick, mode]);

  const content = (
    <div
      className={`${mode === 'edit' ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-2' : ''} transition-all ${className || ''}`}
      style={mode === 'edit' ? {
        border: '1px dotted rgba(200, 200, 200, 0.3)',
        borderRadius: '2px',
        minHeight: '20px',
        padding: '2px',
        ...style
      } : style}
      onClick={handleClick}
      data-slot-id={slotId}
      data-editable={mode === 'edit'}
    >
      {children}
    </div>
  );

  // Show resize wrapper but disable it in preview mode
  if (canResize) {
    return (
      <ResizeWrapper
        minWidth={100}
        minHeight={40}
        maxWidth={600}
        maxHeight={400}
        disabled={mode === 'preview'}
      >
        {content}
      </ResizeWrapper>
    );
  }

  return content;
};

// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({ 
  mode = 'preview', 
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  const { selectedStore } = useStoreSelection();
  
  // State management
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize configuration from cart-config.js
  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      try {
        // Start with cart config as the single source of truth
        const initialConfig = {
          page_name: cartConfig.page_name,
          slot_type: cartConfig.slot_type,
          microSlots: { ...cartConfig.microSlots },
          slots: { ...cartConfig.slots },
          metadata: {
            ...cartConfig.metadata,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        };

        // Load from database if available
        if (selectedStore?.id && onSave) {
          try {
            const response = await fetch(`/api/slot-configurations?store_id=${selectedStore.id}&page_name=Cart`);
            if (response.ok) {
              const data = await response.json();
              if (data.configuration?.slots) {
                // Merge database config with cart-config defaults
                initialConfig.slots = { 
                  ...initialConfig.slots, 
                  ...data.configuration.slots 
                };
              }
            }
          } catch (error) {
            console.log('Using cart-config.js defaults');
          }
        }

        setCartLayoutConfig(initialConfig);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, [selectedStore?.id, onSave]);

  // Save configuration to database
  const saveConfiguration = useCallback(async (configToSave = cartLayoutConfig) => {
    if (!configToSave || !selectedStore?.id || !onSave) return;

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
  }, [cartLayoutConfig, selectedStore?.id, onSave]);

  // Helper functions - match Cart.jsx exactly
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  const getMicroSlotStyling = useCallback((microSlotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[microSlotId];
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  const getSlotPositioning = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    return {
      gridClasses: slotConfig?.className || '',
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Handle element selection for EditorSidebar
  const handleElementClick = useCallback((slotId, element) => {
    setSelectedElement(element);
    setIsSidebarVisible(true);
  }, []);

  // Handle text changes from EditorSidebar
  const handleTextChange = useCallback((slotId, newText) => {
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        slots: {
          ...prevConfig?.slots,
          [slotId]: {
            ...prevConfig?.slots?.[slotId],
            content: newText,
            metadata: {
              ...prevConfig?.slots?.[slotId]?.metadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      // Auto-save with debounce
      setTimeout(() => saveConfiguration(updatedConfig), 1000);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle class changes from EditorSidebar
  const handleClassChange = useCallback((slotId, className, styles) => {
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        slots: {
          ...prevConfig?.slots,
          [slotId]: {
            ...prevConfig?.slots?.[slotId],
            className: className,
            styles: styles || prevConfig?.slots?.[slotId]?.styles || {},
            metadata: {
              ...prevConfig?.slots?.[slotId]?.metadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      // Auto-save
      setTimeout(() => saveConfiguration(updatedConfig), 500);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading cart editor...
        </div>
      </div>
    );
  }

  // Main render - Clean and maintainable
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'grid grid-cols-[1fr_320px]' : 'block'
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {/* View Mode Selector - matches Cart.jsx logic */}
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

        {/* Cart Layout - EXACT COPY of Cart.jsx structure */}
        <div 
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Header Section with Grid Layout */}
            <div className="header-section mb-8">
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                  .filter(slotId => slotId.startsWith('header.'))
                  .map(slotId => {
                    const positioning = getSlotPositioning(slotId);
                    
                    if (slotId === 'header.title') {
                      const headerTitleStyling = getMicroSlotStyling('header.title');
                      const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                      const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                      
                      return (
                        <div key={slotId} className="col-span-12">
                          <EditableElement
                            slotId={slotId}
                            mode={mode}
                            onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                            className={finalClasses}
                            style={headerTitleStyling.elementStyles}
                          >
                            {cartLayoutConfig.slots[slotId]?.content || "My Cart"}
                          </EditableElement>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
              </div>
            </div>
            
            {/* Conditional rendering based on viewMode */}
            {viewMode === 'empty' ? (
              // Empty cart state with simple editable slots
              <div className="emptyCart-section">
                <div className="text-center py-12">
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                      .filter(slotId => slotId.startsWith('emptyCart.'))
                      .map(slotId => {
                        if (slotId === 'emptyCart.icon') {
                          return (
                            <div key={slotId} className="col-span-12">
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                canResize={true}
                              >
                                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                              </EditableElement>
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.title') {
                          const titleStyling = getMicroSlotStyling('emptyCart.title');
                          const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                          const finalClasses = titleStyling.elementClasses || defaultClasses;
                          
                          return (
                            <div key={slotId} className="col-span-12">
                              <EditableElement
                                slotId={slotId}
                                onClick={handleElementClick}
                                className={finalClasses}
                                style={titleStyling.elementStyles}
                                canResize={true}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Your cart is empty"}
                              </EditableElement>
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.text') {
                          const textStyling = getMicroSlotStyling('emptyCart.text');
                          const defaultClasses = 'text-gray-600 mb-6';
                          const finalClasses = textStyling.elementClasses || defaultClasses;
                          
                          return (
                            <div key={slotId} className="col-span-12">
                              <EditableElement
                                slotId={slotId}
                                onClick={handleElementClick}
                                className={finalClasses}
                                style={textStyling.elementStyles}
                                canResize={true}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </EditableElement>
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.button') {
                          const buttonStyling = getMicroSlotStyling('emptyCart.button');
                          
                          return (
                            <div key={slotId} className="col-span-12 flex justify-center">
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                canResize={true}
                              >
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 w-auto"
                                  style={buttonStyling.elementStyles}
                                >
                                  {cartLayoutConfig.slots[slotId]?.content || "Continue Shopping"}
                                </Button>
                              </EditableElement>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                  </div>
                </div>
              </div>
            ) : (
              // Cart with products view - Clean layout
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-white">
                    <CardContent className="px-4 divide-y divide-gray-200">
                      {/* Sample cart items */}
                      <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                        <EditableElement
                          slotId="cartItem.image"
                          mode={mode}
                          mode={mode}
                          onClick={handleElementClick}
                          canResize={true}
                        >
                          <img 
                            src="https://placehold.co/100x100?text=Product" 
                            alt="Sample Product"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </EditableElement>
                        
                        <div className="flex-1">
                          <EditableElement
                            slotId="cartItem.title"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="text-lg font-semibold"
                          >
                            Sample Product
                          </EditableElement>
                          
                          <EditableElement
                            slotId="cartItem.price"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="text-gray-600"
                          >
                            $29.99 each
                          </EditableElement>
                          
                          <div className="flex items-center space-x-3 mt-3">
                            <EditableElement
                              slotId="cartItem.quantity"
                              mode={mode}
                              onClick={handleElementClick}
                              canResize={true}
                            >
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline">
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-lg font-semibold">1</span>
                                <Button size="sm" variant="outline">
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="ml-auto">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </EditableElement>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <EditableElement
                            slotId="cartItem.total"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="text-xl font-bold"
                          >
                            $29.99
                          </EditableElement>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                  {/* Coupon Section */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className="col-span-12">
                          <EditableElement
                            slotId="coupon.title"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="text-lg font-semibold mb-4"
                          >
                            Apply Coupon
                          </EditableElement>
                        </div>
                        <div className="col-span-8">
                          <EditableElement
                            slotId="coupon.input"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                          >
                            <Input placeholder="Enter coupon code" />
                          </EditableElement>
                        </div>
                        <div className="col-span-4">
                          <EditableElement
                            slotId="coupon.button"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                          >
                            <Button>
                              <Tag className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </EditableElement>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Order Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className="col-span-12">
                          <EditableElement
                            slotId="orderSummary.title"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="text-lg font-semibold mb-4"
                          >
                            Order Summary
                          </EditableElement>
                        </div>
                        <div className="col-span-12">
                          <EditableElement
                            slotId="orderSummary.subtotal"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="flex justify-between"
                          >
                            <span>Subtotal</span><span>$79.97</span>
                          </EditableElement>
                        </div>
                        <div className="col-span-12">
                          <EditableElement
                            slotId="orderSummary.tax"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="flex justify-between"
                          >
                            <span>Tax</span><span>$6.40</span>
                          </EditableElement>
                        </div>
                        <div className="col-span-12">
                          <EditableElement
                            slotId="orderSummary.total"
                            mode={mode}
                            onClick={handleElementClick}
                            canResize={true}
                            className="flex justify-between text-lg font-semibold border-t pt-4"
                          >
                            <span>Total</span><span>$81.37</span>
                          </EditableElement>
                        </div>
                        <div className="col-span-12">
                          <div className="border-t mt-6 pt-6">
                            <EditableElement
                              slotId="orderSummary.checkoutButton"
                              onClick={handleElementClick}
                              canResize={true}
                            >
                              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                Proceed to Checkout
                              </Button>
                            </EditableElement>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EditorSidebar - only show in edit mode */}
      {mode === 'edit' && isSidebarVisible && selectedElement && (
        <EditorSidebar
          selectedElement={selectedElement}
          slotId={selectedElement.getAttribute('data-slot-id')}
          slotConfig={cartLayoutConfig?.slots?.[selectedElement.getAttribute('data-slot-id')]}
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