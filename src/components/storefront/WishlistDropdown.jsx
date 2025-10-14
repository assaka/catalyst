
import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomerWishlist, StorefrontProduct, CustomerAuth } from '@/api/storefront-entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider'; // FIXED: Corrected import path
import { formatPrice } from '@/utils/priceUtils';
import { t } from '@/utils/translationHelper';

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

// Session handling removed - now using proper customer authentication

export default function WishlistDropdown({ iconVariant = 'outline' }) {
  const { store, settings, taxes, selectedCountry } = useStore(); // Added store context
  const [wishlistItems, setWishlistItems] = useState([]);
  const [user, setUser] = useState(null); // Preserve user state
  const [loading, setLoading] = useState(false); // Changed initial loading state to false

  // Choose icon based on variant
  const getWishlistIcon = () => {
    switch (iconVariant) {
      case 'filled':
        return <Heart className="w-5 h-5 fill-current" />;
      case 'outline':
      default:
        return <Heart className="w-5 h-5" />;
    }
  };

  // Renamed from loadWishlist to loadWishlistItems
  const loadWishlistItems = async () => {
    try {
      setLoading(true);

      // Try to get current user (only if authenticated with a token)
      let currentUser = null;
      if (CustomerAuth.isAuthenticated()) {
        currentUser = await CustomerAuth.me().catch(() => null);
      }
      setUser(currentUser);

      // Load wishlist items - this should work for both authenticated and guest users
      const result = await retryApiCall(() => CustomerWishlist.getItems(store?.id)).catch((error) => {
        console.warn("WishlistDropdown: Could not load wishlist items:", error.message);
        return [];
      });
      const items = Array.isArray(result) ? result : [];

      if (items.length > 0) {
        const productIds = [...new Set(items.map(item => item.product_id))];
        
        // Load products individually since bulk filter might not work
        const productPromises = productIds.map(async (productId) => {
          try {
            await delay(200); // Small delay between requests
            const response = await retryApiCall(() => StorefrontProduct.findById(productId));
            
            // Handle wrapped response structure
            let product = null;
            if (response && response.success && response.data) {
              product = response.data;
            } else if (response && !response.success) {
              product = response; // Direct product object
            }
            
            return product;
          } catch (error) {
            console.warn(`WishlistDropdown: Could not load product ${productId}:`, error.message);
            return null;
          }
        });

        const products = (await Promise.all(productPromises)).filter(Boolean);

        const productLookup = products.reduce((acc, product) => {
          if (product && product.id) acc[product.id] = product;
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
    // Load wishlist for both authenticated and guest users
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
    try {
      await retryApiCall(() => CustomerWishlist.removeItem(productId, store?.id));
      window.dispatchEvent(new CustomEvent('wishlistUpdated')); // Dispatch global event to trigger reload
    } catch (error) {
      console.error("WishlistDropdown: Error removing item from wishlist:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {getWishlistIcon()}
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {wishlistItems.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="p-4">
          <h4 className="font-medium leading-none mb-4">{t('wishlist', settings)}</h4>
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
                    <a href={getExternalStoreUrl(store?.slug, `product/${item.product?.slug || item.product_id}`, getStoreBaseUrl(store))}>
                      <p className="text-sm font-medium truncate hover:underline">{item.product?.name}</p>
                    </a>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.product?.price)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveFromWishlist(item.product_id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('your_wishlist_is_empty', settings)}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
