const axios = require('axios');
const ConnectionManager = require('./database/ConnectionManager');

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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Validate API key by testing it
      const validation = await this.validateApiKey(apiKey);

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid Brevo API key');
      }

      // Check if config exists
      const { data: existing, error: fetchError } = await tenantDb
        .from('brevo_configurations')
        .select('*')
        .eq('store_id', storeId)
        .limit(1);

      const configData = {
        store_id: storeId,
        access_token: apiKey, // Store API key in access_token field
        sender_name: senderName,
        sender_email: senderEmail,
        is_active: true,
        token_expires_at: null, // API keys don't expire
        refresh_token: null // Not used for API keys
      };

      let config;
      if (!fetchError && existing && existing.length > 0) {
        // Update existing
        const { data: updated, error: updateError } = await tenantDb
          .from('brevo_configurations')
          .update(configData)
          .eq('store_id', storeId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update configuration: ${updateError.message}`);
        }
        config = updated;
      } else {
        // Insert new
        const { data: inserted, error: insertError } = await tenantDb
          .from('brevo_configurations')
          .insert(configData)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to insert configuration: ${insertError.message}`);
        }
        config = inserted;
      }

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
      console.log('Validating Brevo API key...');
      console.log('API key format:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');

      const response = await axios.get(`${this.brevoApiUrl}/account`, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('Validation successful, status:', response.status);
      return { valid: true };
    } catch (error) {
      console.error('API key validation error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Check for IP whitelist error
      if (error.response?.status === 401 && error.response?.data?.code === 'unauthorized') {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('unrecognised IP address')) {
          // Extract IP address from error message
          const ipMatch = errorMessage.match(/IP address (\d+\.\d+\.\d+\.\d+)/);
          const ipAddress = ipMatch ? ipMatch[1] : 'your server IP';

          return {
            valid: false,
            error: `IP address not whitelisted: ${ipAddress}. Please add this IP to your authorized IPs at https://app.brevo.com/security/authorised_ips`
          };
        }
      }

      return {
        valid: false,
        error: error.response?.data?.message || 'Invalid API key or authentication failed'
      };
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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: configs, error } = await tenantDb
      .from('brevo_configurations')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(1);

    if (error || !configs || configs.length === 0) {
      throw new Error('Brevo not configured for this store');
    }

    const config = configs[0];

    if (!config.access_token) {
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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: configs, error: fetchError } = await tenantDb
        .from('brevo_configurations')
        .select('*')
        .eq('store_id', storeId)
        .limit(1);

      if (!fetchError && configs && configs.length > 0) {
        const { error: updateError } = await tenantDb
          .from('brevo_configurations')
          .update({ is_active: false })
          .eq('store_id', storeId);

        if (updateError) {
          throw new Error(`Failed to disconnect: ${updateError.message}`);
        }
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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: configs, error } = await tenantDb
      .from('brevo_configurations')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(1);

    if (error || !configs || configs.length === 0) {
      return false;
    }

    const config = configs[0];
    return !!config && !!config.access_token;
  }

  /**
   * Get configuration for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<Object|null>} Configuration object
   */
  async getConfiguration(storeId) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: configs, error } = await tenantDb
      .from('brevo_configurations')
      .select('id, sender_name, sender_email, is_active, created_at, updated_at')
      .eq('store_id', storeId)
      .limit(1);

    if (error || !configs || configs.length === 0) {
      return null;
    }

    return configs[0];
  }
}

module.exports = new BrevoService();
