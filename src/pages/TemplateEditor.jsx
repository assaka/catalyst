import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EditorLayout from '@/components/EditorLayout';
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
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Layout,
  Code,
  Brain,
  Eye,
  Save,
  Plus,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  Palette,
  Grid,
  Type,
  Image,
  ShoppingCart,
  Package,
  Home,
  FileText,
  Settings,
  Layers,
  Move,
  Copy,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Wand2,
  PaintBucket,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import Editor from '@monaco-editor/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Component types for drag and drop
const ComponentTypes = {
  WIDGET: 'widget',
  SECTION: 'section',
  ELEMENT: 'element'
};

// Draggable component
const DraggableComponent = ({ component, onSelect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: component.type === 'section' ? ComponentTypes.SECTION : 
          component.type === 'element' ? ComponentTypes.ELEMENT : ComponentTypes.WIDGET,
    item: component,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move transition-all ${
        isDragging ? 'opacity-50' : 'hover:shadow-md hover:border-blue-500'
      }`}
      onClick={() => onSelect(component)}
    >
      <div className="flex items-center gap-2">
        <component.icon className="w-5 h-5 text-gray-600" />
        <div>
          <p className="font-medium text-sm">{component.name}</p>
          <p className="text-xs text-gray-500">{component.description}</p>
        </div>
      </div>
    </div>
  );
};

// Droppable canvas area
const TemplateCanvas = ({ template, onDrop, onSelectElement, selectedElement, setTemplates, activeTemplate, setSelectedElement }) => {
  const [{ isOver }, drop] = useDrop({
    accept: [ComponentTypes.WIDGET, ComponentTypes.SECTION, ComponentTypes.ELEMENT],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = drop.current?.getBoundingClientRect();
      const relativeOffset = canvasRect ? {
        x: offset.x - canvasRect.left,
        y: offset.y - canvasRect.top
      } : { x: 50, y: 50 };
      onDrop(item, relativeOffset);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`relative min-h-[600px] bg-white border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {template.elements.map((element, index) => (
        <div
          key={element.id}
          className={`absolute p-4 border rounded cursor-pointer transition-all ${
            selectedElement?.id === element.id
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-400'
          }`}
          style={{
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height
          }}
          onClick={() => onSelectElement(element)}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{element.type}</Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                // Remove element from template
                setTemplates(prev => ({
                  ...prev,
                  [activeTemplate]: {
                    ...prev[activeTemplate],
                    elements: prev[activeTemplate].elements.filter(el => el.id !== element.id)
                  }
                }));
                if (selectedElement?.id === element.id) {
                  setSelectedElement(null);
                }
                toast.success('Element removed');
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: element.content }} />
        </div>
      ))}
    </div>
  );
};

const TemplateEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('category');
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [selectedElement, setSelectedElement] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);
  
  // Store templates state
  const [templates, setTemplates] = useState({
    category: {
      name: 'Category Page',
      type: 'category',
      elements: [],
      styles: {},
      settings: {
        layout: 'grid',
        columns: 3,
        showFilters: true,
        showSort: true,
        productsPerPage: 12
      }
    },
    product: {
      name: 'Product Detail Page',
      type: 'product',
      elements: [],
      styles: {},
      settings: {
        layout: 'two-column',
        imagePosition: 'left',
        showReviews: true,
        showRelated: true
      }
    },
    checkout: {
      name: 'Checkout Page',
      type: 'checkout',
      elements: [],
      styles: {},
      settings: {
        layout: 'single-page',
        showOrderSummary: true,
        guestCheckout: true
      }
    },
    homepage: {
      name: 'Homepage',
      type: 'homepage',
      elements: [],
      styles: {},
      settings: {
        heroSection: true,
        featuredProducts: true,
        categories: true,
        testimonials: true
      }
    }
  });

  // Available components to drag
  const availableComponents = [
    {
      id: 'header',
      name: 'Header Section',
      type: 'section',
      icon: Layout,
      description: 'Page header with title',
      defaultContent: '<h1>Page Title</h1>'
    },
    {
      id: 'product-grid',
      name: 'Product Grid',
      type: 'widget',
      icon: Grid,
      description: 'Grid of products',
      defaultContent: '<div class="product-grid">Products will appear here</div>'
    },
    {
      id: 'filter-sidebar',
      name: 'Filter Sidebar',
      type: 'widget',
      icon: Settings,
      description: 'Product filters',
      defaultContent: '<div class="filters">Filter options</div>'
    },
    {
      id: 'breadcrumb',
      name: 'Breadcrumb',
      type: 'element',
      icon: ChevronRight,
      description: 'Navigation breadcrumb',
      defaultContent: '<nav class="breadcrumb">Home > Category</nav>'
    },
    {
      id: 'sort-dropdown',
      name: 'Sort Dropdown',
      type: 'element',
      icon: RefreshCw,
      description: 'Product sorting',
      defaultContent: '<select class="sort">Sort by...</select>'
    },
    {
      id: 'pagination',
      name: 'Pagination',
      type: 'element',
      icon: ChevronRight,
      description: 'Page navigation',
      defaultContent: '<div class="pagination">1 2 3 ...</div>'
    },
    {
      id: 'text-block',
      name: 'Text Block',
      type: 'element',
      icon: Type,
      description: 'Custom text content',
      defaultContent: '<p>Your text here</p>'
    },
    {
      id: 'image-block',
      name: 'Image Block',
      type: 'element',
      icon: Image,
      description: 'Image container',
      defaultContent: '<img src="/placeholder.jpg" alt="Image" />'
    },
    {
      id: 'custom-html',
      name: 'Custom HTML',
      type: 'element',
      icon: Code,
      description: 'Custom HTML code',
      defaultContent: '<div>Custom HTML</div>'
    },
    {
      id: 'add-to-cart',
      name: 'Add to Cart Button',
      type: 'element',
      icon: ShoppingCart,
      description: 'Cart button',
      defaultContent: '<button class="add-to-cart">Add to Cart</button>'
    }
  ];

  // Handle component drop
  const handleComponentDrop = (component, position) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type: component.type,
      name: component.name,
      content: component.defaultContent,
      position: {
        x: position ? Math.max(0, position.x - 10) : 50,
        y: position ? Math.max(0, position.y - 10) : 50
      },
      size: {
        width: component.type === 'section' ? 400 : component.type === 'widget' ? 300 : 200,
        height: component.type === 'section' ? 200 : component.type === 'widget' ? 150 : 100
      },
      styles: {}
    };

    setTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        elements: [...prev[activeTemplate].elements, newElement]
      }
    }));

    setSelectedElement(newElement);
    toast.success(`Added ${component.name} to template`);
  };

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
</nav>`,
    'custom-html': `<div class="p-6 bg-white rounded-lg shadow-sm border">
  <h2 class="text-2xl font-semibold mb-4">Custom Component</h2>
  <p class="text-gray-600">Your custom content goes here...</p>
</div>`
  };

  // Generate template with AI
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description for AI generation');
      return;
    }

    setLoading(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Determine component type from selection or default to custom-html
      const componentType = selectedElement?.type || 'custom-html';
      let baseCode = sampleCodes[componentType] || sampleCodes['custom-html'];
      
      // Apply customizations based on prompt
      if (aiPrompt.toLowerCase().includes('dark')) {
        baseCode = baseCode.replace(/bg-white/g, 'bg-gray-900')
                          .replace(/text-gray-900/g, 'text-white')
                          .replace(/text-gray-700/g, 'text-gray-300');
      }
      if (aiPrompt.toLowerCase().includes('green')) {
        baseCode = baseCode.replace(/blue-600/g, 'green-600')
                          .replace(/blue-700/g, 'green-700');
      }
      if (aiPrompt.toLowerCase().includes('purple')) {
        baseCode = baseCode.replace(/blue-600/g, 'purple-600')
                          .replace(/blue-700/g, 'purple-700');
      }
      
      // Create new element with generated code
      const newElement = {
        id: `ai-element-${Date.now()}`,
        type: componentType,
        name: `AI Generated ${componentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        content: `<!-- Generated: "${aiPrompt}" -->\n${baseCode}`,
        position: { x: 50, y: 50 },
        size: { width: 400, height: 200 },
        styles: {}
      };

      // Add to current template
      setTemplates(prev => ({
        ...prev,
        [activeTemplate]: {
          ...prev[activeTemplate],
          elements: [...prev[activeTemplate].elements, newElement]
        }
      }));

      setSelectedElement(newElement);
      toast.success('AI generated component added to canvas');
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate component with AI');
    } finally {
      setLoading(false);
    }
  };

  // Save template
  const saveTemplate = async () => {
    setLoading(true);
    try {
      const storeId = localStorage.getItem('storeId');
      const template = templates[activeTemplate];
      
      const response = await apiClient.post(`/api/stores/${storeId}/templates/save`, {
        type: activeTemplate,
        name: template.name,
        elements: template.elements,
        styles: template.styles,
        settings: template.settings
      });

      if (response?.data?.success) {
        toast.success('Template saved successfully');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  // Export template
  const exportTemplate = () => {
    const template = templates[activeTemplate];
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${activeTemplate}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template exported successfully');
  };

  // Import template
  const importTemplate = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setTemplates(prev => ({
            ...prev,
            [activeTemplate]: imported
          }));
          toast.success('Template imported successfully');
        } catch (error) {
          toast.error('Invalid template file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Preview template
  const previewTemplate = () => {
    const template = templates[activeTemplate];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.name} Preview</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
          .product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .filters { background: #f5f5f5; padding: 20px; border-radius: 8px; }
          .breadcrumb { padding: 10px 0; color: #666; }
          .pagination { margin-top: 30px; text-align: center; }
          .add-to-cart { background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
          ${Object.entries(template.styles).map(([selector, styles]) => 
            `${selector} { ${Object.entries(styles).map(([prop, val]) => `${prop}: ${val}`).join('; ')} }`
          ).join('\n')}
        </style>
      </head>
      <body>
        ${template.elements.map(el => el.content).join('\n')}
      </body>
      </html>
    `;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  // Check if we're on the editor route (not admin route)
  const isEditorRoute = location.pathname.startsWith('/editor/');
  
  const content = (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 relative z-0 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Layout className="w-8 h-8" />
                Template Editor
              </h1>
              <p className="text-gray-600 mt-2">
                Customize your store templates with drag-and-drop components or AI assistance
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/plugin-builder')}>
                <Code className="w-4 h-4 mr-2" />
                Plugin Builder
              </Button>
              <Button onClick={saveTemplate} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>

          {/* Template selector */}
          <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="category">
                <Package className="w-4 h-4 mr-2" />
                Category
              </TabsTrigger>
              <TabsTrigger value="product">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Product
              </TabsTrigger>
              <TabsTrigger value="checkout">
                <FileText className="w-4 h-4 mr-2" />
                Checkout
              </TabsTrigger>
              <TabsTrigger value="homepage">
                <Home className="w-4 h-4 mr-2" />
                Homepage
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Components */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Components</CardTitle>
                <CardDescription>Drag components to the canvas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {availableComponents.map(component => (
                      <DraggableComponent
                        key={component.id}
                        component={component}
                        onSelect={() => handleComponentDrop(component)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Component Type</Label>
                  <Select value={selectedElement?.type || 'custom-html'}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero-section">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">layout</Badge>
                          Hero Section
                        </div>
                      </SelectItem>
                      <SelectItem value="product-card">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">component</Badge>
                          Product Card
                        </div>
                      </SelectItem>
                      <SelectItem value="navigation">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">navigation</Badge>
                          Navigation Menu
                        </div>
                      </SelectItem>
                      <SelectItem value="custom-html">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">element</Badge>
                          Custom HTML
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Describe customization</Label>
                  <Textarea
                    placeholder="E.g., 'Make it dark themed with green accents'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button 
                  onClick={generateWithAI} 
                  disabled={loading}
                  className="w-full h-8 text-sm"
                  size="sm"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Generate Code
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas */}
          <div className="col-span-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Canvas</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setViewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'tablet' ? 'default' : 'outline'}
                      onClick={() => setViewMode('tablet')}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setViewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <Button size="sm" variant="outline" onClick={previewTemplate}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowCodeEditor(!showCodeEditor)}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Code
                    </Button>
                    <Button 
                      size="sm" 
                      variant={overlayMode ? 'default' : 'outline'}
                      onClick={() => setOverlayMode(!overlayMode)}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Overlay
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showCodeEditor ? (
                  <Editor
                    height="600px"
                    language="html"
                    theme="vs-dark"
                    value={templates[activeTemplate].elements.map(el => el.content).join('\n')}
                    onChange={(value) => {
                      // Update template HTML
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on'
                    }}
                  />
                ) : overlayMode ? (
                  <div className="relative">
                    {/* Live Preview with Overlay */}
                    <div 
                      className="border rounded-lg overflow-hidden bg-white"
                      style={{
                        width: viewMode === 'desktop' ? '100%' : viewMode === 'tablet' ? '768px' : '375px',
                        height: '600px',
                        margin: '0 auto'
                      }}
                    >
                      <div className="w-full h-full p-4 overflow-auto">
                        {/* Render template elements as live preview */}
                        <div className="space-y-4">
                          {templates[activeTemplate].elements.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                              <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Drop components here to see live preview</p>
                            </div>
                          ) : (
                            templates[activeTemplate].elements.map((element, index) => (
                              <div
                                key={element.id}
                                className={`p-2 border rounded cursor-pointer transition-all ${
                                  selectedElement?.id === element.id
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedElement(element)}
                                style={{ minHeight: '60px' }}
                              >
                                <div className="text-xs text-gray-500 mb-1">{element.name}</div>
                                <div 
                                  dangerouslySetInnerHTML={{ __html: element.content }} 
                                  className="live-preview-content"
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Overlay Controls */}
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs z-10">
                      <div className="text-sm font-medium text-gray-700">Live Customization</div>
                      {selectedElement ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">Editing: {selectedElement.name}</div>
                          <div className="space-y-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs h-7"
                              onClick={() => {
                                // Apply gradient styling to selected element
                                const updatedElement = {
                                  ...selectedElement,
                                  content: selectedElement.content.replace(
                                    /class="([^"]*)"/, 
                                    'class="$1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"'
                                  )
                                };
                                
                                setTemplates(prev => ({
                                  ...prev,
                                  [activeTemplate]: {
                                    ...prev[activeTemplate],
                                    elements: prev[activeTemplate].elements.map(el => 
                                      el.id === selectedElement.id ? updatedElement : el
                                    )
                                  }
                                }));
                                
                                setSelectedElement(updatedElement);
                                toast.success('Gradient theme applied');
                              }}
                            >
                              <Palette className="w-3 h-3 mr-1" />
                              Apply Gradient
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs h-7"
                              onClick={() => {
                                // Apply dark theme styling to selected element
                                const updatedElement = {
                                  ...selectedElement,
                                  content: selectedElement.content.replace(
                                    /class="([^"]*)"/, 
                                    'class="$1 bg-gray-900 text-white border-gray-700"'
                                  )
                                };
                                
                                setTemplates(prev => ({
                                  ...prev,
                                  [activeTemplate]: {
                                    ...prev[activeTemplate],
                                    elements: prev[activeTemplate].elements.map(el => 
                                      el.id === selectedElement.id ? updatedElement : el
                                    )
                                  }
                                }));
                                
                                setSelectedElement(updatedElement);
                                toast.success('Dark theme applied');
                              }}
                            >
                              <PaintBucket className="w-3 h-3 mr-1" />
                              Dark Theme
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs h-7"
                              onClick={() => {
                                // Reset to original styling
                                const updatedElement = {
                                  ...selectedElement,
                                  content: selectedElement.content
                                    .replace(/bg-gradient-to-r from-blue-500 to-purple-600 text-white/g, '')
                                    .replace(/bg-gray-900 text-white border-gray-700/g, '')
                                    .replace(/class="\s+"/g, 'class=""')
                                };
                                
                                setTemplates(prev => ({
                                  ...prev,
                                  [activeTemplate]: {
                                    ...prev[activeTemplate],
                                    elements: prev[activeTemplate].elements.map(el => 
                                      el.id === selectedElement.id ? updatedElement : el
                                    )
                                  }
                                }));
                                
                                setSelectedElement(updatedElement);
                                toast.success('Styling reset');
                              }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Reset
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          Click an element to customize it
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <TemplateCanvas
                    template={templates[activeTemplate]}
                    onDrop={handleComponentDrop}
                    onSelectElement={setSelectedElement}
                    selectedElement={selectedElement}
                    setTemplates={setTemplates}
                    activeTemplate={activeTemplate}
                    setSelectedElement={setSelectedElement}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Properties */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Properties</CardTitle>
                <CardDescription>
                  {selectedElement ? selectedElement.name : 'Select an element'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedElement ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={selectedElement.content}
                        onChange={(e) => {
                          const updatedElement = {
                            ...selectedElement,
                            content: e.target.value
                          };
                          setSelectedElement(updatedElement);
                          // Update in template
                          setTemplates(prev => ({
                            ...prev,
                            [activeTemplate]: {
                              ...prev[activeTemplate],
                              elements: prev[activeTemplate].elements.map(el => 
                                el.id === selectedElement.id ? updatedElement : el
                              )
                            }
                          }));
                        }}
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Width</Label>
                        <Input
                          type="number"
                          value={selectedElement.size.width}
                          onChange={(e) => {
                            const updatedElement = {
                              ...selectedElement,
                              size: {
                                ...selectedElement.size,
                                width: parseInt(e.target.value)
                              }
                            };
                            setSelectedElement(updatedElement);
                            // Update in template
                            setTemplates(prev => ({
                              ...prev,
                              [activeTemplate]: {
                                ...prev[activeTemplate],
                                elements: prev[activeTemplate].elements.map(el => 
                                  el.id === selectedElement.id ? updatedElement : el
                                )
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input
                          type="number"
                          value={selectedElement.size.height}
                          onChange={(e) => {
                            const updatedElement = {
                              ...selectedElement,
                              size: {
                                ...selectedElement.size,
                                height: parseInt(e.target.value)
                              }
                            };
                            setSelectedElement(updatedElement);
                            // Update in template
                            setTemplates(prev => ({
                              ...prev,
                              [activeTemplate]: {
                                ...prev[activeTemplate],
                                elements: prev[activeTemplate].elements.map(el => 
                                  el.id === selectedElement.id ? updatedElement : el
                                )
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>X Position</Label>
                        <Input
                          type="number"
                          value={selectedElement.position.x}
                          onChange={(e) => {
                            const updatedElement = {
                              ...selectedElement,
                              position: {
                                ...selectedElement.position,
                                x: parseInt(e.target.value)
                              }
                            };
                            setSelectedElement(updatedElement);
                            // Update in template
                            setTemplates(prev => ({
                              ...prev,
                              [activeTemplate]: {
                                ...prev[activeTemplate],
                                elements: prev[activeTemplate].elements.map(el => 
                                  el.id === selectedElement.id ? updatedElement : el
                                )
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Y Position</Label>
                        <Input
                          type="number"
                          value={selectedElement.position.y}
                          onChange={(e) => {
                            const updatedElement = {
                              ...selectedElement,
                              position: {
                                ...selectedElement.position,
                                y: parseInt(e.target.value)
                              }
                            };
                            setSelectedElement(updatedElement);
                            // Update in template
                            setTemplates(prev => ({
                              ...prev,
                              [activeTemplate]: {
                                ...prev[activeTemplate],
                                elements: prev[activeTemplate].elements.map(el => 
                                  el.id === selectedElement.id ? updatedElement : el
                                )
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <Separator />

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // Remove element from template
                        setTemplates(prev => ({
                          ...prev,
                          [activeTemplate]: {
                            ...prev[activeTemplate],
                            elements: prev[activeTemplate].elements.filter(el => el.id !== selectedElement.id)
                          }
                        }));
                        setSelectedElement(null);
                        toast.success('Element deleted');
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Element
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Select an element on the canvas to edit its properties
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Template Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeTemplate === 'category' && (
                    <>
                      <div>
                        <Label>Layout</Label>
                        <Select value={templates.category.settings.layout}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                            <SelectItem value="masonry">Masonry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Columns</Label>
                        <Input
                          type="number"
                          value={templates.category.settings.columns}
                          min="1"
                          max="6"
                        />
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={exportTemplate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => document.getElementById('import-template').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <input
                      id="import-template"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importTemplate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );

  // Return content wrapped with EditorLayout if on editor route, otherwise just the content
  return isEditorRoute ? (
    <EditorLayout>
      {content}
    </EditorLayout>
  ) : content;
};

export default TemplateEditor;