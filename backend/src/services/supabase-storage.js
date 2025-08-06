const supabaseIntegration = require('./supabase-integration');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SupabaseStorageService {
  constructor() {
    this.bucketName = 'product-images';
    this.publicBucketName = 'public-assets';
  }

  /**
   * Ensure required storage buckets exist
   */
  async ensureBucketsExist(storeId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      
      // Check if product-images bucket exists
      const { data: buckets } = await client.storage.listBuckets();
      const productBucketExists = buckets?.some(b => b.name === this.bucketName);
      const publicBucketExists = buckets?.some(b => b.name === this.publicBucketName);

      // Create product-images bucket if it doesn't exist
      if (!productBucketExists) {
        const { error: createError } = await client.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        });

        if (createError && !createError.message.includes('already exists')) {
          throw createError;
        }
      }

      // Create public-assets bucket if it doesn't exist
      if (!publicBucketExists) {
        const { error: createError } = await client.storage.createBucket(this.publicBucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError && !createError.message.includes('already exists')) {
          throw createError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error ensuring buckets exist:', error);
      throw error;
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(storeId, file, options = {}) {
    try {
      console.log('Starting image upload for store:', storeId);
      console.log('File info:', {
        name: file.originalname || file.name,
        size: file.size,
        type: file.mimetype
      });

      const client = await supabaseIntegration.getSupabaseClient(storeId);
      
      // Try to ensure buckets exist (non-blocking)
      try {
        await this.ensureBucketsExist(storeId);
      } catch (bucketError) {
        console.log('Could not ensure buckets exist, continuing with upload:', bucketError.message);
      }

      // Generate unique filename
      const fileExt = path.extname(file.originalname || file.name || '');
      const fileName = `${uuidv4()}${fileExt}`;
      
      // Determine path based on options
      const folder = options.folder || `store-${storeId}`;
      const bucketName = options.public ? this.publicBucketName : this.bucketName;
      const filePath = `${folder}/${fileName}`;

      console.log('Upload details:', {
        bucketName,
        filePath,
        fileName
      });

      // Upload file
      const { data, error } = await client.storage
        .from(bucketName)
        .upload(filePath, file.buffer || file, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = client.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
        publicUrl: urlData.publicUrl, // For frontend display
        path: filePath,
        bucket: bucketName,
        size: file.size,
        mimetype: file.mimetype,
        filename: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
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
   * Delete image from Supabase Storage
   */
  async deleteImage(storeId, imagePath, bucketName = null) {
    try {
      const client = await supabaseIntegration.getSupabaseClient(storeId);
      const bucket = bucketName || this.bucketName;

      const { error } = await client.storage
        .from(bucket)
        .remove([imagePath]);

      if (error) {
        throw error;
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image: ' + error.message);
    }
  }

  /**
   * List images in a folder
   */
  async listImages(storeId, folder = null, options = {}) {
    try {
      const client = await supabaseIntegration.getSupabaseClient(storeId);
      const bucketName = options.bucket || this.bucketName;
      const folderPath = folder || `store-${storeId}`;

      const { data, error } = await client.storage
        .from(bucketName)
        .list(folderPath, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      // Add public URLs to each file
      const filesWithUrls = data.map(file => {
        const { data: urlData } = client.storage
          .from(bucketName)
          .getPublicUrl(`${folderPath}/${file.name}`);

        return {
          ...file,
          publicUrl: urlData.publicUrl,
          fullPath: `${folderPath}/${file.name}`
        };
      });

      return {
        success: true,
        files: filesWithUrls,
        total: filesWithUrls.length
      };
    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error('Failed to list images: ' + error.message);
    }
  }

  /**
   * Move image to different folder
   */
  async moveImage(storeId, fromPath, toPath, bucketName = null) {
    try {
      const client = await supabaseIntegration.getSupabaseClient(storeId);
      const bucket = bucketName || this.bucketName;

      const { error: moveError } = await client.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (moveError) {
        throw moveError;
      }

      // Get new public URL
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(toPath);

      return {
        success: true,
        newPath: toPath,
        newUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error moving image:', error);
      throw new Error('Failed to move image: ' + error.message);
    }
  }

  /**
   * Copy image
   */
  async copyImage(storeId, fromPath, toPath, bucketName = null) {
    try {
      const client = await supabaseIntegration.getSupabaseClient(storeId);
      const bucket = bucketName || this.bucketName;

      const { error: copyError } = await client.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (copyError) {
        throw copyError;
      }

      // Get new public URL
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(toPath);

      return {
        success: true,
        copiedPath: toPath,
        copiedUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error copying image:', error);
      throw new Error('Failed to copy image: ' + error.message);
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, bucketName = null) {
    try {
      const client = await supabaseIntegration.getSupabaseClient(storeId);
      const bucket = bucketName || this.bucketName;

      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw error;
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresIn
      };
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw new Error('Failed to create signed URL: ' + error.message);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(storeId) {
    try {
      // Try to get admin client first, fall back to regular client
      let client;
      let canListBuckets = true;
      
      try {
        client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      } catch (adminError) {
        console.log('Admin client not available, using regular client for stats');
        client = await supabaseIntegration.getSupabaseClient(storeId);
        canListBuckets = false; // Regular client can't list all buckets
      }
      
      // Get bucket sizes
      let buckets = [];
      if (canListBuckets) {
        const { data: bucketList } = await client.storage.listBuckets();
        buckets = bucketList || [];
      } else {
        // For regular client, just check known buckets
        buckets = [
          { name: this.bucketName },
          { name: this.publicBucketName }
        ];
      }
      
      const stats = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const { data: files, error } = await client.storage
              .from(bucket.name)
              .list(`store-${storeId}`, { limit: 1000 });

            if (error) {
              console.log(`Could not access bucket ${bucket.name}:`, error.message);
              return {
                bucket: bucket.name,
                fileCount: 0,
                totalSize: 0,
                totalSizeMB: '0.00',
                error: 'Access denied or bucket not found'
              };
            }

            const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

            return {
              bucket: bucket.name,
              fileCount: files?.length || 0,
              totalSize,
              totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
          } catch (bucketError) {
            console.log(`Error accessing bucket ${bucket.name}:`, bucketError.message);
            return {
              bucket: bucket.name,
              fileCount: 0,
              totalSize: 0,
              totalSizeMB: '0.00',
              error: bucketError.message
            };
          }
        })
      );

      const totalSize = stats.reduce((sum, stat) => sum + stat.totalSize, 0);
      const totalFiles = stats.reduce((sum, stat) => sum + stat.fileCount, 0);

      return {
        success: true,
        stats,
        summary: {
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        }
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics: ' + error.message);
    }
  }
}

module.exports = new SupabaseStorageService();