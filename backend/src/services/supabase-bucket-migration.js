const supabaseIntegration = require('./supabase-integration');

/**
 * Supabase Bucket Migration Service
 * Handles renaming buckets and migrating files to new structure
 */
class SupabaseBucketMigration {
  constructor() {
    this.catalogBucketName = 'suprshop-catalog';
    this.assetsBucketName = 'suprshop-assets';
    this.legacyBucketName = 'suprshop-images';
  }

  /**
   * Create new bucket structure for a store
   * @param {string} storeId - Store ID
   */
  async createBucketStructure(storeId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      if (!client) {
        throw new Error('Supabase client not initialized for store');
      }

      console.log('🔧 Creating new bucket structure...');

      // 1. Create suprshop-catalog bucket if it doesn't exist
      try {
        const { data: catalogBucket, error: catalogError } = await client.storage.createBucket(this.catalogBucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
        });

        if (catalogError && !catalogError.message.includes('already exists')) {
          console.error('Error creating catalog bucket:', catalogError.message);
        } else if (!catalogError) {
          console.log('✅ Created suprshop-catalog bucket');
        } else {
          console.log('✅ suprshop-catalog bucket already exists');
        }
      } catch (error) {
        console.log('Catalog bucket may already exist:', error.message);
      }

      // 2. Ensure suprshop-assets bucket exists
      try {
        const { data: assetsBucket, error: assetsError } = await client.storage.createBucket(this.assetsBucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB for larger files
          allowedMimeTypes: null // Allow all file types for general assets
        });

        if (assetsError && !assetsError.message.includes('already exists')) {
          console.error('Error creating assets bucket:', assetsError.message);
        } else if (!assetsError) {
          console.log('✅ Created suprshop-assets bucket');
        } else {
          console.log('✅ suprshop-assets bucket already exists');
        }
      } catch (error) {
        console.log('Assets bucket may already exist:', error.message);
      }

      // 3. Create directory structure in catalog bucket
      // Note: Supabase creates directories automatically when files are uploaded
      console.log('📁 Directory structure will be created automatically:');
      console.log('  - suprshop-catalog/product/images/');
      console.log('  - suprshop-catalog/product/files/');
      console.log('  - suprshop-catalog/category/images/');
      console.log('  - suprshop-assets/library/');

      return {
        success: true,
        message: 'Bucket structure created successfully',
        buckets: [
          { name: this.catalogBucketName, purpose: 'Product and category media' },
          { name: this.assetsBucketName, purpose: 'General store assets and library' }
        ]
      };
    } catch (error) {
      console.error('Failed to create bucket structure:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migrate files from old bucket to new structure
   * @param {string} storeId - Store ID
   */
  async migrateFiles(storeId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      if (!client) {
        throw new Error('Supabase client not initialized for store');
      }

      console.log('🔄 Starting file migration...');

      // List all files in the legacy bucket
      const { data: files, error: listError } = await client.storage
        .from(this.legacyBucketName)
        .list('', { limit: 1000 });

      if (listError) {
        console.error('Error listing files:', listError.message);
        return { success: false, error: listError.message };
      }

      if (!files || files.length === 0) {
        console.log('No files to migrate');
        return { success: true, message: 'No files to migrate' };
      }

      console.log(`Found ${files.length} files to migrate`);

      let migrated = 0;
      let failed = 0;

      for (const file of files) {
        try {
          // Skip directories
          if (!file.id) continue;

          // Download the file
          const { data: fileData, error: downloadError } = await client.storage
            .from(this.legacyBucketName)
            .download(file.name);

          if (downloadError) {
            console.error(`Failed to download ${file.name}:`, downloadError.message);
            failed++;
            continue;
          }

          // Determine destination based on file type/path
          let destinationBucket = this.catalogBucketName;
          let destinationPath = `product/images/${file.name}`;

          // If file was in uploads folder, move to library
          if (file.name.includes('uploads/') || file.name.includes('library/')) {
            destinationBucket = this.assetsBucketName;
            destinationPath = `library/${file.name.replace(/^(uploads|library)\//, '')}`;
          }

          // Upload to new location
          const { data: uploadData, error: uploadError } = await client.storage
            .from(destinationBucket)
            .upload(destinationPath, fileData, {
              contentType: file.metadata?.mimetype || 'application/octet-stream',
              upsert: true
            });

          if (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError.message);
            failed++;
          } else {
            console.log(`✅ Migrated ${file.name} to ${destinationBucket}/${destinationPath}`);
            migrated++;
          }
        } catch (error) {
          console.error(`Error migrating ${file.name}:`, error.message);
          failed++;
        }
      }

      return {
        success: true,
        message: `Migration completed: ${migrated} files migrated, ${failed} failed`,
        stats: {
          total: files.length,
          migrated,
          failed
        }
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check bucket status for a store
   * @param {string} storeId - Store ID
   */
  async checkBucketStatus(storeId) {
    try {
      const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
      if (!client) {
        throw new Error('Supabase client not initialized for store');
      }

      const { data: buckets, error } = await client.storage.listBuckets();

      if (error) {
        throw error;
      }

      const status = {
        hasLegacyBucket: false,
        hasCatalogBucket: false,
        hasAssetsBucket: false,
        buckets: []
      };

      buckets.forEach(bucket => {
        status.buckets.push(bucket.name);
        if (bucket.name === this.legacyBucketName) status.hasLegacyBucket = true;
        if (bucket.name === this.catalogBucketName) status.hasCatalogBucket = true;
        if (bucket.name === this.assetsBucketName) status.hasAssetsBucket = true;
      });

      return {
        success: true,
        status,
        needsMigration: status.hasLegacyBucket && (!status.hasCatalogBucket || !status.hasAssetsBucket)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SupabaseBucketMigration();