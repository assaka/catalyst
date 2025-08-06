process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const supabaseStorage = require('./src/services/supabase-storage');
const supabaseIntegration = require('./src/services/supabase-integration');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testBucketFetching() {
  console.log('🧪 Testing Supabase Bucket Fetching\n');
  console.log('=====================================\n');
  
  try {
    // First check connection status
    console.log('1️⃣ Checking Supabase connection status...\n');
    const status = await supabaseIntegration.getConnectionStatus(STORE_ID);
    
    console.log('Connection Status:');
    console.log('   - Connected:', status.connected);
    console.log('   - Project URL:', status.projectUrl);
    console.log('   - Has Anon Key:', status.hasAnonKey);
    console.log('   - Has Service Role Key:', status.hasServiceRoleKey);
    console.log('   - Storage Ready:', status.storageReady);
    console.log('');
    
    if (!status.connected) {
      console.log('❌ Supabase is not connected. Please connect via the dashboard.');
      return;
    }
    
    // Now fetch buckets
    console.log('2️⃣ Fetching storage buckets...\n');
    const listResult = await supabaseStorage.listBuckets(STORE_ID);
    
    if (listResult.success) {
      console.log(`✅ Successfully fetched ${listResult.buckets.length} bucket(s):\n`);
      
      if (listResult.buckets.length === 0) {
        console.log('   No buckets found. Create one in your Supabase dashboard or via the Catalyst UI.\n');
      } else {
        listResult.buckets.forEach((bucket, index) => {
          console.log(`   ${index + 1}. ${bucket.name || bucket.id}`);
          console.log(`      - ID: ${bucket.id}`);
          console.log(`      - Public: ${bucket.public ? 'Yes' : 'No'}`);
          if (bucket.created_at) {
            console.log(`      - Created: ${new Date(bucket.created_at).toLocaleString()}`);
          }
          if (bucket.updated_at) {
            console.log(`      - Updated: ${new Date(bucket.updated_at).toLocaleString()}`);
          }
          console.log('');
        });
      }
      
      if (listResult.limited) {
        console.log('⚠️  Note: Limited bucket access. Service role key required for full management.\n');
        console.log('   To enable full bucket management:');
        console.log('   1. Go to your Supabase project settings');
        console.log('   2. Copy the service_role key');
        console.log('   3. Add it in the Catalyst dashboard\n');
      }
      
      if (listResult.message) {
        console.log('ℹ️  ', listResult.message, '\n');
      }
    } else {
      console.log('❌ Failed to fetch buckets\n');
    }
    
    // Test creating a bucket (if we have service role key)
    if (status.hasServiceRoleKey) {
      console.log('3️⃣ Testing bucket creation (service role key available)...\n');
      
      const testBucketName = `test-bucket-${Date.now()}`;
      console.log(`   Creating test bucket: ${testBucketName}`);
      
      try {
        const createResult = await supabaseStorage.createBucket(STORE_ID, testBucketName, {
          public: true
        });
        
        if (createResult.success) {
          console.log(`   ✅ Successfully created bucket: ${testBucketName}`);
          
          // Now delete it to clean up
          console.log(`   🧹 Cleaning up - deleting test bucket...`);
          const deleteResult = await supabaseStorage.deleteBucket(STORE_ID, testBucketName);
          
          if (deleteResult.success) {
            console.log(`   ✅ Test bucket deleted successfully\n`);
          } else {
            console.log(`   ⚠️  Could not delete test bucket: ${deleteResult.message}\n`);
          }
        }
      } catch (createError) {
        console.log(`   ❌ Could not create test bucket: ${createError.message}\n`);
      }
    } else {
      console.log('ℹ️  Skipping bucket creation test (service role key not configured)\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
  }
}

// Run the test
console.log('Configuration:');
console.log('   Store ID:', STORE_ID);
console.log('   Environment:', process.env.NODE_ENV);
console.log('');

testBucketFetching().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});