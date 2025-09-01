/**
 * Cart Page (Slotted Version) - Phoenix Migration
 * This replaces the monolithic Cart component with slot-based architecture
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPublicUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Coupon } from '@/api/entities';
import { Tax } from '@/api/entities';
import cartService from '@/services/cartService';
import couponService from '@/services/couponService';
import taxService from '@/services/taxService';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatDisplayPrice } from '@/utils/priceUtils';

// Import Phoenix Slot System
import { SlotRenderer } from '@/core/slot-system';

// Import enhanced customization system
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';
import { useCustomizations } from '@/hooks/useCustomizations.jsx';

// Utility functions
const getSessionId = () => {
  let sid = localStorage.getItem('cart_session_id');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sid);
  }
  return sid;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatPrice = (value, context = {}) => {
  const num = parseFloat(value);
  const basePrice = isNaN(num) ? 0 : num;
  return hookSystem.apply('pricing.format', basePrice, context);
};

const safeToFixed = (value, decimals = 2) => {
  const num = formatPrice(value);
  return num.toFixed(decimals);
};

const useDebouncedEffect = (effect, deps, delay) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...(deps || []), delay]);
};

export default function CartSlotted() {
  const navigate = useNavigate();
  const { store, settings, taxes, selectedCountry, loading: storeLoading } = useStore();
  
  // Initialize customization system for Cart component
  const {
    isInitialized: customizationsInitialized,
    isPreviewMode,
    getCustomStyles,
    getCustomProps
  } = useCustomizations({
    storeId: store?.id,
    componentName: 'Cart',
    selectors: ['cart-page', 'shopping-cart'],
    autoInit: true,
    context: {
      page: 'cart',
      hasItems: false // Will be updated below
    }
  });

  const [taxRules, setTaxRules] = useState([]);
  
  // Get currency symbol from settings with hook support
  const currencySymbol = hookSystem.apply('cart.getCurrencySymbol', settings?.currency_symbol || '$', {
    store,
    settings
  });
  
  // Enhanced cart context for hooks
  const cartContext = useMemo(() => ({
    store,
    settings,
    taxes,
    selectedCountry,
    currencySymbol,
    sessionId: getSessionId()
  }), [store, settings, taxes, selectedCountry, currencySymbol]);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [quantityUpdates, setQuantityUpdates] = useState({});

  useEffect(() => {
    if (!storeLoading && store?.id) {
      const timeoutId = setTimeout(() => {
        loadCartData();
        loadTaxRules();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [storeLoading, store?.id]);

  const loadTaxRules = async () => {
    try {
      if (store?.id) {
        const taxData = await Tax.filter({ store_id: store.id, is_active: true });
        setTaxRules(taxData || []);
      }
    } catch (error) {
      console.error('Error loading tax rules:', error);
      setTaxRules([]);
    }
  };

  const loadCartData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    try {
      const cartResult = await cartService.getCart();
      let cartItems = [];
      if (cartResult.success && cartResult.items) {
        cartItems = cartResult.items;
      }

      if (!cartItems || cartItems.length === 0) {
        setCartItems([]);
        if (appliedCoupon) {
          couponService.removeAppliedCoupon();
        }
        if (showLoader) setLoading(false);
        return;
      }

      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      
      const productPromises = productIds.map(id => 
        StorefrontProduct.filter({ id: id }).catch(error => {
          console.error(`Failed to fetch product ${id}:`, error);
          return null;
        })
      );
      const productArrays = await Promise.all(productPromises);
      const products = productArrays.filter(arr => arr && arr.length > 0).map(arr => arr[0]);
      
      const populatedCart = cartItems.map(item => {
        const productDetails = (products || []).find(p => p.id === item.product_id);
        return { 
          ...item, 
          product: productDetails,
          selected_options: item.selected_options || []
        };
      }).filter(item => item.product);
      
      setCartItems(populatedCart);
      setHasLoadedInitialData(true);
      
      if (appliedCoupon) {
        validateAppliedCoupon(appliedCoupon, populatedCart);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setFlashMessage({ type: 'error', message: "Could not load your cart. Please try refreshing." });
      setCartItems([]);
      setHasLoadedInitialData(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const updateQuantity = useCallback((itemId, newQuantity) => {
    const currentItem = cartItems.find(item => item.id === itemId);
    if (!currentItem) return;

    const validatedQuantity = Math.max(1, newQuantity);
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity: validatedQuantity } : item
      )
    );

    window.dispatchEvent(new CustomEvent('cartUpdated'));
    setQuantityUpdates(currentUpdates => ({
      ...currentUpdates,
      [itemId]: validatedQuantity,
    }));
  }, [cartItems]);

  const removeItem = useCallback(async (itemId) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (!itemToRemove || !store?.id || loading || !hasLoadedInitialData) return;

    try {
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const result = await cartService.updateCart(updatedItems, store.id);
      loadCartData(false);
      setFlashMessage({ type: 'success', message: "Item removed from cart." });
    } catch (error) {
      console.error("Error removing item:", error);
      setFlashMessage({ type: 'error', message: "Failed to remove item." });
    }
  }, [cartItems, store?.id, loading, hasLoadedInitialData]);

  // Coupon functionality
  useEffect(() => {
    const storedCoupon = couponService.getAppliedCoupon();
    if (storedCoupon) {
      setAppliedCoupon(storedCoupon);
    }

    const unsubscribe = couponService.addListener((coupon) => {
      setAppliedCoupon(coupon);
    });

    return unsubscribe;
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode || !store?.id) {
      setFlashMessage({ type: 'error', message: "Please enter a coupon code." });
      return;
    }
    
    try {
      const coupons = await Coupon.filter({ 
        code: couponCode, 
        is_active: true, 
        store_id: store.id 
      });
      
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        // Validation logic here (simplified for brevity)
        const result = couponService.setAppliedCoupon(coupon);
        if (result.success) {
          setAppliedCoupon(coupon);
          setFlashMessage({ type: 'success', message: `Coupon "${coupon.name}" applied!` });
          setCouponCode('');
        }
      } else {
        setFlashMessage({ type: 'error', message: "Invalid or expired coupon code." });
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setFlashMessage({ type: 'error', message: "Could not apply coupon. Please try again." });
    }
  };

  const handleRemoveCoupon = () => {
    const result = couponService.removeAppliedCoupon();
    if (result.success) {
      setAppliedCoupon(null);
      setCouponCode('');
      setFlashMessage({ type: 'success', message: "Coupon removed." });
    }
  };

  const handleCouponKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const validateAppliedCoupon = (coupon, cartItems) => {
    // Simplified validation (full version would be more comprehensive)
    if (!coupon || !cartItems || cartItems.length === 0) return;
    // Add validation logic here
  };

  // Calculation functions
  const calculateItemTotal = useCallback((item, product) => {
    if (!item || !product) return 0;

    let basePrice = formatPrice(item.price);
    if (basePrice <= 0) {
      basePrice = formatPrice(product.sale_price || product.price || 0);
    }
    
    let optionsPrice = 0;
    if (item.selected_options && Array.isArray(item.selected_options)) {
      optionsPrice = item.selected_options.reduce((sum, option) => sum + formatPrice(option.price), 0);
    }
    
    return (basePrice + optionsPrice) * (formatPrice(item.quantity) || 1);
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + calculateItemTotal(item, item.product);
    }, 0);
  }, [cartItems, calculateItemTotal]);

  const { subtotal, discount, tax, total } = useMemo(() => {
    const calculatedSubtotal = calculateSubtotal();
    let disc = 0;
    
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'fixed') {
        disc = formatPrice(appliedCoupon.discount_value);
      } else if (appliedCoupon.discount_type === 'percentage') {
        disc = calculatedSubtotal * (formatPrice(appliedCoupon.discount_value) / 100);
      }
      if (disc > calculatedSubtotal) {
        disc = calculatedSubtotal;
      }
    }

    const subAfterDiscount = calculatedSubtotal - disc;
    
    const taxAmount = (() => {
      if (!store || !taxRules.length || !cartItems.length) {
        return 0;
      }

      const shippingAddress = { country: selectedCountry || 'US' };
      const cartProducts = {};
      cartItems.forEach(item => {
        if (item.product) {
          cartProducts[item.product_id] = item.product;
        }
      });

      const taxResult = taxService.calculateTax(
        cartItems,
        cartProducts,
        store,
        taxRules,
        shippingAddress,
        calculatedSubtotal,
        disc
      );

      return taxResult.taxAmount || 0;
    })();
    
    const totalAmount = subAfterDiscount + taxAmount;
    return { subtotal: calculatedSubtotal, discount: disc, tax: taxAmount, total: totalAmount };
  }, [cartItems, appliedCoupon, store, taxRules, selectedCountry, calculateSubtotal]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) return;
    const checkoutUrl = createPublicUrl(store.slug, 'CHECKOUT');
    navigate(checkoutUrl);
  }, [cartItems, store?.slug, navigate]);

  // Debounced quantity updates
  useDebouncedEffect(() => {
    const updateCartQuantities = async () => {
      if (Object.keys(quantityUpdates).length === 0) return;

      try {
        if (!store?.id) return;

        const updatedItems = cartItems.map(item => {
          const newQuantity = quantityUpdates[item.id];
          return newQuantity ? { ...item, quantity: newQuantity } : item;
        });

        const result = await cartService.updateCart(updatedItems, store.id);
        setQuantityUpdates({});
        await delay(500);
        loadCartData(false);
        
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } catch (error) {
        console.error("Error updating cart quantities:", error);
        setFlashMessage({ type: 'error', message: "Failed to update cart quantities." });
      }
    };
    
    updateCartQuantities();
  }, [quantityUpdates], 1500);

  // Loading state
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Common props for all slots
  const commonSlotProps = {
    store,
    settings,
    taxes,
    selectedCountry,
    currencySymbol,
    cartItems,
    subtotal,
    discount,
    tax,
    total,
    safeToFixed,
    appliedCoupon,
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleCouponKeyPress,
    handleCheckout,
    updateQuantity,
    removeItem,
    calculateItemTotal,
    formatPrice,
    ...getCustomProps()
  };

  return (
    <>
      <SeoHeadManager
        title="Your Cart"
        description="Review your shopping cart items before proceeding to checkout."
        keywords="cart, shopping cart, checkout, e-commerce, online store"
      />
      
      {/* Cart Page Container */}
      <SlotRenderer 
        slotId="cart.page.container"
        {...commonSlotProps}
        style={getCustomStyles({ backgroundColor: '#f9fafb' })}
      >
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        
        {/* Cart Page Header */}
        <SlotRenderer 
          slotId="cart.page.header"
          {...commonSlotProps}
        />
        
        <CmsBlockRenderer position="cart_above_items" />
        
        {cartItems.length === 0 ? (
          /* Empty Cart Display */
          <SlotRenderer 
            slotId="cart.empty.display"
            {...commonSlotProps}
          />
        ) : (
          /* Cart Grid Layout */
          <SlotRenderer 
            slotId="cart.layout.grid"
            {...commonSlotProps}
          >
            {/* Cart Items Container */}
            <SlotRenderer 
              slotId="cart.items.container"
              {...commonSlotProps}
            >
              {cartItems.map(item => (
                <SlotRenderer
                  key={item.id}
                  slotId="cart.item.single"
                  {...commonSlotProps}
                  item={item}
                  product={item.product}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </SlotRenderer>
            
            <CmsBlockRenderer position="cart_below_items" />
            
            {/* Cart Sidebar */}
            <SlotRenderer 
              slotId="cart.sidebar.container"
              {...commonSlotProps}
            >
              {/* Coupon Section */}
              <SlotRenderer 
                slotId="cart.coupon.section"
                {...commonSlotProps}
                onCouponCodeChange={setCouponCode}
                onKeyPress={handleCouponKeyPress}
              />
              
              {/* Order Summary */}
              <SlotRenderer 
                slotId="cart.summary.order"
                {...commonSlotProps}
              >
                <CmsBlockRenderer position="cart_above_total" />
              </SlotRenderer>
              
              <CmsBlockRenderer position="cart_below_total" />
              
              {/* Checkout Button */}
              <SlotRenderer 
                slotId="cart.checkout.button"
                {...commonSlotProps}
                onCheckout={handleCheckout}
              />
            </SlotRenderer>
          </SlotRenderer>
        )}
        
        <div className="mt-12">
          <RecommendedProducts />
        </div>
      </SlotRenderer>
    </>
  );
}