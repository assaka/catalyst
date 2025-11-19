const dns = require('dns').promises;
const ConnectionManager = require('./database/ConnectionManager');

/**
 * Custom Domain Management Service
 *
 * Handles:
 * - Domain verification via DNS records
 * - SSL certificate provisioning (Let's Encrypt)
 * - DNS configuration validation
 * - Domain routing and resolution
 */
class CustomDomainService {
  /**
   * Add a new custom domain to a store
   */
  static async addDomain(storeId, domainName, options = {}) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain } = connection.models;

      // Validate domain format
      if (!this._isValidDomain(domainName)) {
        throw new Error('Invalid domain format');
      }

      // Check if domain already exists (search across all tenant databases would be complex,
      // so we rely on unique constraint at database level)

      // Create domain record
      const domain = await CustomDomain.create({
        store_id: storeId,
        domain: domainName.toLowerCase(),
        subdomain: options.subdomain || null,
        verification_method: options.verificationMethod || 'txt',
        is_primary: options.isPrimary || false,
        ssl_provider: 'vercel',
        dns_provider: options.dnsProvider || 'manual'
      });

      // Generate verification token
      domain.generateVerificationToken();
      await domain.save();

      // Automatically add domain to Vercel via API (for SSL provisioning)
      const vercelService = require('./vercel-domain-service');
      if (vercelService.isConfigured()) {
        try {
          const vercelResult = await vercelService.addDomain(domainName);
          if (vercelResult.success) {
            domain.metadata = {
              ...domain.metadata,
              vercel_added: true,
              vercel_added_at: new Date().toISOString()
            };
            await domain.save();
          }
        } catch (vercelError) {
          // Silent fail - domain can be added to Vercel manually
        }
      }

      return {
        success: true,
        domain: domain.toJSON(),
        verification_instructions: this._getVerificationInstructions(domain)
      };
    } catch (error) {
      console.error('Error adding domain:', error);
      throw error;
    }
  }

  /**
   * Verify domain ownership via DNS
   */
  static async verifyDomain(domainId, storeId) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain, Store } = connection.models;

      const domain = await CustomDomain.findByPk(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      if (domain.verification_status === 'verified') {
        return { success: true, message: 'Domain already verified' };
      }

      // Update status to verifying
      domain.verification_status = 'verifying';
      await domain.save();

      // Verify based on method
      let verified = false;
      let verificationDetails = {};

      switch (domain.verification_method) {
        case 'txt':
          // For TXT verification, also check if domain is pointing to us (CNAME or A)
          const txtVerified = await this._verifyTXTRecord(domain);
          if (txtVerified) {
            // Also verify domain is pointing to our platform (CNAME or A record)
            const pointsToUs = await this._verifyDomainPointsToUs(domain);
            verified = pointsToUs;
            verificationDetails = { txt_verified: true, points_to_platform: pointsToUs };
          } else {
            verificationDetails = { txt_verified: false };
          }
          break;
        case 'cname':
          verified = await this._verifyCNAMERecord(domain);
          break;
        case 'http':
          verified = await this._verifyHTTPFile(domain);
          break;
      }

      if (verified) {
        await domain.markAsVerified();

        // Update store
        await Store.update(
          {
            custom_domain: domain.domain,
            domain_verified: true,
            ...(domain.is_primary && { primary_domain: domain.domain })
          },
          { where: { id: domain.store_id } }
        );

        // Check SSL status from Vercel
        const vercelService = require('./vercel-domain-service');
        if (vercelService.isConfigured()) {
          setTimeout(async () => {
            try {
              const sslStatus = await vercelService.checkSSLStatus(domain.domain);
              if (sslStatus.success && sslStatus.ssl_status) {
                await domain.update({ ssl_status: sslStatus.ssl_status });
              }
            } catch (error) {
              // Silent fail
            }
          }, 5000);
        }

        return {
          success: true,
          message: 'Domain verified successfully. SSL certificate will be provisioned automatically.',
          domain: domain.toJSON()
        };
      } else {
        domain.verification_status = 'failed';
        await domain.save();

        return {
          success: false,
          message: 'Domain verification failed',
          details: verificationDetails,
          instructions: this._getVerificationInstructions(domain)
        };
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      throw error;
    }
  }

  /**
   * Verify TXT record for domain ownership
   * @private
   */
  static async _verifyTXTRecord(domain) {
    try {
      const recordName = domain.verification_record_name || `_catalyst-verification.${domain.domain}`;
      const txtRecords = await dns.resolveTxt(recordName);
      const flatRecords = txtRecords.flat();
      return flatRecords.some(record => record.includes(domain.verification_token));
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify domain points to our platform (CNAME or A record)
   * @private
   */
  static async _verifyDomainPointsToUs(domain) {
    try {
      const cnameVerified = await this._verifyCNAMERecord(domain);
      if (cnameVerified) return true;

      const aRecordVerified = await this._verifyARecord(domain);
      if (aRecordVerified) return true;

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify CNAME record for domain
   * @private
   */
  static async _verifyCNAMERecord(domain) {
    try {
      const cnameRecords = await dns.resolveCname(domain.domain);
      const validTargets = ['cname.vercel-dns.com', 'vercel-dns.com', '.vercel.app'];
      return cnameRecords.some(record => {
        const recordLower = record.toLowerCase();
        return validTargets.some(target => recordLower.includes(target.toLowerCase()));
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify A record for domain (Vercel IPs)
   * @private
   */
  static async _verifyARecord(domain) {
    try {
      const aRecords = await dns.resolve4(domain.domain);
      const vercelIPs = ['76.76.21.21', '76.76.21.22', '76.76.21.93', '76.76.21.142'];
      return aRecords.some(ip => vercelIPs.includes(ip));
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify domain via HTTP file
   * @private
   */
  static async _verifyHTTPFile(domain) {
    try {
      const https = require('https');

      return new Promise((resolve) => {
        const url = `https://${domain.domain}/.well-known/catalyst-verification.txt`;

        https.get(url, { timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve(data.trim() === domain.verification_token);
          });
        }).on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      console.error('HTTP verification error:', error);
      return false;
    }
  }

  /**
   * Provision SSL certificate (Let's Encrypt or Cloudflare)
   */
  static async provisionSSLCertificate(domainId, storeId) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain } = connection.models;

      const domain = await CustomDomain.findByPk(domainId);
      if (!domain || !domain.verified_at) {
        throw new Error('Domain must be verified before SSL provisioning');
      }

      domain.ssl_status = 'pending';
      await domain.save();

      return {
        success: true,
        message: 'SSL certificate provisioning initiated',
        status: 'pending'
      };
    } catch (error) {
      console.error('SSL provisioning error:', error);
      throw error;
    }
  }

  /**
   * Check DNS configuration for a domain
   */
  static async checkDNSConfiguration(domainId, storeId) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain } = connection.models;

      const domain = await CustomDomain.findByPk(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      const requiredRecords = domain.getRequiredDNSRecords();
      const results = [];

      for (const record of requiredRecords) {
        try {
          let found = false;
          let actualValue = null;

          if (record.type === 'CNAME') {
            const cnames = await dns.resolveCname(domain.domain);
            actualValue = cnames;
            found = cnames.some(c => c.toLowerCase().includes('vercel'));
          } else if (record.type === 'A') {
            const aRecords = await dns.resolve4(domain.domain);
            actualValue = aRecords;
            // Check if any A record matches Vercel IPs
            const vercelIPs = ['76.76.21.21', '76.76.21.22', '76.76.21.93', '76.76.21.142'];
            found = aRecords.some(ip => vercelIPs.includes(ip));
          } else if (record.type === 'TXT') {
            const txts = await dns.resolveTxt(record.name);
            actualValue = txts.flat();
            found = actualValue.some(t => t.includes(record.value));
          }

          results.push({
            type: record.type,
            name: record.name,
            expected: record.value,
            actual: actualValue,
            configured: found,
            required: record.required
          });
        } catch (error) {
          results.push({
            type: record.type,
            name: record.name,
            expected: record.value,
            actual: null,
            configured: false,
            required: record.required,
            error: error.code
          });
        }
      }

      const allConfigured = results
        .filter(r => r.required)
        .every(r => r.configured);

      return {
        success: true,
        configured: allConfigured,
        records: results
      };
    } catch (error) {
      console.error('DNS check error:', error);
      throw error;
    }
  }

  /**
   * Get domain by hostname (for request routing)
   * Note: This method searches across all tenant databases, which is complex.
   * Consider implementing a master lookup table for custom domains.
   */
  static async getDomainByHostname(hostname) {
    try {
      // This would require searching across all tenant databases
      // For now, throw an error indicating this needs a different approach
      throw new Error('getDomainByHostname requires implementation of cross-tenant domain lookup');

      // TODO: Implement either:
      // 1. A master lookup table mapping domains to store_ids
      // 2. Or iterate through all tenant connections (performance issue)
    } catch (error) {
      console.error('Error getting domain by hostname:', error);
      return null;
    }
  }

  /**
   * Remove a custom domain
   */
  static async removeDomain(domainId, storeId) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain, Store } = connection.models;
      const { Op } = require('sequelize');

      const domain = await CustomDomain.findOne({
        where: { id: domainId, store_id: storeId }
      });

      if (!domain) {
        throw new Error('Domain not found');
      }

      if (domain.is_primary) {
        const otherDomains = await CustomDomain.count({
          where: {
            store_id: storeId,
            id: { [Op.ne]: domainId }
          }
        });

        if (otherDomains > 0) {
          throw new Error('Cannot remove primary domain. Set another domain as primary first.');
        }
      }

      // Remove from Vercel if configured
      const vercelService = require('./vercel-domain-service');
      if (vercelService.isConfigured()) {
        try {
          await vercelService.removeDomain(domain.domain);
        } catch (vercelError) {
          // Silent fail
        }
      }

      await domain.destroy();

      await Store.update(
        {
          custom_domain: null,
          domain_verified: false,
          ...(domain.is_primary && { primary_domain: null })
        },
        { where: { id: storeId } }
      );

      return { success: true, message: 'Domain removed successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set domain as primary
   */
  static async setPrimaryDomain(domainId, storeId) {
    try {
      // Get tenant connection
      const connection = await ConnectionManager.getConnection(storeId);
      const { CustomDomain, Store } = connection.models;

      const domain = await CustomDomain.findOne({
        where: { id: domainId, store_id: storeId }
      });

      if (!domain) {
        throw new Error('Domain not found');
      }

      if (domain.verification_status !== 'verified') {
        throw new Error('Domain must be verified before setting as primary');
      }

      // Unset other primary domains
      await CustomDomain.update(
        { is_primary: false },
        { where: { store_id: storeId } }
      );

      // Set this domain as primary
      domain.is_primary = true;
      await domain.save();

      // Update store
      await Store.update(
        { primary_domain: domain.domain },
        { where: { id: storeId } }
      );

      return {
        success: true,
        message: 'Primary domain updated successfully',
        domain: domain.toJSON()
      };
    } catch (error) {
      console.error('Error setting primary domain:', error);
      throw error;
    }
  }

  /**
   * Validate domain format
   * @private
   */
  static _isValidDomain(domain) {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  /**
   * Get verification instructions
   * @private
   */
  static _getVerificationInstructions(domain) {
    const platformDomain = process.env.PLATFORM_DOMAIN || 'catalyst.app';

    return {
      method: domain.verification_method,
      steps: [
        {
          step: 1,
          title: 'Add DNS Records',
          description: 'Add the following DNS records to your domain provider',
          records: [
            {
              type: 'CNAME',
              name: '@',
              value: `stores.${platformDomain}`,
              ttl: 3600,
              note: 'Points your domain to our platform'
            },
            {
              type: 'TXT',
              name: '_catalyst-verification',
              value: domain.verification_token,
              ttl: 300,
              note: 'Used to verify domain ownership'
            }
          ]
        },
        {
          step: 2,
          title: 'Wait for DNS Propagation',
          description: 'DNS changes can take 5-60 minutes to propagate worldwide'
        },
        {
          step: 3,
          title: 'Verify Domain',
          description: 'Click the "Verify Domain" button once DNS records are added'
        }
      ],
      common_providers: {
        cloudflare: 'https://dash.cloudflare.com/',
        namecheap: 'https://www.namecheap.com/myaccount/login/',
        godaddy: 'https://dcc.godaddy.com/manage/dns',
        google_domains: 'https://domains.google.com/',
        route53: 'https://console.aws.amazon.com/route53/'
      }
    };
  }
}

module.exports = CustomDomainService;
