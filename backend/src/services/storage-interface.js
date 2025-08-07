/**
 * Abstract Storage Interface
 * Defines the contract that all storage providers must implement
 */
class StorageInterface {
  constructor() {
    if (this.constructor === StorageInterface) {
      throw new Error('StorageInterface is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Upload a single file
   * @param {string} storeId - Store identifier
   * @param {Object} file - File object with buffer, originalname, mimetype, size
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with url, path, metadata
   */
  async uploadFile(storeId, file, options = {}) {
    throw new Error('uploadFile method must be implemented by storage provider');
  }

  /**
   * Upload multiple files
   * @param {string} storeId - Store identifier
   * @param {Array} files - Array of file objects
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Results with uploaded/failed arrays
   */
  async uploadMultipleFiles(storeId, files, options = {}) {
    const uploadPromises = files.map(file => this.uploadFile(storeId, file, options));
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
  }

  /**
   * Delete a file
   * @param {string} storeId - Store identifier
   * @param {string} filePath - Path to file
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(storeId, filePath, bucket = null) {
    throw new Error('deleteFile method must be implemented by storage provider');
  }

  /**
   * List files in a directory
   * @param {string} storeId - Store identifier
   * @param {string} folder - Folder path
   * @param {Object} options - List options
   * @returns {Promise<Object>} List of files
   */
  async listFiles(storeId, folder = null, options = {}) {
    throw new Error('listFiles method must be implemented by storage provider');
  }

  /**
   * Move a file to a different location
   * @param {string} storeId - Store identifier
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Move result
   */
  async moveFile(storeId, fromPath, toPath, bucket = null) {
    throw new Error('moveFile method must be implemented by storage provider');
  }

  /**
   * Copy a file
   * @param {string} storeId - Store identifier
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Copy result
   */
  async copyFile(storeId, fromPath, toPath, bucket = null) {
    throw new Error('copyFile method must be implemented by storage provider');
  }

  /**
   * Get storage statistics
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} Storage stats
   */
  async getStorageStats(storeId) {
    throw new Error('getStorageStats method must be implemented by storage provider');
  }

  /**
   * Get signed/temporary URL for file access
   * @param {string} storeId - Store identifier
   * @param {string} filePath - File path
   * @param {number} expiresIn - Expiration time in seconds
   * @param {string} bucket - Bucket/container name (optional)
   * @returns {Promise<Object>} Signed URL result
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, bucket = null) {
    throw new Error('getSignedUrl method must be implemented by storage provider');
  }

  /**
   * Generate organized directory path from filename
   * Uses first two characters for directory structure (e.g., "test.jpg" -> "t/e/test.jpg")
   * @param {string} filename - Original filename
   * @returns {string} Organized path
   */
  generateOrganizedPath(filename) {
    // Remove extension for path generation
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanName.length >= 2) {
      // Use first two characters for directory structure
      return `${cleanName[0]}/${cleanName[1]}/${filename}`;
    } else if (cleanName.length === 1) {
      // If only one character, use it twice
      return `${cleanName[0]}/${cleanName[0]}/${filename}`;
    } else {
      // Fallback for edge cases
      return `misc/${filename}`;
    }
  }

  /**
   * Extract storage path from URL or metadata
   * @param {string} url - File URL
   * @param {Object} metadata - File metadata
   * @param {string} type - File type (category, product, asset)
   * @param {string} fallbackFilename - Fallback filename
   * @returns {string|null} Extracted path
   */
  extractStoragePath(url, metadata = {}, type = null, fallbackFilename = null) {
    // First priority: use stored path from metadata
    if (metadata.path) {
      return metadata.path;
    }
    
    // Second priority: extract from provider-specific URL format
    const extractedPath = this.extractPathFromUrl(url);
    if (extractedPath) {
      return extractedPath;
    }
    
    // Third priority: construct from metadata filename
    const filename = metadata.filename || fallbackFilename;
    if (filename && type) {
      const organizedPath = this.generateOrganizedPath(filename);
      
      // Add type prefix
      if (type === 'category') {
        return `categories/${organizedPath}`;
      } else if (type === 'product') {
        return `products/${organizedPath}`;
      } else if (type === 'asset') {
        return `assets/${organizedPath}`;
      }
    }
    
    return null;
  }

  /**
   * Extract file path from provider-specific URL format
   * Should be implemented by each storage provider
   * @param {string} url - File URL
   * @returns {string|null} Extracted path
   */
  extractPathFromUrl(url) {
    // Default implementation - should be overridden by providers
    return null;
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    throw new Error('getProviderName method must be implemented by storage provider');
  }

  /**
   * Test connection to storage provider
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(storeId) {
    throw new Error('testConnection method must be implemented by storage provider');
  }
}

module.exports = StorageInterface;