const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// Basic CRUD operations for coupons
router.get('/', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const { page = 1, limit = 10, code, is_active } = req.query;
    const offset = (page - 1) * limit;

    // Filter by user access if not admin
    let allowedStoreIds = [store_id];
    if (req.user && req.user.role !== 'admin') {
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
    let query = tenantDb.from('coupons').select('*', { count: 'exact' }).eq('store_id', store_id);

    // Add filters
    if (code) {
      query = query.ilike('code', code);
    }
    if (is_active !== undefined) {
      const isActiveValue = is_active === 'true' || is_active === true;
      query = query.eq('is_active', isActiveValue);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    console.log('🔍 Coupon filter query:', { store_id, code, is_active });

    const { data: rows, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    console.log('📦 Found coupons:', rows?.length || 0, 'coupons matching criteria');

    res.json({
      success: true,
      data: {
        coupons: rows || [],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: coupon, error } = await tenantDb
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🐛 POST /api/coupons DEBUG:', {
      body: req.body,
      translations: req.body.translations,
      user: req.user?.email,
      userRole: req.user?.role
    });

    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if store exists
    const { data: store, error: storeError } = await tenantDb
      .from('stores')
      .select('id')
      .eq('id', store_id)
      .maybeSingle();

    if (storeError || !store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Check for duplicate code
    const { data: existingCoupon } = await tenantDb
      .from('coupons')
      .select('id')
      .eq('code', req.body.code)
      .maybeSingle();

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry',
        error: 'A coupon with this code already exists'
      });
    }

    // Prepare coupon data
    const couponData = {
      store_id: req.body.store_id,
      name: req.body.name,
      code: req.body.code,
      description: req.body.description || null,
      discount_type: req.body.discount_type || 'fixed',
      discount_value: req.body.discount_value,
      is_active: req.body.is_active !== false,
      usage_limit: req.body.usage_limit || 100,
      usage_count: req.body.usage_count || 0,
      min_purchase_amount: req.body.min_purchase_amount || null,
      max_discount_amount: req.body.max_discount_amount || null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      buy_quantity: req.body.buy_quantity || 1,
      get_quantity: req.body.get_quantity || 1,
      applicable_products: req.body.applicable_products || [],
      applicable_categories: req.body.applicable_categories || [],
      applicable_skus: req.body.applicable_skus || [],
      applicable_attribute_sets: req.body.applicable_attribute_sets || [],
      applicable_attributes: req.body.applicable_attributes || [],
      translations: req.body.translations || {}
    };

    const { data: coupon, error } = await tenantDb
      .from('coupons')
      .insert(couponData)
      .select()
      .single();

    if (error) {
      console.error('Create coupon error:', error);

      // Handle validation errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Duplicate entry',
          error: 'A coupon with this code already exists'
        });
      }

      throw new Error(error.message);
    }

    console.log('🐛 Created coupon with translations:', coupon.translations);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🐛 PUT /api/coupons/:id DEBUG:', {
      id: req.params.id,
      translations: req.body.translations
    });

    const store_id = req.headers['x-store-id'] || req.body.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get existing coupon
    const { data: coupon, error: fetchError } = await tenantDb
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Prepare update data
    const updateData = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      discount_type: req.body.discount_type,
      discount_value: req.body.discount_value,
      is_active: req.body.is_active,
      usage_limit: req.body.usage_limit,
      usage_count: req.body.usage_count,
      min_purchase_amount: req.body.min_purchase_amount,
      max_discount_amount: req.body.max_discount_amount,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      buy_quantity: req.body.buy_quantity,
      get_quantity: req.body.get_quantity,
      applicable_products: req.body.applicable_products,
      applicable_categories: req.body.applicable_categories,
      applicable_skus: req.body.applicable_skus,
      applicable_attribute_sets: req.body.applicable_attribute_sets,
      applicable_attributes: req.body.applicable_attributes,
      translations: req.body.translations,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: updatedCoupon, error } = await tenantDb
      .from('coupons')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log('🐛 Updated coupon with translations:', updatedCoupon.translations);
    res.json({ success: true, message: 'Coupon updated successfully', data: updatedCoupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get existing coupon
    const { data: coupon, error: fetchError } = await tenantDb
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, coupon.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const { error } = await tenantDb
      .from('coupons')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
