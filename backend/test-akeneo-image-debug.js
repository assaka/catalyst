// Set environment variable for database connection
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';
process.env.NODE_ENV = 'production';

const IntegrationConfig = require('./src/models/IntegrationConfig');
const AkeneoIntegration = require('./src/services/akeneo-integration');

// Test with a minimal product import to see the debug output
(async () => {
  try {
    console.log('🧪 Testing Akeneo product import with image debugging...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Load configuration from database
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    if (!integrationConfig || !integrationConfig.config_data) {
      throw new Error('Akeneo integration not configured for this store');
    }

    const config = integrationConfig.config_data;
    console.log('📊 Config loaded:', {
      baseUrl: config.baseUrl,
      username: config.username,
      hasClientId: !!config.clientId,
      hasClientSecret: !!config.clientSecret
    });
    
    // Create integration instance
    const integration = new AkeneoIntegration(config);
    
    // Test connection first
    console.log('\n🔌 Testing connection...');
    const connectionResult = await integration.testConnection();
    console.log('Connection result:', connectionResult);
    
    if (!connectionResult.success) {
      throw new Error('Connection failed: ' + connectionResult.message);
    }
    
    // Import just one product to see the debug output
    console.log('\n📦 Importing 1 product with debug logs...');
    const result = await integration.importProducts(storeId, { 
      limit: 1,
      downloadImages: true,
      settings: {
        downloadImages: true
      }
    });
    
    console.log('\n📊 Import Result:', {
      total: result.stats.total,
      imported: result.stats.imported,
      failed: result.stats.failed,
      errors: result.errors
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();