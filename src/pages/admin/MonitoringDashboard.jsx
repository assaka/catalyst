import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  RefreshCw, 
  TrendingUp,
  Zap,
  Bug,
  Server,
  Monitor,
  Download
} from 'lucide-react';
import { apiDebugger } from '@/utils/api-debugger';

export default function MonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = apiDebugger.getDashboardData();
      setDashboardData(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleExportLogs = () => {
    apiDebugger.exportLogs();
  };

  const getStatusBadge = (healthy) => {
    return healthy ? (
      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        Healthy
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Issues
      </Badge>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Alpha Disclaimer Banner */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Alpha Preliminary Version</h3>
                <p className="text-sm text-amber-700 mb-2">
                  This monitoring dashboard is currently in alpha development and may contain incomplete features, 
                  inaccurate data, or experimental functionality.
                </p>
                <div className="flex items-center space-x-4 text-xs text-amber-600">
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100">
                    <Activity className="w-3 h-3 mr-1" />
                    Alpha Version
                  </Badge>
                  <span>• Use for testing and development only</span>
                  <span>• Data may be simulated or incomplete</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
            <p className="text-muted-foreground">Real-time application health and performance dashboard</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-300 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Alpha Disclaimer Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Alpha Preliminary Version</h3>
              <p className="text-sm text-amber-700 mb-2">
                This monitoring dashboard is currently in alpha development and may contain incomplete features, 
                inaccurate data, or experimental functionality.
              </p>
              <div className="flex items-center space-x-4 text-xs text-amber-600">
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100">
                  <Activity className="w-3 h-3 mr-1" />
                  Alpha Version
                </Badge>
                <span>• Use for testing and development only</span>
                <span>• Data may be simulated or incomplete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time application health and performance dashboard</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last update: {lastUpdate}</span>
          </div>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
          
          <Button onClick={handleExportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.summary?.totalAPICalls || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData?.summary?.totalAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Critical issues detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData?.summary?.totalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Failed requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.summary?.averageResponseTime || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Critical issues detected in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {alert.alertType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-red-800">
                      {alert.endpoint || 'System Alert'}
                    </p>
                    {alert.message && (
                      <p className="text-xs text-red-600 mt-1">{alert.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Slowest Endpoints
            </CardTitle>
            <CardDescription>Endpoints with highest response times</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.slowestEndpoints && dashboardData.slowestEndpoints.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.slowestEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{endpoint.endpoint}</p>
                      <p className="text-xs text-muted-foreground">
                        {endpoint.callCount} calls
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {endpoint.averageTime}ms
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Server className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Prone Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="w-5 h-5 mr-2" />
              Error-Prone Endpoints
            </CardTitle>
            <CardDescription>Endpoints with most errors</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.mostErroredEndpoints && dashboardData.mostErroredEndpoints.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.mostErroredEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{endpoint.endpoint}</p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {endpoint.errorCount} errors
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No errors detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schema Violations */}
      {dashboardData?.schemaViolations && dashboardData.schemaViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Schema Violations
            </CardTitle>
            <CardDescription>Data structure issues detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.schemaViolations.map((violation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Database className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                        Schema Mismatch
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(violation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-orange-800">
                      {violation.endpoint}
                    </p>
                    {violation.errors && (
                      <div className="mt-2">
                        <p className="text-xs text-orange-600 mb-1">Validation errors:</p>
                        <ul className="text-xs text-orange-600 list-disc list-inside space-y-1">
                          {violation.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            System Status
          </CardTitle>
          <CardDescription>Overall application health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">API Monitoring</span>
              </div>
              {getStatusBadge(true)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Schema Validation</span>
              </div>
              {getStatusBadge(dashboardData?.schemaViolations?.length === 0)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Bug className="w-4 h-4" />
                <span className="text-sm font-medium">Error Detection</span>
              </div>
              {getStatusBadge(dashboardData?.summary?.totalErrors < 5)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Monitoring System v0.1-alpha</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Auto-refresh: {autoRefresh ? 'On' : 'Off'}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Update interval: 30s</span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                Alpha
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>Development mode</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}