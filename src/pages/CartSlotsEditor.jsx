/**
 * CartSlotsEditorWithMicroSlots.jsx - Enhanced editor with micro-slots
 * Each major slot is broken down into draggable micro-slots
 * Micro-slots can only be moved within their parent container
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import FlashMessage from "@/components/storefront/FlashMessage";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import RecommendedProducts from "@/components/storefront/RecommendedProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, LayoutGrid, AlignJustify, AlignLeft, GripHorizontal, GripVertical as ResizeVertical, Move, HelpCircle } from "lucide-react";
import Editor from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { FontFamily } from '@tiptap/extension-font-family';

// Micro-slot definitions for each major slot
const MICRO_SLOT_DEFINITIONS = {
  emptyCart: {
    id: 'emptyCart',
    name: 'Empty Cart',
    microSlots: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
    gridCols: 12, // Total columns in the grid
    defaultSpans: {
      'emptyCart.icon': { col: 2, row: 1 },
      'emptyCart.title': { col: 10, row: 1 },
      'emptyCart.text': { col: 12, row: 1 },
      'emptyCart.button': { col: 12, row: 1 }
    }
  },
  header: {
    id: 'header',
    name: 'Page Header',
    microSlots: ['header.flashMessage', 'header.title', 'header.cmsBlock'],
    gridCols: 12,
    defaultSpans: {
      'header.flashMessage': { col: 12, row: 1 },
      'header.title': { col: 12, row: 1 },
      'header.cmsBlock': { col: 12, row: 1 }
    }
  },
  cartItem: {
    id: 'cartItem',
    name: 'Cart Item',
    microSlots: ['cartItem.image', 'cartItem.details', 'cartItem.quantity', 'cartItem.price', 'cartItem.remove'],
    gridCols: 12,
    defaultSpans: {
      'cartItem.image': { col: 2, row: 2 },
      'cartItem.details': { col: 4, row: 2 },
      'cartItem.quantity': { col: 3, row: 1 },
      'cartItem.price': { col: 2, row: 1 },
      'cartItem.remove': { col: 1, row: 1 }
    }
  },
  coupon: {
    id: 'coupon',
    name: 'Coupon Section',
    microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied'],
    gridCols: 12,
    defaultSpans: {
      'coupon.title': { col: 12, row: 1 },
      'coupon.input': { col: 8, row: 1 },
      'coupon.button': { col: 4, row: 1 },
      'coupon.applied': { col: 12, row: 1 }
    }
  },
  orderSummary: {
    id: 'orderSummary',
    name: 'Order Summary',
    microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'],
    gridCols: 12,
    defaultSpans: {
      'orderSummary.title': { col: 12, row: 1 },
      'orderSummary.subtotal': { col: 12, row: 1 },
      'orderSummary.discount': { col: 12, row: 1 },
      'orderSummary.tax': { col: 12, row: 1 },
      'orderSummary.total': { col: 12, row: 1 },
      'orderSummary.checkoutButton': { col: 12, row: 1 }
    }
  }
};

// Component code templates for micro-slots
const MICRO_SLOT_TEMPLATES = {
  'emptyCart.icon': `<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />`,
  'emptyCart.title': `<h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>`,
  'emptyCart.text': `<p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>`,
  'emptyCart.button': `<Button onClick={handleContinueShopping}>Continue Shopping</Button>`,
  'header.flashMessage': `<FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />`,
  'header.title': `<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>`,
  'header.cmsBlock': `<CmsBlockRenderer position="cart_above_items" />`,
  'cartItem.image': `<img src={product.images?.[0] || placeholder} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />`,
  'cartItem.details': `<div className="flex-1"><h3 className="text-lg font-semibold">{product.name}</h3><p className="text-gray-600">{price} each</p></div>`,
  'cartItem.quantity': `<div className="flex items-center space-x-3"><Button size="sm" variant="outline"><Minus /></Button><span>{quantity}</span><Button size="sm" variant="outline"><Plus /></Button></div>`,
  'cartItem.price': `<p className="text-xl font-bold">{total}</p>`,
  'cartItem.remove': `<Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>`,
  'coupon.title': `<CardTitle>Apply Coupon</CardTitle>`,
  'coupon.input': `<Input placeholder="Enter coupon code" value={couponCode} onChange={handleCouponChange} />`,
  'coupon.button': `<Button onClick={handleApplyCoupon}><Tag className="w-4 h-4 mr-2" /> Apply</Button>`,
  'coupon.applied': `<div className="bg-green-50 p-3 rounded-lg">Applied: {appliedCoupon.name}</div>`,
  'orderSummary.title': `<CardTitle>Order Summary</CardTitle>`,
  'orderSummary.subtotal': `<div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>`,
  'orderSummary.discount': `<div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{discount}</span></div>`,
  'orderSummary.tax': `<div className="flex justify-between"><span>Tax</span><span>{tax}</span></div>`,
  'orderSummary.total': `<div className="flex justify-between text-lg font-semibold border-t pt-4"><span>Total</span><span>{total}</span></div>`,
  'orderSummary.checkoutButton': `<Button size="lg" className="w-full">Proceed to Checkout</Button>`
};

// Tailwind Style Editor component
function TailwindStyleEditor({ text, className = '', onChange, onClose }) {
  const [tempText, setTempText] = useState(text);
  const [tempClass, setTempClass] = useState(className);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'auto-saving', 'saved'
  const saveTimeoutRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  
  // Autosave effect with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Don't autosave on initial mount
    if (tempText === text && tempClass === className) {
      return;
    }
    
    // Show auto-saving status immediately when user types
    setSaveStatus('auto-saving');
    
    // Set new timeout for autosave (debounce for 800ms)
    saveTimeoutRef.current = setTimeout(() => {
      // Trigger the onChange callback
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
    }, 2000); // Increased from 800ms to 2 seconds
    
    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [tempText, tempClass, onChange, text, className]);
  
  // Color palette with Tailwind mappings
  const colorPalette = [
    // Grayscale
    { hex: '#000000', tailwind: 'black', label: 'Black' },
    { hex: '#374151', tailwind: 'gray-700', label: 'Dark Gray' },
    { hex: '#6B7280', tailwind: 'gray-500', label: 'Gray' },
    { hex: '#D1D5DB', tailwind: 'gray-300', label: 'Light Gray' },
    // Primary colors
    { hex: '#DC2626', tailwind: 'red-600', label: 'Red' },
    { hex: '#EA580C', tailwind: 'orange-600', label: 'Orange' },
    { hex: '#D97706', tailwind: 'amber-600', label: 'Amber' },
    { hex: '#CA8A04', tailwind: 'yellow-600', label: 'Yellow' },
    { hex: '#16A34A', tailwind: 'green-600', label: 'Green' },
    { hex: '#059669', tailwind: 'emerald-600', label: 'Emerald' },
    { hex: '#0891B2', tailwind: 'cyan-600', label: 'Cyan' },
    { hex: '#2563EB', tailwind: 'blue-600', label: 'Blue' },
    { hex: '#4F46E5', tailwind: 'indigo-600', label: 'Indigo' },
    { hex: '#7C3AED', tailwind: 'purple-600', label: 'Purple' },
    { hex: '#C026D3', tailwind: 'fuchsia-600', label: 'Fuchsia' },
    { hex: '#DB2777', tailwind: 'pink-600', label: 'Pink' },
    { hex: '#E11D48', tailwind: 'rose-600', label: 'Rose' },
  ];
  
  const [selectedTextColor, setSelectedTextColor] = useState(null);
  const [selectedBgColor, setSelectedBgColor] = useState(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  
  const fontSizes = [
    { label: 'XS', value: 'text-xs' },
    { label: 'SM', value: 'text-sm' },
    { label: 'Base', value: 'text-base' },
    { label: 'LG', value: 'text-lg' },
    { label: 'XL', value: 'text-xl' },
    { label: '2XL', value: 'text-2xl' },
    { label: '3XL', value: 'text-3xl' },
    { label: '4XL', value: 'text-4xl' },
  ];
  
  const fontWeights = [
    { label: 'Normal', value: 'font-normal' },
    { label: 'Medium', value: 'font-medium' },
    { label: 'Semibold', value: 'font-semibold' },
    { label: 'Bold', value: 'font-bold' },
  ];
  
  const handleClassToggle = (newClass, category) => {
    // Remove other classes from the same category
    let classes = tempClass.split(' ').filter(c => c);
    
    if (category === 'text-color') {
      classes = classes.filter(c => !c.startsWith('text-'));
    } else if (category === 'bg-color') {
      classes = classes.filter(c => !c.startsWith('bg-'));
    } else if (category === 'font-size') {
      classes = classes.filter(c => !['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].includes(c));
    } else if (category === 'font-weight') {
      classes = classes.filter(c => !c.startsWith('font-'));
    }
    
    if (newClass) {
      classes.push(newClass);
    }
    
    setTempClass(classes.join(' '));
  };
  
  // Initialize selected colors from existing classes
  useEffect(() => {
    // Find text color
    const textColorClass = tempClass.split(' ').find(c => c.startsWith('text-') && 
      colorPalette.some(p => c === `text-${p.tailwind}`));
    if (textColorClass) {
      const colorName = textColorClass.replace('text-', '');
      setSelectedTextColor(colorPalette.find(p => p.tailwind === colorName));
    }
    
    // Find bg color
    const bgColorClass = tempClass.split(' ').find(c => c.startsWith('bg-'));
    if (bgColorClass) {
      const colorName = bgColorClass.replace('bg-', '').replace('100', '600');
      setSelectedBgColor(colorPalette.find(p => p.tailwind === colorName));
    }
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Text & Style</h3>
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
                {colorPalette.map(color => (
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
                          let closestColor = colorPalette[0];
                          let minDiff = Infinity;
                          
                          colorPalette.forEach(color => {
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
                {colorPalette.filter((_, i) => i > 3).map(color => {
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
                          let closestColor = colorPalette[3]; // Default to light gray
                          let minDiff = Infinity;
                          
                          colorPalette.slice(4).forEach(color => {
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
              {fontSizes.map(size => (
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
              {fontWeights.map(weight => (
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
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }
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

// Rich Text Editor component (keeping for compatibility)
function RichTextEditor({ content, onSave, onCancel }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('#FFFF00');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      FontFamily,
    ],
    content: content,
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2">
        {/* First Row - Text Formatting */}
        <div className="flex gap-1 mb-2 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('bold') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('italic') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('underline') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('strike') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          
          <div className="border-l mx-1" />
          
          {/* Font Size */}
          <Select 
            value=""
            onValueChange={(value) => {
              editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
            }}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map(size => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Font Family */}
          <Select 
            value=""
            onValueChange={(value) => {
              editor.chain().focus().setFontFamily(value).run();
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="border-l mx-1" />
          
          {/* Text Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
              title="Text Color"
            >
              <span className="w-4 h-4 border border-gray-400 rounded" style={{ backgroundColor: currentColor }}></span>
              <span className="text-xs">A</span>
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 z-10 bg-white border rounded p-2 shadow-lg">
                <div className="grid grid-cols-3 gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setCurrentColor(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                    setCurrentColor(e.target.value);
                  }}
                  className="w-full mt-2"
                />
              </div>
            )}
          </div>
          
          {/* Background Color */}
          <div className="relative">
            <button
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
              className="px-2 py-1 rounded hover:bg-gray-200"
              title="Background Color"
            >
              <span className="w-4 h-4 border border-gray-400 rounded inline-block" style={{ backgroundColor: currentBgColor }}></span>
            </button>
            {showBgColorPicker && (
              <div className="absolute top-8 left-0 z-10 bg-white border rounded p-2 shadow-lg">
                <div className="grid grid-cols-3 gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setCurrentBgColor(color);
                        setShowBgColorPicker(false);
                      }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={currentBgColor}
                  onChange={(e) => {
                    editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
                    setCurrentBgColor(e.target.value);
                  }}
                  className="w-full mt-2"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Second Row - Alignment and Lists */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-2 py-1 rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-2 py-1 rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-2 py-1 rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Align Right"
          >
            ➡
          </button>
          
          <div className="border-l mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Heading 3"
          >
            H3
          </button>
          
          <div className="border-l mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('bulletList') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded ${editor?.isActive('orderedList') ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            title="Numbered List"
          >
            1. List
          </button>
          
          <div className="border-l mx-1" />
          
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="px-2 py-1 rounded hover:bg-gray-200"
            title="Undo"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="px-2 py-1 rounded hover:bg-gray-200"
            title="Redo"
          >
            ↷
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="p-3 min-h-[150px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none"
      />
      
      {/* Footer with Save/Cancel */}
      <div className="bg-gray-50 border-t p-2 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(editor.getHTML())}>
          Save
        </Button>
      </div>
    </div>
  );
}

// Simplified Inline Edit with Tailwind styles
function SimpleInlineEdit({ text, className = '', onChange, slotId, onClassChange }) {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <>
      <div 
        onClick={() => setShowEditor(true)}
        className={`cursor-pointer hover:ring-2 hover:ring-blue-300 px-1 rounded ${className}`}
        title="Click to edit text and style"
      >
        {text || <span className="text-gray-400">Click to edit...</span>}
      </div>
      
      {showEditor && (
        <TailwindStyleEditor
          text={text}
          className={className}
          onChange={(newText, newClass) => {
            onChange(newText);
            if (onClassChange) {
              onClassChange(slotId, newClass);
            }
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}

// Inline editable text component (keeping for backward compatibility)
function InlineEdit({ value, onChange, className = "", tag: Tag = 'span', multiline = false, richText = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && !richText) {
      inputRef.current.focus();
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [isEditing, richText]);

  const handleSave = (newValue) => {
    onChange(newValue || tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave(tempValue);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    if (richText) {
      return (
        <RichTextEditor
          content={tempValue}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => handleSave(tempValue)}
          onKeyDown={handleKeyDown}
          className={`${className} w-full min-h-[60px] p-1 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => handleSave(tempValue)}
        onKeyDown={handleKeyDown}
        className={`${className} w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    );
  }

  // For rich text, render HTML content
  if (richText && value && value.includes('<')) {
    return (
      <Tag
        onClick={() => setIsEditing(true)}
        className={`${className} cursor-text hover:bg-gray-100 px-1 rounded transition-colors`}
        title="Click to edit"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <Tag
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text hover:bg-gray-100 px-1 rounded transition-colors`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400">Click to edit...</span>}
    </Tag>
  );
}

// Micro-slot wrapper component  
function MicroSlot({ id, children, onEdit, isDraggable = true, colSpan = 1, rowSpan = 1, onSpanChange, isEditable = false, onContentChange }) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const slotRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable || isResizing });

  // Calculate grid span classes
  const getGridSpanClass = () => {
    // Use explicit Tailwind classes for column spans
    const colClasses = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12'
    };
    
    const rowClasses = {
      1: '',
      2: 'row-span-2',
      3: 'row-span-3',
      4: 'row-span-4'
    };
    
    const colClass = colClasses[Math.min(12, Math.max(1, colSpan))] || 'col-span-12';
    const rowClass = rowClasses[Math.min(4, Math.max(1, rowSpan))] || '';
    return `${colClass} ${rowClass}`;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isResizing ? 'nwse-resize' : 'auto',
  };

  // Handle resize start
  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      colSpan,
      rowSpan,
      direction
    });
  }, [colSpan, rowSpan]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !resizeStart) return;

    const handleMouseMove = (e) => {
      const gridCellWidth = slotRef.current ? slotRef.current.offsetWidth / colSpan : 50;
      const gridCellHeight = slotRef.current ? slotRef.current.offsetHeight / rowSpan : 50;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const colDelta = Math.round(deltaX / gridCellWidth);
      const rowDelta = Math.round(deltaY / gridCellHeight);
      
      let newColSpan = resizeStart.colSpan;
      let newRowSpan = resizeStart.rowSpan;
      
      if (resizeStart.direction.includes('right')) {
        newColSpan = Math.min(12, Math.max(1, resizeStart.colSpan + colDelta));
      }
      if (resizeStart.direction.includes('bottom')) {
        newRowSpan = Math.min(4, Math.max(1, resizeStart.rowSpan + rowDelta));
      }
      
      if (newColSpan !== colSpan || newRowSpan !== rowSpan) {
        onSpanChange(id, { col: newColSpan, row: newRowSpan });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, colSpan, rowSpan, id, onSpanChange]);

  // Handle mouse enter with a slight delay to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);
  
  // Handle mouse leave with a small delay to prevent premature hiding
  const handleMouseLeave = useCallback((e) => {
    // Check if we're still within the component or its children
    const relatedTarget = e.relatedTarget;
    if (slotRef.current && slotRef.current.contains(relatedTarget)) {
      return; // Don't hide if we're still inside the component
    }
    
    // Add a small delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        slotRef.current = el;
      }}
      style={style}
      className={`relative ${getGridSpanClass()} ${isDragging ? 'z-50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag handle in top-left */}
      {isDraggable && (isHovered || isDragging) && !isResizing && (
        <div 
          className="absolute left-1 top-1 p-0.5 bg-gray-100/80 rounded z-20 cursor-grab hover:bg-gray-200"
          {...(isDraggable && !isResizing ? listeners : {})}
          {...(isDraggable && !isResizing ? attributes : {})}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
      )}
      
      {/* Edit button in top-right */}
      {onEdit && isHovered && !isDragging && !isResizing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="absolute right-1 top-1 p-1 bg-gray-100/80 rounded transition-opacity z-20 hover:bg-gray-200"
          title="Edit micro-slot"
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Edit className="w-3 h-3 text-gray-600" />
        </button>
      )}
      
      {/* Span controls - hide during drag to avoid conflicts */}
      {onSpanChange && isHovered && !isDragging && !isResizing && (
        <div 
          className="absolute bottom-1 left-1 flex gap-1 transition-opacity z-20 pointer-events-auto"
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <div className="flex items-center bg-white rounded shadow-sm border px-1">
            <span className="text-xs text-gray-500 mr-1">W:</span>
            <input
              type="number"
              min="1"
              max="12"
              value={colSpan}
              onChange={(e) => onSpanChange(id, { col: parseInt(e.target.value) || 1, row: rowSpan })}
              className="w-8 text-xs border-0 focus:ring-0 p-0"
            />
          </div>
          <div className="flex items-center bg-white rounded shadow-sm border px-1">
            <span className="text-xs text-gray-500 mr-1">H:</span>
            <input
              type="number"
              min="1"
              max="4"
              value={rowSpan}
              onChange={(e) => onSpanChange(id, { col: colSpan, row: parseInt(e.target.value) || 1 })}
              className="w-8 text-xs border-0 focus:ring-0 p-0"
            />
          </div>
        </div>
      )}
      
      <div 
        className={`${isDragging ? 'ring-2 ring-blue-400' : isHovered ? 'ring-1 ring-gray-300 bg-gray-50/50' : ''} rounded transition-all relative z-1`}
      >
        {children}
        
        {/* Resize handles - hide during drag */}
        {onSpanChange && !isDragging && isHovered && !isResizing && (
          <>
            {/* Right edge */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-blue-500/20 hover:bg-blue-500/30"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                setIsHovered(true);
              }}
            />
            {/* Bottom edge */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize bg-blue-500/20 hover:bg-blue-500/30"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                setIsHovered(true);
              }}
            />
            {/* Bottom-right corner */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                setIsHovered(true);
              }}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-500 rounded-sm" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sortable wrapper for parent slots
function SortableParentSlot(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ParentSlot 
        {...props} 
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

// Parent slot container with micro-slots
function ParentSlot({ id, name, children, microSlotOrder, onMicroSlotReorder, onEdit, isDraggable = true, gridCols = 12, dragAttributes, dragListeners, isDragging: parentIsDragging }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  
  // Use passed drag props if available (for major slot dragging)
  const isDragging = parentIsDragging || false;
  const attributes = dragAttributes || {};
  const listeners = dragListeners || {};

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleMicroDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Only allow reordering within the same parent
    if (active.id.split('.')[0] === over.id.split('.')[0]) {
      onMicroSlotReorder(id, active.id, over.id);
    }
  };

  // Handle mouse enter with a slight delay to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);
  
  // Handle mouse leave with a small delay to prevent premature hiding
  const handleMouseLeave = useCallback((e) => {
    // Check if we're still within the component or its children
    const relatedTarget = e.relatedTarget;
    if (containerRef.current && containerRef.current.contains(relatedTarget)) {
      return; // Don't hide if we're still inside the component
    }
    
    // Add a small delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag handle in top-left */}
      {isDraggable && (isHovered || isDragging) && (
        <div 
          className="absolute left-2 top-2 p-1 bg-blue-100/80 rounded z-30 cursor-grab hover:bg-blue-200"
          {...(isDraggable ? listeners : {})}
          {...(isDraggable ? attributes : {})}
        >
          <GripVertical className="w-4 h-4 text-blue-400" />
        </div>
      )}
      
      {/* Edit button in top-right */}
      {onEdit && isHovered && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="absolute right-2 top-2 p-1.5 bg-blue-100/90 rounded transition-opacity z-30 hover:bg-blue-200"
          title="Edit section"
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
      )}
      
      {/* Section label */}
      <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
        {name} (12 column grid)
      </div>
      
      {/* Micro-slots container */}
      <div 
        className={`border-2 border-dashed ${isHovered ? 'border-gray-400 bg-gray-50/30' : 'border-gray-300'} rounded-lg p-4 bg-white relative z-1 transition-colors`}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMicroDragEnd}>
          <SortableContext items={microSlotOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {children}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// Main editor component with micro-slots
export default function CartSlotsEditorWithMicroSlots({
  data = {},
  onSave = () => {},
}) {
  // State for major slot order - only show empty cart state
  const [majorSlots, setMajorSlots] = useState(['header', 'emptyCart']);
  
  // State for resizing indicators
  const [isResizingIcon, setIsResizingIcon] = useState(null);
  const [isResizingButton, setIsResizingButton] = useState(null);
  
  // State for micro-slot orders within each parent
  const [microSlotOrders, setMicroSlotOrders] = useState(() => {
    const orders = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      orders[key] = [...def.microSlots];
    });
    return orders;
  });
  
  // State for micro-slot spans
  const [microSlotSpans, setMicroSlotSpans] = useState(() => {
    const spans = {};
    Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
      spans[key] = { ...def.defaultSpans };
    });
    return spans;
  });
  
  // State for component code
  const [componentCode, setComponentCode] = useState({ ...MICRO_SLOT_TEMPLATES });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  const saveStatusTimeoutRef = useRef(null);
  
  // State for inline editable content
  const [textContent, setTextContent] = useState({
    'emptyCart.title': 'Your cart is empty',
    'emptyCart.text': "Looks like you haven't added anything to your cart yet.",
    'emptyCart.button': 'Continue Shopping',
    'header.title': 'My Cart',
  });
  
  // State for Tailwind classes for each element
  const [elementClasses, setElementClasses] = useState({
    'header.title': 'text-3xl font-bold text-gray-900',
    'emptyCart.title': 'text-xl font-semibold',
    'emptyCart.text': 'text-gray-600',
    'emptyCart.button': '',
  });
  
  // State for component sizes
  const [componentSizes, setComponentSizes] = useState({
    'emptyCart.icon': 64, // pixels
    'emptyCart.button': 'default', // 'sm' | 'default' | 'lg'
    'cartItem.image': 80,
  });
  
  // Props from data
  const {
    store = {},
    cartItems = [],
    appliedCoupon = null,
    couponCode = '',
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    currencySymbol = '$',
    settings = {},
    flashMessage = null,
    loading = false,
    storeLoading = false,
    calculateItemTotal = () => 0,
    safeToFixed = (val) => (val || 0).toFixed(2),
    updateQuantity = () => {},
    removeItem = () => {},
    handleCheckout = () => {},
    handleApplyCoupon = () => {},
    handleRemoveCoupon = () => {},
    handleCouponKeyPress = () => {},
    setCouponCode = () => {},
    setFlashMessage = () => {},
    formatDisplayPrice = (value) => `${currencySymbol}${(value || 0).toFixed(2)}`,
    getStoreBaseUrl = (store) => store?.baseUrl || "/",
    getExternalStoreUrl = (slug, path, baseUrl) => `${baseUrl}${slug || ""}${path || ""}`,
  } = data;

  const formatPrice = (value) => typeof value === "number" ? value : parseFloat(value) || 0;

  // Save configuration function
  const saveConfiguration = useCallback(async () => {
    setSaveStatus('saving');
    
    const config = {
      majorSlots,
      microSlotOrders,
      microSlotSpans,
      textContent,
      elementClasses,
      componentSizes,
      componentCode,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage immediately
    localStorage.setItem('cart_slots_layout_config', JSON.stringify(config));
    console.log('💾 Saved to localStorage:', config);
    
    // Try to save to database
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (storeId) {
        // Import apiClient dynamically
        const { default: apiClient } = await import('@/api/client');
        
        // Check if configuration exists
        const queryParams = new URLSearchParams({
          page_name: 'Cart',
          slot_type: 'cart_layout',
          store_id: storeId
        }).toString();
        
        const response = await apiClient.get(`slot-configurations?${queryParams}`);
        
        if (response?.data?.data?.length > 0) {
          // Update existing configuration
          const configId = response.data.data[0].id;
          const updateResponse = await apiClient.put(`slot-configurations/${configId}`, {
            page_name: 'Cart',
            slot_type: 'cart_layout',
            store_id: storeId,
            configuration: config,
            is_active: true
          });
          console.log('✅ Updated in database:', updateResponse);
        } else {
          // Create new configuration
          const createResponse = await apiClient.post('slot-configurations', {
            page_name: 'Cart',
            slot_type: 'cart_layout',
            store_id: storeId,
            configuration: config,
            is_active: true
          });
          console.log('✅ Created in database:', createResponse);
        }
      }
      
      // Call the parent onSave callback
      onSave(config);
      
      // Show saved status
      setSaveStatus('saved');
      
      // Clear status after 2 seconds
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Failed to save configuration to database:', error);
      // Still show saved status since localStorage succeeded
      setSaveStatus('saved');
      
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);
      
      return true;
    }
  }, [majorSlots, microSlotOrders, microSlotSpans, textContent, elementClasses, componentSizes, componentCode, onSave]);
  
  // Load saved configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // First try to load from localStorage
        const localConfig = localStorage.getItem('cart_slots_layout_config');
        if (localConfig) {
          const config = JSON.parse(localConfig);
          console.log('Loading saved configuration from localStorage:', config);
          console.log('📐 Loaded microSlotSpans:', config.microSlotSpans);
          
          // Only load header and emptyCart slots
          if (config.majorSlots) {
            const requiredSlots = ['header', 'emptyCart'];
            const savedSlots = config.majorSlots.filter(slot => requiredSlots.includes(slot));
            // Ensure both required slots are present
            const missingSlots = requiredSlots.filter(slot => !savedSlots.includes(slot));
            const allSlots = [...savedSlots, ...missingSlots];
            setMajorSlots(allSlots);
          }
          if (config.microSlotOrders) setMicroSlotOrders(config.microSlotOrders);
          if (config.microSlotSpans) setMicroSlotSpans(config.microSlotSpans);
          if (config.textContent) setTextContent(prev => ({ ...prev, ...config.textContent }));
          if (config.elementClasses) setElementClasses(prev => ({ ...prev, ...config.elementClasses }));
          if (config.componentSizes) setComponentSizes(prev => ({ ...prev, ...config.componentSizes }));
          if (config.componentCode) setComponentCode(prev => ({ ...prev, ...config.componentCode }));
        }
        
        // Try to load from database if we have a store ID
        const storeId = localStorage.getItem('selectedStoreId');
        if (storeId) {
          const queryParams = new URLSearchParams({
            page_name: 'Cart',
            slot_type: 'cart_layout',
            store_id: storeId
          }).toString();
          
          // Import apiClient dynamically to avoid circular dependencies
          const { default: apiClient } = await import('@/api/client');
          const response = await apiClient.get(`slot-configurations?${queryParams}`);
          
          if (response?.data?.data?.length > 0) {
            const dbConfig = response.data.data[0].configuration;
            console.log('Loading saved configuration from database:', dbConfig);
            
            // Only load header and emptyCart slots
            if (dbConfig.majorSlots) {
              const requiredSlots = ['header', 'emptyCart'];
              const savedSlots = dbConfig.majorSlots.filter(slot => requiredSlots.includes(slot));
              // Ensure both required slots are present
              const missingSlots = requiredSlots.filter(slot => !savedSlots.includes(slot));
              const allSlots = [...savedSlots, ...missingSlots];
              setMajorSlots(allSlots);
            }
            if (dbConfig.microSlotOrders) setMicroSlotOrders(dbConfig.microSlotOrders);
            if (dbConfig.microSlotSpans) setMicroSlotSpans(dbConfig.microSlotSpans);
            if (dbConfig.textContent) setTextContent(prev => ({ ...prev, ...dbConfig.textContent }));
            if (dbConfig.elementClasses) setElementClasses(prev => ({ ...prev, ...dbConfig.elementClasses }));
            if (dbConfig.componentSizes) setComponentSizes(prev => ({ ...prev, ...dbConfig.componentSizes }));
            if (dbConfig.componentCode) setComponentCode(prev => ({ ...prev, ...dbConfig.componentCode }));
            
            // Save to localStorage for faster access
            localStorage.setItem('cart_slots_layout_config', JSON.stringify(dbConfig));
          }
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }
    };
    
    loadConfiguration();
  }, []); // Only run once on mount

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Handle major slot reordering
  const handleMajorDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setMajorSlots((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Auto-save after drag
        setTimeout(() => saveConfiguration(), 2000);
        return newOrder;
      }
      return items;
    });
    setActiveDragSlot(null);
  }, [saveConfiguration]);

  const handleMajorDragStart = useCallback((event) => {
    setActiveDragSlot(event.active.id);
  }, []);

  // Handle micro-slot reordering within a parent
  const handleMicroSlotReorder = useCallback((parentId, activeId, overId) => {
    setMicroSlotOrders(prev => {
      const newOrders = { ...prev };
      const parentOrder = [...(newOrders[parentId] || [])];
      const oldIndex = parentOrder.indexOf(activeId);
      const newIndex = parentOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        newOrders[parentId] = arrayMove(parentOrder, oldIndex, newIndex);
        // Auto-save after micro-slot reorder
        setTimeout(() => saveConfiguration(), 2000);
      }
      
      return newOrders;
    });
  }, [saveConfiguration]);
  
  // Handle span change for a micro-slot
  const handleSpanChange = useCallback((parentId, microSlotId, newSpans) => {
    console.log('📐 Span change:', { parentId, microSlotId, newSpans });
    
    setMicroSlotSpans(prev => {
      const updated = {
        ...prev,
        [parentId]: {
          ...prev[parentId],
          [microSlotId]: newSpans
        }
      };
      console.log('📐 Updated microSlotSpans:', updated);
      return updated;
    });
    
    // Auto-save after resize
    setTimeout(() => saveConfiguration(), 3000);
  }, [saveConfiguration]);
  
  // Handle text content change
  const handleTextChange = useCallback((slotId, newText) => {
    setTextContent(prev => ({
      ...prev,
      [slotId]: newText
    }));
    // Auto-save after text change
    setTimeout(() => saveConfiguration(), 2500);
  }, [saveConfiguration]);
  
  // Handle class change for elements
  const handleClassChange = useCallback((slotId, newClass) => {
    setElementClasses(prev => ({
      ...prev,
      [slotId]: newClass
    }));
    // Auto-save after class change
    setTimeout(() => saveConfiguration(), 2500);
  }, [saveConfiguration]);
  
  // Handle component size change
  const handleSizeChange = useCallback((slotId, newSize) => {
    setComponentSizes(prev => ({
      ...prev,
      [slotId]: newSize
    }));
    // Auto-save after size change
    setTimeout(() => saveConfiguration(), 2500);
  }, [saveConfiguration]);

  // Edit micro-slot
  const handleEditMicroSlot = useCallback((microSlotId) => {
    const code = componentCode[microSlotId] || MICRO_SLOT_TEMPLATES[microSlotId] || '// Micro-slot code';
    setEditingComponent(microSlotId);
    setTempCode(code);
  }, [componentCode]);

  // Save edited code
  const handleSaveCode = useCallback(() => {
    if (editingComponent) {
      setComponentCode(prev => ({
        ...prev,
        [editingComponent]: tempCode
      }));
      onSave({
        componentCode: { ...componentCode, [editingComponent]: tempCode },
        majorSlots,
        microSlotOrders,
        microSlotSpans,
        timestamp: new Date().toISOString()
      });
    }
    setEditingComponent(null);
    setTempCode('');
  }, [editingComponent, tempCode, componentCode, majorSlots, microSlotOrders, onSave]);

  // Render empty cart with micro-slots
  const renderEmptyCart = () => {
    const microSlots = microSlotOrders.emptyCart || MICRO_SLOT_DEFINITIONS.emptyCart.microSlots;
    const spans = microSlotSpans.emptyCart || MICRO_SLOT_DEFINITIONS.emptyCart.defaultSpans;
    
    return (
      <SortableParentSlot
        id="emptyCart"
        name="Empty Cart"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('emptyCart')}
        gridCols={MICRO_SLOT_DEFINITIONS.emptyCart.gridCols}
      >
        {microSlots.map(slotId => {
          const slotSpan = spans[slotId] || { col: 12, row: 1 };
          
          if (slotId === 'emptyCart.icon') {
            const iconSize = componentSizes[slotId] || 64;
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="relative group">
                    <ShoppingCart 
                      className="text-gray-400" 
                      style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                    />
                    {/* Icon resize handle - bottom-right corner */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize transition-opacity ${
                        isResizingIcon === slotId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsResizingIcon(slotId);
                        const startSize = iconSize;
                        const startX = e.clientX;
                        const startY = e.clientY;
                        
                        const handleMouseMove = (e) => {
                          const deltaX = e.clientX - startX;
                          const deltaY = e.clientY - startY;
                          const delta = Math.max(deltaX, deltaY);
                          const newSize = Math.min(128, Math.max(16, startSize + delta));
                          handleSizeChange(slotId, newSize);
                        };
                        
                        const handleMouseUp = () => {
                          setIsResizingIcon(null);
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">Icon: {iconSize}px</div>
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.title') {
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
              >
                <div className="relative">
                  <SimpleInlineEdit
                    text={textContent[slotId]}
                    className={elementClasses[slotId] || 'text-xl font-semibold'}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                  />
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.text') {
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
              >
                <div className="relative">
                  <SimpleInlineEdit
                    text={textContent[slotId]}
                    className={elementClasses[slotId] || 'text-gray-600'}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                  />
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.button') {
            const buttonSize = componentSizes[slotId] || 'default';
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="relative group inline-block">
                    <Button 
                      size={buttonSize}
                      onClick={() => {
                        const baseUrl = getStoreBaseUrl(store);
                        window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                      }}
                    >
                      <InlineEdit
                        value={textContent[slotId]}
                        onChange={(newText) => handleTextChange(slotId, newText)}
                        className="text-white"
                        tag="span"
                      />
                    </Button>
                    {/* Button resize handle - bottom-right corner */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize z-20 transition-opacity ${
                        isResizingButton === slotId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsResizingButton(slotId);
                        const currentSize = buttonSize;
                        const sizes = ['sm', 'default', 'lg'];
                        const startX = e.clientX;
                        const startIndex = sizes.indexOf(currentSize);
                        
                        const handleMouseMove = (e) => {
                          const deltaX = e.clientX - startX;
                          
                          // Change size based on drag distance (every 50px)
                          let newIndex = startIndex;
                          if (deltaX > 50) {
                            newIndex = Math.min(sizes.length - 1, startIndex + Math.floor(deltaX / 50));
                          } else if (deltaX < -50) {
                            newIndex = Math.max(0, startIndex + Math.ceil(deltaX / 50));
                          }
                          
                          const newSize = sizes[newIndex];
                          if (newSize !== componentSizes[slotId]) {
                            handleSizeChange(slotId, newSize);
                          }
                        };
                        
                        const handleMouseUp = () => {
                          setIsResizingButton(null);
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">Button: {buttonSize}</div>
                </div>
              </MicroSlot>
            );
          }
          return null;
        })}
      </SortableParentSlot>
    );
  };

  // Render coupon section placeholder
  const renderCoupon = () => {
    const microSlots = microSlotOrders.coupon || MICRO_SLOT_DEFINITIONS.coupon.microSlots;
    const spans = microSlotSpans.coupon || MICRO_SLOT_DEFINITIONS.coupon.defaultSpans;
    
    return (
      <SortableParentSlot
        id="coupon"
        name="Coupon Section"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('coupon')}
        gridCols={MICRO_SLOT_DEFINITIONS.coupon.gridCols}
      >
        {microSlots.map(slotId => {
          const slotSpan = spans[slotId] || { col: 12, row: 1 };
          return (
            <MicroSlot 
              key={slotId} 
              id={slotId} 
              onEdit={handleEditMicroSlot}
              colSpan={slotSpan.col}
              rowSpan={slotSpan.row}
              onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
            >
              <div className="p-2 bg-gray-100 rounded text-center text-gray-600">
                {slotId}
              </div>
            </MicroSlot>
          );
        })}
      </SortableParentSlot>
    );
  };
  
  // Render order summary placeholder
  const renderOrderSummary = () => {
    const microSlots = microSlotOrders.orderSummary || MICRO_SLOT_DEFINITIONS.orderSummary.microSlots;
    const spans = microSlotSpans.orderSummary || MICRO_SLOT_DEFINITIONS.orderSummary.defaultSpans;
    
    return (
      <SortableParentSlot
        id="orderSummary"
        name="Order Summary"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('orderSummary')}
        gridCols={MICRO_SLOT_DEFINITIONS.orderSummary.gridCols}
      >
        {microSlots.map(slotId => {
          const slotSpan = spans[slotId] || { col: 12, row: 1 };
          return (
            <MicroSlot 
              key={slotId} 
              id={slotId} 
              onEdit={handleEditMicroSlot}
              colSpan={slotSpan.col}
              rowSpan={slotSpan.row}
              onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
            >
              <div className="p-2 bg-gray-100 rounded text-center text-gray-600">
                {slotId}
              </div>
            </MicroSlot>
          );
        })}
      </SortableParentSlot>
    );
  };
  
  // Render recommended products placeholder  
  const renderRecommendedProducts = () => {
    return (
      <SortableParentSlot
        id="recommendedProducts"
        name="Recommended Products"
        microSlotOrder={[]}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('recommendedProducts')}
        gridCols={12}
      >
        <div className="col-span-12 p-8 bg-gray-100 rounded text-center text-gray-600">
          <div className="text-lg font-semibold mb-2">Recommended Products</div>
          <div className="text-sm">Product recommendations will appear here</div>
        </div>
      </SortableParentSlot>
    );
  };
  
  // Render header with micro-slots
  const renderHeader = () => {
    const microSlots = microSlotOrders.header || MICRO_SLOT_DEFINITIONS.header.microSlots;
    const spans = microSlotSpans.header || MICRO_SLOT_DEFINITIONS.header.defaultSpans;
    
    return (
      <SortableParentSlot
        id="header"
        name="Page Header"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('header')}
        gridCols={MICRO_SLOT_DEFINITIONS.header.gridCols}
      >
        {microSlots.map(slotId => {
          const slotSpan = spans[slotId] || { col: 12, row: 1 };
          
          if (slotId === 'header.flashMessage') {
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
              >
                <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
              </MicroSlot>
            );
          }
          if (slotId === 'header.title') {
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
              >
                <div className="relative">
                  <SimpleInlineEdit
                    text={textContent[slotId]}
                    className={elementClasses[slotId] || 'text-3xl font-bold text-gray-900'}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                  />
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'header.cmsBlock') {
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
              >
                <CmsBlockRenderer position="cart_above_items" />
              </MicroSlot>
            );
          }
          return null;
        })}
      </SortableParentSlot>
    );
  };

  // Loading state
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="bg-gray-50 cart-page min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <SeoHeadManager
          title="Empty Cart Editor"
          description="Edit empty cart state layout"
          keywords="cart, editor, empty-state"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleMajorDragStart}
            onDragEnd={handleMajorDragEnd}
          >
            <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
              <div className="space-y-8">
                {majorSlots.map(slotId => {
                  // In editor mode, show all slots regardless of cart state
                  switch (slotId) {
                    case 'header':
                      return renderHeader();
                    case 'emptyCart':
                      return renderEmptyCart();
                    default:
                      return null;
                  }
                })}
              </div>
            </SortableContext>
            
            {/* Drag overlay */}
            <DragOverlay>
              {activeDragSlot ? (
                <div className="bg-white shadow-2xl rounded-lg p-4 opacity-80">
                  <Badge>{activeDragSlot}</Badge>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Monaco Editor Modal for micro-slots */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Edit Micro-Slot: {editingComponent}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={tempCode}
              onChange={(value) => setTempCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingComponent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCode}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}