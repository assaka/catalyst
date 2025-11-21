const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public endpoint to get active slot configurations for storefront
router.get('/public', async (req, res) => {
  try {
    const { store_id, page_name, slot_type } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: configurations, error } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('store_id', store_id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter by page_name and slot_type if provided (stored in configuration JSON)
    let filtered = configurations || [];
    if (page_name || slot_type) {
      filtered = configurations.filter(config => {
        const conf = config.configuration || {};
        if (page_name && conf.page_name !== page_name) return false;
        if (slot_type && conf.slot_type !== slot_type) return false;
        return true;
      });
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Error fetching public slot configurations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get slot configurations (authenticated)
router.get('/slot-configurations', authMiddleware, async (req, res) => {
  try {
    const { store_id, page_name, slot_type, is_active } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    let query = tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('user_id', req.user.id);

    if (store_id) query = query.eq('store_id', store_id);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    const { data: configurations, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter by page_name and slot_type if provided (stored in configuration JSON)
    let filtered = configurations || [];
    if (page_name || slot_type) {
      filtered = configurations.filter(config => {
        const conf = config.configuration || {};
        if (page_name && conf.page_name !== page_name) return false;
        if (slot_type && conf.slot_type !== slot_type) return false;
        return true;
      });
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Error fetching slot configurations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single slot configuration
router.get('/slot-configurations/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: configuration, error } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!configuration || error) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }

    res.json({ success: true, data: configuration });
  } catch (error) {
    console.error('Error fetching slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update draft slot configuration with static defaults
router.post('/draft/:storeId/:pageType', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType } = req.params;
    const { staticConfiguration } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, error: 'storeId is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Check if a draft configuration already exists for this user/store and pageType
    const { data: existing, error: findError } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('store_id', storeId)
      .eq('is_active', false)
      .maybeSingle();

    // If draft exists for the same page type, return it
    if (existing && !findError) {
      const existingPageType = existing.configuration?.metadata?.pageType;
      if (existingPageType === pageType) {
        console.log('✅ Returning existing draft slot configuration for user/store/page:', req.user.id, storeId, pageType);
        return res.json({ success: true, data: existing });
      }

      // Different page type - update with new configuration if staticConfiguration provided
      if (staticConfiguration) {
        console.log('🔄 Updating draft with new page configuration:', pageType);

        const { data: updated, error: updateError } = await tenantDb
          .from('slot_configurations')
          .update({
            configuration: staticConfiguration,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return res.json({ success: true, data: updated });
      }

      // Return existing draft even if page type doesn't match
      return res.json({ success: true, data: existing });
    }

    // Create new draft configuration with static defaults or empty slots
    const newConfig = staticConfiguration || {
      slots: {},
      metadata: {
        pageType: pageType,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    console.log('➕ Creating new draft slot configuration for user/store/page:', req.user.id, storeId, pageType);

    const { data: newConfiguration, error: createError } = await tenantDb
      .from('slot_configurations')
      .insert({
        user_id: req.user.id,
        store_id: storeId,
        configuration: newConfig,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    res.json({ success: true, data: newConfiguration });
  } catch (error) {
    console.error('Error creating draft slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create slot configuration
router.post('/slot-configurations', authMiddleware, async (req, res) => {
  try {
    const { page_name, slot_type, configuration, is_active, store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Include page_name and slot_type in the configuration JSON
    const fullConfiguration = {
      ...configuration,
      page_name,
      slot_type
    };

    // Check if a configuration already exists for this user/store
    const { data: existing, error: findError } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('store_id', store_id || req.user.active_store_id)
      .maybeSingle();

    if (existing && !findError) {
      // Update the existing configuration (since we only allow one per user/store)
      console.log('🔄 Updating existing slot configuration for user/store:', req.user.id, store_id);

      const { data: updated, error: updateError } = await tenantDb
        .from('slot_configurations')
        .update({
          configuration: fullConfiguration,
          is_active: is_active !== undefined ? is_active : true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return res.json({ success: true, data: updated });
    }

    // Create new configuration
    console.log('➕ Creating new slot configuration for user/store:', req.user.id, store_id);

    const { data: newConfiguration, error: createError } = await tenantDb
      .from('slot_configurations')
      .insert({
        user_id: req.user.id,
        store_id: store_id || req.user.active_store_id,
        configuration: fullConfiguration,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    res.json({ success: true, data: newConfiguration });
  } catch (error) {
    console.error('Error creating slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update slot configuration
router.put('/slot-configurations/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: configuration, error: findError } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!configuration || findError) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }

    const { page_name, slot_type, configuration: newConfig, is_active } = req.body;

    // Include page_name and slot_type in the configuration JSON
    const fullConfiguration = {
      ...newConfig,
      page_name,
      slot_type
    };

    const updateData = {
      configuration: fullConfiguration,
      updated_at: new Date().toISOString()
    };

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const { data: updated, error: updateError } = await tenantDb
      .from('slot_configurations')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete slot configuration
router.delete('/slot-configurations/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: configuration, error: findError } = await tenantDb
      .from('slot_configurations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!configuration || findError) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }

    const { error: deleteError } = await tenantDb
      .from('slot_configurations')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
