/**
 * React Query Hooks for API Calls
 *
 * These hooks provide automatic request deduplication, caching, and retry logic
 * to significantly reduce the number of API calls made by the application.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryClient';
import { User } from '@/api/entities';
import {
  CustomerWishlist,
  StorefrontProduct,
  StorefrontStore,
  StorefrontCategory,
  StorefrontProductLabel,
  StorefrontTax,
  StorefrontAttribute,
  StorefrontAttributeSet,
  StorefrontSeoTemplate
} from '@/api/storefront-entities';
import api from '@/utils/api';
import { getCurrentLanguage } from '@/utils/translationUtils';

/**
 * Hook to fetch current user (auth/me)
 * Automatically deduplicates multiple simultaneous calls
 */
export const useUser = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: async () => {
      try {
        const userData = await User.me();
        return userData;
      } catch (error) {
        // Return null for unauthenticated users
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes - user data doesn't change often
    gcTime: 600000, // 10 minutes cache
    retry: 1, // Only retry once for auth calls
    ...options
  });
};

/**
 * Hook to fetch product by slug
 * Includes language in the cache key for proper i18n
 */
export const useProduct = (slug, storeId, options = {}) => {
  const language = getCurrentLanguage();

  return useQuery({
    queryKey: queryKeys.product.bySlug(slug, storeId, language),
    queryFn: async () => {
      const response = await fetch(
        `/api/public/products/by-slug/${encodeURIComponent(slug)}/full?store_id=${storeId}`,
        {
          headers: {
            'X-Language': language
          }
        }
      );

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const responseData = await response.json();
      return responseData.data;
    },
    enabled: !!(slug && storeId), // Only run if slug and storeId are provided
    staleTime: 120000, // 2 minutes - products change moderately
    gcTime: 300000, // 5 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch wishlist items
 * Supports both guest and authenticated users
 */
export const useWishlist = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.wishlist.items(storeId),
    queryFn: async () => {
      try {
        const items = await CustomerWishlist.getItems(storeId);
        return Array.isArray(items) ? items : [];
      } catch (error) {
        console.warn('Failed to load wishlist:', error);
        return [];
      }
    },
    enabled: !!storeId,
    staleTime: 30000, // 30 seconds - wishlist can change frequently
    gcTime: 60000, // 1 minute cache
    retry: 1, // Reduce retries for wishlist
    ...options
  });
};

/**
 * Hook to add item to wishlist
 */
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, storeId }) => {
      return await CustomerWishlist.addItem(productId, storeId);
    },
    onSuccess: (_, variables) => {
      // Invalidate wishlist queries to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.items(variables.storeId)
      });

      // Dispatch event for components not using React Query
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }
  });
};

/**
 * Hook to remove item from wishlist
 */
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, storeId }) => {
      return await CustomerWishlist.removeItem(productId, storeId);
    },
    onSuccess: (_, variables) => {
      // Invalidate wishlist queries to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.items(variables.storeId)
      });

      // Dispatch event for components not using React Query
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }
  });
};

/**
 * Hook to fetch UI translations
 */
export const useTranslations = (language, options = {}) => {
  return useQuery({
    queryKey: queryKeys.translation.uiLabels(language),
    queryFn: async () => {
      const response = await api.get(`/translations/ui-labels?lang=${language}`);

      if (response && response.success && response.data && response.data.labels) {
        return response.data.labels;
      }

      return {};
    },
    enabled: !!language,
    staleTime: 600000, // 10 minutes - translations rarely change
    gcTime: 1800000, // 30 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch store by slug
 */
export const useStore = (slug, options = {}) => {
  return useQuery({
    queryKey: queryKeys.store.bySlug(slug),
    queryFn: async () => {
      const stores = await StorefrontStore.filter({ slug });
      return stores?.[0] || null;
    },
    enabled: !!slug,
    staleTime: 600000, // 10 minutes - store data rarely changes
    gcTime: 1800000, // 30 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch categories
 */
export const useCategories = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.category.list(storeId),
    queryFn: async () => {
      const categories = await StorefrontCategory.filter({
        store_id: storeId,
        limit: 1000
      });
      return categories || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch product labels
 */
export const useProductLabels = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.productLabel.list(storeId),
    queryFn: async () => {
      const labels = await StorefrontProductLabel.filter({ store_id: storeId });
      return labels || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch taxes
 */
export const useTaxes = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.tax.list(storeId),
    queryFn: async () => {
      const taxes = await StorefrontTax.filter({ store_id: storeId });
      return taxes || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes - taxes don't change often
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch attributes
 */
export const useAttributes = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.attribute.list(storeId),
    queryFn: async () => {
      const attributes = await StorefrontAttribute.filter({ store_id: storeId });
      return attributes || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch filterable attributes
 */
export const useFilterableAttributes = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.attribute.filterable(storeId),
    queryFn: async () => {
      const attributes = await StorefrontAttribute.filter({
        store_id: storeId,
        is_filterable: true
      });
      return attributes || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch attribute sets
 */
export const useAttributeSets = (storeId, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.attribute.all, 'sets', storeId],
    queryFn: async () => {
      const sets = await StorefrontAttributeSet.filter({ store_id: storeId });
      return sets || [];
    },
    enabled: !!storeId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch SEO templates
 */
export const useSeoTemplates = (storeId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.seo.templates(storeId),
    queryFn: async () => {
      const templates = await StorefrontSeoTemplate.filter({ store_id: storeId });
      return templates || [];
    },
    enabled: !!storeId,
    staleTime: 600000, // 10 minutes - SEO templates rarely change
    gcTime: 1800000, // 30 minutes cache
    retry: 2,
    ...options
  });
};

/**
 * Hook to fetch cart items
 */
export const useCart = (sessionId, userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.cart.items(sessionId, userId),
    queryFn: async () => {
      // Import cartService dynamically to avoid circular dependencies
      const { default: cartService } = await import('@/services/cartService');
      return await cartService.getCart();
    },
    enabled: !!(sessionId || userId),
    staleTime: 10000, // 10 seconds - cart changes frequently
    gcTime: 30000, // 30 seconds cache
    retry: 1,
    ...options
  });
};
