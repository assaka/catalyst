const supabaseStorage = require('./supabase-storage');
const { v4: uuidv4 } = require('uuid');

class StorageManager {
  constructor() {
    this.providers = {
      'supabase': supabaseStorage,
      'gcs': null, // Will be loaded when needed
      's3': null,  // Will be loaded when needed
      'local': null // Will be loaded when needed
    };
    
    // Default fallback order
    this.fallbackOrder = ['supabase', 'gcs', 's3', 'local'];
  }

  /**
   * Get storage provider based on store configuration
   */
  async getStorageProvider(storeId) {
    try {
      // Check store's preferred storage configuration
      const storeConfig = await this.getStoreStorageConfig(storeId);
      
      if (storeConfig && storeConfig.preferredProvider) {
        const provider = this.providers[storeConfig.preferredProvider];
        if (provider && await this.isProviderAvailable(storeConfig.preferredProvider, storeId)) {
          return {
            provider: provider,
            type: storeConfig.preferredProvider,
            config: storeConfig
          };
        }
      }

      // Fallback to first available provider
      for (const providerType of this.fallbackOrder) {
        if (await this.isProviderAvailable(providerType, storeId)) {
          const provider = await this.loadProvider(providerType);
          return {
            provider: provider,
            type: providerType,
            config: storeConfig
          };
        }
      }

      // If no providers available, return local as last resort
      return {
        provider: await this.loadProvider('local'),
        type: 'local',
        config: null
      };

    } catch (error) {
      console.error('Error getting storage provider:', error);
      // Fallback to local storage
      return {
        provider: await this.loadProvider('local'),
        type: 'local',
        config: null
      };
    }
  }

  /**
   * Check if a storage provider is available for the store
   */
  async isProviderAvailable(providerType, storeId) {
    try {
      switch (providerType) {
        case 'supabase':
          const supabaseIntegration = require('./supabase-integration');
          return await supabaseIntegration.isConfigured(storeId);
          
        case 'gcs':
          return await this.checkGCSAvailability(storeId);
          
        case 's3':
          return await this.checkS3Availability(storeId);
          
        case 'local':
          return true; // Local is always available
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking ${providerType} availability:`, error);
      return false;
    }
  }

  /**
   * Load a storage provider dynamically
   */
  async loadProvider(providerType) {
    if (this.providers[providerType]) {
      return this.providers[providerType];
    }

    try {
      switch (providerType) {
        case 'gcs':
          const GCSStorage = require('./gcs-storage');
          this.providers[providerType] = new GCSStorage();
          return this.providers[providerType];
          
        case 's3':
          const S3Storage = require('./s3-storage');
          this.providers[providerType] = new S3Storage();
          return this.providers[providerType];
          
        case 'local':
          const LocalStorage = require('./local-storage');
          this.providers[providerType] = new LocalStorage();
          return this.providers[providerType];
          
        default:
          throw new Error(`Unknown storage provider: ${providerType}`);
      }
    } catch (error) {
      console.error(`Error loading ${providerType} provider:`, error);
      throw error;
    }
  }

  /**
   * Upload image using the best available provider
   */
  async uploadImage(storeId, file, options = {}) {
    const { provider, type, config } = await this.getStorageProvider(storeId);
    
    console.log(`📤 Uploading image via ${type} storage provider`);
    
    try {
      let result;
      
      // Call the appropriate upload method based on provider type
      if (type === 'supabase') {
        result = await provider.uploadImage(storeId, file, options);
      } else if (type === 'gcs') {
        result = await provider.uploadImage(storeId, file, { ...options, config });
      } else if (type === 's3') {
        result = await provider.uploadImage(storeId, file, { ...options, config });
      } else if (type === 'local') {
        result = await provider.uploadImage(file, options);
      }
      
      // Add provider info to result
      return {
        ...result,
        provider: type,
        fallbackUsed: false
      };
      
    } catch (error) {
      console.error(`❌ ${type} upload failed:`, error.message);
      
      // Try fallback providers
      return await this.uploadWithFallback(storeId, file, options, type);
    }
  }

  /**
   * Upload with fallback providers
   */
  async uploadWithFallback(storeId, file, options, failedProvider) {
    console.log(`🔄 Attempting fallback upload (${failedProvider} failed)`);
    
    const remainingProviders = this.fallbackOrder.filter(p => p !== failedProvider);
    
    for (const providerType of remainingProviders) {
      try {
        if (await this.isProviderAvailable(providerType, storeId)) {
          const provider = await this.loadProvider(providerType);
          
          let result;
          if (providerType === 'supabase') {
            result = await provider.uploadImage(storeId, file, options);
          } else if (providerType === 'gcs') {
            const config = await this.getStoreStorageConfig(storeId);
            result = await provider.uploadImage(storeId, file, { ...options, config });
          } else if (providerType === 's3') {
            const config = await this.getStoreStorageConfig(storeId);
            result = await provider.uploadImage(storeId, file, { ...options, config });
          } else if (providerType === 'local') {
            result = await provider.uploadImage(file, options);
          }
          
          console.log(`✅ Fallback upload successful via ${providerType}`);
          
          return {
            ...result,
            provider: providerType,
            fallbackUsed: true,
            originalProvider: failedProvider
          };
        }
      } catch (error) {
        console.error(`❌ Fallback ${providerType} also failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All storage providers failed');
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(storeId, files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(storeId, file, options));
      const results = await Promise.allSettled(uploadPromises);

      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const failed = results
        .filter(r => r.status === 'rejected')
        .map((r, index) => ({
          file: files[index].originalname || files[index].name,
          error: r.reason.message
        }));

      return {
        success: true,
        uploaded: successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images: ' + error.message);
    }
  }

  /**
   * Delete image from the appropriate provider
   */
  async deleteImage(storeId, imagePath, providerType = null) {
    try {
      let provider, type;
      
      if (providerType) {
        // Delete from specific provider
        provider = await this.loadProvider(providerType);
        type = providerType;
      } else {
        // Get current provider for store
        const result = await this.getStorageProvider(storeId);
        provider = result.provider;
        type = result.type;
      }
      
      if (type === 'supabase') {
        return await provider.deleteImage(storeId, imagePath);
      } else if (type === 'gcs') {
        const config = await this.getStoreStorageConfig(storeId);
        return await provider.deleteImage(storeId, imagePath, config);
      } else if (type === 's3') {
        const config = await this.getStoreStorageConfig(storeId);
        return await provider.deleteImage(storeId, imagePath, config);
      } else if (type === 'local') {
        return await provider.deleteImage(imagePath);
      }
      
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image: ' + error.message);
    }
  }

  /**
   * Get store's storage configuration
   */
  async getStoreStorageConfig(storeId) {
    try {
      const { sequelize } = require('../database/connection');
      
      const [results] = await sequelize.query(`
        SELECT config_data, integration_type
        FROM integration_configs 
        WHERE store_id = :storeId 
        AND integration_type IN ('supabase', 'gcs', 's3')
        AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `, {
        replacements: { storeId }
      });
      
      if (results.length > 0) {
        return {
          preferredProvider: results[0].integration_type,
          config: results[0].config_data
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting store storage config:', error);
      return null;
    }
  }

  /**
   * Check Google Cloud Storage availability
   */
  async checkGCSAvailability(storeId) {
    try {
      const config = await this.getStoreStorageConfig(storeId);
      return config && 
             config.preferredProvider === 'gcs' && 
             config.config && 
             config.config.projectId &&
             config.config.keyFilename;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check AWS S3 availability
   */
  async checkS3Availability(storeId) {
    try {
      const config = await this.getStoreStorageConfig(storeId);
      return config && 
             config.preferredProvider === 's3' && 
             config.config && 
             config.config.accessKeyId &&
             config.config.secretAccessKey &&
             config.config.bucketName;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage statistics for all providers
   */
  async getStorageStats(storeId) {
    try {
      const { provider, type } = await this.getStorageProvider(storeId);
      
      if (provider.getStorageStats) {
        const stats = await provider.getStorageStats(storeId);
        return {
          ...stats,
          provider: type
        };
      }
      
      return {
        success: false,
        error: 'Storage statistics not available for this provider'
      };
      
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics: ' + error.message);
    }
  }

  /**
   * List images from the current provider
   */
  async listImages(storeId, folder = null, options = {}) {
    try {
      const { provider, type } = await this.getStorageProvider(storeId);
      
      if (type === 'supabase') {
        return await provider.listImages(storeId, folder, options);
      } else if (type === 'gcs') {
        const config = await this.getStoreStorageConfig(storeId);
        return await provider.listImages(storeId, folder, { ...options, config });
      } else if (type === 's3') {
        const config = await this.getStoreStorageConfig(storeId);
        return await provider.listImages(storeId, folder, { ...options, config });
      } else if (type === 'local') {
        return await provider.listImages(folder, options);
      }
      
    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error('Failed to list images: ' + error.message);
    }
  }
}

module.exports = new StorageManager();