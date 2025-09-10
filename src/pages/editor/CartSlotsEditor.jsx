/**
 * Modern CartSlotsEditor - Clean implementation with cartConfig
 * Features: drag-and-drop, action bar, slot editing, database persistence
 */

import React, { useState, useCallback, useEffect } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Save, RefreshCw, CheckCircle, X } from "lucide-react";
import Editor from '@monaco-editor/react';

// Clean imports - using cartConfig as single source
import cartConfig from '@/components/editor/slot/configs/cart-config';
import ParentSlot from "@/components/editor/slot/ParentSlot";
import MicroSlot from "@/components/editor/slot/MicroSlot";
import InlineSlotEditor from "@/components/editor/slot/InlineSlotEditor";

// Clean configuration constants
const PAGE_TYPE = 'cart';
const PAGE_NAME = 'Cart';

// Database service for slot configurations
import { SlotConfiguration } from '@/api/entities';

// Main Cart Editor Component
export default function CartSlotsEditor({
  data,
  onSave = () => {},
  mode = 'edit', // 'edit' or 'preview'
  viewMode: propViewMode, // 'empty' or 'withProducts'
}) {
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  
  // Core state - streamlined from cartConfig
  const [viewMode, setViewMode] = useState(propViewMode || 'empty');
  const [majorSlots, setMajorSlots] = useState(cartConfig.majorSlots);
  const [slotContent, setSlotContent] = useState(cartConfig.slots);
  const [microSlotOrders, setMicroSlotOrders] = useState(
    Object.fromEntries(
      Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
        key, def.microSlots
      ])
    )
  );
  const [microSlotSpans, setMicroSlotSpans] = useState(
    Object.fromEntries(
      Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
        key, def.defaultSpans
      ])
    )
  );
  
  // Editor state
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Save configuration to database
  const saveConfiguration = useCallback(async () => {
    if (!currentStoreId) {
      console.error('No store ID available for saving');
      return;
    }

    setSaveStatus('saving');
    
    try {
      // Create configuration object in slot_configurations format
      const configuration = {
        page_name: PAGE_NAME,
        slots: slotContent,
        majorSlots,
        microSlotOrders,
        microSlotSpans,
        customSlots: {},
        componentSizes: {},
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Save to database using SlotConfiguration model
      await SlotConfiguration.upsertDraft(
        'current-user-id', // TODO: Get from auth context
        currentStoreId,
        PAGE_TYPE,
        configuration
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
      
      // Notify parent component
      onSave(configuration);
      
      console.log('✅ Configuration saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [currentStoreId, slotContent, majorSlots, microSlotOrders, microSlotSpans, onSave]);

  // Update major slots based on view mode
  useEffect(() => {
    const emptySlots = ['header', 'emptyCart'];
    const withProductsSlots = ['header', 'cartItem', 'coupon', 'orderSummary'];
    
    setMajorSlots(viewMode === 'empty' ? emptySlots : withProductsSlots);
  }, [viewMode]);

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Drag handlers
  const handleDragStart = useCallback((event) => {
    setActiveDragSlot(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDragSlot(null);

    if (active.id !== over?.id) {
      setMajorSlots((slots) => {
        const oldIndex = slots.indexOf(active.id);
        const newIndex = slots.indexOf(over.id);
        const newSlots = arrayMove(slots, oldIndex, newIndex);
        
        // Auto-save after reordering
        setTimeout(saveConfiguration, 100);
        
        return newSlots;
      });
    }
  }, [saveConfiguration]);

  // Edit handlers
  const handleEditSlot = useCallback((slotId, content) => {
    setEditingComponent(slotId);
    setTempCode(content || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingComponent) {
      setSlotContent(prev => ({
        ...prev,
        [editingComponent]: {
          ...prev[editingComponent],
          content: tempCode,
          metadata: {
            ...prev[editingComponent]?.metadata,
            lastModified: new Date().toISOString()
          }
        }
      }));
      
      setEditingComponent(null);
      setTempCode('');
      saveConfiguration();
    }
  }, [editingComponent, tempCode, saveConfiguration]);

  // Render slot content based on slot type
  const renderSlotContent = useCallback((slotId) => {
    const slotDef = cartConfig.microSlotDefinitions[slotId];
    if (!slotDef) return null;

    switch (slotId) {
      case 'header':
        return (
          <div className="text-center py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {slotContent['header.title']?.content || 'My Cart'}
            </h1>
          </div>
        );

      case 'emptyCart':
        if (viewMode !== 'empty') return null;
        return (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {slotContent['emptyCart.title']?.content || 'Your cart is empty'}
            </h2>
            <p className="text-gray-600 mb-6">
              {slotContent['emptyCart.text']?.content || "Looks like you haven't added anything to your cart yet."}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {slotContent['emptyCart.button']?.content || 'Continue Shopping'}
            </Button>
          </div>
        );

      case 'cartItem':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sample Product</h3>
                <p className="text-gray-600">$29.99</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">-</Button>
                <span className="px-2">1</span>
                <Button variant="outline" size="sm">+</Button>
              </div>
              <Button variant="destructive" size="sm">Remove</Button>
            </div>
          </div>
        );

      case 'coupon':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Apply Coupon</h3>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter coupon code" 
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button className="bg-green-600 hover:bg-green-700">Apply</Button>
            </div>
          </div>
        );

      case 'orderSummary':
        if (viewMode !== 'withProducts') return null;
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$29.99</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>$2.40</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>$32.39</span>
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-gray-500 text-center">
            Slot content for {slotId}
          </div>
        );
    }
  }, [viewMode, slotContent]);

  // Clean, modern render
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Save Status Indicator */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-white font-medium ${
          saveStatus === 'saving' ? 'bg-blue-500' : 
          saveStatus === 'saved' ? 'bg-green-500' : 
          'bg-red-500'
        }`}>
          {saveStatus === 'saving' && (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <X className="w-4 h-4" />
              Save Failed
            </>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-lg font-semibold text-gray-900">Cart Layout Editor</h1>
            
            <div className="flex items-center gap-2">
              {/* View Mode Switcher */}
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

              <div className="border-l mx-2 h-6" />
              
              {/* Save Button */}
              <Button 
                onClick={saveConfiguration} 
                size="sm" 
                disabled={saveStatus === 'saving'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
              
              {/* Reset Button */}
              <Button
                onClick={() => setShowResetModal(true)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {mode === 'edit' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {majorSlots.map(slotId => (
                    <ParentSlot
                      key={slotId}
                      id={slotId}
                      name={cartConfig.microSlotDefinitions[slotId]?.name || slotId}
                      microSlotOrder={microSlotOrders[slotId] || []}
                      onEdit={(content) => handleEditSlot(slotId, content)}
                      mode={mode}
                    >
                      {renderSlotContent(slotId)}
                    </ParentSlot>
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeDragSlot && (
                  <div className="bg-white border rounded-lg shadow-lg p-4 opacity-90">
                    {cartConfig.microSlotDefinitions[activeDragSlot]?.name || activeDragSlot}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            // Preview Mode - Simple render without drag functionality
            <div className="space-y-6">
              {majorSlots.map(slotId => (
                <div key={slotId} className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    {cartConfig.microSlotDefinitions[slotId]?.name || slotId}
                  </h2>
                  {renderSlotContent(slotId)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monaco Editor Modal */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Slot Content: {editingComponent}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
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
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Cart Layout</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reset the cart layout to defaults? This will overwrite all current customizations.
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Reset to cartConfig defaults
                setSlotContent(cartConfig.slots);
                setMicroSlotOrders(
                  Object.fromEntries(
                    Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
                      key, def.microSlots
                    ])
                  )
                );
                setMicroSlotSpans(
                  Object.fromEntries(
                    Object.entries(cartConfig.microSlotDefinitions).map(([key, def]) => [
                      key, def.defaultSpans
                    ])
                  )
                );
                setShowResetModal(false);
                saveConfiguration();
              }}
            >
              Reset Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}