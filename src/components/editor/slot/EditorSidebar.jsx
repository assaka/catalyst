import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize2,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isBold,
  isItalic,
  getCurrentAlign,
  getCurrentFontSize,
  debounce
} from './editor-utils';
import { styleManager } from './SimpleStyleManager';

const EditorSidebar = ({ 
  selectedElement, 
  onClearSelection,
  onClassChange,  // New prop for class changes
  onTextChange,   // New prop for text content changes
  slotId,        // Current slot ID
  slotConfig,    // Current slot configuration from database
  isVisible = true 
}) => {
  // Set up database save callback for SimpleStyleManager
  useEffect(() => {
    if (onClassChange) {
      styleManager.setDatabaseSaveCallback((updates) => {
        // Convert our updates to the format expected by onClassChange
        Object.entries(updates).forEach(([elementId, data]) => {
          onClassChange(elementId, data.className, data.styles || {});
        });
      });
    }
  }, [onClassChange]);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    text: true,
    layout: true,
    appearance: true,
    advanced: false,
    size: true
  });

  const [elementProperties, setElementProperties] = useState({
    width: '',
    height: '',
    className: '',
    styles: {}
  });

  // State for persistent button selection
  const [lastSelectedButton, setLastSelectedButton] = useState(null);
  
  // Local text content state for immediate UI updates
  const [localTextContent, setLocalTextContent] = useState('');
  
  // Refs for debounced text input and property changes
  const textChangeTimeoutRef = useRef(null);
  const propertyChangeTimeoutRef = useRef(null);
  const onTextChangeRef = useRef(onTextChange);

  // Keep the ref updated
  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  // Cleanup timeout on unmount or when selection changes
  useEffect(() => {
    return () => {
      if (textChangeTimeoutRef.current) {
        clearTimeout(textChangeTimeoutRef.current);
      }
      if (propertyChangeTimeoutRef.current) {
        clearTimeout(propertyChangeTimeoutRef.current);
      }
    };
  }, [selectedElement, slotId]);

  // Check if selected element is a slot element
  const isSlotElement = selectedElement && (
    selectedElement.hasAttribute('data-slot-id') ||
    selectedElement.hasAttribute('data-editable') ||
    selectedElement.closest('[data-slot-id]') ||
    selectedElement.closest('[data-editable]')
  );

  // Update properties when selected element changes
  useEffect(() => {
    if (selectedElement && isSlotElement && slotConfig) {
      // Check if this is a button element for persistent selection
      const isButton = selectedElement.tagName?.toLowerCase() === 'button' || 
                      selectedElement.className?.includes('btn') ||
                      selectedElement.getAttribute('role') === 'button';
      
      if (isButton) {
        setLastSelectedButton({
          element: selectedElement,
          slotId: slotId,
          timestamp: Date.now()
        });
      }
      
      // Get stored configuration values, fallback to current element values
      const storedClassName = slotConfig.className || '';
      const storedStyles = slotConfig.styles || {};
      
      // Initialize local text content with slot content
      setLocalTextContent(slotConfig.content || '');
      
      setElementProperties({
        width: selectedElement.offsetWidth || '',
        height: selectedElement.offsetHeight || '',
        className: storedClassName || selectedElement.className || '',
        styles: (() => {
          try {
            // Safely merge stored styles with element styles
            const elementStyles = {};
            
            // Get computed styles for color properties
            const computedStyle = window.getComputedStyle(selectedElement);
            const colorProperties = ['color', 'backgroundColor', 'borderColor'];
            
            colorProperties.forEach(prop => {
              const computedValue = computedStyle[prop];
              if (computedValue && computedValue !== 'rgba(0, 0, 0, 0)' && computedValue !== 'transparent') {
                // Convert rgb/rgba to hex if possible
                if (computedValue.startsWith('rgb')) {
                  try {
                    const rgbMatch = computedValue.match(/\d+/g);
                    if (rgbMatch && rgbMatch.length >= 3) {
                      const hex = '#' + rgbMatch.slice(0, 3)
                        .map(x => parseInt(x).toString(16).padStart(2, '0'))
                        .join('');
                      elementStyles[prop] = hex;
                    }
                  } catch (e) {
                    elementStyles[prop] = computedValue;
                  }
                } else {
                  elementStyles[prop] = computedValue;
                }
              }
            });
            
            // Copy element inline styles safely
            if (selectedElement.style) {
              for (const property in selectedElement.style) {
                if (selectedElement.style.hasOwnProperty(property)) {
                  const value = selectedElement.style[property];
                  if (value && !property.startsWith('webkit') && !property.startsWith('moz')) {
                    try {
                      elementStyles[property] = value;
                    } catch (e) {
                      // Skip read-only properties
                      console.debug(`Skipping read-only style property: ${property}`);
                    }
                  }
                }
              }
            }
            
            return {
              ...storedStyles,
              ...elementStyles
            };
          } catch (error) {
            console.warn('Error merging styles:', error);
            return { ...storedStyles };
          }
        })()
      });
    }
  }, [selectedElement, isSlotElement, slotConfig, slotId]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Handle immediate text change (for UI responsiveness) + debounced save
  const handleTextContentChange = useCallback((e) => {
    const newText = e.target.value;
    
    console.log('🎯 handleTextContentChange called:', { newText, slotId });
    
    // Update local state immediately for UI responsiveness
    setLocalTextContent(newText);
    
    // Clear existing timeout to reset the debounce
    if (textChangeTimeoutRef.current) {
      console.log('🔄 Clearing existing timeout:', textChangeTimeoutRef.current);
      clearTimeout(textChangeTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    textChangeTimeoutRef.current = setTimeout(() => {
      if (onTextChangeRef.current) {
        console.log('🎨 Debounced text save triggered for:', slotId, { content: newText });
        onTextChangeRef.current(slotId, newText);
      } else {
        console.log('❌ onTextChangeRef.current is null/undefined');
      }
    }, 1000); // 1000ms debounce delay
    
    console.log('⏰ Set new timeout:', textChangeTimeoutRef.current);
  }, [slotId]); // Removed onTextChange dependency

  // Ultra-simple style management with debouncing for property changes
  const handlePropertyChange = useCallback((property, value) => {
    if (!selectedElement) return;

    // Apply changes immediately to DOM for UI responsiveness
    const classBasedProperties = ['fontSize', 'fontWeight', 'fontStyle', 'textAlign'];
    const actualProperty = classBasedProperties.includes(property) ? `class_${property}` : property;
    
    // Apply the style immediately to the DOM for visual feedback
    if (classBasedProperties.includes(property)) {
      // Handle class-based properties (Tailwind) - these don't need debouncing as much
      const success = styleManager.applyStyle(selectedElement, actualProperty, value);
      if (success) {
        console.log(`✅ Applied class-based ${property}: ${value}`);
        setTimeout(() => {
          setElementProperties(prev => ({
            ...prev,
            className: selectedElement.className
          }));
        }, 10);
      }
    } else {
      // Handle inline style properties (padding, margin, border, etc.) - these need debouncing
      console.log(`🎯 Setting immediate style ${property}: ${value}`);
      selectedElement.style[property] = value + (typeof value === 'number' || /^\d+$/.test(value) ? 'px' : '');
      
      // Update local state immediately for UI responsiveness
      setElementProperties(prev => ({
        ...prev,
        styles: {
          ...prev.styles,
          [property]: value
        }
      }));

      // Clear existing timeout to reset debounce
      if (propertyChangeTimeoutRef.current) {
        clearTimeout(propertyChangeTimeoutRef.current);
      }
      
      // Set new timeout for debounced save
      propertyChangeTimeoutRef.current = setTimeout(() => {
        console.log(`💾 Debounced save triggered for ${property}: ${value}`);
        // Apply via style manager for database persistence
        styleManager.applyStyle(selectedElement, actualProperty, value);
      }, 1000); // 1000ms debounce delay for property changes
    }
  }, [selectedElement]);

  const SectionHeader = ({ title, section, children }) => (
    <div className="border-b border-gray-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSection(section);
        }}
        className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        <span>{title}</span>
        {expandedSections[section] ? 
          <ChevronDown className="w-4 h-4" /> : 
          <ChevronRight className="w-4 h-4" />
        }
      </button>
      {expandedSections[section] && (
        <div className="p-3 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );

  // Only show sidebar when a slot element is selected
  if (!isVisible || !isSlotElement) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col editor-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Element Properties
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Element Info */}
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <p className="text-sm text-blue-800 font-medium">
            {selectedElement.tagName?.toLowerCase() || 'element'}
            {lastSelectedButton && lastSelectedButton.slotId === slotId && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Button Selected
              </span>
            )}
          </p>
          <p className="text-xs text-blue-600">
            {selectedElement.className || 'No classes'}
          </p>
          {lastSelectedButton && lastSelectedButton.slotId === slotId && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Button styling will persist until new selection
            </p>
          )}
        </div>

        {/* Content Section */}
        <SectionHeader title="Content" section="content">
          <div className="space-y-3">
            <div>
              <Label htmlFor="textContent" className="text-xs font-medium">Text Content</Label>
              <textarea
                id="textContent"
                value={localTextContent}
                onChange={handleTextContentChange}
                className="w-full mt-1 text-xs border border-gray-300 rounded-md p-2 h-20 resize-none"
                placeholder="Enter text content..."
              />
            </div>
          </div>
        </SectionHeader>

            {/* Size Section */}
            <SectionHeader title="Size" section="size">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width" className="text-xs font-medium">Width</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="width"
                        type="number"
                        value={elementProperties.width}
                        onChange={(e) => handlePropertyChange('width', e.target.value)}
                        className="text-xs h-7"
                        placeholder="Auto"
                      />
                      <span className="ml-1 text-xs text-gray-500">px</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs font-medium">Height</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="height"
                        type="number"
                        value={elementProperties.height}
                        onChange={(e) => handlePropertyChange('height', e.target.value)}
                        className="text-xs h-7"
                        placeholder="Auto"
                      />
                      <span className="ml-1 text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('width', elementProperties.width + 10);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Resize
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('width', 'auto');
                      handlePropertyChange('height', 'auto');
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </SectionHeader>

            {/* Text Section */}
            <SectionHeader title="Typography" section="text">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fontSize" className="text-xs font-medium">Font Size</Label>
                  <select
                    id="fontSize"
                    value={getCurrentFontSize(elementProperties.className)}
                    onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                    className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
                  >
                    <option value="xs">XS</option>
                    <option value="sm">SM</option>
                    <option value="base">Base</option>
                    <option value="lg">LG</option>
                    <option value="xl">XL</option>
                    <option value="2xl">2XL</option>
                    <option value="3xl">3XL</option>
                    <option value="4xl">4XL</option>
                  </select>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={(() => {
                      const isCurrentlyBold = isBold(elementProperties.className);
                      console.log('🎯 Bold button state check:', {
                        className: elementProperties.className,
                        isBold: isCurrentlyBold,
                        variant: isCurrentlyBold ? 'default' : 'outline'
                      });
                      return isCurrentlyBold ? 'default' : 'outline';
                    })()}
                    size="sm"
                    onClick={() => handlePropertyChange('fontWeight', 'bold')}
                    className="h-7 px-2"
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={isItalic(elementProperties.className) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('fontStyle', 'italic')}
                    className="h-7 px-2"
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={getCurrentAlign(elementProperties.className) === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'left')}
                    className="h-7 px-2"
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={getCurrentAlign(elementProperties.className) === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'center')}
                    className="h-7 px-2"
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={getCurrentAlign(elementProperties.className) === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'right')}
                    className="h-7 px-2"
                  >
                    <AlignRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </SectionHeader>

            {/* Appearance Section */}
            <SectionHeader title="Appearance" section="appearance">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="textColor" className="text-xs font-medium">Text Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="textColor"
                      type="color"
                      value={elementProperties.styles.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.styles.color || ''}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="text-xs h-7"
                      placeholder="Current color"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bgColor" className="text-xs font-medium">Background</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="bgColor"
                      type="color"
                      value={elementProperties.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.styles.backgroundColor || ''}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="text-xs h-7"
                      placeholder="Current background"
                    />
                  </div>
                </div>
              </div>
            </SectionHeader>

            {/* Advanced Section */}
            <SectionHeader title="Advanced" section="advanced">
              <div className="space-y-3">
                {/* Border Controls */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Border</Label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label htmlFor="borderWidth" className="text-xs">Width</Label>
                      <Input
                        id="borderWidth"
                        type="number"
                        value={parseInt(elementProperties.styles.borderWidth) || 0}
                        onChange={(e) => handlePropertyChange('borderWidth', e.target.value)}
                        className="text-xs h-6"
                        placeholder="0"
                        min="0"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="borderRadius" className="text-xs">Radius</Label>
                      <Input
                        id="borderRadius"
                        type="number"
                        value={parseInt(elementProperties.styles.borderRadius) || 0}
                        onChange={(e) => handlePropertyChange('borderRadius', e.target.value)}
                        className="text-xs h-6"
                        placeholder="0"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="borderColor" className="text-xs">Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="borderColor"
                        type="color"
                        value={elementProperties.styles.borderColor || '#e5e7eb'}
                        onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                        className="w-8 h-6 rounded border border-gray-300"
                      />
                      <Input
                        value={elementProperties.styles.borderColor || ''}
                        onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                        className="text-xs h-6"
                        placeholder="Current border"
                      />
                    </div>
                  </div>
                </div>

                {/* Shadow & Effects */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Effects</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                      <Input
                        id="opacity"
                        type="number"
                        value={elementProperties.styles.opacity || 1}
                        onChange={(e) => handlePropertyChange('opacity', e.target.value)}
                        className="text-xs h-6"
                        placeholder="1"
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zIndex" className="text-xs">Z-Index</Label>
                      <Input
                        id="zIndex"
                        type="number"
                        value={elementProperties.styles.zIndex || 0}
                        onChange={(e) => handlePropertyChange('zIndex', e.target.value)}
                        className="text-xs h-6"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="boxShadow" className="text-xs">Shadow</Label>
                    <select
                      id="boxShadow"
                      value={elementProperties.styles.boxShadow || 'none'}
                      onChange={(e) => handlePropertyChange('boxShadow', e.target.value)}
                      className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                    >
                      <option value="none">None</option>
                      <option value="0 1px 3px rgba(0,0,0,0.12)">Small</option>
                      <option value="0 4px 6px rgba(0,0,0,0.1)">Medium</option>
                      <option value="0 10px 25px rgba(0,0,0,0.15)">Large</option>
                      <option value="0 20px 40px rgba(0,0,0,0.1)">X-Large</option>
                    </select>
                  </div>
                </div>

                {/* Layout & Position */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Layout</Label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label htmlFor="display" className="text-xs">Display</Label>
                      <select
                        id="display"
                        value={elementProperties.styles.display || 'block'}
                        onChange={(e) => handlePropertyChange('display', e.target.value)}
                        className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                      >
                        <option value="block">Block</option>
                        <option value="inline">Inline</option>
                        <option value="inline-block">Inline Block</option>
                        <option value="flex">Flex</option>
                        <option value="grid">Grid</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="position" className="text-xs">Position</Label>
                      <select
                        id="position"
                        value={elementProperties.styles.position || 'static'}
                        onChange={(e) => handlePropertyChange('position', e.target.value)}
                        className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                      >
                        <option value="static">Static</option>
                        <option value="relative">Relative</option>
                        <option value="absolute">Absolute</option>
                        <option value="fixed">Fixed</option>
                        <option value="sticky">Sticky</option>
                      </select>
                    </div>
                  </div>

                  {/* Flex Controls - only show when display is flex */}
                  {elementProperties.styles.display === 'flex' && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <Label className="text-xs font-medium mb-1 block">Flex Properties</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <Label htmlFor="flexDirection" className="text-xs">Direction</Label>
                          <select
                            id="flexDirection"
                            value={elementProperties.styles.flexDirection || 'row'}
                            onChange={(e) => handlePropertyChange('flexDirection', e.target.value)}
                            className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                          >
                            <option value="row">Row</option>
                            <option value="column">Column</option>
                            <option value="row-reverse">Row Reverse</option>
                            <option value="column-reverse">Column Reverse</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="justifyContent" className="text-xs">Justify</Label>
                          <select
                            id="justifyContent"
                            value={elementProperties.styles.justifyContent || 'flex-start'}
                            onChange={(e) => handlePropertyChange('justifyContent', e.target.value)}
                            className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                          >
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="space-between">Space Between</option>
                            <option value="space-around">Space Around</option>
                            <option value="space-evenly">Space Evenly</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="alignItems" className="text-xs">Align</Label>
                          <select
                            id="alignItems"
                            value={elementProperties.styles.alignItems || 'stretch'}
                            onChange={(e) => handlePropertyChange('alignItems', e.target.value)}
                            className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                          >
                            <option value="stretch">Stretch</option>
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="baseline">Baseline</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionHeader>

            {/* Layout Section */}
            <SectionHeader title="Spacing" section="layout">
              <div className="space-y-4">
                {/* Padding Controls */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Padding</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div></div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.paddingTop) || 0}
                        onChange={(e) => handlePropertyChange('paddingTop', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.paddingLeft) || 0}
                        onChange={(e) => handlePropertyChange('paddingLeft', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.padding) || 0}
                        onChange={(e) => handlePropertyChange('padding', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="All"
                        min="0"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.paddingRight) || 0}
                        onChange={(e) => handlePropertyChange('paddingRight', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div></div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.paddingBottom) || 0}
                        onChange={(e) => handlePropertyChange('paddingBottom', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div></div>
                  </div>
                </div>

                {/* Margin Controls */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Margin</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div></div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.marginTop) || 0}
                        onChange={(e) => handlePropertyChange('marginTop', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.marginLeft) || 0}
                        onChange={(e) => handlePropertyChange('marginLeft', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.margin) || 0}
                        onChange={(e) => handlePropertyChange('margin', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="All"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.marginRight) || 0}
                        onChange={(e) => handlePropertyChange('marginRight', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div></div>
                    <div>
                      <Input
                        type="number"
                        value={parseInt(elementProperties.styles.marginBottom) || 0}
                        onChange={(e) => handlePropertyChange('marginBottom', e.target.value)}
                        className="text-xs h-6 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>
            </SectionHeader>
      </div>
    </div>
  );
};

export default EditorSidebar;