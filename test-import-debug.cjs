const AkeneoIntegration = require('./backend/src/services/akeneo-integration.js');

console.log('🧪 Testing actual Akeneo import to reproduce the error...');

(async () => {
  try {
    const integration = new AkeneoIntegration();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('🔄 Initializing Akeneo integration...');
    await integration.initialize(storeId);
    
    console.log('✅ Integration initialized');
    
    // Test importing just 1 product to isolate the issue
    console.log('\n🔄 Importing 1 product to test for errors...');
    
    const result = await integration.importProducts({
      storeId,
      limit: 1,
      downloadImages: false,
      debug: true
    });
    
    console.log('\n📊 Import Result:');
    console.log('  Success:', result.success);
    console.log('  Message:', result.message);
    console.log('  Products processed:', result.totalProcessed || 0);
    console.log('  Successful imports:', result.successfulImports || 0);
    console.log('  Failed imports:', result.failedImports || 0);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Import Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
        
        if (error.includes('invalid input syntax for type numeric')) {
          console.log('  🎯 FOUND THE NUMERIC CONVERSION ERROR!');
          console.log('  💡 This error is still occurring despite our fix');
        }
      });
    }
    
    if (result.failedProducts && result.failedProducts.length > 0) {
      console.log('\n📋 Failed Products:');
      result.failedProducts.forEach((failedProduct, index) => {
        console.log(`  ${index + 1}. ${failedProduct.identifier || 'Unknown'}: ${failedProduct.error}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Import test failed:', error.message);
    console.log('📍 Stack:', error.stack);
    
    if (error.message.includes('invalid input syntax for type numeric')) {
      console.log('🎯 FOUND THE ERROR in the integration layer!');
      console.log('💡 The error is happening at a higher level than our mapping fix');
    }
  }
})();