import React from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabasePage from './SupabasePage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Database, Server, Cloud } from 'lucide-react';

const DatabaseIntegrations = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Integrations</h1>
        <p className="text-gray-600">
          Connect your store with database services for data storage, backups, and analytics.
        </p>
      </div>

      <Tabs defaultValue="supabase" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="supabase" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Supabase</span>
          </TabsTrigger>
          <TabsTrigger value="aiven" className="flex items-center space-x-2">
            <Server className="w-4 h-4" />
            <span>Aiven</span>
          </TabsTrigger>
          <TabsTrigger value="cloud" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Cloud Databases</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="space-y-6">
          <SupabasePage />
        </TabsContent>

        <TabsContent value="aiven" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>Aiven Database Services</span>
              </CardTitle>
              <CardDescription>
                Connect to Aiven's managed database services including PostgreSQL, MySQL, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">Coming Soon</p>
                <p className="text-gray-400 text-xs">
                  Aiven integration will support PostgreSQL, MySQL, Redis, and OpenSearch.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AWS RDS</CardTitle>
                <CardDescription>
                  Connect to Amazon Relational Database Service for scalable database hosting.
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
                <CardTitle>Google Cloud SQL</CardTitle>
                <CardDescription>
                  Integrate with Google Cloud's fully managed relational database service.
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
                <CardTitle>Azure Database</CardTitle>
                <CardDescription>
                  Connect to Microsoft Azure's managed database services.
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
                <CardTitle>PlanetScale</CardTitle>
                <CardDescription>
                  Serverless MySQL database platform with branching and scaling.
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

export default DatabaseIntegrations;