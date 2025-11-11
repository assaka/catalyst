import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ShoppingBag,
  Link,
  Unlink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Store,
  Package,
  Clock,
  AlertCircle,
  Loader2,
  Settings,
  Key,
  Shield
} from 'lucide-react';

const ShopifyIntegration = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [importStats, setImportStats] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [appConfigured, setAppConfigured] = useState(false);
  const [showAppConfig, setShowAppConfig] = useState(false);
  const [appCredentials, setAppCredentials] = useState({
    client_id: '',
    client_secret: '',
    access_token: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (storeId) {
      checkAppConfiguration();
      checkConnectionStatus();
      fetchImportStats();
    }
  }, [storeId]);

  const checkAppConfiguration = async () => {
    try {
      const response = await fetch('/api/shopify/app-configured', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAppConfigured(data.configured || data.has_global_config);
    } catch (error) {
      console.error('Error checking app configuration:', error);
    }
  };

  const connectWithDirectAccess = async () => {
    if (!shopDomain || !appCredentials.client_id || !appCredentials.client_secret || !appCredentials.access_token) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields: Shop Domain, Client ID, Client Secret, and Access Token'
      });
      return;
    }

    // Ensure the domain has .myshopify.com
    const formattedDomain = shopDomain.includes('.myshopify.com')
      ? shopDomain
      : `${shopDomain}.myshopify.com`;

    setLoading(true);
    setMessage(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/shopify/direct-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'x-store-id': storeId
        },
        body: JSON.stringify({
          shop_domain: formattedDomain,
          access_token: appCredentials.access_token
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Successfully connected to Shopify!'
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setAppConfigured(true);
        setShowAppConfig(false);

        // Clear sensitive data from state
        setAppCredentials({
          client_id: '',
          client_secret: '',
          access_token: ''
        });
        setShopDomain('');

        // Refresh connection status
        checkConnectionStatus();
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to connect to Shopify'
        });
      }
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      setMessage({
        type: 'error',
        text: 'Failed to connect to Shopify'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/shopify/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConnectionStatus(data);
      
      if (data.connected) {
        fetchShopInfo();
      }
    } catch (error) {
      console.error('Error checking Shopify connection status:', error);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const response = await fetch('/api/shopify/shop-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShopInfo(data.shop_info);
      }
    } catch (error) {
      console.error('Error fetching shop info:', error);
    }
  };

  const fetchImportStats = async () => {
    try {
      const response = await fetch('/api/shopify/import/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setImportStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching import stats:', error);
    }
  };


  const testConnection = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/shopify/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        checkConnectionStatus();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection' });
    } finally {
      setLoading(false);
    }
  };

  const disconnectShopify = async () => {
    if (!window.confirm('Are you sure you want to disconnect from Shopify? This will remove your access token.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/shopify/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Successfully disconnected from Shopify' });
        setConnectionStatus(null);
        setShopInfo(null);
        checkConnectionStatus();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    } finally {
      setLoading(false);
    }
  };

  const importData = async (type, options = {}) => {
    setLoading(true);
    setMessage(null);
    setImportProgress({ type, progress: 0, message: 'Starting import...' });

    try {
      const endpoint = type === 'full' 
        ? '/api/shopify/import/full'
        : `/api/shopify/import/${type}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully imported ${type}` 
        });
        fetchImportStats();
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || `Failed to import ${type}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error importing ${type}: ${error.message}` 
      });
    } finally {
      setLoading(false);
      setImportProgress(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shopify Integration</h1>
              <p className="text-muted-foreground">
                Connect your Shopify store to import products and sync inventory
              </p>
            </div>
            {connectionStatus?.connected && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            )}
          </div>

          {/* Flash Message */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200' : message.type === 'success' ? 'border-green-200' : 'border-blue-200'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          
          {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Connection Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your Shopify store connection and import settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200' : 'border-green-200'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {!connectionStatus?.connected ? (
            <div className="space-y-4">
              {/* App Configuration Section */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Direct Access Connection</strong> - Enter your Shopify store credentials to connect.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="shop-domain">Shopify Store Domain</Label>
                  <Input
                    id="shop-domain"
                    type="text"
                    placeholder="your-store.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your Shopify store domain (e.g., my-store.myshopify.com)
                  </p>
                </div>

                <div>
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    type="text"
                    placeholder="e.g., 7f4e5d3c2b1a0987654321"
                    value={appCredentials.client_id}
                    onChange={(e) => setAppCredentials({...appCredentials, client_id: e.target.value})}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in your Shopify app's "Client credentials" section
                  </p>
                </div>

                <div>
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="e.g., shpss_1234567890abcdef..."
                    value={appCredentials.client_secret}
                    onChange={(e) => setAppCredentials({...appCredentials, client_secret: e.target.value})}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Keep this secret! Never share or commit to version control
                  </p>
                </div>

                <div>
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="shpat_..."
                    value={appCredentials.access_token}
                    onChange={(e) => setAppCredentials({...appCredentials, access_token: e.target.value})}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Admin API access token from your Shopify custom app
                  </p>
                </div>

                <Alert className="border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Your credentials are encrypted and stored securely. They are never exposed in the frontend or API responses.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <SaveButton
                    onClick={connectWithDirectAccess}
                    loading={loading}
                    success={saveSuccess}
                    disabled={!shopDomain || !appCredentials.client_id || !appCredentials.client_secret || !appCredentials.access_token}
                    defaultText="Connect to Shopify"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {shopInfo && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{shopInfo.shop_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Domain: {shopInfo.shop_domain}</div>
                    <div>Plan: {shopInfo.plan_name}</div>
                    <div>Currency: {shopInfo.shop_currency}</div>
                    <div>Country: {shopInfo.shop_country}</div>
                  </div>
                  {shopInfo.connected_at && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Connected: {formatDate(shopInfo.connected_at)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={testConnection}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={disconnectShopify}
                  disabled={loading}
                  variant="destructive"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Options - Only show when connected */}
      {connectionStatus?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Import your Shopify data into SuprShop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick">Quick Import</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => importData('collections')}
                    disabled={loading}
                    className="h-auto py-4 flex-col"
                    variant="outline"
                  >
                    <Package className="w-6 h-6 mb-2" />
                    <span>Import Collections</span>
                    {importStats?.collections && (
                      <span className="text-xs text-gray-500 mt-1">
                        Last: {importStats.collections.successful_imports || 0} imported
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={() => importData('products')}
                    disabled={loading}
                    className="h-auto py-4 flex-col"
                    variant="outline"
                  >
                    <ShoppingBag className="w-6 h-6 mb-2" />
                    <span>Import Products</span>
                    {importStats?.products && (
                      <span className="text-xs text-gray-500 mt-1">
                        Last: {importStats.products.successful_imports || 0} imported
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={() => importData('full')}
                    disabled={loading}
                    className="h-auto py-4 flex-col"
                  >
                    <Download className="w-6 h-6 mb-2" />
                    <span>Full Import</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Collections + Products
                    </span>
                  </Button>
                </div>

                {importProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{importProgress.message}</span>
                      <span>{importProgress.progress}%</span>
                    </div>
                    <Progress value={importProgress.progress} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Advanced import options allow you to perform dry runs and limit the number of items imported.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Test Import (Dry Run)</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Preview what will be imported without making any changes.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => importData('collections', { dry_run: true })}
                        disabled={loading}
                        variant="outline"
                      >
                        Test Collections Import
                      </Button>
                      <Button
                        onClick={() => importData('products', { dry_run: true, limit: 10 })}
                        disabled={loading}
                        variant="outline"
                      >
                        Test Products Import (10 items)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Limited Import</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Import a limited number of products for testing.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => importData('products', { limit: 50 })}
                        disabled={loading}
                        variant="outline"
                      >
                        Import First 50 Products
                      </Button>
                      <Button
                        onClick={() => importData('products', { limit: 100 })}
                        disabled={loading}
                        variant="outline"
                      >
                        Import First 100 Products
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Import Statistics */}
      {importStats && (importStats.collections || importStats.products) && (
        <Card>
          <CardHeader>
            <CardTitle>Import Statistics</CardTitle>
            <CardDescription>
              Summary of your last import operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {importStats.collections && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Collections
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Processed:</span>
                      <span>{importStats.collections.total_processed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Successfully Imported:</span>
                      <span className="text-green-600">
                        {importStats.collections.successful_imports || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failed:</span>
                      <span className="text-red-600">
                        {importStats.collections.failed_imports || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {importStats.products && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Products
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Processed:</span>
                      <span>{importStats.products.total_processed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Successfully Imported:</span>
                      <span className="text-green-600">
                        {importStats.products.successful_imports || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failed:</span>
                      <span className="text-red-600">
                        {importStats.products.failed_imports || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
};

export default ShopifyIntegration;