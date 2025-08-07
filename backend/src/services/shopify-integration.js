const axios = require('axios');
const crypto = require('crypto');
const ShopifyOAuthToken = require('../models/ShopifyOAuthToken');
const IntegrationConfig = require('../models/IntegrationConfig');

class ShopifyIntegration {
  constructor() {
    this.clientId = process.env.SHOPIFY_CLIENT_ID;
    this.clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SHOPIFY_REDIRECT_URI || 
                      `${process.env.BACKEND_URL || 'https://catalyst-backend-fzhu.onrender.com'}/api/shopify/callback`;
    
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
  }

  /**
   * Generate OAuth authorization URL for Shopify
   */
  getAuthorizationUrl(storeId, shopDomain) {
    if (!this.oauthConfigured) {
      throw new Error('Shopify OAuth is not configured. Please add SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET environment variables.');
    }

    if (!shopDomain || !shopDomain.includes('.myshopify.com')) {
      throw new Error('Valid Shopify domain is required (e.g., your-shop.myshopify.com)');
    }

    const state = this.generateState(storeId);
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scopes,
      redirect_uri: this.redirectUri,
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
  verifyHmac(query, hmac) {
    const message = Object.keys(query)
      .filter(key => key !== 'hmac' && key !== 'signature')
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    const computedHmac = crypto
      .createHmac('sha256', this.clientSecret)
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
      if (!this.oauthConfigured) {
        throw new Error('Shopify OAuth is not configured');
      }

      // Verify state parameter
      const stateData = this.verifyState(stateParam);
      const storeId = stateData.storeId;

      console.log('Exchanging code for token:', {
        code: code.substring(0, 10) + '...',
        shopDomain,
        storeId,
        clientId: this.clientId
      });

      // Exchange code for access token
      const tokenResponse = await axios.post(`https://${shopDomain}/admin/oauth/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code
      });

      const { access_token, scope } = tokenResponse.data;

      if (!access_token) {
        throw new Error('Failed to obtain access token from Shopify');
      }

      // Get shop information
      const shopInfo = await this.getShopInfo(shopDomain, access_token);

      // Create or update OAuth token record
      const tokenData = {
        store_id: storeId,
        shop_domain: shopDomain,
        access_token: access_token,
        scope: scope,
        shop_id: shopInfo.id,
        shop_name: shopInfo.name,
        shop_email: shopInfo.email,
        shop_country: shopInfo.country_code,
        shop_currency: shopInfo.currency,
        shop_timezone: shopInfo.timezone,
        plan_name: shopInfo.plan_name
      };

      const oauthToken = await ShopifyOAuthToken.createOrUpdate(tokenData);

      // Create or update integration config
      const integrationData = {
        shopDomain: shopDomain,
        accessToken: access_token,
        scope: scope,
        shopInfo: shopInfo
      };

      await IntegrationConfig.createOrUpdate(storeId, 'shopify', integrationData);

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
      const response = await axios.get(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data.shop;
    } catch (error) {
      console.error('Error fetching shop info:', error.response?.data || error.message);
      throw new Error('Failed to fetch shop information from Shopify');
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
      
      // Save the token to database
      await ShopifyOAuthToken.createOrUpdate({
        store_id: storeId,
        shop_domain: shopDomain,
        access_token: accessToken,
        scope: 'custom_app_full_access', // Custom apps have full access based on configuration
        shop_id: shopInfo.id,
        shop_name: shopInfo.name,
        shop_email: shopInfo.email,
        shop_country: shopInfo.country_code,
        shop_currency: shopInfo.currency,
        shop_timezone: shopInfo.timezone,
        plan_name: shopInfo.plan_name
      });

      // Also save to integration config
      await IntegrationConfig.createOrUpdate(
        storeId,
        'shopify',
        {
          shop_domain: shopDomain,
          shop_name: shopInfo.name,
          connected: true,
          connection_type: 'direct_access'
        }
      );

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
      const tokenRecord = await ShopifyOAuthToken.findByStore(storeId);
      
      if (!tokenRecord) {
        return {
          success: false,
          message: 'No Shopify connection found for this store. Please connect your Shopify account first.'
        };
      }

      const shopInfo = await this.getShopInfo(tokenRecord.shop_domain, tokenRecord.access_token);
      
      return {
        success: true,
        message: 'Successfully connected to Shopify',
        data: {
          shop_name: shopInfo.name,
          shop_domain: tokenRecord.shop_domain,
          plan_name: shopInfo.plan_name,
          currency: shopInfo.currency
        }
      };

    } catch (error) {
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
      const tokenRecord = await ShopifyOAuthToken.findByStore(storeId);
      
      if (!tokenRecord) {
        return {
          connected: false,
          configured: this.oauthConfigured,
          message: 'No Shopify connection configured'
        };
      }

      // Test if the token is still valid
      const testResult = await this.testConnection(storeId);
      
      return {
        connected: testResult.success,
        configured: this.oauthConfigured,
        shop_domain: tokenRecord.shop_domain,
        shop_name: tokenRecord.shop_name,
        last_connected: tokenRecord.updated_at,
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
    return await ShopifyOAuthToken.findByStore(storeId);
  }

  /**
   * Remove Shopify connection for a store
   */
  async disconnect(storeId) {
    try {
      const tokenRecord = await ShopifyOAuthToken.findByStore(storeId);
      
      if (tokenRecord) {
        await tokenRecord.destroy();
      }

      // Also remove from integration_configs
      const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'shopify');
      if (integrationConfig) {
        await integrationConfig.destroy();
      }

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
}

module.exports = new ShopifyIntegration();