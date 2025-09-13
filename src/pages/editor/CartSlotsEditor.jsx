/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Settings, 
  Eye, 
  EyeOff, 
  ShoppingCart,
  Package,
  Loader2,
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';






// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({ 
  mode = 'preview', 
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  // State management
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize cart configuration with both hierarchical and flat structure support
  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      try {
        // Start with cart config as the single source of truth
        const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
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

        console.log('📦 Initialized cart configuration with view mode support');
        setCartLayoutConfig(initialConfig);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, []);

  // Helper functions for slot styling
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
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
    setSelectedElement(element);
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
  const handleClassChange = useCallback((slotId, className, styles) => {
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          className: className,
          styles: styles || updatedSlots[slotId].styles || {},
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
      isSidebarVisible ? 'grid grid-cols-[75%_25%]' : 'block'
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

        {/* Cart Layout - Restored with View Modes */}
        <div 
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Header Section */}
            <div className="header-section mb-8">
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                  .filter(slotId => slotId.startsWith('header.'))
                  .map(slotId => {
                    if (slotId === 'header.title') {
                      const headerTitleStyling = getSlotStyling('header.title');
                      const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                      const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                      
                      return (
                        <div key={slotId} className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className={`cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400 transition-all ${finalClasses}`}
                            style={headerTitleStyling.elementStyles}
                            onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                            data-slot-id={slotId}
                          >
                            {cartLayoutConfig.slots[slotId]?.content || "My Cart"}
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              {slotId}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            </div>
            
            <CmsBlockRenderer position="cart_above_items" />
            
            {/* Conditional rendering based on viewMode */}
            {viewMode === 'empty' ? (
              // Empty cart state
              <div className="emptyCart-section">
                <div className="text-center py-12">
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                      .filter(slotId => slotId.startsWith('emptyCart.'))
                      .map(slotId => {
                        if (slotId === 'emptyCart.icon') {
                          return (
                            <div key={slotId} className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                              <div
                                className="cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                                onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                                data-slot-id={slotId}
                              >
                                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                              </div>
                              {mode === 'edit' && (
                                <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                  {slotId}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.title') {
                          const titleStyling = getSlotStyling('emptyCart.title');
                          const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                          const finalClasses = titleStyling.elementClasses || defaultClasses;
                          
                          return (
                            <div key={slotId} className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                              <div
                                className={`cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400 transition-all ${finalClasses}`}
                                style={titleStyling.elementStyles}
                                onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                                data-slot-id={slotId}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Your cart is empty"}
                              </div>
                              {mode === 'edit' && (
                                <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                  {slotId}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.text') {
                          const textStyling = getSlotStyling('emptyCart.text');
                          const defaultClasses = 'text-gray-600 mb-6';
                          const finalClasses = textStyling.elementClasses || defaultClasses;
                          
                          return (
                            <div key={slotId} className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                              <div
                                className={`cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400 transition-all ${finalClasses}`}
                                style={textStyling.elementStyles}
                                onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                                data-slot-id={slotId}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </div>
                              {mode === 'edit' && (
                                <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                  {slotId}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.button') {
                          const buttonStyling = getSlotStyling('emptyCart.button');
                          
                          return (
                            <div key={slotId} className={`col-span-12 flex justify-center ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                              <div
                                className="cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                                onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                                data-slot-id={slotId}
                              >
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 w-auto"
                                  style={buttonStyling.elementStyles}
                                >
                                  {cartLayoutConfig.slots[slotId]?.content || "Continue Shopping"}
                                </Button>
                              </div>
                              {mode === 'edit' && (
                                <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                  {slotId}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                  </div>
                </div>
              </div>
            ) : (
              // Cart with products view
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-white">
                    <CardContent className="px-4 divide-y divide-gray-200">
                      {/* Sample cart items */}
                      <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                        <div className={`${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <img 
                            src="https://placehold.co/100x100?text=Product" 
                            alt="Sample Product"
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('cartItem.image', e.currentTarget)}
                            data-slot-id="cartItem.image"
                          />
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              cartItem.image
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2 mb-2' : ''}`}>
                            <div
                              className="text-lg font-semibold cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                              onClick={(e) => handleElementClick('cartItem.title', e.currentTarget)}
                              data-slot-id="cartItem.title"
                            >
                              Sample Product
                            </div>
                            {mode === 'edit' && (
                              <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                cartItem.title
                              </div>
                            )}
                          </div>
                          
                          <div className={`${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2 mb-2' : ''}`}>
                            <div
                              className="text-gray-600 cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                              onClick={(e) => handleElementClick('cartItem.price', e.currentTarget)}
                              data-slot-id="cartItem.price"
                            >
                              $29.99 each
                            </div>
                            {mode === 'edit' && (
                              <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                cartItem.price
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                            <div
                              className="text-xl font-bold cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                              onClick={(e) => handleElementClick('cartItem.total', e.currentTarget)}
                              data-slot-id="cartItem.total"
                            >
                              $29.99
                            </div>
                            {mode === 'edit' && (
                              <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                cartItem.total
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <CmsBlockRenderer position="cart_below_items" />
                </div>
                
                <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                  {/* Coupon Section */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className="text-lg font-semibold mb-4 cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('coupon.title', e.currentTarget)}
                            data-slot-id="coupon.title"
                          >
                            Apply Coupon
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              coupon.title
                            </div>
                          )}
                        </div>
                        <div className={`col-span-8 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <Input 
                            placeholder="Enter coupon code"
                            className="cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('coupon.input', e.currentTarget)}
                            data-slot-id="coupon.input"
                          />
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              coupon.input
                            </div>
                          )}
                        </div>
                        <div className={`col-span-4 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <Button
                            className="cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('coupon.button', e.currentTarget)}
                            data-slot-id="coupon.button"
                          >
                            Apply
                          </Button>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              coupon.button
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Order Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className="text-lg font-semibold mb-4 cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('orderSummary.title', e.currentTarget)}
                            data-slot-id="orderSummary.title"
                          >
                            Order Summary
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              orderSummary.title
                            </div>
                          )}
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className="flex justify-between cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('orderSummary.subtotal', e.currentTarget)}
                            data-slot-id="orderSummary.subtotal"
                          >
                            <span>Subtotal</span><span>$79.97</span>
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              orderSummary.subtotal
                            </div>
                          )}
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className="flex justify-between cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('orderSummary.tax', e.currentTarget)}
                            data-slot-id="orderSummary.tax"
                          >
                            <span>Tax</span><span>$6.40</span>
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              orderSummary.tax
                            </div>
                          )}
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div
                            className="flex justify-between text-lg font-semibold border-t pt-4 cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                            onClick={(e) => handleElementClick('orderSummary.total', e.currentTarget)}
                            data-slot-id="orderSummary.total"
                          >
                            <span>Total</span><span>$81.37</span>
                          </div>
                          {mode === 'edit' && (
                            <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              orderSummary.total
                            </div>
                          )}
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'relative group border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div className="border-t mt-6 pt-6">
                            <Button 
                              size="lg" 
                              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400"
                              onClick={(e) => handleElementClick('orderSummary.checkoutButton', e.currentTarget)}
                              data-slot-id="orderSummary.checkoutButton"
                            >
                              Proceed to Checkout
                            </Button>
                            {mode === 'edit' && (
                              <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                orderSummary.checkoutButton
                              </div>
                            )}
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