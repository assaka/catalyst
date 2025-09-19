
import React, { useState, useEffect, useRef } from 'react';
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

  // Load cart on mount and when triggered
  useEffect(() => {
    loadCart();
  }, [cartUpdateTrigger]);

  // Production-ready event handling with race condition prevention
  useEffect(() => {
    let refreshTimeout = null;
    let pendingRefresh = false;

    const debouncedRefresh = (immediate = false, retryCount = 0) => {
      if (pendingRefresh && !immediate) {
        console.log('🛒 MiniCart: Refresh already pending, skipping');
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
              console.log(`🛒 MiniCart: Retry check ${retryCount + 1}/5 - Expected: ${expectedCount}, Backend: ${newItemCount}`);

              // If backend count is still less than expected, retry
              if (newItemCount < expectedCount) {
                console.log(`🔄 MiniCart: Backend still behind (${newItemCount} < ${expectedCount}), retrying in ${delay + 200}ms...`);
                setTimeout(() => debouncedRefresh(true, retryCount + 1), delay + 200);
                return;
              }

              // Backend caught up, update with fresh data
              console.log(`✅ MiniCart: Backend caught up - ${newItemCount} items`);
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
      console.log('🛒 MiniCart: cartUpdated event received', {
        detail: event.detail,
        timestamp: new Date().toISOString()
      });

      // Handle optimistic updates for immediate UI feedback
      if (event.detail?.optimistic && event.detail?.action?.includes('add')) {
        console.log('🚀 MiniCart: Applying optimistic update');
        const optimisticTimestamp = Date.now();
        setLastOptimisticUpdate(optimisticTimestamp);

        // Optimistically increment cart count for immediate feedback
        setCartItems(prevItems => {
          const newItems = [
            ...prevItems,
            {
              id: `optimistic-${optimisticTimestamp}`,
              product_id: event.detail.productId,
              quantity: event.detail.quantity || 1,
              price: 0,
              optimistic: true,
              optimisticTimestamp
            }
          ];
          console.log(`🚀 Optimistic update: ${prevItems.length} → ${newItems.length} items`);
          return newItems;
        });
      }

      // Immediate refresh for add operations, debounced for others
      const isAddOperation = event.detail?.action?.includes('add');
      debouncedRefresh(isAddOperation);
    };

    const handleDirectRefresh = (event) => {
      console.log('🛒 MiniCart: Direct refresh event received', event.detail);
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
      console.log('🛒 MiniCart: LoadCart already in progress, skipping');
      return loadCartRef.current;
    }

    const refreshId = Date.now();
    console.log(`🛒 MiniCart: loadCart started (${refreshId})`);

    const loadCartPromise = (async () => {
      try {
        setLoading(true);

        // Use simplified cart service
        const cartResult = await cartService.getCart();
        console.log(`🛒 MiniCart: Cart result (${refreshId}):`, {
          success: cartResult.success,
          itemCount: cartResult.items?.length || 0,
          items: cartResult.items
        });

        if (cartResult.success && cartResult.items) {
          console.log(`🛒 MiniCart: Setting cart items (${refreshId}):`, cartResult.items.length);

          // Check if this backend data is fresher than our optimistic update
          const currentItemCount = cartItems.length;
          const backendItemCount = cartResult.items.length;
          const hasOptimisticItems = cartItems.some(item => item.optimistic);

          console.log(`📊 Data comparison - Current: ${currentItemCount}, Backend: ${backendItemCount}, HasOptimistic: ${hasOptimisticItems}`);

          // Don't overwrite optimistic data with stale backend data
          if (hasOptimisticItems && backendItemCount < currentItemCount) {
            console.log('⚠️ Backend data appears stale, keeping optimistic data');
            // Keep current optimistic data, but update product details
            const realItems = cartResult.items.filter(item => !item.optimistic);
            if (realItems.length > cartItems.filter(item => !item.optimistic).length) {
              // Backend has more real items, merge them
              const optimisticItems = cartItems.filter(item => item.optimistic);
              setCartItems([...realItems, ...optimisticItems]);
              console.log('🔄 Merged real + optimistic data');
            }
            // Don't update setLastRefreshId to allow retry
            return;
          }

          // Backend data is fresh, use it
          const realItems = cartResult.items.filter(item => !item.optimistic);
          setCartItems(realItems);
          setLastRefreshId(refreshId);

          // Clear optimistic update tracking if backend data is sufficient
          if (lastOptimisticUpdate && backendItemCount >= currentItemCount) {
            setLastOptimisticUpdate(null);
            console.log('✅ Backend data confirmed optimistic update');
          }

          // Load product details for cart items
          if (cartResult.items.length > 0) {
            const productDetails = {};
            for (const item of cartResult.items) {
              if (!productDetails[item.product_id]) {
                try {
                  const result = await StorefrontProduct.filter({ id: item.product_id });
                  const products = Array.isArray(result) ? result : [];
                  if (products.length > 0) {
                    const foundProduct = products[0];
                    if (foundProduct.id === item.product_id) {
                      productDetails[item.product_id] = foundProduct;
                    } else {
                      console.error(`MiniCart: ID MISMATCH! Requested: ${item.product_id}, Got: ${foundProduct.id} (${foundProduct.name})`);
                      // Don't add mismatched product
                    }
                  }
                } catch (error) {
                  console.error(`Failed to load product ${item.product_id}:`, error);
                }
              }
            }
            setCartProducts(productDetails);
          } else {
            setCartProducts({});
          }
        } else {
          console.log(`🛒 MiniCart: Empty or failed cart result (${refreshId})`);
          setCartItems([]);
          setCartProducts({});
          setLastRefreshId(refreshId);
        }

      } catch (error) {
        console.error(`🛒 MiniCart: Error loading cart (${refreshId}):`, error);
        setCartItems([]);
        setCartProducts({});
        setLastRefreshId(refreshId);
      } finally {
        console.log(`🛒 MiniCart: loadCart completed (${refreshId}), setting loading to false`);
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

      // Update local state immediately for instant UI response
      const updatedItems = cartItems.filter(item => item.id !== cartItemId);
      setCartItems(updatedItems);

      // Dispatch immediate update for other components
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const result = await cartService.updateCart(updatedItems, store.id);
      
      if (result.success) {
        // Reload in background to sync with server
        await loadCart();
      } else {
        console.error('Failed to remove item:', result.error);
        // Revert local state on error
        await loadCart();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const product = cartProducts[item.product_id];
      if (!product) return total;
      
      // Use the stored price from cart (which should be the sale price)
      let itemPrice = formatPrice(item.price);
      
      // If no stored price, calculate from product (use sale price if available)
      if (!item.price) {
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
      
      return total + (displayItemPrice * formatPrice(item.quantity));
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
                  const product = cartProducts[item.product_id];
                  if (!product) {
                    return null;
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
                        src={product.images?.[0] || 'https://placehold.co/50x50?text=No+Image'} 
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
