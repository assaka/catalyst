
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useStore } from '@/components/storefront/StoreProvider';
import { Product } from '@/api/entities';
import { Coupon } from '@/api/entities';
import { User } from '@/api/entities';
import cartService from '@/services/cartService';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';

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

// Global request queue to manage API calls
let globalRequestQueue = Promise.resolve();

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 3000) => {
  return new Promise((resolve, reject) => {
    globalRequestQueue = globalRequestQueue.then(async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await delay(1000 + Math.random() * 1000); // Random delay between requests
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
            return resolve([]); // Return empty array for list operations
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
    // Use StoreProvider data instead of making separate API calls
    const { store, settings, taxes, selectedCountry, loading: storeLoading } = useStore();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [flashMessage, setFlashMessage] = useState(null);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    
    const [quantityUpdates, setQuantityUpdates] = useState({});

    useEffect(() => {
        // Wait for store data to load before loading cart
        if (!storeLoading && store?.id) {
            const timeoutId = setTimeout(() => {
                loadCartData();
            }, 1000); // Reduced delay
            
            return () => clearTimeout(timeoutId);
        }
    }, [storeLoading, store?.id]);

    useDebouncedEffect(() => {
        const updateCartQuantities = async () => {
            if (Object.keys(quantityUpdates).length === 0) return;
            
            // Don't update if we're still loading initial data or haven't loaded yet
            if (loading || !hasLoadedInitialData) return;

            try {
                if (!store?.id) {
                    console.error('🛒 Cart: No store context available for update');
                    setFlashMessage({ type: 'error', message: "Store context not available." });
                    return;
                }

                // Create updated items array with new quantities
                const updatedItems = cartItems.map(item => {
                    const newQuantity = quantityUpdates[item.id];
                    return newQuantity ? { ...item, quantity: newQuantity } : item;
                });

                // Use simplified cart service
                console.log('🛒 Cart: Updating cart with items:', updatedItems);
                const result = await cartService.updateCart(updatedItems, store.id);
                console.log('🛒 Cart: Update result:', result);
                setQuantityUpdates({});
                await delay(500);
                loadCartData(false);
                
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            } catch (error) {
                console.error("Error updating cart quantities:", error);
                setFlashMessage({ type: 'error', message: "Failed to update cart quantities." });
            }
        };
        
        updateCartQuantities();
    }, [quantityUpdates, loading, hasLoadedInitialData], 1500);

    const loadCartData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            // Use simplified cart service (session-based approach)
            const cartResult = await cartService.getCart();
            console.log('🛒 Cart: Cart service result:', cartResult);
            
            let cartItems = [];
            if (cartResult.success && cartResult.items) {
                cartItems = cartResult.items;
            }

            console.log('🛒 Cart: Extracted cart items:', cartItems);
            
            if (!cartItems || cartItems.length === 0) {
                setCartItems([]);
                if (showLoader) setLoading(false);
                return;
            }

            const productIds = [...new Set(cartItems.map(item => item.product_id))];
            const products = await retryApiCall(() => Product.filter({ id: { $in: productIds } }));
            
            const populatedCart = cartItems.map(item => {
                const productDetails = (products || []).find(p => p.id === item.product_id);
                return { 
                    ...item, 
                    product: productDetails,
                    selected_options: item.selected_options || [] // Ensure selected_options is always an array
                };
            }).filter(item => item.product); // Ensure product exists
            
            setCartItems(populatedCart);
            setHasLoadedInitialData(true);
        } catch (error) {
            console.error("Error loading cart:", error);
            setFlashMessage({ type: 'error', message: "Could not load your cart. Please try refreshing." });
            setCartItems([]); // Set to empty array on error
            setHasLoadedInitialData(true);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    // Renamed from handleQuantityChange to updateQuantity
    const updateQuantity = (itemId, newQuantity) => {
        const quantity = Math.max(1, newQuantity);
        
        setCartItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );

        setQuantityUpdates(currentUpdates => ({
            ...currentUpdates,
            [itemId]: quantity,
        }));
    };

    // Renamed from handleRemoveItem to removeItem
    const removeItem = async (itemId) => {
        try {
            if (!store?.id) {
                console.error('🛒 Cart: No store context available for remove');
                setFlashMessage({ type: 'error', message: "Store context not available." });
                return;
            }

            // Don't update if we don't have valid cart items loaded
            if (!cartItems || cartItems.length === 0) {
                console.error('🛒 Cart: No cart items to remove from');
                return;
            }

            // Remove item from local cart items array
            const updatedItems = cartItems.filter(item => item.id !== itemId);

            // Use simplified cart service
            console.log('🛒 Cart: Removing item from cart, updated items:', updatedItems);
            const result = await cartService.updateCart(updatedItems, store.id);
            console.log('🛒 Cart: Remove result:', result);
            await delay(500);
            loadCartData(false);
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            setFlashMessage({ type: 'success', message: "Item removed from cart." });
        } catch (error) {
            console.error("Error removing item:", error);
            setFlashMessage({ type: 'error', message: "Failed to remove item." });
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const coupons = await retryApiCall(() => Coupon.filter({ code: couponCode, is_active: true }));
            if (coupons && coupons.length > 0) {
                setAppliedCoupon(coupons[0]);
                setFlashMessage({ type: 'success', message: `Coupon "${coupons[0].name}" applied!` });
            } else {
                setAppliedCoupon(null);
                setFlashMessage({ type: 'error', message: "Invalid or expired coupon code." });
            }
        } catch (error) {
            console.error("Error applying coupon:", error);
            setFlashMessage({ type: 'error', message: "Could not apply coupon." });
        }
    };

    // Use data from StoreProvider instead of making API calls
    const getProductTaxRate = useCallback((product) => {
        if (!product || !product.tax_id || !taxes || taxes.length === 0) return 0;
        const taxRule = taxes.find(t => t.id === product.tax_id);
        if (!taxRule) return 0;
        const countryRate = taxRule.country_rates?.find(r => r.country === selectedCountry);
        return countryRate ? countryRate.rate / 100 : 0;
    }, [taxes, selectedCountry]);

    const calculateItemTotal = useCallback((item, product) => {
        if (!item || !product) return 0;

        let basePrice = parseFloat(item.price); // Try to use price stored in the cart item itself
        if (isNaN(basePrice) || basePrice <= 0) { // If item.price is not a valid positive number
            basePrice = parseFloat(product.sale_price || product.price || 0); // Fallback to product's current sale_price or price
        }
        
        let optionsPrice = 0;
        if (item.selected_options && Array.isArray(item.selected_options)) {
            optionsPrice = item.selected_options.reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);
        }
        
        return (basePrice + optionsPrice) * (item.quantity || 1);
    }, []);

    const calculateSubtotal = useCallback(() => {
        return cartItems.reduce((total, item) => {
            // item.product is already available from loadCartData
            return total + calculateItemTotal(item, item.product);
        }, 0);
    }, [cartItems, calculateItemTotal]);

    const { subtotal, discount, tax, total } = useMemo(() => {
        const calculatedSubtotal = calculateSubtotal();

        let disc = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'fixed') {
                disc = appliedCoupon.discount_value || 0;
            } else if (appliedCoupon.discount_type === 'percentage') {
                disc = calculatedSubtotal * ((appliedCoupon.discount_value || 0) / 100);
            }
        }

        const subAfterDiscount = calculatedSubtotal - disc;
        
        const taxAmount = cartItems.reduce((acc, item) => {
            if (!item || !item.product) return acc;
            const taxRate = getProductTaxRate(item.product);

            let basePrice = parseFloat(item.price);
            if (isNaN(basePrice) || basePrice <= 0) {
                basePrice = parseFloat(item.product.sale_price || item.product.price || 0);
            }
            let optionsPrice = 0;
            if (item.selected_options && Array.isArray(item.selected_options)) {
                optionsPrice = item.selected_options.reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0);
            }
            
            const taxableAmount = (basePrice + optionsPrice) * (item.quantity || 1);
            
            return acc + (taxableAmount * taxRate);
        }, 0);
        
        const totalAmount = subAfterDiscount + taxAmount;

        return { subtotal: calculatedSubtotal, discount: disc, tax: taxAmount, total: totalAmount };
    }, [cartItems, appliedCoupon, getProductTaxRate, calculateSubtotal]);

    const checkoutBtnSettings = settings?.checkout_button;

    // Wait for both store data and cart data to load
    if (loading || storeLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50">
            <SeoHeadManager
                title="Your Cart"
                description="Review your shopping cart items before proceeding to checkout."
                keywords="cart, shopping cart, checkout, e-commerce, online store"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
                {cartItems.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                            <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                            <Link to={createPageUrl('Storefront')}>
                                <Button>Continue Shopping</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-0 divide-y divide-gray-200">
                                    {cartItems.map(item => {
                                        const product = item.product;
                                        if (!product) return null;

                                        // Logic for basePrice for display, as per outline's intent
                                        let basePriceForDisplay;
                                        const itemPriceAsNumber = parseFloat(item.price);

                                        if (!isNaN(itemPriceAsNumber) && itemPriceAsNumber > 0) {
                                            // Use the stored price from cart if it's a valid positive number
                                            basePriceForDisplay = itemPriceAsNumber;
                                        } else {
                                            // Fallback to product's current pricing if cart item price is invalid/missing/zero
                                            let productCurrentPrice = parseFloat(product.sale_price || product.price || 0);
                                            
                                            // Apply outline's compare_price logic: if compare_price is lower than current product price, use it
                                            if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) < productCurrentPrice) {
                                                basePriceForDisplay = parseFloat(product.compare_price);
                                            } else {
                                                basePriceForDisplay = productCurrentPrice;
                                            }
                                        }

                                        const itemTotal = calculateItemTotal(item, product);

                                        return (
                                            <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
                                                <img 
                                                    src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'} 
                                                    alt={product.name}
                                                    className="w-20 h-20 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold">{product.name}</h3>
                                                    <p className="text-gray-600">${basePriceForDisplay.toFixed(2)} each</p>
                                                    
                                                    {item.selected_options && item.selected_options.length > 0 && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {item.selected_options.map((option, idx) => (
                                                                <div key={idx}>+ {option.name} (+${parseFloat(option.price || 0).toFixed(2)})</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center space-x-3 mt-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </Button>
                                                        <span className="text-lg font-semibold">{item.quantity || 1}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => removeItem(item.id)}
                                                            className="ml-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold">${itemTotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                            <Card>
                                <CardHeader><CardTitle>Apply Coupon</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex space-x-2">
                                        <Input 
                                            placeholder="Enter coupon code" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                        />
                                        <Button onClick={handleApplyCoupon}><Tag className="w-4 h-4 mr-2" /> Apply</Button>
                                    </div>
                                    {appliedCoupon && (
                                        <p className="text-sm text-green-600 mt-2">Applied: {appliedCoupon.name}</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                    {discount > 0 && (
                                        <div className="flex justify-between"><span>Discount</span><span className="text-green-600">-${discount.toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-lg font-semibold border-t pt-4">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t mt-6 pt-6">
                                        <Link to={createPageUrl('Checkout')}>
                                            <Button 
                                                size="lg" 
                                                className="w-full"
                                                style={{
                                                    backgroundColor: checkoutBtnSettings?.background_color || '#059669',
                                                    color: checkoutBtnSettings?.text_color || '#FFFFFF',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = checkoutBtnSettings?.hover_background_color || '#047857';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = checkoutBtnSettings?.background_color || '#059669';
                                                }}
                                            >
                                                {checkoutBtnSettings?.text || 'Proceed to Checkout'}
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
                <div className="mt-12">
                  <CmsBlockRenderer position="after_content" page="storefront_cart" />
                </div>
                <div className="mt-12">
                  <RecommendedProducts />
                </div>
            </div>
        </div>
    );
}
