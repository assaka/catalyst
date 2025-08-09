const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Fixed Custom Mapping: special_price → compare_price');
console.log('=========================================================');

// Test product with special_price
const testProduct = {
  identifier: 'test-special-price-fixed',
  enabled: true,
  values: {
    name: [{ data: 'Test Product Special Price Fixed', locale: 'en_US' }],
    price: [{ data: '99.99', locale: 'en_US' }],
    special_price: [{ data: '79.99', locale: 'en_US' }],
    color: [{ data: 'blue', locale: 'en_US' }]
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
    console.log('\n🔍 Testing with custom mapping special_price → compare_price');
    console.log('Expected result: compare_price = 79.99, special_price NOT in attributes');
    
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
    console.log('   Price:', product.price);
    console.log('   Compare Price:', product.compare_price);
    
    console.log('\n📋 Attributes Object:');
    console.log('   Keys:', Object.keys(product.attributes));
    console.log('   special_price in attributes:', product.attributes.special_price || 'NOT FOUND ✅');
    console.log('   color in attributes:', product.attributes.color || 'not found');
    
    console.log('\n✅ Fixed Custom Mapping Validation:');
    if (product.compare_price === 79.99) {
      console.log('  ✅ SUCCESS: special_price correctly mapped to compare_price field');
    } else {
      console.log('  ❌ FAILED: compare_price is', product.compare_price, 'instead of 79.99');
    }
    
    if (!product.attributes.special_price) {
      console.log('  ✅ SUCCESS: special_price NOT duplicated in attributes (duplication fixed!)');
    } else {
      console.log('  ❌ FAILED: special_price still duplicated in attributes:', product.attributes.special_price);
    }
    
    if (product.attributes.color) {
      console.log('  ✅ SUCCESS: Other attributes (color) still work normally');
    } else {
      console.log('  ❌ FAILED: Other attributes broken');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();