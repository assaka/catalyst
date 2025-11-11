
import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StorefrontProduct } from '@/api/storefront-entities';
import { getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { formatPrice } from '@/utils/priceUtils';
import { useTranslation } from '@/contexts/TranslationContext';
// React Query hooks for optimized wishlist management
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useApiQueries';

export default function WishlistDropdown({ iconVariant = 'outline' }) {
  const { t } = useTranslation();
  const { store, wishlist: bootstrapWishlist } = useStore();

  // Use bootstrap wishlist if available (no API call!), otherwise use React Query
  const shouldFetchWishlist = !bootstrapWishlist || bootstrapWishlist.length === 0;
  const { data: fetchedWishlist = [], isLoading, refetch } = useWishlist(store?.id, { enabled: shouldFetchWishlist });
  const removeFromWishlist = useRemoveFromWishlist();

  // Use bootstrap wishlist first, fallback to fetched
  const wishlistData = bootstrapWishlist || fetchedWishlist;

  const [wishlistItems, setWishlistItems] = useState([]);

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

  // Load product details for wishlist items
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([]);
        return;
      }

      try {
        const productIds = [...new Set(wishlistData.map(item => item.product_id))];

        // Load products in parallel (React Query will deduplicate if called elsewhere)
        const productPromises = productIds.map(async (productId) => {
          try {
            const response = await StorefrontProduct.findById(productId);

            // Handle wrapped response structure
            let product = null;
            if (response && response.success && response.data) {
              product = response.data;
            } else if (response && !response.success) {
              product = response;
            }

            return product;
          } catch (error) {
            console.warn(`WishlistDropdown: Could not load product ${productId}`);
            return null;
          }
        });

        const products = (await Promise.all(productPromises)).filter(Boolean);

        const productLookup = products.reduce((acc, product) => {
          if (product && product.id) acc[product.id] = product;
          return acc;
        }, {});

        const newWishlistItems = wishlistData.map(item => {
          const product = productLookup[item.product_id];
          return product ? { ...item, product } : null;
        }).filter(Boolean);

        setWishlistItems(newWishlistItems);
      } catch (error) {
        console.error("WishlistDropdown: Error loading product details:", error);
      }
    };

    loadProductDetails();
  }, [wishlistData]);

  // Listen for wishlist updates (for components not using React Query)
  useEffect(() => {
    const handleWishlistUpdate = () => {
      refetch(); // Refetch data from React Query cache
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, [refetch]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist.mutateAsync({ productId, storeId: store?.id });
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
        <div className="">
          <h3 className="font-semibold leading-none mb-4">{t('common.wishlist', 'Wishlist')}</h3>
          {isLoading ? (
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
                    <X className="h-4 w-4" />s
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">{t('common.your_wishlist_is_empty', 'Your wishlist is empty')}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
