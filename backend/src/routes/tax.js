const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Basic CRUD operations for tax rules
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/tax');

    if (!store_id && !isPublicRequest) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!store_id && isPublicRequest) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query based on public vs authenticated access
    let query;
    if (isPublicRequest) {
      // Public access - only return active tax rules for specific store
      query = tenantDb
        .from('taxes')
        .select('*')
        .eq('store_id', store_id)
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(offset, offset + parseInt(limit) - 1);
    } else {
      // Authenticated access
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // For authenticated users, check store access
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);

        // Verify user has access to requested store
        if (!storeIds.includes(store_id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      query = tenantDb
        .from('taxes')
        .select('*')
        .eq('store_id', store_id)
        .order('name', { ascending: true })
        .range(offset, offset + parseInt(limit) - 1);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching tax rules:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching tax rules',
        error: error.message
      });
    }

    // Get total count
    const countQuery = isPublicRequest
      ? tenantDb
          .from('taxes')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id)
          .eq('is_active', true)
      : tenantDb
          .from('taxes')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id);

    const { count: totalCount } = await countQuery;

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(rows || []);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: {
          tax_rules: rows || [],
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: totalCount || 0,
            total_pages: Math.ceil((totalCount || 0) / limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Get tax rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: tax, error } = await tenantDb
      .from('taxes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }

    // Check store access for authenticated requests
    if (req.user && req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, tax.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: tax
    });
  } catch (error) {
    console.error('Get tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id, ...taxData } = req.body;

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

    const { data: tax, error } = await tenantDb
      .from('taxes')
      .insert({
        ...taxData,
        store_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tax rule:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating tax rule',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tax rule created successfully',
      data: tax
    });
  } catch (error) {
    console.error('Create tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.body.store_id || req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if tax rule exists
    const { data: tax, error: checkError } = await tenantDb
      .from('taxes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, tax.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const { data: updatedTax, error: updateError } = await tenantDb
      .from('taxes')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tax rule:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating tax rule',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Tax rule updated successfully',
      data: updatedTax
    });
  } catch (error) {
    console.error('Update tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if tax rule exists
    const { data: tax, error: checkError } = await tenantDb
      .from('taxes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, tax.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const { error } = await tenantDb
      .from('taxes')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting tax rule:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting tax rule',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Tax rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
