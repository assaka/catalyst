import React, { useState, useCallback, useEffect } from 'react';
import { 
  Type, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Maximize2,
  Move3D,
  Layout,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  toggleClass,
  isBold,
  isItalic,
  getCurrentAlign,
  getCurrentFontSize,
  handleBoldToggle,
  handleItalicToggle,
  handleAlignmentChange,
  handleFontSizeChange,
  FONT_SIZES,
  COLOR_PALETTE
} from './editor-utils';

const EditorSidebar = ({ 
  selectedElement, 
  onUpdateElement, 
  onClearSelection,
  onClassChange,  // New prop for class changes
  slotId,        // Current slot ID  
  isVisible = true 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    layout: true,
    appearance: true,
    size: true
  });

  const [elementProperties, setElementProperties] = useState({
    width: '',
    height: '',
    className: '',
    styles: {}
  });

  // Update properties when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setElementProperties({
        width: selectedElement.offsetWidth || '',
        height: selectedElement.offsetHeight || '',
        className: selectedElement.className || '',
        styles: selectedElement.style ? Object.fromEntries(
          Object.entries(selectedElement.style).filter(([key, value]) => 
            value && !key.startsWith('webkit') && !key.startsWith('moz')
          )
        ) : {}
      });
    }
  }, [selectedElement]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handlePropertyChange = useCallback((property, value) => {
    if (!selectedElement || !onClassChange || !slotId) return;

    const currentClassName = elementProperties.className;
    let newClassName = currentClassName;
    let newStyles = { ...elementProperties.styles };

    switch (property) {
      case 'width':
        if (value) {
          selectedElement.style.width = `${value}px`;
        }
        break;
      case 'height':
        if (value) {
          selectedElement.style.height = `${value}px`;
        }
        break;
      case 'fontSize':
        newClassName = handleFontSizeChange(currentClassName, value);
        break;
      case 'fontWeight':
        if (value === 'bold') {
          newClassName = handleBoldToggle(currentClassName);
        }
        break;
      case 'fontStyle':
        if (value === 'italic') {
          newClassName = handleItalicToggle(currentClassName);
        }
        break;
      case 'textAlign':
        newClassName = handleAlignmentChange(currentClassName, value, false);
        break;
      case 'color':
        newStyles.color = value;
        break;
      case 'backgroundColor':
        newStyles.backgroundColor = value;
        break;
      default:
        return;
    }

    // Update element classes and styles
    if (newClassName !== currentClassName) {
      selectedElement.className = newClassName;
      onClassChange(slotId, newClassName);
    }

    // Update element styles
    Object.assign(selectedElement.style, newStyles);
    
    setElementProperties(prev => ({
      ...prev,
      className: newClassName,
      styles: newStyles
    }));
  }, [selectedElement, onClassChange, slotId, elementProperties.className, elementProperties.styles]);

  const SectionHeader = ({ title, section, children }) => (
    <div className="border-b border-gray-200">
      <button
        onClick={() => toggleSection(section)}
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

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col editor-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedElement ? 'Element Properties' : 'Design Panel'}
        </h2>
        {selectedElement && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <>
            {/* Element Info */}
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <p className="text-sm text-blue-800 font-medium">
                {selectedElement.tagName?.toLowerCase() || 'element'}
              </p>
              <p className="text-xs text-blue-600">
                {selectedElement.className || 'No classes'}
              </p>
            </div>

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
                    {FONT_SIZES.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
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
                      value={elementProperties.styles.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="text-xs h-7"
                      placeholder="#000000"
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
                      value={elementProperties.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="text-xs h-7"
                      placeholder="transparent"
                    />
                  </div>
                </div>
              </div>
            </SectionHeader>

            {/* Layout Section */}
            <SectionHeader title="Layout" section="layout">
              <div className="space-y-3">
                <div className="text-xs text-gray-500">
                  Layout controls coming soon. Use resize handles for now.
                </div>
              </div>
            </SectionHeader>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Select an element to edit its properties</p>
            <p className="text-xs mt-2">Click on any text, button, or image to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSidebar;