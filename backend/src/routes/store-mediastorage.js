const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Get default media storage provider for a store
router.get('/stores/:storeId/default-mediastorage-provider',
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Query by is_active since storeId is tenant identifier, not store UUID
      const { data: store } = await tenantDb
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Get the default media storage provider from store settings
      // Fall back to database provider if media storage provider not set
      const defaultProvider = store.settings?.default_mediastorage_provider ||
                            store.settings?.default_database_provider ||
                            null;

      console.log('Store settings:', store.settings);
      console.log('Default media storage provider:', defaultProvider);

      res.json({
        success: true,
        provider: defaultProvider,
        store_id: storeId
      });
    } catch (error) {
      console.error('Error fetching default media storage provider:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch default media storage provider'
      });
    }
  }
);

// Set default media storage provider for a store
router.post('/stores/:storeId/default-mediastorage-provider',
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { provider } = req.body;

      // Valid storage providers
      const validStorageProviders = ['supabase', 'cloudflare', 'aws-s3', 'google-storage', 'azure-blob', 'local'];

      if (!validStorageProviders.includes(provider)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media storage provider: ${provider}`
        });
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Query by is_active since storeId is tenant identifier, not store UUID
      const { data: store } = await tenantDb
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Update store settings with default media storage provider
      const currentSettings = store.settings || {};
      const updatedSettings = {
        ...currentSettings,
        default_mediastorage_provider: provider,
        default_mediastorage_provider_updated_at: new Date().toISOString()
      };

      console.log('Current settings before update:', currentSettings);
      console.log('Updating store settings with:', updatedSettings);

      // Update the store with new settings - use store.id (UUID) from the query result
      await tenantDb
        .from('stores')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      console.log('Settings after save:', updatedSettings);

      res.json({
        success: true,
        message: `${provider} set as default media storage provider`,
        provider: provider,
        store_id: storeId
      });
    } catch (error) {
      console.error('Error setting default media storage provider:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default media storage provider'
      });
    }
  }
);

// Clear default media storage provider for a store
router.delete('/stores/:storeId/default-mediastorage-provider',
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Query by is_active since storeId is tenant identifier, not store UUID
      const { data: store } = await tenantDb
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Remove default media storage provider from store settings
      const currentSettings = store.settings || {};
      const updatedSettings = { ...currentSettings };
      delete updatedSettings.default_mediastorage_provider;
      delete updatedSettings.default_mediastorage_provider_updated_at;

      // Update the store with new settings - use store.id (UUID) from the query result
      await tenantDb
        .from('stores')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      res.json({
        success: true,
        message: 'Default media storage provider cleared',
        store_id: storeId
      });
    } catch (error) {
      console.error('Error clearing default media storage provider:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear default media storage provider'
      });
    }
  }
);

module.exports = router;
