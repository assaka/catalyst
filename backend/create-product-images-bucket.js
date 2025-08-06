process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { createClient } = require('@supabase/supabase-js');
const supabaseIntegration = require('./src/services/supabase-integration');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function createProductImagesBucket() {
  try {
    // Get token info
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (!tokenInfo || !tokenInfo.anon_key) {
      console.log('❌ No Supabase credentials found');
      return;
    }
    
    console.log('✅ Using credentials:');
    console.log('   Project URL:', tokenInfo.project_url);
    console.log('   Using key type:', tokenInfo.service_role_key ? 'service_role' : 'anon');
    console.log('');
    
    // Use service role key if available, otherwise anon key
    const apiKey = tokenInfo.service_role_key || tokenInfo.anon_key;
    const supabase = createClient(tokenInfo.project_url, apiKey);
    
    console.log('📦 Creating product-images bucket...');
    
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    });
    
    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('✅ product-images bucket already exists');
      } else {
        console.log('❌ Error creating bucket:', error.message);
      }
    } else {
      console.log('✅ Successfully created product-images bucket');
      console.log('   Bucket details:', data);
    }
    
    // List buckets to confirm
    console.log('');
    console.log('📦 Listing all buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
    } else {
      console.log('✅ Found', (buckets || []).length, 'bucket(s):');
      (buckets || []).forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name}`);
        console.log(`      - ID: ${bucket.id}`);
        console.log(`      - Public: ${bucket.public ? 'Yes' : 'No'}`);
        if (bucket.created_at) {
          console.log(`      - Created: ${new Date(bucket.created_at).toLocaleString()}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

createProductImagesBucket().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});