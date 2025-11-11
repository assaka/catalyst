/**
 * Bootstrap Hook - Layer 1 Global Data
 *
 * Fetches all initial storefront data in a single API call.
 * This hook provides the foundation for the 3-layer data architecture.
 *
 * Layer 1 (Bootstrap): Global data loaded once per session
 * - Store configuration
 * - Languages
 * - Translations (UI labels)
 * - Categories (navigation)
 * - SEO settings
 * - SEO templates
 * - Wishlist
 * - User data
 * - Header slot configuration
 */

import { useQuery } from '@tanstack/react-query';
import { storefrontApiClient, StorefrontStore } from '@/api/storefront-entities';

/**
 * Helper hook to fetch store slug when we only have ID
 * @param {string} storeId - Store ID
 * @returns {Object} React Query result with store slug
 */
export function useStoreSlugById(storeId) {
  return useQuery({
    queryKey: ['store-slug', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      try {
        const result = await StorefrontStore.filter({ id: storeId });
        const store = Array.isArray(result) ? result[0] : null;
        return store?.slug || null;
      } catch (error) {
        console.error('Failed to fetch store slug:', error);
        return null;
      }
    },
    staleTime: 3600000, // 1 hour - slug rarely changes
    enabled: !!storeId,
  });
}

/**
 * Hook to fetch bootstrap data (Layer 1 - Global data)
 * This should be the PRIMARY data source for StoreProvider
 *
 * @param {string} storeSlug - Store slug or hostname
 * @param {string} language - Language code (e.g., 'en', 'es')
 * @returns {Object} React Query result with bootstrap data
 */
export function useStoreBootstrap(storeSlug, language) {
  return useQuery({
    queryKey: ['bootstrap', storeSlug, language],
    queryFn: async () => {
      if (!storeSlug) {
        throw new Error('Store slug is required for bootstrap');
      }

      const response = await storefrontApiClient.get('/api/public/storefront/bootstrap', {
        params: {
          slug: storeSlug,
          lang: language || 'en',
          session_id: localStorage.getItem('guestSessionId')
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Bootstrap failed');
      }

      return response.data.data;
    },
    staleTime: 900000, // 15 minutes - global data rarely changes
    gcTime: 1800000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!storeSlug, // Only run query if storeSlug is provided
  });
}

/**
 * Helper to determine store slug from various sources
 * @param {Object} location - React Router location object
 * @returns {string} Store slug
 */
export function determineStoreSlug(location) {
  const hostname = window.location.hostname;
  const path = location?.pathname || '';

  // Check for public URL pattern: /public/:slug
  const publicUrlMatch = path.match(/^\/public\/([^\/]+)/);
  if (publicUrlMatch) {
    return publicUrlMatch[1];
  }

  // Check for custom domain
  const isCustomDomain = !hostname.includes('vercel.app') &&
                        !hostname.includes('onrender.com') &&
                        !hostname.includes('localhost') &&
                        !hostname.includes('127.0.0.1');

  if (isCustomDomain) {
    return hostname;
  }

  // Fallback to localStorage
  const savedSlug = localStorage.getItem('selectedStoreSlug');
  if (savedSlug) {
    return savedSlug;
  }

  // Final fallback: use hamid2 for testing
  return 'hamid2';
}
