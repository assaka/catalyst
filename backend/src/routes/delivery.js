const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();
const { checkStoreOwnership, checkResourceOwnership } = require('../middleware/storeAuth');

// Basic CRUD operations for delivery settings
router.get('/', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Filter by user access if not admin
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);

      // Check if requested store is accessible
      if (!storeIds.includes(store_id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb.from('delivery_settings').select('*', { count: 'exact' }).eq('store_id', store_id);

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: {
        delivery_settings: rows || [],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: deliverySettings, error } = await tenantDb
      .from('delivery_settings')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!deliverySettings) {
      return res.status(404).json({ success: false, message: 'Delivery settings not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, deliverySettings.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: deliverySettings });
  } catch (error) {
    console.error('Get delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Store ownership already verified by middleware
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    console.log('🔄 Creating delivery settings:', req.body);

    // Prepare delivery settings data
    const deliveryData = {
      store_id: req.body.store_id,
      enable_delivery_date: req.body.enable_delivery_date !== false,
      enable_comments: req.body.enable_comments !== false,
      offset_days: req.body.offset_days || 1,
      max_advance_days: req.body.max_advance_days || 30,
      blocked_dates: req.body.blocked_dates || [],
      blocked_weekdays: req.body.blocked_weekdays || [],
      out_of_office_start: req.body.out_of_office_start || null,
      out_of_office_end: req.body.out_of_office_end || null,
      delivery_time_slots: req.body.delivery_time_slots || [
        { start_time: '09:00', end_time: '12:00', is_active: true },
        { start_time: '13:00', end_time: '17:00', is_active: true }
      ]
    };

    const { data: deliverySettings, error } = await tenantDb
      .from('delivery_settings')
      .insert(deliveryData)
      .select()
      .single();

    if (error) {
      console.error('❌ Create delivery settings error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Delivery settings created:', deliverySettings.id);

    res.status(201).json({
      success: true,
      message: 'Delivery settings created successfully',
      data: deliverySettings
    });
  } catch (error) {
    console.error('❌ Create delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.body.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get existing delivery settings
    const { data: deliverySettings, error: fetchError } = await tenantDb
      .from('delivery_settings')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!deliverySettings) {
      return res.status(404).json({ success: false, message: 'Delivery settings not found' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, deliverySettings.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    console.log('🔄 Updating delivery settings:', req.params.id, req.body);

    // Prepare update data
    const updateData = {
      enable_delivery_date: req.body.enable_delivery_date,
      enable_comments: req.body.enable_comments,
      offset_days: req.body.offset_days,
      max_advance_days: req.body.max_advance_days,
      blocked_dates: req.body.blocked_dates,
      blocked_weekdays: req.body.blocked_weekdays,
      out_of_office_start: req.body.out_of_office_start,
      out_of_office_end: req.body.out_of_office_end,
      delivery_time_slots: req.body.delivery_time_slots,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: updatedSettings, error } = await tenantDb
      .from('delivery_settings')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Delivery settings updated successfully');

    res.json({
      success: true,
      message: 'Delivery settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('❌ Update delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get existing delivery settings
    const { data: deliverySettings, error: fetchError } = await tenantDb
      .from('delivery_settings')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!deliverySettings) {
      return res.status(404).json({ success: false, message: 'Delivery settings not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, deliverySettings.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const { error } = await tenantDb
      .from('delivery_settings')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({ success: true, message: 'Delivery settings deleted successfully' });
  } catch (error) {
    console.error('Delete delivery settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
