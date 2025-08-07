import React, { useState } from 'react';
import ShopifyIntegrationComponent from '../components/integrations/ShopifyIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
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
                        <strong>OAuth 2.0 Authentication:</strong> Secure connection using Shopify's OAuth flow
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
                        <h4 className="font-medium">Connect Your Store</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Enter your Shopify store domain (e.g., your-store.myshopify.com) and click Connect.
                          You'll be redirected to Shopify to authorize the connection.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        2
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Authorize Access</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Review the permissions requested and click "Install app" in Shopify to grant access.
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
                <CardTitle>Shopify App Configuration</CardTitle>
                <CardDescription>
                  Step-by-step guide to configure your Shopify app for integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prerequisites */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Prerequisites:</strong> You need a Shopify Partner account and a development store for testing.
                    Create a free Partner account at <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="underline">partners.shopify.com</a>
                  </AlertDescription>
                </Alert>

                {/* Step 1: Create App */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 1: Create a Shopify App</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>
                        Log in to your <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Shopify Partner Dashboard</a>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>Navigate to Apps → Create app</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>Choose "Custom app" for your store</div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>
                        Set app name: <code className="bg-gray-100 px-2 py-1 rounded">SuprShop Integration</code>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Step 2: Configure OAuth */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 2: Configure OAuth Settings</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">App URL</label>
                      <code className="block bg-white p-2 rounded border text-xs">
                        https://your-frontend-domain.com/admin/shopify-integration
                      </code>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowed redirection URLs</label>
                      <div className="space-y-2">
                        <code className="block bg-white p-2 rounded border text-xs">
                          https://your-backend-domain.com/api/shopify/callback
                        </code>
                        <code className="block bg-white p-2 rounded border text-xs">
                          https://your-frontend-domain.com/integrations/shopify/success
                        </code>
                        <code className="block bg-white p-2 rounded border text-xs">
                          https://your-frontend-domain.com/integrations/shopify/error
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: API Scopes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 3: Configure API Scopes</h3>
                  <p className="text-gray-600 mb-3">Select the following scopes in your app configuration:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_products</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_product_listings</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_inventory</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_customers</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_orders</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_content</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_themes</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <code className="text-sm">read_script_tags</code>
                    </div>
                  </div>
                </div>

                {/* Step 4: Configure App in SuprShop */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 4: Configure App Credentials in SuprShop</h3>
                  <p className="text-gray-600 mb-3">After creating your Shopify app, configure it in SuprShop:</p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>
                        Go to the <strong>Connection</strong> tab on this page
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>
                        Click <strong>"Configure App Credentials"</strong>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>
                        Enter your <strong>Client ID</strong> from Shopify Partner Dashboard
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>
                        Enter your <strong>Client Secret</strong> (keep this secure!)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">5.</span>
                      <div>
                        Verify the <strong>Redirect URI</strong> matches what you added in Shopify
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">6.</span>
                      <div>
                        Click <strong>"Save Credentials"</strong>
                      </div>
                    </li>
                  </ol>
                  <Alert className="mt-3">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your credentials are encrypted and stored securely per store. Each store can have its own Shopify app configuration.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 5: Connect Your Store */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 5: Connect Your Shopify Store</h3>
                  <p className="text-gray-600 mb-3">Once your app credentials are configured:</p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <div>
                        Enter your Shopify store domain (e.g., <code>your-store.myshopify.com</code>)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <div>
                        Click <strong>"Connect"</strong> to initiate OAuth
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <div>
                        Authorize the app in Shopify when prompted
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <div>
                        You'll be redirected back to SuprShop once connected
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Security Note */}
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Security Note:</strong> Never commit your Client Secret to version control. 
                    Always use environment variables and keep them secure.
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
                        <strong>Error: "Shopify app not configured"</strong><br />
                        You need to configure your Shopify app credentials first. Go to the Connection tab 
                        and click "Configure App Credentials" to enter your Client ID and Client Secret.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong>Error: "Invalid HMAC"</strong><br />
                        This indicates a security verification failure. Ensure your Client Secret is correct 
                        and matches the one in your Shopify app settings.
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
  );
};

export default ShopifyIntegration;