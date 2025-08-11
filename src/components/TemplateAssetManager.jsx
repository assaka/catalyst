import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  Code,
  Palette,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileCode,
  Database,
  Cloud,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';

const TemplateAssetManager = ({ storeId, templateId, onAssetsChange }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [separatingJs, setSeparatingJs] = useState(false);
  const [stats, setStats] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState(null);

  useEffect(() => {
    loadAssets();
    loadStats();
    checkSupabaseConnection();
  }, [storeId, templateId]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/stores/${storeId}/template-customization/assets`, {
        params: { template_id: templateId }
      });
      
      if (response.data.success) {
        setAssets(response.data.data);
        onAssetsChange?.(response.data.data);
      }
    } catch (error) {
      console.error('Load assets error:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/template-customization/assets/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const checkSupabaseConnection = async () => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/template-customization/supabase-connections`);
      if (response.data.success) {
        setSupabaseStatus(response.data.data);
      }
    } catch (error) {
      console.error('Supabase status error:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('assets', file);
      });
      
      if (templateId) {
        formData.append('template_id', templateId);
      }

      const response = await apiClient.post(
        `/stores/${storeId}/template-customization/assets/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success(`Uploaded ${files.length} asset(s)`);
        loadAssets();
        loadStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload assets');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const separateJavaScript = async () => {
    try {
      setSeparatingJs(true);
      const response = await apiClient.post(`/stores/${storeId}/template-customization/separate-js`, {
        template_id: templateId
      });

      if (response.data.success) {
        const results = response.data.data;
        const totalExtracted = results.reduce((sum, r) => sum + r.extracted_js_count, 0);
        
        if (totalExtracted > 0) {
          toast.success(`Separated ${totalExtracted} JavaScript assets`);
          loadAssets();
          loadStats();
        } else {
          toast.info('No JavaScript code found to separate');
        }
      }
    } catch (error) {
      console.error('Separate JS error:', error);
      toast.error('Failed to separate JavaScript');
    } finally {
      setSeparatingJs(false);
    }
  };

  const deleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await apiClient.delete(`/stores/${storeId}/template-customization/assets/${assetId}`);
      
      if (response.data.success) {
        toast.success('Asset deleted successfully');
        loadAssets();
        loadStats();
      }
    } catch (error) {
      console.error('Delete asset error:', error);
      toast.error('Failed to delete asset');
    }
  };

  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'javascript': return <FileCode className="w-4 h-4" />;
      case 'css': return <Palette className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'font': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Assets</p>
                <p className="text-2xl font-bold">{stats?.totalAssets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Storage Used</p>
                <p className="text-2xl font-bold">{stats ? formatFileSize(stats.totalSize) : '0 B'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {supabaseStatus?.hasActiveConnection ? (
                <Cloud className="w-5 h-5 text-green-600" />
              ) : (
                <Database className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">Storage Type</p>
                <p className="text-lg font-medium">
                  {supabaseStatus?.hasActiveConnection ? 'Supabase' : 'Local'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets">Asset Library</TabsTrigger>
          <TabsTrigger value="separation">JS Separation</TabsTrigger>
          <TabsTrigger value="storage">Storage Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Template Assets</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAssets}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Assets'}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".js,.css,.html,.json,.png,.jpg,.jpeg,.svg,.woff,.woff2"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assets uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload JS, CSS, images, or fonts to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAssetTypeIcon(asset.asset_type)}
                        <div>
                          <p className="font-medium">{asset.asset_name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <Badge variant="outline">{asset.asset_type}</Badge>
                            <span>{formatFileSize(asset.file_size)}</span>
                            <span>{asset.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(asset.asset_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="separation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>JavaScript Separation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Code className="w-4 h-4" />
                <AlertDescription>
                  This will extract JavaScript code from your HTML templates and create separate JS files.
                  Templates will be updated to reference the external files.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Separate JavaScript from Templates</p>
                  <p className="text-sm text-gray-600">
                    Extract inline JavaScript to improve template maintainability
                  </p>
                </div>
                <Button
                  onClick={separateJavaScript}
                  disabled={separatingJs}
                >
                  {separatingJs ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4 mr-2" />
                      Separate JS
                    </>
                  )}
                </Button>
              </div>

              {/* Show JS assets */}
              <div className="space-y-2">
                <h4 className="font-medium">JavaScript Assets</h4>
                {assets.filter(a => a.asset_type === 'javascript').length === 0 ? (
                  <p className="text-sm text-gray-500">No JavaScript assets found</p>
                ) : (
                  assets
                    .filter(a => a.asset_type === 'javascript')
                    .map((asset) => (
                      <div key={asset.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <FileCode className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{asset.asset_name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {formatFileSize(asset.file_size)}
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium">Local Storage</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Assets stored on this server
                  </p>
                  <Badge variant="outline">Always Available</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">Supabase Storage</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Assets stored in your Supabase project
                  </p>
                  <Badge variant={supabaseStatus?.hasActiveConnection ? "default" : "secondary"}>
                    {supabaseStatus?.hasActiveConnection ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </div>

              {!supabaseStatus?.hasActiveConnection && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Connect your Supabase project to enable cloud storage and data migration features.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateAssetManager;