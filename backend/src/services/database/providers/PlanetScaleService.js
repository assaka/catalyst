/**
 * PlanetScaleService - Handles PlanetScale MySQL OAuth and provisioning
 *
 * PlanetScale is a serverless MySQL platform with:
 * - OAuth 2.0 authentication
 * - Automatic provisioning
 * - Database branching
 * - Huge free tier (5 GB)
 *
 * Docs: https://planetscale.com/docs/concepts/service-tokens
 */

const axios = require('axios');

class PlanetScaleService {
  constructor() {
    this.clientId = process.env.PLANETSCALE_CLIENT_ID;
    this.clientSecret = process.env.PLANETSCALE_CLIENT_SECRET;
    this.redirectUri = process.env.PLANETSCALE_REDIRECT_URI || `${process.env.FRONTEND_URL}/oauth/planetscale/callback`;
    this.apiBaseUrl = 'https://api.planetscale.com/v1';
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
      scope: 'read_databases write_databases',
      state: JSON.stringify({ storeId, provider: 'planetscale' })
    });

    return `https://auth.planetscale.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://auth.planetscale.com/oauth/token', {
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        organization_id: response.data.organization_id
      };
    } catch (error) {
      console.error('PlanetScale token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create a new PlanetScale database
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID from OAuth
   * @param {string} storeId - Store ID for naming
   * @returns {Promise<Object>} Created database details
   */
  async createDatabase(accessToken, organizationId, storeId) {
    try {
      const databaseName = `store-${storeId}`.substring(0, 32); // PlanetScale has 32 char limit

      const response = await axios.post(
        `${this.apiBaseUrl}/organizations/${organizationId}/databases`,
        {
          name: databaseName,
          notes: `Database for store ${storeId}`,
          region: 'us-east-1' // Default region
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const database = response.data;

      // Wait for database to be ready
      await this.waitForDatabaseReady(accessToken, organizationId, database.name);

      return database;
    } catch (error) {
      console.error('PlanetScale database creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create database: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Wait for database to be ready
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID
   * @param {string} databaseName - Database name
   * @param {number} maxAttempts - Maximum polling attempts
   */
  async waitForDatabaseReady(accessToken, organizationId, databaseName, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const database = await this.getDatabase(accessToken, organizationId, databaseName);

      if (database.state === 'ready') {
        return database;
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Database creation timeout - database did not become ready');
  }

  /**
   * Get database details
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID
   * @param {string} databaseName - Database name
   * @returns {Promise<Object>} Database details
   */
  async getDatabase(accessToken, organizationId, databaseName) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/organizations/${organizationId}/databases/${databaseName}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('PlanetScale get database error:', error.response?.data || error.message);
      throw new Error(`Failed to get database: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get connection strings for database
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID
   * @param {string} databaseName - Database name
   * @param {string} branch - Branch name (default: 'main')
   * @returns {Promise<Object>} Connection credentials
   */
  async getConnectionString(accessToken, organizationId, databaseName, branch = 'main') {
    try {
      // Create a password for the branch
      const passwordResponse = await axios.post(
        `${this.apiBaseUrl}/organizations/${organizationId}/databases/${databaseName}/branches/${branch}/passwords`,
        {
          name: 'default-connection',
          role: 'readwrite'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const password = passwordResponse.data;

      return {
        host: password.access_host_url,
        username: password.username,
        password: password.plain_text,
        database: databaseName,
        ssl: true,
        connectionString: `mysql://${password.username}:${password.plain_text}@${password.access_host_url}/${databaseName}?ssl={"rejectUnauthorized":true}`
      };
    } catch (error) {
      console.error('PlanetScale connection string error:', error.response?.data || error.message);
      throw new Error(`Failed to get connection string: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a PlanetScale database
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID
   * @param {string} databaseName - Database name
   */
  async deleteDatabase(accessToken, organizationId, databaseName) {
    try {
      await axios.delete(
        `${this.apiBaseUrl}/organizations/${organizationId}/databases/${databaseName}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('PlanetScale database deletion error:', error.response?.data || error.message);
      throw new Error(`Failed to delete database: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List all databases for organization
   * @param {string} accessToken - PlanetScale access token
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} List of databases
   */
  async listDatabases(accessToken, organizationId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/organizations/${organizationId}/databases`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('PlanetScale list databases error:', error.response?.data || error.message);
      throw new Error(`Failed to list databases: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Parse MySQL connection string into credentials object
   * @param {string} connectionString - MySQL connection URI
   * @returns {Object} Parsed credentials
   */
  parseConnectionString(connectionString) {
    // Format: mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
    const url = new URL(connectionString);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password,
      ssl: true,
      connectionString
    };
  }
}

module.exports = new PlanetScaleService();
