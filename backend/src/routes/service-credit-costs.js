const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize, storeOwnerOnly, customerOnly, adminOnly } = require('../middleware/auth');
const ServiceCreditCost = require('../models/ServiceCreditCost');

// adminOnly middleware is imported from auth.js above

/**
 * Get all service credit costs
 * GET /api/service-credit-costs
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, active_only, visible_only } = req.query;

    let services;

    if (category) {
      services = await ServiceCreditCost.getByCategory(category, active_only === 'true');
    } else if (visible_only === 'true') {
      services = await ServiceCreditCost.getVisibleServices();
    } else {
      services = await ServiceCreditCost.findAll({
        order: [
          ['service_category', 'ASC'],
          ['display_order', 'ASC']
        ]
      });

      if (active_only === 'true') {
        services = services.filter(s => s.is_active);
      }
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
        created_at: s.createdAt,
        updated_at: s.updatedAt
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
    const grouped = await ServiceCreditCost.getActiveServicesByCategory();

    const formatted = {};
    for (const [category, services] of Object.entries(grouped)) {
      formatted[category] = services.map(s => ({
        id: s.id,
        service_key: s.service_key,
        service_name: s.service_name,
        description: s.description,
        cost_per_unit: parseFloat(s.cost_per_unit),
        billing_type: s.billing_type,
        metadata: s.metadata,
        display_order: s.display_order
      }));
    }

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

    const service = await ServiceCreditCost.findOne({
      where: { service_key: serviceKey }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service not found: ${serviceKey}`
      });
    }

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
        created_at: service.createdAt,
        updated_at: service.updatedAt
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

      const result = await ServiceCreditCost.calculateCost(service_key, units);

      res.json({
        success: true,
        service_key,
        units,
        cost: result.cost,
        service: {
          name: result.service.service_name,
          billing_type: result.service.billing_type,
          cost_per_unit: parseFloat(result.service.cost_per_unit)
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

      const service = await ServiceCreditCost.createService(
        req.body,
        req.user.id
      );

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
      const service = await ServiceCreditCost.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const updateData = { ...req.body };
      updateData.updated_by = req.user.id;

      await service.update(updateData);

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

      const service = await ServiceCreditCost.toggleActive(serviceKey, req.user.id);

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
      const service = await ServiceCreditCost.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const serviceKey = service.service_key;
      await service.destroy();

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
