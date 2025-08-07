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
      console.log('Has catalog bucket (suprshop-catalog):', statusResult.status.hasCatalogBucket);
      console.log('Has assets bucket (suprshop-assets):', statusResult.status.hasAssetsBucket);
      console.log('Needs setup:', statusResult.needsSetup);
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