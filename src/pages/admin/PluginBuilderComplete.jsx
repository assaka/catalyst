import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Eye,
  Download,
  RefreshCw,
  Settings,
  Info,
  Terminal,
  Package,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import SaveButton from '@/components/ui/save-button';
import apiClient from '@/api/client';

const PluginBuilderComplete = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [createdPlugins, setCreatedPlugins] = useState([]);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Plugin data state
  const [pluginData, setPluginData] = useState({
    name: '',
    slug: '',
    description: '',
    version: '1.0.0',
    author: '',
    category: 'display',
    hooks: ['homepage_header'],
    code: '',
    configSchema: {
      properties: {}
    }
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  
  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Configuration builder state
  const [configProperties, setConfigProperties] = useState([]);
  
  // Get store ID from localStorage or context
  const storeId = localStorage.getItem('selectedStoreId') || 'demo-store';

  // Available hooks
  const availableHooks = [
    { value: 'homepage_header', label: 'Homepage Header', description: 'Top of homepage' },
    { value: 'homepage_content', label: 'Homepage Content', description: 'Main content area' },
    { value: 'homepage_footer', label: 'Homepage Footer', description: 'Bottom of homepage' },
    { value: 'product_page_header', label: 'Product Page Header', description: 'Top of product pages' },
    { value: 'product_page_sidebar', label: 'Product Sidebar', description: 'Product page sidebar' },
    { value: 'cart_page_header', label: 'Cart Header', description: 'Shopping cart page' },
    { value: 'checkout_header', label: 'Checkout Header', description: 'Checkout process' },
    { value: 'global_header', label: 'Global Header', description: 'All pages header' },
    { value: 'global_footer', label: 'Global Footer', description: 'All pages footer' }
  ];

  // Code templates with complete examples
  const codeTemplates = {
    banner: {
      name: 'Welcome Banner Plugin',
      description: 'Display custom welcome banners',
      category: 'display',
      hooks: ['homepage_header'],
      code: `class WelcomeBannerPlugin {
  constructor() {
    this.name = 'Welcome Banner Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    const { message = 'Welcome!', backgroundColor = '#007bff', textColor = '#ffffff', showStoreName = true } = config;
    
    let displayMessage = message;
    if (showStoreName && context.store && context.store.name) {
      displayMessage += ' - ' + context.store.name;
    }
    
    return \`
      <div style="
        background: \${backgroundColor};
        color: \${textColor};
        padding: 20px;
        text-align: center;
        margin: 10px 0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 1.8em;">
          \${this.escapeHTML(displayMessage)}
        </h2>
        <p style="margin: 0; opacity: 0.9; font-size: 0.9em;">
          Created with Catalyst Plugin Builder
        </p>
      </div>
    \`;
  }
  
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

module.exports = WelcomeBannerPlugin;`,
      configSchema: {
        properties: {
          message: { type: 'string', default: 'Welcome to our store!', description: 'Banner message' },
          backgroundColor: { type: 'string', default: '#007bff', description: 'Background color' },
          textColor: { type: 'string', default: '#ffffff', description: 'Text color' },
          showStoreName: { type: 'boolean', default: true, description: 'Show store name' }
        }
      }
    },
    countdown: {
      name: 'Countdown Timer Plugin',
      description: 'Display countdown timer for sales',
      category: 'marketing',
      hooks: ['homepage_header', 'product_page_header'],
      code: `class CountdownTimerPlugin {
  constructor() {
    this.name = 'Countdown Timer Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    return this.renderTimer(config, context);
  }
  
  renderProductPageHeader(config, context) {
    return this.renderTimer(config, context);
  }
  
  renderTimer(config, context) {
    const { 
      endDate = new Date(Date.now() + 86400000).toISOString(),
      title = 'Sale Ends In:',
      backgroundColor = '#ff4444',
      textColor = '#ffffff'
    } = config;
    
    const timerId = 'countdown-' + Math.random().toString(36).substr(2, 9);
    
    return \`
      <div style="
        background: \${backgroundColor};
        color: \${textColor};
        padding: 15px;
        text-align: center;
        margin: 10px 0;
        border-radius: 8px;
      ">
        <h3 style="margin: 0 0 10px 0;">\${title}</h3>
        <div id="\${timerId}" style="font-size: 1.5em; font-weight: bold;">
          Loading...
        </div>
      </div>
      
      <script>
        (function() {
          const endTime = new Date('\${endDate}').getTime();
          const timerId = '\${timerId}';
          
          function updateCountdown() {
            const now = new Date().getTime();
            const distance = endTime - now;
            
            if (distance < 0) {
              document.getElementById(timerId).innerHTML = 'EXPIRED';
              return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById(timerId).innerHTML = 
              days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
          }
          
          updateCountdown();
          setInterval(updateCountdown, 1000);
        })();
      </script>
    \`;
  }
}

module.exports = CountdownTimerPlugin;`,
      configSchema: {
        properties: {
          endDate: { type: 'string', default: new Date(Date.now() + 86400000).toISOString(), description: 'End date/time' },
          title: { type: 'string', default: 'Sale Ends In:', description: 'Timer title' },
          backgroundColor: { type: 'string', default: '#ff4444', description: 'Background color' },
          textColor: { type: 'string', default: '#ffffff', description: 'Text color' }
        }
      }
    },
    announcement: {
      name: 'Announcement Bar Plugin',
      description: 'Sticky announcement bar',
      category: 'display',
      hooks: ['global_header'],
      code: `class AnnouncementBarPlugin {
  constructor() {
    this.name = 'Announcement Bar Plugin';
    this.version = '1.0.0';
  }
  
  renderGlobalHeader(config, context) {
    const { 
      message = 'Free shipping on orders over $50!',
      backgroundColor = '#28a745',
      textColor = '#ffffff',
      position = 'top',
      dismissible = true
    } = config;
    
    const barId = 'announcement-' + Math.random().toString(36).substr(2, 9);
    
    return \`
      <div id="\${barId}" style="
        position: \${position === 'sticky' ? 'sticky' : 'relative'};
        top: 0;
        background: \${backgroundColor};
        color: \${textColor};
        padding: 12px 20px;
        text-align: center;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
      ">
        <span>\${this.escapeHTML(message)}</span>
        \${dismissible ? \`
          <button onclick="document.getElementById('\${barId}').style.display='none'" style="
            background: none;
            border: none;
            color: inherit;
            margin-left: 20px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
          ">&times;</button>
        \` : ''}
      </div>
    \`;
  }
  
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

module.exports = AnnouncementBarPlugin;`,
      configSchema: {
        properties: {
          message: { type: 'string', default: 'Free shipping on orders over $50!', description: 'Announcement message' },
          backgroundColor: { type: 'string', default: '#28a745', description: 'Background color' },
          textColor: { type: 'string', default: '#ffffff', description: 'Text color' },
          position: { type: 'string', enum: ['top', 'sticky'], default: 'top', description: 'Bar position' },
          dismissible: { type: 'boolean', default: true, description: 'Can be dismissed' }
        }
      }
    }
  };

  // Load created plugins on mount
  useEffect(() => {
    loadCreatedPlugins();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (pluginData.name) {
      const slug = pluginData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setPluginData(prev => ({ ...prev, slug }));
    }
  }, [pluginData.name]);

  const loadCreatedPlugins = async () => {
    try {
      const response = await apiClient.get(`/api/stores/${storeId}/plugins`);
      setCreatedPlugins(response.data.plugins || []);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  };

  const handleTemplateSelect = (templateKey) => {
    const template = codeTemplates[templateKey];
    setPluginData({
      ...pluginData,
      name: template.name,
      description: template.description,
      category: template.category,
      hooks: template.hooks,
      code: template.code,
      configSchema: template.configSchema
    });
    
    // Convert config schema to properties array for the builder
    const props = Object.entries(template.configSchema.properties).map(([key, value]) => ({
      key,
      ...value
    }));
    setConfigProperties(props);
    
    toast.success(`Template loaded: ${template.name}`);
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

  const validatePlugin = async () => {
    setValidating(true);
    try {
      const response = await apiClient.post(`/api/stores/${storeId}/plugins/validate`, {
        code: pluginData.code,
        hooks: pluginData.hooks
      });
      
      if (response.data.valid) {
        toast.success('Plugin code is valid!');
        return true;
      } else {
        toast.error('Validation failed: ' + (response.data.errors || ['Unknown error']).join(', '));
        return false;
      }
    } catch (error) {
      toast.error('Validation error: ' + error.message);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const previewPlugin = async () => {
    try {
      const response = await apiClient.post(`/api/stores/${storeId}/plugins/preview`, {
        code: pluginData.code,
        hook: pluginData.hooks[0],
        config: Object.fromEntries(
          configProperties.map(prop => [prop.key, prop.default])
        )
      });
      
      setPreviewHtml(response.data.html);
      toast.success('Preview generated!');
    } catch (error) {
      toast.error('Preview failed: ' + error.message);
    }
  };

  const createPlugin = async (method) => {
    setSaveSuccess(false);
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};
      
      switch (method) {
        case 'visual':
        case 'code':
          endpoint = `/api/stores/${storeId}/plugins/create/web`;
          payload = {
            name: pluginData.name,
            slug: pluginData.slug,
            description: pluginData.description,
            version: pluginData.version,
            author: pluginData.author || 'Store Owner',
            category: pluginData.category,
            hooks: pluginData.hooks,
            code: pluginData.code,
            configSchema: pluginData.configSchema
          };
          break;
          
        case 'upload':
          endpoint = `/api/stores/${storeId}/plugins/create/upload`;
          const formData = new FormData();
          formData.append('plugin', uploadFile);
          payload = formData;
          break;
          
        case 'ai':
          endpoint = `/api/stores/${storeId}/plugins/create/ai`;
          payload = {
            prompt: aiPrompt,
            category: pluginData.category,
            hooks: pluginData.hooks
          };
          break;
      }
      
      const response = await apiClient.post(endpoint, payload, {
        headers: method === 'upload' ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      
      if (response.data.success) {
        toast.success(`Plugin "${response.data.plugin.name}" created successfully!`);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await loadCreatedPlugins();

        // Reset form
        setPluginData({
          name: '',
          slug: '',
          description: '',
          version: '1.0.0',
          author: '',
          category: 'display',
          hooks: ['homepage_header'],
          code: '',
          configSchema: { properties: {} }
        });
        setConfigProperties([]);
        setUploadFile(null);
        setAiPrompt('');
      }
    } catch (error) {
      toast.error('Failed to create plugin: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt) {
      toast.error('Please describe what you want the plugin to do');
      return;
    }
    
    setAiGenerating(true);
    try {
      const response = await apiClient.post(`/api/stores/${storeId}/plugins/create/ai`, {
        prompt: aiPrompt,
        category: pluginData.category,
        hooks: pluginData.hooks
      });
      
      if (response.data.success) {
        const generatedPlugin = response.data.plugin;
        setPluginData({
          ...pluginData,
          name: generatedPlugin.name,
          description: generatedPlugin.description,
          code: generatedPlugin.code,
          configSchema: generatedPlugin.configSchema
        });
        
        toast.success('Plugin code generated! Review and customize as needed.');
      }
    } catch (error) {
      toast.error('AI generation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setAiGenerating(false);
    }
  };

  const addConfigProperty = () => {
    setConfigProperties([
      ...configProperties,
      {
        key: `property_${configProperties.length + 1}`,
        type: 'string',
        default: '',
        description: ''
      }
    ]);
  };

  const updateConfigProperty = (index, field, value) => {
    const updated = [...configProperties];
    updated[index][field] = value;
    setConfigProperties(updated);
    
    // Update plugin data config schema
    const schema = {
      properties: Object.fromEntries(
        updated.map(prop => [prop.key, {
          type: prop.type,
          default: prop.default,
          description: prop.description
        }])
      )
    };
    setPluginData({ ...pluginData, configSchema: schema });
  };

  const removeConfigProperty = (index) => {
    const updated = configProperties.filter((_, i) => i !== index);
    setConfigProperties(updated);
    
    const schema = {
      properties: Object.fromEntries(
        updated.map(prop => [prop.key, {
          type: prop.type,
          default: prop.default,
          description: prop.description
        }])
      )
    };
    setPluginData({ ...pluginData, configSchema: schema });
  };

  const downloadPlugin = (plugin) => {
    // Create a ZIP file with the plugin code and manifest
    const manifest = {
      name: plugin.name,
      slug: plugin.slug,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      category: plugin.category,
      hooks: plugin.hooks,
      configSchema: plugin.configSchema
    };
    
    const blob = new Blob([
      `// manifest.json\n${JSON.stringify(manifest, null, 2)}\n\n// index.js\n${plugin.code}`
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plugin.slug}.plugin.js`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${plugin.name}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* File Explorer Sidebar */}
      <div className={`${fileExplorerOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Plugin Explorer</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFileExplorerOpen(!fileExplorerOpen)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Created Plugins</div>
            
            {createdPlugins.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No plugins created yet</div>
            ) : (
              createdPlugins.map((plugin) => (
                <Collapsible key={plugin.id}>
                  <CollapsibleTrigger className="flex items-center space-x-2 w-full hover:bg-gray-100 p-2 rounded">
                    <ChevronRight className="h-3 w-3" />
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="text-sm flex-1 text-left">{plugin.name}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-1">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <File className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">manifest.json</span>
                      </div>
                      <div className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <FileCode className="h-3 w-3 text-green-500" />
                        <span className="text-xs">index.js</span>
                      </div>
                      <div className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <Settings className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">config.json</span>
                      </div>
                    </div>
                    <div className="mt-2 flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadPlugin(plugin)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlugin(plugin)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
            
            <Separator className="my-4" />
            
            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Templates</div>
            {Object.entries(codeTemplates).map(([key, template]) => (
              <div
                key={key}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleTemplateSelect(key)}
              >
                <FileCode className="h-4 w-4 text-purple-500" />
                <span className="text-sm">{template.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Plugin Builder</h1>
              <p className="text-gray-600">
                Create custom plugins for your store using multiple methods
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFileExplorerOpen(!fileExplorerOpen)}
            >
              {fileExplorerOpen ? <ChevronRight /> : <Folder />}
              <span className="ml-2">Explorer</span>
            </Button>
          </div>

          {/* Help Section */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Plugin Structure Guide</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <div><strong>Code Editor:</strong> Write a JavaScript class with render methods for each hook (e.g., renderHomepageHeader)</div>
              <div><strong>ZIP File:</strong> Include manifest.json (metadata) and index.js (plugin code)</div>
              <div><strong>AI Assistant:</strong> Describe your plugin in plain English and let AI generate the code</div>
              <div><strong>Visual Builder:</strong> Select a template and customize it with your settings</div>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="visual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visual" className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Visual Builder</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Code Editor</span>
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
                  <CardTitle>Visual Plugin Builder</CardTitle>
                  <CardDescription>
                    Select a template from the sidebar or configure your plugin below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plugin Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plugin Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plugin Name *</Label>
                        <Input
                          id="name"
                          placeholder="My Awesome Plugin"
                          value={pluginData.name}
                          onChange={(e) => setPluginData({ ...pluginData, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (auto-generated)</Label>
                        <Input
                          id="slug"
                          value={pluginData.slug}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={pluginData.version}
                          onChange={(e) => setPluginData({ ...pluginData, version: e.target.value })}
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
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={3}
                        placeholder="Describe what your plugin does..."
                        value={pluginData.description}
                        onChange={(e) => setPluginData({ ...pluginData, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Plugin Hooks (where it appears)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableHooks.map(hook => (
                          <label key={hook.value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pluginData.hooks.includes(hook.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPluginData({ ...pluginData, hooks: [...pluginData.hooks, hook.value] });
                                } else {
                                  setPluginData({ ...pluginData, hooks: pluginData.hooks.filter(h => h !== hook.value) });
                                }
                              }}
                            />
                            <span className="text-sm">{hook.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configuration Builder */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Configuration Properties</h3>
                      <Button onClick={addConfigProperty} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </div>
                    
                    {configProperties.map((prop, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Property Key</Label>
                            <Input
                              value={prop.key}
                              onChange={(e) => updateConfigProperty(index, 'key', e.target.value)}
                              placeholder="propertyName"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Type</Label>
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
                                <SelectItem value="array">Array</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Default Value</Label>
                            <Input
                              value={prop.default}
                              onChange={(e) => updateConfigProperty(index, 'default', e.target.value)}
                              placeholder="Default value"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <div className="flex space-x-2">
                              <Input
                                value={prop.description}
                                onChange={(e) => updateConfigProperty(index, 'description', e.target.value)}
                                placeholder="Description"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeConfigProperty(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Code Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plugin Code</h3>
                    <Textarea
                      rows={15}
                      className="font-mono text-sm"
                      placeholder="// Your plugin code will appear here after selecting a template or writing it manually"
                      value={pluginData.code}
                      onChange={(e) => setPluginData({ ...pluginData, code: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="space-x-2">
                      <Button 
                        variant="outline"
                        onClick={validatePlugin}
                        disabled={!pluginData.code || validating}
                      >
                        {validating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Validate
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={previewPlugin}
                        disabled={!pluginData.code}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                    
                    <SaveButton
                      onClick={() => createPlugin('visual')}
                      loading={loading}
                      success={saveSuccess}
                      disabled={!pluginData.name || !pluginData.code}
                      defaultText="Create Plugin"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview Section */}
              {previewHtml && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plugin Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Code Editor Tab */}
            <TabsContent value="code" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Code Editor</CardTitle>
                  <CardDescription>
                    Write your plugin code directly. Must export a class with render methods for each hook.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Code Structure</AlertTitle>
                    <AlertDescription className="mt-2">
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2">{`class MyPlugin {
  constructor() {
    this.name = 'My Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    return '<div>Your HTML here</div>';
  }
}

module.exports = MyPlugin;`}</pre>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code-name">Plugin Name *</Label>
                      <Input
                        id="code-name"
                        placeholder="My Plugin"
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
                    <Label htmlFor="plugin-code">Plugin Code *</Label>
                    <Textarea
                      id="plugin-code"
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="// Write your plugin code here..."
                      value={pluginData.code}
                      onChange={(e) => setPluginData({ ...pluginData, code: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={validatePlugin}
                      disabled={!pluginData.code || validating}
                    >
                      {validating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Validate Code
                        </>
                      )}
                    </Button>
                    
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
                    <Package className="h-4 w-4" />
                    <AlertTitle>ZIP File Structure</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="mt-2 space-y-1 text-xs">
                        <div>📁 my-plugin.zip</div>
                        <div className="ml-4">📄 manifest.json - Plugin metadata</div>
                        <div className="ml-4">📄 index.js - Plugin code</div>
                        <div className="ml-4">📄 styles.css - Optional styles</div>
                        <div className="ml-4">📄 README.md - Optional documentation</div>
                      </div>
                      
                      <div className="mt-3">
                        <strong>manifest.json example:</strong>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1">{`{
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "hooks": {
    "homepage_header": "renderHomepageHeader"
  },
  "configSchema": {
    "properties": {
      "message": {
        "type": "string",
        "default": "Hello World"
      }
    }
  }
}`}</pre>
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
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>AI Prompt Examples</AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      <div>• "Create a banner that shows today's date and a welcome message"</div>
                      <div>• "Make a countdown timer for Black Friday sales"</div>
                      <div>• "Build a popup that shows new product announcements"</div>
                      <div>• "Create a shipping calculator widget for the cart page"</div>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
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
                    
                    <div className="space-y-2">
                      <Label>Primary Hook</Label>
                      <Select 
                        value={pluginData.hooks[0] || 'homepage_header'}
                        onValueChange={(value) => setPluginData({ ...pluginData, hooks: [value] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hook" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableHooks.map(hook => (
                            <SelectItem key={hook.value} value={hook.value}>
                              {hook.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Describe Your Plugin *</Label>
                    <Textarea
                      id="ai-prompt"
                      rows={5}
                      placeholder="Describe in detail what you want your plugin to do..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={generateWithAI}
                      disabled={aiGenerating || !aiPrompt}
                    >
                      {aiGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
                    <div className="space-y-4">
                      <Separator />
                      
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Plugin Generated Successfully!</AlertTitle>
                        <AlertDescription>
                          Review the generated code below and make any necessary adjustments.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label>Generated Plugin Name</Label>
                        <Input value={pluginData.name} readOnly />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Generated Code</Label>
                        <Textarea
                          rows={15}
                          className="font-mono text-sm"
                          value={pluginData.code}
                          onChange={(e) => setPluginData({ ...pluginData, code: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <SaveButton
                          onClick={() => createPlugin('ai')}
                          loading={loading}
                          success={saveSuccess}
                          defaultText="Save Plugin"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PluginBuilderComplete;