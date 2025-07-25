
import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wishlist } from '@/api/entities';
import { Product } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useStore } from '@/components/storefront/StoreProvider'; // FIXED: Corrected import path

// --- Start of helper functions ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 500;
        console.warn(`WishlistDropdown: Rate limit hit, retrying in ${delayTime.toFixed(0)}ms...`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};
// --- End of helper functions ---

const getSessionId = () => {
  let sid = localStorage.getItem('guest_session_id');
  if (!sid) {
    sid = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_session_id', sid);
  }
  return sid;
};

export default function WishlistDropdown() {
  const { store } = useStore(); // Added store context
  const [wishlistItems, setWishlistItems] = useState([]);
  const [user, setUser] = useState(null); // Preserve user state
  const [loading, setLoading] = useState(false); // Changed initial loading state to false

  // Renamed from loadWishlist to loadWishlistItems
  const loadWishlistItems = async () => {
    try {
      setLoading(true);
      const currentUser = await User.me().catch(() => null);
      setUser(currentUser); // Update user state

      const sessionId = getSessionId();
      const filter = currentUser?.id ? { user_id: currentUser.id } : { session_id: sessionId };

      const result = await retryApiCall(() => Wishlist.filter(filter));
      const items = Array.isArray(result) ? result : [];

      if (items.length > 0) {
        const productIds = [...new Set(items.map(item => item.product_id))];
        await delay(500); // Stagger calls
        const productResult = await retryApiCall(() => Product.filter({ id: { $in: productIds } }));
        const products = Array.isArray(productResult) ? productResult : [];

        const productLookup = products.reduce((acc, product) => {
          if (product) acc[product.id] = product;
          return acc;
        }, {});

        const newWishlistItems = items.map(item => {
          const product = productLookup[item.product_id];
          return product ? { ...item, product } : null;
        }).filter(Boolean);

        setWishlistItems(newWishlistItems);
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("WishlistDropdown: Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Listen for wishlist updates and store changes
  useEffect(() => {
    if (store?.id) {
      loadWishlistItems();
    }

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      if (store?.id) {
        loadWishlistItems();
      }
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, [store?.id]); // Dependency on store.id to trigger reload when store changes

  const handleRemoveFromWishlist = async (productId) => {
    const sessionId = getSessionId();
    const filter = user?.id ? { user_id: user.id, product_id: productId } : { session_id: sessionId, product_id: productId };

    try {
      const result = await retryApiCall(() => Wishlist.filter(filter));
      const existingItems = Array.isArray(result) ? result : [];
      if (existingItems.length > 0) {
        await retryApiCall(() => Wishlist.delete(existingItems[0].id));
        window.dispatchEvent(new CustomEvent('wishlistUpdated')); // Dispatch global event to trigger reload
      }
    } catch (error) {
      console.error("WishlistDropdown: Error removing item from wishlist:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Heart className="w-5 h-5" />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {wishlistItems.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="p-4">
          <h4 className="font-medium leading-none mb-4">Wishlist</h4>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="space-y-4">
              {wishlistItems.map(item => (
                <div key={item.id} className="flex items-center space-x-4">
                   <img
                    src={item.product?.images?.[0] || 'https://placehold.co/100x100'}
                    alt={item.product?.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={createPageUrl(`ProductDetail?id=${item.product_id}`)}>
                      <p className="text-sm font-medium truncate hover:underline">{item.product?.name}</p>
                    </Link>
                    <p className="text-sm text-gray-500">${parseFloat(item.product?.price || 0).toFixed(2)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveFromWishlist(item.product_id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
