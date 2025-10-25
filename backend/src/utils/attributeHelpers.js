/**
 * Attribute Helpers for Normalized Translations
 *
 * Specialized helpers for fetching attributes with their values and translations
 * from normalized tables while maintaining the same JSON format the frontend expects.
 */

const { sequelize } = require('../database/connection');

/**
 * Get attributes with translations from normalized tables
 * Returns same format as before: { id, name, code, translations: {en: {label, description}, nl: {...}} }
 *
 * @param {object} where - WHERE clause conditions (supports simple values and Sequelize Op.in)
 * @returns {Promise<Array>} Attributes with translations
 */
async function getAttributesWithTranslations(where = {}) {
  const { Op } = require('sequelize');

  // Build WHERE clause
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === null) return `a.${key} IS NULL`;

      // Handle Sequelize Op.in
      if (typeof value === 'object' && value[Op.in]) {
        const vals = value[Op.in].map(v => `'${v}'`).join(', ');
        return `a.${key} IN (${vals})`;
      }

      // Handle Sequelize Op.notIn
      if (typeof value === 'object' && value[Op.notIn]) {
        const vals = value[Op.notIn].map(v => `'${v}'`).join(', ');
        return `a.${key} NOT IN (${vals})`;
      }

      // Handle arrays (treat as IN)
      if (Array.isArray(value)) {
        const vals = value.map(v => `'${v}'`).join(', ');
        return `a.${key} IN (${vals})`;
      }

      // Handle simple values
      return `a.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      a.*,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object('label', t.label, 'description', t.description)
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM attributes a
    LEFT JOIN attribute_translations t ON a.id = t.attribute_id
    ${whereClause}
    GROUP BY a.id
    ORDER BY a.sort_order ASC, a.name ASC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Get attribute values with translations from normalized tables
 * Returns same format: { id, attribute_id, code, translations: {en: {label}, nl: {...}} }
 *
 * @param {object} where - WHERE clause conditions (supports simple values and Sequelize Op.in)
 * @returns {Promise<Array>} Attribute values with translations
 */
async function getAttributeValuesWithTranslations(where = {}) {
  const { Op } = require('sequelize');

  // Build WHERE clause
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === null) return `av.${key} IS NULL`;

      // Handle Sequelize Op.in
      if (typeof value === 'object' && value[Op.in]) {
        const vals = value[Op.in].map(v => `'${v}'`).join(', ');
        return `av.${key} IN (${vals})`;
      }

      // Handle Sequelize Op.notIn
      if (typeof value === 'object' && value[Op.notIn]) {
        const vals = value[Op.notIn].map(v => `'${v}'`).join(', ');
        return `av.${key} NOT IN (${vals})`;
      }

      // Handle arrays (treat as IN)
      if (Array.isArray(value)) {
        const vals = value.map(v => `'${v}'`).join(', ');
        return `av.${key} IN (${vals})`;
      }

      // Handle simple values
      return `av.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      av.*,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object('label', t.value, 'description', t.description)
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM attribute_values av
    LEFT JOIN attribute_value_translations t ON av.id = t.attribute_value_id
    ${whereClause}
    GROUP BY av.id
    ORDER BY av.sort_order ASC, av.code ASC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Get single attribute with its values and translations
 *
 * @param {string} attributeId - Attribute ID
 * @returns {Promise<object>} Attribute with values and translations
 */
async function getAttributeWithValues(attributeId) {
  const attributes = await getAttributesWithTranslations({ id: attributeId });

  if (!attributes || attributes.length === 0) {
    return null;
  }

  const attribute = attributes[0];

  // Fetch values if this is a select/multiselect attribute
  if (attribute.type === 'select' || attribute.type === 'multiselect') {
    const values = await getAttributeValuesWithTranslations({ attribute_id: attributeId });
    attribute.values = values;
  } else {
    attribute.values = [];
  }

  return attribute;
}

/**
 * Get all attributes with their values for a store
 *
 * @param {string} storeId - Store ID
 * @param {object} options - Additional options (search, is_filterable, etc.)
 * @returns {Promise<Array>} Attributes with values and translations
 */
async function getAttributesWithValuesForStore(storeId, options = {}) {
  const { search, is_filterable, attribute_ids } = options;

  let whereClause = `WHERE a.store_id = '${storeId}'`;

  if (search) {
    const searchEscaped = search.replace(/'/g, "''");
    whereClause += ` AND (a.name ILIKE '%${searchEscaped}%' OR a.code ILIKE '%${searchEscaped}%')`;
  }

  if (is_filterable !== undefined) {
    whereClause += ` AND a.is_filterable = ${is_filterable}`;
  }

  if (attribute_ids && Array.isArray(attribute_ids)) {
    const ids = attribute_ids.map(id => `'${id}'`).join(', ');
    whereClause += ` AND a.id IN (${ids})`;
  }

  // First get attributes with translations
  const query = `
    SELECT
      a.*,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object('label', t.label, 'description', t.description)
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM attributes a
    LEFT JOIN attribute_translations t ON a.id = t.attribute_id
    ${whereClause}
    GROUP BY a.id
    ORDER BY a.sort_order ASC, a.name ASC
  `;

  const attributes = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  // For each select/multiselect attribute, fetch its values
  for (const attribute of attributes) {
    if (attribute.type === 'select' || attribute.type === 'multiselect') {
      attribute.values = await getAttributeValuesWithTranslations({
        attribute_id: attribute.id
      });
    } else {
      attribute.values = [];
    }
  }

  return attributes;
}

/**
 * Save attribute translations to normalized table
 *
 * @param {string} attributeId - Attribute ID
 * @param {object} translations - Translations object {en: {label, description}, nl: {...}}
 */
async function saveAttributeTranslations(attributeId, translations) {
  for (const [langCode, data] of Object.entries(translations)) {
    if (!data || typeof data !== 'object') continue;

    const label = data.label || '';
    const description = data.description || null;

    await sequelize.query(`
      INSERT INTO attribute_translations (attribute_id, language_code, label, description, created_at, updated_at)
      VALUES (:attributeId, :langCode, :label, :description, NOW(), NOW())
      ON CONFLICT (attribute_id, language_code)
      DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        updated_at = NOW()
    `, {
      replacements: { attributeId, langCode, label, description },
      type: sequelize.QueryTypes.INSERT
    });
  }
}

/**
 * Save attribute value translations to normalized table
 *
 * @param {string} valueId - Attribute value ID
 * @param {object} translations - Translations object {en: {label}, nl: {...}}
 */
async function saveAttributeValueTranslations(valueId, translations) {
  for (const [langCode, data] of Object.entries(translations)) {
    if (!data || typeof data !== 'object') continue;

    const value = data.label || ''; // JSON uses 'label', but table uses 'value'
    const description = data.description || null;

    await sequelize.query(`
      INSERT INTO attribute_value_translations (attribute_value_id, language_code, value, description, created_at, updated_at)
      VALUES (:valueId, :langCode, :value, :description, NOW(), NOW())
      ON CONFLICT (attribute_value_id, language_code)
      DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW()
    `, {
      replacements: { valueId, langCode, value, description },
      type: sequelize.QueryTypes.INSERT
    });
  }
}

module.exports = {
  getAttributesWithTranslations,
  getAttributeValuesWithTranslations,
  getAttributeWithValues,
  getAttributesWithValuesForStore,
  saveAttributeTranslations,
  saveAttributeValueTranslations
};
