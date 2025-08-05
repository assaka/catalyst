// Test script to simulate frontend import API call
const axios = require('axios');

async function testImportAPI() {
  try {
    console.log('🧪 Testing Import API call simulation...');
    
    // This simulates what the frontend does when Import is clicked
    const baseURL = 'https://catalyst-backend-fzhu.onrender.com';
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Test the categories import endpoint
    const testData = {
      dryRun: true,
      locale: 'en_US',
      filters: {},
      settings: {}
    };
    
    console.log('📡 Making API call to import-categories...');
    console.log('📋 Endpoint:', `${baseURL}/api/integrations/akeneo/import-categories`);
    console.log('📋 Headers:', { 'x-store-id': storeId });
    console.log('📋 Data:', testData);
    
    const response = await axios.post(
      `${baseURL}/api/integrations/akeneo/import-categories`, 
      testData,
      {
        headers: {
          'x-store-id': storeId,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('✅ API call successful');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
      console.error('📊 Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('📊 No response received:', error.request);
    } else {
      console.error('📊 Error setting up request:', error.message);
    }
    console.error('📍 Stack trace:', error.stack);
  }
}

testImportAPI();