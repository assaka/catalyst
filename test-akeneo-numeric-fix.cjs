const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 TESTING AKENEO NUMERIC CONVERSION FIX');
console.log('======================================');

const mapping = new AkeneoMapping();

// Test realistic Akeneo product scenarios that could cause the "[object Object]" error
const testProducts = [
  {
    name: 'Product with complex price structure',
    akeneoProduct: {
      identifier: 'test-product-1',
      enabled: true,
      values: {
        name: [{ data: 'Test Product 1', locale: 'en_US' }],
        price: [{ 
          data: [
            { amount: '29.99', currency: 'USD' },
            { amount: '25.99', currency: 'EUR' }
          ], 
          locale: null, 
          scope: null 
        }],
        weight: [{ 
          data: { 
            amount: '1.5', 
            unit: 'kg' 
          }, 
          locale: null, 
          scope: null 
        }],
        dimensions: [{ 
          data: {
            length: { value: '10', unit: 'cm' },
            width: { value: '20', unit: 'cm' },
            height: { value: '5', unit: 'cm' }
          }, 
          locale: null, 
          scope: null 
        }]
      }
    }
  },
  {
    name: 'Product with nested object in numeric field',
    akeneoProduct: {
      identifier: 'test-product-2',
      enabled: true,
      values: {
        name: [{ data: 'Test Product 2', locale: 'en_US' }],
        compare_price: [{ 
          data: {
            pricing: {
              retail: { amount: '99.99', currency: 'USD' },
              wholesale: { amount: '79.99', currency: 'USD' }
            }
          }, 
          locale: null, 
          scope: null 
        }],
        stock_quantity: [{ 
          data: {
            warehouse_a: 10,
            warehouse_b: 5,
            total: 15
          }, 
          locale: null, 
          scope: null 
        }]
      }
    }
  },
  {
    name: 'Product with array objects (custom mappings scenario)',
    akeneoProduct: {
      identifier: 'test-product-3',
      enabled: true,
      values: {
        name: [{ data: 'Test Product 3', locale: 'en_US' }],
        custom_numeric_field: [
          { data: { name: 'Field 1', value: '15.50' }, locale: 'en_US', scope: null },
          { data: { name: 'Field 2', value: '20.00' }, locale: 'en_US', scope: null }
        ]
      }
    }
  }
];

// Test custom mappings that might cause numeric conversion issues
const customMappings = {
  attributes: [
    {
      enabled: true,
      akeneoAttribute: 'compare_price',
      catalystField: 'compare_price',
      dataType: 'number',
      fallbacks: ['msrp', 'retail_price'],
      defaultValue: null
    },
    {
      enabled: true,
      akeneoAttribute: 'custom_numeric_field',
      catalystField: 'custom_price',
      dataType: 'number',
      fallbacks: [],
      defaultValue: 0
    },
    {
      enabled: true,
      akeneoAttribute: 'dimensions',
      catalystField: 'length',
      dataType: 'number',
      fallbacks: [],
      transform: (value) => {
        // Custom transform that might fail
        if (value && value.length) {
          return parseFloat(value.length.value);
        }
        return null;
      }
    }
  ]
};

async function testProduct(testCase, index) {
  console.log(`\n🧪 TEST ${index + 1}: ${testCase.name}`);
  console.log('=' .repeat(50));
  
  try {
    // First, debug the product attributes
    console.log('🔍 Step 1: Debugging product attributes...');
    const debugResult = mapping.debugProductAttributes(testCase.akeneoProduct, 'en_US');
    
    if (debugResult.problematicAttributes.length > 0) {
      console.log('⚠️ Found problematic attributes:');
      debugResult.problematicAttributes.forEach(attr => {
        console.log(`  - ${attr.attributeCode}: ${attr.issue}`);
        console.log(`    String value: "${attr.stringValue}"`);
      });
    } else {
      console.log('✅ No problematic attributes detected');
    }
    
    // Then, test the full transformation
    console.log('\n🔄 Step 2: Testing full product transformation...');
    const transformedProduct = await mapping.transformProduct(
      testCase.akeneoProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      customMappings,
      { downloadImages: false }
    );
    
    console.log('✅ Product transformation successful!');
    console.log('📊 Key numeric fields:');
    console.log(`  - price: ${transformedProduct.price} (${typeof transformedProduct.price})`);
    console.log(`  - compare_price: ${transformedProduct.compare_price} (${typeof transformedProduct.compare_price})`);
    console.log(`  - weight: ${transformedProduct.weight} (${typeof transformedProduct.weight})`);
    console.log(`  - stock_quantity: ${transformedProduct.stock_quantity} (${typeof transformedProduct.stock_quantity})`);
    
    // Check for any "[object Object]" values
    const stringifiedFields = [];
    Object.keys(transformedProduct).forEach(key => {
      const value = transformedProduct[key];
      if (typeof value === 'string' && value === '[object Object]') {
        stringifiedFields.push(key);
      }
    });
    
    if (stringifiedFields.length > 0) {
      console.log('❌ FOUND "[object Object]" IN FIELDS:', stringifiedFields);
      return false;
    } else {
      console.log('✅ No "[object Object]" values found in product fields');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Product transformation failed:', error.message);
    console.log('📍 Error details:', error.stack);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Running all test cases...\n');
  
  let passedTests = 0;
  const totalTests = testProducts.length;
  
  for (let i = 0; i < testProducts.length; i++) {
    const passed = await testProduct(testProducts[i], i);
    if (passed) {
      passedTests++;
    }
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! The numeric conversion fix is working correctly.');
    console.log('✅ The "[object Object]" error should now be resolved.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the errors above and continue debugging.');
  }
  
  console.log('\n🔧 Next steps:');
  console.log('1. Test with real Akeneo import');
  console.log('2. Use the debug API endpoint: POST /api/integrations/akeneo/debug-attributes');
  console.log('3. Monitor import logs for any remaining numeric conversion issues');
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});