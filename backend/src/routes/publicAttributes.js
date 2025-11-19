const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();

// @route   GET /api/public/attributes
// @desc    Get attributes for a store (public access)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;
    const { page = 1, limit = 100, is_filterable } = req.query;
    const offset = (page - 1) * limit;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);
    const lang = getLanguageFromRequest(req);

    // Build where conditions
    let query = tenantDb
      .from('attributes')
      .select(`
        attributes.id,
        attributes.store_id,
        attributes.code,
        attributes.type,
        attributes.is_required,
        attributes.is_filterable,
        attributes.is_visible,
        attributes.sort_order,
        attributes.created_at,
        attributes.updated_at,
        COALESCE(at.name, attributes.name) as name,
        COALESCE(at.description, attributes.description) as description
      `)
      .leftJoin(
        'attribute_translations as at',
        'attributes.id',
        'at.attribute_id'
      )
      .where('attributes.store_id', '=', store_id)
      .where((builder) => {
        builder.where('at.language_code', '=', lang).orWhereNull('at.language_code');
      });

    // Filter by is_filterable if provided
    if (is_filterable !== undefined) {
      query = query.where('attributes.is_filterable', '=', is_filterable === 'true' || is_filterable === true);
    }

    // Apply pagination and ordering
    query = query
      .order('attributes.sort_order', { ascending: true })
      .order('attributes.name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: attributes, error, count } = await query;

    if (error) {
      console.error('Error fetching attributes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch attributes',
        error: error.message
      });
    }

    // Fetch attribute values for select/multiselect attributes
    const attributesWithValues = await Promise.all(attributes.map(async (attr) => {
      if (attr.type === 'select' || attr.type === 'multiselect') {
        // Get attribute values with translations
        const valueLimit = attr.is_filterable ? 1000 : 10; // Use high limit for filterable, otherwise 10

        const { data: values, error: valuesError } = await tenantDb
          .from('attribute_values')
          .select(`
            attribute_values.id,
            attribute_values.attribute_id,
            attribute_values.code,
            attribute_values.sort_order,
            attribute_values.created_at,
            attribute_values.updated_at,
            COALESCE(avt.value, attribute_values.value) as value
          `)
          .leftJoin(
            'attribute_value_translations as avt',
            'attribute_values.id',
            'avt.attribute_value_id'
          )
          .where('attribute_values.attribute_id', '=', attr.id)
          .where((builder) => {
            builder.where('avt.language_code', '=', lang).orWhereNull('avt.language_code');
          })
          .order('attribute_values.sort_order', { ascending: true })
          .order('attribute_values.code', { ascending: true })
          .limit(valueLimit);

        if (valuesError) {
          console.error('Error fetching attribute values:', valuesError);
          attr.values = [];
        } else {
          attr.values = values || [];
        }
      } else {
        attr.values = [];
      }

      return attr;
    }));

    // Apply cache headers based on store settings
    await applyCacheHeaders(res, store_id);

    // Return just the array for public requests (for compatibility with StorefrontBaseEntity)
    res.json(attributesWithValues);
  } catch (error) {
    console.error('Get attributes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
