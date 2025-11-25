const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Helper function to check store access (ownership or team membership)
const checkStoreAccess = async (storeId, userId, userRole) => {
  if (userRole === 'admin') return true;

  const { checkUserStoreAccess } = require('../utils/storeAccess');
  const access = await checkUserStoreAccess(userId, storeId);
  return access !== null;
};

// @route   POST /api/consent-logs
// @desc    Log user consent decision
// @access  Public (no auth required for consent logging)
router.post('/', [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('session_id').notEmpty().withMessage('Session ID is required'),
  body('consent_given').isBoolean().withMessage('Consent given must be boolean'),
  body('categories_accepted').isArray().withMessage('Categories must be an array'),
  body('consent_method').isIn(['accept_all', 'reject_all', 'custom']).withMessage('Invalid consent method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      store_id,
      session_id,
      user_id,
      consent_given,
      categories_accepted,
      country_code,
      consent_method,
      page_url
    } = req.body;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Verify store exists
    const { data: store, error: storeError } = await tenantDb
      .from('stores')
      .select('id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Create consent log
    const { data: consentLog, error } = await tenantDb
      .from('consent_logs')
      .insert({
        store_id,
        session_id,
        user_id: user_id || null,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'] || null,
        consent_given,
        categories_accepted,
        country_code: country_code || null,
        consent_method,
        page_url: page_url || req.headers.referer || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Consent logged successfully',
      data: consentLog
    });
  } catch (error) {
    console.error('Log consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/consent-logs
// @desc    Get consent logs for a store
// @access  Private
router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id, limit = 50, offset = 0 } = req.query;

    // If specific store_id is provided, use that tenant connection
    // Otherwise, we need to query across all accessible stores
    if (store_id) {
      // Single store query
      const tenantDb = await ConnectionManager.getStoreConnection(store_id);

      // Filter by store access (ownership + team membership)
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);

        // Check if user has access to requested store
        if (!storeIds.includes(store_id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this store'
          });
        }
      }

      const { data: logs, error } = await tenantDb
        .from('consent_logs')
        .select('*')
        .eq('store_id', store_id)
        .order('created_date', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        throw error;
      }

      return res.json({
        success: true,
        data: logs || []
      });
    } else {
      // Multi-store query - need to aggregate across accessible stores
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);

        if (storeIds.length === 0) {
          return res.json({
            success: true,
            data: []
          });
        }

        // Query each store's tenant database and aggregate results
        const allLogs = [];
        for (const storeId of storeIds) {
          try {
            const tenantDb = await ConnectionManager.getStoreConnection(storeId);

            const { data: logs, error } = await tenantDb
              .from('consent_logs')
              .select('*')
              .eq('store_id', storeId)
              .order('created_date', { ascending: false });

            if (!error && logs) {
              allLogs.push(...logs);
            }
          } catch (error) {
            console.error(`Error fetching logs from store ${storeId}:`, error);
            // Continue with other stores
          }
        }

        // Sort all logs by date and apply pagination
        allLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        const paginatedLogs = allLogs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        return res.json({
          success: true,
          data: paginatedLogs
        });
      } else {
        // Admin without store_id - this would require querying all stores
        // For now, return error requiring store_id
        return res.status(400).json({
          success: false,
          message: 'store_id is required'
        });
      }
    }
  } catch (error) {
    console.error('Get consent logs error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
