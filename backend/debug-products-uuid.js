require('dotenv').config();
const AkeneoClient = require('./src/services/akeneo-client');
const { sequelize } = require('./src/database/connection');

async function debugProductsUuid() {
  try {
    console.log('🔍 Debugging products-uuid endpoint...');
    
    // Get Akeneo credentials from database
    const [configs] = await sequelize.query('SELECT config_data FROM integration_configs WHERE integration_type = \'akeneo\' AND is_active = true LIMIT 1;');
    
    if (configs.length === 0) {
      console.log('❌ No active Akeneo integration found in database');
      return;
    }
    
    const config = configs[0].config_data;
    console.log('🔗 Using Akeneo URL:', config.baseUrl);
    console.log('👤 Username:', config.username);
    
    // Initialize client from database config
    const client = new AkeneoClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
      config.username,
      config.password
    );

    console.log('🔑 Testing authentication...');
    await client.ensureValidToken();
    console.log('✅ Authentication successful');

    // Test 1: Basic products-uuid without any parameters
    console.log('\n📋 Test 1: Basic products-uuid request');
    try {
      const response1 = await client.makeRequest('GET', '/api/rest/v1/products-uuid');
      console.log('✅ Basic request successful:', {
        hasEmbedded: !!response1._embedded,
        itemsCount: response1._embedded?.items?.length || 0,
        hasLinks: !!response1._links,
        keys: Object.keys(response1)
      });
    } catch (error1) {
      console.log('❌ Basic request failed:', {
        status: error1.response?.status,
        statusText: error1.response?.statusText,
        message: error1.message,
        data: error1.response?.data
      });
    }

    // Test 2: With minimal limit parameter
    console.log('\n📋 Test 2: With limit=1 parameter');
    try {
      const response2 = await client.makeRequest('GET', '/api/rest/v1/products-uuid', null, { limit: 1 });
      console.log('✅ With limit successful:', {
        hasEmbedded: !!response2._embedded,
        itemsCount: response2._embedded?.items?.length || 0,
        hasLinks: !!response2._links
      });
    } catch (error2) {
      console.log('❌ With limit failed:', {
        status: error2.response?.status,
        statusText: error2.response?.statusText,
        message: error2.message,
        data: error2.response?.data
      });
    }

    // Test 3: Compare with categories (which works)
    console.log('\n📋 Test 3: Categories request (for comparison)');
    try {
      const response3 = await client.makeRequest('GET', '/api/rest/v1/categories', null, { limit: 1 });
      console.log('✅ Categories successful:', {
        hasEmbedded: !!response3._embedded,
        itemsCount: response3._embedded?.items?.length || 0,
        hasLinks: !!response3._links
      });
    } catch (error3) {
      console.log('❌ Categories failed:', {
        status: error3.response?.status,
        message: error3.message
      });
    }

    // Test 4: Try old products endpoint
    console.log('\n📋 Test 4: Old products endpoint');
    try {
      const response4 = await client.makeRequest('GET', '/api/rest/v1/products', null, { limit: 1 });
      console.log('✅ Old products successful:', {
        hasEmbedded: !!response4._embedded,
        itemsCount: response4._embedded?.items?.length || 0,
        hasLinks: !!response4._links
      });
    } catch (error4) {
      console.log('❌ Old products failed:', {
        status: error4.response?.status,
        statusText: error4.response?.statusText,
        message: error4.message,
        data: error4.response?.data
      });
    }

  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugProductsUuid();