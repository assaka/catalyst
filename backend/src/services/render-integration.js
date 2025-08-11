const axios = require('axios');
const crypto = require('crypto');
const RenderOAuthToken = require('../models/RenderOAuthToken');
const { sequelize } = require('../database/connection');

class RenderIntegration {
  constructor() {
    // Render uses Personal Access Tokens, not OAuth
    this.baseUrl = 'https://api.render.com/v1';
    this.tokenConfigured = false; // Will be set per-store basis
  }

  /**
   * Store Personal Access Token for a store
   */
  async storePersonalAccessToken(storeId, token, userEmail = null) {
    try {
      // Validate the token by testing it
      const testResult = await this.testToken(token);
      if (!testResult.success) {
        return {
          success: false,
          error: `Invalid token: ${testResult.error}`
        };
      }

      // Store the token data
      console.log('📋 User info from token test:', JSON.stringify(testResult.userInfo, null, 2));
      console.log('📋 Provided user email:', userEmail);
      
      const tokenData = {
        access_token: token,
        user_id: testResult.userInfo?.id || 'unknown_user', // Required field
        user_email: userEmail || testResult.userInfo?.email || 'Unknown',
        owner_id: testResult.userInfo?.id || 'Unknown',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Set to 1 year from now (Personal Access Tokens are long-lived)
        scope: 'personal_access_token'
      };
      
      console.log('💾 Storing token data:', JSON.stringify(tokenData, null, 2));

      await RenderOAuthToken.createOrUpdate(storeId, tokenData);

      return {
        success: true,
        message: 'Render Personal Access Token stored successfully',
        userInfo: testResult.userInfo
      };
    } catch (error) {
      console.error('Failed to store Render token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test a Personal Access Token
   */
  async testToken(token) {
    try {
      const userInfo = await this.getUserInfo(token);
      return {
        success: true,
        userInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get user information from Render API using Personal Access Token
   */
  async getUserInfo(accessToken) {
    const response = await axios.get(`${this.baseUrl}/owners`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('🔍 Render API /owners response:', JSON.stringify(response.data, null, 2));

    let userOwner;
    const data = response.data;

    // Handle different response structures from Render API
    if (Array.isArray(data)) {
      // If response is an array of owner objects with nested owner property
      const ownerItem = data.find(item => item.owner && item.owner.type === 'user') || 
                        data.find(item => item.owner) || 
                        data[0];
      userOwner = ownerItem?.owner || ownerItem;
    } else if (data.owner && data.owner.owner) {
      // If response has nested owner structure
      userOwner = data.owner.owner;
    } else if (data.owner) {
      // If response has single owner structure
      userOwner = data.owner;
    } else {
      // Fallback - use the data directly
      userOwner = data;
    }

    if (!userOwner) {
      throw new Error('No owner information found in Render API response');
    }

    console.log('✅ Extracted user owner:', JSON.stringify(userOwner, null, 2));

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
   * Validate token configuration for a store
   */
  async validateStoreConfig(storeId) {
    const errors = [];
    
    try {
      const credentials = await this.getStoredCredentials(storeId);
      if (!credentials) {
        errors.push('No Render Personal Access Token configured for this store');
      } else if (!credentials.access_token) {
        errors.push('Invalid token data stored');
      }
    } catch (error) {
      errors.push(`Failed to validate configuration: ${error.message}`);
    }
    
    return errors;
  }

  /**
   * Get service status
   */
  async getStatus(storeId = null) {
    const status = {
      baseUrl: this.baseUrl,
      authMethod: 'Personal Access Token'
    };

    if (storeId) {
      const credentials = await this.getStoredCredentials(storeId);
      status.configured = !!credentials;
      status.tokenExists = !!credentials?.access_token;
      status.userEmail = credentials?.user_email;
    }

    return status;
  }
}

module.exports = new RenderIntegration();