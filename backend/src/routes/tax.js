const express = require('express');
const { Tax, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for tax rules
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/tax');

    const where = {};
    
    if (isPublicRequest) {
      // Public access - only return active tax rules for specific store
      where.is_active = true;
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
        const userStores = await Store.findAll({
          where: { user_id: req.user.id },
          attributes: ['id']
        });
        const storeIds = userStores.map(store => store.id);
        where.store_id = { [Op.in]: storeIds };
      }
      
      if (store_id) where.store_id = store_id;
    }

    const { count, rows } = await Tax.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(rows);
    } else {
      // Return wrapped response for authenticated requests
      res.json({ success: true, data: { tax_rules: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tax = await Tax.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!tax) return res.status(404).json({ success: false, message: 'Tax rule not found' });
    if (req.user.role !== 'admin' && tax.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tax = await Tax.create(req.body);
    res.status(201).json({ success: true, message: 'Tax rule created successfully', data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tax = await Tax.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!tax) return res.status(404).json({ success: false, message: 'Tax rule not found' });
    if (req.user.role !== 'admin' && tax.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await tax.update(req.body);
    res.json({ success: true, message: 'Tax rule updated successfully', data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tax = await Tax.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!tax) return res.status(404).json({ success: false, message: 'Tax rule not found' });
    if (req.user.role !== 'admin' && tax.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await tax.destroy();
    res.json({ success: true, message: 'Tax rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;