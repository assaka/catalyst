import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type as TypeIcon, 
  Palette,
  Edit,
  X,
  Check,
  Maximize2,
  Square,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TailwindStyleEditor from './TailwindStyleEditor';
import { 
  isBold,
  isItalic,
  getCurrentAlign,
  getCurrentFontSize,
  handleBoldToggle,
  handleItalicToggle,
  handleAlignmentChange,
  handleFontSizeChange,
  triggerSave,
  FONT_SIZES,
  SIZE_OPTIONS,
  PADDING_OPTIONS,
  getCurrentWidth,
  getCurrentHeight,
  getCurrentPadding,
  handleWidthChange,
  handleHeightChange,
  handlePaddingChange,
  isResizableElement
} from './editor-utils';

/**
 * InlineSlotEditor - A component that handles inline text editing with action toolbar
 * Includes: Bold, Italic, Font Size, Alignment, Color controls
 * This replaces the inline editing functionality in CartSlotsEditor
 */
export default function InlineSlotEditor({
  slotId,
  text,
  className = '',
  style = {},
  onChange,
  onClassChange,
  onEditSlot,
  mode = 'view',
  isWrapperSlot = false,
  elementType = 'div'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [localClass, setLocalClass] = useState(className);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update local state when props change
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    setLocalClass(className);
  }, [className]);

  // Initialize wrapper background color storage on component mount
  useEffect(() => {
    // This is a temporary solution - in production we'd pass wrapper styles as props
    // For now, we'll rely on the color picker to set the initial value
    if (!window.tempWrapperStyles) {
      window.tempWrapperStyles = {};
    }
  }, [slotId]);

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setLocalText(newText);
    
    // Auto-resize textarea if it's a textarea element
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    }
    
    if (onChange) {
      onChange(newText);
    }
  };

  // Handle Bold toggle
  const handleBold = () => {
    const newClassName = handleBoldToggle(localClass);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Toggling bold for ${slotId}:`, { 
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
    
    // No save needed - changes are applied directly via onClassChange
  };

  // Handle Italic toggle
  const handleItalic = () => {
    const newClassName = handleItalicToggle(localClass);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Toggling italic for ${slotId}:`, { 
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
    
    // No save needed - changes are applied directly via onClassChange
  };

  // Handle alignment
  const handleAlign = (alignment) => {
    const newClassName = handleAlignmentChange(localClass, alignment, isWrapperSlot);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing alignment for ${slotId}:`, { 
        alignment,
        old: localClass, 
        new: newClassName,
        isWrapper: isWrapperSlot 
      });
      // Pass isWrapperSlot as the 4th parameter to indicate this should be stored as parentClassName
      onClassChange(slotId, newClassName, {}, isWrapperSlot);
    }
    
    // No save needed - changes are applied directly via onClassChange
  };

  // Handle font size change
  const handleFontSize = (size) => {
    const newClassName = handleFontSizeChange(localClass, size);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing font size for ${slotId}:`, { 
        size,
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
    
    // No save needed - changes are applied directly via onClassChange
  };

  // Handle color changes (text and background)
  const handleColorChange = (colorType, colorValue) => {
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing ${colorType} for ${slotId}:`, { 
        colorType,
        colorValue,
        old: localClass
      });
      
      if (colorType === 'backgroundColor') {
        // For background color, apply to the wrapper/container to fill the entire slot
        const newStyles = {
          [colorType]: colorValue
        };
        
        // Store the background color temporarily for the color picker to display
        if (!window.tempWrapperStyles) window.tempWrapperStyles = {};
        window.tempWrapperStyles[slotId] = { backgroundColor: colorValue };
        
        // Pass true as 4th parameter to indicate this should be applied to the wrapper
        onClassChange(slotId, localClass, newStyles, true);
      } else {
        // For text color, apply to the text element itself
        const newStyles = {
          ...style,
          [colorType]: colorValue
        };
        onClassChange(slotId, localClass, newStyles, false);
      }
    }
    
    // No save needed - changes are applied directly via onClassChange
  };

  // Handle width change
  const handleWidth = (width) => {
    const newClassName = handleWidthChange(localClass, width);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing width for ${slotId}:`, { 
        width,
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
  };

  // Handle height change
  const handleHeight = (height) => {
    const newClassName = handleHeightChange(localClass, height);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing height for ${slotId}:`, { 
        height,
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
  };

  // Handle padding change
  const handlePadding = (padding) => {
    const newClassName = handlePaddingChange(localClass, padding);
    setLocalClass(newClassName);
    
    if (onClassChange) {
      console.log(`🎨 InlineSlotEditor: Changing padding for ${slotId}:`, { 
        padding,
        old: localClass, 
        new: newClassName 
      });
      onClassChange(slotId, newClassName);
    }
  };

  // Get current text color from class or style
  const getCurrentTextColor = (className, styles) => {
    // Check inline styles first
    if (styles?.color) {
      return styles.color;
    }
    
    // Try to extract from Tailwind classes
    const textColorMatch = className.match(/text-(\w+)-(\d+)/);
    if (textColorMatch) {
      // Return a basic color mapping for common Tailwind colors
      const colorMap = {
        'gray-900': '#111827',
        'gray-800': '#1f2937',
        'gray-700': '#374151',
        'gray-600': '#4b5563',
        'gray-500': '#6b7280',
        'blue-600': '#2563eb',
        'red-600': '#dc2626',
        'green-600': '#16a34a'
      };
      return colorMap[`${textColorMatch[1]}-${textColorMatch[2]}`] || '#000000';
    }
    
    return '#000000';
  };

  // Get current background color from class or style  
  const getCurrentBackgroundColor = (className, styles) => {
    // Check if we have a stored background color from previous wrapper styling
    const storedWrapperBg = window.tempWrapperStyles?.[slotId]?.backgroundColor;
    if (storedWrapperBg) {
      return storedWrapperBg;
    }
    
    // Check inline styles first
    if (styles?.backgroundColor) {
      return styles.backgroundColor;
    }
    
    // Try to extract from Tailwind classes
    const bgColorMatch = className.match(/bg-(\w+)-(\d+)/);
    if (bgColorMatch) {
      const colorMap = {
        'white': '#ffffff',
        'gray-50': '#f9fafb',
        'gray-100': '#f3f4f6',
        'blue-600': '#2563eb',
        'blue-700': '#1d4ed8',
        'green-600': '#16a34a',
        'green-700': '#15803d'
      };
      return colorMap[`${bgColorMatch[1]}-${bgColorMatch[2]}`] || '#ffffff';
    }
    
    return '#ffffff';
  };

  // Handle save
  const handleSave = () => {
    setIsEditing(false);
    // Trigger save through parent component
    triggerSave();
  };

  // Handle cancel
  const handleCancel = () => {
    setLocalText(text);
    setLocalClass(className);
    setIsEditing(false);
  };

  // Check current styles using utilities
  const bold = isBold(localClass);
  const italic = isItalic(localClass);
  const currentAlign = getCurrentAlign(localClass, isWrapperSlot);
  const currentFontSize = getCurrentFontSize(localClass);
  const currentWidth = getCurrentWidth(localClass);
  const currentHeight = getCurrentHeight(localClass);
  const currentPadding = getCurrentPadding(localClass);
  const isResizable = isResizableElement(localClass, elementType);

  // Don't render editor in view mode
  if (mode === 'view') {
    return (
      <div 
        className={localClass}
        style={style}
        dangerouslySetInnerHTML={{ __html: localText }}
      />
    );
  }

  // Render element based on type
  const renderElement = () => {
    if (elementType === 'icon') {
      // For icons, render the actual icon component
      return <ShoppingCart className={localClass} style={style} />;
    } else if (elementType === 'button') {
      // For buttons, render as a Button component with proper styling
      return (
        <Button 
          className={`${localClass} w-auto`}
          style={style}
        >
          <span dangerouslySetInnerHTML={{ __html: localText || 'Button' }} />
        </Button>
      );
    } else {
      // For text elements, render with proper text alignment support
      return (
        <div 
          className={`w-full ${localClass}`} 
          style={style}
          dangerouslySetInnerHTML={{ __html: localText || 'Click to edit' }} 
        />
      );
    }
  };

  return (
    <div className="relative group w-full">
      {!isEditing ? (
        // Display mode with edit button
        <div 
          className={`${elementType === 'button' ? '' : localClass} cursor-pointer hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-2 transition-all w-full`}
          style={elementType === 'button' ? {} : style}
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          {renderElement()}
          <button
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white p-1 rounded-full shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation();
              if (onEditSlot) {
                onEditSlot(slotId, localText, elementType);
              } else {
                setIsEditing(true);
              }
            }}
            title="Edit HTML"
          >
            <Edit className="w-3 h-3" />
          </button>
        </div>
      ) : (
        // Edit mode with action toolbar
        <div className="relative w-full">
          {/* Action Toolbar - Truly Responsive */}
          <div 
            className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 sm:p-2 z-[100]"
            style={{
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              maxWidth: '95vw'
            }}
          >
            <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="flex items-center gap-0.5 sm:gap-1 min-w-max">
            {/* Bold */}
            <button
              onClick={handleBold}
              className={`p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors ${bold ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Bold"
            >
              <Bold className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {/* Italic */}
            <button
              onClick={handleItalic}
              className={`p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors ${italic ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Italic"
            >
              <Italic className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

            {/* Alignment */}
            <button
              onClick={() => handleAlign('left')}
              className={`p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'left' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              className={`p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'center' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className={`p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'right' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

            {/* Font Size */}
            <select
              value={currentFontSize}
              onChange={(e) => handleFontSize(e.target.value)}
              className="px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm border border-gray-200 rounded hover:bg-gray-50 min-w-0"
              title="Font Size"
            >
              {FONT_SIZES.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>

            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

            {/* Text Color */}
            <div className="relative group">
              <input
                type="color"
                className="w-6 h-5 sm:w-8 sm:h-6 rounded border border-gray-200 cursor-pointer"
                title="Text Color"
                onChange={(e) => handleColorChange('color', e.target.value)}
                value={getCurrentTextColor(localClass, style)}
              />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-gray-500">
                Text
              </div>
            </div>

            {/* Background Color */}
            <div className="relative group">
              <input
                type="color"
                className="w-6 h-5 sm:w-8 sm:h-6 rounded border border-gray-200 cursor-pointer"
                title="Background Color"
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                value={getCurrentBackgroundColor(localClass, style)}
              />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-gray-500">
                BG
              </div>
            </div>

            {/* Content Controls - padding only (slot resizing handled by ResizeHandle) */}
            {isResizable && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Padding - Content spacing control */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 font-mono">P</span>
                  <select
                    value={currentPadding}
                    onChange={(e) => handlePadding(e.target.value)}
                    className="px-1 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 w-12"
                    title="Padding"
                  >
                    {PADDING_OPTIONS.map(padding => (
                      <option key={padding.value} value={padding.value}>
                        {padding.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

            {/* HTML Editor */}
            <button
              onClick={() => {
                if (onEditSlot) {
                  onEditSlot(slotId, localText, elementType);
                } else {
                  setShowHtmlEditor(true);
                }
              }}
              className="p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Edit HTML"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {/* Advanced Style Editor */}
            <button
              onClick={() => setShowStyleEditor(true)}
              className="p-1 sm:p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Advanced Styles"
            >
              <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

            {/* Save/Cancel */}
            <button
              onClick={handleSave}
              className="p-1 sm:p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
              title="Save"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 sm:p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
              title="Cancel"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
              </div>
            </div>
          </div>

          {/* Text Input or Button in edit mode */}
          {elementType === 'button' ? (
            <Button 
              className={`${localClass} w-auto outline-2 outline-blue-500 outline outline-offset-2`}
              style={style}
            >
              <input
                ref={inputRef}
                type="text"
                value={localText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="bg-transparent border-none outline-none min-w-[100px]"
                style={{ color: 'inherit' }}
              />
            </Button>
          ) : elementType === 'icon' ? (
            <div className="flex items-center gap-2">
              <ShoppingCart className={`${localClass} outline-2 outline-blue-500 outline outline-offset-2`} style={style} />
              <span className="text-sm text-gray-500">(Icon - edit styles only)</span>
            </div>
          ) : (
            // Use textarea for longer text content to prevent width distortion
            localText && localText.length > 30 ? (
              <textarea
                ref={inputRef}
                value={localText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className={`${localClass} w-full outline-2 outline-blue-500 outline outline-offset-2 resize-none overflow-hidden`}
                style={{
                  ...style,
                  minHeight: '1.5em',
                  maxHeight: '6em',
                  width: '100%', // Ensure it fills the slot container
                  boxSizing: 'border-box'
                }}
                rows={Math.min(4, Math.ceil(localText.length / 50))}
                title="Press Ctrl+Enter to save, Escape to cancel"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={localText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className={`${localClass} w-full outline-2 outline-blue-500 outline outline-offset-2`}
                style={{
                  ...style,
                  width: '100%', // Ensure it fills the slot container
                  boxSizing: 'border-box'
                }}
              />
            )
          )}
        </div>
      )}

      {/* HTML Editor Modal */}
      {showHtmlEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-96">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit HTML</h3>
              <button 
                onClick={() => setShowHtmlEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                className="w-full h-32 p-2 border border-gray-200 rounded resize-none font-mono text-sm"
                placeholder="Enter HTML content..."
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowHtmlEditor(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onChange) onChange(localText);
                    setShowHtmlEditor(false);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Style Editor Modal */}
      {showStyleEditor && (
        <TailwindStyleEditor
          text={localText}
          className={localClass}
          onChange={(newText, newClass) => {
            setLocalText(newText);
            setLocalClass(newClass);
            if (onChange) onChange(newText);
            if (onClassChange) onClassChange(slotId, newClass);
          }}
          onClose={() => setShowStyleEditor(false)}
        />
      )}
    </div>
  );
}