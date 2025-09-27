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
import GridLayoutControl from './GridLayoutControl';

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
  allSlots = {}, // All slots configuration to check for product_items
  isVisible = true
}) => {
  console.log('🔵 EditorSidebar rendered with:', { selectedElement, slotId, slotConfig, isVisible });
  // Set up database save callback for SimpleStyleManager
  useEffect(() => {
    console.log('🔧 EDITOR SIDEBAR - Setting up database callback:', {
      hasOnClassChange: !!onClassChange
    });
    if (onClassChange) {
      styleManager.setDatabaseSaveCallback((updates) => {
        console.log('🔗 EDITOR SIDEBAR - Database callback triggered:', {
          updateCount: Object.keys(updates).length,
          updates,
          onClassChangeAvailable: !!onClassChange
        });
        // Convert our updates to the format expected by onClassChange
        Object.entries(updates).forEach(([elementId, data]) => {
          console.log(`🔗 EDITOR SIDEBAR - Calling onClassChange for ${elementId}:`, {
            className: data.className,
            styles: data.styles,
            metadata: data.metadata
          });
          onClassChange(elementId, data.className, data.styles || {});
        });
      });
    }
  }, [onClassChange]);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    grid: true,
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

    // First check if we have slotConfig with parentClassName
    if (slotConfig && slotConfig.parentClassName) {
      const alignment = getCurrentAlign(slotConfig.parentClassName, true);
      if (alignment !== 'left') { // Only use config if it has explicit alignment
        console.log('🎯 Using alignment from slotConfig:', alignment, slotConfig.parentClassName);
        return alignment;
      }
    }

    // Fallback to DOM detection for newly created elements
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
    console.log('🎯 Using alignment from DOM:', alignment, parentClassName);
    return alignment;
  }, [selectedElement, alignmentUpdate, slotConfig]);
  
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
    const isSupported = htmlSupportedTags.includes(tagName);
    
    console.log('🔍 EditorSidebar isHtmlElement check:', {
      tagName,
      isSupported,
      selectedElement: selectedElement?.outerHTML?.substring(0, 100) + '...'
    });
    
    return isSupported;
  }, [selectedElement]);

  // Generate clean HTML from database content and classes
  const getCleanHtmlFromDatabase = useCallback((slotConfig) => {
    if (!slotConfig) return '';

    const content = slotConfig.content || '';
    const className = slotConfig.className || '';
    const styles = slotConfig.styles || {};
    const type = slotConfig.type || 'div';

    // Create the correct element type based on slot type
    const element = document.createElement(
      type === 'button' ? 'button' :
      type === 'link' ? 'a' :
      'div'
    );

    // Apply classes from database (excluding editor-specific classes)
    const cleanClasses = className
      .split(' ')
      .filter(cls =>
        cls &&
        !cls.includes('cursor-') &&
        !cls.includes('hover:') &&
        !cls.includes('border-') &&
        !cls.includes('shadow-') &&
        !cls.includes('ring-') &&
        !cls.includes('focus:') &&
        cls !== 'transition-all' &&
        cls !== 'duration-200' &&
        cls !== 'group' &&
        cls !== 'relative'
      )
      .join(' ');

    if (cleanClasses) {
      element.className = cleanClasses;
    }

    // Apply styles from database (excluding editor-specific styles)
    Object.entries(styles).forEach(([property, value]) => {
      if (
        property !== 'cursor' &&
        property !== 'userSelect' &&
        property !== 'outline' &&
        property !== 'border' &&
        property !== 'boxShadow' &&
        value
      ) {
        try {
          element.style[property] = value;
        } catch (e) {
          console.warn(`Could not apply style ${property}: ${value}`);
        }
      }
    });

    // Set content (for buttons and links, extract text only to avoid nested divs)
    if (type === 'button' || type === 'link') {
      if (content.includes('<')) {
        // If content contains HTML, extract just the text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        element.textContent = tempDiv.textContent || tempDiv.innerText || content;
      } else {
        element.textContent = content;
      }

      // Add attributes for links (always include defaults)
      if (type === 'link') {
        element.href = slotConfig.href || '#';
        element.target = slotConfig.target || '_self';
        element.rel = 'noopener noreferrer';
      }
    } else {
      element.innerHTML = content;
    }

    return element.outerHTML;
  }, []);

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
    const cleanClasses = clonedElement.className
      .split(' ')
      .filter(cls =>
        cls &&
        !cls.includes('cursor-') &&
        !cls.includes('hover:') &&
        !cls.includes('border-') &&
        !cls.includes('shadow-') &&
        !cls.includes('ring-') &&
        !cls.includes('focus:') &&
        cls !== 'transition-all' &&
        cls !== 'duration-200' &&
        cls !== 'group' &&
        cls !== 'relative'
      )
      .join(' ');

    clonedElement.className = cleanClasses;

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
      console.log('🔧 EDITOR SIDEBAR - Loading configuration for slot:', {
        slotId,
        slotConfigKeys: slotConfig ? Object.keys(slotConfig) : 'no slotConfig',
        storedClassName,
        storedStyles,
        fullSlotConfig: slotConfig,
        hasStyles: storedStyles && Object.keys(storedStyles).length > 0,
        selectedElementTagName: selectedElement?.tagName
      });
      
      // Initialize local text content with slot content
      const textContent = slotConfig.content || '';
      setLocalTextContent(textContent);
      
      // Update textarea ref value
      if (textContentRef.current) {
        textContentRef.current.value = textContent;
      }
      
      // Initialize local HTML content with clean HTML from database
      if (isHtmlElement && slotConfig) {
        // Prefer database content over DOM element content
        const htmlContent = getCleanHtmlFromDatabase(slotConfig) || getCleanHtml(selectedElement) || '';
        setLocalHtmlContent(htmlContent);

        // Update HTML textarea ref value (but not if user is actively editing)
        if (htmlContentRef.current) {
          const currentValue = htmlContentRef.current.value;
          const shouldUpdate = currentValue === localHtmlContent || !currentValue;

          console.log('🔄 HTML textarea update check:', {
            previousValue: currentValue,
            newValue: htmlContent,
            localHtmlContent,
            shouldUpdate,
            slotId
          });

          if (shouldUpdate) {
            htmlContentRef.current.value = htmlContent;
          } else {
            console.log('⏭️ Skipping textarea reset - user may be editing');
          }
        }

        console.log('🎨 EditorSidebar: Loaded clean HTML from database:', {
          slotId,
          htmlLength: htmlContent.length,
          htmlPreview: htmlContent.substring(0, 200) + '...',
          hasContent: !!slotConfig.content,
          hasClasses: !!slotConfig.className,
          hasStyles: Object.keys(slotConfig.styles || {}).length > 0
        });
      }
      
      // Clear initialization flag after a short delay
      setTimeout(() => setIsInitializing(false), 100);

      // CRITICAL: Find the actual content element that has the styling classes
      // Structure: GridColumn wrapper (selectedElement) → UnifiedSlotRenderer wrapper → inner content
      // The styling classes are on the UnifiedSlotRenderer wrapper, not the GridColumn wrapper
      const findContentElement = (element) => {
        // If element has data-slot-id, it's the GridColumn wrapper, look inside for content
        if (element.hasAttribute('data-slot-id')) {
          // Look for the first child that has styling classes or is the UnifiedSlotRenderer wrapper
          for (const child of element.children) {
            if (child.className && (
              child.className.includes('font-') ||
              child.className.includes('text-') ||
              child.className.includes('italic') ||
              child.style.length > 0
            )) {
              return child;
            }
          }
          // If no styled child found, return the first child (UnifiedSlotRenderer wrapper)
          return element.children[0] || element;
        }
        return element;
      };

      const styledElement = findContentElement(selectedElement);

      console.log('🔧 EDITOR SIDEBAR - Initializing properties from:', {
        selectedElement: selectedElement.tagName,
        styledElement: styledElement.tagName,
        slotId,
        storedClassName,
        storedStyles,
        selectedElementClassName: selectedElement.className,
        styledElementClassName: styledElement.className,
        styledElementStyleLength: styledElement.style?.length || 0
      });

      // Function to extract hex color from Tailwind class name
      const getTailwindColorHex = (className) => {
        const tailwindColors = {
          // Tailwind color palette mapping to hex values
          'text-white': '#ffffff', 'text-black': '#000000',
          'text-gray-50': '#f9fafb', 'text-gray-100': '#f3f4f6', 'text-gray-200': '#e5e7eb',
          'text-gray-300': '#d1d5db', 'text-gray-400': '#9ca3af', 'text-gray-500': '#6b7280',
          'text-gray-600': '#4b5563', 'text-gray-700': '#374151', 'text-gray-800': '#1f2937',
          'text-gray-900': '#111827',
          'text-red-50': '#fef2f2', 'text-red-100': '#fee2e2', 'text-red-200': '#fecaca',
          'text-red-300': '#fca5a5', 'text-red-400': '#f87171', 'text-red-500': '#ef4444',
          'text-red-600': '#dc2626', 'text-red-700': '#b91c1c', 'text-red-800': '#991b1b',
          'text-red-900': '#7f1d1d',
          'text-blue-50': '#eff6ff', 'text-blue-100': '#dbeafe', 'text-blue-200': '#bfdbfe',
          'text-blue-300': '#93c5fd', 'text-blue-400': '#60a5fa', 'text-blue-500': '#3b82f6',
          'text-blue-600': '#2563eb', 'text-blue-700': '#1d4ed8', 'text-blue-800': '#1e40af',
          'text-blue-900': '#1e3a8a',
          'text-green-50': '#f0fdf4', 'text-green-100': '#dcfce7', 'text-green-200': '#bbf7d0',
          'text-green-300': '#86efac', 'text-green-400': '#4ade80', 'text-green-500': '#22c55e',
          'text-green-600': '#16a34a', 'text-green-700': '#15803d', 'text-green-800': '#166534',
          'text-green-900': '#14532d',
          'text-yellow-50': '#fefce8', 'text-yellow-100': '#fef3c7', 'text-yellow-200': '#fed7aa',
          'text-yellow-300': '#fdba74', 'text-yellow-400': '#fb923c', 'text-yellow-500': '#f59e0b',
          'text-yellow-600': '#d97706', 'text-yellow-700': '#b45309', 'text-yellow-800': '#92400e',
          'text-yellow-900': '#78350f',
          'text-purple-50': '#faf5ff', 'text-purple-100': '#f3e8ff', 'text-purple-200': '#e9d5ff',
          'text-purple-300': '#d8b4fe', 'text-purple-400': '#c084fc', 'text-purple-500': '#a855f7',
          'text-purple-600': '#9333ea', 'text-purple-700': '#7c3aed', 'text-purple-800': '#6b21a8',
          'text-purple-900': '#581c87',
          'text-pink-50': '#fdf2f8', 'text-pink-100': '#fce7f3', 'text-pink-200': '#fbcfe8',
          'text-pink-300': '#f9a8d4', 'text-pink-400': '#f472b6', 'text-pink-500': '#ec4899',
          'text-pink-600': '#db2777', 'text-pink-700': '#be185d', 'text-pink-800': '#9d174d',
          'text-pink-900': '#831843'
        };

        const classes = className.split(' ');
        for (const cls of classes) {
          if (tailwindColors[cls]) {
            return tailwindColors[cls];
          }
        }
        return null;
      };

      setElementProperties({
        width: selectedElement.offsetWidth || '',
        height: selectedElement.offsetHeight || '',
        className: storedClassName || styledElement.className || '',
        styles: (() => {
          try {
            // Safely merge stored styles with element styles
            const elementStyles = {};

            // Get computed styles for color properties from styledElement (content with classes)
            const computedStyle = window.getComputedStyle(styledElement);
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

            // Copy element inline styles safely from styledElement (content with classes)
            if (styledElement.style) {
              for (const property in styledElement.style) {
                if (styledElement.style.hasOwnProperty(property)) {
                  const value = styledElement.style[property];
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

            // Extract color from Tailwind classes if no inline color is set
            // Check both the wrapper (selectedElement) and content (styledElement) for color classes
            const wrapperClassName = selectedElement.className || '';
            const contentClassName = styledElement.className || '';
            const storedClassNames = storedClassName || '';
            const allClassNames = `${wrapperClassName} ${contentClassName} ${storedClassNames}`;

            if (!elementStyles.color && !storedStyles?.color) {
              const tailwindColor = getTailwindColorHex(allClassNames);
              if (tailwindColor) {
                elementStyles.color = tailwindColor;
              }
            }

            console.log('🔧 EDITOR SIDEBAR - Merged styles:', {
              storedStyles,
              elementStyles,
              wrapperClassName,
              contentClassName,
              storedClassNames,
              allClassNames,
              detectedTailwindColor: getTailwindColorHex(allClassNames),
              final: { ...storedStyles, ...elementStyles }
            });

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

  // HTML content change handler for real-time editing
  const handleHtmlContentInput = useCallback((e) => {
    console.log('🔤 HTML Content Input Event:', {
      eventType: e.type,
      value: e.target.value,
      valueLength: e.target.value.length,
      timestamp: new Date().toISOString()
    });

    // DON'T update validation state during typing to prevent re-renders
    // Only validate on blur to avoid resetting textarea value
    console.log('⚡ Skipping validation during typing to prevent re-renders');
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
    console.log('💾 HTML Content Save triggered:', {
      slotId,
      isInitializing,
      hasRef: !!htmlContentRef.current,
      currentValue: htmlContentRef.current?.value || 'NO REF'
    });

    if (slotId && !isInitializing && htmlContentRef.current) {
      const currentHtml = htmlContentRef.current.value;

      // If HTML is empty, clear content
      if (!currentHtml || currentHtml.trim() === '') {
        if (onTextChange) {
          onTextChange(slotId, '');
        }
        setLocalHtmlContent('');
        setHtmlValidation({
          error: null,
          isValid: true,
          isSafe: true,
          wasModified: false,
          warnings: []
        });
        return;
      }

      // Parse and sanitize HTML securely
      const parsed = parseEditorHtml(currentHtml);
      console.log('🔍 HTML Validation on Save:', parsed);

      if (parsed.sanitizedHtml) {
        try {
          // Parse the sanitized HTML to extract element structure
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = parsed.sanitizedHtml;
          const element = tempDiv.firstElementChild;

          if (element) {
            // Extract text content for the text field
            const textContent = element.textContent || element.innerText || '';

            // Extract classes and styles for onClassChange
            const elementClasses = element.className || '';
            const elementStyles = {};

            // Get inline styles
            if (element.style) {
              for (let i = 0; i < element.style.length; i++) {
                const property = element.style[i];
                elementStyles[property] = element.style.getPropertyValue(property);
              }
            }

            // Extract attributes for links, buttons, etc.
            const attributes = {};
            if (element.tagName === 'A') {
              attributes.href = element.href || '#';
              attributes.target = element.target || '_self';
              attributes.rel = element.rel || 'noopener noreferrer';
            }

            // Save text content separately
            if (onTextChange) {
              onTextChange(slotId, textContent);
            }

            // Save classes and styles
            if (onClassChange) {
              onClassChange(slotId, elementClasses, elementStyles);
            }

            // Update local HTML content display
            setLocalHtmlContent(parsed.sanitizedHtml);

            console.log('🎨 HTML Content parsed and saved:', {
              textContent,
              elementClasses,
              elementStyles,
              attributes,
              sanitizedHtml: parsed.sanitizedHtml
            });

          } else {
            // No element found, treat as plain text
            if (onTextChange) {
              onTextChange(slotId, parsed.textContent);
            }
            setLocalHtmlContent(parsed.textContent);
          }

          // Update validation state
          setHtmlValidation({
            error: parsed.error,
            isValid: parsed.isValid,
            isSafe: true,
            wasModified: parsed.wasModified,
            warnings: parsed.wasModified ? ['HTML was sanitized for security'] : []
          });

          // Update the textarea with sanitized content if it was modified
          if (parsed.wasModified && htmlContentRef.current) {
            htmlContentRef.current.value = parsed.sanitizedHtml;
          }

        } catch (parseError) {
          console.error('Failed to parse HTML element:', parseError);
          // Fallback to plain text
          if (onTextChange) {
            onTextChange(slotId, parsed.textContent);
          }
          setLocalHtmlContent(parsed.textContent);

          setHtmlValidation({
            error: 'HTML structure parsing failed, saved as text',
            isValid: false,
            isSafe: true,
            wasModified: true,
            warnings: ['Content saved as plain text due to parsing errors']
          });
        }
      } else {
        // Parsing completely failed, save original but show error
        if (onTextChange) {
          onTextChange(slotId, currentHtml);
        }
        setLocalHtmlContent(currentHtml);

        setHtmlValidation({
          error: parsed.error || 'Invalid HTML content',
          isValid: false,
          isSafe: false,
          wasModified: false,
          warnings: ['HTML may contain errors but was saved as-is']
        });
      }
    }
  }, [slotId, onTextChange, onClassChange, isInitializing]);

  // Simple alignment change handler - direct DOM updates
  const handleAlignmentChange = useCallback((property, value) => {
    console.log('🟠 handleAlignmentChange called:', { property, value, selectedElement, hasSelectedElement: !!selectedElement });
    if (!selectedElement || property !== 'textAlign') {
      console.log('🟠 Early return: selectedElement or property check failed');
      return;
    }

    const elementSlotId = selectedElement.getAttribute('data-slot-id');
    console.log('🟠 handleAlignmentChange elementSlotId:', elementSlotId);
    if (!elementSlotId) {
      console.log('🟠 Early return: no elementSlotId');
      return;
    }

    console.log('🟠 Passed initial checks, proceeding with alignment change');

    // Find the content element that has the styling classes (same logic as initialization)
    const findContentElement = (element) => {
      if (element.hasAttribute('data-slot-id')) {
        for (const child of element.children) {
          if (child.className && (
            child.className.includes('font-') ||
            child.className.includes('text-') ||
            child.className.includes('italic') ||
            child.style.length > 0
          )) {
            return child;
          }
        }
        return element.children[0] || element;
      }
      return element;
    };

    const styledElement = findContentElement(selectedElement);

    // Preserve existing inline styles and Tailwind color classes on the styled element before alignment change
    const currentInlineStyles = {};
    const currentColorClasses = [];

    // Preserve inline styles
    if (styledElement.style) {
      for (let i = 0; i < styledElement.style.length; i++) {
        const styleProp = styledElement.style[i];
        const styleValue = styledElement.style.getPropertyValue(styleProp);
        if (styleValue && styleValue.trim() !== '') {
          currentInlineStyles[styleProp] = styleValue;
        }
      }
    }

    // Preserve Tailwind color classes (text-white, text-black, text-blue-200, etc.)
    const currentClasses = styledElement.className.split(' ').filter(Boolean);
    currentClasses.forEach(cls => {
      if (cls.startsWith('text-') && (cls.includes('-') || cls === 'text-white' || cls === 'text-black')) {
        // Check if it's a color class (has a dash for variants like text-blue-200, or is text-white/text-black)
        const isColorClass = cls.match(/^text-(white|black|gray|red|yellow|green|blue|indigo|purple|pink|orange|emerald|teal|cyan|sky|violet|fuchsia|rose|lime|amber|stone|neutral|zinc|slate|warmGray|trueGray|coolGray)-?\d*$/) || cls === 'text-white' || cls === 'text-black';
        if (isColorClass) {
          currentColorClasses.push(cls);
        }
      }
    });
    
    // Find the correct target element for alignment classes
    console.log('🟠 Finding target element for:', elementSlotId);
    let targetElement;
    if (elementSlotId.includes('.button')) {
      // Find the button-slot-container (the outer div with col-span-12)
      targetElement = selectedElement.closest('.button-slot-container');
      console.log('🟠 Button slot - target element:', targetElement);
    } else {
      // For text slots, traverse up to find grid cell with gridColumn style or data-slot-id
      targetElement = selectedElement.parentElement;
      console.log('🟠 Text slot - starting from parent:', targetElement);
      while (targetElement &&
             !targetElement.className.includes('col-span') &&
             !targetElement.style.gridColumn &&
             !targetElement.getAttribute('data-slot-id')) {
        targetElement = targetElement.parentElement;
        if (targetElement === document.body) {
          targetElement = null;
          break;
        }
      }
      console.log('🟠 Text slot - final target element:', targetElement);
      if (targetElement) {
        console.log('🟠 Target element details:', {
          hasColSpan: targetElement.className.includes('col-span'),
          hasGridColumn: !!targetElement.style.gridColumn,
          hasDataSlotId: !!targetElement.getAttribute('data-slot-id'),
          className: targetElement.className,
          gridColumn: targetElement.style.gridColumn
        });
      }
    }
    
    console.log('🟠 Processing alignment with styled element (simplified approach)');

    // Apply alignment directly to the styled element for consistency
    // Remove existing text alignment classes from styled element
    const alignmentClasses = styledElement.className.split(' ').filter(Boolean);
    const newClasses = alignmentClasses.filter(cls =>
      !cls.startsWith('text-left') &&
      !cls.startsWith('text-center') &&
      !cls.startsWith('text-right')
    );
    newClasses.push(`text-${value}`);
    styledElement.className = newClasses.join(' ');

    // Restore preserved inline styles on the styled element
    Object.entries(currentInlineStyles).forEach(([styleProp, styleValue]) => {
      styledElement.style.setProperty(styleProp, styleValue);
    });

    // Restore preserved Tailwind color classes on the styled element
    if (currentColorClasses.length > 0) {
      const elementClasses = styledElement.className.split(' ').filter(Boolean);
      // Remove any existing color classes to avoid conflicts
      const cleanClasses = elementClasses.filter(cls => {
        const isColorClass = cls.match(/^text-(white|black|gray|red|yellow|green|blue|indigo|purple|pink|orange|emerald|teal|cyan|sky|violet|fuchsia|rose|lime|amber|stone|neutral|zinc|slate|warmGray|trueGray|coolGray)-?\d*$/) || cls === 'text-white' || cls === 'text-black';
        return !isColorClass;
      });
      // Add back the preserved color classes
      styledElement.className = [...cleanClasses, ...currentColorClasses].join(' ');
    }

    // Update local state with preserved styles
    setElementProperties(prev => ({
      ...prev,
      className: styledElement.className,
      styles: {
        ...prev.styles,
        ...currentInlineStyles
      }
    }));

    // Save the styled element classes directly (alignment is now included)
    if (onInlineClassChange) {
      onInlineClassChange(elementSlotId, styledElement.className, currentInlineStyles, true);
    }

    // Trigger alignment update for button state - do this after a delay to avoid interrupting the callback
    setTimeout(() => {
      setAlignmentUpdate(prev => prev + 1);
    }, 0);
  }, [selectedElement, onInlineClassChange]);

  // Simple property change handler - direct DOM updates and immediate saves
  const handlePropertyChange = useCallback((property, value) => {
    console.log('🟡 handlePropertyChange called:', { property, value, selectedElement, hasSelectedElement: !!selectedElement });
    if (!selectedElement) return;

    const elementSlotId = selectedElement.getAttribute('data-slot-id');
    if (!elementSlotId) return;

    // Handle textAlign specially - always apply to parent
    if (property === 'textAlign') {
      handleAlignmentChange(property, value);
      return;
    }

    // Find the content element that has the styling classes (same logic as initialization)
    const findContentElement = (element) => {
      if (element.hasAttribute('data-slot-id')) {
        for (const child of element.children) {
          if (child.className && (
            child.className.includes('font-') ||
            child.className.includes('text-') ||
            child.className.includes('italic') ||
            child.style.length > 0
          )) {
            return child;
          }
        }
        return element.children[0] || element;
      }
      return element;
    };

    const styledElement = findContentElement(selectedElement);

    const classBasedProperties = ['fontSize', 'fontWeight', 'fontStyle'];
    
    if (classBasedProperties.includes(property)) {
      // Preserve existing inline styles and Tailwind color classes before class changes
      const currentInlineStyles = {};
      const currentColorClasses = [];
      
      // Preserve inline styles
      if (styledElement.style) {
        for (let i = 0; i < styledElement.style.length; i++) {
          const styleProp = styledElement.style[i];
          const styleValue = styledElement.style.getPropertyValue(styleProp);
          if (styleValue && styleValue.trim() !== '') {
            currentInlineStyles[styleProp] = styleValue;
          }
        }
      }

      // Preserve Tailwind color classes (text-white, text-black, text-blue-200, etc.)
      const currentClasses = styledElement.className.split(' ').filter(Boolean);
      currentClasses.forEach(cls => {
        if (cls.startsWith('text-') && (cls.includes('-') || cls === 'text-white' || cls === 'text-black')) {
          // Check if it's a color class (has a dash for variants like text-blue-200, or is text-white/text-black)
          const isColorClass = cls.match(/^text-(white|black|gray|red|yellow|green|blue|indigo|purple|pink|orange|emerald|teal|cyan|sky|violet|fuchsia|rose|lime|amber|stone|neutral|zinc|slate|warmGray|trueGray|coolGray)-?\d*$/) || cls === 'text-white' || cls === 'text-black';
          if (isColorClass) {
            currentColorClasses.push(cls);
          }
        }
      });
      
      // Handle class-based properties (Tailwind) - apply immediately
      const success = styleManager.applyStyle(selectedElement, `class_${property}`, value);
      if (success) {
        // Restore preserved inline styles after class change on styled element
        Object.entries(currentInlineStyles).forEach(([styleProp, styleValue]) => {
          styledElement.style.setProperty(styleProp, styleValue);
        });

        // Restore preserved Tailwind color classes after class change
        if (currentColorClasses.length > 0) {
          const elementClasses = styledElement.className.split(' ').filter(Boolean);
          // Remove any existing color classes to avoid conflicts
          const cleanClasses = elementClasses.filter(cls => {
            const isColorClass = cls.match(/^text-(white|black|gray|red|yellow|green|blue|indigo|purple|pink|orange|emerald|teal|cyan|sky|violet|fuchsia|rose|lime|amber|stone|neutral|zinc|slate|warmGray|trueGray|coolGray)-?\d*$/) || cls === 'text-white' || cls === 'text-black';
            return !isColorClass;
          });
          // Add back the preserved color classes
          styledElement.className = [...cleanClasses, ...currentColorClasses].join(' ');
        }

        // Update local state for UI responsiveness with preserved styles
        setTimeout(() => {
          setElementProperties(prev => ({
            ...prev,
            className: styledElement.className,
            styles: {
              ...prev.styles,
              ...currentInlineStyles
            }
          }));
        }, 10);

        // Save immediately using parent callback with preserved styles
        if (onInlineClassChange) {
          onInlineClassChange(elementSlotId, styledElement.className, currentInlineStyles);
        }
      }
    } else {
      // Handle inline style properties - apply immediately
      // PRESERVE TAILWIND CLASSES (bold, italic, font-size, etc.) when changing inline styles

      // CRITICAL: For text slots in UnifiedSlotRenderer (line 96), BOTH className AND style
      // are on the content wrapper, NOT the GridColumn wrapper with data-slot-id.
      // So we should read/write EVERYTHING to styledElement (the content wrapper).
      const targetElement = styledElement;

      const currentInlineStyles = {};
      const currentTailwindClasses = [];

      // Preserve all inline styles from targetElement (content wrapper with classes/styles)
      if (targetElement.style) {
        for (let i = 0; i < targetElement.style.length; i++) {
          const styleProp = targetElement.style[i];
          const styleValue = targetElement.style.getPropertyValue(styleProp);
          if (styleValue && styleValue.trim() !== '') {
            currentInlineStyles[styleProp] = styleValue;
          }
        }
      }

      // Preserve ALL Tailwind classes from targetElement (content wrapper with classes/styles)
      const currentClasses = (targetElement.className || '').split(' ').filter(Boolean);
      currentClasses.forEach(cls => {
        // Preserve font-weight classes (bold, semibold, etc.)
        if (cls.startsWith('font-')) {
          currentTailwindClasses.push(cls);
        }
        // Preserve italic
        else if (cls === 'italic') {
          currentTailwindClasses.push(cls);
        }
        // Preserve font-size classes (text-xs, text-sm, etc.)
        else if (cls.startsWith('text-') && !cls.startsWith('text-left') && !cls.startsWith('text-center') && !cls.startsWith('text-right')) {
          currentTailwindClasses.push(cls);
        }
      });

      const formattedValue = typeof value === 'number' || /^\d+$/.test(value) ? value + 'px' : value;

      console.log(`🎨 STYLE CHANGE - Applying ${property}: ${formattedValue} to element:`, {
        elementSlotId,
        targetElement: targetElement.tagName,
        property,
        formattedValue,
        oldValue: targetElement.style[property],
        preservedTailwindClasses: currentTailwindClasses,
        preservedInlineStyles: Object.keys(currentInlineStyles),
        currentClassName: targetElement.className
      });

      targetElement.style[property] = formattedValue;

      console.log(`✅ STYLE CHANGE - Applied ${property}:`, {
        newValue: targetElement.style[property],
        cssText: targetElement.style.cssText
      });

      // Special handling for border properties to ensure visibility
      if (property === 'borderWidth' && parseInt(formattedValue) > 0) {
        // Automatically set border style to solid if not already set
        if (!targetElement.style.borderStyle || targetElement.style.borderStyle === 'none') {
          targetElement.style.borderStyle = 'solid';
        }
        // Set default border color if not already set
        if (!targetElement.style.borderColor) {
          targetElement.style.borderColor = '#e5e7eb'; // Default gray color
        }
      }

      // Restore ALL preserved inline styles to targetElement
      Object.entries(currentInlineStyles).forEach(([styleProp, styleValue]) => {
        if (styleProp !== property) { // Don't overwrite the property we just changed
          targetElement.style.setProperty(styleProp, styleValue);
        }
      });

      // Restore ALL preserved Tailwind classes to targetElement
      if (currentTailwindClasses.length > 0) {
        const elementClasses = (targetElement.className || '').split(' ').filter(Boolean);
        // Remove any Tailwind classes that might have been added/modified
        const cleanClasses = elementClasses.filter(cls => {
          return !cls.startsWith('font-') && cls !== 'italic' &&
                 (!cls.startsWith('text-') || cls.startsWith('text-left') || cls.startsWith('text-center') || cls.startsWith('text-right'));
        });
        // Add back ALL the preserved Tailwind classes
        targetElement.className = [...cleanClasses, ...currentTailwindClasses].join(' ');

        console.log('🔄 Restored Tailwind classes:', {
          preserved: currentTailwindClasses,
          finalClassName: targetElement.className,
          beforeCleanClasses: elementClasses,
          afterCleanClasses: cleanClasses
        });
      }

      // CRITICAL: Filter out editor-only classes before saving!
      // Editor adds border-2, border-blue-500, border-dashed for selection indicators
      // These should NOT be saved to the database
      const editorOnlyClasses = ['border-2', 'border-blue-500', 'border-dashed', 'shadow-md', 'shadow-blue-200/40'];
      const classNameForSave = targetElement.className
        .split(' ')
        .filter(cls => !editorOnlyClasses.includes(cls))
        .join(' ');

      console.log('🧹 Filtered editor classes before save:', {
        original: targetElement.className,
        filtered: classNameForSave,
        removed: targetElement.className.split(' ').filter(cls => editorOnlyClasses.includes(cls))
      });

      // Update local state for UI responsiveness
      setElementProperties(prev => ({
        ...prev,
        className: targetElement.className,
        styles: {
          ...prev.styles,
          ...currentInlineStyles,
          [property]: formattedValue,
          // Include auto-set border properties in state
          ...(property === 'borderWidth' && parseInt(formattedValue) > 0 ? {
            borderStyle: targetElement.style.borderStyle,
            borderColor: targetElement.style.borderColor
          } : {})
        }
      }));

      // Save immediately using parent callback (for inline styles, we update classes to persist)
      console.log(`💾 STYLE CHANGE - Saving to database:`, {
        elementSlotId,
        property,
        formattedValue,
        hasCallback: !!onInlineClassChange,
        className: targetElement.className,
        styles: { ...currentInlineStyles, [property]: formattedValue }
      });

      if (onInlineClassChange) {
        // Include auto-set border properties in save data
        const saveStyles = { ...currentInlineStyles, [property]: formattedValue };
        if (property === 'borderWidth' && parseInt(formattedValue) > 0) {
          saveStyles.borderStyle = targetElement.style.borderStyle;
          saveStyles.borderColor = targetElement.style.borderColor;
        }
        console.log(`💾 STYLE CHANGE - Calling onInlineClassChange with:`, {
          elementSlotId,
          className: targetElement.className,
          saveStyles
        });
        onInlineClassChange(elementSlotId, targetElement.className, saveStyles);
      } else {
        console.error(`❌ STYLE CHANGE - No onInlineClassChange callback!`);
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
    <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col editor-sidebar" style={{ zIndex: 1000 }}>
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
                  onInput={handleHtmlContentInput}
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

        {/* Grid Layout Section - Only show when product_items slot exists and we're working on product-related content */}
        {allSlots['product_items'] && (
          <SectionHeader title="Product Grid Layout" section="grid">
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <strong>Product Grid Configuration</strong><br/>
              Configure how products are displayed across different devices. This only affects the product grid layout.
            </div>
            <GridLayoutControl
              currentConfig={allSlots['product_items']?.metadata?.gridConfig || { mobile: 1, tablet: 2, desktop: 3 }}
              onConfigChange={(newGridConfig) => {
                console.log('🔧 Product grid config changed:', newGridConfig);
                console.log('🎯 Updating slot: product_items');
                console.log('🎯 Current product_items slot:', allSlots['product_items']);
                console.log('🎯 Current metadata:', allSlots['product_items']?.metadata);

                // Update product_items slot configuration with new grid config
                if (onClassChange) {
                  const productItemsSlot = allSlots['product_items'];
                  const newMetadata = {
                    ...productItemsSlot?.metadata,
                    gridConfig: newGridConfig
                  };

                  console.log('🎯 New metadata being saved:', newMetadata);
                  console.log('🎯 Calling onClassChange with slotId: product_items');

                  onClassChange('product_items', productItemsSlot?.className || '', productItemsSlot?.styles || {}, newMetadata);
                } else {
                  console.error('❌ No onClassChange handler available!');
                }
              }}
            />
          </SectionHeader>
        )}

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
                        value={parseInt(elementProperties.styles?.width) || 100}
                        onChange={(e) => handlePropertyChange('width', `${e.target.value}%`)}
                        className="text-xs h-7"
                        placeholder="100"
                        min="5"
                        max="300"
                        step="5"
                      />
                      <span className="ml-1 text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs font-medium">Height</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="height"
                        type="number"
                        value={parseInt(elementProperties.styles?.minHeight) || 40}
                        onChange={(e) => handlePropertyChange('minHeight', `${e.target.value}px`)}
                        className="text-xs h-7"
                        placeholder="Auto"
                        min="20"
                        max="500"
                        step="10"
                      />
                      <span className="ml-1 text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Quick Width</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '25%')}
                      className="h-7 px-2 text-xs"
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '50%')}
                      className="h-7 px-2 text-xs"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '75%')}
                      className="h-7 px-2 text-xs"
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '100%')}
                      className="h-7 px-2 text-xs"
                    >
                      100%
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '150%')}
                      className="h-7 px-2 text-xs"
                    >
                      150%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '200%')}
                      className="h-7 px-2 text-xs"
                    >
                      200%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePropertyChange('width', '250%')}
                      className="h-7 px-2 text-xs"
                    >
                      250%
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('width', 'auto');
                      handlePropertyChange('height', 'auto');
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Auto Size
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('width', '100%');
                      handlePropertyChange('maxWidth', '100%');
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Fill
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
                    onClick={() => {
                      handlePropertyChange('textAlign', 'left');
                    }}
                    className="h-7 px-2"
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={currentAlignment === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('textAlign', 'center');
                    }}
                    className="h-7 px-2"
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={currentAlignment === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handlePropertyChange('textAlign', 'right');
                    }}
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
                  <div className="grid grid-cols-3 gap-2 mb-2">
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
                      <Label htmlFor="borderStyle" className="text-xs">Style</Label>
                      <select
                        id="borderStyle"
                        value={elementProperties.styles.borderStyle || 'solid'}
                        onChange={(e) => handlePropertyChange('borderStyle', e.target.value)}
                        className="w-full mt-1 h-6 text-xs border border-gray-300 rounded-md"
                      >
                        <option value="none">None</option>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                        <option value="groove">Groove</option>
                        <option value="ridge">Ridge</option>
                        <option value="inset">Inset</option>
                        <option value="outset">Outset</option>
                      </select>
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