const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Custom Mapping to Any Catalyst Attribute');
console.log('===============================================');

// Test product with multiple custom mappings
const testProduct = {
  identifier: 'test-catalyst-attributes',
  enabled: true,
  values: {
    name: [{ data: 'Test Product Catalyst Attributes', locale: 'en_US' }],
    price: [{ data: '99.99', locale: 'en_US' }],
    // Akeneo attributes to map to various targets
    akeneo_special_price: [{ data: '79.99', locale: 'en_US' }],
    akeneo_dealer_cost: [{ data: '45.00', locale: 'en_US' }],
    akeneo_power_type: [{ data: 'electricity', locale: 'en_US' }],
    akeneo_compressors: [{ data: '2', locale: 'en_US' }]
  }
};

// Custom mapping configuration - testing different target types
const customMappings = {
  attributes: [
    {
      enabled: true,
      akeneoAttribute: 'akeneo_special_price',
      catalystField: 'compare_price', // Product model field
      dataType: 'number'
    },
    {
      enabled: true,
      akeneoAttribute: 'akeneo_dealer_cost', 
      catalystField: 'dealer_price', // Catalyst attribute
      dataType: 'number'
    },
    {
      enabled: true,
      akeneoAttribute: 'akeneo_power_type',
      catalystField: 'power_connection', // Catalyst attribute
      dataType: 'string'
    },
    {
      enabled: true,
      akeneoAttribute: 'akeneo_compressors',
      catalystField: 'number_compressors', // Catalyst attribute
      dataType: 'string'
    }
  ]
};

(async () => {
  try {
    console.log('\n🔍 Testing custom mappings to both Product fields and Catalyst attributes:');
    console.log('  1. akeneo_special_price → compare_price (Product field)');
    console.log('  2. akeneo_dealer_cost → dealer_price (Catalyst attribute)');
    console.log('  3. akeneo_power_type → power_connection (Catalyst attribute)');
    console.log('  4. akeneo_compressors → number_compressors (Catalyst attribute)');
    
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
    console.log('   Compare Price (Product field):', product.compare_price);
    
    console.log('\n📋 Attributes Object (Catalyst attributes):');
    console.log('   dealer_price:', product.attributes.dealer_price || 'not found');
    console.log('   power_connection:', product.attributes.power_connection || 'not found');
    console.log('   number_compressors:', product.attributes.number_compressors || 'not found');
    
    console.log('\n🔍 Source attributes should NOT be duplicated:');
    console.log('   akeneo_special_price:', product.attributes.akeneo_special_price || 'NOT FOUND ✅');
    console.log('   akeneo_dealer_cost:', product.attributes.akeneo_dealer_cost || 'NOT FOUND ✅');
    
    console.log('\n✅ Universal Custom Mapping Validation:');
    
    // Test Product model field mapping
    if (product.compare_price === 79.99) {
      console.log('  ✅ Product field mapping: akeneo_special_price → compare_price works');
    } else {
      console.log('  ❌ Product field mapping failed:', product.compare_price);
    }
    
    // Test Catalyst attribute mappings  
    if (product.attributes.dealer_price === 45) {
      console.log('  ✅ Catalyst attribute mapping: akeneo_dealer_cost → dealer_price works');
    } else {
      console.log('  ❌ Catalyst attribute mapping failed:', product.attributes.dealer_price);
    }
    
    if (product.attributes.power_connection === 'electricity') {
      console.log('  ✅ Catalyst attribute mapping: akeneo_power_type → power_connection works');
    } else {
      console.log('  ❌ Catalyst attribute mapping failed:', product.attributes.power_connection);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();