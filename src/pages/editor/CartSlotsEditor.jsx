/**
 * Unified CartSlotsEditor - Clean implementation without backward compatibility
 * Uses the new unified slot system with Webflow-style visual editing
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Save,
  Eye,
  ShoppingCart,
  Package,
  RefreshCw,
  CheckCircle,
  X
} from 'lucide-react';

// Import unified slot system
import { cartConfig, SlotManager } from '@/components/editor/slot/configs/cart-config';
import WebflowStyleEditor from '@/components/editor/slot/WebflowStyleEditor';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import slotConfigurationService from '@/services/slotConfigurationService';

// Sortable Slot Component
function SortableSlot({ 
  slot, 
  allSlots, 
  mode,
  webflowMode,
  selectedSlot,
  onEdit, 
  onDelete, 
  onAddChild, 
  onSlotSelect,
  onSlotUpdate,
  nestingLevel = 0 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: slot.id,
    data: {
      type: 'slot',
      slot: slot
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const slotTypeDef = cartConfig.slotTypes[slot.type];
  const canAcceptChildren = slotTypeDef?.canHaveChildren;
  const childSlots = slot.children?.map(childId => allSlots[childId]).filter(Boolean) || [];
  
  const nestingIndent = nestingLevel * 20;
  const borderColor = isOver ? 'border-green-400' : 'border-gray-300';
  const bgColor = isDragging ? 'bg-blue-50' : nestingLevel > 0 ? 'bg-gray-50' : 'bg-white';

  const renderSlotContent = () => {
    switch (slot.type) {
      case 'text':
        return (
          <div 
            className={slot.styles.className || 'text-gray-900'}
            style={slot.styles.styles}
            dangerouslySetInnerHTML={{ __html: slot.content }}
          />
        );
      
      case 'button':
        return (
          <button
            className={slot.styles.className || 'px-4 py-2 bg-blue-600 text-white rounded'}
            style={slot.styles.styles}
            onClick={(e) => e.preventDefault()}
          >
            {slot.content}
          </button>
        );
        
      case 'image':
        return (
          <img
            src={slot.content}
            alt={slot.metadata?.name || 'Slot image'}
            className={slot.styles.className || 'w-full h-auto'}
            style={slot.styles.styles}
          />
        );
        
      case 'html':
        return (
          <div
            className={slot.styles.className}
            style={slot.styles.styles}
            dangerouslySetInnerHTML={{ __html: slot.content }}
          />
        );
        
      case 'container':
        return (
          <div
            className={slot.styles.className || 'p-4 border border-gray-200 rounded-lg'}
            style={slot.styles.styles}
          >
            {slot.content && (
              <div dangerouslySetInnerHTML={{ __html: slot.content }} />
            )}
          </div>
        );
        
      default:
        return (
          <div
            className={slot.styles.className || 'p-4 border-2 border-dashed border-gray-300 rounded'}
            style={slot.styles.styles}
            dangerouslySetInnerHTML={{ __html: slot.content }}
          />
        );
    }
  };

  const slotElement = (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: `${nestingIndent}px` }}
      className={`relative border-2 ${borderColor} ${bgColor} rounded-lg p-3 group transition-all mb-2`}
    >
      {/* Drag Handle */}
      {mode === 'edit' && !webflowMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-gray-500 text-white p-1 rounded z-10"
        >
          <GripVertical className="w-3 h-3" />
        </div>
      )}

      {/* Slot Type Badge */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {slotTypeDef?.icon} {slotTypeDef?.name}
        </span>
        {mode === 'edit' && !webflowMode && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={() => onEdit(slot)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            {canAcceptChildren && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-green-100"
                onClick={() => onAddChild(slot.id)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={() => onDelete(slot.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>

      {/* Slot Content */}
      <div className="mt-4">
        {renderSlotContent()}
      </div>

      {/* Drop Zone Indicator */}
      {mode === 'edit' && canAcceptChildren && isOver && (
        <div className="absolute inset-0 bg-green-100 bg-opacity-50 border-2 border-green-400 border-dashed rounded-lg flex items-center justify-center pointer-events-none z-5">
          <span className="text-green-700 font-medium">Drop slot here</span>
        </div>
      )}
    </div>
  );

  // Wrap with WebflowStyleEditor if in webflow mode
  const wrappedElement = webflowMode ? (
    <WebflowStyleEditor
      slot={slot}
      isSelected={selectedSlot === slot.id}
      onSelect={onSlotSelect}
      onUpdate={onSlotUpdate}
      onDelete={onDelete}
      mode={mode}
    >
      {slotElement}
    </WebflowStyleEditor>
  ) : slotElement;

  return (
    <div>
      {wrappedElement}
      
      {/* Render Child Slots */}
      {childSlots.length > 0 && (
        <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
          <SortableContext items={childSlots.map(child => child.id)} strategy={verticalListSortingStrategy}>
            {childSlots.map((childSlot) => (
              <SortableSlot
                key={childSlot.id}
                slot={childSlot}
                allSlots={allSlots}
                mode={mode}
                webflowMode={webflowMode}
                selectedSlot={selectedSlot}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onSlotSelect={onSlotSelect}
                onSlotUpdate={onSlotUpdate}
                nestingLevel={nestingLevel + 1}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Main CartSlotsEditor Component
export default function CartSlotsEditor({
  mode = 'edit', // 'edit' or 'preview'
  onSave = () => {},
}) {
  const { selectedStore } = useStoreSelection();
  
  // Load initial slots from config
  const [slots, setSlots] = useState(cartConfig.defaultLayout.slots);
  const [rootSlots, setRootSlots] = useState(cartConfig.defaultLayout.rootSlots);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedSlotType, setSelectedSlotType] = useState(null);
  const [parentSlotId, setParentSlotId] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('empty');
  
  // Webflow-style visual editing
  const [webflowMode, setWebflowMode] = useState(false);
  const [selectedSlotForVisualEdit, setSelectedSlotForVisualEdit] = useState(null);

  // Get root level slots in order
  const rootSlotObjects = useMemo(() => {
    return rootSlots.map(slotId => slots[slotId]).filter(Boolean);
  }, [slots, rootSlots]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setDraggedSlot(active.data?.current?.slot);
  }, []);

  // Handle drag end with nesting logic
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setDraggedSlot(null);
      return;
    }

    const draggedSlotData = active.data?.current?.slot;
    const targetSlotData = over.data?.current?.slot;
    
    if (!draggedSlotData || draggedSlotData.id === over.id) {
      setDraggedSlot(null);
      return;
    }

    // Determine if dropping into container or reordering
    const isDropIntoContainer = targetSlotData && 
      SlotManager.canSlotBeChild(draggedSlotData.type, targetSlotData.type);

    setSlots(prevSlots => {
      let newSlots = { ...prevSlots };
      
      if (isDropIntoContainer) {
        // Move slot into container
        if (draggedSlotData.parentId) {
          newSlots[draggedSlotData.parentId].children = 
            newSlots[draggedSlotData.parentId].children.filter(id => id !== draggedSlotData.id);
        } else {
          setRootSlots(prev => prev.filter(id => id !== draggedSlotData.id));
        }
        
        // Add to new parent
        newSlots[draggedSlotData.id] = {
          ...newSlots[draggedSlotData.id],
          parentId: targetSlotData.id,
          position: { order: newSlots[targetSlotData.id].children.length }
        };
        
        if (!newSlots[targetSlotData.id].children.includes(draggedSlotData.id)) {
          newSlots[targetSlotData.id].children.push(draggedSlotData.id);
        }
        
      } else {
        // Reorder at same level
        if (!draggedSlotData.parentId) {
          // Reordering root slots
          setRootSlots(prevRoot => {
            const oldIndex = prevRoot.indexOf(draggedSlotData.id);
            const newIndex = prevRoot.indexOf(over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              return arrayMove(prevRoot, oldIndex, newIndex);
            }
            return prevRoot;
          });
        } else {
          // Reordering within parent
          const parentId = draggedSlotData.parentId;
          const parent = newSlots[parentId];
          if (parent) {
            const oldIndex = parent.children.indexOf(draggedSlotData.id);
            const newIndex = parent.children.indexOf(over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              parent.children = arrayMove(parent.children, oldIndex, newIndex);
            }
          }
        }
      }
      
      return newSlots;
    });
    
    setDraggedSlot(null);
  }, []);

  // Add new slot
  const handleAddSlot = useCallback((type, parentId = null) => {
    const newSlot = SlotManager.createSlot(type, parentId);
    
    setSlots(prevSlots => ({
      ...prevSlots,
      [newSlot.id]: newSlot
    }));
    
    if (parentId) {
      setSlots(prevSlots => ({
        ...prevSlots,
        [parentId]: {
          ...prevSlots[parentId],
          children: [...(prevSlots[parentId].children || []), newSlot.id]
        }
      }));
    } else {
      setRootSlots(prev => [...prev, newSlot.id]);
    }
    
    setShowAddSlotModal(false);
    setSelectedSlotType(null);
    setParentSlotId(null);
  }, []);

  // Delete slot
  const handleDeleteSlot = useCallback((slotId) => {
    setSlots(prevSlots => {
      const newSlots = { ...prevSlots };
      const slotToDelete = newSlots[slotId];
      
      if (!slotToDelete) return prevSlots;
      
      // Remove from parent or root
      if (slotToDelete.parentId && newSlots[slotToDelete.parentId]) {
        newSlots[slotToDelete.parentId].children = 
          newSlots[slotToDelete.parentId].children.filter(id => id !== slotId);
      } else {
        setRootSlots(prev => prev.filter(id => id !== slotId));
      }
      
      // Recursively delete children
      const deleteRecursive = (id) => {
        const slot = newSlots[id];
        if (slot && slot.children) {
          slot.children.forEach(deleteRecursive);
        }
        delete newSlots[id];
      };
      
      deleteRecursive(slotId);
      return newSlots;
    });
  }, []);

  // Webflow-style editing handlers
  const handleSlotSelect = useCallback((slotId) => {
    setSelectedSlotForVisualEdit(slotId);
  }, []);

  const handleSlotUpdate = useCallback((slotId, updates) => {
    setSlots(prevSlots => ({
      ...prevSlots,
      [slotId]: {
        ...prevSlots[slotId],
        ...updates,
        metadata: {
          ...prevSlots[slotId]?.metadata,
          lastModified: new Date().toISOString()
        }
      }
    }));
  }, []);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!selectedStore?.id) return;
    
    setSaveStatus('saving');
    
    try {
      const configuration = {
        slots,
        rootSlots,
        metadata: {
          name: 'Cart Layout',
          version: '2.0',
          system: 'unified-slots',
          lastModified: new Date().toISOString()
        }
      };
      
      await slotConfigurationService.saveConfiguration(
        selectedStore.id,
        configuration,
        'cart'
      );
      
      setSaveStatus('saved');
      onSave(configuration);
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [selectedStore?.id, slots, rootSlots, onSave]);

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      {mode === 'edit' && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div>
                <h1 className="text-xl font-semibold">Cart Editor</h1>
                <p className="text-sm text-gray-600">
                  {webflowMode ? 'Visual editing mode - click elements to style' : 'Drag slots to reorder or nest them'}
                </p>
              </div>
              
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
                
                {/* Webflow Mode Toggle */}
                <button
                  onClick={() => setWebflowMode(!webflowMode)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    webflowMode
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Toggle Webflow-style visual editing"
                >
                  <Edit className="w-4 h-4 inline mr-1.5" />
                  Visual Editor
                </button>
                
                <div className="border-l mx-2 h-6" />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSlotModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
                
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={saveStatus === 'saving'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveStatus === 'saving' ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : saveStatus === 'saved' ? (
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={rootSlotObjects.map(slot => slot.id)} 
            strategy={verticalListSortingStrategy}
          >
            {rootSlotObjects.map((slot) => (
              <SortableSlot
                key={slot.id}
                slot={slot}
                allSlots={slots}
                mode={mode}
                webflowMode={webflowMode}
                selectedSlot={selectedSlotForVisualEdit}
                onEdit={setEditingSlot}
                onDelete={handleDeleteSlot}
                onAddChild={(parentId) => {
                  setParentSlotId(parentId);
                  setShowAddSlotModal(true);
                }}
                onSlotSelect={handleSlotSelect}
                onSlotUpdate={handleSlotUpdate}
                nestingLevel={0}
              />
            ))}
          </SortableContext>
          
          <DragOverlay>
            {draggedSlot && (
              <div className="bg-white border-2 border-blue-400 rounded-lg p-3 opacity-90 shadow-lg">
                <span className="text-sm font-medium">
                  {cartConfig.slotTypes[draggedSlot.type]?.icon} {draggedSlot.metadata?.name}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Slot Modal */}
      <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slot</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {Object.entries(cartConfig.slotTypes).map(([type, def]) => (
              <div
                key={type}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSlotType === type 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSlotType(type)}
              >
                <div className="text-lg">{def.icon}</div>
                <div className="font-medium text-sm">{def.name}</div>
                <div className="text-xs text-gray-500 mt-1">{def.description}</div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlotModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAddSlot(selectedSlotType, parentSlotId)}
              disabled={!selectedSlotType}
            >
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}