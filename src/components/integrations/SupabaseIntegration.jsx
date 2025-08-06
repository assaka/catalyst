import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { ExternalLink, Trash2, Cloud, Image, BarChart3 } from 'lucide-react';

const SupabaseIntegration = ({ storeId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [testingUpload, setTestingUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check for and clear logout flags on component mount
  useEffect(() => {
    if (localStorage.getItem('user_logged_out') === 'true') {
      console.log('🔧 SupabaseIntegration: Clearing logout flag on mount');
      localStorage.removeItem('user_logged_out');
      apiClient.isLoggedOut = false;
    }
  }, []);

  useEffect(() => {
    console.log('SupabaseIntegration mounted with storeId:', storeId);
    if (storeId && storeId !== 'undefined') {
      loadStatus();
    }
  }, [storeId]);

  const loadStatus = async (showRefreshToast = false) => {
    if (!storeId || storeId === 'undefined') {
      console.error('Invalid storeId:', storeId);
      setStatus({ connected: false });
      setLoading(false);
      return;
    }
    
    try {
      if (!showRefreshToast) {
        setLoading(true);
      }
      const response = await apiClient.get('/supabase/status', {
        'x-store-id': storeId
      });

      if (response.success) {
        setStatus(response);
        if (showRefreshToast) {
          if (response.authorizationRevoked) {
            toast.error('Authorization has been revoked', {
              description: 'Please disconnect and reconnect.'
            });
          } else if (response.connected) {
            toast.success('Connection status updated');
          }
        }
      } else {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error loading Supabase status:', error);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    await loadStatus(true);
  };

  const loadStorageStats = async () => {
    if (!status?.connected) return;
    
    try {
      setLoadingStats(true);
      const response = await apiClient.get('/supabase/storage/stats', {
        'x-store-id': storeId
      });

      if (response.success) {
        setStorageStats(response.summary);
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (status?.connected) {
      loadStorageStats();
    }
  }, [status?.connected]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // Check for and clear any logout flags that might interfere
      if (localStorage.getItem('user_logged_out') === 'true') {
        console.log('🔧 Clearing logout flag before Supabase connection');
        localStorage.removeItem('user_logged_out');
        apiClient.isLoggedOut = false;
      }
      
      const response = await apiClient.post('/supabase/connect', { store_id: storeId }, {
        'x-store-id': storeId
      });

      if (response.success) {
        // Open OAuth URL in new window
        const authWindow = window.open(
          response.authUrl,
          'supabase-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for postMessage from OAuth callback
        const messageHandler = (event) => {
          // Verify origin
          const allowedOrigins = [
            process.env.REACT_APP_API_URL,
            'https://catalyst-backend-fzhu.onrender.com',
            'http://localhost:5000'
          ];
          
          if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
            return;
          }

          if (event.data.type === 'supabase-oauth-success') {
            console.log('Supabase OAuth success:', event.data);
            window.removeEventListener('message', messageHandler);
            setConnecting(false);
            toast.success('Successfully connected to Supabase!');
            // Reload status to show connection
            setTimeout(() => {
              loadStatus();
            }, 500);
          } else if (event.data.type === 'supabase-oauth-error') {
            console.error('Supabase OAuth error:', event.data.error);
            window.removeEventListener('message', messageHandler);
            setConnecting(false);
            toast.error(event.data.error || 'Failed to connect to Supabase');
          }
        };

        window.addEventListener('message', messageHandler);

        // Also check if window is closed manually
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            setConnecting(false);
          }
        }, 1000);

        // Clean up after 5 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (connecting) {
            setConnecting(false);
            toast.error('Connection timeout. Please try again.');
          }
        }, 300000); // 5 minutes

        toast.success('Please complete the authorization in the popup window');
      } else {
        throw new Error(response.message || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      
      // Handle specific error types
      if (error.message?.includes('Session has been terminated')) {
        toast.error('Your session has expired. Please refresh the page and try again.', {
          duration: 8000,
          action: {
            label: 'Refresh Page',
            onClick: () => window.location.reload()
          }
        });
      } else {
        toast.error(error.message || 'Failed to connect to Supabase');
      }
      
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await apiClient.post('/supabase/test', { store_id: storeId }, {
        'x-store-id': storeId
      });

      if (response.success) {
        // Check if connection has limited scope
        if (response.limitedScope) {
          toast.warning('Connection successful but with limited scope. Please reconnect for full features.', {
            duration: 8000
          });
        } else {
          toast.success('Connection test successful!');
        }
        loadStatus(); // Reload status
      } else {
        throw new Error(response.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      
      // Check for scope-related errors
      if (error.message?.includes('OAuth token requires') || error.message?.includes('scope')) {
        toast.error('Your connection needs to be updated with new permissions.', {
          duration: 10000,
          description: 'Please disconnect and reconnect to Supabase to enable all features.',
          action: {
            label: 'Disconnect Now',
            onClick: () => handleDisconnect()
          }
        });
      } else if (error.message?.includes('revoked') || error.message?.includes('Authorization has been revoked')) {
        toast.error('Authorization was revoked in Supabase.', {
          duration: 10000,
          description: 'You need to disconnect the invalid connection first.',
          action: {
            label: 'Disconnect Now',
            onClick: () => handleDisconnect()
          }
        });
        // Reload status to show revoked authorization UI
        setTimeout(() => {
          loadStatus();
        }, 500);
      } else {
        toast.error(error.message || 'Connection test failed');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Supabase? This will remove access to your project.')) {
      return;
    }

    try {
      const response = await apiClient.post('/supabase/disconnect', { store_id: storeId }, {
        'x-store-id': storeId
      });

      if (response.success) {
        toast.success('Supabase disconnected successfully', {
          description: response.note || 'You may need to revoke access in your Supabase account settings.',
          duration: 8000
        });
        // Reload status to show orphaned authorization warning if applicable
        loadStatus();
        setStorageStats(null);
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const handleTestUpload = async () => {
    try {
      setTestingUpload(true);
      setUploadResult(null);
      
      const response = await apiClient.post('/supabase/storage/test-upload', { store_id: storeId }, {
        'x-store-id': storeId
      });

      if (response.success) {
        toast.success('Test image uploaded successfully!');
        setUploadResult(response);
        // Refresh storage stats
        loadStorageStats();
      } else {
        throw new Error(response.message || 'Failed to upload test image');
      }
    } catch (error) {
      console.error('Error testing upload:', error);
      toast.error(error.message || 'Failed to upload test image');
    } finally {
      setTestingUpload(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Cloud className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Supabase Integration</h3>
            <p className="text-sm text-gray-600">
              Connect your Supabase account for database and storage management
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status?.connected ? (
            <>
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh connection status"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Not Connected
            </span>
          )}
        </div>
      </div>

      {status?.oauthConfigured === false ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Cloud className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">
                Supabase OAuth Not Configured
              </h3>
              <p className="text-yellow-700 mb-4">
                The Supabase OAuth integration is not yet configured on the server. 
                Please contact your administrator to set up the following:
              </p>
              <div className="bg-yellow-100 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-900 mb-2">Required Environment Variables:</h4>
                <ul className="space-y-1 text-sm text-yellow-800 font-mono">
                  <li>• SUPABASE_OAUTH_CLIENT_ID</li>
                  <li>• SUPABASE_OAUTH_CLIENT_SECRET</li>
                  <li>• SUPABASE_OAUTH_REDIRECT_URI</li>
                </ul>
              </div>
              <div className="text-sm text-yellow-700">
                <p className="mb-2">To set up Supabase OAuth:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://supabase.com/dashboard/account/apps" target="_blank" rel="noopener noreferrer" className="underline">Supabase OAuth Apps</a></li>
                  <li>Create a new OAuth application</li>
                  <li>Set redirect URL to: <code className="bg-yellow-100 px-1">https://catalyst-backend-fzhu.onrender.com/api/supabase/callback</code></li>
                  <li>Add the credentials to your server environment</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : status?.authorizationRevoked ? (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900 mb-1">
                      Authorization Revoked
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      You revoked Catalyst's access in your Supabase account, but the connection wasn't removed here.
                      Please disconnect and reconnect to restore access.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="ml-3 p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                    title="Recheck authorization status"
                  >
                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                {status.projectUrl && (
                  <p className="text-xs text-red-600 mb-3">
                    Last known project: {status.projectUrl}
                  </p>
                )}
                <div className="space-y-3">
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect Invalid Connection
                  </button>
                  <p className="text-xs text-red-600">
                    After disconnecting, you can reconnect with a valid authorization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : status?.hasOrphanedAuthorization ? (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-900 mb-1">
                  Authorization May Still Be Active
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  You disconnected Catalyst from Supabase, but the app may still be authorized in your Supabase account.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">
                    To completely revoke access:
                  </p>
                  <ol className="text-sm text-orange-700 list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://supabase.com/dashboard/account/apps" target="_blank" rel="noopener noreferrer" className="underline">Supabase Authorized Apps</a></li>
                    <li>Find "Catalyst" in the list</li>
                    <li>Click "Revoke Access"</li>
                  </ol>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Cloud className="mr-2 h-4 w-4" />
                        Reconnect Supabase
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : status?.connected ? (
        <div className="space-y-6">
          {/* Scope Warning */}
          {(status.projectUrl === 'https://pending-configuration.supabase.co' || 
            status.projectUrl === 'pending_configuration' ||
            status.limitedScope) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Cloud className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">
                    Connection Needs Update
                  </h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Your OAuth app doesn't have the required permissions. To fix this:
                  </p>
                  <ol className="text-sm text-yellow-700 mb-3 list-decimal list-inside space-y-1">
                    <li>Go to your Supabase OAuth app settings</li>
                    <li>Add these scopes: projects:read, projects:write, secrets:read</li>
                    <li>Save the OAuth app changes</li>
                    <li>Click the button below to reconnect</li>
                  </ol>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                  >
                    Disconnect and Reconnect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connection Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-1">
                  Connected to Supabase Project
                </h4>
                <p className="text-sm text-green-700 mb-2">
                  Project URL: {status.projectUrl}
                </p>
                <div className="text-xs text-green-600">
                  <p>Connection Status: {status.connectionStatus || 'Unknown'}</p>
                  {status.lastTestedAt && (
                    <p>Last Tested: {new Date(status.lastTestedAt).toLocaleString()}</p>
                  )}
                  {status.expiresAt && (
                    <p className={status.isExpired ? 'text-red-600' : ''}>
                      Token Expires: {new Date(status.expiresAt).toLocaleString()}
                      {status.isExpired && ' (Expired - will be auto-refreshed)'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Storage Statistics */}
          {storageStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Image className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Storage Usage
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">{storageStats.totalFiles}</p>
                      <p className="text-blue-600">Total Files</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">{storageStats.totalSizeMB} MB</p>
                      <p className="text-blue-600">Storage Used</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">{storageStats.totalSizeGB} GB</p>
                      <p className="text-blue-600">Total Size</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={loadStorageStats}
                  disabled={loadingStats}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            <button
              onClick={handleTestUpload}
              disabled={testingUpload}
              className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {testingUpload ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Test Upload
                </>
              )}
            </button>

            <button
              onClick={() => window.open(status.projectUrl, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open Project
              <ExternalLink className="ml-2 h-4 w-4" />
            </button>

            <button
              onClick={handleDisconnect}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Disconnect
            </button>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Image className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900 mb-1">
                    Test Upload Successful!
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    {uploadResult.message}
                  </p>
                  {uploadResult.url && (
                    <div className="space-y-2">
                      <p className="text-xs text-green-600">
                        <strong>File URL:</strong> 
                        <a 
                          href={uploadResult.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 underline hover:text-green-800"
                        >
                          {uploadResult.url}
                        </a>
                      </p>
                      {uploadResult.publicUrl && (
                        <div className="flex items-center space-x-2">
                          <img 
                            src={uploadResult.publicUrl} 
                            alt="Test upload" 
                            className="w-8 h-8 rounded border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-green-600">Image served from Supabase CDN</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Available Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Image className="w-4 h-4 text-green-500" />
                <span>Image Storage & CDN</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Cloud className="w-4 h-4 text-green-500" />
                <span>Database Management</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <span>Storage Analytics</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ExternalLink className="w-4 h-4 text-green-500" />
                <span>Project Dashboard Access</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect to Supabase
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Connect your Supabase account to enable database management and image storage for your store.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Cloud className="mr-2 h-5 w-5" />
                  Connect Supabase Account
                </>
              )}
            </button>

            <div className="text-xs text-gray-500 max-w-md mx-auto">
              <p>
                By connecting, you authorize Catalyst to access your Supabase project for 
                database operations and file storage management.
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">What you'll get:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-gray-400" />
                <span>Automatic image uploads to Supabase Storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-gray-400" />
                <span>Database management for your store data</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span>Storage usage analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span>Access to Supabase dashboard</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseIntegration;