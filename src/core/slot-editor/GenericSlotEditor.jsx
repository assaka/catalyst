/**
 * GenericSlotEditor - Universal editor that works with any page slots
 * Store owners only see and edit their PageSlots.jsx file
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import CartSlots from '@/pages/CartSlots';
import { 
  Code, 
  Eye, 
  Settings,
  RefreshCw,
  GripVertical,
  Wand2,
  ArrowUpDown,
  Layout,
  FileCode,
  X,
  Plus,
  Tag,
  ShoppingCart,
  Minus
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
import { SlotConfiguration } from '@/api/entities';

const GenericSlotEditor = ({
  pageName = 'Cart', // 'Cart', 'Product', 'Checkout', etc.
  data = {}, // Real data to pass to slot components
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State
  const [mode, setMode] = useState('layout'); // 'layout' | 'preview' | 'code'
  const [slotsFileCode, setSlotsFileCode] = useState('');
  const [slotDefinitions, setSlotDefinitions] = useState({});
  const [pageConfig, setPageConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [slotOrder, setSlotOrder] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [slotPositions, setSlotPositions] = useState({}); // Will store grid positions like { row: 2, col: 3 }
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Auto-save refs
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  // File path to the actual file being edited
  const slotsFilePath = `src/pages/${pageName}Slots.jsx`;
  const configFilePath = slotsFilePath; // Use the same path since config files are removed
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Load schema-based configuration from code
  const loadSchemaConfiguration = useCallback(async (configCode) => {
    try {
      console.log('🔄 Attempting to parse schema configuration...');
      
      // Parse the configuration using regex since it has imports we can't evaluate
      const parseSchemaConfig = (code) => {
        // Extract the built configuration
        const configMatch = code.match(/\.build\(\)\s*;/);
        if (!configMatch) {
          console.warn('Could not find .build() in config');
          return null;
        }
        
        // Extract slot definitions
        const slots = {};
        const slotPattern = /\.addSlot\(\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*\)/g;
        let match;
        
        while ((match = slotPattern.exec(code)) !== null) {
          const slotContent = match[1];
          
          // Extract slot properties
          const idMatch = slotContent.match(/id\s*:\s*['"`]([^'"`]+)['"`]/);
          const typeMatch = slotContent.match(/type\s*:\s*['"`]([^'"`]+)['"`]/);
          const nameMatch = slotContent.match(/name\s*:\s*['"`]([^'"`]+)['"`]/);
          const descMatch = slotContent.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
          const componentMatch = slotContent.match(/component\s*:\s*['"`]([^'"`]+)['"`]/);
          const requiredMatch = slotContent.match(/required\s*:\s*(\w+)/);
          const orderMatch = slotContent.match(/order\s*:\s*(\d+)/);
          const parentMatch = slotContent.match(/parent\s*:\s*['"`]([^'"`]+)['"`]/);
          
          if (idMatch) {
            const slotId = idMatch[1];
            slots[slotId] = {
              id: slotId,
              type: typeMatch ? typeMatch[1] : 'component',
              name: nameMatch ? nameMatch[1] : slotId,
              description: descMatch ? descMatch[1] : '',
              component: componentMatch ? componentMatch[1] : slotId,
              required: requiredMatch ? requiredMatch[1] === 'true' : false,
              enabled: true,
              order: orderMatch ? parseInt(orderMatch[1]) : 0,
              parent: parentMatch ? parentMatch[1] : null
            };
          }
        }
        
        // Extract slot order - check both array and config property formats
        let slotOrder = Object.keys(slots);
        
        // Try to find CART_SLOT_ORDER export
        const orderMatch = code.match(/CART_SLOT_ORDER\s*=\s*(?:\[([^\]]+)\]|CART_SLOTS_CONFIG\.slotOrder)/);
        if (orderMatch) {
          if (orderMatch[1]) {
            // It's an array format
            const orderContent = orderMatch[1];
            slotOrder = orderContent
              .split(',')
              .map(s => s.trim().replace(/['"`]/g, ''))
              .filter(s => s.length > 0);
          } else {
            // It's from config, extract from slotOrder arrays in presets
            const presetOrderMatch = code.match(/slotOrder\s*:\s*\[([^\]]+)\]/);
            if (presetOrderMatch) {
              slotOrder = presetOrderMatch[1]
                .split(',')
                .map(s => s.trim().replace(/['"`]/g, ''))
                .filter(s => s.length > 0);
            }
          }
        }
        
        // Extract layout presets
        const presets = {};
        const presetPattern = /\.addLayoutPreset\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*\)/g;
        
        while ((match = presetPattern.exec(code)) !== null) {
          const presetName = match[1];
          const presetContent = match[2];
          
          const nameMatch = presetContent.match(/name\s*:\s*['"`]([^'"`]+)['"`]/);
          const descMatch = presetContent.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
          
          presets[presetName] = {
            name: nameMatch ? nameMatch[1] : presetName,
            description: descMatch ? descMatch[1] : '',
            slotOrder: slotOrder
          };
        }
        
        return {
          definitions: slots,
          order: slotOrder,
          presets: presets
        };
      };
      
      const parsed = parseSchemaConfig(configCode);
      
      if (parsed && Object.keys(parsed.definitions).length > 0) {
        console.log('✅ Successfully parsed schema configuration:', {
          definitions: Object.keys(parsed.definitions).length,
          order: parsed.order.length,
          presets: Object.keys(parsed.presets).length,
          slotIds: Object.keys(parsed.definitions)
        });
        console.log('📋 Parsed slot definitions:', parsed.definitions);
        console.log('📋 Parsed slot order:', parsed.order);
        
        setSlotDefinitions(parsed.definitions);
        setSlotOrder(parsed.order);
        setPageConfig({
          slotOrder: parsed.order,
          layoutPresets: parsed.presets
        });
      } else {
        console.warn('⚠️ Could not parse schema config, using defaults');
        console.log('Parsed result:', parsed);
        await createDefaultSchemaConfig();
      }
      
    } catch (error) {
      console.error('Error loading schema configuration:', error);
      await createDefaultSchemaConfig();
    }
  }, [createDefaultSchemaConfig]);

  // Load schema-based slot configuration
  useEffect(() => {
    const loadSlotConfig = async () => {
      setIsLoading(true);
      try {
        console.log('📂 Loading slot config for:', pageName);
        
        // Try to load from localStorage first
        try {
          const storageKey = `slot_config_${pageName}`;
          const savedData = localStorage.getItem(storageKey);
          
          if (savedData) {
            const savedConfig = JSON.parse(savedData);
            console.log('💾 Loaded configuration from localStorage:', savedConfig);
            
            if (savedConfig.configuration) {
              setSlotDefinitions(savedConfig.configuration);
            }
            if (savedConfig.slot_order) {
              setSlotOrder(savedConfig.slot_order);
            }
            if (savedConfig.slot_positions) {
              setSlotPositions(savedConfig.slot_positions);
            }
            if (savedConfig.code) {
              setSlotsFileCode(savedConfig.code);
            }
            
            setPageConfig({
              slotOrder: savedConfig.slot_order || [],
              layoutPresets: {}
            });
            
            // Set as last saved for comparison
            lastSavedRef.current = {
              slotsFileCode: savedConfig.code || '',
              slotDefinitions: savedConfig.configuration || {},
              pageConfig: { slotOrder: savedConfig.slot_order || [] },
              slotPositions: savedConfig.slot_positions || {}
            };
            
            setIsLoading(false);
            return; // Skip loading from file if we have saved config
          }
        } catch (error) {
          console.log('📁 No saved configuration in localStorage, loading from file...', error);
        }
        
        // Fallback to loading from file
        if (pageName === 'Cart') {
          try {
            // Import the actual components from CartSlots.jsx
            const slotsModule = await import(`@/pages/${pageName}Slots.jsx`);
            console.log('📦 Loaded slots module:', slotsModule);
            
            if (slotsModule.CART_SLOT_DEFINITIONS && slotsModule.CART_SLOT_ORDER) {
              console.log('✅ Successfully loaded Cart slot configuration:', {
                definitions: Object.keys(slotsModule.CART_SLOT_DEFINITIONS).length,
                order: slotsModule.CART_SLOT_ORDER.length
              });
              
              setSlotDefinitions(slotsModule.CART_SLOT_DEFINITIONS);
              setSlotOrder(slotsModule.CART_SLOT_ORDER);
              setPageConfig({
                slotOrder: slotsModule.CART_SLOT_ORDER,
                layoutPresets: slotsModule.CART_LAYOUT_PRESETS || {}
              });
              
              // Load saved positions from slot definitions
              const savedPositions = {};
              Object.entries(slotsModule.CART_SLOT_DEFINITIONS).forEach(([slotId, def]) => {
                if (def.position) {
                  savedPositions[slotId] = def.position.absolute ? {
                    x: def.position.x,
                    y: def.position.y,
                    absolute: true,
                    width: def.position.width
                  } : {
                    row: def.position.row || 0,
                    col: def.position.col || 0,
                    rowSpan: def.position.rowSpan || 1,
                    colSpan: def.position.colSpan || 1
                  };
                } else if (def.gridPosition) {
                  // Backwards compatibility
                  savedPositions[slotId] = {
                    row: def.gridPosition.row,
                    col: def.gridPosition.col,
                    rowSpan: def.gridPosition.rowSpan || 1,
                    colSpan: def.gridPosition.colSpan || 1
                  };
                }
              });
              setSlotPositions(savedPositions);
              
              // Also set the code for the code editor view
              const configCode = `// Cart Slots Configuration\nexport const CART_SLOT_DEFINITIONS = ${JSON.stringify(slotsModule.CART_SLOT_DEFINITIONS, null, 2)};\nexport const CART_SLOT_ORDER = ${JSON.stringify(slotsModule.CART_SLOT_ORDER, null, 2)};`;
              setSlotsFileCode(configCode);
              return;
            }
          } catch (importError) {
            console.error('Could not dynamically import slots:', importError);
          }
        }
        
        // Fallback to API approach (for when backend is properly configured)
        const apiPath = `extensions/baseline/${encodeURIComponent(configFilePath)}`;
        console.log('🔗 Trying API path:', apiPath);
        
        const configData = await apiClient.get(apiPath);
        
        if (configData && configData.success && configData.data.hasBaseline) {
          const configCode = configData.data.baselineCode;
          console.log('✅ Found baseline code via API');
          setSlotsFileCode(configCode);
          await loadSchemaConfiguration(configCode);
        } else {
          console.log('No config found via API, using defaults');
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

  // Merge positions into slot definitions for saving
  const mergePositionsIntoDefinitions = useCallback(() => {
    const merged = { ...slotDefinitions };
    Object.keys(slotPositions).forEach(slotId => {
      if (merged[slotId] && slotPositions[slotId]) {
        const pos = slotPositions[slotId];
        merged[slotId] = {
          ...merged[slotId],
          position: pos.absolute ? {
            x: pos.x,
            y: pos.y,
            absolute: true,
            width: pos.width
          } : {
            row: pos.row,
            col: pos.col,
            rowSpan: pos.rowSpan || 1,
            colSpan: pos.colSpan || 1
          }
        };
      }
    });
    return merged;
  }, [slotDefinitions, slotPositions]);

  // Auto-save function with debouncing
  const triggerAutoSave = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set unsaved changes indicator
    setHasUnsavedChanges(true);
    
    // Debounce the save operation by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      const saveData = {
        slotsFileCode,
        slotDefinitions: mergePositionsIntoDefinitions(),
        pageConfig,
        slotPositions
      };
      
      // Only save if there are actual changes
      if (JSON.stringify(saveData) !== JSON.stringify(lastSavedRef.current)) {
        console.log('🔄 Auto-saving changes...');
        
        // Save to localStorage
        const storageKey = `slot_config_${pageName}`;
        const storageData = {
          configuration: saveData.slotDefinitions,
          slot_order: saveData.pageConfig?.slotOrder || slotOrder,
          slot_positions: saveData.slotPositions,
          code: saveData.slotsFileCode,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(storageData));
        console.log('💾 Saved to localStorage:', storageKey);
        
        // Call parent onSave
        onSave(saveData);
        lastSavedRef.current = saveData;
        setHasUnsavedChanges(false);
        
        // Force re-render of preview by updating definitions
        setSlotDefinitions(prev => ({ ...prev }));
      }
    }, 1000); // 1 second delay
  }, [slotsFileCode, slotDefinitions, pageConfig, slotPositions, slotOrder, pageName, onSave, mergePositionsIntoDefinitions]);
  
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
    triggerAutoSave();
  }, [triggerAutoSave]);

  const handleSlotEdit = useCallback((slot) => {
    // Get component name (handle function components)
    const componentName = typeof slot.component === 'function' 
      ? slot.component.name || 'SlotComponent'
      : slot.component || 'SlotComponent';
    
    // Generate code for this specific slot
    const slotCode = `// ${slot.name} Configuration
export const ${slot.id.toUpperCase().replace(/-/g, '_')}_CONFIG = {
  id: '${slot.id}',
  type: '${slot.type}',
  name: '${slot.name}',
  description: '${slot.description || ''}',
  component: '${componentName}',
  required: ${slot.required || false},
  enabled: ${slot.enabled !== false},
  order: ${slot.order || 0},
  parent: ${slot.parent ? `'${slot.parent}'` : 'null'},
  props: ${JSON.stringify(slot.props || {}, null, 2)},
  layout: ${JSON.stringify(slot.layout || {}, null, 2)},
  styling: ${JSON.stringify(slot.styling || {}, null, 2)},
  conditions: ${JSON.stringify(slot.conditions || {}, null, 2)},
  metadata: ${JSON.stringify(slot.metadata || {}, null, 2)}
};

// React Component Implementation
const ${componentName} = ({ children, className = "", ...props }) => {
  return (
    <div className={\`${slot.styling?.className || 'lg:grid lg:grid-cols-3 lg:gap-8'} \${className}\`}>
      {/* ${slot.description || 'Slot implementation'} */}
      {children}
    </div>
  );
};

export default ${componentName};`;
    
    setEditingSlot({ ...slot, code: slotCode });
    setShowSlotEditor(true);
  }, []);

  const handleSlotDelete = useCallback((slotId) => {
    if (confirm(`Are you sure you want to delete the "${slotId}" slot?`)) {
      setSlotDefinitions(prev => {
        const updated = { ...prev };
        delete updated[slotId];
        return updated;
      });
      
      setSlotOrder(prev => prev.filter(id => id !== slotId));
      triggerAutoSave();
    }
  }, [triggerAutoSave]);

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
    triggerAutoSave();
  }, [triggerAutoSave]);

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
            ? `shadow-2xl rotate-2 scale-105 ${visual.color} border-blue-400` 
            : `shadow-md hover:shadow-xl ${visual.color} ${isEnabled ? 'hover:border-blue-300' : 'opacity-50'}`
        }`}
      >
        {/* Slot Order Indicator */}
        <div className={`absolute -top-3 -left-3 w-7 h-7 rounded-full ${visual.textColor.replace('text-', 'bg-')} text-white text-sm font-bold flex items-center justify-center shadow-lg border-2 border-white`}>
          {index + 1}
        </div>

        {/* Main Content */}
        <div className="p-4 flex items-center gap-3 bg-white/70 rounded-lg">
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
  const LayoutPreview = ({ isDraggable = false, showSettings = false } = {}) => {
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
      const isBeingDragged = draggedSlotId === slotId;
      
      // Get custom grid position if dragged
      const gridPosition = slotPositions[slotId];
      const style = gridPosition ? {
        gridColumn: `${gridPosition.col + 1} / span ${gridPosition.colSpan || 3}`,
        gridRow: `${gridPosition.row + 1} / span ${gridPosition.rowSpan || 1}`,
        minHeight: getSlotHeight(definition),
        cursor: isDraggable ? 'move' : 'default'
      } : {
        minHeight: getSlotHeight(definition),
        width: getSlotWidth(definition),
        cursor: isDraggable ? 'move' : 'default'
      };
      
      const handleDragStart = (e) => {
        if (!isDraggable) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('slotId', slotId);
        setIsDragging(true);
        setDraggedSlotId(slotId);
        
        // Calculate offset from the drag point to the element's top-left corner
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('offsetX', offsetX.toString());
        e.dataTransfer.setData('offsetY', offsetY.toString());
        
        // Create a custom drag image
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-9999px';
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg)';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
        
        // Clean up drag image after a short delay
        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 0);
        
        // Add visual feedback to original element
        e.currentTarget.style.opacity = '0.4';
        e.currentTarget.style.transform = 'scale(0.95)';
      };
      
      const handleDragEnd = (e) => {
        // Restore visual state
        e.currentTarget.style.opacity = '';
        e.currentTarget.style.transform = '';
        setIsDragging(false);
        setDraggedSlotId(null);
        
        // Clean up any remaining drop indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
          indicator.remove();
        });
        
        // Clean up container hover effects
        document.querySelectorAll('.bg-blue-50\\/30').forEach(container => {
          container.classList.remove('bg-blue-50/30');
        });
      };
      
      // Render actual slot component or static preview
      const renderSlotContent = () => {
        // Try to render the actual component if available
        const SlotComponent = definition.component;
        
        if (SlotComponent && data) {
          try {
            // Use real data passed from props
            const componentProps = data[slotId] || definition.props || {};
            
            return (
              <div className="relative">
                <SlotComponent {...componentProps}>
                  {definition.children}
                </SlotComponent>
              </div>
            );
            
          } catch (error) {
            console.error(`Error rendering component for slot ${slotId}:`, error);
            // Fallback to static preview
          }
        }
        
        // Fallback static preview - only show slot structure without data
        return (
          <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{visual.icon}</span>
              <span className="font-medium text-sm">{definition.name}</span>
            </div>
            <p className="text-xs text-gray-500">{definition.description}</p>
            <div className="text-xs text-gray-400 font-mono mt-1">{slotId}</div>
          </div>
        );
      };
      
      // Don't render disabled slots in preview mode
      if (!isEnabled && !isDraggable) return null;
      
      return (
        <div
          key={slotId}
          data-slot-id={slotId}
          draggable={isDraggable && isEnabled}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`relative transition-all duration-200 group
            ${isEnabled ? 'opacity-100' : 'opacity-30'} 
            ${isDraggable && isEnabled ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-move' : 'cursor-default'}
            ${isBeingDragged ? 'opacity-40 scale-95 rotate-1 shadow-2xl' : ''}`}
          style={{
            ...style,
            userSelect: 'none',
            zIndex: isBeingDragged ? 1000 : 'auto'
          }}
          title={isDraggable ? 'Drag to reposition' : ''}
        >
          {/* Hover-only controls for layout mode */}
          {isDraggable && showSettings && (
            <>
              {/* Action buttons container - only visible on hover */}
              <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                {/* Toggle Enable/Disable */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlotToggle(slotId);
                  }}
                  className={`w-8 h-8 bg-white/90 hover:bg-white shadow-sm ${isEnabled ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                  title={isEnabled ? 'Disable slot' : 'Enable slot'}
                >
                  <Eye className={`w-4 h-4 ${isEnabled ? '' : 'line-through'}`} />
                </Button>
                
                {/* Edit Configuration */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlotEdit(definition);
                  }}
                  className="w-8 h-8 text-blue-600 hover:text-blue-800 bg-white/90 hover:bg-white shadow-sm"
                  title="Edit slot configuration"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                {/* Delete (only if not required) */}
                {!definition.required && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotDelete(slotId);
                    }}
                    className="w-8 h-8 text-red-600 hover:text-red-800 bg-white/90 hover:bg-white shadow-sm"
                    title="Remove slot"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Slot name badge - only visible on hover */}
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Badge variant="secondary" className="text-xs bg-blue-600 text-white shadow-md">
                  {definition.name}
                </Badge>
              </div>
              
              {/* Drag handle indicator - subtle, visible on hover */}
              {isEnabled && (
                <div className="absolute -top-1 -right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isBeingDragged ? (
                    <Badge variant="secondary" className="text-xs animate-pulse bg-white shadow-md">
                      <GripVertical className="w-3 h-3 mr-1" />
                      Moving
                    </Badge>
                  ) : (
                    <div className="bg-white rounded-full shadow-md p-1">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Slot Content */}
          {renderSlotContent()}

          {/* Resize handles for positioned slots */}
          {isDraggable && isEnabled && gridPosition?.absolute && (
            <>
              {/* Resize handle - bottom right */}
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl-md cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = e.currentTarget.parentElement.offsetWidth;
                  const startHeight = e.currentTarget.parentElement.offsetHeight;
                  
                  const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    
                    const newWidth = Math.max(200, startWidth + deltaX);
                    const newHeight = Math.max(100, startHeight + deltaY);
                    
                    // Update the element size directly
                    e.currentTarget.parentElement.style.width = `${newWidth}px`;
                    e.currentTarget.parentElement.style.height = `${newHeight}px`;
                  };
                  
                  const handleMouseUp = () => {
                    // Save the new size
                    const finalWidth = e.currentTarget.parentElement.offsetWidth;
                    const finalHeight = e.currentTarget.parentElement.offsetHeight;
                    
                    setSlotPositions(prev => ({
                      ...prev,
                      [slotId]: {
                        ...prev[slotId],
                        width: `${finalWidth}px`,
                        height: `${finalHeight}px`
                      }
                    }));
                    
                    triggerAutoSave();
                    
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                title="Resize"
              />
            </>
          )}

          {/* Disabled overlay for layout mode only */}
          {!isEnabled && isDraggable && (
            <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm rounded-lg flex items-center justify-center pointer-events-none">
              <Badge variant="secondary" className="bg-gray-800 text-white text-xs">HIDDEN</Badge>
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

    // Handle drop event for layout canvas - reorder slots based on drop position
    const handleCanvasDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const slotId = e.dataTransfer.getData('slotId');
      if (!slotId) return;
      
      setIsDragging(false);
      setDraggedSlotId(null);
      
      // Get drop position relative to page layout
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      // Find all slot elements in the current order
      const slotElements = Array.from(container.querySelectorAll('[data-slot-id]'));
      
      // Determine where to insert based on Y position
      let targetSlotId = null;
      let insertPosition = 'after';
      
      for (let i = 0; i < slotElements.length; i++) {
        const element = slotElements[i];
        const elementRect = element.getBoundingClientRect();
        const elementY = elementRect.top - rect.top;
        const elementMidpoint = elementY + (elementRect.height / 2);
        
        if (y < elementMidpoint) {
          targetSlotId = element.getAttribute('data-slot-id');
          insertPosition = 'before';
          break;
        } else if (i === slotElements.length - 1) {
          targetSlotId = element.getAttribute('data-slot-id');
          insertPosition = 'after';
        }
      }
      
      console.log('🎯 Dropping slot:', slotId, insertPosition, 'slot:', targetSlotId);
      
      // Reorder the slots based on drop position
      if (targetSlotId && targetSlotId !== slotId) {
        setSlotOrder(prevOrder => {
          const currentIndex = prevOrder.indexOf(slotId);
          const targetIndex = prevOrder.indexOf(targetSlotId);
          
          if (currentIndex === -1 || targetIndex === -1) return prevOrder;
          
          // Remove the dragged slot from current position
          const newOrder = prevOrder.filter(id => id !== slotId);
          
          // Calculate insert index
          let insertIndex;
          if (insertPosition === 'before') {
            insertIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
          } else {
            insertIndex = targetIndex >= currentIndex ? targetIndex : targetIndex + 1;
          }
          
          // Insert the slot at the new position
          newOrder.splice(insertIndex, 0, slotId);
          
          console.log('🔄 Reordered slots:', newOrder);
          return newOrder;
        });
      }
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback for drop zones
      if (isDragging) {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Find the closest slot element for drop indicator
        const slotElements = Array.from(container.querySelectorAll('[data-slot-id]'));
        
        // Clear existing drop indicators
        container.querySelectorAll('.drop-indicator').forEach(indicator => {
          indicator.remove();
        });
        
        // Find insertion point and add drop indicator
        for (let i = 0; i < slotElements.length; i++) {
          const element = slotElements[i];
          const elementRect = element.getBoundingClientRect();
          const elementY = elementRect.top - rect.top;
          const elementMidpoint = elementY + (elementRect.height / 2);
          
          if (y < elementMidpoint) {
            // Add drop indicator before this element
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator absolute w-full h-1 bg-blue-500 rounded z-50 shadow-lg';
            indicator.style.top = (elementY - 2) + 'px';
            indicator.style.left = '0px';
            container.appendChild(indicator);
            break;
          } else if (i === slotElements.length - 1) {
            // Add drop indicator after the last element
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator absolute w-full h-1 bg-blue-500 rounded z-50 shadow-lg';
            indicator.style.top = (elementY + elementRect.height + 2) + 'px';
            indicator.style.left = '0px';
            container.appendChild(indicator);
            break;
          }
        }
        
        // Add general hover effect to container
        container.classList.add('bg-blue-50/30');
      }
    };
    
    const handleDragLeave = (e) => {
      const target = e.currentTarget;
      if (target) {
        // Remove drop indicators
        target.querySelectorAll('.drop-indicator').forEach(indicator => {
          indicator.remove();
        });
        target.classList.remove('bg-blue-50/30');
      }
    };

    // Render layout structure - Free positioning grid layout
    const renderLayoutStructure = () => {
      const currentOrder = slotOrder.filter(id => slotDefinitions[id]);

      // Handle drop on grid for free positioning
      const handleGridDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const slotId = e.dataTransfer.getData('slotId');
        if (!slotId) return;
        
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        
        // Get the offset from drag start
        const offsetX = parseInt(e.dataTransfer.getData('offsetX') || '0');
        const offsetY = parseInt(e.dataTransfer.getData('offsetY') || '0');
        
        // Calculate actual position accounting for drag offset
        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;
        
        // Update slot position
        setSlotPositions(prev => ({
          ...prev,
          [slotId]: {
            x: Math.max(0, x),
            y: Math.max(0, y),
            absolute: true
          }
        }));
        
        setIsDragging(false);
        setDraggedSlotId(null);
        
        // Trigger auto-save
        triggerAutoSave();
      };

      return (
        <div 
          className={`bg-gray-50 min-h-[800px] relative transition-all duration-300 ${
            isDragging ? 'bg-gradient-to-b from-blue-50/50 to-blue-100/30' : ''
          }`}
          onDrop={handleGridDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ position: 'relative' }}
        >
          {/* Free Positioning Container */}
          <div className="relative w-full h-full min-h-[800px] p-8">
            
            {/* Render all slots with absolute positioning if they have positions */}
            {currentOrder.map((slotId, index) => {
              const definition = slotDefinitions[slotId];
              if (!definition) return null;
              
              const position = slotPositions[slotId];
              const isEnabled = definition.enabled !== false;
              
              // Skip disabled slots in preview
              if (!isEnabled && !isDraggable) return null;
              
              // Determine positioning style
              const positionStyle = position?.absolute ? {
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: position.width || 'auto',
                height: position.height || 'auto',
                minWidth: '200px',
                minHeight: '100px',
                zIndex: draggedSlotId === slotId ? 1000 : 10 + index
              } : {
                position: 'relative',
                marginBottom: '16px',
                width: '100%'
              };
              
              return (
                <div
                  key={slotId}
                  style={positionStyle}
                >
                  {renderSlotInLayout(slotId, index)}
                </div>
              );
            })}
          </div>
          
          {/* Grid Overlay for Drop Zones (visible on drag) */}
          {isDragging && (
            <div 
              className="absolute inset-0 pointer-events-none z-5"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, rgba(59, 130, 246, 0.1) 0px, transparent 1px, transparent 39px, rgba(59, 130, 246, 0.1) 40px),
                  repeating-linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0px, transparent 1px, transparent 39px, rgba(59, 130, 246, 0.1) 40px)
                `,
                backgroundSize: '40px 40px'
              }}
            >
              {/* Positioning guide */}
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                Drop anywhere to position
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="h-full bg-gray-100 overflow-y-auto max-h-[calc(100vh-200px)] relative">
        {/* Add instructions when dragging */}
        {isDragging && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">Drag and drop slot to reposition</span>
            </div>
          </div>
        )}
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

  // Slot Code Editor Modal
  const SlotCodeEditor = () => {
    if (!showSlotEditor || !editingSlot) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Code className="w-5 h-5" />
                Edit Slot: {editingSlot.name}
              </h2>
              <p className="text-sm text-gray-600">{editingSlot.id}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSlotEditor(false);
                setEditingSlot(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Code Editor */}
          <div className="flex-1">
            <CodeEditor
              value={editingSlot.code}
              onChange={(newCode) => {
                setEditingSlot(prev => ({ ...prev, code: newCode }));
                
                // Auto-save the slot configuration
                try {
                  const configMatch = newCode.match(/export const .+_CONFIG = ({[\s\S]+?});/);
                  if (configMatch) {
                    // eslint-disable-next-line no-eval
                    const updatedConfig = eval(`(${configMatch[1]})`);
                    setSlotDefinitions(prev => ({
                      ...prev,
                      [editingSlot.id]: {
                        ...prev[editingSlot.id],
                        ...updatedConfig
                      }
                    }));
                    triggerAutoSave();
                  }
                } catch (error) {
                  // Silently handle parsing errors during typing
                  console.debug('Parsing in progress...', error);
                }
              }}
              fileName={`${editingSlot.id.replace(/[^a-zA-Z0-9_]/g, '_')}.jsx`}
              language="javascript"
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  };

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
          <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-100">
            <Button
              variant={mode === 'layout' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('layout')}
              className="flex items-center gap-2"
              title="Slot Layout Editor"
            >
              <Layout className="w-4 h-4" />
              Layout
            </Button>
            <Button
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
              className="flex items-center gap-2"
              title="Interactive Preview"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button
              variant={mode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('code')}
              className="flex items-center gap-2"
              title="Code Editor"
            >
              <Code className="w-4 h-4" />
              Code
            </Button>
          </div>

          {/* Auto-save indicator */}
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2" />
              Auto-saving...
            </Badge>
          )}
          {!hasUnsavedChanges && lastSavedRef.current && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Saved
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {mode === 'layout' ? (
          /* LAYOUT MODE: Visual Slot Editor with Draggable Positions */
          <div className="h-full p-4">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Slot Layout Editor
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Drag slots to position them. Hover to see controls. Click settings to edit properties.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Reset all positions to default layout
                        setSlotPositions({});
                        triggerAutoSave();
                      }}
                      className="flex items-center gap-2"
                      title="Reset all slots to default positions"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Layout
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddNewSlot}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Slot
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <LayoutPreview isDraggable={true} showSettings={true} />
              </CardContent>
            </Card>
          </div>
        ) : mode === 'preview' ? (
          /* PREVIEW MODE: Interactive Full Page Preview */
          <div className="h-full p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Interactive Preview
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Interact with your {pageName.toLowerCase()} page components. Buttons, forms, and inputs are fully functional.
                </p>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="h-full overflow-auto bg-white">
                  {pageName === 'Cart' ? (
                    <CartSlots />
                  ) : (
                    <LayoutPreview isDraggable={false} showSettings={false} />
                  )}
                </div>
              </CardContent>
            </Card>
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
                  onChange={(newCode) => {
                    setSlotsFileCode(newCode);
                    triggerAutoSave();
                  }}
                  fileName={`${pageName.replace(/[^a-zA-Z0-9_]/g, '_')}PageSlots.jsx`}
                  language="javascript"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Slot Code Editor Modal */}
      <SlotCodeEditor />
    </div>
  );
};

export default GenericSlotEditor;