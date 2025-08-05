import React from 'react';
import { useStoreSlug } from '../hooks/useStoreSlug';
import SupabaseIntegration from '../components/integrations/SupabaseIntegration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Cloud, Database, ShoppingBag } from 'lucide-react';

const Integrations = () => {
  const { storeId } = useStoreSlug();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect your store with external services to enhance functionality and streamline operations.
        </p>
      </div>

      <Tabs defaultValue="supabase" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="supabase" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Supabase</span>
          </TabsTrigger>
          <TabsTrigger value="akeneo" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Akeneo PIM</span>
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4" />
            <span>E-commerce</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="space-y-6">
          <SupabaseIntegration storeId={storeId} />
        </TabsContent>

        <TabsContent value="akeneo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Akeneo PIM Integration</span>
              </CardTitle>
              <CardDescription>
                Connect to Akeneo Product Information Management system to import products, categories, and attributes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Akeneo integration is available on the dedicated Akeneo page.
                </p>
                <a
                  href="/admin/akeneo-integration"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Akeneo Integration
                </a>
              </div>
            </CardContent>
          </Card>
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
                  <p className="text-gray-500 text-sm">Coming Soon</p>
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
      </Tabs>
    </div>
  );
};

export default Integrations;