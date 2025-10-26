const express = require('express');
const { Attribute, AttributeValue, Store } = require('../models');
const { Op } = require('sequelize');
const {
  getAttributesWithTranslations,
  getAttributeValuesWithTranslations
} = require('../utils/attributeHelpers');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const router = express.Router();

// @route   GET /api/public/attributes
// @desc    Get attributes for a store (public access)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, is_filterable } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Public access - return all attributes for specific store
    if (store_id) {
      where.store_id = store_id;
    }

    // Filter by is_filterable if provided
    if (is_filterable !== undefined) {
      where.is_filterable = is_filterable === 'true' || is_filterable === true;
    }

    const { count, rows } = await Attribute.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: { exclude: ['translations'] }, // Exclude translations JSON column - using normalized table
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    // Get attribute IDs for translation lookup
    const attributeIds = rows.map(attr => attr.id);

    // Fetch translations from normalized tables
    const attributesWithTranslations = attributeIds.length > 0
      ? await getAttributesWithTranslations({ id: { [Op.in]: attributeIds } })
      : [];

    // Create a map for quick lookup
    const translationsMap = new Map(
      attributesWithTranslations.map(attr => [attr.id, attr.translations])
    );

    // Fetch attribute values for select/multiselect attributes
    const attributesWithValues = await Promise.all(rows.map(async (attr) => {
      const attrData = attr.toJSON();

      // Replace translations with normalized data
      attrData.translations = translationsMap.get(attr.id) || {};

      if (attr.type === 'select' || attr.type === 'multiselect') {
        const values = await AttributeValue.findAll({
          where: { attribute_id: attr.id },
          order: [['sort_order', 'ASC'], ['code', 'ASC']],
          attributes: { exclude: ['translations'] }, // Exclude translations JSON column - using normalized table
          // For filterable attributes, include all values; otherwise limit to 10
          limit: attr.is_filterable ? undefined : 10
        });

        // Get value IDs for translation lookup
        const valueIds = values.map(v => v.id);
        const valuesWithTranslations = valueIds.length > 0
          ? await getAttributeValuesWithTranslations({ id: { [Op.in]: valueIds } })
          : [];

        // Create translation map for values
        const valueTranslationsMap = new Map(
          valuesWithTranslations.map(val => [val.id, val.translations])
        );

        // Merge translations into values
        attrData.values = values.map(v => {
          const valData = v.toJSON();
          valData.translations = valueTranslationsMap.get(v.id) || {};
          return valData;
        });
      } else {
        attrData.values = [];
      }

      return attrData;
    }));

    // Apply cache headers based on store settings
    const { store_id } = req.query;
    if (store_id) {
      await applyCacheHeaders(res, store_id);
    }

    res.json({
      success: true,
      data: attributesWithValues,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get attributes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
