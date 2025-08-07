const StorageInterface = require('./storage-interface');
const supabaseStorage = require('./supabase-storage');

/**
 * Supabase Storage Provider implementing StorageInterface
 * Wraps the existing supabase-storage service to implement the standard interface
 */
class SupabaseStorageProvider extends StorageInterface {
  constructor() {
    super();
    this.supabaseService = supabaseStorage;
  }

  /**
   * Upload a single file
   */
  async uploadFile(storeId, file, options = {}) {
    // Use existing uploadImage method - it handles both images and files
    return await this.supabaseService.uploadImage(storeId, file, options);
  }

  /**
   * Delete a file
   */
  async deleteFile(storeId, filePath, bucket = null) {
    return await this.supabaseService.deleteImage(storeId, filePath, bucket);
  }

  /**
   * List files in a directory
   */
  async listFiles(storeId, folder = null, options = {}) {
    return await this.supabaseService.listImages(storeId, folder, options);
  }

  /**
   * Move a file to a different location
   */
  async moveFile(storeId, fromPath, toPath, bucket = null) {
    return await this.supabaseService.moveImage(storeId, fromPath, toPath, bucket);
  }

  /**
   * Copy a file
   */
  async copyFile(storeId, fromPath, toPath, bucket = null) {
    return await this.supabaseService.copyImage(storeId, fromPath, toPath, bucket);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(storeId) {
    return await this.supabaseService.getStorageStats(storeId);
  }

  /**
   * Get signed/temporary URL for file access
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, bucket = null) {
    return await this.supabaseService.getSignedUrl(storeId, filePath, expiresIn, bucket);
  }

  /**
   * Extract file path from Supabase URL format
   */
  extractPathFromUrl(url) {
    if (url && url.includes('supabase')) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Supabase URLs: /storage/v1/object/public/bucket/path
        if (pathParts.includes('public') && pathParts.length > pathParts.indexOf('public') + 2) {
          const bucketIndex = pathParts.indexOf('public') + 1;
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch (e) {
        console.warn('Failed to parse Supabase URL:', url);
      }
    }
    return null;
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return 'supabase';
  }

  /**
   * Test connection to Supabase
   */
  async testConnection(storeId) {
    try {
      const supabaseIntegration = require('./supabase-integration');
      const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
      
      return {
        success: connectionStatus.connected,
        message: connectionStatus.connected ? 'Supabase connection successful' : 'Supabase not connected',
        provider: 'supabase',
        details: connectionStatus
      };
    } catch (error) {
      return {
        success: false,
        message: `Supabase connection test failed: ${error.message}`,
        provider: 'supabase',
        error: error.message
      };
    }
  }
}

module.exports = SupabaseStorageProvider;