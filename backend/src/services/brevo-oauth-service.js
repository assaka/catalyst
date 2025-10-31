const axios = require('axios');
const { BrevoConfiguration } = require('../models');

/**
 * Brevo OAuth Service
 * Handles OAuth authentication and token management with Brevo API
 */
class BrevoOAuthService {
  constructor() {
    this.brevoClientId = process.env.BREVO_CLIENT_ID;
    this.brevoClientSecret = process.env.BREVO_CLIENT_SECRET;
    this.brevoRedirectUri = process.env.BREVO_REDIRECT_URI || `${process.env.CORS_ORIGIN}/admin/settings/email`;
    this.brevoAuthUrl = 'https://app.brevo.com/oauth/authorize';
    this.brevoTokenUrl = 'https://app.brevo.com/oauth/token';
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} storeId - Store ID for state parameter
   * @returns {string} Authorization URL
   */
  initiateOAuth(storeId) {
    const state = Buffer.from(JSON.stringify({ storeId, timestamp: Date.now() })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.brevoClientId,
      redirect_uri: this.brevoRedirectUri,
      response_type: 'code',
      scope: 'email',  // Request email sending permissions
      state
    });

    return `${this.brevoAuthUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Token response
   */
  async handleOAuthCallback(code, storeId) {
    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post(this.brevoTokenUrl, {
        grant_type: 'authorization_code',
        code,
        client_id: this.brevoClientId,
        client_secret: this.brevoClientSecret,
        redirect_uri: this.brevoRedirectUri
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Calculate expiration date
      const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      // Get sender information from Brevo
      const senderInfo = await this.getSenderInfo(access_token);

      // Save or update configuration
      const config = await BrevoConfiguration.upsert({
        store_id: storeId,
        access_token: access_token, // TODO: Encrypt in production
        refresh_token: refresh_token, // TODO: Encrypt in production
        token_expires_at: tokenExpiresAt,
        sender_name: senderInfo.name || 'Store Owner',
        sender_email: senderInfo.email,
        is_active: true
      }, {
        returning: true
      });

      return {
        success: true,
        message: 'Brevo connected successfully',
        config: config[0]
      };
    } catch (error) {
      console.error('Brevo OAuth error:', error.response?.data || error.message);
      throw new Error(`Failed to connect to Brevo: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get sender information from Brevo
   * @param {string} accessToken - Brevo access token
   * @returns {Promise<Object>} Sender information
   */
  async getSenderInfo(accessToken) {
    try {
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        email: response.data.email,
        name: response.data.firstName && response.data.lastName
          ? `${response.data.firstName} ${response.data.lastName}`
          : response.data.companyName || 'Store Owner'
      };
    } catch (error) {
      console.error('Error fetching sender info:', error.message);
      return { email: 'noreply@example.com', name: 'Store Owner' };
    }
  }

  /**
   * Refresh expired access token
   * @param {string} storeId - Store ID
   * @returns {Promise<string>} New access token
   */
  async refreshToken(storeId) {
    try {
      const config = await BrevoConfiguration.findOne({ where: { store_id: storeId } });

      if (!config || !config.refresh_token) {
        throw new Error('No Brevo configuration found for this store');
      }

      const tokenResponse = await axios.post(this.brevoTokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token,
        client_id: this.brevoClientId,
        client_secret: this.brevoClientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      // Update configuration
      await config.update({
        access_token: access_token,
        refresh_token: refresh_token || config.refresh_token,
        token_expires_at: tokenExpiresAt
      });

      return access_token;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Brevo token. Please reconnect.');
    }
  }

  /**
   * Get valid access token (refresh if expired)
   * @param {string} storeId - Store ID
   * @returns {Promise<string>} Valid access token
   */
  async getValidToken(storeId) {
    const config = await BrevoConfiguration.findOne({ where: { store_id: storeId, is_active: true } });

    if (!config) {
      throw new Error('Brevo not configured for this store');
    }

    // Check if token is expired or will expire in next 5 minutes
    const now = new Date();
    const expiresAt = new Date(config.token_expires_at);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      console.log('Brevo token expired or expiring soon, refreshing...');
      return await this.refreshToken(storeId);
    }

    return config.access_token;
  }

  /**
   * Disconnect Brevo from store
   * @param {string} storeId - Store ID
   * @returns {Promise<boolean>} Success status
   */
  async disconnect(storeId) {
    try {
      const config = await BrevoConfiguration.findOne({ where: { store_id: storeId } });

      if (config) {
        await config.update({ is_active: false });
        // Optionally: Revoke tokens via Brevo API
      }

      return true;
    } catch (error) {
      console.error('Disconnect error:', error.message);
      throw new Error('Failed to disconnect Brevo');
    }
  }

  /**
   * Test Brevo connection by sending a test API request
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Test result
   */
  async testConnection(storeId) {
    try {
      const token = await this.getValidToken(storeId);

      // Test by fetching account info
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Brevo connection is active',
        account: {
          email: response.data.email,
          companyName: response.data.companyName
        }
      };
    } catch (error) {
      console.error('Connection test error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Brevo connection failed',
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Check if Brevo is configured for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<boolean>} Configuration status
   */
  async isConfigured(storeId) {
    const config = await BrevoConfiguration.findOne({
      where: { store_id: storeId, is_active: true }
    });
    return !!config;
  }

  /**
   * Get configuration for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<Object|null>} Configuration object
   */
  async getConfiguration(storeId) {
    return await BrevoConfiguration.findOne({
      where: { store_id: storeId },
      attributes: ['id', 'sender_name', 'sender_email', 'is_active', 'token_expires_at', 'created_at']
    });
  }
}

module.exports = new BrevoOAuthService();
