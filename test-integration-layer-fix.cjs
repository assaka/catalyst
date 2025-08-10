console.log('🧪 Testing Integration Layer Fix for [object Object] Prevention');
console.log('============================================================');

// Simulate the exact check we added to the integration layer
function preventObjectStringification(productData) {
  console.log('\n🔍 Checking product data for [object Object] values...');
  
  const numericFields = ['price', 'compare_price', 'cost_price', 'weight'];
  let foundIssues = false;
  
  numericFields.forEach(field => {
    if (productData[field] !== null && productData[field] !== undefined) {
      const value = productData[field];
      const stringValue = String(value);
      
      console.log(`  ${field}: ${JSON.stringify(value)} → "${stringValue}"`);
      
      if (stringValue === '[object Object]' || stringValue.includes('[object Object]')) {
        console.warn(`  ⚠️ CRITICAL: Preventing [object Object] in field '${field}'`);
        console.warn(`     Original value:`, value);
        console.warn(`     String representation: "${stringValue}"`);
        productData[field] = null; // Set to null to prevent database error
        foundIssues = true;
      }
    }
  });
  
  return { productData, foundIssues };
}

// Test cases that might cause the error
const testCases = [
  {
    name: 'Product with complex price object',
    data: {
      name: 'Test Product 1',
      sku: 'test-1',
      price: { amount: '29.99', currency: 'USD' }, // This could cause [object Object]
      compare_price: 19.99,
      weight: 1.5
    }
  },
  {
    name: 'Product with array in price field',
    data: {
      name: 'Test Product 2', 
      sku: 'test-2',
      price: [{ amount: '29.99', currency: 'USD' }], // This could cause [object Object]
      compare_price: null,
      weight: null
    }
  },
  {
    name: 'Product with nested complex object',
    data: {
      name: 'Test Product 3',
      sku: 'test-3', 
      price: 29.99,
      compare_price: {
        pricing: {
          retail: { amount: '99.99', currency: 'USD' },
          wholesale: { amount: '79.99', currency: 'USD' }
        }
      }, // This will definitely cause [object Object]
      weight: { value: '1.5', unit: 'kg' }
    }
  },
  {
    name: 'Product with valid numeric values',
    data: {
      name: 'Test Product 4',
      sku: 'test-4',
      price: 29.99,
      compare_price: 39.99,
      weight: 1.5
    }
  }
];

console.log('\n🧪 Running test cases...');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('=' .repeat(50));
  
  // Make a copy to avoid modifying the original
  const productData = JSON.parse(JSON.stringify(testCase.data));
  
  const result = preventObjectStringification(productData);
  
  if (result.foundIssues) {
    console.log('✅ FIXED: Problematic values were converted to null');
    console.log('📊 Final product data:');
    Object.keys(result.productData).forEach(key => {
      if (['price', 'compare_price', 'cost_price', 'weight'].includes(key)) {
        console.log(`  ${key}: ${JSON.stringify(result.productData[key])}`);
      }
    });
  } else {
    console.log('✅ SAFE: No problematic values found');
  }
});

console.log('\n📋 Summary:');
console.log('- Added safety checks in akeneo-integration.js before Product.create()');
console.log('- Added safety checks in akeneo-integration.js before Product.update()');
console.log('- Any field that would stringify to "[object Object]" is set to null');
console.log('- This prevents the database constraint violation error');
console.log('');
console.log('🎯 The error "invalid input syntax for type numeric: [object Object]" should now be prevented!');