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
      // First try to get files from media_assets table
      const { MediaAsset } = require('../models');

      const where = { store_id: storeId };

      // Filter by folder if specified
      if (folder) {
        where.folder = folder;
      }

      console.log('🗃️ Querying MediaAsset table with where:', where);

      // Add timeout for database query to prevent hanging
      const dbQueryPromise = MediaAsset.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 3000);
      });

      let mediaAssets = [];
      let queryDuration = 0;

      try {
        const startTime = Date.now();
        mediaAssets = await Promise.race([dbQueryPromise, timeoutPromise]);
        queryDuration = Date.now() - startTime;

        console.log(`📊 MediaAsset query completed in ${queryDuration}ms:`, {
          found: mediaAssets.length,
          storeId,
          folder
        });
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
    const { MediaAsset } = require('../models');
    
    for (const file of files) {
      try {
        // Check if file already exists in database
        const existing = await MediaAsset.findOne({
          where: {
            store_id: storeId,
            file_path: file.fullPath || file.name
          }
        });
        
        if (!existing) {
          // Create new media asset record
          await MediaAsset.create({
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
            }
          });
          console.log(`Synced file to database: ${file.name}`);
        }
      } catch (err) {
        console.error(`Failed to sync file ${file.name}:`, err.message);
      }
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