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
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, LayoutGrid, AlignJustify, AlignLeft, GripHorizontal, GripVertical as ResizeVertical, Move, HelpCircle, PlusCircle, Type, Code2, FileText } from "lucide-react";
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
  
  // Check if text contains HTML
  const hasHtml = text && (text.includes('<') || text.includes('&'));
  
  return (
    <>
      <div 
        onClick={() => {
          // Only open TailwindStyleEditor for plain text
          // For HTML content, user should use the pencil icon
          if (!hasHtml) {
            setShowEditor(true);
          }
        }}
        className={`cursor-pointer hover:ring-2 hover:ring-blue-300 px-1 rounded ${className}`}
        title={hasHtml ? "Use pencil icon to edit HTML content" : "Click to edit text and style"}
        style={hasHtml ? { cursor: 'default' } : {}}
      >
        {hasHtml ? (
          <div dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          text || <span className="text-gray-400">Click to edit...</span>
        )}
      </div>
      
      {showEditor && !hasHtml && (
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
function MicroSlot({ id, children, onEdit, onDelete, isDraggable = true, colSpan = 1, rowSpan = 1, onSpanChange, isEditable = false, onContentChange }) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const slotRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  // Ensure colSpan and rowSpan are valid numbers
  const safeColSpan = typeof colSpan === 'number' && colSpan >= 1 && colSpan <= 12 ? colSpan : 12;
  const safeRowSpan = typeof rowSpan === 'number' && rowSpan >= 1 && rowSpan <= 4 ? rowSpan : 1;
  
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
    
    const colClass = colClasses[Math.min(12, Math.max(1, safeColSpan))] || 'col-span-12';
    const rowClass = rowClasses[Math.min(4, Math.max(1, safeRowSpan))] || '';
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
      colSpan: safeColSpan,
      rowSpan: safeRowSpan,
      direction
    });
  }, [safeColSpan, safeRowSpan]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !resizeStart) return;

    const handleMouseMove = (e) => {
      const gridCellWidth = slotRef.current ? slotRef.current.offsetWidth / safeColSpan : 50;
      const gridCellHeight = slotRef.current ? slotRef.current.offsetHeight / safeRowSpan : 50;
      
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
      
      if (newColSpan !== safeColSpan || newRowSpan !== safeRowSpan) {
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
      style={{
        ...style,
        minHeight: '48px' // Ensure minimum height for better drag handle visibility
      }}
      className={`relative ${getGridSpanClass()} ${isDragging ? 'z-50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag handle in top-left - made more prominent */}
      {isDraggable && (isHovered || isDragging) && !isResizing && (
        <div 
          className="absolute left-1 top-1 p-1 bg-blue-500/90 rounded-md z-20 cursor-grab hover:bg-blue-600 transition-colors shadow-sm"
          {...(isDraggable && !isResizing ? listeners : {})}
          {...(isDraggable && !isResizing ? attributes : {})}
        >
          <GripVertical className="w-4 h-4 text-white" />
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
      
      {/* Delete button for custom slots */}
      {onDelete && isHovered && !isDragging && !isResizing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-8 top-1 p-1 bg-red-100/80 rounded transition-opacity z-20 hover:bg-red-200"
          title="Delete custom slot"
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Trash2 className="w-3 h-3 text-red-600" />
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
              value={safeColSpan}
              onChange={(e) => {
                const newCol = parseInt(e.target.value) || 1;
                onSpanChange(id, { col: newCol, row: safeRowSpan });
              }}
              className="w-8 text-xs border-0 focus:ring-0 p-0"
            />
          </div>
          <div className="flex items-center bg-white rounded shadow-sm border px-1">
            <span className="text-xs text-gray-500 mr-1">H:</span>
            <input
              type="number"
              min="1"
              max="4"
              value={safeRowSpan}
              onChange={(e) => {
                const newRow = parseInt(e.target.value) || 1;
                onSpanChange(id, { col: safeColSpan, row: newRow });
              }}
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
      
      {/* Add new slot button in bottom-right */}
      {isHovered && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.onAddNewSlot) {
              window.onAddNewSlot(id);
            }
          }}
          className="absolute right-2 bottom-2 p-1.5 bg-green-100/90 rounded transition-opacity z-30 hover:bg-green-200 group"
          title="Add new slot"
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Plus className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Section label */}
      <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
        {name}
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
  
  // State for custom slots
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [currentParentSlot, setCurrentParentSlot] = useState(null);
  const [newSlotType, setNewSlotType] = useState('text');
  const [newSlotName, setNewSlotName] = useState('');
  const [customSlots, setCustomSlots] = useState({});
  
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

  // Debounce timer ref for auto-save
  const saveTimerRef = useRef(null);
  
  // Save configuration function
  const saveConfiguration = useCallback(async () => {
    console.log('💾 saveConfiguration called');
    console.log('📋 Current textContent state:', textContent);
    setSaveStatus('saving');
    
    const config = {
      majorSlots,
      microSlotOrders,
      microSlotSpans,
      textContent,
      elementClasses,
      componentSizes,
      componentCode,
      customSlots,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage immediately
    const configString = JSON.stringify(config);
    localStorage.setItem('cart_slots_layout_config', configString);
    console.log('💾 Saved configuration:', config);
    console.log('📝 Saved textContent specifically:', config.textContent);
    console.log('🎨 Saved elementClasses:', config.elementClasses);
    console.log('📏 Saved componentSizes:', config.componentSizes);
    console.log('📐 Saved microSlotSpans:', config.microSlotSpans);
    console.log('📊 Configuration size:', (configString.length / 1024).toFixed(2) + ' KB');
    
    // Try to save to database
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (storeId) {
        // Import apiClient dynamically
        const { default: apiClient } = await import('@/api/client');
        
        // Check if configuration exists
        // Note: The backend filters by page_name and slot_type that are INSIDE the configuration JSON
        const queryParams = new URLSearchParams({
          store_id: storeId
        }).toString();
        
        console.log('🔍 Checking for existing configuration with store_id:', storeId);
        const response = await apiClient.get(`slot-configurations?${queryParams}`);
        
        console.log('🔍 API Response:', response);
        console.log('🔍 Response data:', response?.data);
        console.log('🔍 Found configurations:', response?.data?.length || response?.data?.data?.length);
        
        // Handle both response formats (response.data might be the array directly)
        const configurations = Array.isArray(response?.data) ? response.data : response?.data?.data;
        console.log('🔍 Configurations array:', configurations);
        
        // Find the Cart configuration specifically
        const cartConfig = configurations?.find(cfg => {
          console.log('🔍 Checking config:', cfg);
          console.log('  - page_name:', cfg.configuration?.page_name);
          console.log('  - slot_type:', cfg.configuration?.slot_type);
          return cfg.configuration?.page_name === 'Cart' && 
                 cfg.configuration?.slot_type === 'cart_layout';
        });
        
        console.log('🔍 Cart config found?', !!cartConfig, cartConfig);
        
        if (cartConfig) {
          // Update existing configuration
          const configId = cartConfig.id;
          console.log('📝 Updating existing configuration with ID:', configId);
          const payload = {
            page_name: 'Cart',
            slot_type: 'cart_layout',
            store_id: storeId,
            configuration: config,
            is_active: true
          };
          console.log('📤 Sending UPDATE to database with payload:', payload);
          console.log('📤 Config elementClasses:', config.elementClasses);
          console.log('📤 Config textContent:', config.textContent);
          const updateResponse = await apiClient.put(`slot-configurations/${configId}`, payload);
          console.log('✅ Updated in database:', updateResponse);
          console.log('✅ Response data:', updateResponse?.data);
        } else {
          // Create new configuration
          const payload = {
            page_name: 'Cart',
            slot_type: 'cart_layout',
            store_id: storeId,
            configuration: config,
            is_active: true
          };
          console.log('📤 Sending CREATE to database with payload:', payload);
          console.log('📤 Config elementClasses:', config.elementClasses);
          console.log('📤 Config textContent:', config.textContent);
          const createResponse = await apiClient.post('slot-configurations', payload);
          console.log('✅ Created in database:', createResponse);
          console.log('✅ Response data:', createResponse?.data);
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
      console.error('❌ Failed to save configuration to database:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      // Check if it's a specific error type
      if (error.response?.status === 413) {
        console.error('❌ Payload too large! Configuration size exceeds server limit');
        alert('Configuration is too large to save to database. Try removing some custom slots or content.');
      } else if (error.response?.status === 400) {
        console.error('❌ Bad request:', error.response?.data?.error);
      }
      
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
  }, [majorSlots, microSlotOrders, microSlotSpans, textContent, elementClasses, componentSizes, componentCode, customSlots, onSave]);
  
  // Debounced save function
  const debouncedSave = useCallback(() => {
    console.log('⏱️ Debounced save triggered, will save in 1 second');
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Set a new timer for 1 second
    saveTimerRef.current = setTimeout(() => {
      console.log('⏱️ Debounce timer fired, calling saveConfiguration');
      saveConfiguration();
    }, 1000);
  }, [saveConfiguration]);
  
  // Listen for force save event from GenericSlotEditor
  useEffect(() => {
    const handleForceSave = () => {
      // Clear any pending debounced saves
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Save immediately
      saveConfiguration();
    };
    
    window.addEventListener('force-save-cart-layout', handleForceSave);
    
    return () => {
      window.removeEventListener('force-save-cart-layout', handleForceSave);
    };
  }, [saveConfiguration]);
  
  // Set up window handler for adding new slots
  useEffect(() => {
    window.onAddNewSlot = (parentSlotId) => {
      setCurrentParentSlot(parentSlotId);
      setShowAddSlotDialog(true);
    };
    
    return () => {
      delete window.onAddNewSlot;
    };
  }, []);
  
  // Load saved configuration on mount - ONLY FROM DATABASE
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // ONLY load from database, skip localStorage
        const storeId = localStorage.getItem('selectedStoreId');
        if (!storeId) {
          console.log('No store ID found, using default configuration');
          return;
        }
        
        // Load from database
        const queryParams = new URLSearchParams({
          store_id: storeId
        }).toString();
        
        // Import apiClient dynamically to avoid circular dependencies
        const { default: apiClient } = await import('@/api/client');
        const response = await apiClient.get(`slot-configurations?${queryParams}`);
        
        console.log('📥 Load API Response:', response);
        console.log('📥 Load Response data:', response?.data);
        
        // Handle both response formats (response.data might be the array directly)
        const configurations = Array.isArray(response?.data) ? response.data : response?.data?.data;
        console.log('📥 Load Configurations array:', configurations);
        
        // Find the Cart configuration specifically
        const cartConfig = configurations?.find(cfg => 
          cfg.configuration?.page_name === 'Cart' && 
          cfg.configuration?.slot_type === 'cart_layout'
        );
        
        if (cartConfig) {
          const dbRecord = cartConfig;
          console.log('📦 Full database record:', dbRecord);
          const config = dbRecord.configuration;
          
          if (!config) {
            console.error('⚠️ No configuration found in database record');
            return;
          }
          
          console.log('✅ Loading configuration from DATABASE:', config);
          console.log('📐 Loaded microSlotSpans:', config.microSlotSpans);
          console.log('📝 Loaded textContent:', config.textContent);
          console.log('🎨 Loaded elementClasses:', config.elementClasses);
          console.log('📏 Loaded componentSizes:', config.componentSizes);
          
          // Verify the data types
          console.log('Type check - elementClasses is:', typeof config.elementClasses, config.elementClasses);
          console.log('Type check - textContent is:', typeof config.textContent, config.textContent);
          
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
          if (config.microSlotSpans) {
            // Validate and fix any corrupted span values
            const cleanedSpans = {};
            Object.entries(config.microSlotSpans).forEach(([parentId, slots]) => {
              cleanedSpans[parentId] = {};
              Object.entries(slots).forEach(([slotId, spans]) => {
                cleanedSpans[parentId][slotId] = {
                  col: typeof spans.col === 'number' && spans.col >= 1 && spans.col <= 12 ? spans.col : 12,
                  row: typeof spans.row === 'number' && spans.row >= 1 && spans.row <= 4 ? spans.row : 1
                };
              });
            });
            setMicroSlotSpans(cleanedSpans);
          }
          // Load saved configuration, merging with current state to preserve defaults for unsaved items
          // But use saved values directly (including empty strings) when they exist
          if (config.textContent) {
            setTextContent(prev => ({
              ...prev,  // Keep defaults for any keys not in saved config
              ...config.textContent  // Override with saved values (including empty strings)
            }));
          }
          if (config.elementClasses) {
            setElementClasses(prev => ({
              ...prev,
              ...config.elementClasses
            }));
          }
          if (config.componentSizes) {
            setComponentSizes(prev => ({
              ...prev,
              ...config.componentSizes
            }));
          }
          if (config.componentCode) {
            setComponentCode(prev => ({
              ...prev,
              ...config.componentCode
            }));
          }
          if (config.customSlots) {
            setCustomSlots(config.customSlots);
            
            // Ensure content for custom slots is properly synced
            Object.entries(config.customSlots).forEach(([slotId, slot]) => {
              if (slot.type === 'text') {
                // Always sync custom slot content with textContent
                const savedContent = config.textContent?.[slotId];
                
                // Always ensure textContent has the value
                if (savedContent !== undefined) {
                  // Use saved content
                  setTextContent(prev => ({
                    ...prev,
                    [slotId]: savedContent
                  }));
                  // Update the custom slot with the saved content
                  setCustomSlots(prev => ({
                    ...prev,
                    [slotId]: {
                      ...prev[slotId],
                      content: savedContent
                    }
                  }));
                } else {
                  // Use slot's default content
                  setTextContent(prev => ({
                    ...prev,
                    [slotId]: slot.content || 'Custom text content'
                  }));
                  // Keep custom slot content in sync
                  setCustomSlots(prev => ({
                    ...prev,
                    [slotId]: {
                      ...prev[slotId],
                      content: slot.content || 'Custom text content'
                    }
                  }));
                }
              } else if (slot.type === 'html' || slot.type === 'javascript') {
                // For HTML/JS slots, check both componentCode and textContent (for migration)
                const savedCode = config.componentCode?.[slotId];
                const textContentCode = config.textContent?.[slotId];
                
                // Use componentCode if available, otherwise migrate from textContent if it exists
                const finalCode = savedCode !== undefined ? savedCode : 
                                 (textContentCode !== undefined ? textContentCode : slot.content);
                
                // Update the custom slot with the content
                setCustomSlots(prev => ({
                  ...prev,
                  [slotId]: {
                    ...prev[slotId],
                    content: finalCode
                  }
                }));
                
                // Ensure componentCode has the content
                setComponentCode(prev => ({
                  ...prev,
                  [slotId]: finalCode
                }));
                
                // Clean up textContent if it had HTML/JS content
                if (textContentCode !== undefined && savedCode === undefined) {
                  setTextContent(prev => {
                    const updated = { ...prev };
                    delete updated[slotId];
                    return updated;
                  });
                }
              }
            });
          }
          
          // Cache to localStorage for quick access
          localStorage.setItem('cart_slots_layout_config', JSON.stringify(config));
        } else {
          console.log('No configuration found in database, using defaults');
        }
      } catch (error) {
        console.error('Failed to load configuration from database:', error);
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
        debouncedSave();
        return newOrder;
      }
      return items;
    });
    setActiveDragSlot(null);
  }, [debouncedSave]);

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
        debouncedSave();
      }
      
      return newOrders;
    });
  }, [debouncedSave]);
  
  // Handle span change for a micro-slot
  const handleSpanChange = useCallback((parentId, microSlotId, newSpans) => {
    setMicroSlotSpans(prev => {
      const updated = {
        ...prev,
        [parentId]: {
          ...prev[parentId],
          [microSlotId]: newSpans
        }
      };
      return updated;
    });
    
    // Auto-save after resize
    debouncedSave();
  }, [debouncedSave]);
  
  // Handle text content change
  const handleTextChange = useCallback((slotId, newText) => {
    setTextContent(prev => ({
      ...prev,
      [slotId]: newText
    }));
    // Auto-save after text change
    debouncedSave();
  }, [debouncedSave]);
  
  // Handle class change for elements
  const handleClassChange = useCallback((slotId, newClass) => {
    setElementClasses(prev => ({
      ...prev,
      [slotId]: newClass
    }));
    // Auto-save after class change
    debouncedSave();
  }, [debouncedSave]);
  
  // Handle component size change
  const handleSizeChange = useCallback((slotId, newSize) => {
    setComponentSizes(prev => ({
      ...prev,
      [slotId]: newSize
    }));
    // Auto-save after size change
    debouncedSave();
  }, [debouncedSave]);

  // Edit micro-slot
  const handleEditMicroSlot = useCallback((microSlotId) => {
    // Check if this is a text content slot
    const textSlots = ['emptyCart.title', 'emptyCart.text', 'emptyCart.button', 'header.title'];
    
    if (textSlots.includes(microSlotId) || microSlotId.includes('.custom_')) {
      // For text content slots, edit the text content directly
      const content = textContent[microSlotId] || '';
      setEditingComponent(microSlotId);
      setTempCode(content);
    } else {
      // For component code slots, edit the component code
      const code = componentCode[microSlotId] || MICRO_SLOT_TEMPLATES[microSlotId] || '// Micro-slot code';
      setEditingComponent(microSlotId);
      setTempCode(code);
    }
  }, [componentCode, textContent]);

  // Save edited code
  const handleSaveCode = useCallback(() => {
    if (editingComponent) {
      console.log('🔧 Saving Monaco editor content:', { 
        component: editingComponent, 
        content: tempCode,
        contentLength: tempCode?.length 
      });
      
      // Check if this is a text content slot
      const textSlots = ['emptyCart.title', 'emptyCart.text', 'emptyCart.button', 'header.title'];
      
      // Check if this is a custom slot and its type
      const isCustomSlot = editingComponent.includes('.custom_');
      const customSlot = isCustomSlot ? customSlots[editingComponent] : null;
      
      if (textSlots.includes(editingComponent) || (isCustomSlot && customSlot?.type === 'text')) {
        console.log('📝 Saving as text content to slot:', editingComponent);
        // Save to text content for text slots
        setTextContent(prev => {
          const updated = {
            ...prev,
            [editingComponent]: tempCode
          };
          console.log('📦 Updated textContent state:', updated);
          return updated;
        });
        // Also update custom slot content if it's a custom text slot
        if (isCustomSlot && customSlot?.type === 'text') {
          setCustomSlots(prev => ({
            ...prev,
            [editingComponent]: {
              ...prev[editingComponent],
              content: tempCode
            }
          }));
        }
      } else {
        console.log('💻 Saving as component code to slot:', editingComponent);
        // Save to component code for HTML/JS slots
        setComponentCode(prev => ({
          ...prev,
          [editingComponent]: tempCode
        }));
        // Also update custom slot content if it's a custom HTML/JS slot
        if (isCustomSlot && (customSlot?.type === 'html' || customSlot?.type === 'javascript')) {
          setCustomSlots(prev => ({
            ...prev,
            [editingComponent]: {
              ...prev[editingComponent],
              content: tempCode
            }
          }));
        }
      }
      
      // Auto-save configuration
      debouncedSave();
    }
    setEditingComponent(null);
    setTempCode('');
  }, [editingComponent, tempCode, debouncedSave, customSlots]);
  
  // Handle deleting a custom slot
  const handleDeleteCustomSlot = useCallback((slotId) => {
    // Check if this is a custom slot
    if (!slotId.includes('.custom_')) return;
    
    // Determine the parent slot (e.g., 'header', 'emptyCart')
    const parentSlot = slotId.split('.')[0];
    
    // Remove from micro slot orders
    setMicroSlotOrders(prev => ({
      ...prev,
      [parentSlot]: (prev[parentSlot] || []).filter(id => id !== slotId)
    }));
    
    // Remove from micro slot spans
    setMicroSlotSpans(prev => {
      const updated = { ...prev };
      if (updated[parentSlot]) {
        delete updated[parentSlot][slotId];
      }
      return updated;
    });
    
    // Remove from custom slots
    setCustomSlots(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    
    // Remove from text content
    setTextContent(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    
    // Remove from element classes
    setElementClasses(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    
    // Remove from component code
    setComponentCode(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    
    // Auto-save after delete
    debouncedSave();
  }, [debouncedSave]);
  
  // Handle adding a new custom slot
  const handleAddCustomSlot = useCallback(() => {
    if (!newSlotName.trim()) {
      alert('Please enter a slot name');
      return;
    }
    
    const parentSlot = currentParentSlot || 'emptyCart';
    const slotId = `${parentSlot}.custom_${Date.now()}`;
    const slotLabel = newSlotName.trim();
    
    // Add to micro slot orders
    setMicroSlotOrders(prev => ({
      ...prev,
      [parentSlot]: [...(prev[parentSlot] || []), slotId]
    }));
    
    // Add default span
    setMicroSlotSpans(prev => ({
      ...prev,
      [parentSlot]: {
        ...prev[parentSlot],
        [slotId]: { col: 12, row: 1 }
      }
    }));
    
    // Add custom slot definition
    setCustomSlots(prev => ({
      ...prev,
      [slotId]: {
        type: newSlotType,
        label: slotLabel,
        content: newSlotType === 'text' ? 'Custom text content' : 
                 newSlotType === 'html' ? '<div>Custom HTML</div>' :
                 '// Custom JavaScript\nconsole.log("Custom slot");'
      }
    }));
    
    // Add default content based on type
    if (newSlotType === 'text') {
      setTextContent(prev => ({
        ...prev,
        [slotId]: 'Custom text content'
      }));
      setElementClasses(prev => ({
        ...prev,
        [slotId]: 'text-gray-600'
      }));
    } else if (newSlotType === 'html' || newSlotType === 'javascript') {
      setComponentCode(prev => ({
        ...prev,
        [slotId]: newSlotType === 'html' ? '<div class="custom-html">Custom HTML content</div>' : 
                  '// Custom JavaScript\nconsole.log("Custom slot initialized");'
      }));
    }
    
    // Reset dialog
    setShowAddSlotDialog(false);
    setCurrentParentSlot(null);
    setNewSlotName('');
    setNewSlotType('text');
    
    // Auto-save
    debouncedSave();
  }, [newSlotName, newSlotType, currentParentSlot, debouncedSave]);

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
                <div className="flex justify-center items-center">
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
                <div className="flex justify-center items-center text-center">
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
                </div>
              </MicroSlot>
            );
          }
          
          // Handle custom slots
          if (slotId.startsWith('emptyCart.custom_')) {
            const customSlot = customSlots[slotId];
            if (!customSlot) return null;
            
            if (customSlot.type === 'text') {
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
                  onDelete={() => {
                    if (confirm(`Delete custom slot "${customSlot.label}"?`)) {
                      handleDeleteCustomSlot(slotId);
                    }
                  }}
                >
                  <div className="flex justify-center items-center text-center">
                    <SimpleInlineEdit
                      text={textContent[slotId] !== undefined ? textContent[slotId] : customSlot.content}
                      className={elementClasses[slotId] || 'text-gray-600'}
                      onChange={(newText) => {
                        handleTextChange(slotId, newText);
                        // Also update the custom slot content
                        setCustomSlots(prev => ({
                          ...prev,
                          [slotId]: {
                            ...prev[slotId],
                            content: newText
                          }
                        }));
                      }}
                      slotId={slotId}
                      onClassChange={handleClassChange}
                    />
                  </div>
                </MicroSlot>
              );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={() => {
                    setEditingComponent(slotId);
                    setTempCode(componentCode[slotId] || customSlot.content);
                  }}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
                  onDelete={() => {
                    if (confirm(`Delete custom slot "${customSlot.label}"?`)) {
                      handleDeleteCustomSlot(slotId);
                    }
                  }}
                >
                  <div className="relative">
                    {/* Render HTML content if it's HTML type */}
                    {customSlot.type === 'html' ? (
                      <div 
                        className="min-h-[40px] flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: componentCode[slotId] || customSlot.content }}
                      />
                    ) : (
                      /* For JavaScript, show a placeholder since we can't safely execute it in editor */
                      <div className="p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            JavaScript: {customSlot.label}
                          </span>
                          <Code2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Preview in right panel to see JavaScript execution
                        </div>
                      </div>
                    )}
                    
                    {/* Edit button overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComponent(slotId);
                        setTempCode(componentCode[slotId] || customSlot.content);
                      }}
                      className="absolute top-1 right-1 px-2 py-1 bg-white/90 rounded shadow-sm border text-xs text-blue-600 hover:text-blue-700 hover:bg-white transition-colors"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit {customSlot.type === 'html' ? 'HTML' : 'JS'}
                    </button>
                  </div>
                </MicroSlot>
              );
            }
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
          
          // Handle custom slots for header
          if (slotId.startsWith('header.custom_')) {
            const customSlot = customSlots[slotId];
            if (!customSlot) return null;
            
            if (customSlot.type === 'text') {
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
                  onDelete={() => {
                    if (confirm(`Delete custom slot "${customSlot.label}"?`)) {
                      handleDeleteCustomSlot(slotId);
                    }
                  }}
                >
                  <div className="flex justify-center items-center text-center">
                    <SimpleInlineEdit
                      text={textContent[slotId] !== undefined ? textContent[slotId] : customSlot.content}
                      className={elementClasses[slotId] || 'text-gray-600'}
                      onChange={(newText) => {
                        handleTextChange(slotId, newText);
                        // Also update the custom slot content
                        setCustomSlots(prev => ({
                          ...prev,
                          [slotId]: {
                            ...prev[slotId],
                            content: newText
                          }
                        }));
                      }}
                      slotId={slotId}
                      onClassChange={handleClassChange}
                    />
                  </div>
                </MicroSlot>
              );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
              const content = componentCode[slotId] || customSlot.content || '';
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
                  onDelete={() => {
                    if (confirm(`Delete custom slot "${customSlot.label}"?`)) {
                      handleDeleteCustomSlot(slotId);
                    }
                  }}
                >
                  <div className="relative bg-gray-50 border border-dashed border-gray-300 rounded-md p-3 min-h-[60px]">
                    {customSlot.type === 'html' ? (
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                      <div className="text-xs text-gray-500 font-mono">
                        <Badge variant="secondary" className="mb-2">
                          <Code2 className="w-3 h-3 mr-1" />
                          JavaScript: {customSlot.label}
                        </Badge>
                        <pre className="whitespace-pre-wrap">{content.substring(0, 100)}...</pre>
                      </div>
                    )}
                  </div>
                </MicroSlot>
              );
            }
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Empty Cart Layout Editor</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Reset only the spans to defaults
                  const defaultSpans = {};
                  Object.entries(MICRO_SLOT_DEFINITIONS).forEach(([key, def]) => {
                    defaultSpans[key] = { ...def.defaultSpans };
                  });
                  setMicroSlotSpans(defaultSpans);
                  // Save immediately
                  saveConfiguration();
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Spans Only
              </button>
              <button
                onClick={() => {
                  if (confirm('This will reset all layout configurations to defaults. Are you sure?')) {
                    localStorage.removeItem('cart_slots_layout_config');
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
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
              defaultLanguage={editingComponent && (editingComponent.includes('.title') || editingComponent.includes('.text') || editingComponent.includes('.button') || editingComponent.includes('.custom_')) ? 'html' : 'javascript'}
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
      
      {/* Add New Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New Slot
              {currentParentSlot && MICRO_SLOT_DEFINITIONS[currentParentSlot] && 
                ` to ${MICRO_SLOT_DEFINITIONS[currentParentSlot].name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot Name</label>
              <Input
                placeholder="Enter slot name..."
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNewSlotType('text')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'text' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Type className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Text</div>
                </button>
                <button
                  onClick={() => setNewSlotType('html')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'html' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">HTML</div>
                </button>
                <button
                  onClick={() => setNewSlotType('javascript')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newSlotType === 'javascript' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Code2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">JavaScript</div>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {newSlotType === 'text' && 'Add editable text content with styling options'}
              {newSlotType === 'html' && 'Add custom HTML markup for advanced layouts'}
              {newSlotType === 'javascript' && 'Add dynamic JavaScript for interactive features'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSlotDialog(false);
              setCurrentParentSlot(null);
              setNewSlotName('');
              setNewSlotType('text');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomSlot}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}