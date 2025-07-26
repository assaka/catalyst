
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useStore } from '@/components/storefront/StoreProvider';
import { Product } from '@/api/entities';
import { Coupon } from '@/api/entities';
import { User } from '@/api/entities';
import cartService from '@/services/cartService';
import couponService from '@/services/couponService';
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

// Safe number formatting helper
const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const safeToFixed = (value, decimals = 2) => {
    const num = formatPrice(value);
    return num.toFixed(decimals);
};

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
    
    // Get currency symbol from settings
    const currencySymbol = settings?.currency_symbol || '$';
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [flashMessage, setFlashMessage] = useState(null);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    
    const [quantityUpdates, setQuantityUpdates] = useState({});

    useEffect(() => {
        console.log('🚨 CART DEBUG: useEffect triggered, storeLoading:', storeLoading, 'store?.id:', store?.id);
        // Wait for store data to load before loading cart
        if (!storeLoading && store?.id) {
            console.log('🚨 CART DEBUG: Starting cart load with 1s delay...');
            const timeoutId = setTimeout(() => {
                loadCartData();
            }, 1000); // Reduced delay
            
            return () => clearTimeout(timeoutId);
        }
    }, [storeLoading, store?.id]);

    // Load applied coupon from service on mount
    useEffect(() => {
        const storedCoupon = couponService.getAppliedCoupon();
        if (storedCoupon) {
            setAppliedCoupon(storedCoupon);
        }

        // Listen for coupon changes from other components
        const unsubscribe = couponService.addListener((coupon) => {
            setAppliedCoupon(coupon);
        });

        return unsubscribe;
    }, []);

    // Listen for cart updates from other components (like MiniCart)
    useEffect(() => {
        const handleCartUpdate = (event) => {
            
            // Only reload if we're not currently processing our own updates
            if (!loading && hasLoadedInitialData) {
                loadCartData(false); // Reload without showing loader
            } else {
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [loading, hasLoadedInitialData]);

    useDebouncedEffect(() => {
        const updateCartQuantities = async () => {
            if (Object.keys(quantityUpdates).length === 0) return;

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
                const result = await cartService.updateCart(updatedItems, store.id);
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
    }, [quantityUpdates], 1500);

    const loadCartData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            // Use simplified cart service (session-based approach)
            const cartResult = await cartService.getCart();
            console.log('🔍 DEBUG Cart: Cart service result:', cartResult);
            
            let cartItems = [];
            if (cartResult.success && cartResult.items) {
                cartItems = cartResult.items;
                console.log('🔍 DEBUG Cart: Cart items found:', cartItems.length);
            }

            
            if (!cartItems || cartItems.length === 0) {
                setCartItems([]);
                // Clear applied coupon when cart is empty
                if (appliedCoupon) {
                    couponService.removeAppliedCoupon();
                }
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
            
            // Validate applied coupon when cart contents change
            if (appliedCoupon) {
                validateAppliedCoupon(appliedCoupon, populatedCart);
            }
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
        
        // Update local state immediately for instant UI response
        setCartItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );

        // Dispatch immediate update for other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));

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

            // Don't remove if we're still loading initial data
            if (loading || !hasLoadedInitialData) {
                console.log('🛒 Cart: Skipping remove - still loading initial data');
                return;
            }

            // Update local state immediately for instant UI response
            const updatedItems = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedItems);
            
            // Dispatch immediate update for other components
            window.dispatchEvent(new CustomEvent('cartUpdated'));

            // Use simplified cart service
            const result = await cartService.updateCart(updatedItems, store.id);
            
            // Reload data in background without showing loader
            loadCartData(false);
            setFlashMessage({ type: 'success', message: "Item removed from cart." });
        } catch (error) {
            console.error("Error removing item:", error);
            setFlashMessage({ type: 'error', message: "Failed to remove item." });
        }
    };

    // Validate that applied coupon is still valid for current cart contents
    const validateAppliedCoupon = (coupon, cartItems) => {
        if (!coupon || !cartItems || cartItems.length === 0) return;

        try {
            // Check if coupon applies to products in cart
            if (coupon.applicable_products && coupon.applicable_products.length > 0) {
                const hasApplicableProduct = cartItems.some(item => 
                    coupon.applicable_products.includes(item.product_id)
                );
                if (!hasApplicableProduct) {
                    couponService.removeAppliedCoupon();
                    setFlashMessage({ type: 'warning', message: `Coupon "${coupon.name}" was removed because it doesn't apply to current cart items.` });
                    return;
                }
            }

            // Check if coupon applies to categories in cart
            if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
                const hasApplicableCategory = cartItems.some(item => 
                    item.product?.category_ids?.some(catId => 
                        coupon.applicable_categories.includes(catId)
                    )
                );
                if (!hasApplicableCategory) {
                    couponService.removeAppliedCoupon();
                    setFlashMessage({ type: 'warning', message: `Coupon "${coupon.name}" was removed because it doesn't apply to current cart items.` });
                    return;
                }
            }

            // Check minimum purchase amount
            const subtotal = calculateSubtotal();
            if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
                couponService.removeAppliedCoupon();
                setFlashMessage({ 
                    type: 'warning', 
                    message: `Coupon "${coupon.name}" was removed because the minimum order amount of ${currencySymbol}${safeToFixed(coupon.min_purchase_amount)} is no longer met.` 
                });
                return;
            }

        } catch (error) {
            console.error('Error validating applied coupon:', error);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) {
            setFlashMessage({ type: 'error', message: "Please enter a coupon code." });
            return;
        }
        
        if (!store?.id) {
            setFlashMessage({ type: 'error', message: "Store information not available." });
            return;
        }
        
        try {
            
            const coupons = await retryApiCall(() => Coupon.filter({ 
                code: couponCode, 
                is_active: true, 
                store_id: store.id 
            }));
            
            
            if (coupons && coupons.length > 0) {
                const coupon = coupons[0];
                
                // Check if coupon is still valid (not expired)
                if (coupon.end_date) {
                    const expiryDate = new Date(coupon.end_date);
                    const now = new Date();
                    if (expiryDate < now) {
                        setFlashMessage({ type: 'error', message: "This coupon has expired." });
                        return;
                    }
                }
                
                // Check if coupon has started
                if (coupon.start_date) {
                    const startDate = new Date(coupon.start_date);
                    const now = new Date();
                    if (startDate > now) {
                        setFlashMessage({ type: 'error', message: "This coupon is not yet active." });
                        return;
                    }
                }
                
                // Check usage limit
                if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                    setFlashMessage({ type: 'error', message: "This coupon has reached its usage limit." });
                    return;
                }
                
                // Check minimum purchase amount
                if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
                    setFlashMessage({ 
                        type: 'error', 
                        message: `Minimum order amount of ${currencySymbol}${safeToFixed(coupon.min_purchase_amount)} required for this coupon.` 
                    });
                    return;
                }
                
                // Check if coupon applies to products in cart
                if (coupon.applicable_products && coupon.applicable_products.length > 0) {
                    const hasApplicableProduct = cartItems.some(item => 
                        coupon.applicable_products.includes(item.product_id)
                    );
                    if (!hasApplicableProduct) {
                        setFlashMessage({ 
                            type: 'error', 
                            message: "This coupon doesn't apply to any products in your cart." 
                        });
                        return;
                    }
                }
                
                // Check if coupon applies to categories in cart
                if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
                    const hasApplicableCategory = cartItems.some(item => 
                        item.product?.category_ids?.some(catId => 
                            coupon.applicable_categories.includes(catId)
                        )
                    );
                    if (!hasApplicableCategory) {
                        setFlashMessage({ 
                            type: 'error', 
                            message: "This coupon doesn't apply to any products in your cart." 
                        });
                        return;
                    }
                }
                
                // Use coupon service to persist and sync coupon
                const result = couponService.setAppliedCoupon(coupon);
                if (result.success) {
                    setAppliedCoupon(coupon);
                    setFlashMessage({ type: 'success', message: `Coupon "${coupon.name}" applied!` });
                    setCouponCode(''); // Clear the input after successful application
                } else {
                    setFlashMessage({ type: 'error', message: 'Failed to apply coupon. Please try again.' });
                }
            } else {
                setAppliedCoupon(null);
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

        let basePrice = formatPrice(item.price); // Try to use price stored in the cart item itself
        if (basePrice <= 0) { // If item.price is not a valid positive number
            basePrice = formatPrice(product.sale_price || product.price || 0); // Fallback to product's current sale_price or price
        }
        
        let optionsPrice = 0;
        if (item.selected_options && Array.isArray(item.selected_options)) {
            optionsPrice = item.selected_options.reduce((sum, option) => sum + formatPrice(option.price), 0);
        }
        
        return (basePrice + optionsPrice) * (formatPrice(item.quantity) || 1);
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
                disc = formatPrice(appliedCoupon.discount_value);
            } else if (appliedCoupon.discount_type === 'percentage') {
                disc = calculatedSubtotal * (formatPrice(appliedCoupon.discount_value) / 100);
                
                // Apply max discount limit if specified
                if (appliedCoupon.max_discount_amount && disc > formatPrice(appliedCoupon.max_discount_amount)) {
                    disc = formatPrice(appliedCoupon.max_discount_amount);
                }
            } else if (appliedCoupon.discount_type === 'free_shipping') {
                // For free shipping, the discount is 0 here but would be applied to shipping cost
                disc = 0;
            }
            
            // Ensure discount doesn't exceed subtotal
            if (disc > calculatedSubtotal) {
                disc = calculatedSubtotal;
            }
        }

        const subAfterDiscount = calculatedSubtotal - disc;
        
        const taxAmount = cartItems.reduce((acc, item) => {
            if (!item || !item.product) return acc;
            const taxRate = getProductTaxRate(item.product);

            let basePrice = formatPrice(item.price);
            if (basePrice <= 0) {
                basePrice = formatPrice(item.product.sale_price || item.product.price);
            }
            let optionsPrice = 0;
            if (item.selected_options && Array.isArray(item.selected_options)) {
                optionsPrice = item.selected_options.reduce((sum, opt) => sum + formatPrice(opt.price), 0);
            }
            
            const taxableAmount = (basePrice + optionsPrice) * (formatPrice(item.quantity) || 1);
            
            return acc + (taxableAmount * taxRate);
        }, 0);
        
        const totalAmount = subAfterDiscount + taxAmount;

        return { subtotal: calculatedSubtotal, discount: disc, tax: taxAmount, total: totalAmount };
    }, [cartItems, appliedCoupon, getProductTaxRate, calculateSubtotal]);


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
                                <CardContent className="px-4 divide-y divide-gray-200">
                                    {cartItems.map(item => {
                                        const product = item.product;
                                        if (!product) return null;

                                        // Logic for basePrice for display, as per outline's intent
                                        let basePriceForDisplay;
                                        const itemPriceAsNumber = formatPrice(item.price);

                                        if (itemPriceAsNumber > 0) {
                                            // Use the stored price from cart if it's a valid positive number
                                            basePriceForDisplay = itemPriceAsNumber;
                                        } else {
                                            // Fallback to product's current pricing if cart item price is invalid/missing/zero
                                            let productCurrentPrice = formatPrice(product.sale_price || product.price);
                                            
                                            // Apply outline's compare_price logic: if compare_price is lower than current product price, use it
                                            const comparePrice = formatPrice(product.compare_price);
                                            if (comparePrice > 0 && comparePrice < productCurrentPrice) {
                                                basePriceForDisplay = comparePrice;
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
                                                    <p className="text-gray-600">{currencySymbol}{safeToFixed(basePriceForDisplay)} each</p>
                                                    
                                                    {item.selected_options && item.selected_options.length > 0 && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {item.selected_options.map((option, idx) => (
                                                                <div key={idx}>+ {option.name} (+{currencySymbol}{safeToFixed(option.price)})</div>
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
                                                    <p className="text-xl font-bold">{currencySymbol}{safeToFixed(itemTotal)}</p>
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
                                    {!appliedCoupon ? (
                                        <div className="flex space-x-2">
                                            <Input 
                                                placeholder="Enter coupon code" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                onKeyPress={handleCouponKeyPress}
                                            />
                                            <Button 
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode.trim()}
                                            >
                                                <Tag className="w-4 h-4 mr-2" /> Apply
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-green-800">Applied: {appliedCoupon.name}</p>
                                                <p className="text-xs text-green-600">
                                                    {appliedCoupon.discount_type === 'fixed' 
                                                        ? `${currencySymbol}${safeToFixed(appliedCoupon.discount_value)} off`
                                                        : `${safeToFixed(appliedCoupon.discount_value)}% off`
                                                    }
                                                </p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={handleRemoveCoupon}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{safeToFixed(subtotal)}</span></div>
                                    {discount > 0 && (
                                        <div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span></div>
                                    )}
                                    <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{safeToFixed(tax)}</span></div>
                                    <div className="flex justify-between text-lg font-semibold border-t pt-4">
                                        <span>Total</span>
                                        <span>{currencySymbol}{safeToFixed(total)}</span>
                                    </div>
                                    <div className="border-t mt-6 pt-6">
                                        <Link to={createPageUrl('Checkout')}>
                                            <Button 
                                                size="lg" 
                                                className="w-full"
                                                style={{
                                                    backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
                                                    color: '#FFFFFF',
                                                }}
                                            >
                                                Proceed to Checkout
                                            </Button>
                                        </Link>
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
