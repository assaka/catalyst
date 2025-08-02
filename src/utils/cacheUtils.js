// Universal cache clearing utility for instant admin updates
export const clearStorefrontCache = (storeId, dataTypes = []) => {
  try {
    console.log('🧹 Clearing storefront cache for store:', storeId, 'types:', dataTypes);
    
    // Clear localStorage cache
    localStorage.removeItem('storeProviderCache');
    
    // Clear specific cache keys if provided
    const cacheKeysToClear = [];
    
    if (dataTypes.includes('categories')) {
      cacheKeysToClear.push(`categories-${storeId}`);
    }
    if (dataTypes.includes('taxes')) {
      cacheKeysToClear.push(`taxes-${storeId}`);
    }
    if (dataTypes.includes('labels')) {
      cacheKeysToClear.push(`labels-${storeId}`);
    }
    if (dataTypes.includes('attributes')) {
      cacheKeysToClear.push(`attributes-${storeId}`);
      cacheKeysToClear.push(`attr-sets-${storeId}`);
    }
    if (dataTypes.includes('seo-templates')) {
      cacheKeysToClear.push(`seo-templates-${storeId}`);
    }
    if (dataTypes.includes('cookie-consent')) {
      cacheKeysToClear.push(`cookie-consent-${storeId}`);
    }
    if (dataTypes.includes('stores')) {
      cacheKeysToClear.push(`store-slug-*`); // Clear all store cache keys
      cacheKeysToClear.push('first-store');
    }
    
    // If no specific types provided, clear common cache keys
    if (dataTypes.length === 0) {
      cacheKeysToClear = [
        `categories-${storeId}`,
        `taxes-${storeId}`,
        `labels-${storeId}`,
        `attributes-${storeId}`,
        `attr-sets-${storeId}`,
        `seo-templates-${storeId}`
      ];
    }
    
    // Call global cache clearing function if available
    if (typeof window !== 'undefined' && window.clearCacheKeys) {
      window.clearCacheKeys(cacheKeysToClear);
    } else if (typeof window !== 'undefined' && window.clearCache) {
      window.clearCache();
    }
    
    console.log('✅ Storefront cache cleared for types:', dataTypes);
    
  } catch (error) {
    console.error('❌ Failed to clear storefront cache:', error);
  }
};

// Specific cache clearing functions for common use cases
export const clearCategoriesCache = (storeId) => clearStorefrontCache(storeId, ['categories']);
export const clearTaxesCache = (storeId) => clearStorefrontCache(storeId, ['taxes']);
export const clearLabelsCache = (storeId) => clearStorefrontCache(storeId, ['labels']);
export const clearAttributesCache = (storeId) => clearStorefrontCache(storeId, ['attributes']);
export const clearSeoTemplatesCache = (storeId) => clearStorefrontCache(storeId, ['seo-templates']);
export const clearCookieConsentCache = (storeId) => clearStorefrontCache(storeId, ['cookie-consent']);
export const clearStoresCache = (storeId) => clearStorefrontCache(storeId, ['stores']);