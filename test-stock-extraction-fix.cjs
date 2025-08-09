const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Fixed Akeneo Stock Extraction');
console.log('======================================');

// Test products with various stock scenarios
const testCases = [
  {
    name: 'Product with explicit stock_quantity',
    product: {
      identifier: 'test-stock-explicit',
      enabled: true,
      values: {
        name: [{ data: 'Product With Stock Quantity', locale: 'en_US' }],
        stock_quantity: [{ data: '25', locale: null }]
      }
    },
    expected: 25
  },
  {
    name: 'Product with quantity attribute',
    product: {
      identifier: 'test-stock-qty',
      enabled: true,
      values: {
        name: [{ data: 'Product With Quantity', locale: 'en_US' }],
        quantity: [{ data: '15', locale: null }]
      }
    },
    expected: 15
  },
  {
    name: 'Product marked as in_stock = true',
    product: {
      identifier: 'test-stock-boolean-true',
      enabled: true,
      values: {
        name: [{ data: 'Product In Stock Boolean True', locale: 'en_US' }],
        in_stock: [{ data: true, locale: null }]
      }
    },
    expected: 10
  },
  {
    name: 'Product marked as in_stock = false',
    product: {
      identifier: 'test-stock-boolean-false',
      enabled: true,
      values: {
        name: [{ data: 'Product In Stock Boolean False', locale: 'en_US' }],
        in_stock: [{ data: false, locale: null }]
      }
    },
    expected: 0
  },
  {
    name: 'Product with NO stock attributes (should use default)',
    product: {
      identifier: 'test-stock-none',
      enabled: true,
      values: {
        name: [{ data: 'Product With No Stock Data', locale: 'en_US' }]
      }
    },
    expected: 5  // This should now work correctly!
  },
  {
    name: 'Disabled product',
    product: {
      identifier: 'test-stock-disabled',
      enabled: false,
      values: {
        name: [{ data: 'Disabled Product', locale: 'en_US' }]
      }
    },
    expected: 0
  }
];

(async () => {
  try {
    console.log('\n📋 Running stock extraction tests...');
    
    for (const testCase of testCases) {
      const result = mapping.extractStockQuantity(
        testCase.product.values,
        'en_US',
        testCase.product
      );
      
      const passed = result === testCase.expected;
      const status = passed ? '✅' : '❌';
      
      console.log(`${status} ${testCase.name}:`);
      console.log(`   Expected: ${testCase.expected} | Got: ${result}`);
      
      if (!passed) {
        console.log('   ⚠️ TEST FAILED!');
      }
    }
    
    console.log('\n✅ Stock extraction tests completed!');
    console.log('\n🎯 The fallback issue should now be fixed:');
    console.log('   - Products with explicit stock values: Use those values');
    console.log('   - Products with boolean stock status: Use 10 (true) or 0 (false)');
    console.log('   - Products with NO stock data: Use default value of 5');
    console.log('   - Disabled products: Always 0');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();