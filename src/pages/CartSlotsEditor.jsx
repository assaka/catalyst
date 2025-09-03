/**
 * CartSlotsEditorWithMicroSlots.jsx - Enhanced editor with micro-slots
 * Each major slot is broken down into draggable micro-slots
 * Micro-slots can only be moved within their parent container
 */

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
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
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, Move, LayoutGrid, AlignJustify, AlignLeft } from "lucide-react";
import Editor from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Micro-slot definitions for each major slot
const MICRO_SLOT_DEFINITIONS = {
  emptyCart: {
    id: 'emptyCart',
    name: 'Empty Cart',
    microSlots: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
    defaultOrder: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
    defaultLayout: 'grid', // Can be 'vertical', 'horizontal', or 'grid'
    gridCols: 2 // Used when layout is 'grid' - allows icon and title on one row, text and button on another
  },
  header: {
    id: 'header',
    name: 'Page Header',
    microSlots: ['header.flashMessage', 'header.title', 'header.cmsBlock'],
    defaultOrder: ['header.flashMessage', 'header.title', 'header.cmsBlock'],
    defaultLayout: 'vertical',
    gridCols: 2
  },
  cartItem: {
    id: 'cartItem',
    name: 'Cart Item',
    microSlots: ['cartItem.image', 'cartItem.details', 'cartItem.quantity', 'cartItem.price', 'cartItem.remove'],
    defaultOrder: ['cartItem.image', 'cartItem.details', 'cartItem.quantity', 'cartItem.price', 'cartItem.remove'],
    defaultLayout: 'horizontal',
    gridCols: 3
  },
  coupon: {
    id: 'coupon',
    name: 'Coupon Section',
    microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied'],
    defaultOrder: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied'],
    defaultLayout: 'horizontal',
    gridCols: 2
  },
  orderSummary: {
    id: 'orderSummary',
    name: 'Order Summary',
    microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'],
    defaultOrder: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'],
    defaultLayout: 'vertical',
    gridCols: 2
  }
};

// Component code templates for micro-slots
const MICRO_SLOT_TEMPLATES = {
  'emptyCart.icon': `<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />`,
  'emptyCart.title': `<h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>`,
  'emptyCart.text': `<p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>`,
  'emptyCart.button': `<Button onClick={handleContinueShopping}>Continue Shopping</Button>`,
  'header.flashMessage': `<FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />`,
  'header.title': `<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>`,
  'header.cmsBlock': `<CmsBlockRenderer position="cart_above_items" />`,
  'cartItem.image': `<img src={product.images?.[0] || placeholder} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />`,
  'cartItem.details': `<div className="flex-1"><h3 className="text-lg font-semibold">{product.name}</h3><p className="text-gray-600">{price} each</p></div>`,
  'cartItem.quantity': `<div className="flex items-center space-x-3"><Button size="sm" variant="outline"><Minus /></Button><span>{quantity}</span><Button size="sm" variant="outline"><Plus /></Button></div>`,
  'cartItem.price': `<p className="text-xl font-bold">{total}</p>`,
  'cartItem.remove': `<Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>`,
  'coupon.title': `<CardTitle>Apply Coupon</CardTitle>`,
  'coupon.input': `<Input placeholder="Enter coupon code" value={couponCode} onChange={handleCouponChange} />`,
  'coupon.button': `<Button onClick={handleApplyCoupon}><Tag className="w-4 h-4 mr-2" /> Apply</Button>`,
  'coupon.applied': `<div className="bg-green-50 p-3 rounded-lg">Applied: {appliedCoupon.name}</div>`,
  'orderSummary.title': `<CardTitle>Order Summary</CardTitle>`,
  'orderSummary.subtotal': `<div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>`,
  'orderSummary.discount': `<div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{discount}</span></div>`,
  'orderSummary.tax': `<div className="flex justify-between"><span>Tax</span><span>{tax}</span></div>`,
  'orderSummary.total': `<div className="flex justify-between text-lg font-semibold border-t pt-4"><span>Total</span><span>{total}</span></div>`,
  'orderSummary.checkoutButton': `<Button size="lg" className="w-full">Proceed to Checkout</Button>`
};

// Micro-slot wrapper component
function MicroSlot({ id, children, onEdit, isDraggable = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      {isDraggable && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...listeners}
            {...attributes}
            className="p-1 bg-blue-100 rounded cursor-grab active:cursor-grabbing"
            title="Drag to reorder within parent"
          >
            <Move className="w-3 h-3 text-blue-600" />
          </div>
        </div>
      )}
      
      {onEdit && (
        <button
          onClick={() => onEdit(id)}
          className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit micro-slot"
        >
          <Edit className="w-3 h-3 text-gray-600" />
        </button>
      )}
      
      <div className={`${isDragging ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-gray-300'} rounded transition-all`}>
        {children}
      </div>
    </div>
  );
}

// Parent slot container with micro-slots
function ParentSlot({ id, name, children, microSlotOrder, onMicroSlotReorder, onEdit, isDraggable = true, layout = 'vertical', onLayoutChange, gridCols = 2 }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleMicroDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Only allow reordering within the same parent
    if (active.id.split('.')[0] === over.id.split('.')[0]) {
      onMicroSlotReorder(id, active.id, over.id);
    }
  };

  // Choose sorting strategy based on layout
  const getSortingStrategy = () => {
    switch (layout) {
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'grid':
        return rectSortingStrategy;
      default:
        return verticalListSortingStrategy;
    }
  };

  // Get container styles based on layout
  const getContainerStyles = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-row gap-4 items-start flex-wrap';
      case 'grid':
        // Use fixed grid column classes that Tailwind can recognize
        const gridClass = gridCols === 2 ? 'grid-cols-2' : 
                         gridCols === 3 ? 'grid-cols-3' : 
                         gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2';
        return `grid gap-4 ${gridClass}`;
      default:
        return 'space-y-2';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Parent drag handle */}
      {isDraggable && (
        <div className="absolute -left-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...listeners}
            {...attributes}
            className="p-2 bg-gray-100 rounded cursor-grab active:cursor-grabbing"
            title="Drag to reorder section"
          >
            <GripVertical className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      )}
      
      {/* Parent edit button */}
      {onEdit && (
        <button
          onClick={() => onEdit(id)}
          className="absolute -right-10 top-4 p-2 bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit section"
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
      )}
      
      {/* Section label and layout selector */}
      <div className="absolute -top-3 left-4 right-4 flex justify-between items-center">
        <span className="px-2 bg-white text-xs font-medium text-gray-500">
          {name}
        </span>
        {onLayoutChange && (
          <Select value={layout} onValueChange={(value) => onLayoutChange(id, value)}>
            <SelectTrigger className="h-6 w-32 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">
                <div className="flex items-center gap-1">
                  <AlignJustify className="w-3 h-3" />
                  <span>Vertical</span>
                </div>
              </SelectItem>
              <SelectItem value="horizontal">
                <div className="flex items-center gap-1">
                  <AlignLeft className="w-3 h-3 rotate-90" />
                  <span>Horizontal</span>
                </div>
              </SelectItem>
              <SelectItem value="grid">
                <div className="flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  <span>Grid</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Micro-slots container */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMicroDragEnd}>
          <SortableContext items={microSlotOrder} strategy={getSortingStrategy()}>
            <div className={getContainerStyles()}>
              {children}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// Main editor component with micro-slots
export default function CartSlotsEditorWithMicroSlots({
  data = {},
  onSave = () => {},
}) {
  // State for major slot order
  const [majorSlots, setMajorSlots] = useState(['header', 'cartItems', 'coupon', 'orderSummary', 'recommendedProducts']);
  
  // State for micro-slot orders within each parent
  const [microSlotOrders, setMicroSlotOrders] = useState(() => {
    const orders = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      orders[key] = [...def.defaultOrder];
    });
    return orders;
  });
  
  // State for layout modes of each parent slot
  const [slotLayouts, setSlotLayouts] = useState(() => {
    const layouts = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      layouts[key] = def.defaultLayout || 'vertical';
    });
    return layouts;
  });
  
  // State for component code
  const [componentCode, setComponentCode] = useState({ ...MICRO_SLOT_TEMPLATES });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  
  // Props from data
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
    formatDisplayPrice = (value) => `${currencySymbol}${(value || 0).toFixed(2)}`,
    getStoreBaseUrl = (store) => store?.baseUrl || "/",
    getExternalStoreUrl = (slug, path, baseUrl) => `${baseUrl}${slug || ""}${path || ""}`,
  } = data;

  const formatPrice = (value) => typeof value === "number" ? value : parseFloat(value) || 0;

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Handle major slot reordering
  const handleMajorDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setMajorSlots((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
    setActiveDragSlot(null);
  }, []);

  const handleMajorDragStart = useCallback((event) => {
    setActiveDragSlot(event.active.id);
  }, []);

  // Handle micro-slot reordering within a parent
  const handleMicroSlotReorder = useCallback((parentId, activeId, overId) => {
    setMicroSlotOrders(prev => {
      const newOrders = { ...prev };
      const parentOrder = [...(newOrders[parentId] || [])];
      const oldIndex = parentOrder.indexOf(activeId);
      const newIndex = parentOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        newOrders[parentId] = arrayMove(parentOrder, oldIndex, newIndex);
      }
      
      return newOrders;
    });
  }, []);
  
  // Handle layout change for a parent slot
  const handleLayoutChange = useCallback((slotId, newLayout) => {
    setSlotLayouts(prev => ({
      ...prev,
      [slotId]: newLayout
    }));
  }, []);

  // Edit micro-slot
  const handleEditMicroSlot = useCallback((microSlotId) => {
    const code = componentCode[microSlotId] || MICRO_SLOT_TEMPLATES[microSlotId] || '// Micro-slot code';
    setEditingComponent(microSlotId);
    setTempCode(code);
  }, [componentCode]);

  // Save edited code
  const handleSaveCode = useCallback(() => {
    if (editingComponent) {
      setComponentCode(prev => ({
        ...prev,
        [editingComponent]: tempCode
      }));
      onSave({
        componentCode: { ...componentCode, [editingComponent]: tempCode },
        majorSlots,
        microSlotOrders,
        slotLayouts,
        timestamp: new Date().toISOString()
      });
    }
    setEditingComponent(null);
    setTempCode('');
  }, [editingComponent, tempCode, componentCode, majorSlots, microSlotOrders, onSave]);

  // Render empty cart with micro-slots
  const renderEmptyCart = () => {
    const microSlots = microSlotOrders.emptyCart || MICRO_SLOT_DEFINITIONS.emptyCart.defaultOrder;
    const layout = slotLayouts.emptyCart || 'vertical';
    
    return (
      <ParentSlot
        id="emptyCart"
        name="Empty Cart"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('emptyCart')}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        gridCols={MICRO_SLOT_DEFINITIONS.emptyCart.gridCols}
      >
        {microSlots.map(slotId => {
          if (slotId === 'emptyCart.icon') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.title') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <h2 className="text-xl font-semibold mb-2 text-center">Your cart is empty</h2>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.text') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <p className="text-gray-600 mb-6 text-center">
                  Looks like you haven't added anything to your cart yet.
                </p>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.button') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <div className="text-center">
                  <Button onClick={() => {
                    const baseUrl = getStoreBaseUrl(store);
                    window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                  }}>
                    Continue Shopping
                  </Button>
                </div>
              </MicroSlot>
            );
          }
          return null;
        })}
      </ParentSlot>
    );
  };

  // Render header with micro-slots
  const renderHeader = () => {
    const microSlots = microSlotOrders.header || MICRO_SLOT_DEFINITIONS.header.defaultOrder;
    const layout = slotLayouts.header || 'vertical';
    
    return (
      <ParentSlot
        id="header"
        name="Page Header"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('header')}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        gridCols={MICRO_SLOT_DEFINITIONS.header.gridCols}
      >
        {microSlots.map(slotId => {
          if (slotId === 'header.flashMessage') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
              </MicroSlot>
            );
          }
          if (slotId === 'header.title') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
              </MicroSlot>
            );
          }
          if (slotId === 'header.cmsBlock') {
            return (
              <MicroSlot key={slotId} id={slotId} onEdit={handleEditMicroSlot}>
                <CmsBlockRenderer position="cart_above_items" />
              </MicroSlot>
            );
          }
          return null;
        })}
      </ParentSlot>
    );
  };

  // Loading state
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="bg-gray-50 cart-page min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <SeoHeadManager
          title="Cart Editor - Micro Slots"
          description="Edit cart layout with micro-slot precision"
          keywords="cart, editor, micro-slots"
        />
        
        {/* Instructions */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100">
                <GripVertical className="w-3 h-3 mr-1" />
                Major Slots
              </Badge>
              <span className="text-sm text-blue-800">Drag to reorder sections</span>
              <span className="mx-2 text-blue-400">•</span>
              <Badge variant="secondary" className="bg-purple-100">
                <Move className="w-3 h-3 mr-1" />
                Micro Slots
              </Badge>
              <span className="text-sm text-blue-800">Drag within parent only</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleMajorDragStart}
            onDragEnd={handleMajorDragEnd}
          >
            <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
              <div className="space-y-8">
                {majorSlots.map(slotId => {
                  if (slotId === 'header') {
                    return <div key={slotId}>{renderHeader()}</div>;
                  }
                  if (slotId === 'cartItems' && cartItems.length === 0) {
                    return <div key={slotId}>{renderEmptyCart()}</div>;
                  }
                  // Add other slots here...
                  return null;
                })}
              </div>
            </SortableContext>
            
            {/* Drag overlay */}
            <DragOverlay>
              {activeDragSlot ? (
                <div className="bg-white shadow-2xl rounded-lg p-4 opacity-80">
                  <Badge>{activeDragSlot}</Badge>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Monaco Editor Modal for micro-slots */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Edit Micro-Slot: {editingComponent}
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
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingComponent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCode}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}