const express = require('express');
const { CmsPage, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for CMS pages
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

    const { count, rows } = await CmsPage.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['title', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    res.json({ success: true, data: { pages: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    if (req.user.role !== 'admin' && page.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: page });
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

    const page = await CmsPage.create(req.body);
    res.status(201).json({ success: true, message: 'Page created successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    if (req.user.role !== 'admin' && page.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await page.update(req.body);
    res.json({ success: true, message: 'Page updated successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    if (req.user.role !== 'admin' && page.Store.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await page.destroy();
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;