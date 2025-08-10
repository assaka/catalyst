const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 Testing low_stock_threshold fix...');

const mapping = new AkeneoMapping();

// Create a mock catalyst product
const catalystProduct = {
  name: 'Test Product',
  price: 29.99,
  low_stock_threshold: 5
};

// Test scenarios that could cause the [object Object] error
const testCases = [
  {
    name: 'Simple numeric string',
    akeneoValue: '10',
    expected: 10
  },
  {
    name: 'Simple number',
    akeneoValue: 15,
    expected: 15
  },
  {
    name: 'Complex price object (single)',
    akeneoValue: { amount: '25', currency: 'USD' },
    expected: 25
  },
  {
    name: 'Complex price collection (array)',
    akeneoValue: [{ amount: '30', currency: 'USD' }, { amount: '25', currency: 'EUR' }],
    expected: 30
  },
  {
    name: 'Null value',
    akeneoValue: null,
    expected: null // Should keep existing value
  },
  {
    name: 'Invalid value',
    akeneoValue: 'not-a-number',
    expected: null // Should keep existing value
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n📊 Test ${index + 1}: ${testCase.name}`);
  console.log('   Input:', JSON.stringify(testCase.akeneoValue));
  
  // Reset the product for each test
  const testProduct = { ...catalystProduct };
  const originalThreshold = testProduct.low_stock_threshold;
  
  try {
    // Apply the custom mapping
    mapping.applyCustomMapping(testProduct, 'low_stock_threshold', testCase.akeneoValue, 'test_threshold');
    
    console.log('   Result:', testProduct.low_stock_threshold);
    console.log('   Expected:', testCase.expected);
    
    if (testCase.expected === null) {
      // For null/invalid cases, the original value should be preserved
      if (testProduct.low_stock_threshold === originalThreshold) {
        console.log('   ✅ PASS - Original value preserved');
      } else {
        console.log('   ❌ FAIL - Original value not preserved');
      }
    } else {
      if (testProduct.low_stock_threshold === testCase.expected) {
        console.log('   ✅ PASS');
      } else {
        console.log('   ❌ FAIL');
      }
    }
    
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }
});

console.log('\n🎯 Fix validation: The error should no longer occur with complex price objects!');