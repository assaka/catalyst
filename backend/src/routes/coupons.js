const express = require('express');
const { Coupon, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for coupons
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { owner_email: req.user.email },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    res.json({ success: true, data: { coupons: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'owner_email'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (req.user.role !== 'admin' && coupon.Store.owner_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    if (req.user.role !== 'admin' && store.owner_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'owner_email'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (req.user.role !== 'admin' && coupon.Store.owner_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
      include: [{ model: Store, attributes: ['id', 'name', 'owner_email'] }]
    });
    
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (req.user.role !== 'admin' && coupon.Store.owner_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await coupon.destroy();
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;