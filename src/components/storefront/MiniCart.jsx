
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl } from '@/utils/urlUtils';
import { StorefrontProduct } from '@/api/storefront-entities';
import { useStore } from '@/components/storefront/StoreProvider';
import cartService from '@/services/cartService';
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatPrice, safeNumber, calculateDisplayPrice } from '@/utils/priceUtils';
import { getPrimaryImageUrl } from '@/utils/imageUtils';
import { getProductName, getCurrentLanguage } from '@/utils/translationUtils';
import { useTranslation } from '@/contexts/TranslationContext';

export default function MiniCart({ iconVariant = 'outline' }) {
  const { store, settings, taxes, selectedCountry } = useStore();
  const { t } = useTranslation();

  // Choose icon based on variant
  const getCartIcon = () => {
    switch (iconVariant) {
      case 'filled':
        return <ShoppingCart className="w-5 h-5 fill-current" />;
      case 'bag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'bag-filled':
        return <ShoppingBag className="w-5 h-5 fill-current" />;
      case 'outline':
      default:
        return <ShoppingCart className="w-5 h-5" />;
    }
  };
  const [cartItems, setCartItems] = useState([]);
  const [cartProducts, setCartProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadCartTimeout, setLoadCartTimeout] = useState(null);
  const [lastRefreshId, setLastRefreshId] = useState(null);
  const loadCartRef = useRef(null);

  // Helper function to load product details for cart items
  const loadProductDetails = useCallback(async (cartItems) => {
    if (cartItems.length === 0) {
      setCartProducts({});
      return;
    }

    // Extract unique product IDs and batch the request
    const productIds = [...new Set(cartItems.map(item => {
      const productId = typeof item.product_id === 'object' ?
        (item.product_id?.id || item.product_id?.toString() || null) :
        item.product_id;
      return productId;
    }).filter(id => id !== null))];

    if (productIds.length === 0) {
      setCartProducts({});
      return;
    }

    console.log(`🛍️ MiniCart: Fetching ${productIds.length} products...`, productIds);

    try {
      const products = await StorefrontProduct.filter({ ids: productIds });
      console.log('📦 MiniCart: Received products from API:', products);

      // Build product details map - ensure string keys for consistency
      const productDetails = {};
      products.forEach(product => {
        if (product && product.id) {
          // Always use string keys for consistency
          const key = String(product.id);
          productDetails[key] = product;
          console.log(`  ➕ Mapped product ${key}: ${product.name || 'Unknown'}`);
        }
      });
      console.log(`✅ MiniCart: Successfully fetched ${Object.keys(productDetails).length} products`);
      console.log('🗺️ MiniCart: Product map keys:', Object.keys(productDetails));
      setCartProducts(productDetails);
    } catch (error) {
      console.error('❌ MiniCart: Failed to fetch products:', error);
      setCartProducts({});
    }
  }, []); // Removed cartProducts dependency to prevent excessive calls

  // Cart data ONLY from database - no localStorage
  // Database is the single source of truth for critical cart data

  // Load cart on mount
  useEffect(() => {
    // Skip localStorage - always fetch fresh from backend for real-time data
    console.log('🚀 MiniCart: Initial load - fetching fresh from backend');
    loadCart();
  }, []);

  // Load product details when cartItems change
  useEffect(() => {
    console.log('🔄 MiniCart: cartItems changed, count:', cartItems.length);
    if (cartItems.length > 0) {
      console.log('🔄 MiniCart: cartItems product IDs:', cartItems.map(item => item.product_id));
      loadProductDetails(cartItems);
    } else {
      setCartProducts({});
    }
  }, [cartItems]);

  // Production-ready event handling with race condition prevention
  useEffect(() => {
    let refreshTimeout = null;
    let pendingRefresh = false;

    const debouncedRefresh = (immediate = false) => {
      if (pendingRefresh && !immediate) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      const executeRefresh = async () => {
        pendingRefresh = true;
        try {
          await loadCart();
        } finally {
          pendingRefresh = false;
        }
      };

      if (immediate) {
        executeRefresh();
      } else {
        refreshTimeout = setTimeout(() => {
          if (!pendingRefresh) {
            executeRefresh();
          }
        }, 100); // Small delay to batch multiple events
      }
    };

    const handleCartUpdate = (event) => {
      console.log('🔔 MiniCart: Received cartUpdated event', event.detail);

      // Use freshCartData from event to avoid race condition with backend
      if (event.detail?.freshCartData?.items) {
        const items = event.detail.freshCartData.items;
        console.log(`✅ MiniCart: Using freshCartData from event, ${items.length} items`);
        setCartItems(items);
        // NO localStorage saving - database is source of truth
        return;
      }

      // Fallback: fetch from backend if no freshCartData
      console.log('⚠️ MiniCart: No freshCartData, fetching from backend...');
      debouncedRefresh(true);
    };

    const handleDirectRefresh = (event) => {
      debouncedRefresh(true); // Always immediate for direct refresh
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('refreshMiniCart', handleDirectRefresh);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('refreshMiniCart', handleDirectRefresh);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      if (loadCartTimeout) {
        clearTimeout(loadCartTimeout);
      }
    };
  }, []);

  // Note: Debouncing removed for better reliability
  // All cart updates now trigger immediate refresh

  const loadCart = async () => {
    // Prevent concurrent loadCart calls
    if (loadCartRef.current) {
      console.log('⏳ MiniCart: Load already in progress, skipping...');
      return loadCartRef.current;
    }

    const refreshId = Date.now();
    console.log(`🔄 MiniCart: Loading cart from backend (${refreshId})...`);

    const loadCartPromise = (async () => {
      try {
        setLoading(true);

        // Use simplified cart service
        const cartResult = await cartService.getCart();
        console.log('📦 MiniCart: Cart result from backend:', cartResult);

        if (cartResult.success && cartResult.items) {
          // Simplified: always trust backend data
          const backendItems = cartResult.items;
          console.log(`✅ MiniCart: Setting ${backendItems.length} items to state`);

          setCartItems(backendItems);
          setLastRefreshId(refreshId);

          // NO localStorage saving - database is single source of truth

          // Product details will be loaded by the cartItems useEffect
        } else {
          console.log('⚠️ MiniCart: Cart result has no items, clearing cart');
          setCartItems([]);
          setCartProducts({});
          setLastRefreshId(refreshId);
        }

      } catch (error) {
        console.error(`🛒 MiniCart: Error loading cart (${refreshId}):`, error);

        // NO localStorage fallback - if backend fails, show error to user
        // Cart is critical data that must come from database
        setCartItems([]);
        setCartProducts({});
        setLastRefreshId(refreshId);
      } finally {
        setLoading(false);
        loadCartRef.current = null;
      }
    })();

    loadCartRef.current = loadCartPromise;
    return loadCartPromise;
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      if (!store?.id) {
        console.error('MiniCart: No store context available for update');
        return;
      }

      // Server-first approach: update server then UI
      const updatedItems = cartItems.map(item =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      );

      const result = await cartService.updateCart(updatedItems, store.id);

      if (result.success) {
        // CartService will dispatch event with fresh data, which our listener will handle
        // No need to manually update state or dispatch events
      } else {
        console.error('Failed to update quantity:', result.error);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      if (!store?.id) {
        console.error('MiniCart: No store context available for remove');
        return;
      }

      // Server-first approach: update server then UI
      const updatedItems = cartItems.filter(item => item.id !== cartItemId);

      const result = await cartService.updateCart(updatedItems, store.id);

      if (result.success) {
        // CartService will dispatch event with fresh data, which our listener will handle
        // No need to manually update state or dispatch events
      } else {
        console.error('Failed to remove item:', result.error);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const getTotalItems = () => {
    const total = cartItems.reduce((total, item) => {
      console.log(`🔢 MiniCart: item.id=${item.id}, quantity=${item.quantity}`);
      return total + (item.quantity || 0);
    }, 0);
    console.log(`🔢 MiniCart: Total items count: ${total}`);
    return total;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Use stored price from cart item, fallback to 0 if no price available
      let itemPrice = safeNumber(item.price);

      // If we have product details loaded, use product price as fallback
      const productKey = String(item.product_id);
      const product = cartProducts[productKey];
      if (!item.price && product) {
        itemPrice = safeNumber(product.price);
        const comparePrice = safeNumber(product.compare_price);
        if (comparePrice > 0 && comparePrice !== safeNumber(product.price)) {
          itemPrice = Math.min(safeNumber(product.price), comparePrice);
        }
      }

      // Add selected options price
      if (item.selected_options && Array.isArray(item.selected_options)) {
        const optionsPrice = item.selected_options.reduce((sum, option) => sum + safeNumber(option.price), 0);
        itemPrice += optionsPrice;
      }

      // Calculate tax-inclusive price if needed
      const displayItemPrice = calculateDisplayPrice(itemPrice, store, taxes, selectedCountry);

      return total + (displayItemPrice * safeNumber(item.quantity || 1));
    }, 0);
  };

  const totalItems = getTotalItems();


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {getCartIcon()}
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{t('common.my_cart', 'My Cart')}</h3>

          {loading ? (
            <div className="text-center py-4">{t('common.loading', 'Loading...')}</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {t('cart.cart_is_empty', 'Your cart is empty')}
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item) => {
                  // Ensure consistent string key lookup
                  const productKey = String(item.product_id);
                  const product = cartProducts[productKey];
                  console.log(`🔍 MiniCart render: item.id=${item.id}, product_id=${productKey}, found:`, product ? product.name : 'NOT FOUND');
                  if (!product) {
                    // Show placeholder for missing product instead of hiding completely
                    return (
                      <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-200">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Product (ID: {String(item.product_id).slice(-8)})
                          </p>
                          <p className="text-xs text-gray-500">Product details unavailable</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price || 0)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  }

                  // Get translated product name
                  const translatedProductName = getProductName(product, getCurrentLanguage()) || product.name;

                  // Use the stored price from cart (which should be the sale price)
                  let basePrice = safeNumber(item.price);

                  // If no stored price, calculate from product (use sale price if available)
                  if (!item.price) {
                    basePrice = safeNumber(product.price);
                    const comparePrice = safeNumber(product.compare_price);
                    if (comparePrice > 0 && comparePrice !== safeNumber(product.price)) {
                      basePrice = Math.min(safeNumber(product.price), comparePrice);
                    }
                  }

                  return (
                    <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-200">
                      <img
                        src={getPrimaryImageUrl(product.images) || 'https://placehold.co/50x50?text=No+Image'}
                        alt={translatedProductName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{translatedProductName}</p>
                        <p className="text-sm text-gray-500">{formatPrice(calculateDisplayPrice(basePrice, store, taxes, selectedCountry))} each</p>

                        {item.selected_options && item.selected_options.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.selected_options.map((option, idx) => (
                              <div key={idx}>+ {option.name} (+{formatPrice(calculateDisplayPrice(safeNumber(option.price), store, taxes, selectedCountry))})</div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 p-0 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">{t('checkout.total', 'Total')}: {formatPrice(getTotalPrice())}</span>
                </div>

                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full btn-view-cart"
                    style={{ backgroundColor: settings?.theme?.view_cart_button_color || '#17a2b8' }}
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={createPublicUrl(store.slug, 'CART')}>
                      {t('common.my_cart', 'My Cart')}
                    </Link>
                  </Button>
                  {!settings?.hide_header_checkout && (
                    <Button
                      asChild
                      className="w-full btn-checkout"
                      style={{ backgroundColor: settings?.theme?.checkout_button_color || '#007bff' }}
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to={createPublicUrl(store.slug, 'CHECKOUT')}>
                        {t('checkout.checkout', 'Checkout')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
