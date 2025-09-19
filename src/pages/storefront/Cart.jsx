
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
import { ResizeWrapper as ResizeElementWrapper } from '@/components/ui/resize-element-wrapper';
import slotConfigurationService from '@/services/slotConfigurationService';
import { SlotManager } from '@/utils/slotUtils';
import { CartSlotRenderer } from '@/components/storefront/CartSlotRenderer';



const getSessionId = () => {
  let sid = localStorage.getItem('guest_session_id');
  if (!sid) {
    sid = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('guest_session_id', sid);
    console.log('🆔 Cart.jsx: Created new guest_session_id:', sid);
  } else {
    console.log('🆔 Cart.jsx: Using existing guest_session_id:', sid);
  }

  // Check for old cart_session_id and clean it up
  const oldSid = localStorage.getItem('cart_session_id');
  if (oldSid) {
    console.log('⚠️ Cart.jsx: Found old cart_session_id, removing:', oldSid);
    localStorage.removeItem('cart_session_id');
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

// Simplified retry function without artificial delays
const simpleRetry = async (apiCall, maxRetries = 2) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429;

      if (isRateLimit && i < maxRetries - 1) {
        // Only minimal delay for rate limits
        await delay(1000);
        continue;
      }

      if (i === maxRetries - 1) {
        throw error;
      }
    }
  }
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
    
    
    // Use StoreProvider data instead of making separate API calls
    const { store, settings, taxes, selectedCountry, loading: storeLoading } = useStore();
    
    // State for cart layout configuration
    const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Load cart layout configuration directly
    useEffect(() => {
        console.log('🔄 loadCartLayoutConfig useEffect triggered, store:', store);
        const loadCartLayoutConfig = async () => {
            if (!store?.id) {
                console.log('❌ No store.id found, skipping slot config loading');
                return;
            }
            if (configLoaded && cartLayoutConfig) {
                console.log('✅ Configuration already loaded, skipping reload');
                return;
            }
            console.log('✅ Store ID found, loading published slot configuration for store:', store.id);
            console.log('🔍 Current timestamp:', new Date().toISOString());
            console.log('🌐 Backend URL:', process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com');

            try {
                // Test backend connectivity first
                console.log('🔌 Testing backend connectivity...');

                // Load published configuration using the new versioning API
                const response = await slotConfigurationService.getPublishedConfiguration(store.id, 'cart');

                console.log('📡 Published config response:', response);
                console.log('📡 Response data structure:', response?.data);
                console.log('📡 Configuration content:', response?.data?.configuration);
                console.log('📡 Configuration status:', response?.data?.status);
                console.log('📡 Published at:', response?.data?.published_at);
                console.log('📡 Version number:', response?.data?.version_number);
                
                if (response.success && response.data) {
                    const publishedConfig = response.data;
                    
                    if (publishedConfig.configuration) {
                        console.log('🔧 Setting cart layout config with published data...');
                        console.log('🔧 Published config slots:', Object.keys(publishedConfig.configuration.slots || {}));
                        console.log('🔧 Published config metadata:', publishedConfig.configuration.metadata);
                        setCartLayoutConfig(publishedConfig.configuration);
                        setConfigLoaded(true);
                        console.log('✅ Loaded published cart layout configuration:', publishedConfig.configuration);
                        console.log('🔍 Empty cart title config:', publishedConfig.configuration['empty_cart_title']);
                    } else {
                        console.warn('⚠️ Published configuration has no configuration data');
                        // Fallback to cart-config.js
                        const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
                        setCartLayoutConfig({
                            slots: { ...cartConfig.slots },
                            metadata: {
                                created: new Date().toISOString(),
                                lastModified: new Date().toISOString()
                            }
                        });
                    }
                } else {
                    console.warn('⚠️ No published configuration found, using default');
                    console.warn('⚠️ Response success:', response?.success);
                    console.warn('⚠️ Response data exists:', !!response?.data);
                    // Set default configuration
                    setCartLayoutConfig({
                        slots: {},
                        metadata: {
                            created: new Date().toISOString(),
                            lastModified: new Date().toISOString()
                        }
                    });
                }
            } catch (error) {
                console.error('❌ Error loading published slot configuration:', error);
                console.error('❌ Error type:', error.constructor.name);
                console.error('❌ Error message:', error.message);
                console.error('❌ Network status:', navigator.onLine ? 'Online' : 'Offline');

                if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
                    console.error('🔌 Backend connectivity issue detected');
                }

                console.warn('⚠️ Falling back to cart-config.js due to error');
                // Fallback to cart-config.js
                const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
                setCartLayoutConfig({
                    slots: { ...cartConfig.slots },
                    metadata: {
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                });
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
        // Load cart data immediately when store is available - no artificial delay
        if (!storeLoading && store?.id) {
            // Load cart data and tax rules in parallel for better performance
            Promise.all([
                loadCartData(),
                loadTaxRules()
            ]).catch(error => {
                console.error('Error loading cart data in parallel:', error);
            });
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

    // Listen for cart updates from other components (like MiniCart, add to cart) with debouncing
    useEffect(() => {
        let debounceTimer;

        const handleCartUpdate = (event) => {
            // Only reload if we're not currently processing our own updates
            // and the event is not from our own quantity/remove updates
            if (!loading && hasLoadedInitialData &&
                event.type !== 'cartQuantityUpdated' &&
                event.type !== 'cartItemRemoved') {

                // Clear existing timer
                clearTimeout(debounceTimer);

                // Debounce rapid cart updates
                debounceTimer = setTimeout(() => {
                    console.log('🔄 Cart: External cart update detected, reloading...');
                    loadCartData(false); // Reload without showing loader
                }, 300); // 300ms debounce
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [loading, hasLoadedInitialData, loadCartData]);

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

                // Update local state immediately instead of reloading
                setCartItems(updatedItems);

                // Dispatch update event for other components (MiniCart, etc.)
                // Use custom event type to avoid triggering our own listener
                window.dispatchEvent(new CustomEvent('cartQuantityUpdated'));
            } catch (error) {
                console.error("Error updating cart quantities:", error);
                setFlashMessage({ type: 'error', message: "Failed to update cart quantities." });
            }
        };
        
        updateCartQuantities();
    }, [quantityUpdates], 1500);

    const loadCartData = useCallback(async (showLoader = true) => {
        console.log('🔄 Cart.loadCartData: Called with showLoader:', showLoader);
        if (showLoader) setLoading(true);

        try {
            // Create cart context locally to avoid circular dependency
            const localCartContext = {
                store,
                settings,
                taxes,
                selectedCountry,
                currencySymbol,
                sessionId: getSessionId()
            };

            // Apply before load hooks
            const shouldLoad = hookSystem.apply('cart.beforeLoadItems', true, localCartContext);
            if (!shouldLoad) {
                setLoading(false);
                return;
            }

            // Emit loading event
            eventSystem.emit('cart.loadingStarted', localCartContext);

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

            // Optimized: Batch fetch products with single API call
            const products = await (async () => {
                try {
                    // Try batch fetch first (most efficient)
                    if (productIds.length > 1) {
                        const batchResults = await StorefrontProduct.filter({
                            id: { in: productIds }
                        });
                        if (batchResults && batchResults.length > 0) {
                            return batchResults;
                        }
                    }

                    // Fallback to parallel individual fetches (no artificial delays)
                    const productPromises = productIds.map(id =>
                        StorefrontProduct.filter({ id: id }).catch(error => {
                            console.error(`Failed to fetch product ${id}:`, error);
                            return null;
                        })
                    );
                    const productArrays = await Promise.all(productPromises);
                    return productArrays.filter(arr => arr && arr.length > 0).map(arr => arr[0]);
                } catch (error) {
                    console.error('Error fetching products:', error);
                    return [];
                }
            })();
            
            const populatedCart = cartItems.map(item => {
                const productDetails = (products || []).find(p => p.id === item.product_id);
                return { 
                    ...item, 
                    product: productDetails,
                    selected_options: item.selected_options || [] // Ensure selected_options is always an array
                };
            }).filter(item => item.product); // Ensure product exists
            
            // Apply item processing hooks
            const processedItems = hookSystem.apply('cart.processLoadedItems', populatedCart, localCartContext);

            setCartItems(processedItems);
            setHasLoadedInitialData(true);

            // Apply after load hooks
            hookSystem.do('cart.afterLoadItems', {
                items: processedItems,
                ...localCartContext
            });

            // Emit loaded event
            eventSystem.emit('cart.itemsLoaded', {
                items: processedItems,
                ...localCartContext
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
    }, [appliedCoupon, store, settings, taxes, selectedCountry, currencySymbol]); // Fixed dependencies to avoid circular reference

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

            // Don't reload - we already updated local state above
            // Just notify other components about the change
            window.dispatchEvent(new CustomEvent('cartItemRemoved'));
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
            
            const coupons = await simpleRetry(() => Coupon.filter({
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
        // Handle both old format (config.slots[slotId]) and new format (config[slotId])
        const slotConfig = cartLayoutConfig?.slots?.[slotId] || cartLayoutConfig?.[slotId];
        return {
            elementClasses: slotConfig?.className || '',
            elementStyles: slotConfig?.styles || {}
        };
    };
    
    // Helper function to get slot content from configuration
    const getSlotContent = (slotId, fallback = '') => {
        const slotConfig = cartLayoutConfig?.slots?.[slotId] || cartLayoutConfig?.[slotId];
        let content = slotConfig?.content || fallback;

        // Clean up HTML content for direct button usage (remove nested divs from resize)
        if (typeof content === 'string' && content.includes('<div')) {
            // Extract text content from nested divs
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            content = tempDiv.textContent || tempDiv.innerText || fallback;
        }

        return content;
    };

    // Render cart with complete slot-based layout
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
                {/* FlashMessage Section */}
                <div className="flashMessage-section mb-6">
                    <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
                </div>

                {/* Complete Slot-Based Layout with Full Cart Functionality */}
                {(() => {
                    console.log('🔍 Cart Debug - Layout Config:', {
                        hasConfig: !!cartLayoutConfig,
                        hasSlots: !!cartLayoutConfig?.slots,
                        slotCount: Object.keys(cartLayoutConfig?.slots || {}).length,
                        cartItemsLength: cartItems.length,
                        viewMode: cartItems.length === 0 ? 'emptyCart' : 'withProducts'
                    });
                    return cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots).length > 0;
                })() ? (
                    <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <CartSlotRenderer
                            slots={cartLayoutConfig.slots}
                            parentId={null}
                            viewMode={cartItems.length === 0 ? 'emptyCart' : 'withProducts'}
                            cartContext={{
                                cartItems,
                                appliedCoupon,
                                couponCode,
                                subtotal,
                                discount,
                                tax,
                                total,
                                currencySymbol,
                                settings,
                                store,
                                taxes,
                                selectedCountry,
                                calculateItemTotal,
                                safeToFixed,
                                updateQuantity,
                                removeItem,
                                handleCheckout,
                                handleApplyCoupon,
                                handleRemoveCoupon,
                                handleCouponKeyPress,
                                setCouponCode,
                                formatDisplayPrice,
                                getStoreBaseUrl,
                                navigate
                            }}
                        />
                    </div>
                ) : (
                    // Fallback when no slot configuration
                    <div className="text-center py-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Cart</h1>
                        <p className="text-gray-600">Loading cart configuration...</p>
                    </div>
                )}

            </div>
        </div>
    );
}
