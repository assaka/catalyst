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
  Plus
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
  
  // Simple slot state for non-cart pages
  const [slotContent, setSlotContent] = useState({});
  
  const pageType = pageName.toLowerCase();
  
  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      // First try to load from database
      const storeId = localStorage.getItem('selectedStoreId');
      let config = null;
      
      if (storeId) {
        config = await SlotStorage.loadFromDatabase(pageType, storeId);
      }
      
      // Fallback to localStorage
      if (!config) {
        config = SlotStorage.load(pageType);
      }
      
      setSlotConfig(config);
      setPageConfig(getPageConfig(pageType));
      
      // Set code content for code mode
      if (config) {
        setCodeContent(JSON.stringify(config, null, 2));
      }
    };
    
    loadConfig();
  }, [pageType]);
  
  // Handle save from editor
  const handleSave = useCallback(async (config) => {
    console.log(`Saving ${pageType} configuration:`, config);
    
    // Save to localStorage
    SlotStorage.save(pageType, config);
    
    // Save to database
    const storeId = localStorage.getItem('selectedStoreId');
    if (storeId) {
      await SlotStorage.saveToDatabase(pageType, storeId, config);
    }
    
    setSlotConfig(config);
    setHasUnsavedChanges(false);
    
    // Update code view
    setCodeContent(JSON.stringify(config, null, 2));
  }, [pageType]);
  
  // Handle code save
  const handleCodeSave = useCallback(() => {
    try {
      const config = JSON.parse(codeContent);
      handleSave(config);
    } catch (error) {
      alert('Invalid JSON: ' + error.message);
    }
  }, [codeContent, handleSave]);
  
  // Render the editor - unified for all page types
  const renderEditor = () => {
    return renderSlots('editor');
  };
  
  const renderPreview = () => {
    return renderSlots('display');
  };

  // Slot rendering - handles all page types uniformly
  const renderSlots = (mode) => {
    // This is a simplified implementation
    // TODO: Add full micro-slot support here to make truly unified
    
    const slotIds = pageConfig?.defaultSlots || [];
    
    return (
      <div className={`unified-slots ${mode} p-4`}>
        <div className="space-y-6">
          {slotIds.map(slotId => {
            const slotConfig = pageConfig?.slots?.[slotId];
            const content = slotContent[slotId] || slotConfig?.defaultContent || `<div class="p-4 border rounded">${slotConfig?.name || slotId}</div>`;
            
            return (
              <div key={slotId} className={`slot-container relative ${mode === 'editor' ? 'border-2 border-dashed border-gray-300 rounded-lg p-4' : ''}`}>
                {mode === 'editor' && (
                  <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
                    {slotConfig?.name || slotId}
                  </div>
                )}
                
                <div dangerouslySetInnerHTML={{ __html: content }} />
                
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
            );
          })}
        </div>
      </div>
    );
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