const axios = require('axios');
const crypto = require('crypto');
const IntegrationConfig = require('../models/IntegrationConfig');

/**
 * Shopify Integration Service
 * Handles Shopify OAuth authentication and API integration
 *
 * Configuration stored in integration_configs table with integration_type='shopify'
 */
class ShopifyIntegration {
  constructor() {
    this.clientId = process.env.SHOPIFY_CLIENT_ID;
    this.clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SHOPIFY_REDIRECT_URI ||
                      `${process.env.BACKEND_URL || 'https://backend.dainostore.com'}/api/shopify/callback`;

    // Direct access token support (for custom/private apps)
    this.directAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.directShopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

    // Required scopes for data import
    this.scopes = [
      'read_products',
      'read_product_listings',
      'read_inventory',
      'read_customers',
      'read_orders',
      'read_content',
      'read_themes',
      'read_script_tags',
      'read_fulfillments',
      'read_shipping',
      'read_analytics',
      'read_users',
      'read_price_rules',
      'read_marketing_events',
      'read_resource_feedbacks',
      'read_shopify_payments_payouts'
    ].join(',');

    // Check if OAuth is properly configured OR direct access token is available
    this.oauthConfigured = !!(this.clientId && this.clientSecret);
    this.directAccessConfigured = !!(this.directAccessToken && this.directShopDomain);

    this.integrationType = 'shopify';
  }

  /**
   * Save Shopify app credentials for a store
   */
  async saveAppCredentials(storeId, clientId, clientSecret, redirectUri) {
    try {
      const configData = {
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirectUri,
        appConfigured: true,
        connected: false
      };

      await IntegrationConfig.createOrUpdate(storeId, this.integrationType, configData);

      return { success: true, message: 'App credentials saved successfully' };
    } catch (error) {
      console.error('Error saving app credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get app credentials for a store
   */
  async getAppCredentials(storeId) {
    try {
      const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

      if (config && config.config_data && config.config_data.clientId) {
        return {
          client_id: config.config_data.clientId,
          client_secret: config.config_data.clientSecret,
          redirect_uri: config.config_data.redirectUri
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting app credentials:', error);
      return null;
    }
  }

  /**
   * Generate OAuth authorization URL for Shopify
   */
  async getAuthorizationUrl(storeId, shopDomain) {
    // First try to get store-specific credentials
    const credentials = await this.getAppCredentials(storeId);

    let clientId, redirectUri;

    if (credentials && credentials.client_id) {
      // Use store-specific credentials
      clientId = credentials.client_id;
      redirectUri = credentials.redirect_uri;
    } else if (this.oauthConfigured) {
      // Fall back to environment variables if available
      clientId = this.clientId;
      redirectUri = this.redirectUri;
    } else {
      throw new Error('Shopify app is not configured. Please configure your Shopify app credentials first.');
    }

    if (!shopDomain || !shopDomain.includes('.myshopify.com')) {
      throw new Error('Valid Shopify domain is required (e.g., your-shop.myshopify.com)');
    }

    const state = this.generateState(storeId);
    const params = new URLSearchParams({
      client_id: clientId,
      scope: this.scopes,
      redirect_uri: redirectUri,
      state: state,
      'grant_options[]': 'per-user'
    });

    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Generate a secure state parameter
   */
  generateState(storeId) {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const data = JSON.stringify({ storeId, timestamp, random });
    return Buffer.from(data).toString('base64');
  }

  /**
   * Verify and decode state parameter
   */
  verifyState(state) {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf8');
      const data = JSON.parse(decoded);

      // Check if state is not too old (1 hour)
      const age = Date.now() - parseInt(data.timestamp);
      if (age > 3600000) { // 1 hour in milliseconds
        throw new Error('State parameter has expired');
      }

      return data;
    } catch (error) {
      throw new Error('Invalid state parameter');
    }
  }

  /**
   * Verify HMAC signature from Shopify
   */
  async verifyHmac(query, hmac, storeId = null) {
    const message = Object.keys(query)
      .filter(key => key !== 'hmac' && key !== 'signature')
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    let clientSecret = this.clientSecret;

    // If storeId is provided, try to get store-specific secret
    if (storeId) {
      const credentials = await this.getAppCredentials(storeId);
      if (credentials && credentials.client_secret) {
        clientSecret = credentials.client_secret;
      }
    }

    if (!clientSecret) {
      console.error('No client secret available for HMAC verification');
      return false;
    }

    const computedHmac = crypto
      .createHmac('sha256', clientSecret)
      .update(message)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(computedHmac, 'hex')
    );
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, shopDomain, stateParam) {
    try {
      // Verify state parameter
      const stateData = this.verifyState(stateParam);
      const storeId = stateData.storeId;

      // Get store-specific credentials
      const credentials = await this.getAppCredentials(storeId);

      let clientId, clientSecret;

      if (credentials && credentials.client_id) {
        // Use store-specific credentials
        clientId = credentials.client_id;
        clientSecret = credentials.client_secret;
      } else if (this.oauthConfigured) {
        // Fall back to environment variables
        clientId = this.clientId;
        clientSecret = this.clientSecret;
      } else {
        throw new Error('Shopify OAuth is not configured. Please configure your Shopify app credentials first.');
      }

      console.log('Exchanging code for token:', {
        code: code.substring(0, 10) + '...',
        shopDomain,
        storeId,
        clientId: clientId.substring(0, 10) + '...'
      });

      // Exchange code for access token
      const tokenResponse = await axios.post(`https://${shopDomain}/admin/oauth/access_token`, {
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      });

      const { access_token, scope } = tokenResponse.data;

      if (!access_token) {
        throw new Error('Failed to obtain access token from Shopify');
      }

      // Get shop information
      const shopInfo = await this.getShopInfo(shopDomain, access_token);

      // Store configuration using IntegrationConfig
      const configData = {
        accessToken: access_token,
        shopDomain: shopDomain,
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: credentials?.redirect_uri || this.redirectUri,
        webhookSecret: null,
        shopInfo: {
          shopId: shopInfo.id,
          shopName: shopInfo.name,
          shopEmail: shopInfo.email,
          shopCountry: shopInfo.country_code,
          shopCurrency: shopInfo.currency,
          shopTimezone: shopInfo.timezone,
          planName: shopInfo.plan_name
        },
        connected: true,
        connectionType: 'oauth'
      };

      const config = await IntegrationConfig.createOrUpdateWithKey(
        storeId,
        this.integrationType,
        configData,
        'default',
        {
          displayName: shopInfo.name,
          oauthScopes: scope
        }
      );

      // Update connection status
      if (config && config.id) {
        await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'success');
      }

      console.log('Shopify OAuth completed successfully:', {
        storeId,
        shopDomain,
        shopName: shopInfo.name,
        scope
      });

      return {
        success: true,
        data: {
          shop: shopInfo,
          scope: scope,
          store_id: storeId
        }
      };

    } catch (error) {
      console.error('Error exchanging Shopify code for token:', error);

      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Get shop information using access token
   */
  async getShopInfo(shopDomain, accessToken) {
    try {
      const response = await axios.get(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data.shop;
    } catch (error) {
      console.error('Error fetching shop info:', error.response?.data || error.message);

      // Provide more specific error messages
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          throw new Error('Invalid access token. Please verify your token is correct and has the required scopes.');
        } else if (status === 403) {
          throw new Error('Access denied. Your token may be missing required API scopes.');
        } else if (status === 404) {
          throw new Error('Shop not found. Please verify your shop domain is correct.');
        } else {
          throw new Error(`Shopify API error: ${data?.errors || error.message}`);
        }
      }

      throw new Error('Failed to connect to Shopify. Please check your internet connection and try again.');
    }
  }

  /**
   * Setup direct access token connection (for custom/private apps)
   * This bypasses OAuth and directly saves the token
   */
  async setupDirectAccess(storeId, shopDomain, accessToken) {
    try {
      // Test the token by fetching shop info
      const shopInfo = await this.getShopInfo(shopDomain, accessToken);

      // Store configuration using IntegrationConfig
      const configData = {
        accessToken: accessToken,
        shopDomain: shopDomain,
        shopInfo: {
          shopId: shopInfo.id,
          shopName: shopInfo.name,
          shopEmail: shopInfo.email,
          shopCountry: shopInfo.country_code,
          shopCurrency: shopInfo.currency,
          shopTimezone: shopInfo.timezone,
          planName: shopInfo.plan_name
        },
        connected: true,
        connectionType: 'direct_access'
      };

      const config = await IntegrationConfig.createOrUpdateWithKey(
        storeId,
        this.integrationType,
        configData,
        'default',
        {
          displayName: shopInfo.name,
          oauthScopes: 'custom_app_full_access'
        }
      );

      // Update connection status
      if (config && config.id) {
        await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'success');
      }

      return {
        success: true,
        data: {
          shop: shopInfo,
          connection_type: 'direct_access'
        }
      };
    } catch (error) {
      console.error('Error setting up direct access:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test connection to Shopify store
   */
  async testConnection(storeId) {
    try {
      const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

      if (!config || !config.config_data || !config.config_data.accessToken) {
        return {
          success: false,
          message: 'No Shopify connection found for this store. Please connect your Shopify account first.'
        };
      }

      const shopDomain = config.config_data.shopDomain;
      const accessToken = config.config_data.accessToken;

      const shopInfo = await this.getShopInfo(shopDomain, accessToken);

      // Update connection status
      if (config.id) {
        await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'success');
      }

      return {
        success: true,
        message: 'Successfully connected to Shopify',
        data: {
          shop_name: shopInfo.name,
          shop_domain: shopDomain,
          plan_name: shopInfo.plan_name,
          currency: shopInfo.currency
        }
      };

    } catch (error) {
      // Update connection status to failed
      try {
        const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);
        if (config && config.id) {
          await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'failed', error.message);
        }
      } catch (updateError) {
        // Ignore update errors
      }

      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get connection status for a store
   */
  async getConnectionStatus(storeId) {
    try {
      const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

      if (!config || !config.config_data) {
        return {
          connected: false,
          configured: this.oauthConfigured,
          message: 'No Shopify connection configured'
        };
      }

      // Check if connected
      if (!config.config_data.accessToken || !config.config_data.connected) {
        return {
          connected: false,
          configured: this.oauthConfigured || !!config.config_data.clientId,
          app_configured: !!config.config_data.clientId,
          message: 'Shopify app configured but not connected'
        };
      }

      // Test if the token is still valid
      const testResult = await this.testConnection(storeId);

      return {
        connected: testResult.success,
        configured: true,
        shop_domain: config.config_data.shopDomain,
        shop_name: config.config_data.shopInfo?.shopName,
        connection_status: config.connection_status,
        last_connected: config.updated_at,
        message: testResult.message,
        data: testResult.data
      };

    } catch (error) {
      return {
        connected: false,
        configured: this.oauthConfigured,
        message: `Error checking connection: ${error.message}`
      };
    }
  }

  /**
   * Get token info for a store
   */
  async getTokenInfo(storeId) {
    try {
      const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

      if (!config || !config.config_data) {
        return null;
      }

      // Return a compatible format with the old shopify_oauth_tokens table
      return {
        id: config.id,
        store_id: storeId,
        shop_domain: config.config_data.shopDomain,
        access_token: config.config_data.accessToken,
        scope: config.oauth_scopes,
        shop_id: config.config_data.shopInfo?.shopId,
        shop_name: config.config_data.shopInfo?.shopName,
        shop_email: config.config_data.shopInfo?.shopEmail,
        shop_country: config.config_data.shopInfo?.shopCountry,
        shop_currency: config.config_data.shopInfo?.shopCurrency,
        shop_timezone: config.config_data.shopInfo?.shopTimezone,
        plan_name: config.config_data.shopInfo?.planName,
        created_at: config.created_at,
        updated_at: config.updated_at
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Remove Shopify connection for a store
   */
  async disconnect(storeId) {
    try {
      await IntegrationConfig.deactivate(storeId, this.integrationType);

      return {
        success: true,
        message: 'Shopify connection removed successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to disconnect: ${error.message}`
      };
    }
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(storeId) {
    const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

    if (!config || !config.config_data || !config.config_data.accessToken) {
      throw new Error('Shopify not configured for this store');
    }

    return config.config_data.accessToken;
  }

  /**
   * Get shop domain for API calls
   */
  async getShopDomain(storeId) {
    const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

    if (!config || !config.config_data || !config.config_data.shopDomain) {
      throw new Error('Shopify not configured for this store');
    }

    return config.config_data.shopDomain;
  }
}

module.exports = new ShopifyIntegration();
