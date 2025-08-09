const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Final Mapping Fix with Proper Data Types');
console.log('==================================================');

(async () => {
  try {
    // Test the COMPLETE format with dataType specified
    const frontendPayloadComplete = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',
          catalystField: 'compare_price',
          dataType: 'number'                    // ← This is crucial for price extraction!
        }
      ]
    };
    
    // Test with real product format from your database
    const testProduct = {
      identifier: 'test-complete-fix',
      enabled: true,
      values: {
        name: [{ data: 'Test Product Complete Fix', locale: 'en_US' }],
        price: [{ 
          data: [{"amount": "999.00", "currency": "EUR"}], 
          locale: null 
        }],
        special_price: [{ 
          data: [{"amount": "649.00", "currency": "EUR"}], 
          locale: null 
        }]
      }
    };
    
    console.log('\n🎯 Testing COMPLETE fixed format:');
    console.log('   ✅ Field name: akeneoAttribute');
    console.log('   ✅ Data type: number (for price extraction)');
    console.log('   ✅ Real Akeneo price format');
    
    const result = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      frontendPayloadComplete,
      { downloadImages: false }
    );
    
    console.log('\n📦 RESULT:');
    console.log('   Product Name:', result.name);
    console.log('   Regular Price:', result.price);
    console.log('   Compare Price:', result.compare_price);
    console.log('   Compare Price Type:', typeof result.compare_price);
    
    if (result.compare_price === 649) {
      console.log('\n🎉 SUCCESS! Complete fix works perfectly!');
      console.log('✅ special_price complex format → compare_price numeric value');
    } else if (typeof result.compare_price === 'object') {
      console.log('\n⚠️ Price extraction still needs work for complex format');
      console.log('   Got object:', result.compare_price);
      console.log('   Expected: 649 (number)');
    } else {
      console.log('\n❌ Unexpected result:', result.compare_price);
    }
    
    // Test with simple format to ensure it still works
    console.log('\n🧪 Testing simple format to ensure backward compatibility:');
    const simpleTestProduct = {
      identifier: 'test-simple-format',
      enabled: true,
      values: {
        special_price: [{ data: '89.99', locale: 'en_US' }]
      }
    };
    
    const simpleResult = await mapping.transformProduct(
      simpleTestProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      frontendPayloadComplete,
      { downloadImages: false }
    );
    
    console.log('   Simple format result:', simpleResult.compare_price);
    console.log('   Simple format type:', typeof simpleResult.compare_price);
    
    if (simpleResult.compare_price === 89.99) {
      console.log('   ✅ Simple format still works!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();