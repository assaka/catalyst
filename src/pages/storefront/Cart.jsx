
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import customizationEngine from '@/core/CustomizationEngine.js';
import { useCustomizations } from '@/hooks/useCustomizations.jsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { getPageConfig } from '@/components/editor/slot/configs/index';

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
    const [searchParams] = useSearchParams();
    
    // Check if we're in editor mode (for action bars on custom slots)
    const isEditorMode = searchParams.get('mode') === 'editor';
    
    // Use StoreProvider data instead of making separate API calls
    const { store, settings, taxes, selectedCountry, loading: storeLoading } = useStore();
    
    // State for cart layout configuration
    const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
    
    // Load cart layout configuration directly
    useEffect(() => {
        console.log('🔄 loadCartLayoutConfig useEffect triggered, store:', store);
        const loadCartLayoutConfig = async () => {
            if (!store?.id) {
                console.log('❌ No store.id found, skipping slot config loading');
                return;
            }
            console.log('✅ Store ID found, loading slot configuration for store:', store.id);
            
            try {
                // Load configuration using public API endpoint directly (no auth required)
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
                const endpoint = `${apiBaseUrl}/api/public/slot-configurations?store_id=${store.id}`;
                
                console.log('📡 Loading from public endpoint:', endpoint);
                console.log('📡 API Base URL:', apiBaseUrl);
                
                const response = await fetch(endpoint);
                console.log('📡 Response status:', response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('📡 Public API response:', data);
                    
                    if (data.success && data.data?.length > 0) {
                        console.log('📡 Found configurations, filtering for cart...');
                        // Find Cart configuration
                        const cartConfig = data.data.find(config => {
                            const conf = config.configuration || {};
                            console.log('📡 Checking config:', conf.page_name, conf.slot_type);
                            return (conf.page_name === 'Cart' && conf.slot_type === 'cart_layout') ||
                                   (conf.page_type === 'cart');
                        });
                        
                        if (cartConfig) {
                            setCartLayoutConfig(cartConfig.configuration);
                            console.log('✅ Loaded cart layout configuration from public API:', cartConfig.configuration);
                            console.log('🔧 CustomSlots in loaded config:', cartConfig.configuration?.customSlots);
                            console.log('📐 MicroSlotOrders in loaded config:', cartConfig.configuration?.microSlotOrders);
                        } else {
                            console.warn('⚠️ No cart configuration found in response');
                        }
                    } else {
                        console.warn('⚠️ No configurations found or API unsuccessful:', data);
                    }
                } else {
                    console.warn('⚠️ Public slot config API returned:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.warn('⚠️ Error response body:', errorText);
                }
            } catch (error) {
                console.warn('⚠️ Could not load slot configuration from public API:', error);
            }
        };
        
        loadCartLayoutConfig();
        
        // Listen for configuration updates from editor
        const handleStorageChange = (e) => {
            if (e.key === 'slot_config_updated' && e.newValue) {
                console.log('🔔 Configuration update notification received');
                const updateData = JSON.parse(e.newValue);
                if (updateData.storeId === store?.id) {
                    console.log('✅ Store matches, reloading configuration');
                    loadCartLayoutConfig();
                    // Clear the notification
                    localStorage.removeItem('slot_config_updated');
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [store?.id]);
    
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
        // Wait for store data to load before loading cart
        if (!storeLoading && store?.id) {
            const timeoutId = setTimeout(() => {
                loadCartData();
                loadTaxRules();
            }, 1000); // Reduced delay
            
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
            // Apply before load hooks
            const shouldLoad = hookSystem.apply('cart.beforeLoadItems', true, cartContext);
            if (!shouldLoad) {
                setLoading(false);
                return;
            }

            // Emit loading event
            eventSystem.emit('cart.loadingStarted', cartContext);

            // Use simplified cart service (session-based approach)
            const cartResult = await cartService.getCart();
            
            let cartItems = [];
            if (cartResult.success && cartResult.items) {
                cartItems = cartResult.items;
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
            
            // Fetch products individually to avoid object parameter issues
            const products = await retryApiCall(async () => {
                const productPromises = productIds.map(id => 
                    StorefrontProduct.filter({ id: id }).catch(error => {
                        console.error(`Failed to fetch product ${id}:`, error);
                        return null;
                    })
                );
                const productArrays = await Promise.all(productPromises);
                return productArrays.filter(arr => arr && arr.length > 0).map(arr => arr[0]);
            });
            
            const populatedCart = cartItems.map(item => {
                const productDetails = (products || []).find(p => p.id === item.product_id);
                return { 
                    ...item, 
                    product: productDetails,
                    selected_options: item.selected_options || [] // Ensure selected_options is always an array
                };
            }).filter(item => item.product); // Ensure product exists
            
            // Apply item processing hooks
            const processedItems = hookSystem.apply('cart.processLoadedItems', populatedCart, cartContext);
            
            setCartItems(processedItems);
            setHasLoadedInitialData(true);
            
            // Apply after load hooks
            hookSystem.do('cart.afterLoadItems', {
                items: processedItems,
                ...cartContext
            });

            // Emit loaded event
            eventSystem.emit('cart.itemsLoaded', {
                items: processedItems,
                ...cartContext
            });
            
            // Validate applied coupon when cart contents change
            if (appliedCoupon) {
                validateAppliedCoupon(appliedCoupon, processedItems);
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

    // Enhanced updateQuantity with hooks
    const updateQuantity = useCallback((itemId, newQuantity) => {
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
        const validatedQuantity = hookSystem.apply('cart.validateQuantity', Math.max(1, newQuantity), {
            item: currentItem,
            maxStock: currentItem.product?.stock_quantity,
            ...cartContext
        });

        // Update local state immediately for instant UI response
        setCartItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, quantity: validatedQuantity } : item
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

        // Dispatch immediate update for other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        setQuantityUpdates(currentUpdates => ({
            ...currentUpdates,
            [itemId]: validatedQuantity,
        }));
    }, [cartItems, cartContext]);

    // Enhanced removeItem with hooks
    const removeItem = useCallback(async (itemId) => {
        const itemToRemove = cartItems.find(item => item.id === itemId);
        if (!itemToRemove) return;

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
                return;
            }

            // Apply before remove hooks
            const shouldRemove = hookSystem.apply('cart.beforeRemoveItem', true, {
                itemId,
                item: itemToRemove,
                ...cartContext
            });

            if (!shouldRemove) return;

            // Update local state immediately for instant UI response
            const updatedItems = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedItems);

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
            
            eventSystem.emit('cart.removeError', {
                error: error.message,
                itemId,
                ...cartContext
            });
        }
    }, [cartItems, cartContext, store?.id, loading, hasLoadedInitialData]);

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
        
        // Use new tax service for calculation
        const taxAmount = (() => {
            if (!store || !taxRules.length || !cartItems.length) {
                return 0;
            }

            // Create a shipping address object from selected country
            const shippingAddress = { country: selectedCountry || 'US' };
            
            // Create a simple product map for taxService
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

    // Enhanced checkout navigation with hooks
    const handleCheckout = useCallback(() => {
        // Apply before checkout hooks
        const checkoutData = hookSystem.apply('cart.beforeCheckout', {
            items: cartItems,
            subtotal,
            discount,
            tax,
            total,
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
        const checkoutUrl = hookSystem.apply('cart.getCheckoutUrl', createPublicUrl(store.slug, 'CHECKOUT'), {
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
    }, [cartItems, subtotal, discount, tax, total, cartContext, store?.slug, navigate]);

    // Emit cart viewed event
    useEffect(() => {
        if (!loading && cartItems.length >= 0) {
            eventSystem.emit('cart.viewed', {
                items: cartItems,
                subtotal,
                discount, 
                tax,
                total,
                ...cartContext
            });
        }
    }, [loading, cartItems, subtotal, discount, tax, total, cartContext]);


    // Debug loading states
    console.log('🔍 Cart loading states:', { loading, storeLoading, store: !!store });
    console.log('🔍 Cart items:', cartItems?.length || 0);
    
    // Wait for both store data and cart data to load
    if (loading || storeLoading) {
        console.log('🔄 Cart component is loading - showing spinner');
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    console.log('✅ Cart component loaded - proceeding to render');
    
    // Helper function to render a single slot (custom or standard) with ALL editor customizations
    const renderSlot = (slotId, parentSlot) => {
        // Handle custom slots
        if (slotId.includes('.custom_')) {
            const customSlot = cartLayoutConfig?.customSlots?.[slotId];
            const slotContent = cartLayoutConfig?.slotContent?.[slotId] || customSlot?.content || '';
            
            if (!customSlot) return null;
            
            // Get all editor customizations
            const elementClasses = cartLayoutConfig?.elementClasses?.[slotId] || '';
            const elementStyles = cartLayoutConfig?.elementStyles?.[slotId] || {};
            const microSlotSpans = cartLayoutConfig?.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
            
            // Container styles with positioning from slot configuration
            const containerStyle = {
                ...elementStyles,
                // Get positioning from slot configuration instead of fixed grid spans
                ...(microSlotSpans.position ? { position: microSlotSpans.position } : {}),
                ...(microSlotSpans.left ? { left: microSlotSpans.left } : {}),
                ...(microSlotSpans.top ? { top: microSlotSpans.top } : {}),
                ...(microSlotSpans.right ? { right: microSlotSpans.right } : {}),
                ...(microSlotSpans.bottom ? { bottom: microSlotSpans.bottom } : {}),
                ...(microSlotSpans.width ? { width: microSlotSpans.width } : {}),
                ...(microSlotSpans.height ? { height: microSlotSpans.height } : {}),
                // Only apply grid spans if they exist in configuration
                ...(microSlotSpans.col ? { gridColumn: `span ${Math.min(12, Math.max(1, microSlotSpans.col))}` } : {}),
                ...(microSlotSpans.row ? { gridRow: `span ${Math.min(4, Math.max(1, microSlotSpans.row))}` } : {})
            };
            
            if (customSlot.type === 'text') {
                return (
                    <div 
                        key={slotId} 
                        className="custom-slot text-slot"
                        style={containerStyle}
                    >
                        <div 
                            className={elementClasses || 'text-gray-600'}
                            style={elementStyles}
                        >
                            {slotContent}
                        </div>
                    </div>
                );
            } else if (customSlot.type === 'html') {
                return (
                    <div 
                        key={slotId} 
                        className="custom-slot html-slot"
                        style={containerStyle}
                    >
                        <div 
                            className={elementClasses}
                            style={elementStyles}
                            dangerouslySetInnerHTML={{ __html: slotContent }} 
                        />
                    </div>
                );
            } else if (customSlot.type === 'javascript') {
                return (
                    <div 
                        key={slotId} 
                        className="custom-slot js-slot"
                        style={containerStyle}
                    >
                        <div 
                            className={elementClasses}
                            style={elementStyles}
                            dangerouslySetInnerHTML={{ __html: slotContent }} 
                        />
                    </div>
                );
            }
        }
        
        return null; // Standard slots will be handled by the normal cart rendering
    };
    
    // Helper function to render ALL slots in a section (mixing custom and standard slots dynamically)
    const renderSectionSlots = (parentSlot) => {
        if (!cartLayoutConfig?.microSlotOrders?.[parentSlot]) return null;
        
        const microSlotOrder = cartLayoutConfig.microSlotOrders[parentSlot] || [];
        const slots = [];
        
        microSlotOrder.forEach(slotId => {
            if (slotId.includes('.custom_')) {
                // Render custom slots
                const slot = renderSlot(slotId, parentSlot);
                if (slot) slots.push(slot);
            }
            // Standard slots are handled by normal cart rendering, 
            // but we could extend this to handle them too for full dynamic layout
        });
        
        if (slots.length === 0) return null;
        
        // Render in a grid if there are multiple slots
        return (
            <div className={`section-slots ${parentSlot}-slots ${slots.length > 1 ? 'grid grid-cols-12 gap-2 mb-4' : 'mb-4'}`}>
                {slots}
            </div>
        );
    };
    
    // Prepare data object for CartSlots component
    const cartSlotsData = {
        store,
        cartItems,
        appliedCoupon,
        couponCode,
        subtotal,
        discount,
        tax,
        total,
        currencySymbol,
        settings,
        flashMessage,
        selectedCountry,
        taxes,
        loading,
        storeLoading,
        calculateItemTotal,
        safeToFixed,
        updateQuantity,
        removeItem,
        handleCheckout,
        handleApplyCoupon,
        handleRemoveCoupon,
        handleCouponKeyPress,
        setCouponCode,
        setFlashMessage,
        formatDisplayPrice,
        getStoreBaseUrl,
        getExternalStoreUrl,
        // Layout configuration - merge the cart layout config into the data
        ...(cartLayoutConfig || {})
    };
    
    // Helper function to get slot styling from configuration
    const getSlotStyling = (slotId) => {
        return {
            elementClasses: cartLayoutConfig?.elementClasses?.[slotId] || '',
            elementStyles: cartLayoutConfig?.elementStyles?.[slotId] || {}
        };
    };

    // Helper function to get styling for a specific micro-slot
    const getMicroSlotStyling = (microSlotId) => {
        return {
            elementClasses: cartLayoutConfig?.elementClasses?.[microSlotId] || '',
            elementStyles: cartLayoutConfig?.elementStyles?.[microSlotId] || {}
        };
    };

    // Helper function to get positioning and styling for slots with grid support
    const getSlotPositioning = (slotId, parentSlot) => {
        const microSlotSpans = cartLayoutConfig?.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
        const elementClasses = cartLayoutConfig?.elementClasses?.[slotId] || '';
        const elementStyles = cartLayoutConfig?.elementStyles?.[slotId] || {};
        
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
    };

    // Helper function to render custom slots with ALL editor customizations
    const renderCustomSlot = (slotId, parentSlot) => {
        if (!cartLayoutConfig?.customSlots?.[slotId]) return null;
        
        const customSlot = cartLayoutConfig.customSlots[slotId];
        const slotContent = cartLayoutConfig.slotContent?.[slotId] || customSlot?.content || '';
        
        // Get all editor customizations
        const elementClasses = cartLayoutConfig.elementClasses?.[slotId] || '';
        const elementStyles = cartLayoutConfig.elementStyles?.[slotId] || {};
        const microSlotSpans = cartLayoutConfig.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
        
        // Debug: Log what customizations are being applied
        console.log(`🎨 Rendering custom slot ${slotId}:`);
        console.log('  - elementClasses:', elementClasses);
        console.log('  - elementStyles:', elementStyles);
        console.log('  - microSlotSpans:', microSlotSpans);
        console.log('  - slotContent:', slotContent);
        
        // Build container styles with positioning from slot configuration
        const containerStyle = {
            ...elementStyles,
            // Get positioning from slot configuration instead of fixed grid spans
            ...(microSlotSpans.position ? { position: microSlotSpans.position } : {}),
            ...(microSlotSpans.left ? { left: microSlotSpans.left } : {}),
            ...(microSlotSpans.top ? { top: microSlotSpans.top } : {}),
            ...(microSlotSpans.right ? { right: microSlotSpans.right } : {}),
            ...(microSlotSpans.bottom ? { bottom: microSlotSpans.bottom } : {}),
            ...(microSlotSpans.width ? { width: microSlotSpans.width } : {}),
            ...(microSlotSpans.height ? { height: microSlotSpans.height } : {}),
            // Only apply grid spans if they exist in configuration
            ...(microSlotSpans.col ? { gridColumn: `span ${Math.min(12, Math.max(1, microSlotSpans.col))}` } : {}),
            ...(microSlotSpans.row ? { gridRow: `span ${Math.min(4, Math.max(1, microSlotSpans.row))}` } : {})
        };
        
        const renderContent = () => {
            // Combine inline styles with container positioning
            const combinedStyles = {
                ...elementStyles,
                ...containerStyle
            };
            
            console.log(`🎨 Final styles for ${slotId}:`, combinedStyles);
            console.log(`🎨 Final classes for ${slotId}:`, elementClasses);
            
            if (customSlot.type === 'text') {
                return (
                    <div 
                        className={`custom-slot-content ${elementClasses || 'text-gray-600'}`}
                        style={combinedStyles}
                    >
                        {slotContent}
                    </div>
                );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
                return (
                    <div 
                        className={`custom-slot-content ${elementClasses || ''}`}
                        style={combinedStyles}
                        dangerouslySetInnerHTML={{ __html: slotContent }} 
                    />
                );
            }
            return null;
        };
        
        const positioning = getSlotPositioning(slotId, parentSlot);
        
        return (
            <div 
                key={slotId} 
                className={`custom-slot ${customSlot.type}-slot ${positioning.gridClasses} ${isEditorMode ? 'relative group' : ''}`}
                data-slot-id={slotId}
                data-parent-slot={parentSlot}
                style={positioning.elementStyles}
            >
                {/* Action bar for editor mode */}
                {isEditorMode && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('editCustomSlot', { detail: { slotId, parentSlot } }))}
                            className="mr-2 hover:underline"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('deleteCustomSlot', { detail: { slotId, parentSlot } }))}
                            className="text-red-200 hover:text-red-100 hover:underline"
                        >
                            Delete
                        </button>
                    </div>
                )}
                {renderContent()}
            </div>
        );
    };

    // Log custom slots if configuration exists
    if (cartLayoutConfig) {
        console.log('✅ Cart layout configuration found, using custom rendering system');
        console.log('🔧 Available customSlots:', cartLayoutConfig.customSlots);
        console.log('📐 MicroSlotOrders:', cartLayoutConfig.microSlotOrders);
    }
    
    // Render the default cart layout (when no custom configuration)
    return (
        <div 
            {...getCustomProps({ className: "bg-gray-50 cart-page" })}
            style={getCustomStyles({ backgroundColor: '#f9fafb' })}
        >
            <SeoHeadManager
                title="Your Cart"
                description="Review your shopping cart items before proceeding to checkout."
                keywords="cart, shopping cart, checkout, e-commerce, online store"
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
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        {/* Default header title slot */}
                        {(() => {
                            const headerTitleStyling = getMicroSlotStyling('header.title');
                            const positioning = getSlotPositioning('header.title', 'header');
                            const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                            const finalClasses = headerTitleStyling.elementClasses || defaultClasses;
                            return (
                                <div className={positioning.gridClasses}>
                                    <h1 className={finalClasses} style={positioning.elementStyles}>
                                        My Cart
                                    </h1>
                                </div>
                            );
                        })()}
                        
                        {/* Custom slots */}
                        {cartLayoutConfig?.microSlotOrders?.header?.map(slotId => 
                            slotId.includes('.custom_') ? renderCustomSlot(slotId, 'header') : null
                        )}
                    </div>
                </div>
                
                <CmsBlockRenderer position="cart_above_items" />
                {cartItems.length === 0 ? (
                    // Empty cart state with custom slots
                    <div className="emptyCart-section">
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            {(() => {
                                const titleStyling = getMicroSlotStyling('emptyCart.title');
                                const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                                const finalClasses = titleStyling.elementClasses || defaultClasses;
                                return (
                                    <h2 className={finalClasses} style={titleStyling.elementStyles}>
                                        Your cart is empty
                                    </h2>
                                );
                            })()}
                            {(() => {
                                const textStyling = getMicroSlotStyling('emptyCart.text');
                                const defaultClasses = 'text-gray-600 mb-6';
                                const finalClasses = textStyling.elementClasses || defaultClasses;
                                return (
                                    <p className={finalClasses} style={textStyling.elementStyles}>
                                        Looks like you haven't added anything to your cart yet.
                                    </p>
                                );
                            })()}
                            <Button 
                                onClick={() => navigate(getStoreBaseUrl(store))}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                        
                        {/* Custom slots for emptyCart section */}
                        {cartLayoutConfig?.microSlotOrders?.emptyCart && (
                            <div className="mt-6">
                                {cartLayoutConfig.microSlotOrders.emptyCart.map(slotId => 
                                    slotId.includes('.custom_') ? renderCustomSlot(slotId, 'emptyCart') : null
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2">
                            {(() => {
                                const cartItemsStyling = getSlotStyling('cartItems');
                                return (
                                    <Card className={cartItemsStyling.elementClasses} style={cartItemsStyling.elementStyles}>
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
                                                    <p className="text-gray-600">{formatDisplayPrice(basePriceForDisplay, currencySymbol, store, taxes, selectedCountry)} each</p>
                                                    
                                                    {item.selected_options && item.selected_options.length > 0 && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {item.selected_options.map((option, idx) => (
                                                                <div key={idx}>+ {option.name} (+{formatDisplayPrice(option.price, currencySymbol, store, taxes, selectedCountry)})</div>
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
                                                    <p className="text-xl font-bold">{formatDisplayPrice(itemTotal, currencySymbol, store, taxes, selectedCountry)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                                    </Card>
                                );
                            })()}
                            <CmsBlockRenderer position="cart_below_items" />
                        </div>
                        <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                            {(() => {
                                const couponStyling = getSlotStyling('coupon');
                                return (
                                    <Card className={couponStyling.elementClasses} style={couponStyling.elementStyles}>
                                        <CardHeader>
                                            {(() => {
                                                const titleStyling = getMicroSlotStyling('coupon.title');
                                                const finalClasses = titleStyling.elementClasses || '';
                                                return (
                                                    <CardTitle className={finalClasses} style={titleStyling.elementStyles}>
                                                        Apply Coupon
                                                    </CardTitle>
                                                );
                                            })()}
                                        </CardHeader>
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
                                    
                                    {/* Custom slots for coupon section */}
                                    {cartLayoutConfig?.microSlotOrders?.coupon && (
                                        <div className="grid grid-cols-12 gap-2 auto-rows-min mt-4">
                                            {cartLayoutConfig.microSlotOrders.coupon.map(slotId => 
                                                slotId.includes('.custom_') ? renderCustomSlot(slotId, 'coupon') : null
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                    </Card>
                                );
                            })()}
                            {(() => {
                                const orderSummaryStyling = getSlotStyling('orderSummary');
                                return (
                                    <Card className={orderSummaryStyling.elementClasses} style={orderSummaryStyling.elementStyles}>
                                        <CardHeader>
                                            {(() => {
                                                const titleStyling = getMicroSlotStyling('orderSummary.title');
                                                const finalClasses = titleStyling.elementClasses || '';
                                                return (
                                                    <CardTitle className={finalClasses} style={titleStyling.elementStyles}>
                                                        Order Summary
                                                    </CardTitle>
                                                );
                                            })()}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                    {(() => {
                                        const subtotalStyling = getMicroSlotStyling('orderSummary.subtotal');
                                        const defaultClasses = 'flex justify-between';
                                        const finalClasses = subtotalStyling.elementClasses || defaultClasses;
                                        return (
                                            <div className={finalClasses} style={subtotalStyling.elementStyles}>
                                                <span>Subtotal</span><span>{currencySymbol}{safeToFixed(subtotal)}</span>
                                            </div>
                                        );
                                    })()}
                                    {discount > 0 && (() => {
                                        const discountStyling = getMicroSlotStyling('orderSummary.discount');
                                        const defaultClasses = 'flex justify-between';
                                        const finalClasses = discountStyling.elementClasses || defaultClasses;
                                        return (
                                            <div className={finalClasses} style={discountStyling.elementStyles}>
                                                <span>Discount</span><span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span>
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const taxStyling = getMicroSlotStyling('orderSummary.tax');
                                        const defaultClasses = 'flex justify-between';
                                        const finalClasses = taxStyling.elementClasses || defaultClasses;
                                        return (
                                            <div className={finalClasses} style={taxStyling.elementStyles}>
                                                <span>Tax</span><span>{currencySymbol}{safeToFixed(tax)}</span>
                                            </div>
                                        );
                                    })()}
                                    <CmsBlockRenderer position="cart_above_total" />
                                    {(() => {
                                        const totalStyling = getMicroSlotStyling('orderSummary.total');
                                        const defaultClasses = 'flex justify-between text-lg font-semibold border-t pt-4';
                                        const finalClasses = totalStyling.elementClasses || defaultClasses;
                                        return (
                                            <div className={finalClasses} style={totalStyling.elementStyles}>
                                                <span>Total</span>
                                                <span>{currencySymbol}{safeToFixed(total)}</span>
                                            </div>
                                        );
                                    })()}
                                    <CmsBlockRenderer position="cart_below_total" />
                                    <div className="border-t mt-6 pt-6">
                                        {(() => {
                                            const buttonStyling = getMicroSlotStyling('orderSummary.checkoutButton');
                                            const defaultClasses = 'w-full';
                                            const finalClasses = buttonStyling.elementClasses || defaultClasses;
                                            return (
                                                <Button 
                                                    size="lg" 
                                                    className={finalClasses}
                                                    onClick={handleCheckout}
                                                    style={{
                                                        backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
                                                        color: '#FFFFFF',
                                                        ...buttonStyling.elementStyles
                                                    }}
                                                >
                                                    Proceed to Checkout
                                                </Button>
                                            );
                                        })()}
                                    </div>
                                    
                                    {/* Custom slots for orderSummary section */}
                                    {cartLayoutConfig?.microSlotOrders?.orderSummary && (
                                        <div className="grid grid-cols-12 gap-2 auto-rows-min mt-4">
                                            {cartLayoutConfig.microSlotOrders.orderSummary.map(slotId => 
                                                slotId.includes('.custom_') ? renderCustomSlot(slotId, 'orderSummary') : null
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                    </Card>
                                );
                            })()}
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
