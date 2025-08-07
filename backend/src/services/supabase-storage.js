const supabaseIntegration = require('./supabase-integration');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class SupabaseStorageService {
  constructor() {
    this.bucketName = 'suprshop-images';
    this.publicBucketName = 'suprshop-assets';
  }

  /**
   * Ensure required storage buckets exist (auto-creates suprshop-images and suprshop-assets)
   */
  async ensureBucketsExist(storeId) {
    try {
      // First check if we have the necessary keys
      const tokenInfo = await supabaseIntegration.getTokenInfo(storeId);
      
      if (!tokenInfo || !tokenInfo.service_role_key) {
        console.log('Service role key not available, skipping bucket auto-creation');
        return { success: false, message: 'Service role key required for bucket creation' };
      }
      
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      
      // Check if buckets exist
      const { data: buckets, error: listError } = await client.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError.message };
      }
      
      const productBucketExists = buckets?.some(b => b.name === this.bucketName);
      const publicBucketExists = buckets?.some(b => b.name === this.publicBucketName);
      
      let bucketsCreated = [];

      // Create suprshop-images bucket if it doesn't exist
      if (!productBucketExists) {
        console.log(`Creating ${this.bucketName} bucket...`);
        const { error: createError } = await client.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating ${this.bucketName}:`, createError);
        } else {
          console.log(`✅ Created ${this.bucketName} bucket`);
          bucketsCreated.push(this.bucketName);
        }
      }

      // Create suprshop-assets bucket if it doesn't exist
      if (!publicBucketExists) {
        console.log(`Creating ${this.publicBucketName} bucket...`);
        const { error: createError } = await client.storage.createBucket(this.publicBucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating ${this.publicBucketName}:`, createError);
        } else {
          console.log(`✅ Created ${this.publicBucketName} bucket`);
          bucketsCreated.push(this.publicBucketName);
        }
      }

      return { 
        success: true,
        bucketsCreated,
        message: bucketsCreated.length > 0 ? 
          `Created buckets: ${bucketsCreated.join(', ')}` : 
          'All required buckets already exist'
      };
    } catch (error) {
      console.error('Error ensuring buckets exist:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Magento-style directory path from filename
   * e.g., "testimage.png" -> "t/e/testimage.png"
   */
  generateMagentoPath(filename) {
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
   * Extract storage path from Supabase URL or metadata
   * @param {string} url - Supabase public URL
   * @param {object} metadata - File metadata
   * @param {string} type - File type (category, product, asset)
   * @param {string} fallbackFilename - Fallback filename for path generation
   * @returns {string|null} - Extracted storage path
   */
  extractStoragePath(url, metadata = {}, type = null, fallbackFilename = null) {
    // First priority: use stored path from metadata
    if (metadata.path) {
      return metadata.path;
    }
    
    // Second priority: extract from Supabase URL
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
    
    // Third priority: construct from metadata filename
    const filename = metadata.filename || fallbackFilename;
    if (filename && type) {
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let magentoPath;
      if (cleanName.length >= 2) {
        magentoPath = `${cleanName[0]}/${cleanName[1]}/${filename}`;
      } else if (cleanName.length === 1) {
        magentoPath = `${cleanName[0]}/${cleanName[0]}/${filename}`;
      } else {
        magentoPath = `misc/${filename}`;
      }
      
      // Add type prefix for Magento structure
      if (type === 'category') {
        return `categories/${magentoPath}`;
      } else if (type === 'product') {
        return `products/${magentoPath}`;
      } else if (type === 'asset') {
        return `assets/${magentoPath}`;
      }
    }
    
    return null;
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

      // Check if we have valid service role key
      const hasValidServiceKey = tokenInfo.service_role_key && 
                                 tokenInfo.service_role_key !== 'pending_configuration' &&
                                 tokenInfo.service_role_key !== '';

      if (!hasValidServiceKey) {
        // Try to fetch API keys if we have OAuth token
        console.log('No valid API keys found, attempting to fetch from Supabase...');
        
        try {
          const fetchResult = await supabaseIntegration.fetchAndUpdateApiKeys(storeId);
          
          if (fetchResult.requiresProjectActivation) {
            throw new Error('Your Supabase project is inactive. Please go to your Supabase dashboard and activate the project to enable storage operations.');
          }
          
          if (fetchResult.success && fetchResult.hasServiceRoleKey) {
            // Reload token info after fetching keys
            const updatedTokenInfo = await supabaseIntegration.getTokenInfo(storeId);
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
        
        // If we still don't have service role key after trying to fetch it
        if (!hasValidServiceKey) {
          throw new Error('Storage operations require service role key. The Supabase API is not providing this key through the OAuth connection. Please manually configure the service role key in the Supabase integration settings.');
        }
      }

      // Use service role key (only key we use now)
      const apiKey = tokenInfo.service_role_key;
      
      if (!apiKey) {
        throw new Error('No valid API key available for storage operations. Please reconnect with full permissions.');
      }

      // Generate filename based on options
      const fileExt = path.extname(file.originalname || file.name || '');
      let fileName, filePath;
      
      if (options.useMagentoStructure) {
        // Use original filename with Magento-style path
        fileName = options.filename || file.originalname || `${uuidv4()}${fileExt}`;
        const magentoPath = this.generateMagentoPath(fileName);
        
        // Determine base folder based on type
        let baseFolder = '';
        if (options.type === 'category') {
          baseFolder = 'categories';
        } else if (options.type === 'product') {
          baseFolder = 'products';
        } else if (options.type === 'asset') {
          baseFolder = 'assets';
        } else {
          baseFolder = options.folder || `store-${storeId}`;
        }
        
        filePath = `${baseFolder}/${magentoPath}`;
      } else {
        // Legacy path structure (for backward compatibility)
        fileName = `${uuidv4()}${fileExt}`;
        const folder = options.folder || `store-${storeId}`;
        filePath = `${folder}/${fileName}`;
      }
      
      // Determine bucket based on options
      const bucketName = options.public ? this.publicBucketName : this.bucketName;

      // Extract project ID from URL
      const projectUrl = tokenInfo.project_url;
      const storageUrl = projectUrl.replace('.supabase.co', '.supabase.co/storage/v1');

      console.log('Direct upload to:', `${storageUrl}/object/${bucketName}/${filePath}`);
      console.log('Using service role key for upload');

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
        serviceKey: tokenInfo?.service_role_key ? 'configured' : 'none',
        projectUrl: tokenInfo?.project_url
      });

      // Check if we have service role key, if not use direct API
      const hasValidServiceKey = tokenInfo && 
                                tokenInfo.service_role_key && 
                                tokenInfo.service_role_key !== 'pending_configuration' &&
                                tokenInfo.service_role_key !== '';

      if (!hasValidServiceKey) {
        console.log('No valid service role key detected, attempting direct API upload with key fetching');
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

      // Generate filename and path based on options
      const fileExt = path.extname(file.originalname || file.name || '');
      let fileName, filePath;
      
      if (options.useMagentoStructure) {
        // Use original filename with Magento-style path
        fileName = options.filename || file.originalname || `${uuidv4()}${fileExt}`;
        const magentoPath = this.generateMagentoPath(fileName);
        
        // Determine base folder based on type
        let baseFolder = '';
        if (options.type === 'category') {
          baseFolder = 'categories';
        } else if (options.type === 'product') {
          baseFolder = 'products';
        } else if (options.type === 'asset') {
          baseFolder = 'assets';
        } else {
          baseFolder = options.folder || `store-${storeId}`;
        }
        
        filePath = `${baseFolder}/${magentoPath}`;
      } else {
        // Legacy path structure (for backward compatibility)
        fileName = `${uuidv4()}${fileExt}`;
        const folder = options.folder || `store-${storeId}`;
        filePath = `${folder}/${fileName}`;
      }
      
      const bucketName = options.public ? this.publicBucketName : this.bucketName;

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
   * List all storage buckets
   */
  async listBuckets(storeId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      
      // Check if we have service role key for full access
      const tokenInfo = await supabaseIntegration.getTokenInfo(storeId);
      const hasServiceRoleKey = tokenInfo?.service_role_key && 
                                tokenInfo.service_role_key !== 'pending_configuration' &&
                                tokenInfo.service_role_key !== '';
      
      if (!hasServiceRoleKey) {
        // Try with regular client if no service role key
        const regularClient = await supabaseIntegration.getSupabaseClient(storeId);
        
        // For non-admin clients, we can still try to list buckets
        // but may get limited results
        try {
          const { data: buckets, error } = await regularClient.storage.listBuckets();
          
          if (error) {
            console.log('Could not list buckets with regular client:', error);
            // Return default buckets that should exist
            return {
              success: true,
              buckets: [
                { 
                  id: this.bucketName,
                  name: this.bucketName,
                  public: true,
                  created_at: null,
                  updated_at: null
                },
                {
                  id: this.publicBucketName,
                  name: this.publicBucketName,
                  public: true,
                  created_at: null,
                  updated_at: null
                }
              ],
              limited: true,
              message: 'Showing default buckets. Service role key required for full bucket list.'
            };
          }
          
          return {
            success: true,
            buckets: buckets || []
          };
        } catch (err) {
          console.log('Error listing buckets:', err);
          // Return default buckets
          return {
            success: true,
            buckets: [
              { 
                id: this.bucketName,
                name: this.bucketName,
                public: true
              },
              {
                id: this.publicBucketName,
                name: this.publicBucketName,
                public: true
              }
            ],
            limited: true
          };
        }
      }
      
      // Use admin client if we have service role key
      const { data: buckets, error } = await client.storage.listBuckets();
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        buckets: buckets || []
      };
    } catch (error) {
      console.error('Error listing buckets:', error);
      throw new Error('Failed to list storage buckets: ' + error.message);
    }
  }

  /**
   * Create a new storage bucket
   */
  async createBucket(storeId, bucketName, options = {}) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      
      // Validate bucket name
      if (!bucketName || bucketName.length < 3) {
        throw new Error('Bucket name must be at least 3 characters long');
      }
      
      // Bucket name validation (Supabase requirements)
      const validBucketName = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/;
      if (!validBucketName.test(bucketName)) {
        throw new Error('Bucket name must start and end with alphanumeric characters and can only contain lowercase letters, numbers, hyphens, and underscores');
      }
      
      const bucketOptions = {
        public: options.public || false,
        fileSizeLimit: options.fileSizeLimit || 10485760, // Default 10MB
        allowedMimeTypes: options.allowedMimeTypes || [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ]
      };
      
      const { data, error } = await client.storage.createBucket(bucketName, bucketOptions);
      
      if (error) {
        if (error.message.includes('already exists')) {
          throw new Error(`Bucket "${bucketName}" already exists`);
        }
        throw error;
      }
      
      return {
        success: true,
        bucket: data,
        message: `Bucket "${bucketName}" created successfully`
      };
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw new Error('Failed to create bucket: ' + error.message);
    }
  }

  /**
   * Delete a storage bucket
   */
  async deleteBucket(storeId, bucketId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      
      // First, empty the bucket (Supabase requires buckets to be empty before deletion)
      const { data: files } = await client.storage.from(bucketId).list('', {
        limit: 1000
      });
      
      if (files && files.length > 0) {
        // Delete all files in the bucket
        const filePaths = files.map(file => file.name);
        const { error: deleteFilesError } = await client.storage
          .from(bucketId)
          .remove(filePaths);
          
        if (deleteFilesError) {
          console.error('Error deleting files from bucket:', deleteFilesError);
        }
      }
      
      // Now delete the bucket
      const { error } = await client.storage.deleteBucket(bucketId);
      
      if (error) {
        if (error.message.includes('not found')) {
          throw new Error(`Bucket "${bucketId}" not found`);
        }
        if (error.message.includes('not empty')) {
          throw new Error(`Bucket "${bucketId}" is not empty. Please delete all files first.`);
        }
        throw error;
      }
      
      return {
        success: true,
        message: `Bucket "${bucketId}" deleted successfully`
      };
    } catch (error) {
      console.error('Error deleting bucket:', error);
      throw new Error('Failed to delete bucket: ' + error.message);
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
            // Try multiple approaches to get all files for this store
            let allFiles = [];
            let totalSize = 0;
            let fileCount = 0;
            
            // Method 1: Check legacy store-specific folder
            try {
              const { data: legacyFiles, error: legacyError } = await client.storage
                .from(bucket.name)
                .list(`store-${storeId}`, { limit: 1000 });
              
              if (!legacyError && legacyFiles) {
                allFiles = allFiles.concat(legacyFiles);
                console.log(`Found ${legacyFiles.length} files in legacy store-${storeId} folder for bucket ${bucket.name}`);
              }
            } catch (legacyErr) {
              console.log(`Legacy folder check failed for ${bucket.name}:`, legacyErr.message);
            }
            
            // Method 2: Comprehensive folder traversal - check ALL folders at root level
            try {
              const { data: allRootItems, error: rootListError } = await client.storage
                .from(bucket.name)
                .list('', { limit: 1000 });
              
              if (!rootListError && allRootItems) {
                // Add direct root files first (files have 'id' property)
                const rootDirectFiles = allRootItems.filter(f => f.id && f.name);
                allFiles = allFiles.concat(rootDirectFiles);
                console.log(`Found ${rootDirectFiles.length} files at root of bucket ${bucket.name}`);
                
                // Now traverse ALL folders found at root level (folders don't have 'id' property)
                const allRootFolders = allRootItems.filter(f => !f.id && f.name);
                console.log(`Found ${allRootFolders.length} folders at root: ${allRootFolders.map(f => f.name).join(', ')}`);
                
                for (const rootFolder of allRootFolders) {
                  await this.traverseFolderRecursively(client, bucket.name, rootFolder.name, allFiles, 0, 3); // Max 3 levels deep
                }
              }
            } catch (rootListErr) {
              console.log(`Root folder listing failed for ${bucket.name}:`, rootListErr.message);
            }
            
            
            // Remove duplicates and calculate stats
            const uniqueFiles = allFiles.filter((file, index, self) => 
              index === self.findIndex(f => f.name === file.name && f.id === file.id)
            );
            
            fileCount = uniqueFiles.length;
            totalSize = uniqueFiles.reduce((sum, file) => {
              const size = file.metadata?.size || 0;
              return sum + size;
            }, 0);
            
            console.log(`Bucket ${bucket.name}: Found ${fileCount} unique files, total size: ${totalSize} bytes`);

            return {
              bucket: bucket.name,
              fileCount,
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

      // Calculate storage quotas
      // Note: Supabase Free tier = 1GB, Pro tier = 8GB, Pro+ = 100GB
      // Since we can't easily determine the plan, we'll use a conservative estimate
      const totalSizeGB = totalSize / (1024 * 1024 * 1024);
      
      let storageQuotaGB = 1; // Default to free tier
      let storageQuotaMB = 1024;
      
      // Try to infer plan based on usage patterns or make a reasonable assumption
      // For now, assume 1GB quota (free tier) unless usage suggests otherwise
      if (totalSizeGB > 1) {
        storageQuotaGB = 8; // Assume Pro tier if they're using more than 1GB
        storageQuotaMB = 8192;
      }
      
      const storageLeftMB = Math.max(0, storageQuotaMB - (totalSize / (1024 * 1024)));
      const storageUsedPercentage = ((totalSize / (1024 * 1024)) / storageQuotaMB * 100).toFixed(1);

      return {
        success: true,
        stats,
        buckets: stats, // Also provide as buckets for backward compatibility
        summary: {
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: totalSizeGB.toFixed(2),
          storageQuotaMB: storageQuotaMB,
          storageQuotaGB: storageQuotaGB,
          storageLeft: storageLeftMB,
          storageLeftMB: storageLeftMB.toFixed(2),
          storageLeftGB: (storageLeftMB / 1024).toFixed(2),
          storageUsedPercentage: parseFloat(storageUsedPercentage),
          buckets: stats
        }
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics: ' + error.message);
    }
  }

  /**
   * Recursively traverse a folder and collect all files
   * @param {Object} client - Supabase client
   * @param {string} bucketName - Name of the bucket
   * @param {string} folderPath - Current folder path
   * @param {Array} allFiles - Array to collect files into
   * @param {number} currentDepth - Current recursion depth
   * @param {number} maxDepth - Maximum recursion depth
   */
  async traverseFolderRecursively(client, bucketName, folderPath, allFiles, currentDepth = 0, maxDepth = 3) {
    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      console.log(`Max depth ${maxDepth} reached for folder: ${folderPath}`);
      return;
    }

    try {
      const { data: folderContents, error: folderError } = await client.storage
        .from(bucketName)
        .list(folderPath, { limit: 1000 });
      
      if (folderError) {
        console.log(`Error accessing folder ${folderPath}:`, folderError.message);
        return;
      }

      if (folderContents && folderContents.length > 0) {
        // Add files directly in this folder (files have 'id' property)
        const directFiles = folderContents.filter(f => f.id && f.name);
        allFiles.push(...directFiles);
        console.log(`Found ${directFiles.length} files in ${folderPath}/`);
        
        // Recursively check subdirectories (folders don't have 'id' property)
        const subdirs = folderContents.filter(f => !f.id && f.name);
        console.log(`Found ${subdirs.length} subdirectories in ${folderPath}/: ${subdirs.map(f => f.name).join(', ')}`);
        
        for (const subdir of subdirs) {
          const subPath = `${folderPath}/${subdir.name}`;
          await this.traverseFolderRecursively(client, bucketName, subPath, allFiles, currentDepth + 1, maxDepth);
        }
      } else {
        console.log(`Folder ${folderPath}/ is empty`);
      }
    } catch (err) {
      console.log(`Error traversing folder ${folderPath}:`, err.message);
    }
  }
}

module.exports = new SupabaseStorageService();