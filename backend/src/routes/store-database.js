const express = require('express');
const router = express.Router();
const { Store } = require('../models'); // Master/Tenant hybrid model
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Get default database provider for a store
router.get('/stores/:storeId/default-database-provider', 
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      
      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({ 
          success: false, 
          message: 'Store not found' 
        });
      }

      // Get the default database provider from store settings
      const defaultProvider = store.settings?.default_database_provider || null;
      
      console.log('Store settings:', store.settings);
      console.log('Default provider:', defaultProvider);
      
      res.json({
        success: true,
        provider: defaultProvider,
        store_id: storeId
      });
    } catch (error) {
      console.error('Error fetching default database provider:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch default database provider' 
      });
    }
  }
);

// Set default database provider for a store
router.post('/stores/:storeId/default-database-provider', 
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { provider } = req.body;
      
      // Validate provider - includes both database and storage providers
      const validDatabaseProviders = ['supabase', 'aiven', 'aws-rds', 'google-cloud-sql', 'azure-database', 'planetscale'];
      // Storage providers - match the frontend values exactly
      const validStorageProviders = ['supabase', 'cloudflare', 'aws-s3', 'google-storage', 'azure-blob'];
      const allValidProviders = [...new Set([...validDatabaseProviders, ...validStorageProviders])];
      
      if (!allValidProviders.includes(provider)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid database/storage provider: ${provider}` 
        });
      }
      
      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({ 
          success: false, 
          message: 'Store not found' 
        });
      }

      // Update store settings with default database provider
      // Also set as media storage provider if it's a storage-capable provider
      const currentSettings = store.settings || {};
      const updatedSettings = {
        ...currentSettings,
        default_database_provider: provider,
        default_database_provider_updated_at: new Date().toISOString()
      };
      
      // If the provider supports storage (like Supabase), also set it as media storage provider
      const storageCapableProviders = ['supabase', 'aws-s3', 'google-storage', 'azure-blob', 'cloudflare'];
      if (storageCapableProviders.includes(provider)) {
        updatedSettings.default_mediastorage_provider = provider;
        updatedSettings.default_mediastorage_provider_updated_at = new Date().toISOString();
      }
      
      console.log('Current settings before update:', currentSettings);
      console.log('Updating store settings with:', updatedSettings);
      
      // Use raw query to ensure the JSON field is properly updated
      const { sequelize } = require('../database/connection');
      await sequelize.query(
        `UPDATE stores 
         SET settings = :settings,
             updated_at = NOW()
         WHERE id = :storeId`,
        {
          replacements: {
            settings: JSON.stringify(updatedSettings),
            storeId: storeId
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      // Reload the store to get the updated data
      await store.reload();
      console.log('Settings after save:', store.settings);
      
      res.json({
        success: true,
        message: `${provider} set as default database provider`,
        provider: provider,
        store_id: storeId
      });
    } catch (error) {
      console.error('Error setting default database provider:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to set default database provider' 
      });
    }
  }
);

// Clear default database provider for a store
router.delete('/stores/:storeId/default-database-provider', 
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      
      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({ 
          success: false, 
          message: 'Store not found' 
        });
      }

      // Remove default database provider from store settings
      const currentSettings = store.settings || {};
      const updatedSettings = { ...currentSettings };
      delete updatedSettings.default_database_provider;
      delete updatedSettings.default_database_provider_updated_at;
      
      // Use raw query to ensure the JSON field is properly updated
      const { sequelize } = require('../database/connection');
      await sequelize.query(
        `UPDATE stores 
         SET settings = :settings,
             updated_at = NOW()
         WHERE id = :storeId`,
        {
          replacements: {
            settings: JSON.stringify(updatedSettings),
            storeId: storeId
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      res.json({
        success: true,
        message: 'Default database provider cleared',
        store_id: storeId
      });
    } catch (error) {
      console.error('Error clearing default database provider:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to clear default database provider' 
      });
    }
  }
);

module.exports = router;