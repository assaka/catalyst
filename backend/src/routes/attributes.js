const express = require('express');
const { Attribute, AttributeValue, Store, AttributeSet } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Basic CRUD operations for attributes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, search, attribute_set_id, exclude_assigned, is_filterable } = req.query;
    const offset = (page - 1) * limit;

    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/attributes');

    const where = {};

    if (isPublicRequest) {
      // Public access - return all attributes for specific store (no is_active field in Attribute model)
      if (store_id) where.store_id = store_id;

      // Filter by is_filterable if provided
      if (is_filterable !== undefined) {
        where.is_filterable = is_filterable === 'true' || is_filterable === true;
      }
    } else {
      // Authenticated access
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);
        where.store_id = { [Op.in]: storeIds };
      }
      
      if (store_id) where.store_id = store_id;
    }

    // Add search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add attribute set filtering
    if (attribute_set_id) {
      // Find the attribute set and filter by its attribute_ids
      const attributeSet = await AttributeSet.findByPk(attribute_set_id);
      if (attributeSet && Array.isArray(attributeSet.attribute_ids) && attributeSet.attribute_ids.length > 0) {
        where.id = { [Op.in]: attributeSet.attribute_ids };
      } else {
        // If attribute set has no attributes, return empty result
        where.id = { [Op.in]: [] };
      }
    } else if (exclude_assigned === 'true') {
      // Get all assigned attribute IDs from all attribute sets in this store
      const attributeSets = await AttributeSet.findAll({
        where: { store_id: where.store_id || store_id },
        attributes: ['attribute_ids']
      });
      
      const assignedIds = [];
      attributeSets.forEach(set => {
        if (Array.isArray(set.attribute_ids)) {
          assignedIds.push(...set.attribute_ids);
        }
      });
      
      // Remove duplicates
      const uniqueAssignedIds = [...new Set(assignedIds)];
      
      if (uniqueAssignedIds.length > 0) {
        where.id = { [Op.notIn]: uniqueAssignedIds };
      }
      // If no attributes are assigned to any set, show all attributes (no additional filter)
    }

    const { count, rows } = await Attribute.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    // Fetch attribute values for select/multiselect attributes
    // For filterable attributes, always include all values (no limit)
    const attributesWithValues = await Promise.all(rows.map(async (attr) => {
      const attrData = attr.toJSON();
      if (attr.type === 'select' || attr.type === 'multiselect') {
        const values = await AttributeValue.findAll({
          where: { attribute_id: attr.id },
          order: [['sort_order', 'ASC'], ['code', 'ASC']],
          // No limit for filterable attributes - need all values for filters
          limit: (isPublicRequest && attr.is_filterable) ? undefined : 10
        });
        attrData.values = values;
      }
      return attrData;
    }));

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(attributesWithValues);
    } else {
      // Return wrapped response for authenticated requests
      res.json({ success: true, data: { attributes: attributesWithValues, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
    }
  } catch (error) {
    console.error('❌ Attributes API error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Fetch attribute values if this is a select/multiselect attribute
    let attributeValues = [];
    if (attribute.type === 'select' || attribute.type === 'multiselect') {
      attributeValues = await AttributeValue.findAll({
        where: { attribute_id: attribute.id },
        order: [['sort_order', 'ASC'], ['code', 'ASC']]
      });
    }

    // Add values to the response
    const attributeData = attribute.toJSON();
    attributeData.values = attributeValues;

    res.json({ success: true, data: attributeData });
  } catch (error) {
    console.error('❌ Get attribute error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const attribute = await Attribute.create(req.body);
    res.status(201).json({ success: true, message: 'Attribute created successfully', data: attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });
    
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await attribute.update(req.body);
    res.json({ success: true, message: 'Attribute updated successfully', data: attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await attribute.destroy();
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ATTRIBUTE VALUES ROUTES ==========

// Get all values for an attribute
router.get('/:attributeId/values', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attributeId, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) {
      return res.status(404).json({ success: false, error: 'Attribute not found' });
    }

    // Check access if authenticated request
    if (req.user && req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const values = await AttributeValue.findAll({
      where: { attribute_id: req.params.attributeId },
      order: [['sort_order', 'ASC'], ['code', 'ASC']]
    });

    res.json({ success: true, data: values });
  } catch (error) {
    console.error('❌ Get attribute values error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create attribute value
router.post('/:attributeId/values', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attributeId, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) {
      return res.status(404).json({ success: false, error: 'Attribute not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const { code, translations, metadata, sort_order } = req.body;

    const value = await AttributeValue.create({
      attribute_id: req.params.attributeId,
      code,
      translations: translations || {},
      metadata: metadata || {},
      sort_order: sort_order || 0
    });

    res.json({ success: true, data: value });
  } catch (error) {
    console.error('❌ Create attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attribute value
router.put('/:attributeId/values/:valueId', async (req, res) => {
  try {
    const value = await AttributeValue.findByPk(req.params.valueId, {
      include: [{
        model: Attribute,
        include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
      }]
    });

    if (!value) {
      return res.status(404).json({ success: false, error: 'Value not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, value.Attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    await value.update(req.body);
    res.json({ success: true, data: value });
  } catch (error) {
    console.error('❌ Update attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attribute value
router.delete('/:attributeId/values/:valueId', async (req, res) => {
  try {
    const value = await AttributeValue.findByPk(req.params.valueId, {
      include: [{
        model: Attribute,
        include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
      }]
    });

    if (!value) {
      return res.status(404).json({ success: false, error: 'Value not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, value.Attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    await value.destroy();
    res.json({ success: true, message: 'Value deleted' });
  } catch (error) {
    console.error('❌ Delete attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;