require('dotenv').config({ path: '.env.local' });
const supabaseStorage = require('./src/services/supabase-storage');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testBucketOperations() {
  console.log('🧪 Testing Supabase Bucket Operations\n');
  console.log('=====================================\n');
  
  try {
    // Test 1: List buckets
    console.log('1️⃣ Fetching existing buckets...\n');
    const listResult = await supabaseStorage.listBuckets(STORE_ID);
    
    if (listResult.success) {
      console.log(`✅ Successfully fetched ${listResult.buckets.length} bucket(s):\n`);
      
      listResult.buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name}`);
        console.log(`      - ID: ${bucket.id}`);
        console.log(`      - Public: ${bucket.public ? 'Yes' : 'No'}`);
        if (bucket.created_at) {
          console.log(`      - Created: ${new Date(bucket.created_at).toLocaleString()}`);
        }
        console.log('');
      });
      
      if (listResult.limited) {
        console.log('⚠️  Note: Limited bucket access. Service role key required for full management.\n');
      }
    } else {
      console.log('❌ Failed to fetch buckets\n');
    }
    
    // Test 2: Create a test bucket (optional - uncomment to test)
    /*
    console.log('2️⃣ Creating a test bucket...\n');
    const testBucketName = `test-bucket-${Date.now()}`;
    
    try {
      const createResult = await supabaseStorage.createBucket(STORE_ID, testBucketName, {
        public: true
      });
      
      if (createResult.success) {
        console.log(`✅ Successfully created bucket: ${testBucketName}\n`);
        console.log('   Bucket details:', createResult.bucket);
        
        // Clean up - delete the test bucket
        console.log('\n3️⃣ Cleaning up - deleting test bucket...\n');
        const deleteResult = await supabaseStorage.deleteBucket(STORE_ID, testBucketName);
        
        if (deleteResult.success) {
          console.log('✅ Test bucket deleted successfully\n');
        }
      }
    } catch (createError) {
      console.log('❌ Could not create test bucket:', createError.message);
      console.log('   This might be due to missing service role key\n');
    }
    */
    
    // Test 3: Check storage stats
    console.log('3️⃣ Fetching storage statistics...\n');
    try {
      const statsResult = await supabaseStorage.getStorageStats(STORE_ID);
      
      if (statsResult.success) {
        console.log('✅ Storage Statistics:');
        console.log(`   - Total Files: ${statsResult.summary.totalFiles}`);
        console.log(`   - Total Size: ${statsResult.summary.totalSizeMB} MB`);
        console.log(`   - Total Size: ${statsResult.summary.totalSizeGB} GB\n`);
        
        if (statsResult.stats && statsResult.stats.length > 0) {
          console.log('   Breakdown by bucket:');
          statsResult.stats.forEach(stat => {
            console.log(`   - ${stat.bucket}: ${stat.fileCount} files (${stat.totalSizeMB} MB)`);
          });
        }
      }
    } catch (statsError) {
      console.log('⚠️  Could not fetch storage stats:', statsError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Make sure Supabase is connected in the dashboard');
    console.error('   2. Check that API keys are configured (anon key and/or service role key)');
    console.error('   3. Verify the project is active in Supabase dashboard');
  }
}

// Run the test
console.log('Store ID:', STORE_ID);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('');

testBucketOperations().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});