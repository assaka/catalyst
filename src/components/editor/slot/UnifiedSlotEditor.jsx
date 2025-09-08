/**
 * UnifiedSlotEditor - Replaces the old GenericSlotEditor with our new unified system
 * This wrapper provides the UI for switching between layout/preview/code modes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPageConfig, getMicroSlotDefinitions } from '@/components/editor/slot/configs/index';
import { SlotStorage } from '@/components/editor/slot/slot-utils';
import Editor from "@monaco-editor/react";
import {
  Eye,
  Code,
  Layout,
  ShoppingCart,
  Package,
  Grid,
  FileText,
  Save,
  Download,
  Upload,
  GripVertical,
  Edit,
  Plus,
  Clock
} from 'lucide-react';
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import slotConfigurationService from '@/services/slotConfigurationService';
import { formatDistanceToNow } from 'date-fns';

// Dynamically import CartSlotsEditor for cart pages
const CartSlotsEditor = React.lazy(() => import('@/pages/editor/CartSlotsEditor'));

// Sortable Slot Component
function SortableSlot({ id, children, mode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: mode !== 'editor'
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {mode === 'editor' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move z-10 p-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function UnifiedSlotEditor({
  pageName,
  slotType = 'layout',
  pageId = null,
  onClose = () => {},
}) {
  const [mode, setMode] = useState('layout'); // 'layout', 'preview', 'code'
  const [pageConfig, setPageConfig] = useState(null);
  const [slotConfig, setSlotConfig] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  
  // Slot content and order state
  const [slotContent, setSlotContent] = useState({});
  const [slotOrder, setSlotOrder] = useState([]);
  
  // Draft and published configuration state
  const [draftConfig, setDraftConfig] = useState(null);
  const [publishedConfig, setPublishedConfig] = useState(null);
  
  const { selectedStore } = useStoreSelection();
  
  const pageType = pageName.toLowerCase();
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      // First try to load from database
      const storeId = localStorage.getItem('selectedStoreId');
      let config = null;
      
      // Database load disabled - use CartSlotsEditor with versioning system instead
      console.log('💾 UnifiedSlotEditor database load disabled - use CartSlotsEditor with versioning system');
      
      // Fallback to localStorage
      if (!config) {
        config = SlotStorage.load(pageType);
        console.log('Loaded from localStorage:', config);
      }
      
      const loadedPageConfig = getPageConfig(pageType);
      setSlotConfig(config);
      setPageConfig(loadedPageConfig);
      
      // Initialize slot order
      if (config?.majorSlots) {
        console.log('Setting slot order from config:', config.majorSlots);
        setSlotOrder(config.majorSlots);
      } else if (loadedPageConfig?.defaultSlots) {
        console.log('Setting slot order from defaults:', loadedPageConfig.defaultSlots);
        setSlotOrder(loadedPageConfig.defaultSlots);
      }
      
      // Load any saved slot content
      if (config?.slotContent) {
        setSlotContent(config.slotContent);
      }
      
      // Set code content for code mode
      if (config) {
        setCodeContent(JSON.stringify(config, null, 2));
      }
    };
    
    loadConfig();
  }, [pageType]);
  
  // Load draft and published configurations for status display
  useEffect(() => {
    const loadConfigurations = async () => {
      if (selectedStore?.id && pageType === 'cart') {
        try {
          // Load draft configuration
          const draftResponse = await slotConfigurationService.getDraftConfiguration(selectedStore.id, pageType);
          if (draftResponse.success) {
            setDraftConfig(draftResponse.data);
          }
          
          // Load published configuration
          const publishedResponse = await slotConfigurationService.getPublishedConfiguration(selectedStore.id, pageType);
          if (publishedResponse.success) {
            setPublishedConfig(publishedResponse.data);
          }
        } catch (error) {
          console.error('Error loading configurations:', error);
        }
      }
    };
    
    loadConfigurations();
  }, [selectedStore?.id, pageType]);
  
  // Handle save from editor
  const handleSave = useCallback(async (config) => {
    console.log(`Saving ${pageType} configuration:`, config);
    
    // Save to localStorage
    SlotStorage.save(pageType, config);
    
    // Save to database using slot configuration API
    try {
      if (selectedStore?.id) {
        console.log('💾 Saving configuration to database via slot configuration API');
        await slotConfigurationService.saveConfiguration(selectedStore.id, config, pageType);
        console.log('✅ Configuration saved to database successfully');
      } else {
        console.warn('⚠️ No selected store - skipping database save');
      }
    } catch (error) {
      console.error('❌ Failed to save configuration to database:', error);
      // Continue with local save even if database save fails
    }
    
    setSlotConfig(config);
    setHasUnsavedChanges(false);
    
    // Update code view
    setCodeContent(JSON.stringify(config, null, 2));
  }, [pageType, selectedStore?.id]);
  
  // Handle code save
  const handleCodeSave = useCallback(() => {
    try {
      const config = JSON.parse(codeContent);
      handleSave(config);
    } catch (error) {
      alert('Invalid JSON: ' + error.message);
    }
  }, [codeContent, handleSave]);
  
  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedSlot(active.id);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSlotOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Only save for non-cart pages (cart pages handle their own saving)
        if (pageType !== 'cart') {
          const updatedConfig = {
            ...(slotConfig || {}),
            majorSlots: newOrder,
            slotContent: slotContent
          };
          handleSave(updatedConfig);
        }
        
        return newOrder;
      });
    }
    
    setDraggedSlot(null);
  };
  
  // Render the editor - unified for all page types
  const renderEditor = () => {
    // For cart pages with micro-slots, use specialized editor
    if (pageType === 'cart' && getMicroSlotDefinitions('cart')) {
      return (
        <React.Suspense fallback={<div className="p-4">Loading cart editor...</div>}>
          <CartSlotsEditor 
            mode="edit" 
            onSave={handleSave}
            data={slotConfig || {}}
          />
        </React.Suspense>
      );
    }
    return renderSlots('editor');
  };
  
  const renderPreview = () => {
    // For cart pages with micro-slots, use specialized editor
    if (pageType === 'cart' && getMicroSlotDefinitions('cart')) {
      return (
        <React.Suspense fallback={<div className="p-4">Loading cart preview...</div>}>
          <CartSlotsEditor 
            mode="preview"
            data={slotConfig || {}}
          />
        </React.Suspense>
      );
    }
    return renderSlots('display');
  };

  // Slot rendering - handles all page types uniformly
  const renderSlots = (mode) => {
    const slotIds = slotOrder.length > 0 ? slotOrder : (pageConfig?.defaultSlots || []);
    
    const content = (
      <div className={`unified-slots ${mode} p-4`}>
        <div className="space-y-4">
          {slotIds.map(slotId => {
            const slotData = pageConfig?.slots?.[slotId];
            const slotHtml = slotContent[slotId] || slotData?.defaultContent || 
              `<div class="p-4 border rounded">${slotData?.name || slotId}</div>`;
            
            return (
              <SortableSlot key={slotId} id={slotId} mode={mode}>
                <div className={`slot-container relative ${mode === 'editor' ? 'border-2 border-dashed border-gray-300 rounded-lg p-4 pl-12 hover:border-blue-400' : ''}`}>
                  {mode === 'editor' && (
                    <div className="absolute -top-3 left-12 px-2 bg-white text-xs font-medium text-gray-500">
                      {slotData?.name || slotId}
                    </div>
                  )}
                  
                  <div 
                    dangerouslySetInnerHTML={{ __html: slotHtml }}
                    className={mode === 'editor' ? 'pointer-events-none' : ''}
                  />
                  
                  {/* Edit button for editor mode */}
                  {mode === 'editor' && (
                    <button
                      onClick={() => {
                        setActiveSlot(slotId);
                        // TODO: Open edit dialog for slot content
                        console.log('Edit slot:', slotId);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* CMS blocks */}
                  {pageConfig?.cmsBlocks?.map(cmsBlock => 
                    cmsBlock.includes(slotId) && (
                      <CmsBlockRenderer 
                        key={cmsBlock}
                        position={cmsBlock} 
                        storeId={localStorage.getItem('selectedStoreId')} 
                      />
                    )
                  )}
                </div>
              </SortableSlot>
            );
          })}
        </div>
      </div>
    );

    // Wrap in DndContext for editor mode
    if (mode === 'editor') {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={slotIds} strategy={verticalListSortingStrategy}>
            {content}
          </SortableContext>
          <DragOverlay>
            {draggedSlot ? (
              <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 opacity-80">
                {pageConfig?.slots?.[draggedSlot]?.name || draggedSlot}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      );
    }

    return content;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">
              {pageName} Page Editor
            </h1>
            <p className="text-sm text-gray-600">
              {mode === 'layout' && 'Drag to reorder, click to edit'}
              {mode === 'preview' && 'Preview your changes'}
              {mode === 'code' && 'Edit configuration as JSON'}
            </p>
          </div>
          
          {/* Mode switcher */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'layout' ? 'default' : 'outline'}
              onClick={() => setMode('layout')}
              size="sm"
            >
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </Button>
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => setMode('preview')}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant={mode === 'code' ? 'default' : 'outline'}
              onClick={() => setMode('code')}
              size="sm"
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Status - shown below Layout/Preview/Code buttons */}
      {pageType === 'cart' && (draftConfig || publishedConfig) && (
        <div className="bg-gray-50 border-b px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              {draftConfig && draftConfig.updated_at && (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Draft:</strong> Last modified {(() => {
                      try {
                        const date = new Date(draftConfig.updated_at);
                        return isNaN(date.getTime()) ? 'Unknown' : formatDistanceToNow(date, { addSuffix: true });
                      } catch (error) {
                        return 'Unknown';
                      }
                    })()}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center">
              {publishedConfig && publishedConfig.published_at && (
                <span>
                  <strong>Published:</strong> Version {publishedConfig.version_number} • {(() => {
                    try {
                      const date = new Date(publishedConfig.published_at);
                      return isNaN(date.getTime()) ? 'Unknown' : formatDistanceToNow(date, { addSuffix: true });
                    } catch (error) {
                      return 'Unknown';
                    }
                  })()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {mode === 'layout' && (
          <div className="h-full">
            {renderEditor()}
          </div>
        )}
        
        {mode === 'preview' && (
          <div className="h-full">
            {renderPreview()}
          </div>
        )}
        
        {mode === 'display' && (
          <div className="h-full">
            {renderPreview()}
          </div>
        )}
        
        {mode === 'code' && (
          <div className="h-full p-4">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={codeContent}
                  onChange={(value) => {
                    setCodeContent(value || '');
                    setHasUnsavedChanges(true);
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {(mode === 'code' && hasUnsavedChanges) && (
        <div className="bg-white border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setHasUnsavedChanges(false)}>
            Cancel
          </Button>
          <Button onClick={handleCodeSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}