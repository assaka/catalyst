/**
 * GenericSlotEditor - Universal editor that works with any page slots
 * Store owners only see and edit their PageSlots.jsx file
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Eye, 
  Settings, 
  ShoppingCart,
  Save,
  RefreshCw,
  GripVertical,
  Wand2,
  ArrowUpDown,
  Layout
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CodeEditor from '@/components/ai-context/CodeEditor.jsx';
import SlotWrapper from '@/core/slot-system/SlotWrapper.jsx';
import apiClient from '@/api/client';

const GenericSlotEditor = ({
  pageName = 'Cart', // 'Cart', 'Product', 'Checkout', etc.
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State
  const [mode, setMode] = useState('visual'); // 'visual' | 'code'
  const [slotsFileCode, setSlotsFileCode] = useState('');
  const [slotDefinitions, setSlotDefinitions] = useState({});
  const [pageConfig, setPageConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState({});

  // File paths
  const slotsFilePath = `src/pages/slots/${pageName}PageSlots.jsx`;
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load slots file
  useEffect(() => {
    const loadSlotsFile = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`extensions/baseline/${encodeURIComponent(slotsFilePath)}`);
        
        if (data && data.success && data.data.hasBaseline) {
          const code = data.data.baselineCode;
          setSlotsFileCode(code);
          
          // Parse the slots file to extract definitions and config
          await parseSlotDefinitions(code);
        } else {
          // Create default slots file for the page
          await createDefaultSlotsFile();
        }
      } catch (error) {
        console.error('Error loading slots file:', error);
        await createDefaultSlotsFile();
      } finally {
        setIsLoading(false);
      }
    };

    loadSlotsFile();
  }, [pageName, slotsFilePath]);

  // Parse slot definitions from code
  const parseSlotDefinitions = async (code) => {
    try {
      // Create a temporary module to extract exports
      const tempModule = {};
      const moduleCode = code + `
        if (typeof CART_SLOT_DEFINITIONS !== 'undefined') {
          tempModule.SLOT_DEFINITIONS = CART_SLOT_DEFINITIONS;
        }
        if (typeof CART_PAGE_CONFIG !== 'undefined') {
          tempModule.PAGE_CONFIG = CART_PAGE_CONFIG;  
        }
      `;
      
      // Execute in sandbox (simplified for demo)
      // In production, use a proper parser or require the module
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const parseFunction = new AsyncFunction('tempModule', moduleCode);
      await parseFunction(tempModule);
      
      if (tempModule.SLOT_DEFINITIONS) {
        setSlotDefinitions(tempModule.SLOT_DEFINITIONS);
      }
      if (tempModule.PAGE_CONFIG) {
        setPageConfig(tempModule.PAGE_CONFIG);
      }
    } catch (error) {
      console.error('Error parsing slot definitions:', error);
    }
  };

  // Create default slots file
  const createDefaultSlotsFile = async () => {
    const defaultCode = `// Default ${pageName} Page Slots
export const ${pageName.toUpperCase()}_SLOT_DEFINITIONS = {
  'page-root': {
    id: 'page-root',
    type: 'layout',
    defaultLayout: 'stack',
    slots: ['main-content']
  },
  'main-content': {
    id: 'main-content', 
    type: 'component',
    component: 'div',
    className: 'container mx-auto p-6',
    defaultProps: {
      children: <h1>${pageName} Page</h1>
    }
  }
};

export const ${pageName.toUpperCase()}_PAGE_CONFIG = {
  layout: 'stack',
  slots: {}
};`;
    
    setSlotsFileCode(defaultCode);
    await parseSlotDefinitions(defaultCode);
  };

  // Generate sortable slot items from definitions
  const sortableSlots = Object.entries(slotDefinitions).map(([id, definition]) => ({
    id,
    name: definition.name || id.split('-').pop(),
    description: definition.description || `${definition.type} slot`,
    icon: getSlotIcon(definition.type),
    type: definition.type,
    ...definition
  }));

  // Get icon for slot type
  const getSlotIcon = (type) => {
    const icons = {
      component: '🧩',
      container: '📦', 
      layout: '📐',
      'micro-slot': '🔬'
    };
    return icons[type] || '⚙️';
  };

  // Drag and drop handling
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Update slot order in the config
    // This is a simplified version - real implementation would update the actual file
    console.log('Reordering slots:', active.id, 'to position of', over.id);
  }, []);

  // Sortable slot item component
  const SortableSlotItem = ({ slot }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: slot.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 border rounded-lg bg-white shadow-sm flex items-center gap-3 ${
          isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
        }`}
      >
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="text-2xl">{slot.icon}</div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{slot.name}</h4>
            <Badge variant="outline" className="text-xs">
              {slot.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{slot.description}</p>
          <div className="text-xs text-gray-400 font-mono mt-1">{slot.id}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" title="Configure slot">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  // Live preview component
  const LivePreview = () => {
    if (!slotDefinitions || Object.keys(slotDefinitions).length === 0) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <Layout className="w-12 h-12 mx-auto mb-4" />
            <p>No slot definitions found</p>
            <p className="text-sm">Configure slots in the code editor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <SlotWrapper
          slotDefinitions={slotDefinitions}
          pageConfig={pageConfig}
          data={previewData}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading {pageName} page slots...</span>
      </div>
    );
  }

  return (
    <div className={`generic-slot-editor h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            {pageName} Page Editor
          </h1>
          <p className="text-sm text-gray-600">
            Customize layout by editing <code>{slotsFilePath}</code>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave({ slotsFileCode, slotDefinitions, pageConfig })}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'visual' ? (
          /* VISUAL MODE: Drag & Drop + Preview */
          <div className="h-full grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
            {/* Left: Slot Management */}
            <div className="xl:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5" />
                    Slot Layout
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Drag slots to rearrange your {pageName.toLowerCase()} page
                  </p>
                </CardHeader>
                <CardContent className="p-4 h-full overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={sortableSlots.map(s => s.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {sortableSlots.map(slot => (
                          <SortableSlotItem key={slot.id} slot={slot} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </div>
            
            {/* Right: Live Preview */}
            <div className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <LivePreview />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* CODE MODE: Direct File Editing */
          <div className="h-full p-4">
            <Card className="h-full">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  {slotsFilePath}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Edit slot definitions and layout configuration directly
                </p>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <CodeEditor
                  value={slotsFileCode}
                  onChange={setSlotsFileCode}
                  fileName={`${pageName}PageSlots.jsx`}
                  language="javascript"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericSlotEditor;