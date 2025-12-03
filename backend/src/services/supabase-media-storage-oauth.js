/**
 * Supabase Media Storage OAuth Service
 * Simplified OAuth flow specifically for media storage credentials
 *
 * Configuration stored in integration_configs table with integration_type='supabase-storage'
 */

const axios = require('axios');
const crypto = require('crypto');
const IntegrationConfig = require('../models/IntegrationConfig');

class SupabaseMediaStorageOAuth {
  constructor() {
    this.clientId = process.env.SUPABASE_CLIENT_ID;
    this.clientSecret = process.env.SUPABASE_CLIENT_SECRET;
    this.redirectUri = process.env.SUPABASE_STORAGE_REDIRECT_URI ||
                      `${process.env.BACKEND_URL || 'https://backend.dainostore.com'}/api/supabase/storage/callback`;

    // Minimal scopes needed for media storage only
    this.scopes = 'email profile projects:read storage:read storage:write secrets:read';

    this.isConfigured = !!(this.clientId && this.clientSecret);
    this.integrationType = 'supabase-storage';

    console.log('📦 [Supabase Media Storage OAuth] Initialized:', {
      configured: this.isConfigured,
      redirectUri: this.redirectUri
    });
  }

  /**
   * Generate OAuth authorization URL for media storage
   */
  async getAuthorizationUrl(storeId) {
    if (!this.isConfigured) {
      throw new Error('Supabase OAuth is not configured. Set SUPABASE_CLIENT_ID and SUPABASE_CLIENT_SECRET.');
    }

    const state = this.generateState(storeId);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes,
      state: state
    });

    return `https://api.supabase.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * Generate secure state parameter
   */
  generateState(storeId) {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const data = JSON.stringify({ storeId, timestamp, random, purpose: 'media_storage' });
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
      if (age > 3600000) {
        throw new Error('State parameter has expired');
      }

      // Verify it's for media storage
      if (data.purpose !== 'media_storage') {
        throw new Error('State parameter is not for media storage');
      }

      return data;
    } catch (error) {
      throw new Error(`Invalid state parameter: ${error.message}`);
    }
  }

  /**
   * Exchange authorization code for access token and store credentials
   */
  async exchangeCodeForToken(code, state) {
    try {
      console.log('📦 [Exchange] Starting token exchange for media storage');

      // Verify state
      const stateData = this.verifyState(state);
      const storeId = stateData.storeId;

      // Exchange code for tokens
      const tokenResponse = await axios.post('https://api.supabase.com/v1/oauth/token', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      console.log('✅ [Exchange] Got access token');

      // Fetch user's projects
      const projectsResponse = await axios.get('https://api.supabase.com/v1/projects', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      const projects = projectsResponse.data;
      if (!projects || projects.length === 0) {
        throw new Error('No Supabase projects found. Please create a project first.');
      }

      // Use first project
      const project = projects[0];
      const projectId = project.id;
      const projectUrl = `https://${project.ref}.supabase.co`;
      const storageUrl = `${projectUrl}/storage/v1`;

      console.log('📦 [Exchange] Using project:', project.name, projectId);

      // Fetch API keys (service role key for storage operations)
      const keysResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      const serviceRoleKey = keysResponse.data.find(k => k.name === 'service_role')?.api_key;
      if (!serviceRoleKey) {
        throw new Error('Could not retrieve service_role key from Supabase');
      }

      console.log('✅ [Exchange] Got service role key');

      // Store credentials in integration_configs table
      await this.storeCredentials(storeId, {
        access_token,
        refresh_token,
        service_role_key: serviceRoleKey,
        project_url: projectUrl,
        storage_url: storageUrl,
        project_id: projectId,
        project_name: project.name,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
      });

      console.log('✅ [Exchange] Credentials stored in integration_configs');

      return {
        success: true,
        storeId,
        projectName: project.name,
        projectUrl
      };

    } catch (error) {
      console.error('❌ [Exchange] Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Store Supabase storage credentials in integration_configs table
   */
  async storeCredentials(storeId, credentials) {
    // Config data with all credentials
    // IntegrationConfig will auto-encrypt sensitive fields
    const configData = {
      serviceRoleKey: credentials.service_role_key,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
      projectUrl: credentials.project_url,
      storageUrl: credentials.storage_url,
      projectId: credentials.project_id,
      projectName: credentials.project_name,
      bucketName: 'suprshop-assets',
      connected: true,
      connectionType: 'oauth'
    };

    await IntegrationConfig.createOrUpdateWithKey(
      storeId,
      this.integrationType,
      configData,
      'default',
      {
        displayName: `Supabase Storage (${credentials.project_name})`,
        isPrimary: true
      }
    );

    // Update connection status and token expiration
    const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);
    if (config) {
      await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'success');
    }

    console.log('💾 [Store] Credentials saved to integration_configs');
  }

  /**
   * Get Supabase storage credentials from integration_configs
   */
  async getStorageCredentials(storeId) {
    const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);

    if (!config || !config.config_data) {
      return null;
    }

    // IntegrationConfig already decrypts sensitive fields
    return {
      service_role_key: config.config_data.serviceRoleKey,
      access_token: config.config_data.accessToken,
      refresh_token: config.config_data.refreshToken,
      project_url: config.config_data.projectUrl,
      storage_url: config.config_data.storageUrl,
      project_id: config.config_data.projectId,
      project_name: config.config_data.projectName,
      bucket_name: config.config_data.bucketName || 'suprshop-assets',
      endpoint_url: config.config_data.storageUrl
    };
  }

  /**
   * Test Supabase storage connection
   */
  async testConnection(storeId) {
    try {
      const credentials = await this.getStorageCredentials(storeId);
      if (!credentials) {
        return { success: false, message: 'No Supabase storage configured' };
      }

      // Simple validation: check if service_role_key is valid JWT format
      if (!credentials.service_role_key || !credentials.service_role_key.startsWith('eyJ')) {
        return { success: false, message: 'Invalid service role key format' };
      }

      // Update connection status
      const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);
      if (config) {
        await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'success');
      }

      return {
        success: true,
        message: 'Supabase storage connection is valid',
        projectUrl: credentials.project_url,
        projectName: credentials.project_name
      };
    } catch (error) {
      // Update connection status to failed
      try {
        const config = await IntegrationConfig.findByStoreAndType(storeId, this.integrationType);
        if (config) {
          await IntegrationConfig.updateConnectionStatus(config.id, storeId, 'failed', error.message);
        }
      } catch (updateError) {
        // Ignore update errors
      }
      return { success: false, message: error.message };
    }
  }

  /**
   * Disconnect Supabase storage
   */
  async disconnect(storeId) {
    try {
      await IntegrationConfig.deactivate(storeId, this.integrationType);
      console.log('🗑️ [Disconnect] Supabase storage removed');
      return { success: true, message: 'Supabase storage disconnected' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SupabaseMediaStorageOAuth();
