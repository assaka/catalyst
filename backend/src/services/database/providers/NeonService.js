/**
 * NeonService - Handles Neon PostgreSQL OAuth and provisioning
 *
 * Neon is a serverless PostgreSQL platform with:
 * - OAuth 2.0 authentication
 * - Automatic provisioning
 * - Database branching
 * - Generous free tier (0.5 GB)
 *
 * Docs: https://neon.tech/docs/guides/oauth-integration
 */

const axios = require('axios');

class NeonService {
  constructor() {
    this.clientId = process.env.NEON_CLIENT_ID;
    this.clientSecret = process.env.NEON_CLIENT_SECRET;
    this.redirectUri = process.env.NEON_REDIRECT_URI || `${process.env.FRONTEND_URL}/oauth/neon/callback`;
    this.apiBaseUrl = 'https://console.neon.tech/api/v2';
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} storeId - Store ID to include in state
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(storeId) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      state: JSON.stringify({ storeId, provider: 'neon' })
    });

    return `https://oauth2.neon.tech/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://oauth2.neon.tech/oauth2/token', {
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Neon token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create a new Neon project
   * @param {string} accessToken - Neon access token
   * @param {string} storeId - Store ID for naming
   * @returns {Promise<Object>} Created project details
   */
  async createProject(accessToken, storeId) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/projects`, {
        project: {
          name: `store-${storeId}`,
          region_id: 'aws-us-east-1', // Default region, can be customized
          pg_version: 16 // Latest stable PostgreSQL version
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const project = response.data.project;

      // Wait for project to be ready
      await this.waitForProjectReady(accessToken, project.id);

      return project;
    } catch (error) {
      console.error('Neon project creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create Neon project: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Wait for project to be ready
   * @param {string} accessToken - Neon access token
   * @param {string} projectId - Project ID
   * @param {number} maxAttempts - Maximum polling attempts
   */
  async waitForProjectReady(accessToken, projectId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const project = await this.getProject(accessToken, projectId);

      if (project.state === 'active') {
        return project;
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Project creation timeout - project did not become active');
  }

  /**
   * Get project details
   * @param {string} accessToken - Neon access token
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project details
   */
  async getProject(accessToken, projectId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.project;
    } catch (error) {
      console.error('Neon get project error:', error.response?.data || error.message);
      throw new Error(`Failed to get project: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get connection string for project
   * @param {string} accessToken - Neon access token
   * @param {string} projectId - Project ID
   * @returns {Promise<string>} PostgreSQL connection string
   */
  async getConnectionString(accessToken, projectId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/projects/${projectId}/connection_uri`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.uri;
    } catch (error) {
      console.error('Neon connection string error:', error.response?.data || error.message);
      throw new Error(`Failed to get connection string: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Parse connection string into credentials object
   * @param {string} connectionString - PostgreSQL connection URI
   * @returns {Object} Parsed credentials
   */
  parseConnectionString(connectionString) {
    // Format: postgresql://user:password@host:port/database?sslmode=require
    const url = new URL(connectionString);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1), // Remove leading /
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require',
      connectionString // Keep original for easy use
    };
  }

  /**
   * Delete a Neon project
   * @param {string} accessToken - Neon access token
   * @param {string} projectId - Project ID
   */
  async deleteProject(accessToken, projectId) {
    try {
      await axios.delete(`${this.apiBaseUrl}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Neon project deletion error:', error.response?.data || error.message);
      throw new Error(`Failed to delete project: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List all projects for the authenticated user
   * @param {string} accessToken - Neon access token
   * @returns {Promise<Array>} List of projects
   */
  async listProjects(accessToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/projects`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.projects || [];
    } catch (error) {
      console.error('Neon list projects error:', error.response?.data || error.message);
      throw new Error(`Failed to list projects: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new NeonService();
