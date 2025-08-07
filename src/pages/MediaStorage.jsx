import React, { useState } from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabaseStorage from '../components/admin/SupabaseStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Database, 
  Cloud, 
  Package,
  Zap,
  Info,
  Clock,
  Lock
} from 'lucide-react';

const MediaStorage = () => {
  const { selectedStore } = useStoreSelection();
  const [activeTab, setActiveTab] = useState('supabase');

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a store to manage media storage</p>
        </div>
      </div>
    );
  }

  const ComingSoonCard = ({ provider, icon: Icon, description, features }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <span>{provider}</span>
          </div>
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {provider} integration is currently under development and will be available soon.
            </AlertDescription>
          </Alert>
          
          <div>
            <h4 className="font-medium mb-3 text-gray-900">Planned Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>Enterprise-grade security and reliability</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Storage</h1>
          <p className="text-gray-600 mt-1">
            Manage your store's media files across multiple cloud storage providers
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="supabase" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Supabase</span>
          </TabsTrigger>
          <TabsTrigger value="cloudflare" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Cloudflare</span>
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Google Storage</span>
          </TabsTrigger>
          <TabsTrigger value="aws" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>AWS S3</span>
          </TabsTrigger>
        </TabsList>

        {/* Supabase Tab */}
        <TabsContent value="supabase" className="space-y-6">
          <SupabaseStorage />
        </TabsContent>

        {/* Cloudflare Tab */}
        <TabsContent value="cloudflare" className="space-y-6">
          <ComingSoonCard
            provider="Cloudflare R2"
            icon={Cloud}
            description="S3-compatible object storage with zero egress fees and global distribution"
            features={[
              "Zero egress bandwidth fees",
              "S3-compatible API for easy migration",
              "Automatic global replication",
              "Built-in CDN with 300+ edge locations",
              "Automatic image optimization and resizing",
              "Direct integration with Cloudflare Workers",
              "Pay only for storage and operations",
              "GDPR compliant with EU data residency"
            ]}
          />
        </TabsContent>

        {/* Google Storage Tab */}
        <TabsContent value="google" className="space-y-6">
          <ComingSoonCard
            provider="Google Cloud Storage"
            icon={Cloud}
            description="Unified object storage with worldwide edge caching and advanced analytics"
            features={[
              "Multi-regional storage with automatic redundancy",
              "Integrated CDN with Cloud CDN",
              "Advanced lifecycle management policies",
              "Real-time analytics with BigQuery integration",
              "Automatic data archiving with Nearline/Coldline",
              "Fine-grained access control with IAM",
              "Server-side encryption by default",
              "Streaming transfers for large files"
            ]}
          />
        </TabsContent>

        {/* AWS S3 Tab */}
        <TabsContent value="aws" className="space-y-6">
          <ComingSoonCard
            provider="AWS S3"
            icon={Package}
            description="Industry-leading object storage with unmatched durability and extensive features"
            features={[
              "99.999999999% (11 9's) durability",
              "Storage classes for cost optimization",
              "CloudFront CDN integration",
              "S3 Transfer Acceleration for faster uploads",
              "Event notifications with Lambda triggers",
              "Object tagging and metadata management",
              "Cross-region replication",
              "AWS ecosystem integration"
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* General Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Multi-Provider Storage Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Why Multiple Providers?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                  <span>Geographic redundancy and faster regional access</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                  <span>Cost optimization based on usage patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                  <span>Compliance with data residency requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                  <span>Avoid vendor lock-in with portable architecture</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Unified Management</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Single dashboard for all storage providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Automatic failover and load balancing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Consistent API across all providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <span>Centralized monitoring and analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaStorage;