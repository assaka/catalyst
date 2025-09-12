/**
 * UnifiedCartSlotsEditor - New flexible slot system
 * Replaces the complex majorSlot/microSlot hierarchy with a unified system
 * where any slot can be dragged into any other compatible slot
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
  Code,
  RefreshCw
} from 'lucide-react';
import { 
  SLOT_TYPES, 
  SLOT_TYPE_DEFINITIONS, 
  DEFAULT_CART_SLOTS, 
  UnifiedSlotManager 
} from '@/components/editor/slot/configs/unified-slot-config';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import slotConfigurationService from '@/services/slotConfigurationService';

// Sortable Slot Component with nesting support
function SortableSlot({ 
  slot, 
  allSlots, 
  mode, 
  onEdit, 
  onDelete, 
  onAddChild, 
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
    active
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

  const slotDef = SLOT_TYPE_DEFINITIONS[slot.type];
  const canAcceptChildren = slotDef?.canHaveChildren;
  const childSlots = slot.children?.map(childId => allSlots[childId]).filter(Boolean) || [];
  
  // Visual styling based on nesting level
  const nestingIndent = nestingLevel * 20;
  const borderColor = isOver ? 'border-green-400' : 'border-gray-300';
  const bgColor = isDragging ? 'bg-blue-50' : nestingLevel > 0 ? 'bg-gray-50' : 'bg-white';

  const renderSlotContent = () => {
    switch (slot.type) {
      case SLOT_TYPES.TEXT:
        return (
          <div 
            className={slot.styles.className || 'text-gray-900'}
            style={slot.styles.styles}
            dangerouslySetInnerHTML={{ __html: slot.content }}
          />
        );
      
      case SLOT_TYPES.BUTTON:
        return (
          <button
            className={slot.styles.className || 'px-4 py-2 bg-blue-600 text-white rounded'}
            style={slot.styles.styles}
            onClick={(e) => e.preventDefault()}
          >
            {slot.content}
          </button>
        );
        
      case SLOT_TYPES.IMAGE:
        return (
          <img
            src={slot.content}
            alt={slot.metadata?.name || 'Slot image'}
            className={slot.styles.className || 'w-full h-auto'}
            style={slot.styles.styles}
          />
        );
        
      case SLOT_TYPES.HTML:
        return (
          <div
            className={slot.styles.className}
            style={slot.styles.styles}
            dangerouslySetInnerHTML={{ __html: slot.content }}
          />
        );
        
      case SLOT_TYPES.CONTAINER:
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

  return (
    <div className="mb-2">
      <div
        ref={setNodeRef}
        style={{ ...style, marginLeft: `${nestingIndent}px` }}
        className={`relative border-2 ${borderColor} ${bgColor} rounded-lg p-3 group transition-all`}
      >
        {/* Drag Handle */}
        {mode === 'edit' && (
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
            {slotDef?.icon} {slotDef?.name}
          </span>
          {mode === 'edit' && (
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

        {/* Drop Zone Indicator for containers */}
        {mode === 'edit' && canAcceptChildren && isOver && (
          <div className="absolute inset-0 bg-green-100 bg-opacity-50 border-2 border-green-400 border-dashed rounded-lg flex items-center justify-center pointer-events-none z-5">
            <span className="text-green-700 font-medium">Drop slot here</span>
          </div>
        )}
      </div>

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
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                nestingLevel={nestingLevel + 1}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Main Unified Cart Editor Component
export default function UnifiedCartSlotsEditor({
  mode = 'edit', // 'edit' or 'preview'
  onSave = () => {},
}) {
  const { selectedStore } = useStoreSelection();
  
  // State
  const [slots, setSlots] = useState(DEFAULT_CART_SLOTS.slots);
  const [rootSlots, setRootSlots] = useState(DEFAULT_CART_SLOTS.rootSlots);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedSlotType, setSelectedSlotType] = useState(null);
  const [parentSlotId, setParentSlotId] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

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

    // Determine if we're dropping into a container or reordering
    const isDropIntoContainer = targetSlotData && 
      SLOT_TYPE_DEFINITIONS[targetSlotData.type]?.canHaveChildren &&
      UnifiedSlotManager.canSlotBeChild(draggedSlotData.type, targetSlotData.type);

    setSlots(prevSlots => {
      let newSlots = { ...prevSlots };
      
      if (isDropIntoContainer) {
        // Move slot into container
        console.log(`Moving ${draggedSlotData.id} into container ${targetSlotData.id}`);
        
        // Remove from old parent/root
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
        console.log('Reordering slots at same level');
        
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
    const newSlot = UnifiedSlotManager.createSlot(type, parentId);
    
    setSlots(prevSlots => ({
      ...prevSlots,
      [newSlot.id]: newSlot
    }));
    
    if (parentId) {
      // Add to parent's children
      setSlots(prevSlots => ({
        ...prevSlots,
        [parentId]: {
          ...prevSlots[parentId],
          children: [...(prevSlots[parentId].children || []), newSlot.id]
        }
      }));
    } else {
      // Add to root slots
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

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!selectedStore?.id) return;
    
    setSaveStatus('saving');
    
    try {
      const configuration = {
        slots,
        rootSlots,
        metadata: {
          ...DEFAULT_CART_SLOTS.metadata,
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
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Unified Cart Editor</h1>
            <p className="text-sm text-gray-600">
              Drag slots to reorder or nest them inside containers
            </p>
          </div>
          
          <div className="flex gap-2">
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
            >
              <Save className="w-4 h-4 mr-2" />
              {saveStatus === 'saving' ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

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
                onEdit={setEditingSlot}
                onDelete={handleDeleteSlot}
                onAddChild={(parentId) => {
                  setParentSlotId(parentId);
                  setShowAddSlotModal(true);
                }}
                nestingLevel={0}
              />
            ))}
          </SortableContext>
          
          <DragOverlay>
            {draggedSlot && (
              <div className="bg-white border-2 border-blue-400 rounded-lg p-3 opacity-90 shadow-lg">
                <span className="text-sm font-medium">
                  {SLOT_TYPE_DEFINITIONS[draggedSlot.type]?.icon} {draggedSlot.metadata?.name}
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
            {Object.entries(SLOT_TYPE_DEFINITIONS).map(([type, def]) => (
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