const express = require('express');
const { ShippingMethod, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for shipping methods
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    const { count, rows } = await ShippingMethod.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    res.json({ success: true, data: { shipping_methods: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shippingMethod = await ShippingMethod.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!shippingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, shippingMethod.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: shippingMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const shippingMethod = await ShippingMethod.create(req.body);
    res.status(201).json({ success: true, message: 'Shipping method created successfully', data: shippingMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const shippingMethod = await ShippingMethod.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!shippingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, shippingMethod.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await shippingMethod.update(req.body);
    res.json({ success: true, message: 'Shipping method updated successfully', data: shippingMethod });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const shippingMethod = await ShippingMethod.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!shippingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, shippingMethod.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await shippingMethod.destroy();
    res.json({ success: true, message: 'Shipping method deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;