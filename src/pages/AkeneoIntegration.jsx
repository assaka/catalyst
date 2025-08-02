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

  // Load configuration and locales on component mount
  useEffect(() => {
    loadConfigStatus();
    loadLocales();
  }, []);

  const loadConfigStatus = async () => {
    try {
      // Get store_id from localStorage
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) {
        console.warn('No store selected, skipping config status load');
        return;
      }

      const response = await apiClient.get('/integrations/akeneo/config-status', {
        'x-store-id': storeId
      });
      
      // Handle different response structures
      const responseData = response.data || response;
      if (responseData.success && responseData.config) {
        setConfig(prev => ({
          ...prev,
          ...responseData.config
        }));
      }
    } catch (error) {
      console.error('Failed to load config status:', error);
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
  };

  const testConnection = async () => {
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      toast.error('Please fill in all configuration fields');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      const response = await apiClient.post('/integrations/akeneo/test-connection', config, {
        'x-store-id': storeId
      });
      
      // Handle different response structures
      const responseData = response.data || response;
      const success = responseData.success;
      const message = responseData.message || 'Connection test completed';
      
      if (success) {
        setConnectionStatus({ success: true, message });
        toast.success('Connection successful!');
      } else {
        setConnectionStatus({ success: false, message });
        toast.error('Connection failed');
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setConnectionStatus({ success: false, message });
      toast.error(`Connection failed: ${message}`);
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      toast.error('Please fill in all configuration fields');
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
      const response = await apiClient.post('/integrations/akeneo/import-categories', {
        ...config,
        dryRun
      }, {
        'x-store-id': storeId
      });

      setImportResults(response.data);
      
      if (response.data.success) {
        toast.success(`Categories import completed! ${response.data.stats.imported} categories imported`);
      } else {
        toast.error(`Categories import failed: ${response.data.error}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
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
                    onCheckedChange={setDryRun}
                  />
                  <Label htmlFor="dry-run">Dry Run</Label>
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