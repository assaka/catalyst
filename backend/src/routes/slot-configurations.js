const express = require('express');
const router = express.Router();
const { SlotConfiguration } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Public endpoint to get active slot configurations for storefront
router.get('/public/slot-configurations', async (req, res) => {
  try {
    const { store_id, page_name, slot_type } = req.query;
    
    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }
    
    const where = {
      store_id,
      is_active: true
    };
    
    const configurations = await SlotConfiguration.findAll({
      where,
      order: [['updated_at', 'DESC']]
    });
    
    // Filter by page_name and slot_type if provided (stored in configuration JSON)
    let filtered = configurations;
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

// Get slot configurations (authMiddlewared)
router.get('/slot-configurations', authMiddleware, async (req, res) => {
  try {
    const { store_id, page_name, slot_type, is_active } = req.query;
    
    const where = {
      user_id: req.user.id
    };
    
    if (store_id) where.store_id = store_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    
    const configurations = await SlotConfiguration.findAll({
      where,
      order: [['updated_at', 'DESC']]
    });
    
    // Filter by page_name and slot_type if provided (stored in configuration JSON)
    let filtered = configurations;
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
    const configuration = await SlotConfiguration.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });
    
    if (!configuration) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    
    res.json({ success: true, data: configuration });
  } catch (error) {
    console.error('Error fetching slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create slot configuration
router.post('/slot-configurations', authMiddleware, async (req, res) => {
  try {
    const { page_name, slot_type, configuration, is_active, store_id } = req.body;
    
    // Include page_name and slot_type in the configuration JSON
    const fullConfiguration = {
      ...configuration,
      page_name,
      slot_type
    };
    
    // Check if a configuration already exists for this user/store
    const existing = await SlotConfiguration.findOne({
      where: {
        user_id: req.user.id,
        store_id: store_id || req.user.active_store_id
      }
    });
    
    if (existing) {
      // Update the existing configuration (since we only allow one per user/store)
      console.log('🔄 Updating existing slot configuration for user/store:', req.user.id, store_id);
      existing.configuration = fullConfiguration;
      existing.is_active = is_active !== undefined ? is_active : true;
      existing.changed('configuration', true);
      await existing.save();
      
      return res.json({ success: true, data: existing });
    }
    
    // Create new configuration
    console.log('➕ Creating new slot configuration for user/store:', req.user.id, store_id);
    const newConfiguration = await SlotConfiguration.create({
      user_id: req.user.id,
      store_id: store_id || req.user.active_store_id,
      configuration: fullConfiguration,
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.json({ success: true, data: newConfiguration });
  } catch (error) {
    console.error('Error creating slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update slot configuration
router.put('/slot-configurations/:id', authMiddleware, async (req, res) => {
  try {
    const configuration = await SlotConfiguration.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });
    
    if (!configuration) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    
    const { page_name, slot_type, configuration: newConfig, is_active } = req.body;
    
    // Include page_name and slot_type in the configuration JSON
    const fullConfiguration = {
      ...newConfig,
      page_name,
      slot_type
    };
    
    configuration.configuration = fullConfiguration;
    if (is_active !== undefined) configuration.is_active = is_active;
    configuration.changed('configuration', true);
    
    await configuration.save();
    
    res.json({ success: true, data: configuration });
  } catch (error) {
    console.error('Error updating slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete slot configuration
router.delete('/slot-configurations/:id', authMiddleware, async (req, res) => {
  try {
    const configuration = await SlotConfiguration.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });
    
    if (!configuration) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    
    await configuration.destroy();
    
    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;