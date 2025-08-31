/**
 * Cart Component - Enhanced with Hook System
 * Uses the new extension architecture instead of patches
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Coupon } from '@/api/entities';
import { Tax } from '@/api/entities';
import { User } from '@/api/entities';
import cartService from '@/services/cartService';
import couponService from '@/services/couponService';
import taxService from '@/services/taxService';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatDisplayPrice, calculateDisplayPrice } from '@/utils/priceUtils';

// Import new hook system
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';

const getSessionId = () => {
  let sid = localStorage.getItem('cart_session_id');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sid);
  }
  return sid;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Safe number formatting helper with hooks
const formatPrice = (value, context = {}) => {
  const num = parseFloat(value);
  const basePrice = isNaN(num) ? 0 : num;
  
  // Apply pricing hooks
  return hookSystem.apply('pricing.format', basePrice, context);
};

const safeToFixed = (value, decimals = 2) => {
  const num = formatPrice(value);
  return num.toFixed(decimals);
};

// Enhanced cart calculation with hooks
const calculateCartTotals = (items, taxes, coupons, context = {}) => {
  // Apply pre-calculation hooks
  const processedItems = hookSystem.apply('cart.beforeCalculateTotal', items, {
    taxes,
    coupons,
    ...context
  });

  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  // Calculate base subtotal
  for (const item of processedItems) {
    const itemPrice = hookSystem.apply('cart.calculateItemPrice', item.price, {
      item,
      quantity: item.quantity,
      ...context
    });
    
    subtotal += itemPrice * item.quantity;
  }

  // Apply coupon discounts
  for (const coupon of coupons) {
    const discount = hookSystem.apply('cart.calculateCouponDiscount', 0, {
      coupon,
      subtotal,
      items: processedItems,
      ...context
    });
    totalDiscount += discount;
  }

  // Calculate tax
  const taxableAmount = subtotal - totalDiscount;
  totalTax = hookSystem.apply('cart.calculateTax', 0, {
    taxableAmount,
    taxes,
    items: processedItems,
    ...context
  });

  const total = taxableAmount + totalTax;

  // Apply post-calculation hooks
  const finalTotals = hookSystem.apply('cart.afterCalculateTotal', {
    subtotal,
    totalTax,
    totalDiscount,
    total,
    items: processedItems
  }, context);

  return finalTotals;
};

// Global request queue to manage API calls
let globalRequestQueue = Promise.resolve();

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 3000) => {
  return new Promise((resolve, reject) => {
    globalRequestQueue = globalRequestQueue.then(async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await delay(1000 + Math.random() * 1000);
          const result = await apiCall();
          return resolve(result);
        } catch (error) {
          const isRateLimit = error.response?.status === 429 || 
                             error.message?.includes('Rate limit') || 
                             error.message?.includes('429') ||
                             error.detail?.includes('Rate limit');
          
          if (isRateLimit && i < maxRetries - 1) {
            const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
            console.warn(`Cart: Rate limit hit, waiting ${delayTime.toFixed(0)}ms before retry ${i + 1}/${maxRetries}`);
            await delay(delayTime);
            continue;
          }
          
          if (isRateLimit) {
            console.error('Cart: Rate limit exceeded after all retries');
            return resolve([]);
          }
          
          return reject(error);
        }
      }
    }).catch(reject);
  });
};

const useDebouncedEffect = (effect, deps, delay) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...(deps || []), delay]);
};

export default function Cart() {
  const navigate = useNavigate();
  const { store, settings, taxes, selectedCountry, loading: storeLoading } = useStore();
  const [taxRules, setTaxRules] = useState([]);
  
  // Get currency symbol from settings with hook support
  const currencySymbol = hookSystem.apply('cart.getCurrencySymbol', settings?.currency_symbol || '$', {
    store,
    settings
  });

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    total: 0,
    totalTax: 0,
    itemCount: 0
  });
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Enhanced cart context for hooks
  const cartContext = useMemo(() => ({
    store,
    settings,
    taxes,
    selectedCountry,
    currencySymbol,
    sessionId: getSessionId()
  }), [store, settings, taxes, selectedCountry, currencySymbol]);

  // Enhanced loadCartItems with hooks
  const loadCartItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      // Apply before load hooks
      const shouldLoad = hookSystem.apply('cart.beforeLoadItems', true, cartContext);
      if (!shouldLoad) {
        setLoading(false);
        return;
      }

      // Emit loading event
      eventSystem.emit('cart.loadingStarted', cartContext);

      const items = await retryApiCall(async () => {
        return await cartService.getCartItems(store.id);
      });

      // Apply item processing hooks
      const processedItems = hookSystem.apply('cart.processLoadedItems', items || [], cartContext);
      
      setCartItems(processedItems);

      // Calculate totals with hooks
      const totals = calculateCartTotals(processedItems, taxes, coupons, cartContext);
      setCartSummary(totals);

      // Apply after load hooks
      hookSystem.do('cart.afterLoadItems', {
        items: processedItems,
        totals,
        ...cartContext
      });

      // Emit loaded event
      eventSystem.emit('cart.itemsLoaded', {
        items: processedItems,
        totals,
        ...cartContext
      });

    } catch (error) {
      console.error('Error loading cart items:', error);
      
      // Emit error event
      eventSystem.emit('cart.loadError', {
        error: error.message,
        ...cartContext
      });
    } finally {
      setLoading(false);
    }
  }, [store?.id, taxes, coupons, cartContext]);

  // Enhanced updateQuantity with hooks
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 0) return;

    const currentItem = cartItems.find(item => item.id === itemId);
    if (!currentItem) return;

    // Apply before update hooks
    const shouldUpdate = hookSystem.apply('cart.beforeUpdateQuantity', true, {
      itemId,
      currentQuantity: currentItem.quantity,
      newQuantity,
      item: currentItem,
      ...cartContext
    });

    if (!shouldUpdate) return;

    // Apply quantity validation hooks
    const validatedQuantity = hookSystem.apply('cart.validateQuantity', newQuantity, {
      item: currentItem,
      maxStock: currentItem.stock_quantity,
      ...cartContext
    });

    try {
      if (validatedQuantity === 0) {
        // Remove item
        await removeItem(itemId);
      } else {
        // Update quantity
        await retryApiCall(async () => {
          return await cartService.updateQuantity(store.id, itemId, validatedQuantity);
        });

        // Update local state
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId 
              ? { ...item, quantity: validatedQuantity }
              : item
          )
        );

        // Apply after update hooks
        hookSystem.do('cart.afterUpdateQuantity', {
          itemId,
          oldQuantity: currentItem.quantity,
          newQuantity: validatedQuantity,
          item: currentItem,
          ...cartContext
        });

        // Emit update event
        eventSystem.emit('cart.quantityUpdated', {
          itemId,
          oldQuantity: currentItem.quantity,
          newQuantity: validatedQuantity,
          item: currentItem,
          ...cartContext
        });
      }

      // Recalculate totals
      await loadCartItems(false);

    } catch (error) {
      console.error('Error updating quantity:', error);
      
      eventSystem.emit('cart.updateError', {
        error: error.message,
        itemId,
        ...cartContext
      });
    }
  }, [cartItems, cartContext, store?.id]);

  // Enhanced removeItem with hooks
  const removeItem = useCallback(async (itemId) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (!itemToRemove) return;

    // Apply before remove hooks
    const shouldRemove = hookSystem.apply('cart.beforeRemoveItem', true, {
      itemId,
      item: itemToRemove,
      ...cartContext
    });

    if (!shouldRemove) return;

    try {
      await retryApiCall(async () => {
        return await cartService.removeItem(store.id, itemId);
      });

      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

      // Apply after remove hooks
      hookSystem.do('cart.afterRemoveItem', {
        itemId,
        removedItem: itemToRemove,
        ...cartContext
      });

      // Emit remove event
      eventSystem.emit('cart.itemRemoved', {
        itemId,
        removedItem: itemToRemove,
        ...cartContext
      });

      // Recalculate totals
      await loadCartItems(false);

    } catch (error) {
      console.error('Error removing item:', error);
      
      eventSystem.emit('cart.removeError', {
        error: error.message,
        itemId,
        ...cartContext
      });
    }
  }, [cartItems, cartContext, store?.id]);

  // Enhanced applyCoupon with hooks
  const applyCoupon = useCallback(async (code) => {
    if (!code.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      // Apply before coupon hooks
      const processedCode = hookSystem.apply('cart.beforeApplyCoupon', code.trim(), {
        currentCoupons: coupons,
        ...cartContext
      });

      // Validate coupon with hooks
      const validationResult = hookSystem.apply('cart.validateCoupon', { valid: true, message: '' }, {
        code: processedCode,
        cartItems,
        currentCoupons: coupons,
        ...cartContext
      });

      if (!validationResult.valid) {
        setCouponError(validationResult.message);
        return;
      }

      const coupon = await retryApiCall(async () => {
        return await couponService.applyCoupon(store.id, processedCode);
      });

      // Process coupon with hooks
      const processedCoupon = hookSystem.apply('cart.processCoupon', coupon, {
        code: processedCode,
        cartItems,
        ...cartContext
      });

      setCoupons(prev => [...prev, processedCoupon]);
      setCouponCode('');

      // Apply after coupon hooks
      hookSystem.do('cart.afterApplyCoupon', {
        coupon: processedCoupon,
        code: processedCode,
        ...cartContext
      });

      // Emit coupon applied event
      eventSystem.emit('cart.couponApplied', {
        coupon: processedCoupon,
        code: processedCode,
        ...cartContext
      });

      // Recalculate totals
      await loadCartItems(false);

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply coupon';
      setCouponError(errorMessage);
      
      eventSystem.emit('cart.couponError', {
        error: errorMessage,
        code,
        ...cartContext
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [coupons, cartItems, cartContext, store?.id]);

  // Enhanced checkout navigation with hooks
  const handleCheckout = useCallback(() => {
    // Apply before checkout hooks
    const checkoutData = hookSystem.apply('cart.beforeCheckout', {
      items: cartItems,
      totals: cartSummary,
      coupons,
      canProceed: cartItems.length > 0
    }, cartContext);

    if (!checkoutData.canProceed) {
      eventSystem.emit('cart.checkoutBlocked', {
        reason: 'No items in cart',
        ...cartContext
      });
      return;
    }

    // Apply checkout URL hooks
    const checkoutUrl = hookSystem.apply('cart.getCheckoutUrl', '/checkout', {
      ...checkoutData,
      ...cartContext
    });

    // Emit checkout event
    eventSystem.emit('cart.checkoutStarted', {
      ...checkoutData,
      checkoutUrl,
      ...cartContext
    });

    navigate(checkoutUrl);
  }, [cartItems, cartSummary, coupons, cartContext, navigate]);

  // Load cart items on component mount and store change
  useEffect(() => {
    if (store?.id && !storeLoading) {
      loadCartItems();
    }
  }, [store?.id, storeLoading, loadCartItems]);

  // Emit cart viewed event
  useEffect(() => {
    if (!loading && cartItems.length >= 0) {
      eventSystem.emit('cart.viewed', {
        items: cartItems,
        totals: cartSummary,
        ...cartContext
      });
    }
  }, [loading, cartItems, cartSummary, cartContext]);

  // Apply component rendering hooks
  const renderProps = hookSystem.apply('cart.componentProps', {
    cartItems,
    loading,
    cartSummary,
    coupons,
    couponCode,
    couponError,
    isApplyingCoupon,
    currencySymbol
  }, cartContext);

  if (loading || storeLoading) {
    const loadingComponent = hookSystem.apply('cart.renderLoading', (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading cart...</p>
        </div>
      </div>
    ), cartContext);
    
    return loadingComponent;
  }

  // Apply empty cart rendering hooks
  if (renderProps.cartItems.length === 0) {
    const emptyCartComponent = hookSystem.apply('cart.renderEmpty', (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
          <h2 className="text-2xl font-bold mt-4">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2">Add some products to get started!</p>
          <Button asChild className="mt-6">
            <Link to={createPageUrl('shop', store)}>Continue Shopping</Link>
          </Button>
        </div>
      </div>
    ), cartContext);

    return emptyCartComponent;
  }

  // Main cart render with hooks
  const cartComponent = (
    <div className="container mx-auto px-4 py-8">
      <SeoHeadManager 
        title={hookSystem.apply('cart.getPageTitle', 'Shopping Cart', cartContext)}
        description={hookSystem.apply('cart.getPageDescription', 'Review and manage your cart items', cartContext)}
      />
      
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {renderProps.cartItems.map((item) => {
            // Apply item rendering hooks
            const itemProps = hookSystem.apply('cart.renderItem', item, {
              ...cartContext,
              updateQuantity,
              removeItem
            });

            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-center space-x-4">
                  {itemProps.image_url && (
                    <img 
                      src={itemProps.image_url} 
                      alt={itemProps.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{itemProps.name}</h3>
                    <p className="text-muted-foreground">
                      {currencySymbol}{formatPrice(itemProps.price, { item: itemProps, ...cartContext })}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <span className="w-12 text-center">{itemProps.quantity}</span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">
                      {currencySymbol}{safeToFixed(formatPrice(itemProps.price, { item: itemProps, ...cartContext }) * itemProps.quantity)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="space-y-6">
          {/* Coupon Code */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              Coupon Code
            </h3>
            
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter coupon code"
                  value={renderProps.couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={renderProps.isApplyingCoupon}
                />
                <Button
                  onClick={() => applyCoupon(renderProps.couponCode)}
                  disabled={renderProps.isApplyingCoupon || !renderProps.couponCode.trim()}
                >
                  {renderProps.isApplyingCoupon ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              
              {renderProps.couponError && (
                <p className="text-sm text-destructive">{renderProps.couponError}</p>
              )}
              
              {renderProps.coupons.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Applied Coupons:</p>
                  {renderProps.coupons.map((coupon, index) => (
                    <div key={index} className="text-sm text-green-600">
                      {coupon.code} - {coupon.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currencySymbol}{safeToFixed(renderProps.cartSummary.subtotal)}</span>
              </div>
              
              {renderProps.cartSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{currencySymbol}{safeToFixed(renderProps.cartSummary.totalDiscount)}</span>
                </div>
              )}
              
              {renderProps.cartSummary.totalTax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{currencySymbol}{safeToFixed(renderProps.cartSummary.totalTax)}</span>
                </div>
              )}
              
              <hr className="my-2" />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{currencySymbol}{safeToFixed(renderProps.cartSummary.total)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6" 
              size="lg"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </Card>

          {/* Recommended Products */}
          <RecommendedProducts 
            storeId={store.id} 
            currentProducts={renderProps.cartItems.map(item => item.id)}
            title="You might also like"
          />
        </div>
      </div>

      <FlashMessage />
    </div>
  );

  // Apply final rendering hooks
  return hookSystem.apply('cart.renderComplete', cartComponent, {
    ...cartContext,
    items: renderProps.cartItems,
    totals: renderProps.cartSummary
  });
}