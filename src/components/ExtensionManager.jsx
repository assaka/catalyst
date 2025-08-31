/**
 * Extension Manager Component
 * Manages loading, configuration, and monitoring of extensions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  BarChart3
} from 'lucide-react';

import extensionSystem from '@/core/ExtensionSystem.js';
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

const ExtensionManager = ({ storeId, className = '' }) => {
  const [extensions, setExtensions] = useState([]);
  const [loadedExtensions, setLoadedExtensions] = useState([]);
  const [hookStats, setHookStats] = useState({});
  const [eventStats, setEventStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedExtension, setSelectedExtension] = useState(null);

  // Load extension data
  useEffect(() => {
    loadExtensionData();
    
    // Set up listeners for extension events
    const unsubscribeExtensionLoaded = eventSystem.on('extension.loaded', ({ extensionId }) => {
      console.log(`🔌 Extension loaded: ${extensionId}`);
      updateLoadedExtensions();
    });

    const unsubscribeExtensionUnloaded = eventSystem.on('extension.unloaded', ({ extensionId }) => {
      console.log(`🔌 Extension unloaded: ${extensionId}`);
      updateLoadedExtensions();
    });

    return () => {
      unsubscribeExtensionLoaded();
      unsubscribeExtensionUnloaded();
    };
  }, []);

  const loadExtensionData = async () => {
    try {
      setLoading(true);
      
      // Get available extensions
      const availableExtensions = [
        {
          id: 'custom-pricing@1.0.0',
          name: 'Custom Pricing',
          version: '1.0.0',
          description: 'Advanced pricing rules and discounts',
          status: 'available',
          category: 'commerce',
          author: 'Store Admin',
          tags: ['pricing', 'discounts', 'loyalty']
        },
        {
          id: 'analytics-tracker@1.2.0',
          name: 'Analytics Tracker',
          version: '1.2.0',
          description: 'Advanced analytics tracking for user behavior',
          status: 'available',
          category: 'analytics',
          author: 'Analytics Team',
          tags: ['analytics', 'tracking', 'gtag']
        }
      ];

      setExtensions(availableExtensions);
      updateLoadedExtensions();
      updateStats();

    } catch (error) {
      console.error('❌ Failed to load extension data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLoadedExtensions = () => {
    const loaded = extensionSystem.getLoadedExtensions();
    setLoadedExtensions(loaded);
  };

  const updateStats = () => {
    setHookStats(hookSystem.getStats());
    setEventStats(eventSystem.getStats());
  };

  const handleLoadExtension = async (extensionId) => {
    try {
      // For demo purposes, we'll import the extensions dynamically
      let extensionModule;
      
      if (extensionId.includes('custom-pricing')) {
        extensionModule = await import('@/extensions/custom-pricing.js');
      } else if (extensionId.includes('analytics-tracker')) {
        extensionModule = await import('@/extensions/analytics-tracker.js');
      }

      if (extensionModule) {
        const extension = extensionModule.default;
        await extensionSystem.register(extension);
        await extensionSystem.load(extensionId);
        
        updateLoadedExtensions();
        updateStats();
      }
    } catch (error) {
      console.error('❌ Failed to load extension:', error);
    }
  };

  const handleUnloadExtension = async (extensionId) => {
    try {
      await extensionSystem.unload(extensionId);
      updateLoadedExtensions();
      updateStats();
    } catch (error) {
      console.error('❌ Failed to unload extension:', error);
    }
  };

  const getExtensionStatus = (extensionId) => {
    return loadedExtensions.includes(extensionId) ? 'loaded' : 'available';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'loaded':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'available':
        return <Package className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'loaded':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading extensions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Extension Manager</h2>
          <p className="text-muted-foreground">Manage and configure your store extensions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">{loadedExtensions.length} Active</p>
            <p className="text-xs text-muted-foreground">{extensions.length} Available</p>
          </div>
          <Button onClick={() => updateStats()}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="extensions" className="w-full">
        <TabsList>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="hooks">Hooks ({Object.keys(hookStats).length})</TabsTrigger>
          <TabsTrigger value="events">Events ({Object.keys(eventStats.listeners || {}).length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extensions.map((extension) => {
              const status = getExtensionStatus(extension.id);
              const isLoaded = status === 'loaded';
              
              return (
                <Card key={extension.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <div>
                          <CardTitle className="text-base">{extension.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">v{extension.version}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      {extension.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {extension.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isLoaded ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnloadExtension(extension.id)}
                        >
                          Unload
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleLoadExtension(extension.id)}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExtension(extension)}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Active Hooks
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hook points currently registered in the system
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Object.entries(hookStats).map(([hookName, handlerCount]) => (
                  <div key={hookName} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <code className="text-sm font-mono">{hookName}</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        {handlerCount} handler{handlerCount !== 1 ? 's' : ''} registered
                      </p>
                    </div>
                    <Badge variant="outline">
                      {handlerCount}
                    </Badge>
                  </div>
                ))}
                
                {Object.keys(hookStats).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hooks currently registered
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Event Listeners
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Event listeners currently active in the system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{eventStats.totalEvents || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Events</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{eventStats.historySize || 0}</p>
                    <p className="text-xs text-muted-foreground">Recent Events</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">
                      {Object.values(eventStats.listeners || {}).reduce((sum, count) => sum + count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Listeners</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-xs text-muted-foreground">System Status</p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {Object.entries(eventStats.listeners || {}).map(([eventName, listenerCount]) => (
                    <div key={eventName} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <code className="text-sm font-mono">{eventName}</code>
                        <p className="text-xs text-muted-foreground mt-1">
                          {listenerCount} listener{listenerCount !== 1 ? 's' : ''} attached
                        </p>
                      </div>
                      <Badge variant="outline">
                        {listenerCount}
                      </Badge>
                    </div>
                  ))}
                  
                  {Object.keys(eventStats.listeners || {}).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No event listeners currently active
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Extension Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold">{extensionSystem.getStats().totalExtensions}</p>
                  <p className="text-xs text-muted-foreground">Total Extensions</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold text-green-600">{extensionSystem.getStats().loadedExtensions}</p>
                  <p className="text-xs text-muted-foreground">Loaded</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold text-yellow-600">{extensionSystem.getStats().unloadedExtensions}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hook Execution Time</span>
                    <span className="text-sm text-muted-foreground">< 1ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Event Processing</span>
                    <span className="text-sm text-muted-foreground">< 0.5ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">~2MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extension Configuration Modal would go here */}
      {selectedExtension && (
        <Card className="fixed inset-4 z-50 max-w-2xl mx-auto my-auto h-fit bg-background border shadow-lg">
          <CardHeader>
            <CardTitle>{selectedExtension.name} Configuration</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedExtension(null)}
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{selectedExtension.description}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <p className="text-sm text-muted-foreground">{selectedExtension.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <p className="text-sm text-muted-foreground">{selectedExtension.author}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <p className="text-sm text-muted-foreground capitalize">{selectedExtension.category}</p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedExtension(null)}>
                  Close
                </Button>
                <Button>
                  Save Configuration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExtensionManager;