const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();

// Basic CRUD operations for shipping methods
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);
    const lang = getLanguageFromRequest(req);

    // Get shipping methods with translations
    const { data: rows, error: rowsError } = await tenantDb
      .from('shipping_methods')
      .select(`
        id,
        store_id,
        name,
        description,
        is_active,
        type,
        flat_rate_cost,
        free_shipping_min_order,
        weight_ranges,
        price_ranges,
        availability,
        countries,
        conditions,
        min_delivery_days,
        max_delivery_days,
        sort_order,
        created_at,
        updated_at
      `)
      .eq('store_id', store_id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (rowsError) {
      console.error('Error fetching shipping methods:', rowsError);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Get count
    const { count, error: countError } = await tenantDb
      .from('shipping_methods')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id);

    if (countError) {
      console.error('Error counting shipping methods:', countError);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Load translations for each method
    const methodIds = rows.map(m => m.id);
    if (methodIds.length > 0) {
      const { data: translations } = await tenantDb
        .from('shipping_method_translations')
        .select('*')
        .in('shipping_method_id', methodIds)
        .eq('language_code', lang);

      // Merge translations
      const translationsMap = {};
      if (translations) {
        translations.forEach(t => {
          translationsMap[t.shipping_method_id] = t;
        });
      }

      rows.forEach(method => {
        const trans = translationsMap[method.id];
        if (trans) {
          if (trans.name) method.name = trans.name;
          if (trans.description) method.description = trans.description;
        }
      });
    }

    res.json({
      success: true,
      data: {
        shipping_methods: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { store_id } = req.query;
    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);
    const lang = getLanguageFromRequest(req);

    // Get shipping method
    const { data: method, error } = await tenantDb
      .from('shipping_methods')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !method) {
      return res.status(404).json({ success: false, message: 'Shipping method not found' });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, method.store_id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Load translation
    const { data: translations } = await tenantDb
      .from('shipping_method_translations')
      .select('*')
      .eq('shipping_method_id', method.id)
      .eq('language_code', lang)
      .maybeSingle();

    if (translations) {
      if (translations.name) method.name = translations.name;
      if (translations.description) method.description = translations.description;
    }

    res.json({ success: true, data: method });
  } catch (error) {
    console.error('Get shipping method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id, translations, ...methodData } = req.body;

    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Create shipping method
    const { data: method, error: methodError } = await tenantDb
      .from('shipping_methods')
      .insert({
        ...methodData,
        store_id,
        name: methodData.name || '',
        description: methodData.description || '',
        is_active: methodData.is_active !== false,
        type: methodData.type || 'flat_rate',
        flat_rate_cost: methodData.flat_rate_cost || 0,
        free_shipping_min_order: methodData.free_shipping_min_order || 0,
        availability: methodData.availability || 'all',
        min_delivery_days: methodData.min_delivery_days || 1,
        max_delivery_days: methodData.max_delivery_days || 7,
        sort_order: methodData.sort_order || 0
      })
      .select()
      .single();

    if (methodError) {
      console.error('Error creating shipping method:', methodError);
      return res.status(500).json({ success: false, message: 'Failed to create shipping method' });
    }

    // Insert translations
    if (translations && typeof translations === 'object') {
      const translationInserts = Object.entries(translations)
        .filter(([_, data]) => data && (data.name || data.description))
        .map(([langCode, data]) => ({
          shipping_method_id: method.id,
          language_code: langCode,
          name: data.name || '',
          description: data.description || ''
        }));

      if (translationInserts.length > 0) {
        const { error: transError } = await tenantDb
          .from('shipping_method_translations')
          .upsert(translationInserts, {
            onConflict: 'shipping_method_id,language_code'
          });

        if (transError) {
          console.error('Error inserting translations:', transError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Shipping method created successfully',
      data: method
    });
  } catch (error) {
    console.error('Create shipping method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { store_id, translations, ...methodData } = req.body;

    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if method exists
    const { data: existingMethod, error: fetchError } = await tenantDb
      .from('shipping_methods')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingMethod) {
      return res.status(404).json({ success: false, message: 'Shipping method not found' });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existingMethod.store_id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Update shipping method
    const { data: method, error: updateError } = await tenantDb
      .from('shipping_methods')
      .update(methodData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shipping method:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update shipping method' });
    }

    // Update translations
    if (translations && typeof translations === 'object') {
      const translationUpserts = Object.entries(translations)
        .filter(([_, data]) => data && (data.name !== undefined || data.description !== undefined))
        .map(([langCode, data]) => ({
          shipping_method_id: method.id,
          language_code: langCode,
          name: data.name || '',
          description: data.description || ''
        }));

      if (translationUpserts.length > 0) {
        const { error: transError } = await tenantDb
          .from('shipping_method_translations')
          .upsert(translationUpserts, {
            onConflict: 'shipping_method_id,language_code'
          });

        if (transError) {
          console.error('Error updating translations:', transError);
        }
      }
    }

    res.json({
      success: true,
      message: 'Shipping method updated successfully',
      data: method
    });
  } catch (error) {
    console.error('Update shipping method error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if method exists
    const { data: method, error: fetchError } = await tenantDb
      .from('shipping_methods')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !method) {
      return res.status(404).json({ success: false, message: 'Shipping method not found' });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, method.store_id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Delete shipping method (CASCADE will delete translations)
    const { error: deleteError } = await tenantDb
      .from('shipping_methods')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      console.error('Error deleting shipping method:', deleteError);
      return res.status(500).json({ success: false, message: 'Failed to delete shipping method' });
    }

    res.json({ success: true, message: 'Shipping method deleted successfully' });
  } catch (error) {
    console.error('Delete shipping method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
