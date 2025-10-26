import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 *
 * This configuration drastically reduces API calls by:
 * - Automatically deduplicating simultaneous requests to the same endpoint
 * - Caching responses with intelligent TTL
 * - Implementing stale-while-revalidate pattern
 * - Providing retry logic with exponential backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long before data is considered stale (but still usable)
      staleTime: 60000, // 1 minute - data is fresh for this duration

      // Cache time: How long unused data stays in cache
      gcTime: 300000, // 5 minutes (formerly cacheTime in v4)

      // Retry configuration
      retry: 2, // Retry failed requests up to 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch when reconnecting to network
      refetchOnMount: false, // Don't refetch on component mount if data exists

      // Enable request deduplication (default: true, but being explicit)
      structuralSharing: true,

      // Network mode: only fetch when online
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query key management for consistency and type safety
 */
export const queryKeys = {
  // User and Auth
  user: {
    all: ['user'],
    me: () => [...queryKeys.user.all, 'me'],
    profile: (userId) => [...queryKeys.user.all, 'profile', userId],
  },

  // Store
  store: {
    all: ['store'],
    bySlug: (slug) => [...queryKeys.store.all, 'slug', slug],
    byId: (id) => [...queryKeys.store.all, 'id', id],
  },

  // Products
  product: {
    all: ['product'],
    bySlug: (slug, storeId, lang) => [...queryKeys.product.all, 'slug', slug, storeId, lang],
    byId: (id) => [...queryKeys.product.all, 'id', id],
    byCategory: (categoryId, filters) => [...queryKeys.product.all, 'category', categoryId, filters],
    related: (productId) => [...queryKeys.product.all, 'related', productId],
  },

  // Wishlist
  wishlist: {
    all: ['wishlist'],
    items: (storeId) => [...queryKeys.wishlist.all, 'items', storeId],
  },

  // Cart
  cart: {
    all: ['cart'],
    items: (sessionId, userId) => [...queryKeys.cart.all, 'items', sessionId, userId],
  },

  // Translations
  translation: {
    all: ['translation'],
    uiLabels: (lang) => [...queryKeys.translation.all, 'ui-labels', lang],
  },

  // Categories
  category: {
    all: ['category'],
    list: (storeId) => [...queryKeys.category.all, 'list', storeId],
    byId: (id) => [...queryKeys.category.all, 'id', id],
  },

  // Attributes
  attribute: {
    all: ['attribute'],
    list: (storeId) => [...queryKeys.attribute.all, 'list', storeId],
    filterable: (storeId) => [...queryKeys.attribute.all, 'filterable', storeId],
  },

  // Taxes
  tax: {
    all: ['tax'],
    list: (storeId) => [...queryKeys.tax.all, 'list', storeId],
  },

  // Product Labels
  productLabel: {
    all: ['productLabel'],
    list: (storeId) => [...queryKeys.productLabel.all, 'list', storeId],
  },

  // SEO
  seo: {
    all: ['seo'],
    templates: (storeId) => [...queryKeys.seo.all, 'templates', storeId],
    settings: (storeId) => [...queryKeys.seo.all, 'settings', storeId],
  },

  // Slot Configurations
  slot: {
    all: ['slot'],
    config: (storeId, pageType) => [...queryKeys.slot.all, 'config', storeId, pageType],
  },

  // Languages
  language: {
    all: ['language'],
    list: () => [...queryKeys.language.all, 'list'],
  },

  // CMS
  cms: {
    all: ['cms'],
    blocks: (storeId) => [...queryKeys.cms.all, 'blocks', storeId],
    pages: (storeId) => [...queryKeys.cms.all, 'pages', storeId],
  },
};

/**
 * Helper to invalidate related queries
 * Usage: invalidateQueries(queryClient, queryKeys.product.all)
 */
export const invalidateQueries = (client, queryKey) => {
  return client.invalidateQueries({ queryKey });
};

/**
 * Helper to prefetch a query
 * Usage: prefetchQuery(queryClient, queryKeys.product.bySlug('my-product'), fetchFunction)
 */
export const prefetchQuery = (client, queryKey, queryFn) => {
  return client.prefetchQuery({ queryKey, queryFn });
};
