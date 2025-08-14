import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Eye, 
  Layers, 
  Plus, 
  Save, 
  Sparkles, 
  FileCode,
  Palette,
  Layout
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Component templates that users can customize
const COMPONENT_TEMPLATES = {
  'homepage-hero': {
    name: 'Homepage Hero Section',
    category: 'Landing',
    description: 'Main hero section for homepage',
    template: `// Homepage Hero Section Customization
export const HeroCustomization = {
  // Custom styling
  styles: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#3b82f6',
    backgroundImage: null,
  },
  
  // Custom content
  content: {
    headline: 'Welcome to Our Store',
    subheadline: 'Discover amazing products at great prices',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  },
  
  // Custom layout adjustments
  layout: {
    alignment: 'center', // 'left', 'center', 'right'
    spacing: 'normal', // 'compact', 'normal', 'spacious'
    showImage: true,
  },
  
  // Custom CSS (will be injected)
  customCSS: \`
    .hero-section {
      /* Your custom styles here */
    }
  \`,
  
  // Custom JavaScript functionality
  customJS: \`
    // Custom hero interactions
    function initHeroCustomizations() {
      // Your custom JavaScript here
    }
  \`
};`,
    previewComponent: 'HeroSection'
  },
  
  'product-card': {
    name: 'Product Card',
    category: 'Products',
    description: 'Individual product display card',
    template: `// Product Card Customization
export const ProductCardCustomization = {
  // Visual styling
  styles: {
    cardBackground: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: '8px',
    shadowLevel: 'medium', // 'none', 'light', 'medium', 'heavy'
    hoverEffect: 'lift', // 'none', 'lift', 'glow', 'scale'
  },
  
  // Content configuration
  content: {
    showRating: true,
    showPrice: true,
    showSalePrice: true,
    showAddToCart: true,
    showQuickView: true,
    priceFormat: 'currency', // 'currency', 'decimal'
  },
  
  // Layout options
  layout: {
    imageAspectRatio: '1:1', // '1:1', '4:3', '16:9'
    contentAlignment: 'left', // 'left', 'center', 'right'
    buttonStyle: 'filled', // 'filled', 'outline', 'ghost'
  },
  
  customCSS: \`
    .product-card {
      /* Custom product card styles */
    }
  \`,
  
  customJS: \`
    // Custom product card interactions
    function initProductCardCustomizations() {
      // Custom functionality here
    }
  \`
};`,
    previewComponent: 'ProductCard'
  },
  
  'navigation-menu': {
    name: 'Navigation Menu',
    category: 'Layout',
    description: 'Main site navigation',
    template: `// Navigation Menu Customization
export const NavigationCustomization = {
  styles: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    hoverColor: '#3b82f6',
    logoSize: 'medium', // 'small', 'medium', 'large'
    menuStyle: 'horizontal', // 'horizontal', 'vertical', 'dropdown'
  },
  
  content: {
    showLogo: true,
    showSearch: true,
    showCart: true,
    showAccount: true,
    customMenuItems: [],
  },
  
  behavior: {
    stickyHeader: true,
    animateOnScroll: true,
    mobileBreakpoint: '768px',
  },
  
  customCSS: \`
    .main-navigation {
      /* Custom navigation styles */
    }
  \`,
  
  customJS: \`
    // Custom navigation functionality
    function initNavigationCustomizations() {
      // Custom menu interactions
    }
  \`
};`,
    previewComponent: 'Navigation'
  },
  
  'footer': {
    name: 'Site Footer',
    category: 'Layout',
    description: 'Website footer section',
    template: `// Footer Customization
export const FooterCustomization = {
  styles: {
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    linkColor: '#3b82f6',
    borderTop: true,
  },
  
  content: {
    companyInfo: {
      name: 'Your Company',
      description: 'Brief company description',
      address: '123 Main St, City, State 12345',
      phone: '(555) 123-4567',
      email: 'info@company.com',
    },
    links: {
      'About Us': '/about',
      'Contact': '/contact',
      'Privacy Policy': '/privacy',
      'Terms of Service': '/terms',
    },
    socialLinks: {
      facebook: 'https://facebook.com/yourpage',
      twitter: 'https://twitter.com/yourhandle',
      instagram: 'https://instagram.com/youraccount',
    },
    showNewsletter: true,
  },
  
  layout: {
    columns: 4,
    alignment: 'left',
    showCopyright: true,
  },
  
  customCSS: \`
    .site-footer {
      /* Custom footer styles */
    }
  \`,
  
  customJS: \`
    // Custom footer functionality
    function initFooterCustomizations() {
      // Newsletter signup, etc.
    }
  \`
};`,
    previewComponent: 'Footer'
  }
};

export default function OverlayEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState('homepage-hero');
  const [customizations, setCustomizations] = useState({});
  const [activeTab, setActiveTab] = useState('template');
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState('edit');

  // Load existing customizations
  useEffect(() => {
    loadCustomizations();
  }, [selectedTemplate]);

  const loadCustomizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/customizations/${selectedTemplate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomizations(data.customization || {});
      }
    } catch (error) {
      console.error('Failed to load customizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/customizations/${selectedTemplate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          template: selectedTemplate,
          customizations,
          content: customizations.code || COMPONENT_TEMPLATES[selectedTemplate].template,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Customizations Saved',
          description: 'Your changes have been saved successfully.',
        });
      } else {
        throw new Error('Failed to save customizations');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save customizations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/generate-customization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          template: selectedTemplate,
          prompt: aiPrompt,
          currentCustomizations: customizations,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomizations(prev => ({
          ...prev,
          ...data.customizations,
          code: data.generatedCode,
        }));
        setAiPrompt('');
        toast({
          title: 'AI Generation Complete',
          description: 'Your customizations have been generated successfully.',
        });
      } else {
        throw new Error('Failed to generate with AI');
      }
    } catch (error) {
      toast({
        title: 'AI Generation Failed',
        description: 'Failed to generate customizations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deployCustomizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/deploy-customizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          customizations: Object.keys(customizations).map(template => ({
            template,
            data: customizations[template],
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Deployment Started',
          description: `Your customizations are being deployed. Deployment ID: ${data.deploymentId}`,
        });
      } else {
        throw new Error('Failed to start deployment');
      }
    } catch (error) {
      toast({
        title: 'Deployment Failed',
        description: 'Failed to start deployment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentTemplate = COMPONENT_TEMPLATES[selectedTemplate];
  const currentCustomization = customizations[selectedTemplate] || {};

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Template Selection */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Layers className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Overlay Editor</h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Customize components without touching source code
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {Object.entries(COMPONENT_TEMPLATES).map(([key, template]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === key 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    {currentCustomization.modified && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button 
            onClick={saveCustomizations}
            className="w-full"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button 
            onClick={deployCustomizations}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            Deploy to Render
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">{currentTemplate.name}</h2>
            <Badge variant="secondary">{currentTemplate.category}</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={previewMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('edit')}
            >
              <Code className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={previewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          {previewMode === 'edit' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start px-6 py-2 bg-gray-50 border-b">
                <TabsTrigger value="template" className="flex items-center space-x-2">
                  <FileCode className="h-4 w-4" />
                  <span>Template</span>
                </TabsTrigger>
                <TabsTrigger value="styles" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Styles</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Assistant</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="template" className="h-full p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code">Component Customization Code</Label>
                      <Textarea
                        id="code"
                        value={currentCustomization.code || currentTemplate.template}
                        onChange={(e) => setCustomizations(prev => ({
                          ...prev,
                          [selectedTemplate]: {
                            ...prev[selectedTemplate],
                            code: e.target.value,
                            modified: true,
                          }
                        }))}
                        className="h-96 font-mono text-sm"
                        placeholder="Enter your customization code here..."
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Modify the template above to customize the {currentTemplate.name} component. 
                      Your changes will be overlaid on top of the base component during deployment.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="styles" className="h-full p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Visual Customization</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bg-color">Background Color</Label>
                          <Input
                            id="bg-color"
                            type="color"
                            value={currentCustomization.backgroundColor || '#ffffff'}
                            onChange={(e) => setCustomizations(prev => ({
                              ...prev,
                              [selectedTemplate]: {
                                ...prev[selectedTemplate],
                                backgroundColor: e.target.value,
                                modified: true,
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="text-color">Text Color</Label>
                          <Input
                            id="text-color"
                            type="color"
                            value={currentCustomization.textColor || '#000000'}
                            onChange={(e) => setCustomizations(prev => ({
                              ...prev,
                              [selectedTemplate]: {
                                ...prev[selectedTemplate],
                                textColor: e.target.value,
                                modified: true,
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="custom-css">Custom CSS</Label>
                      <Textarea
                        id="custom-css"
                        value={currentCustomization.customCSS || ''}
                        onChange={(e) => setCustomizations(prev => ({
                          ...prev,
                          [selectedTemplate]: {
                            ...prev[selectedTemplate],
                            customCSS: e.target.value,
                            modified: true,
                          }
                        }))}
                        className="h-40 font-mono text-sm"
                        placeholder="/* Add your custom CSS here */"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="h-full p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">AI-Powered Customization</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Describe what you want to change about the {currentTemplate.name} component, 
                        and AI will generate the customization code for you.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ai-prompt">Describe Your Changes</Label>
                          <Textarea
                            id="ai-prompt"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="h-32"
                            placeholder="e.g., 'Make the hero section have a dark theme with blue accents and add a subtle animation when the page loads'"
                          />
                        </div>
                        
                        <Button 
                          onClick={generateWithAI}
                          disabled={!aiPrompt.trim() || isLoading}
                          className="w-full"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-2">Example Prompts:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                             onClick={() => setAiPrompt("Change the color scheme to a modern dark theme with purple accents")}>
                          "Change the color scheme to a modern dark theme with purple accents"
                        </div>
                        <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                             onClick={() => setAiPrompt("Add a subtle hover animation that scales the component slightly")}>
                          "Add a subtle hover animation that scales the component slightly"
                        </div>
                        <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                             onClick={() => setAiPrompt("Make the layout more mobile-friendly with better responsive design")}>
                          "Make the layout more mobile-friendly with better responsive design"
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="h-full p-6 bg-white">
              <div className="h-full border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <Layout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Component Preview</h3>
                  <p className="text-sm text-gray-500">
                    Preview of {currentTemplate.name} with your customizations will appear here
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}