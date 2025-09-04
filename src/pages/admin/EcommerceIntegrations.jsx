import React from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';

const EcommerceIntegrations = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">E-commerce Integrations</h1>
        <p className="text-gray-600">
          Connect your store with e-commerce platforms to sync products, inventory, and orders.
        </p>
      </div>

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
    </div>
  );
};

export default EcommerceIntegrations;