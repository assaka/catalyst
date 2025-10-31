const axios = require('axios');
const dns = require('dns').promises;

/**
 * Cloudflare DNS Management Service
 *
 * Handles DNS record creation, updates, and verification via Cloudflare API
 */
class CloudflareDNSService {
  constructor() {
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  /**
   * Create a DNS record in Cloudflare
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} accessToken - Cloudflare access token
   * @param {Object} recordConfig - DNS record configuration
   * @returns {Promise<Object>} Created record details
   */
  async createDNSRecord(zoneId, accessToken, recordConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/zones/${zoneId}/dns_records`,
        recordConfig,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to create DNS record');
      }

      console.log('✅ DNS record created:', recordConfig.type, recordConfig.name);
      return {
        success: true,
        record: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create DNS record:', error.message);
      throw new Error(`DNS record creation failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * List DNS records for a zone
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} accessToken - Cloudflare access token
   * @param {Object} filters - Optional filters (type, name, content)
   * @returns {Promise<Array>} List of DNS records
   */
  async listDNSRecords(zoneId, accessToken, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(
        `${this.baseUrl}/zones/${zoneId}/dns_records?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to list DNS records');
      }

      return {
        success: true,
        records: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to list DNS records:', error.message);
      throw new Error(`DNS record listing failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Update an existing DNS record
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} recordId - DNS record ID
   * @param {string} accessToken - Cloudflare access token
   * @param {Object} updates - Record updates
   * @returns {Promise<Object>} Updated record details
   */
  async updateDNSRecord(zoneId, recordId, accessToken, updates) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to update DNS record');
      }

      console.log('✅ DNS record updated:', recordId);
      return {
        success: true,
        record: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to update DNS record:', error.message);
      throw new Error(`DNS record update failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Delete a DNS record
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} recordId - DNS record ID
   * @param {string} accessToken - Cloudflare access token
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDNSRecord(zoneId, recordId, accessToken) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to delete DNS record');
      }

      console.log('✅ DNS record deleted:', recordId);
      return {
        success: true,
        id: response.data.result.id
      };
    } catch (error) {
      console.error('❌ Failed to delete DNS record:', error.message);
      throw new Error(`DNS record deletion failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Auto-provision all required DNS records for a store domain
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} accessToken - Cloudflare access token
   * @param {string} zoneName - Zone name (e.g., example.com)
   * @param {string} subdomain - Subdomain (e.g., www, shop, or @ for apex)
   * @param {string} verificationToken - Domain verification token
   * @returns {Promise<Object>} Provisioning result with created records
   */
  async provisionStoreRecords(zoneId, accessToken, zoneName, subdomain, verificationToken) {
    try {
      console.log(`🔧 Provisioning DNS records for ${subdomain}.${zoneName}...`);

      const vercelDeploymentUrl = process.env.VERCEL_DEPLOYMENT_URL || 'catalyst-pearl.vercel.app';
      const createdRecords = [];

      // 1. Create CNAME record pointing to Vercel
      const cnameRecordName = subdomain === '@' ? zoneName : subdomain;
      const cnameRecord = {
        type: 'CNAME',
        name: cnameRecordName,
        content: vercelDeploymentUrl,
        ttl: 1, // Auto TTL
        proxied: true, // Enable Cloudflare proxy (CDN + SSL)
        comment: 'Catalyst store domain - auto-provisioned'
      };

      try {
        const cnameResult = await this.createDNSRecord(zoneId, accessToken, cnameRecord);
        createdRecords.push({
          type: 'CNAME',
          name: cnameRecordName,
          record_id: cnameResult.record.id,
          status: 'created'
        });
      } catch (error) {
        // Check if record already exists
        if (error.message.includes('already exists')) {
          console.log('⚠️ CNAME record already exists, skipping...');
          createdRecords.push({
            type: 'CNAME',
            name: cnameRecordName,
            status: 'exists'
          });
        } else {
          throw error;
        }
      }

      // 2. Create TXT record for domain verification
      const txtRecordName = `_catalyst-verification${subdomain !== '@' ? `.${subdomain}` : ''}`;
      const txtRecord = {
        type: 'TXT',
        name: txtRecordName,
        content: verificationToken,
        ttl: 300,
        comment: 'Catalyst domain verification token'
      };

      try {
        const txtResult = await this.createDNSRecord(zoneId, accessToken, txtRecord);
        createdRecords.push({
          type: 'TXT',
          name: txtRecordName,
          record_id: txtResult.record.id,
          status: 'created'
        });
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ TXT record already exists, skipping...');
          createdRecords.push({
            type: 'TXT',
            name: txtRecordName,
            status: 'exists'
          });
        } else {
          throw error;
        }
      }

      console.log(`✅ DNS provisioning complete! Created ${createdRecords.length} records.`);

      return {
        success: true,
        records: createdRecords,
        message: `DNS records provisioned successfully for ${cnameRecordName}.${zoneName}`
      };
    } catch (error) {
      console.error('❌ DNS provisioning failed:', error.message);
      throw new Error(`DNS provisioning failed: ${error.message}`);
    }
  }

  /**
   * Verify DNS propagation globally
   * @param {string} domain - Full domain name (e.g., www.example.com)
   * @param {string} recordType - Record type (CNAME, TXT, A)
   * @param {string} expectedValue - Expected record value
   * @returns {Promise<Object>} Verification result
   */
  async verifyDNSPropagation(domain, recordType, expectedValue) {
    try {
      console.log(`🔍 Verifying ${recordType} record for ${domain}...`);

      let records = [];

      switch (recordType.toUpperCase()) {
        case 'CNAME':
          records = await dns.resolveCname(domain).catch(() => []);
          break;
        case 'TXT':
          records = await dns.resolveTxt(domain).catch(() => []);
          // Flatten TXT records (they come as arrays)
          records = records.flat();
          break;
        case 'A':
          records = await dns.resolve4(domain).catch(() => []);
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }

      const found = records.some(record =>
        record.toLowerCase().includes(expectedValue.toLowerCase())
      );

      if (found) {
        console.log(`✅ ${recordType} record verified for ${domain}`);
        return {
          success: true,
          propagated: true,
          records: records,
          message: 'DNS record found and verified'
        };
      } else {
        console.log(`⏳ ${recordType} record not yet propagated for ${domain}`);
        return {
          success: true,
          propagated: false,
          records: records,
          message: 'DNS record not yet propagated. This can take 5-60 minutes.'
        };
      }
    } catch (error) {
      console.error('❌ DNS verification failed:', error.message);
      return {
        success: false,
        propagated: false,
        error: error.message,
        message: 'DNS verification check failed. Records may not be configured yet.'
      };
    }
  }

  /**
   * Check DNS propagation status for all store records
   * @param {string} domain - Full domain name
   * @param {string} verificationToken - Expected TXT record value
   * @returns {Promise<Object>} Propagation status for all records
   */
  async checkStoreDNSPropagation(domain, verificationToken) {
    try {
      const vercelUrl = process.env.VERCEL_DEPLOYMENT_URL || 'catalyst-pearl.vercel.app';

      const checks = await Promise.all([
        this.verifyDNSPropagation(domain, 'CNAME', vercelUrl),
        this.verifyDNSPropagation(`_catalyst-verification.${domain}`, 'TXT', verificationToken)
      ]);

      const allPropagated = checks.every(check => check.propagated);

      return {
        success: true,
        all_propagated: allPropagated,
        checks: {
          cname: checks[0],
          txt: checks[1]
        },
        message: allPropagated
          ? 'All DNS records verified and propagated'
          : 'Some DNS records are still propagating'
      };
    } catch (error) {
      console.error('❌ DNS propagation check failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove all Catalyst DNS records for a domain
   * @param {string} zoneId - Cloudflare zone ID
   * @param {string} accessToken - Cloudflare access token
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Removal result
   */
  async removeStoreRecords(zoneId, accessToken, domain) {
    try {
      console.log(`🗑️ Removing DNS records for ${domain}...`);

      // List all Catalyst-related records
      const listResult = await this.listDNSRecords(zoneId, accessToken);

      const catalystRecords = listResult.records.filter(record =>
        record.comment?.includes('Catalyst') ||
        record.name.includes('_catalyst-verification')
      );

      const deletedRecords = [];

      for (const record of catalystRecords) {
        try {
          await this.deleteDNSRecord(zoneId, record.id, accessToken);
          deletedRecords.push({
            type: record.type,
            name: record.name,
            status: 'deleted'
          });
        } catch (error) {
          console.error(`⚠️ Failed to delete record ${record.name}:`, error.message);
        }
      }

      console.log(`✅ Removed ${deletedRecords.length} DNS records`);

      return {
        success: true,
        deleted_count: deletedRecords.length,
        records: deletedRecords
      };
    } catch (error) {
      console.error('❌ DNS record removal failed:', error.message);
      throw new Error(`Failed to remove DNS records: ${error.message}`);
    }
  }
}

module.exports = new CloudflareDNSService();
