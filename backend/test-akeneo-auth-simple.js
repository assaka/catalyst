const AkeneoClient = require('./src/services/akeneo-client');
const IntegrationConfig = require('./src/models/IntegrationConfig');

(async () => {
  try {
    console.log('🔍 Testing Akeneo Authentication...\n');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Load configuration
    console.log('📋 Loading configuration...');
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    
    if (!integrationConfig || !integrationConfig.config_data) {
      throw new Error('Akeneo integration not configured for this store');
    }
    
    const config = integrationConfig.config_data;
    console.log('✅ Configuration loaded:');
    console.log('  - Base URL:', config.baseUrl);
    console.log('  - Username:', config.username);
    console.log('  - Client ID:', config.clientId);
    console.log('  - Client ID length:', config.clientId?.length);
    console.log('  - Client Secret present:', !!config.clientSecret);
    console.log('  - Password present:', !!config.password);
    
    // Create client
    console.log('\n📋 Creating Akeneo client...');
    const client = new AkeneoClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
      config.username,
      config.password
    );
    
    // Test authentication
    console.log('\n📋 Testing authentication...');
    try {
      await client.authenticate();
      console.log('✅ Authentication successful!');
      console.log('  - Access token received:', !!client.accessToken);
      console.log('  - Refresh token received:', !!client.refreshToken);
      console.log('  - Token expires at:', client.tokenExpiresAt);
      
      // Test a simple API call
      console.log('\n📋 Testing API call (get 1 category)...');
      const categories = await client.getCategories({ limit: 1 });
      console.log('✅ API call successful!');
      console.log('  - Categories received:', categories._embedded?.items?.length || 0);
      
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.error('Details:', authError);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();