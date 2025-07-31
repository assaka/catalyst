const express = require('express');
const { DeliverySettings, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();
const { checkStoreOwnership, checkResourceOwnership } = require('../middleware/storeAuth');

// Basic CRUD operations for delivery settings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { user_id: req.user.id },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    const { count, rows } = await DeliverySettings.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    res.json({ success: true, data: { delivery_settings: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const deliverySettings = await DeliverySettings.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!deliverySettings) return res.status(404).json({ success: false, message: 'Delivery settings not found' });
    if (req.user.role !== 'admin' && deliverySettings.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: deliverySettings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.body;
    // Store ownership already verified by middleware

    console.log('🔄 Creating delivery settings:', req.body);
    const deliverySettings = await DeliverySettings.create(req.body);
    console.log('✅ Delivery settings created:', deliverySettings.id);
    
    res.status(201).json({ success: true, message: 'Delivery settings created successfully', data: deliverySettings });
  } catch (error) {
    console.error('❌ Create delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:id', checkResourceOwnership('DeliverySettings'), async (req, res) => {
  try {
    const deliverySettings = req.resource; // Resource is attached by middleware

    console.log('🔄 Updating delivery settings:', req.params.id, req.body);
    await deliverySettings.update(req.body);
    await deliverySettings.reload(); // Reload to get updated data
    console.log('✅ Delivery settings updated successfully');
    
    res.json({ success: true, message: 'Delivery settings updated successfully', data: deliverySettings });
  } catch (error) {
    console.error('❌ Update delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deliverySettings = await DeliverySettings.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!deliverySettings) return res.status(404).json({ success: false, message: 'Delivery settings not found' });
    if (req.user.role !== 'admin' && deliverySettings.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await deliverySettings.destroy();
    res.json({ success: true, message: 'Delivery settings deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;