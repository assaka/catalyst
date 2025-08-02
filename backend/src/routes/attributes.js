const express = require('express');
const { Attribute, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for attributes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/attributes');

    const where = {};
    
    if (isPublicRequest) {
      // Public access - return all attributes for specific store (no is_active field in Attribute model)
      if (store_id) where.store_id = store_id;
    } else {
      // Authenticated access
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);
        where.store_id = { [Op.in]: storeIds };
      }
      
      if (store_id) where.store_id = store_id;
    }

    const { count, rows } = await Attribute.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(rows);
    } else {
      // Return wrapped response for authenticated requests
      res.json({ success: true, data: { attributes: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
    }
  } catch (error) {
    console.error('❌ Attributes API error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: attribute });
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

    const attribute = await Attribute.create(req.body);
    res.status(201).json({ success: true, message: 'Attribute created successfully', data: attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await attribute.update(req.body);
    res.json({ success: true, message: 'Attribute updated successfully', data: attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await attribute.destroy();
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;