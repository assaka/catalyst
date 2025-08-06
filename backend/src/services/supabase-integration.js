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

      // Check if we have the minimum required data
      if (!token.project_url || token.project_url === '') {
        console.log('No project URL found, attempting to fetch projects...');
        
        // Try to fetch projects with the access token
        try {
          const projectsResponse = await axios.get('https://api.supabase.com/v1/projects', {
            headers: {
              'Authorization': `Bearer ${token.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Projects API response:', projectsResponse.data);
          
          if (projectsResponse.data && projectsResponse.data.length > 0) {
            const firstProject = projectsResponse.data[0];
            
            // Update token with project information
            await token.update({
              project_url: `https://${firstProject.id}.supabase.co`,
              anon_key: firstProject.anon_key || token.anon_key || 'pending',
              service_role_key: firstProject.service_role_key || token.service_role_key,
              database_url: firstProject.database_url || token.database_url
            });
            
            // Reload token with updated data
            await token.reload();
            
            console.log('Updated token with project data:', {
              project_url: token.project_url,
              has_anon_key: !!token.anon_key
            });
          } else {
            return {
              success: false,
              message: 'No Supabase projects found. Please create a project in Supabase first.',
              needsConfiguration: true
            };
          }
        } catch (fetchError) {
          console.error('Failed to fetch projects:', fetchError.response?.data || fetchError.message);
          
          // If it's an auth error, token might be invalid
          if (fetchError.response?.status === 401) {
            throw new Error('Authentication failed. Please reconnect to Supabase.');
          }
          
          return {
            success: false,
            message: 'Connected but unable to fetch project details. You may need to configure project settings manually.',
            connected: true,
            needsConfiguration: true
          };
        }
      }

      // Now check if we can create a client
      if (!token.project_url || token.project_url === '' || token.project_url === 'pending_configuration') {
        return {
          success: false,
          message: 'Project URL is not configured. Please reconnect to Supabase or configure manually.',
          needsConfiguration: true
        };
      }

      if (!token.anon_key || token.anon_key === '' || token.anon_key === 'pending' || token.anon_key === 'pending_configuration') {
        // For testing connection, we can still verify the access token works
        try {
          // Test the access token by making a simple API call
          const testResponse = await axios.get('https://api.supabase.com/v1/profile', {
            headers: {
              'Authorization': `Bearer ${token.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          return {
            success: true,
            message: 'OAuth connection is valid, but project keys need to be configured',
            partial: true,
            needsConfiguration: true,
            projectUrl: token.project_url
          };
        } catch (error) {
          console.error('Token validation failed:', error.response?.data || error.message);
          throw new Error('Token validation failed. Please reconnect.');
        }
      }

      // Try to create a client and test it
      try {
        const client = await this.getSupabaseClient(storeId);
        
        // Try to list buckets as a test
        const { data, error } = await client.storage.listBuckets();
        
        if (error) {
          console.error('Storage test error:', error);
          // Even if storage fails, connection might be valid
          return {
            success: true,
            message: 'Connected to Supabase (storage access may be limited)',
            partial: true,
            projectUrl: token.project_url
          };
        }

        // Update connection status
        const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
        if (config) {
          await config.updateConnectionStatus('success');
        }

        return {
          success: true,
          message: 'Successfully connected to Supabase',
          buckets: data?.length || 0,
          projectUrl: token.project_url
        };
      } catch (clientError) {
        console.error('Client creation error:', clientError);
        
        // Update connection status
        const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
        if (config) {
          await config.updateConnectionStatus('partial', 'Connected but client initialization failed');
        }

        return {
          success: false,
          message: 'Connected but unable to initialize Supabase client. Project configuration may be incomplete.',
          connected: true,
          needsConfiguration: true
        };
      }
    } catch (error) {
      // Update connection status
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.updateConnectionStatus('failed', error.message);
      }

      console.error('Connection test failed:', error);
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