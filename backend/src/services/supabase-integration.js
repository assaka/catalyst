const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { SupabaseOAuthToken, IntegrationConfig } = require('../models');

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

      const { 
        access_token, 
        refresh_token, 
        expires_in,
        token_type,
        user
      } = response.data;

      if (!access_token || !refresh_token) {
        throw new Error('Invalid token response from Supabase');
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

      // Get user's projects using the access token
      let projectData = {};
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
          const firstProject = projectsResponse.data[0];
          console.log('First project data:', firstProject);
          
          // Fetch API keys for the project
          let anonKey = '';
          let serviceRoleKey = '';
          
          try {
            const apiKeysResponse = await axios.get(`https://api.supabase.com/v1/projects/${firstProject.id}/config/secrets/project-api-keys`, {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('API keys response:', JSON.stringify(apiKeysResponse.data, null, 2));
            
            // Extract anon and service_role keys from response
            if (apiKeysResponse.data && Array.isArray(apiKeysResponse.data)) {
              const anonKeyObj = apiKeysResponse.data.find(key => key.name === 'anon' || key.name === 'anon_key');
              const serviceKeyObj = apiKeysResponse.data.find(key => key.name === 'service_role' || key.name === 'service_role_key');
              
              anonKey = anonKeyObj?.api_key || '';
              serviceRoleKey = serviceKeyObj?.api_key || '';
            } else if (apiKeysResponse.data) {
              // Handle different response format
              anonKey = apiKeysResponse.data.anon || apiKeysResponse.data.anon_key || '';
              serviceRoleKey = apiKeysResponse.data.service_role || apiKeysResponse.data.service_role_key || '';
            }
            
            console.log('Extracted API keys:', { 
              anonKey: anonKey ? anonKey.substring(0, 20) + '...' : 'not found',
              serviceRoleKey: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'not found'
            });
            
          } catch (apiKeysError) {
            console.error('Error fetching API keys:', apiKeysError.response?.data || apiKeysError.message);
            // If it's a scope error, set default values
            if (apiKeysError.response?.status === 403 || apiKeysError.response?.data?.message?.includes('scope')) {
              console.log('OAuth token lacks secrets:read scope for API keys access');
              anonKey = 'pending_configuration';
              serviceRoleKey = null;
            }
            // Continue without API keys - user can configure them later
          }
          
          projectData = {
            project_url: `https://${firstProject.id}.supabase.co`,
            anon_key: anonKey || 'pending_configuration',
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
            anon_key: 'pending_configuration',
            service_role_key: null,
            database_url: null,  // Use null for optional fields
            storage_url: null,
            auth_url: null
          };
        } else {
          // For other errors, still try to save with pending values
          projectData = {
            project_url: 'https://pending-configuration.supabase.co',
            anon_key: 'pending_configuration',
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
        anon_key: tokenData.anon_key ? tokenData.anon_key.substring(0, 20) + '...' : 'not set',
        service_role_key: tokenData.service_role_key ? 'set' : 'not set'
      });

      try {
        await SupabaseOAuthToken.createOrUpdate(storeId, tokenData);
        console.log('✅ Token saved successfully');
      } catch (dbError) {
        console.error('Database save error:', {
          error: dbError.message,
          errors: dbError.errors?.map(e => ({ field: e.path, message: e.message, value: e.value })),
          tokenData: {
            ...tokenData,
            access_token: tokenData.access_token ? 'present' : 'missing',
            refresh_token: tokenData.refresh_token ? 'present' : 'missing'
          }
        });
        throw dbError;
      }

      // Also save to IntegrationConfig for consistency
      await IntegrationConfig.createOrUpdate(storeId, 'supabase', {
        projectUrl: projectData.project_url || 'pending_configuration',
        anonKey: projectData.anon_key || 'pending_configuration',
        connected: true,
        connectedAt: new Date(),
        userEmail: user?.email || ''
      });
      console.log('✅ Integration config saved successfully');

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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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

    // Check if we have required data
    if (!token.project_url || token.project_url === '' || token.project_url === 'pending_configuration') {
      throw new Error('Supabase project URL is not configured');
    }

    if (!token.anon_key || token.anon_key === '' || token.anon_key === 'pending' || token.anon_key === 'pending_configuration') {
      throw new Error('Supabase anon key is not configured');
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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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
            throw new Error('Authorization has been revoked. Please reconnect to Supabase.');
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
          await token.update({
            project_url: projectInfo.url,
            anon_key: anonKey || 'pending_configuration',
            service_role_key: serviceRoleKey || null
          });
          
          console.log('Updated token with first project:', projectInfo.name);
        }

        // Update connection status
        const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
        if (config) {
          await config.updateConnectionStatus('success');
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
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.updateConnectionStatus('failed', error.message);
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
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      const userEmail = config?.config_data?.userEmail || null;
      
      // Delete token from database
      const token = await SupabaseOAuthToken.findByStore(storeId);
      if (token) {
        console.log('Deleting OAuth token from database');
        await token.destroy();
      } else {
        console.log('No OAuth token found to delete');
      }

      // Update IntegrationConfig - preserve userEmail to detect orphaned authorizations
      if (config) {
        console.log('Updating IntegrationConfig to disconnected state');
        await config.update({
          is_active: false,
          connection_status: 'disconnected',
          config_data: {
            connected: false,
            disconnectedAt: new Date(),
            userEmail: userEmail, // Preserve email to track orphaned authorizations
            message: 'Disconnected by user. App may still be authorized in Supabase account.'
          }
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
   * Get connection status
   */
  async getConnectionStatus(storeId) {
    try {
      // Check if OAuth is configured
      if (!this.oauthConfigured) {
        return {
          connected: false,
          message: 'Supabase OAuth is not configured. Please contact your administrator to set up Supabase OAuth credentials.',
          oauthConfigured: false
        };
      }
      
      const token = await SupabaseOAuthToken.findByStore(storeId);
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');

      // Check if token exists and IntegrationConfig shows as connected
      if (!token || (config && config.config_data?.connected === false)) {
        // Check if user might still have the app authorized on Supabase's side
        // by looking at the config history
        let hasOrphanedAuthorization = false;
        if (config && config.config_data?.disconnectedAt && config.config_data?.userEmail) {
          // If we have a disconnectedAt timestamp and userEmail, the app might still be authorized
          hasOrphanedAuthorization = true;
        }
        
        return {
          connected: false,
          message: hasOrphanedAuthorization 
            ? 'Supabase disconnected locally. You may need to revoke access in your Supabase account settings.'
            : 'Supabase not connected',
          oauthConfigured: true,
          hasOrphanedAuthorization
        };
      }

      const isExpired = SupabaseOAuthToken.isTokenExpired(token);
      
      // If token is expired or connection test recently failed, show as disconnected
      if (isExpired || (config && config.connection_status === 'failed')) {
        return {
          connected: false,
          message: isExpired ? 'Supabase connection expired' : 'Supabase connection failed - please reconnect',
          oauthConfigured: true,
          tokenExpired: isExpired
        };
      }

      // Check if connection has limited scope
      const hasLimitedScope = token.project_url === 'https://pending-configuration.supabase.co' || 
                              token.project_url === 'pending_configuration';

      return {
        connected: true,
        projectUrl: token.project_url,
        expiresAt: token.expires_at,
        isExpired,
        connectionStatus: config?.connection_status,
        lastTestedAt: config?.connection_tested_at,
        oauthConfigured: true,
        limitedScope: hasLimitedScope,
        userEmail: config?.config_data?.userEmail
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