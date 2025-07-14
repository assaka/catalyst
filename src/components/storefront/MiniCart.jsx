
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Cart } from '@/api/entities';
import { Product } from '@/api/entities';
import { User } from '@/api/entities';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function MiniCart({ cartUpdateTrigger }) {
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

      let cartData = [];
      
      if (user?.id) {
        // Load user's cart
        cartData = await Cart.filter({ user_id: user.id });
      } else {
        // Load guest cart
        cartData = await Cart.filter({ session_id: sessionId });
      }

      console.log('MiniCart: Loaded cart data:', cartData);
      setCartItems(Array.isArray(cartData) ? cartData : []);

      // Load product details for cart items
      if (cartData && cartData.length > 0) {
        const productDetails = {};
        for (const item of cartData) {
          if (!productDetails[item.product_id]) {
            try {
              const products = await Product.filter({ id: item.product_id });
              if (products && products.length > 0) {
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
      await Cart.update(cartItemId, { quantity: newQuantity });
      await loadCart();
      
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await Cart.delete(cartItemId);
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
                      basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
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
                              <div key={idx}>+ {option.name} (+${parseFloat(option.price).toFixed(2)})</div>
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
