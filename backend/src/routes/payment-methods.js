const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to check store access (ownership or team membership)
const checkStoreAccess = async (storeId, userId, userRole) => {
  if (userRole === 'admin') return true;
  
  const { checkUserStoreAccess } = require('../utils/storeAccess');
  const access = await checkUserStoreAccess(userId, storeId);
  return access !== null;
};

// @route   GET /api/payment-methods
// @desc    Get payment methods
// @access  Private
router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, search } = req.query;
    const offset = (page - 1) * limit;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb
      .from('payment_methods')
      .select('*')
      .eq('store_id', store_id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    // Add search functionality if provided
    if (search) {
      query = tenantDb
        .from('payment_methods')
        .select('*')
        .eq('store_id', store_id)
        .or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
        .range(offset, offset + parseInt(limit) - 1);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching payment methods:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payment methods',
        error: error.message
      });
    }

    // Get total count
    const countQuery = search
      ? tenantDb
          .from('payment_methods')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id)
          .or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`)
      : tenantDb
          .from('payment_methods')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id);

    const { count } = await countQuery;

    res.json({
      success: true,
      data: {
        payment_methods: rows || [],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payment-methods/:id
// @desc    Get payment method by ID
// @access  Private
router.get('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: method, error } = await tenantDb
      .from('payment_methods')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .single();

    if (error || !method) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, method.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: method
    });
  } catch (error) {
    console.error('Get payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payment-methods
// @desc    Create new payment method
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Payment method name is required'),
  body('type').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery', 'other']).withMessage('Invalid payment method type'),
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, translations, ...methodData } = req.body;

    // Check store access
    const hasAccess = await checkStoreAccess(store_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: method, error } = await tenantDb
      .from('payment_methods')
      .insert({
        ...methodData,
        store_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating payment method',
        error: error.message
      });
    }

    // Insert translations if provided
    if (translations && typeof translations === 'object') {
      const translationInserts = Object.entries(translations)
        .filter(([_, data]) => data && (data.name || data.description))
        .map(([langCode, data]) => ({
          payment_method_id: method.id,
          language_code: langCode,
          name: data.name || '',
          description: data.description || ''
        }));

      if (translationInserts.length > 0) {
        const { error: transError } = await tenantDb
          .from('payment_method_translations')
          .upsert(translationInserts, {
            onConflict: 'payment_method_id,language_code'
          });

        if (transError) {
          console.error('Error creating payment method translations:', transError);
          // Note: We don't fail the whole request if translations fail
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: method
    });
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/payment-methods/:id
// @desc    Update payment method
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Payment method name cannot be empty'),
  body('type').optional().isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery', 'other']).withMessage('Invalid payment method type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const store_id = req.body.store_id || req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if payment method exists
    const { data: existing, error: checkError } = await tenantDb
      .from('payment_methods')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existing.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Separate translations from other data
    const { translations, ...updateData } = req.body;

    const { data: method, error } = await tenantDb
      .from('payment_methods')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating payment method',
        error: error.message
      });
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      const translationUpserts = Object.entries(translations)
        .filter(([_, data]) => data && (data.name !== undefined || data.description !== undefined))
        .map(([langCode, data]) => ({
          payment_method_id: req.params.id,
          language_code: langCode,
          name: data.name || '',
          description: data.description || ''
        }));

      if (translationUpserts.length > 0) {
        const { error: transError } = await tenantDb
          .from('payment_method_translations')
          .upsert(translationUpserts, {
            onConflict: 'payment_method_id,language_code'
          });

        if (transError) {
          console.error('Error updating payment method translations:', transError);
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: method
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/payment-methods/:id
// @desc    Delete payment method
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if payment method exists
    const { data: existing, error: checkError } = await tenantDb
      .from('payment_methods')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', store_id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existing.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const { error } = await tenantDb
      .from('payment_methods')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting payment method',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;