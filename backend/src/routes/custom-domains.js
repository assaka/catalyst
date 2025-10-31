const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');
const { requireActiveSubscription } = require('../middleware/subscriptionEnforcement');
const CustomDomainService = require('../services/CustomDomainService');
const CloudflareDNSService = require('../services/cloudflare-dns-service');
const { CustomDomain, IntegrationConfig, Store } = require('../models');

/**
 * Custom Domain Management Routes
 *
 * Endpoints:
 * - POST   /add              - Add new custom domain
 * - GET    /                 - List all domains for store
 * - GET    /:id              - Get domain details
 * - POST   /:id/verify       - Verify domain ownership
 * - POST   /:id/check-dns    - Check DNS configuration
 * - POST   /:id/set-primary  - Set as primary domain
 * - DELETE /:id              - Remove domain
 * - POST   /:id/provision-ssl - Provision SSL certificate
 */

/**
 * Add a new custom domain
 */
router.post('/add', authMiddleware, storeResolver(), requireActiveSubscription, async (req, res) => {
  try {
    const { domain, subdomain, isPrimary, verificationMethod, sslProvider, dnsProvider } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const result = await CustomDomainService.addDomain(req.storeId, domain, {
      subdomain,
      isPrimary,
      verificationMethod: verificationMethod || 'txt',
      sslProvider: sslProvider || 'letsencrypt',
      dnsProvider: dnsProvider || 'manual'
    });

    res.json(result);
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add domain'
    });
  }
});

/**
 * List all domains for store
 */
router.get('/', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domains = await CustomDomain.findAll({
      where: { store_id: req.storeId },
      order: [['is_primary', 'DESC'], ['created_at', 'DESC']],
      attributes: {
        exclude: ['verification_token', 'ssl_certificate_id']
      }
    });

    res.json({
      success: true,
      domains: domains.map(d => ({
        ...d.toJSON(),
        required_dns_records: d.getRequiredDNSRecords()
      }))
    });
  } catch (error) {
    console.error('Error listing domains:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve domains'
    });
  }
});

/**
 * Get domain details
 */
router.get('/:id', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    res.json({
      success: true,
      domain: {
        ...domain.toJSON(),
        required_dns_records: domain.getRequiredDNSRecords(),
        verification_instructions: CustomDomainService._getVerificationInstructions(domain)
      }
    });
  } catch (error) {
    console.error('Error getting domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve domain'
    });
  }
});

/**
 * Verify domain ownership
 */
router.post('/:id/verify', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const result = await CustomDomainService.verifyDomain(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify domain'
    });
  }
});

/**
 * Check DNS configuration
 */
router.post('/:id/check-dns', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const result = await CustomDomainService.checkDNSConfiguration(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error checking DNS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check DNS configuration'
    });
  }
});

/**
 * Set domain as primary
 */
router.post('/:id/set-primary', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await CustomDomainService.setPrimaryDomain(req.params.id, req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error setting primary domain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set primary domain'
    });
  }
});

/**
 * Remove custom domain
 */
router.delete('/:id', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await CustomDomainService.removeDomain(req.params.id, req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error removing domain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove domain'
    });
  }
});

/**
 * Provision SSL certificate
 */
router.post('/:id/provision-ssl', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const result = await CustomDomainService.provisionSSLCertificate(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error provisioning SSL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to provision SSL certificate'
    });
  }
});

/**
 * Get domain verification instructions
 */
router.get('/:id/verification-instructions', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    res.json({
      success: true,
      instructions: CustomDomainService._getVerificationInstructions(domain),
      required_records: domain.getRequiredDNSRecords()
    });
  } catch (error) {
    console.error('Error getting instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification instructions'
    });
  }
});

/**
 * CLOUDFLARE INTEGRATION ENDPOINTS
 */

/**
 * Auto-provision domain via Cloudflare
 * Creates DNS records automatically using Cloudflare API
 */
router.post('/provision-cloudflare', authMiddleware, storeResolver(), requireActiveSubscription, async (req, res) => {
  try {
    const { zone_id, domain, subdomain, is_primary } = req.body;

    if (!zone_id || !domain) {
      return res.status(400).json({
        success: false,
        message: 'zone_id and domain are required'
      });
    }

    console.log(`🔧 Provisioning domain via Cloudflare for store ${req.storeId}...`);

    // 1. Get Cloudflare access token from integration config
    const integrationConfig = await IntegrationConfig.findOne({
      where: {
        store_id: req.storeId,
        integration_type: 'cloudflare',
        is_active: true
      }
    });

    if (!integrationConfig) {
      return res.status(404).json({
        success: false,
        message: 'Cloudflare integration not found. Please connect your Cloudflare account first.'
      });
    }

    const accessToken = integrationConfig.config_data?.access_token;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Cloudflare access token not found. Please reconnect your Cloudflare account.'
      });
    }

    // 2. Check if domain already exists
    const fullDomain = subdomain && subdomain !== '@' ? `${subdomain}.${domain}` : domain;
    const existingDomain = await CustomDomain.findOne({
      where: { domain: fullDomain }
    });

    if (existingDomain) {
      return res.status(409).json({
        success: false,
        message: 'Domain already exists'
      });
    }

    // 3. Create domain record in database
    const customDomain = await CustomDomain.create({
      store_id: req.storeId,
      domain: fullDomain,
      subdomain: subdomain || null,
      is_primary: is_primary || false,
      verification_method: 'txt',
      ssl_provider: 'cloudflare',
      dns_provider: 'cloudflare',
      dns_configured: false,
      verification_status: 'pending'
    });

    // Generate verification token
    customDomain.generateVerificationToken();
    await customDomain.save();

    // 4. Provision DNS records via Cloudflare API
    const dnsResult = await CloudflareDNSService.provisionStoreRecords(
      zone_id,
      accessToken,
      domain,
      subdomain || '@',
      customDomain.verification_token
    );

    if (dnsResult.success) {
      // 5. Update domain with DNS record info
      customDomain.dns_configured = true;
      customDomain.dns_records = dnsResult.records;
      customDomain.verification_status = 'verifying';
      await customDomain.save();

      // 6. Verify DNS propagation
      setTimeout(async () => {
        try {
          const propagationCheck = await CloudflareDNSService.checkStoreDNSPropagation(
            fullDomain,
            customDomain.verification_token
          );

          if (propagationCheck.all_propagated) {
            await customDomain.markAsVerified();
            console.log(`✅ Domain ${fullDomain} auto-verified`);
          }
        } catch (error) {
          console.error('Auto-verification failed:', error);
        }
      }, 5000); // Check after 5 seconds

      // 7. Update store with primary domain if applicable
      if (is_primary) {
        await Store.update(
          {
            custom_domain: fullDomain,
            primary_domain: fullDomain
          },
          { where: { id: req.storeId } }
        );
      }

      return res.json({
        success: true,
        domain: customDomain.toJSON(),
        dns_records: dnsResult.records,
        message: 'Domain provisioned successfully via Cloudflare! DNS records created automatically.'
      });
    } else {
      throw new Error('DNS provisioning failed');
    }
  } catch (error) {
    console.error('❌ Error provisioning domain via Cloudflare:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to provision domain via Cloudflare'
    });
  }
});

/**
 * Get Cloudflare connection status for store
 */
router.get('/cloudflare-status', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const integrationConfig = await IntegrationConfig.findOne({
      where: {
        store_id: req.storeId,
        integration_type: 'cloudflare',
        is_active: true
      }
    });

    if (!integrationConfig) {
      return res.json({
        success: true,
        connected: false,
        message: 'Cloudflare not connected'
      });
    }

    const expiresAt = integrationConfig.config_data?.expires_at;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    res.json({
      success: true,
      connected: !isExpired,
      zone_id: integrationConfig.config_data?.zone_id,
      expires_at: expiresAt,
      expired: isExpired,
      message: isExpired ? 'Cloudflare token expired. Please reconnect.' : 'Cloudflare connected'
    });
  } catch (error) {
    console.error('Error checking Cloudflare status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Cloudflare status'
    });
  }
});

/**
 * Sync DNS status from Cloudflare
 */
router.post('/:id/sync-dns', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const domain = await CustomDomain.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check DNS propagation status
    const propagationResult = await CloudflareDNSService.checkStoreDNSPropagation(
      domain.domain,
      domain.verification_token
    );

    // Update domain status if propagated
    if (propagationResult.all_propagated && domain.verification_status !== 'verified') {
      await domain.markAsVerified();
    }

    res.json({
      success: true,
      propagation: propagationResult,
      domain_status: domain.verification_status,
      message: propagationResult.all_propagated
        ? 'Domain verified successfully'
        : 'DNS records are still propagating'
    });
  } catch (error) {
    console.error('Error syncing DNS status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync DNS status'
    });
  }
});

module.exports = router;
