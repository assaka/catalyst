const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const TemplateCustomization = require('../models/TemplateCustomization');

const router = express.Router();

// @route   GET /api/template-customizations/:storeId/:templateName
// @desc    Get customizations for a specific template
// @access  Private
router.get('/:storeId/:templateName', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, templateName } = req.params;
    const { component_path } = req.query;
    
    let customizations;
    
    if (component_path) {
      // Get specific component customization
      customizations = await TemplateCustomization.findByStoreAndTemplate(storeId, templateName, component_path);
    } else {
      // Get all customizations for this template
      customizations = await TemplateCustomization.getTemplateCustomizations(storeId, templateName);
    }
    
    res.json({
      success: true,
      data: customizations,
      template_name: templateName,
      component_path: component_path || 'all'
    });
  } catch (error) {
    console.error('Get template customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-customizations/:storeId/:templateName
// @desc    Create or update template customization
// @access  Private
router.post('/:storeId/:templateName', authMiddleware, checkStoreOwnership, [
  body('component_path').notEmpty().withMessage('Component path is required'),
  body('customizations').isObject().withMessage('Customizations must be an object'),
  body('customizations.styles').optional().isObject().withMessage('Styles must be an object'),
  body('customizations.content').optional().isObject().withMessage('Content must be an object'),
  body('customizations.behavior').optional().isObject().withMessage('Behavior must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateName } = req.params;
    const { component_path, customizations } = req.body;
    const userId = req.user.id;
    
    const customization = await TemplateCustomization.createOrUpdateCustomization(
      storeId,
      templateName,
      component_path,
      customizations,
      userId
    );
    
    res.json({
      success: true,
      data: customization,
      message: 'Template customization saved successfully'
    });
  } catch (error) {
    console.error('Save template customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/template-customizations/:storeId/:templateName/styles
// @desc    Update only styles for a template
// @access  Private
router.put('/:storeId/:templateName/styles', authMiddleware, checkStoreOwnership, [
  body('component_path').notEmpty().withMessage('Component path is required'),
  body('styles').isObject().withMessage('Styles must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateName } = req.params;
    const { component_path, styles } = req.body;
    
    const customization = await TemplateCustomization.findByStoreAndTemplate(storeId, templateName, component_path);
    
    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Template customization not found'
      });
    }
    
    await customization.updateStyles(styles);
    
    res.json({
      success: true,
      data: customization,
      message: 'Template styles updated successfully'
    });
  } catch (error) {
    console.error('Update template styles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/template-customizations/:storeId/:templateName/content
// @desc    Update only content for a template
// @access  Private
router.put('/:storeId/:templateName/content', authMiddleware, checkStoreOwnership, [
  body('component_path').notEmpty().withMessage('Component path is required'),
  body('content').isObject().withMessage('Content must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateName } = req.params;
    const { component_path, content } = req.body;
    
    const customization = await TemplateCustomization.findByStoreAndTemplate(storeId, templateName, component_path);
    
    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Template customization not found'
      });
    }
    
    await customization.updateContent(content);
    
    res.json({
      success: true,
      data: customization,
      message: 'Template content updated successfully'
    });
  } catch (error) {
    console.error('Update template content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/template-customizations/:storeId/:templateName/behavior
// @desc    Update only behavior settings for a template
// @access  Private
router.put('/:storeId/:templateName/behavior', authMiddleware, checkStoreOwnership, [
  body('component_path').notEmpty().withMessage('Component path is required'),
  body('behavior').isObject().withMessage('Behavior must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateName } = req.params;
    const { component_path, behavior } = req.body;
    
    const customization = await TemplateCustomization.findByStoreAndTemplate(storeId, templateName, component_path);
    
    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Template customization not found'
      });
    }
    
    await customization.updateBehavior(behavior);
    
    res.json({
      success: true,
      data: customization,
      message: 'Template behavior updated successfully'
    });
  } catch (error) {
    console.error('Update template behavior error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/template-customizations/:storeId/:templateName/preview
// @desc    Get preview data for template with applied customizations
// @access  Private
router.get('/:storeId/:templateName/preview', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, templateName } = req.params;
    
    const customizations = await TemplateCustomization.getTemplateCustomizations(storeId, templateName);
    
    // Generate preview structure based on template type
    let previewData = {
      template: templateName,
      applied_customizations: customizations,
      preview_structure: {}
    };
    
    // Add template-specific preview data
    switch (templateName) {
      case 'ProductDetail':
        previewData.preview_structure = {
          layout: customizations.find(c => c.component_path === 'pages/ProductDetail')?.customizations?.styles?.layout || {},
          features: customizations.find(c => c.component_path === 'pages/ProductDetail')?.customizations?.behavior?.features_enabled || {},
          content_blocks: customizations.find(c => c.component_path === 'pages/ProductDetail')?.customizations?.content?.blocks || [],
          theme_colors: customizations.find(c => c.component_path === 'pages/ProductDetail')?.customizations?.styles?.theme_colors || {}
        };
        break;
      default:
        previewData.preview_structure = {
          general: 'Preview data for ' + templateName
        };
    }
    
    res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    console.error('Get template preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/template-customizations/:storeId/:templateName
// @desc    Delete template customization
// @access  Private
router.delete('/:storeId/:templateName', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, templateName } = req.params;
    const { component_path } = req.query;
    
    if (!component_path) {
      return res.status(400).json({
        success: false,
        message: 'Component path is required'
      });
    }
    
    await TemplateCustomization.deactivateCustomization(storeId, templateName, component_path);
    
    res.json({
      success: true,
      message: 'Template customization deleted successfully'
    });
  } catch (error) {
    console.error('Delete template customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-customizations/:storeId/:templateName/duplicate
// @desc    Duplicate template customization
// @access  Private
router.post('/:storeId/:templateName/duplicate', authMiddleware, checkStoreOwnership, [
  body('component_path').notEmpty().withMessage('Component path is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateName } = req.params;
    const { component_path } = req.body;
    
    const originalCustomization = await TemplateCustomization.findByStoreAndTemplate(storeId, templateName, component_path);
    
    if (!originalCustomization) {
      return res.status(404).json({
        success: false,
        message: 'Template customization not found'
      });
    }
    
    const duplicatedCustomization = await originalCustomization.duplicate();
    
    res.json({
      success: true,
      data: duplicatedCustomization,
      message: 'Template customization duplicated successfully'
    });
  } catch (error) {
    console.error('Duplicate template customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/template-customizations/:storeId/templates
// @desc    Get all available templates for a store
// @access  Private
router.get('/:storeId/templates', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Get all unique template names for this store
    const templates = await TemplateCustomization.findAll({
      where: {
        store_id: storeId,
        is_active: true
      },
      attributes: ['template_name', 'component_path'],
      group: ['template_name', 'component_path'],
      raw: true
    });
    
    // Group by template name
    const groupedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.template_name]) {
        acc[template.template_name] = [];
      }
      acc[template.template_name].push(template.component_path);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        templates: groupedTemplates,
        available_templates: [
          {
            name: 'ProductDetail',
            display_name: 'Product Detail Page',
            components: ['pages/ProductDetail'],
            description: 'Customize product page layout, content and behavior'
          },
          {
            name: 'Cart',
            display_name: 'Shopping Cart',
            components: ['pages/Cart'],
            description: 'Customize cart page appearance and functionality'
          },
          {
            name: 'Checkout',
            display_name: 'Checkout Process',
            components: ['pages/Checkout'],
            description: 'Customize checkout flow and payment forms'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;