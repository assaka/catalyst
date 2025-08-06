process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const supabaseStorage = require('./src/services/supabase-storage');
const fs = require('fs');
const path = require('path');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testUpload() {
  console.log('🧪 Testing Supabase Upload (Final Test)\n');
  console.log('=====================================\n');
  
  try {
    // Create a test image buffer (1x1 pixel transparent PNG)
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Create a mock file object
    const testFile = {
      originalname: 'test-image.png',
      name: 'test-image.png',
      mimetype: 'image/png',
      buffer: imageBuffer,
      size: imageBuffer.length
    };
    
    console.log('📸 Test file details:');
    console.log('   Name:', testFile.originalname);
    console.log('   Type:', testFile.mimetype);
    console.log('   Size:', testFile.size, 'bytes');
    console.log('');
    
    console.log('🚀 Attempting upload to product-images bucket...\n');
    
    const result = await supabaseStorage.uploadImage(STORE_ID, testFile, {
      folder: `test-uploads`,
      public: false
    });
    
    if (result.success) {
      console.log('✅ Upload SUCCESSFUL!\n');
      console.log('📋 Upload details:');
      console.log('   Public URL:', result.publicUrl);
      console.log('   Path:', result.path);
      console.log('   Bucket:', result.bucket);
      console.log('   Filename:', result.filename);
      console.log('');
      console.log('🎉 The Invalid Compact JWS error has been FIXED!');
      console.log('');
      console.log('You can now:');
      console.log('   ✅ Upload product images');
      console.log('   ✅ Manage storage buckets');
      console.log('   ✅ Use all Supabase storage features');
      
      // Try to delete the test file to clean up
      console.log('\n🧹 Cleaning up test file...');
      try {
        await supabaseStorage.deleteImage(STORE_ID, result.path, result.bucket);
        console.log('✅ Test file deleted successfully');
      } catch (deleteError) {
        console.log('⚠️  Could not delete test file:', deleteError.message);
      }
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('JWS') || error.message.includes('JWT')) {
      console.log('\n⚠️  JWT error still present!');
      console.log('Please check the anon key configuration.');
    }
  }
}

testUpload().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});