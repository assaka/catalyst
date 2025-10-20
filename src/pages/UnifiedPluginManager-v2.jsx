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
  Puzzle,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import apiClient from '@/api/client';
import EnhancedNoCodeBuilder from '@/components/plugins/EnhancedNoCodeBuilder';
import DeveloperPluginEditor from '@/components/plugins/DeveloperPluginEditor';

const UnifiedPluginManagerV2 = () => {
  const [activeView, setActiveView] = useState('marketplace');
  const [builderMode, setBuilderMode] = useState(null); // null | 'nocode' | 'developer'
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [pluginContext, setPluginContext] = useState(null); // Shared context for mode switching
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlugins: 0,
    activePlugins: 0,
    hooks: 0,
    events: 0
  });

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPlugin, setSettingsPlugin] = useState(null);
  const [adminPages, setAdminPages] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    version: '',
    author: ''
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

  const handleEditPlugin = (plugin, mode = 'developer') => {
    setSelectedPlugin(plugin);

    // Load plugin data as context for the editor
    const pluginContext = {
      ...plugin,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      version: plugin.version
    };

    setPluginContext(pluginContext);
    setBuilderMode(mode);
  };

  const handleCreatePlugin = (mode) => {
    setSelectedPlugin(null);
    setPluginContext(null);
    setBuilderMode(mode);
  };

  const handleSwitchMode = (newMode, context) => {
    setPluginContext(context); // Preserve context when switching
    setBuilderMode(newMode);
  };

  const handleOpenSettings = async (plugin) => {
    setSettingsPlugin(plugin);
    setSettingsForm({
      name: plugin.name || '',
      description: plugin.description || '',
      version: plugin.version || '1.0.0',
      author: plugin.author || ''
    });

    // Load admin pages for this plugin
    try {
      const response = await apiClient.get(`plugins/admin-pages/${plugin.id}`);
      setAdminPages(response.data || []);
    } catch (error) {
      console.error('Error loading admin pages:', error);
      setAdminPages([]);
    }

    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      await apiClient.patch(`plugins/registry/${settingsPlugin.id}`, settingsForm);
      alert('Settings saved successfully!');
      setIsSettingsOpen(false);
      await loadPlugins();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error: ${error.message}`);
    }
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
        <EnhancedNoCodeBuilder
          initialContext={pluginContext}
          onSave={handleSavePlugin}
          onCancel={() => {
            setBuilderMode(null);
            setPluginContext(null);
          }}
          onSwitchMode={handleSwitchMode}
        />
      </div>
    );
  }

  if (builderMode === 'developer') {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50">
        <DeveloperPluginEditor
          plugin={selectedPlugin}
          initialContext={pluginContext}
          onSave={(code) => {
            console.log('Plugin saved:', code);
            setBuilderMode(null);
            setSelectedPlugin(null);
            setPluginContext(null);
            loadPlugins();
          }}
          onClose={() => {
            setBuilderMode(null);
            setSelectedPlugin(null);
            setPluginContext(null);
          }}
          onSwitchMode={handleSwitchMode}
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
          <div className="flex gap-3">
            <Button
              onClick={() => handleCreatePlugin('nocode')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">No-Code Builder</div>
                <div className="text-xs text-purple-100">AI-powered, no coding needed</div>
              </div>
            </Button>
            <Button
              onClick={() => handleCreatePlugin('developer')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              size="lg"
            >
              <Code2 className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">Developer Mode</div>
                <div className="text-xs text-blue-100">Full code editor & control</div>
              </div>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Code2 className="w-3 h-3 mr-1" />
                                Edit
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'nocode-ai')}>
                                <Sparkles className="w-3 h-3 mr-2" />
                                Edit in No-Code AI
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'guided')}>
                                <Wand2 className="w-3 h-3 mr-2" />
                                Edit in Guided Builder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'developer')}>
                                <Code2 className="w-3 h-3 mr-2" />
                                Edit in Developer Mode
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSettings(plugin)}
                            className="text-gray-600"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Settings
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
                  <Button onClick={() => handleCreatePlugin('nocode-ai')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    No-Code AI
                  </Button>
                  <Button variant="outline" onClick={() => handleCreatePlugin('guided')}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Guided Builder
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Code2 className="w-3 h-3 mr-1" />
                              Edit
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'nocode-ai')}>
                              <Sparkles className="w-3 h-3 mr-2" />
                              Edit in No-Code AI
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'guided')}>
                              <Wand2 className="w-3 h-3 mr-2" />
                              Edit in Guided Builder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPlugin(plugin, 'developer')}>
                              <Code2 className="w-3 h-3 mr-2" />
                              Edit in Developer Mode
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenSettings(plugin)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Modal */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Plugin Settings</DialogTitle>
              <DialogDescription>
                Configure plugin manifest and admin settings
              </DialogDescription>
            </DialogHeader>

            {settingsPlugin && (
              <Tabs defaultValue="manifest" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manifest">Manifest</TabsTrigger>
                  <TabsTrigger value="admin">
                    Admin Pages {adminPages.length > 0 && `(${adminPages.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manifest" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="plugin-name">Plugin Name</Label>
                    <Input
                      id="plugin-name"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      placeholder="My Awesome Plugin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plugin-description">Description</Label>
                    <Textarea
                      id="plugin-description"
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      placeholder="What does your plugin do?"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plugin-version">Version</Label>
                      <Input
                        id="plugin-version"
                        value={settingsForm.version}
                        onChange={(e) => setSettingsForm({ ...settingsForm, version: e.target.value })}
                        placeholder="1.0.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plugin-author">Author</Label>
                      <Input
                        id="plugin-author"
                        value={settingsForm.author}
                        onChange={(e) => setSettingsForm({ ...settingsForm, author: e.target.value })}
                        placeholder="Your Name"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSettings}>
                      Save Changes
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4 mt-4">
                  {adminPages.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">
                        This plugin has {adminPages.length} admin page{adminPages.length !== 1 ? 's' : ''} registered in the admin navigation.
                      </p>
                      {adminPages.map((page) => (
                        <Card key={page.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{page.page_name}</h4>
                              <p className="text-sm text-gray-600">{page.route}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{page.icon}</Badge>
                                <Badge variant="outline">{page.category}</Badge>
                                <Badge variant={page.is_enabled ? 'default' : 'secondary'}>
                                  {page.is_enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              Order: {page.order_position}
                            </div>
                          </div>
                          {page.description && (
                            <p className="text-sm text-gray-600 mt-2">{page.description}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No admin pages found for this plugin</p>
                      <p className="text-sm mt-1">Admin pages can be added through the developer mode</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UnifiedPluginManagerV2;
