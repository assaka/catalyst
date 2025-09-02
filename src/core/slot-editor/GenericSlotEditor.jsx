/**
 * GenericSlotEditor - Universal editor that works with any page slots
 * Store owners only see and edit their PageSlots.jsx file
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [editingSlot, setEditingSlot] = useState(null);
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [slotPositions, setSlotPositions] = useState({}); // Will store grid positions like { row: 2, col: 3 }
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState(null);

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
        
        // For now, directly load Cart configuration if that's the page
        // In production, this would come from the API endpoint
        if (pageName === 'Cart') {
          try {
            // Dynamically import the configuration
            const configModule = await import(`@/pages/${pageName}Slots.config.js`);
            console.log('📦 Loaded config module:', configModule);
            
            if (configModule.CART_SLOT_DEFINITIONS && configModule.CART_SLOT_ORDER) {
              console.log('✅ Successfully loaded Cart slot configuration:', {
                definitions: Object.keys(configModule.CART_SLOT_DEFINITIONS).length,
                order: configModule.CART_SLOT_ORDER.length
              });
              
              setSlotDefinitions(configModule.CART_SLOT_DEFINITIONS);
              setSlotOrder(configModule.CART_SLOT_ORDER);
              setPageConfig({
                slotOrder: configModule.CART_SLOT_ORDER,
                layoutPresets: configModule.CART_LAYOUT_PRESETS || {}
              });
              
              // Load saved grid positions from slot definitions
              const savedPositions = {};
              Object.entries(configModule.CART_SLOT_DEFINITIONS).forEach(([slotId, def]) => {
                if (def.gridPosition) {
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
              const configCode = `// Cart Slots Configuration\nexport const CART_SLOT_DEFINITIONS = ${JSON.stringify(configModule.CART_SLOT_DEFINITIONS, null, 2)};\nexport const CART_SLOT_ORDER = ${JSON.stringify(configModule.CART_SLOT_ORDER, null, 2)};`;
              setSlotsFileCode(configCode);
              return;
            }
          } catch (importError) {
            console.warn('Could not dynamically import config, trying API approach:', importError);
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
    // Generate code for this specific slot
    const slotCode = `// ${slot.name} Configuration
export const ${slot.id.toUpperCase().replace(/-/g, '_')}_CONFIG = {
  id: '${slot.id}',
  type: '${slot.type}',
  name: '${slot.name}',
  description: '${slot.description || ''}',
  component: '${slot.component || slot.id}',
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
const ${slot.component || 'SlotComponent'} = ({ children, ...props }) => {
  return (
    <div className="${slot.styling?.className || ''}">
      {/* ${slot.description || 'Slot implementation'} */}
      {children}
    </div>
  );
};`;
    
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

  // Merge grid positions into slot definitions for saving
  const mergePositionsIntoDefinitions = () => {
    const merged = { ...slotDefinitions };
    Object.keys(slotPositions).forEach(slotId => {
      if (merged[slotId] && slotPositions[slotId]) {
        merged[slotId] = {
          ...merged[slotId],
          gridPosition: {
            row: slotPositions[slotId].row,
            col: slotPositions[slotId].col,
            rowSpan: slotPositions[slotId].rowSpan || 1,
            colSpan: slotPositions[slotId].colSpan || 1
          }
        };
      }
    });
    return merged;
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

    // Render individual slot in layout context with drag capability
    const renderSlotInLayout = (slotId, index, isDraggable = false) => {
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
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('offsetX', offsetX.toString());
        e.dataTransfer.setData('offsetY', offsetY.toString());
        // Add visual feedback
        e.currentTarget.style.opacity = '0.5';
      };
      
      const handleDragEnd = (e) => {
        // Restore opacity after drag
        e.currentTarget.style.opacity = '';
        setIsDragging(false);
        setDraggedSlotId(null);
      };
      
      // Render actual slot component or realistic preview
      const renderSlotContent = () => {
        // Try to render the actual component if available
        const SlotComponent = definition.component;
        
        if (SlotComponent) {
          try {
            // Create mock props based on slot type for preview
            const getMockProps = () => {
              switch(slotId) {
                case 'cart-page-header':
                  return { title: "My Cart", className: "text-3xl font-bold text-gray-900 mb-8" };
                  
                case 'cart-empty-display':
                  return { 
                    title: "Your cart is empty",
                    message: "Looks like you haven't added anything to your cart yet.",
                    buttonText: "Continue Shopping"
                  };
                  
                case 'cart-coupon-section':
                  return {
                    appliedCoupon: null,
                    couponCode: '',
                    currencySymbol: '$',
                    onCouponCodeChange: () => {},
                    onApplyCoupon: () => {},
                    onRemoveCoupon: () => {},
                    onKeyPress: () => {},
                    safeToFixed: (val) => val?.toFixed(2) || '0.00'
                  };
                  
                case 'cart-order-summary':
                  return {
                    subtotal: 89.99,
                    discount: 0,
                    tax: 9.00,
                    total: 98.99,
                    currencySymbol: '$',
                    safeToFixed: (val) => val?.toFixed(2) || '0.00'
                  };
                  
                case 'cart-checkout-button':
                  return {
                    onCheckout: () => console.log('Checkout clicked'),
                    settings: { theme: { checkout_button_color: '#007bff' } },
                    text: "Proceed to Checkout"
                  };
                  
                case 'cart-item-single':
                  return {
                    item: { 
                      id: 'preview-item',
                      quantity: 2,
                      price: 29.99,
                      selected_options: [{ name: 'Color: Blue', price: 5.00 }]
                    },
                    product: {
                      name: 'Sample Product',
                      price: 29.99,
                      images: ['https://placehold.co/100x100?text=Product']
                    },
                    currencySymbol: '$',
                    formatPrice: (price) => parseFloat(price) || 0,
                    calculateItemTotal: () => 64.98,
                    onUpdateQuantity: () => {},
                    onRemove: () => {}
                  };
                  
                default:
                  return {};
              }
            };
            
            // Render the actual component with preview props
            const mockProps = getMockProps();
            return (
              <div className="relative">
                <SlotComponent {...mockProps}>
                  {definition.children}
                </SlotComponent>
                
                {/* Overlay badge to show slot name */}
                <div className="absolute top-1 right-1 z-20">
                  <Badge variant="secondary" className="text-xs bg-blue-600 text-white shadow-md">
                    {definition.name}
                  </Badge>
                </div>
              </div>
            );
            
          } catch (error) {
            console.warn(`Error rendering component for slot ${slotId}:`, error);
            // Fallback to static preview
          }
        }
        
        // Fallback static preview if component rendering fails
        switch(slotId) {
          case 'cart-page-header':
            return (
              <div className="relative">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
                <Badge className="absolute top-0 right-0 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          case 'cart-items-container':
            return (
              <div className="relative lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                    <img src="https://placehold.co/80x80?text=Product" alt="Product" className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Sample Product</h3>
                      <p className="text-gray-600">$29.99 each</p>
                      <div className="flex items-center space-x-3 mt-3">
                        <Button size="sm" variant="outline"><Minus className="w-4 h-4" /></Button>
                        <span className="text-lg font-semibold">2</span>
                        <Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$59.98</p>
                    </div>
                  </div>
                </div>
                <Badge className="absolute top-2 right-2 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          case 'cart-coupon-section':
            return (
              <div className="relative">
                <Card>
                  <CardHeader><CardTitle>Apply Coupon</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Input placeholder="Enter coupon code" className="flex-1" />
                      <Button><Tag className="w-4 h-4 mr-2" />Apply</Button>
                    </div>
                  </CardContent>
                </Card>
                <Badge className="absolute top-2 right-2 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          case 'cart-order-summary':
            return (
              <div className="relative">
                <Card>
                  <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>$89.99</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>$9.00</span></div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-4">
                      <span>Total</span><span>$98.99</span>
                    </div>
                  </CardContent>
                </Card>
                <Badge className="absolute top-2 right-2 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          case 'cart-checkout-button':
            return (
              <div className="relative border-t mt-6 pt-6">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Proceed to Checkout
                </Button>
                <Badge className="absolute top-0 right-0 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          case 'cart-empty-display':
            return (
              <div className="relative">
                <Card>
                  <CardContent className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                    <Button>Continue Shopping</Button>
                  </CardContent>
                </Card>
                <Badge className="absolute top-2 right-2 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
            
          default:
            return (
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{visual.icon}</span>
                  <span className="font-medium text-sm">{definition.name}</span>
                </div>
                <p className="text-xs text-gray-500">{definition.description}</p>
                <div className="text-xs text-gray-400 font-mono mt-1">{slotId}</div>
                <Badge className="absolute top-1 right-1 text-xs bg-blue-600 text-white">{definition.name}</Badge>
              </div>
            );
        }
      };
      
      return (
        <div
          key={slotId}
          draggable={isDraggable}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`relative transition-all duration-200 cursor-move
            ${isEnabled ? 'opacity-100' : 'opacity-50'} 
            ${isDraggable ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
            ${isBeingDragged ? 'opacity-40 scale-95 rotate-1 shadow-2xl' : ''}`}
          style={{
            ...style,
            userSelect: 'none',
            zIndex: isBeingDragged ? 1000 : 'auto'
          }}
          title={isDraggable ? 'Drag to reposition' : ''}
        >
          {/* Drag Handle for draggable slots */}
          {isDraggable && (
            <div className="absolute -top-1 -right-1 z-10 bg-white rounded-full shadow-lg p-1">
              {isBeingDragged ? (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  <GripVertical className="w-3 h-3 mr-1" />
                  Moving
                </Badge>
              ) : (
                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              )}
            </div>
          )}

          {/* Slot Content with realistic styling */}
          {renderSlotContent()}

          {/* Disabled overlay */}
          {!isEnabled && (
            <div className="absolute inset-0 bg-gray-200/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Badge variant="secondary" className="bg-gray-800 text-white">DISABLED</Badge>
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

    // Handle drop event for layout canvas - calculate grid position
    const handleCanvasDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const slotId = e.dataTransfer.getData('slotId');
      if (!slotId) return;
      
      setIsDragging(false);
      setDraggedSlotId(null);
      
      const offsetX = parseInt(e.dataTransfer.getData('offsetX') || '0');
      const offsetY = parseInt(e.dataTransfer.getData('offsetY') || '0');
      
      // Find the container element (the one with relative position)
      const container = e.currentTarget.querySelector('.relative.border-2.border-dashed') || e.currentTarget;
      const rect = container.getBoundingClientRect();
      
      const x = e.clientX - rect.left - offsetX;
      const y = e.clientY - rect.top - offsetY;
      
      // Calculate grid position (12 column grid, rows of 100px height)
      const GRID_COLS = 12;
      const GRID_ROW_HEIGHT = 100;
      const GRID_COL_WIDTH = rect.width / GRID_COLS;
      
      const gridCol = Math.round(x / GRID_COL_WIDTH);
      const gridRow = Math.round(y / GRID_ROW_HEIGHT);
      
      console.log('Dropping slot:', slotId, 'at grid position:', { 
        row: Math.max(0, gridRow), 
        col: Math.max(0, Math.min(GRID_COLS - 1, gridCol))
      });
      
      setSlotPositions(prev => ({
        ...prev,
        [slotId]: { 
          row: Math.max(0, gridRow),
          col: Math.max(0, Math.min(GRID_COLS - 1, gridCol)),
          rowSpan: prev[slotId]?.rowSpan || 1,
          colSpan: prev[slotId]?.colSpan || 3 // Default to 3 columns width
        }
      }));
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback for drop zones
      const target = e.currentTarget;
      if (target && isDragging) {
        target.classList.add('bg-blue-100/30', 'border-2', 'border-dashed', 'border-blue-400', 'shadow-xl');
      }
    };
    
    const handleDragLeave = (e) => {
      const target = e.currentTarget;
      if (target) {
        target.classList.remove('bg-blue-100/30', 'border-2', 'border-dashed', 'border-blue-400', 'shadow-xl');
      }
    };

    // Render layout structure - matching actual Cart.jsx layout
    const renderLayoutStructure = () => {
      const currentOrder = slotOrder.filter(id => slotDefinitions[id]);

      return (
        <div 
          className={`bg-gray-50 min-h-full relative transition-all duration-300 ${
            isDragging ? 'bg-gradient-to-b from-blue-50/50 to-blue-100/30' : ''
          }`}
          onDrop={handleCanvasDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Actual Cart Page Layout Structure from Cart.jsx */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Page Header */}
            {currentOrder.includes('cart-page-header') && (
              <div className="mb-8">
                {renderSlotInLayout('cart-page-header', currentOrder.indexOf('cart-page-header'), true)}
              </div>
            )}
            
            {/* CMS Block Above Items */}
            {currentOrder.includes('cart-cms-above') && (
              <div className="mb-4">
                {renderSlotInLayout('cart-cms-above', currentOrder.indexOf('cart-cms-above'), true)}
              </div>
            )}
            
            {/* Main Grid Layout - matching Cart.jsx lg:grid-cols-3 */}
            <div 
              className="lg:grid lg:grid-cols-3 lg:gap-8"
              style={{
                position: 'relative'
              }}
            >
              {/* Left Column - Cart Items (lg:col-span-2) */}
              <div 
                className="lg:col-span-2"
                onDrop={handleCanvasDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {/* Empty Cart Message */}
                {currentOrder.includes('cart-empty-display') && (
                  <div className="mb-4">
                    {renderSlotInLayout('cart-empty-display', currentOrder.indexOf('cart-empty-display'), true)}
                  </div>
                )}
                
                {/* Cart Items Container */}
                {currentOrder.includes('cart-items-container') && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Shopping Cart Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderSlotInLayout('cart-items-container', currentOrder.indexOf('cart-items-container'), true)}
                      
                      {/* Individual Cart Items */}
                      {currentOrder.includes('cart-item-single') && (
                        <div className="space-y-4 mt-4">
                          {/* Render sample cart items */}
                          <div className="border-b pb-4">
                            {renderSlotInLayout('cart-item-single', currentOrder.indexOf('cart-item-single'), true)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Right Column - Order Summary (lg:col-span-1) */}
              <div 
                className="lg:col-span-1 space-y-6 mt-8 lg:mt-0"
                onDrop={handleCanvasDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Card className="bg-white sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Coupon Section */}
                    {currentOrder.includes('cart-coupon-section') && (
                      <div className="pb-4 border-b">
                        {renderSlotInLayout('cart-coupon-section', currentOrder.indexOf('cart-coupon-section'), true)}
                      </div>
                    )}
                    
                    {/* Order Summary Details */}
                    {currentOrder.includes('cart-order-summary') && (
                      <div className="space-y-2">
                        {renderSlotInLayout('cart-order-summary', currentOrder.indexOf('cart-order-summary'), true)}
                      </div>
                    )}
                    
                    {/* CMS Block Above Total */}
                    {currentOrder.includes('cart-cms-above-total') && (
                      <div className="py-2">
                        {renderSlotInLayout('cart-cms-above-total', currentOrder.indexOf('cart-cms-above-total'), true)}
                      </div>
                    )}
                    
                    {/* Checkout Button */}
                    {currentOrder.includes('cart-checkout-button') && (
                      <div className="pt-4 border-t">
                        {renderSlotInLayout('cart-checkout-button', currentOrder.indexOf('cart-checkout-button'), true)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Recommended Products Below Cart */}
            {currentOrder.includes('cart-recommended-products') && (
              <div className="mt-12">
                {renderSlotInLayout('cart-recommended-products', currentOrder.indexOf('cart-recommended-products'), true)}
              </div>
            )}
          </div>
          
          {/* Grid Overlay for Drop Zones (visible on drag) */}
          {isDragging && (
            <div 
              className="absolute inset-0 pointer-events-none z-10 grid grid-cols-12 gap-px bg-blue-50/50"
              style={{
                gridTemplateRows: 'repeat(auto-fill, 100px)'
              }}
            >
              {/* Grid cells for visual feedback */}
              {Array.from({ length: 12 * 10 }, (_, i) => (
                <div 
                  key={i}
                  className="border border-dashed border-blue-300 bg-blue-50/20 transition-colors"
                />
              ))}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSlotEditor(false);
                  setEditingSlot(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Parse the code and update the slot definition
                  try {
                    // Simple extraction of the config object from the code
                    const configMatch = editingSlot.code.match(/export const .+_CONFIG = ({[\s\S]+?});/);
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
                    }
                    setShowSlotEditor(false);
                    setEditingSlot(null);
                  } catch (error) {
                    console.error('Error parsing slot code:', error);
                    alert('Error parsing slot configuration. Please check the syntax.');
                  }
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
          
          {/* Code Editor */}
          <div className="flex-1">
            <CodeEditor
              value={editingSlot.code}
              onChange={(newCode) => {
                setEditingSlot(prev => ({ ...prev, code: newCode }));
              }}
              fileName={`${editingSlot.id}.jsx`}
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
              variant={mode === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('visual')}
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Visual
            </Button>
            <Button
              variant={mode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('code')}
              className="flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Code
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave({ 
              slotsFileCode, 
              slotDefinitions: mergePositionsIntoDefinitions(), 
              pageConfig,
              slotPositions 
            })}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {mode === 'visual' ? (
          /* VISUAL MODE: Drag & Drop + Preview */
          <div className="h-full grid grid-cols-1 xl:grid-cols-3 gap-4 p-4 overflow-auto">
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
      
      {/* Slot Code Editor Modal */}
      <SlotCodeEditor />
    </div>
  );
};

export default GenericSlotEditor;