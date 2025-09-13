/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import { 
  Save, 
  Settings, 
  Eye, 
  EyeOff, 
  ShoppingCart,
  Package,
  Loader2,
  Tag,
  Plus,
  Minus,
  Trash2
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import { cartConfig } from "@/components/editor/slot/configs/cart-config";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import slotConfigurationService from '@/services/slotConfigurationService';

// Webflow-style resize handle - subtle and only appears on hover
const GridResizeHandle = ({ onResize, currentColSpan, maxColSpan = 12, minColSpan = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startColSpan, setStartColSpan] = useState(currentColSpan);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e) => {
    console.log('🎯 GridResizeHandle clicked!', { currentColSpan, clientX: e.clientX });
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    isDraggingRef.current = true;
    setStartX(e.clientX);
    setStartColSpan(currentColSpan);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentColSpan]);

  const handleMouseMove = useCallback((e) => {
    console.log('🖱️ Mouse move:', { isDragging: isDraggingRef.current, clientX: e.clientX, startX });
    
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - startX;
    const sensitivity = 30; // pixels per col-span unit
    const colSpanDelta = Math.round(deltaX / sensitivity);
    const newColSpan = Math.max(minColSpan, Math.min(maxColSpan, startColSpan + colSpanDelta));
    
    console.log('🎯 GridResizeHandle drag:', { 
      deltaX, 
      colSpanDelta, 
      startColSpan, 
      currentColSpan, 
      newColSpan,
      shouldUpdate: newColSpan !== currentColSpan 
    });
    
    if (newColSpan !== currentColSpan) {
      console.log('📞 Calling onResize with:', newColSpan);
      onResize(newColSpan);
    }
  }, [isDragging, startX, startColSpan, currentColSpan, maxColSpan, minColSpan, onResize]);

  const handleMouseUp = useCallback(() => {
    console.log('🛑 Mouse up - ending drag');
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-16 cursor-col-resize transition-all duration-200 opacity-100 border-2 border-red-500`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        console.log('🖱️ Handle clicked (not dragged)');
      }}
      style={{ zIndex: 9999 }}
      title={`Resize column (${currentColSpan}/${maxColSpan}) - drag to resize`}
    >
      {/* More visible handle when dragging */}
      <div className={`w-full h-full rounded-full flex flex-col items-center justify-center space-y-0.5 transition-colors duration-200 ${
        isDragging 
          ? 'bg-blue-600 shadow-lg border-2 border-blue-300' 
          : isHovered 
            ? 'bg-blue-500 shadow-md' 
            : 'bg-gray-400'
      }`}>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
      </div>
      
      {/* Debug indicator when dragging */}
      {isDragging && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {currentColSpan}/12
        </div>
      )}
    </div>
  );
};

// Grid column wrapper with resize handle
const GridColumn = ({ 
  colSpan = 12, 
  slotId, 
  onGridResize, 
  mode = 'edit', 
  parentClassName = '',  // For grid alignment classes
  className = '',        // For element classes (backward compatibility)
  children 
}) => {
  const showHandle = onGridResize && mode === 'edit' && colSpan;
  
  // Generate the col-span class dynamically to ensure Tailwind includes it
  const getColSpanClass = (span) => {
    const classes = {
      1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
      5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
      9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
    };
    return classes[span] || 'col-span-12';
  };
  
  const colSpanClass = getColSpanClass(colSpan);
  
  // Debug logging
  console.log(`GridColumn ${slotId}:`, { colSpan, colSpanClass, showHandle });
  
  return (
    <div 
      className={`group ${colSpanClass} ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''} ${parentClassName} ${className} relative`}
      data-grid-slot-id={slotId}
      data-col-span={colSpan}
      style={{ backgroundColor: mode === 'edit' ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
    >
      {mode === 'edit' && (
        <div className="absolute top-0 left-0 text-xs bg-blue-500 text-white px-1 rounded">
          {slotId}: {colSpan}
        </div>
      )}
      {children}
      {/* Grid resize handle on the column itself */}
      {showHandle && (
        <GridResizeHandle
          onResize={(newColSpan) => onGridResize(slotId, newColSpan)}
          currentColSpan={colSpan}
          maxColSpan={12}
          minColSpan={1}
        />
      )}
    </div>
  );
};

// Enhanced editable element with drag and element resize capabilities  
const EditableElement = ({ 
  slotId, 
  children, 
  className, 
  style, 
  onClick, 
  canResize = false,
  draggable = false, 
  mode = 'edit'
}) => {
  const handleClick = useCallback((e) => {
    // Don't handle clicks in preview mode
    if (mode === 'preview') return;
    
    e.stopPropagation();
    if (onClick) {
      onClick(slotId, e.currentTarget);
    }
  }, [slotId, onClick, mode]);

  const content = (
    <div
      className={`${mode === 'edit' ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400 hover:outline-offset-1 relative' : 'relative'} ${draggable && mode === 'edit' ? 'cursor-move' : ''} transition-all ${className || ''}`}
      style={mode === 'edit' ? {
        border: '1px dotted rgba(200, 200, 200, 0.1)',
        borderRadius: '4px',
        minHeight: '20px',
        padding: '4px',
        ...style
      } : style}
      onClick={handleClick}
      data-slot-id={slotId}
      data-editable={mode === 'edit'}
      draggable={draggable && mode === 'edit'}
    >
      {children}
    </div>
  );

  // Show resize wrapper only in edit mode when canResize is true
  if (canResize && mode === 'edit') {
    return (
      <ResizeWrapper
        minWidth={100}
        minHeight={40}
        maxWidth={600}
        maxHeight={400}
      >
        {content}
      </ResizeWrapper>
    );
  }

  return content;
};

// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({ 
  mode = 'preview', 
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  const { selectedStore } = useStoreSelection();
  
  // State management
  const [cartLayoutConfig, setCartLayoutConfig] = useState(null);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize configuration from cart-config.js
  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      try {
        // Start with cart config as the single source of truth
        const initialConfig = {
          page_name: cartConfig.page_name,
          slot_type: cartConfig.slot_type,
          microSlots: { ...cartConfig.microSlots },
          slots: { ...cartConfig.slots },
          metadata: {
            ...cartConfig.metadata,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        };

        // Load DRAFT configuration for editing using versioning API
        if (selectedStore?.id && onSave) {
          try {
            const response = await slotConfigurationService.getDraftConfiguration(selectedStore.id, 'cart');
            
            if (response.success && response.data?.configuration) {
              const config = response.data.configuration;
              
              // Handle both old format (config.slots[slotId]) and new format (config[slotId])
              if (config.slots) {
                // Old format: config.slots[slotId]
                initialConfig.slots = { 
                  ...initialConfig.slots, 
                  ...config.slots 
                };
                console.log('📦 Loaded DRAFT cart configuration (old format):', config.slots);
              } else {
                // New format: config[slotId] directly
                // Convert flat structure to slots structure for editor
                const convertedSlots = {};
                Object.keys(config).forEach(key => {
                  if (key !== 'metadata' && typeof config[key] === 'object' && config[key].content !== undefined) {
                    convertedSlots[key] = config[key];
                  }
                });
                
                initialConfig.slots = { 
                  ...initialConfig.slots, 
                  ...convertedSlots 
                };
                console.log('📦 Loaded DRAFT cart configuration (new format):', convertedSlots);
              }
            } else {
              console.log('📝 No draft configuration found, using cart-config.js defaults');
            }
          } catch (error) {
            console.warn('❌ Failed to load draft configuration:', error);
            console.log('Using cart-config.js defaults');
          }
        }

        setCartLayoutConfig(initialConfig);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, [selectedStore?.id, onSave]);

  // Save configuration to database
  const saveConfiguration = useCallback(async (configToSave = cartLayoutConfig) => {
    if (!configToSave || !selectedStore?.id || !onSave) return;

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
  }, [cartLayoutConfig, selectedStore?.id, onSave]);

  // Helper functions - match Cart.jsx exactly
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  const getMicroSlotStyling = useCallback((microSlotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[microSlotId];
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  const getSlotPositioning = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig?.slots?.[slotId];
    const className = slotConfig?.className || '';
    
    // Separate alignment classes (for parent/grid) from other classes (for element)
    const classes = className.split(' ').filter(Boolean);
    const alignmentClasses = classes.filter(cls => 
      cls.startsWith('text-left') || cls.startsWith('text-center') || cls.startsWith('text-right')
    );
    const elementClasses = classes.filter(cls => 
      !cls.startsWith('text-left') && !cls.startsWith('text-center') && !cls.startsWith('text-right')
    );
    
    return {
      parentClassName: alignmentClasses.join(' '),  // For grid alignment classes
      className: elementClasses.join(' '),          // For element classes  
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Handle element selection for EditorSidebar
  const handleElementClick = useCallback((slotId, element) => {
    setSelectedElement(element);
    setIsSidebarVisible(true);
  }, []);

  // Handle text changes from EditorSidebar
  const handleTextChange = useCallback((slotId, newText) => {
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        slots: {
          ...prevConfig?.slots,
          [slotId]: {
            ...prevConfig?.slots?.[slotId],
            content: newText,
            metadata: {
              ...prevConfig?.slots?.[slotId]?.metadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      // Auto-save with debounce
      setTimeout(() => saveConfiguration(updatedConfig), 1000);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle class changes from EditorSidebar
  const handleClassChange = useCallback((slotId, className, styles) => {
    setCartLayoutConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        slots: {
          ...prevConfig?.slots,
          [slotId]: {
            ...prevConfig?.slots?.[slotId],
            className: className,
            styles: styles || prevConfig?.slots?.[slotId]?.styles || {},
            metadata: {
              ...prevConfig?.slots?.[slotId]?.metadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      // Auto-save
      setTimeout(() => saveConfiguration(updatedConfig), 500);
      return updatedConfig;
    });
  }, [saveConfiguration]);

  // Handle grid resize changes
  const handleGridResize = useCallback((slotId, newColSpan) => {
    console.log('🔄 handleGridResize called:', { slotId, newColSpan });
    
    setCartLayoutConfig(prevConfig => {
      console.log('📊 Previous microSlots:', prevConfig?.microSlots);
      console.log('📊 Previous slot config:', prevConfig?.microSlots?.[slotId]);
      
      const updatedConfig = {
        ...prevConfig,
        microSlots: {
          ...prevConfig?.microSlots,
          [slotId]: {
            ...prevConfig?.microSlots?.[slotId],
            col: newColSpan
          }
        }
      };

      console.log('✅ Updated microSlots:', updatedConfig.microSlots);
      console.log('✅ New slot config:', updatedConfig.microSlots[slotId]);

      // Auto-save
      setTimeout(() => saveConfiguration(updatedConfig), 500);
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
      isSidebarVisible ? 'grid grid-cols-[1fr_320px]' : 'block'
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

        {/* Cart Layout - EXACT COPY of Cart.jsx structure */}
        <div 
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Header Section with Grid Layout */}
            <div className="header-section mb-8">
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                  .filter(slotId => slotId.startsWith('header.'))
                  .map(slotId => {
                    const positioning = getSlotPositioning(slotId);
                    
                    if (slotId === 'header.title') {
                      const headerTitleStyling = getMicroSlotStyling('header.title');
                      const defaultClasses = 'text-3xl font-bold text-gray-900 mb-4';
                      const finalClasses = positioning.elementClasses || headerTitleStyling.elementClasses || defaultClasses;
                      
                      return (
                        <GridColumn
                          key={slotId}
                          colSpan={cartLayoutConfig?.microSlots?.[slotId]?.col || 12}
                          slotId={slotId}
                          onGridResize={handleGridResize}
                          mode={mode}
                          parentClassName={positioning.parentClassName}
                        >
                          <EditableElement
                            slotId={slotId}
                            mode={mode}
                            onClick={(e) => handleElementClick(slotId, e.currentTarget)}
                            className={finalClasses}
                            style={positioning.elementStyles || headerTitleStyling.elementStyles}
                            canResize={true}
                            draggable={true}
                          >
                            {cartLayoutConfig.slots[slotId]?.content || "My Cart"}
                          </EditableElement>
                        </GridColumn>
                      );
                    }
                    
                    return null;
                  })}
              </div>
            </div>
            
            <CmsBlockRenderer position="cart_above_items" />
            
            {/* Test Grid Resize - visible test slot */}
            {mode === 'edit' && (
              <div className="grid grid-cols-12 gap-4 mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <GridColumn
                  colSpan={cartLayoutConfig?.microSlots?.['test.slot']?.col || 6}
                  slotId="test.slot"
                  onGridResize={handleGridResize}
                  mode={mode}
                >
                  <EditableElement
                    slotId="test.slot"
                    mode={mode}
                    onClick={handleElementClick}
                    className="bg-blue-100 p-4 text-center font-bold border-2 border-blue-300"
                    canResize={true}
                  >
                    TEST RESIZE SLOT (drag edges - grid & element)
                  </EditableElement>
                </GridColumn>
                <div className="col-span-6 p-4 bg-gray-100 text-center text-gray-600">
                  Other content
                </div>
              </div>
            )}
            
            {/* Conditional rendering based on viewMode */}
            {viewMode === 'empty' ? (
              // Empty cart state with simple editable slots
              <div className="emptyCart-section">
                <div className="text-center py-12">
                  <div className="grid grid-cols-12 gap-2 auto-rows-min">
                    {cartLayoutConfig?.slots && Object.keys(cartLayoutConfig.slots)
                      .filter(slotId => slotId.startsWith('emptyCart.'))
                      .map(slotId => {
                        if (slotId === 'emptyCart.icon') {
                          return (
                            <div key={slotId} className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                canResize={true}
                                draggable={true}
                              >
                                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                              </EditableElement>
                            </div>
                          );
                        }
                        
                        if (slotId === 'emptyCart.title') {
                          const titleStyling = getMicroSlotStyling('emptyCart.title');
                          const positioning = getSlotPositioning(slotId);
                          const defaultClasses = 'text-xl font-semibold text-gray-900 mb-2';
                          const finalClasses = positioning.className || titleStyling.elementClasses || defaultClasses;
                          
                          return (
                            <GridColumn
                              key={slotId}
                              colSpan={cartLayoutConfig?.microSlots?.[slotId]?.col || 12}
                              slotId={slotId}
                              onGridResize={handleGridResize}
                              mode={mode}
                              parentClassName={positioning.parentClassName}
                            >
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                className={finalClasses}
                                style={positioning.elementStyles || titleStyling.elementStyles}
                                canResize={true}
                                draggable={true}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Your cart is empty"}
                              </EditableElement>
                            </GridColumn>
                          );
                        }
                        
                        if (slotId === 'emptyCart.text') {
                          const textStyling = getMicroSlotStyling('emptyCart.text');
                          const positioning = getSlotPositioning(slotId);
                          const defaultClasses = 'text-gray-600 mb-6';
                          const finalClasses = positioning.className || textStyling.elementClasses || defaultClasses;
                          
                          return (
                            <GridColumn
                              key={slotId}
                              colSpan={cartLayoutConfig?.microSlots?.[slotId]?.col || 12}
                              slotId={slotId}
                              onGridResize={handleGridResize}
                              mode={mode}
                              parentClassName={positioning.parentClassName}
                            >
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                className={finalClasses}
                                style={positioning.elementStyles || textStyling.elementStyles}
                                canResize={true}
                                draggable={true}
                              >
                                {cartLayoutConfig.slots[slotId]?.content || "Looks like you haven't added anything to your cart yet."}
                              </EditableElement>
                            </GridColumn>
                          );
                        }
                        
                        if (slotId === 'emptyCart.button') {
                          const buttonStyling = getMicroSlotStyling('emptyCart.button');
                          const positioning = getSlotPositioning(slotId);
                          
                          return (
                            <GridColumn
                              key={slotId}
                              colSpan={cartLayoutConfig?.microSlots?.[slotId]?.col || 12}
                              slotId={slotId}
                              onGridResize={handleGridResize}
                              mode={mode}
                              parentClassName={`flex justify-center ${positioning.parentClassName}`}
                            >
                              <EditableElement
                                slotId={slotId}
                                mode={mode}
                                onClick={handleElementClick}
                                canResize={true}
                                draggable={true}
                              >
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 w-auto"
                                  style={positioning.elementStyles || buttonStyling.elementStyles}
                                >
                                  {cartLayoutConfig.slots[slotId]?.content || "Continue Shopping"}
                                </Button>
                              </EditableElement>
                            </GridColumn>
                          );
                        }
                        
                        return null;
                      })}
                  </div>
                </div>
              </div>
            ) : (
              // Cart with products view - Clean layout
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-white">
                    <CardContent className="px-4 divide-y divide-gray-200">
                      {/* Sample cart items */}
                      <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
                        <EditableElement
                          slotId="cartItem.image"
                          mode={mode}
                          onClick={handleElementClick}
                          canResize={true}
                          draggable={true}
                        >
                          <img 
                            src="https://placehold.co/100x100?text=Product" 
                            alt="Sample Product"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </EditableElement>
                        
                        <div className="flex-1">
                          <EditableElement
                            slotId="cartItem.title"
                            mode={mode}
                            onClick={handleElementClick}
                            className="text-lg font-semibold"
                            canResize={true}
                            draggable={true}
                          >
                            Sample Product
                          </EditableElement>
                          
                          <EditableElement
                            slotId="cartItem.price"
                            mode={mode}
                            onClick={handleElementClick}
                            className="text-gray-600"
                            canResize={true}
                            draggable={true}
                          >
                            $29.99 each
                          </EditableElement>
                          
                          <div className="flex items-center space-x-3 mt-3">
                            <EditableElement
                              slotId="cartItem.quantity"
                              mode={mode}
                              onClick={handleElementClick}
                              canResize={true}
                              draggable={true}
                            >
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline">
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-lg font-semibold">1</span>
                                <Button size="sm" variant="outline">
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="ml-auto">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </EditableElement>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <EditableElement
                            slotId="cartItem.total"
                            mode={mode}
                            onClick={handleElementClick}
                            className="text-xl font-bold"
                            canResize={true}
                            draggable={true}
                          >
                            $29.99
                          </EditableElement>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <CmsBlockRenderer position="cart_below_items" />
                </div>
                
                <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
                  {/* Coupon Section */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <EditableElement
                            slotId="coupon.title"
                            mode={mode}
                            onClick={handleElementClick}
                            className="text-lg font-semibold mb-4"
                            canResize={true}
                            draggable={true}
                          >
                            Apply Coupon
                          </EditableElement>
                        </div>
                        <GridColumn
                          colSpan={cartLayoutConfig?.microSlots?.['coupon.input']?.col || 8}
                          slotId="coupon.input"
                          onGridResize={handleGridResize}
                          mode={mode}
                          parentClassName={getSlotPositioning('coupon.input').parentClassName}
                        >
                          <EditableElement
                            slotId="coupon.input"
                            mode={mode}
                            onClick={handleElementClick}
                          >
                            <Input placeholder="Enter coupon code" />
                          </EditableElement>
                        </GridColumn>
                        <GridColumn
                          colSpan={cartLayoutConfig?.microSlots?.['coupon.button']?.col || 4}
                          slotId="coupon.button"
                          onGridResize={handleGridResize}
                          mode={mode}
                          parentClassName={getSlotPositioning('coupon.button').parentClassName}
                        >
                          <EditableElement
                            slotId="coupon.button"
                            mode={mode}
                            onClick={handleElementClick}
                          >
                            <Button>
                              <Tag className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </EditableElement>
                        </GridColumn>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Order Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min">
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <EditableElement
                            slotId="orderSummary.title"
                            mode={mode}
                            onClick={handleElementClick}
                            className="text-lg font-semibold mb-4"
                            canResize={true}
                            draggable={true}
                          >
                            Order Summary
                          </EditableElement>
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <EditableElement
                            slotId="orderSummary.subtotal"
                            mode={mode}
                            onClick={handleElementClick}
                            className="flex justify-between"
                            canResize={true}
                            draggable={true}
                          >
                            <span>Subtotal</span><span>$79.97</span>
                          </EditableElement>
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <EditableElement
                            slotId="orderSummary.tax"
                            mode={mode}
                            onClick={handleElementClick}
                            className="flex justify-between"
                            canResize={true}
                            draggable={true}
                          >
                            <span>Tax</span><span>$6.40</span>
                          </EditableElement>
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <EditableElement
                            slotId="orderSummary.total"
                            mode={mode}
                            onClick={handleElementClick}
                            className="flex justify-between text-lg font-semibold border-t pt-4"
                            canResize={true}
                            draggable={true}
                          >
                            <span>Total</span><span>$81.37</span>
                          </EditableElement>
                        </div>
                        <div className={`col-span-12 ${mode === 'edit' ? 'border border-dashed border-gray-300 rounded-md p-2' : ''}`}>
                          <div className="border-t mt-6 pt-6">
                            <EditableElement
                              slotId="orderSummary.checkoutButton"
                              mode={mode}
                              onClick={handleElementClick}
                              canResize={true}
                              draggable={true}
                            >
                              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                Proceed to Checkout
                              </Button>
                            </EditableElement>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
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