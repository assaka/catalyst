const bucketMigration = require('./src/services/supabase-bucket-migration');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

(async () => {
  try {
    console.log('🚀 Setting up new bucket structure for store:', STORE_ID);
    console.log('================================================');
    
    // 1. Check current bucket status
    console.log('\n📊 Checking current bucket status...');
    const statusResult = await bucketMigration.checkBucketStatus(STORE_ID);
    
    if (statusResult.success) {
      console.log('Current buckets:', statusResult.status.buckets);
      console.log('Has legacy bucket (suprshop-images):', statusResult.status.hasLegacyBucket);
      console.log('Has catalog bucket (suprshop-catalog):', statusResult.status.hasCatalogBucket);
      console.log('Has assets bucket (suprshop-assets):', statusResult.status.hasAssetsBucket);
      console.log('Needs migration:', statusResult.needsMigration);
    } else {
      console.error('Failed to check bucket status:', statusResult.error);
    }
    
    // 2. Create new bucket structure
    console.log('\n🔧 Creating new bucket structure...');
    const createResult = await bucketMigration.createBucketStructure(STORE_ID);
    
    if (createResult.success) {
      console.log('✅', createResult.message);
      console.log('\n📦 Bucket structure:');
      createResult.buckets.forEach(bucket => {
        console.log(`  - ${bucket.name}: ${bucket.purpose}`);
      });
    } else {
      console.error('❌ Failed to create bucket structure:', createResult.error);
      process.exit(1);
    }
    
    // 3. Optional: Migrate existing files
    if (statusResult.success && statusResult.status.hasLegacyBucket) {
      console.log('\n🔄 Do you want to migrate files from suprshop-images to the new structure?');
      console.log('(Skipping automatic migration - run manually if needed)');
      // Uncomment to enable migration:
      // const migrateResult = await bucketMigration.migrateFiles(STORE_ID);
      // if (migrateResult.success) {
      //   console.log('✅', migrateResult.message);
      // } else {
      //   console.error('❌ Migration failed:', migrateResult.error);
      // }
    }
    
    console.log('\n✅ Bucket structure setup complete!');
    console.log('\n📋 New storage structure:');
    console.log('  Product images: suprshop-catalog/product/images/');
    console.log('  Product files: suprshop-catalog/product/files/');
    console.log('  Category images: suprshop-catalog/category/images/');
    console.log('  Library files: suprshop-assets/library/');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
})();