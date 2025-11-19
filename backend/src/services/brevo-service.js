const axios = require('axios');
const { BrevoConfiguration } = require('../models'); // Tenant DB model

/**
 * Brevo Service
 * Handles Brevo API key authentication and configuration
 * Uses simple API key (xkeysib-...) authentication
 */
class BrevoService {
  constructor() {
    this.brevoApiUrl = 'https://api.brevo.com/v3';
  }

  /**
   * Save Brevo API key for a store
   * @param {string} storeId - Store ID
   * @param {string} apiKey - Brevo API key (xkeysib-...)
   * @param {string} senderName - Sender name
   * @param {string} senderEmail - Sender email
   * @returns {Promise<Object>} Configuration
   */
  async saveConfiguration(storeId, apiKey, senderName, senderEmail) {
    try {
      // Validate API key by testing it
      const isValid = await this.validateApiKey(apiKey);

      if (!isValid) {
        throw new Error('Invalid Brevo API key');
      }

      // Save or update configuration
      const [config] = await BrevoConfiguration.upsert({
        store_id: storeId,
        access_token: apiKey, // Store API key in access_token field
        sender_name: senderName,
        sender_email: senderEmail,
        is_active: true,
        token_expires_at: null, // API keys don't expire
        refresh_token: null // Not used for API keys
      }, {
        returning: true
      });

      return {
        success: true,
        message: 'Brevo API key saved successfully',
        config
      };
    } catch (error) {
      console.error('Save Brevo configuration error:', error.message);
      throw new Error(`Failed to save Brevo configuration: ${error.message}`);
    }
  }

  /**
   * Validate Brevo API key
   * @param {string} apiKey - Brevo API key
   * @returns {Promise<boolean>} Validation result
   */
  async validateApiKey(apiKey) {
    try {
      const response = await axios.get(`${this.brevoApiUrl}/account`, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('API key validation error:', error.response?.status);
      return false;
    }
  }

  /**
   * Get sender information from Brevo
   * @param {string} apiKey - Brevo API key
   * @returns {Promise<Object>} Sender information
   */
  async getSenderInfo(apiKey) {
    try {
      const response = await axios.get(`${this.brevoApiUrl}/account`, {
        headers: {
          'api-key': apiKey,
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
   * Get valid API key for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<string>} Valid API key
   */
  async getValidApiKey(storeId) {
    const config = await BrevoConfiguration.findOne({
      where: { store_id: storeId, is_active: true }
    });

    if (!config || !config.access_token) {
      throw new Error('Brevo not configured for this store');
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
      const apiKey = await this.getValidApiKey(storeId);

      // Test by fetching account info
      const response = await axios.get(`${this.brevoApiUrl}/account`, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Brevo connection is active',
        account: {
          email: response.data.email,
          companyName: response.data.companyName,
          plan: response.data.plan?.type || 'free'
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
    return !!config && !!config.access_token;
  }

  /**
   * Get configuration for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<Object|null>} Configuration object
   */
  async getConfiguration(storeId) {
    return await BrevoConfiguration.findOne({
      where: { store_id: storeId },
      attributes: ['id', 'sender_name', 'sender_email', 'is_active', 'created_at', 'updated_at']
    });
  }
}

module.exports = new BrevoService();
