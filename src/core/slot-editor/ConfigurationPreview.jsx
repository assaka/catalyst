/**
 * ConfigurationPreview - Live preview of slot configurations
 * Dynamically renders components with merged default and user configurations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye,
  RefreshCw,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Settings,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Import slot system
import { SlotRenderer, loadUserConfiguration, getSlotSystemState } from '@/core/slot-system';
import configMerger from '@/core/slot-system/ConfigMerger.js';
import { ComponentSlotDefinitions } from './types.js';

// Dynamic component imports
const ComponentRegistry = {
  ProductCard: React.lazy(() => import('@/components/storefront/ProductCardSlotted.jsx')),
  Cart: React.lazy(() => import('@/pages/CartSlotted.jsx')),
  // Add more components as needed
};

const ConfigurationPreview = ({
  defaultConfig = { version: '1.0', slots: {}, metadata: {} },
  userConfig = { version: '1.0', slots: {}, metadata: {} },
  componentName = 'ProductCard',
  componentProps = {},
  storeContext = {},
  className = '',
  onError = () => {}
}) => {
  // State management
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSlotInfo, setShowSlotInfo] = useState(false);
  const [mergedConfig, setMergedConfig] = useState(null);
  const [slotSystemState, setSlotSystemState] = useState(null);

  // Get component definition
  const componentDef = ComponentSlotDefinitions[componentName] || {
    name: componentName,
    displayName: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  // Merge configurations
  const effectiveConfig = useMemo(() => {
    try {
      const merged = configMerger.merge(defaultConfig, userConfig);
      setMergedConfig(merged);
      return merged;
    } catch (error) {
      console.error('Error merging configurations:', error);
      onError(error);
      return defaultConfig;
    }
  }, [defaultConfig, userConfig, onError]);

  // Apply configuration to slot system
  useEffect(() => {
    try {
      if (effectiveConfig && Object.keys(effectiveConfig.slots || {}).length > 0) {
        loadUserConfiguration(effectiveConfig);
        setSlotSystemState(getSlotSystemState());
      }
    } catch (error) {
      console.error('Error applying slot configuration:', error);
      setRenderError(error);
      onError(error);
    }
  }, [effectiveConfig, onError]);

  // Get component props with defaults
  const finalProps = useMemo(() => {
    return {
      ...componentDef.defaultProps,
      ...storeContext,
      ...componentProps
    };
  }, [componentDef.defaultProps, storeContext, componentProps]);

  // Handle preview refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRenderError(null);
    
    try {
      // Reload the slot system state
      if (effectiveConfig) {
        loadUserConfiguration(effectiveConfig);
        setSlotSystemState(getSlotSystemState());
      }
      
      // Small delay to show refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      setRenderError(error);
      onError(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [effectiveConfig, onError]);

  // Render preview content
  const renderPreviewContent = () => {
    if (renderError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            {renderError.message || 'Failed to render preview'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    // Get the component to render
    const Component = ComponentRegistry[componentName];
    
    if (!Component) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <AlertTriangle className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Component Not Found</h3>
          <p className="text-sm text-gray-600">
            Preview not available for component: {componentName}
          </p>
        </div>
      );
    }

    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      }>
        <React.ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Render Error</h3>
              <p className="text-sm text-gray-600 mb-4">
                Component failed to render with current configuration
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          }
        >
          <Component {...finalProps} />
        </React.ErrorBoundary>
      </React.Suspense>
    );
  };

  // Get viewport dimensions
  const getViewportDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-2xl';
      case 'desktop': 
      default: return 'max-w-6xl';
    }
  };

  // Render slot info panel
  const SlotInfoPanel = () => (
    <div className="border-t bg-gray-50 p-4 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4" />
        <span className="font-semibold">Active Slots</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {componentDef.availableSlots.map(slotId => {
          const isOverridden = effectiveConfig?.slots?.[slotId];
          const slotConfig = effectiveConfig?.slots?.[slotId] || {};
          
          return (
            <div key={slotId} className="bg-white p-2 rounded border">
              <div className="flex items-center justify-between mb-1">
                <code className="text-xs font-mono">{slotId}</code>
                <Badge 
                  variant={isOverridden ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {isOverridden ? 'Custom' : 'Default'}
                </Badge>
              </div>
              
              {isOverridden && (
                <div className="text-xs text-gray-600">
                  {slotConfig.enabled === false && (
                    <div className="text-red-600">• Disabled</div>
                  )}
                  {slotConfig.order && (
                    <div>• Order: {slotConfig.order}</div>
                  )}
                  {Object.keys(slotConfig.props || {}).length > 0 && (
                    <div>• Props: {Object.keys(slotConfig.props).length}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`slot-configuration-preview ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className="h-full">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <Badge variant="outline">
                {componentDef.displayName || componentName}
              </Badge>
              {mergedConfig && (
                <Badge variant="success">
                  {Object.keys(mergedConfig.slots || {}).length} slots configured
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Viewport controls */}
              <div className="flex border rounded">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="rounded-r-none"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="rounded-none border-x"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="rounded-l-none"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSlotInfo(!showSlotInfo)}
                title="Toggle slot information"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh preview"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            {/* Preview viewport */}
            <div className="flex-1 p-6 bg-gray-50">
              <div className={`mx-auto transition-all duration-300 ${getViewportDimensions()}`}>
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {renderPreviewContent()}
                </div>
              </div>
            </div>

            {/* Slot information panel */}
            {showSlotInfo && <SlotInfoPanel />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Error boundary component
class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Preview component error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Component Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            {this.state.error?.message || 'Component failed to render'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped component with error boundary
const ConfigurationPreviewWithErrorBoundary = (props) => (
  <PreviewErrorBoundary onError={props.onError}>
    <ConfigurationPreview {...props} />
  </PreviewErrorBoundary>
);

export default ConfigurationPreviewWithErrorBoundary;