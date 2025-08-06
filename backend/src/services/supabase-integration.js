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
      scope: 'email profile projects:read projects:write storage:read storage:write database:read database:write',
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
          projectData = {
            project_url: `https://${firstProject.id}.supabase.co`,
            anon_key: firstProject.anon_key || '',
            service_role_key: firstProject.service_role_key || '',
            database_url: firstProject.database_url || '',
            storage_url: `https://${firstProject.id}.supabase.co/storage/v1`,
            auth_url: `https://${firstProject.id}.supabase.co/auth/v1`
          };
        }
      } catch (projectError) {
        console.error('Error fetching projects:', projectError.response?.data || projectError.message);
        // Continue without project data - user can configure later
        projectData = {
          project_url: '',
          anon_key: '',
          service_role_key: '',
          database_url: '',
          storage_url: '',
          auth_url: ''
        };
      }

      // Save token to database
      const tokenData = {
        access_token,
        refresh_token,
        expires_at: expiresAt,
        ...projectData
      };

      await SupabaseOAuthToken.createOrUpdate(storeId, tokenData);

      // Also save to IntegrationConfig for consistency
      await IntegrationConfig.createOrUpdate(storeId, 'supabase', {
        projectUrl: projectData.project_url || 'pending_configuration',
        anonKey: projectData.anon_key || 'pending_configuration',
        connected: true,
        connectedAt: new Date(),
        userEmail: user?.email || ''
      });

      return { 
        success: true, 
        project: {
          url: projectData.project_url || 'Configuration pending'
        },
        user
      };
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
        const projectsTestResponse = await axios.get('https://api.supabase.com/v1/projects', {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Token is valid, found', projectsTestResponse.data.length, 'projects');
        
        // Use the projects from our test response
        const projects = projectsTestResponse.data || [];
        let projectInfo = null;
        
        // If we have projects and no project_url saved, update it
        if (projects.length > 0 && (!token.project_url || token.project_url === '')) {
          const firstProject = projects[0];
          projectInfo = {
            id: firstProject.id,
            name: firstProject.name,
            url: `https://${firstProject.id}.supabase.co`
          };
          
          // Save the project info
          await token.update({
            project_url: projectInfo.url,
            anon_key: firstProject.anon_key || token.anon_key || '',
            service_role_key: firstProject.service_role_key || token.service_role_key || ''
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

      if (!token) {
        return {
          connected: false,
          message: 'Supabase not connected',
          oauthConfigured: true
        };
      }

      const isExpired = SupabaseOAuthToken.isTokenExpired(token);

      return {
        connected: true,
        projectUrl: token.project_url,
        expiresAt: token.expires_at,
        isExpired,
        connectionStatus: config?.connection_status,
        lastTestedAt: config?.connection_tested_at,
        oauthConfigured: true
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