/**
 * WebflowStyleEditor - Advanced visual editing component
 * Provides Webflow/Framer-style visual editing capabilities:
 * - Direct element resizing with handles
 * - Precise positioning and alignment
 * - Real-time style editing
 * - Visual feedback and guides
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WebflowResizer } from '@/components/ui/WebflowResizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignJustify,
  Move,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

const WebflowStyleEditor = ({ 
  slot, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  children,
  mode = 'edit'
}) => {
  const elementRef = useRef(null);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showStylePanel, setShowStylePanel] = useState(false);

  // Current styles from slot
  const currentStyles = slot?.styles?.styles || {};
  const currentClasses = slot?.styles?.className || '';

  // Handle element click for selection
  const handleElementClick = useCallback((e) => {
    if (mode !== 'edit') return;
    e.stopPropagation();
    onSelect(slot.id);
    setShowStylePanel(true);
  }, [mode, slot.id, onSelect]);

  // Handle element drag for positioning
  const handleMouseDown = useCallback((e) => {
    if (mode !== 'edit' || !isSelected) return;
    
    // Don't drag if clicking on resize handles or buttons
    if (e.target.closest('.resize-handle') || e.target.closest('.webflow-controls')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const rect = elementRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);

    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current || !elementRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = moveEvent.clientX - containerRect.left - dragOffset.x;
      const newY = moveEvent.clientY - containerRect.top - dragOffset.y;
      
      // Update position immediately for visual feedback
      elementRef.current.style.position = 'absolute';
      elementRef.current.style.left = `${Math.max(0, newX)}px`;
      elementRef.current.style.top = `${Math.max(0, newY)}px`;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Save the final position
      if (elementRef.current) {
        const finalStyles = {
          ...currentStyles,
          position: 'absolute',
          left: elementRef.current.style.left,
          top: elementRef.current.style.top
        };
        
        onUpdate(slot.id, {
          styles: {
            className: currentClasses,
            styles: finalStyles
          }
        });
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mode, isSelected, dragOffset, currentStyles, currentClasses, slot.id, onUpdate]);

  // Style update handlers
  const updateStyle = useCallback((property, value) => {
    const newStyles = {
      ...currentStyles,
      [property]: value
    };
    
    onUpdate(slot.id, {
      styles: {
        className: currentClasses,
        styles: newStyles
      }
    });
  }, [currentStyles, currentClasses, slot.id, onUpdate]);

  const updateAlignment = useCallback((alignment) => {
    let alignmentStyles = {};
    
    switch (alignment) {
      case 'left':
        alignmentStyles = { textAlign: 'left', justifyContent: 'flex-start' };
        break;
      case 'center':
        alignmentStyles = { textAlign: 'center', justifyContent: 'center' };
        break;
      case 'right':
        alignmentStyles = { textAlign: 'right', justifyContent: 'flex-end' };
        break;
      case 'justify':
        alignmentStyles = { textAlign: 'justify', justifyContent: 'space-between' };
        break;
    }
    
    const newStyles = {
      ...currentStyles,
      ...alignmentStyles
    };
    
    onUpdate(slot.id, {
      styles: {
        className: currentClasses,
        styles: newStyles
      }
    });
  }, [currentStyles, currentClasses, slot.id, onUpdate]);

  // Selection outline styles
  const selectionStyles = isSelected ? {
    outline: '2px solid #3b82f6',
    outlineOffset: '2px'
  } : isHovered ? {
    outline: '1px solid #93c5fd',
    outlineOffset: '1px'
  } : {};

  return (
    <div 
      ref={containerRef}
      className="relative"
      style={{ minHeight: '50px', position: 'relative' }}
    >
      {/* Main Element with Webflow Resizer */}
      <WebflowResizer
        disabled={mode !== 'edit' || !isSelected}
        onResize={(newSize) => {
          updateStyle('width', `${newSize.width}px`);
          updateStyle('height', `${newSize.height}px`);
        }}
        elementType={slot.type}
      >
        <div
          ref={elementRef}
          className={`webflow-element ${currentClasses}`}
          style={{
            ...currentStyles,
            ...selectionStyles,
            cursor: mode === 'edit' ? (isSelected ? 'move' : 'pointer') : 'default',
            transition: isDragging ? 'none' : 'all 0.1s ease'
          }}
          onClick={handleElementClick}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => mode === 'edit' && setIsHovered(true)}
          onMouseLeave={() => mode === 'edit' && setIsHovered(false)}
        >
          {children}
        </div>
      </WebflowResizer>

      {/* Webflow-style Controls (only show when selected) */}
      {mode === 'edit' && isSelected && (
        <>
          {/* Quick Action Bar */}
          <div className="webflow-controls absolute -top-10 left-0 bg-white border rounded-lg shadow-lg p-1 flex items-center gap-1 z-50">
            {/* Alignment Controls */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => updateAlignment('left')}
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => updateAlignment('center')}
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => updateAlignment('right')}
              title="Align Right"
            >
              <AlignRight className="w-3 h-3" />
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            {/* Position Controls */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => updateStyle('position', currentStyles.position === 'absolute' ? 'relative' : 'absolute')}
              title={currentStyles.position === 'absolute' ? 'Make Relative' : 'Make Absolute'}
            >
              <Move className="w-3 h-3" />
            </Button>
            
            {/* Visibility Toggle */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => updateStyle('visibility', currentStyles.visibility === 'hidden' ? 'visible' : 'hidden')}
              title={currentStyles.visibility === 'hidden' ? 'Show' : 'Hide'}
            >
              {currentStyles.visibility === 'hidden' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
              onClick={() => onDelete(slot.id)}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Advanced Style Panel */}
          {showStylePanel && (
            <div className="webflow-style-panel absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-4 w-64 z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Style Panel</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowStylePanel(false)}
                >
                  ×
                </Button>
              </div>
              
              {/* Dimensions */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Dimensions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        size="sm"
                        value={currentStyles.width || ''}
                        onChange={(e) => updateStyle('width', e.target.value)}
                        placeholder="auto"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        size="sm"
                        value={currentStyles.height || ''}
                        onChange={(e) => updateStyle('height', e.target.value)}
                        placeholder="auto"
                      />
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <Label className="text-xs text-gray-600">Position</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        size="sm"
                        value={currentStyles.left || ''}
                        onChange={(e) => updateStyle('left', e.target.value)}
                        placeholder="0px"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        size="sm"
                        value={currentStyles.top || ''}
                        onChange={(e) => updateStyle('top', e.target.value)}
                        placeholder="0px"
                      />
                    </div>
                  </div>
                </div>

                {/* Spacing */}
                <div>
                  <Label className="text-xs text-gray-600">Padding</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      size="sm"
                      value={currentStyles.paddingTop || ''}
                      onChange={(e) => updateStyle('paddingTop', e.target.value)}
                      placeholder="Top"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.paddingBottom || ''}
                      onChange={(e) => updateStyle('paddingBottom', e.target.value)}
                      placeholder="Bottom"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.paddingLeft || ''}
                      onChange={(e) => updateStyle('paddingLeft', e.target.value)}
                      placeholder="Left"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.paddingRight || ''}
                      onChange={(e) => updateStyle('paddingRight', e.target.value)}
                      placeholder="Right"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Margin</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      size="sm"
                      value={currentStyles.marginTop || ''}
                      onChange={(e) => updateStyle('marginTop', e.target.value)}
                      placeholder="Top"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.marginBottom || ''}
                      onChange={(e) => updateStyle('marginBottom', e.target.value)}
                      placeholder="Bottom"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.marginLeft || ''}
                      onChange={(e) => updateStyle('marginLeft', e.target.value)}
                      placeholder="Left"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.marginRight || ''}
                      onChange={(e) => updateStyle('marginRight', e.target.value)}
                      placeholder="Right"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <Label className="text-xs text-gray-600">Colors</Label>
                  <div className="space-y-2 mt-1">
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Input
                        size="sm"
                        type="color"
                        value={currentStyles.backgroundColor || '#ffffff'}
                        onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <Input
                        size="sm"
                        type="color"
                        value={currentStyles.color || '#000000'}
                        onChange={(e) => updateStyle('color', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Border */}
                <div>
                  <Label className="text-xs text-gray-600">Border</Label>
                  <div className="space-y-2 mt-1">
                    <Input
                      size="sm"
                      value={currentStyles.border || ''}
                      onChange={(e) => updateStyle('border', e.target.value)}
                      placeholder="1px solid #ccc"
                    />
                    <Input
                      size="sm"
                      value={currentStyles.borderRadius || ''}
                      onChange={(e) => updateStyle('borderRadius', e.target.value)}
                      placeholder="0px"
                    />
                  </div>
                </div>

                {/* Shadow */}
                <div>
                  <Label className="text-xs text-gray-600">Box Shadow</Label>
                  <Input
                    size="sm"
                    value={currentStyles.boxShadow || ''}
                    onChange={(e) => updateStyle('boxShadow', e.target.value)}
                    placeholder="0 2px 4px rgba(0,0,0,0.1)"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Element Info Badge (shows on hover) */}
      {mode === 'edit' && isHovered && !isSelected && (
        <div className="absolute -top-6 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-40">
          {slot.type} • {slot.metadata?.name || 'Unnamed'}
        </div>
      )}
    </div>
  );
};

export default WebflowStyleEditor;