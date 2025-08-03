require('dotenv').config();
const axios = require('axios');
const { sequelize } = require('./src/database/connection');

async function verifyAkeneoCredentials() {
  try {
    console.log('🔍 Fetching Akeneo credentials from database...');
    
    // Get Akeneo credentials from database
    const [configs] = await sequelize.query('SELECT config_data FROM integration_configs WHERE integration_type = \'akeneo\' AND is_active = true LIMIT 1;');
    
    if (configs.length === 0) {
      console.log('❌ No active Akeneo integration found');
      return;
    }
    
    const config = configs[0].config_data;
    console.log('\n✅ Found Akeneo configuration:');
    console.log('🔗 Base URL:', config.baseUrl);
    console.log('👤 Username:', config.username);
    console.log('🆔 Client ID:', config.clientId);
    console.log('🔐 Client Secret (first 8 chars):', config.clientSecret?.substring(0, 8) + '...');
    console.log('🔑 Password present:', !!config.password);

    console.log('\n🧪 Testing authentication with these credentials...');
    
    // Test authentication
    const authPayload = {
      grant_type: 'password',
      username: config.username,
      password: config.password
    };
    
    const authHeaders = {
      'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('📡 Making authentication request...');
    console.log('  URL:', `${config.baseUrl}/api/oauth/v1/token`);
    console.log('  Grant Type:', authPayload.grant_type);
    console.log('  Username:', authPayload.username);
    console.log('  Basic Auth (first 20 chars):', authHeaders.Authorization.substring(0, 26) + '...');
    
    try {
      const response = await axios.post(`${config.baseUrl}/api/oauth/v1/token`, authPayload, {
        headers: authHeaders,
        timeout: 10000
      });
      
      console.log('\n✅ Authentication successful!');
      console.log('🎫 Access token received:', !!response.data.access_token);
      console.log('🔄 Refresh token received:', !!response.data.refresh_token);
      console.log('⏰ Expires in:', response.data.expires_in, 'seconds');
      
      // Test a simple API call with the token
      console.log('\n🧪 Testing API call with access token...');
      const testResponse = await axios.get(`${config.baseUrl}/api/rest/v1/categories?limit=1`, {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Accept': 'application/hal+json'
        },
        timeout: 10000
      });
      
      console.log('✅ API call successful!');
      console.log('📊 Categories found:', testResponse.data._embedded?.items?.length || 0);
      
    } catch (authError) {
      console.log('\n❌ Authentication failed!');
      
      if (authError.response) {
        console.log('Status:', authError.response.status);
        console.log('Status Text:', authError.response.statusText);
        console.log('Response Data:', JSON.stringify(authError.response.data, null, 2));
        
        if (authError.response.status === 422) {
          console.log('\n🔍 422 Error Analysis:');
          const errorData = authError.response.data;
          
          if (errorData.message?.includes('client_id')) {
            console.log('❌ CLIENT_ID ISSUE: The client_id does not exist in Akeneo or is invalid');
            console.log('   → Check System → API connections in Akeneo admin');
            console.log('   → Verify the Client ID matches exactly');
          }
          
          if (errorData.message?.includes('secret')) {
            console.log('❌ CLIENT_SECRET ISSUE: The client_secret does not match');
            console.log('   → Check System → API connections in Akeneo admin');
            console.log('   → Copy the correct Client Secret');
          }
          
          if (errorData.message?.includes('username') || errorData.message?.includes('password')) {
            console.log('❌ USER CREDENTIALS ISSUE: Username or password incorrect');
            console.log('   → Check System → Users in Akeneo admin');
            console.log('   → Verify username and password');
          }
        }
      } else {
        console.log('Network Error:', authError.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyAkeneoCredentials();