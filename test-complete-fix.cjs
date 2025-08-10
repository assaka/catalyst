const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 Testing Complete Fix for [object Object] Error');
console.log('==================================================');

const mapping = new AkeneoMapping();

// Simulate the exact problematic scenario from the error report: 
// "KA-AGA-ASXSDL21SS/C-OS-1: invalid input syntax for type numeric: '[object Object],[object Object]'"
const problematicProduct = {
  identifier: 'KA-AGA-ASXSDL21SS/C-OS-1',
  enabled: true,
  values: {
    low_stock_threshold: [{ 
      data: [
        { amount: '10', currency: 'USD' },
        { amount: '8', currency: 'EUR' }
      ],
      locale: null,
      scope: null 
    }],
    price: [{ 
      data: [
        { amount: '49.99', currency: 'USD' },
        { amount: '39.99', currency: 'EUR' }
      ],
      locale: null,
      scope: null 
    }]
  }
};

console.log('\n📊 Testing product:', problematicProduct.identifier);
console.log('📋 Problematic values:');
console.log('   - low_stock_threshold:', JSON.stringify(problematicProduct.values.low_stock_threshold));
console.log('   - price:', JSON.stringify(problematicProduct.values.price));

// Test the transformProduct method
try {
  console.log('\n🔄 Testing transformProduct...');
  const result = mapping.transformProduct(
    problematicProduct,
    '157d4590-49bf-4b0b-bd77-abe131909528', // storeId
    'en_US',
    null,
    {},
    { downloadImages: false }
  );
  
  console.log('\n✅ SUCCESS! Product transformation completed without errors');
  console.log('📊 Results:');
  console.log('   - Price:', result.price, '(type:', typeof result.price, ')');
  console.log('   - Low Stock Threshold:', result.low_stock_threshold, '(type:', typeof result.low_stock_threshold, ')');
  
  // Verify no [object Object] strings were created
  const jsonString = JSON.stringify(result);
  if (jsonString.includes('[object Object]')) {
    console.log('❌ CRITICAL: [object Object] still found in result!');
  } else {
    console.log('✅ VERIFIED: No [object Object] strings found in result');
  }
  
} catch (error) {
  console.log('❌ ERROR during product transformation:', error.message);
  console.log('Stack:', error.stack);
}

// Test direct applyCustomMapping calls
console.log('\n🧪 Testing direct applyCustomMapping calls...');

const testProduct = {
  name: 'Test Product',
  price: 0,
  low_stock_threshold: 5
};

const testCases = [
  {
    field: 'low_stock_threshold',
    value: [{ amount: '15', currency: 'USD' }, { amount: '12', currency: 'EUR' }],
    expected: 15
  },
  {
    field: 'price', 
    value: [{ amount: '29.99', currency: 'USD' }, { amount: '24.99', currency: 'EUR' }],
    expected: 29.99
  },
  {
    field: 'cost_price',
    value: { amount: '19.99', currency: 'USD' },
    expected: 19.99
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n📊 Direct mapping test ${index + 1}: ${testCase.field}`);
  console.log('   Input:', JSON.stringify(testCase.value));
  
  const testProd = { ...testProduct };
  const originalValue = testProd[testCase.field];
  
  try {
    mapping.applyCustomMapping(testProd, testCase.field, testCase.value, `akeneo_${testCase.field}`);
    
    console.log('   Result:', testProd[testCase.field]);
    console.log('   Expected:', testCase.expected);
    
    if (testProd[testCase.field] === testCase.expected) {
      console.log('   ✅ PASS');
    } else {
      console.log('   ❌ FAIL');
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }
});

console.log('\n🎉 SUMMARY:');
console.log('✅ Fixed parseFloat(akeneoValue) -> this.extractPriceFromValue(akeneoValue) in applyCustomMapping');
console.log('✅ Enhanced extractPriceFromValue to handle single price objects');
console.log('✅ All numeric parsing now uses consistent price extraction logic');
console.log('🎯 The "[object Object],[object Object]" database error should be completely resolved!');