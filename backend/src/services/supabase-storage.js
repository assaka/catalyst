const supabaseIntegration = require('./supabase-integration');
const StorageInterface = require('./storage-interface');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class SupabaseStorageService extends StorageInterface {
  constructor() {
    super();
    this.assetsBucketName = 'suprshop-assets'; // Single bucket for all assets
  }

  /**
   * Ensure required storage bucket exists (auto-creates suprshop-assets)
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
      
      const assetsBucketExists = buckets?.some(b => b.name === this.assetsBucketName);
      
      let bucketsCreated = [];

      // Create suprshop-assets bucket if it doesn't exist
      if (!assetsBucketExists) {
        console.log(`Creating ${this.assetsBucketName} bucket...`);
        const { error: createError } = await client.storage.createBucket(this.assetsBucketName, {
          public: true,
          fileSizeLimit: 50485760, // 50MB for all assets
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating ${this.assetsBucketName}:`, createError);
        } else {
          console.log(`✅ Created ${this.assetsBucketName} bucket`);
          bucketsCreated.push(this.assetsBucketName);
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
   * Recursively list files in organized directory structure
   * @param {Object} client - Supabase client
   * @param {string} bucketName - Bucket name
   * @param {string} folderPath - Base folder path
   * @param {number} limit - Maximum files to return
   * @returns {Array} Array of file objects with URLs
   */
  async listFilesRecursively(client, bucketName, folderPath, limit = 100) {
    const allFiles = [];
    
    try {
      // First, list direct files in the folder
      const { data: directFiles, error: directError } = await client.storage
        .from(bucketName)
        .list(folderPath, { limit: 1000 });
      
      if (!directError && directFiles) {
        // Add direct files (items with id property)
        const files = directFiles.filter(item => item.id);
        for (const file of files) {
          const fullPath = `${folderPath}/${file.name}`;
          const { data: urlData } = client.storage
            .from(bucketName)
            .getPublicUrl(fullPath);
          
          allFiles.push({
            ...file,
            url: urlData.publicUrl,
            publicUrl: urlData.publicUrl,
            fullPath: fullPath
          });
          
          if (allFiles.length >= limit) break;
        }
        
        // Get subdirectories for organized structure (a, b, c, etc.)
        const subdirs = directFiles.filter(item => !item.id && item.name);
        
        // Recursively check subdirectories if we haven't hit the limit
        for (const subdir of subdirs) {
          if (allFiles.length >= limit) break;
          
          const subdirPath = `${folderPath}/${subdir.name}`;
          try {
            const subdirFiles = await this.listFilesRecursively(
              client, 
              bucketName, 
              subdirPath, 
              limit - allFiles.length
            );
            allFiles.push(...subdirFiles);
          } catch (subdirError) {
            console.log(`Error accessing subdirectory ${subdirPath}:`, subdirError.message);
          }
        }
      }
    } catch (error) {
      console.log(`Error listing files in ${folderPath}:`, error.message);
    }
    
    return allFiles;
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

      // Generate filename and path based on options
      const fileExt = path.extname(file.originalname || file.name || '');
      let fileName, filePath, bucketName;
      
      // All files go to suprshop-assets bucket with organized folder structure
      bucketName = this.assetsBucketName;
      fileName = options.filename || file.originalname || `${uuidv4()}${fileExt}`;
      
      // Determine folder based on upload type
      let folder = 'library'; // Default folder
      
      if (options.type === 'product' || options.folder === 'product' || options.folder === 'products') {
        // Determine subfolder based on file type
        const isImage = file.mimetype && file.mimetype.startsWith('image/');
        folder = isImage ? 'product/images' : 'product/files';
      } else if (options.type === 'category' || options.folder === 'category' || options.folder === 'categories') {
        folder = 'category/images';
      } else if (options.folder && options.folder !== 'uploads') {
        folder = options.folder;
      }
      
      // Use generateOrganizedPath for better directory structure
      if (options.useOrganizedStructure !== false) {
        const organizedPath = this.generateOrganizedPath(fileName);
        filePath = `${folder}/${organizedPath}`;
      } else {
        filePath = `${folder}/${fileName}`;
      }

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
      let fileName, filePath, bucketName;
      
      // All files go to suprshop-assets bucket with organized folder structure
      bucketName = this.assetsBucketName;
      fileName = options.filename || file.originalname || `${uuidv4()}${fileExt}`;
      
      // Determine folder based on upload type
      let folder = 'library'; // Default folder
      
      if (options.type === 'product' || options.folder === 'product' || options.folder === 'products') {
        // Determine subfolder based on file type
        const isImage = file.mimetype && file.mimetype.startsWith('image/');
        folder = isImage ? 'product/images' : 'product/files';
      } else if (options.type === 'category' || options.folder === 'category' || options.folder === 'categories') {
        folder = 'category/images';
      } else if (options.folder && options.folder !== 'uploads') {
        folder = options.folder;
      }
      
      // Use generateOrganizedPath for better directory structure
      if (options.useOrganizedStructure !== false) {
        const organizedPath = this.generateOrganizedPath(fileName);
        filePath = `${folder}/${organizedPath}`;
      } else {
        filePath = `${folder}/${fileName}`;
      }

      console.log('Upload details:', {
        bucketName,
        filePath,
        fileName,
        organizedStructure: options.useOrganizedStructure !== false
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
  async deleteImage(storeId, imagePath) {
    try {
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
      const bucket = this.assetsBucketName;

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
      
      // If no folder specified, list all files from all folders in suprshop-assets bucket
      if (!folder) {
        const allFiles = [];
        
        // List files from all organized folders in assets bucket
        const foldersToCheck = ['library', 'category/images', 'product/images', 'product/files'];
        
        for (const folderPath of foldersToCheck) {
          try {
            // Get files from organized subfolders within each main folder
            const files = await this.listFilesRecursively(client, this.assetsBucketName, folderPath, options.limit || 100);
            
            // Add folder information and process each file
            const folderFiles = files.map(file => {
              // Determine folder type for filtering
              let folder = 'library';
              if (folderPath.startsWith('category')) {
                folder = 'category';
              } else if (folderPath.startsWith('product')) {
                folder = 'product';
              }
              
              return {
                ...file,
                folder: folder
              };
            });
            allFiles.push(...folderFiles);
          } catch (error) {
            console.log(`Error listing ${folderPath} files:`, error.message);
          }
        }
        
        // Sort all files by created_at
        allFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Apply limit if specified
        const limitedFiles = options.limit ? allFiles.slice(0, options.limit) : allFiles;
        
        return {
          success: true,
          files: limitedFiles,
          total: limitedFiles.length,
          provider: 'supabase'
        };
      }
      
      // All files are in suprshop-assets bucket with organized folder structure
      const bucketName = this.assetsBucketName;
      let folderPath;
      
      if (folder === 'library') {
        folderPath = 'library';
      } else if (folder && folder.startsWith('product')) {
        // Maintain folder structure: 'product/images' or 'product/files'
        folderPath = folder;
      } else if (folder === 'category') {
        // Default to category images
        folderPath = 'category/images';
      } else if (folder && folder.startsWith('category')) {
        // Use specific category folder: 'category/images'
        folderPath = folder;
      } else {
        // Default to library folder for File Library
        folderPath = 'library';
      }

      console.log(`📂 Listing files from ${bucketName}/${folderPath}`);

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

      // Filter out directories (items without id) and add public URLs
      const files = data ? data.filter(item => item.id) : [];
      
      const filesWithUrls = files.map(file => {
        const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
        const { data: urlData } = client.storage
          .from(bucketName)
          .getPublicUrl(fullPath);

        return {
          ...file,
          url: urlData.publicUrl,  // Add url field for FileLibrary component
          publicUrl: urlData.publicUrl,
          fullPath: fullPath
        };
      });

      return {
        success: true,
        files: filesWithUrls,
        total: filesWithUrls.length,
        provider: 'supabase'
      };
    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error('Failed to list images: ' + error.message);
    }
  }

  /**
   * Move image to different folder
   */
  async moveImage(storeId, fromPath, toPath) {
    try {
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
      const bucket = this.assetsBucketName;

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
  async copyImage(storeId, fromPath, toPath) {
    try {
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
      const bucket = this.assetsBucketName;

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
  async getSignedUrl(storeId, filePath, expiresIn = 3600) {
    try {
      // Try to get client - prefer OAuth client which works without anon key
      let client;
      try {
        client = await supabaseIntegration.getSupabaseClient(storeId);
      } catch (error) {
        console.log('Regular client failed:', error.message);
        throw new Error('Storage operations require API keys to be configured');
      }
      const bucket = this.assetsBucketName;

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
            // Return default bucket that should exist
            return {
              success: true,
              buckets: [
                {
                  id: this.assetsBucketName,
                  name: this.assetsBucketName,
                  public: true,
                  created_at: null,
                  updated_at: null
                }
              ],
              limited: true,
              message: 'Showing default bucket. Service role key required for full bucket list.'
            };
          }
          
          return {
            success: true,
            buckets: buckets || []
          };
        } catch (err) {
          console.log('Error listing buckets:', err);
          // Return default bucket
          return {
            success: true,
            buckets: [
              {
                id: this.assetsBucketName,
                name: this.assetsBucketName,
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
        // For regular client, just check known bucket
        buckets = [
          { name: this.assetsBucketName }
        ];
      }
      
      const stats = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            // Get all files from organized folder structure
            let allFiles = [];
            let totalSize = 0;
            let fileCount = 0;
            
            // Check organized folders: library, category/images, product/images, product/files
            const organizedFolders = ['library', 'category/images', 'product/images', 'product/files'];
            
            for (const folderPath of organizedFolders) {
              try {
                const { data: folderFiles, error: folderError } = await client.storage
                  .from(bucket.name)
                  .list(folderPath, { limit: 1000 });
                
                if (!folderError && folderFiles) {
                  // Filter files only (items with 'id' property)
                  const files = folderFiles.filter(f => f.id && f.name);
                  allFiles = allFiles.concat(files);
                  console.log(`Found ${files.length} files in ${bucket.name}/${folderPath}`);
                }
              } catch (folderErr) {
                console.log(`Error accessing folder ${folderPath} in bucket ${bucket.name}:`, folderErr.message);
              }
            }
            
            // Also check root level files
            try {
              const { data: rootFiles, error: rootError } = await client.storage
                .from(bucket.name)
                .list('', { limit: 1000 });
              
              if (!rootError && rootFiles) {
                const directRootFiles = rootFiles.filter(f => f.id && f.name);
                allFiles = allFiles.concat(directRootFiles);
                console.log(`Found ${directRootFiles.length} files at root of bucket ${bucket.name}`);
              }
            } catch (rootErr) {
              console.log(`Error accessing root of bucket ${bucket.name}:`, rootErr.message);
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

}

module.exports = new SupabaseStorageService();