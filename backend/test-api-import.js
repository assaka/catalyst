const axios = require('axios');

// Simulate the UI calling the import-products endpoint
(async () => {
  try {
    console.log('🔍 Testing Import Products API endpoint...\n');
    
    const API_URL = 'http://localhost:5000/api/integrations/akeneo/import-products';
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // You'll need to get a valid auth token from your login
    // For testing, you can get this from the browser's localStorage
    const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';
    
    console.log('📋 Calling:', API_URL);
    console.log('📋 Store ID:', storeId);
    
    const response = await axios.post(
      API_URL,
      {
        locale: 'en_US',
        dryRun: false,
        batchSize: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-Store-ID': storeId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
})();