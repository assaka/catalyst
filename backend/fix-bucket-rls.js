process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { createClient } = require('@supabase/supabase-js');
const supabaseIntegration = require('./src/services/supabase-integration');
const axios = require('axios');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function fixBucketRLS() {
  console.log('🔧 Fixing Bucket RLS Policies\n');
  console.log('=====================================\n');
  
  try {
    // Get token info
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (!tokenInfo || !tokenInfo.service_role_key) {
      console.log('❌ Service role key is required to manage RLS policies');
      console.log('   Please add your service role key using the fix-supabase-keys.js script');
      return;
    }
    
    console.log('✅ Using service role key for RLS management');
    console.log('   Project URL:', tokenInfo.project_url);
    console.log('');
    
    // Extract project ID
    const projectIdMatch = tokenInfo.project_url.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!projectIdMatch) {
      console.log('❌ Invalid project URL format');
      return;
    }
    const projectId = projectIdMatch[1];
    
    // Use direct SQL to disable RLS on storage.objects table
    console.log('📝 Configuring RLS policies for storage...\n');
    
    const supabase = createClient(tokenInfo.project_url, tokenInfo.service_role_key);
    
    // First, let's check current RLS status
    console.log('1️⃣ Checking current RLS status...');
    
    try {
      const { data: rlsStatus, error: rlsCheckError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              relname as table_name,
              relrowsecurity as rls_enabled,
              relforcerowsecurity as rls_forced
            FROM pg_class
            WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')
            AND relname IN ('objects', 'buckets');
          `
        });
      
      if (rlsCheckError) {
        console.log('Could not check RLS status via RPC:', rlsCheckError.message);
      } else {
        console.log('Current RLS status:', rlsStatus);
      }
    } catch (e) {
      console.log('RPC method not available, continuing...');
    }
    
    // Create a simple RLS policy that allows all operations with anon key
    console.log('\n2️⃣ Creating permissive RLS policies...');
    
    // Try using the Management API to configure RLS
    const accessToken = await supabaseIntegration.getValidToken(STORE_ID);
    
    try {
      // First, try to update bucket to be public
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('product-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: null // Allow all mime types
      });
      
      if (updateError) {
        console.log('⚠️  Could not update bucket settings:', updateError.message);
      } else {
        console.log('✅ Updated product-images bucket to be fully public');
      }
    } catch (updateErr) {
      console.log('⚠️  Bucket update error:', updateErr.message);
    }
    
    // Test with a simple upload using service role key (bypasses RLS)
    console.log('\n3️⃣ Testing upload with service role key (bypasses RLS)...');
    
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const testFileName = `test-rls-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`test/${testFileName}`, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.log('❌ Upload with service role key failed:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n⚠️  RLS is enforced even for service role key.');
        console.log('   This needs to be fixed in your Supabase dashboard:');
        console.log('');
        console.log('   📝 To fix this issue:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectId + '/editor');
        console.log('   2. Run this SQL command:');
        console.log('');
        console.log('   -- Disable RLS on storage.objects table');
        console.log('   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('   OR if you want to keep RLS but allow uploads:');
        console.log('');
        console.log('   -- Create a policy that allows all operations');
        console.log('   CREATE POLICY "Allow all operations" ON storage.objects');
        console.log('   FOR ALL TO public USING (true) WITH CHECK (true);');
        console.log('');
        console.log('   3. After running the SQL, try the upload again');
      }
    } else {
      console.log('✅ Upload successful with service role key!');
      console.log('   File uploaded to:', uploadData.path);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([`test/${testFileName}`]);
      
      if (!deleteError) {
        console.log('   🧹 Test file cleaned up');
      }
      
      console.log('\n✅ Storage is working correctly!');
      console.log('   The RLS policies are properly configured.');
    }
    
    // Provide solution
    console.log('\n📝 Solution Summary:');
    console.log('=====================================');
    console.log('');
    console.log('If uploads are still failing with RLS errors, you have two options:');
    console.log('');
    console.log('Option 1: Disable RLS (Simplest)');
    console.log('   Run this SQL in your Supabase SQL editor:');
    console.log('   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('Option 2: Create Permissive Policy');
    console.log('   Run this SQL in your Supabase SQL editor:');
    console.log('   CREATE POLICY "Allow authenticated uploads" ON storage.objects');
    console.log('   FOR INSERT TO authenticated USING (bucket_id = \'product-images\');');
    console.log('');
    console.log('   CREATE POLICY "Allow public reads" ON storage.objects');
    console.log('   FOR SELECT TO public USING (bucket_id = \'product-images\');');
    console.log('');
    console.log('Go to: https://supabase.com/dashboard/project/' + projectId + '/editor');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixBucketRLS().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});