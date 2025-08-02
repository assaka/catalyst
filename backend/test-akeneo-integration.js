const AkeneoIntegration = require('./src/services/akeneo-integration');

// Test configuration - replace with your Akeneo credentials
const testConfig = {
  baseUrl: 'https://demo.akeneo.com', // Replace with your Akeneo URL
  clientId: 'your_client_id', // Replace with your client ID
  clientSecret: 'your_client_secret', // Replace with your client secret
  username: 'your_username', // Replace with your API username
  password: 'your_password' // Replace with your API password
};

const testStoreId = 'test-store-uuid'; // Replace with a valid store UUID from your database

async function testIntegration() {
  console.log('🧪 Testing Akeneo Integration...');
  
  try {
    // Initialize integration service
    const integration = new AkeneoIntegration(testConfig);
    
    // Test 1: Connection Test
    console.log('\n1️⃣ Testing connection...');
    const connectionResult = await integration.testConnection();
    console.log('Connection result:', connectionResult);
    
    if (!connectionResult.success) {
      console.error('❌ Connection test failed. Please check your credentials.');
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Dry run category import
    console.log('\n2️⃣ Testing category import (dry run)...');
    const categoryResult = await integration.importCategories(testStoreId, { 
      locale: 'en_US', 
      dryRun: true 
    });
    console.log('Category import result:', JSON.stringify(categoryResult, null, 2));
    
    // Test 3: Dry run product import  
    console.log('\n3️⃣ Testing product import (dry run)...');
    const productResult = await integration.importProducts(testStoreId, { 
      locale: 'en_US', 
      dryRun: true,
      batchSize: 10 // Small batch for testing
    });
    console.log('Product import result:', JSON.stringify(productResult, null, 2));
    
    // Test 4: Configuration status
    console.log('\n4️⃣ Testing configuration status...');
    const configStatus = integration.getConfigStatus();
    console.log('Config status:', configStatus);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Instructions for running the test
console.log(`
🚀 Akeneo Integration Test Script

Before running this test:
1. Update the testConfig object with your actual Akeneo credentials
2. Update testStoreId with a valid store UUID from your database
3. Make sure your Akeneo PIM is accessible and the API credentials are correct

To run with real data (not dry run), modify the dryRun parameters to false.

Starting test in 3 seconds...
`);

setTimeout(() => {
  testIntegration();
}, 3000);

module.exports = { testIntegration };