/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Settings, 
  Eye, 
  EyeOff, 
  ShoppingCart,
  Package,
  Loader2,
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';

// Hierarchical Slot Types
export const SlotTypes = {
  CONTAINER: 'container',    // Can contain other slots
  TEXT: 'text',              // Text content
  BUTTON: 'button',          // Button element
  IMAGE: 'image',            // Image element
  INPUT: 'input',            // Input field
  GRID: 'grid',              // Grid layout container
  FLEX: 'flex',              // Flex layout container
};

// Create hierarchical slot
export const createSlot = (id, type = SlotTypes.TEXT, config = {}) => {
  return {
    id,
    type,
    content: config.content || '',
    className: config.className || '',
    styles: config.styles || {},
    
    // Hierarchical properties
    parentId: config.parentId || null,
    children: config.children || [],
    
    // Layout properties for containers
    layout: config.layout || (type === SlotTypes.GRID ? 'grid' : type === SlotTypes.FLEX ? 'flex' : 'block'),
    gridCols: config.gridCols || 12,  // For grid containers
    gap: config.gap || 2,              // Gap between children
    
    // Relative sizing
    colSpan: config.colSpan || 12,     // Relative to parent's grid
    rowSpan: config.rowSpan || 1,      // For grid layouts
    
    // Constraints
    allowedChildren: config.allowedChildren || Object.values(SlotTypes), // Which types can be nested
    maxDepth: config.maxDepth || 5,    // Maximum nesting depth
    minChildren: config.minChildren || 0,
    maxChildren: config.maxChildren || null,
    
    // Metadata
    locked: config.locked || false,     // Prevent modifications
    collapsed: config.collapsed || false, // For UI tree view
    metadata: config.metadata || {}
  };
};

// Create default hierarchical structure for cart page
export const createDefaultSlots = () => {
  return {
    // Main layout container
    main_layout: createSlot('main_layout', SlotTypes.GRID, {
      className: 'main-layout',
      layout: 'grid',
      gridCols: 12,
      children: ['header_container', 'content_area', 'sidebar_area'],
      colSpan: 12
    }),
    
    // Header container
    header_container: createSlot('header_container', SlotTypes.FLEX, {
      className: 'header-container',
      parentId: 'main_layout',
      layout: 'flex',
      children: ['header_title'],
      colSpan: 12
    }),
    
    header_title: createSlot('header_title', SlotTypes.TEXT, {
      content: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-4',
      parentId: 'header_container',
      colSpan: 12
    }),
    
    // Content area (8 columns)
    content_area: createSlot('content_area', SlotTypes.CONTAINER, {
      className: 'content-area',
      parentId: 'main_layout',
      layout: 'block',
      children: ['empty_cart_container'],
      colSpan: 8
    }),
    
    // Empty cart container
    empty_cart_container: createSlot('empty_cart_container', SlotTypes.CONTAINER, {
      className: 'empty-cart-container text-center',
      parentId: 'content_area',
      layout: 'block',
      children: ['empty_cart_icon', 'empty_cart_title', 'empty_cart_text', 'empty_cart_button'],
      colSpan: 12
    }),
    
    empty_cart_icon: createSlot('empty_cart_icon', SlotTypes.IMAGE, {
      content: 'shopping-cart-icon',
      className: 'w-16 h-16 mx-auto text-gray-400 mb-4',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_title: createSlot('empty_cart_title', SlotTypes.TEXT, {
      content: 'Your cart is empty',
      className: 'text-xl font-semibold text-gray-900 mb-2',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_text: createSlot('empty_cart_text', SlotTypes.TEXT, {
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-600 mb-6',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_button: createSlot('empty_cart_button', SlotTypes.BUTTON, {
      content: 'Continue Shopping',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    // Sidebar area (4 columns)
    sidebar_area: createSlot('sidebar_area', SlotTypes.FLEX, {
      className: 'sidebar-area',
      parentId: 'main_layout',
      layout: 'flex',
      styles: { flexDirection: 'column' },
      children: ['coupon_container', 'order_summary_container'],
      colSpan: 4
    }),
    
    // Coupon container
    coupon_container: createSlot('coupon_container', SlotTypes.GRID, {
      className: 'coupon-container bg-white p-4 rounded-lg shadow',
      parentId: 'sidebar_area',
      layout: 'grid',
      gridCols: 12,
      children: ['coupon_title', 'coupon_input', 'coupon_button'],
      colSpan: 12
    }),
    
    coupon_title: createSlot('coupon_title', SlotTypes.TEXT, {
      content: 'Apply Coupon',
      className: 'text-lg font-semibold mb-4',
      parentId: 'coupon_container',
      colSpan: 12
    }),
    
    coupon_input: createSlot('coupon_input', SlotTypes.INPUT, {
      content: 'Enter coupon code',
      className: 'border rounded px-3 py-2',
      parentId: 'coupon_container',
      colSpan: 8
    }),
    
    coupon_button: createSlot('coupon_button', SlotTypes.BUTTON, {
      content: 'Apply',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentId: 'coupon_container',
      colSpan: 4
    }),
    
    // Order summary container
    order_summary_container: createSlot('order_summary_container', SlotTypes.CONTAINER, {
      className: 'order-summary-container bg-white p-4 rounded-lg shadow mt-4',
      parentId: 'sidebar_area',
      layout: 'block',
      children: ['order_summary_title', 'order_summary_subtotal', 'order_summary_tax', 'order_summary_total', 'checkout_button'],
      colSpan: 12
    }),
    
    order_summary_title: createSlot('order_summary_title', SlotTypes.TEXT, {
      content: 'Order Summary',
      className: 'text-lg font-semibold mb-4',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_subtotal: createSlot('order_summary_subtotal', SlotTypes.TEXT, {
      content: '<span>Subtotal</span><span>$79.97</span>',
      className: 'flex justify-between mb-2',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_tax: createSlot('order_summary_tax', SlotTypes.TEXT, {
      content: '<span>Tax</span><span>$6.40</span>',
      className: 'flex justify-between mb-2',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_total: createSlot('order_summary_total', SlotTypes.TEXT, {
      content: '<span>Total</span><span>$81.37</span>',
      className: 'flex justify-between text-lg font-semibold border-t pt-4 mb-4',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    checkout_button: createSlot('checkout_button', SlotTypes.BUTTON, {
      content: 'Proceed to Checkout',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg',
      parentId: 'order_summary_container',
      colSpan: 12
    })
  };
};




// Pure Hierarchical Slot Renderer Component - renders nested slots recursively
const HierarchicalSlot = ({ 
  slot, 
  allSlots, 
  depth = 0, 
  parentWidth = 12, 
  mode = 'edit',
  onElementClick
}) => {
  const [isExpanded, setIsExpanded] = useState(!slot.collapsed);
  
  // Calculate actual width based on parent
  const actualWidth = (slot.colSpan / 12) * parentWidth;
  
  const isContainer = [SlotTypes.CONTAINER, SlotTypes.GRID, SlotTypes.FLEX].includes(slot.type);
  const hasChildren = slot.children && slot.children.length > 0;
  
  // Get children slots
  const childSlots = hasChildren 
    ? slot.children.map(childId => allSlots[childId]).filter(Boolean)
    : [];
  
  // Render slot content based on type
  const renderSlotContent = () => {
    if (isContainer) {
      return renderChildren();
    }
    
    // Render content based on slot type
    return (
      <div className={`${slot.className}`} style={slot.styles}>
        {renderSlotTypeContent()}
      </div>
    );
  };
  
  // Render content based on slot type with enhanced resize capabilities
  const renderSlotTypeContent = () => {
    // Get responsive sizing classes based on styles
    const getResponsiveSizing = () => {
      const styles = slot.styles || {};
      const sizeClasses = [];
      
      // Add width classes if width is set
      if (styles.width) {
        if (styles.width.includes('%')) {
          sizeClasses.push('w-full'); // Use full width for percentage-based widths
        } else if (styles.width.includes('px')) {
          // For pixel widths, add responsive constraint
          sizeClasses.push('w-auto max-w-full');
        }
      }
      
      // Add height classes if height is set
      if (styles.height || styles.minHeight) {
        sizeClasses.push('h-auto');
      }
      
      return sizeClasses.join(' ');
    };

    const responsiveClasses = getResponsiveSizing();

    switch (slot.type) {
      case SlotTypes.BUTTON:
        return (
          <Button 
            className={`${slot.className} ${responsiveClasses} transition-all duration-200 resize-button`} 
            style={{
              ...slot.styles,
              minWidth: slot.styles?.width ? 'auto' : undefined,
              minHeight: slot.styles?.height || slot.styles?.minHeight ? 'auto' : undefined
            }}
          >
            {slot.content || 'Button'}
          </Button>
        );
      case SlotTypes.INPUT:
        return (
          <Input 
            placeholder={slot.content || 'Enter text...'} 
            className={`${slot.className} ${responsiveClasses} transition-all duration-200 resize-input`}
            style={{
              ...slot.styles,
              minWidth: slot.styles?.width ? 'auto' : undefined
            }}
          />
        );
      case SlotTypes.IMAGE:
        if (slot.content === 'shopping-cart-icon') {
          const iconSize = slot.styles?.width || slot.styles?.height || '64px';
          const iconSizeValue = parseInt(iconSize) || 64;
          // Use standard Tailwind sizes instead of dynamic classes
          let iconClass = 'w-16 h-16'; // Default size
          if (iconSizeValue <= 24) iconClass = 'w-6 h-6';
          else if (iconSizeValue <= 32) iconClass = 'w-8 h-8';
          else if (iconSizeValue <= 48) iconClass = 'w-12 h-12';
          else if (iconSizeValue <= 64) iconClass = 'w-16 h-16';
          else if (iconSizeValue <= 96) iconClass = 'w-24 h-24';
          else iconClass = 'w-32 h-32';
          
          return (
            <ShoppingCart 
              className={`${iconClass} mx-auto text-gray-400 mb-4 transition-all duration-200 resize-icon ${slot.className}`}
              style={{
                ...slot.styles,
                width: slot.styles?.width || iconSize,
                height: slot.styles?.height || iconSize
              }}
            />
          );
        }
        return (
          <img 
            src={slot.content || 'https://placehold.co/200x150'} 
            alt="Slot image"
            className={`${slot.className} ${responsiveClasses} transition-all duration-200 resize-image object-cover`}
            style={{
              ...slot.styles,
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        );
      default:
        return (
          <div 
            className={`${slot.className} ${responsiveClasses} transition-all duration-200`}
            style={slot.styles}
            dangerouslySetInnerHTML={{ __html: slot.content || `${slot.type} content` }} 
          />
        );
    }
  };
  
  // Render children for containers
  const renderChildren = () => {
    if (!hasChildren || !isExpanded) return null;
    
    const childElements = childSlots.map((childSlot, index) => {
      if (!childSlot) return null;
      return (
        <HierarchicalSlot
          key={childSlot.id || `child-${index}`}
          slot={childSlot}
          allSlots={allSlots}
          depth={depth + 1}
          parentWidth={actualWidth}
          mode={mode}
          onElementClick={onElementClick}
        />
      );
    }).filter(Boolean);
    
    if (slot.layout === 'grid') {
      return (
        <div className={`grid grid-cols-${slot.gridCols} gap-${slot.gap} min-h-[50px]`}>
          {childElements}
        </div>
      );
    } else if (slot.layout === 'flex') {
      return (
        <div className={`flex gap-${slot.gap} ${slot.styles?.flexDirection === 'column' ? 'flex-col' : 'flex-row'} min-h-[50px]`}>
          {childElements}
        </div>
      );
    } else {
      return (
        <div className="space-y-2 min-h-[50px]">
          {childElements}
        </div>
      );
    }
  };
  
  // Calculate grid column class
  const getColSpanClass = (span) => {
    const classes = {
      1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
      5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
      9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
    };
    return classes[span] || 'col-span-12';
  };
  
  return (
    <div
      key={slot.id}
      className={`
        ${getColSpanClass(slot.colSpan)}
        ${mode === 'edit' ? 'relative group cursor-pointer' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (mode === 'edit' && onElementClick) {
          onElementClick(slot.id, e.currentTarget);
        }
      }}
    >
      {/* Edit mode controls */}
      {mode === 'edit' && (
        <>
          {/* Hover info bar */}
          <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50">
            <span>{slot.id} ({slot.type})</span>
            {depth > 0 && <span className="ml-2">D:{depth}</span>}
            <span className="ml-2">{slot.colSpan}/12</span>
          </div>
          
          {/* Action buttons */}
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-40">
            {isContainer && hasChildren && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 bg-white shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
          </div>
        </>
      )}
      
      {/* Slot content */}
      <div 
        className={`
          ${slot.className}
          ${mode === 'edit' ? 'min-h-[40px] border border-dashed border-gray-300 p-2 rounded hover:border-blue-400' : ''}
          ${isContainer ? `bg-gray-50 ${mode === 'edit' ? `bg-opacity-${Math.min(80, 20 * (depth + 1))}` : ''}` : ''}
        `}
        style={{
          ...slot.styles,
          backgroundColor: isContainer && mode === 'edit' 
            ? `rgba(59, 130, 246, ${0.05 * (depth + 1)})` 
            : slot.styles?.backgroundColor
        }}
      >
        {/* Container type indicator */}
        {mode === 'edit' && isContainer && (
          <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{slot.type} ({slot.layout})</span>
            </div>
            <span>Width: {actualWidth.toFixed(1)}/12</span>
          </div>
        )}
        
        {renderSlotContent()}
        
        {/* Empty container placeholder */}
        {isContainer && !hasChildren && mode === 'edit' && (
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded text-gray-400">
            <div className="text-center">
              <Layers className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">Drop slots here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({ 
  mode = 'preview', 
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  // State management
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize hierarchical slot configuration
  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      try {
        // Use hierarchical slots as the single source of truth
        const defaultHierarchicalSlots = createDefaultSlots();
        const initialConfig = {
          page_name: 'cart',
          slot_type: 'hierarchical',
          slots: { ...defaultHierarchicalSlots },
          metadata: {
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        };

        // Configuration loading handled by parent component
        console.log('📦 Initialized hierarchical cart configuration');

        setCartLayoutConfig(initialConfig);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, []);

  // Save hierarchical configuration
  const saveConfiguration = useCallback(async (configToSave = cartLayoutConfig) => {
    if (!configToSave || !onSave) return;

    setSaveStatus('saving');
    try {
      await onSave(configToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [cartLayoutConfig, onSave]);


  // Handle element selection for EditorSidebar
  const handleElementClick = useCallback((slotId, element) => {
    setSelectedElement(element);
    setIsSidebarVisible(true);
  }, []);

  // Handle text changes from EditorSidebar for hierarchical slots
  const handleTextChange = useCallback((slotId, newText) => {
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          content: newText,
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      
      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      // Auto-save
      saveConfiguration(updatedConfig);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle class changes from EditorSidebar for hierarchical slots
  const handleClassChange = useCallback((slotId, className, styles) => {
    setCartLayoutConfig(prevConfig => {
      const updatedSlots = { ...prevConfig?.slots };
      
      if (updatedSlots[slotId]) {
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          className: className,
          styles: styles || updatedSlots[slotId].styles || {},
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      
      const updatedConfig = {
        ...prevConfig,
        slots: updatedSlots
      };

      // Auto-save
      saveConfiguration(updatedConfig);
      return updatedConfig;
    });
  }, [saveConfiguration]);






  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading cart editor...
        </div>
      </div>
    );
  }

  // Main render - Clean and maintainable
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'grid grid-cols-[75%_25%]' : 'block'
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {/* View Mode Selector - matches Cart.jsx logic */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('empty')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'empty'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                Empty Cart
              </button>
              <button
                onClick={() => setViewMode('withProducts')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'withProducts'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />
                With Products
              </button>
            </div>

            {/* Only show controls in edit mode */}
            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                {/* Save Status */}
                {saveStatus && (
                  <div className={`flex items-center gap-2 text-sm ${
                    saveStatus === 'saving' ? 'text-blue-600' : 
                    saveStatus === 'saved' ? 'text-green-600' : 
                    'text-red-600'
                  }`}>
                    {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saveStatus === 'saved' && '✓ Saved'}
                    {saveStatus === 'error' && '✗ Save Failed'}
                  </div>
                )}

                <Button onClick={() => saveConfiguration()} disabled={saveStatus === 'saving'} variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>

                <Button onClick={() => setIsSidebarVisible(!isSidebarVisible)} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  {isSidebarVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Layout - Pure Hierarchical Structure */}
        <div 
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Render main layout hierarchically */}
            {cartLayoutConfig?.slots?.main_layout && (
              <HierarchicalSlot
                slot={cartLayoutConfig.slots.main_layout}
                allSlots={cartLayoutConfig.slots}
                depth={0}
                parentWidth={12}
                mode={mode}
                onElementClick={handleElementClick}
              />
            )}
            
            <CmsBlockRenderer position="cart_above_items" />
          </div>
        </div>
      </div>

      {/* EditorSidebar - only show in edit mode */}
      {mode === 'edit' && isSidebarVisible && selectedElement && (
        <EditorSidebar
          selectedElement={selectedElement}
          slotId={selectedElement.getAttribute('data-slot-id')}
          slotConfig={cartLayoutConfig?.slots?.[selectedElement.getAttribute('data-slot-id')]}
          onTextChange={handleTextChange}
          onClassChange={handleClassChange}
          onInlineClassChange={handleClassChange}
          onClearSelection={() => {
            setSelectedElement(null);
            setIsSidebarVisible(false);
          }}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default CartSlotsEditor;