const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize, storeOwnerOnly, customerOnly, adminOnly } = require('../middleware/auth');
const { masterSupabaseClient } = require('../database/masterConnection');

// adminOnly middleware is imported from auth.js above

/**
 * Get all service credit costs
 * GET /api/service-credit-costs
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, active_only, visible_only } = req.query;

    let query = masterSupabaseClient
      .from('service_credit_costs')
      .select('*')
      .order('service_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (category) {
      query = query.eq('service_category', category);
    }

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    if (visible_only === 'true') {
      query = query.eq('is_visible', true);
      if (active_only !== 'true') {
        query = query.eq('is_active', true);
      }
    }

    const { data: services, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      services: services.map(s => ({
        id: s.id,
        service_key: s.service_key,
        service_name: s.service_name,
        service_category: s.service_category,
        description: s.description,
        cost_per_unit: parseFloat(s.cost_per_unit),
        billing_type: s.billing_type,
        is_active: s.is_active,
        is_visible: s.is_visible,
        metadata: s.metadata,
        display_order: s.display_order,
        created_at: s.created_at,
        updated_at: s.updated_at
      })),
      total: services.length
    });
  } catch (error) {
    console.error('Error getting service credit costs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service credit costs',
      error: error.message
    });
  }
});

/**
 * Get services grouped by category
 * GET /api/service-credit-costs/by-category
 */
router.get('/by-category', authMiddleware, async (req, res) => {
  try {
    const { data: services, error } = await masterSupabaseClient
      .from('service_credit_costs')
      .select('*')
      .eq('is_active', true)
      .order('service_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by category
    const formatted = {};
    services.forEach(s => {
      const category = s.service_category;
      if (!formatted[category]) {
        formatted[category] = [];
      }
      formatted[category].push({
        id: s.id,
        service_key: s.service_key,
        service_name: s.service_name,
        description: s.description,
        cost_per_unit: parseFloat(s.cost_per_unit),
        billing_type: s.billing_type,
        metadata: s.metadata,
        display_order: s.display_order
      });
    });

    res.json({
      success: true,
      services_by_category: formatted
    });
  } catch (error) {
    console.error('Error getting services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services by category',
      error: error.message
    });
  }
});

/**
 * Get single service cost by key
 * GET /api/service-credit-costs/key/:serviceKey
 */
router.get('/key/:serviceKey', authMiddleware, async (req, res) => {
  try {
    const { serviceKey } = req.params;

    const { data: services, error } = await masterSupabaseClient
      .from('service_credit_costs')
      .select('*')
      .eq('service_key', serviceKey)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Service not found: ${serviceKey}`
      });
    }

    const service = services[0];

    res.json({
      success: true,
      service: {
        id: service.id,
        service_key: service.service_key,
        service_name: service.service_name,
        service_category: service.service_category,
        description: service.description,
        cost_per_unit: parseFloat(service.cost_per_unit),
        billing_type: service.billing_type,
        is_active: service.is_active,
        is_visible: service.is_visible,
        metadata: service.metadata,
        display_order: service.display_order,
        created_at: service.created_at,
        updated_at: service.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting service cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service cost',
      error: error.message
    });
  }
});

/**
 * Calculate cost for a service
 * POST /api/service-credit-costs/calculate
 */
router.post('/calculate',
  authMiddleware,
  body('service_key').notEmpty().withMessage('Service key is required'),
  body('units').optional().isFloat({ min: 0 }).withMessage('Units must be a positive number'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { service_key, units = 1 } = req.body;

      const { data: services, error } = await masterSupabaseClient
        .from('service_credit_costs')
        .select('*')
        .eq('service_key', service_key)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      if (!services || services.length === 0) {
        throw new Error(`Service cost not found for key: ${service_key}`);
      }

      const service = services[0];
      const cost = parseFloat(service.cost_per_unit) * units;

      res.json({
        success: true,
        service_key,
        units,
        cost: parseFloat(cost.toFixed(4)),
        service: {
          name: service.service_name,
          billing_type: service.billing_type,
          cost_per_unit: parseFloat(service.cost_per_unit)
        }
      });
    } catch (error) {
      console.error('Error calculating cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate cost',
        error: error.message
      });
    }
  }
);

/**
 * Create new service cost entry (admin only)
 * POST /api/service-credit-costs
 */
router.post('/',
  authMiddleware,
  adminOnly,
  body('service_key').notEmpty().withMessage('Service key is required'),
  body('service_name').notEmpty().withMessage('Service name is required'),
  body('service_category').isIn([
    'store_operations',
    'plugin_management',
    'ai_services',
    'data_migration',
    'storage',
    'akeneo_integration',
    'other'
  ]).withMessage('Invalid service category'),
  body('cost_per_unit').isFloat({ min: 0 }).withMessage('Cost per unit must be a positive number'),
  body('billing_type').isIn([
    'per_day',
    'per_use',
    'per_month',
    'per_hour',
    'per_item',
    'per_mb',
    'flat_rate'
  ]).withMessage('Invalid billing type'),
  body('is_active').optional().isBoolean(),
  body('is_visible').optional().isBoolean(),
  body('metadata').optional().isObject(),
  body('display_order').optional().isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const serviceData = {
        service_key: req.body.service_key,
        service_name: req.body.service_name,
        service_category: req.body.service_category,
        cost_per_unit: req.body.cost_per_unit,
        billing_type: req.body.billing_type,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        is_visible: req.body.is_visible !== undefined ? req.body.is_visible : true,
        metadata: req.body.metadata || {},
        display_order: req.body.display_order || 0,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      if (req.body.description) {
        serviceData.description = req.body.description;
      }

      const { data: service, error } = await masterSupabaseClient
        .from('service_credit_costs')
        .insert(serviceData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({
        success: true,
        message: 'Service cost created successfully',
        service: {
          id: service.id,
          service_key: service.service_key,
          service_name: service.service_name,
          cost_per_unit: parseFloat(service.cost_per_unit),
          billing_type: service.billing_type
        }
      });
    } catch (error) {
      console.error('Error creating service cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create service cost',
        error: error.message
      });
    }
  }
);

/**
 * Update service cost (admin only)
 * PUT /api/service-credit-costs/:id
 */
router.put('/:id',
  authMiddleware,
  adminOnly,
  body('cost_per_unit').optional().isFloat({ min: 0 }),
  body('service_name').optional().notEmpty(),
  body('description').optional(),
  body('is_active').optional().isBoolean(),
  body('is_visible').optional().isBoolean(),
  body('metadata').optional().isObject(),
  body('display_order').optional().isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;

      // Check if service exists
      const { data: existingServices, error: fetchError } = await masterSupabaseClient
        .from('service_credit_costs')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (!existingServices || existingServices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const updateData = { ...req.body };
      updateData.updated_by = req.user.id;

      const { data: service, error: updateError } = await masterSupabaseClient
        .from('service_credit_costs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: 'Service cost updated successfully',
        service: {
          id: service.id,
          service_key: service.service_key,
          service_name: service.service_name,
          cost_per_unit: parseFloat(service.cost_per_unit),
          billing_type: service.billing_type,
          is_active: service.is_active,
          is_visible: service.is_visible,
          metadata: service.metadata,
          display_order: service.display_order
        }
      });
    } catch (error) {
      console.error('Error updating service cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service cost',
        error: error.message
      });
    }
  }
);

/**
 * Toggle service active status (admin only)
 * PATCH /api/service-credit-costs/:serviceKey/toggle
 */
router.patch('/:serviceKey/toggle',
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { serviceKey } = req.params;

      // Get current service
      const { data: services, error: fetchError } = await masterSupabaseClient
        .from('service_credit_costs')
        .select('*')
        .eq('service_key', serviceKey)
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (!services || services.length === 0) {
        throw new Error(`Service not found: ${serviceKey}`);
      }

      const currentService = services[0];

      // Toggle active status
      const { data: service, error: updateError } = await masterSupabaseClient
        .from('service_credit_costs')
        .update({
          is_active: !currentService.is_active,
          updated_by: req.user.id
        })
        .eq('service_key', serviceKey)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: `Service ${service.is_active ? 'activated' : 'deactivated'} successfully`,
        service: {
          service_key: service.service_key,
          is_active: service.is_active
        }
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle service status',
        error: error.message
      });
    }
  }
);

/**
 * Delete service cost (admin only)
 * DELETE /api/service-credit-costs/:id
 */
router.delete('/:id',
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get service first to return its key
      const { data: services, error: fetchError } = await masterSupabaseClient
        .from('service_credit_costs')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (!services || services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const serviceKey = services[0].service_key;

      // Delete the service
      const { error: deleteError } = await masterSupabaseClient
        .from('service_credit_costs')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      res.json({
        success: true,
        message: 'Service cost deleted successfully',
        service_key: serviceKey
      });
    } catch (error) {
      console.error('Error deleting service cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete service cost',
        error: error.message
      });
    }
  }
);

module.exports = router;
