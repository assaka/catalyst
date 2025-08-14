import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Layers, Save } from 'lucide-react';

// Simplified component templates
const SIMPLE_TEMPLATES = {
  'homepage-hero': {
    name: 'Homepage Hero Section',
    description: 'Main hero section for homepage',
    defaultCode: `// Homepage Hero Customization
const heroStyles = {
  backgroundColor: '#ffffff',
  color: '#000000',
  padding: '4rem 1rem',
  textAlign: 'center'
};

const heroContent = {
  headline: 'Welcome to Our Store',
  subheadline: 'Discover amazing products',
  buttonText: 'Shop Now'
};`
  },
  'product-card': {
    name: 'Product Card',
    description: 'Individual product display card',
    defaultCode: `// Product Card Customization
const cardStyles = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem'
};

const cardOptions = {
  showPrice: true,
  showRating: true,
  showAddToCart: true
};`
  }
};

export default function OverlayEditorSimple() {
  const [selectedTemplate, setSelectedTemplate] = useState('homepage-hero');
  const [customCode, setCustomCode] = useState(SIMPLE_TEMPLATES[selectedTemplate].defaultCode);
  const [isLoading, setIsLoading] = useState(false);

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    setCustomCode(SIMPLE_TEMPLATES[templateKey].defaultCode);
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate save operation
    setTimeout(() => {
      setIsLoading(false);
      alert('Customization saved!');
    }, 1000);
  };

  const currentTemplate = SIMPLE_TEMPLATES[selectedTemplate];

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
            {Object.entries(SIMPLE_TEMPLATES).map(([key, template]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === key 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleTemplateChange(key)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button 
            onClick={handleSave}
            className="w-full"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">{currentTemplate.name}</h2>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Component Customization Code
              </label>
              <Textarea
                id="code"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="h-96 font-mono text-sm"
                placeholder="Enter your customization code here..."
              />
            </div>
            <p className="text-sm text-gray-600">
              Modify the template above to customize the {currentTemplate.name} component. 
              Your changes will be overlaid on top of the base component during deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}