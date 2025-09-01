/**
 * Customization System API Routes
 * Handles layout changes, JavaScript modifications, and extensible customizations
 */

const express = require('express');
const router = express.Router();
const customizationService = require('../services/customization-service');
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');
const { sequelize } = require('../database/connection');
const fs = require('fs');
const path = require('path');

// Create or update a customization (with upsert support)
router.post('/', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      type,
      name,
      description,
      targetComponent,
      targetSelector,
      customizationData,
      priority = 10,
      dependencies = [],
      conflictsWith = [],
      useUpsert = false
    } = req.body;

    console.log(`🎨 ${useUpsert ? 'Upserting' : 'Creating'} customization: ${name} (${type})`);

    const result = await customizationService.createOrUpdateCustomization({
      storeId: req.storeId,
      type,
      name,
      description,
      targetComponent,
      targetSelector,
      customizationData,
      priority,
      dependencies,
      conflictsWith,
      createdBy: req.user?.id,
      useUpsert
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Customization created successfully',
        data: result.customization
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        conflicts: result.conflicts
      });
    }

  } catch (error) {
    console.error('❌ Error creating customization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all customizations for a store
router.get('/', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;
    const {
      category = null,
      active = 'true',
      include_templates = 'false'
    } = req.query;

    console.log(`🔍 Getting customizations for store: ${storeId}`);

    const result = await customizationService.getStoreCustomizations(storeId, {
      category,
      isActive: active === 'true' ? true : active === 'false' ? false : null,
      includeTemplates: include_templates === 'true'
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          customizations: result.customizations,
          total: result.customizations.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error getting customizations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply customizations for a specific component/page
router.post('/apply', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;
    const {
      targetComponent,
      context = {}
    } = req.body;

    console.log(`⚡ Applying customizations for component: ${targetComponent}`);

    const result = await customizationService.applyCustomizations(storeId, targetComponent, {
      ...context,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID
    });

    if (result.success || result.errors.length === 0) {
      res.json({
        success: true,
        message: 'Customizations applied successfully',
        data: {
          applied: result.applied,
          total: result.totalCustomizations,
          errors: result.errors
        }
      });
    } else {
      res.status(207).json({ // Multi-status for partial success
        success: false,
        message: 'Some customizations failed to apply',
        data: {
          applied: result.applied,
          errors: result.errors,
          total: result.totalCustomizations
        }
      });
    }

  } catch (error) {
    console.error('❌ Error applying customizations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a customization
router.put('/:customizationId', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { customizationId } = req.params;
    const updateData = req.body;

    console.log(`✏️ Updating customization: ${customizationId}`);

    // TODO: Implement updateCustomization in service
    res.json({
      success: true,
      message: 'Update functionality coming soon',
      customizationId
    });

  } catch (error) {
    console.error('❌ Error updating customization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a customization
router.delete('/:customizationId', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { customizationId } = req.params;

    console.log(`🗑️ Deleting customization: ${customizationId}`);

    // TODO: Implement deleteCustomization in service
    res.json({
      success: true,
      message: 'Delete functionality coming soon',
      customizationId
    });

  } catch (error) {
    console.error('❌ Error deleting customization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customization types and categories
router.get('/types', async (req, res) => {
  try {
    const { sequelize } = require('../database/connection');
    
    const types = await sequelize.query(`
      SELECT 
        name,
        description,
        category,
        schema_version,
        is_active
      FROM customization_types
      WHERE is_active = true
      ORDER BY category, name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        types,
        categories: [...new Set(types.map(t => t.category))]
      }
    });

  } catch (error) {
    console.error('❌ Error getting customization types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customization statistics
router.get('/stats', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;

    console.log(`📊 Getting customization stats for store: ${storeId}`);

    const result = await customizationService.getCustomizationStats(storeId);

    if (result.success) {
      res.json({
        success: true,
        data: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error getting customization stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customization templates (public marketplace)
router.get('/templates', async (req, res) => {
  try {
    const {
      category = null,
      search = null,
      limit = 20,
      offset = 0
    } = req.query;

    console.log('🛍️ Getting customization templates');

    const { sequelize } = require('../database/connection');
    
    let whereClause = 'is_public = true';
    const replacements = {};

    if (category) {
      whereClause += ' AND category = :category';
      replacements.category = category;
    }

    if (search) {
      whereClause += ' AND (name ILIKE :search OR description ILIKE :search)';
      replacements.search = `%${search}%`;
    }

    const templates = await sequelize.query(`
      SELECT 
        id, name, description, category, template_data,
        preview_image_url, documentation_url, author,
        version, install_count, rating, created_at
      FROM customization_templates
      WHERE ${whereClause}
      ORDER BY rating DESC, install_count DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: templates.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting customization templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Install a template
router.post('/templates/:templateId/install', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { templateId } = req.params;
    const { configuration = {} } = req.body;

    console.log(`📦 Installing template: ${templateId}`);

    // TODO: Implement template installation
    res.json({
      success: true,
      message: 'Template installation functionality coming soon',
      templateId,
      configuration
    });

  } catch (error) {
    console.error('❌ Error installing template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customizations for a specific component (for loading pages/components)
router.get('/component/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;
    // Default to store_id from query or use a default for development
    const storeId = req.storeId || req.query.store_id || 'default-store';
    const { 
      type = null, 
      includeInactive = false,
      applyDiffs = false 
    } = req.query;

    console.log(`🎯 Fetching customizations for component: ${componentName} (store: ${storeId})`);

    const result = await customizationService.getCustomizationsForComponent(storeId, componentName, {
      type,
      includeInactive: includeInactive === 'true'
    });

    if (result.success) {
      let responseData = {
        component: componentName,
        customizations: result.customizations,
        count: result.count,
        hasCustomizations: result.count > 0
      };

      // If applyDiffs is requested, apply semantic diffs to provided base code
      if (applyDiffs === 'true' && req.body.baseCode) {
        const filePath = req.body.filePath || `src/pages/${componentName}.jsx`;
        let modifiedCode = req.body.baseCode;
        
        for (const customization of result.customizations) {
          if (customization.type === 'file_modification' && customization.customization_data?.semanticDiffs) {
            modifiedCode = await customizationService.applySemanticDiffs(
              modifiedCode, 
              customization.customization_data.semanticDiffs, 
              filePath
            );
          }
        }
        
        responseData.modifiedCode = modifiedCode;
        responseData.diffsApplied = true;
      }

      res.json({
        success: true,
        data: responseData
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error fetching component customizations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database migration endpoint (admin only) - temporarily without auth for setup
router.post('/migrate', async (req, res) => {
  try {
    console.log('🚀 Running customization database migration...');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/create-customizations-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await sequelize.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    res.json({
      success: true,
      message: 'Customization database migration completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Database migration failed. Check server logs for details.'
    });
  }
});

module.exports = router;