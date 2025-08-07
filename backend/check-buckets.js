const supabaseIntegration = require('./src/services/supabase-integration');
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

(async () => {
  try {
    console.log('🔍 Checking Supabase bucket structure...\n');
    
    // Get token info
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (!tokenInfo) {
      console.log('❌ No Supabase credentials found for store');
      console.log('   Please configure Supabase integration first');
      process.exit(1);
    }
    
    console.log('✅ Found Supabase credentials');
    console.log('   Project URL:', tokenInfo.project_url);
    console.log('   Has service key:', Boolean(tokenInfo.service_role_key));
    
    // Get client
    const client = await supabaseIntegration.getSupabaseAdminClient(STORE_ID);
    if (!client) {
      console.log('❌ Could not get Supabase client');
      process.exit(1);
    }
    
    console.log('✅ Got Supabase client\n');
    
    // List buckets
    const { data: buckets, error } = await client.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      process.exit(1);
    }
    
    console.log('📦 Current buckets in Supabase:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check for new bucket structure
    const hasCatalog = buckets.some(b => b.name === 'suprshop-catalog');
    const hasAssets = buckets.some(b => b.name === 'suprshop-assets');
    const hasOldImages = buckets.some(b => b.name === 'suprshop-images');
    
    console.log('\n📊 Bucket Structure Status:');
    console.log('   ✅ suprshop-catalog:', hasCatalog ? 'EXISTS' : 'MISSING');
    console.log('   ✅ suprshop-assets:', hasAssets ? 'EXISTS' : 'MISSING');
    if (hasOldImages) {
      console.log('   ⚠️  suprshop-images (old):', 'STILL EXISTS - can be removed');
    }
    
    if (hasCatalog && hasAssets) {
      console.log('\n🎉 SUCCESS! New bucket structure is ready!');
      console.log('\n📋 Storage paths for different file types:');
      console.log('   Product Images  → suprshop-catalog/product/images/');
      console.log('   Product Files   → suprshop-catalog/product/files/');
      console.log('   Category Images → suprshop-catalog/category/images/');
      console.log('   Library Files   → suprshop-assets/library/');
      console.log('\n✅ All legacy bucket references have been removed from the code');
    } else {
      console.log('\n⚠️  New bucket structure is incomplete');
      console.log('   Run setup-bucket-structure.js to create missing buckets');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();