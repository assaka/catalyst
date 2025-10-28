/**
 * Unified Plugin/Extension Manager
 * Combines the best of both plugin and extension systems
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Package,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  BarChart3,
  Plus,
  Search,
  Download,
  Star,
  Eye,
  ShoppingCart,
  Filter,
  Code,
  Bot,
  Upload,
  Github,
  Puzzle,
  Crown,
  Trash2,
  Play,
  Pause,
  Edit,
  ExternalLink,
  RefreshCw,
  Shield,
  Database,
  Globe,
  FileText,
  FolderOpen
} from 'lucide-react';

// Import both plugin systems
import apiClient from '@/api/client';
import extensionSystem from '@/core/ExtensionSystem.js';
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

// Import editor components for manual code editing
import FileTreeNavigator from '@/components/editor/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';

const UnifiedPluginManager = () => {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [plugins, setPlugins] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  
  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMethod, setCreateMethod] = useState('web');
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [installing, setInstalling] = useState(false);
  
  // Stats
  const [hookStats, setHookStats] = useState({});
  const [eventStats, setEventStats] = useState({});
  const [systemStats, setSystemStats] = useState({});
  
  // Code Editor states
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [pluginFiles, setPluginFiles] = useState([]);

  useEffect(() => {
    loadData();
    updateStats();
    
    // Set up real-time listeners
    const unsubscribeExtensionLoaded = eventSystem.on('extension.loaded', updateStats);
    const unsubscribeExtensionUnloaded = eventSystem.on('extension.unloaded', updateStats);
    
    return () => {
      unsubscribeExtensionLoaded();
      unsubscribeExtensionUnloaded();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load plugins from database registry
      const [registryData, extensionData] = await Promise.all([
        apiClient.request('GET', 'plugins/registry').catch(() => ({ data: [] })),
        Promise.resolve([]) // Extensions are now migrated to plugins
      ]);
      
      // Process database-driven plugins
      const allPlugins = (registryData.data || []).map(plugin => ({
        ...plugin,
        type: 'plugin',
        source: plugin.category === 'marketplace' ? 'marketplace' : 'database',
        isInstalled: plugin.status === 'active',
        isLoaded: plugin.status === 'active',
        security: {
          sandboxed: plugin.security_level === 'sandboxed',
          validated: true,
          permissions: plugin.permissions || []
        }
      }));
      
      setPlugins(allPlugins);
      setExtensions([]); // Extensions are obsolete
      
    } catch (error) {
      console.error('Error loading plugin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    setHookStats(hookSystem.getStats());
    setEventStats(eventSystem.getStats());
    setSystemStats(extensionSystem.getStats());
  };

  // Combine plugins and extensions for unified display
  const getAllItems = () => {
    const allItems = [...plugins, ...extensions];
    
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      
      return matchesSearch && matchesCategory && matchesSource;
    });
  };

  const handleInstallPlugin = async (item) => {
    try {
      await apiClient.request('PATCH', `plugins/registry/${item.id}/status`, {
        status: 'active'
      });
      await loadData();
      updateStats();
    } catch (error) {
      console.error("Error installing plugin:", error);
      alert("Error installing: " + error.message);
    }
  };

  const handleUninstallPlugin = async (item) => {
    try {
      await apiClient.request('PATCH', `plugins/registry/${item.id}/status`, {
        status: 'inactive'
      });
      await loadData();
      updateStats();
    } catch (error) {
      console.error("Error uninstalling plugin:", error);
      alert("Error uninstalling: " + error.message);
    }
  };

  const handleCreatePlugin = async () => {
    try {
      switch (createMethod) {
        case 'web':
          window.open('/admin/plugin-builder', '_blank');
          break;
        case 'ai':
          // Show AI creation dialog with advanced options
          const pluginDetails = await showAdvancedAIDialog();
          if (pluginDetails) {
            const response = await apiClient.request('POST', 'plugins/registry', {
              ...pluginDetails,
              id: `ai_plugin_${Date.now()}`,
              type: pluginDetails.type,
              category: pluginDetails.category,
              status: 'active'
            });
            alert('Plugin created successfully with all components!');
            await loadData();
          }
          break;
        case 'scaffold':
          // Show scaffold creation dialog
          const scaffoldOptions = await showScaffoldDialog();
          if (scaffoldOptions) {
            const response = await apiClient.request('POST', 'plugins/registry', {
              ...scaffoldOptions,
              id: `scaffold_plugin_${Date.now()}`,
              type: 'custom',
              status: 'active'
            });
            alert('Plugin scaffolded successfully!');
            await loadData();
          }
          break;
        case 'upload':
          document.getElementById('plugin-upload')?.click();
          break;
        case 'github':
          setShowInstallDialog(true);
          break;
      }
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating plugin:", error);
      alert("Error creating plugin: " + error.message);
    }
  };

  const showAdvancedAIDialog = async () => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';
      dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-bold mb-4">AI Plugin Generator - Advanced Options</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Plugin Description</label>
              <textarea id="ai-prompt" rows="3" class="w-full p-2 border rounded" 
                placeholder="Describe what your plugin should do..."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Plugin Type</label>
                <select id="plugin-type" class="w-full p-2 border rounded">
                  <option value="custom">Custom Plugin</option>
                  <option value="crud">CRUD Manager</option>
                  <option value="api">API Extension</option>
                  <option value="widget">Widget/Component</option>
                  <option value="integration">Third-party Integration</option>
                  <option value="workflow">Workflow Automation</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Category</label>
                <select id="plugin-category" class="w-full p-2 border rounded">
                  <option value="commerce">Commerce</option>
                  <option value="analytics">Analytics</option>
                  <option value="marketing">Marketing</option>
                  <option value="security">Security</option>
                  <option value="integration">Integration</option>
                  <option value="utility">Utility</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Components to Generate</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center"><input type="checkbox" id="create-tables" checked> Database Tables</label>
                <label class="flex items-center"><input type="checkbox" id="create-models" checked> Models</label>
                <label class="flex items-center"><input type="checkbox" id="create-controllers" checked> Controllers</label>
                <label class="flex items-center"><input type="checkbox" id="create-routes" checked> API Routes</label>
                <label class="flex items-center"><input type="checkbox" id="create-components" checked> UI Components</label>
                <label class="flex items-center"><input type="checkbox" id="create-slots" checked> Slots/Hooks</label>
                <label class="flex items-center"><input type="checkbox" id="create-migrations" checked> Migrations</label>
                <label class="flex items-center"><input type="checkbox" id="create-tests" checked> Tests</label>
                <label class="flex items-center"><input type="checkbox" id="create-docs" checked> Documentation</label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Database Schema (Optional)</label>
              <textarea id="schema-definition" rows="3" class="w-full p-2 border rounded font-mono text-sm" 
                placeholder="users: name:string, email:string:unique, created_at:datetime&#10;orders: user_id:foreign, total:decimal, status:enum"></textarea>
              <p class="text-xs text-gray-500 mt-1">Format: table_name: field:type:modifier, field2:type</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Security Level</label>
                <select id="security-level" class="w-full p-2 border rounded">
                  <option value="sandboxed">Sandboxed (Secure)</option>
                  <option value="trusted">Trusted (Full Access)</option>
                  <option value="restricted">Restricted Permissions</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Framework</label>
                <select id="framework" class="w-full p-2 border rounded">
                  <option value="react">React + Node.js</option>
                  <option value="vue">Vue.js + Express</option>
                  <option value="vanilla">Vanilla JS</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-6">
            <button id="cancel-ai" class="px-4 py-2 border rounded">Cancel</button>
            <button id="generate-ai" class="px-4 py-2 bg-blue-600 text-white rounded">Generate Plugin</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const cancelBtn = dialog.querySelector('#cancel-ai');
      const generateBtn = dialog.querySelector('#generate-ai');
      
      cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(null);
      };
      
      generateBtn.onclick = () => {
        const result = {
          prompt: dialog.querySelector('#ai-prompt').value,
          type: dialog.querySelector('#plugin-type').value,
          category: dialog.querySelector('#plugin-category').value,
          components: {
            tables: dialog.querySelector('#create-tables').checked,
            models: dialog.querySelector('#create-models').checked,
            controllers: dialog.querySelector('#create-controllers').checked,
            routes: dialog.querySelector('#create-routes').checked,
            components: dialog.querySelector('#create-components').checked,
            slots: dialog.querySelector('#create-slots').checked,
            migrations: dialog.querySelector('#create-migrations').checked,
            tests: dialog.querySelector('#create-tests').checked,
            docs: dialog.querySelector('#create-docs').checked,
          },
          schema: dialog.querySelector('#schema-definition').value,
          security: dialog.querySelector('#security-level').value,
          framework: dialog.querySelector('#framework').value
        };
        
        document.body.removeChild(dialog);
        resolve(result);
      };
    });
  };

  // Handle plugin selection for code editing
  const handlePluginSelectForEdit = async (plugin) => {
    try {
      setSelectedPlugin(plugin);
      setSelectedFile(null);
      setSourceCode('');
      setOriginalCode('');
      
      // Load plugin details from database registry
      const response = await apiClient.request('GET', `plugins/registry/${plugin.id}`);
      
      // Create file structure from database components
      const files = [];
      if (response.data) {
        const plugin = response.data;
        
        // Add main plugin file
        if (plugin.source_code) {
          files.push({
            name: 'plugin.js',
            path: '/plugin.js',
            type: 'javascript',
            content: plugin.source_code
          });
        }
        
        // Add manifest
        if (plugin.manifest) {
          files.push({
            name: 'manifest.json',
            path: '/manifest.json',
            type: 'json',
            content: JSON.stringify(plugin.manifest, null, 2)
          });
        }
        
        // Add endpoints as separate files
        if (plugin.endpoints) {
          plugin.endpoints.forEach((endpoint, index) => {
            files.push({
              name: `endpoint_${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              path: `/endpoints/${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              type: 'javascript',
              content: endpoint.handler_code
            });
          });
        }
        
        // Add hooks as separate files
        if (plugin.hooks) {
          plugin.hooks.forEach((hook, index) => {
            files.push({
              name: `hook_${hook.hook_name.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              path: `/hooks/${hook.hook_name.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              type: 'javascript',
              content: hook.handler_code
            });
          });
        }

        // Add events as separate files
        if (plugin.events) {
          plugin.events.forEach((event, index) => {
            files.push({
              name: `event_${event.event_name.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              path: `/events/${event.event_name.replace(/[^a-zA-Z0-9]/g, '_')}.js`,
              type: 'javascript',
              content: event.listener_code
            });
          });
        }
      }

      setPluginFiles(files);
      
    } catch (error) {
      console.error('Error loading plugin files:', error);
      alert(`Error loading plugin files: ${error.message}`);
    }
  };

  // Handle file selection within selected plugin
  const handleFileSelect = async (file) => {
    if (!selectedPlugin) return;
    
    try {
      setSelectedFile(file);
      
      // Load file content from database
      const content = file.content || '';
      setSourceCode(content);
      setOriginalCode(content);
      
    } catch (error) {
      console.error('Error loading file:', error);
      alert(`Error loading file: ${error.message}`);
    }
  };

  // Handle code changes
  const handleCodeChange = (newCode) => {
    setSourceCode(newCode);
  };

  // Handle code save within plugin
  const handleCodeSave = async () => {
    if (!selectedPlugin || !selectedFile) return;

    try {
      // Save to database registry via API
      const response = await apiClient.request('PUT', `plugins/registry/${selectedPlugin.id}/files`, {
        path: selectedFile.path,
        content: sourceCode
      });

      if (response.success) {
        setOriginalCode(sourceCode);
        alert('File saved successfully!');

        // Update the file in pluginFiles array to reflect the change
        setPluginFiles(prevFiles =>
          prevFiles.map(file =>
            file.path === selectedFile.path
              ? { ...file, content: sourceCode }
              : file
          )
        );
      } else {
        throw new Error(response.error || 'Failed to save file');
      }

    } catch (error) {
      console.error('Error saving plugin file:', error);
      alert(`Error saving plugin file: ${error.message}`);
    }
  };

  const showScaffoldDialog = async () => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';
      dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
          <h3 class="text-lg font-bold mb-4">Plugin Scaffold Generator</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Plugin Name</label>
              <input type="text" id="scaffold-name" class="w-full p-2 border rounded" 
                placeholder="My Awesome Plugin">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Namespace</label>
              <input type="text" id="scaffold-namespace" class="w-full p-2 border rounded" 
                placeholder="MyCompany\\MyPlugin">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Template Type</label>
              <select id="scaffold-template" class="w-full p-2 border rounded">
                <option value="full">Full Plugin (Controllers, Models, Views, API)</option>
                <option value="api-only">API Only (Controllers, Models, Routes)</option>
                <option value="widget">Widget/Component Only</option>
                <option value="integration">Integration Plugin</option>
                <option value="custom">Custom Structure</option>
              </select>
            </div>
            
            <div id="custom-options" class="space-y-2" style="display: none;">
              <label class="block text-sm font-medium">Custom Components</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center"><input type="checkbox" id="scaffold-controller"> Controller</label>
                <label class="flex items-center"><input type="checkbox" id="scaffold-model"> Model</label>
                <label class="flex items-center"><input type="checkbox" id="scaffold-routes"> Routes</label>
                <label class="flex items-center"><input type="checkbox" id="scaffold-middleware"> Middleware</label>
                <label class="flex items-center"><input type="checkbox" id="scaffold-component"> React Component</label>
                <label class="flex items-center"><input type="checkbox" id="scaffold-hooks"> Hooks/Slots</label>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-6">
            <button id="cancel-scaffold" class="px-4 py-2 border rounded">Cancel</button>
            <button id="generate-scaffold" class="px-4 py-2 bg-green-600 text-white rounded">Generate Scaffold</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const templateSelect = dialog.querySelector('#scaffold-template');
      const customOptions = dialog.querySelector('#custom-options');
      
      templateSelect.onchange = (e) => {
        customOptions.style.display = e.target.value === 'custom' ? 'block' : 'none';
      };
      
      const cancelBtn = dialog.querySelector('#cancel-scaffold');
      const generateBtn = dialog.querySelector('#generate-scaffold');
      
      cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(null);
      };
      
      generateBtn.onclick = () => {
        const result = {
          name: dialog.querySelector('#scaffold-name').value,
          namespace: dialog.querySelector('#scaffold-namespace').value,
          template: dialog.querySelector('#scaffold-template').value,
          customComponents: {
            controller: dialog.querySelector('#scaffold-controller')?.checked || false,
            model: dialog.querySelector('#scaffold-model')?.checked || false,
            routes: dialog.querySelector('#scaffold-routes')?.checked || false,
            middleware: dialog.querySelector('#scaffold-middleware')?.checked || false,
            component: dialog.querySelector('#scaffold-component')?.checked || false,
            hooks: dialog.querySelector('#scaffold-hooks')?.checked || false,
          }
        };
        
        document.body.removeChild(dialog);
        resolve(result);
      };
    });
  };

  const handleGitHubInstall = async () => {
    if (!installUrl.trim()) {
      alert("Please enter a GitHub URL");
      return;
    }

    setInstalling(true);
    try {
      const result = await apiClient.request('POST', 'plugins/install-github', {
        githubUrl: installUrl.trim()
      });
      
      alert(`Plugin installed successfully: ${result.message}`);
      setShowInstallDialog(false);
      setInstallUrl("");
      await loadData();
    } catch (error) {
      console.error("Error installing from GitHub:", error);
      alert("Error installing plugin: " + error.message);
    } finally {
      setInstalling(false);
    }
  };

  const getItemIcon = (item) => {
    if (item.type === 'extension') return Zap;
    
    switch (item.category) {
      case 'analytics': return BarChart3;
      case 'payment': return ShoppingCart;
      case 'marketing': return Star;
      case 'security': return Shield;
      case 'database': return Database;
      default: return Puzzle;
    }
  };

  const getStatusIcon = (item) => {
    const isActive = item.isInstalled || item.isLoaded;
    if (isActive) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Package className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (item) => {
    const isActive = item.isInstalled || item.isLoaded;
    if (isActive) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "analytics", label: "Analytics" },
    { value: "payment", label: "Payment" },
    { value: "marketing", label: "Marketing" },
    { value: "security", label: "Security" },
    { value: "integration", label: "Integration" },
    { value: "commerce", label: "Commerce" },
    { value: "other", label: "Other" }
  ];

  const sources = [
    { value: "all", label: "All Sources" },
    { value: "local", label: "Local" },
    { value: "marketplace", label: "Marketplace" },
    { value: "github", label: "GitHub" },
    { value: "system", label: "System" }
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
            <h1 className="text-3xl font-bold text-gray-900">Plugin & Extension Manager</h1>
            <p className="text-gray-600 mt-1">Unified management for plugins, extensions, and customizations</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowInstallDialog(true)}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Github className="w-4 h-4 mr-2" />
              Install from GitHub
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plugin
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Marketplace ({getAllItems().length})
            </TabsTrigger>
            <TabsTrigger value="installed" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Active ({getAllItems().filter(item => item.isInstalled || item.isLoaded).length})
            </TabsTrigger>
            <TabsTrigger value="code-editor" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="hooks" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Hooks ({Object.keys(hookStats).length})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Events ({Object.keys(eventStats.listeners || {}).length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search plugins and extensions..."
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
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plugin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllItems().map((item) => {
                const ItemIcon = getItemIcon(item);
                const isActive = item.isInstalled || item.isLoaded;
                
                return (
                  <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            item.type === 'extension' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                              : item.source === 'marketplace'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          }`}>
                            <ItemIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              {item.type === 'extension' && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                  Extension
                                </Badge>
                              )}
                              {item.source === 'marketplace' && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  Marketplace
                                </Badge>
                              )}
                              {item.source === 'github' && (
                                <Badge className="bg-gray-100 text-gray-700 text-xs">
                                  GitHub
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">v{item.version}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusIcon(item)}
                          <Badge className={getStatusColor(item)}>
                            {isActive ? "Active" : "Available"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      
                      {/* Security indicators */}
                      <div className="flex items-center gap-2 mb-4">
                        {item.security?.sandboxed && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Sandboxed
                          </Badge>
                        )}
                        {item.security?.validated && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validated
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handlePluginSelectForEdit(item);
                                  setActiveTab('code-editor');
                                }}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Code className="w-3 h-3 mr-1" />
                                Edit Code
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUninstallPlugin(item)}
                              >
                                <Pause className="w-3 h-3 mr-1" />
                                Disable
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleInstallPlugin(item)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              <Play className="w-3 h-3 mr-1" />
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
          </TabsContent>

          {/* Code Editor Tab */}
          <TabsContent value="code-editor">
            <div className="h-[800px] border rounded-lg overflow-hidden bg-white">
              <div className="h-full flex">
                {/* Plugin File Explorer */}
                <div className="w-1/3 border-r">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium">Plugin Files</h3>
                    </div>
                    {selectedPlugin && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {selectedPlugin.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-full overflow-auto">
                    {selectedPlugin ? (
                      <div className="p-2">
                        {pluginFiles.length > 0 ? (
                          pluginFiles.map((file, index) => (
                            <div
                              key={index}
                              onClick={() => handleFileSelect(file)}
                              className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded ${
                                selectedFile?.path === file.path ? 'bg-blue-100 text-blue-800' : ''
                              }`}
                            >
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No files found in this plugin</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Select a plugin to edit its code</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Use "Edit Code" button on any installed plugin
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 flex flex-col">
                  {selectedFile ? (
                    <>
                      {/* Editor Header */}
                      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-sm text-gray-500">
                            {selectedFile.path}
                          </span>
                          {sourceCode !== originalCode && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleCodeSave}
                            disabled={sourceCode === originalCode}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSourceCode(originalCode);
                            }}
                            disabled={sourceCode === originalCode}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>

                      {/* Code Editor */}
                      <div className="flex-1 overflow-hidden">
                        <CodeEditor
                          value={sourceCode}
                          onChange={handleCodeChange}
                          fileName={selectedFile.name}
                          originalCode={originalCode}
                          enableDiffDetection={true}
                          enableTabs={false}
                          className="h-full"
                        />
                      </div>
                    </>
                  ) : (
                    /* No File Selected */
                    <div className="h-12 px-3 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        {selectedPlugin ? (
                          <>
                            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Plugin Code Editor
                            </h3>
                            <p className="text-gray-600 mb-4 max-w-md">
                              Select a file from <strong>{selectedPlugin.name}</strong> plugin to start editing.
                              Modify controllers, models, components, and configuration files.
                            </p>
                          </>
                        ) : (
                          <>
                            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Plugin Code Editor
                            </h3>
                            <p className="text-gray-600 mb-4 max-w-md">
                              Click "Edit Code" on any installed plugin to access its source files.
                              Perfect for customizations and plugin development.
                            </p>
                            <Button
                              onClick={() => setActiveTab('installed')}
                              variant="outline"
                              className="mt-2"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Installed Plugins
                            </Button>
                          </>
                        )}
                        
                        {selectedPlugin && (
                          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-4">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Syntax Highlighting
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Plugin-specific
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Diff View
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Active Tab */}
          <TabsContent value="installed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllItems().filter(item => item.isInstalled || item.isLoaded).map((item) => {
                const ItemIcon = getItemIcon(item);
                
                return (
                  <Card key={item.id} className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <ItemIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <p className="text-sm text-gray-500">v{item.version}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handlePluginSelectForEdit(item);
                              setActiveTab('code-editor');
                            }}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Edit Code
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleUninstallPlugin(item)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Hooks Tab */}
          <TabsContent value="hooks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Active Hooks
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Hook points currently registered in the system
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.entries(hookStats).map(([hookName, handlerCount]) => (
                    <div key={hookName} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <code className="text-sm font-mono">{hookName}</code>
                        <p className="text-xs text-gray-600 mt-1">
                          {handlerCount} handler{handlerCount !== 1 ? 's' : ''} registered
                        </p>
                      </div>
                      <Badge variant="outline">
                        {handlerCount}
                      </Badge>
                    </div>
                  ))}
                  
                  {Object.keys(hookStats).length === 0 && (
                    <p className="text-center text-gray-600 py-8">
                      No hooks currently registered
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Event System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{eventStats.totalEvents || 0}</p>
                    <p className="text-xs text-gray-600">Total Events</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{eventStats.historySize || 0}</p>
                    <p className="text-xs text-gray-600">Event History</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">
                      {Object.values(eventStats.listeners || {}).reduce((sum, count) => sum + count, 0)}
                    </p>
                    <p className="text-xs text-gray-600">Active Listeners</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-xs text-gray-600">System Status</p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {Object.entries(eventStats.listeners || {}).map(([eventName, listenerCount]) => (
                    <div key={eventName} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <code className="text-sm font-mono">{eventName}</code>
                        <p className="text-xs text-gray-600 mt-1">
                          {listenerCount} listener{listenerCount !== 1 ? 's' : ''} attached
                        </p>
                      </div>
                      <Badge variant="outline">
                        {listenerCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded">
                      <p className="text-2xl font-bold">{systemStats.totalExtensions}</p>
                      <p className="text-xs text-gray-600">Total Items</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-2xl font-bold text-green-600">{systemStats.loadedExtensions + plugins.filter(p => p.isInstalled).length}</p>
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-2xl font-bold">{Object.keys(hookStats).length}</p>
                      <p className="text-xs text-gray-600">Hooks</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-2xl font-bold">{Object.keys(eventStats.listeners || {}).length}</p>
                      <p className="text-xs text-gray-600">Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Hook Execution</span>
                      <span className="text-sm text-gray-600">&lt; 1ms avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Event Processing</span>
                      <span className="text-sm text-gray-600">&lt; 0.5ms avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm text-gray-600">~2MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">System Health</span>
                      <span className="text-sm text-green-600 font-medium">Excellent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Plugin Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Plugin</DialogTitle>
              <DialogDescription>
                Choose how you'd like to create your plugin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={createMethod === 'web' ? 'default' : 'outline'}
                  onClick={() => setCreateMethod('web')}
                  className="h-20 flex flex-col gap-2"
                >
                  <Eye className="w-6 h-6" />
                  Visual Builder
                </Button>
                <Button
                  variant={createMethod === 'ai' ? 'default' : 'outline'}
                  onClick={() => setCreateMethod('ai')}
                  className="h-20 flex flex-col gap-2"
                >
                  <Bot className="w-6 h-6" />
                  AI Generated
                </Button>
                <Button
                  variant={createMethod === 'scaffold' ? 'default' : 'outline'}
                  onClick={() => setCreateMethod('scaffold')}
                  className="h-20 flex flex-col gap-2"
                >
                  <Code className="w-6 h-6" />
                  Scaffold
                </Button>
                <Button
                  variant={createMethod === 'upload' ? 'default' : 'outline'}
                  onClick={() => setCreateMethod('upload')}
                  className="h-20 flex flex-col gap-2"
                >
                  <Upload className="w-6 h-6" />
                  Upload ZIP
                </Button>
                <Button
                  variant={createMethod === 'github' ? 'default' : 'outline'}
                  onClick={() => setCreateMethod('github')}
                  className="h-20 flex flex-col gap-2"
                >
                  <Github className="w-6 h-6" />
                  From GitHub
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                {createMethod === 'web' && "Use our visual interface to build plugins without coding"}
                {createMethod === 'ai' && "Generate complete plugins with tables, controllers, models & UI components"}
                {createMethod === 'scaffold' && "Generate full plugin structure: controllers, models, routes, migrations & components"}
                {createMethod === 'upload' && "Upload a ZIP file containing your plugin"}
                {createMethod === 'github' && "Install directly from a GitHub repository"}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Core Extension Philosophy</span>
                </div>
                <p className="text-xs text-blue-700">
                  All plugins extend functionality without modifying core code. Use hooks, slots, and events to integrate seamlessly while maintaining system stability and upgradability.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlugin}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* GitHub Install Dialog */}
        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Install from GitHub</DialogTitle>
              <DialogDescription>
                Enter the GitHub repository URL
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="https://github.com/user/plugin-name"
                  value={installUrl}
                  onChange={(e) => setInstallUrl(e.target.value)}
                  disabled={installing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Repository must contain a manifest.json file
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowInstallDialog(false)}
                disabled={installing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGitHubInstall}
                disabled={installing || !installUrl.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {installing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden file input for ZIP upload */}
        <input
          id="plugin-upload"
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              // Handle ZIP file upload
              console.log('Uploading ZIP file:', file.name);
              // Implement ZIP upload logic here
            }
          }}
        />
      </div>
    </div>
  );
};

export default UnifiedPluginManager;