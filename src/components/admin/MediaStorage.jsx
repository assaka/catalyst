import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAlertTypes } from '@/hooks/useAlert';
import SupabaseStorage from './SupabaseStorage';
import apiClient from '@/lib/api-client';
import {
  Image,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
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
  const [productStatus, setProductStatus] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

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
      const data = await apiClient.get(`/images/stats/${storeId}`);
      
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
      const data = await apiClient.get(`/images/product-status/${storeId}?limit=10`);
      
      if (data.success) {
        setProductStatus(data.products);
      }
    } catch (error) {
      console.error('Error loading product status:', error);
    }
  };


  const getProcessingRate = () => {
    if (!stats) return 0;
    return stats.total_products > 0 ? (stats.processed_images / stats.total_products * 100) : 0;
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