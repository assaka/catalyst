import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart3, 
  MousePointer, 
  Eye, 
  Scroll, 
  Smartphone, 
  Monitor, 
  Tablet,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Download,
  Settings,
  RefreshCw,
  Info,
  AlertCircle,
  AlertTriangle,
  Power
} from 'lucide-react';

import HeatmapVisualization from '@/components/heatmap/HeatmapVisualization';
import HeatmapTrackerComponent from '@/components/heatmap/HeatmapTracker';

export default function HeatmapAnalytics() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [topPages, setTopPages] = useState([]);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [summary, setSummary] = useState([]);
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [error, setError] = useState(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 30 seconds

  // Heatmap enable state
  const [heatmapEnabled, setHeatmapEnabled] = useState(true); // Default enabled for alpha

  useEffect(() => {
    if (selectedStore) {
      loadAllData();
    }
  }, [selectedStore]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !selectedStore) return;

    const interval = setInterval(() => {
      loadAllData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedStore]);

  const loadAllData = async () => {
    if (!selectedStore) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadAnalytics(),
        loadTopPages(),
        loadRealTimeStats(),
        loadSummary()
      ]);
    } catch (err) {
      console.error('Error loading heatmap data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.get(`heatmap/analytics/${selectedStore.id}`);
      setAnalytics(response.data);
    } catch (err) {
      console.warn('Error loading analytics:', err);
    }
  };

  const loadTopPages = async () => {
    try {
      const response = await apiClient.get(`heatmap/top-pages/${selectedStore.id}?limit=10`);
      setTopPages(response.data || []);
    } catch (err) {
      console.warn('Error loading top pages:', err);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const response = await apiClient.get(`heatmap/realtime/${selectedStore.id}?time_window=1800000`); // 30 minutes
      setRealTimeStats(response.data);
    } catch (err) {
      console.warn('Error loading real-time stats:', err);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await apiClient.get(`heatmap/summary/${selectedStore.id}`);
      setSummary(response.data || []);
    } catch (err) {
      console.warn('Error loading summary:', err);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alpha Disclaimer Banner */}
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Alpha Preliminary Version</h3>
                  <p className="text-sm text-amber-700 mb-2">
                    This heatmap analytics dashboard is currently in alpha development and may contain incomplete features, 
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

          {/* Enable Toggle */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Power className={`w-5 h-5 ${heatmapEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <Label className="text-base font-semibold">Enable Heatmap Analytics</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently free. Future billing (1 credit per day) will only begin after advance notification.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={heatmapEnabled}
                  onCheckedChange={setHeatmapEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading heatmap analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Store Selected</h2>
          <p className="text-gray-600">Please select a store to view heatmap analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Add heatmap tracking to this page */}
      <HeatmapTrackerComponent storeId={selectedStore.id} />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Customer Behavior Heatmaps
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize customer interactions and movement patterns on your store
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Auto-refresh:</span>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? <Zap className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  {autoRefresh ? 'On' : 'Off'}
                </Button>
              </div>
              <Button onClick={loadAllData} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Alpha Disclaimer Banner */}
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Alpha Preliminary Version</h3>
                  <p className="text-sm text-amber-700 mb-2">
                    This heatmap analytics dashboard is currently in alpha development and may contain incomplete features, 
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

          {/* Enable Toggle */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Power className={`w-5 h-5 ${heatmapEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <Label className="text-base font-semibold">Enable Heatmap Analytics</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently free. Future billing (1 credit per day) will only begin after advance notification.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={heatmapEnabled}
                  onCheckedChange={setHeatmapEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {heatmapEnabled ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="pages">Top Pages</TabsTrigger>
                <TabsTrigger value="realtime">Real-time</TabsTrigger>
              </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics?.analytics?.[0]?.total_sessions || 0)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Session Duration</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(analytics?.analytics?.[0]?.avg_session_duration || 0)}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics?.analytics?.[0] 
                            ? Math.round((analytics.analytics[0].bounce_sessions / analytics.analytics[0].total_sessions) * 100) 
                            : 0}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Interactions</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(analytics?.analytics?.[0]?.avg_interactions_per_session || 0)}
                        </p>
                      </div>
                      <MousePointer className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interaction Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Interaction Summary (Last 7 Days)</CardTitle>
                  <CardDescription>
                    Breakdown of customer interactions by type and page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.length > 0 ? (
                    <div className="space-y-4">
                      {summary.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {item.interaction_type === 'click' && <MousePointer className="w-4 h-4 text-blue-600" />}
                                {item.interaction_type === 'hover' && <Eye className="w-4 h-4 text-green-600" />}
                                {item.interaction_type === 'scroll' && <Scroll className="w-4 h-4 text-orange-600" />}
                                <Badge variant="outline">
                                  {item.interaction_type}
                                </Badge>
                              </div>
                              <span className="font-medium truncate">
                                {item.page_url}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{formatNumber(item.interaction_count)} interactions</span>
                              <span>{formatNumber(item.unique_sessions)} sessions</span>
                              <span>Avg. {formatDuration(item.avg_time_on_element || 0)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.desktop_count || 0} 💻</Badge>
                            <Badge variant="secondary">{item.mobile_count || 0} 📱</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPageUrl(item.page_url)}
                            >
                              View Heatmap
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No interaction data available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Interactions will appear here as customers use your store
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Heatmap Tab */}
            <TabsContent value="heatmap" className="space-y-6">
              <HeatmapVisualization 
                storeId={selectedStore.id}
                initialPageUrl={selectedPageUrl}
              />
            </TabsContent>

            {/* Top Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages by User Engagement</CardTitle>
                  <CardDescription>
                    Pages ranked by sessions, duration, and interaction levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topPages.length > 0 ? (
                    <div className="space-y-4">
                      {topPages.map((page, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{page.page_url}</h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span>{formatNumber(page.sessions)} sessions</span>
                                  <span>{formatDuration(page.avg_duration)} avg. duration</span>
                                  <span>{Math.round(page.avg_page_views)} avg. pages</span>
                                  <span>{Math.round(page.bounce_rate)}% bounce rate</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPageUrl(page.page_url)}
                          >
                            View Heatmap
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No page data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Real-time Tab */}
            <TabsContent value="realtime" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    Live Activity (Last 30 Minutes)
                  </CardTitle>
                  <CardDescription>
                    Real-time customer interactions happening now
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {realTimeStats?.stats && realTimeStats.stats.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {realTimeStats.stats.map((stat, index) => (
                          <div key={index} className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                            <div className="text-3xl font-bold text-blue-800">
                              {formatNumber(stat.count)}
                            </div>
                            <div className="text-sm text-blue-600 capitalize mt-1">
                              {stat.interaction_type}s
                            </div>
                            <div className="text-xs text-blue-500 mt-2">
                              {stat.unique_sessions} unique sessions
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-center text-sm text-gray-500">
                        Data refreshes automatically every {refreshInterval} seconds
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No live activity detected</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Real-time interactions will appear here as customers browse your store
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Power className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Heatmap Analytics Disabled</h3>
                  <p className="text-gray-600 mb-4">
                    Enable heatmap analytics above to start tracking customer behavior
                  </p>
                  <p className="text-sm text-gray-500">
                    Currently free. Future billing (1 credit per day) will only begin after advance notification.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}