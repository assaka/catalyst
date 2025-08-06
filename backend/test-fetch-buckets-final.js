process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { createClient } = require('@supabase/supabase-js');
const supabaseIntegration = require('./src/services/supabase-integration');
const supabaseStorage = require('./src/services/supabase-storage');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testBucketFetching() {
  console.log('🧪 Testing Supabase Bucket Fetching\n');
  console.log('=====================================\n');
  
  try {
    // Method 1: Using the storage service
    console.log('Method 1: Using supabaseStorage.listBuckets()\n');
    console.log('------------------------------------------------\n');
    
    try {
      const listResult = await supabaseStorage.listBuckets(STORE_ID);
      
      if (listResult.success) {
        console.log(`✅ Successfully fetched ${listResult.buckets.length} bucket(s):\n`);
        
        if (listResult.buckets.length === 0) {
          console.log('   No buckets found\n');
        } else {
          listResult.buckets.forEach((bucket, index) => {
            console.log(`   ${index + 1}. ${bucket.name || bucket.id}`);
            console.log(`      - ID: ${bucket.id}`);
            console.log(`      - Public: ${bucket.public ? 'Yes' : 'No'}`);
            console.log('');
          });
        }
        
        if (listResult.limited) {
          console.log('⚠️  Limited access (service role key required for full management)\n');
        }
      }
    } catch (error) {
      console.log('❌ Error with storage service:', error.message, '\n');
    }
    
    // Method 2: Direct Supabase client
    console.log('\nMethod 2: Direct Supabase Client\n');
    console.log('------------------------------------------------\n');
    
    // Get token info
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (!tokenInfo || !tokenInfo.anon_key) {
      console.log('❌ No Supabase credentials found\n');
      return;
    }
    
    console.log('✅ Found credentials:');
    console.log('   Project URL:', tokenInfo.project_url);
    console.log('   Has Anon Key:', !!tokenInfo.anon_key);
    console.log('   Has Service Key:', !!tokenInfo.service_role_key);
    console.log('');
    
    // Create Supabase client
    const supabase = createClient(tokenInfo.project_url, tokenInfo.anon_key);
    
    console.log('📦 Fetching buckets directly...\n');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error fetching buckets:', error.message);
      console.log('   Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Direct fetch successful!\n');
      
      if (!buckets || buckets.length === 0) {
        console.log('   No buckets found in this Supabase project');
        console.log('   Create buckets in your Supabase dashboard or via the Catalyst UI');
      } else {
        console.log(`   Found ${buckets.length} bucket(s):\n`);
        buckets.forEach((bucket, index) => {
          console.log(`   ${index + 1}. ${bucket.name}`);
          console.log(`      - ID: ${bucket.id}`);
          console.log(`      - Public: ${bucket.public ? 'Yes' : 'No'}`);
          console.log(`      - Created: ${bucket.created_at}`);
          console.log(`      - Updated: ${bucket.updated_at}`);
          console.log('');
        });
      }
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
  console.log('\n✅ Test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});