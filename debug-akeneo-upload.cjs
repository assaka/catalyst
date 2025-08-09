const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

(async () => {
  try {
    console.log('🧪 Testing Akeneo image download and upload process...');
    
    const mapping = new AkeneoMapping();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Test with a real Akeneo URL from the recent products
    const testImageUrl = 'https://akeneo.pimwelhof.hypernode.io/api/rest/v1/media-files/7/0/c/9/70c9ccc17c20d063a1db19610313965e4a2d46cc_rs66a8101b1_2679.jpg/download';
    const testItem = {
      data: testImageUrl,
      locale: null,
      scope: null
    };
    
    console.log('📥 Testing downloadAndUploadImage method...');
    console.log('  Image URL:', testImageUrl);
    console.log('  Store ID:', storeId);
    
    try {
      // This should show us exactly where it's failing
      const result = await mapping.downloadAndUploadImage(
        testImageUrl, 
        testItem, 
        storeId, 
        null, // no auth client needed for this test
        'TEST-SKU'
      );
      
      console.log('✅ Upload successful!');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      
    } catch (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('📋 Full error:', uploadError.stack);
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
})();