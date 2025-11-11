import React, { useState, useEffect } from 'react';
import ShopifyIntegrationComponent from '@/components/admin/integrations/ShopifyIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  BookOpen,
  Settings,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Code,
  Link,
  Package,
  Download,
  RefreshCw,
  Shield,
  Zap,
  HelpCircle
} from 'lucide-react';

const ShopifyIntegration = () => {
  const [activeTab, setActiveTab] = useState('connection');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shopify/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`,
          'x-store-id': localStorage.getItem('selectedStoreId')
        }
      });
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Error checking Shopify connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Shopify Integration</h1>
                  <p className="text-gray-600 mt-1">
                    Connect your Shopify store to import products, collections, and sync inventory
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {connectionStatus?.connected ? (
                  <>
                    <button
                      onClick={checkConnectionStatus}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Refresh connection status"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Card className="material-elevation-1 border-0">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection" className="flex items-center space-x-2">
              <Link className="w-4 h-4" />
              <span>Connection</span>
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Documentation</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4" />
              <span>Help & FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            <ShopifyIntegrationComponent />
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started with Shopify Integration</CardTitle>
                <CardDescription>
                  Complete guide to setting up and using the Shopify integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overview Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-blue-500" />
                    Overview
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The Shopify integration allows you to connect your Shopify store with SuprShop, 
                    enabling you to import products, collections, and maintain synchronized inventory 
                    across both platforms.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600 mb-2" />
                      <h4 className="font-medium">Product Import</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Import all products with variants, images, and metadata
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <RefreshCw className="w-6 h-6 text-green-600 mb-2" />
                      <h4 className="font-medium">Collection Sync</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Sync collections as categories in your store
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Zap className="w-6 h-6 text-purple-600 mb-2" />
                      <h4 className="font-medium">Real-time Updates</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Keep your catalog synchronized automatically
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <strong>Direct Access Token:</strong> Secure connection using Shopify's Admin API access token
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <strong>Bulk Import:</strong> Import hundreds of products efficiently with pagination
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <strong>Smart Mapping:</strong> Automatic mapping of Shopify fields to SuprShop attributes
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <strong>Dry Run Mode:</strong> Preview imports before making changes
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <strong>Import Statistics:</strong> Track import success rates and errors
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Data Mapping Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Mapping</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Shopify Field</th>
                          <th className="text-left py-2">SuprShop Field</th>
                          <th className="text-left py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2">Product Title</td>
                          <td className="py-2">Product Name</td>
                          <td className="py-2 text-gray-600">Direct mapping</td>
                        </tr>
                        <tr>
                          <td className="py-2">Handle</td>
                          <td className="py-2">URL Key / SKU</td>
                          <td className="py-2 text-gray-600">Used for unique identification</td>
                        </tr>
                        <tr>
                          <td className="py-2">Collections</td>
                          <td className="py-2">Categories</td>
                          <td className="py-2 text-gray-600">Collections become categories</td>
                        </tr>
                        <tr>
                          <td className="py-2">Variants</td>
                          <td className="py-2">Product Attributes</td>
                          <td className="py-2 text-gray-600">Consolidated into single product</td>
                        </tr>
                        <tr>
                          <td className="py-2">Images</td>
                          <td className="py-2">Product Gallery</td>
                          <td className="py-2 text-gray-600">All images imported</td>
                        </tr>
                        <tr>
                          <td className="py-2">Vendor</td>
                          <td className="py-2">Vendor Attribute</td>
                          <td className="py-2 text-gray-600">Custom attribute created</td>
                        </tr>
                        <tr>
                          <td className="py-2">Tags</td>
                          <td className="py-2">Tags Attribute</td>
                          <td className="py-2 text-gray-600">Stored as multi-value attribute</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">How to Use</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        1
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Create Custom App in Shopify</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          In your Shopify Admin, go to Settings → Apps and sales channels → Develop apps.
                          Create a custom app and get your Admin API access token.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        2
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Connect Your Store</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Enter your shop domain and access token in the Connection tab above. Click "Connect to Shopify".
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        3
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Import Collections</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Start by importing collections to create your category structure. Collections will be imported as categories.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        4
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Import Products</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Import products with all their variants, images, and metadata. Use the dry run option to preview first.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        5
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Monitor Progress</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Track import progress and review statistics to ensure all data was imported successfully.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create a Custom App in Shopify</CardTitle>
                <CardDescription>
                  Detailed step-by-step instructions for creating a custom app and getting your access token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prerequisites */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>What you'll need:</strong> Admin access to your Shopify store. No Partner account required!
                    The process takes about 2-3 minutes.
                  </AlertDescription>
                </Alert>

                {/* Step 1: Access Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 1: Navigate to App Settings</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>
                        Log in to your <strong>Shopify Admin</strong> (your-store.myshopify.com/admin)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>Click <strong>Settings</strong> (bottom left corner)</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>Click <strong>Apps and sales channels</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>Click <strong>Develop apps</strong></div>
                    </li>
                  </ol>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>First time?</strong> You may need to click "Allow custom app development" first.
                    </p>
                  </div>
                </div>

                {/* Step 2: Create App */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 2: Create Your Custom App</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>Click <strong>"Create an app"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>
                        App name: <code className="bg-gray-100 px-2 py-1 rounded">SuprShop Integration</code> (or any name you prefer)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>App developer: Enter your email address</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>Click <strong>"Create app"</strong></div>
                    </li>
                  </ol>
                </div>

                {/* Step 3: Configure Scopes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 3: Configure Admin API Scopes</h3>
                  <ol className="space-y-3 text-sm mb-3">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>Click <strong>"Configure Admin API scopes"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>Search for and select these permissions:</div>
                    </li>
                  </ol>
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <code className="text-sm">read_products</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <code className="text-sm">read_product_listings</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <code className="text-sm">read_inventory</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <code className="text-sm">read_content</code>
                    </div>
                  </div>
                  <ol start="3" className="space-y-3 text-sm mt-3">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>Click <strong>"Save"</strong> at the top</div>
                    </li>
                  </ol>
                </div>

                {/* Step 4: Install App */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 4: Install the App</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>Click the <strong>"API credentials"</strong> tab</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>Click <strong>"Install app"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>Review the permissions and click <strong>"Install"</strong></div>
                    </li>
                  </ol>
                </div>

                {/* Step 5: Get Access Token */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 5: Copy Your Access Token</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>
                        After installing, you'll see <strong>"Admin API access token"</strong>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>Click <strong>"Reveal token once"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>
                        <strong>Copy the token immediately!</strong> It starts with <code className="bg-gray-100 px-1 rounded">shpat_</code>
                      </div>
                    </li>
                  </ol>

                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>IMPORTANT:</strong> The access token is only shown ONCE! Copy it immediately and store it securely. If you lose it, you'll need to uninstall and reinstall the app.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 6: Connect */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 6: Connect to SuprShop</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>Go back to the <strong>Connection</strong> tab in SuprShop</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>
                        Enter your shop domain (e.g., <code className="bg-gray-100 px-1 rounded">your-store.myshopify.com</code>)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>Paste the access token you copied</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>Click <strong>"Connect to Shopify"</strong></div>
                    </li>
                  </ol>

                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>That's it!</strong> You're now connected and can start importing products and collections.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Security Note */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Security:</strong> Your access token is encrypted and stored securely. It's never exposed in API responses or logs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help & FAQ Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions and troubleshooting guide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* FAQ Items */}
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: Do I need server access to configure Shopify integration?</h4>
                    <p className="text-gray-600 text-sm">
                      No! Each store owner can configure their own Shopify app credentials directly in the SuprShop 
                      admin panel. You don't need access to server environment variables or configuration files. 
                      Simply create a Shopify app in your Partner Dashboard and enter the credentials in the 
                      Connection tab.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: Can I test the integration without affecting my live store?</h4>
                    <p className="text-gray-600 text-sm">
                      Yes! We recommend using a Shopify development store first. You can create one for free 
                      through your Shopify Partner account. Use the "Dry Run" option to preview imports before 
                      making actual changes.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: How long does the import process take?</h4>
                    <p className="text-gray-600 text-sm">
                      Import time depends on your catalog size. As a reference:
                      <ul className="mt-2 ml-4 list-disc">
                        <li>100 products: ~1-2 minutes</li>
                        <li>1,000 products: ~5-10 minutes</li>
                        <li>10,000 products: ~30-60 minutes</li>
                      </ul>
                      The integration uses pagination and rate limiting to ensure stable imports.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: What happens to existing products?</h4>
                    <p className="text-gray-600 text-sm">
                      Products are matched by their handle (URL key). If a product with the same handle exists, 
                      it will be updated. New products will be created. No products are deleted during import.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: Can I import only specific products?</h4>
                    <p className="text-gray-600 text-sm">
                      Currently, the integration imports all products or collections. You can use the "Limited Import" 
                      option to import a specific number of products for testing. Future updates will include 
                      selective import based on collections or tags.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Q: Are product variants imported?</h4>
                    <p className="text-gray-600 text-sm">
                      Yes, all variants are imported and consolidated into a single product with options. 
                      Variant-specific data like SKU, price, and inventory are preserved as product attributes.
                    </p>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Troubleshooting</h3>
                  <div className="space-y-3">
                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong>Error: "Invalid shop domain"</strong><br />
                        Make sure you enter the full Shopify domain including .myshopify.com
                        (e.g., your-store.myshopify.com)
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong>Error: "Invalid access token"</strong><br />
                        Make sure you copied the access token correctly. It should start with "shpat_" and have no extra spaces.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong>Error: "Connection failed"</strong><br />
                        Verify that your custom app is installed in Shopify and has the correct API scopes enabled.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong>Import fails or times out</strong><br />
                        For large catalogs, try importing in smaller batches using the "Limited Import" option. 
                        Check your server logs for specific error messages.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Support Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Need More Help?</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 mb-3">
                      If you're experiencing issues not covered here, you can:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Check the server logs for detailed error messages
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Review the API documentation at <a href="https://shopify.dev/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">shopify.dev/api</a>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Test with a smaller product catalog first
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Verify all environment variables are correctly set
                      </li>
                    </ul>
                  </div>
                </div>

                {/* API Limits */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">API Rate Limits</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 mb-3">
                      The integration respects Shopify's API rate limits:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>REST API:</strong> 2 requests per second (bucket size: 40)</li>
                      <li>• <strong>Automatic retry:</strong> Failed requests are retried with exponential backoff</li>
                      <li>• <strong>Pagination:</strong> Large datasets are fetched in chunks of 250 items</li>
                      <li>• <strong>Rate limit handling:</strong> Integration automatically slows down when limits are approached</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShopifyIntegration;