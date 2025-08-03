// Simple test script that can be run on Render to test Akeneo auth
const axios = require('axios');

// Replace these with your actual values from the integration config
const config = {
  baseUrl: 'https://akeneo.pimwelhof.hypernode.io',
  clientId: 'YOUR_CLIENT_ID_HERE',
  clientSecret: 'YOUR_CLIENT_SECRET_HERE', 
  username: 'systeem_5489',
  password: 'YOUR_PASSWORD_HERE'
};

async function testAkeneoAuth() {
  console.log('🧪 Testing Akeneo authentication with raw axios...');
  console.log('Base URL:', config.baseUrl);
  console.log('Username:', config.username);
  console.log('Client ID:', config.clientId);
  
  try {
    // Create the Basic auth header manually
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    console.log('Basic Auth header (first 20 chars):', `Basic ${basicAuth}`.substring(0, 26) + '...');
    
    const response = await axios.post(`${config.baseUrl}/api/oauth/v1/token`, {
      grant_type: 'password',
      username: config.username,
      password: config.password
    }, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Authentication successful!');
    console.log('Access token received:', !!response.data.access_token);
    console.log('Token type:', response.data.token_type);
    console.log('Expires in:', response.data.expires_in);
    
    // Test products endpoint
    console.log('\n🧪 Testing products endpoint...');
    const productsResponse = await axios.get(`${config.baseUrl}/api/rest/v1/products?limit=1`, {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`,
        'Accept': 'application/hal+json'
      }
    });
    
    console.log('✅ Products endpoint works!');
    console.log('Products found:', productsResponse.data._embedded?.items?.length || 0);
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

testAkeneoAuth();