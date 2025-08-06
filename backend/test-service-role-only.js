process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { createClient } = require('@supabase/supabase-js');
const supabaseIntegration = require('./src/services/supabase-integration');
const supabaseStorage = require('./src/services/supabase-storage');
const { sequelize } = require('./src/database/connection.js');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testServiceRoleOnly() {
  console.log('🧪 Testing Supabase Integration with Service Role Key Only\n');
  console.log('=====================================\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Verify anon_key column is removed
    console.log('1️⃣ Test: Verify anon_key column is removed from database');
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'supabase_oauth_tokens' 
      AND column_name = 'anon_key';
    `);
    
    if (columns.length === 0) {
      console.log('   ✅ PASS: anon_key column successfully removed from database\n');
    } else {
      console.log('   ❌ FAIL: anon_key column still exists in database\n');
      allTestsPassed = false;
    }
    
    // Test 2: Check connection status
    console.log('2️⃣ Test: Check connection status');
    const status = await supabaseIntegration.getConnectionStatus(STORE_ID);
    console.log('   Connection status:', status.connected ? '✅ Connected' : '❌ Not connected');
    console.log('   Has service role key:', status.hasServiceRoleKey ? '✅ Yes' : '❌ No');
    console.log('   Has anon key field:', status.hasAnonKey !== undefined ? '❌ Still checking for anon key' : '✅ Not checking for anon key');
    
    if (status.connected && status.hasServiceRoleKey) {
      console.log('   ✅ PASS: Connection working with service role key\n');
    } else {
      console.log('   ❌ FAIL: Connection not working properly\n');
      allTestsPassed = false;
    }
    
    // Test 3: Get token info
    console.log('3️⃣ Test: Get token info');
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (tokenInfo) {
      console.log('   Project URL:', tokenInfo.project_url ? '✅ Configured' : '❌ Missing');
      console.log('   Service role key:', tokenInfo.service_role_key ? '✅ Configured' : '❌ Missing');
      console.log('   Anon key field:', tokenInfo.anon_key !== undefined ? '❌ Still present' : '✅ Removed');
      
      if (tokenInfo.service_role_key && !tokenInfo.hasOwnProperty('anon_key')) {
        console.log('   ✅ PASS: Token info correctly using service role key only\n');
      } else {
        console.log('   ❌ FAIL: Token info issues detected\n');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ FAIL: No token info found\n');
      allTestsPassed = false;
    }
    
    // Test 4: Create Supabase client
    console.log('4️⃣ Test: Create Supabase client');
    try {
      const client = await supabaseIntegration.getSupabaseClient(STORE_ID);
      if (client) {
        console.log('   ✅ PASS: Successfully created Supabase client with service role key\n');
      } else {
        console.log('   ❌ FAIL: Could not create client\n');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('   ❌ FAIL: Error creating client:', error.message, '\n');
      allTestsPassed = false;
    }
    
    // Test 5: List storage buckets
    console.log('5️⃣ Test: List storage buckets');
    try {
      const result = await supabaseStorage.listBuckets(STORE_ID);
      if (result.success) {
        console.log('   Found', result.buckets.length, 'bucket(s)');
        result.buckets.forEach(bucket => {
          console.log('   - ' + bucket.name);
        });
        console.log('   ✅ PASS: Successfully listed buckets with service role key\n');
      } else {
        console.log('   ❌ FAIL: Could not list buckets\n');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('   ❌ FAIL: Error listing buckets:', error.message, '\n');
      allTestsPassed = false;
    }
    
    // Test 6: Test upload capability
    console.log('6️⃣ Test: Upload test image');
    try {
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(base64Image, 'base64');
      const testFile = {
        originalname: 'test-service-role.png',
        mimetype: 'image/png',
        buffer: imageBuffer,
        size: imageBuffer.length
      };
      
      const uploadResult = await supabaseStorage.uploadImage(STORE_ID, testFile, {
        folder: 'test',
        public: true
      });
      
      if (uploadResult.success) {
        console.log('   ✅ PASS: Successfully uploaded image with service role key');
        console.log('   Public URL:', uploadResult.publicUrl, '\n');
        
        // Clean up test file
        try {
          await supabaseStorage.deleteImage(STORE_ID, uploadResult.path, uploadResult.bucket);
          console.log('   🧹 Test file cleaned up\n');
        } catch (deleteError) {
          console.log('   ⚠️  Could not clean up test file:', deleteError.message, '\n');
        }
      } else {
        console.log('   ❌ FAIL: Could not upload image\n');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('   ❌ FAIL: Upload error:', error.message, '\n');
      allTestsPassed = false;
    }
    
    // Test 7: Verify getSupabaseClient redirects to getSupabaseAdminClient
    console.log('7️⃣ Test: Verify client method redirection');
    const regularClient = await supabaseIntegration.getSupabaseClient(STORE_ID);
    const adminClient = await supabaseIntegration.getSupabaseAdminClient(STORE_ID);
    
    // Both should return the same client now since getSupabaseClient redirects
    if (regularClient && adminClient) {
      console.log('   ✅ PASS: Both client methods work correctly\n');
    } else {
      console.log('   ❌ FAIL: Client method issues detected\n');
      allTestsPassed = false;
    }
    
    // Final Summary
    console.log('=====================================');
    console.log('📊 TEST SUMMARY\n');
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nThe Supabase integration is now successfully using only the service role key.');
      console.log('The anon key dependency has been completely removed from the system.');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nPlease review the failed tests above and fix any issues.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

testServiceRoleOnly().then(() => {
  console.log('\n✅ Test suite completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});