/**
 * Supabase Media Storage OAuth Service
 * Simplified OAuth flow specifically for media storage credentials
 * Stores directly to store_media_storages table
 */

const axios = require('axios');
const crypto = require('crypto');
const ConnectionManager = require('./database/ConnectionManager');
const { encrypt, decrypt } = require('../utils/encryption');

class SupabaseMediaStorageOAuth {
  constructor() {
    this.clientId = process.env.SUPABASE_CLIENT_ID;
    this.clientSecret = process.env.SUPABASE_CLIENT_SECRET;
    this.redirectUri = process.env.SUPABASE_STORAGE_REDIRECT_URI ||
                      `${process.env.BACKEND_URL || 'https://catalyst-backend-fzhu.onrender.com'}/api/supabase/storage/callback`;

    // Minimal scopes needed for media storage only
    this.scopes = 'email profile projects:read storage:read storage:write secrets:read';

    this.isConfigured = !!(this.clientId && this.clientSecret);

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

      // Store credentials in store_media_storages table
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

      console.log('✅ [Exchange] Credentials stored in store_media_storages');

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
   * Store Supabase storage credentials in store_media_storages table
   */
  async storeCredentials(storeId, credentials) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Encrypt sensitive credentials
    const credentialsEncrypted = encrypt(JSON.stringify({
      service_role_key: credentials.service_role_key,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    }));

    // Non-sensitive config data
    const configData = {
      project_url: credentials.project_url,
      storage_url: credentials.storage_url,
      project_id: credentials.project_id,
      project_name: credentials.project_name,
      expires_at: credentials.expires_at
    };

    // Check if Supabase storage already exists for this store
    const { data: existing } = await tenantDb
      .from('store_media_storages')
      .select('id')
      .eq('store_id', storeId)
      .eq('storage_type', 'supabase')
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await tenantDb
        .from('store_media_storages')
        .update({
          credentials_encrypted: credentialsEncrypted,
          config_data: configData,
          storage_name: `Supabase Storage (${credentials.project_name})`,
          bucket_name: 'suprshop-assets',
          endpoint_url: credentials.storage_url,
          is_primary: true,
          is_active: true,
          connection_status: 'connected',
          last_connection_test: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await tenantDb
        .from('store_media_storages')
        .insert({
          store_id: storeId,
          storage_type: 'supabase',
          storage_name: `Supabase Storage (${credentials.project_name})`,
          credentials_encrypted: credentialsEncrypted,
          config_data: configData,
          bucket_name: 'suprshop-assets',
          endpoint_url: credentials.storage_url,
          is_primary: true,
          is_active: true,
          connection_status: 'connected',
          last_connection_test: new Date().toISOString()
        });

      if (error) throw error;
    }

    console.log('💾 [Store] Credentials saved to store_media_storages');
  }

  /**
   * Get Supabase storage credentials from store_media_storages
   */
  async getStorageCredentials(storeId) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('store_media_storages')
      .select('*')
      .eq('store_id', storeId)
      .eq('storage_type', 'supabase')
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Decrypt credentials
    const credentialsDecrypted = JSON.parse(decrypt(data.credentials_encrypted));

    return {
      ...credentialsDecrypted,
      ...data.config_data,
      bucket_name: data.bucket_name,
      endpoint_url: data.endpoint_url
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

      // Check if token is expired
      if (credentials.expires_at && new Date(credentials.expires_at) < new Date()) {
        return { success: false, message: 'Access token expired, reconnection required' };
      }

      return {
        success: true,
        message: 'Supabase storage connection is valid',
        projectUrl: credentials.project_url,
        projectName: credentials.project_name
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Disconnect Supabase storage
   */
  async disconnect(storeId) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { error } = await tenantDb
      .from('store_media_storages')
      .delete()
      .eq('store_id', storeId)
      .eq('storage_type', 'supabase');

    if (error) throw error;

    console.log('🗑️ [Disconnect] Supabase storage removed');
    return { success: true, message: 'Supabase storage disconnected' };
  }
}

module.exports = new SupabaseMediaStorageOAuth();
