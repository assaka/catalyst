import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { AlertCircle, CheckCircle, RefreshCw, Download, Settings, Database, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSlug } from '../hooks/useStoreSlug';
import apiClient from '../api/client';

const AkeneoIntegration = () => {
  const storeSlug = useStoreSlug();
  
  // Configuration state
  const [config, setConfig] = useState({
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    locale: 'en_US'
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [configSaved, setConfigSaved] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [locales, setLocales] = useState([]);
  const [activeTab, setActiveTab] = useState('configuration');
  
  // Debug dry run changes
  const handleDryRunChange = (checked) => {
    console.log('🔧 Dry run toggle changed:', checked);
    setDryRun(checked);
  };

  // Load configuration and locales on component mount
  useEffect(() => {
    // Add a small delay to ensure localStorage is ready
    const loadData = async () => {
      // Wait a bit for localStorage to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load saved connection status
      const savedConnectionStatus = localStorage.getItem('akeneo_connection_status');
      if (savedConnectionStatus) {
        try {
          const parsedStatus = JSON.parse(savedConnectionStatus);
          setConnectionStatus(parsedStatus);
          console.log('📥 Loaded saved connection status:', parsedStatus);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved connection status:', error);
        }
      }
      
      await loadConfigStatus();
      await loadLocales();
    };
    
    loadData();
  }, []);

  const loadConfigStatus = async () => {
    try {
      console.log('🔄 Loading Akeneo configuration status...');
      
      // Get store_id from localStorage
      const storeId = localStorage.getItem('selectedStoreId');
      console.log('🏪 Store ID:', storeId);
      
      if (!storeId) {
        console.warn('⚠️ No store selected, skipping config status load');
        return;
      }

      setLoading(true);
      const response = await apiClient.get('/integrations/akeneo/config-status', {
        'x-store-id': storeId
      });
      
      console.log('📥 Config status response:', response);
      
      // Handle different response structures
      const responseData = response.data || response;
      console.log('📋 Response data:', responseData);
      
      if (responseData.success && responseData.config) {
        console.log('✅ Config found, updating state with:', responseData.config);
        setConfig(prev => ({
          ...prev,
          ...responseData.config
        }));
        
        // If we have a complete configuration, set configSaved to true
        const loadedConfig = responseData.config;
        if (loadedConfig.baseUrl && loadedConfig.clientId && loadedConfig.clientSecret && 
            loadedConfig.username && loadedConfig.password) {
          setConfigSaved(true);
          console.log('✅ Configuration marked as saved');
          
          // Auto-test connection if config is loaded and appears complete
          if (loadedConfig.clientSecret !== '' && loadedConfig.password !== '') {
            console.log('💡 Complete configuration loaded, you may want to test the connection');
          }
        } else {
          console.log('⚠️ Incomplete configuration loaded');
        }
      } else {
        console.log('⚠️ No valid config found in response');
      }
    } catch (error) {
      console.error('❌ Failed to load config status:', error);
      // Check if it's a specific API error
      if (error.status) {
        console.error('📊 Error details:', {
          status: error.status,
          message: error.message,
          data: error.data
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLocales = async () => {
    try {
      const response = await apiClient.get('/integrations/akeneo/locales');
      if (response.data.success) {
        setLocales(response.data.locales);
      }
    } catch (error) {
      console.error('Failed to load locales:', error);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setConfigSaved(false); // Reset saved status when config changes
    setConnectionStatus(null); // Reset connection status when config changes
    localStorage.removeItem('akeneo_connection_status'); // Clear saved connection status
  };

  const testConnection = async () => {
    console.log('🔌 Test Connection button clicked!');
    console.log('🔌 Starting connection test...');
    console.log('📋 Current config:', { 
      baseUrl: config.baseUrl, 
      clientId: config.clientId, 
      username: config.username,
      hasClientSecret: !!config.clientSecret,
      hasPassword: !!config.password,
      clientSecretPlaceholder: config.clientSecret === '••••••••',
      passwordPlaceholder: config.password === '••••••••'
    });

    // Check if we have placeholder values - if so, we need actual values
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      console.error('❌ Missing configuration fields');
      toast.error('Please fill in all configuration fields');
      return;
    }

    // Check if we have placeholder values - we can still test if config is saved
    const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
    
    if (hasPlaceholders && !configSaved) {
      console.error('❌ Placeholder values detected but config not saved');
      toast.error('Please enter your actual Client Secret and Password to test the connection');
      return;
    }
    
    if (hasPlaceholders && configSaved) {
      console.log('ℹ️ Using saved configuration with placeholder values - will use stored credentials');
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      console.log('📡 Making API call to test-connection...');
      
      // Prepare the request payload
      let requestPayload;
      if (hasPlaceholders && configSaved) {
        // Send empty body to trigger stored config usage
        requestPayload = {};
        console.log('🔒 Using stored configuration from database');
      } else {
        // Send full config
        requestPayload = config;
        console.log('📋 Using provided configuration for test');
      }
      
      const response = await apiClient.post('/integrations/akeneo/test-connection', requestPayload, {
        'x-store-id': storeId
      });
      
      console.log('📥 Test connection response:', response);
      
      // Handle different response structures
      const responseData = response.data || response;
      console.log('📋 Response data:', responseData);
      
      const success = responseData.success;
      const message = responseData.message || 'Connection test completed';
      
      if (success) {
        console.log('✅ Connection successful');
        const successStatus = { success: true, message };
        setConnectionStatus(successStatus);
        localStorage.setItem('akeneo_connection_status', JSON.stringify(successStatus));
        toast.success('Connection successful!');
      } else {
        console.log('❌ Connection failed:', message);
        const failureStatus = { success: false, message };
        setConnectionStatus(failureStatus);
        localStorage.setItem('akeneo_connection_status', JSON.stringify(failureStatus));
        toast.error('Connection failed');
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      console.error('📊 Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorStatus = { success: false, message };
      setConnectionStatus(errorStatus);
      localStorage.setItem('akeneo_connection_status', JSON.stringify(errorStatus));
      toast.error(`Connection failed: ${message}`);
    } finally {
      console.log('🏁 Connection test completed');
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    console.log('💾 Save Configuration button clicked!');
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      toast.error('Please fill in all configuration fields');
      return;
    }

    if (config.clientSecret === '••••••••' || config.password === '••••••••') {
      toast.error('Please enter your actual Client Secret and Password to save the configuration');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post('/integrations/akeneo/save-config', config, {
        'x-store-id': storeId
      });
      
      // Handle different response structures
      const responseData = response.data || response;
      const success = responseData.success;
      const message = responseData.message || 'Configuration operation completed';
      
      if (success) {
        toast.success('Configuration saved successfully!');
        setConfigSaved(true);
        loadConfigStatus(); // Reload config status
      } else {
        toast.error(`Failed to save configuration: ${message}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const importCategories = async () => {
    console.log('📦 Starting categories import...');
    console.log('🔗 Connection status:', connectionStatus);
    
    if (!connectionStatus?.success) {
      console.error('❌ Connection not tested or failed');
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    console.log('🔧 Import settings:', { dryRun, config });

    setImporting(true);
    setImportResults(null);

    try {
      console.log('📡 Making API call to import-categories...');
      
      // Prepare the request payload for import
      const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
      let requestPayload;
      
      if (hasPlaceholders && configSaved) {
        // Use stored config for import
        requestPayload = { dryRun };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { ...config, dryRun };
        console.log('📋 Using provided configuration for import');
      }
      
      const response = await apiClient.post('/integrations/akeneo/import-categories', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import categories response:', response);
      
      const responseData = response.data || response;
      setImportResults(responseData);
      
      if (responseData.success) {
        console.log('✅ Categories import successful');
        const stats = responseData.stats;
        toast.success(`Categories import completed! ${stats?.imported || 0} categories imported`);
      } else {
        console.log('❌ Categories import failed:', responseData.error);
        toast.error(`Categories import failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error('❌ Categories import error:', error);
      console.error('📊 Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      console.log('🏁 Categories import completed');
      setImporting(false);
    }
  };

  const importProducts = async () => {
    if (!connectionStatus?.success) {
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const response = await apiClient.post('/integrations/akeneo/import-products', {
        ...config,
        dryRun
      }, {
        'x-store-id': storeId
      });

      setImportResults(response.data);
      
      if (response.data.success) {
        toast.success(`Products import completed! ${response.data.stats.imported} products imported`);
      } else {
        toast.error(`Products import failed: ${response.data.error}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const importAll = async () => {
    if (!connectionStatus?.success) {
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const response = await apiClient.post('/integrations/akeneo/import-all', {
        ...config,
        dryRun
      }, {
        'x-store-id': storeId
      });

      setImportResults(response.data);
      
      if (response.data.success) {
        const categoryStats = response.data.results.categories.stats;
        const productStats = response.data.results.products.stats;
        toast.success(`Full import completed! ${categoryStats.imported} categories and ${productStats.imported} products imported`);
      } else {
        toast.error(`Import failed: ${response.data.error}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;

    return (
      <Alert className={connectionStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {connectionStatus.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={connectionStatus.success ? 'text-green-800' : 'text-red-800'}>
          {connectionStatus.message}
        </AlertDescription>
      </Alert>
    );
  };

  const renderImportResults = () => {
    if (!importResults) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {importResults.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Import Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importResults.success ? (
            <div className="space-y-4">
              {importResults.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResults.stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.stats.imported}</div>
                    <div className="text-sm text-gray-600">Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{importResults.stats.skipped}</div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.stats.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              )}
              
              {importResults.results && (
                <div className="space-y-3">
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Categories</h4>
                      <div className="text-sm space-y-1">
                        <div>Total: {importResults.results.categories.stats.total}</div>
                        <div>Imported: {importResults.results.categories.stats.imported}</div>
                        <div>Failed: {importResults.results.categories.stats.failed}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Products</h4>
                      <div className="text-sm space-y-1">
                        <div>Total: {importResults.results.products.stats.total}</div>
                        <div>Imported: {importResults.results.products.stats.imported}</div>
                        <div>Failed: {importResults.results.products.stats.failed}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {importResults.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Akeneo PIM Integration</h1>
        <p className="text-gray-600">
          Import categories and products from your Akeneo PIM system into Catalyst.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Akeneo Configuration</CardTitle>
              <CardDescription>
                Configure your Akeneo PIM connection settings. Save your configuration first, then test the connection before importing data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://your-akeneo.com"
                    value={config.baseUrl}
                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Your client ID"
                    value={config.clientId}
                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Your client secret"
                    value={config.clientSecret}
                    onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="API username"
                    value={config.username}
                    onChange={(e) => handleConfigChange('username', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="API password"
                    value={config.password}
                    onChange={(e) => handleConfigChange('password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <Select value={config.locale} onValueChange={(value) => handleConfigChange('locale', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      {locales.map((locale) => (
                        <SelectItem key={locale.code} value={locale.code}>
                          {locale.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={loadConfigStatus} 
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loading ? 'Loading...' : 'Reload Settings'}
                  </Button>

                  <Button 
                    onClick={saveConfiguration} 
                    disabled={saving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>

                  <Button 
                    onClick={testConnection} 
                    disabled={testing}
                    className="flex items-center gap-2"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="dry-run"
                    checked={dryRun}
                    onCheckedChange={handleDryRunChange}
                    disabled={false}
                  />
                  <Label htmlFor="dry-run" className="cursor-pointer">Dry Run</Label>
                  <span className="text-sm text-gray-500">
                    ({dryRun ? 'Preview only' : 'Live import'})
                  </span>
                </div>
              </div>

              {renderConnectionStatus()}
              
              {configSaved && (
                <Alert className="border-blue-200 bg-blue-50 mt-4">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Configuration has been saved successfully. You can now test the connection or proceed with imports.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Categories</CardTitle>
              <CardDescription>
                Import category data from Akeneo PIM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Categories will be imported with their hierarchical structure. Parent categories are created first.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importCategories} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Categories'}
                </Button>

                {dryRun && (
                  <Badge variant="outline">Dry Run Mode</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Products</CardTitle>
              <CardDescription>
                Import product data from Akeneo PIM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Products will be imported with their attributes, images, and category assignments. Make sure to import categories first.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importProducts} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Products'}
                </Button>

                <Button 
                  onClick={importAll} 
                  disabled={importing || !connectionStatus?.success}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import All (Categories + Products)'}
                </Button>

                {dryRun && (
                  <Badge variant="outline">Dry Run Mode</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderImportResults()}
    </div>
  );
};

export default AkeneoIntegration;