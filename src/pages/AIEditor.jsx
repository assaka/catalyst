import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EditorLayout from '@/components/EditorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  Wand2,
  Code,
  Palette,
  Layout,
  Sparkles,
  Download,
  Upload,
  Save
} from 'lucide-react';

const AIEditor = () => {
  const location = useLocation();
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('hero-section');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Available customization templates
  const templates = [
    {
      id: 'hero-section',
      name: 'Hero Section',
      description: 'Create a compelling homepage hero with call-to-action',
      category: 'layout'
    },
    {
      id: 'product-card',
      name: 'Product Card',
      description: 'Design custom product display cards',
      category: 'component'
    },
    {
      id: 'navigation',
      name: 'Navigation Menu',
      description: 'Customize site navigation and menus',
      category: 'navigation'
    },
    {
      id: 'footer',
      name: 'Footer Layout',
      description: 'Design site footer with links and information',
      category: 'layout'
    },
    {
      id: 'color-scheme',
      name: 'Color Scheme',
      description: 'Generate custom color palettes for your store',
      category: 'styling'
    },
    {
      id: 'typography',
      name: 'Typography',
      description: 'Set custom fonts and text styling',
      category: 'styling'
    }
  ];

  // Sample generated codes for different templates
  const sampleCodes = {
    'hero-section': `<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl font-bold mb-6">Welcome to Amazing Store</h1>
    <p class="text-xl mb-8 max-w-2xl mx-auto">
      Discover our curated collection of premium products designed to enhance your lifestyle.
    </p>
    <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
      Shop Now
    </button>
  </div>
</section>`,
    'product-card': `<!-- Product Card Component -->
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
  <div class="aspect-square overflow-hidden">
    <img src="product-image.jpg" alt="Product" class="w-full h-full object-cover hover:scale-105 transition-transform" />
  </div>
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-2">Product Name</h3>
    <p class="text-gray-600 text-sm mb-3">Product description goes here...</p>
    <div class="flex justify-between items-center">
      <span class="text-xl font-bold text-blue-600">$29.99</span>
      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
        Add to Cart
      </button>
    </div>
  </div>
</div>`,
    'navigation': `<!-- Navigation Menu -->
<nav class="bg-white shadow-sm border-b">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center space-x-8">
        <div class="text-2xl font-bold text-gray-900">Store Logo</div>
        <div class="hidden md:flex space-x-6">
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Products</a>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Categories</a>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">About</a>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <button class="text-gray-700 hover:text-blue-600">Search</button>
        <button class="text-gray-700 hover:text-blue-600">Cart (0)</button>
      </div>
    </div>
  </div>
</nav>`
  };

  // Generate code with AI
  const generateCode = async () => {
    if (!aiPrompt.trim()) {
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use sample code based on selected template
    const baseCode = sampleCodes[selectedTemplate] || sampleCodes['hero-section'];
    
    // Add some customization based on the prompt
    let customizedCode = baseCode;
    if (aiPrompt.toLowerCase().includes('dark')) {
      customizedCode = customizedCode.replace('bg-white', 'bg-gray-900').replace('text-gray-900', 'text-white');
    }
    if (aiPrompt.toLowerCase().includes('green')) {
      customizedCode = customizedCode.replace('blue-600', 'green-600').replace('blue-700', 'green-700');
    }
    
    setGeneratedCode(`<!-- Generated based on: "${aiPrompt}" -->\n\n${customizedCode}`);
    setIsGenerating(false);
  };

  // Check if we're on the editor route (not admin route)
  const isEditorRoute = location.pathname.startsWith('/editor/');
  
  const content = (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 relative z-0 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              AI Code Assistant
            </h1>
            <p className="text-gray-600 mt-2">
              Generate custom code for your store using AI. Describe what you want and get instant HTML/CSS code.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/editor/templates', '_blank')}>
              <Layout className="w-4 h-4 mr-2" />
              Template Editor
            </Button>
            <Button onClick={() => {}} disabled={!generatedCode}>
              <Save className="w-4 h-4 mr-2" />
              Save Code
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar - Configuration */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Type</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Describe what you want</label>
                <Textarea
                  placeholder="E.g., 'Create a modern hero section with a dark background and green accent colors for my electronics store'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={generateCode} 
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Template Preview */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Template Info</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.find(t => t.id === selectedTemplate) && (
                <div>
                  <h4 className="font-medium mb-2">
                    {templates.find(t => t.id === selectedTemplate).name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {templates.find(t => t.id === selectedTemplate).description}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {templates.find(t => t.id === selectedTemplate).category}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Generated Code */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Code</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={!generatedCode}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" disabled={!generatedCode}>
                    <Code className="w-4 h-4 mr-2" />
                    Deploy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {generatedCode ? (
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-96">
                    {generatedCode}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a template type and describe what you want to generate custom code.</p>
                  <p className="text-sm mt-2">The AI will create HTML/CSS code based on your requirements.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Return content wrapped with EditorLayout if on editor route, otherwise just the content
  return isEditorRoute ? (
    <EditorLayout>
      {content}
    </EditorLayout>
  ) : content;
};

export default AIEditor;