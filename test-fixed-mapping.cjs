const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Fixed Mapping Field Names');
console.log('===================================');

(async () => {
  try {
    // Test the EXACT format that the frontend now sends after the fix
    const frontendPayloadAfterFix = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',    // ← Now using correct field name!
          catalystField: 'compare_price'
        }
      ]
    };
    
    // Test with real product format
    const testProduct = {
      identifier: 'test-fixed-mapping',
      enabled: true,
      values: {
        name: [{ data: 'Test Product Fixed Mapping', locale: 'en_US' }],
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
    
    console.log('\n🎯 Testing with FIXED frontend format:');
    console.log('   Frontend now sends: akeneoAttribute ✅');
    console.log('   Backend expects: akeneoAttribute ✅');
    console.log('   ✅ FIELD NAMES MATCH!');
    
    const result = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      frontendPayloadAfterFix,
      { downloadImages: false }
    );
    
    console.log('\n📦 RESULT:');
    console.log('   Product Name:', result.name);
    console.log('   Regular Price:', result.price);
    console.log('   Compare Price:', result.compare_price);
    console.log('   special_price in attributes:', result.attributes?.special_price || 'not found');
    
    if (result.compare_price === 649) {
      console.log('\n🎉 SUCCESS! Custom mapping now works!');
      console.log('✅ special_price (649.00 EUR) → compare_price (649)');
      console.log('');
      console.log('🎯 NEXT STEPS FOR USER:');
      console.log('1. Refresh your admin interface');
      console.log('2. Configure mapping: special_price → compare_price');
      console.log('3. Click "Import product"');
      console.log('4. Check products: compare_price should now be populated!');
    } else {
      console.log('\n❌ Still not working. Compare price:', result.compare_price);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();