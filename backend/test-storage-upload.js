const storageManager = require('./src/services/storage-manager');

// Test store ID
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

// Mock file object (similar to what multer provides)
const mockFile = {
  originalname: 'test-image.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake image data'),
  size: 15
};

// Test the upload with detailed error logging
async function testUpload() {
  try {
    console.log('🧪 Testing storage upload for store:', STORE_ID);
    console.log('📁 Mock file:', {
      name: mockFile.originalname,
      type: mockFile.mimetype,
      size: mockFile.size
    });
    
    // First, check if a storage provider is available
    console.log('\n🔍 Checking storage provider...');
    try {
      const provider = await storageManager.getStorageProvider(STORE_ID);
      console.log('✅ Storage provider found:', provider.type);
      console.log('   Name:', provider.name);
    } catch (providerError) {
      console.error('❌ No storage provider available:', providerError.message);
      return;
    }
    
    // Try to upload the file
    console.log('\n📤 Attempting file upload...');
    const result = await storageManager.uploadFile(STORE_ID, mockFile, {
      folder: 'library',
      public: true
    });
    
    console.log('✅ Upload successful!');
    console.log('   Path:', result.path);
    console.log('   URL:', result.url);
    console.log('   Provider:', result.provider);
    
  } catch (error) {
    console.error('\n❌ Upload failed with error:');
    console.error('   Type:', error.constructor.name);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
    // Check for specific error conditions
    if (error.message.includes('No storage provider')) {
      console.log('\n💡 Solution: Configure a storage provider (Supabase, S3, or GCS) in the integrations settings');
    } else if (error.message.includes('Authentication')) {
      console.log('\n💡 Solution: Re-authenticate with Supabase or check API keys');
    } else if (error.message.includes('service role key')) {
      console.log('\n💡 Solution: Ensure Supabase service role key is configured');
    }
  }
}

// Run the test
testUpload().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});