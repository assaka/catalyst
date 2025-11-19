const StorageInterface = require('./storage-interface');
const supabaseStorage = require('./supabase-storage');
const ConnectionManager = require('./database/ConnectionManager');

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
  async deleteFile(storeId, filePath) {
    return await this.supabaseService.deleteImage(storeId, filePath);
  }

  /**
   * List files in a directory
   * First checks media_assets table, then falls back to direct Supabase query
   */
  async listFiles(storeId, folder = null, options = {}) {
    console.log('🔍 SupabaseStorageProvider.listFiles called with:', { storeId, folder, options });

    try {
      // Get tenant database connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Build query for media_assets table
      let query = tenantDb
        .from('media_assets')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 100) - 1);

      // Filter by folder if specified
      if (folder) {
        query = query.eq('folder', folder);
      }

      console.log('🗃️ Querying media_assets table with:', { storeId, folder });

      // Add timeout for database query to prevent hanging
      const dbQueryPromise = query;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 3000);
      });

      let mediaAssets = [];
      let queryDuration = 0;

      try {
        const startTime = Date.now();
        const { data, error } = await Promise.race([dbQueryPromise, timeoutPromise]);
        queryDuration = Date.now() - startTime;

        if (error) {
          console.log(`⚠️ MediaAsset query failed in ${queryDuration}ms:`, error.message);
          mediaAssets = [];
        } else {
          mediaAssets = data || [];
          console.log(`📊 MediaAsset query completed in ${queryDuration}ms:`, {
            found: mediaAssets.length,
            storeId,
            folder
          });
        }
      } catch (error) {
        const startTime = Date.now();
        queryDuration = Date.now() - startTime;
        console.log(`⚠️ MediaAsset query failed/timed out in ${queryDuration}ms:`, error.message);
        // Continue to fallback - don't throw here
        mediaAssets = [];
      }

      // If we have results from database, use those
      if (mediaAssets && mediaAssets.length > 0) {
        const files = mediaAssets.map(asset => ({
          id: asset.id,
          name: asset.file_name,
          url: asset.file_url,
          publicUrl: asset.file_url,
          fullPath: asset.file_path,
          size: parseInt(asset.file_size) || 0,
          metadata: {
            size: parseInt(asset.file_size) || 0,
            mimetype: asset.mime_type
          },
          mimetype: asset.mime_type,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          folder: asset.folder
        }));

        return {
          success: true,
          files,
          total: files.length,
          provider: 'supabase',
          source: 'database'
        };
      }
      
      // If no results from database, fall back to direct Supabase query
      // This ensures backward compatibility and handles files not yet in media_assets
      console.log('🔄 No files found in media_assets table, querying Supabase directly');
      console.log('📡 Calling supabaseService.listImages with:', { storeId, folder, options });

      const supabaseStartTime = Date.now();
      const supabaseResult = await this.supabaseService.listImages(storeId, folder, options);
      const supabaseDuration = Date.now() - supabaseStartTime;

      console.log(`✅ Supabase direct query completed in ${supabaseDuration}ms:`, {
        success: supabaseResult?.success,
        filesCount: supabaseResult?.files?.length || 0
      });
      
      // Optionally sync these files to media_assets table for future queries
      if (supabaseResult.success && supabaseResult.files && supabaseResult.files.length > 0) {
        this.syncFilesToDatabase(storeId, supabaseResult.files, folder).catch(err => {
          console.error('Failed to sync files to database:', err);
        });
      }
      
      return {
        ...supabaseResult,
        source: 'supabase'
      };
    } catch (error) {
      console.error('Error in listFiles:', error);
      // Fall back to direct Supabase query if database query fails
      return await this.supabaseService.listImages(storeId, folder, options);
    }
  }
  
  /**
   * Sync files from Supabase to media_assets table
   */
  async syncFilesToDatabase(storeId, files, folder = 'library') {
    try {
      // Get tenant database connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      for (const file of files) {
        try {
          // Check if file already exists in database
          const { data: existing } = await tenantDb
            .from('media_assets')
            .select('id')
            .eq('store_id', storeId)
            .eq('file_path', file.fullPath || file.name)
            .maybeSingle();

          if (!existing) {
            // Create new media asset record
            const { error } = await tenantDb
              .from('media_assets')
              .insert({
                store_id: storeId,
                file_name: file.name,
                original_name: file.name,
                file_path: file.fullPath || file.name,
                file_url: file.url || file.publicUrl,
                mime_type: file.mimetype || file.metadata?.mimetype,
                file_size: file.size || file.metadata?.size || 0,
                folder: folder,
                metadata: {
                  bucket: file.bucket || 'suprshop-assets',
                  provider: 'supabase',
                  synced_from_storage: true,
                  synced_at: new Date()
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error(`Failed to sync file ${file.name}:`, error.message);
            } else {
              console.log(`Synced file to database: ${file.name}`);
            }
          }
        } catch (err) {
          console.error(`Failed to sync file ${file.name}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Failed to get tenant connection for sync:', err.message);
    }
  }

  /**
   * Move a file to a different location
   */
  async moveFile(storeId, fromPath, toPath) {
    return await this.supabaseService.moveImage(storeId, fromPath, toPath);
  }

  /**
   * Copy a file
   */
  async copyFile(storeId, fromPath, toPath) {
    return await this.supabaseService.copyImage(storeId, fromPath, toPath);
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
  async getSignedUrl(storeId, filePath, expiresIn = 3600) {
    return await this.supabaseService.getSignedUrl(storeId, filePath, expiresIn);
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
      // First try OAuth integration
      const supabaseIntegration = require('./supabase-integration');
      const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
      
      if (connectionStatus.connected) {
        return {
          success: true,
          message: 'Supabase connection successful (OAuth)',
          provider: 'supabase',
          details: connectionStatus
        };
      }
      
      // DEPRECATED: No global Supabase env vars in master-tenant architecture
      // Storage is per-tenant, configured during onboarding
      
      return {
        success: false,
        message: connectionStatus.message || 'Supabase not connected and no valid environment variables found',
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