const express = require('express');
const router = express.Router();
const renderIntegration = require('../services/render-integration');
const StoreDataMigration = require('../services/store-data-migration');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

const storeDataMigration = new StoreDataMigration();

/**
 * Store Personal Access Token
 */
router.post('/store-token', authMiddleware, async (req, res) => {
  try {
    const { store_id, token, user_email } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Personal Access Token is required'
      });
    }

    // Manual store ownership check with better error handling
    const { Store } = require('../models');
    const store = await Store.findByPk(store_id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user has access to this store
    const userEmail = req.user.email;
    const hasAccess = store.owner_email === userEmail || 
                     req.user.role === 'admin' || 
                     req.user.account_type === 'agency';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to configure this store'
      });
    }

    // Store and validate the token
    const result = await renderIntegration.storePersonalAccessToken(store_id, token.trim(), req.user.email);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        user_info: result.userInfo
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Failed to store Render token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store Personal Access Token',
      error: error.message
    });
  }
});

/**
 * Validate Personal Access Token (without storing it)
 */
router.post('/validate-token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Personal Access Token is required'
      });
    }

    // Test the token
    const testResult = await renderIntegration.testToken(token.trim());
    
    if (testResult.success) {
      res.json({
        success: true,
        message: 'Token is valid',
        user_info: testResult.userInfo
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid token: ${testResult.error}`
      });
    }
  } catch (error) {
    console.error('Token validation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed',
      error: error.message
    });
  }
});

/**
 * Get OAuth status for a store
 */
router.get('/status/:store_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const status = await renderIntegration.getConnectionStatus(store_id);
    const testResult = await renderIntegration.testConnection(store_id);
    
    res.json({
      success: true,
      ...status,
      services_count: testResult.servicesCount || 0,
      last_tested: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get Render OAuth status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OAuth status',
      error: error.message
    });
  }
});

/**
 * Disconnect OAuth - revoke access
 */
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const result = await renderIntegration.revokeAccess(store_id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Render connection successfully disconnected'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect Render',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Render OAuth disconnect failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect OAuth',
      error: error.message
    });
  }
});

/**
 * Test OAuth connection and get user services
 */
router.post('/test-connection', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const testResult = await renderIntegration.testConnection(store_id);
    
    res.json(testResult);
    
  } catch (error) {
    console.error('Render OAuth connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

/**
 * Deploy application to Render
 */
router.post('/deploy', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, deployment_config } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!deployment_config?.repo) {
      return res.status(400).json({
        success: false,
        message: 'Repository URL is required'
      });
    }

    // Deploy to Render
    const deployResult = await renderIntegration.deployApplication(store_id, deployment_config);
    
    if (!deployResult.success) {
      return res.status(500).json(deployResult);
    }

    res.json({
      success: true,
      deployment: {
        service_id: deployResult.service.id,
        name: deployResult.service.name,
        url: deployResult.service.serviceDetails?.url,
        status: deployResult.service.serviceDetails?.buildDetails?.status || 'pending'
      },
      message: 'Application deployment initiated successfully'
    });
    
  } catch (error) {
    console.error('Render deployment failed:', error);
    res.status(500).json({
      success: false,
      message: 'Deployment failed',
      error: error.message
    });
  }
});

/**
 * Get deployment status
 */
router.get('/deployment/:store_id/:service_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, service_id } = req.params;
    
    const statusResult = await renderIntegration.getDeploymentStatus(store_id, service_id);
    
    if (!statusResult.success) {
      return res.status(500).json(statusResult);
    }

    const service = statusResult.service;
    
    res.json({
      success: true,
      deployment: {
        service_id: service.id,
        name: service.name,
        url: service.serviceDetails?.url,
        status: service.serviceDetails?.buildDetails?.status || 'unknown',
        last_deploy: service.serviceDetails?.buildDetails?.finishedAt,
        repo: service.repo,
        branch: service.branch
      }
    });
    
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment status',
      error: error.message
    });
  }
});

/**
 * Create Supabase database for store
 */
router.post('/create-database', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, supabase_credentials } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!supabase_credentials?.project_url || !supabase_credentials?.service_role_key) {
      return res.status(400).json({
        success: false,
        message: 'Supabase credentials (project_url and service_role_key) are required'
      });
    }

    // Run database migration
    const migrationResult = await storeDataMigration.createStoreDatabase(store_id, supabase_credentials);
    
    if (!migrationResult.success) {
      return res.status(500).json(migrationResult);
    }

    res.json({
      success: true,
      message: 'Database created and migrated successfully',
      database_status: 'ready'
    });
    
  } catch (error) {
    console.error('Database creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database creation failed',
      error: error.message
    });
  }
});

/**
 * Check database migration status
 */
router.get('/database-status/:store_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    const { project_url, service_role_key } = req.query;
    
    if (!project_url || !service_role_key) {
      return res.status(400).json({
        success: false,
        message: 'Supabase credentials are required'
      });
    }

    const status = await storeDataMigration.checkMigrationStatus(
      { project_url, service_role_key },
      store_id
    );
    
    res.json({
      success: true,
      ...status
    });
    
  } catch (error) {
    console.error('Failed to check database status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check database status',
      error: error.message
    });
  }
});

/**
 * Get Render integration configuration
 */
router.get('/config/:store_id?', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.params;
    const status = await renderIntegration.getStatus(store_id);
    
    let configErrors = [];
    if (store_id) {
      configErrors = await renderIntegration.validateStoreConfig(store_id);
    }
    
    res.json({
      success: true,
      config: status,
      errors: configErrors,
      ready: configErrors.length === 0,
      instructions: {
        step1: 'Go to https://dashboard.render.com/account/api-keys',
        step2: 'Create a new Personal Access Token with appropriate scopes',
        step3: 'Copy the token and paste it in the form below',
        step4: 'Click "Connect" to validate and store the token'
      }
    });
  } catch (error) {
    console.error('Failed to get Render config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration',
      error: error.message
    });
  }
});

/**
 * Get user services
 */
router.get('/services/:store_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const credentials = await renderIntegration.getStoredCredentials(store_id);
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'No Render connection found'
      });
    }

    const services = await renderIntegration.getUserServices(credentials.access_token);

    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        url: service.serviceDetails?.url,
        status: service.serviceDetails?.buildDetails?.status,
        repo: service.repo,
        branch: service.branch,
        created_at: service.createdAt,
        updated_at: service.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('Failed to get services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services',
      error: error.message
    });
  }
});

/**
 * Add custom domain to Render service
 */
router.post('/domains/add', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, service_id, domain } = req.body;
    
    if (!store_id || !service_id || !domain) {
      return res.status(400).json({
        success: false,
        message: 'Store ID, Service ID, and Domain are required'
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain format'
      });
    }

    const result = await renderIntegration.addCustomDomain(store_id, service_id, domain);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    // Generate DNS instructions
    const dnsInstructions = renderIntegration.generateDNSInstructions(domain, result.domain.dnsRecords);

    res.json({
      success: true,
      domain: result.domain,
      dns_instructions: dnsInstructions,
      message: 'Custom domain added successfully'
    });
    
  } catch (error) {
    console.error('Failed to add custom domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add custom domain',
      error: error.message
    });
  }
});

/**
 * Get custom domains for a service
 */
router.get('/domains/:store_id/:service_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, service_id } = req.params;
    
    const result = await renderIntegration.getCustomDomains(store_id, service_id);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      domains: result.domains.map(domain => ({
        id: domain.id,
        name: domain.name,
        verification_status: domain.verificationStatus,
        created_at: domain.createdAt,
        dns_instructions: renderIntegration.generateDNSInstructions(domain.name, domain.dnsRecords)
      }))
    });
    
  } catch (error) {
    console.error('Failed to get custom domains:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom domains',
      error: error.message
    });
  }
});

/**
 * Remove custom domain from Render service
 */
router.delete('/domains/:store_id/:service_id/:domain_id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, service_id, domain_id } = req.params;
    
    const result = await renderIntegration.removeCustomDomain(store_id, service_id, domain_id);
    
    res.json(result);
    
  } catch (error) {
    console.error('Failed to remove custom domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom domain',
      error: error.message
    });
  }
});

/**
 * Get domain verification status and DNS instructions
 */
router.get('/domains/:store_id/:service_id/:domain_id/status', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, service_id, domain_id } = req.params;
    
    const result = await renderIntegration.getDomainVerificationStatus(store_id, service_id, domain_id);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const dnsInstructions = renderIntegration.generateDNSInstructions(result.domain.name, result.domain.dns_records);

    res.json({
      success: true,
      domain: result.domain,
      dns_instructions: dnsInstructions
    });
    
  } catch (error) {
    console.error('Failed to get domain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get domain verification status',
      error: error.message
    });
  }
});

/**
 * Generate DNS instructions for a domain (without adding to Render)
 */
router.post('/domains/dns-instructions', authMiddleware, async (req, res) => {
  try {
    const { domain, service_name } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain format'
      });
    }

    const dnsInstructions = renderIntegration.generateDNSInstructions(domain);

    // If service name is provided, update the CNAME value
    if (service_name) {
      dnsInstructions.records = dnsInstructions.records.map(record => {
        if (record.type === 'CNAME') {
          return {
            ...record,
            value: `${service_name}.onrender.com`
          };
        }
        return record;
      });
    }

    res.json({
      success: true,
      dns_instructions: dnsInstructions
    });
    
  } catch (error) {
    console.error('Failed to generate DNS instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate DNS instructions',
      error: error.message
    });
  }
});

module.exports = router;