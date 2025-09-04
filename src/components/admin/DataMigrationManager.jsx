import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Database,
  Cloud,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Link,
  Key,
  Eye,
  EyeOff,
  Puzzle,
  Cog
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';

const DataMigrationManager = ({ storeId }) => {
  const [migrations, setMigrations] = useState([]);
  const [migrationStats, setMigrationStats] = useState(null);
  const [migrationTypes, setMigrationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState({
    project_url: '',
    anon_key: '',
    service_key: '',
    jwt_secret: '',
    database_url: '',
    connection_name: 'primary'
  });
  const [showKeys, setShowKeys] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  useEffect(() => {
    loadMigrationData();
  }, [storeId]);

  const loadMigrationData = async () => {
    setLoading(true);
    try {
      // Load migration types
      const typesResponse = await apiClient.get(`/stores/${storeId}/data-migration/types`);
      if (typesResponse.data.success) {
        setMigrationTypes(typesResponse.data.data);
      }

      // Load migration status
      const statusResponse = await apiClient.get(`/stores/${storeId}/data-migration/status`);
      if (statusResponse.data.success) {
        setMigrationStats(statusResponse.data.data);
        setMigrations(statusResponse.data.data.migrations);
      }

      // Load Supabase connections
      const connectionsResponse = await apiClient.get(`/stores/${storeId}/template-customization/supabase-connections`);
      if (connectionsResponse.data.success && connectionsResponse.data.data.connections?.length > 0) {
        const connection = connectionsResponse.data.data.connections[0];
        setSupabaseConfig(prev => ({
          ...prev,
          project_url: connection.project_url || '',
          connection_name: connection.connection_name || 'primary'
        }));
      }
    } catch (error) {
      console.error('Load migration data error:', error);
      toast.error('Failed to load migration data');
    } finally {
      setLoading(false);
    }
  };

  const setupSupabaseConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await apiClient.post(`/stores/${storeId}/template-customization/supabase-connection`, supabaseConfig);
      
      if (response.data.success) {
        setConnectionResult(response.data.data.test_result);
        toast.success('Supabase connection configured successfully');
        loadMigrationData(); // Refresh data
      }
    } catch (error) {
      console.error('Setup connection error:', error);
      toast.error('Failed to setup Supabase connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const setupMigration = async (migrationType) => {
    try {
      const response = await apiClient.post(`/stores/${storeId}/data-migration/setup`, {
        migration_type: migrationType,
        target_system: 'supabase',
        migration_config: {
          preserve_relationships: true,
          include_metadata: true
        }
      });

      if (response.data.success) {
        toast.success(`${migrationType} migration configured`);
        loadMigrationData();
      }
    } catch (error) {
      console.error('Setup migration error:', error);
      toast.error(error.response?.data?.error || 'Failed to setup migration');
    }
  };

  const startMigration = async (migrationType) => {
    try {
      const response = await apiClient.post(`/stores/${storeId}/data-migration/${migrationType}/start`);
      
      if (response.data.success) {
        toast.success(`${migrationType} migration started`);
        loadMigrationData();
        
        // Start polling for progress updates
        startProgressPolling();
      }
    } catch (error) {
      console.error('Start migration error:', error);
      toast.error(error.response?.data?.error || 'Failed to start migration');
    }
  };

  const pauseMigration = async (migrationType) => {
    try {
      const response = await apiClient.post(`/stores/${storeId}/data-migration/${migrationType}/pause`, {
        reason: 'Manual pause by user'
      });
      
      if (response.data.success) {
        toast.success(`${migrationType} migration paused`);
        loadMigrationData();
      }
    } catch (error) {
      console.error('Pause migration error:', error);
      toast.error('Failed to pause migration');
    }
  };

  const resetMigration = async (migrationType) => {
    if (!confirm(`Are you sure you want to reset the ${migrationType} migration? This will clear all progress.`)) return;

    try {
      const response = await apiClient.post(`/stores/${storeId}/data-migration/${migrationType}/reset`);
      
      if (response.data.success) {
        toast.success(`${migrationType} migration reset`);
        loadMigrationData();
      }
    } catch (error) {
      console.error('Reset migration error:', error);
      toast.error('Failed to reset migration');
    }
  };

  const startProgressPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/stores/${storeId}/data-migration/status`);
        if (response.data.success) {
          setMigrationStats(response.data.data);
          setMigrations(response.data.data.migrations);
          
          // Stop polling if no migrations are in progress
          const hasInProgress = response.data.data.migrations.some(m => m.status === 'in_progress');
          if (!hasInProgress) {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
        clearInterval(interval);
      }
    }, 3000);
  };

  const getMigrationIcon = (type) => {
    switch (type) {
      case 'catalog': return <Package className="w-5 h-5" />;
      case 'sales': return <ShoppingCart className="w-5 h-5" />;
      case 'content': return <FileText className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'integrations': return <Puzzle className="w-5 h-5" />;
      case 'operations': return <Cog className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const migrationsByType = migrations.reduce((acc, migration) => {
    acc[migration.type] = migration;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup Connection</TabsTrigger>
          <TabsTrigger value="migrations">Data Migration</TabsTrigger>
          <TabsTrigger value="status">Migration Status</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Supabase Connection Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Link className="w-4 h-4" />
                <AlertDescription>
                  Configure your Supabase project to enable data migration. Your data will be stored in your own Supabase instance.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_url">Project URL *</Label>
                  <Input
                    id="project_url"
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    value={supabaseConfig.project_url}
                    onChange={(e) => setSupabaseConfig(prev => ({ ...prev, project_url: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection_name">Connection Name</Label>
                  <Input
                    id="connection_name"
                    placeholder="primary"
                    value={supabaseConfig.connection_name}
                    onChange={(e) => setSupabaseConfig(prev => ({ ...prev, connection_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="anon_key">Anon Key *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Input
                  id="anon_key"
                  type={showKeys ? "text" : "password"}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.anon_key}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, anon_key: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_key">Service Role Key *</Label>
                <Input
                  id="service_key"
                  type={showKeys ? "text" : "password"}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.service_key}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, service_key: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jwt_secret">JWT Secret (Optional)</Label>
                <Input
                  id="jwt_secret"
                  type={showKeys ? "text" : "password"}
                  placeholder="your-jwt-secret"
                  value={supabaseConfig.jwt_secret}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, jwt_secret: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database_url">Database URL (Optional)</Label>
                <Input
                  id="database_url"
                  type={showKeys ? "text" : "password"}
                  placeholder="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
                  value={supabaseConfig.database_url}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, database_url: e.target.value }))}
                />
              </div>

              <Button 
                onClick={setupSupabaseConnection}
                disabled={testingConnection || !supabaseConfig.project_url || !supabaseConfig.anon_key || !supabaseConfig.service_key}
                className="w-full"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Setup & Test Connection
                  </>
                )}
              </Button>

              {connectionResult && (
                <Alert className={connectionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {connectionResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {connectionResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Migration Types</CardTitle>
            </CardHeader>
            <CardContent>
              {!connectionResult?.success && (
                <Alert className="mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Please setup and test your Supabase connection first before configuring migrations.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                {migrationTypes.map((type) => {
                  const migration = migrationsByType[type.type];
                  
                  return (
                    <div key={type.type} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getMigrationIcon(type.type)}
                          <div>
                            <h4 className="font-medium">{type.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">
                                {type.tables.length} tables
                              </Badge>
                              {migration && (
                                <Badge variant={migration.status === 'completed' ? 'default' : 'secondary'}>
                                  {migration.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!migration ? (
                            <Button
                              size="sm"
                              onClick={() => setupMigration(type.type)}
                              disabled={!connectionResult?.success}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Setup
                            </Button>
                          ) : (
                            <>
                              {migration.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => startMigration(type.type)}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              )}
                              
                              {migration.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => pauseMigration(type.type)}
                                >
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pause
                                </Button>
                              )}
                              
                              {(migration.status === 'failed' || migration.status === 'paused') && (
                                <Button
                                  size="sm"
                                  onClick={() => startMigration(type.type)}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Resume
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetMigration(type.type)}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reset
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {migration && migration.progress > 0 && (
                        <div className="mt-3">
                          <Progress value={migration.progress} className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">
                            {migration.progress.toFixed(1)}% complete
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Migration Overview</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMigrationData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {migrationStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{migrationStats.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{migrationStats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{migrationStats.inProgress}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{migrationStats.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{migrationStats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              )}

              {migrations.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No migrations configured yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Setup your Supabase connection and configure migrations to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {migrations.map((migration) => (
                    <div key={migration.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(migration.status)}
                        <div>
                          <p className="font-medium capitalize">{migration.type} Migration</p>
                          <p className="text-sm text-gray-600">
                            Last sync: {migration.lastSync ? new Date(migration.lastSync).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-medium capitalize ${getStatusColor(migration.status)}`}>
                          {migration.status}
                        </p>
                        <p className="text-sm text-gray-600">
                          {migration.progress.toFixed(1)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataMigrationManager;