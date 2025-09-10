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
  Check
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
  FONT_SIZES
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
  mode = 'view',
  isWrapperSlot = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [localClass, setLocalClass] = useState(className);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
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

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setLocalText(newText);
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
      onClassChange(slotId, newClassName);
    }
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

  return (
    <div className="relative group">
      {!isEditing ? (
        // Display mode with edit button
        <div 
          className={`${localClass} cursor-pointer hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-2 transition-all`}
          style={style}
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          <span dangerouslySetInnerHTML={{ __html: localText || 'Click to edit' }} />
          <button
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white p-1 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit className="w-3 h-3" />
          </button>
        </div>
      ) : (
        // Edit mode with action toolbar
        <div className="relative">
          {/* Action Toolbar */}
          <div className="absolute -top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1 z-50">
            {/* Bold */}
            <button
              onClick={handleBold}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${bold ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              onClick={handleItalic}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${italic ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment */}
            <button
              onClick={() => handleAlign('left')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'left' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'center' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${currentAlign === 'right' ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Font Size */}
            <select
              value={currentFontSize}
              onChange={(e) => handleFontSize(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
              title="Font Size"
            >
              {FONT_SIZES.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Advanced Style Editor */}
            <button
              onClick={() => setShowStyleEditor(true)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Advanced Styles"
            >
              <Palette className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Save/Cancel */}
            <button
              onClick={handleSave}
              className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Text Input */}
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
            style={style}
          />
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