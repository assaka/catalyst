/**
 * SlotPreview - Clear visual preview showing before/after slot changes
 * Provides real-time preview with easy-to-understand comparisons
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  ArrowLeftRight, 
  Smartphone, 
  Monitor, 
  Tablet,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Code
} from 'lucide-react';

import { ComponentSlotDefinitions } from './types.js';

const SlotPreview = ({
  defaultConfig = { version: '1.0', slots: {}, metadata: {} },
  userConfig = { version: '1.0', slots: {}, metadata: {} },
  componentName = 'ProductCard',
  componentProps = {},
  onError = () => {},
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [showComparison, setShowComparison] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const componentDef = ComponentSlotDefinitions[componentName] || {
    displayName: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  // Merge props for preview
  const previewProps = useMemo(() => ({
    ...componentDef.defaultProps,
    ...componentProps
  }), [componentDef.defaultProps, componentProps]);

  // Get active slots from user config
  const activeSlots = useMemo(() => {
    const slotsObj = userConfig.slots || {};
    return Object.entries(slotsObj)
      .filter(([id, config]) => config.enabled !== false)
      .map(([id, config]) => ({
        id,
        ...config,
        displayName: id.split('.').pop() || id
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [userConfig.slots]);

  // Mock component renderer for preview
  const MockComponentRenderer = ({ config, title }) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="text-xs text-gray-500 mb-2 font-medium">{title}</div>
      
      {/* Mock component structure */}
      <div className="space-y-3">
        {componentName === 'ProductCard' && (
          <>
            {/* Product Image Slot */}
            {config.slots?.['product.card.image'] && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
                <img 
                  src={previewProps.product?.images?.[0] || 'https://placehold.co/200x200?text=Product'} 
                  alt="Product" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <SlotBadge slotId="product.card.image" config={config.slots['product.card.image']} />
              </div>
            )}
            
            {/* Product Name Slot */}
            {config.slots?.['product.card.name'] && (
              <div className="relative">
                <h3 className="font-semibold text-lg">{previewProps.product?.name || 'Sample Product'}</h3>
                <SlotBadge slotId="product.card.name" config={config.slots['product.card.name']} />
              </div>
            )}
            
            {/* Pricing Slot */}
            {config.slots?.['product.card.pricing'] && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-600">
                    ${previewProps.product?.price || '29.99'}
                  </span>
                  {previewProps.product?.compare_price && (
                    <span className="text-sm text-gray-500 line-through">
                      ${previewProps.product.compare_price}
                    </span>
                  )}
                </div>
                <SlotBadge slotId="product.card.pricing" config={config.slots['product.card.pricing']} />
              </div>
            )}
            
            {/* Add to Cart Slot */}
            {config.slots?.['product.card.add_to_cart'] && (
              <div className="relative">
                <Button className="w-full" variant="default">
                  Add to Cart
                </Button>
                <SlotBadge slotId="product.card.add_to_cart" config={config.slots['product.card.add_to_cart']} />
              </div>
            )}
          </>
        )}
        
        {componentName === 'Cart' && (
          <>
            {/* Cart Header */}
            {config.slots?.['cart.page.header'] && (
              <div className="relative border-b pb-4">
                <h1 className="text-2xl font-bold">Shopping Cart</h1>
                <SlotBadge slotId="cart.page.header" config={config.slots['cart.page.header']} />
              </div>
            )}
            
            {/* Cart Items */}
            {config.slots?.['cart.items.container'] && (
              <div className="relative space-y-3">
                <div className="flex items-center gap-4 p-3 border rounded">
                  <img src="https://placehold.co/60x60?text=Item" alt="Item" className="w-15 h-15 rounded" />
                  <div className="flex-1">
                    <h4 className="font-medium">Sample Item</h4>
                    <p className="text-sm text-gray-600">Qty: 2</p>
                  </div>
                  <span className="font-semibold">$59.98</span>
                </div>
                <SlotBadge slotId="cart.items.container" config={config.slots['cart.items.container']} />
              </div>
            )}
            
            {/* Cart Summary */}
            {config.slots?.['cart.summary.order'] && (
              <div className="relative border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>$59.98</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>$64.78</span>
                  </div>
                </div>
                <SlotBadge slotId="cart.summary.order" config={config.slots['cart.summary.order']} />
              </div>
            )}
          </>
        )}

        {/* Show inactive slots */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500 mb-2">Inactive Slots:</div>
          <div className="flex flex-wrap gap-2">
            {componentDef.availableSlots
              .filter(slotId => !config.slots?.[slotId] || !config.slots[slotId].enabled)
              .map(slotId => (
                <Badge key={slotId} variant="outline" className="text-xs opacity-50">
                  {slotId.split('.').pop()}
                </Badge>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Slot badge component to show slot info
  const SlotBadge = ({ slotId, config }) => (
    <div className="absolute -top-1 -right-1">
      <Badge 
        variant={config.enabled ? 'default' : 'secondary'} 
        className="text-xs flex items-center gap-1"
      >
        <Zap className="w-2 h-2" />
        {slotId.split('.').pop()}
        {config.customCss && <span className="text-blue-300">CSS</span>}
        {config.customJs && <span className="text-yellow-300">JS</span>}
      </Badge>
    </div>
  );

  // Device frame component
  const DeviceFrame = ({ children, device }) => {
    const frameStyles = {
      desktop: 'w-full max-w-md mx-auto',
      tablet: 'w-full max-w-sm mx-auto', 
      mobile: 'w-full max-w-xs mx-auto'
    };

    return (
      <div className={`${frameStyles[device]} transition-all duration-300`}>
        <div className="bg-gray-100 p-2 rounded-t-lg border-x border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1 bg-white rounded text-center text-xs text-gray-500 py-1">
              {componentDef.displayName} Preview
            </div>
          </div>
        </div>
        <div className="border-x border-b rounded-b-lg overflow-hidden">
          {children}
        </div>
      </div>
    );
  };

  // Summary statistics
  const PreviewStats = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{activeSlots.length}</div>
            <div className="text-xs text-gray-500">Active Slots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {activeSlots.filter(s => s.customCss || s.customJs).length}
            </div>
            <div className="text-xs text-gray-500">Enhanced</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {componentDef.availableSlots.length - activeSlots.length}
            </div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`slot-preview ${className}`}>
      {/* Header Controls */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Device size controls */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className="h-7 w-7 p-0"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tablet')}
                  className="h-7 w-7 p-0"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className="h-7 w-7 p-0"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Comparison toggle */}
              <Button
                variant={showComparison ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preview Stats */}
      <PreviewStats />

      {/* Preview Content */}
      <Card>
        <CardContent className="p-6">
          {showComparison ? (
            /* Before/After Comparison */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Before (Default)
                </h3>
                <DeviceFrame device={viewMode}>
                  <MockComponentRenderer 
                    config={defaultConfig} 
                    title="Original Component"
                  />
                </DeviceFrame>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  After (Your Customization)
                </h3>
                <DeviceFrame device={viewMode}>
                  <MockComponentRenderer 
                    config={userConfig} 
                    title="Customized Component"
                  />
                </DeviceFrame>
              </div>
            </div>
          ) : (
            /* Single Preview */
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Your Customized {componentDef.displayName}
              </h3>
              <DeviceFrame device={viewMode}>
                <MockComponentRenderer 
                  config={userConfig} 
                  title="Live Preview"
                />
              </DeviceFrame>
            </div>
          )}

          {/* Active Slots Summary */}
          {activeSlots.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Active Slots:</h4>
              <div className="flex flex-wrap gap-2">
                {activeSlots.map(slot => (
                  <Badge key={slot.id} variant="default" className="flex items-center gap-1">
                    <span>{slot.displayName}</span>
                    {slot.customCss && <Code className="w-2 h-2" />}
                    {slot.customJs && <Zap className="w-2 h-2" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotPreview;