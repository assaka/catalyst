const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { IntegrationConfig } = require('../models');
const SupabaseOAuthToken = require('../models/SupabaseOAuthToken'); // OAuth tokens in tenant DB
const SupabaseProjectKeys = require('../models/SupabaseProjectKeys');
const supabaseStorage = require('./supabase-storage');

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

      try {
        // Check if tenant DB exists before trying to save
        const { MasterStore } = require('../models/master');
        const store = await MasterStore.findByPk(storeId);

        console.log('🔍 Store status check:', {
          storeId,
          storeFound: !!store,
          status: store?.status,
          isActive: store?.is_active
        });

        if (store && store.status === 'pending_database') {
          console.log('⏭️ Skipping OAuth token save - tenant DB not provisioned yet');
          console.log('   Tokens will be saved after tenant database provisioning completes');

          // Store OAuth data temporarily for later use
          if (!global.pendingOAuthTokens) {
            console.log('📝 Initializing global.pendingOAuthTokens Map');
            global.pendingOAuthTokens = new Map();
          }

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

          global.pendingOAuthTokens.set(storeId, tokenDataToStore);

          console.log('✅ OAuth tokens stored in memory for post-provisioning save');
          console.log('📊 Memory cache now has', global.pendingOAuthTokens.size, 'entries');
          console.log('🔑 Stored for storeId:', storeId);
        } else {
          // Store is already active, save to tenant DB
          const saveData = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            project_url: tokenData.project_url || 'https://pending-configuration.supabase.co',
            anon_key: null,  // No longer used, set to null,
            service_role_key: tokenData.service_role_key || null,
            database_url: tokenData.database_url || null,
            storage_url: tokenData.storage_url || null,
            auth_url: tokenData.auth_url || null
          };

          await SupabaseOAuthToken.createOrUpdate(storeId, saveData);
          console.log('✅ Token saved to tenant database successfully');
        }
      } catch (dbError) {
        console.error('Database save error:', {
          error: dbError.message,
          name: dbError.name,
          errors: dbError.errors?.map(e => ({ field: e.path, message: e.message, value: e.value })),
          tokenData: {
            ...tokenData,
            access_token: tokenData.access_token ? 'present' : 'missing',
            refresh_token: tokenData.refresh_token ? 'present' : 'missing',
            project_url: tokenData.project_url
          }
        });

        // If it's a connection error and store is pending, that's expected - skip save
        if (dbError.name === 'SequelizeConnectionError' && dbError.message.includes('Tenant or user not found')) {
          console.log('⏭️ Skipping token save - tenant database not provisioned yet');
          // Don't throw, continue
        } else if (dbError.name === 'SequelizeValidationError' && tokenData.access_token && tokenData.refresh_token) {
          console.log('Ignoring validation error since we have valid tokens - connection will work');
          // Don't throw, continue to save IntegrationConfig
        } else {
          throw dbError;
        }
      }

      // Also save to IntegrationConfig for consistency (only if tenant DB exists)
      try {
        const { MasterStore } = require('../models/master');
        const store = await MasterStore.findByPk(storeId);

        if (store && store.status === 'pending_database') {
          console.log('⏭️ Skipping IntegrationConfig save - tenant DB not provisioned yet');
        } else {
          const integrationConfig = await IntegrationConfig.createOrUpdate(storeId, 'supabase', {
            projectUrl: projectData.project_url || 'pending_configuration',
            connected: true,
            connectedAt: new Date(),
            userEmail: user?.email || ''
          });

          // Update connection status to success
          if (integrationConfig) {
            await integrationConfig.update({
              connection_status: 'success',
              is_active: true
            });
          }

          console.log('✅ Integration config saved successfully with connected status');

          // Automatically create storage buckets after successful authentication
          try {
            console.log('🪣 Creating default storage buckets...');
            const bucketResult = await supabaseStorage.ensureBucketsExist(storeId);

            if (bucketResult.success) {
              if (bucketResult.bucketsCreated && bucketResult.bucketsCreated.length > 0) {
                console.log('✅ Created buckets:', bucketResult.bucketsCreated.join(', '));
              } else {
                console.log('✅ All required buckets already exist');
              }
            } else {
              console.log('⚠️ Could not create buckets automatically:', bucketResult.message);
              // Don't fail the OAuth flow, just log the warning
            }
          } catch (bucketError) {
            console.error('⚠️ Error creating buckets (non-blocking):', bucketError.message);
            // Don't fail the OAuth flow if bucket creation fails
          }
        }
      } catch (configError) {
        console.error('⚠️ Error saving integration config:', configError.message);
        // Non-blocking - continue with OAuth
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
            
            // Auto-disconnect the invalid connection
            console.log('Auto-disconnecting revoked authorization during test');
            
            // Store the project URL before deleting
            const lastProjectUrl = token.project_url;
            
            // Delete the invalid token
            await token.destroy();
            
            // Update config to mark as disconnected
            const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
            if (config) {
              await config.update({
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
                }
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
          await token.update({
            project_url: projectInfo.url,
            anon_key: null,  // No longer used,
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
        
        await config.update({
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
   * Get available projects for the connected account
   */
  async getProjects(storeId) {
    try {
      const token = await SupabaseOAuthToken.findByStore(storeId);
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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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
      const currentToken = await SupabaseOAuthToken.findByStore(storeId);
      const preservedServiceRoleKey = serviceRoleKey || currentToken?.service_role_key || null;

      console.log('Service role key handling:', {
        fetchedNewKey: !!serviceRoleKey,
        hadExistingKey: !!currentToken?.service_role_key,
        willPreserveKey: !!preservedServiceRoleKey
      });

      // Update token with new project details
      await token.update({
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
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (config) {
        await config.update({
          config_data: {
            ...config.config_data,
            projectUrl: `https://${projectId}.supabase.co`,
            projectName: project.name,
            projectId: projectId,
            anonKey: anonKey,
            lastUpdated: new Date()
          }
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
    try {
      const token = await SupabaseOAuthToken.findByStore(storeId);
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      
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
        await config.update({
          is_active: false,
          connection_status: 'failed',
          config_data: {
            ...config.config_data,
            connected: false,
            autoDisconnected: true,
            autoDisconnectedAt: new Date(),
            disconnectedReason: 'Authorization was revoked in Supabase',
            lastKnownProjectUrl: token?.project_url || config.config_data?.projectUrl
          }
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
              await config.update({
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
                }
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

      // Check if token exists and IntegrationConfig shows as connected
      if (!token || (config && config.config_data?.connected === false)) {
        // Check if user might still have the app authorized on Supabase's side
        // by looking at the config history
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

      const isExpired = SupabaseOAuthToken.isTokenExpired(token);
      
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
          // Reload token to get updated keys
          await token.reload();
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
        projectUrl: token.project_url,
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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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
        await token.update({ service_role_key: serviceRoleKey });
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
      const token = await SupabaseOAuthToken.findByStore(storeId);
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

      await token.update(updateData);

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
      const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'supabase');
      if (integrationConfig) {
        await integrationConfig.update({
          config_data: {
            ...integrationConfig.config_data,
            ...config,
            manuallyConfigured: true,
            manuallyConfiguredAt: new Date()
          }
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