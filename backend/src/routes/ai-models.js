// backend/src/routes/ai-models.js
const express = require('express');
const router = express.Router();
const AIModel = require('../models/AIModel');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /api/ai-models
 * Get active AI models for dropdown selection
 * Returns provider defaults by default, or all models with ?all=true
 */
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';

    let models;
    if (showAll) {
      models = await AIModel.getActiveModels();
    } else {
      models = await AIModel.getProviderDefaults();
    }

    // Format for frontend
    const formatted = models.map(AIModel.formatForFrontend);

    res.json({
      success: true,
      models: formatted
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI models'
    });
  }
});

/**
 * GET /api/ai-models/provider/:provider
 * Get all models for a specific provider
 */
router.get('/provider/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const models = await AIModel.getByProvider(provider);

    res.json({
      success: true,
      models: models.map(AIModel.formatForFrontend)
    });
  } catch (error) {
    console.error(`Error fetching models for provider ${req.params.provider}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch models for provider'
    });
  }
});

/**
 * GET /api/ai-models/:modelId
 * Get a specific model by ID
 */
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await AIModel.getByModelId(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }

    res.json({
      success: true,
      model: AIModel.formatForFrontend(model)
    });
  } catch (error) {
    console.error(`Error fetching model ${req.params.modelId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model'
    });
  }
});

/**
 * GET /api/ai-models/admin/all
 * Get all models including inactive (admin only)
 */
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin role check
    const models = await AIModel.getAllModels();

    res.json({
      success: true,
      models: models.map(AIModel.formatForFrontend)
    });
  } catch (error) {
    console.error('Error fetching all AI models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI models'
    });
  }
});

/**
 * PATCH /api/ai-models/:modelId/status
 * Update model active status (admin only)
 */
router.patch('/:modelId/status', authMiddleware, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { isActive } = req.body;

    // TODO: Add admin role check

    const updated = await AIModel.updateStatus(modelId, isActive);

    res.json({
      success: true,
      model: AIModel.formatForFrontend(updated)
    });
  } catch (error) {
    console.error(`Error updating model ${req.params.modelId} status:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update model status'
    });
  }
});

/**
 * PATCH /api/ai-models/:modelId/default
 * Set model as provider default (admin only)
 */
router.patch('/:modelId/default', authMiddleware, async (req, res) => {
  try {
    const { modelId } = req.params;

    // Get model to find its provider
    const model = await AIModel.getByModelId(modelId);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }

    // TODO: Add admin role check

    const updated = await AIModel.setProviderDefault(modelId, model.provider);

    res.json({
      success: true,
      model: AIModel.formatForFrontend(updated)
    });
  } catch (error) {
    console.error(`Error setting default for ${req.params.modelId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to set provider default'
    });
  }
});

module.exports = router;
