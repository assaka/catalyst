const axios = require('axios');
const crypto = require('crypto');
const RenderOAuthToken = require('../models/RenderOAuthToken');
const { sequelize } = require('../database/connection');

class RenderIntegration {
  constructor() {
    this.clientId = process.env.RENDER_CLIENT_ID;
    this.clientSecret = process.env.RENDER_CLIENT_SECRET;
    this.redirectUri = process.env.RENDER_REDIRECT_URI || `${process.env.APP_URL}/api/render/oauth/callback`;
    this.baseUrl = 'https://api.render.com/v1';
    this.authUrl = 'https://render.com/oauth/authorize';
    this.tokenUrl = 'https://render.com/oauth/token';
    
    this.oauthConfigured = !!(this.clientId && this.clientSecret);
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(storeId, scopes = ['read:services', 'write:services', 'read:deploys', 'write:deploys']) {
    if (!this.oauthConfigured) {
      throw new Error('Render OAuth not configured. Set RENDER_CLIENT_ID and RENDER_CLIENT_SECRET');
    }

    const state = this.generateState(storeId);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Generate secure state parameter
   */
  generateState(storeId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const data = `${storeId}:${timestamp}:${random}`;
    return Buffer.from(data).toString('base64url');
  }

  /**
   * Validate and parse state parameter
   */
  validateState(state) {
    try {
      const decoded = Buffer.from(state, 'base64url').toString();
      const [storeId, timestamp, random] = decoded.split(':');
      
      // Check if state is not too old (15 minutes)
      const now = Date.now();
      const stateAge = now - parseInt(timestamp);
      const maxAge = 15 * 60 * 1000; // 15 minutes
      
      if (stateAge > maxAge) {
        throw new Error('State parameter expired');
      }

      return { storeId, timestamp, random, valid: true };
    } catch (error) {
      console.error('Invalid state parameter:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      // Validate state
      const stateValidation = this.validateState(state);
      if (!stateValidation.valid) {
        return {
          success: false,
          error: `Invalid state: ${stateValidation.error}`
        };
      }

      // Exchange code for token
      const tokenResponse = await axios.post(this.tokenUrl, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const tokenData = tokenResponse.data;

      // Get user information
      const userInfo = await this.getUserInfo(tokenData.access_token);

      return {
        success: true,
        storeId: stateValidation.storeId,
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
          scope: tokenData.scope,
          user_id: userInfo.id,
          user_email: userInfo.email,
          owner_id: userInfo.owner?.id
        },
        userInfo
      };

    } catch (error) {
      console.error('Token exchange failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * Get user information from Render API
   */
  async getUserInfo(accessToken) {
    const response = await axios.get(`${this.baseUrl}/owners`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Get the first owner (user's personal account)
    const owners = response.data;
    const userOwner = owners.find(owner => owner.type === 'user') || owners[0];

    return {
      id: userOwner.id,
      email: userOwner.email,
      name: userOwner.name,
      type: userOwner.type,
      owner: userOwner
    };
  }

  /**
   * Get user's services
   */
  async getUserServices(accessToken) {
    const response = await axios.get(`${this.baseUrl}/services`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  /**
   * Store OAuth credentials
   */
  async storeCredentials(storeId, tokenData) {
    try {
      await RenderOAuthToken.createOrUpdate(storeId, tokenData);

      return {
        success: true,
        message: 'Render credentials stored successfully'
      };
    } catch (error) {
      console.error('Failed to store Render credentials:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get stored credentials for a store
   */
  async getStoredCredentials(storeId) {
    const token = await RenderOAuthToken.findByStore(storeId);
    return token ? token.toJSON() : null;
  }

  /**
   * Test connection and get user data
   */
  async testConnection(storeId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials) {
        return {
          success: false,
          connected: false,
          message: 'No Render credentials found'
        };
      }

      // Check if token is expired
      if (RenderOAuthToken.isTokenExpired(credentials)) {
        return {
          success: false,
          connected: false,
          message: 'Render token expired'
        };
      }

      // Test API access
      const userInfo = await this.getUserInfo(credentials.access_token);
      const services = await this.getUserServices(credentials.access_token);

      return {
        success: true,
        connected: true,
        userInfo,
        servicesCount: services.length,
        message: 'Connected to Render successfully'
      };

    } catch (error) {
      console.error('Render connection test failed:', error);
      return {
        success: false,
        connected: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(storeId) {
    const credentials = await this.getStoredCredentials(storeId);
    
    if (!credentials) {
      return {
        connected: false,
        message: 'No Render connection found'
      };
    }

    const isExpired = RenderOAuthToken.isTokenExpired(credentials);
    
    return {
      connected: !isExpired,
      user_email: credentials.user_email,
      owner_id: credentials.owner_id,
      expires_at: credentials.expires_at,
      scope: credentials.scope,
      message: isExpired ? 'Token expired' : 'Connected'
    };
  }

  /**
   * Revoke access and delete credentials
   */
  async revokeAccess(storeId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (credentials) {
        // TODO: Revoke token with Render API when available
        // await this.revokeToken(credentials.access_token);
        
        await RenderOAuthToken.destroy({
          where: { store_id: storeId }
        });
      }

      return {
        success: true,
        message: 'Render access revoked successfully'
      };
    } catch (error) {
      console.error('Failed to revoke Render access:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deploy application to Render
   */
  async deployApplication(storeId, deploymentConfig) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      const serviceConfig = {
        name: deploymentConfig.name || `catalyst-store-${storeId.slice(0, 8)}`,
        type: 'web_service',
        repo: deploymentConfig.repo,
        branch: deploymentConfig.branch || 'main',
        buildCommand: deploymentConfig.buildCommand || 'npm install && npm run build',
        startCommand: deploymentConfig.startCommand || 'npm start',
        plan: deploymentConfig.plan || 'starter',
        region: deploymentConfig.region || 'oregon',
        rootDir: deploymentConfig.rootDir || '',
        envVars: [
          {
            key: 'NODE_ENV',
            value: 'production'
          },
          {
            key: 'STORE_ID', 
            value: storeId
          },
          ...(deploymentConfig.envVars || [])
        ]
      };

      const response = await axios.post(`${this.baseUrl}/services`, serviceConfig, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        service: response.data,
        message: 'Application deployed successfully'
      };

    } catch (error) {
      console.error('Deployment failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(storeId, serviceId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      const response = await axios.get(`${this.baseUrl}/services/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });

      return {
        success: true,
        service: response.data
      };

    } catch (error) {
      console.error('Failed to get deployment status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Add custom domain to Render service
   */
  async addCustomDomain(storeId, serviceId, domain) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      const response = await axios.post(`${this.baseUrl}/services/${serviceId}/custom-domains`, {
        name: domain
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        domain: response.data,
        message: 'Custom domain added successfully'
      };

    } catch (error) {
      console.error('Failed to add custom domain:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get custom domains for a service
   */
  async getCustomDomains(storeId, serviceId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      const response = await axios.get(`${this.baseUrl}/services/${serviceId}/custom-domains`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });

      return {
        success: true,
        domains: response.data
      };

    } catch (error) {
      console.error('Failed to get custom domains:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Remove custom domain from Render service
   */
  async removeCustomDomain(storeId, serviceId, domainId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      await axios.delete(`${this.baseUrl}/services/${serviceId}/custom-domains/${domainId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });

      return {
        success: true,
        message: 'Custom domain removed successfully'
      };

    } catch (error) {
      console.error('Failed to remove custom domain:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get domain verification status
   */
  async getDomainVerificationStatus(storeId, serviceId, domainId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials || RenderOAuthToken.isTokenExpired(credentials)) {
        throw new Error('Render credentials not found or expired');
      }

      const response = await axios.get(`${this.baseUrl}/services/${serviceId}/custom-domains/${domainId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });

      const domain = response.data;
      
      return {
        success: true,
        domain: {
          id: domain.id,
          name: domain.name,
          verification_status: domain.verificationStatus,
          dns_records: domain.dnsRecords || [],
          created_at: domain.createdAt
        }
      };

    } catch (error) {
      console.error('Failed to get domain verification status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Generate DNS configuration instructions
   */
  generateDNSInstructions(domain, dnsRecords = []) {
    const instructions = {
      domain: domain,
      records: [],
      nameserverInstructions: this.generateNameserverInstructions(domain),
      generalInstructions: [
        "Log into your domain registrar's control panel",
        "Navigate to DNS or Name Server settings",
        "Add the following DNS records:",
        "Wait 24-48 hours for DNS propagation",
        "Verify your domain in Render dashboard"
      ]
    };

    // Add CNAME record for the domain
    instructions.records.push({
      type: 'CNAME',
      name: domain.startsWith('www.') ? 'www' : '@',
      value: `${domain}.onrender.com`,
      ttl: 3600,
      description: 'Points your domain to Render'
    });

    // Add any additional DNS records from Render
    if (dnsRecords && dnsRecords.length > 0) {
      dnsRecords.forEach(record => {
        instructions.records.push({
          type: record.type,
          name: record.name,
          value: record.value,
          ttl: record.ttl || 3600,
          description: record.description || 'Required for domain verification'
        });
      });
    }

    return instructions;
  }

  /**
   * Generate nameserver-specific instructions
   */
  generateNameserverInstructions(domain) {
    const commonProviders = {
      'Cloudflare': {
        steps: [
          'Log into your Cloudflare dashboard',
          'Select your domain',
          'Go to DNS settings',
          'Add the CNAME record as shown above',
          'Set Proxy status to "DNS only" (gray cloud)',
          'Save the record'
        ]
      },
      'GoDaddy': {
        steps: [
          'Log into your GoDaddy account',
          'Go to Domain Manager',
          'Click DNS next to your domain',
          'Add a new CNAME record',
          'Enter the Name and Value as shown above',
          'Save the record'
        ]
      },
      'Namecheap': {
        steps: [
          'Log into your Namecheap account',
          'Go to Domain List',
          'Click Manage next to your domain',
          'Go to Advanced DNS tab',
          'Add a new CNAME record',
          'Enter the Host and Value as shown above',
          'Save changes'
        ]
      },
      'Google Domains': {
        steps: [
          'Log into Google Domains',
          'Select your domain',
          'Click DNS in the left menu',
          'Scroll to Custom records',
          'Add a new CNAME record',
          'Enter the Name and Data as shown above',
          'Save the record'
        ]
      },
      'AWS Route 53': {
        steps: [
          'Log into AWS Console',
          'Go to Route 53 service',
          'Select your hosted zone',
          'Click "Create record"',
          'Choose CNAME record type',
          'Enter the Record name and Value as shown above',
          'Create the record'
        ]
      }
    };

    return {
      common_providers: commonProviders,
      general_steps: [
        'Find your domain\'s DNS management page',
        'Look for "DNS Records", "DNS Zone", or "Name Server" settings',
        'Create a new CNAME record',
        'Enter the record details as shown in the DNS records section',
        'Save/Apply the changes',
        'Wait for DNS propagation (usually 15 minutes to 48 hours)'
      ]
    };
  }

  /**
   * Validate OAuth configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.clientId) {
      errors.push('RENDER_CLIENT_ID environment variable is required');
    }
    
    if (!this.clientSecret) {
      errors.push('RENDER_CLIENT_SECRET environment variable is required');
    }
    
    if (!this.redirectUri) {
      errors.push('RENDER_REDIRECT_URI environment variable is required');
    }
    
    return errors;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.oauthConfigured,
      clientId: this.clientId ? `${this.clientId.slice(0, 8)}...` : null,
      redirectUri: this.redirectUri,
      baseUrl: this.baseUrl,
      authUrl: this.authUrl
    };
  }
}

module.exports = new RenderIntegration();