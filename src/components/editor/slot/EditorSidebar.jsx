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
  ChevronRight,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { styleManager } from './SimpleStyleManager';
import { saveManager, CHANGE_TYPES } from './SaveManager';
import { parseEditorHtml, validateEditorHtml, SECURITY_LEVELS } from '@/utils/secureHtmlParser';
import FeatureIntegration from '../features/FeatureIntegration';

/**
 * Check if a class string contains bold styling
 */
function isBold(className) {
  return className.includes('font-bold') || className.includes('font-semibold');
}

/**
 * Check if a class string contains italic styling
 */
function isItalic(className) {
  return className.includes('italic');
}

/**
 * Get current alignment from class string
 */
function getCurrentAlign(className, isWrapperSlot = false) {
  if (className.includes('text-center')) return 'center';
  if (className.includes('text-right')) return 'right';
  return 'left';
}

/**
 * Get current font size from class string
 */
function getCurrentFontSize(className) {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const found = sizes.find(size => className.includes(size));
  return found ? found.replace('text-', '') : 'base';
}

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
    features: false,
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
  
  // Refs for uncontrolled textareas to avoid React re-render lag
  const textContentRef = useRef(null);
  const htmlContentRef = useRef(null);
  
  // Keep local state only for initialization and blur handling
  const [localTextContent, setLocalTextContent] = useState('');
  const [localHtmlContent, setLocalHtmlContent] = useState('');
  
  // HTML validation and security state
  const [htmlValidation, setHtmlValidation] = useState({
    error: null,
    isValid: true,
    isSafe: true,
    wasModified: false,
    warnings: []
  });
  
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
      
      // Debug logging to help diagnose configuration loading issues
      console.log('EditorSidebar: Loading configuration for slot:', {
        slotId,
        slotConfigKeys: slotConfig ? Object.keys(slotConfig) : 'no slotConfig',
        storedClassName,
        storedStyles,
        fullSlotConfig: slotConfig
      });
      
      // Initialize local text content with slot content
      const textContent = slotConfig.content || '';
      setLocalTextContent(textContent);
      
      // Update textarea ref value
      if (textContentRef.current) {
        textContentRef.current.value = textContent;
      }
      
      // Initialize local HTML content with clean HTML (no editor attributes/classes)
      if (isHtmlElement && selectedElement) {
        const htmlContent = getCleanHtml(selectedElement) || '';
        setLocalHtmlContent(htmlContent);
        
        // Update HTML textarea ref value
        if (htmlContentRef.current) {
          htmlContentRef.current.value = htmlContent;
        }
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
                    } else {
                      elementStyles[prop] = computedValue;
                    }
                  } catch (e) {
                    elementStyles[prop] = computedValue;
                  }
                } else if (computedValue.startsWith('#')) {
                  // Already a hex value
                  elementStyles[prop] = computedValue;
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

  // Ultra-fast text change handler - no React state updates during typing
  const handleTextContentChange = useCallback((e) => {
    // Do absolutely nothing - let the textarea be uncontrolled during typing
    // This eliminates React re-render lag completely
  }, []);

  // Secure HTML content change handler with XSS prevention
  const handleHtmlContentChange = useCallback((e) => {
    const newHtml = e.target.value;
    
    // Validate HTML in real-time for security feedback
    if (newHtml.trim()) {
      const validation = validateEditorHtml(newHtml);
      setHtmlValidation(validation);
    } else {
      // Clear validation for empty input
      setHtmlValidation({
        error: null,
        isValid: true,
        isSafe: true,
        wasModified: false,
        warnings: []
      });
    }
  }, []);

  // Save text content when user stops typing (onBlur)
  const handleTextContentSave = useCallback(() => {
    if (slotId && onTextChange && !isInitializing && textContentRef.current) {
      const currentValue = textContentRef.current.value;
      onTextChange(slotId, currentValue);
      setLocalTextContent(currentValue); // Update state for consistency
    }
  }, [slotId, onTextChange, isInitializing]);

  // Save HTML content when user stops typing (onBlur) with XSS prevention
  const handleHtmlContentSave = useCallback(() => {
    if (slotId && onTextChange && !isInitializing && htmlContentRef.current) {
      const currentHtml = htmlContentRef.current.value;
      
      // Parse and sanitize HTML securely
      const parsed = parseEditorHtml(currentHtml);
      
      if (parsed.isValid && parsed.sanitizedHtml) {
        // Save the sanitized HTML (XSS-safe)
        onTextChange(slotId, parsed.sanitizedHtml);
        setLocalHtmlContent(currentHtml); // Update state for consistency
        
        // Update validation state
        setHtmlValidation({
          error: parsed.error,
          isValid: parsed.isValid,
          isSafe: true, // parseEditorHtml ensures safety
          wasModified: parsed.wasModified,
          warnings: parsed.wasModified ? ['HTML was sanitized for security'] : []
        });
      } else {
        // Handle invalid HTML
        setHtmlValidation({
          error: parsed.error || 'Invalid HTML content',
          isValid: false,
          isSafe: false,
          wasModified: false,
          warnings: ['HTML content could not be processed safely']
        });
      }
    }
  }, [slotId, onTextChange, isInitializing]);

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
      // Preserve existing inline styles before class changes
      const currentInlineStyles = {};
      if (selectedElement.style) {
        for (let i = 0; i < selectedElement.style.length; i++) {
          const styleProp = selectedElement.style[i];
          const styleValue = selectedElement.style.getPropertyValue(styleProp);
          if (styleValue && styleValue.trim() !== '') {
            currentInlineStyles[styleProp] = styleValue;
          }
        }
      }
      
      // Handle class-based properties (Tailwind) - apply immediately
      const success = styleManager.applyStyle(selectedElement, `class_${property}`, value);
      if (success) {
        // Restore preserved inline styles after class change
        Object.entries(currentInlineStyles).forEach(([styleProp, styleValue]) => {
          selectedElement.style.setProperty(styleProp, styleValue);
        });
        
        // Update local state for UI responsiveness with preserved styles
        setTimeout(() => {
          setElementProperties(prev => ({
            ...prev,
            className: selectedElement.className,
            styles: {
              ...prev.styles,
              ...currentInlineStyles
            }
          }));
        }, 10);
        
        // Save immediately using parent callback with preserved styles
        if (onInlineClassChange) {
          onInlineClassChange(elementSlotId, selectedElement.className, currentInlineStyles);
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
                ref={textContentRef}
                id="textContent"
                defaultValue={localTextContent}
                onChange={handleTextContentChange}
                onBlur={handleTextContentSave}
                className="w-full mt-1 text-xs border border-gray-300 rounded-md p-2 h-20 resize-none"
                placeholder="Enter text content..."
              />
            </div>
            
            {/* HTML Content Editor - only show for HTML elements */}
            {isHtmlElement && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="htmlContent" className="text-xs font-medium">HTML Content</Label>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">XSS Protected</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-2">Edit HTML content - automatically sanitized for security</p>
                <textarea
                  ref={htmlContentRef}
                  id="htmlContent"
                  defaultValue={localHtmlContent}
                  onChange={handleHtmlContentChange}
                  onBlur={handleHtmlContentSave}
                  className={`w-full mt-1 text-xs font-mono border rounded-md p-2 h-32 resize-none ${
                    htmlValidation.error 
                      ? 'border-red-300 bg-red-50' 
                      : htmlValidation.wasModified 
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-300'
                  }`}
                  placeholder="<button class='btn btn-primary'>Click me</button>"
                />
                
                {/* Validation Feedback */}
                {htmlValidation.error && (
                  <div className="flex items-start gap-1 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-red-700 font-medium">Security Error</p>
                      <p className="text-xs text-red-600">{htmlValidation.error}</p>
                    </div>
                  </div>
                )}
                
                {htmlValidation.wasModified && !htmlValidation.error && (
                  <div className="flex items-start gap-1 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <Shield className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 font-medium">Content Sanitized</p>
                      <p className="text-xs text-yellow-600">HTML was automatically cleaned for security</p>
                    </div>
                  </div>
                )}
                
                {htmlValidation.warnings.length > 0 && (
                  <div className="mt-2">
                    {htmlValidation.warnings.map((warning, index) => (
                      <p key={index} className="text-xs text-yellow-600">⚠️ {warning}</p>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <Shield className="w-3 h-3 text-blue-600" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">Security Level: Editor</p>
                    <p>Allows common HTML elements while preventing XSS attacks</p>
                  </div>
                </div>
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
                      value={elementProperties.styles.color && elementProperties.styles.color.startsWith('#') ? elementProperties.styles.color : '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.styles.color || ''}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="text-xs h-7"
                      placeholder={elementProperties.styles.color || 'No color set'}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bgColor" className="text-xs font-medium">Background</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="bgColor"
                      type="color"
                      value={elementProperties.styles.backgroundColor && elementProperties.styles.backgroundColor.startsWith('#') ? elementProperties.styles.backgroundColor : '#ffffff'}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.styles.backgroundColor || ''}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="text-xs h-7"
                      placeholder={elementProperties.styles.backgroundColor || 'No background set'}
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
                        value={elementProperties.styles.borderColor && elementProperties.styles.borderColor.startsWith('#') ? elementProperties.styles.borderColor : '#e5e7eb'}
                        onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                        className="w-8 h-6 rounded border border-gray-300"
                      />
                      <Input
                        value={elementProperties.styles.borderColor || ''}
                        onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                        className="text-xs h-6"
                        placeholder={elementProperties.styles.borderColor || 'No border color set'}
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

            {/* Interactive Features Section */}
            <SectionHeader title="Interactive Features" section="features">
              <FeatureIntegration
                slotId={slotId}
                elementId={selectedElement?.id || selectedElement?.getAttribute?.('data-slot-id')}
                userId="current-user" // TODO: Get from auth context
                storeId="current-store" // TODO: Get from store context
                slotConfig={slotConfig}
                onFeatureExecuted={(elementId, action, data) => {
                  console.log('Feature executed:', { elementId, action, data });
                  // TODO: Handle feature execution results
                }}
              />
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