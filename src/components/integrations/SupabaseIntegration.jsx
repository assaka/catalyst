import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { ExternalLink, Trash2, Cloud, Image, BarChart3, Key, AlertCircle, Info, Copy, ArrowRight } from 'lucide-react';

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
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [changingProject, setChangingProject] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [showServiceRole, setShowServiceRole] = useState(false);
  const [buckets, setBuckets] = useState([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPublic, setNewBucketPublic] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [deletingBucket, setDeletingBucket] = useState(null);

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
          if (response.authorizationRevoked && response.autoDisconnected) {
            toast.info('Invalid connection was automatically removed', {
              description: 'You can now reconnect with a valid authorization.'
            });
          } else if (response.authorizationRevoked) {
            toast.warning('Authorization revoked - removing connection...', {
              description: 'The invalid connection is being removed automatically.'
            });
            // Refresh again in 1 second to show the auto-disconnected state
            setTimeout(() => {
              loadStatus(false);
            }, 1000);
          } else if (response.connected) {
            toast.success('Connection status updated');
          }
        } else if (response.authorizationRevoked && !response.autoDisconnected) {
          // If we detect revoked authorization without toast, still refresh to show auto-disconnect
          setTimeout(() => {
            loadStatus(false);
          }, 500);
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
      // Don't show error toast for limited scope connections
      if (!status?.limitedScope && !error.message?.includes('Service role key')) {
        toast.error('Could not load storage statistics', {
          description: 'Storage access may be limited without full permissions.'
        });
      }
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (status?.connected) {
      loadStorageStats();
      // Load projects if we have proper permissions
      if (!status.limitedScope && status.projectUrl !== 'https://pending-configuration.supabase.co') {
        loadProjects();
      }
    }
  }, [status?.connected]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await apiClient.get('/supabase/projects', {
        'x-store-id': storeId
      });

      if (response.success) {
        setProjects(response.projects || []);
        // Set the selected project ID based on current project
        const currentProject = response.projects?.find(p => p.isCurrent);
        if (currentProject) {
          setSelectedProjectId(currentProject.id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Don't show error for limited scope connections
      if (!status?.limitedScope) {
        toast.error('Could not load projects list');
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectChange = async (projectId) => {
    if (!projectId || projectId === selectedProjectId) return;
    
    try {
      setChangingProject(true);
      const response = await apiClient.post('/supabase/select-project', 
        { projectId },
        { 'x-store-id': storeId }
      );

      if (response.success) {
        toast.success(response.message || 'Project changed successfully');
        setSelectedProjectId(projectId);
        // Reload status and storage stats
        loadStatus();
        loadStorageStats();
      } else {
        throw new Error(response.message || 'Failed to change project');
      }
    } catch (error) {
      console.error('Error changing project:', error);
      toast.error(error.message || 'Failed to change project');
    } finally {
      setChangingProject(false);
    }
  };

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

  const handleSaveKeys = async () => {
    if (!anonKey && !serviceRoleKey) {
      toast.error('Please provide at least the anon key');
      return;
    }

    setSavingKeys(true);
    try {
      const response = await apiClient.post('/supabase/update-config', {
        projectId: selectedProjectId,
        anonKey: anonKey || undefined,
        serviceRoleKey: serviceRoleKey || undefined
      }, {
        'x-store-id': storeId
      });

      if (response.success) {
        toast.success('API keys configured successfully!');
        setAnonKey('');
        setServiceRoleKey('');
        setShowKeyConfig(false);
        // Refresh status
        await loadStatus();
      } else {
        throw new Error(response.message || 'Failed to save API keys');
      }
    } catch (error) {
      console.error('Error saving keys:', error);
      toast.error(error.message || 'Failed to save API keys');
    } finally {
      setSavingKeys(false);
    }
  };

  const loadBuckets = async () => {
    if (!status?.connected) return;
    
    setLoadingBuckets(true);
    try {
      const response = await apiClient.get('/supabase/storage/buckets', {
        'x-store-id': storeId
      });

      if (response.success) {
        setBuckets(response.buckets || []);
        if (response.limited) {
          toast.info('Showing default buckets. Service role key required for full bucket management.');
        }
      } else {
        throw new Error(response.message || 'Failed to load buckets');
      }
    } catch (error) {
      console.error('Error loading buckets:', error);
      toast.error('Failed to load storage buckets');
    } finally {
      setLoadingBuckets(false);
    }
  };

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Please enter a bucket name');
      return;
    }

    // Validate bucket name
    const validBucketName = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/;
    if (!validBucketName.test(newBucketName)) {
      toast.error('Bucket name must start and end with alphanumeric characters and can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }

    setCreatingBucket(true);
    try {
      const response = await apiClient.post('/supabase/storage/buckets', {
        name: newBucketName,
        public: newBucketPublic
      }, {
        'x-store-id': storeId
      });

      if (response.success) {
        toast.success(response.message || `Bucket "${newBucketName}" created successfully`);
        setNewBucketName('');
        setNewBucketPublic(false);
        setShowCreateBucket(false);
        await loadBuckets(); // Reload buckets list
      } else {
        throw new Error(response.message || 'Failed to create bucket');
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
      toast.error(error.message || 'Failed to create bucket');
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleDeleteBucket = async (bucketId) => {
    if (!confirm(`Are you sure you want to delete the bucket "${bucketId}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingBucket(bucketId);
    try {
      const response = await apiClient.delete(`/supabase/storage/buckets/${bucketId}`, {
        'x-store-id': storeId
      });

      if (response.success) {
        toast.success(response.message || `Bucket "${bucketId}" deleted successfully`);
        await loadBuckets(); // Reload buckets list
      } else {
        throw new Error(response.message || 'Failed to delete bucket');
      }
    } catch (error) {
      console.error('Error deleting bucket:', error);
      toast.error(error.message || 'Failed to delete bucket');
    } finally {
      setDeletingBucket(null);
    }
  };

  // Load buckets when component is connected
  useEffect(() => {
    if (status?.connected && !status.authorizationRevoked) {
      loadBuckets();
    }
  }, [status?.connected, status?.authorizationRevoked]);

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
      ) : status?.authorizationRevoked && status?.autoDisconnected ? (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Connection Automatically Removed
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Your authorization was revoked in Supabase, so we've automatically disconnected the invalid connection.
                </p>
                {status.lastKnownProjectUrl && (
                  <p className="text-xs text-blue-600 mb-3">
                    Last known project: {status.lastKnownProjectUrl}
                  </p>
                )}
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-4 w-4" />
                      Reconnect to Supabase
                    </>
                  )}
                </button>
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
                      Authorization Revoked - Disconnecting...
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      Detected revoked authorization. Automatically removing invalid connection...
                    </p>
                  </div>
                  <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                </div>
                {status.projectUrl && (
                  <p className="text-xs text-red-600 mb-3">
                    Last known project: {status.projectUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : status?.wasAutoDisconnected ? (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Ready to Reconnect
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  The previous connection was removed after authorization was revoked. You can now connect with a new authorization.
                </p>
                {status.lastKnownProjectUrl && (
                  <p className="text-xs text-gray-600 mb-3">
                    Previous project: {status.lastKnownProjectUrl}
                  </p>
                )}
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
                      Connect Supabase
                    </>
                  )}
                </button>
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
                
                {/* Project Selector Dropdown */}
                {projects.length > 1 && !status.limitedScope && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-green-700">
                        Select Project:
                      </label>
                      <button
                        onClick={loadProjects}
                        disabled={loadingProjects}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="Refresh projects list"
                      >
                        <svg className={`w-3 h-3 ${loadingProjects ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <select
                      value={selectedProjectId || ''}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      disabled={changingProject || loadingProjects}
                      className="block w-full px-3 py-2 text-sm border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                      {loadingProjects ? (
                        <option>Loading projects...</option>
                      ) : (
                        <>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name} {project.isCurrent ? '(current)' : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {changingProject && (
                      <p className="text-xs text-green-600 mt-1">Switching project...</p>
                    )}
                  </div>
                )}
                
                {/* Show message if projects couldn't be loaded but we're connected */}
                {!status.limitedScope && status.projectUrl && status.projectUrl !== 'https://pending-configuration.supabase.co' && (
                  <div className="mb-2">
                    <p className="text-sm text-green-700">
                      Project URL: {status.projectUrl}
                    </p>
                  </div>
                )}
                
                {/* Single Project */}
                {projects.length === 1 && !status.limitedScope && (
                  <div className="mb-2">
                    <p className="text-sm text-green-700">
                      Project: <span className="font-medium">{projects[0].name}</span>
                    </p>
                    <p className="text-xs text-green-600">
                      {status.projectUrl}
                    </p>
                  </div>
                )}
                
                {/* Limited scope - no project selection */}
                {status.limitedScope && (
                  <p className="text-sm text-green-700 mb-2">
                    Project URL: {status.projectUrl}
                  </p>
                )}
                
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

          {/* API Key Configuration */}
          {(!status.hasAnonKey || showKeyConfig) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">
                    Configure API Keys
                  </h4>
                  <p className="text-sm text-amber-700 mb-4">
                    Supabase Storage requires API keys for authentication. Copy them from your Supabase dashboard.
                  </p>
                  
                  {/* Instructions */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">How to get your keys:</p>
                    <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                      <li>Go to your <a href={`https://supabase.com/dashboard/project/${selectedProjectId || 'your-project'}/settings/api`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase API Settings</a></li>
                      <li>Copy the "anon" key (public key)</li>
                      <li>Optionally copy the "service_role" key for server-side operations</li>
                      <li>Paste them below and save</li>
                    </ol>
                  </div>

                  {/* Key Input Fields */}
                  <div className="space-y-3">
                    {/* Anon Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anon Key (Required)
                      </label>
                      <input
                        type="password"
                        value={anonKey}
                        onChange={(e) => setAnonKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={savingKeys}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the public API key used for client-side operations
                      </p>
                    </div>

                    {/* Service Role Key (Optional) */}
                    <div>
                      <button
                        onClick={() => setShowServiceRole(!showServiceRole)}
                        className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                      >
                        {showServiceRole ? '−' : '+'} Advanced: Service Role Key (Optional)
                      </button>
                      
                      {showServiceRole && (
                        <>
                          <input
                            type="password"
                            value={serviceRoleKey}
                            onChange={(e) => setServiceRoleKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={savingKeys}
                          />
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            <p className="text-xs text-yellow-800 flex items-start">
                              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                              Keep this key secret! It has admin privileges. Only add if you need server-side operations.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveKeys}
                      disabled={savingKeys || (!anonKey && !serviceRoleKey)}
                      className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center ${
                        savingKeys || (!anonKey && !serviceRoleKey)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {savingKeys ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save API Keys
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show success message if keys are configured */}
          {status.hasAnonKey && !showKeyConfig && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-green-800 font-medium">API Keys Configured</p>
                    <p className="text-green-600 text-sm">Storage operations are enabled</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyConfig(true)}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  Reconfigure Keys
                </button>
              </div>
            </div>
          )}

          {/* Storage Buckets Management */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Storage Buckets</h4>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadBuckets}
                  disabled={loadingBuckets}
                  className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Refresh buckets"
                >
                  <svg className={`w-4 h-4 ${loadingBuckets ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowCreateBucket(true)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Bucket
                </button>
              </div>
            </div>

            {/* Buckets List */}
            {loadingBuckets ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading buckets...</p>
              </div>
            ) : buckets.length > 0 ? (
              <div className="space-y-2">
                {buckets.map((bucket) => (
                  <div key={bucket.id || bucket.name} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Cloud className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bucket.name}</p>
                        <p className="text-xs text-gray-500">
                          {bucket.public ? 'Public' : 'Private'} bucket
                          {bucket.created_at && ` • Created ${new Date(bucket.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBucket(bucket.id || bucket.name)}
                      disabled={deletingBucket === (bucket.id || bucket.name)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Delete bucket"
                    >
                      {deletingBucket === (bucket.id || bucket.name) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No buckets found</p>
                <p className="text-xs text-gray-500 mt-1">Create your first bucket to start storing files</p>
              </div>
            )}

            {/* Create Bucket Modal */}
            {showCreateBucket && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Create New Bucket</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bucket Name
                      </label>
                      <input
                        type="text"
                        value={newBucketName}
                        onChange={(e) => setNewBucketName(e.target.value.toLowerCase())}
                        placeholder="my-bucket-name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={creatingBucket}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use lowercase letters, numbers, hyphens, and underscores only
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newBucketPublic}
                          onChange={(e) => setNewBucketPublic(e.target.checked)}
                          disabled={creatingBucket}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Make bucket publicly accessible</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Public buckets allow direct access to files via URLs
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowCreateBucket(false);
                        setNewBucketName('');
                        setNewBucketPublic(false);
                      }}
                      disabled={creatingBucket}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBucket}
                      disabled={creatingBucket || !newBucketName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {creatingBucket ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Bucket'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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