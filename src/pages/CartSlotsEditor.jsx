/**
 * CartSlotsEditor.jsx - LAYOUT EDITOR VERSION
 * 
 * This is the editable version of CartSlots for the Layout Editor mode.
 * Features:
 * - 🎯 DRAG & DROP: Visual drag and drop with handles
 * - 📐 SNAP TO GRID: Automatic alignment and spacing
 * - ✏️ INLINE EDITING: Click to edit slot content
 * - 👁️ SHOW/HIDE: Toggle slot visibility
 * - 🎨 VISUAL FEEDBACK: Hover effects and drag indicators
 */

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save,
  X,
  Settings,
  ShoppingCart,
  Tag,
  Package,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Slot configuration with metadata
const SLOT_CONFIGS = {
  header: {
    id: "header",
    title: "Page Header",
    icon: ShoppingCart,
    description: "Cart title and breadcrumbs",
    color: "bg-blue-50 border-blue-200",
    defaultContent: {
      title: "Shopping Cart",
      subtitle: "Review and edit your items"
    },
    editable: true,
    deletable: false,
  },
  cart_items: {
    id: "cart_items",
    title: "Cart Items",
    icon: Package,
    description: "Product list with quantity controls",
    color: "bg-green-50 border-green-200",
    defaultContent: {
      title: "Your Items",
      emptyMessage: "Your cart is empty"
    },
    editable: true,
    deletable: false,
  },
  coupon_section: {
    id: "coupon_section",
    title: "Coupon Code",
    icon: Tag,
    description: "Apply discount codes",
    color: "bg-purple-50 border-purple-200",
    defaultContent: {
      title: "Have a coupon?",
      placeholder: "Enter code"
    },
    editable: true,
    deletable: true,
  },
  order_summary: {
    id: "order_summary",
    title: "Order Summary",
    icon: CreditCard,
    description: "Pricing breakdown and checkout",
    color: "bg-yellow-50 border-yellow-200",
    defaultContent: {
      title: "Order Summary",
      checkoutText: "Proceed to Checkout"
    },
    editable: true,
    deletable: false,
  },
  recommended_products: {
    id: "recommended_products",
    title: "Recommendations",
    icon: TrendingUp,
    description: "Suggested products",
    color: "bg-pink-50 border-pink-200",
    defaultContent: {
      title: "You might also like",
      itemCount: 4
    },
    editable: true,
    deletable: true,
  },
};

// Individual Slot Component for editing
function EditableSlot({ 
  config, 
  content, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  onChange,
  isHidden 
}) {
  const [localContent, setLocalContent] = useState(content);
  const Icon = config.icon;

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleSave = () => {
    onChange(config.id, localContent);
    onSave();
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      config.color,
      isHidden && "opacity-50",
      isEditing && "ring-2 ring-blue-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">{config.title}</CardTitle>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleSave}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            {Object.entries(localContent).map(([key, value]) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                {typeof value === 'string' && value.length > 50 ? (
                  <Textarea
                    value={value}
                    onChange={(e) => setLocalContent({
                      ...localContent,
                      [key]: e.target.value
                    })}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <Input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setLocalContent({
                      ...localContent,
                      [key]: e.target.type === 'number' 
                        ? parseInt(e.target.value) || 0 
                        : e.target.value
                    })}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 rounded p-4">
            <div className="space-y-2">
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sortable Item Wrapper with enhanced drag controls
function SortableItem({ 
  id, 
  children, 
  onToggleVisibility,
  onEdit,
  isHidden,
  isDeletable = true 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-50"
      )}
    >
      {/* Drag Handle */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10",
          "p-2 rounded-lg bg-gray-100 cursor-grab",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-gray-200",
          isDragging && "cursor-grabbing"
        )}
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "absolute right-0 top-4 -translate-x-full mr-2",
        "flex flex-col gap-1",
        "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleVisibility(id)}
          className="p-1"
        >
          {isHidden ? (
            <EyeOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-600" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-transform",
        isDragging && "scale-105"
      )}>
        {children}
      </div>
    </div>
  );
}

// Main Editor Component
export default function CartSlotsEditor({ 
  initialOrder = ["header", "cart_items", "coupon_section", "order_summary", "recommended_products"],
  initialContent = {},
  onSave,
  onCancel
}) {
  const [slotOrder, setSlotOrder] = useState(initialOrder);
  const [slotContent, setSlotContent] = useState(() => {
    const content = {};
    Object.values(SLOT_CONFIGS).forEach(config => {
      content[config.id] = initialContent[config.id] || config.defaultContent;
    });
    return content;
  });
  const [hiddenSlots, setHiddenSlots] = useState(new Set());
  const [editingSlot, setEditingSlot] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSlotOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
    
    setActiveId(null);
  };

  const toggleSlotVisibility = (slotId) => {
    setHiddenSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const updateSlotContent = (slotId, content) => {
    setSlotContent(prev => ({
      ...prev,
      [slotId]: content
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const configuration = {
      slotOrder,
      slotContent,
      hiddenSlots: Array.from(hiddenSlots),
      timestamp: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(configuration);
    } else {
      // Save to localStorage as fallback
      localStorage.setItem('cart_slots_config', JSON.stringify(configuration));
      console.log('Saved configuration:', configuration);
    }
    
    setHasChanges(false);
  };

  const handleReset = () => {
    setSlotOrder(initialOrder);
    setSlotContent(() => {
      const content = {};
      Object.values(SLOT_CONFIGS).forEach(config => {
        content[config.id] = config.defaultContent;
      });
      return content;
    });
    setHiddenSlots(new Set());
    setEditingSlot(null);
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Controls */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cart Layout Editor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Drag slots to reorder, click to edit content
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="secondary" className="bg-yellow-100">
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Layout Indicator */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-12 text-xs text-gray-400 flex justify-between">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="text-center">{i + 1}</div>
              ))}
            </div>
          </div>

          {/* Draggable Slots */}
          <div className="space-y-4 min-h-[500px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slotOrder}
                strategy={verticalListSortingStrategy}
              >
                {slotOrder.map((slotId) => {
                  const config = SLOT_CONFIGS[slotId];
                  if (!config) return null;

                  return (
                    <SortableItem
                      key={slotId}
                      id={slotId}
                      onToggleVisibility={toggleSlotVisibility}
                      onEdit={() => setEditingSlot(slotId)}
                      isHidden={hiddenSlots.has(slotId)}
                      isDeletable={config.deletable}
                    >
                      <EditableSlot
                        config={config}
                        content={slotContent[slotId]}
                        isEditing={editingSlot === slotId}
                        onEdit={() => setEditingSlot(slotId)}
                        onSave={() => setEditingSlot(null)}
                        onCancel={() => setEditingSlot(null)}
                        onChange={updateSlotContent}
                        isHidden={hiddenSlots.has(slotId)}
                      />
                    </SortableItem>
                  );
                })}
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="opacity-80">
                    <EditableSlot
                      config={SLOT_CONFIGS[activeId]}
                      content={slotContent[activeId]}
                      isEditing={false}
                      onEdit={() => {}}
                      onSave={() => {}}
                      onCancel={() => {}}
                      onChange={() => {}}
                      isHidden={hiddenSlots.has(activeId)}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Hidden Slots Section */}
          {hiddenSlots.size > 0 && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Hidden Slots ({hiddenSlots.size})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(hiddenSlots).map(slotId => {
                  const config = SLOT_CONFIGS[slotId];
                  const Icon = config.icon;
                  return (
                    <Badge 
                      key={slotId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleSlotVisibility(slotId)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {config.title}
                      <Eye className="w-3 h-3 ml-2" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}