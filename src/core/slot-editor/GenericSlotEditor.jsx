/**
 * GenericSlotEditor - Universal editor that works with any page slots
 * Store owners only see and edit their PageSlots.jsx file
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus
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

  // Load schema-based configuration from code
  const loadSchemaConfiguration = useCallback(async (configCode) => {
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
  }, [createDefaultSchemaConfig]);

  // Create default schema-based configuration
  const createDefaultSchemaConfig = useCallback(async () => {
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
  }, []);

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
          console.log('No schema config found, creating default config');
          await createDefaultSchemaConfig();
        }
      } catch (error) {
        console.error('Error loading slot configuration:', error);
        await createDefaultSchemaConfig();
      } finally {
        setIsLoading(false);
      }
    };

    loadSlotConfig();
  }, [pageName, configFilePath, loadSchemaConfiguration, createDefaultSchemaConfig]);

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

  const handleSlotEdit = useCallback(() => {
    // Slot editing functionality to be implemented
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
    // newSlot is now added to the slot order
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

  // Visual Layout Preview - shows slots as they appear in the actual layout
  const LayoutPreview = () => {
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

    // Get slot visual representation
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

    // Render individual slot in layout context
    const renderSlotInLayout = (slotId, index) => {
      const definition = slotDefinitions[slotId];
      if (!definition) return null;

      const visual = getSlotVisual(definition);
      const isEnabled = definition.enabled !== false;
      
      return (
        <div
          key={slotId}
          className={`relative border-2 rounded-lg p-4 m-2 transition-all duration-200 ${
            visual.color
          } ${isEnabled ? 'opacity-100' : 'opacity-50'}`}
          style={{
            minHeight: getSlotHeight(definition),
            width: getSlotWidth(definition)
          }}
        >
          {/* Slot Order Indicator */}
          <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${visual.textColor.replace('text-', 'bg-')} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>
            {index + 1}
          </div>

          {/* Slot Content */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">{visual.icon}</div>
            <div className="flex-1">
              <h4 className={`font-semibold ${visual.textColor}`}>
                {definition.name || slotId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {definition.description || `${definition.type} slot`}
              </p>
              <div className="text-xs text-gray-400 font-mono mt-1">{slotId}</div>
            </div>
          </div>

          {/* Disabled overlay */}
          {!isEnabled && (
            <div className="absolute inset-0 bg-gray-200/50 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-semibold text-sm">DISABLED</span>
            </div>
          )}
        </div>
      );
    };

    // Get slot dimensions based on type and name
    const getSlotHeight = (definition) => {
      if (definition.id === 'cart-page-header') return '80px';
      if (definition.id === 'cart-grid-layout') return '600px';
      if (definition.id === 'cart-items-container') return '400px';
      if (definition.id === 'cart-sidebar') return '400px';
      if (definition.id === 'cart-order-summary') return '200px';
      if (definition.id === 'cart-coupon-section') return '120px';
      if (definition.id === 'cart-checkout-button') return '60px';
      if (definition.id === 'cart-empty-display') return '200px';
      return '100px'; // default
    };

    const getSlotWidth = (definition) => {
      if (definition.id === 'cart-items-container') return '65%';
      if (definition.id === 'cart-sidebar') return '30%';
      if (definition.id === 'cart-order-summary') return '100%';
      if (definition.id === 'cart-coupon-section') return '100%';
      if (definition.id === 'cart-checkout-button') return '100%';
      return '100%'; // default
    };

    // Render layout structure
    const renderLayoutStructure = () => {
      const currentOrder = slotOrder.filter(id => slotDefinitions[id]);

      return (
        <div className="p-6 bg-white min-h-full">
          {/* Page Container */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-500 mb-4 font-semibold">📦 Cart Page Layout</div>
            
            {currentOrder.map((slotId, index) => {
              // Special layout handling for grid structure
              if (slotId === 'cart-grid-layout') {
                return (
                  <div key={slotId} className="mb-4">
                    {renderSlotInLayout(slotId, index)}
                    {/* Grid Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 p-4 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/30">
                      <div className="lg:col-span-2">
                        {/* Items Container */}
                        {currentOrder.includes('cart-items-container') && 
                          renderSlotInLayout('cart-items-container', currentOrder.indexOf('cart-items-container'))
                        }
                      </div>
                      <div className="lg:col-span-1">
                        {/* Sidebar with nested slots */}
                        <div className="space-y-4">
                          {currentOrder.includes('cart-sidebar') && 
                            renderSlotInLayout('cart-sidebar', currentOrder.indexOf('cart-sidebar'))
                          }
                          <div className="ml-4 space-y-2 border-l-2 border-green-200 pl-4">
                            {currentOrder.includes('cart-order-summary') && 
                              renderSlotInLayout('cart-order-summary', currentOrder.indexOf('cart-order-summary'))
                            }
                            {currentOrder.includes('cart-coupon-section') && 
                              renderSlotInLayout('cart-coupon-section', currentOrder.indexOf('cart-coupon-section'))
                            }
                            {currentOrder.includes('cart-checkout-button') && 
                              renderSlotInLayout('cart-checkout-button', currentOrder.indexOf('cart-checkout-button'))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Skip slots that are rendered within grid-layout
              if (['cart-items-container', 'cart-sidebar', 'cart-order-summary', 'cart-coupon-section', 'cart-checkout-button'].includes(slotId)) {
                return null;
              }
              
              // Regular slot rendering
              return renderSlotInLayout(slotId, index);
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="h-full bg-gray-100 overflow-y-auto">
        {renderLayoutStructure()}
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
                    Layout Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <LayoutPreview />
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