import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/functions';
import { ExternalLink, Trash2, Cloud, Image, BarChart3 } from 'lucide-react';

const SupabaseIntegration = ({ storeId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [storeId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/supabase/status', {
        method: 'GET',
        headers: {
          'x-store-id': storeId
        }
      });

      if (response.success) {
        setStatus(response);
      } else {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error loading Supabase status:', error);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    if (!status?.connected) return;
    
    try {
      setLoadingStats(true);
      const response = await apiRequest('/supabase/storage/stats', {
        method: 'GET',
        headers: {
          'x-store-id': storeId
        }
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
      const response = await apiRequest('/supabase/connect', {
        method: 'POST',
        headers: {
          'x-store-id': storeId
        }
      });

      if (response.success) {
        // Open OAuth URL in new window
        const authWindow = window.open(
          response.authUrl,
          'supabase-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // Reload status after OAuth
            setTimeout(() => {
              loadStatus();
            }, 1000);
          }
        }, 1000);

        toast.success('Please complete the authorization in the popup window');
      } else {
        throw new Error(response.message || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      toast.error(error.message || 'Failed to connect to Supabase');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await apiRequest('/supabase/test', {
        method: 'POST',
        headers: {
          'x-store-id': storeId
        }
      });

      if (response.success) {
        toast.success('Connection test successful!');
        loadStatus(); // Reload status
      } else {
        throw new Error(response.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error(error.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Supabase? This will remove access to your project.')) {
      return;
    }

    try {
      const response = await apiRequest('/supabase/disconnect', {
        method: 'POST',
        headers: {
          'x-store-id': storeId
        }
      });

      if (response.success) {
        toast.success('Supabase disconnected successfully');
        setStatus({ connected: false });
        setStorageStats(null);
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error(error.message || 'Failed to disconnect');
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Not Connected
            </span>
          )}
        </div>
      </div>

      {status?.connected ? (
        <div className="space-y-6">
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
          <div className="flex space-x-3">
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