const express = require('express');
const { body, validationResult } = require('express-validator');
const { authorize } = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const StoreTemplate = require('../models/StoreTemplate');
const dummyImageService = require('../services/dummy-image-service');
const supabaseIntegration = require('../services/supabase-integration');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// @route   GET /api/template-editor/:storeId
// @desc    Get all templates for a store
// @access  Private
router.get('/:storeId', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const templates = await StoreTemplate.findByStore(storeId);
    
    // Check if Supabase is connected for image handling
    const supabaseStatus = await supabaseIntegration.getConnectionStatus(storeId);
    
    res.json({
      success: true,
      data: templates,
      store_info: {
        supabase_connected: supabaseStatus.connected,
        dummy_images_enabled: !supabaseStatus.connected
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

// @route   GET /api/template-editor/:storeId/:type
// @desc    Get specific template by type
// @access  Private
router.get('/:storeId/:type', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, type } = req.params;
    
    let template = await StoreTemplate.findActiveByType(storeId, type);
    
    // If no template exists, create a default one
    if (!template) {
      template = await this.createDefaultTemplate(storeId, type);
    }
    
    // Replace images with dummy images if Supabase not connected
    const supabaseStatus = await supabaseIntegration.getConnectionStatus(storeId);
    if (!supabaseStatus.connected) {
      template.dataValues.elements = await this.replacWithDummyImages(template.elements, storeId, type);
      template.dataValues.dummy_images_enabled = true;
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-editor/:storeId
// @desc    Create or update template
// @access  Private
router.post('/:storeId', authorize(['store_owner']), checkStoreOwnership, [
  body('type').isIn(['category', 'product', 'checkout', 'homepage', 'custom']).withMessage('Invalid template type'),
  body('name').notEmpty().withMessage('Template name is required'),
  body('elements').isArray().withMessage('Elements must be an array'),
  body('styles').isObject().withMessage('Styles must be an object'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const templateData = req.body;
    
    // Process images in elements
    templateData.elements = await this.processTemplateImages(templateData.elements, storeId);
    
    const template = await StoreTemplate.createOrUpdate(storeId, templateData);
    
    res.json({
      success: true,
      data: template,
      message: 'Template saved successfully'
    });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/template-editor/:storeId/:templateId
// @desc    Update specific template
// @access  Private
router.put('/:storeId/:templateId', authorize(['store_owner']), checkStoreOwnership, [
  body('name').optional().notEmpty().withMessage('Template name cannot be empty'),
  body('elements').optional().isArray().withMessage('Elements must be an array'),
  body('styles').optional().isObject().withMessage('Styles must be an object'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateId } = req.params;
    const updateData = req.body;
    
    const template = await StoreTemplate.findOne({
      where: {
        id: templateId,
        store_id: storeId
      }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Process images in elements if provided
    if (updateData.elements) {
      updateData.elements = await this.processTemplateImages(updateData.elements, storeId);
    }
    
    // Update template and increment version
    await template.update(updateData);
    await template.updateVersion();
    
    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-editor/:storeId/:templateId/duplicate
// @desc    Duplicate template
// @access  Private
router.post('/:storeId/:templateId/duplicate', authorize(['store_owner']), checkStoreOwnership, [
  body('name').notEmpty().withMessage('Template name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId, templateId } = req.params;
    const { name } = req.body;
    
    const originalTemplate = await StoreTemplate.findOne({
      where: {
        id: templateId,
        store_id: storeId
      }
    });
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const duplicatedTemplate = await StoreTemplate.duplicate(templateId, name);
    
    res.json({
      success: true,
      data: duplicatedTemplate,
      message: 'Template duplicated successfully'
    });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/template-editor/:storeId/:templateId
// @desc    Delete template
// @access  Private
router.delete('/:storeId/:templateId', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, templateId } = req.params;
    
    const template = await StoreTemplate.findOne({
      where: {
        id: templateId,
        store_id: storeId
      }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    await template.destroy();
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-editor/:storeId/:templateId/activate
// @desc    Activate template
// @access  Private
router.post('/:storeId/:templateId/activate', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, templateId } = req.params;
    
    const template = await StoreTemplate.findOne({
      where: {
        id: templateId,
        store_id: storeId
      }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Deactivate other templates of the same type
    await StoreTemplate.update(
      { is_active: false },
      {
        where: {
          store_id: storeId,
          type: template.type,
          id: { [require('sequelize').Op.ne]: templateId }
        }
      }
    );
    
    // Activate this template
    await template.activate();
    
    res.json({
      success: true,
      data: template,
      message: 'Template activated successfully'
    });
  } catch (error) {
    console.error('Activate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/template-editor/:storeId/stats
// @desc    Get template statistics
// @access  Private
router.get('/:storeId/stats', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const stats = await StoreTemplate.getTemplateStats(storeId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/template-editor/source-files/content
// @desc    Get source file content for file tree editor
// @access  Private
router.post('/source-files/content', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.body;
    
    console.log('📁 Source file request:', { filePath, user: req.user?.id });
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Security: Only allow files within the project directory
    const allowedPaths = [
      'src/pages/',
      'src/components/',
      'src/App.css',
      'src/index.css'
    ];
    
    const isAllowed = allowedPaths.some(allowedPath => filePath.startsWith(allowedPath));
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access to this file path is not allowed'
      });
    }
    
    // Construct the full file path relative to project root
    const projectRoot = path.resolve(__dirname, '../../../');
    const fullPath = path.join(projectRoot, filePath);
    
    // Check if file exists and is within project bounds (prevent directory traversal)
    if (!fullPath.startsWith(projectRoot)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    
    try {
      // Check if file exists
      await fs.promises.access(fullPath, fs.constants.F_OK);
      console.log('✅ File exists:', fullPath);
      
      // Read file content
      const content = await fs.promises.readFile(fullPath, 'utf8');
      console.log('✅ File content loaded, length:', content.length);
      
      res.json({
        success: true,
        content: content,
        path: filePath,
        fullPath: fullPath,
        message: 'File loaded successfully'
      });
    } catch (fileError) {
      console.error('❌ File error:', fileError);
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          path: filePath,
          fullPath: fullPath
        });
      }
      
      throw fileError;
    }
  } catch (error) {
    console.error('Get source file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading file',
      error: error.message
    });
  }
});

// Helper methods
router.createDefaultTemplate = async function(storeId, type) {
  const defaultTemplates = {
    homepage: {
      name: 'Default Homepage',
      elements: [
        {
          type: 'hero_banner',
          props: {
            title: 'Welcome to Your Store',
            subtitle: 'Discover amazing products',
            background_image: null,
            cta_text: 'Shop Now',
            cta_link: '/products'
          }
        },
        {
          type: 'featured_products',
          props: {
            title: 'Featured Products',
            product_count: 6,
            layout: 'grid'
          }
        }
      ],
      styles: {
        theme: 'modern',
        colors: {
          primary: '#3B82F6',
          secondary: '#EF4444'
        }
      }
    },
    product: {
      name: 'Default Product Page',
      elements: [
        {
          type: 'product_gallery',
          props: {
            layout: 'sidebar',
            thumbnail_position: 'left'
          }
        },
        {
          type: 'product_info',
          props: {
            show_reviews: true,
            show_related: true
          }
        }
      ],
      styles: {
        layout: 'two-column'
      }
    },
    category: {
      name: 'Default Category Page',
      elements: [
        {
          type: 'category_header',
          props: {
            show_description: true,
            show_image: true
          }
        },
        {
          type: 'product_grid',
          props: {
            columns: 3,
            pagination: true,
            filters_enabled: true
          }
        }
      ],
      styles: {
        grid_gap: '1rem'
      }
    }
  };

  const templateData = defaultTemplates[type] || {
    name: `Default ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    elements: [],
    styles: {}
  };

  return await StoreTemplate.createOrUpdate(storeId, {
    type,
    ...templateData
  });
};

router.replacWithDummyImages = async function(elements, storeId, type) {
  const processedElements = JSON.parse(JSON.stringify(elements));
  
  for (let element of processedElements) {
    if (element.props) {
      // Replace background images
      if (element.props.background_image) {
        element.props.background_image = dummyImageService.generateDummyImage(type, 1200, 600, storeId);
        element.props.is_dummy_image = true;
      }
      
      // Replace product images
      if (element.type === 'featured_products' && element.props.products) {
        element.props.products.forEach(product => {
          product.images = dummyImageService.generateProductImages(product.id || `product-${Math.random()}`);
        });
      }
    }
  }
  
  return processedElements;
};

router.processTemplateImages = async function(elements, storeId) {
  // This function would handle image processing and upload to Supabase if connected
  // For now, just return elements as-is
  return elements;
};

// @route   POST /api/template-editor/get-file-content
// @desc    Get file content for editor (development helper)
// @access  Public (for development/editor use)
router.post('/get-file-content', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    console.log('📁 File content request:', { filePath });
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Security: Only allow files within the project directory
    const allowedPaths = [
      'src/pages/',
      'src/components/',
      'src/App.css',
      'src/index.css'
    ];
    
    const isAllowed = allowedPaths.some(allowedPath => filePath.startsWith(allowedPath));
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access to this file path is not allowed'
      });
    }
    
    // Construct the full file path relative to project root
    const projectRoot = path.resolve(__dirname, '../../../');
    const fullPath = path.join(projectRoot, filePath);
    
    // Check if file exists and is within project bounds (prevent directory traversal)
    if (!fullPath.startsWith(projectRoot)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    
    try {
      // Check if file exists
      await fs.promises.access(fullPath, fs.constants.F_OK);
      console.log('✅ File exists:', fullPath);
      
      // Read file content
      const content = await fs.promises.readFile(fullPath, 'utf8');
      console.log('✅ File content loaded, length:', content.length);
      
      res.json({
        success: true,
        content: content,
        path: filePath,
        message: 'File loaded successfully'
      });
    } catch (fileError) {
      console.error('❌ File error:', fileError);
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          path: filePath
        });
      }
      
      throw fileError;
    }
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading file',
      error: error.message
    });
  }
});

module.exports = router;