const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');
const { requireActiveSubscription } = require('../middleware/subscriptionEnforcement');
const ConnectionManager = require('../services/database/ConnectionManager');
const CustomDomainService = require('../services/CustomDomainService');
const creditService = require('../services/credit-service');

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
 * - POST   /:id/check-ssl    - Check SSL status
 * - GET    /:id/debug-dns    - Debug DNS configuration
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
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domains, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('store_id', req.storeId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      // Check if error is table not found
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.status(200).json({
          success: true,
          domains: [],
          message: 'Custom domains table not yet created. Please contact support or run database migrations.'
        });
      }
      throw error;
    }

    // Add required_dns_records to each domain
    const domainsWithDNS = (domains || []).map(d => ({
      ...d,
      required_dns_records: getRequiredDNSRecords(d)
    }));

    res.json({
      success: true,
      domains: domainsWithDNS
    });
  } catch (error) {
    console.error('Error listing domains:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      storeId: req.storeId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve domains',
      error: error.message
    });
  }
});

/**
 * Get domain details
 */
router.get('/:id', authMiddleware, storeResolver(), async (req, res) => {
  try {
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    res.json({
      success: true,
      domain: {
        ...domain,
        required_dns_records: getRequiredDNSRecords(domain),
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
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const result = await CustomDomainService.verifyDomain(req.params.id, req.storeId);
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
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const result = await CustomDomainService.checkDNSConfiguration(req.params.id, req.storeId);
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
 * Check and update SSL status (uses OpenSSL or Vercel API)
 */
router.post('/:id/check-ssl', authMiddleware, storeResolver(), async (req, res) => {
  try {
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    let sslStatus = null;
    let sslIssuer = null;
    let checkMethod = 'openssl';

    console.log(`[SSL Check] Starting SSL check for domain: ${domain.domain}`);

    // Try Vercel API first (if configured)
    const vercelService = require('../services/vercel-domain-service');
    const vercelConfigured = vercelService.isConfigured();
    console.log(`[SSL Check] Vercel API configured: ${vercelConfigured}`);

    if (vercelConfigured) {
      try {
        console.log('[SSL Check] Attempting Vercel API check...');
        const vercelResult = await vercelService.checkSSLStatus(domain.domain);
        console.log('[SSL Check] Vercel API result:', vercelResult);
        if (vercelResult.success && vercelResult.ssl_status === 'active') {
          // Only trust Vercel if it says "active"
          sslStatus = vercelResult.ssl_status;
          checkMethod = 'vercel-api';
          console.log(`[SSL Check] Vercel API succeeded, status: ${sslStatus}`);
        } else {
          console.log('[SSL Check] Vercel API says pending/error, will verify with OpenSSL');
        }
      } catch (err) {
        console.warn('[SSL Check] Vercel API check failed, falling back to OpenSSL:', err.message);
      }
    }

    // Use Node.js TLS check if Vercel didn't confirm "active" status
    // This catches cases where Vercel API is slow to update but SSL is actually working
    console.log(`[SSL Check] sslStatus before TLS check: ${sslStatus}`);
    if (!sslStatus || sslStatus !== 'active') {
      try {
        const tls = require('tls');
        const { URL } = require('url');

        console.log(`[SSL Check] Checking SSL for ${domain.domain} using Node.js TLS...`);

        // Create TLS connection to check certificate
        const checkSSL = () => new Promise((resolve, reject) => {
          const socket = tls.connect(443, domain.domain, {
            servername: domain.domain,
            rejectUnauthorized: true, // Verify certificate
            timeout: 10000
          });

          socket.on('secureConnect', () => {
            const cert = socket.getPeerCertificate();
            const authorized = socket.authorized;

            console.log('[SSL Check] TLS connection established');
            console.log('[SSL Check] Certificate authorized:', authorized);

            if (cert && cert.issuer) {
              const issuer = `${cert.issuer.O || ''} ${cert.issuer.CN || ''}`.trim();
              console.log('[SSL Check] Certificate issuer:', issuer);
              sslIssuer = issuer;
            }

            socket.destroy();

            if (authorized) {
              resolve('active');
            } else {
              resolve('error');
            }
          });

          socket.on('error', (err) => {
            console.log('[SSL Check] TLS error:', err.message);
            socket.destroy();

            // If connection refused or timeout, SSL might be provisioning
            if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
              resolve('pending');
            } else if (err.message.includes('certificate')) {
              resolve('error');
            } else {
              resolve('pending');
            }
          });

          socket.on('timeout', () => {
            console.log('[SSL Check] TLS connection timeout');
            socket.destroy();
            resolve('pending');
          });
        });

        sslStatus = await checkSSL();
        console.log(`[SSL Check] SSL status determined: ${sslStatus}`);
        checkMethod = 'nodejs-tls';
      } catch (err) {
        console.error('[SSL Check] TLS check failed:', err.message);
        console.error('[SSL Check] Error details:', err);
        sslStatus = 'pending';
      }
    }

    // Update domain SSL status in tenant DB
    const { data: updatedDomain, error: updateError } = await tenantDb
      .from('custom_domains')
      .update({
        ssl_status: sslStatus,
        ssl_issued_at: sslStatus === 'active' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Also update SSL status in master DB custom_domains_lookup
    const { masterDbClient } = require('../database/masterConnection');
    if (masterDbClient) {
      try {
        const { error: masterUpdateError } = await masterDbClient
          .from('custom_domains_lookup')
          .update({
            ssl_status: sslStatus,
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain.domain);

        if (masterUpdateError) {
          console.error('[SSL Check] Failed to update master DB ssl_status:', masterUpdateError.message);
        } else {
          console.log(`[SSL Check] Updated master DB ssl_status to '${sslStatus}' for domain: ${domain.domain}`);
        }
      } catch (masterErr) {
        console.error('[SSL Check] Error updating master DB:', masterErr.message);
      }
    }

    const message = sslStatus === 'active'
      ? `SSL certificate is active${sslIssuer ? ` (${sslIssuer})` : ''}`
      : sslStatus === 'pending'
      ? 'SSL certificate is being provisioned. This can take 5-30 minutes.'
      : 'SSL certificate verification failed';

    return res.json({
      success: true,
      ssl_status: sslStatus,
      message: message,
      check_method: checkMethod,
      domain: updatedDomain
    });
  } catch (error) {
    console.error('Error checking SSL status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check SSL status'
    });
  }
});

/**
 * Get domain verification instructions
 */
router.get('/:id/verification-instructions', authMiddleware, storeResolver(), async (req, res) => {
  try {
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    res.json({
      success: true,
      instructions: CustomDomainService._getVerificationInstructions(domain),
      required_records: getRequiredDNSRecords(domain)
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
    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);

    const { data: domain, error } = await tenantDb
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('store_id', req.storeId)
      .single();

    if (error || !domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const dns = require('dns').promises;
    const debugInfo = {
      domain: domain.domain,
      expected_records: getRequiredDNSRecords(domain),
      actual_records: {},
      verification_token: domain.verification_token
    };

    // Check A records
    const vercelIPs = ['76.76.21.21', '76.76.21.22', '76.76.21.93', '76.76.21.142'];
    try {
      const aRecords = await dns.resolve4(domain.domain);
      const pointsToVercel = aRecords.some(ip => vercelIPs.includes(ip));
      debugInfo.actual_records.a = {
        found: true,
        values: aRecords,
        matches_expected: pointsToVercel,
        vercel_ips: vercelIPs,
        note: pointsToVercel ? 'Points to Vercel ✓' : 'Does not point to Vercel'
      };
    } catch (error) {
      debugInfo.actual_records.a = {
        found: false,
        error: error.code,
        message: error.code === 'ENODATA' ? 'No A record found' : error.message
      };
    }

    // Check CNAME record
    try {
      const cnames = await dns.resolveCname(domain.domain);
      const pointsToVercel = cnames.some(c => c.toLowerCase().includes('vercel'));
      debugInfo.actual_records.cname = {
        found: true,
        values: cnames,
        matches_expected: pointsToVercel,
        note: pointsToVercel ? 'Points to Vercel ✓' : 'Does not point to Vercel'
      };
    } catch (error) {
      debugInfo.actual_records.cname = {
        found: false,
        error: error.code,
        message: error.code === 'ENODATA' ? 'No CNAME record found (use A records instead)' : error.message
      };
    }

    // Check TXT record - try multiple possible names
    const txtRecordNames = [
      `_catalyst-verification.${domain.domain}`,
      `_catalyst-verification.www.${domain.domain}`.replace('www.www.', 'www.'),
      domain.domain.replace('www.', '_catalyst-verification.www.')
    ];

    let txtFound = false;
    for (const txtRecordName of txtRecordNames) {
      try {
        const txts = await dns.resolveTxt(txtRecordName);
        const flatTxts = txts.flat();
        const matches = flatTxts.some(t => t.includes(domain.verification_token));

        if (matches || flatTxts.length > 0) {
          debugInfo.actual_records.txt = {
            found: true,
            record_name: txtRecordName,
            values: flatTxts,
            matches_expected: matches,
            note: matches ? 'Verification token matches ✓' : 'Token does not match'
          };
          txtFound = true;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    if (!txtFound) {
      debugInfo.actual_records.txt = {
        found: false,
        tried_names: txtRecordNames,
        error: 'ENODATA',
        message: 'No TXT record found. Tried multiple name formats.'
      };
    }

    // Overall status
    const hasValidPointer = (debugInfo.actual_records.a?.matches_expected || debugInfo.actual_records.cname?.matches_expected);
    debugInfo.can_verify = debugInfo.actual_records.txt?.matches_expected && hasValidPointer;
    debugInfo.dns_propagated = hasValidPointer;

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

// Helper function to get required DNS records
function getRequiredDNSRecords(domain) {
  const records = [];

  // A records pointing to Vercel
  records.push({
    type: 'A',
    name: '@',
    value: '76.76.21.21',
    ttl: 3600
  });
  records.push({
    type: 'A',
    name: '@',
    value: '76.76.21.22',
    ttl: 3600
  });

  // TXT record for verification
  records.push({
    type: 'TXT',
    name: '_catalyst-verification',
    value: domain.verification_token,
    ttl: 3600
  });

  return records;
}

// Helper function to get recommendations
function getRecommendations(debugInfo) {
  const recommendations = [];

  // Check if domain points to Vercel (A or CNAME)
  const hasA = debugInfo.actual_records.a?.found;
  const hasCNAME = debugInfo.actual_records.cname?.found;
  const aPointsToVercel = debugInfo.actual_records.a?.matches_expected;
  const cnamePointsToVercel = debugInfo.actual_records.cname?.matches_expected;

  if (!hasA && !hasCNAME) {
    recommendations.push({
      type: 'error',
      message: 'No A or CNAME record found. Add A records: 76.76.21.21 and 76.76.21.22 (recommended for TransIP)'
    });
  } else if (hasCNAME && !cnamePointsToVercel) {
    recommendations.push({
      type: 'error',
      message: `CNAME points to ${debugInfo.actual_records.cname.values[0]} (wrong target). Delete CNAME and use A records instead: 76.76.21.21 and 76.76.21.22`
    });
  } else if (hasA && !aPointsToVercel) {
    recommendations.push({
      type: 'error',
      message: `A record points to ${debugInfo.actual_records.a.values.join(', ')} (wrong IPs). Change to Vercel IPs: 76.76.21.21 and 76.76.21.22`
    });
  } else if (aPointsToVercel || cnamePointsToVercel) {
    recommendations.push({
      type: 'success',
      message: `✓ Domain correctly points to Vercel via ${aPointsToVercel ? 'A record' : 'CNAME'}`
    });
  }

  // Check TXT record
  if (!debugInfo.actual_records.txt?.found) {
    recommendations.push({
      type: 'error',
      message: `TXT record not found. Add: Type=TXT, Name=_catalyst-verification.www, Value=${debugInfo.verification_token}`
    });
  } else if (debugInfo.actual_records.txt?.found && !debugInfo.actual_records.txt?.matches_expected) {
    recommendations.push({
      type: 'error',
      message: `TXT record found but token doesn't match. Expected: ${debugInfo.verification_token}`
    });
  } else if (debugInfo.actual_records.txt?.matches_expected) {
    recommendations.push({
      type: 'success',
      message: '✓ TXT verification record is correct'
    });
  }

  // Overall verdict
  if (debugInfo.can_verify) {
    recommendations.push({
      type: 'success',
      message: '✓✓ All DNS records configured correctly! Click Verify button to activate.'
    });
  }

  return recommendations;
}

module.exports = router;
