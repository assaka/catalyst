import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Layout,
  Database,
  Globe,
  Code,
  Palette,
  Settings,
  ArrowLeft,
  Sparkles,
  Cloud,
  FileText,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import TemplateAssetManager from '../components/TemplateAssetManager';
import DataMigrationManager from '../components/DataMigrationManager';
import DnsManager from '../components/DnsManager';
import apiClient from '@/api/client';

const AdvancedTemplateCustomization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('assets');

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    try {
      setLoading(true);
      // This would get the current store info from context or API
      const mockStore = {
        id: '157d4590-49bf-4b0b-bd77-abe131909528',
        name: 'Amazing Store',
        domain: 'amazing-store.catalyst.app',
        plan: 'pro',
        features: {
          custom_domains: true,
          data_migration: true,
          advanced_templates: true
        }
      };
      setStoreInfo(mockStore);
    } catch (error) {
      console.error('Load store info error:', error);
      toast.error('Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !storeInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store information...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'assets',
      label: 'Template Assets',
      icon: FileText,
      description: 'Manage JS, CSS, and media assets',
      component: TemplateAssetManager
    },
    {
      id: 'migration',
      label: 'Data Migration',
      icon: Database,
      description: 'Migrate data to your Supabase',
      component: DataMigrationManager
    },
    {
      id: 'domains',
      label: 'Custom Domains',
      icon: Globe,
      description: 'Configure custom domains & DNS',
      component: DnsManager
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="h-6 border-l border-gray-300" />
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">Advanced Customization</h1>
                <p className="text-sm text-gray-500">{storeInfo.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {storeInfo.plan} plan
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {storeInfo.domain}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Template Assets</h3>
                  <p className="text-sm text-gray-600">JavaScript/CSS separation</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Upload and manage template assets. Automatically separate JavaScript from HTML for better maintainability.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Data Ownership</h3>
                  <p className="text-sm text-gray-600">Migrate to your Supabase</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Own your data by migrating catalog, sales, and content to your own Supabase instance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Custom Domains</h3>
                  <p className="text-sm text-gray-600">Professional branding</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Use your own domain with automatic SSL certificates and DNS management.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Restrictions */}
        {storeInfo.plan !== 'pro' && storeInfo.plan !== 'enterprise' && (
          <Alert className="mb-6">
            <Sparkles className="w-4 h-4" />
            <AlertDescription>
              <strong>Upgrade Required:</strong> Advanced template customization features require a Pro or Enterprise plan. 
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => navigate('/billing')}>
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{tab.description}</p>
                </CardHeader>
                <CardContent>
                  {tab.id === activeTab && (
                    <tab.component 
                      storeId={storeInfo.id}
                      storeDomain={storeInfo.domain}
                      templateId={null} // Can be set for specific template editing
                      onAssetsChange={(assets) => {
                        // Handle assets change for parent component
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">1. Setup Supabase Connection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Connect your Supabase project to enable data migration and cloud storage features.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('migration')}
                >
                  Configure Supabase
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Upload Template Assets</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Upload JavaScript, CSS, and media files. Automatically separate JS from templates.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('assets')}
                >
                  Manage Assets
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. Add Custom Domain</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use your own domain with automatic SSL certificates and DNS configuration.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('domains')}
                >
                  Setup Domain
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedTemplateCustomization;