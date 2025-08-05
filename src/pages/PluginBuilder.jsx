import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Code,
  Upload,
  Brain,
  FileCode,
  Play,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const PluginBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
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
  
  // Templates
  const templates = [
    {
      id: 'banner',
      name: 'Banner Plugin',
      description: 'Display custom banners on your store',
      category: 'display',
      code: `class BannerPlugin {
  constructor() {
    this.name = 'Banner Plugin';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    return \`
      <div style="background: \${config.backgroundColor}; padding: 20px; text-align: center;">
        <h2>\${config.message}</h2>
      </div>
    \`;
  }
}

module.exports = BannerPlugin;`
    },
    {
      id: 'analytics',
      name: 'Analytics Plugin',
      description: 'Track user interactions',
      category: 'analytics',
      code: `class AnalyticsPlugin {
  constructor() {
    this.name = 'Analytics Plugin';
    this.version = '1.0.0';
  }
  
  trackPageView(config, context) {
    // Analytics tracking code
    console.log('Page viewed:', context.page);
  }
}

module.exports = AnalyticsPlugin;`
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
      code: template.code
    });
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
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Plugin "${pluginData.name}" created successfully!`);
      
      // Navigate back to plugins page after a short delay
      setTimeout(() => {
        navigate('/admin/plugins');
      }, 2000);
    } catch (error) {
      toast.error('Failed to create plugin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Plugin Builder</h1>
        <p className="text-gray-600">
          Create custom plugins for your store using multiple methods
        </p>
      </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visual" className="flex items-center space-x-2">
            <FileCode className="w-4 h-4" />
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
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => createPlugin('visual')}
                      disabled={loading || !pluginData.name}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Plugin
                        </>
                      )}
                    </Button>
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
                <Button 
                  onClick={() => createPlugin('code')}
                  disabled={loading || !pluginData.name || !pluginData.code}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Plugin
                    </>
                  )}
                </Button>
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
                  Your ZIP file should contain a manifest.json file and the plugin code
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
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe Your Plugin</Label>
                <Textarea
                  id="ai-prompt"
                  rows={5}
                  placeholder="Example: Create a plugin that shows a welcome message with the store name and current date..."
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
  );
};

export default PluginBuilder;