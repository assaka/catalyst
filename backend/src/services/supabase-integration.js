const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { SupabaseOAuthToken, IntegrationConfig } = require('../models');

class SupabaseIntegration {
  constructor() {
    this.clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
    this.clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;
    this.redirectUri = process.env.SUPABASE_OAUTH_REDIRECT_URI || `${process.env.BACKEND_URL}/api/integrations/supabase/callback`;
    this.authorizationBaseUrl = 'https://app.supabase.com/authorize';
    this.tokenUrl = 'https://api.supabase.com/v1/oauth/token';
  }

  /**
   * Generate OAuth authorization URL for Supabase
   */
  getAuthorizationUrl(storeId, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'projects:read projects:write storage:read storage:write database:read database:write',
      state: JSON.stringify({ storeId, state })
    });

    return `${this.authorizationBaseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, storeId) {
    try {
      const response = await axios.post(this.tokenUrl, {
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

      const { access_token, refresh_token, expires_in, project } = response.data;

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Save token to database
      const tokenData = {
        access_token,
        refresh_token,
        expires_at: expiresAt,
        project_url: project.url,
        anon_key: project.anon_key,
        service_role_key: project.service_role_key,
        database_url: project.database_url,
        storage_url: `${project.url}/storage/v1`,
        auth_url: `${project.url}/auth/v1`
      };

      await SupabaseOAuthToken.createOrUpdate(storeId, tokenData);

      // Also save to IntegrationConfig for consistency
      await IntegrationConfig.createOrUpdate(storeId, 'supabase', {
        projectUrl: project.url,
        anonKey: project.anon_key,
        connected: true,
        connectedAt: new Date()
      });

      return { success: true, project };
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to connect to Supabase: ' + (error.response?.data?.error || error.message));
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(storeId) {
    try {
      const token = await SupabaseOAuthToken.findByStore(storeId);
      if (!token) {
        throw new Error('No Supabase token found for this store');
      }

      const response = await axios.post(this.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Update token in database
      await token.update({
        access_token,
        refresh_token: refresh_token || token.refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000)
      });

      return { success: true, access_token };
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Supabase token: ' + (error.response?.data?.error || error.message));
    }
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getValidToken(storeId) {
    const token = await SupabaseOAuthToken.findByStore(storeId);
    if (!token) {
      throw new Error('Supabase not connected for this store');
    }

    // Check if token is expired
    if (SupabaseOAuthToken.isTokenExpired(token)) {
      const refreshResult = await this.refreshAccessToken(storeId);
      return refreshResult.access_token;
    }

    return token.access_token;
  }

  /**
   * Get Supabase client for a store
   */
  async getSupabaseClient(storeId) {
    const token = await SupabaseOAuthToken.findByStore(storeId);
    if (!token) {
      throw new Error('Supabase not connected for this store');
    }

    // Ensure token is valid
    await this.getValidToken(storeId);

    // Create Supabase client
    const supabaseClient = createClient(
      token.project_url,
      token.anon_key,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      }
    );

    return supabaseClient;
  }

  /**
   * Get Supabase admin client (with service role key)
   */
  async getSupabaseAdminClient(storeId) {
    const token = await SupabaseOAuthToken.findByStore(storeId);
    if (!token) {
      throw new Error('Supabase not connected for this store');
    }

    if (!token.service_role_key) {
      throw new Error('Service role key not available. Please reconnect with admin permissions.');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      token.project_url,
      token.service_role_key,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    return supabaseAdmin;
  }

  /**
   * Test Supabase connection
   */
  async testConnection(storeId) {
    try {
      const client = await this.getSupabaseClient(storeId);
      
      // Try to list buckets as a test
      const { data, error } = await client.storage.listBuckets();
      
      if (error) {
        throw error;
      }

      // Update connection status
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.updateConnectionStatus('success');
      }

      return {
        success: true,
        message: 'Successfully connected to Supabase',
        buckets: data
      };
    } catch (error) {
      // Update connection status
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.updateConnectionStatus('failed', error.message);
      }

      throw new Error('Connection test failed: ' + error.message);
    }
  }

  /**
   * Disconnect Supabase (revoke tokens)
   */
  async disconnect(storeId) {
    try {
      // Delete token from database
      const token = await SupabaseOAuthToken.findByStore(storeId);
      if (token) {
        await token.destroy();
      }

      // Update IntegrationConfig
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.update({
          is_active: false,
          config_data: {
            connected: false,
            disconnectedAt: new Date()
          }
        });
      }

      return { success: true, message: 'Supabase disconnected successfully' };
    } catch (error) {
      console.error('Error disconnecting Supabase:', error);
      throw new Error('Failed to disconnect Supabase: ' + error.message);
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(storeId) {
    try {
      const token = await SupabaseOAuthToken.findByStore(storeId);
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');

      if (!token) {
        return {
          connected: false,
          message: 'Supabase not connected'
        };
      }

      const isExpired = SupabaseOAuthToken.isTokenExpired(token);

      return {
        connected: true,
        projectUrl: token.project_url,
        expiresAt: token.expires_at,
        isExpired,
        connectionStatus: config?.connection_status,
        lastTestedAt: config?.connection_tested_at
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new SupabaseIntegration();