import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabasePage from './SupabasePage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Database, Server, Cloud, Check, Star } from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'sonner';

const DatabaseIntegrations = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [settingDefault, setSettingDefault] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchDefaultProvider();
    }
  }, [storeId]);

  const fetchDefaultProvider = async () => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/default-database-provider`);
      setDefaultProvider(response.data?.provider);
    } catch (error) {
      console.error('Error fetching default database provider:', error);
    }
  };

  const handleSetAsDefault = async (provider) => {
    if (!storeId) {
      toast.error('Please select a store first');
      return;
    }

    setSettingDefault(true);
    try {
      await apiClient.post(`/stores/${storeId}/default-database-provider`, {
        provider: provider
      });
      
      setDefaultProvider(provider);
      toast.success(`${provider} set as default database provider`);
      
      // Refresh the default provider status
      await fetchDefaultProvider();
    } catch (error) {
      console.error('Error setting default database provider:', error);
      toast.error('Failed to set as default database provider');
    } finally {
      setSettingDefault(false);
    }
  };

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
          <TabsTrigger value="supabase" className="flex items-center space-x-2 relative">
            <Database className="w-4 h-4" />
            <span>Supabase</span>
            {defaultProvider === 'supabase' && (
              <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aiven" className="flex items-center space-x-2 relative">
            <Server className="w-4 h-4" />
            <span>Aiven</span>
            {defaultProvider === 'aiven' && (
              <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cloud" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Cloud Databases</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="space-y-6">
          {/* Render the Supabase page content directly without wrapper */}
          {storeId ? (
            <>
              {/* Show the unified Supabase interface */}
              <SupabasePage />
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-600">
                  Please select a store from the dropdown above to manage database integrations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aiven" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <CardTitle>Aiven Database Services</CardTitle>
                </div>
                <Button
                  onClick={() => handleSetAsDefault('aiven')}
                  disabled={settingDefault || defaultProvider === 'aiven'}
                  variant={defaultProvider === 'aiven' ? "secondary" : "default"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {defaultProvider === 'aiven' ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Default Database</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4" />
                      <span>Set as Default</span>
                    </>
                  )}
                </Button>
              </div>
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
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>AWS RDS</CardTitle>
                  <Button
                    onClick={() => handleSetAsDefault('aws-rds')}
                    disabled={settingDefault || defaultProvider === 'aws-rds'}
                    variant={defaultProvider === 'aws-rds' ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {defaultProvider === 'aws-rds' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Default</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3 w-3" />
                        <span className="text-xs">Set Default</span>
                      </>
                    )}
                  </Button>
                </div>
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
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Google Cloud SQL</CardTitle>
                  <Button
                    onClick={() => handleSetAsDefault('google-cloud-sql')}
                    disabled={settingDefault || defaultProvider === 'google-cloud-sql'}
                    variant={defaultProvider === 'google-cloud-sql' ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {defaultProvider === 'google-cloud-sql' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Default</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3 w-3" />
                        <span className="text-xs">Set Default</span>
                      </>
                    )}
                  </Button>
                </div>
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
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Azure Database</CardTitle>
                  <Button
                    onClick={() => handleSetAsDefault('azure-database')}
                    disabled={settingDefault || defaultProvider === 'azure-database'}
                    variant={defaultProvider === 'azure-database' ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {defaultProvider === 'azure-database' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Default</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3 w-3" />
                        <span className="text-xs">Set Default</span>
                      </>
                    )}
                  </Button>
                </div>
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
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>PlanetScale</CardTitle>
                  <Button
                    onClick={() => handleSetAsDefault('planetscale')}
                    disabled={settingDefault || defaultProvider === 'planetscale'}
                    variant={defaultProvider === 'planetscale' ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {defaultProvider === 'planetscale' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Default</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3 w-3" />
                        <span className="text-xs">Set Default</span>
                      </>
                    )}
                  </Button>
                </div>
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