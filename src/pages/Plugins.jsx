
import React, { useState, useEffect } from "react";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  Puzzle, 
  Plus, 
  Search, 
  Download,
  Star,
  Settings,
  Eye,
  ShoppingCart,
  BarChart3,
  Truck,
  CreditCard,
  Mail,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

import PluginForm from "../components/plugins/PluginForm";

export default function Plugins() {
  const [plugins, setPlugins] = useState([]);
  const [marketplacePlugins, setMarketplacePlugins] = useState([]);
  const [stores, setStores] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showPluginForm, setShowPluginForm] = useState(false);
  const [showGitHubInstall, setShowGitHubInstall] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load modern plugin system and marketplace
      const [pluginsResponse, marketplaceResponse, storesData, userData] = await Promise.all([
        fetch('/api/plugins', { credentials: 'include' }).then(r => r.ok ? r.json() : { data: { plugins: [] } }),
        fetch('/api/plugins/marketplace', { credentials: 'include' }).then(r => r.ok ? r.json() : { data: [] }),
        Store.list(),
        User.me()
      ]);
      
      // Get all plugins from the unified API response
      const allPluginsFromAPI = pluginsResponse.data?.plugins || [];
      const marketplaceData = marketplaceResponse.data || [];
      
      // Transform all plugins (both installed and marketplace) for display
      const allPlugins = allPluginsFromAPI.map(plugin => ({
        id: plugin.slug || plugin.name.toLowerCase().replace(/\s+/g, '-'),
        name: plugin.name,
        slug: plugin.slug || plugin.name.toLowerCase().replace(/\s+/g, '-'),
        description: plugin.manifest?.description || plugin.description || 'No description available',
        long_description: plugin.manifest?.description || plugin.description || 'No description available',
        version: plugin.manifest?.version || plugin.version || '1.0.0',
        price: 0,
        category: plugin.manifest?.category || plugin.category || 'integration',
        icon_url: plugin.source === 'marketplace' 
          ? "https://via.placeholder.com/64x64/10B981/FFFFFF?text=" + plugin.name.charAt(0)
          : "https://via.placeholder.com/64x64/4285F4/FFFFFF?text=" + plugin.name.charAt(0),
        creator_id: plugin.source === 'marketplace' ? "marketplace" : "system",
        creator_name: plugin.manifest?.author || plugin.author || "System",
        status: "approved",
        downloads: plugin.downloads || 0,
        rating: plugin.rating || 0,
        reviews_count: plugin.reviews_count || 0,
        isEnabled: plugin.isEnabled || false,
        isInstalled: plugin.isInstalled || false,
        availableMethods: plugin.manifest?.methods || plugin.methods || [],
        source: plugin.source || 'local',
        sourceType: plugin.manifest?.sourceType || plugin.sourceType || 'local',
        sourceUrl: plugin.sourceUrl
      }));
      
      setPlugins(allPlugins);
      setMarketplacePlugins(marketplaceData);
      setStores(storesData);
      setUser(userData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPlugin = async (plugin) => {
    try {
      const response = await fetch(`/api/plugins/${plugin.slug}/install`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to install plugin');
      }
      
      await loadData();
    } catch (error) {
      console.error("Error installing plugin:", error);
      alert("Error installing plugin: " + error.message);
    }
  };

  const handleUninstallPlugin = async (pluginSlug) => {
    if (window.confirm("Are you sure you want to uninstall this plugin?")) {
      try {
        const response = await fetch(`/api/plugins/${pluginSlug}/uninstall`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to uninstall plugin');
        }
        
        await loadData();
      } catch (error) {
        console.error("Error uninstalling plugin:", error);
        alert("Error uninstalling plugin: " + error.message);
      }
    }
  };

  const handleInstallFromGitHub = async () => {
    if (!githubUrl.trim()) {
      alert("Please enter a GitHub URL");
      return;
    }

    setInstalling(true);
    try {
      const response = await fetch('/api/plugins/install-github', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: githubUrl.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to install plugin from GitHub');
      }

      const result = await response.json();
      alert(`Plugin installed successfully: ${result.message}`);
      
      setShowGitHubInstall(false);
      setGithubUrl("");
      await loadData();
    } catch (error) {
      console.error("Error installing from GitHub:", error);
      alert("Error installing plugin: " + error.message);
    } finally {
      setInstalling(false);
    }
  };

  const handleCreatePlugin = async (pluginData) => {
    try {
      // TODO: Implement modern plugin creation API
      console.log("Plugin creation not yet implemented for modern plugin system:", pluginData);
      alert("Plugin creation will be available in the next version");
      setShowPluginForm(false);
    } catch (error) {
      console.error("Error creating plugin:", error);
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || plugin.category === categoryFilter;
    return matchesSearch && matchesCategory && plugin.status === "approved";
  });

  const isPluginInstalled = (plugin) => {
    return plugin.isInstalled;
  };

  const isPluginEnabled = (plugin) => {
    return plugin.isEnabled;
  };

  const categoryIcons = {
    analytics: BarChart3,
    shipping: Truck,
    payment: CreditCard,
    marketing: Mail,
    integration: Puzzle,
    other: Settings
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "analytics", label: "Analytics" },
    { value: "shipping", label: "Shipping" },
    { value: "payment", label: "Payment" },
    { value: "marketing", label: "Marketing" },
    { value: "integration", label: "Integration" },
    { value: "other", label: "Other" }
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Plugin Marketplace</h1>
            <p className="text-gray-600 mt-1">Extend your store with powerful plugins</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowGitHubInstall(true)}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Install from GitHub
            </Button>
            <Button
              onClick={() => setShowPluginForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Plugin
            </Button>
          </div>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="installed" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Installed ({plugins.filter(plugin => plugin.isInstalled).length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            {/* Search and Filters */}
            <Card className="material-elevation-1 border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search plugins..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plugins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlugins.map((plugin) => {
                const CategoryIcon = categoryIcons[plugin.category] || Settings;
                const installed = isPluginInstalled(plugin);
                const enabled = isPluginEnabled(plugin);
                
                return (
                  <Card key={plugin.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 ${
                            plugin.source === 'marketplace' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                              : plugin.sourceType === 'github'
                              ? 'bg-gradient-to-r from-gray-700 to-gray-900'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          } rounded-lg flex items-center justify-center`}>
                            <CategoryIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{plugin.name}</CardTitle>
                              {plugin.source === 'marketplace' && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  Marketplace
                                </Badge>
                              )}
                              {plugin.sourceType === 'github' && (
                                <Badge className="bg-gray-100 text-gray-700 text-xs">
                                  GitHub
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">by {plugin.creator_name}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-100 text-blue-700">
                            v{plugin.version}
                          </Badge>
                          {enabled && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {plugin.description}
                      </p>
                      
                      {plugin.availableMethods && plugin.availableMethods.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Available Methods:</p>
                          <div className="flex flex-wrap gap-1">
                            {plugin.availableMethods.map(method => (
                              <Badge key={method} className="bg-gray-100 text-gray-600 text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {plugin.rating > 0 && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">
                                {plugin.rating.toFixed(1)} ({plugin.reviews_count})
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-600">
                            {plugin.downloads} downloads
                          </span>
                        </div>
                        <Badge className={`${plugin.category === 'analytics' ? 'bg-green-100 text-green-700' : 
                                          plugin.category === 'shipping' ? 'bg-blue-100 text-blue-700' :
                                          plugin.category === 'payment' ? 'bg-purple-100 text-purple-700' :
                                          'bg-gray-100 text-gray-700'}`}>
                          {plugin.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-gray-900">
                          {plugin.price === 0 ? 'Free' : `$${plugin.price}`}
                        </div>
                        <div className="flex items-center gap-2">
                          {installed ? (
                            <div className="flex gap-1">
                              <Badge className={enabled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                {enabled ? "Installed & Active" : "Installed"}
                              </Badge>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleInstallPlugin(plugin)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                              size="sm"
                            >
                              Install
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredPlugins.length === 0 && (
              <Card className="material-elevation-1 border-0">
                <CardContent className="text-center py-12">
                  <Puzzle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || categoryFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No plugins available in the marketplace yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Installed Tab */}
          <TabsContent value="installed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.filter(plugin => plugin.isInstalled).map((plugin) => {
                const CategoryIcon = categoryIcons[plugin.category] || Settings;
                
                return (
                  <Card key={plugin.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <CategoryIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <p className="text-sm text-gray-500">by {plugin.creator_name}</p>
                          </div>
                        </div>
                        <Badge className={plugin.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {plugin.isEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {plugin.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button
                          onClick={() => handleUninstallPlugin(plugin.slug)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Uninstall
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {plugins.filter(plugin => plugin.isInstalled).length === 0 && (
              <Card className="material-elevation-1 border-0">
                <CardContent className="text-center py-12">
                  <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins installed</h3>
                  <p className="text-gray-600 mb-6">
                    Browse the marketplace to find and install plugins for your store
                  </p>
                  <Button
                    onClick={() => document.querySelector('[value="marketplace"]').click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                  >
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="material-elevation-1 border-0">
              <CardContent className="text-center py-16">
                <BarChart3 className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Plugin Analytics & Reports</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get detailed insights into your plugin performance, usage statistics, and optimization recommendations.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">📊</div>
                      <div className="text-sm font-medium text-gray-700">Usage Analytics</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">⚡</div>
                      <div className="text-sm font-medium text-gray-700">Performance Metrics</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 mb-1">🎯</div>
                      <div className="text-sm font-medium text-gray-700">Optimization Tips</div>
                    </div>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm font-medium">
                  🚀 Coming Soon
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* GitHub Installation Dialog */}
        <Dialog open={showGitHubInstall} onOpenChange={setShowGitHubInstall}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Install Plugin from GitHub</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  GitHub Repository URL
                </label>
                <Input
                  placeholder="https://github.com/user/plugin-name"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={installing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The repository must contain a plugin.json manifest file
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGitHubInstall(false)}
                  disabled={installing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInstallFromGitHub}
                  disabled={installing || !githubUrl.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {installing ? "Installing..." : "Install"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Plugin Form Dialog */}
        <Dialog open={showPluginForm} onOpenChange={setShowPluginForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Plugin</DialogTitle>
            </DialogHeader>
            <PluginForm
              onSubmit={handleCreatePlugin}
              onCancel={() => setShowPluginForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
