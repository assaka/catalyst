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
          {/* Storage Usage Summary */}
          {storageStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Total Files</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {storageStats.totalFiles || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FolderOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">Storage Used</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {storageStats.totalSizeMB ? Number(storageStats.totalSizeMB).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">MB</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Cloud className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Active Buckets</p>
                      <p className="text-3xl font-bold text-green-900">
                        {buckets.length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Storage Buckets */}
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Storage Buckets
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Cloud className="w-4 h-4" />
                  {buckets.length} bucket{buckets.length !== 1 ? 's' : ''} configured
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {buckets.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {buckets.map((bucket) => {
                    // Find the corresponding stats for this bucket
                    const bucketStats = storageStats?.buckets?.find(
                      stat => stat.bucket === bucket.name
                    );
                    
                    return (
                      <div
                        key={bucket.id}
                        className="group relative border-2 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 overflow-hidden"
                      >
                        {/* Bucket Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{bucket.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Created {new Date(bucket.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {bucket.public ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                <Shield className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Bucket Stats */}
                        <div className="p-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                <p className="text-xs font-medium text-blue-600">Files</p>
                              </div>
                              <p className="text-2xl font-bold text-blue-900">
                                {bucketStats?.fileCount || 0}
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Cloud className="w-4 h-4 text-purple-600" />
                                <p className="text-xs font-medium text-purple-600">Size</p>
                              </div>
                              <p className="text-2xl font-bold text-purple-900">
                                {bucketStats?.totalSizeMB || '0.00'}
                                <span className="text-xs font-normal ml-1">MB</span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Bucket ID */}
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 font-mono">
                              ID: {bucket.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-12 text-center bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="max-w-sm mx-auto">
                  <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                    <Cloud className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up storage buckets</h3>
                  <p className="text-gray-600 mb-3">
                    Your storage buckets are being automatically configured for optimal performance.
                  </p>
                  <p className="text-sm text-gray-500">
                    This usually takes a few seconds. Click "Refresh" if this persists.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                  <span><strong>suprshop-images:</strong> Product images</span>
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