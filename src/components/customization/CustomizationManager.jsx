import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  EyeOff, 
  Play, 
  Square, 
  Settings, 
  Code, 
  Palette, 
  Zap,
  Save,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';

import customizationEngine from '@/core/CustomizationEngine';
import apiClient from '@/api/client';
import { cn } from '@/lib/utils';

/**
 * Customization Manager Component
 * Provides UI for creating, previewing, and publishing customizations
 */
const CustomizationManager = ({ 
  storeId, 
  targetComponent = 'global',
  className = ''
}) => {
  const [customizations, setCustomizations] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCustomization, setSelectedCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  
  // Form states for different customization types
  const [layoutForm, setLayoutForm] = useState({
    name: '',
    description: '',
    selector: '',
    action: 'modify',
    properties: {}
  });
  
  const [cssForm, setCssForm] = useState({
    name: '',
    description: '',
    css: '',
    scope: 'global',
    media: 'all'
  });
  
  const [jsForm, setJsForm] = useState({
    name: '',
    description: '',
    code: '',
    timing: 'dom_ready',
    dependencies: []
  });

  // Load existing customizations
  const loadCustomizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('customizations', {
        params: { store_id: storeId }
      });
      
      if (response.success) {
        setCustomizations(response.data.customizations);
      }
    } catch (error) {
      console.error('❌ Error loading customizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  // Initialize component
  useEffect(() => {
    loadCustomizations();
    
    // Initialize customization engine
    customizationEngine.initialize(storeId, {
      page: 'customization-manager',
      component: targetComponent
    });

    // Listen for preview mode changes
    const handlePreviewToggle = (event) => {
      setPreviewMode(event.detail?.isPreview || false);
    };

    window.addEventListener('customization.previewToggle', handlePreviewToggle);
    
    return () => {
      window.removeEventListener('customization.previewToggle', handlePreviewToggle);
    };
  }, [storeId, targetComponent, loadCustomizations]);

  // Toggle preview mode
  const togglePreviewMode = () => {
    const newPreviewMode = customizationEngine.togglePreviewMode();
    setPreviewMode(newPreviewMode);
  };

  // Create a new customization
  const createCustomization = async (type, formData) => {
    setIsLoading(true);
    try {
      let customizationData = {};
      let targetSelector = '';
      
      switch (type) {
        case 'layout_modification':
          customizationData = {
            modifications: [{
              action: formData.action,
              selector: formData.selector,
              properties: formData.properties
            }]
          };
          targetSelector = formData.selector;
          break;
          
        case 'css_injection':
          customizationData = {
            css: formData.css,
            scope: formData.scope,
            media: formData.media
          };
          break;
          
        case 'javascript_injection':
          customizationData = {
            code: formData.code,
            timing: formData.timing,
            dependencies: formData.dependencies
          };
          break;
      }

      const response = await apiClient.post('customizations', {
        type,
        name: formData.name,
        description: formData.description,
        targetComponent,
        targetSelector,
        customizationData,
        priority: 10
      }, {
        params: { store_id: storeId }
      });

      if (response.success) {
        await loadCustomizations();
        
        // Add to preview if in preview mode
        if (previewMode) {
          customizationEngine.addToPreview({
            customizationId: response.data.id,
            type: type.replace('_', ''),
            data: customizationData
          });
        }

        // Reset form
        resetForm(type);
        
        console.log('✅ Customization created successfully');
      } else {
        console.error('❌ Error creating customization:', response.error);
      }

    } catch (error) {
      console.error('❌ Error creating customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Preview a single customization
  const previewCustomization = async (customization) => {
    try {
      // Enable preview mode if not already enabled
      if (!previewMode) {
        togglePreviewMode();
      }

      // Add to preview
      customizationEngine.addToPreview({
        customizationId: customization.id,
        type: customization.type.replace('_', ''),
        data: customization.customization_data
      });

      setSelectedCustomization(customization);
      console.log('👁️ Previewing customization:', customization.name);

    } catch (error) {
      console.error('❌ Error previewing customization:', error);
    }
  };

  // Publish customizations (make them live)
  const publishCustomizations = async (customizationIds) => {
    setIsLoading(true);
    try {
      await customizationEngine.publishCustomizations(storeId, customizationIds);
      await loadCustomizations();
      
      console.log('🚀 Customizations published successfully');

    } catch (error) {
      console.error('❌ Error publishing customizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form based on type
  const resetForm = (type) => {
    switch (type) {
      case 'layout_modification':
        setLayoutForm({
          name: '',
          description: '',
          selector: '',
          action: 'modify',
          properties: {}
        });
        break;
      case 'css_injection':
        setCssForm({
          name: '',
          description: '',
          css: '',
          scope: 'global',
          media: 'all'
        });
        break;
      case 'javascript_injection':
        setJsForm({
          name: '',
          description: '',
          code: '',
          timing: 'dom_ready',
          dependencies: []
        });
        break;
    }
  };

  // Render layout customization form
  const renderLayoutForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={layoutForm.name}
          onChange={(e) => setLayoutForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Hide sidebar on mobile"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={layoutForm.description}
          onChange={(e) => setLayoutForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What does this customization do?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">CSS Selector</label>
        <Input
          value={layoutForm.selector}
          onChange={(e) => setLayoutForm(prev => ({ ...prev, selector: e.target.value }))}
          placeholder="e.g., .sidebar, #header, .cart-button"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Action</label>
        <Select
          value={layoutForm.action}
          onValueChange={(value) => setLayoutForm(prev => ({ ...prev, action: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modify">Modify Properties</SelectItem>
            <SelectItem value="hide">Hide Element</SelectItem>
            <SelectItem value="move">Move Element</SelectItem>
            <SelectItem value="resize">Resize Element</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {layoutForm.action === 'modify' && (
        <div>
          <label className="block text-sm font-medium mb-2">CSS Properties (JSON)</label>
          <Textarea
            value={JSON.stringify(layoutForm.properties, null, 2)}
            onChange={(e) => {
              try {
                const properties = JSON.parse(e.target.value);
                setLayoutForm(prev => ({ ...prev, properties }));
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"backgroundColor": "#007bff", "padding": "20px"}'
            rows={4}
          />
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button
          onClick={() => createCustomization('layout_modification', layoutForm)}
          disabled={!layoutForm.name || !layoutForm.selector}
        >
          <Settings className="w-4 h-4 mr-2" />
          Create Layout Customization
        </Button>
        
        <Button
          variant="outline"
          onClick={() => resetForm('layout_modification')}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  // Render CSS customization form
  const renderCSSForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={cssForm.name}
          onChange={(e) => setCssForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Custom button styles"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={cssForm.description}
          onChange={(e) => setCssForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What does this CSS do?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">CSS Code</label>
        <Textarea
          value={cssForm.css}
          onChange={(e) => setCssForm(prev => ({ ...prev, css: e.target.value }))}
          placeholder={`.custom-button {
  background: linear-gradient(45deg, #007bff, #28a745);
  border-radius: 8px;
  color: white;
  padding: 12px 24px;
}`}
          rows={8}
          className="font-mono text-sm"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scope</label>
          <Select
            value={cssForm.scope}
            onValueChange={(value) => setCssForm(prev => ({ ...prev, scope: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value=".page-cart">Cart Page Only</SelectItem>
              <SelectItem value=".page-checkout">Checkout Page Only</SelectItem>
              <SelectItem value=".mobile-only">Mobile Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Media Query</label>
          <Select
            value={cssForm.media}
            onValueChange={(value) => setCssForm(prev => ({ ...prev, media: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="screen and (max-width: 768px)">Mobile Only</SelectItem>
              <SelectItem value="screen and (min-width: 769px)">Desktop Only</SelectItem>
              <SelectItem value="print">Print Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          onClick={() => createCustomization('css_injection', cssForm)}
          disabled={!cssForm.name || !cssForm.css}
        >
          <Palette className="w-4 h-4 mr-2" />
          Create CSS Customization
        </Button>
        
        <Button
          variant="outline"
          onClick={() => resetForm('css_injection')}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  // Render JavaScript customization form
  const renderJavaScriptForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={jsForm.name}
          onChange={(e) => setJsForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Custom analytics tracking"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={jsForm.description}
          onChange={(e) => setJsForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What does this JavaScript do?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">JavaScript Code</label>
        <Textarea
          value={jsForm.code}
          onChange={(e) => setJsForm(prev => ({ ...prev, code: e.target.value }))}
          placeholder={`// Custom JavaScript code
console.log('Custom script loaded!');

// Example: Add click tracking
document.querySelectorAll('.track-click').forEach(el => {
  el.addEventListener('click', () => {
    console.log('Button clicked:', el.textContent);
    // Send to analytics...
  });
});`}
          rows={10}
          className="font-mono text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Execution Timing</label>
        <Select
          value={jsForm.timing}
          onValueChange={(value) => setJsForm(prev => ({ ...prev, timing: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="dom_ready">DOM Ready</SelectItem>
            <SelectItem value="window_load">Window Load</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex space-x-2">
        <Button
          onClick={() => createCustomization('javascript_injection', jsForm)}
          disabled={!jsForm.name || !jsForm.code}
        >
          <Code className="w-4 h-4 mr-2" />
          Create JavaScript Customization
        </Button>
        
        <Button
          variant="outline"
          onClick={() => resetForm('javascript_injection')}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Preview Toggle */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Customization Manager</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create, preview, and publish customizations for your store
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={previewMode ? "default" : "outline"}
                size="sm"
                onClick={togglePreviewMode}
              >
                {previewMode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Mode
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadCustomizations}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
          
          {previewMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Preview Mode Active
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Changes are visible only to you. Publish to make them live for all users.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Customization Creation Forms */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Create New Customization</h3>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="layout">
                <Settings className="w-4 h-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="css">
                <Palette className="w-4 h-4 mr-2" />
                CSS
              </TabsTrigger>
              <TabsTrigger value="javascript">
                <Code className="w-4 h-4 mr-2" />
                JavaScript
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="layout" className="mt-4">
              {renderLayoutForm()}
            </TabsContent>
            
            <TabsContent value="css" className="mt-4">
              {renderCSSForm()}
            </TabsContent>
            
            <TabsContent value="javascript" className="mt-4">
              {renderJavaScriptForm()}
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Existing Customizations */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Existing Customizations</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading customizations...</span>
            </div>
          ) : customizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No customizations created yet</p>
              <p className="text-sm">Create your first customization using the forms above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customizations.map((customization) => (
                <div
                  key={customization.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{customization.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {customization.type.replace('_', ' ')}
                      </Badge>
                      {customization.is_active && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    {customization.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {customization.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewCustomization(customization)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => publishCustomizations([customization.id])}
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomizationManager;