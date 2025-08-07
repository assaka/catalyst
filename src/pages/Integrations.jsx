import React from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Database, ShoppingBag, Package } from 'lucide-react';

const Integrations = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Integrations</h1>
        <p className="text-gray-600">
          Connect your store with business platforms, PIM systems, and e-commerce services to streamline operations.
        </p>
      </div>

      <Tabs defaultValue="akeneo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="akeneo" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>PIM Systems</span>
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4" />
            <span>E-commerce</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Business Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="akeneo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Akeneo PIM</span>
                </CardTitle>
                <CardDescription>
                  Connect to Akeneo Product Information Management system to import products, categories, and attributes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <a
                    href="/admin/akeneo-integration"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Configure Akeneo
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pimcore</CardTitle>
                <CardDescription>
                  Integrate with Pimcore's open-source PIM and digital experience platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salsify</CardTitle>
                <CardDescription>
                  Connect to Salsify's Product Experience Management platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>inRiver</CardTitle>
                <CardDescription>
                  Integrate with inRiver's PIM solution for product information management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shopify</CardTitle>
                <CardDescription>
                  Import products and sync inventory with Shopify stores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <a
                    href="/admin/shopify-integration"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Configure Shopify
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WooCommerce</CardTitle>
                <CardDescription>
                  Connect to WooCommerce stores for product synchronization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Magento</CardTitle>
                <CardDescription>
                  Integrate with Magento for comprehensive e-commerce management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>BigCommerce</CardTitle>
                <CardDescription>
                  Sync products and orders with BigCommerce platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HubSpot</CardTitle>
                <CardDescription>
                  Connect to HubSpot CRM for customer relationship management and marketing automation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salesforce</CardTitle>
                <CardDescription>
                  Integrate with Salesforce for advanced CRM and sales management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mailchimp</CardTitle>
                <CardDescription>
                  Connect to Mailchimp for email marketing and customer engagement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slack</CardTitle>
                <CardDescription>
                  Get notifications and alerts directly in your Slack workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;