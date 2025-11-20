const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const ConnectionManager = require('../services/database/ConnectionManager');

const router = express.Router();

/**
 * Get SEO settings from tenant DB
 */
async function getSeoSettings(tenantDb, store_id) {
  const { data, error } = await tenantDb
    .from('seo_settings')
    .select('*')
    .eq('store_id', store_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create SEO settings in tenant DB
 */
async function createSeoSettings(tenantDb, settingsData) {
  // Ensure we're not passing null or undefined id
  const insertData = { ...settingsData };
  if (insertData.id === null || insertData.id === undefined) {
    delete insertData.id;
  }

  const { data, error } = await tenantDb
    .from('seo_settings')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update SEO settings in tenant DB
 */
async function updateSeoSettings(tenantDb, id, settingsData) {
  const { data, error } = await tenantDb
    .from('seo_settings')
    .update(settingsData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete SEO settings from tenant DB
 */
async function deleteSeoSettings(tenantDb, id) {
  const { error } = await tenantDb
    .from('seo_settings')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// @route   GET /api/public/seo-settings (public access)
// @desc    Get SEO settings for a store (public access for storefront)
// @access  Public
router.get('/', async (req, res) => {
  // Check if this is a public request (no auth header)
  const isPublicRequest = !req.headers.authorization;

  if (isPublicRequest) {
    // Public access for storefront
    try {
      const { store_id } = req.query;

      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required'
        });
      }

      const tenantDb = await ConnectionManager.getStoreConnection(store_id);
      const seoSettings = await getSeoSettings(tenantDb, store_id);

      if (!seoSettings) {
        return res.json([]);
      }

      // Add cache-busting headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Return array format that the frontend expects
      res.json([seoSettings]);
    } catch (error) {
      console.error('Get SEO settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
    return;
  }

  // Private/authenticated request - continue with auth middleware
  authMiddleware(req, res, async () => {
    try {
      const store_id = req.headers['x-store-id'] || req.query.store_id;

      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required'
        });
      }

      // Check authentication and ownership
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

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
      let seoSettings = await getSeoSettings(tenantDb, store_id);

      if (!seoSettings) {
        // Create default SEO settings
        seoSettings = await createSeoSettings(tenantDb, { store_id });
      }

      // Return array format that the frontend expects
      res.json([seoSettings]);
    } catch (error) {
      console.error('Get SEO settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }); // Close auth middleware callback
}); // Close router.get

// @route   POST /api/seo-settings
// @desc    Create or update SEO settings
// @access  Private
router.post('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.body.store_id;

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
    let seoSettings = await getSeoSettings(tenantDb, store_id);

    if (seoSettings) {
      // Update existing settings
      seoSettings = await updateSeoSettings(tenantDb, seoSettings.id, req.body);
    } else {
      // Create new settings
      seoSettings = await createSeoSettings(tenantDb, { ...req.body, store_id });
    }

    // Return array format that the frontend expects
    res.json([seoSettings]);
  } catch (error) {
    console.error('Create/update SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/seo-settings/:id
// @desc    Update SEO settings
// @access  Private
router.put('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.body.store_id;

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
    const seoSettings = await updateSeoSettings(tenantDb, req.params.id, req.body);

    if (!seoSettings) {
      return res.status(404).json({
        success: false,
        message: 'SEO settings not found'
      });
    }

    // Return array format that the frontend expects
    res.json([seoSettings]);
  } catch (error) {
    console.error('Update SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/seo-settings/:id
// @desc    Delete SEO settings
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'];

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
    await deleteSeoSettings(tenantDb, req.params.id);

    res.json({
      success: true,
      message: 'SEO settings deleted successfully'
    });
  } catch (error) {
    console.error('Delete SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
