const axios = require('axios');
const crypto = require('crypto');
const ConnectionManager = require('./database/ConnectionManager');
const { getMasterStore } = require('../utils/dbHelpers');

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
   * Save Shopify app credentials for a store
   */
  async saveAppCredentials(storeId, clientId, clientSecret, redirectUri) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Check if a record exists
      const { data: existingToken } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingToken) {
        // Update existing record with credentials
        await tenantDb
          .from('shopify_oauth_tokens')
          .update({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingToken.id);
      } else {
        // Create new record with just credentials (no token yet)
        await tenantDb
          .from('shopify_oauth_tokens')
          .insert({
            store_id: storeId,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            shop_domain: 'pending', // Will be updated during OAuth
            access_token: 'pending', // Will be updated during OAuth
            scope: 'pending' // Will be updated during OAuth
          });
      }

      // Also save to integration config
      const { data: existingConfig } = await tenantDb
        .from('integration_configs')
        .select('*')
        .eq('store_id', storeId)
        .eq('integration_type', 'shopify')
        .maybeSingle();

      const configData = {
        app_configured: true,
        client_id: clientId,
        redirect_uri: redirectUri
      };

      if (existingConfig) {
        await tenantDb
          .from('integration_configs')
          .update({
            config_data: configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
      } else {
        await tenantDb
          .from('integration_configs')
          .insert({
            store_id: storeId,
            integration_type: 'shopify',
            config_data: configData,
            is_active: true
          });
      }

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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokenRecord, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Shopify token:', error);
        return null;
      }

      if (tokenRecord && tokenRecord.client_id) {
        return {
          client_id: tokenRecord.client_id,
          client_secret: tokenRecord.client_secret,
          redirect_uri: tokenRecord.redirect_uri
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
        plan_name: shopInfo.plan_name,
        updated_at: new Date().toISOString()
      };

      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Check if token exists
      const { data: existingToken } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingToken) {
        await tenantDb
          .from('shopify_oauth_tokens')
          .update(tokenData)
          .eq('id', existingToken.id);
      } else {
        await tenantDb
          .from('shopify_oauth_tokens')
          .insert(tokenData);
      }

      // Create or update integration config
      const integrationData = {
        shopDomain: shopDomain,
        accessToken: access_token,
        scope: scope,
        shopInfo: shopInfo
      };

      const { data: existingConfig } = await tenantDb
        .from('integration_configs')
        .select('*')
        .eq('store_id', storeId)
        .eq('integration_type', 'shopify')
        .maybeSingle();

      if (existingConfig) {
        await tenantDb
          .from('integration_configs')
          .update({
            config_data: integrationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
      } else {
        await tenantDb
          .from('integration_configs')
          .insert({
            store_id: storeId,
            integration_type: 'shopify',
            config_data: integrationData,
            is_active: true
          });
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

      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Save the token to database
      const tokenData = {
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
        plan_name: shopInfo.plan_name,
        updated_at: new Date().toISOString()
      };

      const { data: existingToken } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingToken) {
        await tenantDb
          .from('shopify_oauth_tokens')
          .update(tokenData)
          .eq('id', existingToken.id);
      } else {
        await tenantDb
          .from('shopify_oauth_tokens')
          .insert(tokenData);
      }

      // Also save to integration config
      const configData = {
        shop_domain: shopDomain,
        shop_name: shopInfo.name,
        connected: true,
        connection_type: 'direct_access'
      };

      const { data: existingConfig } = await tenantDb
        .from('integration_configs')
        .select('*')
        .eq('store_id', storeId)
        .eq('integration_type', 'shopify')
        .maybeSingle();

      if (existingConfig) {
        await tenantDb
          .from('integration_configs')
          .update({
            config_data: configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
      } else {
        await tenantDb
          .from('integration_configs')
          .insert({
            store_id: storeId,
            integration_type: 'shopify',
            config_data: configData,
            is_active: true
          });
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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokenRecord, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error || !tokenRecord) {
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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokenRecord, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error || !tokenRecord) {
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
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokenRecord, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching token info:', error);
        return null;
      }

      return tokenRecord;
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
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Remove shopify_oauth_tokens
      await tenantDb
        .from('shopify_oauth_tokens')
        .delete()
        .eq('store_id', storeId);

      // Also remove from integration_configs
      await tenantDb
        .from('integration_configs')
        .delete()
        .eq('store_id', storeId)
        .eq('integration_type', 'shopify');

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