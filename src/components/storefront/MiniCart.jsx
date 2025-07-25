
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Cart } from '@/api/entities';
import { Product } from '@/api/entities';
import { User } from '@/api/entities';
import { useStore } from '@/components/storefront/StoreProvider';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function MiniCart({ cartUpdateTrigger }) {
  const { store } = useStore();
  const [cartItems, setCartItems] = useState([]);
  const [cartProducts, setCartProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Load user once
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Load cart on mount and when triggered
  useEffect(() => {
    loadCart();
  }, [user, cartUpdateTrigger]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('MiniCart: Cart update event received');
      loadCart();
    };
    
    const handleStorageChange = () => {
      console.log('MiniCart: Storage change event received');
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
      }

      let cartItems = [];
      
      // Use direct API call instead of Cart.filter() since cart endpoint has different structure
      const params = new URLSearchParams();
      if (user?.id) {
        params.append('user_id', user.id);
      } else {
        params.append('session_id', sessionId);
      }
      
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com'}/api/cart?${params.toString()}`;
      console.log('🛒 MiniCart: Calling cart API directly:', apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();
      console.log('🛒 MiniCart: Direct API response:', result);
      
      if (result.success && result.data && result.data.items) {
        cartItems = Array.isArray(result.data.items) ? result.data.items : [];
        console.log('🛒 MiniCart: Extracted cart items:', cartItems);
      }

      console.log('🛒 MiniCart: Extracted cart items:', cartItems);
      setCartItems(cartItems);

      // Load product details for cart items
      if (cartItems && cartItems.length > 0) {
        const productDetails = {};
        for (const item of cartItems) {
          if (!productDetails[item.product_id]) {
            try {
              const result = await Product.filter({ id: item.product_id });
              const products = Array.isArray(result) ? result : [];
              if (products.length > 0) {
                productDetails[item.product_id] = products[0];
              }
            } catch (error) {
              console.warn(`Failed to load product ${item.product_id}:`, error);
            }
          }
        }
        setCartProducts(productDetails);
      }

    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
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
        console.error('🛒 MiniCart: No store context available for update');
        return;
      }

      // Update the local cart items array
      const updatedItems = cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      );

      // Find the cart record and update it
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
      }

      const updateData = { 
        items: updatedItems,
        store_id: store.id
      };
      if (user?.id) {
        updateData.user_id = user.id;
      } else {
        updateData.session_id = sessionId;
      }

      // Use POST to update cart (not PUT with item ID)
      console.log('🛒 MiniCart: Updating cart with data:', updateData);
      const result = await Cart.create(updateData);
      console.log('🛒 MiniCart: Update result:', result);
      
      // Small delay before reloading
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadCart();
      
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      if (!store?.id) {
        console.error('🛒 MiniCart: No store context available for remove');
        return;
      }

      // Remove item from local cart items array
      const updatedItems = cartItems.filter(item => item.id !== cartItemId);

      // Find the cart record and update it
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
      }

      const updateData = { 
        items: updatedItems,
        store_id: store.id
      };
      if (user?.id) {
        updateData.user_id = user.id;
      } else {
        updateData.session_id = sessionId;
      }

      // Use POST to update cart
      console.log('🛒 MiniCart: Removing item from cart with data:', updateData);
      const result = await Cart.create(updateData);
      console.log('🛒 MiniCart: Remove result:', result);
      
      // Small delay before reloading
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadCart();
      
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
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
      let itemPrice = parseFloat(item.price || 0);
      
      // If no stored price, calculate from product (use sale price if available)
      if (!item.price) {
        itemPrice = parseFloat(product.price || 0);
        if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
          itemPrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
        }
      }
      
      // Add selected options price
      if (item.selected_options && Array.isArray(item.selected_options)) {
        const optionsPrice = item.selected_options.reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);
        itemPrice += optionsPrice;
      }
      
      return total + (itemPrice * item.quantity);
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
                  if (!product) return null;
                  
                  // Use the stored price from cart (which should be the sale price)
                  let basePrice = parseFloat(item.price || 0);
                  
                  // If no stored price, calculate from product (use sale price if available)
                  if (!item.price) {
                    basePrice = parseFloat(product.price || 0);
                    if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
                      basePrice = Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0));
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
                        <p className="text-sm text-gray-500">${basePrice.toFixed(2)} each</p>
                        
                        {item.selected_options && item.selected_options.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.selected_options.map((option, idx) => (
                              <div key={idx}>+ {option.name} (+${parseFloat(option.price || 0).toFixed(2)})</div>
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
                  <span className="font-semibold">Total: ${getTotalPrice().toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                  <Button asChild className="w-full btn-view-cart" onClick={() => setIsOpen(false)}>
                    <Link to={createPageUrl('Cart')}>
                      View Cart
                    </Link>
                  </Button>
                  <Button asChild className="w-full btn-checkout" onClick={() => setIsOpen(false)}>
                    <Link to={createPageUrl('Checkout')}>
                      Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
