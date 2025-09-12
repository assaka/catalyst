import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { saveManager, CHANGE_TYPES } from './SaveManager';

const EditorSidebar = ({ 
  selectedElement, 
  onClearSelection,
  onClassChange,  // New prop for class changes
  onInlineClassChange, // Prop for inline class changes (alignment, etc.)
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
  
  // Local HTML content state for HTML editing
  const [localHtmlContent, setLocalHtmlContent] = useState('');
  
  // HTML validation state
  const [htmlValidationError, setHtmlValidationError] = useState(null);
  
  // Flag to prevent change recording during initialization
  const [isInitializing, setIsInitializing] = useState(false);
  
  // State to trigger alignment updates
  const [alignmentUpdate, setAlignmentUpdate] = useState(0);
  
  // Get current alignment from parent element
  const currentAlignment = useMemo(() => {
    if (!selectedElement) return 'left';
    
    const elementSlotId = selectedElement.getAttribute('data-slot-id');
    let targetElement;
    
    if (elementSlotId?.includes('.button')) {
      // For button slots, check the outer grid container
      targetElement = selectedElement.closest('.button-slot-container');
    } else {
      // For text slots, traverse up to find grid cell with col-span
      // Structure: text -> wrapper div -> grid cell (cleaner without ResizeWrapper)
      targetElement = selectedElement.parentElement;
      while (targetElement && !targetElement.className.includes('col-span')) {
        targetElement = targetElement.parentElement;
        // Safety check to avoid infinite loop
        if (targetElement === document.body) {
          targetElement = null;
          break;
        }
      }
    }
    
    if (!targetElement) return 'left';
    
    const parentClassName = targetElement.className || '';
    const alignment = getCurrentAlign(parentClassName, true);
    return alignment;
  }, [selectedElement, alignmentUpdate]);
  
  // Note: Save manager callback is handled by the parent CartSlotsEditor
  // EditorSidebar just records changes, parent handles the actual saving

  // Check if selected element is a slot element
  const isSlotElement = selectedElement && (
    selectedElement.hasAttribute('data-slot-id') ||
    selectedElement.hasAttribute('data-editable') ||
    selectedElement.closest('[data-slot-id]') ||
    selectedElement.closest('[data-editable]')
  );

  // Check if selected element supports HTML content editing
  const isHtmlElement = useMemo(() => {
    if (!selectedElement) return false;
    const tagName = selectedElement.tagName?.toLowerCase();
    const htmlSupportedTags = ['button', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'section', 'article'];
    return htmlSupportedTags.includes(tagName);
  }, [selectedElement]);

  // Generate clean HTML without editor-specific classes and attributes
  const getCleanHtml = useCallback((element) => {
    if (!element) return '';
    
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true);
    
    // Remove editor-specific attributes
    const editorAttributes = ['data-editable', 'data-slot-id'];
    editorAttributes.forEach(attr => {
      clonedElement.removeAttribute(attr);
    });
    
    // Remove editor-specific classes
    const editorClasses = [
      'cursor-pointer',
      'transition-all',
      'duration-200',
      'editor-selected',
      'resize-none',
      'select-none'
    ];
    
    const hoverClasses = ['hover:!outline-1', 'hover:!outline-blue-400', 'hover:!outline-offset-2', 'hover:outline'];
    const allEditorClasses = [...editorClasses, ...hoverClasses];
    
    // Clean classes from the element
    if (clonedElement.className) {
      const cleanClasses = clonedElement.className
        .split(' ')
        .filter(cls => !allEditorClasses.some(editorCls => cls.includes(editorCls.replace('!', ''))))
        .join(' ');
      
      if (cleanClasses.trim()) {
        clonedElement.className = cleanClasses;
      } else {
        clonedElement.removeAttribute('class');
      }
    }
    
    return clonedElement.outerHTML;
  }, []);

  // Update properties when selected element changes
  useEffect(() => {
    if (selectedElement && isSlotElement && slotConfig) {
      // Set initialization flag to prevent change recording
      setIsInitializing(true);
      
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
      
      // Initialize local HTML content with clean HTML (no editor attributes/classes)
      if (isHtmlElement && selectedElement) {
        setLocalHtmlContent(getCleanHtml(selectedElement) || '');
      }
      
      // Clear initialization flag after a short delay
      setTimeout(() => setIsInitializing(false), 100);
      
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

  // Simple text change handler - only update local state
  const handleTextContentChange = useCallback((e) => {
    const newText = e.target.value;
    
    // Only update local state - no save manager calls
    setLocalTextContent(newText);
  }, []);

  // Simple HTML content change handler - only update local state
  const handleHtmlContentChange = useCallback((e) => {
    const newHtml = e.target.value;
    
    // Only update local state for smooth typing
    setLocalHtmlContent(newHtml);
    
    // Clear validation errors
    setHtmlValidationError(null);
  }, []);

  // Save text content when user stops typing (onBlur)
  const handleTextContentSave = useCallback(() => {
    if (slotId && onTextChange && !isInitializing) {
      onTextChange(slotId, localTextContent);
    }
  }, [slotId, onTextChange, localTextContent, isInitializing]);

  // Save HTML content when user stops typing (onBlur)
  const handleHtmlContentSave = useCallback(() => {
    if (slotId && onTextChange && !isInitializing) {
      // Extract text content from HTML for database storage
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = localHtmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || localHtmlContent;
        onTextChange(slotId, textContent);
      } catch (error) {
        // Fallback to raw HTML if parsing fails
        onTextChange(slotId, localHtmlContent);
      }
    }
  }, [slotId, onTextChange, localHtmlContent, isInitializing]);

  // Simple alignment change handler - direct DOM updates
  const handleAlignmentChange = useCallback((property, value) => {
    if (!selectedElement || property !== 'textAlign') return;
    
    const elementSlotId = selectedElement.getAttribute('data-slot-id');
    if (!elementSlotId) return;
    
    // Find the correct target element for alignment classes
    let targetElement;
    if (elementSlotId.includes('.button')) {
      // Find the button-slot-container (the outer div with col-span-12)
      targetElement = selectedElement.closest('.button-slot-container');
    } else {
      // For text slots, traverse up to find grid cell with col-span
      targetElement = selectedElement.parentElement;
      while (targetElement && !targetElement.className.includes('col-span')) {
        targetElement = targetElement.parentElement;
        if (targetElement === document.body) {
          targetElement = null;
          break;
        }
      }
    }
    
    if (targetElement) {
      // Remove existing text alignment classes from target
      const currentClasses = targetElement.className.split(' ').filter(Boolean);
      const newClasses = currentClasses.filter(cls => 
        !cls.startsWith('text-left') && 
        !cls.startsWith('text-center') && 
        !cls.startsWith('text-right')
      );
      newClasses.push(`text-${value}`);
      targetElement.className = newClasses.join(' ');
      
      // Save immediately using parent callback
      if (onInlineClassChange) {
        onInlineClassChange(elementSlotId, targetElement.className, {}, true);
      }
    }
    
    // Trigger alignment update for button state
    setAlignmentUpdate(prev => prev + 1);
  }, [selectedElement, onInlineClassChange]);

  // Simple property change handler - direct DOM updates and immediate saves
  const handlePropertyChange = useCallback((property, value) => {
    if (!selectedElement) return;

    const elementSlotId = selectedElement.getAttribute('data-slot-id');
    if (!elementSlotId) return;

    // Handle textAlign specially - always apply to parent
    if (property === 'textAlign') {
      handleAlignmentChange(property, value);
      return;
    }

    const classBasedProperties = ['fontSize', 'fontWeight', 'fontStyle'];
    
    if (classBasedProperties.includes(property)) {
      // Handle class-based properties (Tailwind) - apply immediately
      const success = styleManager.applyStyle(selectedElement, `class_${property}`, value);
      if (success) {
        // Update local state for UI responsiveness
        setTimeout(() => {
          setElementProperties(prev => ({
            ...prev,
            className: selectedElement.className
          }));
        }, 10);
        
        // Save immediately using parent callback
        if (onInlineClassChange) {
          onInlineClassChange(elementSlotId, selectedElement.className, {});
        }
      }
    } else {
      // Handle inline style properties - apply immediately
      const formattedValue = typeof value === 'number' || /^\d+$/.test(value) ? value + 'px' : value;
      selectedElement.style[property] = formattedValue;
      
      // Update local state for UI responsiveness
      setElementProperties(prev => ({
        ...prev,
        styles: {
          ...prev.styles,
          [property]: formattedValue
        }
      }));
      
      // Save immediately using parent callback (for inline styles, we update classes to persist)
      if (onInlineClassChange) {
        onInlineClassChange(elementSlotId, selectedElement.className, { [property]: formattedValue });
      }
    }
  }, [selectedElement, handleAlignmentChange, onInlineClassChange]);

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
            {isHtmlElement && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                HTML Editable
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
          {isHtmlElement && (
            <p className="text-xs text-orange-600 mt-1">
              ✓ HTML content can be edited directly
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
                onBlur={handleTextContentSave}
                className="w-full mt-1 text-xs border border-gray-300 rounded-md p-2 h-20 resize-none"
                placeholder="Enter text content..."
              />
            </div>
            
            {/* HTML Content Editor - only show for HTML elements */}
            {isHtmlElement && (
              <div>
                <Label htmlFor="htmlContent" className="text-xs font-medium">Complete HTML Element</Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">Edit the complete HTML element including tag, attributes, and content</p>
                <textarea
                  id="htmlContent"
                  value={localHtmlContent}
                  onChange={handleHtmlContentChange}
                  onBlur={handleHtmlContentSave}
                  className={`w-full mt-1 text-xs font-mono border rounded-md p-2 h-32 resize-none ${
                    htmlValidationError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="<button class='...'>Content</button>"
                />
                {htmlValidationError && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ {htmlValidationError}
                  </p>
                )}
                <p className="text-xs text-orange-600 mt-1">
                  ✨ Live preview: Changes appear immediately in the editor
                </p>
              </div>
            )}
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
                    variant={isBold(elementProperties.className) ? 'default' : 'outline'}
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
                    variant={currentAlignment === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'left')}
                    className="h-7 px-2"
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={currentAlignment === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'center')}
                    className="h-7 px-2"
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={currentAlignment === 'right' ? 'default' : 'outline'}
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