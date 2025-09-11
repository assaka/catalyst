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

const EditorSidebar = ({ 
  selectedElement, 
  onUpdateElement, 
  onClearSelection,
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
    fontSize: '',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#000000',
    backgroundColor: '#ffffff',
    padding: '',
    margin: ''
  });

  // Update properties when selected element changes
  useEffect(() => {
    if (selectedElement) {
      const computedStyle = window.getComputedStyle(selectedElement);
      setElementProperties({
        width: selectedElement.offsetWidth || '',
        height: selectedElement.offsetHeight || '',
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        fontStyle: computedStyle.fontStyle,
        textAlign: computedStyle.textAlign,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        padding: computedStyle.padding,
        margin: computedStyle.margin
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
    setElementProperties(prev => ({
      ...prev,
      [property]: value
    }));

    if (selectedElement && onUpdateElement) {
      onUpdateElement(selectedElement, property, value);
    }
  }, [selectedElement, onUpdateElement]);

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
                    value={elementProperties.fontSize}
                    onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                    className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="32px">32px</option>
                  </select>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={elementProperties.fontWeight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('fontWeight', 
                      elementProperties.fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                    className="h-7 px-2"
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={elementProperties.fontStyle === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('fontStyle', 
                      elementProperties.fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                    className="h-7 px-2"
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={elementProperties.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'left')}
                    className="h-7 px-2"
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={elementProperties.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePropertyChange('textAlign', 'center')}
                    className="h-7 px-2"
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={elementProperties.textAlign === 'right' ? 'default' : 'outline'}
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
                      value={elementProperties.color}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.color}
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
                      value={elementProperties.backgroundColor}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300"
                    />
                    <Input
                      value={elementProperties.backgroundColor}
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="padding" className="text-xs font-medium">Padding</Label>
                    <Input
                      id="padding"
                      value={elementProperties.padding}
                      onChange={(e) => handlePropertyChange('padding', e.target.value)}
                      className="text-xs h-7 mt-1"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin" className="text-xs font-medium">Margin</Label>
                    <Input
                      id="margin"
                      value={elementProperties.margin}
                      onChange={(e) => handlePropertyChange('margin', e.target.value)}
                      className="text-xs h-7 mt-1"
                      placeholder="0px"
                    />
                  </div>
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