const axios = require('axios');

// Test raw HTTP request to products-uuid endpoint
async function testRawRequest() {
  try {
    console.log('🧪 Testing raw products-uuid request...');
    
    // You would need to replace these with actual values from your working solution
    const baseUrl = 'YOUR_AKENEO_URL'; // e.g., https://demo.akeneo.com
    const accessToken = 'YOUR_ACCESS_TOKEN'; // Get this from your working solution
    
    console.log('This is a template script. Please:');
    console.log('1. Get the access token from your working solution');
    console.log('2. Update the baseUrl and accessToken variables above');
    console.log('3. Run this script to see the exact request format');
    
    // Test different request formats
    const testCases = [
      {
        name: 'Basic request with application/json',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {}
      },
      {
        name: 'With limit parameter',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: { limit: 1 }
      },
      {
        name: 'With hal+json Accept header',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json',
          'Content-Type': 'application/json'
        },
        params: { limit: 1 }
      },
      {
        name: 'Without Content-Type header',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: { limit: 1 }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      try {
        const response = await axios.get(`${baseUrl}/api/rest/v1/products-uuid`, {
          headers: testCase.headers,
          params: testCase.params,
          timeout: 10000
        });
        
        console.log('✅ Success:', {
          status: response.status,
          hasEmbedded: !!response.data._embedded,
          itemsCount: response.data._embedded?.items?.length || 0,
          responseKeys: Object.keys(response.data)
        });
      } catch (error) {
        console.log('❌ Failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.response?.data?.message || error.message
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testRawRequest();