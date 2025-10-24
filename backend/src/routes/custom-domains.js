const express = require('express');
const router = express.Router();
const { authMiddleware, storeResolver } = require('../middleware/authMiddleware');
const { requireActiveSubscription } = require('../middleware/subscriptionEnforcement');
const CustomDomainService = require('../services/CustomDomainService');
const { CustomDomain } = require('../models');

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

module.exports = router;
