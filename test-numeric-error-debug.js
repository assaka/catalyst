// Debug the specific [object Object],[object Object] error
const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 Testing specific numeric parsing error scenario');
console.log('==============================================');

const mapping = new AkeneoMapping();

// Test case that might cause the [object Object],[object Object] error
const problematicProductValues = {
  // This might be what's causing the issue - multiple price objects that get stringified
  price: [
    { data: [{ amount: "29.99", currency: "USD" }, { amount: "25.99", currency: "EUR" }], locale: null, scope: null }
  ],
  sku: [
    { data: "KA-AGA-ASXSDL21SS/C-OS-1", locale: null, scope: null }
  ],
  name: [
    { data: "Test Product", locale: "en_US" }
  ]
};

async function testErrorScenario() {
  try {
    console.log('📋 Testing problematic product values:');
    console.log(JSON.stringify(problematicProductValues, null, 2));
    
    // Test extractProductValue for price
    console.log('\n🔍 Testing extractProductValue for price...');
    const priceValue = mapping.extractProductValue(problematicProductValues, 'price', 'en_US');
    console.log('  Raw price value:', priceValue);
    console.log('  Type:', typeof priceValue);
    console.log('  String representation:', String(priceValue));
    
    // Test extractNumericValue for price 
    console.log('\n🔍 Testing extractNumericValue for price...');
    try {
      const numericPrice = mapping.extractNumericValue(problematicProductValues, 'price', 'en_US');
      console.log('  Numeric price result:', numericPrice);
      console.log('  Type:', typeof numericPrice);
    } catch (error) {
      console.log('  ❌ Error in extractNumericValue:', error.message);
    }
    
    // Test extractPriceFromValue directly
    console.log('\n🔍 Testing extractPriceFromValue directly...');
    try {
      const priceFromValue = mapping.extractPriceFromValue(priceValue);
      console.log('  Price from value result:', priceFromValue);
      console.log('  Type:', typeof priceFromValue);
    } catch (error) {
      console.log('  ❌ Error in extractPriceFromValue:', error.message);
    }
    
    // Test what happens if we try to parseFloat the problematic value directly
    console.log('\n🔍 Testing direct parseFloat on complex object...');
    if (Array.isArray(priceValue) && priceValue.length > 0) {
      console.log('  Array detected, testing parseFloat on array...');
      try {
        const result = parseFloat(priceValue);
        console.log('  parseFloat(array) result:', result);
      } catch (error) {
        console.log('  ❌ parseFloat(array) error:', error.message);
      }
      
      // Test what happens if the array gets stringified
      console.log('  Testing parseFloat on stringified array...');
      const stringified = String(priceValue);
      console.log('  Stringified:', stringified);
      try {
        const result = parseFloat(stringified);
        console.log('  parseFloat(stringified) result:', result);
      } catch (error) {
        console.log('  ❌ parseFloat(stringified) error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testErrorScenario();