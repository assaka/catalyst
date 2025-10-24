const { createClient } = require('@supabase/supabase-js');
const StorageProvider = require('../StorageProvider');

/**
 * SupabaseStorageProvider - Storage provider implementation for Supabase Storage
 */
class SupabaseStorageProvider extends StorageProvider {
  constructor(config) {
    super(config);

    if (!config.projectUrl) {
      throw new Error('Supabase projectUrl is required');
    }

    if (!config.serviceRoleKey) {
      throw new Error('Supabase serviceRoleKey is required for storage operations');
    }

    // Initialize Supabase client with service role key for admin operations
    this.supabase = createClient(config.projectUrl, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    this.defaultBucket = config.defaultBucket || 'suprshop-assets';
  }

  /**
   * Upload a file to Supabase Storage
   */
  async upload(file, path, options = {}) {
    const bucket = options.bucket || this.defaultBucket;
    const isPublic = options.public !== false; // Default to public

    // Ensure bucket exists
    await this.ensureBucketExists(bucket, { public: isPublic });

    // Upload file
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: options.upsert || false,
        cacheControl: options.cacheControl || '3600'
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      size: file.size,
      bucket,
      provider: 'supabase-storage'
    };
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(path, options = {}) {
    const bucket = options.bucket || this.defaultBucket;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    return {
      success: true,
      message: `File ${path} deleted successfully`,
      deletedFiles: data
    };
  }

  /**
   * Get URL for a file (public or signed)
   */
  async getUrl(path, expiresIn = 3600, options = {}) {
    const bucket = options.bucket || this.defaultBucket;

    if (options.signed) {
      // Get signed URL for private files
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } else {
      // Get public URL
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    }
  }

  /**
   * List files in a bucket/prefix
   */
  async listFiles(prefix, options = {}) {
    const bucket = options.bucket || this.defaultBucket;
    const limit = options.limit || 1000;
    const offset = options.offset || 0;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: options.sortBy || 'name', order: options.sortOrder || 'asc' }
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data.map(file => ({
      path: prefix ? `${prefix}/${file.name}` : file.name,
      name: file.name,
      size: file.metadata?.size || 0,
      lastModified: new Date(file.updated_at || file.created_at),
      mimetype: file.metadata?.mimetype
    }));
  }

  /**
   * Check if a file exists
   */
  async exists(path, options = {}) {
    try {
      const bucket = options.bucket || this.defaultBucket;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path.substring(0, path.lastIndexOf('/')), {
          limit: 1000,
          search: path.split('/').pop()
        });

      if (error) {
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Copy a file within Supabase Storage
   */
  async copy(fromPath, toPath, options = {}) {
    const bucket = options.bucket || this.defaultBucket;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }

    return {
      success: true,
      message: `File copied from ${fromPath} to ${toPath}`,
      path: data.path
    };
  }

  /**
   * Move a file within Supabase Storage
   */
  async move(fromPath, toPath, options = {}) {
    const bucket = options.bucket || this.defaultBucket;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }

    return {
      success: true,
      message: `File moved from ${fromPath} to ${toPath}`,
      path: data.path
    };
  }

  /**
   * Get storage statistics
   */
  async getStats(options = {}) {
    const buckets = options.buckets || [this.defaultBucket];
    let totalFiles = 0;
    let totalSize = 0;
    const bucketStats = [];

    for (const bucket of buckets) {
      try {
        const files = await this.listFiles('', { bucket, limit: 10000 });
        const bucketSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

        totalFiles += files.length;
        totalSize += bucketSize;

        bucketStats.push({
          bucket,
          fileCount: files.length,
          totalSize: bucketSize,
          totalSizeMB: (bucketSize / (1024 * 1024)).toFixed(2)
        });
      } catch (error) {
        console.error(`Failed to get stats for bucket ${bucket}:`, error.message);
      }
    }

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      buckets: bucketStats,
      provider: 'supabase-storage'
    };
  }

  /**
   * Create a bucket in Supabase Storage
   */
  async createBucket(bucketName, options = {}) {
    const { data, error } = await this.supabase.storage.createBucket(bucketName, {
      public: options.public !== false,
      fileSizeLimit: options.fileSizeLimit,
      allowedMimeTypes: options.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        return {
          success: true,
          message: `Bucket ${bucketName} already exists`,
          bucket: bucketName
        };
      }
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    return {
      success: true,
      message: `Bucket ${bucketName} created successfully`,
      bucket: data
    };
  }

  /**
   * List all buckets
   */
  async listBuckets() {
    const { data, error } = await this.supabase.storage.listBuckets();

    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`);
    }

    return data.map(bucket => ({
      name: bucket.name,
      id: bucket.id,
      public: bucket.public,
      createdAt: new Date(bucket.created_at),
      updatedAt: new Date(bucket.updated_at)
    }));
  }

  /**
   * Ensure a bucket exists (create if it doesn't)
   */
  async ensureBucketExists(bucketName, options = {}) {
    try {
      const buckets = await this.listBuckets();
      const bucketExists = buckets.some(b => b.name === bucketName);

      if (!bucketExists) {
        return await this.createBucket(bucketName, options);
      }

      return {
        success: true,
        message: `Bucket ${bucketName} already exists`,
        bucket: bucketName
      };
    } catch (error) {
      console.error(`Failed to ensure bucket exists: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Test connection to Supabase Storage
   */
  async testConnection() {
    try {
      // Try to list buckets as a connection test
      await this.listBuckets();

      return {
        success: true,
        message: 'Successfully connected to Supabase Storage',
        provider: 'supabase-storage',
        projectUrl: this.config.projectUrl
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Supabase Storage: ${error.message}`,
        provider: 'supabase-storage'
      };
    }
  }
}

module.exports = SupabaseStorageProvider;
