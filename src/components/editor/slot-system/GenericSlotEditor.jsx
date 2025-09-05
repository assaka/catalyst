/**
 * GenericSlotEditor - A unified, configurable slot editor for any page type
 * Can be used in Editor mode (with drag-drop) or Display mode (read-only)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Editor from "@monaco-editor/react";
import {
  GripVertical,
  Edit,
  Plus,
  Save,
  Code,
  RefreshCw,
  ShoppingCart,
  Package,
  Grid,
  FileText,
  Home,
  Users,
  Settings
} from "lucide-react";

// Sortable wrapper for major slots
function SortableSlot({ id, children, isDraggable = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: !isDraggable 
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  return (
    <div ref={setNodeRef} style={style} {...(isDraggable ? { ...attributes, ...listeners } : {})}>
      {children}
    </div>
  );
}

// Generic Slot Component
function GenericSlot({ 
  id, 
  name, 
  children, 
  onEdit, 
  isDraggable = true,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onAddSlot,
  dragAttributes,
  dragListeners,
  isDragging
}) {
  return (
    <div
      className={`relative ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Drag handle */}
      {isDraggable && (isHovered || isDragging) && (
        <div 
          className="absolute left-2 top-2 p-1 bg-blue-100/80 rounded z-30 cursor-grab hover:bg-blue-200"
          {...(dragListeners || {})}
          {...(dragAttributes || {})}
        >
          <GripVertical className="w-4 h-4 text-blue-400" />
        </div>
      )}
      
      {/* Edit button */}
      {onEdit && isHovered && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="absolute right-2 top-2 p-1.5 bg-blue-100/90 rounded z-30 hover:bg-blue-200"
          title="Edit section"
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
      )}
      
      {/* Add slot button */}
      {onAddSlot && isHovered && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSlot(id);
          }}
          className="absolute right-2 bottom-2 p-1.5 bg-green-100/90 rounded z-30 hover:bg-green-200"
          title="Add new slot"
        >
          <Plus className="w-4 h-4 text-green-600" />
        </button>
      )}

      {/* Section label */}
      <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
        {name}
      </div>

      {/* Content */}
      <div className={`border-2 border-dashed ${isHovered ? 'border-gray-400 bg-gray-50/30' : 'border-gray-300'} rounded-lg p-4 bg-white transition-colors`}>
        {children}
      </div>
    </div>
  );
}

// Main Generic Slot Editor Component
export default function GenericSlotEditor({
  pageType = 'custom', // 'cart', 'category', 'product', 'homepage', etc.
  pageConfig, // Page-specific configuration
  data = {}, // Page data (products, categories, cart items, etc.)
  mode = 'editor', // 'editor' or 'display'
  onSave,
  className = ''
}) {
  // Get store from context
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  
  // State for slot configuration
  const [slotConfig, setSlotConfig] = useState(() => {
    // Load from localStorage or use defaults from pageConfig
    const savedConfig = localStorage.getItem(`${pageType}_slot_config`);
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
    return pageConfig?.defaultConfig || {};
  });

  const [majorSlots, setMajorSlots] = useState(
    slotConfig.majorSlots || pageConfig?.defaultSlots || []
  );
  
  const [slotContent, setSlotContent] = useState(
    slotConfig.slotContent || {}
  );
  
  const [editingSlot, setEditingSlot] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // View mode state (for pages with multiple views like cart)
  const [viewMode, setViewMode] = useState(pageConfig?.defaultView || 'default');
  
  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  
  // Save configuration
  const saveConfiguration = useCallback(() => {
    const config = {
      majorSlots,
      slotContent,
      viewMode,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem(`${pageType}_slot_config`, JSON.stringify(config));
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(config);
    }
    
    console.log(`Saved ${pageType} configuration:`, config);
  }, [majorSlots, slotContent, viewMode, pageType, onSave]);
  
  // Auto-save on changes
  useEffect(() => {
    const saveTimer = setTimeout(saveConfiguration, 1000);
    return () => clearTimeout(saveTimer);
  }, [majorSlots, slotContent, saveConfiguration]);
  
  // Handle drag end
  const handleDragEnd = (event) => {
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
  };
  
  // Handle drag start
  const handleDragStart = (event) => {
    setActiveDragSlot(event.active.id);
  };
  
  // Handle edit slot
  const handleEditSlot = (slotId) => {
    const content = slotContent[slotId] || '';
    setEditingSlot(slotId);
    setTempCode(content);
  };
  
  // Handle save edited code
  const handleSaveCode = () => {
    if (editingSlot) {
      setSlotContent(prev => ({
        ...prev,
        [editingSlot]: tempCode
      }));
    }
    setEditingSlot(null);
    setTempCode('');
  };
  
  // Handle reset layout
  const handleResetLayout = () => {
    setMajorSlots(pageConfig?.defaultSlots || []);
    setSlotContent({});
    setShowResetModal(false);
    saveConfiguration();
  };
  
  // Render slot based on type and configuration
  const renderSlot = (slotId) => {
    const slotDef = pageConfig?.slots?.[slotId];
    if (!slotDef) return null;
    
    // Check if slot should be shown in current view mode
    if (slotDef.views && !slotDef.views.includes(viewMode)) {
      return null;
    }
    
    const SlotComponent = slotDef.component;
    const slotData = slotDef.getData ? slotDef.getData(data) : data;
    const content = slotContent[slotId] || slotDef.defaultContent || '';
    
    return (
      <SortableSlot key={slotId} id={slotId} isDraggable={mode === 'editor'}>
        <GenericSlot
          id={slotId}
          name={slotDef.name}
          onEdit={mode === 'editor' ? handleEditSlot : null}
          isDraggable={mode === 'editor'}
          isHovered={hoveredSlot === slotId}
          onMouseEnter={() => setHoveredSlot(slotId)}
          onMouseLeave={() => setHoveredSlot(null)}
          isDragging={activeDragSlot === slotId}
        >
          {SlotComponent ? (
            <SlotComponent 
              data={slotData} 
              content={content}
              config={slotConfig}
              mode={mode}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </GenericSlot>
      </SortableSlot>
    );
  };
  
  // Render CMS blocks if configured
  const renderCmsBlocks = (position) => {
    if (!pageConfig?.cmsBlocks?.includes(position)) return null;
    return <CmsBlockRenderer position={position} storeId={currentStoreId} />;
  };
  
  return (
    <div className={`generic-slot-editor ${className}`}>
      {/* Header bar for editor mode */}
      {mode === 'editor' && (
        <div className="bg-white border-b shadow-sm mb-4">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {pageConfig?.title || `${pageType} Layout Editor`}
              </div>
              <div className="flex gap-2">
                {/* View mode toggles if applicable */}
                {pageConfig?.views && pageConfig.views.map(view => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === view.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {view.icon && <view.icon className="w-4 h-4 inline mr-1.5" />}
                    {view.label}
                  </button>
                ))}
                
                {pageConfig?.views && <div className="border-l mx-2" />}
                
                {/* Reset button */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Layout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="slot-editor-content">
        {renderCmsBlocks(`${pageType}_header`)}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          disabled={mode !== 'editor'}
        >
          <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {majorSlots.map(slotId => renderSlot(slotId))}
            </div>
          </SortableContext>
          
          {/* Drag overlay */}
          {mode === 'editor' && (
            <DragOverlay>
              {activeDragSlot ? (
                <div className="bg-white shadow-2xl rounded-lg p-4 opacity-80">
                  <Badge>{activeDragSlot}</Badge>
                </div>
              ) : null}
            </DragOverlay>
          )}
        </DndContext>
        
        {renderCmsBlocks(`${pageType}_footer`)}
      </div>
      
      {/* Edit modal */}
      {mode === 'editor' && (
        <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
          <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Edit Slot: {editingSlot}
              </DialogTitle>
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
              <Button variant="outline" onClick={() => setEditingSlot(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCode}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Reset confirmation modal */}
      {mode === 'editor' && (
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Layout?</DialogTitle>
            </DialogHeader>
            <p>This will reset the layout to default settings. All customizations will be lost.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleResetLayout}>
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}