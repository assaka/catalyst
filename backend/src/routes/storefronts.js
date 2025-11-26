const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const ConnectionManager = require('../services/database/ConnectionManager');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * Get all storefronts for a store
 */
router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.query.store_id;
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getConnection(storeId);

    const { data: storefronts, error } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('store_id', storeId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    res.json({ success: true, data: storefronts });
  } catch (error) {
    console.error('Error fetching storefronts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get single storefront by ID
 */
router.get('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.query.store_id;

    if (!storeId) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getConnection(storeId);

    const { data: storefront, error } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (error) throw new Error(error.message);

    if (!storefront) {
      return res.status(404).json({ success: false, error: 'Storefront not found' });
    }

    res.json({ success: true, data: storefront });
  } catch (error) {
    console.error('Error fetching storefront:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new storefront
 */
router.post('/',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  [
    body('store_id').isUUID().withMessage('Valid store_id is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { store_id, name, slug, description, settings_override, publish_start_at, publish_end_at, is_primary } = req.body;

      const tenantDb = await ConnectionManager.getConnection(store_id);

      // Check if slug already exists for this store
      const { data: existing } = await tenantDb
        .from('storefronts')
        .select('id')
        .eq('store_id', store_id)
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ success: false, error: 'A storefront with this slug already exists' });
      }

      // Check if this is the first storefront (should be primary)
      const { data: existingStorefronts } = await tenantDb
        .from('storefronts')
        .select('id')
        .eq('store_id', store_id)
        .limit(1);

      const shouldBePrimary = is_primary === true || (existingStorefronts && existingStorefronts.length === 0);

      // If setting as primary, unset other primaries (only non-scheduled)
      if (shouldBePrimary) {
        await tenantDb
          .from('storefronts')
          .update({ is_primary: false, updated_at: new Date().toISOString() })
          .eq('store_id', store_id)
          .eq('is_primary', true)
          .is('publish_start_at', null);
      }

      const now = new Date().toISOString();
      const { data: storefront, error } = await tenantDb
        .from('storefronts')
        .insert({
          id: uuidv4(),
          store_id,
          name,
          slug,
          description: description || null,
          is_primary: shouldBePrimary,
          settings_override: settings_override || {},
          publish_start_at: publish_start_at || null,
          publish_end_at: publish_end_at || null,
          created_by: req.user?.id || null,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      res.status(201).json({ success: true, data: storefront });
    } catch (error) {
      console.error('Error creating storefront:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * Update storefront
 */
router.put('/:id',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  [
    param('id').isUUID().withMessage('Valid storefront ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { store_id, name, slug, description, settings_override, publish_start_at, publish_end_at } = req.body;

      if (!store_id) {
        return res.status(400).json({ success: false, error: 'store_id is required' });
      }

      const tenantDb = await ConnectionManager.getConnection(store_id);

      // Check if storefront exists
      const { data: existing } = await tenantDb
        .from('storefronts')
        .select('*')
        .eq('id', id)
        .eq('store_id', store_id)
        .single();

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Storefront not found' });
      }

      // If changing slug, check uniqueness
      if (slug && slug !== existing.slug) {
        const { data: slugExists } = await tenantDb
          .from('storefronts')
          .select('id')
          .eq('store_id', store_id)
          .eq('slug', slug)
          .neq('id', id)
          .maybeSingle();

        if (slugExists) {
          return res.status(400).json({ success: false, error: 'A storefront with this slug already exists' });
        }
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (settings_override !== undefined) updateData.settings_override = settings_override;
      if (publish_start_at !== undefined) updateData.publish_start_at = publish_start_at || null;
      if (publish_end_at !== undefined) updateData.publish_end_at = publish_end_at || null;

      const { data: storefront, error } = await tenantDb
        .from('storefronts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      res.json({ success: true, data: storefront });
    } catch (error) {
      console.error('Error updating storefront:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * Delete storefront
 */
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.query.store_id;

    if (!storeId) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getConnection(storeId);

    // Check if storefront exists and is not primary
    const { data: existing } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storefront not found' });
    }

    if (existing.is_primary) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete primary storefront. Set another storefront as primary first.'
      });
    }

    // Delete the storefront (slot_configurations.storefront_id will be set to NULL via FK)
    const { error } = await tenantDb
      .from('storefronts')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'Storefront deleted successfully' });
  } catch (error) {
    console.error('Error deleting storefront:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Set storefront as primary
 */
router.post('/:id/set-primary', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getConnection(store_id);

    // Check if storefront exists
    const { data: existing } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('id', id)
      .eq('store_id', store_id)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storefront not found' });
    }

    // Unset current primary (only for non-scheduled storefronts)
    await tenantDb
      .from('storefronts')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('store_id', store_id)
      .eq('is_primary', true)
      .is('publish_start_at', null);

    // Set new primary
    const { data: storefront, error } = await tenantDb
      .from('storefronts')
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.json({ success: true, data: storefront });
  } catch (error) {
    console.error('Error setting primary storefront:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Duplicate storefront
 */
router.post('/:id/duplicate', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id, new_name, new_slug } = req.body;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    if (!new_name || !new_slug) {
      return res.status(400).json({ success: false, error: 'new_name and new_slug are required' });
    }

    const tenantDb = await ConnectionManager.getConnection(store_id);

    // Get source storefront
    const { data: source } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('id', id)
      .eq('store_id', store_id)
      .single();

    if (!source) {
      return res.status(404).json({ success: false, error: 'Source storefront not found' });
    }

    // Check if new slug already exists
    const { data: slugExists } = await tenantDb
      .from('storefronts')
      .select('id')
      .eq('store_id', store_id)
      .eq('slug', new_slug)
      .maybeSingle();

    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A storefront with this slug already exists' });
    }

    const now = new Date().toISOString();
    const { data: storefront, error } = await tenantDb
      .from('storefronts')
      .insert({
        id: uuidv4(),
        store_id,
        name: new_name,
        slug: new_slug,
        description: source.description ? `Copy of ${source.name}: ${source.description}` : `Copy of ${source.name}`,
        is_primary: false,
        settings_override: source.settings_override,
        publish_start_at: null,
        publish_end_at: null,
        created_by: req.user?.id || null,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({ success: true, data: storefront });
  } catch (error) {
    console.error('Error duplicating storefront:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get active storefront (public endpoint for preview)
 */
router.get('/public/active', async (req, res) => {
  try {
    const { store_id, slug: storefrontSlug } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getConnection(store_id);
    const now = new Date().toISOString();

    let storefront = null;

    // 1. If specific storefront requested, load it
    if (storefrontSlug) {
      const { data } = await tenantDb
        .from('storefronts')
        .select('*')
        .eq('store_id', store_id)
        .eq('slug', storefrontSlug)
        .maybeSingle();

      storefront = data;
    }

    // 2. Check for scheduled storefront (within active window)
    if (!storefront) {
      const { data } = await tenantDb
        .from('storefronts')
        .select('*')
        .eq('store_id', store_id)
        .not('publish_start_at', 'is', null)
        .lte('publish_start_at', now)
        .or(`publish_end_at.is.null,publish_end_at.gte.${now}`)
        .order('publish_start_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      storefront = data;
    }

    // 3. Fall back to primary storefront
    if (!storefront) {
      const { data } = await tenantDb
        .from('storefronts')
        .select('*')
        .eq('store_id', store_id)
        .eq('is_primary', true)
        .maybeSingle();

      storefront = data;
    }

    res.json({ success: true, data: storefront });
  } catch (error) {
    console.error('Error fetching active storefront:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
