const dns = require('dns').promises;
const ConnectionManager = require('./database/ConnectionManager');
const { masterDbClient } = require('../database/masterConnection');

/**
 * Custom Domain Management Service
 *
 * Handles:
 * - Domain verification via DNS records
 * - SSL certificate provisioning (Let's Encrypt)
 * - DNS configuration validation
 * - Domain routing and resolution
 * - Syncing domain records to master DB for fast routing
 */
class CustomDomainService {
  /**
   * Add a new custom domain to a store
   */
  static async addDomain(storeId, domainName, options = {}) {
    try {
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Validate domain format
      if (!this._isValidDomain(domainName)) {
        throw new Error('Invalid domain format');
      }

      // Generate deterministic verification token based on domain name
      // This ensures same domain always gets same token (even if deleted and re-added)
      const crypto = require('crypto');
      const verification_token = crypto
        .createHash('sha256')
        .update(`daino-verify-${domainName.toLowerCase()}-${storeId}`)
        .digest('hex');

      // Create domain record
      const domainData = {
        store_id: storeId,
        domain: domainName.toLowerCase(),
        subdomain: options.subdomain || null,
        verification_method: options.verificationMethod || 'txt',
        verification_token: verification_token,
        verification_status: 'pending',
        is_primary: options.isPrimary || false,
        is_redirect: options.isRedirect || false,
        redirect_to: options.redirectTo ? options.redirectTo.toLowerCase() : null,
        ssl_provider: 'vercel',
        ssl_status: 'pending',
        dns_provider: options.dnsProvider || 'manual',
        is_active: true,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: domain, error: insertError } = await tenantDb
        .from('custom_domains')
        .insert(domainData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting domain:', insertError);
        throw new Error(insertError.message || 'Failed to create domain record');
      }

      // Sync to master DB for fast domain routing
      await this._syncToMasterDB(storeId, domain);

      // Automatically add domain to Vercel via API (for SSL provisioning)
      const vercelService = require('./vercel-domain-service');
      if (vercelService.isConfigured()) {
        try {
          const vercelResult = await vercelService.addDomain(domainName);
          if (vercelResult.success) {
            const { error: updateError } = await tenantDb
              .from('custom_domains')
              .update({
                metadata: {
                  ...domain.metadata,
                  vercel_added: true,
                  vercel_added_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', domain.id);

            if (updateError) {
              console.error('Error updating domain metadata:', updateError);
            }
          }
        } catch (vercelError) {
          // Silent fail - domain can be added to Vercel manually
          console.error('Vercel domain add failed:', vercelError);
        }
      }

      return {
        success: true,
        domain: domain,
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
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: domain, error: fetchError } = await tenantDb
        .from('custom_domains')
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !domain) {
        throw new Error('Domain not found');
      }

      if (domain.verification_status === 'verified') {
        return { success: true, message: 'Domain already verified' };
      }

      // Update status to verifying
      await tenantDb
        .from('custom_domains')
        .update({
          verification_status: 'verifying',
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

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
        // Mark domain as verified
        const { data: updatedDomain, error: updateError } = await tenantDb
          .from('custom_domains')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', domainId)
          .select()
          .single();

        if (updateError) {
          throw new Error('Failed to update domain verification status');
        }

        // Update store
        await tenantDb
          .from('stores')
          .update({
            custom_domain: domain.domain,
            domain_verified: true,
            ...(domain.is_primary && { primary_domain: domain.domain }),
            updated_at: new Date().toISOString()
          })
          .eq('id', domain.store_id);

        // Sync verified status to master DB
        await this._syncToMasterDB(storeId, updatedDomain);

        // Check SSL status from Vercel
        const vercelService = require('./vercel-domain-service');
        if (vercelService.isConfigured()) {
          setTimeout(async () => {
            try {
              const sslStatus = await vercelService.checkSSLStatus(domain.domain);
              if (sslStatus.success && sslStatus.ssl_status) {
                await tenantDb
                  .from('custom_domains')
                  .update({
                    ssl_status: sslStatus.ssl_status,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', domainId);
              }
            } catch (error) {
              // Silent fail
            }
          }, 5000);
        }

        return {
          success: true,
          message: 'Domain verified successfully. SSL certificate will be provisioned automatically.',
          domain: updatedDomain
        };
      } else {
        await tenantDb
          .from('custom_domains')
          .update({
            verification_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', domainId);

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
      const recordName = domain.verification_record_name || `_daino-verification.${domain.domain}`;
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
        const url = `https://${domain.domain}/.well-known/daino-verification.txt`;

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
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: domain, error: fetchError } = await tenantDb
        .from('custom_domains')
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !domain || !domain.verified_at) {
        throw new Error('Domain must be verified before SSL provisioning');
      }

      await tenantDb
        .from('custom_domains')
        .update({
          ssl_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

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
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: domain, error: fetchError } = await tenantDb
        .from('custom_domains')
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !domain) {
        throw new Error('Domain not found');
      }

      // Get required DNS records
      const requiredRecords = [
        {
          type: 'A',
          name: '@',
          value: '76.76.21.21',
          required: true
        },
        {
          type: 'TXT',
          name: `_daino-verification.${domain.domain}`,
          value: domain.verification_token,
          required: true
        }
      ];

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
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: domain, error: fetchError } = await tenantDb
        .from('custom_domains')
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !domain) {
        throw new Error('Domain not found');
      }

      if (domain.is_primary) {
        const { count, error: countError } = await tenantDb
          .from('custom_domains')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .neq('id', domainId);

        if (!countError && count > 0) {
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

      await tenantDb
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      await tenantDb
        .from('stores')
        .update({
          custom_domain: null,
          domain_verified: false,
          ...(domain.is_primary && { primary_domain: null }),
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      // Remove from master DB lookup table
      await this._removeFromMasterDB(domain.domain);

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
      // Get tenant connection (returns Supabase client)
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: domain, error: fetchError } = await tenantDb
        .from('custom_domains')
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single();

      if (fetchError || !domain) {
        throw new Error('Domain not found');
      }

      if (domain.verification_status !== 'verified') {
        throw new Error('Domain must be verified before setting as primary');
      }

      // Unset other primary domains
      await tenantDb
        .from('custom_domains')
        .update({
          is_primary: false,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId);

      // Set this domain as primary
      const { data: updatedDomain, error: updateError } = await tenantDb
        .from('custom_domains')
        .update({
          is_primary: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update domain');
      }

      // Update store
      await tenantDb
        .from('stores')
        .update({
          primary_domain: domain.domain,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      // Sync primary status to master DB
      await this._syncToMasterDB(storeId, updatedDomain);

      return {
        success: true,
        message: 'Primary domain updated successfully',
        domain: updatedDomain
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
    const platformDomain = process.env.PLATFORM_DOMAIN || 'daino.app';

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
              name: '_daino-verification',
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

  /**
   * Sync domain record to master DB lookup table for fast routing
   * @private
   */
  static async _syncToMasterDB(storeId, domain) {
    try {
      const lookupData = {
        domain: domain.domain.toLowerCase(),
        store_id: storeId,
        is_verified: domain.verification_status === 'verified',
        is_active: domain.is_active || true,
        is_primary: domain.is_primary || false,
        is_redirect: domain.is_redirect || false,
        redirect_to: domain.redirect_to || null,
        ssl_status: domain.ssl_status || 'pending',
        verified_at: domain.verified_at || null,
        updated_at: new Date().toISOString()
      };

      // 1. Upsert into custom_domains_lookup table (all domains)
      const { error } = await masterDbClient
        .from('custom_domains_lookup')
        .upsert(lookupData, {
          onConflict: 'domain',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error syncing domain to master DB lookup table:', error);
        // Don't throw - this is a non-critical operation
      } else {
        console.log(`✓ Synced domain ${domain.domain} to custom_domains_lookup table`);
      }

      // 2. Update master stores table with count and primary domain
      // Get current count of ALL active domains (verified or pending)
      const { count, error: countError } = await masterDbClient
        .from('custom_domains_lookup')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('is_active', true);

      const domainsCount = countError ? 0 : (count || 0);

      const storeUpdate = {
        custom_domains_count: domainsCount,
        updated_at: new Date().toISOString()
      };

      // Set primary domain if:
      // 1. This domain is marked as primary AND
      // 2. Domain is verified (for routing to work)
      if (domain.is_primary) {
        if (domain.verification_status === 'verified') {
          storeUpdate.primary_custom_domain = domain.domain.toLowerCase();
          storeUpdate.domain_verified = true;
        } else {
          // Domain is primary but not verified yet - clear old primary
          storeUpdate.primary_custom_domain = null;
          storeUpdate.domain_verified = false;
        }
      }

      const { error: storeError } = await masterDbClient
        .from('stores')
        .update(storeUpdate)
        .eq('id', storeId);

      if (storeError) {
        console.error('Error updating master stores table:', storeError);
      } else {
        console.log(`✓ Updated master stores table (count: ${domainsCount}, primary: ${domain.is_primary})`);
      }
    } catch (error) {
      console.error('Error syncing domain to master DB:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Remove domain from master DB lookup table
   * @private
   */
  static async _removeFromMasterDB(domainName, storeId = null, wasPrimary = false) {
    try {
      // 1. Remove from custom_domains_lookup table
      const { error } = await masterDbClient
        .from('custom_domains_lookup')
        .delete()
        .eq('domain', domainName.toLowerCase());

      if (error) {
        console.error('Error removing domain from master DB lookup table:', error);
        // Don't throw - this is a non-critical operation
      } else {
        console.log(`✓ Removed domain ${domainName} from custom_domains_lookup table`);
      }

      // 2. If this was the primary domain, clear it from master stores table
      if (wasPrimary && storeId) {
        const { error: storeError } = await masterDbClient
          .from('stores')
          .update({
            primary_custom_domain: null,
            domain_verified: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId)
          .eq('primary_custom_domain', domainName.toLowerCase());

        if (storeError) {
          console.error('Error clearing primary domain from master stores table:', storeError);
        } else {
          console.log(`✓ Cleared primary_custom_domain from master stores table`);
        }
      }
    } catch (error) {
      console.error('Error removing domain from master DB:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get store ID by custom domain (for request routing)
   * Fast lookup from master DB
   */
  static async getStoreByDomain(domainName) {
    try {
      const { data, error } = await masterDbClient
        .from('custom_domains_lookup')
        .select('store_id, is_verified, is_active, ssl_status')
        .eq('domain', domainName.toLowerCase())
        .eq('is_verified', true)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        store_id: data.store_id,
        ssl_status: data.ssl_status
      };
    } catch (error) {
      console.error('Error looking up domain:', error);
      return null;
    }
  }
}

module.exports = CustomDomainService;
