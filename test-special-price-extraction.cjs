const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Special Price Extraction - Real Data Format');
console.log('===================================================');

// Test with the REAL format you have in your database
const realFormatProduct = {
  identifier: 'test-real-special-price',
  enabled: true,
  values: {
    name: [{ data: 'Real Format Test Product', locale: 'en_US' }],
    price: [{ data: '99.99', locale: 'en_US' }],
    // This is the REAL format from your database
    special_price: [{ 
      data: [
        {"amount": "79.99", "currency": "EUR"}, 
        {"amount": "79.99", "currency": "USD"}
      ], 
      locale: null, 
      scope: null 
    }]
  }
};

const customMappings = {
  attributes: [
    {
      enabled: true,
      akeneoAttribute: 'special_price',
      catalystField: 'compare_price',
      dataType: 'number'
    }
  ]
};

(async () => {
  try {
    console.log('\n🔍 Testing with REAL Akeneo special_price format...');
    console.log('special_price data:', JSON.stringify(realFormatProduct.values.special_price, null, 2));
    
    const result = await mapping.transformProduct(
      realFormatProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      customMappings,
      { downloadImages: false }
    );
    
    console.log('\n📊 Extraction Results:');
    console.log('  Price:', result.price);
    console.log('  Compare Price:', result.compare_price);
    console.log('  special_price in attributes:', result.attributes.special_price || 'not found');
    
    if (result.compare_price) {
      console.log('  ✅ SUCCESS: Complex price format extracted correctly');
    } else {
      console.log('  ❌ FAILED: Complex price format not handled');
      console.log('  🔧 Need to enhance price extraction for complex formats');
    }
    
    // Test the raw extraction
    console.log('\n🔬 Testing raw value extraction...');
    const rawValue = mapping.extractProductValue(realFormatProduct.values, 'special_price', 'en_US');
    console.log('  Raw extracted value:', rawValue);
    console.log('  Type:', typeof rawValue);
    
    if (Array.isArray(rawValue)) {
      console.log('  📋 Array contents:', rawValue);
      if (rawValue[0] && rawValue[0].amount) {
        console.log('  💰 First amount:', rawValue[0].amount);
        console.log('  💱 First currency:', rawValue[0].currency);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();