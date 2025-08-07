const StorageInterface = require('./storage-interface');
const { v4: uuidv4 } = require('uuid');

/**
 * Flexible Storage Manager
 * Makes it easy to change media paths by switching between different storage providers
 * All providers implement the same interface for consistent behavior
 */
class StorageManager {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
    this.fallbackProvider = null;
    
    // Initialize available providers
    this.initializeProviders();
  }

  /**
   * Initialize and register all available storage providers
   */
  initializeProviders() {
    // Register Supabase provider (if available)
    try {
      const SupabaseStorageProvider = require('./supabase-storage-provider');
      this.registerProvider('supabase', new SupabaseStorageProvider());
    } catch (e) {
      console.log('Supabase storage provider not available:', e.message);
    }

    // Register Local storage provider (if available)
    try {
      const LocalStorageProvider = require('./local-storage-provider');
      this.registerProvider('local', new LocalStorageProvider());
    } catch (e) {
      console.log('Local storage provider not available:', e.message);
    }

    // Register AWS S3 provider (if available)
    try {
      const S3StorageProvider = require('./s3-storage-provider');
      this.registerProvider('s3', new S3StorageProvider());
    } catch (e) {
      console.log('S3 storage provider not available:', e.message);
    }

    // Register Google Cloud Storage provider (if available)
    try {
      const GCSStorageProvider = require('./gcs-storage-provider');
      this.registerProvider('gcs', new GCSStorageProvider());
    } catch (e) {
      console.log('GCS storage provider not available:', e.message);
    }

    // Set default provider (prefer cloud storage)
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.includes('supabase')) {
      this.setProvider('supabase');
    } else if (availableProviders.includes('s3')) {
      this.setProvider('s3');
    } else if (availableProviders.includes('gcs')) {
      this.setProvider('gcs');
    } else if (availableProviders.includes('local')) {
      this.setProvider('local');
    }
  }

  /**
   * Register a storage provider
   * @param {string} name - Provider name
   * @param {StorageInterface} provider - Provider instance
   */
  registerProvider(name, provider) {
    if (!(provider instanceof StorageInterface)) {
      console.warn(`Provider '${name}' does not implement StorageInterface`);
    }
    this.providers.set(name, provider);
    console.log(`📦 Registered storage provider: ${name}`);
  }

  /**
   * Set the active storage provider (easily change media paths!)
   * @param {string} providerName - Name of the provider to use
   */
  setProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Storage provider '${providerName}' is not registered`);
    }
    this.currentProvider = this.providers.get(providerName);
    console.log(`🔄 Switched to storage provider: ${providerName} - All media paths will now use ${providerName}`);
  }

  /**
   * Get current active provider
   * @returns {StorageInterface} Current storage provider
   */
  getCurrentProvider() {
    if (!this.currentProvider) {
      throw new Error('No storage provider is currently set. Call setProvider() first.');
    }
    return this.currentProvider;
  }

  /**
   * Get list of available providers
   * @returns {Array<string>} Provider names
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Upload a file using the current provider with fallback support
   * @param {string} storeId - Store identifier
   * @param {Object} file - File object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with provider info
   */
  async uploadFile(storeId, file, options = {}) {
    try {
      const provider = this.getCurrentProvider();
      const result = await provider.uploadFile(storeId, file, options);
      
      return {
        ...result,
        provider: provider.getProviderName(),
        fallbackUsed: false
      };
    } catch (error) {
      console.error(`Primary provider (${this.currentProvider?.getProviderName()}) failed:`, error.message);
      
      // Try fallback provider if available
      if (this.fallbackProvider && this.fallbackProvider !== this.currentProvider) {
        console.log(`🔄 Attempting fallback to ${this.fallbackProvider.getProviderName()}...`);
        try {
          const result = await this.fallbackProvider.uploadFile(storeId, file, options);
          return {
            ...result,
            provider: this.fallbackProvider.getProviderName(),
            fallbackUsed: true
          };
        } catch (fallbackError) {
          console.error(`Fallback provider also failed:`, fallbackError.message);
          throw new Error(`Both primary and fallback storage providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param {string} storeId - Store identifier
   * @param {Array} files - Array of file objects
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleFiles(storeId, files, options = {}) {
    const provider = this.getCurrentProvider();
    return await provider.uploadMultipleFiles(storeId, files, options);
  }

  /**
   * Delete a file
   * @param {string} storeId - Store identifier
   * @param {string} filePath - Path to file
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(storeId, filePath, bucket = null) {
    const provider = this.getCurrentProvider();
    return await provider.deleteFile(storeId, filePath, bucket);
  }

  /**
   * List files
   * @param {string} storeId - Store identifier
   * @param {string} folder - Folder path
   * @param {Object} options - List options
   * @returns {Promise<Object>} File list
   */
  async listFiles(storeId, folder = null, options = {}) {
    const provider = this.getCurrentProvider();
    return await provider.listFiles(storeId, folder, options);
  }

  /**
   * Get storage statistics
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} Storage stats
   */
  async getStorageStats(storeId) {
    const provider = this.getCurrentProvider();
    return await provider.getStorageStats(storeId);
  }

  /**
   * Switch to a different provider (makes changing media paths easy!)
   * @param {string} newProviderName - Name of the new provider
   * @param {string} storeId - Store ID for testing connection
   * @returns {Promise<Object>} Switch result
   */
  async switchProvider(newProviderName, storeId = null) {
    if (!this.providers.has(newProviderName)) {
      throw new Error(`Provider '${newProviderName}' is not registered`);
    }

    const oldProvider = this.currentProvider?.getProviderName();
    const newProvider = this.providers.get(newProviderName);

    // Test connection if store ID provided
    if (storeId) {
      try {
        await newProvider.testConnection(storeId);
      } catch (error) {
        throw new Error(`Cannot switch to '${newProviderName}': connection test failed - ${error.message}`);
      }
    }

    this.setProvider(newProviderName);

    return {
      success: true,
      message: `Successfully switched from '${oldProvider}' to '${newProviderName}' - All media paths will now use ${newProviderName}`,
      oldProvider,
      newProvider: newProviderName
    };
  }

  /**
   * Get current provider name
   * @returns {string} Current provider name
   */
  getCurrentProviderName() {
    return this.currentProvider ? this.currentProvider.getProviderName() : null;
  }

  /**
   * Test connection to current provider
   * @param {string} storeId - Store identifier  
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(storeId) {
    const provider = this.getCurrentProvider();
    return await provider.testConnection(storeId);
  }

  /**
   * Set fallback provider for redundancy
   * @param {string} providerName - Name of the fallback provider
   */
  setFallbackProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Fallback storage provider '${providerName}' is not registered`);
    }
    this.fallbackProvider = this.providers.get(providerName);
    console.log(`🛡️  Set fallback storage provider: ${providerName}`);
  }
}

module.exports = new StorageManager();