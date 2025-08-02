const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AkeneoIntegration = require('../services/akeneo-integration');
const IntegrationConfig = require('../models/IntegrationConfig');
const auth = require('../middleware/auth');

// Debug route to test if integrations router is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Integrations router is working!',
    timestamp: new Date().toISOString()
  });
});

// Middleware to check if user is authenticated and has admin role
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Wrapper middleware to extract storeId and add it to req
const storeAuth = (req, res, next) => {
  // Extract store_id from multiple sources for integration routes
  const storeId = req.headers['x-store-id'] || 
                  req.body.store_id || 
                  req.query.store_id ||
                  req.params.store_id;
  
  if (storeId) {
    req.params.store_id = storeId;
  }
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: 'Store ID is required. Please provide store_id in headers (x-store-id), body, or query parameters.'
    });
  }
  
  checkStoreOwnership(req, res, (err) => {
    if (err) return next(err);
    
    // Add storeId to req for backward compatibility
    req.storeId = req.store?.id || storeId;
    
    if (!req.storeId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine store ID from request'
      });
    }
    
    next();
  });
};

// Helper function to load Akeneo configuration
const loadAkeneoConfig = async (storeId, reqBody = null) => {
  // If configuration is provided in request body, use it
  if (reqBody && reqBody.baseUrl) {
    return {
      baseUrl: reqBody.baseUrl,
      clientId: reqBody.clientId,
      clientSecret: reqBody.clientSecret,
      username: reqBody.username,
      password: reqBody.password
    };
  }

  // Try to load from database
  const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
  if (integrationConfig && integrationConfig.config_data) {
    return integrationConfig.config_data;
  }

  // Fallback to environment variables
  return {
    baseUrl: process.env.AKENEO_BASE_URL,
    clientId: process.env.AKENEO_CLIENT_ID,
    clientSecret: process.env.AKENEO_CLIENT_SECRET,
    username: process.env.AKENEO_USERNAME,
    password: process.env.AKENEO_PASSWORD
  };
};

// Helper function to handle import operations with proper status tracking
const handleImportOperation = async (storeId, req, res, importFunction) => {
  try {
    // Load configuration from database or environment
    const config = await loadAkeneoConfig(storeId, req.body);

    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Akeneo configuration is incomplete. Please save your configuration first.'
      });
    }

    const integration = new AkeneoIntegration(config);
    
    // Update sync status
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    if (integrationConfig) {
      await integrationConfig.updateSyncStatus('syncing');
    }

    try {
      const result = await importFunction(integration, storeId, req.body);
      
      // Update sync status based on result
      if (integrationConfig) {
        await integrationConfig.updateSyncStatus(result.success ? 'success' : 'error', result.error || null);
        
        // Track section-specific last import dates
        if (result.success && req.path.includes('/import-')) {
          const currentConfig = integrationConfig.config_data || {};
          const lastImportDates = currentConfig.lastImportDates || {};
          
          // Determine section from the endpoint
          let section = null;
          if (req.path.includes('/import-attributes')) section = 'attributes';
          else if (req.path.includes('/import-families')) section = 'families';
          else if (req.path.includes('/import-categories')) section = 'categories';
          else if (req.path.includes('/import-products')) section = 'products';
          
          if (section) {
            lastImportDates[section] = new Date().toISOString();
            integrationConfig.config_data = {
              ...currentConfig,
              lastImportDates
            };
            await integrationConfig.save();
          }
        }
      }

      res.json(result);
    } catch (importError) {
      // Update sync status on error
      if (integrationConfig) {
        await integrationConfig.updateSyncStatus('error', importError.message);
      }
      throw importError;
    }
  } catch (error) {
    console.error('Error in import operation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Test Akeneo connection
 * POST /api/integrations/akeneo/test-connection
 */
router.post('/akeneo/test-connection', 
  storeAuth,
  body('baseUrl').optional().isURL().withMessage('Valid base URL is required'),
  body('clientId').optional().notEmpty().withMessage('Client ID is required'),
  body('clientSecret').optional().notEmpty().withMessage('Client secret is required'),
  body('username').optional().notEmpty().withMessage('Username is required'),
  body('password').optional().notEmpty().withMessage('Password is required'),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const storeId = req.storeId;
    const config = await loadAkeneoConfig(storeId, req.body);

    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Akeneo configuration is incomplete. Please save your configuration first or provide all required fields.'
      });
    }

    const integration = new AkeneoIntegration(config);
    const result = await integration.testConnection();

    if (!result.success) {
      // Provide more specific error messages for authentication failures
      let errorMessage = result.message;
      
      if (result.message.includes('401') || result.message.includes('Unauthorized')) {
        errorMessage = 'Akeneo authentication failed. Please check your credentials (Client ID, Client Secret, Username, and Password).';
      } else if (result.message.includes('403') || result.message.includes('Forbidden')) {
        errorMessage = 'Akeneo access denied. Please check if your user has the required permissions.';
      } else if (result.message.includes('404') || result.message.includes('Not Found')) {
        errorMessage = 'Akeneo API endpoint not found. Please check your Base URL.';
      } else if (result.message.includes('ENOTFOUND') || result.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to Akeneo server. Please check your Base URL and network connection.';
      }
      
      return res.status(400).json({
        success: false,
        message: 'Akeneo connection test failed',
        error: errorMessage,
        details: result.message // Keep original error for debugging
      });
    }

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
router.post('/akeneo/import-categories', 
  storeAuth,
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const storeId = req.storeId;
  console.log('🔍 Import categories request body:', req.body);
  
  await handleImportOperation(storeId, req, res, async (integration, storeId, body) => {
    const { locale = 'en_US', dryRun = false, filters = {} } = body;
    console.log(`📦 Starting category import with dryRun: ${dryRun}, locale: ${locale}`);
    console.log(`🎯 Category filters:`, filters);
    return await integration.importCategories(storeId, { locale, dryRun, filters });
  });
});

/**
 * Get categories from Akeneo
 * GET /api/integrations/akeneo/categories
 */
router.get('/akeneo/categories', storeAuth, async (req, res) => {
  const storeId = req.storeId;
  
  try {
    console.log('📂 Getting categories from Akeneo for store:', storeId);
    
    // Get Akeneo configuration
    const integrationConfig = await IntegrationConfig.findOne({
      where: { 
        store_id: storeId, 
        integration_type: 'akeneo' 
      }
    });

    if (!integrationConfig) {
      return res.status(404).json({
        success: false,
        message: 'Akeneo integration not configured for this store'
      });
    }

    const config = integrationConfig.config_data;
    if (!config || !config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      console.error('❌ Incomplete configuration:', {
        hasBaseUrl: !!config?.baseUrl,
        hasClientId: !!config?.clientId,
        hasClientSecret: !!config?.clientSecret,
        hasUsername: !!config?.username,
        hasPassword: !!config?.password
      });
      return res.status(400).json({
        success: false,
        message: 'Incomplete Akeneo configuration'
      });
    }

    console.log('🔧 Using Akeneo config:', {
      baseUrl: config.baseUrl,
      clientId: config.clientId,
      username: config.username,
      hasSecret: !!config.clientSecret,
      hasPassword: !!config.password
    });

    // Create integration instance and get categories
    const integration = new AkeneoIntegration(config);
    const categories = await integration.client.getAllCategories();
    
    console.log(`📦 Found ${categories.length} categories from Akeneo`);
    
    if (categories.length > 0) {
      console.log('📊 Sample categories:', categories.slice(0, 3).map(cat => ({
        code: cat.code,
        parent: cat.parent,
        labels: cat.labels
      })));
    }
    
    res.json({
      success: true,
      categories: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('Error getting Akeneo categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories from Akeneo',
      error: error.message
    });
  }
});

/**
 * Import products from Akeneo
 * POST /api/integrations/akeneo/import-products
 */
router.post('/akeneo/import-products',
  storeAuth,
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  body('batchSize').optional().isInt({ min: 1, max: 200 }).withMessage('Batch size must be between 1 and 200'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const storeId = req.storeId;
  await handleImportOperation(storeId, req, res, async (integration, storeId, body) => {
    const { locale = 'en_US', dryRun = false, batchSize = 50 } = body;
    return await integration.importProducts(storeId, { locale, dryRun, batchSize });
  });
});

/**
 * Import attributes from Akeneo
 * POST /api/integrations/akeneo/import-attributes
 */
router.post('/akeneo/import-attributes', 
  storeAuth,
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const storeId = req.storeId;
  console.log('🔍 Import attributes request body:', req.body);
  
  await handleImportOperation(storeId, req, res, async (integration, storeId, body) => {
    const { dryRun = false } = body;
    console.log(`📦 Starting attribute import with dryRun: ${dryRun}`);
    return await integration.importAttributes(storeId, { dryRun });
  });
});

/**
 * Import families from Akeneo
 * POST /api/integrations/akeneo/import-families
 */
router.post('/akeneo/import-families', 
  storeAuth,
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const storeId = req.storeId;
  console.log('🔍 Import families request body:', req.body);
  
  await handleImportOperation(storeId, req, res, async (integration, storeId, body) => {
    const { dryRun = false } = body;
    console.log(`📦 Starting family import with dryRun: ${dryRun}`);
    return await integration.importFamilies(storeId, { dryRun });
  });
});

/**
 * Import both categories and products from Akeneo
 * POST /api/integrations/akeneo/import-all
 */
router.post('/akeneo/import-all',
  storeAuth,
  body('locale').optional().isString().withMessage('Locale must be a string'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const storeId = req.storeId;
  await handleImportOperation(storeId, req, res, async (integration, storeId, body) => {
    const { locale = 'en_US', dryRun = false } = body;
    return await integration.importAll(storeId, { locale, dryRun });
  });
});

/**
 * Get integration configuration status
 * GET /api/integrations/akeneo/config-status
 */
router.get('/akeneo/config-status', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    
    // Try to get config from database first
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    
    let config = {};
    let hasConfig = false;
    
    if (integrationConfig && integrationConfig.config_data) {
      // Config found in database
      const configData = integrationConfig.config_data;
      config = {
        baseUrl: configData.baseUrl || '',
        clientId: configData.clientId || '',
        username: configData.username || '',
        // Provide placeholder values for sensitive fields if they exist
        clientSecret: configData.clientSecret ? '••••••••' : '',
        password: configData.password ? '••••••••' : '',
        locale: configData.locale || 'en_US',
        lastSync: integrationConfig.last_sync_at,
        syncStatus: integrationConfig.sync_status,
        lastImportDates: configData.lastImportDates || {}
      };
      hasConfig = !!(configData.baseUrl && configData.clientId && configData.clientSecret && configData.username && configData.password);
    } else {
      // Fallback to environment variables for backward compatibility
      config = {
        baseUrl: process.env.AKENEO_BASE_URL || '',
        clientId: process.env.AKENEO_CLIENT_ID || '',
        username: process.env.AKENEO_USERNAME || '',
        // Provide placeholder values for sensitive fields if they exist
        clientSecret: process.env.AKENEO_CLIENT_SECRET ? '••••••••' : '',
        password: process.env.AKENEO_PASSWORD ? '••••••••' : '',
        locale: 'en_US',
        lastSync: null,
        syncStatus: 'idle',
        lastImportDates: {}
      };
      hasConfig = !!(process.env.AKENEO_BASE_URL && process.env.AKENEO_CLIENT_ID && process.env.AKENEO_CLIENT_SECRET && process.env.AKENEO_USERNAME && process.env.AKENEO_PASSWORD);
    }

    res.json({
      success: true,
      hasConfig,
      source: integrationConfig ? 'database' : 'environment',
      config
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
 * Get import statistics
 * GET /api/integrations/akeneo/stats
 */
router.get('/akeneo/stats', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    
    const Category = require('../models/Category');
    const Attribute = require('../models/Attribute');
    const AttributeSet = require('../models/AttributeSet');
    const Product = require('../models/Product');
    
    const [categoriesCount, attributesCount, familiesCount, productsCount] = await Promise.all([
      Category.count({ where: { store_id: storeId } }),
      Attribute.count({ where: { store_id: storeId } }),
      AttributeSet.count({ where: { store_id: storeId } }),
      Product.count({ where: { store_id: storeId } })
    ]);

    res.json({
      success: true,
      stats: {
        categories: categoriesCount,
        attributes: attributesCount,
        families: familiesCount,
        products: productsCount
      }
    });
  } catch (error) {
    console.error('Error getting import stats:', error);
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
router.get('/akeneo/locales', (req, res) => {
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
 * Get available channels from Akeneo
 * GET /api/integrations/akeneo/channels
 */
router.get('/akeneo/channels', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const config = await loadAkeneoConfig(storeId);

    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Akeneo configuration is incomplete. Please save your configuration first.'
      });
    }

    const integration = new AkeneoIntegration(config);
    const channels = await integration.client.getAllChannels();

    res.json({
      success: true,
      channels: channels.map(channel => ({
        code: channel.code,
        label: channel.labels ? Object.values(channel.labels)[0] || channel.code : channel.code
      }))
    });
  } catch (error) {
    console.error('Error getting Akeneo channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load channels',
      error: error.message
    });
  }
});

/**
 * Get schedule configurations
 * GET /api/integrations/akeneo/schedules
 */
router.get('/akeneo/schedules', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const AkeneoSchedule = require('../models/AkeneoSchedule');
    
    const schedules = await AkeneoSchedule.findAll({
      where: { store_id: storeId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Create or update schedule
 * POST /api/integrations/akeneo/schedules
 */
router.post('/akeneo/schedules', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const AkeneoSchedule = require('../models/AkeneoSchedule');
    
    const scheduleData = {
      ...req.body,
      store_id: storeId
    };

    if (req.body.id) {
      // Update existing schedule
      const schedule = await AkeneoSchedule.findByPk(req.body.id);
      if (!schedule || schedule.store_id !== storeId) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }
      
      await schedule.update(scheduleData);
      res.json({
        success: true,
        message: 'Schedule updated successfully',
        schedule
      });
    } else {
      // Create new schedule
      const schedule = await AkeneoSchedule.create(scheduleData);
      res.json({
        success: true,
        message: 'Schedule created successfully',
        schedule
      });
    }
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Delete schedule
 * DELETE /api/integrations/akeneo/schedules/:id
 */
router.delete('/akeneo/schedules/:id', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const AkeneoSchedule = require('../models/AkeneoSchedule');
    
    const schedule = await AkeneoSchedule.findByPk(req.params.id);
    if (!schedule || schedule.store_id !== storeId) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await schedule.destroy();
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Save Akeneo configuration
 * POST /api/integrations/akeneo/save-config
 */
router.post('/akeneo/save-config',
  storeAuth,
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('clientSecret').notEmpty().withMessage('Client secret is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { baseUrl, clientId, clientSecret, username, password } = req.body;
    const storeId = req.storeId;

    // Test the connection first
    const integration = new AkeneoIntegration({
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    });

    const testResult = await integration.testConnection();
    
    if (!testResult.success) {
      // Provide more specific error messages for authentication failures
      let errorMessage = testResult.message;
      
      if (testResult.message.includes('401') || testResult.message.includes('Unauthorized')) {
        errorMessage = 'Akeneo authentication failed. Please check your credentials (Client ID, Client Secret, Username, and Password).';
      } else if (testResult.message.includes('403') || testResult.message.includes('Forbidden')) {
        errorMessage = 'Akeneo access denied. Please check if your user has the required permissions.';
      } else if (testResult.message.includes('404') || testResult.message.includes('Not Found')) {
        errorMessage = 'Akeneo API endpoint not found. Please check your Base URL.';
      } else if (testResult.message.includes('ENOTFOUND') || testResult.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to Akeneo server. Please check your Base URL and network connection.';
      }
      
      return res.status(400).json({
        success: false,
        message: 'Akeneo connection test failed - configuration not saved',
        error: errorMessage,
        details: testResult.message // Keep original error for debugging
      });
    }

    // Save configuration to database (will be encrypted automatically)
    const configData = {
      baseUrl,
      clientId,
      clientSecret,
      username,
      password
    };

    await IntegrationConfig.createOrUpdate(storeId, 'akeneo', configData);

    res.json({
      success: true,
      message: 'Akeneo configuration saved successfully and connection verified!',
      note: 'Configuration has been securely stored in the database with sensitive data encrypted.'
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