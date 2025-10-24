const dns = require('dns').promises;
const { CustomDomain, Store } = require('../models');

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
      // Validate domain format
      if (!this._isValidDomain(domainName)) {
        throw new Error('Invalid domain format');
      }

      // Check if domain already exists
      const existingDomain = await CustomDomain.findByDomain(domainName);
      if (existingDomain) {
        throw new Error('Domain already registered to another store');
      }

      // Create domain record
      const domain = await CustomDomain.create({
        store_id: storeId,
        domain: domainName.toLowerCase(),
        subdomain: options.subdomain || null,
        verification_method: options.verificationMethod || 'txt',
        is_primary: options.isPrimary || false,
        ssl_provider: options.sslProvider || 'letsencrypt',
        dns_provider: options.dnsProvider || 'manual'
      });

      // Generate verification token
      domain.generateVerificationToken();
      await domain.save();

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
  static async verifyDomain(domainId) {
    try {
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
          verified = await this._verifyTXTRecord(domain);
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

        // Trigger SSL certificate provisioning
        await this.provisionSSLCertificate(domainId);

        return {
          success: true,
          message: 'Domain verified successfully',
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

      console.log(`Checking TXT record for ${recordName}:`, flatRecords);
      console.log(`Expected token:`, domain.verification_token);

      return flatRecords.some(record => record.includes(domain.verification_token));
    } catch (error) {
      console.error('TXT verification error:', error.code);
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
      const expectedTarget = domain.cname_target || `stores.${process.env.PLATFORM_DOMAIN || 'catalyst.app'}`;

      console.log(`Checking CNAME for ${domain.domain}:`, cnameRecords);
      console.log(`Expected target:`, expectedTarget);

      return cnameRecords.some(record =>
        record.toLowerCase() === expectedTarget.toLowerCase() ||
        record.toLowerCase().endsWith(`.${expectedTarget.toLowerCase()}`)
      );
    } catch (error) {
      console.error('CNAME verification error:', error.code);
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
  static async provisionSSLCertificate(domainId) {
    try {
      const domain = await CustomDomain.findByPk(domainId);
      if (!domain || !domain.verified_at) {
        throw new Error('Domain must be verified before SSL provisioning');
      }

      domain.ssl_status = 'pending';
      await domain.save();

      // TODO: Integrate with Let's Encrypt or Cloudflare SSL
      // For now, we'll mark as pending and require manual SSL setup

      console.log(`SSL certificate provisioning started for: ${domain.domain}`);

      // Simulated SSL provisioning (replace with actual implementation)
      // Options:
      // 1. Cloudflare API (if using Cloudflare)
      // 2. Let's Encrypt ACME protocol
      // 3. AWS Certificate Manager
      // 4. Custom certificate upload

      return {
        success: true,
        message: 'SSL certificate provisioning initiated',
        status: 'pending',
        note: 'SSL certificates are typically issued within 5-15 minutes'
      };
    } catch (error) {
      console.error('SSL provisioning error:', error);
      throw error;
    }
  }

  /**
   * Check DNS configuration for a domain
   */
  static async checkDNSConfiguration(domainId) {
    try {
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
            found = cnames.some(c => c.toLowerCase().includes(record.value.toLowerCase()));
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
   */
  static async getDomainByHostname(hostname) {
    try {
      const domain = await CustomDomain.findOne({
        where: {
          domain: hostname.toLowerCase(),
          is_active: true
        },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'slug', 'status']
        }]
      });

      return domain;
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
      const domain = await CustomDomain.findOne({
        where: { id: domainId, store_id: storeId }
      });

      if (!domain) {
        throw new Error('Domain not found');
      }

      // Don't allow removing primary domain if there are other domains
      if (domain.is_primary) {
        const otherDomains = await CustomDomain.count({
          where: {
            store_id: storeId,
            id: { [sequelize.Sequelize.Op.ne]: domainId }
          }
        });

        if (otherDomains > 0) {
          throw new Error('Cannot remove primary domain. Set another domain as primary first.');
        }
      }

      await domain.destroy();

      // Update store if this was the active domain
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
      console.error('Error removing domain:', error);
      throw error;
    }
  }

  /**
   * Set domain as primary
   */
  static async setPrimaryDomain(domainId, storeId) {
    try {
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
