const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 Testing the [object Object] issue...');

// Test values that could cause the issue
const testValues = [
  [{ amount: '49.99', currency: 'USD' }, { amount: '39.99', currency: 'EUR' }],
  { amount: '29.99', currency: 'USD' },
  '25.50',
  25.50,
  null,
  undefined
];

testValues.forEach((value, index) => {
  console.log(`\nTest ${index + 1}:`, JSON.stringify(value));
  console.log('  parseFloat result:', parseFloat(value));
  console.log('  String conversion:', String(value));
  
  // Test if this could cause the [object Object] issue
  if (typeof value === 'object' && value !== null) {
    console.log('  ⚠️  This could cause [object Object] when stringified!');
    console.log('  String(value):', String(value));
  }
});

// Now test the actual Akeneo mapping
console.log('\n🎯 Testing actual Akeneo mapping scenario...');

const mapping = new AkeneoMapping();

// Simulate a problematic product
const problematicProduct = {
  identifier: 'KA-AGA-ASXSDL21SS/C-OS-1',
  enabled: true,
  values: {
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

try {
  console.log('\n📊 Testing extractNumericValue directly...');
  const directResult = mapping.extractNumericValue(problematicProduct.values, 'price', 'en_US');
  console.log('Direct extractNumericValue result:', directResult, '(type:', typeof directResult, ')');
  
  // Test mapAkeneoAttribute
  console.log('\n🗺️ Testing mapAkeneoAttribute...');
  const mappingResult = mapping.mapAkeneoAttribute(problematicProduct, {
    akeneoAttribute: 'price',
    catalystField: 'price',
    dataType: 'number'
  }, 'en_US');
  console.log('mapAkeneoAttribute result:', mappingResult);
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
  console.error('Stack:', error.stack);
}