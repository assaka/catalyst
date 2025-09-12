/**
 * CartPeerReview - Test environment (T in DTAP) for reviewing draft configurations
 * Features: Same layout as editor but without handles, borders, or interactive elements
 * Purpose: Test and review draft configurations before publishing to Acceptance
 * Loads: Draft configurations (not published) for testing purposes
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Plus, Minus, Trash2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ResizeWrapper as ResizeElementWrapper } from "@/components/ui/resize-element-wrapper";

// Import Cart.jsx's exact dependencies
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';

// Services for loading slot configuration data
import slotConfigurationService from '@/services/slotConfigurationService';

// Configuration constants
const PAGE_TYPE = 'cart';
const PAGE_NAME = 'Cart';

// Main Cart Peer Review Component
export default function CartPeerReview({
  data,
  viewMode: propViewMode = 'empty', // 'empty' or 'withProducts'
}) {
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  
  // Core state matching Cart.jsx
  const [viewMode, setViewMode] = useState(propViewMode || 'empty');
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  const [majorSlots, setMajorSlots] = useState(['header', 'emptyCart']);
  const [configStatus, setConfigStatus] = useState('loading'); // 'loading', 'draft', 'published', 'none'
  
  // Sample cart data for preview
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
  
  // Sample financial calculations
  const subtotal = 59.98;
  const discount = 0;
  const tax = 4.80;
  const total = 64.78;
  const currencySymbol = '$';

  // Load draft configuration for testing (T in DTAP)
  useEffect(() => {
    const loadCartLayoutConfig = async () => {
      if (!selectedStore?.id) {
        console.log('❌ CartPeerReview: No store.id found, skipping slot config loading');
        setConfigStatus('none');
        return;
      }
      
      console.log('🔄 CartPeerReview: Starting configuration load for store:', selectedStore.id, 'pageType:', PAGE_TYPE);
      setConfigStatus('loading');
      
      try {
        // Load DRAFT configuration for testing environment
        console.log('📖 CartPeerReview: Attempting to load draft configuration...');
        const draftResponse = await slotConfigurationService.getDraftConfiguration(selectedStore.id, PAGE_TYPE);
        
        console.log('📋 CartPeerReview: Draft response received:', {
          success: draftResponse?.success,
          hasData: !!draftResponse?.data,
          hasConfiguration: !!draftResponse?.data?.configuration,
          draftId: draftResponse?.data?.id,
          responseKeys: draftResponse ? Object.keys(draftResponse) : [],
          dataKeys: draftResponse?.data ? Object.keys(draftResponse.data) : []
        });
        
        if (draftResponse.success && draftResponse.data && draftResponse.data.configuration) {
          const rawConfig = draftResponse.data.configuration;
          // Transform from API format to CartSlotsEditor format
          const configToLoad = slotConfigurationService.transformFromSlotConfigFormat(rawConfig);
          setCartLayoutConfig(configToLoad);
          setConfigStatus('draft');
          console.log('✅ CartPeerReview: Successfully loaded DRAFT configuration:', {
            rawConfigKeys: Object.keys(rawConfig),
            transformedKeys: Object.keys(configToLoad),
            slots: configToLoad.slots ? Object.keys(configToLoad.slots) : 'none',
          });
        } else {
          // Fallback to published configuration if no draft exists
          console.log('⚠️ CartPeerReview: No valid draft found, falling back to published configuration');
          const response = await slotConfigurationService.getPublishedConfiguration(selectedStore.id, PAGE_TYPE);
          
          console.log('📋 CartPeerReview: Published response received:', {
            success: response?.success,
            hasData: !!response?.data,
            hasConfiguration: !!response?.data?.configuration
          });
          
          if (response.success && response.data && response.data.configuration) {
            const rawConfig = response.data.configuration;
            // Transform from API format to CartSlotsEditor format
            const configToLoad = slotConfigurationService.transformFromSlotConfigFormat(rawConfig);
            setCartLayoutConfig(configToLoad);
            setConfigStatus('published');
            console.log('✅ CartPeerReview: Successfully loaded PUBLISHED configuration as fallback:', {
              rawConfigKeys: Object.keys(rawConfig),
              transformedKeys: Object.keys(configToLoad),
              slots: configToLoad.slots ? Object.keys(configToLoad.slots) : 'none',
            });
          } else {
            setConfigStatus('none');
            console.error('❌ CartPeerReview: No configuration found (neither draft nor published)');
          }
        }
      } catch (error) {
        setConfigStatus('none');
        console.error('❌ CartPeerReview: Failed to load slot configuration:', error);
      }
    };
    
    loadCartLayoutConfig();
  }, [selectedStore?.id]);

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

  // Custom micro slot styling that reads from slots.{slotId}.className and parentClassName
  const getMicroSlotStyling = useCallback((microSlotId) => {
    // Handle wrapper slots (ending with _wrapper)
    if (microSlotId.endsWith('_wrapper')) {
      const baseSlotId = microSlotId.replace('_wrapper', '');
      return {
        elementClasses: cartLayoutConfig?.slots?.[baseSlotId]?.parentClassName || '',
        elementStyles: cartLayoutConfig?.slots?.[baseSlotId]?.styles || {}
      };
    }
    
    // Handle regular slots
    return {
      elementClasses: cartLayoutConfig?.slots?.[microSlotId]?.className || '',
      elementStyles: cartLayoutConfig?.slots?.[microSlotId]?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Simplified slot positioning using flattened structure
  const getSlotPositioning = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    const elementClasses = cartLayoutConfig?.slots?.[slotId]?.className || '';
    const elementStyles = cartLayoutConfig?.slots?.[slotId]?.styles || {};
    
    return {
      gridClasses: slotConfig?.className || 'col-span-12',
      elementClasses,
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  const renderCustomSlot = useCallback((slotId, parentSlot) => {
    const slotKey = slotId.replace(`${parentSlot}.custom_`, '');
    const customSlot = cartLayoutConfig?.customSlots?.[parentSlot]?.[slotKey];
    
    if (!customSlot) return null;

    const positioning = getSlotPositioning(slotId, parentSlot);
    const styling = getMicroSlotStyling(slotId);

    return (
      <div key={slotId} className={positioning.gridClasses}>
        <div 
          className={styling.elementClasses}
          style={{...styling.elementStyles}}
          dangerouslySetInnerHTML={{ __html: customSlot.content || customSlot.html }}
        />
      </div>
    );
  }, [cartLayoutConfig, getMicroSlotStyling, getSlotPositioning]);

  // Render using exact Cart.jsx layout structure with slot_configurations
  return (
    <div className="bg-gray-50 cart-page min-h-screen flex flex-col">
      {/* View Mode Switcher */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">Cart Layout - Test Environment</h1>
              {configStatus !== 'loading' && (
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  configStatus === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  configStatus === 'published' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {configStatus === 'draft' ? 'Draft Configuration' :
                   configStatus === 'published' ? 'Published Configuration (Fallback)' :
                   'No Configuration'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Exact Cart.jsx Layout Structure */}
      <SeoHeadManager
        title="Cart Layout - Test Environment"
        description="Test cart layout with draft configurations before publishing"
        keywords="cart, test, draft, layout, e-commerce"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FlashMessage Section with Custom Slots */}
        <div className="flashMessage-section mb-6">
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}
          {cartLayoutConfig?.slots && (
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {Object.keys(cartLayoutConfig.slots)
                .filter(slotId => slotId.startsWith('flashMessage.') && cartLayoutConfig.slots[slotId].type === 'custom')
                .map(slotId => renderCustomSlot(slotId, 'flashMessage'))
              }
            </div>
          )}
        </div>
        
        {/* Header Section with Grid Layout */}
        <div className="header-section mb-8">
          <div className="grid grid-cols-12 gap-2 auto-rows-min">
            {cartLayoutConfig?.slots ? (
              Object.keys(cartLayoutConfig.slots)
                .filter(slotId => slotId.startsWith('header.'))
                .map(slotId => {
                console.log('🎯 CartPeerReview: Rendering header slot:', slotId, {
                  slotContent: cartLayoutConfig?.slots?.[slotId]?.content,
                  slotClasses: cartLayoutConfig?.slots?.[slotId]?.className,
                  hasCustomSlots: !!cartLayoutConfig?.customSlots
                });
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
                        <h1 className={finalClasses} style={{...headerTitleStyling.elementStyles}}>
                          {cartLayoutConfig?.slots?.[slotId]?.content || "My Cart"}
                        </h1>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })
            ) : (
              // Fallback to default layout if no               <div className="col-span-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
              </div>
            )}
          </div>
        </div>
        
        <CmsBlockRenderer position="cart_above_items" />
        
        {cartItems.length === 0 || viewMode === 'empty' ? (
          // Empty cart state with micro-slots in custom order
          <div className="emptyCart-section">
            <div className="text-center py-12">
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {cartLayoutConfig?.slots ? (
                  Object.keys(cartLayoutConfig.slots)
                    .filter(slotId => slotId.startsWith('emptyCart.'))
                    .map(slotId => {
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
                            <ShoppingCart className={finalClasses} style={{...iconStyling.elementStyles}} />
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
                            <h2 className={finalClasses} style={{...titleStyling.elementStyles}}>
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
                            <p className={finalClasses} style={{...textStyling.elementStyles}}>
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
                            <Button 
                              className={finalClasses}
                              style={{...buttonStyling.elementStyles}}
                            >
                              {cartLayoutConfig?.slots?.[slotId]?.content || "Continue Shopping"}
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })
                ) : (
                  // Fallback to default layout if no                   <>
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
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.slots ? (
                      Object.keys(cartLayoutConfig.slots)
                        .filter(slotId => slotId.startsWith('coupon.'))
                        .map(slotId => {
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
                              <h3 className={finalClasses} style={{...titleStyling.elementStyles}}>
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
                                  style={{...buttonStyling.elementStyles}}
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
              
              {/* Order Summary Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.slots ? (
                      Object.keys(cartLayoutConfig.slots)
                        .filter(slotId => slotId.startsWith('orderSummary.'))
                        .map(slotId => {
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
                              <h3 className={finalClasses} style={{...titleStyling.elementStyles}}>
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
                              <div className={finalClasses} style={{...subtotalStyling.elementStyles}}>
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
                              <div className={finalClasses} style={{...taxStyling.elementStyles}}>
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
                              <div className={finalClasses} style={{...totalStyling.elementStyles}}>
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
            </div>
          </div>
        )}
        
        <div className="mt-12">
          <RecommendedProducts />
        </div>
      </div>
    </div>
  );
}