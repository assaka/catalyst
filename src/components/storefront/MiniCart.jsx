
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl } from '@/utils/urlUtils';
import { StorefrontProduct } from '@/api/storefront-entities';
import { useStore } from '@/components/storefront/StoreProvider';
import cartService from '@/services/cartService';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatPrice, safeToFixed, calculateDisplayPrice, formatDisplayPrice } from '@/utils/priceUtils';
import { getPrimaryImageUrl } from '@/utils/imageUtils';

export default function MiniCart({ cartUpdateTrigger }) {
  const { store, settings, taxes, selectedCountry } = useStore();
  
  
  // Get currency symbol from settings
  const currencySymbol = settings?.currency_symbol || '$';
  const [cartItems, setCartItems] = useState([]);
  const [cartProducts, setCartProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadCartTimeout, setLoadCartTimeout] = useState(null);
  const [lastRefreshId, setLastRefreshId] = useState(null);
  const [lastOptimisticUpdate, setLastOptimisticUpdate] = useState(null);
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


    try {
      // Use the working batch loading strategy
      const products = await StorefrontProduct.filter({ ids: productIds });

      // Build product details map - ensure string keys for consistency
      const productDetails = {};
      products.forEach(product => {
        if (product && product.id) {
          // Always use string keys for consistency
          productDetails[String(product.id)] = product;
        }
      });
      setCartProducts(productDetails);
    } catch (error) {
      console.error('MiniCart: Error loading product details:', error);
      setCartProducts({});
    }
  }, []); // Removed cartProducts dependency to prevent excessive calls

  // Helper functions for localStorage cart persistence
  const saveCartToLocalStorage = (items) => {
    try {
      localStorage.setItem('minicart_items', JSON.stringify(items));
      localStorage.setItem('minicart_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  };

  const getCartFromLocalStorage = () => {
    try {
      const items = localStorage.getItem('minicart_items');
      const timestamp = localStorage.getItem('minicart_timestamp');
      if (items && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Use localStorage cart if it's less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          return JSON.parse(items);
        }
      }
    } catch (error) {
      console.warn('Failed to get cart from localStorage:', error);
    }
    return null;
  };

  // Load cart on mount and when triggered
  useEffect(() => {
    // Initialize from localStorage first for instant display
    const localCart = getCartFromLocalStorage();
    if (localCart && localCart.length > 0) {
      setCartItems(localCart);
      // Product details will be loaded by the cartItems useEffect
    }
    loadCart();
  }, [cartUpdateTrigger]);

  // Load product details when cartItems change
  useEffect(() => {
    if (cartItems.length > 0) {
      loadProductDetails(cartItems);
    } else {
      setCartProducts({});
    }
  }, [cartItems]);

  // Production-ready event handling with race condition prevention
  useEffect(() => {
    let refreshTimeout = null;
    let pendingRefresh = false;

    const debouncedRefresh = (immediate = false, retryCount = 0) => {
      if (pendingRefresh && !immediate) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      const executeRefresh = async () => {
        pendingRefresh = true;
        try {
          const previousItemCount = cartItems.length;
          await loadCart();

          // For add operations, verify the cart actually updated
          if (immediate && retryCount < 5 && lastOptimisticUpdate) {
            // Progressive delay to let backend process the change
            const delay = 300 + (retryCount * 200); // 300ms, 500ms, 700ms, 900ms, 1100ms
            await new Promise(resolve => setTimeout(resolve, delay));
            const newResult = await cartService.getCart();

            if (newResult.success && newResult.items) {
              const newItemCount = newResult.items.length;
              const expectedCount = cartItems.length; // Current count including optimistic

              // If backend count is still less than expected, retry
              if (newItemCount < expectedCount) {
                setTimeout(() => debouncedRefresh(true, retryCount + 1), delay + 200);
                return;
              }

              // Backend caught up, update with fresh data
              setCartItems(newResult.items);
              setLastOptimisticUpdate(null); // Clear optimistic tracking
            }
          }
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
      // Simplified: only handle fresh cart data from backend
      if (event.detail?.freshCartData && event.detail.freshCartData.items) {
        // We have fresh data from backend - use it directly
        setCartItems(event.detail.freshCartData.items);
        saveCartToLocalStorage(event.detail.freshCartData.items);
        setLastOptimisticUpdate(null); // Clear any optimistic tracking

        // Product details will be loaded by the cartItems useEffect

        return; // Fresh data received - no need for additional API calls
      }

      // For events without fresh data, just refresh from backend
      // This handles cases like quantity updates, removals, etc.
      debouncedRefresh(true);
    };

    const handleDirectRefresh = (event) => {
      debouncedRefresh(true); // Always immediate for direct refresh
    };

    const handleStorageChange = () => {
      debouncedRefresh(false); // Debounced for storage changes
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('refreshMiniCart', handleDirectRefresh);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('refreshMiniCart', handleDirectRefresh);
      window.removeEventListener('storage', handleStorageChange);
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
      return loadCartRef.current;
    }

    const refreshId = Date.now();

    const loadCartPromise = (async () => {
      try {
        setLoading(true);

        // Use simplified cart service
        const cartResult = await cartService.getCart();

        if (cartResult.success && cartResult.items) {
          // Simplified: always trust backend data
          const backendItems = cartResult.items;


          setCartItems(backendItems);
          setLastRefreshId(refreshId);

          // Save valid cart state to localStorage
          saveCartToLocalStorage(backendItems);

          // Clear any optimistic update tracking
          setLastOptimisticUpdate(null);

          // Product details will be loaded by the cartItems useEffect
        } else {
          setCartItems([]);
          setCartProducts({});
          setLastRefreshId(refreshId);
        }

      } catch (error) {
        console.error(`🛒 MiniCart: Error loading cart (${refreshId}):`, error);

        // For network errors, try to fall back to localStorage data instead of clearing cart
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
          const localCart = getCartFromLocalStorage();
          if (localCart && localCart.length > 0) {
            setCartItems(localCart);
            setLastRefreshId(refreshId);
            return; // Don't clear cart on network error if we have local data
          }
        }

        // Only clear cart for non-network errors or when no fallback available
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

      // Update local state immediately for instant UI response
      const updatedItems = cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);

      // Dispatch immediate update for other components
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const result = await cartService.updateCart(updatedItems, store.id);
      
      if (result.success) {
        // Reload in background to sync with server
        await loadCart();
      } else {
        console.error('Failed to update quantity:', result.error);
        // Revert local state on error
        await loadCart();
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

      // Store original items in case we need to revert
      const originalItems = [...cartItems];

      // Update local state immediately for instant UI response
      const updatedItems = cartItems.filter(item => item.id !== cartItemId);
      setCartItems(updatedItems);

      // Use simplified cart service - it will handle event dispatching
      const result = await cartService.updateCart(updatedItems, store.id);

      if (result.success) {
        // Success - cartService dispatched event with fresh data
        // MiniCart will receive fresh data via cartUpdated event automatically
        saveCartToLocalStorage(updatedItems);
      } else {
        console.error('Failed to remove item:', result.error);
        // Revert optimistic change on failure
        setCartItems(originalItems);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      // Revert optimistic change on error
      setCartItems(originalItems);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Use stored price from cart item, fallback to 0 if no price available
      let itemPrice = formatPrice(item.price || 0);

      // If we have product details loaded, use product price as fallback
      const productKey = String(item.product_id);
      const product = cartProducts[productKey];
      if (!item.price && product) {
        itemPrice = formatPrice(product.price);
        const comparePrice = formatPrice(product.compare_price);
        if (comparePrice > 0 && comparePrice !== formatPrice(product.price)) {
          itemPrice = Math.min(formatPrice(product.price), comparePrice);
        }
      }

      // Add selected options price
      if (item.selected_options && Array.isArray(item.selected_options)) {
        const optionsPrice = item.selected_options.reduce((sum, option) => sum + formatPrice(option.price), 0);
        itemPrice += optionsPrice;
      }

      // Calculate tax-inclusive price if needed
      const displayItemPrice = calculateDisplayPrice(itemPrice, store, taxes, selectedCountry);

      return total + (displayItemPrice * formatPrice(item.quantity || 1));
    }, 0);
  };

  const totalItems = getTotalItems();


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
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
          <h3 className="font-semibold text-lg">Shopping Cart</h3>
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item) => {
                  // Ensure consistent string key lookup
                  const productKey = String(item.product_id);
                  const product = cartProducts[productKey];
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
                          {currencySymbol}{(item.price || 0).toFixed(2)}
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
                  
                  // Use the stored price from cart (which should be the sale price)
                  let basePrice = formatPrice(item.price);
                  
                  // If no stored price, calculate from product (use sale price if available)
                  if (!item.price) {
                    basePrice = formatPrice(product.price);
                    const comparePrice = formatPrice(product.compare_price);
                    if (comparePrice > 0 && comparePrice !== formatPrice(product.price)) {
                      basePrice = Math.min(formatPrice(product.price), comparePrice);
                    }
                  }

                  return (
                    <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-200">
                      <img
                        src={getPrimaryImageUrl(product.images) || 'https://placehold.co/50x50?text=No+Image'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">{formatDisplayPrice(basePrice, currencySymbol, store, taxes, selectedCountry)} each</p>
                        
                        {item.selected_options && item.selected_options.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.selected_options.map((option, idx) => (
                              <div key={idx}>+ {option.name} (+{formatDisplayPrice(parseFloat(option.price || 0), currencySymbol, store, taxes, selectedCountry)})</div>
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
                  <span className="font-semibold">Total: {currencySymbol}{safeToFixed(getTotalPrice())}</span>
                </div>
                
                <div className="space-y-2">
                  <Button asChild className="w-full btn-view-cart" onClick={() => setIsOpen(false)}>
                    <Link to={createPublicUrl(store.slug, 'CART')}>
                      View Cart
                    </Link>
                  </Button>
                  {!settings?.hide_header_checkout && (
                    <Button asChild className="w-full btn-checkout" onClick={() => setIsOpen(false)}>
                      <Link to={createPublicUrl(store.slug, 'CHECKOUT')}>
                        Checkout
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
