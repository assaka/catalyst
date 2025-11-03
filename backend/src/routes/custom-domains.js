const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');
const { requireActiveSubscription } = require('../middleware/subscriptionEnforcement');
const CustomDomainService = require('../services/CustomDomainService');
const creditService = require('../services/credit-service');
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

    // Check credit balance (need at least 0.5 credits for 1 day)
    const userId = req.user.id;
    const balance = await creditService.getBalance(userId);

    if (balance < 0.5) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits. Custom domains cost 0.5 credits per day. Please purchase credits to continue.',
        current_balance: balance,
        required_balance: 0.5
      });
    }

    const result = await CustomDomainService.addDomain(req.storeId, domain, {
      subdomain,
      isPrimary,
      verificationMethod: verificationMethod || 'txt',
      sslProvider: sslProvider || 'letsencrypt',
      dnsProvider: dnsProvider || 'manual'
    });

    res.json({
      ...result,
      credit_info: {
        current_balance: balance,
        daily_cost: 0.5,
        message: '0.5 credits will be deducted daily while domain is active'
      }
    });
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
 * DEBUG: Check actual DNS records for a domain
 * Returns what's actually configured in DNS vs what we expect
 */
router.get('/:id/debug-dns', authMiddleware, storeResolver(), async (req, res) => {
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

    const dns = require('dns').promises;
    const debugInfo = {
      domain: domain.domain,
      expected_records: domain.getRequiredDNSRecords(),
      actual_records: {},
      verification_token: domain.verification_token
    };

    // Check CNAME record
    try {
      const cnames = await dns.resolveCname(domain.domain);
      debugInfo.actual_records.cname = {
        found: true,
        values: cnames,
        matches_expected: cnames.some(c => c.toLowerCase().includes('vercel'))
      };
    } catch (error) {
      debugInfo.actual_records.cname = {
        found: false,
        error: error.code,
        message: error.code === 'ENODATA' ? 'No CNAME record found' : error.message
      };
    }

    // Check TXT record
    const txtRecordName = `_catalyst-verification.${domain.domain}`;
    try {
      const txts = await dns.resolveTxt(txtRecordName);
      const flatTxts = txts.flat();
      debugInfo.actual_records.txt = {
        found: true,
        record_name: txtRecordName,
        values: flatTxts,
        matches_expected: flatTxts.some(t => t.includes(domain.verification_token))
      };
    } catch (error) {
      debugInfo.actual_records.txt = {
        found: false,
        record_name: txtRecordName,
        error: error.code,
        message: error.code === 'ENODATA' ? 'No TXT record found' : error.message
      };
    }

    // Check A records (for debugging)
    try {
      const aRecords = await dns.resolve4(domain.domain);
      debugInfo.actual_records.a = {
        found: true,
        values: aRecords
      };
    } catch (error) {
      debugInfo.actual_records.a = {
        found: false,
        error: error.code
      };
    }

    // Overall status
    debugInfo.can_verify = debugInfo.actual_records.txt?.matches_expected || false;
    debugInfo.dns_propagated = debugInfo.actual_records.cname?.found || debugInfo.actual_records.a?.found || false;

    res.json({
      success: true,
      debug: debugInfo,
      recommendations: getRecommendations(debugInfo)
    });
  } catch (error) {
    console.error('Error debugging DNS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debug DNS',
      error: error.message
    });
  }
});

function getRecommendations(debugInfo) {
  const recommendations = [];

  if (!debugInfo.actual_records.cname?.found) {
    recommendations.push({
      type: 'error',
      message: 'CNAME record not found. Add: CNAME www → cname.vercel-dns.com'
    });
  }

  if (!debugInfo.actual_records.txt?.found) {
    recommendations.push({
      type: 'error',
      message: `TXT record not found. Add: TXT _catalyst-verification → ${debugInfo.verification_token}`
    });
  }

  if (debugInfo.actual_records.txt?.found && !debugInfo.actual_records.txt?.matches_expected) {
    recommendations.push({
      type: 'error',
      message: 'TXT record found but value is incorrect. Check verification token.'
    });
  }

  if (debugInfo.actual_records.cname?.found && !debugInfo.actual_records.cname?.matches_expected) {
    recommendations.push({
      type: 'warning',
      message: `CNAME points to ${debugInfo.actual_records.cname.values[0]} instead of cname.vercel-dns.com`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'All DNS records configured correctly! Click Verify to activate.'
    });
  }

  return recommendations;
}

module.exports = router;
