import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { COLOR_PALETTE, FONT_SIZES, FONT_WEIGHTS, toggleClass } from './editor-utils';

/**
 * Advanced Tailwind CSS Style Editor
 * Provides UI for editing colors, fonts, and other Tailwind styles
 * Can be used across all page editors (Cart, Category, Product, etc.)
 */
export default function TailwindStyleEditor({ text, className = '', onChange, onClose }) {
  const [tempText, setTempText] = useState(text);
  const [tempClass, setTempClass] = useState(className);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'auto-saving', 'saved'
  const statusTimeoutRef = useRef(null);
  
  // Immediate save effect (debounce removed)
  useEffect(() => {
    // Don't autosave on initial mount
    if (tempText === text && tempClass === className) {
      return;
    }
    
    // Show auto-saving status immediately when user types
    setSaveStatus('auto-saving');
    
    // Trigger onChange immediately (no debounce)
    onChange(tempText, tempClass);
    
    // Show saved status
    setSaveStatus('saved');
    
    // Clear saved status after 2 seconds
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = setTimeout(() => {
      setSaveStatus('');
    }, 2000);
    
    // Cleanup function
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [tempText, tempClass, onChange, text, className]);
  
  const [selectedTextColor, setSelectedTextColor] = useState(null);
  const [selectedBgColor, setSelectedBgColor] = useState(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  
  const handleClassToggle = (newClass, category) => {
    const newClassName = toggleClass(tempClass, newClass, category);
    console.log('🎨 TailwindStyleEditor class toggle:', { category, newClass, newClassName });
    
    // Clear conflicting inline styles when using Tailwind classes
    let stylesToClear = null;
    if (category === 'text-color' && newClass) {
      console.log('🧹 Clearing inline text color for Tailwind class');
      stylesToClear = { color: null };
    } else if (category === 'bg-color' && newClass) {
      console.log('🧹 Clearing inline background color for Tailwind class');
      stylesToClear = { backgroundColor: null };
    }
    
    setTempClass(newClassName);
    
    // If we have styles to clear, trigger onChange immediately to clear them
    if (stylesToClear && onChange) {
      console.log('💨 Immediately clearing conflicting styles:', stylesToClear);
      setTimeout(() => {
        onChange(tempText, newClassName, stylesToClear);
      }, 50);
    }
  };
  
  // Initialize selected colors from existing classes
  useEffect(() => {
    // Find text color
    const textColorClass = tempClass.split(' ').find(c => c.startsWith('text-') && 
      COLOR_PALETTE.some(p => c === `text-${p.tailwind}`));
    if (textColorClass) {
      const colorName = textColorClass.replace('text-', '');
      setSelectedTextColor(COLOR_PALETTE.find(p => p.tailwind === colorName));
    }
    
    // Find bg color
    const bgColorClass = tempClass.split(' ').find(c => c.startsWith('bg-'));
    if (bgColorClass) {
      const colorName = bgColorClass.replace('bg-', '').replace('100', '600');
      setSelectedBgColor(COLOR_PALETTE.find(p => p.tailwind === colorName));
    }
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Advanced Style Editor</h3>
          {saveStatus && (
            <span className={`text-sm px-2 py-1 rounded ${
              saveStatus === 'auto-saving' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {saveStatus === 'auto-saving' ? 'Auto-saving...' : 'Saved'}
            </span>
          )}
        </div>
        
        {/* Text Input with Live Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Text Content</label>
          <input
            type="text"
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            className={`w-full p-3 border rounded-lg ${tempClass}`}
            style={{ transition: 'all 0.2s ease' }}
            placeholder="Enter your text here..."
          />
          <div className="text-xs text-gray-500 mt-1">Live preview with your selected styles</div>
        </div>
        
        {/* Style Options */}
        <div className="space-y-4">
          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Text Color</label>
            <div className="space-y-2">
              {/* Color Grid */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    setSelectedTextColor(null);
                    handleClassToggle('', 'text-color');
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 bg-white relative hover:scale-110 transition-transform"
                  title="Default/Inherit"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-6 bg-red-500 rotate-45 absolute"></div>
                  </div>
                </button>
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setSelectedTextColor(color);
                      handleClassToggle(`text-${color.tailwind}`, 'text-color');
                    }}
                    className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                      selectedTextColor?.hex === color.hex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
                {/* Custom Color Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
                    title="Custom Color"
                  >
                    <span className="text-white text-xs font-bold">+</span>
                  </button>
                  {showTextColorPicker && (
                    <div className="absolute top-10 left-0 z-10 bg-white border rounded-lg shadow-lg p-3">
                      <input
                        type="color"
                        value={customTextColor}
                        onChange={(e) => {
                          setCustomTextColor(e.target.value);
                          // Map to closest Tailwind color
                          const hex = e.target.value.toUpperCase();
                          let closestColor = COLOR_PALETTE[0];
                          let minDiff = Infinity;
                          
                          COLOR_PALETTE.forEach(color => {
                            const diff = Math.abs(parseInt(hex.slice(1), 16) - parseInt(color.hex.slice(1), 16));
                            if (diff < minDiff) {
                              minDiff = diff;
                              closestColor = color;
                            }
                          });
                          
                          setSelectedTextColor(closestColor);
                          handleClassToggle(`text-${closestColor.tailwind}`, 'text-color');
                        }}
                        className="w-full h-10"
                      />
                      <div className="text-xs text-gray-500 mt-2">Pick custom color</div>
                      <button
                        onClick={() => setShowTextColorPicker(false)}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {selectedTextColor && (
                <div className="text-xs text-gray-600">
                  Selected: <span className="font-medium">{selectedTextColor.label}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <div className="space-y-2">
              {/* Color Grid */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    setSelectedBgColor(null);
                    handleClassToggle('', 'bg-color');
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 bg-white relative hover:scale-110 transition-transform"
                  title="None/Transparent"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-6 bg-red-500 rotate-45 absolute"></div>
                  </div>
                </button>
                {/* Light background colors */}
                {COLOR_PALETTE.filter((_, i) => i > 3).map(color => {
                  const bgHex = color.hex.replace(/[0-9a-f]{2}$/i, 'E5'); // Lighten colors for backgrounds
                  const bgClass = `bg-${color.tailwind.replace('600', '100')}`;
                  return (
                    <button
                      key={`bg-${color.hex}`}
                      onClick={() => {
                        setSelectedBgColor(color);
                        handleClassToggle(bgClass, 'bg-color');
                      }}
                      className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                        selectedBgColor?.hex === color.hex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: bgHex }}
                      title={`${color.label} Background`}
                    />
                  );
                })}
                {/* Custom Background Color Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200"
                    title="Custom Background"
                  >
                    <span className="text-gray-700 text-xs font-bold">+</span>
                  </button>
                  {showBgColorPicker && (
                    <div className="absolute top-10 left-0 z-10 bg-white border rounded-lg shadow-lg p-3">
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value);
                          // Map to closest light Tailwind color for background
                          const hex = e.target.value.toUpperCase();
                          let closestColor = COLOR_PALETTE[3]; // Default to light gray
                          let minDiff = Infinity;
                          
                          COLOR_PALETTE.slice(4).forEach(color => {
                            const diff = Math.abs(parseInt(hex.slice(1), 16) - parseInt(color.hex.slice(1), 16));
                            if (diff < minDiff) {
                              minDiff = diff;
                              closestColor = color;
                            }
                          });
                          
                          setSelectedBgColor(closestColor);
                          const bgClass = `bg-${closestColor.tailwind.replace('600', '100')}`;
                          handleClassToggle(bgClass, 'bg-color');
                        }}
                        className="w-full h-10"
                      />
                      <div className="text-xs text-gray-500 mt-2">Pick background</div>
                      <button
                        onClick={() => setShowBgColorPicker(false)}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {selectedBgColor && (
                <div className="text-xs text-gray-600">
                  Selected: <span className="font-medium">{selectedBgColor.label} Background</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium mb-1">Font Size</label>
            <div className="flex gap-2 flex-wrap">
              {FONT_SIZES.map(size => (
                <button
                  key={size.value}
                  onClick={() => handleClassToggle(size.value, 'font-size')}
                  className={`px-3 py-1 rounded border ${tempClass.includes(size.value) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <span className={size.value}>{size.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium mb-1">Font Weight</label>
            <div className="flex gap-2 flex-wrap">
              {FONT_WEIGHTS.map(weight => (
                <button
                  key={weight.value}
                  onClick={() => handleClassToggle(weight.value, 'font-weight')}
                  className={`px-3 py-1 rounded border ${tempClass.includes(weight.value) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <span className={weight.value}>{weight.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Custom Classes Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Custom Tailwind Classes</label>
          <input
            type="text"
            value={tempClass}
            onChange={(e) => setTempClass(e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm"
            placeholder="e.g., text-2xl font-bold text-blue-600"
          />
          <div className="text-xs text-gray-500 mt-1">Advanced: Add custom Tailwind classes</div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => {
            // Clear timeouts when closing
            if (statusTimeoutRef.current) {
              clearTimeout(statusTimeoutRef.current);
            }
            onClose();
          }}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}