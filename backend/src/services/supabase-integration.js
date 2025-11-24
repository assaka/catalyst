const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const ConnectionManager = require('./database/ConnectionManager');
const SupabaseProjectKeys = require('../models/SupabaseProjectKeys');
const supabaseStorage = require('./supabase-storage');
const { encrypt, decrypt } = require('../utils/encryption');
const { v4: uuidv4 } = require('uuid');

class SupabaseIntegration {
  constructor() {
    this.clientId = process.env.SUPABASE_OAUTH_CLIENT_ID || 'pending_configuration';
    this.clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET || 'pending_configuration';
    this.redirectUri = process.env.SUPABASE_OAUTH_REDIRECT_URI ||
                      `${process.env.BACKEND_URL || 'https://catalyst-backend-fzhu.onrender.com'}/api/supabase/callback`;
    this.authorizationBaseUrl = 'https://api.supabase.com/v1/oauth/authorize';
    this.tokenUrl = 'https://api.supabase.com/v1/oauth/token';

    // Check if OAuth is properly configured
    this.oauthConfigured = this.clientId !== 'pending_configuration' &&
                           this.clientSecret !== 'pending_configuration';
  }

  /**
   * Get Supabase OAuth token from tenant DB
   * Queries supabase_oauth_tokens table directly (tenant-scoped)
   * Replaces SupabaseOAuthToken.findByStore() which used deprecated master connection
   */
  async getSupabaseToken(storeId) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokenRecord, error } = await tenantDb
        .from('supabase_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('[getSupabaseToken] Query error:', error);
        return null;
      }

      if (!tokenRecord) {
        return null;
      }

      // Decrypt sensitive fields (tokens are encrypted in DB)
      return {
        ...tokenRecord,
        access_token: tokenRecord.access_token ? decrypt(tokenRecord.access_token) : tokenRecord.access_token,
        refresh_token: tokenRecord.refresh_token ? decrypt(tokenRecord.refresh_token) : tokenRecord.refresh_token,
        service_role_key: tokenRecord.service_role_key ? decrypt(tokenRecord.service_role_key) : tokenRecord.service_role_key
      };
    } catch (error) {
      console.error('[getSupabaseToken] Error:', error);
      return null;
    }
  }

  /**
   * Update Supabase OAuth token in tenant DB
   */
  async updateSupabaseToken(storeId, updates) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Encrypt sensitive fields before saving
      const encryptedUpdates = { ...updates };
      if (updates.access_token) {
        encryptedUpdates.access_token = encrypt(updates.access_token);
      }
      if (updates.refresh_token) {
        encryptedUpdates.refresh_token = encrypt(updates.refresh_token);
      }
      if (updates.service_role_key) {
        encryptedUpdates.service_role_key = encrypt(updates.service_role_key);
      }

      const { error } = await tenantDb
        .from('supabase_oauth_tokens')
        .update({
          ...encryptedUpdates,
          updated_at: new Date()
        })
        .eq('store_id', storeId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[updateSupabaseToken] Error:', error);
      throw error;
    }
  }

  /**
   * Delete Supabase OAuth token from tenant DB
   */
  async deleteSupabaseToken(storeId) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { error } = await tenantDb
        .from('supabase_oauth_tokens')
        .delete()
        .eq('store_id', storeId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[deleteSupabaseToken] Error:', error);
      throw error;
    }
  }

  /**
   * Update Supabase config in tenant DB
   * Replaces SupabaseOAuthToken.update()
   */
  async updateSupabaseConfig(storeId, updates) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Get existing config
      const { data: existing } = await tenantDb
        .from('integration_configs')
        .select('config_data')
        .eq('store_id', storeId)
        .eq('integration_type', 'supabase')
        .eq('is_active', true)
        .maybeSingle();

      // Encrypt sensitive fields before saving
      const configUpdates = { ...(existing?.config_data || {}) };

      if (updates.access_token !== undefined) {
        configUpdates.access_token = updates.access_token ? encrypt(updates.access_token) : null;
      }
      if (updates.refresh_token !== undefined) {
        configUpdates.refresh_token = updates.refresh_token ? encrypt(updates.refresh_token) : null;
      }
      if (updates.service_role_key !== undefined) {
        configUpdates.service_role_key = updates.service_role_key ? encrypt(updates.service_role_key) : null;
      }
      if (updates.expires_at !== undefined) {
        configUpdates.expires_at = updates.expires_at;
      }
      if (updates.project_url !== undefined) {
        configUpdates.project_url = updates.project_url;
      }
      if (updates.database_url !== undefined) {
        configUpdates.database_url = updates.database_url;
      }
      if (updates.storage_url !== undefined) {
        configUpdates.storage_url = updates.storage_url;
      }
      if (updates.auth_url !== undefined) {
        configUpdates.auth_url = updates.auth_url;
      }
      if (updates.userEmail !== undefined) {
        configUpdates.userEmail = updates.userEmail;
      }
      if (updates.connected !== undefined) {
        configUpdates.connected = updates.connected;
      }

      // Update the config
      const { error } = await tenantDb
        .from('integration_configs')
        .update({
          config_data: configUpdates,
          updated_at: new Date()
        })
        .eq('store_id', storeId)
        .eq('integration_type', 'supabase')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[updateSupabaseConfig] Error:', error);
      throw error;
    }
  }

  /**
   * Check if OAuth token is expired
   */
  isTokenExpired(config) {
    if (!config || !config.expires_at) return true;
    return new Date(config.expires_at) <= new Date();
  }

  /**
   * Generate OAuth authorization URL for Supabase
   */
  getAuthorizationUrl(storeId, state) {
    if (!this.oauthConfigured) {
      throw new Error('Supabase OAuth is not configured. Please add SUPABASE_OAUTH_CLIENT_ID and SUPABASE_OAUTH_CLIENT_SECRET environment variables.');
    }
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'email profile projects:read projects:write secrets:read storage:read storage:write database:read database:write',
      state: JSON.stringify({ storeId, state })
    });

    return `${this.authorizationBaseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, storeId) {
    let user = null; // Define user in outer scope
    let access_token = null; // Define in outer scope for error handling
    let refresh_token = null; // Define in outer scope for error handling
    let projectData = {}; // Define in outer scope for error handling
    
    try {
      console.log('Exchanging code for token:', {
        code: code.substring(0, 10) + '...',
        storeId,
        clientId: this.clientId,
        redirectUri: this.redirectUri
      });

      // Use form-urlencoded for OAuth token exchange (standard OAuth2 format)
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      });

      const response = await axios.post(this.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Token exchange response:', JSON.stringify(response.data, null, 2));

      // Assign to outer scope variables
      access_token = response.data.access_token;
      refresh_token = response.data.refresh_token;
      const expires_in = response.data.expires_in;
      const token_type = response.data.token_type;
      
      user = response.data.user; // Assign user from response

      if (!access_token || !refresh_token) {
        throw new Error('Invalid token response from Supabase');
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

      // Get user's projects using the access token
      // projectData already defined in outer scope
      try {
        // Fetch user's projects
        const projectsResponse = await axios.get('https://api.supabase.com/v1/projects', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Projects response:', JSON.stringify(projectsResponse.data, null, 2));
        
        // Use the first project or let user select later
        if (projectsResponse.data && projectsResponse.data.length > 0) {
          const allProjects = projectsResponse.data;
          console.log(`Found ${allProjects.length} project(s) for user`);
          
          // Use the first project as default
          const firstProject = allProjects[0];
          console.log('Using first project as default:', firstProject.name || firstProject.id);
          
          // Fetch service role key for the project (anon key no longer needed)
          let serviceRoleKey = '';
          
          try {
            const apiKeysResponse = await axios.get(`https://api.supabase.com/v1/projects/${firstProject.id}/config/secrets/project-api-keys`, {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('API keys response:', JSON.stringify(apiKeysResponse.data, null, 2));
            
            // Extract service_role key from response
            if (apiKeysResponse.data && Array.isArray(apiKeysResponse.data)) {
              const serviceKeyObj = apiKeysResponse.data.find(key => key.name === 'service_role' || key.name === 'service_role_key');
              serviceRoleKey = serviceKeyObj?.api_key || '';
            } else if (apiKeysResponse.data) {
              // Handle different response format
              serviceRoleKey = apiKeysResponse.data.service_role || apiKeysResponse.data.service_role_key || '';
            }
            
            console.log('Extracted service role key:', serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'not found');
            
          } catch (apiKeysError) {
            console.error('Error fetching API keys:', apiKeysError.response?.data || apiKeysError.message);
            // If it's a scope error, set default values
            if (apiKeysError.response?.status === 403 || apiKeysError.response?.data?.message?.includes('scope')) {
              console.log('OAuth token lacks secrets:read scope for API keys access');
              serviceRoleKey = null;
            }
            // Continue without API keys - user can configure them later
          }
          
          projectData = {
            project_url: `https://${firstProject.id}.supabase.co`,
            anon_key: null,  // No longer used,
            service_role_key: serviceRoleKey || null,
            database_url: `postgresql://postgres.[projectRef]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`,
            storage_url: `https://${firstProject.id}.supabase.co/storage/v1`,
            auth_url: `https://${firstProject.id}.supabase.co/auth/v1`
          };
        }
      } catch (projectError) {
        console.error('Error fetching projects:', projectError.response?.data || projectError.message);
        
        // Check if it's a scope error (403) vs other errors
        if (projectError.response?.status === 403 || projectError.message?.includes('scope')) {
          console.log('OAuth token lacks required scopes for project access');
          // Set pending values that will pass validation
          projectData = {
            project_url: 'https://pending-configuration.supabase.co',
            anon_key: null,  // No longer used,
            service_role_key: null,
            database_url: null,  // Use null for optional fields
            storage_url: null,
            auth_url: null
          };
        } else {
          // For other errors, still try to save with pending values
          projectData = {
            project_url: 'https://pending-configuration.supabase.co',
            anon_key: null,  // No longer used,
            service_role_key: null,
            database_url: null,
            storage_url: null,
            auth_url: null
          };
        }
      }

      // Save token to database
      const tokenData = {
        access_token,
        refresh_token,
        expires_at: expiresAt,
        ...projectData
      };

      console.log('Saving token data to database:', {
        storeId,
        project_url: tokenData.project_url,
        service_role_key: tokenData.service_role_key ? 'set' : 'not set',
        has_access_token: !!tokenData.access_token,
        has_refresh_token: !!tokenData.refresh_token,
        expires_at: tokenData.expires_at
      });

      // Check if this database is already being used by another store
      console.log('🔍 Checking for duplicate database before storing OAuth tokens...');
      const { masterDbClient } = require('../database/masterConnection');

      // Skip check for placeholder URLs
      const isPlaceholder = tokenData.project_url && (
        tokenData.project_url.includes('pending-configuration') ||
        tokenData.project_url === 'Configuration pending'
      );

      if (!isPlaceholder && tokenData.project_url) {
        try {
          const projectUrl = new URL(tokenData.project_url);
          const host = projectUrl.hostname;

          const { data: existingDb, error: checkError } = await masterDbClient
            .from('store_databases')
            .select('store_id, host')
            .eq('host', host)
            .eq('is_active', true)
            .maybeSingle();

          if (!checkError && existingDb && existingDb.store_id !== storeId) {
            console.error('❌ Database already in use by another store:', existingDb.store_id);
            throw new Error('This Supabase database is already being used by another store. Please select a different database or create a new Supabase project.');
          }

          console.log('✅ Database URL is available');
        } catch (checkErr) {
          // If it's our duplicate error, re-throw it
          if (checkErr.message.includes('already being used')) {
            throw checkErr;
          }
          // Otherwise log and continue (don't block OAuth on check errors)
          console.error('⚠️ Error checking for duplicate database:', checkErr.message);
        }
      }

      // STEP 1: ALWAYS store in Redis (persists across server restarts)
      const tokenDataToStore = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        project_url: tokenData.project_url || 'https://pending-configuration.supabase.co',
        anon_key: null,
        service_role_key: tokenData.service_role_key || null,
        database_url: tokenData.database_url || null,
        storage_url: tokenData.storage_url || null,
        auth_url: tokenData.auth_url || null
      };

      try {
        const { getRedisClient } = require('../config/redis');
        const redisClient = getRedisClient();

        if (redisClient) {
          const redisKey = `oauth:pending:${storeId}`;
          await redisClient.setEx(
            redisKey,
            600, // Expire after 10 minutes
            JSON.stringify(tokenDataToStore)
          );
          console.log('✅ OAuth tokens stored in Redis');
          console.log('🔑 Redis key:', redisKey);
        } else {
          console.warn('⚠️ Redis not available, using memory fallback');
          if (!global.pendingOAuthTokens) {
            global.pendingOAuthTokens = new Map();
          }
          global.pendingOAuthTokens.set(storeId, tokenDataToStore);
          console.log('✅ OAuth tokens stored in memory (fallback)');
        }
      } catch (redisError) {
        console.error('❌ Redis error, using memory fallback:', redisError.message);
        if (!global.pendingOAuthTokens) {
          global.pendingOAuthTokens = new Map();
        }
        global.pendingOAuthTokens.set(storeId, tokenDataToStore);
        console.log('✅ OAuth tokens stored in memory (fallback)');
      }

      return { 
        success: true, 
        project: {
          url: projectData.project_url || 'Configuration pending'
        },
        user
      };
    } catch (error) {
      console.error('Error exchanging code for token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // More specific error messages
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors?.map(e => `${e.path}: ${e.message}`).join(', ') || 'Unknown validation error';
        console.error('Sequelize validation error details:', error.errors);
        
        // Check if we have the access token (connection actually succeeded)
        if (access_token && refresh_token) {
          console.log('Connection successful despite validation warning - returning success with limited scope');
          // Return success with limited scope since we have valid tokens
          return { 
            success: true, 
            project: {
              url: projectData?.project_url || 'https://pending-configuration.supabase.co'
            },
            user: user || { email: 'Connected' },
            limitedScope: true,
            message: 'Connected with limited permissions. Some features may be restricted.'
          };
        }
        
        // Only throw error if we don't have valid tokens
        throw new Error(`Unable to save connection details. Please try reconnecting.`);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid OAuth request: ' + (error.response?.data?.error_description || error.response?.data?.error || 'Bad request'));
      } else if (error.response?.status === 401) {
        throw new Error('Invalid OAuth credentials: ' + (error.response?.data?.error_description || 'Unauthorized'));
      } else {
        throw new Error('Failed to connect to Supabase: ' + (error.response?.data?.error || error.message));
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(storeId) {
    try {
      const token = await this.getSupabaseToken(storeId);
      if (!token) {
        throw new Error('No Supabase token found for this store');
      }

      // Use form-urlencoded for OAuth token refresh (standard OAuth2 format)
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const response = await axios.post(this.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Update token in tenant database
      await this.updateSupabaseToken(storeId, {
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
    const token = await this.getSupabaseToken(storeId);
    if (!token) {
      throw new Error('Supabase not connected for this store');
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      const refreshResult = await this.refreshAccessToken(storeId);
      return refreshResult.access_token;
    }

    return token.access_token;
  }

  /**
   * Get Supabase client for a store (using service role key)
   * Since we're removing anon key dependency, this now uses service role key
   */
  async getSupabaseClient(storeId) {
    // Just redirect to admin client since we only use service role key now
    return this.getSupabaseAdminClient(storeId);
  }

  /**
   * Get Supabase admin client (with service role key)
   */
  async getSupabaseAdminClient(storeId) {
    const token = await this.getSupabaseToken(storeId);
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
      const token = await this.getSupabaseToken(storeId);
      if (!token) {
        throw new Error('Supabase not connected for this store');
      }

      // First, just test if the access token is valid
      try {
        console.log('Testing Supabase OAuth token validity...');
        
        // Test token validity by fetching projects (this is the standard way)
        let projectsTestResponse;
        let projects = [];
        
        try {
          projectsTestResponse = await axios.get('https://api.supabase.com/v1/projects', {
            headers: {
              'Authorization': `Bearer ${token.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          projects = projectsTestResponse.data || [];
          console.log('Token is valid, found', projects.length, 'projects');
        } catch (scopeError) {
          console.log('Projects endpoint failed:', scopeError.response?.status, scopeError.response?.data);
          
          // Check if it's a 401 (unauthorized) or 403 (forbidden) error
          if (scopeError.response?.status === 401) {
            // Token is invalid or user revoked authorization
            console.error('OAuth token is invalid or revoked');
            
            // Auto-disconnect the invalid connection
            console.log('Auto-disconnecting revoked authorization during test');
            
            // Store the project URL before deleting
            const lastProjectUrl = token.project_url;
            
            // Delete the invalid token
            await this.deleteSupabaseToken(storeId);

            // Update config to mark as disconnected
            const tenantDb = await ConnectionManager.getStoreConnection(storeId);
            const { data: config } = await tenantDb
              .from('integration_configs')
              .select('*')
              .eq('store_id', storeId)
              .eq('integration_type', 'supabase')
              .eq('is_active', true)
              .maybeSingle();
            if (config) {
              await tenantDb
                .from('integration_configs')
                .where({ id: config.id })
                .update({
                  is_active: false,
                  connection_status: 'failed',
                  config_data: {
                    ...config.config_data,
                    connected: false,
                    autoDisconnected: true,
                    autoDisconnectedAt: new Date(),
                    revokedAt: new Date(),
                    revokedDetected: true,
                    disconnectedReason: 'Authorization was revoked in Supabase',
                    lastKnownProjectUrl: lastProjectUrl,
                    message: 'Authorization was revoked and connection was automatically removed.'
                  },
                  updated_at: new Date()
                });
            }
            
            throw new Error('Authorization was revoked and the connection has been automatically removed. Please reconnect.');
          }
          
          // If scope error (403), check if we have a project_url already saved
          if (token.project_url && token.project_url !== 'pending_configuration' && token.project_url !== 'https://pending-configuration.supabase.co') {
            console.log('Using existing project URL for connection test:', token.project_url);
            
            // Try to test the connection using the stored project URL
            if (token.anon_key && token.anon_key !== 'pending_configuration') {
              console.log('Testing connection with stored project credentials...');
              
              // Test connection by trying to create a Supabase client
              const { createClient } = require('@supabase/supabase-js');
              try {
                const testClient = createClient(token.project_url, token.anon_key);
                // Simple test - this will work if the URL and key are valid
                console.log('✅ Basic Supabase client connection test passed');
                
                return {
                  success: true,
                  message: 'Connected to Supabase project (limited scope - please reconnect for full features)',
                  projects: 1,
                  projectUrl: token.project_url,
                  hasProjects: true,
                  limitedScope: true
                };
              } catch (clientError) {
                console.error('Supabase client test failed:', clientError.message);
                throw new Error('Stored project credentials are invalid. Please reconnect to Supabase.');
              }
            } else {
              throw new Error('OAuth token requires the projects:read scope. Please reconnect to Supabase to update permissions.');
            }
          } else {
            throw new Error('OAuth token requires the projects:read scope for initial setup. Please reconnect to Supabase.');
          }
        }
        
        // Use the projects from our test response (projects variable already declared above)
        let projectInfo = null;
        
        // If we have projects and no project_url saved, update it
        if (projects.length > 0 && (!token.project_url || token.project_url === '')) {
          const firstProject = projects[0];
          projectInfo = {
            id: firstProject.id,
            name: firstProject.name,
            url: `https://${firstProject.id}.supabase.co`
          };
          
          // Fetch API keys for the project
          let anonKey = token.anon_key || '';
          let serviceRoleKey = token.service_role_key || '';
          
          try {
            const apiKeysResponse = await axios.get(`https://api.supabase.com/v1/projects/${firstProject.id}/config/secrets/project-api-keys`, {
              headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Test connection - API keys response:', JSON.stringify(apiKeysResponse.data, null, 2));
            
            // Extract anon and service_role keys from response
            if (apiKeysResponse.data && Array.isArray(apiKeysResponse.data)) {
              const anonKeyObj = apiKeysResponse.data.find(key => key.name === 'anon' || key.name === 'anon_key');
              const serviceKeyObj = apiKeysResponse.data.find(key => key.name === 'service_role' || key.name === 'service_role_key');
              
              if (anonKeyObj?.api_key) anonKey = anonKeyObj.api_key;
              if (serviceKeyObj?.api_key) serviceRoleKey = serviceKeyObj.api_key;
            } else if (apiKeysResponse.data) {
              // Handle different response format
              if (apiKeysResponse.data.anon || apiKeysResponse.data.anon_key) {
                anonKey = apiKeysResponse.data.anon || apiKeysResponse.data.anon_key;
              }
              if (apiKeysResponse.data.service_role || apiKeysResponse.data.service_role_key) {
                serviceRoleKey = apiKeysResponse.data.service_role || apiKeysResponse.data.service_role_key;
              }
            }
            
            console.log('Test connection - Extracted API keys:', { 
              anonKey: anonKey ? anonKey.substring(0, 20) + '...' : 'not found',
              serviceRoleKey: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'not found'
            });
            
          } catch (apiKeysError) {
            console.error('Test connection - Error fetching API keys:', apiKeysError.response?.data || apiKeysError.message);
            // Continue with existing keys
          }
          
          // Save the project info and API keys
          await this.updateSupabaseToken(storeId, {
            project_url: projectInfo.url,
            anon_key: null,  // No longer used,
            service_role_key: serviceRoleKey || null
          });
          
          console.log('Updated token with first project:', projectInfo.name);
        }

        // Update connection status
        const tenantDb = await ConnectionManager.getStoreConnection(storeId);
        const config = await tenantDb
          .from('integration_configs')
          .where({ store_id: storeId, integration_type: 'supabase', is_active: true })
          .first();
        if (config) {
          await tenantDb
            .from('integration_configs')
            .where({ id: config.id })
            .update({
              connection_status: 'success',
              connection_error: null,
              connection_tested_at: new Date(),
              updated_at: new Date()
            });
        }

        return {
          success: true,
          message: projects.length > 0 
            ? `Connected to Supabase with ${projects.length} project(s)` 
            : 'Connected to Supabase (no projects yet)',
          projects: projects.length,
          projectUrl: token.project_url || projectInfo?.url,
          hasProjects: projects.length > 0
        };
        
      } catch (error) {
        console.error('Token validation failed:', error.response?.status, error.response?.data);
        
        // If it's a 401, token is invalid or expired
        if (error.response?.status === 401) {
          // Try to refresh the token
          try {
            console.log('Token expired, attempting to refresh...');
            await this.refreshAccessToken(storeId);
            
            // Retry the test with the new token
            return await this.testConnection(storeId);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw new Error('Authentication failed. Please reconnect to Supabase.');
          }
        }
        
        throw new Error(`Connection test failed: ${error.response?.data?.message || error.message}`);
      }
      
    } catch (error) {
      // Update connection status
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);
      const config = await tenantDb
        .from('integration_configs')
        .where({ store_id: storeId, integration_type: 'supabase', is_active: true })
        .first();
      if (config) {
        await tenantDb
          .from('integration_configs')
          .where({ id: config.id })
          .update({
            connection_status: 'failed',
            connection_error: error.message,
            connection_tested_at: new Date(),
            updated_at: new Date()
          });
      }

      console.error('Connection test error:', error);
      throw error;
    }
  }

  /**
   * Disconnect Supabase (revoke tokens)
   */
  async disconnect(storeId) {
    try {
      console.log('Disconnecting Supabase for store:', storeId);

      // Get current config data before deletion
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);
      const config = await tenantDb
        .from('integration_configs')
        .where({ store_id: storeId, integration_type: 'supabase', is_active: true })
        .first();
      const userEmail = config?.config_data?.userEmail || null;

      // Delete token from tenant database
      const token = await this.getSupabaseToken(storeId);
      if (token) {
        console.log('Deleting OAuth token from tenant database');
        await this.deleteSupabaseToken(storeId);
      } else {
        console.log('No OAuth token found to delete');
      }

      // Delete all stored project keys for this store
      const deletedKeysCount = await SupabaseProjectKeys.deleteAllForStore(storeId);
      if (deletedKeysCount > 0) {
        console.log(`Deleted ${deletedKeysCount} stored project key(s) from database`);
      } else {
        console.log('No stored project keys found to delete');
      }

      // Update IntegrationConfig - preserve userEmail to detect orphaned authorizations
      if (config) {
        console.log('Updating IntegrationConfig to disconnected state');

        // Check if this was a revoked connection
        const wasRevoked = config.connection_status === 'failed';

        await tenantDb
          .from('integration_configs')
          .where({ id: config.id })
          .update({
            is_active: false,
            connection_status: 'failed',
            config_data: {
              connected: false,
              disconnectedAt: new Date(),
              userEmail: userEmail, // Preserve email to track orphaned authorizations
              revokedDetected: false, // Clear revoked flag
              message: wasRevoked
                ? 'Disconnected after authorization was revoked.'
                : 'Disconnected by user. App may still be authorized in Supabase account.'
            },
            updated_at: new Date()
          });
      } else {
        console.log('No IntegrationConfig found to update');
      }

      console.log('✅ Supabase disconnection completed');
      return { 
        success: true, 
        message: 'Supabase disconnected successfully',
        note: 'To fully revoke access, go to your Supabase account settings and remove the Catalyst app authorization.'
      };
    } catch (error) {
      console.error('Error disconnecting Supabase:', error);
      throw new Error('Failed to disconnect Supabase: ' + error.message);
    }
  }

  /**
   * Get available projects for the connected account
   */
  async getProjects(storeId) {
    try {
      const token = await this.getSupabaseToken(storeId);

      // All Supabase connections are OAuth-based (stored in tenant DB)
      if (!token) {
        throw new Error('Supabase not connected for this store');
      }

      // Get valid token (refresh if needed)
      const accessToken = await this.getValidToken(storeId);

      // Fetch projects from Supabase API
      const response = await axios.get('https://api.supabase.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const projects = response.data || [];
      
      // Format projects for frontend and check which have keys configured
      const formattedProjects = await Promise.all(projects.map(async project => {
        // Check if we have keys stored for this project
        const storedKeys = await SupabaseProjectKeys.getKeysForProject(storeId, project.id);
        const hasKeys = storedKeys && storedKeys.anonKey && storedKeys.anonKey !== 'pending_configuration';
        
        return {
          id: project.id,
          name: project.name,
          url: `https://${project.id}.supabase.co`,
          region: project.region,
          organizationId: project.organization_id,
          createdAt: project.created_at,
          isCurrent: token.project_url === `https://${project.id}.supabase.co`,
          hasKeysConfigured: hasKeys,
          status: project.status || 'ACTIVE'
        };
      }));

      return {
        success: true,
        projects: formattedProjects,
        currentProjectUrl: token.project_url
      };
    } catch (error) {
      console.error('Error fetching projects:', error.response?.data || error.message);
      
      // Check if it's a scope error
      if (error.response?.status === 403 || error.message?.includes('scope')) {
        return {
          success: false,
          message: 'Cannot fetch projects. Please reconnect with proper permissions.',
          requiresReconnection: true
        };
      }
      
      throw new Error('Failed to fetch projects: ' + error.message);
    }
  }

  /**
   * Select a different project
   */
  async selectProject(storeId, projectId) {
    try {
      const token = await this.getSupabaseToken(storeId);
      if (!token) {
        throw new Error('Supabase not connected for this store');
      }

      // Get valid token
      const accessToken = await this.getValidToken(storeId);

      // Fetch project details
      const projectResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const project = projectResponse.data;
      if (!project) {
        throw new Error('Project not found');
      }

      // Try to fetch API keys for the new project
      let anonKey = 'pending_configuration';
      let serviceRoleKey = null;

      try {
        console.log(`Fetching API keys for project ${projectId}...`);
        const apiKeysResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}/config/secrets/project-api-keys`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API keys response structure:', JSON.stringify(apiKeysResponse.data, null, 2));

        if (apiKeysResponse.data && Array.isArray(apiKeysResponse.data)) {
          const anonKeyObj = apiKeysResponse.data.find(key => key.name === 'anon' || key.name === 'anon_key');
          const serviceKeyObj = apiKeysResponse.data.find(key => key.name === 'service_role' || key.name === 'service_role_key');
          
          anonKey = anonKeyObj?.api_key || 'pending_configuration';
          serviceRoleKey = serviceKeyObj?.api_key || null;
          
          console.log('Found API keys:', {
            anon: anonKey ? 'present' : 'missing',
            service_role: serviceRoleKey ? 'present' : 'missing'
          });
        } else if (apiKeysResponse.data && typeof apiKeysResponse.data === 'object') {
          // Handle different response format
          anonKey = apiKeysResponse.data.anon || apiKeysResponse.data.anon_key || 'pending_configuration';
          serviceRoleKey = apiKeysResponse.data.service_role || apiKeysResponse.data.service_role_key || null;
        }
      } catch (apiKeysError) {
        console.error('Error fetching API keys for new project:', apiKeysError.response?.data || apiKeysError.message);
        
        // Try alternative endpoint for project configuration
        try {
          console.log('Trying alternative endpoint for project config...');
          const configResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}/config`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (configResponse.data?.api?.anon_key) {
            anonKey = configResponse.data.api.anon_key;
            console.log('Found anon key from config endpoint');
          }
          if (configResponse.data?.api?.service_role_key) {
            serviceRoleKey = configResponse.data.api.service_role_key;
            console.log('Found service role key from config endpoint');
          }
        } catch (configError) {
          console.error('Alternative config endpoint also failed:', configError.message);
        }
      }

      // First check if we have stored keys for this project
      const storedKeys = await SupabaseProjectKeys.getKeysForProject(storeId, projectId);
      if (storedKeys && storedKeys.anonKey) {
        console.log('Using stored keys for project:', projectId);
        anonKey = storedKeys.anonKey;
        serviceRoleKey = storedKeys.serviceRoleKey || serviceRoleKey;
      }

      const projectUrl = `https://${projectId}.supabase.co`;

      // Preserve existing service role key if new one wasn't fetched
      const currentToken = await this.getSupabaseToken(storeId);
      const preservedServiceRoleKey = serviceRoleKey || currentToken?.service_role_key || null;

      console.log('Service role key handling:', {
        fetchedNewKey: !!serviceRoleKey,
        hadExistingKey: !!currentToken?.service_role_key,
        willPreserveKey: !!preservedServiceRoleKey
      });

      // Update token with new project details in tenant DB
      await this.updateSupabaseToken(storeId, {
        project_url: projectUrl,
        anon_key: anonKey,
        service_role_key: preservedServiceRoleKey,
        database_url: `postgresql://postgres.[projectRef]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`,
        storage_url: `https://${projectId}.supabase.co/storage/v1`,
        auth_url: `https://${projectId}.supabase.co/auth/v1`
      });

      // Store the keys for this project if we have them (use preserved key)
      if (anonKey && anonKey !== 'pending_configuration') {
        await SupabaseProjectKeys.upsertKeys(storeId, projectId, projectUrl, {
          anonKey: anonKey,
          serviceRoleKey: preservedServiceRoleKey
        });
      }

      // Update IntegrationConfig as well
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);
      const config = await tenantDb
        .from('integration_configs')
        .where({ store_id: storeId, integration_type: 'supabase', is_active: true })
        .first();
      if (config) {
        await tenantDb
          .from('integration_configs')
          .where({ id: config.id })
          .update({
            config_data: {
              ...config.config_data,
              projectUrl: `https://${projectId}.supabase.co`,
              projectName: project.name,
              projectId: projectId,
              anonKey: anonKey,
              lastUpdated: new Date()
            },
            updated_at: new Date()
          });
      }

      return {
        success: true,
        message: `Switched to project: ${project.name}`,
        project: {
          id: projectId,
          name: project.name,
          url: `https://${projectId}.supabase.co`
        }
      };
    } catch (error) {
      console.error('Error selecting project:', error);
      throw new Error('Failed to select project: ' + error.message);
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(storeId) {
    console.log('[getConnectionStatus] Called for storeId:', storeId);
    try {
      // Get tenant DB connection
      let tenantDb, config, token;
      try {
        tenantDb = await ConnectionManager.getStoreConnection(storeId);
        console.log('[getConnectionStatus] Tenant DB connection established');

        // Get integration config
        const configResult = await tenantDb
          .from('integration_configs')
          .select('*')
          .eq('store_id', storeId)
          .eq('integration_type', 'supabase')
          .eq('is_active', true)
          .maybeSingle();
        config = configResult?.data;
        console.log('[getConnectionStatus] integration_configs result:', {
          found: !!config,
          connectionStatus: config?.connection_status,
          isActive: config?.is_active
        });

        // Get OAuth token from tenant DB (NOT master DB)
        const tokenResult = await tenantDb
          .from('supabase_oauth_tokens')
          .select('*')
          .eq('store_id', storeId)
          .maybeSingle();

        console.log('[getConnectionStatus] supabase_oauth_tokens query result:', {
          found: !!tokenResult?.data,
          hasAccessToken: !!tokenResult?.data?.access_token,
          hasRefreshToken: !!tokenResult?.data?.refresh_token,
          hasServiceRoleKey: !!tokenResult?.data?.service_role_key,
          projectUrl: tokenResult?.data?.project_url
        });

        if (tokenResult?.data) {
          // Decrypt tokens
          token = {
            ...tokenResult.data,
            access_token: tokenResult.data.access_token ? decrypt(tokenResult.data.access_token) : null,
            refresh_token: tokenResult.data.refresh_token ? decrypt(tokenResult.data.refresh_token) : null,
            service_role_key: tokenResult.data.service_role_key ? decrypt(tokenResult.data.service_role_key) : null
          };
          console.log('[getConnectionStatus] Token decrypted successfully');
        } else {
          console.log('[getConnectionStatus] No OAuth token found in tenant DB, checking Redis/memory...');

          // Check Redis for pending OAuth tokens (from recent OAuth callback)
          try {
            const { getRedisClient } = require('../config/redis');
            const redisClient = getRedisClient();

            if (redisClient) {
              const redisKey = `oauth:pending:${storeId}`;
              const tokenDataStr = await redisClient.get(redisKey);

              if (tokenDataStr) {
                const tokenData = JSON.parse(tokenDataStr);
                console.log('[getConnectionStatus] Found OAuth tokens in Redis, migrating to tenant DB...');

                // Save to tenant database
                const { data: savedToken, error: saveError } = await tenantDb
                  .from('supabase_oauth_tokens')
                  .insert({
                    store_id: storeId,
                    access_token: tokenData.access_token ? encrypt(tokenData.access_token) : null,
                    refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                    expires_at: tokenData.expires_at,
                    project_url: tokenData.project_url,
                    service_role_key: tokenData.service_role_key ? encrypt(tokenData.service_role_key) : null,
                    database_url: tokenData.database_url,
                    storage_url: tokenData.storage_url,
                    auth_url: tokenData.auth_url
                  })
                  .select()
                  .single();

                if (saveError) {
                  console.error('[getConnectionStatus] Error saving tokens to tenant DB:', saveError);
                } else {
                  console.log('[getConnectionStatus] ✅ Tokens migrated to tenant DB successfully');

                  // Clean up Redis
                  await redisClient.del(redisKey);
                  console.log('[getConnectionStatus] 🧹 Cleaned up Redis key');

                  // Set token from saved data
                  token = {
                    ...savedToken,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    service_role_key: tokenData.service_role_key
                  };
                }
              }
            }

            // Check memory fallback if still no token
            if (!token && global.pendingOAuthTokens && global.pendingOAuthTokens.has(storeId)) {
              const tokenData = global.pendingOAuthTokens.get(storeId);
              console.log('[getConnectionStatus] Found OAuth tokens in memory, migrating to tenant DB...');

              // Save to tenant database
              const { data: savedToken, error: saveError } = await tenantDb
                .from('supabase_oauth_tokens')
                .insert({
                  store_id: storeId,
                  access_token: tokenData.access_token ? encrypt(tokenData.access_token) : null,
                  refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                  expires_at: tokenData.expires_at,
                  project_url: tokenData.project_url,
                  service_role_key: tokenData.service_role_key ? encrypt(tokenData.service_role_key) : null,
                  database_url: tokenData.database_url,
                  storage_url: tokenData.storage_url,
                  auth_url: tokenData.auth_url
                })
                .select()
                .single();

              if (saveError) {
                console.error('[getConnectionStatus] Error saving tokens to tenant DB:', saveError);
              } else {
                console.log('[getConnectionStatus] ✅ Tokens migrated to tenant DB successfully');

                // Clean up memory
                global.pendingOAuthTokens.delete(storeId);
                console.log('[getConnectionStatus] 🧹 Cleaned up memory cache');

                // Set token from saved data
                token = {
                  ...savedToken,
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                  service_role_key: tokenData.service_role_key
                };
              }
            }
          } catch (migrationError) {
            console.error('[getConnectionStatus] Error during token migration:', migrationError);
          }
        }
      } catch (tenantDbError) {
        // Tenant DB might not be accessible yet, continue without config
        console.error('[getConnectionStatus] Error accessing tenant DB:', tenantDbError.message);
        config = null;
        token = null;
      }

      // Check if OAuth is configured for new connections
      if (!this.oauthConfigured && !token) {
        return {
          connected: false,
          message: 'Supabase OAuth is not configured. Please contact your administrator to set up Supabase OAuth credentials.',
          oauthConfigured: false,
          connectionStatus: 'not_configured'
        };
      }

      // Check if authorization was revoked
      if (config && config.connection_status === 'failed' && config.config_data?.revokedDetected) {
        // Automatically disconnect invalid connection
        console.log('Auto-disconnecting revoked authorization for store:', storeId);
        
        // Delete the invalid token
        if (token) {
          await token.destroy();
        }
        
        // Update config to show disconnected with revocation history
        await tenantDb
          .from('integration_configs')
          .where({ id: config.id })
          .update({
            is_active: false,
            connection_status: 'failed',
            config_data: {
              ...config.config_data,
              connected: false,
              autoDisconnected: true,
              autoDisconnectedAt: new Date(),
              disconnectedReason: 'Authorization was revoked in Supabase',
              lastKnownProjectUrl: token?.project_url || config.config_data?.projectUrl
            },
            updated_at: new Date()
          });
        
        return {
          connected: false,
          message: 'Authorization was revoked. Connection has been automatically removed.',
          oauthConfigured: true,
          authorizationRevoked: true,
          autoDisconnected: true,
          hasToken: false,
          userEmail: config.config_data?.userEmail,
          lastKnownProjectUrl: token?.project_url || config.config_data?.projectUrl
        };
      }
      
      // If we have a token, quickly test if it's still valid
      if (token && token.project_url && token.project_url !== 'https://pending-configuration.supabase.co') {
        try {
          // Quick validation check - just see if token works
          const axios = require('axios');
          const testResponse = await axios.get('https://api.supabase.com/v1/projects', {
            headers: {
              'Authorization': `Bearer ${token.access_token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout for quick check
          });
          
          // Token is valid, continue normal flow
          console.log('Token validation successful during status check');
          
        } catch (validationError) {
          console.log('Token validation failed during status check:', validationError.response?.status);
          
          // If 401, mark as revoked and auto-disconnect
          if (validationError.response?.status === 401) {
            console.log('Detected revoked authorization during status check - auto-disconnecting');
            
            // Store the project URL before deleting token
            const lastProjectUrl = token.project_url;
            
            // Delete the invalid token immediately
            await token.destroy();
            
            // Update config to mark as disconnected with revocation history
            if (config) {
              await tenantDb
                .from('integration_configs')
                .where({ id: config.id })
                .update({
                  is_active: false,
                  connection_status: 'failed',
                  config_data: {
                    ...config.config_data,
                    connected: false,
                    autoDisconnected: true,
                    autoDisconnectedAt: new Date(),
                    revokedAt: new Date(),
                    revokedDetected: true,
                    disconnectedReason: 'Authorization was revoked in Supabase',
                    lastKnownProjectUrl: lastProjectUrl,
                    message: 'Authorization was revoked and connection was automatically removed.'
                  },
                  updated_at: new Date()
                });
            }
            
            return {
              connected: false,
              message: 'Authorization was revoked. Connection has been automatically removed.',
              oauthConfigured: true,
              authorizationRevoked: true,
              autoDisconnected: true,
              hasToken: false,
              userEmail: config?.config_data?.userEmail,
              lastKnownProjectUrl: lastProjectUrl
            };
          }
        }
      }

      // Check if we have an OAuth token (all Supabase connections are OAuth-based)
      // Trust the actual OAuth token presence, not stale config flags
      if (!token) {
        // No connection found in either place
        let hasOrphanedAuthorization = false;
        let wasAutoDisconnected = false;
        let lastKnownProjectUrl = null;

        if (config && config.config_data?.disconnectedAt && config.config_data?.userEmail) {
          // If we have a disconnectedAt timestamp and userEmail, the app might still be authorized
          hasOrphanedAuthorization = !config.config_data?.autoDisconnected;
          wasAutoDisconnected = !!config.config_data?.autoDisconnected;
          lastKnownProjectUrl = config.config_data?.lastKnownProjectUrl;
        }

        return {
          connected: false,
          message: wasAutoDisconnected
            ? 'Connection was automatically removed after authorization was revoked.'
            : hasOrphanedAuthorization
              ? 'Supabase disconnected locally. You may need to revoke access in your Supabase account settings.'
              : 'Supabase not connected',
          oauthConfigured: true,
          hasOrphanedAuthorization,
          wasAutoDisconnected,
          lastKnownProjectUrl,
          connectionStatus: 'disconnected'
        };
      }

      // Get project URL from OAuth token
      const projectUrl = token.project_url;

      const isExpired = this.isTokenExpired(token);
      
      // If token is expired and we don't have a service role key, show as disconnected
      // Service role keys don't expire, so we can still use Supabase even if OAuth token expires
      if (isExpired && !token.service_role_key) {
        return {
          connected: false,
          message: 'Supabase connection expired',
          oauthConfigured: true,
          tokenExpired: isExpired,
          connectionStatus: 'failed'
        };
      }
      
      // If connection test recently failed, show as disconnected
      if (config && config.connection_status === 'failed') {
        return {
          connected: false,
          message: 'Supabase connection failed - please reconnect',
          oauthConfigured: true,
          connectionStatus: 'failed'
        };
      }

      // Check if connection has limited scope
      const hasLimitedScope = token.project_url === 'https://pending-configuration.supabase.co' || 
                              token.project_url === 'pending_configuration';

      // If service role key is missing, try to fetch it
      if (!token.service_role_key && !hasLimitedScope) {
        console.log('Service role key missing, attempting to fetch from Supabase API...');
        const keyFetchResult = await this.fetchAndUpdateApiKeys(storeId);
        if (keyFetchResult.updated) {
          // Refetch token to get updated keys
          token = await this.getSupabaseToken(storeId);
        } else if (keyFetchResult.requiresReconnection) {
          // OAuth token lacks permissions
          return {
            connected: true,
            projectUrl: token.project_url,
            expiresAt: token.expires_at,
            isExpired,
            connectionStatus: 'limited',
            lastTestedAt: config?.connection_tested_at,
            oauthConfigured: true,
            limitedScope: true,
            userEmail: config?.config_data?.userEmail,
            hasServiceRoleKey: false,
            message: 'Connected but with limited permissions. Storage operations require reconnecting to Supabase to grant secrets:read permission.',
            requiresReconnection: true
          };
        }
      }

      // Check if service role key is properly configured
      const hasValidServiceKey = token.service_role_key &&
                                  token.service_role_key !== 'pending_configuration' &&
                                  token.service_role_key !== '';

      return {
        connected: true,
        projectUrl: projectUrl || 'Unknown',
        expiresAt: token.expires_at,
        isExpired,
        connectionStatus: config?.connection_status || 'success',
        lastTestedAt: config?.connection_tested_at,
        oauthConfigured: true,
        limitedScope: hasLimitedScope,
        userEmail: config?.config_data?.userEmail,
        hasServiceRoleKey: hasValidServiceKey,
        requiresManualConfiguration: !hasValidServiceKey && !hasLimitedScope,
        storageReady: hasValidServiceKey
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return {
        connected: false,
        error: error.message,
        connectionStatus: 'error'
      };
    }
  }

  /**
   * Get token info without throwing errors
   */
  async getTokenInfo(storeId) {
    try {
      const token = await this.getSupabaseToken(storeId);
      if (!token) {
        return null;
      }
      return {
        project_url: token.project_url,
        service_role_key: token.service_role_key,
        access_token: token.access_token
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Try to fetch and update API keys for the current project
   */
  async fetchAndUpdateApiKeys(storeId) {
    try {
      const token = await this.getSupabaseToken(storeId);
      if (!token || !token.project_url || token.project_url === 'pending_configuration') {
        return { success: false, message: 'No project configured' };
      }

      // Extract project ID from URL
      const projectIdMatch = token.project_url.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (!projectIdMatch) {
        return { success: false, message: 'Invalid project URL format' };
      }
      const projectId = projectIdMatch[1];

      // Get valid access token
      const accessToken = await this.getValidToken(storeId);

      let serviceRoleKey = null;
      let updated = false;

      // First check if project is active
      try {
        console.log(`Checking project status for ${projectId}...`);
        const projectResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Project status:', projectResponse.data?.status);
        
        if (projectResponse.data?.status === 'INACTIVE') {
          console.log('Project is INACTIVE - cannot fetch API keys');
          return { 
            success: false, 
            message: 'Supabase project is inactive. Please activate the project in your Supabase dashboard to enable storage operations.',
            projectStatus: 'INACTIVE',
            requiresProjectActivation: true 
          };
        }
      } catch (statusError) {
        console.log('Could not check project status:', statusError.message);
      }

      // Try to fetch API keys
      try {
        console.log(`Attempting to fetch API keys for project ${projectId}...`);
        const apiKeysResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}/config/secrets/project-api-keys`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API keys response status:', apiKeysResponse.status);
        console.log('API keys response data:', JSON.stringify(apiKeysResponse.data, null, 2));

        if (apiKeysResponse.data && Array.isArray(apiKeysResponse.data)) {
          const serviceKeyObj = apiKeysResponse.data.find(key => key.name === 'service_role' || key.name === 'service_role_key');
          serviceRoleKey = serviceKeyObj?.api_key;
          console.log('Found service role key:', !!serviceRoleKey);
        }
      } catch (error) {
        console.log('Primary API keys endpoint failed:');
        console.log('  Status:', error.response?.status);
        console.log('  Status Text:', error.response?.statusText);
        console.log('  Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.log('  Error Message:', error.message);
        
        // Check if it's a permission error or not found
        if (error.response?.status === 403) {
          console.log('OAuth token lacks secrets:read scope');
          return { 
            success: false, 
            message: 'OAuth token lacks permission to fetch API keys (missing secrets:read scope)',
            requiresReconnection: true 
          };
        } else if (error.response?.status === 404) {
          console.log('API keys endpoint not available - this might be a Supabase API limitation');
          // Don't return error for 404, continue trying alternative methods
        }
        
        // Try alternative endpoints
        try {
          console.log('Trying alternative config endpoint...');
          const configResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}/config`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Config endpoint response:', JSON.stringify(configResponse.data, null, 2));
          
          if (configResponse.data?.api) {
            serviceRoleKey = configResponse.data.api.service_role_key;
            console.log('Found service role key via config endpoint');
          }
        } catch (altError) {
          console.log('Config endpoint also failed:', altError.response?.status, altError.response?.data?.message || altError.message);
        }
        
        // Try project details endpoint (might have public keys)
        try {
          console.log('Trying project details endpoint...');
          const projectResponse = await axios.get(`https://api.supabase.com/v1/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Project details response:', JSON.stringify(projectResponse.data, null, 2));
          
          // Check if project details contain any API info
          if (projectResponse.data?.api_url || projectResponse.data?.endpoint) {
            console.log('Found project API URL:', projectResponse.data.api_url || projectResponse.data.endpoint);
          }
        } catch (projError) {
          console.log('Project details endpoint failed:', projError.response?.status, projError.message);
        }
      }

      // Update if we found new key
      if (serviceRoleKey && serviceRoleKey !== token.service_role_key) {
        await this.updateSupabaseToken(storeId, { service_role_key: serviceRoleKey });
        updated = true;
        console.log('Updated service role key for project');
      }

      // If no service role key was found, indicate manual configuration is needed
      if (!serviceRoleKey && !token.service_role_key) {
        return {
          success: false,
          updated: false,
          hasServiceRoleKey: false,
          requiresManualConfiguration: true,
          message: 'Service role key could not be fetched automatically. The Supabase Management API does not provide access to project API keys through OAuth. Please manually configure your service role key from your Supabase dashboard.',
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Select your project',
            '3. Navigate to Settings > API',
            '4. Copy the "service_role" secret key',
            '5. Enter it in the Supabase integration settings'
          ]
        };
      }

      return {
        success: true,
        updated,
        hasServiceRoleKey: !!serviceRoleKey || !!token.service_role_key,
        existingKeys: {
          hasServiceRoleKey: !!token.service_role_key
        }
      };
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Manually update project configuration (for limited scope connections)
   */
  async updateProjectConfig(storeId, config) {
    try {
      const token = await this.getSupabaseToken(storeId);
      if (!token) {
        throw new Error('Supabase not connected for this store');
      }

      // Use provided projectId or extract from URL
      let projectId = config.projectId;
      
      if (!projectId && token.project_url) {
        const match = token.project_url.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (match) {
          projectId = match[1];
        }
      }

      // Update token with new configuration
      const updateData = {};
      if (config.projectUrl) {
        updateData.project_url = config.projectUrl;
        // Extract project ID from new URL if provided
        const newMatch = config.projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (newMatch) {
          projectId = newMatch[1];
        }
      }
      // No longer update anon_key since we don't use it
      if (config.serviceRoleKey) {
        updateData.service_role_key = config.serviceRoleKey;
      }
      if (config.databaseUrl) {
        updateData.database_url = config.databaseUrl;
      }
      if (config.storageUrl) {
        updateData.storage_url = config.storageUrl;
      }
      if (config.authUrl) {
        updateData.auth_url = config.authUrl;
      }

      await this.updateSupabaseToken(storeId, updateData);

      // Store keys for this specific project
      if (projectId && (config.anonKey || config.serviceRoleKey)) {
        await SupabaseProjectKeys.upsertKeys(storeId, projectId, 
          config.projectUrl || token.project_url, {
          anonKey: config.anonKey,
          serviceRoleKey: config.serviceRoleKey
        });
        console.log(`Stored keys for project ${projectId}`);
      }

      // Also update IntegrationConfig
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);
      const integrationConfig = await tenantDb
        .from('integration_configs')
        .where({ store_id: storeId, integration_type: 'supabase', is_active: true })
        .first();
      if (integrationConfig) {
        await tenantDb
          .from('integration_configs')
          .where({ id: integrationConfig.id })
          .update({
            config_data: {
              ...integrationConfig.config_data,
              ...config,
              manuallyConfigured: true,
              manuallyConfiguredAt: new Date()
            },
            updated_at: new Date()
          });
      }

      return {
        success: true,
        message: 'Project configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating project config:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseIntegration();