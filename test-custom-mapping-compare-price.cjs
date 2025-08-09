const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Custom Mapping: special_price → compare_price');
console.log('====================================================');

// Test product with special_price
const testProduct = {
  identifier: 'test-special-price',
  enabled: true,
  values: {
    name: [{ data: 'Test Product Special Price', locale: 'en_US' }],
    price: [{ data: '99.99', locale: 'en_US' }],
    special_price: [{ data: '79.99', locale: 'en_US' }]
  }
};

// Custom mapping configuration
const customMappings = {
  attributes: [
    {
      enabled: true,
      akeneoAttribute: 'special_price',
      catalystField: 'compare_price',
      dataType: 'number',
      fallbacks: ['sale_price', 'discount_price'],
      defaultValue: null
    }
  ]
};

(async () => {
  try {
    console.log('\n🔍 Testing custom mapping configuration:');
    console.log('  special_price → compare_price (dataType: number)');
    
    const product = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      customMappings,
      { downloadImages: false }
    );
    
    console.log('\n📦 Transformed Product Result:');
    console.log('   Name:', product.name);
    console.log('   Price:', product.price, '(type:', typeof product.price, ')');
    console.log('   Compare Price:', product.compare_price, '(type:', typeof product.compare_price, ')');
    
    // Check if special_price is also in attributes
    console.log('\n📋 Attributes Object:');
    console.log('   special_price in attributes:', product.attributes.special_price || 'not found');
    console.log('   compare_price in attributes:', product.attributes.compare_price || 'not found');
    
    console.log('\n✅ Custom Mapping Validation:');
    if (product.compare_price === 79.99) {
      console.log('  ✅ SUCCESS: special_price mapped to compare_price field (79.99)');
    } else {
      console.log('  ❌ FAILED: compare_price is', product.compare_price, 'instead of 79.99');
    }
    
    if (!product.attributes.special_price) {
      console.log('  ✅ SUCCESS: special_price not duplicated in attributes (custom mapped)');
    } else {
      console.log('  ⚠️  INFO: special_price also found in attributes:', product.attributes.special_price);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();