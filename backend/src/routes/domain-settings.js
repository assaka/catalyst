const express = require('express');
const router = express.Router();
const domainConfiguration = require('../services/domain-configuration');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');

/**
 * Get domain configuration for a store
 */
router.get('/:store_id/domain', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const configResult = await domainConfiguration.getDomainConfig(store_id);
    const statusResult = await domainConfiguration.checkDomainStatus(store_id);
    
    res.json({
      success: true,
      domain_config: configResult.domain_config || {},
      domain_status: statusResult.success ? statusResult : {},
      has_domain: statusResult.domain_configured || false
    });
    
  } catch (error) {
    console.error('Failed to get domain configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get domain configuration',
      error: error.message
    });
  }
});

/**
 * Add custom domain to store
 */
router.post('/:store_id/domain', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    const {
      domain,
      render_service_id, // Optional: for DNS CNAME generation only (not stored in stores table)
      auto_configure_render = true,
      ssl_enabled = true,
      redirect_www = true
    } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const result = await domainConfiguration.addDomain(store_id, domain, {
      render_service_id,
      auto_configure_render,
      ssl_enabled,
      redirect_www
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Generate setup instructions
    const setupInstructions = domainConfiguration.generateSetupInstructions(store_id, result.domain_config);

    res.json({
      success: true,
      domain: result.domain,
      domain_config: result.domain_config,
      setup_instructions: setupInstructions,
      message: result.message
    });
    
  } catch (error) {
    console.error('Failed to add domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add domain',
      error: error.message
    });
  }
});

/**
 * Update domain configuration
 */
router.put('/:store_id/domain', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    const domainConfig = req.body;
    
    const result = await domainConfiguration.saveDomainConfig(store_id, domainConfig);
    
    res.json(result);
    
  } catch (error) {
    console.error('Failed to update domain configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update domain configuration',
      error: error.message
    });
  }
});

/**
 * Remove domain from store
 */
router.delete('/:store_id/domain', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    const { domain } = req.body;
    
    const result = await domainConfiguration.removeDomain(store_id, domain);
    
    res.json(result);
    
  } catch (error) {
    console.error('Failed to remove domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove domain',
      error: error.message
    });
  }
});

/**
 * Check domain verification status
 */
router.get('/:store_id/domain/status', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const result = await domainConfiguration.checkDomainStatus(store_id);
    
    res.json(result);
    
  } catch (error) {
    console.error('Failed to check domain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check domain status',
      error: error.message
    });
  }
});

/**
 * Get DNS setup instructions
 */
router.get('/:store_id/domain/dns-instructions', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const configResult = await domainConfiguration.getDomainConfig(store_id);
    
    if (!configResult.success || !configResult.domain_config.primary_domain) {
      return res.status(404).json({
        success: false,
        message: 'No domain configured for this store'
      });
    }

    const setupInstructions = domainConfiguration.generateSetupInstructions(store_id, configResult.domain_config);

    res.json({
      success: true,
      setup_instructions: setupInstructions
    });
    
  } catch (error) {
    console.error('Failed to get DNS instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get DNS instructions',
      error: error.message
    });
  }
});

/**
 * Generate DNS instructions for any domain (preview)
 */
router.post('/dns-preview', authMiddleware, async (req, res) => {
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

    const dnsInstructions = {
      records: [
        {
          type: 'CNAME',
          name: domain.replace(/^www\./, ''),
          value: service_name ? `${service_name}.yourdomain.com` : 'your-service.yourdomain.com',
          ttl: 3600,
          priority: null
        }
      ],
      notes: [
        'Add a CNAME record pointing your domain to your hosting service',
        'DNS changes may take 15 minutes to 48 hours to propagate'
      ]
    };

    const setupInstructions = {
      domain: domain,
      setup_steps: [
        {
          step: 1,
          title: "Access Your Domain Registrar",
          description: "Log into the control panel where you purchased your domain",
          status: "pending"
        },
        {
          step: 2,
          title: "Find DNS Settings",
          description: "Navigate to DNS, Name Server, or Domain Management settings",
          status: "pending"
        },
        {
          step: 3,
          title: "Add CNAME Record",
          description: "Add the CNAME record shown below",
          status: "pending",
          dns_records: dnsInstructions.records
        },
        {
          step: 4,
          title: "Save and Wait",
          description: "Save changes and wait for DNS propagation (15 minutes to 48 hours)",
          status: "pending"
        }
      ],
      dns_instructions: dnsInstructions
    };

    res.json({
      success: true,
      setup_instructions: setupInstructions
    });
    
  } catch (error) {
    console.error('Failed to generate DNS preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate DNS preview',
      error: error.message
    });
  }
});

/**
 * Verify domain configuration
 */
router.post('/:store_id/domain/verify', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    // Check current status
    const statusResult = await domainConfiguration.checkDomainStatus(store_id);
    
    if (!statusResult.success) {
      return res.status(500).json(statusResult);
    }

    if (!statusResult.domain_configured) {
      return res.status(404).json({
        success: false,
        message: 'No domain configured for this store'
      });
    }

    // Update DNS status based on verification
    const dnsConfigured = statusResult.verification_status === 'verified';
    
    await domainConfiguration.updateDNSStatus(store_id, dnsConfigured, {
      last_verified: new Date().toISOString()
    });

    res.json({
      success: true,
      domain: statusResult.domain,
      verification_status: statusResult.verification_status,
      dns_configured: dnsConfigured,
      message: dnsConfigured ? 'Domain verified successfully!' : 'Domain verification pending. DNS may still be propagating.'
    });
    
  } catch (error) {
    console.error('Failed to verify domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify domain',
      error: error.message
    });
  }
});


module.exports = router;