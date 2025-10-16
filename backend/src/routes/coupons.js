const express = require('express');
const { Coupon, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for coupons
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, code, is_active } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Filter by user access if not admin
    if (req.user && req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    // Add filters based on query parameters
    if (store_id) where.store_id = store_id;
    if (code) where.code = code;
    if (is_active !== undefined) {
      // Convert string 'true'/'false' to boolean
      where.is_active = is_active === 'true' || is_active === true;
    }

    console.log('🔍 Coupon filter query:', { where, queryParams: req.query });

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    console.log('📦 Found coupons:', rows.length, 'coupons matching criteria');

    res.json({ success: true, data: { coupons: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('🐛 POST /api/coupons DEBUG:', {
      body: req.body,
      user: req.user?.email,
      userRole: req.user?.role
    });

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

    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry',
        error: 'A coupon with this code already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await coupon.update(req.body);
    res.json({ success: true, message: 'Coupon updated successfully', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await coupon.destroy();
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;