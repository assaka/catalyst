/**
 * CartSlottedEditor - Simple, focused editor for CartSlotted component
 * Shows code + live preview with easy slot management
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
  RefreshCw
} from 'lucide-react';
import CodeEditor from '@/components/ai-context/CodeEditor.jsx';
import apiClient from '@/api/client';

const CartSlottedEditor = ({
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State
  const [cartCode, setCartCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlots, setActiveSlots] = useState({});
  const [editingSlot, setEditingSlot] = useState(null);
  const [previewData, setPreviewData] = useState({
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

  // Available slots for CartSlotted
  const availableSlots = [
    {
      id: 'cart.page.header',
      name: 'Page Header',
      description: 'Title and cart summary at the top',
      defaultEnabled: true
    },
    {
      id: 'cart.empty.display',
      name: 'Empty Cart Message',
      description: 'Shown when cart has no items',
      defaultEnabled: true
    },
    {
      id: 'cart.items.container',
      name: 'Items List',
      description: 'Container for all cart items',
      defaultEnabled: true
    },
    {
      id: 'cart.item.single',
      name: 'Individual Item',
      description: 'Each product in the cart',
      defaultEnabled: true
    },
    {
      id: 'cart.sidebar.container',
      name: 'Sidebar',
      description: 'Right sidebar with summary',
      defaultEnabled: true
    },
    {
      id: 'cart.coupon.section',
      name: 'Coupon Code',
      description: 'Discount code input area',
      defaultEnabled: false
    },
    {
      id: 'cart.summary.order',
      name: 'Order Summary',
      description: 'Subtotal, tax, and total',
      defaultEnabled: true
    },
    {
      id: 'cart.checkout.button',
      name: 'Checkout Button',
      description: 'Primary checkout action',
      defaultEnabled: true
    }
  ];

  // Load CartSlotted.jsx code
  useEffect(() => {
    const loadCartCode = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`extensions/baseline/${encodeURIComponent('src/pages/CartSlotted.jsx')}`);
        
        if (data && data.success && data.data.hasBaseline) {
          setCartCode(data.data.baselineCode);
          
          // Initialize active slots from available slots
          const initialSlots = {};
          availableSlots.forEach(slot => {
            initialSlots[slot.id] = {
              enabled: slot.defaultEnabled,
              order: availableSlots.indexOf(slot) + 1,
              customCss: '',
              customJs: '',
              props: {}
            };
          });
          setActiveSlots(initialSlots);
        } else {
          // Fallback code
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
      } catch (error) {
        console.error('Error loading CartSlotted.jsx:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartCode();
  }, []);

  // Toggle slot enabled/disabled
  const toggleSlot = useCallback((slotId) => {
    setActiveSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        enabled: !prev[slotId]?.enabled
      }
    }));
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

  // Live preview component
  const LivePreview = () => (
    <div className="h-full bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        {/* Cart Header Slot */}
        {activeSlots['cart.page.header']?.enabled && (
          <div className="border-b p-6 relative">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Shopping Cart</h1>
                <p className="text-gray-600">{previewData.cartItems.length} items in your cart</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs">cart.page.header</Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Main Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items Container Slot */}
            {activeSlots['cart.items.container']?.enabled && (
              <div className="relative">
                <div className="absolute top-0 right-0">
                  <Badge variant="outline" className="text-xs">cart.items.container</Badge>
                </div>
                
                {previewData.cartItems.map(item => (
                  // Individual Item Slot
                  activeSlots['cart.item.single']?.enabled && (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg mb-3 relative">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="absolute top-1 right-1">
                        <Badge variant="outline" className="text-xs">cart.item.single</Badge>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Coupon Section Slot */}
            {activeSlots['cart.coupon.section']?.enabled && (
              <div className="border rounded-lg p-4 relative">
                <h3 className="font-medium mb-3">Discount Code</h3>
                <div className="flex gap-2">
                  <Input placeholder="Enter coupon code" className="flex-1" />
                  <Button>Apply</Button>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">cart.coupon.section</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {activeSlots['cart.sidebar.container']?.enabled && (
            <div className="relative">
              <div className="sticky top-4 space-y-4">
                <div className="absolute top-0 right-0 z-10">
                  <Badge variant="outline" className="text-xs">cart.sidebar.container</Badge>
                </div>

                {/* Order Summary Slot */}
                {activeSlots['cart.summary.order']?.enabled && (
                  <Card className="relative">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${previewData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${previewData.tax.toFixed(2)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${previewData.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-xs">cart.summary.order</Badge>
                    </div>
                  </Card>
                )}

                {/* Checkout Button Slot */}
                {activeSlots['cart.checkout.button']?.enabled && (
                  <div className="relative">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                    </Button>
                    <div className="absolute -top-2 right-2">
                      <Badge variant="outline" className="text-xs">cart.checkout.button</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Empty Cart Slot - Only show if no items */}
        {previewData.cartItems.length === 0 && activeSlots['cart.empty.display']?.enabled && (
          <div className="text-center py-12 relative">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some products to get started</p>
            <Button>Continue Shopping</Button>
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="text-xs">cart.empty.display</Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Slot configuration panel
  const SlotPanel = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Cart Slots
        </h3>
        <p className="text-sm text-gray-600">Toggle and configure cart sections</p>
      </div>

      <div className="p-4 space-y-3">
        {availableSlots.map(slot => {
          const slotConfig = activeSlots[slot.id] || {};
          const isEnabled = slotConfig.enabled;
          const hasEnhancements = slotConfig.customCss || slotConfig.customJs;

          return (
            <Card key={slot.id} className={`transition-all ${isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleSlot(slot.id)}
                    />
                    <div>
                      <h4 className="font-medium">{slot.name}</h4>
                      <p className="text-xs text-gray-600">{slot.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
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
                
                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  {slot.id}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Enhance {editingSlot.name}
            </DialogTitle>
            <DialogDescription>
              Add custom styling and behavior to this slot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4" />
                Custom CSS
              </Label>
              <Textarea
                placeholder="/* Your custom CSS styles */
.my-cart-header {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 2rem;
}"
                value={enhancement.customCss}
                onChange={(e) => setEnhancement({...enhancement, customCss: e.target.value})}
                className="font-mono text-sm"
                rows={8}
              />
            </div>

            <div>
              <Label className="text-base font-medium flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" />
                Custom JavaScript
              </Label>
              <Textarea
                placeholder="// Your custom JavaScript
console.log('Cart slot enhanced!');

// Add click tracking
document.querySelector('.my-slot').addEventListener('click', () => {
  analytics.track('cart_slot_clicked', { slot: '${editingSlot.id}' });
});"
                value={enhancement.customJs}
                onChange={(e) => setEnhancement({...enhancement, customJs: e.target.value})}
                className="font-mono text-sm"
                rows={8}
              />
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
    <div className={`cart-slotted-editor h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            CartSlotted Editor
          </h1>
          <p className="text-sm text-gray-600">Customize your shopping cart with slots</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ activeSlots, cartCode })}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium flex items-center gap-2">
              <Code className="w-4 h-4" />
              CartSlotted.jsx
            </h3>
          </div>
          <div className="flex-1">
            <CodeEditor
              value={cartCode}
              onChange={setCartCode}
              fileName="CartSlotted.jsx"
              language="javascript"
              className="h-full"
            />
          </div>
        </div>

        {/* Middle: Live Preview */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <LivePreview />
          </div>
        </div>

        {/* Right: Slot Configuration */}
        <div className="w-1/3 flex flex-col">
          <SlotPanel />
        </div>
      </div>

      {/* Enhancement Dialog */}
      <EnhancementDialog />
    </div>
  );
};

export default CartSlottedEditor;