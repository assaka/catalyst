const express = require('express');
const { body, validationResult } = require('express-validator');
const { PdfTemplate, Store } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/pdf-templates
 * Get all PDF templates for a store
 */
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const templates = await PdfTemplate.findAll({
      where: { store_id },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get PDF templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/pdf-templates/:id
 * Get single PDF template
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PdfTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/pdf-templates/:id
 * Update PDF template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { html_template, settings, is_active } = req.body;

    const template = await PdfTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Build update object
    const updateData = {};
    if (html_template !== undefined) updateData.html_template = html_template;
    if (settings !== undefined) updateData.settings = settings;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update template
    await template.update(updateData);

    res.json({
      success: true,
      message: 'PDF template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /api/pdf-templates/:id/restore-default
 * Restore system PDF template to default
 */
router.post('/:id/restore-default', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PdfTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Only system templates can be restored
    if (!template.is_system) {
      return res.status(400).json({
        success: false,
        message: 'Only system templates can be restored to default'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Restore to default template
    await template.update({
      html_template: template.default_html_template
    });

    res.json({
      success: true,
      message: 'PDF template restored to default successfully',
      data: template
    });
  } catch (error) {
    console.error('Restore PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
