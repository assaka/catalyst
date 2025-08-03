require('dotenv').config();
const axios = require('axios');
const { sequelize } = require('./src/database/connection');

async function debug422Error() {
  try {
    console.log('🔍 Debugging Akeneo 422 error...');
    
    // Get Akeneo credentials from database
    const [configs] = await sequelize.query('SELECT config_data FROM integration_configs WHERE integration_type = \'akeneo\' AND is_active = true LIMIT 1;');
    
    if (configs.length === 0) {
      console.log('❌ No active Akeneo integration found');
      return;
    }
    
    const config = configs[0].config_data;
    console.log('🔗 Using Akeneo URL:', config.baseUrl);
    console.log('👤 Username:', config.username);
    
    // First, get an access token
    console.log('\n🔑 Getting access token...');
    const authResponse = await axios.post(`${config.baseUrl}/api/oauth/v1/token`, {
      grant_type: 'password',
      username: config.username,
      password: config.password
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const accessToken = authResponse.data.access_token;
    console.log('✅ Got access token');
    
    // Test different request variations
    const testCases = [
      {
        name: 'No parameters at all',
        url: `${config.baseUrl}/api/rest/v1/products-uuid`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json'
        }
      },
      {
        name: 'With only limit parameter',
        url: `${config.baseUrl}/api/rest/v1/products-uuid?limit=10`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json'
        }
      },
      {
        name: 'Different Accept header - application/json',
        url: `${config.baseUrl}/api/rest/v1/products-uuid?limit=10`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      },
      {
        name: 'Old products endpoint',
        url: `${config.baseUrl}/api/rest/v1/products?limit=10`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json'
        }
      },
      {
        name: 'Categories endpoint (for comparison)',
        url: `${config.baseUrl}/api/rest/v1/categories?limit=10`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json'
        }
      }
    ];
    
    for (const test of testCases) {
      console.log(`\n📋 Testing: ${test.name}`);
      try {
        const response = await axios.get(test.url, { headers: test.headers });
        console.log('✅ Success:', {
          status: response.status,
          hasData: !!response.data,
          hasEmbedded: !!response.data._embedded,
          itemsCount: response.data._embedded?.items?.length || 0
        });
      } catch (error) {
        console.log('❌ Failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        if (error.response?.status === 422) {
          console.log('🔴 422 Error Details:');
          console.log('Full response data:', JSON.stringify(error.response.data, null, 2));
          
          if (error.response.data.errors) {
            console.log('Validation errors:');
            error.response.data.errors.forEach((err, idx) => {
              console.log(`  ${idx + 1}. ${JSON.stringify(err)}`);
            });
          }
          
          if (error.response.data.message) {
            console.log('Error message:', error.response.data.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debug422Error();