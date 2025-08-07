const StorageInterface = require('./storage-interface');
const { v4: uuidv4 } = require('uuid');
const { MediaAsset } = require('../models');

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
   * Get storage provider for a specific store (store-aware)
   * Checks store configuration to determine best available provider
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} Provider info with type and instance
   */
  async getStorageProvider(storeId) {
    // First check if store has a default media storage provider configured
    try {
      const { Store } = require('../models');
      const store = await Store.findByPk(storeId);
      
      // Check for default_mediastorage_provider first, then fall back to default_database_provider
      const defaultProvider = store?.settings?.default_mediastorage_provider || 
                             store?.settings?.default_database_provider;
      
      if (defaultProvider) {
        console.log(`Store ${storeId} has default storage provider: ${defaultProvider}`);
        
        // Check if it's Supabase and configured
        if (defaultProvider === 'supabase' && this.providers.has('supabase')) {
          try {
            const supabaseIntegration = require('./supabase-integration');
            const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
            
            if (connectionStatus.connected) {
              return {
                type: 'supabase',
                provider: this.providers.get('supabase'),
                name: 'Supabase Storage'
              };
            }
          } catch (error) {
            console.log(`Supabase configured but not connected for store ${storeId}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log(`Could not check store default provider:`, error.message);
    }
    
    // Check if Supabase is configured for this store (fallback to direct check)
    if (this.providers.has('supabase')) {
      try {
        const supabaseIntegration = require('./supabase-integration');
        const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
        
        if (connectionStatus.connected) {
          return {
            type: 'supabase',
            provider: this.providers.get('supabase'),
            name: 'Supabase Storage'
          };
        }
      } catch (error) {
        console.log(`Supabase not available for store ${storeId}:`, error.message);
      }
    }

    // Check other providers in order of preference
    const preferenceOrder = ['s3', 'gcs'];
    for (const providerType of preferenceOrder) {
      if (this.providers.has(providerType)) {
        // For cloud providers, check store-specific configuration
        // TODO: Add store-specific configuration checks for S3, GCS, etc.
        return {
          type: providerType,
          provider: this.providers.get(providerType),
          name: this.getProviderDisplayName(providerType)
        };
      }
    }
    
    // No providers available - provide a helpful error message
    throw new Error('No storage provider is configured for this store. Please connect Supabase, AWS S3, or Google Cloud Storage in the integrations settings.');
  }

  /**
   * Check if a provider is available for a specific store
   * @param {string} providerType - Provider type to check
   * @param {string} storeId - Store identifier
   * @returns {Promise<boolean>} True if provider is available
   */
  async isProviderAvailable(providerType, storeId) {
    if (!this.providers.has(providerType)) {
      return false;
    }

    if (providerType === 'supabase') {
      try {
        const supabaseIntegration = require('./supabase-integration');
        const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
        return connectionStatus.connected;
      } catch (error) {
        return false;
      }
    }

    // For other providers, assume available if registered
    // TODO: Add proper configuration checks
    return true;
  }

  /**
   * Get display name for provider
   * @param {string} providerType - Provider type
   * @returns {string} Display name
   */
  getProviderDisplayName(providerType) {
    const names = {
      'supabase': 'Supabase Storage',
      'gcs': 'Google Cloud Storage', 
      's3': 'Amazon S3',
      'local': 'Local Storage'
    };
    return names[providerType] || providerType;
  }

  /**
   * Get list of available providers
   * @returns {Array<string>} Provider names
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Upload a file using the store-configured provider with fallback support
   * @param {string} storeId - Store identifier
   * @param {Object} file - File object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with provider info
   */
  async uploadFile(storeId, file, options = {}) {
    try {
      const storeProvider = await this.getStorageProvider(storeId);
      const result = await storeProvider.provider.uploadFile(storeId, file, options);
      
      // Track file in media_assets table for all uploads
      // This ensures category, product, and library uploads all appear in Media Library
      try {
        // Determine the folder based on upload type
        let folder = 'library';
        if (options.folder === 'category' || options.type === 'category') {
          folder = 'category';
        } else if (options.folder === 'product' || options.folder === 'products' || options.type === 'product') {
          folder = 'product';
        } else if (options.folder) {
          folder = options.folder;
        }
        
        await MediaAsset.createFromUpload(storeId, {
          ...result,
          folder: folder,
          originalname: file.originalname,
          provider: storeProvider.type
        }, options.userId);
      } catch (dbError) {
        console.error('Failed to track media asset in database:', dbError.message);
        // Don't fail the upload if database tracking fails
      }
      
      return {
        ...result,
        provider: storeProvider.type,
        fallbackUsed: false
      };
    } catch (error) {
      console.error(`Storage provider error for store ${storeId}:`, error.message);
      
      // In production, if no storage provider is configured, throw a clear error
      if (error.message.includes('No storage provider is configured')) {
        throw new Error('No storage provider is configured. Please connect a storage provider (Supabase, AWS S3, or Google Cloud Storage) in the integrations settings.');
      }
      
      // Try fallback provider if available and not in production
      if (this.fallbackProvider && process.env.NODE_ENV !== 'production') {
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
          throw new Error(`Both store provider and fallback storage providers failed. Store: ${error.message}, Fallback: ${fallbackError.message}`);
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
    const storeProvider = await this.getStorageProvider(storeId);
    return await storeProvider.provider.uploadMultipleFiles(storeId, files, options);
  }

  /**
   * Delete a file
   * @param {string} storeId - Store identifier
   * @param {string} filePath - Path to file
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(storeId, filePath, bucket = null) {
    const storeProvider = await this.getStorageProvider(storeId);
    return await storeProvider.provider.deleteFile(storeId, filePath, bucket);
  }

  /**
   * List files
   * @param {string} storeId - Store identifier
   * @param {string} folder - Folder path
   * @param {Object} options - List options
   * @returns {Promise<Object>} File list
   */
  async listFiles(storeId, folder = null, options = {}) {
    const storeProvider = await this.getStorageProvider(storeId);
    const result = await storeProvider.provider.listFiles(storeId, folder, options);
    
    // Add provider info to the response
    return {
      ...result,
      provider: storeProvider.type
    };
  }

  /**
   * Get storage statistics
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} Storage stats
   */
  async getStorageStats(storeId) {
    const storeProvider = await this.getStorageProvider(storeId);
    return await storeProvider.provider.getStorageStats(storeId);
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
   * Test connection to store's configured provider
   * @param {string} storeId - Store identifier  
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(storeId) {
    const storeProvider = await this.getStorageProvider(storeId);
    return await storeProvider.provider.testConnection(storeId);
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