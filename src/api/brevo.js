import apiClient from './client';

/**
 * Brevo API Helper
 * Handles Brevo OAuth and email service configuration
 */

class BrevoAPI {
  /**
   * Initiate Brevo OAuth flow
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} OAuth URL
   */
  async initiateOAuth(storeId) {
    try {
      const response = await apiClient.get(`brevo/oauth/init?store_id=${storeId}`);
      return response;
    } catch (error) {
      console.error('Brevo OAuth init error:', error);
      throw error;
    }
  }

  /**
   * Get Brevo connection status for a store
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Connection status
   */
  async getConnectionStatus(storeId) {
    try {
      const response = await apiClient.get(`brevo/oauth/status?store_id=${storeId}`);
      return response;
    } catch (error) {
      console.error('Brevo status check error:', error);
      throw error;
    }
  }

  /**
   * Disconnect Brevo from store
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnect(storeId) {
    try {
      const response = await apiClient.post('brevo/oauth/disconnect', {
        store_id: storeId
      });
      return response;
    } catch (error) {
      console.error('Brevo disconnect error:', error);
      throw error;
    }
  }

  /**
   * Test Brevo connection
   * @param {string} storeId - Store ID
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Test result
   */
  async testConnection(storeId, testEmail) {
    try {
      const response = await apiClient.post('brevo/test-connection', {
        store_id: storeId,
        test_email: testEmail
      });
      return response;
    } catch (error) {
      console.error('Brevo test connection error:', error);
      throw error;
    }
  }

  /**
   * Get email sending statistics
   * @param {string} storeId - Store ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Email statistics
   */
  async getEmailStatistics(storeId, days = 30) {
    try {
      const response = await apiClient.get(`brevo/email-statistics?store_id=${storeId}&days=${days}`);
      return response;
    } catch (error) {
      console.error('Get email statistics error:', error);
      throw error;
    }
  }
}

export default new BrevoAPI();
