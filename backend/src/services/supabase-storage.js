const supabaseIntegration = require('./supabase-integration');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

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
   * Upload image using direct API call with OAuth token
   * Note: This requires anon key or service role key. OAuth token alone is not sufficient for Storage API.
   */
  async uploadImageDirect(storeId, file, options = {}) {
    try {
      const tokenInfo = await supabaseIntegration.getTokenInfo(storeId);
      
      if (!tokenInfo || !tokenInfo.project_url || tokenInfo.project_url === 'pending_configuration') {
        throw new Error('Project URL not configured. Please select a project.');
      }

      // Check if we have valid API keys
      const hasValidAnonKey = tokenInfo.anon_key && 
                              tokenInfo.anon_key !== 'pending_configuration' &&
                              tokenInfo.anon_key !== 'pending' &&
                              tokenInfo.anon_key !== '' &&
                              !tokenInfo.anon_key.includes('dummy') &&
                              !tokenInfo.anon_key.includes('pending');
      
      const hasValidServiceKey = tokenInfo.service_role_key && 
                                 tokenInfo.service_role_key !== 'pending_configuration' &&
                                 tokenInfo.service_role_key !== '';

      if (!hasValidAnonKey && !hasValidServiceKey) {
        // Try to fetch API keys if we have OAuth token
        console.log('No valid API keys found, attempting to fetch from Supabase...');
        
        try {
          const fetchResult = await supabaseIntegration.fetchAndUpdateApiKeys(storeId);
          
          if (fetchResult.requiresProjectActivation) {
            throw new Error('Your Supabase project is inactive. Please go to your Supabase dashboard and activate the project to enable storage operations.');
          }
          
          if (fetchResult.success && (fetchResult.hasAnonKey || fetchResult.hasServiceRoleKey)) {
            // Reload token info after fetching keys
            const updatedTokenInfo = await supabaseIntegration.getTokenInfo(storeId);
            if (updatedTokenInfo.anon_key && updatedTokenInfo.anon_key !== 'pending_configuration') {
              tokenInfo.anon_key = updatedTokenInfo.anon_key;
              hasValidAnonKey = true;
            }
            if (updatedTokenInfo.service_role_key) {
              tokenInfo.service_role_key = updatedTokenInfo.service_role_key;
              hasValidServiceKey = true;
            }
          }
        } catch (fetchError) {
          console.log('Failed to fetch API keys:', fetchError.message);
          // Re-throw if it's a project activation error
          if (fetchError.message.includes('inactive')) {
            throw fetchError;
          }
        }
        
        // If we still don't have keys after trying to fetch them
        if (!hasValidAnonKey && !hasValidServiceKey) {
          throw new Error('Storage operations require API keys (anon key or service role key). The Supabase API is not providing these keys through the OAuth connection. Please manually configure the API keys in the Supabase integration settings.');
        }
      }

      // Use the appropriate key (prefer anon key for public operations)
      const apiKey = hasValidAnonKey ? tokenInfo.anon_key : tokenInfo.service_role_key;
      
      if (!apiKey) {
        throw new Error('No valid API key available for storage operations. Please reconnect with full permissions.');
      }

      // Generate unique filename
      const fileExt = path.extname(file.originalname || file.name || '');
      const fileName = `${uuidv4()}${fileExt}`;
      
      // Determine path based on options
      const folder = options.folder || `store-${storeId}`;
      const bucketName = options.public ? this.publicBucketName : this.bucketName;
      const filePath = `${folder}/${fileName}`;

      // Extract project ID from URL
      const projectUrl = tokenInfo.project_url;
      const storageUrl = projectUrl.replace('.supabase.co', '.supabase.co/storage/v1');

      console.log('Direct upload to:', `${storageUrl}/object/${bucketName}/${filePath}`);
      console.log('Using API key type:', hasValidAnonKey ? 'anon' : 'service_role');

      // First, try to create bucket if it doesn't exist
      try {
        await axios.post(
          `${storageUrl}/bucket`,
          {
            id: bucketName,
            name: bucketName,
            public: true,
            file_size_limit: 10485760,
            allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'apikey': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Bucket created or already exists');
      } catch (bucketError) {
        // Ignore if bucket already exists
        if (!bucketError.response?.data?.message?.includes('already exists')) {
          console.log('Bucket creation error (non-fatal):', bucketError.response?.data || bucketError.message);
        }
      }

      // Upload using direct API call with proper authentication
      const uploadResponse = await axios.post(
        `${storageUrl}/object/${bucketName}/${filePath}`,
        file.buffer || file,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'apikey': apiKey,
            'Content-Type': file.mimetype || 'image/jpeg',
            'Cache-Control': 'max-age=3600'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log('Direct upload response:', uploadResponse.data);

      // Get public URL
      const publicUrl = `${storageUrl}/object/public/${bucketName}/${filePath}`;

      return {
        success: true,
        path: filePath,
        fullPath: `${bucketName}/${filePath}`,
        publicUrl,
        url: publicUrl,
        bucket: bucketName,
        size: file.size,
        mimetype: file.mimetype,
        filename: fileName
      };
    } catch (error) {
      console.error('Direct upload error:', error.response?.data || error.message);
      
      // Check if it's an authentication error
      if (error.response?.status === 403 || error.response?.status === 401) {
        throw new Error('Authentication failed. Please reconnect to Supabase with full permissions to enable storage operations.');
      }
      
      throw new Error(`Failed to upload image: ${error.response?.data?.message || error.message}`);
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

      // Check if we should use direct API
      const tokenInfo = await supabaseIntegration.getTokenInfo(storeId);
      console.log('Token info check:', {
        hasToken: !!tokenInfo,
        anonKey: tokenInfo?.anon_key ? `${tokenInfo.anon_key.substring(0, 20)}...` : 'none',
        projectUrl: tokenInfo?.project_url
      });

      const hasValidAnonKey = tokenInfo && 
                              tokenInfo.anon_key && 
                              tokenInfo.anon_key !== 'pending_configuration' &&
                              tokenInfo.anon_key !== 'pending' &&
                              tokenInfo.anon_key !== '' &&
                              !tokenInfo.anon_key.includes('dummy') &&
                              !tokenInfo.anon_key.includes('pending');

      if (!hasValidAnonKey) {
        console.log('No valid anon key detected, attempting direct API upload with key fetching');
        return await this.uploadImageDirect(storeId, file, options);
      }

      // Try to get client
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Client creation failed, using direct API:', error.message);
        return await this.uploadImageDirect(storeId, file, options);
      }
      
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
        // If it's a JWT error, retry with direct API
        if (error.message && (error.message.includes('JWT') || error.message.includes('JWS'))) {
          console.log('JWT error detected, retrying with direct API upload');
          return await this.uploadImageDirect(storeId, file, options);
        }
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
      
      // If any error occurs, try direct API as last resort
      if (!options._isRetry) {
        console.log('Upload failed, attempting direct API as fallback');
        try {
          return await this.uploadImageDirect(storeId, file, { ...options, _isRetry: true });
        } catch (directError) {
          console.error('Direct API also failed:', directError);
          throw new Error('Failed to upload image: ' + directError.message);
        }
      }
      
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
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
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
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
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
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
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
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
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
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
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
      // First check if we have proper credentials
      const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
      
      if (!connectionStatus.connected) {
        return {
          success: false,
          message: 'Supabase not connected. Please connect your Supabase account.',
          requiresConfiguration: true,
          stats: {
            totalFiles: 0,
            totalSize: 0,
            totalSizeMB: '0.00',
            totalSizeGB: '0.00',
            buckets: []
          }
        };
      }
      
      // Try to get admin client first, fall back to regular/OAuth client
      let client;
      let canListBuckets = true;
      
      try {
        client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      } catch (adminError) {
        console.log('Admin client not available, trying regular client for stats');
        try {
          client = await supabaseIntegration.getSupabaseClient(storeId);
          canListBuckets = false; // Regular client might have limited permissions
        } catch (clientError) {
          console.error('Failed to create client:', clientError.message);
          // If we can't get any client, return graceful error with empty stats
          return {
            success: true, // Return success with empty stats instead of error
            message: 'Storage statistics require API keys. Stats will be available once keys are configured.',
            stats: {
              totalFiles: 0,
              totalSize: 0,
              totalSizeMB: '0.00',
              totalSizeGB: '0.00',
              buckets: []
            }
          };
        }
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