
import React, { useState, useEffect } from 'react';
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

  // Load cart on mount and when triggered
  useEffect(() => {
    loadCart();
  }, [cartUpdateTrigger]);

  // Listen for cart updates with debouncing
  useEffect(() => {
    const handleCartUpdate = () => {
      debouncedLoadCart();
    };
    
    const handleStorageChange = () => {
      debouncedLoadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
      if (loadCartTimeout) {
        clearTimeout(loadCartTimeout);
      }
    };
  }, []);

  // Debounced load cart to prevent multiple rapid calls
  const debouncedLoadCart = () => {
    if (loadCartTimeout) {
      clearTimeout(loadCartTimeout);
    }
    
    const timeout = setTimeout(() => {
      loadCart();
    }, 300); // 300ms debounce
    
    setLoadCartTimeout(timeout);
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      
      // Use simplified cart service
      const cartResult = await cartService.getCart();
      
      if (cartResult.success && cartResult.items) {
        setCartItems(cartResult.items);
        
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
        }
      } else {
        setCartItems([]);
        setCartProducts({});
      }

    } catch (error) {
      console.error('MiniCart: Error loading cart:', error);
      setCartItems([]);
      setCartProducts({});
    } finally {
      setLoading(false);
    }
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
