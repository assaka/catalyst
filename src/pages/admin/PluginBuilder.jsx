import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code,
  Upload,
  Brain,
  FileCode,
  Play,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Download,
  Eye,
  Settings,
  X,
  Book,
  Layout,
  Wand2,
  Database,
  Webhook,
  Palette,
  Layers,
  Globe,
  Smartphone,
  Monitor,
  ShoppingCart,
  Package,
  Users,
  Mail,
  BarChart3,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import SaveButton from '@/components/ui/save-button';
import apiClient from '@/api/client';
import Editor from '@monaco-editor/react';

const PluginBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdPlugins, setCreatedPlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [configProperties, setConfigProperties] = useState([]);
  const [selectedHooks, setSelectedHooks] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Plugin data state
  const [pluginData, setPluginData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: 'display',
    hooks: [],
    code: '',
    configSchema: {}
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  
  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Available hooks
  const availableHooks = [
    { id: 'homepage_header', name: 'Homepage Header', description: 'Content at the top of homepage' },
    { id: 'homepage_content', name: 'Homepage Content', description: 'Main content area of homepage' },
    { id: 'product_detail_above', name: 'Product Detail Above', description: 'Above product details' },
    { id: 'cart_summary', name: 'Cart Summary', description: 'Cart summary section' },
    { id: 'checkout_form', name: 'Checkout Form', description: 'Checkout form area' },
    { id: 'footer_content', name: 'Footer Content', description: 'Footer content area' }
  ];
  
  // Load created plugins from localStorage on mount
  useEffect(() => {
    const savedPlugins = localStorage.getItem('created_plugins');
    if (savedPlugins) {
      setCreatedPlugins(JSON.parse(savedPlugins));
    }
  }, []);
  
  // Templates with complete working code
  const templates = [
    {
      id: 'banner',
      name: 'Banner Plugin',
      description: 'Display custom banners on your store',
      category: 'display',
      hooks: ['homepage_header'],
      configProperties: [
        { key: 'message', type: 'string', default: 'Welcome to our store!', description: 'Banner message' },
        { key: 'backgroundColor', type: 'string', default: '#3b82f6', description: 'Background color' },
        { key: 'textColor', type: 'string', default: '#ffffff', description: 'Text color' }
      ],
      code: `// Banner Plugin - Displays custom banners on your store
class BannerPlugin {
  constructor() {
    this.name = 'Banner Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    const message = config.message || 'Welcome to our store!';
    const bgColor = config.backgroundColor || '#3b82f6';
    const textColor = config.textColor || '#ffffff';
    
    return \`
      <div class="plugin-banner" style="
        background: \${bgColor};
        color: \${textColor};
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin: 10px 0;
      ">
        <h2 style="margin: 0; font-size: 24px;">\${message}</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">\${context.store.name}</p>
      </div>
    \`;
  }
}

module.exports = BannerPlugin;`
    },
    {
      id: 'popup',
      name: 'Popup Plugin',
      description: 'Show popups with announcements',
      category: 'marketing',
      hooks: ['homepage_header', 'product_detail_above'],
      configProperties: [
        { key: 'title', type: 'string', default: 'Special Offer!', description: 'Popup title' },
        { key: 'content', type: 'string', default: 'Get 20% off today!', description: 'Popup content' },
        { key: 'delay', type: 'number', default: 3000, description: 'Delay before showing (ms)' },
        { key: 'buttonText', type: 'string', default: 'Shop Now', description: 'Button text' }
      ],
      code: `// Popup Plugin - Shows timed popups with announcements
class PopupPlugin {
  constructor() {
    this.name = 'Popup Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    const delay = config.delay || 3000;
    const title = config.title || 'Special Offer!';
    const content = config.content || 'Check out our latest deals!';
    const buttonText = config.buttonText || 'Shop Now';
    
    return \`
      <div id="plugin-popup-container"></div>
      <script>
        setTimeout(function() {
          const popup = document.createElement('div');
          popup.className = 'plugin-popup';
          popup.style.cssText = \\\`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
          \\\`;
          
          popup.innerHTML = \\\`
            <button onclick="this.parentElement.remove()" style="
              position: absolute;
              top: 10px;
              right: 10px;
              background: none;
              border: none;
              font-size: 20px;
              cursor: pointer;
            ">×</button>
            <h3 style="margin: 0 0 10px 0;">\${title}</h3>
            <p style="margin: 0 0 20px 0;">\${content}</p>
            <button style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            ">\${buttonText}</button>
          \\\`;
          
          document.getElementById('plugin-popup-container').appendChild(popup);
        }, \${delay});
      </script>
    \`;
  }
  
  renderProductDetailAbove(config, context) {
    // Different implementation for product pages
    return this.renderHomepageHeader(config, context);
  }
}

module.exports = PopupPlugin;`
    },
    {
      id: 'social',
      name: 'Social Media Links',
      description: 'Add social media links to your store',
      category: 'marketing',
      hooks: ['footer_content'],
      configProperties: [
        { key: 'facebook', type: 'string', default: '', description: 'Facebook URL' },
        { key: 'twitter', type: 'string', default: '', description: 'Twitter URL' },
        { key: 'instagram', type: 'string', default: '', description: 'Instagram URL' },
        { key: 'linkedin', type: 'string', default: '', description: 'LinkedIn URL' }
      ],
      code: `// Social Media Links Plugin
class SocialMediaPlugin {
  constructor() {
    this.name = 'Social Media Links';
    this.version = '1.0.0';
  }
  
  renderFooterContent(config, context) {
    const links = [];
    if (config.facebook) links.push({name: 'Facebook', url: config.facebook, icon: 'f'});
    if (config.twitter) links.push({name: 'Twitter', url: config.twitter, icon: 't'});
    if (config.instagram) links.push({name: 'Instagram', url: config.instagram, icon: 'i'});
    if (config.linkedin) links.push({name: 'LinkedIn', url: config.linkedin, icon: 'in'});
    
    if (links.length === 0) return '';
    
    return \`
      <div class="plugin-social-links" style="
        padding: 20px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      ">
        <h4 style="margin: 0 0 15px 0; color: #374151;">Follow Us</h4>
        <div style="display: flex; justify-content: center; gap: 15px;">
          \${links.map(link => \`
            <a href="\${link.url}" target="_blank" rel="noopener" style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: #3b82f6;
              color: white;
              border-radius: 50%;
              text-decoration: none;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              \${link.icon}
            </a>
          \`).join('')}
        </div>
      </div>
    \`;
  }
}

module.exports = SocialMediaPlugin;`
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPluginData({
      ...pluginData,
      name: template.name,
      description: template.description,
      category: template.category,
      code: template.code,
      hooks: template.hooks || []
    });
    setSelectedHooks(template.hooks || []);
    setConfigProperties(template.configProperties || []);
  };
  
  const addConfigProperty = () => {
    setConfigProperties([...configProperties, {
      key: '',
      type: 'string',
      default: '',
      description: ''
    }]);
  };
  
  const updateConfigProperty = (index, field, value) => {
    const updated = [...configProperties];
    updated[index][field] = value;
    setConfigProperties(updated);
  };
  
  const removeConfigProperty = (index) => {
    setConfigProperties(configProperties.filter((_, i) => i !== index));
  };
  
  const toggleFolder = (pluginId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [pluginId]: !prev[pluginId]
    }));
  };
  
  const viewPluginFile = (plugin, fileName) => {
    let content = '';
    if (fileName === 'manifest.json') {
      content = JSON.stringify({
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        category: plugin.category,
        hooks: plugin.hooks || [],
        configSchema: plugin.configSchema || {}
      }, null, 2);
    } else if (fileName === 'index.js') {
      content = plugin.code;
    } else if (fileName === 'README.md') {
      content = `# ${plugin.name}\n\n${plugin.description}\n\n## Version\n${plugin.version}\n\n## Category\n${plugin.category}\n\n## Hooks\n${(plugin.hooks || []).join(', ')}`;
    }
    setPreviewContent(content);
    setShowPreview(true);
  };
  
  const downloadPlugin = (plugin) => {
    // Create a ZIP file with the plugin contents
    const zip = {
      'manifest.json': JSON.stringify({
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        category: plugin.category,
        hooks: plugin.hooks || [],
        configSchema: plugin.configSchema || {}
      }, null, 2),
      'index.js': plugin.code,
      'README.md': `# ${plugin.name}\n\n${plugin.description}`
    };
    
    // Create download (simplified version - in production use a proper ZIP library)
    const content = JSON.stringify(zip, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plugin.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${plugin.name} plugin files`);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      setUploadFile(file);
      toast.success('File selected: ' + file.name);
    } else {
      toast.error('Please select a valid ZIP file');
    }
  };

  const createPlugin = async (method) => {
    if (!pluginData.name) {
      toast.error('Please provide a plugin name');
      return;
    }

    setSaveSuccess(false);
    setLoading(true);
    
    try {
      let response;
      const storeId = localStorage.getItem('selected_store_id');
      
      if (!storeId) {
        toast.error('Please select a store first');
        setLoading(false);
        return;
      }
      
      // Build config schema from properties
      const configSchema = {
        type: 'object',
        properties: {},
        required: []
      };
      
      configProperties.forEach(prop => {
        if (prop.key) {
          configSchema.properties[prop.key] = {
            type: prop.type,
            default: prop.default,
            description: prop.description
          };
        }
      });
      
      const pluginPayload = {
        ...pluginData,
        hooks: selectedHooks,
        configSchema,
        method
      };
      
      if (method === 'visual' || method === 'code') {
        // Create plugin via web editor
        response = await apiClient.post(`/api/stores/${storeId}/plugins/create/web`, pluginPayload);
      } else if (method === 'upload' && uploadFile) {
        // Upload ZIP file
        const formData = new FormData();
        formData.append('plugin', uploadFile);
        formData.append('name', pluginData.name);
        formData.append('description', pluginData.description);
        response = await apiClient.post(`/api/stores/${storeId}/plugins/create/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (method === 'ai') {
        // Generate with AI
        response = await apiClient.post(`/api/stores/${storeId}/plugins/create/ai`, {
          prompt: aiPrompt,
          context: {
            storeName: localStorage.getItem('store_name') || 'Your Store'
          }
        });
        
        // The AI endpoint returns the created plugin data
        if (response?.data?.success && response.data.data?.plugin) {
          const aiPlugin = response.data.data.plugin;
          
          // Show the generated code to the user
          setPluginData({
            name: aiPlugin.name,
            description: aiPlugin.description || aiPrompt,
            version: aiPlugin.version,
            category: aiPlugin.category,
            code: '', // Code is already saved on backend
            hooks: [],
            configSchema: {}
          });
          
          // Show AI explanation
          if (response.data.data.aiResponse) {
            toast.success(response.data.data.aiResponse);
          }
        }
      }
      
      if (response?.data?.success) {
        // Save to localStorage
        const newPlugin = {
          id: Date.now().toString(),
          ...pluginPayload,
          createdAt: new Date().toISOString()
        };

        const updatedPlugins = [...createdPlugins, newPlugin];
        setCreatedPlugins(updatedPlugins);
        localStorage.setItem('created_plugins', JSON.stringify(updatedPlugins));

        toast.success(`Plugin "${pluginData.name}" created successfully!`);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);

        // Reset form
        setPluginData({
          name: '',
          description: '',
          version: '1.0.0',
          category: 'display',
          hooks: [],
          code: '',
          configSchema: {}
        });
        setSelectedHooks([]);
        setConfigProperties([]);
        setAiPrompt('');
        setUploadFile(null);
      } else {
        toast.error(response?.data?.error || 'Failed to create plugin');
      }
    } catch (error) {
      console.error('Create plugin error:', error);
      toast.error('Failed to create plugin: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const deletePlugin = (pluginId) => {
    const updated = createdPlugins.filter(p => p.id !== pluginId);
    setCreatedPlugins(updated);
    localStorage.setItem('created_plugins', JSON.stringify(updated));
    toast.success('Plugin deleted');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex">
        {/* File Explorer Sidebar */}
        <div className={`${showFileExplorer ? 'w-64 mr-6' : 'w-0'} transition-all duration-300 bg-white border border-gray-200 rounded-lg overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-700">Created Plugins</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileExplorer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-96">
          <div className="p-2">
            {createdPlugins.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center">No plugins created yet</p>
            ) : (
              createdPlugins.map(plugin => (
                <div key={plugin.id} className="mb-2">
                  <div
                    className="flex items-center space-x-1 p-1 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => toggleFolder(plugin.id)}
                  >
                    {expandedFolders[plugin.id] ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm flex-1">{plugin.name}</span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPlugin(plugin);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlugin(plugin.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {expandedFolders[plugin.id] && (
                    <div className="ml-4 mt-1">
                      <div
                        className="flex items-center space-x-1 p-1 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => viewPluginFile(plugin, 'manifest.json')}
                      >
                        <File className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">manifest.json</span>
                      </div>
                      <div
                        className="flex items-center space-x-1 p-1 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => viewPluginFile(plugin, 'index.js')}
                      >
                        <FileCode className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">index.js</span>
                      </div>
                      <div
                        className="flex items-center space-x-1 p-1 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => viewPluginFile(plugin, 'README.md')}
                      >
                        <File className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">README.md</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Code className="w-8 h-8 text-blue-600" />
                  Advanced Plugin Builder
                </h1>
                <p className="text-gray-600">
                  Create powerful plugins, customize templates, and extend your store with advanced features
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/editor/templates')}
                >
                  <Layout className="mr-2 h-4 w-4" />
                  Template Editor
                </Button>
                {!showFileExplorer && (
                  <Button
                    variant="outline"
                    onClick={() => setShowFileExplorer(true)}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Show Explorer
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/plugin-how-to')}
                >
                  <Book className="mr-2 h-4 w-4" />
                  Documentation
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Palette className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium">Visual Builder</h3>
                  <p className="text-xs text-gray-500">Drag & drop interface</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-medium">AI Assistant</h3>
                  <p className="text-xs text-gray-500">Generate with AI</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <h3 className="font-medium">Advanced</h3>
                  <p className="text-xs text-gray-500">Custom code & APIs</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" >
                <CardContent className="p-4 text-center">
                  <Layout className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium">Templates</h3>
                  <p className="text-xs text-gray-500">Page customization</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visual" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Visual Builder</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Code Editor</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload ZIP</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI Assistant</span>
          </TabsTrigger>
        </TabsList>

        {/* Visual Builder Tab */}
        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
              <CardDescription>
                Start with a pre-built template and customize it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id 
                        ? 'ring-2 ring-blue-500' 
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <Badge variant="secondary">{template.category}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plugin Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plugin Name</Label>
                        <Input
                          id="name"
                          value={pluginData.name}
                          onChange={(e) => setPluginData({ ...pluginData, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={pluginData.version}
                          onChange={(e) => setPluginData({ ...pluginData, version: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={3}
                        value={pluginData.description}
                        onChange={(e) => setPluginData({ ...pluginData, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={pluginData.category}
                        onValueChange={(value) => setPluginData({ ...pluginData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="display">Display</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plugin Hooks</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableHooks.map(hook => (
                        <label key={hook.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedHooks.includes(hook.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHooks([...selectedHooks, hook.id]);
                              } else {
                                setSelectedHooks(selectedHooks.filter(h => h !== hook.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{hook.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Configuration Properties</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addConfigProperty}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Property
                      </Button>
                    </div>
                    {configProperties.map((prop, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Property key"
                            value={prop.key}
                            onChange={(e) => updateConfigProperty(index, 'key', e.target.value)}
                          />
                          <Select
                            value={prop.type}
                            onValueChange={(value) => updateConfigProperty(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder="Default value"
                          value={prop.default}
                          onChange={(e) => updateConfigProperty(index, 'default', e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Description"
                            value={prop.description}
                            onChange={(e) => updateConfigProperty(index, 'description', e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeConfigProperty(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <SaveButton
                      onClick={() => createPlugin('visual')}
                      loading={loading}
                      success={saveSuccess}
                      disabled={!pluginData.name}
                      defaultText="Create Plugin"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Editor Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>
                Write your plugin code directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code-name">Plugin Name</Label>
                  <Input
                    id="code-name"
                    value={pluginData.name}
                    onChange={(e) => setPluginData({ ...pluginData, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code-version">Version</Label>
                  <Input
                    id="code-version"
                    value={pluginData.version}
                    onChange={(e) => setPluginData({ ...pluginData, version: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plugin-code">Plugin Code</Label>
                <Textarea
                  id="plugin-code"
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="// Write your plugin code here..."
                  value={pluginData.code}
                  onChange={(e) => setPluginData({ ...pluginData, code: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end">
                <SaveButton
                  onClick={() => createPlugin('code')}
                  loading={loading}
                  success={saveSuccess}
                  disabled={!pluginData.name || !pluginData.code}
                  defaultText="Create Plugin"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Plugin Development</CardTitle>
              <CardDescription>
                Create powerful plugins with database access, API hooks, and advanced features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Integration
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Direct Database Access</Label>
                          <Badge variant="outline">Pro</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Access store database for advanced queries and data manipulation</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Database className="w-4 h-4 mr-2" />
                          Configure Database Access
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Custom Models</Label>
                          <Badge variant="outline">Pro</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Create custom database models and relationships</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Package className="w-4 h-4 mr-2" />
                          Model Generator
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    API & Webhooks
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Custom API Endpoints</Label>
                          <Badge variant="outline">Pro</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Create custom REST API endpoints for your plugin</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Webhook className="w-4 h-4 mr-2" />
                          API Builder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Webhook Integration</Label>
                          <Badge variant="outline">Pro</Badge>
                        </div>
                        <p className="text-sm text-gray-600">React to store events and external webhooks</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Zap className="w-4 h-4 mr-2" />
                          Webhook Manager
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  External Integrations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium">Email Services</h4>
                      <p className="text-xs text-gray-500">SendGrid, Mailgun, etc.</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">Analytics</h4>
                      <p className="text-xs text-gray-500">Google Analytics, Mixpanel</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium">Payment Gateways</h4>
                      <p className="text-xs text-gray-500">Stripe, PayPal, Square</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Advanced Plugin Code</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    language="javascript"
                    theme="vs-dark"
                    value={`// Advanced Plugin Example
class AdvancedPlugin {
  constructor() {
    this.name = 'Advanced Plugin';
    this.version = '1.0.0';
    this.apiEndpoints = [];
    this.webhookListeners = [];
  }

  // Database access
  async getCustomData(query) {
    const { sequelize } = require('./database/connection');
    return await sequelize.query(query);
  }

  // Custom API endpoint
  registerAPIEndpoint(path, handler) {
    this.apiEndpoints.push({ path, handler });
  }

  // Webhook listener
  onWebhook(event, callback) {
    this.webhookListeners.push({ event, callback });
  }

  // Advanced rendering with data
  async renderAdvancedContent(config, context) {
    const data = await this.getCustomData(
      'SELECT * FROM custom_data WHERE store_id = ?',
      [context.store.id]
    );
    
    return \`
      <div class="advanced-plugin">
        <h2>\${config.title}</h2>
        <div class="data-display">
          \${data.map(item => \`
            <div class="item">
              <h3>\${item.name}</h3>
              <p>\${item.description}</p>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  }

  // Plugin lifecycle hooks
  async onInstall() {
    // Run installation scripts
    await this.createCustomTables();
    await this.setupWebhooks();
  }

  async onUninstall() {
    // Cleanup
    await this.removeCustomTables();
    await this.removeWebhooks();
  }
}`}
                    onChange={(value) => setPluginData({ ...pluginData, code: value })}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Advanced features require a Pro subscription and additional permissions. 
                  <Button variant="link" className="p-0 h-auto ml-2">
                    Upgrade to Pro →
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Permissions
                </Button>
                <SaveButton
                  onClick={() => createPlugin('advanced')}
                  loading={loading}
                  success={saveSuccess}
                  defaultText="Create Advanced Plugin"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload ZIP Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Plugin ZIP</CardTitle>
              <CardDescription>
                Upload a pre-built plugin package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Your ZIP file should contain:</p>
                    <ul className="list-disc ml-5 text-sm">
                      <li><code>manifest.json</code> - Plugin metadata and configuration</li>
                      <li><code>index.js</code> - Main plugin code with exported class</li>
                      <li><code>README.md</code> (optional) - Documentation</li>
                      <li><code>styles.css</code> (optional) - Plugin styles</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    {uploadFile ? uploadFile.name : 'Drop your ZIP file here or click to browse'}
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
                
                {uploadFile && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => createPlugin('upload')}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Plugin
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Plugin Generator</CardTitle>
              <CardDescription>
                Describe what you want and let AI create the plugin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Brain className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="text-blue-900">
                    <p className="font-semibold mb-2">How to use AI Assistant:</p>
                    <ol className="list-decimal ml-5 space-y-1 text-sm">
                      <li>Describe what you want your plugin to do in natural language</li>
                      <li>Specify which hooks it should use (e.g., "homepage header")</li>
                      <li>Mention any configuration options you need</li>
                      <li>The AI will generate complete, working plugin code</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe Your Plugin</Label>
                <Textarea
                  id="ai-prompt"
                  rows={8}
                  placeholder="Examples:
• 'Create a countdown timer for sales'
• 'Add a popup that shows after 5 seconds with a special offer'
• 'Display social media links in the footer'
• 'Create a newsletter subscription form'
• 'Show a welcome banner with custom message'

Be specific about:
- Where it should appear (homepage, footer, etc.)
- What configuration options you need
- Any specific styling or behavior"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => createPlugin('ai')}
                  disabled={loading || !aiPrompt}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Plugin
                    </>
                  )}
                </Button>
              </div>
              
              {pluginData.code && (
                <div className="space-y-2">
                  <Label>Generated Code</Label>
                  <Textarea
                    rows={15}
                    className="font-mono text-sm"
                    value={pluginData.code}
                    readOnly
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">File Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(80vh-60px)]">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {previewContent}
              </pre>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginBuilder;