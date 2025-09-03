/**
 * CartSlotsEditor.jsx - Editor version with Monaco code editor for individual slots
 * This component provides the exact same layout as Cart.jsx but with:
 * - Drag and drop capability
 * - Edit icons on each component
 * - Monaco editor modal for editing individual component code
 */

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import FlashMessage from "@/components/storefront/FlashMessage";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import RecommendedProducts from "@/components/storefront/RecommendedProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code } from "lucide-react";
import Editor from '@monaco-editor/react';

// Component code templates for each slot
const SLOT_CODE_TEMPLATES = {
  header: `// Header Component
function HeaderComponent({ flashMessage, setFlashMessage }) {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <CmsBlockRenderer position="cart_above_items" />
    </>
  );
}`,

  emptyCart: `// Empty Cart Component
function EmptyCartComponent({ store, getStoreBaseUrl, getExternalStoreUrl }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Button onClick={() => {
          const baseUrl = getStoreBaseUrl(store);
          window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
        }}>
          Continue Shopping
        </Button>
      </CardContent>
    </Card>
  );
}`,

  cartItem: `// Cart Item Component
function CartItemComponent({ item, product, formatDisplayPrice, updateQuantity, removeItem, currencySymbol, store, taxes, selectedCountry }) {
  const basePriceForDisplay = product.sale_price || product.price;
  const itemTotal = basePriceForDisplay * (item.quantity || 1);
  
  return (
    <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
      <img
        src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600">
          {formatDisplayPrice(basePriceForDisplay, currencySymbol, store, taxes, selectedCountry)} each
        </p>
        
        <div className="flex items-center space-x-3 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold">{item.quantity || 1}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeItem(item.id)}
            className="ml-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold">
          {formatDisplayPrice(itemTotal, currencySymbol, store, taxes, selectedCountry)}
        </p>
      </div>
    </div>
  );
}`,

  cartItems: `// Cart Items Section Component
function CartItemsSection({ cartItems, formatPrice, formatDisplayPrice, calculateItemTotal, updateQuantity, removeItem, currencySymbol, store, taxes, selectedCountry }) {
  return (
    <div className="lg:col-span-2">
      <Card>
        <CardContent className="px-4 divide-y divide-gray-200">
          {cartItems.map(item => {
            const product = item.product;
            if (!product) return null;
            
            return <CartItemComponent 
              key={item.id}
              item={item}
              product={product}
              formatDisplayPrice={formatDisplayPrice}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              currencySymbol={currencySymbol}
              store={store}
              taxes={taxes}
              selectedCountry={selectedCountry}
            />;
          })}
        </CardContent>
      </Card>
      <CmsBlockRenderer position="cart_below_items" />
    </div>
  );
}`,

  coupon: `// Coupon Section Component
function CouponSection({ appliedCoupon, couponCode, setCouponCode, handleApplyCoupon, handleRemoveCoupon, handleCouponKeyPress, currencySymbol, safeToFixed }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply Coupon</CardTitle>
      </CardHeader>
      <CardContent>
        {!appliedCoupon ? (
          <div className="flex space-x-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleCouponKeyPress}
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim()}
            >
              <Tag className="w-4 h-4 mr-2" /> Apply
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-800">
                Applied: {appliedCoupon.name}
              </p>
              <p className="text-xs text-green-600">
                {appliedCoupon.discount_type === 'fixed'
                  ? \`\${currencySymbol}\${safeToFixed(appliedCoupon.discount_value)} off\`
                  : \`\${safeToFixed(appliedCoupon.discount_value)}% off\`
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}`,

  orderSummary: `// Order Summary Component
function OrderSummarySection({ subtotal, discount, tax, total, currencySymbol, safeToFixed, settings, handleCheckout }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{currencySymbol}{safeToFixed(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="text-green-600">
              -{currencySymbol}{safeToFixed(discount)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{currencySymbol}{safeToFixed(tax)}</span>
        </div>
        <CmsBlockRenderer position="cart_above_total" />
        <div className="flex justify-between text-lg font-semibold border-t pt-4">
          <span>Total</span>
          <span>{currencySymbol}{safeToFixed(total)}</span>
        </div>
        <CmsBlockRenderer position="cart_below_total" />
        <div className="border-t mt-6 pt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            style={{
              backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
              color: '#FFFFFF',
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`,

  recommendedProducts: `// Recommended Products Component
function RecommendedProductsSection({ store }) {
  if (!store || !store.id) return null;
  
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Recommended Products</h2>
      <RecommendedProducts storeId={store.id} />
    </div>
  );
}`
};

// Editable section wrapper with drag handle and edit button
function EditableSection({ id, children, onEdit, isDraggable = true, className = "" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isDraggable 
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${className}`}
    >
      {isDraggable && (
        <button
          {...listeners}
          {...attributes}
          className="absolute -left-10 top-4 p-2 bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </button>
      )}
      
      <button
        onClick={() => onEdit(id)}
        className="absolute -right-10 top-4 p-2 bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-200"
        title="Edit component code"
      >
        <Edit className="w-4 h-4 text-blue-600" />
      </button>
      
      <div className="hover:ring-2 hover:ring-blue-200 rounded-lg transition-shadow">
        {children}
      </div>
    </div>
  );
}

// Main CartSlotsEditor component
export default function CartSlotsEditor({
  data = {},
  onSave = () => {},
}) {
  // State for component code
  const [componentCode, setComponentCode] = useState({ ...SLOT_CODE_TEMPLATES });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  
  // State for layout order
  const [mainSections, setMainSections] = useState(['header', 'content', 'recommendedProducts']);
  const [contentSections, setContentSections] = useState(['cartItems', 'sidebar']);
  
  // Sample data for preview
  const {
    store = { id: 1, slug: 'demo-store' },
    cartItems = [
      { 
        id: 1, 
        product: { 
          id: 1, 
          name: 'Sample Product', 
          price: 29.99,
          sale_price: 24.99,
          images: ['https://placehold.co/100x100?text=Product'],
        },
        quantity: 2,
        price: 24.99
      }
    ],
    appliedCoupon = null,
    couponCode = '',
    subtotal = 49.98,
    discount = 0,
    tax = 4.99,
    total = 54.97,
    currencySymbol = '$',
    settings = { theme: { checkout_button_color: '#007bff' } },
    flashMessage = null,
    selectedCountry = 'US',
    taxes = [],
  } = data;

  // Helper functions
  const safeToFixed = (val) => (val || 0).toFixed(2);
  const formatPrice = (value) => typeof value === "number" ? value : parseFloat(value) || 0;
  const formatDisplayPrice = (value) => `${currencySymbol}${(value || 0).toFixed(2)}`;
  const calculateItemTotal = (item, product) => (product?.sale_price || product?.price || 0) * (item?.quantity || 1);
  const getStoreBaseUrl = () => "/";
  const getExternalStoreUrl = () => "/shop";

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (['cartItems', 'sidebar'].includes(active.id)) {
      setContentSections((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Open code editor
  const handleEdit = useCallback((componentId) => {
    setEditingComponent(componentId);
    setTempCode(componentCode[componentId] || SLOT_CODE_TEMPLATES[componentId] || '// Component code');
  }, [componentCode]);

  // Save component code
  const handleSaveCode = useCallback(() => {
    if (editingComponent) {
      const newComponentCode = {
        ...componentCode,
        [editingComponent]: tempCode
      };
      setComponentCode(newComponentCode);
      
      // Save configuration
      onSave({
        componentCode: newComponentCode,
        contentSections,
        timestamp: new Date().toISOString()
      });
    }
    setEditingComponent(null);
    setTempCode('');
  }, [editingComponent, tempCode, componentCode, contentSections, onSave]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingComponent(null);
    setTempCode('');
  }, []);

  // Component sections
  const HeaderSection = () => (
    <EditableSection id="header" onEdit={handleEdit} isDraggable={false}>
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
        <FlashMessage message={flashMessage} onClose={() => {}} />
        <CmsBlockRenderer position="cart_above_items" />
      </div>
    </EditableSection>
  );

  const EmptyCartSection = () => (
    <EditableSection id="emptyCart" onEdit={handleEdit} isDraggable={false}>
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Button>Continue Shopping</Button>
        </CardContent>
      </Card>
    </EditableSection>
  );

  const CartItemsSection = () => (
    <EditableSection id="cartItems" onEdit={handleEdit} className="lg:col-span-2">
      <Card>
        <CardContent className="px-4 divide-y divide-gray-200">
          {cartItems.map(item => {
            const product = item.product;
            if (!product) return null;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleEdit('cartItem')}
                  className="absolute -right-6 top-2 p-1 bg-blue-100 rounded opacity-0 hover:opacity-100 transition-opacity"
                  title="Edit cart item component"
                >
                  <Code className="w-3 h-3 text-blue-600" />
                </button>
                <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-600">{formatDisplayPrice(product.sale_price || product.price)} each</p>
                    
                    <div className="flex items-center space-x-3 mt-3">
                      <Button size="sm" variant="outline"><Minus className="w-4 h-4" /></Button>
                      <span className="text-lg font-semibold">{item.quantity || 1}</span>
                      <Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" className="ml-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatDisplayPrice(calculateItemTotal(item, product))}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <CmsBlockRenderer position="cart_below_items" />
    </EditableSection>
  );

  const SidebarSection = () => (
    <EditableSection id="sidebar" onEdit={() => {}} isDraggable={true} className="lg:col-span-1 space-y-6">
      {/* Coupon Section */}
      <EditableSection id="coupon" onEdit={handleEdit} isDraggable={false}>
        <Card>
          <CardHeader><CardTitle>Apply Coupon</CardTitle></CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input placeholder="Enter coupon code" value={couponCode} readOnly />
              <Button><Tag className="w-4 h-4 mr-2" /> Apply</Button>
            </div>
          </CardContent>
        </Card>
      </EditableSection>

      {/* Order Summary Section */}
      <EditableSection id="orderSummary" onEdit={handleEdit} isDraggable={false}>
        <Card>
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{safeToFixed(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span></div>
            )}
            <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{safeToFixed(tax)}</span></div>
            <div className="flex justify-between text-lg font-semibold border-t pt-4">
              <span>Total</span><span>{currencySymbol}{safeToFixed(total)}</span>
            </div>
            <div className="border-t mt-6 pt-6">
              <Button size="lg" className="w-full" style={{ backgroundColor: settings?.theme?.checkout_button_color || '#007bff', color: '#FFFFFF' }}>
                Proceed to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </EditableSection>
    </EditableSection>
  );

  const RecommendedSection = () => (
    <EditableSection id="recommendedProducts" onEdit={handleEdit} isDraggable={false}>
      <div className="mt-12 p-8 bg-gray-100 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Recommended Products</h2>
        <p className="text-gray-600">RecommendedProducts component will appear here</p>
      </div>
    </EditableSection>
  );

  // Main render
  return (
    <>
      <div className="bg-gray-50 min-h-screen relative">
        <div className="pl-12 pr-12"> {/* Add padding for drag/edit handles */}
          <SeoHeadManager
            title="Cart Editor"
            description="Edit your cart layout"
            keywords="cart, editor, layout"
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <HeaderSection />
            
            {cartItems.length === 0 ? (
              <EmptyCartSection />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={contentSections} strategy={verticalListSortingStrategy}>
                  <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    {contentSections.map(sectionId => {
                      if (sectionId === 'cartItems') return <CartItemsSection key={sectionId} />;
                      if (sectionId === 'sidebar') return <SidebarSection key={sectionId} />;
                      return null;
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            
            <RecommendedSection />
          </div>
        </div>
      </div>

      {/* Monaco Editor Modal */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-5xl w-[90vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Edit {editingComponent ? editingComponent.charAt(0).toUpperCase() + editingComponent.slice(1).replace(/([A-Z])/g, ' $1').trim() : ''} Component
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={tempCode}
              onChange={(value) => setTempCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSaveCode}>
              <Save className="w-4 h-4 mr-2" /> Save Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}