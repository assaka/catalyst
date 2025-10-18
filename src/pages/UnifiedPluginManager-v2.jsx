/**
 * Unified Plugin Manager v2.0
 * AI-Driven Plugin System with No-Code and Developer Modes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  Code2,
  Package,
  Settings,
  Activity,
  CheckCircle,
  Zap,
  BarChart3,
  Play,
  Pause,
  Trash2,
  Eye,
  Download,
  Shield,
  Sparkles,
  Puzzle
} from 'lucide-react';
import apiClient from '@/api/client';
import NoCodePluginBuilder from '@/components/plugins/NoCodePluginBuilder';
import DeveloperPluginEditor from '@/components/plugins/DeveloperPluginEditor';

const UnifiedPluginManagerV2 = () => {
  const [activeView, setActiveView] = useState('marketplace');
  const [builderMode, setBuilderMode] = useState(null); // null | 'nocode' | 'developer'
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlugins: 0,
    activePlugins: 0,
    hooks: 0,
    events: 0
  });

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('plugins/registry');

      const pluginsData = (response.data || []).map(plugin => ({
        ...plugin,
        isActive: plugin.status === 'active'
      }));

      setPlugins(pluginsData);
      updateStats(pluginsData);
    } catch (error) {
      console.error('Error loading plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (pluginsData) => {
    const activeCount = pluginsData.filter(p => p.isActive).length;
    const hooksCount = pluginsData.reduce((sum, p) => sum + (p.hooks?.length || 0), 0);
    const eventsCount = pluginsData.reduce((sum, p) => sum + (p.events?.length || 0), 0);

    setStats({
      totalPlugins: pluginsData.length,
      activePlugins: activeCount,
      hooks: hooksCount,
      events: eventsCount
    });
  };

  const handleTogglePlugin = async (plugin) => {
    try {
      const newStatus = plugin.isActive ? 'inactive' : 'active';
      await apiClient.patch(`plugins/registry/${plugin.id}/status`, {
        status: newStatus
      });
      await loadPlugins();
    } catch (error) {
      console.error('Error toggling plugin:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeletePlugin = async (plugin) => {
    if (!confirm(`Delete ${plugin.name}? This cannot be undone.`)) return;

    try {
      await apiClient.delete(`plugins/registry/${plugin.id}`);
      await loadPlugins();
    } catch (error) {
      console.error('Error deleting plugin:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSavePlugin = async (pluginConfig) => {
    try {
      // Save plugin to backend - AI will generate all code
      const response = await apiClient.post('plugins/registry', {
        ...pluginConfig,
        status: 'active',
        generated_by_ai: true
      });

      alert('Plugin created successfully!');
      setBuilderMode(null);
      await loadPlugins();
    } catch (error) {
      console.error('Error saving plugin:', error);
      alert(`Error creating plugin: ${error.message}`);
    }
  };

  const handleEditPlugin = (plugin) => {
    setSelectedPlugin(plugin);
    setBuilderMode('developer');
  };

  const handleCreatePlugin = (mode) => {
    setSelectedPlugin(null);
    setBuilderMode(mode);
  };

  const getPluginIcon = (category) => {
    switch (category) {
      case 'analytics': return BarChart3;
      case 'security': return Shield;
      case 'commerce': return Package;
      default: return Puzzle;
    }
  };

  // If in builder mode, show full-screen builder
  if (builderMode === 'nocode') {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50">
        <NoCodePluginBuilder
          onSave={handleSavePlugin}
          onCancel={() => setBuilderMode(null)}
        />
      </div>
    );
  }

  if (builderMode === 'developer' && selectedPlugin) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50">
        <DeveloperPluginEditor
          plugin={selectedPlugin}
          onSave={(code) => {
            console.log('Plugin saved:', code);
            setBuilderMode(null);
            setSelectedPlugin(null);
            loadPlugins();
          }}
          onClose={() => {
            setBuilderMode(null);
            setSelectedPlugin(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              AI-Driven Plugin Manager
            </h1>
            <p className="text-gray-600 mt-1">Build plugins with AI - no coding required, or use full developer mode</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreatePlugin('nocode')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              No-Code Builder
            </Button>
            <Button
              onClick={() => handleCreatePlugin('developer')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Code2 className="w-4 h-4 mr-2" />
              Developer Mode
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Plugins</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalPlugins}</p>
                </div>
                <Package className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active</p>
                  <p className="text-3xl font-bold text-green-900">{stats.activePlugins}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Hooks</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.hooks}</p>
                </div>
                <Zap className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Events</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.events}</p>
                </div>
                <Activity className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plugins List */}
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="marketplace">
              All Plugins ({plugins.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Only ({plugins.filter(p => p.isActive).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.map((plugin) => {
                const IconComponent = getPluginIcon(plugin.category);

                return (
                  <Card key={plugin.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            plugin.isActive
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-gray-400 to-gray-600'
                          }`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <p className="text-sm text-gray-500">v{plugin.version || '1.0.0'}</p>
                          </div>
                        </div>
                        <Badge className={plugin.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {plugin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {plugin.description || 'No description available'}
                      </p>

                      {plugin.generated_by_ai && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs mb-3">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPlugin(plugin)}
                          >
                            <Code2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePlugin(plugin)}
                            className={plugin.isActive ? 'text-orange-600' : 'text-green-600'}
                          >
                            {plugin.isActive ? (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Enable
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlugin(plugin)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {plugins.length === 0 && (
              <div className="text-center py-16">
                <Puzzle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins yet</h3>
                <p className="text-gray-600 mb-6">Create your first plugin with AI assistance</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => handleCreatePlugin('nocode')}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    No-Code Builder
                  </Button>
                  <Button variant="outline" onClick={() => handleCreatePlugin('developer')}>
                    <Code2 className="w-4 h-4 mr-2" />
                    Developer Mode
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.filter(p => p.isActive).map((plugin) => {
                const IconComponent = getPluginIcon(plugin.category);

                return (
                  <Card key={plugin.id} className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <p className="text-sm text-gray-500">v{plugin.version || '1.0.0'}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {plugin.description || 'No description available'}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditPlugin(plugin)}>
                          <Code2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedPluginManagerV2;
