const request = require('supertest');
const express = require('express');
const pluginManager = require('./backend/src/core/PluginManager');

// Mock the middleware and routes
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: '12345678-1234-1234-1234-123456789012',
    role: 'store_owner',
    email: 'test@example.com'
  };
  next();
};

// Mock store ownership middleware
const mockStoreOwnership = (req, res, next) => {
  req.params.store_id = req.params.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
  // Mock successful ownership check
  next();
};

// Load the store plugins routes
const storePluginRoutes = require('./backend/src/routes/store-plugins');

// Mount routes with middleware
app.use('/api/stores/:store_id/plugins', mockAuth, mockStoreOwnership, storePluginRoutes);

(async () => {
  try {
    console.log('🧪 Testing store-scoped plugin API endpoints...');
    
    // Initialize plugin manager
    await pluginManager.initialize();
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('\n📋 Test 1: GET /api/stores/:store_id/plugins');
    console.log('Testing plugin list with store status...');
    
    const response1 = await request(app)
      .get(`/api/stores/${storeId}/plugins`)
      .expect(200);
    
    console.log('✅ GET plugins response:', {
      success: response1.body.success,
      totalPlugins: response1.body.data?.plugins?.length || 0,
      storeId: response1.body.data?.storeId,
      summary: response1.body.data?.summary
    });
    
    if (response1.body.data?.plugins?.length > 0) {
      const samplePlugin = response1.body.data.plugins[0];
      console.log('📋 Sample plugin data:');
      console.log('  Name:', samplePlugin.name);
      console.log('  Slug:', samplePlugin.slug);
      console.log('  Enabled for store:', samplePlugin.enabledForStore);
      console.log('  Configured for store:', samplePlugin.configuredForStore);
    }
    
    console.log('\n📋 Test 2: POST /api/stores/:store_id/plugins/:pluginSlug/enable');
    console.log('Testing plugin enable for store...');
    
    // Find an installed plugin to enable
    const installedPlugin = response1.body.data?.plugins?.find(p => p.isInstalled);
    if (installedPlugin) {
      const response2 = await request(app)
        .post(`/api/stores/${storeId}/plugins/${installedPlugin.slug}/enable`)
        .send({
          configuration: {
            apiUrl: 'https://test.example.com',
            timeout: 30000
          }
        })
        .expect(200);
      
      console.log('✅ Plugin enable response:', {
        success: response2.body.success,
        message: response2.body.message,
        pluginSlug: response2.body.data?.pluginSlug,
        isEnabled: response2.body.data?.isEnabled
      });
      
      console.log('\n📋 Test 3: PUT /api/stores/:store_id/plugins/:pluginSlug/configure');
      console.log('Testing plugin configuration update...');
      
      const response3 = await request(app)
        .put(`/api/stores/${storeId}/plugins/${installedPlugin.slug}/configure`)
        .send({
          configuration: {
            apiUrl: 'https://updated.example.com',
            timeout: 45000,
            retries: 3
          }
        })
        .expect(200);
      
      console.log('✅ Plugin configure response:', {
        success: response3.body.success,
        message: response3.body.message,
        configuration: response3.body.data?.configuration
      });
      
    } else {
      console.log('⚠️ No installed plugins found to test enable/configure endpoints');
    }
    
    console.log('\n🎯 Store-scoped plugin API endpoints are working correctly!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.body);
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();