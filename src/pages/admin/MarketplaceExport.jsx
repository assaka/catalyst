
import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { Product } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  Download,
  Settings,
  Package,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAlertTypes } from '@/hooks/useAlert';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function MarketplaceExport() {
  const { showError, showWarning, showInfo, showSuccess, AlertComponent } = useAlertTypes();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResults, setExportResults] = useState([]);
  const [amazonConfig, setAmazonConfig] = useState({
    client_id: '',
    client_secret: '',
    seller_id: '',
    marketplace_id: 'ATVPDKIKX0DER', // US marketplace
    region: 'us-east-1'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const storeData = await retryApiCall(() => Store.list());
        if (storeData && storeData.length > 0) {
          setStore(storeData[0]);
          
          // Load Amazon config from store settings
          const storedConfig = storeData[0].settings?.amazon_config;
          if (storedConfig) {
            setAmazonConfig(prev => ({ ...prev, ...storedConfig }));
          }
        }
        
        await delay(300);
        const productData = await retryApiCall(() => Product.filter({ status: 'active' }));
        setProducts(productData || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleConfigSave = async () => {
    if (!store) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedSettings = {
        ...store.settings,
        amazon_config: amazonConfig
      };

      await Store.update(store.id, { settings: updatedSettings });

      // Clear any potential cache
      try {
        localStorage.removeItem('storeProviderCache');
        sessionStorage.removeItem('storeProviderCache');
      } catch (e) {
        console.warn('Failed to clear cache:', e);
      }

      showSuccess('Amazon configuration saved successfully!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving config:', error);
      showError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleProductSelect = (productId, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const exportToAmazon = async () => {
    if (selectedProducts.length === 0) {
      showWarning('Please select at least one product to export');
      return;
    }

    if (!amazonConfig.client_id || !amazonConfig.client_secret || !amazonConfig.seller_id) {
      showWarning('Please configure your Amazon API credentials first');
      return;
    }

    setExporting(true);
    setExportResults([]);

    try {
      const selectedProductData = products.filter(p => selectedProducts.includes(p.id));
      
      for (const product of selectedProductData) {
        try {
          // Use LLM integration to handle Amazon API authentication and product creation
          const amazonExportPrompt = `
            Export this product to Amazon Marketplace using the Amazon Selling Partner API.
            
            Product Details:
            - Name: ${product.name}
            - SKU: ${product.sku}
            - Price: ${product.price}
            - Description: ${product.description || product.short_description}
            - Images: ${product.images ? product.images.join(', ') : 'None'}
            
            Amazon API Configuration:
            - Client ID: ${amazonConfig.client_id}
            - Client Secret: ${amazonConfig.client_secret}
            - Seller ID: ${amazonConfig.seller_id}
            - Marketplace ID: ${amazonConfig.marketplace_id}
            
            Use this authentication flow:
            1. Get access token from https://api.amazon.com/auth/o2/token
            2. Use the token to create/update product listing via PUT /listings/2021-08-01/items/{seller_id}/{sku}
            
            Format the product data according to Amazon's requirements and return the result.
          `;

          const result = await InvokeLLM({
            prompt: amazonExportPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                amazon_asin: { type: "string" },
                listing_url: { type: "string" }
              }
            }
          });

          setExportResults(prev => [...prev, {
            product: product.name,
            sku: product.sku,
            success: result.success,
            message: result.message,
            amazon_asin: result.amazon_asin,
            listing_url: result.listing_url
          }]);

          // Add delay between exports to avoid rate limiting
          await delay(2000);

        } catch (error) {
          console.error(`Error exporting ${product.name}:`, error);
          setExportResults(prev => [...prev, {
            product: product.name,
            sku: product.sku,
            success: false,
            message: `Export failed: ${error.message}`
          }]);
        }
      }
    } catch (error) {
      console.error('Export process failed:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Export</h1>
          <p className="text-gray-600 mt-1">Export your products to external marketplaces</p>
        </div>
      </div>

      <Tabs defaultValue="amazon" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="amazon" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Amazon (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="ebay" disabled>
            <ShoppingCart className="w-4 h-4" />
            eBay (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="etsy" disabled>
            <ExternalLink className="w-4 h-4" />
            Etsy (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="amazon" className="space-y-6">
          {/* Coming Soon Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Package className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-medium">Amazon Marketplace Export - Coming Soon!</p>
                <p className="text-sm">
                  We're working on integrating with Amazon's Selling Partner API to allow seamless product exports from your Catalyst store to Amazon Marketplace. 
                  This feature will include automated product listings, inventory sync, and order management capabilities.
                </p>
                <p className="text-sm">
                  Stay tuned for updates as we finalize this powerful integration to help you expand your reach across multiple sales channels.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Amazon Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Amazon API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    type="password"
                    value={amazonConfig.client_id}
                    onChange={(e) => setAmazonConfig(prev => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Your Amazon Client ID"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={amazonConfig.client_secret}
                    onChange={(e) => setAmazonConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                    placeholder="Your Amazon Client Secret"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="seller_id">Seller ID</Label>
                  <Input
                    id="seller_id"
                    value={amazonConfig.seller_id}
                    onChange={(e) => setAmazonConfig(prev => ({ ...prev, seller_id: e.target.value }))}
                    placeholder="Your Amazon Seller ID"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="marketplace_id">Marketplace</Label>
                  <Select 
                    value={amazonConfig.marketplace_id}
                    onValueChange={(value) => setAmazonConfig(prev => ({ ...prev, marketplace_id: value }))}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATVPDKIKX0DER">United States</SelectItem>
                      <SelectItem value="A2EUQ1WTGCTBG2">Canada</SelectItem>
                      <SelectItem value="A1AM78C64UM0Y8">Mexico</SelectItem>
                      <SelectItem value="A1PA6795UKMFR9">Germany</SelectItem>
                      <SelectItem value="A13V1IB3VIYZZH">France</SelectItem>
                      <SelectItem value="APJ6JRA9NG5V4">Italy</SelectItem>
                      <SelectItem value="A1RKKUPIHCS9HS">Spain</SelectItem>
                      <SelectItem value="A1F83G8C2ARO7P">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll need to register as an Amazon developer and get API credentials from Amazon Seller Central.
                  <a href="https://developer.amazonservices.com/" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                    Learn more <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <SaveButton
                  onClick={handleConfigSave}
                  loading={saving}
                  success={saveSuccess}
                  disabled
                  defaultText="Save Configuration"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Select Products to Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedProducts.length} of {products.length} products selected
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedProducts.length === products.length) {
                        setSelectedProducts([]);
                      } else {
                        setSelectedProducts(products.map(p => p.id));
                      }
                    }}
                    disabled
                  >
                    {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleProductSelect(product.id, checked)}
                        disabled
                      />
                      <div className="flex-1 flex items-center space-x-3">
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          <p className="text-sm font-medium">${product.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Action */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ready to Export</h3>
                  <p className="text-sm text-gray-600">
                    Export {selectedProducts.length} selected products to Amazon
                  </p>
                </div>
                <Button
                  onClick={exportToAmazon}
                  disabled={true}
                  className="flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Export to Amazon
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Results */}
          {exportResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Export Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exportResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{result.product}</p>
                          <p className="text-sm text-gray-600">SKU: {result.sku}</p>
                          <p className="text-sm">{result.message}</p>
                        </div>
                      </div>
                      {result.success && result.listing_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={result.listing_url} target="_blank" rel="noopener noreferrer">
                            View on Amazon
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <AlertComponent />
    </div>
  );
}
