const express = require('express');
const { StorePlugin } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/store-plugins/public
// @desc    Get active store plugins for public use
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { store_id, plugin_slug } = req.query;
    
    const whereClause = { is_active: true }; // Only return active plugins
    if (store_id) whereClause.store_id = store_id;
    if (plugin_slug) whereClause.plugin_slug = plugin_slug;

    const plugins = await StorePlugin.findAll({
      where: whereClause,
      attributes: ['id', 'store_id', 'plugin_slug', 'plugin_name', 'is_active', 'version', 'createdAt', 'updatedAt'],
      order: [['plugin_name', 'ASC']]
    });

    res.json({
      success: true,
      data: { store_plugins: plugins }
    });
  } catch (error) {
    console.error('Get public store plugins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/store-plugins
// @desc    Get store plugins
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { store_id, plugin_slug, is_active } = req.query;
    
    const whereClause = {};
    if (store_id) whereClause.store_id = store_id;
    if (plugin_slug) whereClause.plugin_slug = plugin_slug;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const plugins = await StorePlugin.findAll({
      where: whereClause,
      attributes: ['id', 'store_id', 'plugin_slug', 'plugin_name', 'is_active', 'version', 'createdAt', 'updatedAt'],
      order: [['plugin_name', 'ASC']]
    });

    res.json({
      success: true,
      data: { store_plugins: plugins }
    });
  } catch (error) {
    console.error('Get store plugins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/store-plugins/:id
// @desc    Get single store plugin
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const plugin = await StorePlugin.findByPk(req.params.id);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: 'Store plugin not found'
      });
    }

    res.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    console.error('Get store plugin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-plugins
// @desc    Install/add a plugin to store
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const plugin = await StorePlugin.create(req.body);
    res.status(201).json({
      success: true,
      data: plugin
    });
  } catch (error) {
    console.error('Install store plugin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/store-plugins/:id
// @desc    Update store plugin
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const plugin = await StorePlugin.findByPk(req.params.id);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: 'Store plugin not found'
      });
    }

    await plugin.update(req.body);
    res.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    console.error('Update store plugin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/store-plugins/:id
// @desc    Remove/uninstall plugin from store
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plugin = await StorePlugin.findByPk(req.params.id);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: 'Store plugin not found'
      });
    }

    await plugin.destroy();
    res.json({
      success: true,
      message: 'Store plugin removed successfully'
    });
  } catch (error) {
    console.error('Remove store plugin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;