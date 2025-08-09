const storageManager = require('./backend/src/services/storage-manager');

(async () => {
  try {
    console.log('🧪 Testing storage manager with mock file upload...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Create a mock file object similar to what downloadAndUploadImage creates
    const mockFile = {
      originalname: 'test-akeneo-image.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test image data for Akeneo import'),
      size: 100
    };
    
    // Test upload with the exact same options as used in downloadAndUploadImage
    console.log('📤 Attempting upload with storage manager...');
    const uploadResult = await storageManager.uploadFile(storeId, mockFile, {
      useOrganizedStructure: true,
      type: 'product',
      filename: 'test-akeneo-image.jpg',
      customPath: 'product/images/test-akeneo-image.jpg',
      public: true,
      metadata: {
        store_id: storeId,
        upload_type: 'akeneo_product_image',
        source: 'akeneo_import',
        original_url: 'https://example.com/test.jpg',
        relative_path: 'product/images/test-akeneo-image.jpg'
      }
    });
    
    console.log('📊 Upload result:', JSON.stringify(uploadResult, null, 2));
    
    if (uploadResult && uploadResult.success) {
      console.log('✅ Storage manager upload successful');
      console.log('🔗 URL:', uploadResult.url);
      console.log('🏠 Provider:', uploadResult.provider);
    } else {
      console.log('❌ Storage manager upload failed');
      console.log('📋 Details:', uploadResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📍 Stack:', error.stack);
  }
})();