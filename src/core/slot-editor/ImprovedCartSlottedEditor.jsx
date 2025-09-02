/**
 * ImprovedCartSlottedEditor - Clean No-Code + Advanced modes for CartSlotted
 * No-Code: Preview + drag & drop
 * Advanced: Code + slots management + preview (responsive layout)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Eye, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2,
  Palette,
  Zap,
  ShoppingCart,
  Save,
  RefreshCw,
  GripVertical,
  Monitor,
  Wand2
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CodeEditor from '@/components/ai-context/CodeEditor.jsx';
import apiClient from '@/api/client';

// Import actual cart slot components
import {
  CartPageContainer,
  CartPageHeader,
  EmptyCartDisplay,
  CartItemsContainer,
  CartItem,
  CartSidebar,
  CouponSection,
  OrderSummary,
  CheckoutButton,
  CartGridLayout
} from '@/core/slot-system/default-components/CartSlots.jsx';

// Import slot system
import { SlotRenderer } from '@/core/slot-system';

const ImprovedCartSlottedEditor = ({
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State
  const [mode, setMode] = useState('no-code'); // 'no-code' | 'advanced'
  const [cartCode, setCartCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlots, setActiveSlots] = useState({});
  const [slotOrder, setSlotOrder] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  // Preview data
  const [previewData] = useState({
    cartItems: [
      {
        id: 1,
        product_id: 1,
        quantity: 2,
        price: 29.99,
        product: {
          id: 1,
          name: 'Premium T-Shirt',
          price: 29.99,
          images: ['https://placehold.co/80x80?text=Shirt']
        }
      },
      {
        id: 2,
        product_id: 2,
        quantity: 1,
        price: 49.99,
        product: {
          id: 2,
          name: 'Wireless Headphones',
          price: 49.99,
          images: ['https://placehold.co/80x80?text=Audio']
        }
      }
    ],
    subtotal: 109.97,
    tax: 8.80,
    total: 118.77
  });

  // Available slots for CartSlotted (based on actual slot system)
  const availableSlots = [
    {
      id: 'cart.page.container',
      name: 'Page Container',
      description: 'Main cart page wrapper with styling',
      defaultEnabled: true,
      icon: '📄',
      component: 'CartPageContainer'
    },
    {
      id: 'cart.page.header',
      name: 'Page Header',
      description: 'Cart title and main heading',
      defaultEnabled: true,
      icon: '📋',
      component: 'CartPageHeader'
    },
    {
      id: 'cart.grid.layout',
      name: 'Grid Layout',
      description: 'Responsive grid container for cart and sidebar',
      defaultEnabled: true,
      icon: '⚏',
      component: 'CartGridLayout'
    },
    {
      id: 'cart.empty.display',
      name: 'Empty Cart Message',
      description: 'Shown when cart has no items',
      defaultEnabled: true,
      icon: '🛒',
      component: 'EmptyCartDisplay'
    },
    {
      id: 'cart.items.container',
      name: 'Items Container',
      description: 'Container for all cart items',
      defaultEnabled: true,
      icon: '📦',
      component: 'CartItemsContainer'
    },
    {
      id: 'cart.item.single',
      name: 'Individual Item',
      description: 'Each product in the cart with controls',
      defaultEnabled: true,
      icon: '🏷️',
      component: 'CartItem'
    },
    {
      id: 'cart.sidebar.container',
      name: 'Sidebar',
      description: 'Right sidebar container',
      defaultEnabled: true,
      icon: '📊',
      component: 'CartSidebar'
    },
    {
      id: 'cart.coupon.section',
      name: 'Coupon Code',
      description: 'Discount code input area',
      defaultEnabled: false,
      icon: '🎫',
      component: 'CouponSection'
    },
    {
      id: 'cart.summary.order',
      name: 'Order Summary',
      description: 'Subtotal, tax, and total calculations',
      defaultEnabled: true,
      icon: '🧾',
      component: 'OrderSummary'
    },
    {
      id: 'cart.checkout.button',
      name: 'Checkout Button',
      description: 'Primary checkout action button',
      defaultEnabled: true,
      icon: '💳',
      component: 'CheckoutButton'
    }
  ];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load CartSlotted.jsx code
  useEffect(() => {
    const loadCartCode = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`extensions/baseline/${encodeURIComponent('src/pages/CartSlotted.jsx')}`);
        
        if (data && data.success && data.data.hasBaseline) {
          setCartCode(data.data.baselineCode);
        } else {
          setCartCode(`import React from 'react';

const CartSlotted = () => {
  return (
    <div className="container mx-auto p-6">
      <h1>Shopping Cart</h1>
      <p>Cart component with slotted architecture</p>
    </div>
  );
};

export default CartSlotted;`);
        }
        
        // Initialize active slots
        const initialSlots = {};
        const initialOrder = [];
        availableSlots.forEach((slot, index) => {
          initialSlots[slot.id] = {
            enabled: slot.defaultEnabled,
            order: index + 1,
            customCss: '',
            customJs: '',
            props: {}
          };
          if (slot.defaultEnabled) {
            initialOrder.push(slot.id);
          }
        });
        setActiveSlots(initialSlots);
        setSlotOrder(initialOrder);
        
      } catch (error) {
        console.error('Error loading CartSlotted.jsx:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartCode();
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setSlotOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  // Toggle slot enabled/disabled
  const toggleSlot = useCallback((slotId) => {
    setActiveSlots(prev => {
      const newSlots = {
        ...prev,
        [slotId]: {
          ...prev[slotId],
          enabled: !prev[slotId]?.enabled
        }
      };
      
      // Update slot order based on enabled state
      setSlotOrder(prevOrder => {
        if (newSlots[slotId].enabled && !prevOrder.includes(slotId)) {
          return [...prevOrder, slotId];
        } else if (!newSlots[slotId].enabled && prevOrder.includes(slotId)) {
          return prevOrder.filter(id => id !== slotId);
        }
        return prevOrder;
      });
      
      return newSlots;
    });
  }, []);

  // Save slot enhancement
  const saveSlotEnhancement = useCallback((slotId, enhancement) => {
    setActiveSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        customCss: enhancement.customCss || '',
        customJs: enhancement.customJs || '',
        props: enhancement.props || {}
      }
    }));
    setEditingSlot(null);
  }, []);

  // Sortable slot item for drag & drop
  const SortableSlotItem = ({ slotId }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: slotId });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const slot = availableSlots.find(s => s.id === slotId);
    const slotConfig = activeSlots[slotId] || {};

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 border rounded-lg bg-white shadow-sm flex items-center gap-3 ${
          isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
        }`}
      >
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="text-2xl">{slot.icon}</div>
        
        <div className="flex-1">
          <h4 className="font-medium">{slot.name}</h4>
          <p className="text-sm text-gray-600">{slot.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {(slotConfig.customCss || slotConfig.customJs) && (
            <Badge variant="info" className="text-xs">Enhanced</Badge>
          )}
          
          {mode === 'advanced' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSlot(slot)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Live preview component using actual cart slots
  const LivePreview = ({ showBadges = true }) => {
    // Mock store data for preview
    const mockStore = {
      id: 1,
      slug: 'preview-store',
      name: 'Preview Store'
    };
    
    const mockSettings = {
      currency_symbol: '$',
      theme: {
        checkout_button_color: '#007bff'
      }
    };

    return (
      <div className="h-full bg-gray-50 p-4 overflow-y-auto">
        {slotOrder.includes('cart.page.container') && activeSlots['cart.page.container']?.enabled ? (
          <CartPageContainer>
            {renderSlotContent()}
          </CartPageContainer>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-12">
            {renderSlotContent()}
          </div>
        )}
      </div>
    );

    function renderSlotContent() {
      return (
        <>
          {/* Page Header */}
          {slotOrder.includes('cart.page.header') && activeSlots['cart.page.header']?.enabled && (
            <div className="relative mb-8">
              <CartPageHeader title="My Cart" />
              {showBadges && mode === 'advanced' && (
                <div className="absolute top-0 right-0">
                  <Badge variant="outline" className="text-xs bg-white">
                    📋 Page Header
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Grid Layout */}
          {slotOrder.includes('cart.grid.layout') && activeSlots['cart.grid.layout']?.enabled ? (
            <CartGridLayout>
              {renderGridContent()}
            </CartGridLayout>
          ) : (
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {renderGridContent()}
            </div>
          )}
        </>
      );
    }

    function renderGridContent() {
      return (
        <>
          {/* Items Container */}
          {slotOrder.includes('cart.items.container') && activeSlots['cart.items.container']?.enabled && (
            <div className="relative">
              <CartItemsContainer>
                {previewData.cartItems.length > 0 ? (
                  previewData.cartItems.map(item => (
                    slotOrder.includes('cart.item.single') && activeSlots['cart.item.single']?.enabled && (
                      <CartItem
                        key={item.id}
                        item={item}
                        product={item.product}
                        currencySymbol="$"
                        store={mockStore}
                        taxes={[]}
                        selectedCountry="US"
                        onUpdateQuantity={() => {}}
                        onRemove={() => {}}
                        calculateItemTotal={(item) => item.price * item.quantity}
                        formatPrice={(value) => parseFloat(value) || 0}
                      />
                    )
                  ))
                ) : (
                  slotOrder.includes('cart.empty.display') && activeSlots['cart.empty.display']?.enabled && (
                    <EmptyCartDisplay store={mockStore} />
                  )
                )}
              </CartItemsContainer>
              {showBadges && mode === 'advanced' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs bg-white">
                    📦 Items Container
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Sidebar */}
          {slotOrder.includes('cart.sidebar.container') && activeSlots['cart.sidebar.container']?.enabled && (
            <div className="relative">
              <CartSidebar>
                {/* Coupon Section */}
                {slotOrder.includes('cart.coupon.section') && activeSlots['cart.coupon.section']?.enabled && (
                  <div className="relative">
                    <CouponSection
                      appliedCoupon={null}
                      couponCode=""
                      onCouponCodeChange={() => {}}
                      onApplyCoupon={() => {}}
                      onRemoveCoupon={() => {}}
                      onKeyPress={() => {}}
                      currencySymbol="$"
                      safeToFixed={(val) => parseFloat(val).toFixed(2)}
                    />
                    {showBadges && mode === 'advanced' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs bg-white">
                          🎫 Coupon Code
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Order Summary */}
                {slotOrder.includes('cart.summary.order') && activeSlots['cart.summary.order']?.enabled && (
                  <div className="relative">
                    <OrderSummary
                      subtotal={previewData.subtotal}
                      discount={0}
                      tax={previewData.tax}
                      total={previewData.total}
                      currencySymbol="$"
                      safeToFixed={(val) => parseFloat(val).toFixed(2)}
                    />
                    {showBadges && mode === 'advanced' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs bg-white">
                          🧾 Order Summary
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Checkout Button */}
                {slotOrder.includes('cart.checkout.button') && activeSlots['cart.checkout.button']?.enabled && (
                  <div className="relative">
                    <CheckoutButton
                      onCheckout={() => {}}
                      settings={mockSettings}
                    />
                    {showBadges && mode === 'advanced' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs bg-white">
                          💳 Checkout Button
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CartSidebar>
              {showBadges && mode === 'advanced' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs bg-white">
                    📊 Sidebar
                  </Badge>
                </div>
              )}
            </div>
          )}
        </>
      );
    }
  };

  // Slot enhancement dialog
  const EnhancementDialog = () => {
    const [enhancement, setEnhancement] = useState({
      customCss: editingSlot ? activeSlots[editingSlot.id]?.customCss || '' : '',
      customJs: editingSlot ? activeSlots[editingSlot.id]?.customJs || '' : '',
      props: editingSlot ? activeSlots[editingSlot.id]?.props || {} : {}
    });

    if (!editingSlot) return null;

    return (
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Enhance {editingSlot.icon} {editingSlot.name}
            </DialogTitle>
            <DialogDescription>
              Add custom styling and behavior to this slot
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4" />
                  Custom CSS
                </Label>
                <Textarea
                  placeholder={`/* Style the ${editingSlot.name.toLowerCase()} */
.my-${editingSlot.id.replace(/\./g, '-')} {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.my-${editingSlot.id.replace(/\./g, '-')}:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}`}
                  value={enhancement.customCss}
                  onChange={(e) => setEnhancement({...enhancement, customCss: e.target.value})}
                  className="font-mono text-sm"
                  rows={12}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  Custom JavaScript
                </Label>
                <Textarea
                  placeholder={`// Add behavior to ${editingSlot.name.toLowerCase()}
console.log('${editingSlot.name} slot enhanced!');

// Add click tracking
document.addEventListener('DOMContentLoaded', () => {
  const slot = document.querySelector('[data-slot="${editingSlot.id}"]');
  
  if (slot) {
    slot.addEventListener('click', () => {
      // Analytics tracking
      analytics.track('cart_slot_clicked', {
        slot_id: '${editingSlot.id}',
        slot_name: '${editingSlot.name}',
        timestamp: new Date().toISOString()
      });
    });
    
    // Add custom behavior
    slot.classList.add('enhanced-slot');
  }
});`}
                  value={enhancement.customJs}
                  onChange={(e) => setEnhancement({...enhancement, customJs: e.target.value})}
                  className="font-mono text-sm"
                  rows={12}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              Cancel
            </Button>
            <Button onClick={() => saveSlotEnhancement(editingSlot.id, enhancement)}>
              <Save className="w-4 h-4 mr-2" />
              Save Enhancement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading CartSlotted.jsx...</span>
      </div>
    );
  }

  return (
    <div className={`improved-cart-editor h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            CartSlotted Editor
          </h1>
          <p className="text-sm text-gray-600">Customize your shopping cart</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="no-code" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                No-Code
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave({ mode, activeSlots, slotOrder, cartCode })}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'no-code' ? (
          /* NO-CODE MODE: Preview + Drag & Drop */
          <div className="h-full grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
            {/* Left: Drag & Drop Slots */}
            <div className="xl:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GripVertical className="w-5 h-5" />
                    Drag to Reorder Slots
                  </CardTitle>
                  <p className="text-sm text-gray-600">Drag slots to change their position</p>
                </CardHeader>
                <CardContent className="p-4 h-full overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={slotOrder} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {slotOrder.map(slotId => (
                          <SortableSlotItem key={slotId} slotId={slotId} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  {/* Available Slots to Add */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3 text-gray-700">Available Slots</h4>
                    <div className="space-y-2">
                      {availableSlots
                        .filter(slot => !activeSlots[slot.id]?.enabled)
                        .map(slot => (
                          <div
                            key={slot.id}
                            className="p-3 border rounded-lg bg-gray-50 flex items-center gap-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => toggleSlot(slot.id)}
                          >
                            <div className="text-xl">{slot.icon}</div>
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{slot.name}</h5>
                              <p className="text-xs text-gray-600">{slot.description}</p>
                            </div>
                            <Plus className="w-4 h-4 text-blue-600" />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right: Live Preview */}
            <div className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <LivePreview showBadges={false} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* ADVANCED MODE: Responsive Layout */
          <div className="h-full flex flex-col">
            {/* Top: Code Editor */}
            <div className="h-1/2 border-b">
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                <Card className="h-full">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      CartSlotted.jsx
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-full">
                    <CodeEditor
                      value={cartCode}
                      onChange={setCartCode}
                      fileName="CartSlotted.jsx"
                      language="javascript"
                      className="h-full"
                    />
                  </CardContent>
                </Card>
                
                {/* Toggle Preview Button */}
                <div className="lg:hidden flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="mb-2"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>
                
                {/* Preview - Hidden on small screens, toggle-able */}
                <Card className={`h-full ${showPreview ? 'block' : 'hidden lg:block'}`}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-full">
                    <LivePreview />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom: Slot Management */}
            <div className="h-1/2 overflow-hidden">
              <Card className="h-full m-4 mt-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Slot Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-full overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSlots.map(slot => {
                      const slotConfig = activeSlots[slot.id] || {};
                      const isEnabled = slotConfig.enabled;
                      const hasEnhancements = slotConfig.customCss || slotConfig.customJs;

                      return (
                        <Card key={slot.id} className={`transition-all ${isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{slot.icon}</div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => toggleSlot(slot.id)}
                                />
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                {hasEnhancements && (
                                  <Badge variant="info" className="text-xs">Enhanced</Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingSlot(slot)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm">{slot.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{slot.description}</p>
                              <div className="text-xs text-gray-400 font-mono mt-2 bg-gray-100 px-2 py-1 rounded">
                                {slot.id}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Enhancement Dialog */}
      <EnhancementDialog />
    </div>
  );
};

export default ImprovedCartSlottedEditor;