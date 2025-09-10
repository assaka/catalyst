/**
 * CartSlotsEditorWithMicroSlots.jsx - Enhanced editor with micro-slots
 * Each major slot is broken down into draggable micro-slots
 * Micro-slots can only be moved within their parent container
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, LayoutGrid, AlignJustify, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, PaintBucket, Type as TypeIcon, GripHorizontal, GripVertical as ResizeVertical, Move, HelpCircle, PlusCircle, Type, Code2, FileText, Package, Upload, History, CheckCircle } from "lucide-react";
// Removed react-beautiful-color to avoid CSS conflicts
import Editor from '@monaco-editor/react';
import { 
  handleMajorSlotDragEnd
} from "@/components/editor/slot/editor-utils";
import {
  handleSaveCode,
  handleDeleteCustomSlot,
  handleAddCustomSlot
} from "@/components/editor/slot/slot-management-utils";
import SlotPreview from "@/components/editor/slot/SlotPreview";

// Import micro-slot definitions from new config structure
import { getMicroSlotDefinitions } from '@/components/editor/slot/configs/index';
import { cartConfig } from '@/components/editor/slot/configs/cart-config';
import useDraftConfiguration from '@/hooks/useDraftConfiguration';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
import slotConfigurationService from '@/services/slotConfigurationService';

// Page configuration constants
const PAGE_TYPE = 'cart';
const PAGE_NAME = 'Cart';
const SLOT_TYPE = 'cart_layout';

// Get cart-specific micro-slot definitions from config
const MICRO_SLOT_DEFINITIONS = getMicroSlotDefinitions(PAGE_TYPE) || cartConfig.microSlotDefinitions;

// Component code templates for micro-slots
const MICRO_SLOT_TEMPLATES = {
  'flashMessage.content': `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-yellow-800">Product Removed</h3>
      <p class="text-sm text-yellow-700">Nike Air Max 90 has been removed from your cart.</p>
    </div>
  </div>
</div>`,
  'flashMessage.contentWithProducts': `<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-blue-800">Quantity Updated</h3>
      <p class="text-sm text-blue-700">The quantity for "Wireless Headphones" has been updated to 2.</p>
    </div>
  </div>
</div>`,
  'emptyCart.icon': `<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />`,
  'emptyCart.title': `<h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>`,
  'emptyCart.text': `<p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>`,
  'emptyCart.button': `<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Continue Shopping
</button>`,
  'header.title': `<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>`,
  'cartItem.image': `<img src={product.images?.[0] || placeholder} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />`,
  'cartItem.details': `<div className="flex-1"><h3 className="text-lg font-semibold">{product.name}</h3><p className="text-gray-600">{price} each</p></div>`,
  'cartItem.quantity': `<div className="flex items-center space-x-3"><Button size="sm" variant="outline"><Minus /></Button><span>{quantity}</span><Button size="sm" variant="outline"><Plus /></Button></div>`,
  'cartItem.price': `<p className="text-xl font-bold">{total}</p>`,
  'cartItem.remove': `<Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>`,
  'coupon.title': `<CardTitle>Apply Coupon</CardTitle>`,
  'coupon.input': `<Input placeholder="Enter coupon code" value={couponCode} onChange={handleCouponChange} />`,
  'coupon.button': `<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
  <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
  </svg>
  Apply
</button>`,
  'coupon.removeButton': `<button class="px-3 py-1.5 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors text-sm">
  Remove
</button>`,
  'coupon.applied': `<div className="bg-green-50 p-3 rounded-lg">Applied: {appliedCoupon.name}</div>`,
  'orderSummary.title': `<CardTitle>Order Summary</CardTitle>`,
  'orderSummary.subtotal': `<div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>`,
  'orderSummary.discount': `<div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{discount}</span></div>`,
  'orderSummary.tax': `<div className="flex justify-between"><span>Tax</span><span>{tax}</span></div>`,
  'orderSummary.total': `<div className="flex justify-between text-lg font-semibold border-t pt-4"><span>Total</span><span>{total}</span></div>`,
  'orderSummary.checkoutButton': `<button class="w-full px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
  Proceed to Checkout
</button>`
};

// Main editor component with micro-slots
export default function CartSlotsEditorWithMicroSlots({
  data,
  onSave = () => {},
  mode = 'edit', // 'edit' or 'preview'
  viewMode: propViewMode, // 'empty' or 'withProducts' - when passed from parent
}) {
  // Ensure data is always an object
  const safeData = data || {};
  // Get selected store from context
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  
  // Use draft configuration hook for versioning
  const {
    draftConfig,
    isLoading: isDraftLoading,
    isSaving,
    error: draftError,
    hasUnsavedChanges,
    updateConfiguration
  } = useDraftConfiguration(currentStoreId, PAGE_TYPE);

  // Use slot configuration hook for reusable save/load functionality
  const {
    saveConfiguration: saveConfigurationHook,
    applyDraftConfiguration,
    updateSlotsForViewMode
  } = useSlotConfiguration({
    pageType: PAGE_TYPE,
    pageName: PAGE_NAME,
    slotType: SLOT_TYPE,
    selectedStore,
    updateConfiguration,
    onSave,
    microSlotDefinitions: MICRO_SLOT_DEFINITIONS
  });

  // Apply loaded draft configuration to component state
  useEffect(() => {
    const setters = {
      setElementStyles,
      setSlotContent,
      setElementClasses,
      setComponentSizes,
      setMicroSlotOrders,
      setMicroSlotSpans
    };
    applyDraftConfiguration(draftConfig, setters);
  }, [draftConfig, applyDraftConfiguration]);
  
  // State for view mode - 'empty' or 'withProducts'  
  const [viewMode, setViewMode] = useState(propViewMode || 'empty');
  
  // State for preview mode - stores published configuration data
  const [previewConfig, setPreviewConfig] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  
  
  // State for major slot order - changes based on view mode
  const [majorSlots, setMajorSlots] = useState(['flashMessage', 'header', 'emptyCart']);
  
  
  // State for micro-slot orders within each parent
  const [microSlotOrders, setMicroSlotOrders] = useState(() => {
    const orders = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      orders[key] = [...def.microSlots];
    });
    return orders;
  });
  
  // State for micro-slot spans
  const [microSlotSpans, setMicroSlotSpans] = useState(() => {
    const spans = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      spans[key] = { ...def.defaultSpans };
    });
    return spans;
  });
  
  // State for component code
  // Unified content storage - can be plain text, HTML, or component code
  const [slotContent, setSlotContent] = useState({
    // Initialize with templates and text content merged
    ...MICRO_SLOT_TEMPLATES,
    // Text content overrides (these will be plain text initially)
    'emptyCart.title': 'Your cart is empty',
    'emptyCart.text': "Looks like you haven't added anything to your cart yet.",
    'header.title': 'My Cart',
    'coupon.title': 'Apply Coupon',
    'coupon.input.placeholder': 'Enter coupon code',
    'coupon.applied.title': 'Applied: ',
    'coupon.applied.description': '20% off your order',
    'orderSummary.title': 'Order Summary',
    'orderSummary.subtotal.label': 'Subtotal',
    'orderSummary.discount.label': 'Discount',
    'orderSummary.tax.label': 'Tax',
    'orderSummary.total.label': 'Total',
    // Initialize FlashMessage with the empty cart template by default
    'flashMessage.content': MICRO_SLOT_TEMPLATES['flashMessage.content'],
  });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  
  // State for custom slots
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  
  // State for reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentParentSlot, setCurrentParentSlot] = useState(null);
  const [newSlotType, setNewSlotType] = useState('text');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotContent, setNewSlotContent] = useState('');
  const [customSlots, setCustomSlots] = useState({});
  
  // State for delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, slotId: null, slotLabel: '' });
  
  // Direct color picker - no popover needed
  
  // State for Tailwind classes for each element
  const [elementClasses, setElementClasses] = useState({
    'header.title': 'text-3xl font-bold text-gray-900',
    'coupon.title': 'text-lg font-semibold',
    'coupon.applied.title': 'text-sm font-medium text-green-800',
    'coupon.applied.description': 'text-xs text-green-600',
    'orderSummary.title': 'text-lg font-semibold',
    'orderSummary.subtotal.label': '',
    'orderSummary.discount.label': '',
    'orderSummary.tax.label': '',
    'orderSummary.total.label': 'text-lg font-semibold',
    'emptyCart.title': 'text-xl font-semibold',
    'emptyCart.text': 'text-gray-600',
    'emptyCart.button': '',
  });

  // State for inline styles for each element (colors, etc)
  const [elementStyles, setElementStyles] = useState({});
  
  // State for component sizes
  const [componentSizes, setComponentSizes] = useState({
    'emptyCart.icon': 64, // pixels
    'emptyCart.button': 'default', // 'sm' | 'default' | 'lg'
    'cartItem.image': 80,
  });
  
  // Props from data (minimal set for editor)
  const {
    currencySymbol = '$',
  } = safeData;

  // Wrapper function that uses current component state
  const saveConfiguration = useCallback(async () => {
    return await saveConfigurationHook({
      majorSlots,
      slotContent,
      elementStyles,
      elementClasses,
      microSlotOrders,
      microSlotSpans,
      customSlots,
      componentSizes
    });
  }, [saveConfigurationHook, majorSlots, slotContent, elementStyles, elementClasses, microSlotOrders, microSlotSpans, customSlots, componentSizes]);

  
  // Listen for force save event from GenericSlotEditor
  useEffect(() => {
    window.addEventListener('force-save-cart-layout', saveConfiguration);
    return () => window.removeEventListener('force-save-cart-layout', saveConfiguration);
  }, [saveConfiguration]);
  
  // Set up window handler for adding new slots
  useEffect(() => {
    window.onAddNewSlot = (parentSlotId) => {
      setCurrentParentSlot(parentSlotId);
      setShowAddSlotDialog(true);
    };
    return () => delete window.onAddNewSlot;
  }, []);
  
  // Update major slots when view mode changes
  useEffect(() => {
    const emptyCartSlots = ['flashMessage', 'header', 'emptyCart'];
    const withProductsSlots = ['flashMessage', 'header', 'cartItem', 'coupon', 'orderSummary'];
    const setters = { setMajorSlots, setSlotContent };
    
    if (viewMode === 'empty') {
      updateSlotsForViewMode(emptyCartSlots, MICRO_SLOT_TEMPLATES['flashMessage.content'], setters);
    } else {
      updateSlotsForViewMode(withProductsSlots, MICRO_SLOT_TEMPLATES['flashMessage.contentWithProducts'], setters);
    }
  }, [viewMode, updateSlotsForViewMode]);


  // Fetch latest draft configuration when entering preview mode
  useEffect(() => {
    if (mode === 'preview' && currentStoreId) {
      const fetchLatestDraftConfiguration = async () => {
        console.log('🔍 Preview mode activated - fetching latest draft configuration');
        setIsLoadingPreview(true);
        
        try {
          // Use slotConfigurationService to get the latest draft configuration
          const response = await slotConfigurationService.getDraftConfiguration(currentStoreId, PAGE_TYPE);
          
          if (response.success && response.data) {
            console.log('✅ Latest draft configuration fetched:', response.data);
            setPreviewConfig(response.data);
          } else {
            console.warn('⚠️ No draft configuration found');
            setPreviewConfig(null);
          }
        } catch (error) {
          console.error('❌ Error fetching latest draft configuration:', error);
          setPreviewConfig(null);
        } finally {
          setIsLoadingPreview(false);
        }
      };
      
      fetchLatestDraftConfiguration();
    } else if (mode !== 'preview') {
      // Reset preview config when not in preview mode
      setPreviewConfig(null);
      setIsLoadingPreview(false);
    }
  }, [mode, currentStoreId]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  
  // Debug log to confirm drag setup
  useEffect(() => {
    console.log('🎯 DRAG SETUP - Mode:', mode, 'Sensors:', sensors);
  }, [mode]);

  // Simplified handler wrappers using imported utilities
  const handleMajorDragEnd = useCallback((event) => {
    if (event) {
      handleMajorSlotDragEnd(event, majorSlots, setMajorSlots, saveConfiguration);
    }
    setActiveDragSlot(null);
  }, [majorSlots, saveConfiguration]);

  const handleMajorDragStart = useCallback((event) => {
    if (event?.active?.id) {
      setActiveDragSlot(event.active.id);
    }
  }, []);



  // Handle major slot editing
  const handleEditSlot = useCallback((slotId, slotData) => {
    setEditingComponent(slotId);
    setTempCode(JSON.stringify(slotData, null, 2));
  }, []);

  // Handle micro-slot editing
  const handleEditMicroSlot = useCallback((microSlotKey, content) => {
    setEditingComponent(microSlotKey);
    setTempCode(content);
  }, []);

  // Main render
  return (
    <>
      <div className="bg-gray-50 cart-page min-h-screen flex flex-col" style={{ backgroundColor: '#f9fafb' }}>
        <SeoHeadManager
          title="Empty Cart Editor"
          description="Edit empty cart state layout"
          keywords="cart, editor, empty-state"
        />

        {/* White header bar with controls - show in both edit and preview modes */}
        {(mode === 'edit' || mode === 'preview') && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
              <div className="border-b p-3 flex justify-end gap-2">
              <button
                onClick={() => setViewMode('empty')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'empty'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                Empty Cart
              </button>
              <button
                onClick={() => setViewMode('withProducts')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'withProducts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />
                With Products
              </button>
              {mode === 'edit' && (
                <>
                  <div className="border-l mx-2" />
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Layout
                  </button>
                  
                  {/* Status indicator for draft/published state */}
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      Draft Changes
                    </Badge>
                  )}
                  
                  {isSaving && (
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      Auto-saving...
                    </Badge>
                  )}
                </>
              )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          {mode === 'edit' ? (
            <div className="w-full">
              {/* Main editor content - full width */}
              <div className="w-full">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleMajorDragStart}
                  onDragEnd={handleMajorDragEnd}
                >
                  <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
                    <SlotPreview
                      majorSlots={majorSlots}
                      microSlotDefinitions={MICRO_SLOT_DEFINITIONS}
                      microSlotOrders={microSlotOrders}
                      microSlotSpans={microSlotSpans}
                      slotContent={slotContent}
                      elementClasses={elementClasses}
                      elementStyles={elementStyles}
                      mode={mode}
                      onEditSlot={handleEditSlot}
                      onEditMicroSlot={handleEditMicroSlot}
                      onMajorDragStart={handleMajorDragStart}
                      onMajorDragEnd={handleMajorDragEnd}
                      activeDragSlot={activeDragSlot}
                      pageType="cart"
                    />
                  </SortableContext>
                  
                  <DragOverlay>
                    {activeDragSlot ? (
                      <div className="bg-white border rounded-lg shadow-lg p-4 opacity-90">
                        {activeDragSlot}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          ) : (
            // Preview mode - full width, no drag functionality
            <div className="w-full">
              <SlotPreview
                majorSlots={majorSlots}
                microSlotDefinitions={MICRO_SLOT_DEFINITIONS}
                microSlotOrders={microSlotOrders}
                microSlotSpans={microSlotSpans}
                slotContent={slotContent}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                mode={mode}
                onEditSlot={handleEditSlot}
                onEditMicroSlot={handleEditMicroSlot}
                pageType="cart"
              />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Monaco Editor Modal for micro-slots and parent slots */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              {editingComponent && !editingComponent.includes('.') 
                ? `Edit Parent Slot Configuration: ${MICRO_SLOT_DEFINITIONS[editingComponent]?.name || editingComponent}`
                : `Edit Micro-Slot: ${editingComponent}`
              }
            </DialogTitle>
            {editingComponent && !editingComponent.includes('.') && (
              <p className="text-sm text-gray-500 mt-1">
                Edit the JSON configuration for this parent slot including micro-slot order, spans, and content
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={
                editingComponent && !editingComponent.includes('.') 
                  ? 'json' 
                  : (editingComponent && (editingComponent.includes('.title') || editingComponent.includes('.text') || editingComponent.includes('.button') || editingComponent.includes('.custom_')) 
                    ? 'html' 
                    : 'javascript')
              }
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
      
      {/* Add New Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New Slot
              {currentParentSlot && MICRO_SLOT_DEFINITIONS[currentParentSlot] && 
                ` to ${MICRO_SLOT_DEFINITIONS[currentParentSlot].name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot Name</label>
              <Input
                placeholder="Enter slot name..."
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNewSlotType('text')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'text' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Type className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Text</div>
                </button>
                <button
                  onClick={() => setNewSlotType('html')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'html' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">HTML</div>
                </button>
                <button
                  onClick={() => setNewSlotType('javascript')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'javascript' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Code2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">JavaScript</div>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {newSlotType === 'text' && 'Add editable text content with styling options'}
              {newSlotType === 'html' && 'Add custom HTML markup for advanced layouts'}
              {newSlotType === 'javascript' && 'Add dynamic JavaScript for interactive features'}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {newSlotType === 'text' ? 'Initial Text' : newSlotType === 'html' ? 'HTML Content' : 'JavaScript Code'}
              </label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[100px] font-mono text-sm"
                placeholder={newSlotType === 'text' ? 'Enter your text here...' : newSlotType === 'html' ? '<div>Your HTML here...</div>' : '// Your JavaScript code here'}
                value={newSlotContent}
                onChange={(e) => setNewSlotContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSlotDialog(false);
              setCurrentParentSlot(null);
              setNewSlotName('');
              setNewSlotContent('');
              setNewSlotType('text');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomSlot}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Cart Page Layout</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reset the layout configuration for the <strong>Cart page</strong>? This will delete all customizations and restore the default layout for this page only.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              <strong>Note:</strong> Only the Cart page layout will be reset. Other pages will not be affected.
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  // Get store ID from localStorage (same as save/load functions)
                  const storeId = selectedStore?.id;
                  if (!storeId) {
                    console.error('No store ID found');
                    return;
                  }
                  
                  const queryParams = new URLSearchParams({
                    store_id: storeId
                  }).toString();
                  
                  // Import standard SlotConfiguration
                  const { SlotConfiguration } = await import('@/api/entities');
                  
                  // Get existing configurations
                  const configurations = await SlotConfiguration.findAll({ 
                    store_id: storeId, 
                    is_active: true 
                  });
                  
                  // Find the configuration for this page type
                  const existingConfig = configurations?.find(cfg => 
                    cfg.configuration?.page_name === PAGE_NAME && 
                    cfg.configuration?.slot_type === SLOT_TYPE
                  );
                  
                  if (existingConfig?.id) {
                    // Delete the configuration from database
                    await SlotConfiguration.delete(existingConfig.id);
                    console.log('✅ Deleted configuration from database');
                  }
                  
                  // Configuration will be reset in database
                  
                  // Reset all state to defaults
                  setMicroSlotOrders({});
                  setMicroSlotSpans({});
                  setCustomSlots({});
                  // Reset to default templates and text
                  setSlotContent({
                    ...MICRO_SLOT_TEMPLATES,  // Include all templates
                    // Override with default text values
                    'emptyCart.title': 'Your cart is empty',
                    'emptyCart.text': "Looks like you haven't added anything to your cart yet.",
                    'header.title': 'My Cart',
                    'coupon.title': 'Apply Coupon',
                    'coupon.input.placeholder': 'Enter coupon code',
                    'coupon.applied.title': 'Applied: ',
                    'coupon.applied.description': '20% off your order',
                    'orderSummary.title': 'Order Summary',
                    'orderSummary.subtotal.label': 'Subtotal',
                    'orderSummary.discount.label': 'Discount',
                    'orderSummary.tax.label': 'Tax',
                    'orderSummary.total.label': 'Total',
                  });
                  setElementClasses({
                    'header.title': 'text-3xl font-bold text-gray-900',
                    'emptyCart.title': 'text-xl font-semibold',
                    'emptyCart.text': 'text-gray-600',
                    'emptyCart.button': '',
                    'coupon.title': 'text-lg font-semibold',
                    'coupon.applied.title': 'text-sm font-medium text-green-800',
                    'coupon.applied.description': 'text-xs text-green-600',
                    'orderSummary.title': 'text-lg font-semibold',
                    'orderSummary.subtotal.label': '',
                    'orderSummary.discount.label': '',
                    'orderSummary.tax.label': '',
                    'orderSummary.total.label': 'text-lg font-semibold',
                  });
                  setComponentSizes({
                    'emptyCart.icon': 64,
                    'emptyCart.button': 'default',
                    'cartItem.image': 80,
                  });
                  
                  // Close modal
                  setShowResetModal(false);
                  
                } catch (error) {
                  console.error('❌ Failed to reset configuration:', error);
                }
              }}
            >
              Reset Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Custom Slot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the custom slot <strong>"{deleteConfirm.slotLabel}"</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log('User confirmed deletion for:', deleteConfirm.slotId);
                if (deleteConfirm.slotId) {
                  handleDeleteCustomSlot(deleteConfirm.slotId);
                }
                setDeleteConfirm({ show: false, slotId: null, slotLabel: '' });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popover removed - using direct hidden color input approach */}
    </>
  );
}