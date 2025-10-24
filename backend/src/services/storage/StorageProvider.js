/**
 * StorageProvider - Abstract base class for all storage providers
 *
 * All storage providers (Supabase, Google Cloud Storage, AWS S3, etc.)
 * must extend this class and implement the required methods.
 */
class StorageProvider {
  /**
   * @param {Object} config - Provider-specific configuration
   */
  constructor(config) {
    if (this.constructor === StorageProvider) {
      throw new Error('StorageProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.providerName = this.constructor.name;
  }

  /**
   * Upload a file to storage
   * @param {Object} file - File object with buffer, originalname, mimetype, size
   * @param {string} path - Destination path/key for the file
   * @param {Object} options - Upload options (bucket, public, metadata, etc.)
   * @returns {Promise<{url: string, path: string, size: number}>}
   */
  async upload(file, path, options = {}) {
    throw new Error(`${this.providerName}.upload() must be implemented`);
  }

  /**
   * Delete a file from storage
   * @param {string} path - Path/key of the file to delete
   * @param {Object} options - Delete options (bucket, etc.)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async delete(path, options = {}) {
    throw new Error(`${this.providerName}.delete() must be implemented`);
  }

  /**
   * Get a signed/public URL for a file
   * @param {string} path - Path/key of the file
   * @param {number} expiresIn - Expiration time in seconds (for signed URLs)
   * @param {Object} options - URL options (bucket, etc.)
   * @returns {Promise<string>} - URL to access the file
   */
  async getUrl(path, expiresIn = 3600, options = {}) {
    throw new Error(`${this.providerName}.getUrl() must be implemented`);
  }

  /**
   * List files in a directory/prefix
   * @param {string} prefix - Directory prefix to list
   * @param {Object} options - List options (limit, offset, bucket, etc.)
   * @returns {Promise<Array<{path: string, size: number, lastModified: Date}>>}
   */
  async listFiles(prefix, options = {}) {
    throw new Error(`${this.providerName}.listFiles() must be implemented`);
  }

  /**
   * Check if a file exists
   * @param {string} path - Path/key of the file
   * @param {Object} options - Options (bucket, etc.)
   * @returns {Promise<boolean>}
   */
  async exists(path, options = {}) {
    throw new Error(`${this.providerName}.exists() must be implemented`);
  }

  /**
   * Copy a file within storage
   * @param {string} fromPath - Source path/key
   * @param {string} toPath - Destination path/key
   * @param {Object} options - Copy options (bucket, etc.)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async copy(fromPath, toPath, options = {}) {
    throw new Error(`${this.providerName}.copy() must be implemented`);
  }

  /**
   * Move a file within storage
   * @param {string} fromPath - Source path/key
   * @param {string} toPath - Destination path/key
   * @param {Object} options - Move options (bucket, etc.)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async move(fromPath, toPath, options = {}) {
    // Default implementation: copy then delete
    const copyResult = await this.copy(fromPath, toPath, options);
    if (copyResult.success) {
      await this.delete(fromPath, options);
    }
    return copyResult;
  }

  /**
   * Get storage statistics
   * @param {Object} options - Stats options (bucket, prefix, etc.)
   * @returns {Promise<{totalFiles: number, totalSize: number, buckets: Array}>}
   */
  async getStats(options = {}) {
    // Optional method with default implementation
    return {
      totalFiles: 0,
      totalSize: 0,
      buckets: [],
      provider: this.providerName
    };
  }

  /**
   * Upload multiple files
   * @param {Array<Object>} files - Array of file objects
   * @param {string} basePath - Base path for uploads
   * @param {Object} options - Upload options
   * @returns {Promise<Array<{url: string, path: string, success: boolean}>>}
   */
  async uploadMultiple(files, basePath = '', options = {}) {
    const results = [];

    for (const file of files) {
      try {
        const path = basePath ? `${basePath}/${file.originalname}` : file.originalname;
        const result = await this.upload(file, path, options);
        results.push({
          ...result,
          success: true,
          originalName: file.originalname
        });
      } catch (error) {
        results.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Create a bucket/container (if supported)
   * @param {string} bucketName - Name of the bucket to create
   * @param {Object} options - Bucket options (public, region, etc.)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async createBucket(bucketName, options = {}) {
    // Optional method - not all providers may support this
    return {
      success: false,
      message: `${this.providerName} does not support bucket creation through this interface`
    };
  }

  /**
   * List available buckets/containers
   * @returns {Promise<Array<{name: string, createdAt: Date}>>}
   */
  async listBuckets() {
    // Optional method - not all providers may support this
    return [];
  }

  /**
   * Test the connection to the storage provider
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    try {
      // Try to list files with a very small limit to test connectivity
      await this.listFiles('', { limit: 1 });
      return {
        success: true,
        message: `Successfully connected to ${this.providerName}`,
        provider: this.providerName
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        provider: this.providerName
      };
    }
  }
}

module.exports = StorageProvider;
