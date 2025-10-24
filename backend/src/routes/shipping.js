const express = require('express');
const { Store } = require('../models');
const { Op } = require('sequelize');
const {
  getShippingMethodsWithTranslations,
  getShippingMethodsCount,
  getShippingMethodById,
  createShippingMethodWithTranslations,
  updateShippingMethodWithTranslations,
  deleteShippingMethod
} = require('../utils/shippingMethodHelpers');
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
      where.store_id = storeIds; // Helper handles array conversion
    }

    if (store_id) where.store_id = store_id;

    const [rows, count] = await Promise.all([
      getShippingMethodsWithTranslations(where, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }),
      getShippingMethodsCount(where)
    ]);

    res.json({ success: true, data: { shipping_methods: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shippingMethod = await getShippingMethodById(req.params.id);

    if (!shippingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, shippingMethod.store_id);

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

    // Extract translations from request body
    const { translations, ...methodData } = req.body;

    const shippingMethod = await createShippingMethodWithTranslations(methodData, translations || {});
    res.status(201).json({ success: true, message: 'Shipping method created successfully', data: shippingMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existingMethod = await getShippingMethodById(req.params.id);

    if (!existingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existingMethod.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Extract translations from request body
    const { translations, ...methodData } = req.body;

    const shippingMethod = await updateShippingMethodWithTranslations(req.params.id, methodData, translations || {});
    res.json({ success: true, message: 'Shipping method updated successfully', data: shippingMethod });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const shippingMethod = await getShippingMethodById(req.params.id);

    if (!shippingMethod) return res.status(404).json({ success: false, message: 'Shipping method not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, shippingMethod.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await deleteShippingMethod(req.params.id);
    res.json({ success: true, message: 'Shipping method deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;