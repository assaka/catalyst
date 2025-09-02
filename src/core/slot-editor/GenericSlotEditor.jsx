/**
 * GenericSlotEditor - Universal editor that works with any page slots
 * Store owners only see and edit their PageSlots.jsx file
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Eye, 
  Settings,
  Save,
  RefreshCw,
  GripVertical,
  Wand2,
  ArrowUpDown,
  Layout,
  FileCode,
  X,
  Plus,
  Edit,
  Trash2
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
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotOrder, setSlotOrder] = useState([]);

  // File paths - Support both legacy and schema-based files
  const slotsFilePath = `src/pages/${pageName}Slots.jsx`;
  const configFilePath = `src/pages/${pageName}Slots.config.js`;
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load schema-based slot configuration
  useEffect(() => {
    const loadSlotConfig = async () => {
      setIsLoading(true);
      try {
        // Try to load schema-based configuration first
        const configData = await apiClient.get(`extensions/baseline/${encodeURIComponent(configFilePath)}`);
        
        if (configData && configData.success && configData.data.hasBaseline) {
          const configCode = configData.data.baselineCode;
          setSlotsFileCode(configCode);
          
          // Load the schema-based configuration
          await loadSchemaConfiguration(configCode);
        } else {
          // Fallback to legacy slots file
          const slotsData = await apiClient.get(`extensions/baseline/${encodeURIComponent(slotsFilePath)}`);
          
          if (slotsData && slotsData.success && slotsData.data.hasBaseline) {
            const slotsCode = slotsData.data.baselineCode;
            setSlotsFileCode(slotsCode);
            
            // Create schema from legacy file
            await createSchemaFromLegacy(slotsCode);
          } else {
            // Create default schema configuration
            await createDefaultSchemaConfig();
          }
        }
      } catch (error) {
        console.error('Error loading slot configuration:', error);
        await createDefaultSchemaConfig();
      } finally {
        setIsLoading(false);
      }
    };

    loadSlotConfig();
  }, [pageName, slotsFilePath, configFilePath]);

  // Load schema-based configuration from code
  const loadSchemaConfiguration = async (configCode) => {
    try {
      // Evaluate the configuration code to get the schema object
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const moduleCode = `
        ${configCode}
        return { 
          CART_SLOTS_CONFIG, 
          CART_SLOT_DEFINITIONS, 
          CART_SLOT_ORDER, 
          CART_LAYOUT_PRESETS 
        };
      `;
      
      const configFunction = new AsyncFunction(moduleCode);
      const { CART_SLOT_DEFINITIONS, CART_SLOT_ORDER, CART_LAYOUT_PRESETS } = await configFunction();
      
      console.log('✅ Loaded schema-based configuration:', {
        definitions: Object.keys(CART_SLOT_DEFINITIONS).length,
        order: CART_SLOT_ORDER.length,
        presets: Object.keys(CART_LAYOUT_PRESETS).length
      });
      
      setSlotDefinitions(CART_SLOT_DEFINITIONS);
      setSlotOrder(CART_SLOT_ORDER);
      setPageConfig({
        slotOrder: CART_SLOT_ORDER,
        layoutPresets: CART_LAYOUT_PRESETS
      });
      
    } catch (error) {
      console.error('Error loading schema configuration:', error);
      await createDefaultSchemaConfig();
    }
  };

  // Create schema configuration from legacy code (enhanced to parse actual slots)
  const createSchemaFromLegacy = async (legacyCode) => {
    console.log('🔄 Converting legacy CartSlots.jsx to display format');
    
    try {
      const pagePrefix = pageName.toUpperCase();
      
      // Extract SLOT_DEFINITIONS using regex
      const slotDefRegex = new RegExp(`export\\s+const\\s+${pagePrefix}_SLOT_DEFINITIONS\\s*=\\s*\\{([\\s\\S]*?)\\};`, 'gm');
      const slotDefMatch = slotDefRegex.exec(legacyCode);
      
      // Extract SLOT_ORDER using regex  
      const slotOrderRegex = new RegExp(`export\\s+const\\s+${pagePrefix}_SLOT_ORDER\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'gm');
      const slotOrderMatch = slotOrderRegex.exec(legacyCode);
      
      if (slotDefMatch) {
        // Parse the slot definitions manually
        const slotDefContent = slotDefMatch[1];
        const parsedDefinitions = {};
        
        // Extract each slot definition using regex
        const slotRegex = /['"`]([^'"`]+)['"`]\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
        let slotMatch;
        
        while ((slotMatch = slotRegex.exec(slotDefContent)) !== null) {
          const slotId = slotMatch[1];
          const slotContent = slotMatch[2];
          
          // Extract basic properties
          const typeMatch = /type\s*:\s*['"`]([^'"`]+)['"`]/.exec(slotContent);
          const nameMatch = /name\s*:\s*['"`]([^'"`]+)['"`]/.exec(slotContent);
          const descMatch = /description\s*:\s*['"`]([^'"`]+)['"`]/.exec(slotContent);
          
          parsedDefinitions[slotId] = {
            id: slotId,
            type: typeMatch ? typeMatch[1] : 'component',
            name: nameMatch ? nameMatch[1] : slotId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: descMatch ? descMatch[1] : `${typeMatch ? typeMatch[1] : 'component'} slot`,
            enabled: true,
            required: true // Assume legacy slots are required
          };
        }
        
        console.log('🎯 Parsed actual cart slot definitions:', parsedDefinitions);
        setSlotDefinitions(parsedDefinitions);
        
        // Parse slot order
        let parsedOrder = Object.keys(parsedDefinitions);
        
        if (slotOrderMatch) {
          // Extract slot order array items, handling comments
          const orderContent = slotOrderMatch[1];
          const orderItems = orderContent
            .split(',')
            .map(item => {
              // Remove comments and whitespace
              const cleanItem = item.replace(/\/\/.*$/, '').trim().replace(/['"`]/g, '');
              return cleanItem;
            })
            .filter(item => item && item !== '');
          
          console.log('🎯 Parsed actual slot order:', orderItems);
          
          if (orderItems.length > 0) {
            parsedOrder = orderItems;
          }
        }
        
        setSlotOrder(parsedOrder);
        setPageConfig({
          slotOrder: parsedOrder,
          layoutPresets: {}
        });
        
        console.log('✅ Successfully loaded', Object.keys(parsedDefinitions).length, 'cart slots');
        
      } else {
        // Fallback if no slot definitions found
        console.warn('⚠️ No CART_SLOT_DEFINITIONS found, creating fallback');
        await createDefaultSchemaConfig();
      }
      
    } catch (error) {
      console.error('❌ Error parsing legacy cart slots:', error);
      await createDefaultSchemaConfig();
    }
  };

  // Create default schema-based configuration
  const createDefaultSchemaConfig = async () => {
    const defaultSlots = {
      'page-root': {
        id: 'page-root',
        type: 'layout',
        name: 'Page Root',
        description: 'Root layout container',
        required: true,
        order: 0
      },
      'main-content': {
        id: 'main-content',
        type: 'component',
        name: 'Main Content',
        description: 'Primary content area',
        required: true,
        order: 1
      }
    };
    
    const defaultOrder = Object.keys(defaultSlots);
    
    setSlotDefinitions(defaultSlots);
    setSlotOrder(defaultOrder);
    setPageConfig({
      slotOrder: defaultOrder,
      layoutPresets: {
        default: {
          name: 'Default Layout',
          slotOrder: defaultOrder
        }
      }
    });
    
    console.log('📝 Created default schema configuration');
  };

  // Generate sortable slot items from definitions in order
  const sortableSlots = useMemo(() => {
    console.log('🎯 Generating sortableSlots:', { slotOrder, slotDefinitions });
    
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

    const result = slotOrder
      .filter(id => {
        const exists = slotDefinitions[id];
        if (!exists) {
          console.warn(`⚠️ Slot "${id}" not found in definitions`);
        }
        return exists;
      })
      .map(id => {
        const definition = slotDefinitions[id];
        return {
          id,
          name: definition.name || id.split('-').pop(),
          description: definition.description || `${definition.type} slot`,
          icon: getSlotIcon(definition.type),
          type: definition.type,
          ...definition
        };
      });
      
    console.log('🎯 Generated sortableSlots:', result);
    return result;
  }, [slotOrder, slotDefinitions]);

  // Slot management functions
  const handleSlotToggle = useCallback((slotId) => {
    setSlotDefinitions(prev => {
      const updated = { ...prev };
      if (updated[slotId]) {
        updated[slotId] = {
          ...updated[slotId],
          enabled: updated[slotId].enabled === false ? true : false
        };
      }
      return updated;
    });
  }, []);

  const handleSlotEdit = useCallback((slot) => {
    setEditingSlot(slot);
  }, []);

  const handleSlotDelete = useCallback((slotId) => {
    if (confirm(`Are you sure you want to delete the "${slotId}" slot?`)) {
      setSlotDefinitions(prev => {
        const updated = { ...prev };
        delete updated[slotId];
        return updated;
      });
      
      setSlotOrder(prev => prev.filter(id => id !== slotId));
    }
  }, []);

  const handleAddNewSlot = useCallback(() => {
    const newSlotId = `new-slot-${Date.now()}`;
    const newSlot = {
      id: newSlotId,
      name: 'New Slot',
      type: 'component',
      description: 'A new custom slot',
      enabled: true,
      required: false
    };

    setSlotDefinitions(prev => ({
      ...prev,
      [newSlotId]: newSlot
    }));
    
    setSlotOrder(prev => [...prev, newSlotId]);
    setEditingSlot(newSlot);
  }, []);

  // Enhanced drag and drop handling
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setSlotOrder(prevOrder => {
      const oldIndex = prevOrder.indexOf(active.id);
      const newIndex = prevOrder.indexOf(over.id);
      
      if (oldIndex === -1 || newIndex === -1) return prevOrder;
      
      const newOrder = arrayMove(prevOrder, oldIndex, newIndex);
      console.log('🔄 Slot order updated:', newOrder);
      return newOrder;
    });
  }, []);

  // Enhanced slot item with better visualization and editing
  const SortableSlotItem = ({ slot, index, onEdit, onToggle, onDelete }) => {
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

    // Determine slot icon and color based on type
    const getSlotVisual = (slotDef) => {
      const iconMap = {
        'container': { icon: '📦', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
        'component': { icon: '⚙️', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
        'layout': { icon: '📐', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
        'content': { icon: '📄', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
        'action': { icon: '🔘', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
        'default': { icon: '🧩', color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' }
      };
      
      return iconMap[slotDef.type] || iconMap.default;
    };

    const visual = getSlotVisual(slot);
    const isEnabled = slot.enabled !== false; // Default to enabled

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative border-2 rounded-lg transition-all duration-200 ${
          isDragging 
            ? `shadow-2xl rotate-2 scale-105 ${visual.color}` 
            : `shadow-sm hover:shadow-lg ${visual.color} ${isEnabled ? '' : 'opacity-50'}`
        }`}
      >
        {/* Slot Order Indicator */}
        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${visual.textColor.replace('text-', 'bg-')} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>
          {index + 1}
        </div>

        {/* Main Content */}
        <div className="p-4 flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          {/* Slot Icon */}
          <div className="text-2xl select-none">{visual.icon}</div>
          
          {/* Slot Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold truncate ${visual.textColor}`}>
                {slot.name || slot.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {slot.type}
              </Badge>
              {slot.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">
              {slot.description || 'No description available'}
            </p>
            <div className="text-xs text-gray-400 font-mono mt-1 truncate">{slot.id}</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Toggle Enable/Disable */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle?.(slot.id)}
              className={`w-8 h-8 ${isEnabled ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
              title={isEnabled ? 'Disable slot' : 'Enable slot'}
            >
              <Eye className={`w-4 h-4 ${isEnabled ? '' : 'line-through'}`} />
            </Button>
            
            {/* Edit Configuration */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(slot)}
              className="w-8 h-8 text-blue-600 hover:text-blue-800"
              title="Edit slot configuration"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            {/* Delete (only if not required) */}
            {!slot.required && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(slot.id)}
                className="w-8 h-8 text-red-600 hover:text-red-800"
                title="Remove slot"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Disabled Overlay */}
        {!isEnabled && (
          <div className="absolute inset-0 bg-gray-200/50 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 font-semibold">DISABLED</span>
          </div>
        )}
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
          slotOrder={pageConfig.slotOrder || Object.keys(slotDefinitions)}
          layoutConfig={pageConfig.layoutPresets?.default || {}}
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
            <FileCode className="w-6 h-6" />
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
                        {sortableSlots.map((slot, index) => (
                          <SortableSlotItem 
                            key={slot.id} 
                            slot={slot} 
                            index={index}
                            onEdit={handleSlotEdit}
                            onToggle={handleSlotToggle}
                            onDelete={handleSlotDelete}
                          />
                        ))}
                        
                        {/* Add New Slot Button */}
                        <Button 
                          variant="dashed" 
                          className="w-full py-6 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                          onClick={handleAddNewSlot}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add New Slot
                        </Button>
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