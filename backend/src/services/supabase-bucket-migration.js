const supabaseIntegration = require('./supabase-integration');

/**
 * Supabase Bucket Migration Service
 * Handles renaming buckets and migrating files to new structure
 */
class SupabaseBucketMigration {
  constructor() {
    this.catalogBucketName = 'suprshop-catalog';
    this.assetsBucketName = 'suprshop-assets';
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
        hasCatalogBucket: false,
        hasAssetsBucket: false,
        buckets: []
      };

      buckets.forEach(bucket => {
        status.buckets.push(bucket.name);
        if (bucket.name === this.catalogBucketName) status.hasCatalogBucket = true;
        if (bucket.name === this.assetsBucketName) status.hasAssetsBucket = true;
      });

      return {
        success: true,
        status,
        needsSetup: !status.hasCatalogBucket || !status.hasAssetsBucket
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