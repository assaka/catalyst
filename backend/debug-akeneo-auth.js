const { sequelize } = require('./src/database/connection.js');
const IntegrationConfig = require('./src/models/IntegrationConfig.js');
const crypto = require('crypto');

(async () => {
  try {
    console.log('🔍 Debugging Akeneo authentication issue...\n');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Step 1: Get raw data from database
    console.log('📋 Step 1: Getting raw database data...');
    const [rawResults] = await sequelize.query(
      'SELECT config_data FROM integration_configs WHERE store_id = :storeId AND integration_type = :type AND is_active = true',
      {
        replacements: { storeId, type: 'akeneo' }
      }
    );
    
    if (rawResults.length === 0) {
      console.log('❌ No active Akeneo configuration found');
      await sequelize.close();
      return;
    }
    
    const rawConfig = rawResults[0].config_data;
    console.log('✅ Raw config keys:', Object.keys(rawConfig));
    console.log('  - baseUrl:', rawConfig.baseUrl);
    console.log('  - username:', rawConfig.username);
    console.log('  - clientId:', rawConfig.clientId);
    console.log('  - clientId type:', typeof rawConfig.clientId);
    console.log('  - clientId length:', rawConfig.clientId?.length);
    console.log('  - clientSecret present:', !!rawConfig.clientSecret);
    console.log('  - clientSecret starts with "encrypted:":', rawConfig.clientSecret?.startsWith('encrypted:'));
    console.log('  - password present:', !!rawConfig.password);
    console.log('  - password starts with "encrypted:":', rawConfig.password?.startsWith('encrypted:'));
    
    // Step 2: Get data through model (with decryption)
    console.log('\n📋 Step 2: Getting data through IntegrationConfig model...');
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    
    if (!integrationConfig) {
      console.log('❌ No config found through model');
      await sequelize.close();
      return;
    }
    
    const modelConfig = integrationConfig.config_data;
    console.log('✅ Model config keys:', Object.keys(modelConfig));
    console.log('  - baseUrl:', modelConfig.baseUrl);
    console.log('  - username:', modelConfig.username);
    console.log('  - clientId:', modelConfig.clientId);
    console.log('  - clientId type:', typeof modelConfig.clientId);
    console.log('  - clientId length:', modelConfig.clientId?.length);
    console.log('  - clientSecret present:', !!modelConfig.clientSecret);
    console.log('  - clientSecret length:', modelConfig.clientSecret?.length);
    console.log('  - password present:', !!modelConfig.password);
    console.log('  - password length:', modelConfig.password?.length);
    
    // Step 3: Check if clientId is accidentally encrypted
    console.log('\n📋 Step 3: Checking if clientId might be encrypted...');
    if (rawConfig.clientId && rawConfig.clientId.startsWith('encrypted:')) {
      console.log('⚠️ clientId appears to be encrypted! This should not happen.');
      
      try {
        const key = process.env.INTEGRATION_ENCRYPTION_KEY || 'catalyst-integration-default-key-change-in-production';
        const encryptedValue = rawConfig.clientId.replace('encrypted:', '');
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decryptedValue = decipher.update(encryptedValue, 'hex', 'utf8');
        decryptedValue += decipher.final('utf8');
        
        console.log('  - Decrypted clientId:', decryptedValue);
        console.log('  - Decrypted clientId length:', decryptedValue.length);
      } catch (error) {
        console.log('  - Failed to decrypt clientId:', error.message);
      }
    }
    
    // Step 4: Test authentication parameters
    console.log('\n📋 Step 4: Testing authentication parameters...');
    const credentials = `${modelConfig.clientId}:${modelConfig.clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    
    console.log('  - Credentials string length:', credentials.length);
    console.log('  - Base64 credentials length:', base64Credentials.length);
    console.log('  - First 20 chars of base64:', base64Credentials.substring(0, 20) + '...');
    
    // Step 5: Test actual authentication
    console.log('\n📋 Step 5: Testing actual authentication...');
    const axios = require('axios');
    
    // Remove trailing slash from baseUrl
    const baseUrl = modelConfig.baseUrl.replace(/\/$/, '');
    console.log('  - Base URL (cleaned):', baseUrl);
    
    try {
      const authUrl = `${baseUrl}/api/oauth/v1/token`;
      console.log('  - Auth URL:', authUrl);
      
      const response = await axios.post(
        authUrl,
        {
          grant_type: 'password',
          username: modelConfig.username,
          password: modelConfig.password
        },
        {
          headers: {
            'Authorization': `Basic ${base64Credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('✅ Authentication successful!');
      console.log('  - Access token received:', !!response.data.access_token);
      console.log('  - Refresh token received:', !!response.data.refresh_token);
      console.log('  - Expires in:', response.data.expires_in);
      
    } catch (error) {
      console.log('❌ Authentication failed!');
      console.log('  - Status:', error.response?.status);
      console.log('  - Error:', error.response?.data || error.message);
      
      if (error.response?.data) {
        console.log('  - Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    console.error(error.stack);
  }
})();