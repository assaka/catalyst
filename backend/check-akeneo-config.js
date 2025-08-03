require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkAkeneoConfig() {
  try {
    console.log('🔍 Checking Akeneo integration config structure...');
    const [results] = await sequelize.query('SELECT id, store_id, config_data FROM integration_configs WHERE integration_type = \'akeneo\' AND is_active = true LIMIT 1;');
    
    if (results.length === 0) {
      console.log('❌ No active Akeneo integration found');
    } else {
      const config = results[0];
      console.log('✅ Found Akeneo config:');
      console.log('Store ID:', config.store_id);
      console.log('Config keys:', Object.keys(config.config_data));
      console.log('Base URL:', config.config_data.baseUrl);
      console.log('Username:', config.config_data.username);
      console.log('Client ID present:', !!config.config_data.clientId);
      console.log('Client Secret present:', !!config.config_data.clientSecret);
      console.log('Password present:', !!config.config_data.password);
      
      // Show first few characters of each credential for debugging
      if (config.config_data.clientId) {
        console.log('Client ID starts with:', config.config_data.clientId.substring(0, 8) + '...');
      }
      if (config.config_data.clientSecret) {
        console.log('Client Secret starts with:', config.config_data.clientSecret.substring(0, 8) + '...');
      }
      
      // Check if credentials are properly formatted
      if (!config.config_data.clientId) {
        console.log('❌ Missing clientId field');
      }
      if (!config.config_data.clientSecret) {
        console.log('❌ Missing clientSecret field');
      }
      if (!config.config_data.username) {
        console.log('❌ Missing username field');
      }
      if (!config.config_data.password) {
        console.log('❌ Missing password field');
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAkeneoConfig();