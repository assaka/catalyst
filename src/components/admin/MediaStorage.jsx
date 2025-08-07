import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAlertTypes } from '@/hooks/useAlert';
import SupabaseStorage from './SupabaseStorage';
import {
  Image,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PlayCircle,
  Pause,
  AlertTriangle,
  Cloud,
  DollarSign,
  Crown,
  Zap,
  Server,
  Database,
  Info
} from 'lucide-react';

const MediaStorage = () => {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showError, showSuccess, showInfo, AlertComponent } = useAlertTypes();
  
  // State management
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [testingConfig, setTestingConfig] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [productStatus, setProductStatus] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Processing options
  const [batchSize, setBatchSize] = useState(50);
  const [concurrency, setConcurrency] = useState(2);
  const [forceReprocess, setForceReprocess] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState('');

  // CDN Providers data
  const cdnProviders = [
    {
      id: 'supabase',
      name: 'Supabase Storage',
      description: 'Built-in storage with your Supabase project',
      icon: Database,
      cost: 'Free',
      costType: 'free',
      features: ['Integrated with Database', 'Row Level Security', 'Direct API Access', 'Auto-generated CDN URLs'],
      status: 'available',
      default: true,
      popular: true
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare CDN',
      description: 'Global CDN with 200+ edge locations',
      icon: Cloud,
      cost: 'Free',
      costType: 'free',
      features: ['Global CDN', 'Image Optimization', 'DDoS Protection', 'SSL/TLS'],
      status: 'coming-soon'
    },
    {
      id: 'google-cloud',
      name: 'Google Cloud Storage',
      description: 'Scalable object storage with global edge caching',
      icon: Server,
      cost: '1 Credit/day',
      costType: 'credits',
      features: ['Global Distribution', 'Auto-scaling', 'Advanced Analytics', 'ML Integration'],
      status: 'coming-soon'
    },
    {
      id: 'aws-s3',
      name: 'AWS S3 + CloudFront',
      description: 'Enterprise-grade storage with Amazon\'s global network',
      icon: Database,
      cost: '1 Credit/day',
      costType: 'credits',
      features: ['99.999999999% Durability', 'Global Edge Network', 'Advanced Security', 'Cost Optimization'],
      status: 'coming-soon'
    }
  ];

  useEffect(() => {
    if (selectedStore) {
      loadStats();
      loadProductStatus();
    }
  }, [selectedStore]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const storeId = getSelectedStoreId();
      const response = await fetch(`/api/images/stats/${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        showError('Failed to load image statistics');
      }
    } catch (error) {
      showError('Error loading statistics: ' + error.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadProductStatus = async () => {
    try {
      const storeId = getSelectedStoreId();
      const response = await fetch(`/api/images/product-status/${storeId}?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setProductStatus(data.products);
      }
    } catch (error) {
      console.error('Error loading product status:', error);
    }
  };

  const testConfiguration = async () => {
    try {
      setTestingConfig(true);
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/images/test-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: storeId,
          test_url: testImageUrl || undefined
        })
      });
      
      const data = await response.json();
      setConfigTest(data);
      
      if (data.success) {
        showSuccess('Configuration test completed successfully!');
      } else {
        showError('Configuration test failed: ' + data.error);
      }
    } catch (error) {
      showError('Error testing configuration: ' + error.message);
      setConfigTest({ success: false, error: error.message });
    } finally {
      setTestingConfig(false);
    }
  };

  const processImages = async () => {
    try {
      setProcessing(true);
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/images/process-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: storeId,
          limit: batchSize,
          force_reprocess: forceReprocess,
          concurrency: concurrency
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully processed ${data.processed} out of ${data.total} products`);
        loadStats();
        loadProductStatus();
      } else {
        showError('Image processing failed: ' + data.error);
      }
    } catch (error) {
      showError('Error processing images: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getProcessingRate = () => {
    if (!stats) return 0;
    return stats.total_products > 0 ? (stats.processed_images / stats.total_products * 100) : 0;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const CDNProviderCard = ({ provider }) => (
    <Card className={`relative ${provider.status === 'available' ? 'border-green-200' : 'border-gray-200 opacity-75'}`}>
      {provider.default && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Default
          </Badge>
        </div>
      )}
      {provider.popular && !provider.default && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <provider.icon className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg">{provider.name}</h3>
            <p className="text-sm text-gray-600 font-normal">{provider.description}</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {provider.costType === 'free' ? (
              <Zap className="w-4 h-4 text-green-500" />
            ) : (
              <DollarSign className="w-4 h-4 text-blue-500" />
            )}
            <span className="font-medium">{provider.cost}</span>
          </div>
          
          {provider.status === 'available' ? (
            <Badge className="bg-green-100 text-green-700">Available</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
          )}
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Features:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {provider.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        {provider.status === 'available' ? (
          <Button 
            className="w-full" 
            disabled={provider.id !== 'supabase'}
          >
            {provider.id === 'supabase' ? 'Configured Above' : `Configure ${provider.name}`}
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a store to manage media storage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Storage</h1>
          <p className="text-gray-600 mt-1">Manage and deliver media files through global CDN networks</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadStats}
            variant="outline"
            disabled={loadingStats}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Overview - Without Total Products and With Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold">{stats?.processed_images || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing Rate</p>
                <p className="text-2xl font-bold">{getProcessingRate().toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <Progress value={getProcessingRate()} className="w-6 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supabase Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Supabase Storage Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupabaseStorage />
        </CardContent>
      </Card>

      {/* Processing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testUrl">Test Image URL (optional)</Label>
              <Input
                id="testUrl"
                value={testImageUrl}
                onChange={(e) => setTestImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <Button
              onClick={testConfiguration}
              disabled={testingConfig}
              className="w-full"
            >
              {testingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Configuration...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Configuration
                </>
              )}
            </Button>
            
            {configTest && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(configTest.success ? 'connected' : 'error')}
                  <span className="font-medium">
                    {configTest.success ? 'Configuration Valid' : 'Configuration Error'}
                  </span>
                </div>
                
                {!configTest.success && (
                  <p className="text-red-600 text-sm mt-2">{configTest.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Process Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  min="1"
                  max="200"
                />
              </div>
              
              <div>
                <Label htmlFor="concurrency">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  min="1"
                  max="5"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="forceReprocess"
                checked={forceReprocess}
                onChange={(e) => setForceReprocess(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="forceReprocess">Force reprocess existing images</Label>
            </div>
            
            <Button
              onClick={processImages}
              disabled={processing}
              className="w-full"
              variant={processing ? "secondary" : "default"}
            >
              {processing ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Processing Images...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Processing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CDN Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            CDN Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cdnProviders.map((provider) => (
              <CDNProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Credit System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Storage Options</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Supabase Storage (Available):</strong> Completely free - included with your Supabase project</li>
              <li>• <strong>Coming Soon:</strong> Cloudflare CDN, Google Cloud Storage, and AWS S3</li>
              <li>• Future paid options will cost 1 credit per day when active</li>
              <li>• Credits will only be consumed on days when the service processes images</li>
              <li>• You'll be able to switch between providers anytime</li>
              <li>• Free tier will include 30 credits per month for paid options</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Products Status */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Products Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {productStatus.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.image_count} images</p>
                    <div className="flex gap-2">
                      {product.processed_images > 0 && (
                        <Badge variant="secondary">
                          {product.processed_images} processed
                        </Badge>
                      )}
                      {product.cloudflare_images > 0 && (
                        <Badge variant="default">
                          {product.cloudflare_images} Cloudflare
                        </Badge>
                      )}
                      {product.fallback_images > 0 && (
                        <Badge variant="outline">
                          {product.fallback_images} fallback
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {product.has_images ? (
                    product.processed_images > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
            
            {productStatus.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found or still loading...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertComponent />
    </div>
  );
};

export default MediaStorage;