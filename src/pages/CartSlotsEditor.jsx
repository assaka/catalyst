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
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2 } from "lucide-react";
import Editor from '@monaco-editor/react';

// Component code templates for each slot
const SLOT_CODE_TEMPLATES = {
  header: `// Header Component
function HeaderComponent({ flashMessage, setFlashMessage }) {
  return (
    <>
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
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
function CartItemComponent({ item, product, basePriceForDisplay, itemTotal, formatDisplayPrice, updateQuantity, removeItem, currencySymbol, store, taxes, selectedCountry }) {
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
        
        {item.selected_options && item.selected_options.length > 0 && (
          <div className="text-sm text-gray-500 mt-1">
            {item.selected_options.map((option, idx) => (
              <div key={idx}>
                + {option.name} (+{formatDisplayPrice(option.price, currencySymbol, store, taxes, selectedCountry)})
              </div>
            ))}
          </div>
        )}
        
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
    <Card>
      <CardContent className="px-4 divide-y divide-gray-200">
        {cartItems.map(item => {
          const product = item.product;
          if (!product) return null;
          
          // Calculate display price
          let basePriceForDisplay;
          const itemPriceAsNumber = formatPrice(item.price);
          
          if (itemPriceAsNumber > 0) {
            basePriceForDisplay = itemPriceAsNumber;
          } else {
            let productCurrentPrice = formatPrice(product.sale_price || product.price);
            const comparePrice = formatPrice(product.compare_price);
            if (comparePrice > 0 && comparePrice < productCurrentPrice) {
              basePriceForDisplay = comparePrice;
            } else {
              basePriceForDisplay = productCurrentPrice;
            }
          }
          
          const itemTotal = calculateItemTotal(item, product);
          
          return <CartItemComponent 
            key={item.id}
            item={item}
            product={product}
            basePriceForDisplay={basePriceForDisplay}
            itemTotal={itemTotal}
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
          className="absolute -left-10 top-4 p-2 bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 cursor-grab active:cursor-grabbing z-10"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </button>
      )}
      
      {onEdit && (
        <button
          onClick={() => onEdit(id)}
          className="absolute -right-10 top-4 p-2 bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-200 z-10"
          title="Edit component code"
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
      )}
      
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
  onModeChange = () => {},
}) {
  // State for component code
  const [componentCode, setComponentCode] = useState({ ...SLOT_CODE_TEMPLATES });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [codeHistory, setCodeHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // State for layout order
  const [contentSections, setContentSections] = useState(['cartItems', 'sidebar']);
  const [originalSections, setOriginalSections] = useState(['cartItems', 'sidebar']);
  
  // Destructure all props with defaults matching Cart.jsx
  const {
    store = {},
    cartItems = [],
    appliedCoupon = null,
    couponCode = '',
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    currencySymbol = '$',
    settings = {},
    flashMessage = null,
    selectedCountry = '',
    taxes = [],
    loading = false,
    storeLoading = false,
    calculateItemTotal = () => 0,
    safeToFixed = (val) => (val || 0).toFixed(2),
    updateQuantity = () => {},
    removeItem = () => {},
    handleCheckout = () => {},
    handleApplyCoupon = () => {},
    handleRemoveCoupon = () => {},
    handleCouponKeyPress = () => {},
    setCouponCode = () => {},
    setFlashMessage = () => {},
    formatDisplayPrice = (value, symbol) => `${symbol}${(value || 0).toFixed(2)}`,
    getStoreBaseUrl = (store) => store?.baseUrl || "/",
    getExternalStoreUrl = (slug, path, baseUrl) => `${baseUrl}${slug || ""}${path || ""}`,
  } = data;

  // Helper function for price formatting
  const formatPrice = (value) => {
    return typeof value === "number" ? value : parseFloat(value) || 0;
  };

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
    const code = componentCode[componentId] || SLOT_CODE_TEMPLATES[componentId] || '// Component code';
    setEditingComponent(componentId);
    setTempCode(code);
    setOriginalCode(code);
    setHasUnsavedChanges(false);
    setCodeHistory([code]);
    setHistoryIndex(0);
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
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setEditingComponent(null);
    setTempCode('');
    setOriginalCode('');
    setHasUnsavedChanges(false);
    setIsFullscreen(false);
    setCodeHistory([]);
    setHistoryIndex(-1);
  }, [hasUnsavedChanges]);

  // Handle code change in editor
  const handleCodeChange = useCallback((value) => {
    setTempCode(value || '');
    setHasUnsavedChanges(value !== originalCode);
    
    // Add to history for undo/redo
    const newHistory = codeHistory.slice(0, historyIndex + 1);
    newHistory.push(value || '');
    setCodeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [originalCode, codeHistory, historyIndex]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(tempCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [tempCode]);

  // Reset to original code
  const handleResetCode = useCallback(() => {
    setTempCode(originalCode);
    setHasUnsavedChanges(false);
    setCodeHistory([originalCode]);
    setHistoryIndex(0);
  }, [originalCode]);

  // Reset layout
  const handleResetLayout = useCallback(() => {
    setContentSections(['cartItems', 'sidebar']);
    onSave({
      componentCode,
      contentSections: ['cartItems', 'sidebar'],
      timestamp: new Date().toISOString()
    });
  }, [componentCode, onSave]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTempCode(codeHistory[historyIndex - 1]);
      setHasUnsavedChanges(codeHistory[historyIndex - 1] !== originalCode);
    }
  }, [codeHistory, historyIndex, originalCode]);

  const handleRedo = useCallback(() => {
    if (historyIndex < codeHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTempCode(codeHistory[historyIndex + 1]);
      setHasUnsavedChanges(codeHistory[historyIndex + 1] !== originalCode);
    }
  }, [codeHistory, historyIndex, originalCode]);

  // Loading state matching Cart.jsx
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main render - exact structure from Cart.jsx
  return (
    <>
      <div className="bg-gray-50 cart-page" style={{ backgroundColor: '#f9fafb' }}>
        <SeoHeadManager
          title="Your Cart"
          description="Review your shopping cart items before proceeding to checkout."
          keywords="cart, shopping cart, checkout, e-commerce, online store"
        />
        
        {/* Editor Action Bar */}
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Cart Layout Editor</h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onModeChange && onModeChange('preview')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onModeChange && onModeChange('code')}
                    className="flex items-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    Code View
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetLayout}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Layout
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    onSave({
                      componentCode,
                      contentSections,
                      timestamp: new Date().toISOString()
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save All
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ paddingLeft: '60px', paddingRight: '60px' }}>
          <EditableSection id="header" onEdit={handleEdit} isDraggable={false}>
            <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
            <CmsBlockRenderer position="cart_above_items" />
          </EditableSection>

          {cartItems.length === 0 ? (
            <EditableSection id="emptyCart" onEdit={handleEdit} isDraggable={false}>
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                  <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                  <Button onClick={() => {
                    const baseUrl = getStoreBaseUrl(store);
                    window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                  }}>
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </EditableSection>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={contentSections} strategy={verticalListSortingStrategy}>
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                  {contentSections.map(sectionId => {
                    if (sectionId === 'cartItems') {
                      return (
                        <EditableSection key={sectionId} id={sectionId} onEdit={handleEdit} className="lg:col-span-2">
                          <Card>
                            <CardContent className="px-4 divide-y divide-gray-200">
                              {cartItems.map(item => {
                                const product = item.product;
                                if (!product) return null;

                                // Calculate display price (exact logic from Cart.jsx)
                                let basePriceForDisplay;
                                const itemPriceAsNumber = formatPrice(item.price);

                                if (itemPriceAsNumber > 0) {
                                  basePriceForDisplay = itemPriceAsNumber;
                                } else {
                                  let productCurrentPrice = formatPrice(product.sale_price || product.price);
                                  const comparePrice = formatPrice(product.compare_price);
                                  if (comparePrice > 0 && comparePrice < productCurrentPrice) {
                                    basePriceForDisplay = comparePrice;
                                  } else {
                                    basePriceForDisplay = productCurrentPrice;
                                  }
                                }

                                const itemTotal = calculateItemTotal(item, product);

                                return (
                                  <div key={item.id} className="relative">
                                    <button
                                      onClick={() => handleEdit('cartItem')}
                                      className="absolute -right-8 top-6 p-1 bg-blue-100 rounded opacity-0 hover:opacity-100 transition-opacity z-10"
                                      title="Edit cart item component"
                                    >
                                      <Code className="w-3 h-3 text-blue-600" />
                                    </button>
                                    <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                                      <img
                                        src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                                        alt={product.name}
                                        className="w-20 h-20 object-cover rounded-lg"
                                      />
                                      <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{product.name}</h3>
                                        <p className="text-gray-600">{formatDisplayPrice(basePriceForDisplay, currencySymbol, store, taxes, selectedCountry)} each</p>
                                        
                                        {item.selected_options && item.selected_options.length > 0 && (
                                          <div className="text-sm text-gray-500 mt-1">
                                            {item.selected_options.map((option, idx) => (
                                              <div key={idx}>+ {option.name} (+{formatDisplayPrice(option.price, currencySymbol, store, taxes, selectedCountry)})</div>
                                            ))}
                                          </div>
                                        )}
                                        
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
                                        <p className="text-xl font-bold">{formatDisplayPrice(itemTotal, currencySymbol, store, taxes, selectedCountry)}</p>
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
                    }
                    
                    if (sectionId === 'sidebar') {
                      return (
                        <EditableSection key={sectionId} id={sectionId} onEdit={null} isDraggable={true} className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                          {/* Coupon Section */}
                          <EditableSection id="coupon" onEdit={handleEdit} isDraggable={false}>
                            <Card>
                              <CardHeader><CardTitle>Apply Coupon</CardTitle></CardHeader>
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
                                      <p className="text-sm font-medium text-green-800">Applied: {appliedCoupon.name}</p>
                                      <p className="text-xs text-green-600">
                                        {appliedCoupon.discount_type === 'fixed'
                                          ? `${currencySymbol}${safeToFixed(appliedCoupon.discount_value)} off`
                                          : `${safeToFixed(appliedCoupon.discount_value)}% off`
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
                          </EditableSection>
                        </EditableSection>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
          
          <EditableSection id="recommendedProducts" onEdit={handleEdit} isDraggable={false}>
            <div className="mt-12">
              <RecommendedProducts />
            </div>
          </EditableSection>
        </div>
      </div>

      {/* Monaco Editor Modal */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className={`${isFullscreen ? 'max-w-full w-full h-full m-0' : 'max-w-6xl w-[95vw] h-[85vh]'} flex flex-col transition-all`}>
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-500" />
                <span>Edit Component: {editingComponent ? editingComponent.charAt(0).toUpperCase() + editingComponent.slice(1).replace(/([A-Z])/g, ' $1').trim() : ''}</span>
                {hasUnsavedChanges && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Unsaved</span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {/* Undo/Redo */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRedo}
                  disabled={historyIndex >= codeHistory.length - 1}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-5 bg-gray-300 mx-1" />
                
                {/* Copy Code */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  title="Copy code to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                
                {/* Reset to Original */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetCode}
                  disabled={!hasUnsavedChanges}
                  title="Reset to original code"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                {/* Toggle Preview */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                
                {/* Fullscreen */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-5 bg-gray-300 mx-1" />
                
                {/* Close */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  title="Close editor"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex gap-4 p-4">
            {/* Code Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} border rounded-lg overflow-hidden transition-all`}>
              <div className="bg-gray-800 text-white text-xs px-3 py-2 flex items-center justify-between">
                <span>JavaScript Component</span>
                <span className="text-gray-400">Lines: {tempCode.split('\n').length}</span>
              </div>
              <Editor
                height="calc(100% - 32px)"
                defaultLanguage="javascript"
                value={tempCode}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: 'on',
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
            
            {/* Live Preview */}
            {showPreview && (
              <div className="w-1/2 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 text-gray-700 text-xs px-3 py-2 flex items-center justify-between">
                  <span>Live Preview</span>
                  <span className="text-gray-500">Component Output</span>
                </div>
                <div className="h-[calc(100%-32px)] overflow-auto bg-white p-4">
                  <div className="text-center text-gray-500 mt-20">
                    <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Live preview will render here</p>
                    <p className="text-sm mt-2">Component changes will be reflected in real-time</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-3">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    You have unsaved changes
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> 
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCode}
                  disabled={!hasUnsavedChanges}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> 
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}