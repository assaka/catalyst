const axios = require('axios');

/**
 * Vercel Domain Management Service
 *
 * Automatically adds custom domains to Vercel project via API
 * Checks SSL certificate status
 * No tenant access to Vercel required - all automated
 */
class VercelDomainService {
  constructor() {
    this.apiToken = process.env.VERCEL_API_TOKEN;
    this.projectId = process.env.VERCEL_PROJECT_ID;
    this.teamId = process.env.VERCEL_TEAM_ID; // Optional
    this.baseUrl = 'https://api.vercel.com';

    if (!this.apiToken) {
      console.warn('⚠️ VERCEL_API_TOKEN not configured - domain automation disabled');
    }
    if (!this.projectId) {
      console.warn('⚠️ VERCEL_PROJECT_ID not configured - domain automation disabled');
    }
  }

  /**
   * Check if Vercel API is configured
   */
  isConfigured() {
    return !!(this.apiToken && this.projectId);
  }

  /**
   * Get API headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Add a custom domain to Vercel project
   * @param {string} domain - Domain name (e.g., www.myshop.com)
   * @returns {Promise<Object>} Result with domain configuration
   */
  async addDomain(domain) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Vercel API not configured. Set VERCEL_API_TOKEN and VERCEL_PROJECT_ID');
      }

      console.log(`🔧 Adding domain to Vercel: ${domain}`);

      const url = this.teamId
        ? `${this.baseUrl}/v10/projects/${this.projectId}/domains?teamId=${this.teamId}`
        : `${this.baseUrl}/v10/projects/${this.projectId}/domains`;

      const response = await axios.post(
        url,
        { name: domain },
        { headers: this.getHeaders() }
      );

      console.log(`✅ Domain added to Vercel: ${domain}`);

      return {
        success: true,
        domain: response.data.name,
        verified: response.data.verified,
        verification: response.data.verification,
        message: 'Domain added to Vercel successfully'
      };
    } catch (error) {
      console.error('❌ Failed to add domain to Vercel:', error.response?.data || error.message);

      // Handle specific errors
      if (error.response?.status === 409) {
        return {
          success: true,
          message: 'Domain already exists in Vercel',
          already_exists: true
        };
      }

      if (error.response?.data?.error?.code === 'forbidden') {
        throw new Error('Vercel API token does not have permission to add domains');
      }

      throw new Error(`Vercel API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get domain configuration from Vercel
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Domain configuration including SSL status
   */
  async getDomainConfig(domain) {
    try {
      if (!this.isConfigured()) {
        return { success: false, message: 'Vercel API not configured' };
      }

      const url = this.teamId
        ? `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}?teamId=${this.teamId}`
        : `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}`;

      const response = await axios.get(url, { headers: this.getHeaders() });

      const config = response.data;

      return {
        success: true,
        domain: config.name,
        verified: config.verified,
        ssl_configured: !!config.configuredBy,
        ssl_status: this.mapVercelSSLStatus(config),
        redirect: config.redirect,
        git_branch: config.gitBranch,
        raw_config: config
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Domain not found in Vercel',
          not_found: true
        };
      }

      console.error('Error getting Vercel domain config:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Map Vercel SSL status to our SSL status enum
   */
  mapVercelSSLStatus(vercelConfig) {
    if (!vercelConfig.verified) {
      return 'pending';
    }

    // Check if SSL is configured
    if (vercelConfig.configuredBy) {
      return 'active';
    }

    // Check verification status
    if (vercelConfig.verification && vercelConfig.verification.length > 0) {
      const verification = vercelConfig.verification[0];
      if (verification.type === 'TXT' && verification.domain) {
        return 'verifying';
      }
    }

    return 'pending';
  }

  /**
   * Remove domain from Vercel project
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Removal result
   */
  async removeDomain(domain) {
    try {
      if (!this.isConfigured()) {
        return { success: false, message: 'Vercel API not configured' };
      }

      console.log(`🗑️ Removing domain from Vercel: ${domain}`);

      const url = this.teamId
        ? `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}?teamId=${this.teamId}`
        : `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}`;

      await axios.delete(url, { headers: this.getHeaders() });

      console.log(`✅ Domain removed from Vercel: ${domain}`);

      return {
        success: true,
        message: 'Domain removed from Vercel successfully'
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: true,
          message: 'Domain not found in Vercel (already removed)',
          already_removed: true
        };
      }

      console.error('Error removing domain from Vercel:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check SSL certificate status for a domain
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} SSL status
   */
  async checkSSLStatus(domain) {
    try {
      const config = await this.getDomainConfig(domain);

      if (!config.success) {
        return { success: false, message: config.message };
      }

      return {
        success: true,
        ssl_status: config.ssl_status,
        verified: config.verified,
        ssl_configured: config.ssl_configured,
        message: config.ssl_status === 'active' ? 'SSL certificate active' : 'SSL certificate pending'
      };
    } catch (error) {
      console.error('Error checking SSL status:', error);
      return {
        success: false,
        message: 'Failed to check SSL status',
        error: error.message
      };
    }
  }

  /**
   * Verify domain configuration in Vercel
   * Checks if DNS records are properly configured
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Verification result
   */
  async verifyDomainConfiguration(domain) {
    try {
      if (!this.isConfigured()) {
        return { success: false, message: 'Vercel API not configured' };
      }

      const url = this.teamId
        ? `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}/verify?teamId=${this.teamId}`
        : `${this.baseUrl}/v9/projects/${this.projectId}/domains/${domain}/verify`;

      const response = await axios.post(url, {}, { headers: this.getHeaders() });

      return {
        success: true,
        verified: response.data.verified,
        message: response.data.verified ? 'Domain verified in Vercel' : 'Domain verification pending'
      };
    } catch (error) {
      console.error('Error verifying domain in Vercel:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new VercelDomainService();
