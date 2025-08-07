const express = require('express');
const router = express.Router();
const { Store } = require('../models');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Get default database provider for a store
router.get('/stores/:storeId/default-database-provider', 
  authMiddleware, 
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
  authMiddleware, 
  checkStoreOwnership,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { provider } = req.body;
      
      // Validate provider
      const validProviders = ['supabase', 'aiven', 'aws-rds', 'google-cloud-sql', 'azure-database', 'planetscale'];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid database provider' 
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
      const currentSettings = store.settings || {};
      store.settings = {
        ...currentSettings,
        default_database_provider: provider,
        default_database_provider_updated_at: new Date()
      };
      
      await store.save();
      
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
  authMiddleware, 
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
      delete currentSettings.default_database_provider;
      delete currentSettings.default_database_provider_updated_at;
      store.settings = currentSettings;
      
      await store.save();
      
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