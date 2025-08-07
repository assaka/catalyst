import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlertTypes } from '@/hooks/useAlert';
import apiClient from '../../api/client';
import {
  Database,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Cloud,
  Link,
  Key,
  Shield,
  Globe,
  Zap,
  Info,
  ExternalLink,
  FolderOpen
} from 'lucide-react';

const SupabaseStorage = () => {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showError, showSuccess, showInfo, AlertComponent } = useAlertTypes();
  
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [bucketsAutoChecked, setBucketsAutoChecked] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      loadStatus();
    }
  }, [selectedStore]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const storeId = getSelectedStoreId();
      
      // Check Supabase connection status
      const response = await apiClient.get('/supabase/status', {
        'x-store-id': storeId
      });

      if (response.success) {
        setConnectionStatus(response);
        
        // Load buckets if connected
        if (response.connected && response.hasServiceRoleKey) {
          // Automatically ensure buckets exist on first load
          if (!bucketsAutoChecked) {
            await ensureBucketsQuietly();
            setBucketsAutoChecked(true);
          }
          
          await loadBuckets();
          await loadStorageStats();
        }
      }
    } catch (error) {
      console.error('Error loading Supabase status:', error);
      showError('Failed to load Supabase status');
    } finally {
      setLoading(false);
    }
  };

  const ensureBucketsQuietly = async () => {
    try {
      const storeId = getSelectedStoreId();
      
      const response = await apiClient.post('/supabase/storage/ensure-buckets', {}, {
        'x-store-id': storeId
      });

      if (response.success) {
        if (response.bucketsCreated && response.bucketsCreated.length > 0) {
          showInfo(`Automatically created buckets: ${response.bucketsCreated.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring buckets:', error);
    }
  };

  const loadBuckets = async () => {
    try {
      const storeId = getSelectedStoreId();
      const response = await apiClient.get('/supabase/storage/buckets', {
        'x-store-id': storeId
      });

      if (response.success) {
        setBuckets(response.buckets || []);
      }
    } catch (error) {
      console.error('Error loading buckets:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const storeId = getSelectedStoreId();
      const response = await apiClient.get('/supabase/storage/stats', {
        'x-store-id': storeId
      });

      if (response.success) {
        setStorageStats(response.summary);
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleTestUpload = async () => {
    try {
      setTesting(true);
      setUploadResult(null);
      const storeId = getSelectedStoreId();
      
      const response = await apiClient.post('/supabase/storage/test-upload', {}, {
        'x-store-id': storeId
      });

      if (response.success) {
        showSuccess('Test upload successful!');
        setUploadResult(response);
        await loadBuckets();
        await loadStorageStats();
      } else {
        throw new Error(response.message || 'Test upload failed');
      }
    } catch (error) {
      console.error('Error testing upload:', error);
      showError(error.message || 'Failed to test upload');
    } finally {
      setTesting(false);
    }
  };

  const handleEnsureBuckets = async () => {
    try {
      setUploading(true);
      const storeId = getSelectedStoreId();
      
      const response = await apiClient.post('/supabase/storage/ensure-buckets', {}, {
        'x-store-id': storeId
      });

      if (response.success) {
        if (response.bucketsCreated && response.bucketsCreated.length > 0) {
          showSuccess(`Created buckets: ${response.bucketsCreated.join(', ')}`);
        } else {
          showInfo('All required buckets already exist');
        }
        await loadBuckets();
      }
    } catch (error) {
      console.error('Error ensuring buckets:', error);
      showError(error.message || 'Failed to create buckets');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertComponent />

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Supabase Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      {connectionStatus.projectUrl || 'Supabase project connected'}
                    </p>
                  </div>
                </div>
                {connectionStatus.hasServiceRoleKey && (
                  <Badge className="bg-green-100 text-green-700">
                    <Key className="w-3 h-3 mr-1" />
                    Full Access
                  </Badge>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleTestUpload}
                  disabled={testing}
                  variant="outline"
                  size="sm"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Test Upload
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEnsureBuckets}
                  disabled={uploading}
                  variant="outline"
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Ensure Buckets
                    </>
                  )}
                </Button>
                <Button
                  onClick={loadStatus}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Not Connected</p>
                  <p className="text-sm text-amber-700">
                    Please connect Supabase in the Integrations section
                  </p>
                  <a
                    href="/admin/integrations"
                    className="text-sm text-blue-600 underline hover:text-blue-700 mt-2 inline-block"
                  >
                    Go to Integrations →
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Overview - Combined Stats and Buckets */}
      {connectionStatus?.connected && connectionStatus?.hasServiceRoleKey && (
        <>
          {/* Storage Usage Overview */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Storage Overview</h2>
                <p className="text-gray-600">Monitor your Supabase storage usage and performance metrics</p>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
            </div>

            {storageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Files Card */}
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="w-4 h-4 text-blue-100" />
                          <p className="text-sm font-medium text-blue-100">Total Files</p>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                          {storageStats.totalFiles || 0}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-blue-100">
                          <CheckCircle className="w-3 h-3" />
                          <span>All formats supported</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                        <FolderOpen className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Used Card */}
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Cloud className="w-4 h-4 text-purple-100" />
                          <p className="text-sm font-medium text-purple-100">Storage Used</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className="text-3xl font-bold">
                            {storageStats.totalSizeMB ? Number(storageStats.totalSizeMB).toFixed(1) : '0.0'}
                          </p>
                          <span className="text-lg font-medium text-purple-100">MB</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-purple-100 mt-1">
                          <Zap className="w-3 h-3" />
                          <span>Optimized compression</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                        <Cloud className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Buckets Card */}
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-emerald-100" />
                          <p className="text-sm font-medium text-emerald-100">Active Buckets</p>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                          {buckets.length}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-emerald-100">
                          <Shield className="w-3 h-3" />
                          <span>Secure & scalable</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                        <Database className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Storage Buckets */}
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Storage Buckets</h2>
                <p className="text-gray-600">Manage your organized storage containers</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                  <Database className="w-3 h-3 mr-1" />
                  {buckets.length} Active
                </Badge>
              </div>
            </div>

            {buckets.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {buckets.map((bucket) => {
                  // Find the corresponding stats for this bucket
                  const bucketStats = storageStats?.buckets?.find(
                    stat => stat.bucket === bucket.name
                  );
                  
                  // Determine bucket color scheme based on type
                  const isImageBucket = bucket.name.includes('images');
                  const colorScheme = isImageBucket 
                    ? { 
                        bg: 'from-violet-500 to-purple-600', 
                        accent: 'violet',
                        light: 'violet-50',
                        text: 'violet-700'
                      }
                    : { 
                        bg: 'from-blue-500 to-indigo-600', 
                        accent: 'blue',
                        light: 'blue-50',
                        text: 'blue-700'
                      };
                  
                  return (
                    <Card key={bucket.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} opacity-5`}></div>
                      
                      {/* Bucket Header */}
                      <CardHeader className="relative border-b border-gray-100 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gradient-to-br ${colorScheme.bg} rounded-2xl shadow-lg`}>
                              <FolderOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{bucket.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Created {new Date(bucket.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {bucket.public ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                <Globe className="w-3 h-3 mr-1" />
                                Public Access
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                <Shield className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Bucket Statistics */}
                      <CardContent className="relative pt-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {/* Files Count */}
                          <div className={`bg-${colorScheme.light} border border-${colorScheme.text}/20 rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FolderOpen className={`w-4 h-4 text-${colorScheme.text}`} />
                                <p className={`text-xs font-semibold text-${colorScheme.text} uppercase tracking-wide`}>Files</p>
                              </div>
                              <Badge className={`bg-${colorScheme.text}/10 text-${colorScheme.text} text-xs`}>
                                {bucketStats?.fileCount === 1 ? 'item' : 'items'}
                              </Badge>
                            </div>
                            <p className={`text-3xl font-bold text-${colorScheme.text}`}>
                              {bucketStats?.fileCount || 0}
                            </p>
                          </div>
                          
                          {/* Storage Size */}
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-amber-600" />
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Size</p>
                              </div>
                              <Badge className="bg-amber-100 text-amber-700 text-xs">
                                MB
                              </Badge>
                            </div>
                            <p className="text-3xl font-bold text-amber-700">
                              {bucketStats?.totalSizeMB || '0.00'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Bucket Details */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Bucket Details</h4>
                            <Badge className="bg-gray-200 text-gray-600 text-xs font-mono">
                              ID
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 font-mono break-all">
                            {bucket.id}
                          </p>
                          
                          {/* Usage Indicator */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Usage Status</span>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-emerald-600 font-medium">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="relative mb-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-fit mx-auto">
                        <Cloud className="w-12 h-12 text-blue-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Configuring Storage Buckets</h3>
                    <p className="text-gray-600 mb-4">
                      We're automatically setting up your storage buckets with optimal configurations for your store.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>This process typically completes within seconds</span>
                    </div>
                    <Button
                      onClick={loadStatus}
                      variant="outline"
                      size="sm"
                      className="mt-6"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Check Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Test Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Test Upload Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Path:</span>
                <span className="text-sm font-mono">{uploadResult.path}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bucket:</span>
                <span className="text-sm font-mono">{uploadResult.bucket}</span>
              </div>
              {uploadResult.publicUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Public URL:</span>
                  <a
                    href={uploadResult.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Supabase Storage Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Automatic Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Automatic bucket creation on connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Direct integration with your database</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Row Level Security for protected access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>CDN URLs generated automatically</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Storage Buckets</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span><strong>suprshop-catalog:</strong> Product and Category assets</span>
                </li>
                <li className="flex items-start gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span><strong>suprshop-assets:</strong> Other store assets</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-purple-500 mt-0.5" />
                  <span>Both buckets are public by default</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>No credit charges - completely free</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseStorage;