/**
 * Unified Store Context Utility
 * Provides consistent access to store information across the application
 */

import { useStore } from '@/components/storefront/StoreProvider';
import { useStoreSlug } from '@/hooks/useStoreSlug';
import { getStoreSlugFromPublicUrl } from '@/utils/urlUtils';

/**
 * Hook that provides comprehensive store context for API calls and components
 * @returns {Object} Store context with various identifiers and utilities
 */
export const useStoreContext = () => {
  const { store, loading } = useStore() || {};
  const { storeSlug, isStoreContext } = useStoreSlug();

  // Determine the best store identifier available
  const getStoreIdentifier = () => {
    // Priority: store.id > store.slug > URL slug > store.code > fallback
    if (store?.id) return store.id;
    if (store?.slug) return store.slug;
    if (storeSlug) return storeSlug;
    if (store?.code) return store.code;
    
    // Last resort: try to extract from current URL
    const urlSlug = getStoreSlugFromPublicUrl(window.location.pathname);
    return urlSlug || null;
  };

  // Get store ID specifically for API calls
  const getStoreId = () => {
    return store?.id || null;
  };

  // Get store slug for URL generation
  const getStoreSlug = () => {
    return store?.slug || storeSlug || store?.code || null;
  };

  // Create API headers with store context
  const getApiHeaders = (additionalHeaders = {}) => {
    const headers = { ...additionalHeaders };
    
    const storeId = getStoreId();
    if (storeId) {
      headers['x-store-id'] = storeId;
    }

    return headers;
  };

  // Create API request config with store context
  const getApiConfig = (config = {}) => {
    const storeHeaders = getApiHeaders(config.headers);
    
    return {
      ...config,
      headers: storeHeaders
    };
  };

  return {
    // Store data
    store,
    loading,
    isStoreContext,
    
    // Identifier getters
    getStoreId,
    getStoreSlug,
    getStoreIdentifier,
    
    // API utilities
    getApiHeaders,
    getApiConfig,
    
    // Computed values for convenience
    storeId: getStoreId(),
    storeSlug: getStoreSlug(),
    storeIdentifier: getStoreIdentifier(),
    
    // Quick checks
    hasStore: !!store,
    hasStoreId: !!getStoreId(),
    hasStoreSlug: !!getStoreSlug()
  };
};

/**
 * Non-hook version for use in non-React contexts
 * @returns {Object} Store context utilities
 */
export const getStoreContextUtils = () => {
  // Extract from URL as fallback
  const urlSlug = getStoreSlugFromPublicUrl(window.location.pathname);
  
  return {
    getStoreSlugFromUrl: () => urlSlug,
    createApiHeaders: (storeId, additionalHeaders = {}) => ({
      ...additionalHeaders,
      ...(storeId && { 'x-store-id': storeId })
    })
  };
};

/**
 * Utility to normalize file paths for API calls that require src/ prefix
 * @param {string} filePath - The file path to normalize
 * @returns {string} Normalized file path with src/ prefix
 */
export const normalizeFilePath = (filePath) => {
  if (!filePath) return '';
  return filePath.startsWith('src/') ? filePath : `src/${filePath}`;
};

/**
 * Combined utility for API calls that need both store context and file path normalization
 * @param {string} filePath - The file path to normalize
 * @param {string} storeId - The store ID for headers
 * @param {Object} additionalHeaders - Any additional headers
 * @returns {Object} API config with normalized path and headers
 */
export const createStoreApiConfig = (filePath, storeId, additionalHeaders = {}) => {
  return {
    normalizedPath: normalizeFilePath(filePath),
    config: {
      headers: {
        ...additionalHeaders,
        ...(storeId && { 'x-store-id': storeId })
      }
    }
  };
};

export default useStoreContext;