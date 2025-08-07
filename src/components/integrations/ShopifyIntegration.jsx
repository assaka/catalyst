import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '../../contexts/StoreSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
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
import FlashMessage from "@/components/storefront/FlashMessage.jsx";

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
    redirect_uri: ''
  });

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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
        }
      });
      const data = await response.json();
      setAppConfigured(data.configured || data.has_global_config);
      
      // Set default redirect URI if available
      if (data.redirect_uri) {
        setAppCredentials(prev => ({
          ...prev,
          redirect_uri: data.redirect_uri
        }));
      } else {
        // Set default redirect URI based on current backend URL
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://catalyst-backend-fzhu.onrender.com';
        setAppCredentials(prev => ({
          ...prev,
          redirect_uri: `${backendUrl}/api/shopify/callback`
        }));
      }
    } catch (error) {
      console.error('Error checking app configuration:', error);
    }
  };

  const saveAppCredentials = async () => {
    if (!appCredentials.client_id || !appCredentials.client_secret || !appCredentials.redirect_uri) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/shopify/configure-app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'x-store-id': storeId
        },
        body: JSON.stringify(appCredentials)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Shopify app credentials saved successfully!'
        });
        setAppConfigured(true);
        setShowAppConfig(false);
        
        // Clear sensitive data from state
        setAppCredentials(prev => ({
          ...prev,
          client_secret: ''
        }));
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to save app credentials'
        });
      }
    } catch (error) {
      console.error('Error saving app credentials:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save app credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/shopify/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
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

  const initiateOAuth = async () => {
    if (!shopDomain) {
      setMessage({ type: 'error', text: 'Please enter your Shopify store domain' });
      return;
    }

    // Ensure the domain has .myshopify.com
    const formattedDomain = shopDomain.includes('.myshopify.com') 
      ? shopDomain 
      : `${shopDomain}.myshopify.com`;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/shopify/auth?shop_domain=${formattedDomain}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
        }
      });

      const data = await response.json();

      if (data.success && data.auth_url) {
        // Redirect to Shopify OAuth URL
        window.location.href = data.auth_url;
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to generate authorization URL' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to initiate OAuth connection' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/shopify/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
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
          'Content-Type': 'application/json',
          'x-store-id': storeId
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

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes('/integrations/shopify/success')) {
      setMessage({ type: 'success', text: 'Successfully connected to Shopify!' });
      checkConnectionStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, '/admin/integrations');
    } else if (window.location.pathname.includes('/integrations/shopify/error')) {
      const error = urlParams.get('error');
      setMessage({ type: 'error', text: `Connection failed: ${error || 'Unknown error'}` });
      // Clean up URL
      window.history.replaceState({}, document.title, '/admin/integrations');
    }
  }, []);

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Settings for {store?.name || 'Your Store'}</h1>
              <p className="text-gray-600 mt-1">Configure delivery date options for your customers</p>
            </div>
          </div>
          <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Shopify Connection</span>
            </div>
            {connectionStatus?.connected ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect your Shopify store to import products, collections, and more.
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
              {!appConfigured && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Shopify app not configured.</strong> You need to configure your Shopify app credentials before connecting.
                    <Button
                      variant="link"
                      className="ml-2 text-yellow-800 underline p-0 h-auto"
                      onClick={() => setShowAppConfig(!showAppConfig)}
                    >
                      {showAppConfig ? 'Hide' : 'Configure'} App Credentials
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {showAppConfig && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Configure Shopify App Credentials
                    </CardTitle>
                    <CardDescription>
                      Enter your Shopify app's Client ID and Client Secret. You can find these in your Shopify Partner Dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      <Label htmlFor="redirect-uri">Redirect URI</Label>
                      <Input
                        id="redirect-uri"
                        type="text"
                        value={appCredentials.redirect_uri}
                        onChange={(e) => setAppCredentials({...appCredentials, redirect_uri: e.target.value})}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add this exact URL to your Shopify app's "Allowed redirection URLs"
                      </p>
                    </div>

                    <Alert className="border-blue-200">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        Your credentials are encrypted and stored securely. They are never exposed in the frontend or API responses.
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAppConfig(false);
                          setAppCredentials({...appCredentials, client_secret: ''});
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveAppCredentials}
                        disabled={loading || !appCredentials.client_id || !appCredentials.client_secret}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Save Credentials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Connection Section (only show if app is configured) */}
              {appConfigured && (
                <div>
                  <Label htmlFor="shop-domain">Shopify Store Domain</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="shop-domain"
                      type="text"
                      placeholder="your-store.myshopify.com"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      onClick={initiateOAuth}
                      disabled={loading || !shopDomain}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link className="w-4 h-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your Shopify store domain (e.g., my-store.myshopify.com)
                  </p>
                </div>
              )}

              {appConfigured && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>App configured!</strong> You can now connect your Shopify store.
                    <Button
                      variant="link"
                      className="ml-2 text-green-800 underline p-0 h-auto"
                      onClick={() => setShowAppConfig(true)}
                    >
                      Update Credentials
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
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