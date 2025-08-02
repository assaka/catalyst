const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AkeneoIntegration = require('../services/akeneo-integration');

// Middleware to check if user is authenticated and has admin role
const requireAuth = require('../middleware/auth');
const storeAuth = require('../middleware/storeAuth');

/**
 * Test Akeneo connection
 * POST /api/integrations/akeneo/test-connection
 */
router.post('/akeneo/test-connection', requireAuth, [
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { baseUrl, clientId, clientSecret, username, password } = req.body;

    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const result = await integration.testConnection();

    res.json(result);
  } catch (error) {
    console.error('Error testing Akeneo connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Import categories from Akeneo
 * POST /api/integrations/akeneo/import-categories
 */
router.post('/akeneo/import-categories', requireAuth, storeAuth, [
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      baseUrl, 
      clientId, 
      clientSecret, 
      username, 
      password,
      locale = 'en_US',
      dryRun = false
    } = req.body;

    const storeId = req.storeId;

    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const result = await integration.importCategories(storeId, { locale, dryRun });

    res.json(result);
  } catch (error) {
    console.error('Error importing categories from Akeneo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Import products from Akeneo
 * POST /api/integrations/akeneo/import-products
 */
router.post('/akeneo/import-products', requireAuth, storeAuth, [
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  body('batchSize').optional().isInt({ min: 1, max: 200 }).withMessage('Batch size must be between 1 and 200')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      baseUrl, 
      clientId, 
      clientSecret, 
      username, 
      password,
      locale = 'en_US',
      dryRun = false,
      batchSize = 50
    } = req.body;

    const storeId = req.storeId;

    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const result = await integration.importProducts(storeId, { locale, dryRun, batchSize });

    res.json(result);
  } catch (error) {
    console.error('Error importing products from Akeneo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Import both categories and products from Akeneo
 * POST /api/integrations/akeneo/import-all
 */
router.post('/akeneo/import-all', requireAuth, storeAuth, [
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      baseUrl, 
      clientId, 
      clientSecret, 
      username, 
      password,
      locale = 'en_US',
      dryRun = false
    } = req.body;

    const storeId = req.storeId;

    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const result = await integration.importAll(storeId, { locale, dryRun });

    res.json(result);
  } catch (error) {
    console.error('Error importing data from Akeneo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get integration configuration status
 * GET /api/integrations/akeneo/config-status
 */
router.get('/akeneo/config-status', requireAuth, (req, res) => {
  try {
    const config = {
      baseUrl: process.env.AKENEO_BASE_URL || null,
      clientId: process.env.AKENEO_CLIENT_ID || null,
      username: process.env.AKENEO_USERNAME || null,
      // Don't expose sensitive data
      hasClientSecret: !!(process.env.AKENEO_CLIENT_SECRET),
      hasPassword: !!(process.env.AKENEO_PASSWORD)
    };

    const hasConfig = config.baseUrl && config.clientId && config.hasClientSecret && config.username && config.hasPassword;

    res.json({
      success: true,
      hasConfig,
      config: {
        ...config,
        // Remove sensitive flags for security
        hasClientSecret: undefined,
        hasPassword: undefined
      }
    });
  } catch (error) {
    console.error('Error getting Akeneo config status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get available locales (mock data - could be enhanced to fetch from Akeneo)
 * GET /api/integrations/akeneo/locales
 */
router.get('/akeneo/locales', requireAuth, (req, res) => {
  try {
    const commonLocales = [
      { code: 'en_US', name: 'English (US)' },
      { code: 'en_GB', name: 'English (UK)' },
      { code: 'fr_FR', name: 'French (France)' },
      { code: 'de_DE', name: 'German (Germany)' },
      { code: 'es_ES', name: 'Spanish (Spain)' },
      { code: 'it_IT', name: 'Italian (Italy)' },
      { code: 'pt_BR', name: 'Portuguese (Brazil)' },
      { code: 'nl_NL', name: 'Dutch (Netherlands)' },
      { code: 'zh_CN', name: 'Chinese (Simplified)' },
      { code: 'ja_JP', name: 'Japanese' }
    ];

    res.json({
      success: true,
      locales: commonLocales
    });
  } catch (error) {
    console.error('Error getting Akeneo locales:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Save Akeneo configuration (environment variables)
 * POST /api/integrations/akeneo/save-config
 */
router.post('/akeneo/save-config', requireAuth, [
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Note: In a production environment, you would want to save these to a secure 
    // configuration management system or encrypted database rather than setting 
    // environment variables directly
    const { baseUrl, clientId, clientSecret, username, password } = req.body;

    // For now, we'll just test the connection and return success
    // In a real implementation, you would save these securely
    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const testResult = await integration.testConnection();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Configuration test failed',
        error: testResult.message
      });
    }

    res.json({
      success: true,
      message: 'Configuration validated successfully. Please set environment variables manually for production use.',
      note: 'For security reasons, configuration is not persisted automatically. Please set the following environment variables: AKENEO_BASE_URL, AKENEO_CLIENT_ID, AKENEO_CLIENT_SECRET, AKENEO_USERNAME, AKENEO_PASSWORD'
    });
  } catch (error) {
    console.error('Error saving Akeneo configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;