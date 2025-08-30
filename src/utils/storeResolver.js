/**
 * Frontend Store Resolver Utility
 * Provides methods to resolve store ID from various sources
 */

import apiClient from '@/api/client';

class StoreResolver {
  constructor() {
    this.cachedStoreId = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current store ID with multiple fallback methods
   * @returns {Promise<string|null>} Store ID or null
   */
  async getCurrentStoreId() {
    try {
      // Check cache first
      if (this.cachedStoreId && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        console.log('🏪 StoreResolver: Using cached store ID:', this.cachedStoreId);
        return this.cachedStoreId;
      }

      // Try to get from API using backend storeResolver middleware
      try {
        console.log('🏪 StoreResolver: Fetching store ID from API...');
        const response = await apiClient.get('stores/current');
        
        if (response.success && response.data?.id) {
          const storeId = response.data.id;
          console.log('✅ StoreResolver: Got store ID from API:', storeId);
          
          // Cache the result
          this.cachedStoreId = storeId;
          this.cacheExpiry = Date.now() + this.cacheTimeout;
          
          return storeId;
        }
      } catch (apiError) {
        console.warn('⚠️ StoreResolver: API method failed:', apiError.message);
      }

      // Fallback 1: localStorage selectedStoreId
      const selectedStoreId = localStorage.getItem('selectedStoreId');
      if (selectedStoreId) {
        console.log('🏪 StoreResolver: Using selectedStoreId from localStorage:', selectedStoreId);
        this.cachedStoreId = selectedStoreId;
        this.cacheExpiry = Date.now() + this.cacheTimeout;
        return selectedStoreId;
      }

      // Fallback 2: localStorage storeId
      const storeId = localStorage.getItem('storeId');
      if (storeId) {
        console.log('🏪 StoreResolver: Using storeId from localStorage:', storeId);
        this.cachedStoreId = storeId;
        this.cacheExpiry = Date.now() + this.cacheTimeout;
        return storeId;
      }

      // Fallback 3: Try to get user's first store
      try {
        console.log('🏪 StoreResolver: Fetching user stores...');
        const storesResponse = await apiClient.get('stores');
        
        if (storesResponse.success && storesResponse.data?.length > 0) {
          const firstStore = storesResponse.data[0];
          console.log('🏪 StoreResolver: Using first available store:', firstStore.id);
          
          // Cache and also save to localStorage
          this.cachedStoreId = firstStore.id;
          this.cacheExpiry = Date.now() + this.cacheTimeout;
          localStorage.setItem('selectedStoreId', firstStore.id);
          
          return firstStore.id;
        }
      } catch (storesError) {
        console.warn('⚠️ StoreResolver: Failed to fetch stores:', storesError.message);
      }

      console.error('❌ StoreResolver: No store ID found through any method');
      return null;

    } catch (error) {
      console.error('❌ StoreResolver: Error resolving store ID:', error);
      return null;
    }
  }

  /**
   * Clear cached store ID (force refresh on next call)
   */
  clearCache() {
    console.log('🗑️ StoreResolver: Clearing cache');
    this.cachedStoreId = null;
    this.cacheExpiry = null;
  }

  /**
   * Set store ID manually (useful for testing or manual store selection)
   * @param {string} storeId - Store ID to set
   */
  setStoreId(storeId) {
    console.log('🏪 StoreResolver: Manually setting store ID:', storeId);
    this.cachedStoreId = storeId;
    this.cacheExpiry = Date.now() + this.cacheTimeout;
    localStorage.setItem('selectedStoreId', storeId);
  }

  /**
   * Get current cached store ID without making API calls
   * @returns {string|null} Cached store ID or null
   */
  getCachedStoreId() {
    if (this.cachedStoreId && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cachedStoreId;
    }
    return localStorage.getItem('selectedStoreId') || localStorage.getItem('storeId') || null;
  }
}

// Export singleton instance
const storeResolver = new StoreResolver();
export default storeResolver;