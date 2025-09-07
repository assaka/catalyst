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
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, LayoutGrid, AlignJustify, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, PaintBucket, Type as TypeIcon, GripHorizontal, GripVertical as ResizeVertical, Move, HelpCircle, PlusCircle, Type, Code2, FileText, Package } from "lucide-react";
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

// Import micro-slot definitions from new config structure
import { getMicroSlotDefinitions } from '@/components/editor/slot/configs/index';

// Get cart-specific micro-slot definitions
const MICRO_SLOT_DEFINITIONS = getMicroSlotDefinitions('cart') || {
  flashMessage: {
    id: 'flashMessage',
    name: 'Flash Message',
    microSlots: ['flashMessage.content'],
    gridCols: 12,
    defaultSpans: {
      'flashMessage.content': { col: 12, row: 1 }
    }
  },
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
    microSlots: ['header.title'], // Only title, flashMessage moved to its own section
    gridCols: 12,
    defaultSpans: {
      'header.title': { col: 12, row: 1 }
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
    microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied', 'coupon.removeButton'],
    gridCols: 12,
    defaultSpans: {
      'coupon.title': { col: 12, row: 1 },
      'coupon.input': { col: 8, row: 1 },
      'coupon.button': { col: 4, row: 1 },
      'coupon.applied': { col: 9, row: 1 },
      'coupon.removeButton': { col: 3, row: 1 }
    }
  },
  orderSummary: {
    id: 'orderSummary',
    name: 'Order Summary',
    microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'], // Removed CMS blocks - not draggable
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
  'flashMessage.content': `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-yellow-800">Product Removed</h3>
      <p class="text-sm text-yellow-700">Nike Air Max 90 has been removed from your cart.</p>
    </div>
  </div>
</div>`,
  'flashMessage.contentWithProducts': `<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-blue-800">Quantity Updated</h3>
      <p class="text-sm text-blue-700">The quantity for "Wireless Headphones" has been updated to 2.</p>
    </div>
  </div>
</div>`,
  'emptyCart.icon': `<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />`,
  'emptyCart.title': `<h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>`,
  'emptyCart.text': `<p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>`,
  'emptyCart.button': `<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Continue Shopping
</button>`,
  'header.title': `<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>`,
  'cartItem.image': `<img src={product.images?.[0] || placeholder} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />`,
  'cartItem.details': `<div className="flex-1"><h3 className="text-lg font-semibold">{product.name}</h3><p className="text-gray-600">{price} each</p></div>`,
  'cartItem.quantity': `<div className="flex items-center space-x-3"><Button size="sm" variant="outline"><Minus /></Button><span>{quantity}</span><Button size="sm" variant="outline"><Plus /></Button></div>`,
  'cartItem.price': `<p className="text-xl font-bold">{total}</p>`,
  'cartItem.remove': `<Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>`,
  'coupon.title': `<CardTitle>Apply Coupon</CardTitle>`,
  'coupon.input': `<Input placeholder="Enter coupon code" value={couponCode} onChange={handleCouponChange} />`,
  'coupon.button': `<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
  <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
  </svg>
  Apply
</button>`,
  'coupon.removeButton': `<button class="px-3 py-1.5 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors text-sm">
  Remove
</button>`,
  'coupon.applied': `<div className="bg-green-50 p-3 rounded-lg">Applied: {appliedCoupon.name}</div>`,
  'orderSummary.title': `<CardTitle>Order Summary</CardTitle>`,
  'orderSummary.subtotal': `<div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>`,
  'orderSummary.discount': `<div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{discount}</span></div>`,
  'orderSummary.tax': `<div className="flex justify-between"><span>Tax</span><span>{tax}</span></div>`,
  'orderSummary.total': `<div className="flex justify-between text-lg font-semibold border-t pt-4"><span>Total</span><span>{total}</span></div>`,
  'orderSummary.checkoutButton': `<button class="w-full px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
  Proceed to Checkout
</button>`
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
    
    // Set new timeout for autosave (debounce for 500ms)
    saveTimeoutRef.current = setTimeout(() => {
      // Trigger the onChange callback
      console.log('📤 TailwindStyleEditor calling onChange:', { tempText, tempClass });
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
    }, 500); // Fast save for better UX
    
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
      // Only remove text COLOR classes, keep text sizes and utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('text-')) return true;
        
        const parts = cls.split('-');
        // text-red-500 = ['text', 'red', '500'] - remove (color)
        // text-2xl = ['text', '2xl'] - keep (size)
        // text-center = ['text', 'center'] - keep (utility)
        
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          console.log(`  🗑️ Tailwind modal removing color class: ${cls}`);
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          console.log(`  🗑️ Tailwind modal removing special color: ${cls}`);
          return false; // Remove special colors
        }
        console.log(`  ✅ Tailwind modal keeping utility: ${cls}`);
        return true; // Keep everything else
      });
    } else if (category === 'bg-color') {
      // Only remove background COLOR classes, keep bg utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('bg-')) return true;
        
        const parts = cls.split('-');
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          return false; // Remove special colors
        }
        return true; // Keep utilities like bg-cover, bg-gradient-to-r
      });
    } else if (category === 'font-size') {
      classes = classes.filter(c => !['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].includes(c));
    } else if (category === 'font-weight') {
      classes = classes.filter(c => !c.startsWith('font-'));
    }
    
    if (newClass) {
      classes.push(newClass);
    }
    
    const newClassName = classes.join(' ');
    console.log('🎨 Tailwind class toggle:', { category, newClass, newClassName });
    
    // Clear conflicting inline styles when using Tailwind classes
    let stylesToClear = null;
    if (category === 'text-color' && newClass) {
      console.log('🧹 Clearing inline text color for Tailwind class');
      stylesToClear = { color: null }; // This will remove the inline color
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
function SimpleInlineEdit({ text, className = '', onChange, slotId, onClassChange, style = {}, mode = 'edit' }) {
  const [showEditor, setShowEditor] = useState(false);
  
  // Check if text contains HTML
  const hasHtml = text && (text.includes('<') || text.includes('&'));
  
  return (
    <>
      <div 
        {...(mode === 'edit' && !hasHtml ? {
          onClick: () => setShowEditor(true)
        } : {})}
        className={`${mode === 'edit' ? 'cursor-pointer hover:ring-1 hover:ring-gray-300' : ''} px-1 rounded inline-block ${className}`}
        title={mode === 'edit' ? (hasHtml ? "Use pencil icon to edit HTML content" : "Click to edit text and style") : ""}
        style={hasHtml || mode === 'preview' ? { cursor: 'default', ...style } : style}
      >
        {hasHtml ? (
          <div dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          text || (mode === 'edit' ? <span className="text-gray-400">Click to edit...</span> : '')
        )}
      </div>
      
      {showEditor && !hasHtml && mode === 'edit' && (
        <TailwindStyleEditor
          text={text}
          className={className}
          onChange={(newText, newClass, stylesToClear) => {
            console.log('📨 SimpleInlineEdit received onChange:', { slotId, newText, newClass, stylesToClear });
            onChange(newText);
            if (onClassChange) {
              console.log('🔄 Calling onClassChange for:', slotId, newClass, stylesToClear);
              onClassChange(slotId, newClass, stylesToClear);
            } else {
              console.log('⚠️ No onClassChange provided for:', slotId);
            }
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}

// Inline editable text component
function InlineEdit({ value, onChange, className = "", tag: Tag = 'span', multiline = false, richText = false, mode = 'edit' }) {
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
        {...(mode === 'edit' ? { onClick: () => setIsEditing(true) } : {})}
        className={`${className} ${mode === 'edit' ? 'cursor-text hover:bg-gray-100' : ''} px-1 rounded transition-colors`}
        title={mode === 'edit' ? "Click to edit" : ""}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <Tag
      {...(mode === 'edit' ? { onClick: () => setIsEditing(true) } : {})}
      className={`${className} ${mode === 'edit' ? 'cursor-text hover:bg-gray-100' : ''} px-1 rounded transition-colors`}
      title={mode === 'edit' ? "Click to edit" : ""}
    >
      {value || (mode === 'edit' ? <span className="text-gray-400">Click to edit...</span> : '')}
    </Tag>
  );
}

// Micro-slot wrapper component  
function MicroSlot({ id, children, onEdit, onDelete, isDraggable = true, colSpan = 1, rowSpan = 1, onSpanChange, isEditable = false, onContentChange, onClassChange, elementClasses = {}, elementStyles = {}, componentSizes = {}, onSizeChange, microSlotSpans = {}, mode = 'edit' }) {
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
  } = useSortable({ id, disabled: !isDraggable || isResizing || mode === 'preview' });

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
    
    // Add alignment classes based on microSlotSpans
    const parentSlot = id.split('.')[0];
    const alignment = microSlotSpans[parentSlot]?.[id]?.align;
    let alignClass = '';
    
    if (alignment) {
      switch (alignment) {
        case 'left':
          alignClass = 'justify-self-start';
          break;
        case 'center':
          alignClass = 'justify-self-center';
          break;
        case 'right':
          alignClass = 'justify-self-end';
          break;
      }
    }
    
    return `${colClass} ${rowClass} ${alignClass}`;
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

  // Handle mouse enter with a slight delay to prevent flickering - only in edit mode
  const handleMouseEnter = useCallback(() => {
    if (mode === 'preview') return; // Don't show hover states in preview mode
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, [mode]);
  
  // Handle mouse leave with a small delay to prevent premature hiding
  const handleMouseLeave = useCallback((e) => {
    // Check if we're still within the component or its children
    const relatedTarget = e.relatedTarget;
    try {
      if (slotRef.current && relatedTarget && typeof relatedTarget.nodeType === 'number' && slotRef.current.contains(relatedTarget)) {
        return; // Don't hide if we're still inside the component
      }
    } catch (error) {
      // If contains() fails, just continue with the timeout
      console.log('Mouse leave check failed, continuing...', error);
    }
    
    // Add a small delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 800);
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
      className={`relative ${getGridSpanClass()} ${isDragging ? 'z-50 ring-2 ring-gray-400' : isHovered ? 'ring-1 ring-gray-200/70' : ''} rounded transition-all`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag handle in top-left - subtle styling */}
      {isDraggable && (isHovered || isDragging) && !isResizing && (
        <div 
          className="absolute left-1 top-1 p-1 bg-gray-500/70 rounded-md z-20 cursor-grab hover:bg-gray-600/80 transition-colors shadow-sm"
          {...(isDraggable && !isResizing ? listeners : {})}
          {...(isDraggable && !isResizing ? attributes : {})}
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Edit button - positioned to avoid resize corner - only in edit mode */}
      {mode === 'edit' && onEdit && isHovered && !isDragging && !isResizing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="absolute right-10 top-1 p-2 bg-gray-500 rounded-md z-40 hover:bg-gray-600 transition-colors shadow-md pointer-events-auto cursor-pointer"
          title="Edit micro-slot"
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Edit className="w-4 h-4 text-white" />
        </button>
      )}
      
      {/* Delete button for custom slots - only in edit mode */}
      {mode === 'edit' && onDelete && isHovered && !isDragging && !isResizing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Delete button clicked for slot:', id);
            if (onDelete) {
              onDelete();
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="absolute right-20 top-1 p-2 bg-red-500 rounded-md z-40 hover:bg-red-600 transition-colors shadow-md pointer-events-auto cursor-pointer"
          title="Delete custom slot"
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      )}
      
      {/* Text formatting controls - full controls for text slots */}
      {(id.includes('.title') || id.includes('.text') || id.includes('custom_')) && !id.includes('.button') && !id.includes('Button') && isHovered && !isDragging && !isResizing && onClassChange && (
        <div 
          className="absolute -bottom-2 left-0 right-0 translate-y-full flex flex-nowrap gap-1 transition-opacity z-40 pointer-events-auto justify-center bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200 overflow-x-auto mx-auto"
          style={{ maxWidth: 'none', whiteSpace: 'nowrap' }}
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
        >
          {/* Alignment controls */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 flex-shrink-0">
            {(() => {
              const parentSlot = id.split('.')[0];
              const currentAlign = microSlotSpans[parentSlot]?.[id]?.align || 'left';
              console.log('🎯 Alignment debug for', id, '- parentSlot:', parentSlot, 'currentAlign:', currentAlign, 'microSlotSpans:', microSlotSpans[parentSlot]?.[id]);
              console.log('🔍 Full microSlotSpans structure:', microSlotSpans);
              console.log('🔍 Parent slot data:', microSlotSpans[parentSlot]);
              return (
                <>
                  <button
                    onClick={() => {
                      if (onSpanChange) {
                        onSpanChange(id, { 
                          col: colSpan, 
                          row: rowSpan, 
                          align: 'left'
                        });
                      }
                    }}
                    className={`p-1 hover:bg-gray-100 rounded ${currentAlign === 'left' ? 'bg-blue-100' : ''}`}
                    title="Align left"
                  >
                    <AlignLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (onSpanChange) {
                        onSpanChange(id, { 
                          col: colSpan, 
                          row: rowSpan, 
                          align: 'center'
                        });
                      }
                    }}
                    className={`p-1 hover:bg-gray-100 rounded ${currentAlign === 'center' ? 'bg-blue-100' : ''}`}
                    title="Align center"
                  >
                    <AlignCenter className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (onSpanChange) {
                        onSpanChange(id, { 
                          col: colSpan, 
                          row: rowSpan, 
                          align: 'right'
                        });
                      }
                    }}
                    className={`p-1 hover:bg-gray-100 rounded ${currentAlign === 'right' ? 'bg-blue-100' : ''}`}
                    title="Align right"
                  >
                    <AlignRight className="w-4 h-4 text-gray-600" />
                  </button>
                </>
              );
            })()}
          </div>
          
          {/* Font style controls */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 flex-shrink-0">
            <button
              onClick={() => {
                const currentClasses = elementClasses[id] || '';
                const hasBold = currentClasses.includes('font-bold') || currentClasses.includes('font-semibold');
                let newClasses = currentClasses.replace(/font-(bold|semibold|normal)/g, '').trim();
                if (!hasBold) {
                  newClasses += ' font-bold';
                }
                onClassChange(id, newClasses.trim());
              }}
              className={`p-1 hover:bg-gray-100 rounded ${(elementClasses[id] || '').includes('font-bold') || (elementClasses[id] || '').includes('font-semibold') ? 'bg-blue-100' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                const currentClasses = elementClasses[id] || '';
                const hasItalic = currentClasses.includes('italic');
                let newClasses = currentClasses;
                if (hasItalic) {
                  newClasses = newClasses.replace(/italic/g, '').trim();
                } else {
                  newClasses += ' italic';
                }
                onClassChange(id, newClasses.trim());
              }}
              className={`p-1 hover:bg-gray-100 rounded ${(elementClasses[id] || '').includes('italic') ? 'bg-blue-100' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Font size control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 flex-shrink-0">
            <select
              value={
                elementClasses[id]?.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/)?.[1] || 'base'
              }
              onChange={(e) => {
                const currentClasses = elementClasses[id] || '';
                const newClasses = currentClasses
                  .replace(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g, '')
                  .trim() + ` text-${e.target.value}`;
                onClassChange(id, newClasses.trim());
              }}
              className="px-1 py-0.5 text-xs border-0 cursor-pointer focus:outline-none"
              title="Font size"
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


          {/* Background color control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <PaintBucket className="w-3 h-3 text-gray-600 mr-1" />
            <input
              type="color"
              key={`bg-${id}-${elementStyles[id]?.backgroundColor || 'default'}`}
              value={elementStyles[id]?.backgroundColor || '#000000'}
              onChange={(e) => {
                console.log('🎨 BG Color change for', id, 'from', elementStyles[id]?.backgroundColor, 'to', e.target.value);
                const currentClasses = elementClasses[id] || '';
                // Remove bg-{word}-{number} (colors) using smart detection
                const newClasses = currentClasses
                  .split(' ')
                  .filter(cls => {
                    // Check if it's a bg class
                    if (!cls.startsWith('bg-')) return true;
                    
                    const parts = cls.split('-');
                    // bg-red-500 = ['bg', 'red', '500'] - remove (color)
                    // bg-gradient-to-r = ['bg', 'gradient', 'to', 'r'] - keep (gradient)
                    // bg-white = ['bg', 'white'] - remove (special color)
                    
                    if (parts.length === 3 && /^\d+$/.test(parts[2])) {
                      // It's bg-{word}-{number} - this is a color
                      return false;
                    }
                    if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
                      // Special color cases without numbers
                      return false;
                    }
                    // Keep everything else (bg-gradient-to-r, bg-cover, etc.)
                    return true;
                  })
                  .join(' ')
                  .trim();
                // Store the background color as an inline style
                onClassChange(id, newClasses, { backgroundColor: e.target.value });
              }}
              className="w-5 h-5 cursor-pointer border-0"
              title="Background color"
            />
          </div>
          
          {/* Margin Horizontal control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="2" y="6" width="16" height="8" strokeWidth="1" strokeDasharray="2,2"/>
              <path d="M4 10 L7 10 M13 10 L16 10" strokeWidth="1.5"/>
              <polygon points="4,9 4,11 2,10" fill="currentColor"/>
              <polygon points="16,9 16,11 18,10" fill="currentColor"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.marginLeft || elementStyles[id]?.marginRight || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const marginValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  marginLeft: marginValue,
                  marginRight: marginValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    marginLeft: marginValue,
                    marginRight: marginValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Margin Horizontal (px)"
            />
          </div>

          {/* Margin Vertical control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="2" width="8" height="16" strokeWidth="1" strokeDasharray="2,2"/>
              <path d="M10 4 L10 7 M10 13 L10 16" strokeWidth="1.5"/>
              <polygon points="9,4 11,4 10,2" fill="currentColor"/>
              <polygon points="9,16 11,16 10,18" fill="currentColor"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.marginTop || elementStyles[id]?.marginBottom || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const marginValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  marginTop: marginValue,
                  marginBottom: marginValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    marginTop: marginValue,
                    marginBottom: marginValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Margin Vertical (px)"
            />
          </div>

          {/* Padding Horizontal control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="3" y="6" width="14" height="8" strokeWidth="1.5"/>
              <path d="M5 8 L5 12 M15 8 L15 12" strokeWidth="1.5"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.paddingLeft || elementStyles[id]?.paddingRight || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const paddingValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  paddingLeft: paddingValue,
                  paddingRight: paddingValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    paddingLeft: paddingValue,
                    paddingRight: paddingValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Padding Horizontal (px)"
            />
          </div>

          {/* Padding Vertical control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="3" width="8" height="14" strokeWidth="1.5"/>
              <path d="M8 5 L12 5 M8 15 L12 15" strokeWidth="1.5"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.paddingTop || elementStyles[id]?.paddingBottom || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const paddingValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  paddingTop: paddingValue,
                  paddingBottom: paddingValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    paddingTop: paddingValue,
                    paddingBottom: paddingValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Padding Vertical (px)"
            />
          </div>
        </div>
      )}
      
      {/* Button formatting controls - only color and border radius */}
      {(id.includes('.button') || id.includes('Button')) && isHovered && !isDragging && !isResizing && onClassChange && (
        <div 
          className="absolute -bottom-2 left-0 right-0 translate-y-full flex flex-nowrap gap-1 transition-opacity z-40 pointer-events-auto justify-center bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200 overflow-x-auto mx-auto"
          style={{ maxWidth: 'none', whiteSpace: 'nowrap' }}
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
            e.stopPropagation();
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
          onMouseLeave={(e) => {
            if (mode === 'preview') return;
            e.stopPropagation();
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
            }, 1000);
          }}
        >
          {/* Text color control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <Palette className="w-3 h-3 text-gray-600 mr-1" />
            <input
              type="color"
              key={`text-${id}-${elementStyles[id]?.color || 'default'}`}
              value={elementStyles[id]?.color || '#000000'}
              onFocus={(e) => {
                // Keep hover state active when color picker is focused
                setIsHovered(true);
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              }}
              onChange={(e) => {
                // Keep hover state active during changes
                setIsHovered(true);
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                const currentClasses = elementClasses[id] || '';
                // Remove text-{word}-{number} (colors) but keep text-{number}{word} (sizes)
                const newClasses = currentClasses
                  .split(' ')
                  .filter(cls => {
                    // Check if it's a text class
                    if (!cls.startsWith('text-')) return true;
                    
                    const parts = cls.split('-');
                    // text-red-500 = ['text', 'red', '500'] - remove (color)
                    // text-2xl = ['text', '2xl'] - keep (size)
                    // text-black = ['text', 'black'] - remove (special color)
                    
                    if (parts.length === 3 && /^\d+$/.test(parts[2])) {
                      // It's text-{word}-{number} - this is a color
                      console.log(`  Removing color class: ${cls}`);
                      return false;
                    }
                    if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
                      // Special color cases without numbers
                      console.log(`  Removing special color: ${cls}`);
                      return false;
                    }
                    // Keep everything else (text-xl, text-2xl, text-center, etc.)
                    return true;
                  })
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                onClassChange(id, newClasses, { color: e.target.value });
              }}
              className="w-5 h-5 cursor-pointer border-0"
              title="Text color"
              onClick={(e) => {
                e.stopPropagation();
                // Keep hover state active when clicking color picker
                setIsHovered(true);
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              }}
            />
          </div>

          {/* Background color control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <PaintBucket className="w-3 h-3 text-gray-600 mr-1" />
            <input
              type="color"
              key={`btn-bg-${id}-${elementStyles[id]?.backgroundColor || 'default'}`}
              value={elementStyles[id]?.backgroundColor || '#3b82f6'}
              onFocus={(e) => {
                // Keep hover state active when color picker is focused
                setIsHovered(true);
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              }}
              onChange={(e) => {
                // Keep hover state active during changes
                setIsHovered(true);
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                const currentClasses = elementClasses[id] || '';
                const newClasses = currentClasses
                  .replace(/bg-(gray|red|blue|green|yellow|purple|pink|indigo|white|black|transparent)-?([0-9]+)?/g, '')
                  .trim();
                onClassChange(id, newClasses, { backgroundColor: e.target.value });
              }}
              className="w-5 h-5 cursor-pointer border-0"
              title="Background color"
            />
          </div>
          
          {/* Font style controls for buttons */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 flex-shrink-0">
            <button
              onClick={() => {
                const currentClasses = elementClasses[id] || '';
                const hasBold = currentClasses.includes('font-bold') || currentClasses.includes('font-semibold');
                let newClasses = currentClasses.replace(/font-(bold|semibold|normal)/g, '').trim();
                if (!hasBold) {
                  newClasses += ' font-bold';
                }
                onClassChange(id, newClasses.trim());
              }}
              className={`p-1 hover:bg-gray-100 rounded ${(elementClasses[id] || '').includes('font-bold') || (elementClasses[id] || '').includes('font-semibold') ? 'bg-blue-100' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                const currentClasses = elementClasses[id] || '';
                const hasItalic = currentClasses.includes('italic');
                let newClasses = currentClasses;
                if (hasItalic) {
                  newClasses = newClasses.replace(/italic/g, '').trim();
                } else {
                  newClasses += ' italic';
                }
                onClassChange(id, newClasses.trim());
              }}
              className={`p-1 hover:bg-gray-100 rounded ${(elementClasses[id] || '').includes('italic') ? 'bg-blue-100' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Font size control for buttons */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 flex-shrink-0">
            <select
              value={
                elementClasses[id]?.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/)?.[1] || 'base'
              }
              onChange={(e) => {
                const currentClasses = elementClasses[id] || '';
                const newClasses = currentClasses
                  .replace(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g, '')
                  .trim() + ` text-${e.target.value}`;
                onClassChange(id, newClasses.trim());
              }}
              className="px-1 py-0.5 text-xs border-0 cursor-pointer focus:outline-none"
              title="Font size"
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
          
          {/* Margin Horizontal control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="2" y="6" width="16" height="8" strokeWidth="1" strokeDasharray="2,2"/>
              <path d="M4 10 L7 10 M13 10 L16 10" strokeWidth="1.5"/>
              <polygon points="4,9 4,11 2,10" fill="currentColor"/>
              <polygon points="16,9 16,11 18,10" fill="currentColor"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.marginLeft || elementStyles[id]?.marginRight || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const marginValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  marginLeft: marginValue,
                  marginRight: marginValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    marginLeft: marginValue,
                    marginRight: marginValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Margin Horizontal (px)"
            />
          </div>

          {/* Margin Vertical control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="2" width="8" height="16" strokeWidth="1" strokeDasharray="2,2"/>
              <path d="M10 4 L10 7 M10 13 L10 16" strokeWidth="1.5"/>
              <polygon points="9,4 11,4 10,2" fill="currentColor"/>
              <polygon points="9,16 11,16 10,18" fill="currentColor"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.marginTop || elementStyles[id]?.marginBottom || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const marginValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  marginTop: marginValue,
                  marginBottom: marginValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    marginTop: marginValue,
                    marginBottom: marginValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Margin Vertical (px)"
            />
          </div>

          {/* Padding Horizontal control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="3" y="6" width="14" height="8" strokeWidth="1.5"/>
              <path d="M5 8 L5 12 M15 8 L15 12" strokeWidth="1.5"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.paddingLeft || elementStyles[id]?.paddingRight || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const paddingValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  paddingLeft: paddingValue,
                  paddingRight: paddingValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    paddingLeft: paddingValue,
                    paddingRight: paddingValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Padding Horizontal (px)"
            />
          </div>

          {/* Padding Vertical control */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="3" width="8" height="14" strokeWidth="1.5"/>
              <path d="M8 5 L12 5 M8 15 L12 15" strokeWidth="1.5"/>
            </svg>
            <input
              type="number"
              value={parseInt(elementStyles[id]?.paddingTop || elementStyles[id]?.paddingBottom || '0')}
              onChange={(e) => {
                const value = e.target.value;
                const paddingValue = value ? `${value}px` : undefined;
                onClassChange(id, elementClasses[id] || '', { 
                  ...elementStyles[id], 
                  paddingTop: paddingValue,
                  paddingBottom: paddingValue
                });
                const parentSlot = id.split('.')[0];
                if (onSpanChange) {
                  onSpanChange(id, { 
                    col: colSpan, 
                    row: rowSpan, 
                    paddingTop: paddingValue,
                    paddingBottom: paddingValue
                  });
                }
              }}
              className="w-8 text-xs border-0 bg-transparent"
              placeholder="0"
              min="0"
              max="100"
              title="Padding Vertical (px)"
            />
          </div>
          
          {/* Border radius control with icon */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <rect x="3" y="3" width="14" height="14" rx="2" strokeWidth="1.5"/>
            </svg>
            <select
              value={
                elementClasses[id]?.match(/rounded-(none|sm|md|lg|xl|2xl|3xl|full)/)?.[1] || 
                (elementClasses[id]?.includes('rounded') && !elementClasses[id]?.includes('rounded-') ? 'default' : 'md')
              }
              onChange={(e) => {
                const currentClasses = elementClasses[id] || '';
                const newClasses = currentClasses
                  .replace(/rounded-(none|sm|md|lg|xl|2xl|3xl|full)/g, '')
                  .replace(/rounded(?!-)/g, '') // Remove standalone 'rounded'
                  .trim();
                const roundedClass = e.target.value === 'default' ? 'rounded' : `rounded-${e.target.value}`;
                onClassChange(id, newClasses + ' ' + roundedClass);
              }}
              className="text-xs border-0 cursor-pointer focus:outline-none bg-transparent"
              title="Border radius"
            >
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="default">Default</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
              <option value="3xl">3XL</option>
              <option value="full">Full</option>
            </select>
          </div>
          
          {/* Size control for buttons */}
          <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
            <svg className="w-3 h-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h11M4 10h7M4 13h5" />
            </svg>
            <select
              value={componentSizes[id] || 'default'}
              onChange={(e) => {
                if (onSizeChange) {
                  onSizeChange(id, e.target.value);
                }
              }}
              className="text-xs border-0 cursor-pointer focus:outline-none bg-transparent"
              title="Button size"
            >
              <option value="xs">XS</option>
              <option value="sm">S</option>
              <option value="default">M</option>
              <option value="lg">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="relative z-1">
        {children}
        
        {/* Resize icon only - more visible - only in edit mode */}
        {mode === 'edit' && onSpanChange && !isDragging && isHovered && !isResizing && (
          <div
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            onMouseEnter={(e) => {
              if (mode === 'preview') return;
              e.stopPropagation();
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              setIsHovered(true);
            }}
            style={{ zIndex: 35 }}
          >
            {/* Clearer resize icon with diagonal lines */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-300/90 group-hover:bg-gray-400 rounded-tl-md transition-all">
              <svg className="w-full h-full text-white/80" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 20 L20 14" />
                <path d="M17 20 L20 17" />
                <path d="M20 20 L20 20" strokeLinecap="round" />
              </svg>
            </div>
          </div>
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

  // In preview mode, don't apply sortable functionality
  if (props.mode === 'preview') {
    return (
      <div>
        <ParentSlot {...props} />
      </div>
    );
  }

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
function ParentSlot({ id, name, children, microSlotOrder, onMicroSlotReorder, onEdit, isDraggable = true, gridCols = 12, dragAttributes, dragListeners, isDragging: parentIsDragging, mode = 'edit' }) {
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
    if (mode === 'preview') return; // Don't show hover states in preview mode
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, [mode]);
  
  // Handle mouse leave with a small delay to prevent premature hiding
  const handleMouseLeave = useCallback((e) => {
    // Check if we're still within the component or its children
    const relatedTarget = e.relatedTarget;
    
    // Don't hide if user is interacting with color picker
    if (relatedTarget && (
      relatedTarget.type === 'color' || 
      (relatedTarget.closest && relatedTarget.closest('input[type="color"]')) ||
      relatedTarget.className?.includes('color-picker') ||
      relatedTarget.tagName === 'INPUT'
    )) {
      return;
    }
    
    try {
      if (containerRef.current && relatedTarget && typeof relatedTarget.nodeType === 'number' && containerRef.current.contains(relatedTarget)) {
        return; // Don't hide if we're still inside the component
      }
    } catch (error) {
      // If contains() fails, just continue with the timeout
      console.log('Mouse leave check failed, continuing...', error);
    }
    
    // Add a small delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Increased delay for color picker
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
      {/* Drag handle in top-left - only in edit mode */}
      {mode === 'edit' && isDraggable && (isHovered || isDragging) && (
        <div 
          className="absolute left-2 top-2 p-1 bg-blue-100/80 rounded z-30 cursor-grab hover:bg-blue-200"
          {...(isDraggable ? listeners : {})}
          {...(isDraggable ? attributes : {})}
        >
          <GripVertical className="w-4 h-4 text-blue-400" />
        </div>
      )}
      
      {/* Edit button in top-right - only in edit mode */}
      {mode === 'edit' && onEdit && isHovered && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="absolute right-1 top-1 p-1.5 bg-blue-100/90 rounded transition-opacity z-30 hover:bg-blue-200"
          title="Edit section"
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
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
      
      {/* Section label - only in edit mode */}
      {mode === 'edit' && (
        <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
          {name}
        </div>
      )}

      {/* Micro-slots container */}
      <div 
        className={`${mode === 'edit' ? `border-2 border-dashed ${isHovered ? 'border-gray-400 bg-gray-50/30' : 'border-gray-300'}` : 'border-transparent'} rounded-lg p-4 bg-white relative z-1 transition-colors`}
      >
        {mode === 'edit' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMicroDragEnd}>
            <SortableContext items={microSlotOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {children}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-12 gap-2 auto-rows-min">
            {children}
          </div>
        )}
      </div>

      {/* Add new slot button at bottom center, overlapping border - only in edit mode */}
      {mode === 'edit' && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.onAddNewSlot) {
              window.onAddNewSlot(id);
            }
          }}
          className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 p-1.5 bg-green-100/90 rounded transition-opacity z-30 hover:bg-green-200 group"
          title="Add new slot"
          onMouseEnter={(e) => {
            if (mode === 'preview') return;
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
    </div>
  );
}

// Main editor component with micro-slots
export default function CartSlotsEditorWithMicroSlots({
  data,
  onSave = () => {},
  mode = 'edit', // 'edit' or 'preview'
  viewMode: propViewMode, // 'empty' or 'withProducts' - when passed from parent
}) {
  // Ensure data is always an object
  const safeData = data || {};
  // Get selected store from context
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  
  // Debug store context
  useEffect(() => {
    console.log('🏪 Store context debug:', {
      selectedStore,
      currentStoreId,
      storeId: selectedStore?.id
    });
  }, [selectedStore]);
  
  // State for view mode - 'empty' or 'withProducts'
  const [viewMode, setViewMode] = useState(propViewMode || 'empty');
  
  // State for major slot order - changes based on view mode
  const [majorSlots, setMajorSlots] = useState(['flashMessage', 'header', 'emptyCart']);
  
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
  // Unified content storage - can be plain text, HTML, or component code
  const [slotContent, setSlotContent] = useState({
    // Initialize with templates and text content merged
    ...MICRO_SLOT_TEMPLATES,
    // Text content overrides (these will be plain text initially)
    'emptyCart.title': 'Your cart is empty',
    'emptyCart.text': "Looks like you haven't added anything to your cart yet.",
    'header.title': 'My Cart',
    'coupon.title': 'Apply Coupon',
    'coupon.input.placeholder': 'Enter coupon code',
    'coupon.applied.title': 'Applied: ',
    'coupon.applied.description': '20% off your order',
    'orderSummary.title': 'Order Summary',
    'orderSummary.subtotal.label': 'Subtotal',
    'orderSummary.discount.label': 'Discount',
    'orderSummary.tax.label': 'Tax',
    'orderSummary.total.label': 'Total',
    // Initialize FlashMessage with the empty cart template by default
    'flashMessage.content': MICRO_SLOT_TEMPLATES['flashMessage.content'],
  });
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  const saveStatusTimeoutRef = useRef(null);
  
  // State for custom slots
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  
  // State for reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentParentSlot, setCurrentParentSlot] = useState(null);
  const [newSlotType, setNewSlotType] = useState('text');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotContent, setNewSlotContent] = useState('');
  const [customSlots, setCustomSlots] = useState({});
  const [justAddedCustomSlot, setJustAddedCustomSlot] = useState(false);
  
  // State for delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, slotId: null, slotLabel: '' });
  
  
  // State for Tailwind classes for each element
  const [elementClasses, setElementClasses] = useState({
    'header.title': 'text-3xl font-bold text-gray-900',
    'coupon.title': 'text-lg font-semibold',
    'coupon.applied.title': 'text-sm font-medium text-green-800',
    'coupon.applied.description': 'text-xs text-green-600',
    'orderSummary.title': 'text-lg font-semibold',
    'orderSummary.subtotal.label': '',
    'orderSummary.discount.label': '',
    'orderSummary.tax.label': '',
    'orderSummary.total.label': 'text-lg font-semibold',
    'emptyCart.title': 'text-xl font-semibold',
    'emptyCart.text': 'text-gray-600',
    'emptyCart.button': '',
  });

  // State for inline styles for each element (colors, etc)
  const [elementStyles, setElementStyles] = useState({});
  
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
  } = safeData;

  const formatPrice = (value) => typeof value === "number" ? value : parseFloat(value) || 0;

  // Debounce timer ref for auto-save
  const saveTimerRef = useRef(null);
  
  // Save configuration function
  const saveConfiguration = useCallback(async () => {
    console.log('💾 saveConfiguration called');
    console.log('📋 Current slotContent state:', slotContent);
    setSaveStatus('saving');
    
    const config = {
      page_name: 'Cart',
      page_type: 'cart',
      slot_type: 'cart_layout',
      majorSlots,
      microSlotOrders,
      microSlotSpans,
      slotContent,
      elementClasses,
      elementStyles,
      componentSizes,
      customSlots,
      timestamp: new Date().toISOString()
    };
    
    // Configuration ready for database save
    const configString = JSON.stringify(config);
    console.log('💾 Saved configuration:', config);
    console.log('📝 Saved slotContent specifically:', config.slotContent);
    console.log('🎨 Saved elementClasses:', config.elementClasses);
    console.log('📏 Saved componentSizes:', config.componentSizes);
    console.log('📐 Saved microSlotSpans:', config.microSlotSpans);
    console.log('🔧 Saved customSlots:', config.customSlots);
    console.log('📊 Configuration size:', (configString.length / 1024).toFixed(2) + ' KB');
    
    // Try to save to database using SlotConfiguration entity directly (backend API is down)
    try {
      const storeId = selectedStore?.id;
      console.log('💾 Save attempt - Store ID check:', {
        selectedStore,
        storeId,
        hasStoreId: !!storeId
      });
      
      if (!storeId) {
        console.warn('⚠️ No store ID available, cannot save to database');
        return;
      }
      
      if (storeId) {
        // Import SlotConfiguration entity and API client to check auth status
        const { SlotConfiguration } = await import('@/api/entities');
        const { default: apiClient } = await import('@/api/client');
        
        // Debug authentication
        const token = apiClient.getToken();
        console.log('🔐 Auth token available:', !!token);
        console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'none');
        console.log('🔐 Store owner token in localStorage:', !!localStorage.getItem('store_owner_auth_token'));
        
        console.log('💾 Using UPSERT approach - backend will handle create vs update automatically');
        
        // Always use CREATE (POST) - backend handles upsert logic automatically
        const upsertData = {
          page_name: 'Cart',
          page_type: 'cart', 
          slot_type: 'cart_layout',
          store_id: storeId,
          configuration: config,
          is_active: true
        };
        
        console.log('📤 Sending UPSERT to database:', JSON.stringify(config, null, 2));
        console.log('📤 UPSERT data payload:', upsertData);
        
        try {
          const upsertResponse = await SlotConfiguration.create(upsertData);
          console.log('✅ UPSERT successful:', upsertResponse);
        } catch (upsertError) {
          console.error('❌ UPSERT failed with error:', upsertError);
          console.error('❌ UPSERT error response:', upsertError.response);
          console.error('❌ UPSERT error status:', upsertError.response?.status);
          console.error('❌ UPSERT error data:', upsertError.response?.data);
          throw upsertError;
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
  }, [majorSlots, microSlotOrders, microSlotSpans, slotContent, elementClasses, elementStyles, componentSizes, customSlots, onSave]);
  
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
  
  // Update major slots when view mode changes
  useEffect(() => {
    if (viewMode === 'empty') {
      // Only update if not already in the right mode (preserve custom order)
      setMajorSlots(prev => {
        const requiredSlots = ['flashMessage', 'header', 'emptyCart'];
        const hasAllSlots = requiredSlots.every(slot => prev.includes(slot));
        const hasOnlyTheseSlots = prev.every(slot => requiredSlots.includes(slot));
        
        if (!hasAllSlots || !hasOnlyTheseSlots) {
          // Only reset if slots don't match
          return ['flashMessage', 'header', 'emptyCart'];
        }
        // Keep existing order
        return prev;
      });
      // Update FlashMessage content for empty cart (product removed message)
      setSlotContent(prev => ({
        ...prev,
        'flashMessage.content': MICRO_SLOT_TEMPLATES['flashMessage.content']
      }));
    } else {
      // Show cart with products - include cart items, coupon, and order summary
      setMajorSlots(prev => {
        const requiredSlots = ['flashMessage', 'header', 'cartItem', 'coupon', 'orderSummary'];
        const hasAllSlots = requiredSlots.every(slot => prev.includes(slot));
        const hasOnlyTheseSlots = prev.every(slot => requiredSlots.includes(slot));
        
        if (!hasAllSlots || !hasOnlyTheseSlots) {
          // Only reset if slots don't match
          return ['flashMessage', 'header', 'cartItem', 'coupon', 'orderSummary'];
        }
        // Keep existing order
        return prev;
      });
      // Update FlashMessage content for cart with products (quantity updated message)
      setSlotContent(prev => ({
        ...prev,
        'flashMessage.content': MICRO_SLOT_TEMPLATES['flashMessage.contentWithProducts']
      }));
    }
  }, [viewMode]);
  
  // Debug: Track customSlots changes
  useEffect(() => {
    console.log('🔍 customSlots state changed:', customSlots);
    console.log('🔍 customSlots keys:', Object.keys(customSlots));
  }, [customSlots]);

  // Auto-save when customSlots changes after adding a slot
  useEffect(() => {
    if (justAddedCustomSlot) {
      console.log('🔧 CustomSlot was just added, triggering save with current customSlots:', customSlots);
      setJustAddedCustomSlot(false);
      debouncedSave();
    }
  }, [customSlots, justAddedCustomSlot, debouncedSave]);

  // Auto-save when microSlotOrders changes (for drag-and-drop persistence)
  useEffect(() => {
    // Skip initial load and only save after user interactions
    const isInitialLoad = Object.keys(microSlotOrders).length === 0;
    if (isInitialLoad) {
      console.log('⏭️ Skipping microSlotOrders save - initial load');
      return;
    }
    
    console.log('💾 microSlotOrders changed, triggering save:', microSlotOrders);
    debouncedSave();
  }, [microSlotOrders, debouncedSave]);

  // Load saved configuration on mount - ONLY FROM DATABASE
  useEffect(() => {
    if (!selectedStore?.id) {
      console.log('⏳ Store context not yet loaded, waiting...');
      return;
    }
    
    const loadConfiguration = async () => {
      try {
        // ONLY load from database, skip localStorage
        const storeId = selectedStore?.id;
        console.log('📥 Load attempt - Store ID check:', {
          selectedStore,
          storeId,
          hasStoreId: !!storeId
        });
        
        if (!storeId) {
          console.log('No store ID found, using default configuration');
          return;
        }
        
        // Load from database
        const queryParams = new URLSearchParams({
          store_id: storeId
        }).toString();
        
        // Use public API endpoint for reading (no auth required)
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const endpoint = `${apiBaseUrl}/api/public/slot-configurations?store_id=${storeId}`;
        
        console.log('📥 Loading configurations from public endpoint:', endpoint);
        
        const response = await fetch(endpoint);
        let configurations = [];
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Load Response data:', data);
          
          if (data.success && data.data) {
            configurations = data.data;
          }
        } else {
          console.warn('⚠️ Failed to load from public endpoint:', response.status, response.statusText);
        }
        
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
          console.log('🔄 Loaded microSlotOrders:', config.microSlotOrders);
          console.log('📐 Loaded microSlotSpans:', config.microSlotSpans);
          console.log('📝 Loaded slotContent:', config.slotContent);
          console.log('🎨 Loaded elementClasses:', config.elementClasses);
          console.log('🎨 Loaded elementStyles:', config.elementStyles);
          console.log('📏 Loaded componentSizes:', config.componentSizes);
          console.log('🔧 Loaded customSlots:', config.customSlots);
          console.log('📥 Full configuration loaded:', JSON.stringify(config, null, 2));
          
          // Verify the data types
          console.log('Type check - elementClasses is:', typeof config.elementClasses, config.elementClasses);
          console.log('Type check - slotContent is:', typeof config.slotContent, config.slotContent);
          console.log('Type check - customSlots is:', typeof config.customSlots, config.customSlots);
          
          // Load saved majorSlots order
          if (config.majorSlots) {
            setMajorSlots(config.majorSlots);
          }
          if (config.microSlotOrders) {
            console.log('📥 Setting microSlotOrders from database:', config.microSlotOrders);
            setMicroSlotOrders(config.microSlotOrders);
          }
          if (config.microSlotSpans) {
            // Validate and fix any corrupted span values
            const cleanedSpans = {};
            Object.entries(config.microSlotSpans).forEach(([parentId, slots]) => {
              cleanedSpans[parentId] = {};
              Object.entries(slots).forEach(([slotId, spans]) => {
                cleanedSpans[parentId][slotId] = {
                  col: typeof spans.col === 'number' && spans.col >= 1 && spans.col <= 12 ? spans.col : 12,
                  row: typeof spans.row === 'number' && spans.row >= 1 && spans.row <= 4 ? spans.row : 1,
                  // Preserve alignment setting
                  ...(spans.align && { align: spans.align })
                };
              });
            });
            setMicroSlotSpans(cleanedSpans);
          }
          // Load saved configuration, merging with current state to preserve defaults for unsaved items
          // But use saved values directly (including empty strings) when they exist
          if (config.slotContent) {
            setSlotContent(prev => ({
              ...prev,  // Keep defaults for any keys not in saved config
              ...config.slotContent  // Override with saved values (including empty strings)
            }));
          }
          if (config.elementClasses) {
            setElementClasses(prev => ({
              ...prev,
              ...config.elementClasses
            }));
          }
          if (config.elementStyles) {
            setElementStyles(prev => ({
              ...prev,
              ...config.elementStyles
            }));
          }
          if (config.componentSizes) {
            setComponentSizes(prev => ({
              ...prev,
              ...config.componentSizes
            }));
          }
          if (config.customSlots) {
            setCustomSlots(config.customSlots);
            
            // Ensure content for custom slots is properly synced
            Object.entries(config.customSlots).forEach(([slotId, slot]) => {
              if (slot.type === 'text') {
                // Always sync custom slot content with slotContent
                const savedContent = config.slotContent?.[slotId];
                
                // Always ensure slotContent has the value
                if (savedContent !== undefined) {
                  // Use saved content
                  setSlotContent(prev => ({
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
                  setSlotContent(prev => ({
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
                // For HTML/JS slots, get from slotContent
                const savedCode = config.slotContent?.[slotId];
                const finalCode = savedCode !== undefined ? savedCode : slot.content;
                
                // Update the custom slot with the content
                setCustomSlots(prev => ({
                  ...prev,
                  [slotId]: {
                    ...prev[slotId],
                    content: finalCode
                  }
                }));
                
                // Ensure slotContent has the content
                setSlotContent(prev => ({
                  ...prev,
                  [slotId]: finalCode
                }));
                
                // Clean up slotContent if it had HTML/JS content
                if (slotContentCode !== undefined && savedCode === undefined) {
                  setSlotContent(prev => {
                    const updated = { ...prev };
                    delete updated[slotId];
                    return updated;
                  });
                }
              }
            });
          }
          
          // Configuration loaded from database successfully
        } else {
          console.log('No configuration found in database, using defaults');
        }
      } catch (error) {
        console.error('Failed to load configuration from database:', error);
      }
    };
    
    loadConfiguration();
  }, [selectedStore?.id]); // Re-run when store ID becomes available

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
        console.log('🔄 Micro-slot reordered:', { parentId, from: oldIndex, to: newIndex, newOrder: newOrders[parentId] });
      }
      
      return newOrders;
    });
  }, []);
  
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
    setSlotContent(prev => ({
      ...prev,
      [slotId]: newText
    }));
    // Auto-save after text change
    debouncedSave();
  }, [debouncedSave]);
  
  // Handle class change for elements (now also supports inline styles)
  const handleClassChange = useCallback((slotId, newClass, newStyles = null) => {
    setElementClasses(prev => ({
      ...prev,
      [slotId]: newClass
    }));
    
    // If styles are provided, update them too
    if (newStyles) {
      setElementStyles(prev => {
        const currentStyles = { ...prev[slotId] };
        
        // Handle clearing styles (when value is null)
        Object.keys(newStyles).forEach(styleKey => {
          if (newStyles[styleKey] === null) {
            console.log('🗑️ Removing style:', styleKey, 'from', slotId);
            delete currentStyles[styleKey];
          } else {
            console.log('📝 Setting style:', styleKey, '=', newStyles[styleKey], 'for', slotId);
            currentStyles[styleKey] = newStyles[styleKey];
          }
        });
        
        return {
          ...prev,
          [slotId]: currentStyles
        };
      });
    }
    
    // Auto-save after class change
    debouncedSave();
    
    // Notify storefront of configuration update
    if (selectedStore?.id) {
      setTimeout(() => {
        console.log('🔔 Notifying storefront of configuration update');
        localStorage.setItem('slot_config_updated', JSON.stringify({
          storeId: selectedStore.id,
          timestamp: Date.now(),
          type: 'style_change'
        }));
      }, 100); // Small delay to ensure save completes first
    }
  }, [debouncedSave, selectedStore?.id]);
  
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
  const handleEditMicroSlot = useCallback((slotId) => {
    // Check if this is a parent slot (doesn't contain a dot)
    const isParentSlot = !slotId.includes('.');
    
    if (isParentSlot) {
      // For parent slots, show the configuration JSON
      const parentConfig = {
        id: slotId,
        name: MICRO_SLOT_DEFINITIONS[slotId]?.name || slotId,
        microSlots: microSlotOrders[slotId] || [],
        spans: microSlotSpans[slotId] || {},
        gridCols: MICRO_SLOT_DEFINITIONS[slotId]?.gridCols || 12,
        slots: {}
      };
      
      // Include all slot content for this parent
      const parentSlotPrefix = `${slotId}.`;
      Object.keys(slotContent).forEach(key => {
        if (key.startsWith(parentSlotPrefix)) {
          parentConfig.slots[key] = slotContent[key];
        }
      });
      
      // Convert to formatted JSON
      const jsonContent = JSON.stringify(parentConfig, null, 2);
      setEditingComponent(slotId);
      setTempCode(jsonContent);
    } else {
      // For micro slots, get content from unified slotContent storage
      const content = slotContent[slotId] || MICRO_SLOT_TEMPLATES[slotId] || '';
      setEditingComponent(slotId);
      setTempCode(content);
    }
  }, [slotContent, microSlotOrders, microSlotSpans]);

  // Save edited code
  const handleSaveCode = useCallback(() => {
    if (editingComponent) {
      console.log('🔧 Saving Monaco editor content:', { 
        component: editingComponent, 
        content: tempCode,
        contentLength: tempCode?.length 
      });
      
      // Check if this is a parent slot (doesn't contain a dot)
      const isParentSlot = !editingComponent.includes('.');
      
      if (isParentSlot) {
        try {
          // Parse the JSON configuration
          const parentConfig = JSON.parse(tempCode);
          
          // Update micro slot orders
          if (parentConfig.microSlots) {
            setMicroSlotOrders(prev => ({
              ...prev,
              [editingComponent]: parentConfig.microSlots
            }));
          }
          
          // Update micro slot spans
          if (parentConfig.spans) {
            setMicroSlotSpans(prev => ({
              ...prev,
              [editingComponent]: parentConfig.spans
            }));
          }
          
          // Update slot content for all child slots
          if (parentConfig.slots) {
            setSlotContent(prev => {
              const updated = { ...prev };
              Object.keys(parentConfig.slots).forEach(key => {
                updated[key] = parentConfig.slots[key];
              });
              return updated;
            });
          }
        } catch (error) {
          console.error('Invalid JSON configuration:', error);
          alert('Invalid JSON configuration. Please check your syntax.');
          return;
        }
      } else {
        // For micro slots, save to unified slotContent
        setSlotContent(prev => ({
          ...prev,
          [editingComponent]: tempCode
        }));
        
        // Also update custom slot content if it's a custom slot
        const isCustomSlot = editingComponent.includes('.custom_');
        if (isCustomSlot) {
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
  }, [editingComponent, tempCode, debouncedSave]);
  
  // Handle deleting a custom slot
  const handleDeleteCustomSlot = useCallback((slotId) => {
    console.log('handleDeleteCustomSlot called with:', slotId);
    
    // Check if this is a custom slot
    if (!slotId.includes('.custom_')) {
      console.log('Not a custom slot, returning');
      return;
    }
    
    // Determine the parent slot (e.g., 'header', 'emptyCart')
    const parentSlot = slotId.split('.')[0];
    console.log('Parent slot:', parentSlot);
    
    // Remove from micro slot orders
    setMicroSlotOrders(prev => {
      console.log('Current microSlotOrders:', prev);
      const updated = {
        ...prev,
        [parentSlot]: (prev[parentSlot] || []).filter(id => id !== slotId)
      };
      console.log('Updated microSlotOrders:', updated);
      return updated;
    });
    
    // Remove from micro slot spans
    setMicroSlotSpans(prev => {
      const updated = { ...prev };
      if (updated[parentSlot]) {
        delete updated[parentSlot][slotId];
      }
      console.log('Updated microSlotSpans:', updated);
      return updated;
    });
    
    // Remove from custom slots
    setCustomSlots(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      console.log('Updated customSlots:', updated);
      return updated;
    });
    
    // Remove from text content
    setSlotContent(prev => {
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
    setSlotContent(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    
    console.log('Slot deletion complete, triggering auto-save');
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
    
    // Use the initial content provided by user, or fallback to defaults
    const initialContent = newSlotContent.trim() || 
      (newSlotType === 'text' ? 'Custom text content' : 
       newSlotType === 'html' ? '<div>Custom HTML</div>' :
       '// Custom JavaScript\nconsole.log("Custom slot");');
    
    // Add custom slot definition
    setCustomSlots(prev => ({
      ...prev,
      [slotId]: {
        type: newSlotType,
        label: slotLabel,
        content: initialContent
      }
    }));
    
    // Add default content based on type
    if (newSlotType === 'text') {
      setSlotContent(prev => ({
        ...prev,
        [slotId]: initialContent
      }));
      setElementClasses(prev => ({
        ...prev,
        [slotId]: 'text-gray-600'
      }));
    } else if (newSlotType === 'html' || newSlotType === 'javascript') {
      setSlotContent(prev => ({
        ...prev,
        [slotId]: initialContent
      }));
    }
    
    // Reset dialog
    setShowAddSlotDialog(false);
    setCurrentParentSlot(null);
    setNewSlotName('');
    setNewSlotContent('');
    setNewSlotType('text');
    
    // Mark that we just added a custom slot
    setJustAddedCustomSlot(true);
    
    // Don't auto-save immediately - let the useEffect handle it after state updates
  }, [newSlotName, newSlotContent, newSlotType, currentParentSlot]);

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
        mode={mode}
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
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                microSlotSpans={microSlotSpans}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="relative group">
                    <ShoppingCart 
                      className="text-gray-400" 
                      style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                    />
                    {/* Icon resize handle - bottom-right corner - only in edit mode */}
                    {mode === 'edit' && (
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
                          const newSize = Math.min(256, Math.max(16, startSize + delta));
                          handleSizeChange(slotId, newSize);
                          
                          // Auto-expand slot if icon grows beyond certain thresholds
                          const currentSpan = spans[slotId] || { col: 2, row: 1 };
                          let newColSpan = currentSpan.col;
                          let newRowSpan = currentSpan.row;
                          
                          // Adjust column span based on icon size
                          if (newSize >= 200) {
                            newColSpan = Math.min(12, 6);
                            newRowSpan = Math.min(4, 3);
                          } else if (newSize >= 150) {
                            newColSpan = Math.min(12, 5);
                            newRowSpan = Math.min(4, 2);
                          } else if (newSize >= 100) {
                            newColSpan = Math.min(12, 4);
                            newRowSpan = Math.min(4, 2);
                          } else if (newSize >= 80) {
                            newColSpan = Math.min(12, 3);
                            newRowSpan = Math.min(4, 2);
                          } else {
                            newColSpan = Math.min(12, 2);
                            newRowSpan = 1;
                          }
                          
                          // Update span if it changed
                          if (newColSpan !== currentSpan.col || newRowSpan !== currentSpan.row) {
                            handleSpanChange('emptyCart', slotId, { col: newColSpan, row: newRowSpan });
                          }
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
                    )}
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
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                microSlotSpans={microSlotSpans}
              >
                <div className={`w-full ${elementClasses[slotId] || 'text-xl font-semibold text-center'}`} style={elementStyles[slotId] || {}}>
                  <SimpleInlineEdit
                    text={slotContent[slotId]}
                    className=""
                    style={{}}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                    mode={mode}
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
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                microSlotSpans={microSlotSpans}
              >
                <div className={`w-full ${elementClasses[slotId] || 'text-gray-600 text-center'}`} style={elementStyles[slotId] || {}}>
                  <SimpleInlineEdit
                    text={slotContent[slotId]}
                    className=""
                    style={{}}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                    mode={mode}
                  />
                </div>
              </MicroSlot>
            );
          }
          if (slotId === 'emptyCart.button') {
            const buttonSize = componentSizes[slotId] || 'default';
            let buttonCode = slotContent[slotId] || `<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Continue Shopping</button>`;
            
            // Apply size classes to the button HTML
            if (buttonSize === 'xs') {
              buttonCode = buttonCode.replace(/px-\d+ py-\d+/, 'px-2 py-1 text-xs');
            } else if (buttonSize === 'sm') {
              buttonCode = buttonCode.replace(/px-\d+ py-\d+/, 'px-3 py-1.5 text-sm');
            } else if (buttonSize === 'default') {
              buttonCode = buttonCode.replace(/px-\d+ py-\d+/, 'px-4 py-2');
            } else if (buttonSize === 'lg') {
              buttonCode = buttonCode.replace(/px-\d+ py-\d+/, 'px-6 py-3 text-lg');
            } else if (buttonSize === 'xl') {
              buttonCode = buttonCode.replace(/px-\d+ py-\d+/, 'px-8 py-4 text-xl');
            }
            
            // Apply styles and classes to the button
            const styles = elementStyles[slotId] || {};
            const classes = elementClasses[slotId] || '';
            
            // Remove existing color classes if we have custom styles
            if (styles.backgroundColor || styles.color) {
              // Remove bg-* and text-* color classes
              buttonCode = buttonCode.replace(/\b(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
              buttonCode = buttonCode.replace(/\bhover:(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
            }
            
            // Apply inline styles to the button
            if (Object.keys(styles).length > 0) {
              const styleStr = Object.entries(styles)
                .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                .join('; ');
              buttonCode = buttonCode.replace(/<button([^>]*)>/, (match, attrs) => {
                if (attrs.includes('style=')) {
                  return match.replace(/style="[^"]*"/, `style="${styleStr}"`);
                } else {
                  return `<button${attrs} style="${styleStr}">`;
                }
              });
            }
            
            // Apply rounded classes to the button
            if (classes) {
              // First remove all existing rounded classes
              buttonCode = buttonCode.replace(/\brounded(-\w+)?\b/g, '');
              // Then add the new rounded class
              buttonCode = buttonCode.replace(/class="([^"]*)"/, (match, existingClasses) => {
                const cleanedClasses = existingClasses.replace(/\s+/g, ' ').trim();
                return `class="${cleanedClasses} ${classes}"`;
              });
            }
            
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                componentSizes={componentSizes}
                onSizeChange={handleSizeChange}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div 
                    dangerouslySetInnerHTML={{ __html: buttonCode }}
                    style={{ pointerEvents: 'none' }}
                    className="select-none"
                    title="Button is disabled in editor mode"
                  />
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
                mode={mode}
                  onClassChange={handleClassChange}
                  elementClasses={elementClasses}
                  microSlotSpans={microSlotSpans}
                  onDelete={() => {
                    console.log('onDelete callback triggered for:', slotId, customSlot.label);
                    setDeleteConfirm({ show: true, slotId: slotId, slotLabel: customSlot.label });
                  }}
                >
                  <SimpleInlineEdit
                    text={slotContent[slotId] !== undefined ? slotContent[slotId] : customSlot.content}
                    className={elementClasses[slotId] || 'text-gray-600'}
                    style={elementStyles[slotId] || {}}
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
                    mode={mode}
                  />
                </MicroSlot>
              );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={() => {
                    setEditingComponent(slotId);
                    setTempCode(slotContent[slotId] || customSlot.content);
                  }}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('emptyCart', id, newSpan)}
                mode={mode}
                  onDelete={() => {
                    console.log('onDelete callback triggered for:', slotId, customSlot.label);
                    setDeleteConfirm({ show: true, slotId: slotId, slotLabel: customSlot.label });
                  }}
                >
                  <div className="relative">
                    {/* Render HTML content if it's HTML type */}
                    {customSlot.type === 'html' ? (
                      <div 
                        className="min-h-[40px] flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: slotContent[slotId] || customSlot.content }}
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
                    
                    {/* Edit button overlay - only in edit mode */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingComponent(slotId);
                          setTempCode(slotContent[slotId] || customSlot.content);
                        }}
                        className="absolute top-1 right-1 px-2 py-1 bg-white/90 rounded shadow-sm border text-xs text-blue-600 hover:text-blue-700 hover:bg-white transition-colors"
                      >
                        <Edit className="w-3 h-3 inline mr-1" />
                        Edit {customSlot.type === 'html' ? 'HTML' : 'JS'}
                      </button>
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

  // Render cart item matching Cart.jsx structure
  const renderCartItem = () => {
    const microSlots = microSlotOrders.cartItem || MICRO_SLOT_DEFINITIONS.cartItem.microSlots;
    const spans = microSlotSpans.cartItem || MICRO_SLOT_DEFINITIONS.cartItem.defaultSpans;
    
    // Sample product data matching real cart
    const sampleProducts = [
      { 
        id: 1, 
        name: "Premium Cotton T-Shirt", 
        price: 29.99, 
        quantity: 2, 
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
        selected_options: [
          { name: "Size: Large", price: 0 },
          { name: "Color: Blue", price: 2.00 }
        ]
      },
      { 
        id: 2, 
        name: "Classic Denim Jeans", 
        price: 79.99, 
        quantity: 1, 
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center",
        selected_options: []
      }
    ];
    
    return (
      <SortableParentSlot
        id="cartItem"
        name="Cart Items"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('cartItem')}
        mode={mode}
        gridCols={12}
      >
        {/* Match Cart.jsx Card structure */}
        <Card className="col-span-12">
          <CardContent className="px-4 divide-y divide-gray-200">
            {sampleProducts.map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
              {microSlots.map(slotId => {
                const slotSpan = spans[slotId] || { col: 12, row: 1 };
                
                if (slotId === 'cartItem.image') {
                  const imageSize = componentSizes[slotId] || 80;
                  return (
                    <MicroSlot 
                      key={`${slotId}-${index}`} 
                      id={slotId} 
                      onEdit={handleEditMicroSlot}
                      colSpan={slotSpan.col}
                      rowSpan={slotSpan.row}
                      onSpanChange={(id, newSpan) => handleSpanChange('cartItem', id, newSpan)}
                mode={mode}
                      isDraggable={index === 0} // Only first item is draggable
                      onClassChange={handleClassChange}
                      elementClasses={elementClasses}
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="object-cover rounded"
                        style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
                      />
                    </MicroSlot>
                  );
                }
                if (slotId === 'cartItem.details') {
                  return (
                    <MicroSlot 
                      key={`${slotId}-${index}`}
                      id={slotId} 
                      onEdit={handleEditMicroSlot}
                      colSpan={slotSpan.col}
                      rowSpan={slotSpan.row}
                      onSpanChange={(id, newSpan) => handleSpanChange('cartItem', id, newSpan)}
                mode={mode}
                      isDraggable={index === 0}
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">${product.price.toFixed(2)} each</p>
                      </div>
                    </MicroSlot>
                  );
                }
                if (slotId === 'cartItem.quantity') {
                  return (
                    <MicroSlot 
                      key={`${slotId}-${index}`}
                      id={slotId} 
                      onEdit={handleEditMicroSlot}
                      colSpan={slotSpan.col}
                      rowSpan={slotSpan.row}
                      onSpanChange={(id, newSpan) => handleSpanChange('cartItem', id, newSpan)}
                mode={mode}
                      isDraggable={index === 0}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Button size="sm" variant="outline"><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-medium">{product.quantity}</span>
                        <Button size="sm" variant="outline"><Plus className="w-3 h-3" /></Button>
                      </div>
                    </MicroSlot>
                  );
                }
                if (slotId === 'cartItem.price') {
                  return (
                    <MicroSlot 
                      key={`${slotId}-${index}`}
                      id={slotId} 
                      onEdit={handleEditMicroSlot}
                      colSpan={slotSpan.col}
                      rowSpan={slotSpan.row}
                      onSpanChange={(id, newSpan) => handleSpanChange('cartItem', id, newSpan)}
                mode={mode}
                      isDraggable={index === 0}
                    >
                      <div className="text-lg font-bold text-gray-900">
                        ${(product.price * product.quantity).toFixed(2)}
                      </div>
                    </MicroSlot>
                  );
                }
                if (slotId === 'cartItem.remove') {
                  return (
                    <MicroSlot 
                      key={`${slotId}-${index}`}
                      id={slotId} 
                      onEdit={handleEditMicroSlot}
                      colSpan={slotSpan.col}
                      rowSpan={slotSpan.row}
                      onSpanChange={(id, newSpan) => handleSpanChange('cartItem', id, newSpan)}
                mode={mode}
                      isDraggable={index === 0}
                    >
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </MicroSlot>
                  );
                }
                return null;
              })}
            </div>
          ))}
          </CardContent>
        </Card>
      </SortableParentSlot>
    );
  };

  // Render coupon section matching Cart.jsx
  const renderCoupon = () => {
    const microSlots = microSlotOrders.coupon || MICRO_SLOT_DEFINITIONS.coupon.microSlots;
    
    return (
      <SortableParentSlot
        id="coupon"
        name="Apply Coupon"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('coupon')}
        mode={mode}
        gridCols={12}
      >
        <Card className="col-span-12">
          <div className="grid grid-cols-12 gap-2 p-4">
            {microSlots.map(slotId => {
              const slotSpan = microSlotSpans.coupon?.[slotId] || MICRO_SLOT_DEFINITIONS.coupon.defaultSpans[slotId] || { col: 12, row: 1 };
              
              if (slotId === 'coupon.title') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex items-center justify-start mb-2">
                      <SimpleInlineEdit
                        text={slotContent[slotId] || 'Apply Coupon'}
                        className={elementClasses[slotId] || 'text-lg font-semibold'}
                        style={elementStyles[slotId] || {}}
                        onChange={(newText) => handleTextChange(slotId, newText)}
                        slotId={slotId}
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                    </div>
                  </MicroSlot>
                );
              }
              
              if (slotId === 'coupon.input') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <Input 
                      placeholder={slotContent['coupon.input.placeholder'] || 'Enter coupon code'}
                      value="SAVE20"
                      disabled
                      className="w-full"
                    />
                  </MicroSlot>
                );
              }
              
              if (slotId === 'coupon.button') {
                let buttonCode = slotContent[slotId] || MICRO_SLOT_TEMPLATES['coupon.button'];
                
                // Apply styles and classes to the button
                const styles = elementStyles[slotId] || {};
                const classes = elementClasses[slotId] || '';
                
                // Remove existing color classes if we have custom styles
                if (styles.backgroundColor || styles.color) {
                  // Remove bg-* and text-* color classes
                  buttonCode = buttonCode.replace(/\b(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                  buttonCode = buttonCode.replace(/\bhover:(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                }
                
                // Apply inline styles to the button
                if (Object.keys(styles).length > 0) {
                  const styleStr = Object.entries(styles)
                    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                    .join('; ');
                  buttonCode = buttonCode.replace(/<button([^>]*)>/, (match, attrs) => {
                    if (attrs.includes('style=')) {
                      return match.replace(/style="[^"]*"/, `style="${styleStr}"`);
                    } else {
                      return `<button${attrs} style="${styleStr}">`;
                    }
                  });
                }
                
                // Apply rounded classes to the button
                if (classes) {
                  // First remove all existing rounded classes
                  buttonCode = buttonCode.replace(/\brounded(-\w+)?\b/g, '');
                  // Then add the new rounded class
                  buttonCode = buttonCode.replace(/class="([^"]*)"/, (match, existingClasses) => {
                    const cleanedClasses = existingClasses.replace(/\s+/g, ' ').trim();
                    return `class="${cleanedClasses} ${classes}"`;
                  });
                }
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    elementStyles={elementStyles}
                    componentSizes={componentSizes}
                    onSizeChange={handleSizeChange}
                    microSlotSpans={microSlotSpans}
                  >
                    <div 
                      className="w-full pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: buttonCode }}
                    />
                  </MicroSlot>
                );
              }
              
              if (slotId === 'coupon.applied') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className={elementClasses['coupon.applied.title'] || 'text-sm font-medium text-green-800'}>
                        <SimpleInlineEdit
                          text={slotContent['coupon.applied.title'] || 'Applied: '}
                          className={elementClasses['coupon.applied.title'] || 'text-sm font-medium text-green-800'}
                          style={elementStyles['coupon.applied.title'] || {}}
                          onChange={(newText) => handleTextChange('coupon.applied.title', newText)}
                          slotId="coupon.applied.title"
                          onClassChange={handleClassChange}
                          mode={mode}
                        />
                        SAVE20
                      </p>
                      <SimpleInlineEdit
                        text={slotContent['coupon.applied.description'] || '20% off your order'}
                        className={elementClasses['coupon.applied.description'] || 'text-xs text-green-600'}
                        style={elementStyles['coupon.applied.description'] || {}}
                        onChange={(newText) => handleTextChange('coupon.applied.description', newText)}
                        slotId="coupon.applied.description"
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                    </div>
                  </MicroSlot>
                );
              }
              
              if (slotId === 'coupon.removeButton') {
                let buttonCode = slotContent[slotId] || MICRO_SLOT_TEMPLATES['coupon.removeButton'];
                
                // Apply styles and classes to the button
                const styles = elementStyles[slotId] || {};
                const classes = elementClasses[slotId] || '';
                
                // Remove existing color classes if we have custom styles
                if (styles.backgroundColor || styles.color) {
                  // Remove bg-* and text-* color classes
                  buttonCode = buttonCode.replace(/\b(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                  buttonCode = buttonCode.replace(/\bhover:(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                }
                
                // Apply inline styles to the button
                if (Object.keys(styles).length > 0) {
                  const styleStr = Object.entries(styles)
                    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                    .join('; ');
                  buttonCode = buttonCode.replace(/<button([^>]*)>/, (match, attrs) => {
                    if (attrs.includes('style=')) {
                      return match.replace(/style="[^"]*"/, `style="${styleStr}"`);
                    } else {
                      return `<button${attrs} style="${styleStr}">`;
                    }
                  });
                }
                
                // Apply rounded classes to the button
                if (classes) {
                  // First remove all existing rounded classes
                  buttonCode = buttonCode.replace(/\brounded(-\w+)?\b/g, '');
                  // Then add the new rounded class
                  buttonCode = buttonCode.replace(/class="([^"]*)"/, (match, existingClasses) => {
                    const cleanedClasses = existingClasses.replace(/\s+/g, ' ').trim();
                    return `class="${cleanedClasses} ${classes}"`;
                  });
                }
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    elementStyles={elementStyles}
                    componentSizes={componentSizes}
                    onSizeChange={handleSizeChange}
                    microSlotSpans={microSlotSpans}
                  >
                    <div 
                      className="flex items-center justify-center h-full pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: buttonCode }}
                    />
                  </MicroSlot>
                );
              }
              
              // Handle custom slots
              if (slotId.startsWith('coupon.custom_')) {
                const customSlot = customSlots[slotId];
                if (!customSlot) return null;
                
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    onDelete={() => handleDeleteCustomSlot(slotId)}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('coupon', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="p-2 bg-gray-50 rounded">
                      {customSlot.type === 'text' && (
                        <SimpleInlineEdit
                          text={slotContent[slotId] || customSlot.content}
                          className={elementClasses[slotId] || 'text-gray-600'}
                          style={elementStyles[slotId] || {}}
                          onChange={(newText) => handleTextChange(slotId, newText)}
                          slotId={slotId}
                          onClassChange={handleClassChange}
                          mode={mode}
                        />
                      )}
                      {customSlot.type === 'html' && (
                        <div 
                          className="min-h-[40px] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: slotContent[slotId] || customSlot.content }}
                        />
                      )}
                    </div>
                  </MicroSlot>
                );
              }
              
              return null;
            })}
          </div>
        </Card>
      </SortableParentSlot>
    );
  };
  
  // Render order summary matching Cart.jsx
  const renderOrderSummary = () => {
    const microSlots = microSlotOrders.orderSummary || MICRO_SLOT_DEFINITIONS.orderSummary.microSlots;
    
    return (
      <SortableParentSlot
        id="orderSummary"
        name="Order Summary"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('orderSummary')}
        mode={mode}
        gridCols={12}
      >
        <Card className="col-span-12">
          <div className="grid grid-cols-12 gap-2 p-4">
            {microSlots.map(slotId => {
              const slotSpan = microSlotSpans.orderSummary?.[slotId] || MICRO_SLOT_DEFINITIONS.orderSummary.defaultSpans[slotId] || { col: 12, row: 1 };
              
              if (slotId === 'orderSummary.title') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex items-center justify-start mb-2">
                      <SimpleInlineEdit
                        text={slotContent[slotId] || 'Order Summary'}
                        className={elementClasses[slotId] || 'text-lg font-semibold'}
                        style={elementStyles[slotId] || {}}
                        onChange={(newText) => handleTextChange(slotId, newText)}
                        slotId={slotId}
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                    </div>
                  </MicroSlot>
                );
              }
              
              if (slotId === 'orderSummary.subtotal') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex justify-between items-center">
                      <SimpleInlineEdit
                        text={slotContent['orderSummary.subtotal.label'] || 'Subtotal'}
                        className={elementClasses['orderSummary.subtotal.label'] || ''}
                        style={elementStyles['orderSummary.subtotal.label'] || {}}
                        onChange={(newText) => handleTextChange('orderSummary.subtotal.label', newText)}
                        slotId="orderSummary.subtotal.label"
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                      <span>$139.97</span>
                    </div>
                  </MicroSlot>
                );
              }
              
              if (slotId === 'orderSummary.discount') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex justify-between items-center">
                      <SimpleInlineEdit
                        text={slotContent['orderSummary.discount.label'] || 'Discount'}
                        className={elementClasses['orderSummary.discount.label'] || ''}
                        style={elementStyles['orderSummary.discount.label'] || {}}
                        onChange={(newText) => handleTextChange('orderSummary.discount.label', newText)}
                        slotId="orderSummary.discount.label"
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                      <span className="text-green-600">-$27.99</span>
                    </div>
                  </MicroSlot>
                );
              }
              
              if (slotId === 'orderSummary.tax') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex justify-between items-center">
                      <SimpleInlineEdit
                        text={slotContent['orderSummary.tax.label'] || 'Tax'}
                        className={elementClasses['orderSummary.tax.label'] || ''}
                        style={elementStyles['orderSummary.tax.label'] || {}}
                        onChange={(newText) => handleTextChange('orderSummary.tax.label', newText)}
                        slotId="orderSummary.tax.label"
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                      <span>$11.20</span>
                    </div>
                  </MicroSlot>
                );
              }
              
              // Remove cmsBlockAboveTotal - handled in main layout
              if (slotId === 'orderSummary.cmsBlockAboveTotal') {
                return null;
              }
              
              if (slotId === 'orderSummary.total') {
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="flex justify-between items-center border-t pt-2">
                      <SimpleInlineEdit
                        text={slotContent['orderSummary.total.label'] || 'Total'}
                        className={elementClasses['orderSummary.total.label'] || 'text-lg font-semibold'}
                        style={elementStyles['orderSummary.total.label'] || {}}
                        onChange={(newText) => handleTextChange('orderSummary.total.label', newText)}
                        slotId="orderSummary.total.label"
                        onClassChange={handleClassChange}
                        mode={mode}
                      />
                      <span className="text-lg font-semibold">$123.18</span>
                    </div>
                  </MicroSlot>
                );
              }
              
              // Remove cmsBlockBelowTotal - handled in main layout
              if (slotId === 'orderSummary.cmsBlockBelowTotal') {
                return null;
              }
              
              if (slotId === 'orderSummary.checkoutButton') {
                let buttonCode = slotContent[slotId] || MICRO_SLOT_TEMPLATES['orderSummary.checkoutButton'];
                
                // Apply styles and classes to the button
                const styles = elementStyles[slotId] || {};
                const classes = elementClasses[slotId] || '';
                
                // Remove existing color classes if we have custom styles
                if (styles.backgroundColor || styles.color) {
                  // Remove bg-* and text-* color classes
                  buttonCode = buttonCode.replace(/\b(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                  buttonCode = buttonCode.replace(/\bhover:(bg|text)-(blue|green|red|yellow|purple|pink|gray|black|white|indigo)-\d+\b/g, '');
                }
                
                // Apply inline styles to the button
                if (Object.keys(styles).length > 0) {
                  const styleStr = Object.entries(styles)
                    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                    .join('; ');
                  buttonCode = buttonCode.replace(/<button([^>]*)>/, (match, attrs) => {
                    if (attrs.includes('style=')) {
                      return match.replace(/style="[^"]*"/, `style="${styleStr}"`);
                    } else {
                      return `<button${attrs} style="${styleStr}">`;
                    }
                  });
                }
                
                // Apply rounded classes to the button
                if (classes) {
                  // First remove all existing rounded classes
                  buttonCode = buttonCode.replace(/\brounded(-\w+)?\b/g, '');
                  // Then add the new rounded class
                  buttonCode = buttonCode.replace(/class="([^"]*)"/, (match, existingClasses) => {
                    const cleanedClasses = existingClasses.replace(/\s+/g, ' ').trim();
                    return `class="${cleanedClasses} ${classes}"`;
                  });
                }
                
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="pt-2 pointer-events-none">
                      <div dangerouslySetInnerHTML={{ __html: buttonCode }} />
                    </div>
                  </MicroSlot>
                );
              }
              
              // Handle custom slots
              if (slotId.startsWith('orderSummary.custom_')) {
                const customSlot = customSlots[slotId];
                if (!customSlot) return null;
                
                return (
                  <MicroSlot
                    key={slotId}
                    id={slotId}
                    onEdit={handleEditMicroSlot}
                    onDelete={() => handleDeleteCustomSlot(slotId)}
                    colSpan={slotSpan.col}
                    rowSpan={slotSpan.row}
                    onSpanChange={(id, newSpan) => handleSpanChange('orderSummary', id, newSpan)}
                mode={mode}
                    onClassChange={handleClassChange}
                    elementClasses={elementClasses}
                    microSlotSpans={microSlotSpans}
                  >
                    <div className="p-2 bg-gray-50 rounded">
                      {customSlot.type === 'text' && (
                        <SimpleInlineEdit
                          text={slotContent[slotId] || customSlot.content}
                          className={elementClasses[slotId] || 'text-gray-600'}
                          style={elementStyles[slotId] || {}}
                          onChange={(newText) => handleTextChange(slotId, newText)}
                          slotId={slotId}
                          onClassChange={handleClassChange}
                          mode={mode}
                        />
                      )}
                      {customSlot.type === 'html' && (
                        <div 
                          className="min-h-[40px] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: slotContent[slotId] || customSlot.content }}
                        />
                      )}
                    </div>
                  </MicroSlot>
                );
              }
              
              return null;
            })}
          </div>
        </Card>
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
        mode={mode}
        gridCols={12}
      >
        <div className="col-span-12 p-8 bg-gray-100 rounded text-center text-gray-600">
          <div className="text-lg font-semibold mb-2">Recommended Products</div>
          <div className="text-sm">Product recommendations will appear here</div>
        </div>
      </SortableParentSlot>
    );
  };
  
  // Render flash message
  const renderFlashMessage = () => {
    const microSlots = microSlotOrders.flashMessage || MICRO_SLOT_DEFINITIONS.flashMessage.microSlots;
    const spans = microSlotSpans.flashMessage || MICRO_SLOT_DEFINITIONS.flashMessage.defaultSpans;
    
    return (
      <SortableParentSlot
        id="flashMessage"
        name="Flash Message"
        microSlotOrder={microSlots}
        onMicroSlotReorder={handleMicroSlotReorder}
        onEdit={() => handleEditMicroSlot('flashMessage')}
        mode={mode}
        gridCols={MICRO_SLOT_DEFINITIONS.flashMessage.gridCols}
      >
        {microSlots.map(slotId => {
          const slotSpan = spans[slotId] || { col: 12, row: 1 };
          
          if (slotId === 'flashMessage.content') {
            // Get content from slotContent state (already set based on viewMode)
            const content = slotContent[slotId] || '';
            return (
              <MicroSlot 
                key={slotId} 
                id={slotId} 
                onEdit={handleEditMicroSlot}
                colSpan={slotSpan.col}
                rowSpan={slotSpan.row}
                onSpanChange={(id, newSpan) => handleSpanChange('flashMessage', id, newSpan)}
                mode={mode}
              >
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </MicroSlot>
            );
          }
          
          // Handle custom slots for flashMessage
          if (slotId.startsWith('flashMessage.custom_')) {
            const customSlot = customSlots[slotId];
            if (!customSlot) return null;
            
            if (customSlot.type === 'text') {
              const content = slotContent[slotId] || customSlot.content || '';
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('flashMessage', id, newSpan)}
                  mode={mode}
                  onClassChange={handleClassChange}
                  elementClasses={elementClasses}
                  elementStyles={elementStyles}
                  microSlotSpans={microSlotSpans}
                  onDelete={() => handleDeleteCustomSlot(slotId)}
                  customSlot={true}
                  slotLabel={customSlot.label}
                >
                  <SimpleInlineEdit
                    id={slotId}
                    text={content}
                    onSave={(text) => handleTextSave(slotId, text)}
                    className={elementClasses[slotId] || 'text-gray-600'}
                    style={elementStyles[slotId] || {}}
                    mode={mode}
                  />
                </MicroSlot>
              );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
              const content = slotContent[slotId] || customSlot.content || '';
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('flashMessage', id, newSpan)}
                  mode={mode}
                  onClassChange={handleClassChange}
                  elementClasses={elementClasses}
                  elementStyles={elementStyles}
                  onDelete={() => handleDeleteCustomSlot(slotId)}
                  customSlot={true}
                  slotLabel={customSlot.label}
                >
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </MicroSlot>
              );
            }
          }
          
          return null;
        })}
      </SortableParentSlot>
    );
  };

  // Render header with micro-slots
  const renderHeader = () => {
    const microSlots = microSlotOrders.header || MICRO_SLOT_DEFINITIONS.header.microSlots;
    const spans = microSlotSpans.header || MICRO_SLOT_DEFINITIONS.header.defaultSpans;
    
    return (
      <div>
        <SortableParentSlot
          id="header"
          name="Page Header"
          microSlotOrder={microSlots}
          onMicroSlotReorder={handleMicroSlotReorder}
          onEdit={() => handleEditMicroSlot('header')}
          mode={mode}
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
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                microSlotSpans={microSlotSpans}
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
                mode={mode}
                onClassChange={handleClassChange}
                elementClasses={elementClasses}
                elementStyles={elementStyles}
                microSlotSpans={microSlotSpans}
              >
                <div className="relative">
                  <SimpleInlineEdit
                    text={slotContent[slotId]}
                    className={elementClasses[slotId] || 'text-3xl font-bold text-gray-900'}
                    style={elementStyles[slotId] || {}}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    slotId={slotId}
                    onClassChange={handleClassChange}
                    mode={mode}
                  />
                </div>
              </MicroSlot>
            );
          }
          // Remove header.cmsBlock - CMS blocks are handled in main layout
          if (slotId === 'header.cmsBlock') {
            return null;
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
                mode={mode}
                  microSlotSpans={microSlotSpans}
                  onDelete={() => {
                    console.log('onDelete callback triggered for:', slotId, customSlot.label);
                    setDeleteConfirm({ show: true, slotId: slotId, slotLabel: customSlot.label });
                  }}
                >
                  <SimpleInlineEdit
                    text={slotContent[slotId] !== undefined ? slotContent[slotId] : customSlot.content}
                    className={elementClasses[slotId] || 'text-gray-600'}
                    style={elementStyles[slotId] || {}}
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
                    mode={mode}
                  />
                </MicroSlot>
              );
            } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
              const content = slotContent[slotId] || customSlot.content || '';
              return (
                <MicroSlot 
                  key={slotId} 
                  id={slotId} 
                  onEdit={handleEditMicroSlot}
                  colSpan={slotSpan.col}
                  rowSpan={slotSpan.row}
                  onSpanChange={(id, newSpan) => handleSpanChange('header', id, newSpan)}
                mode={mode}
                  onDelete={() => {
                    console.log('onDelete callback triggered for:', slotId, customSlot.label);
                    setDeleteConfirm({ show: true, slotId: slotId, slotLabel: customSlot.label });
                  }}
                >
                  <div className={`relative bg-gray-50 ${mode === 'edit' ? 'border border-dashed border-gray-300' : 'border-transparent'} rounded-md p-3 min-h-[60px]`}>
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
    </div>
    );
  };

  // Render the main slot content
  const renderSlotContent = () => {
    return viewMode === 'empty' ? (
      // Empty cart layout - simple vertical
      <div className="space-y-8">
        {/* CMS Block at cart header */}
        <CmsBlockRenderer position="cart_header" storeId={currentStoreId} />
        
        {majorSlots.map(slotId => {
          switch (slotId) {
            case 'flashMessage':
              return renderFlashMessage();
            case 'header':
              return renderHeader();
            case 'emptyCart':
              return renderEmptyCart();
            default:
              return null;
          }
        })}
        
        {/* CMS Block at cart footer */}
        <CmsBlockRenderer position="cart_footer" storeId={currentStoreId} />
      </div>
    ) : (
      // With products layout - matching Cart.jsx structure
      <div className="space-y-8">
        {/* CMS Block at cart header */}
        <CmsBlockRenderer position="cart_header" storeId={currentStoreId} />
        
        {/* Flash message at top */}
        {majorSlots.includes('flashMessage') && renderFlashMessage()}
        
        {/* Header below flash message */}
        {majorSlots.includes('header') && renderHeader()}
        
        {/* CMS Block above cart items */}
        <CmsBlockRenderer position="cart_above_items" storeId={currentStoreId} />
        
        {/* Main content grid - cart items left, coupon/summary right */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left side - Cart items (2 columns width) */}
          <div className="lg:col-span-2">
            {majorSlots.includes('cartItem') && renderCartItem()}
            {/* CMS Block below cart items */}
            <CmsBlockRenderer position="cart_below_items" storeId={currentStoreId} />
          </div>
          
          {/* Right side - Coupon and Summary (1 column width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {majorSlots.includes('coupon') && renderCoupon()}
            
            {/* CMS Block above total */}
            <CmsBlockRenderer position="cart_above_total" storeId={currentStoreId} />
            
            {majorSlots.includes('orderSummary') && renderOrderSummary()}
            
            {/* CMS Block below total */}
            <CmsBlockRenderer position="cart_below_total" storeId={currentStoreId} />
          </div>
        </div>
        
        {/* CMS Block at cart footer */}
        <CmsBlockRenderer position="cart_footer" storeId={currentStoreId} />
      </div>
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
      <div className="bg-gray-50 cart-page min-h-screen flex flex-col" style={{ backgroundColor: '#f9fafb' }}>
        <SeoHeadManager
          title="Empty Cart Editor"
          description="Edit empty cart state layout"
          keywords="cart, editor, empty-state"
        />

        {/* White header bar with controls - show in both edit and preview modes */}
        {(mode === 'edit' || mode === 'preview') && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
              <div className="border-b p-3 flex justify-end gap-2">
              <button
                onClick={() => setViewMode('empty')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'empty'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                Empty Cart
              </button>
              <button
                onClick={() => setViewMode('withProducts')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'withProducts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />
                With Products
              </button>
              {mode === 'edit' && (
                <>
                  <div className="border-l mx-2" />
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Layout
                  </button>
                </>
              )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          
          {mode === 'edit' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleMajorDragStart}
              onDragEnd={handleMajorDragEnd}
            >
              <SortableContext items={majorSlots} strategy={verticalListSortingStrategy}>
                {renderSlotContent()}
              </SortableContext>
              
              <DragOverlay>
                {activeDragSlot ? (
                  <div className="bg-white border rounded-lg shadow-lg p-4 opacity-90">
                    {activeDragSlot}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            renderSlotContent()
          )}
          </div>
        </div>
      </div>

      {/* Monaco Editor Modal for micro-slots and parent slots */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              {editingComponent && !editingComponent.includes('.') 
                ? `Edit Parent Slot Configuration: ${MICRO_SLOT_DEFINITIONS[editingComponent]?.name || editingComponent}`
                : `Edit Micro-Slot: ${editingComponent}`
              }
            </DialogTitle>
            {editingComponent && !editingComponent.includes('.') && (
              <p className="text-sm text-gray-500 mt-1">
                Edit the JSON configuration for this parent slot including micro-slot order, spans, and content
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={
                editingComponent && !editingComponent.includes('.') 
                  ? 'json' 
                  : (editingComponent && (editingComponent.includes('.title') || editingComponent.includes('.text') || editingComponent.includes('.button') || editingComponent.includes('.custom_')) 
                    ? 'html' 
                    : 'javascript')
              }
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
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {newSlotType === 'text' ? 'Initial Text' : newSlotType === 'html' ? 'HTML Content' : 'JavaScript Code'}
              </label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[100px] font-mono text-sm"
                placeholder={newSlotType === 'text' ? 'Enter your text here...' : newSlotType === 'html' ? '<div>Your HTML here...</div>' : '// Your JavaScript code here'}
                value={newSlotContent}
                onChange={(e) => setNewSlotContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSlotDialog(false);
              setCurrentParentSlot(null);
              setNewSlotName('');
              setNewSlotContent('');
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
      
      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Cart Page Layout</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reset the layout configuration for the <strong>Cart page</strong>? This will delete all customizations and restore the default layout for this page only.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              <strong>Note:</strong> Only the Cart page layout will be reset. Other pages will not be affected.
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setSaveStatus('saving');
                  
                  // Get store ID from localStorage (same as save/load functions)
                  const storeId = selectedStore?.id;
                  if (!storeId) {
                    console.error('No store ID found');
                    setSaveStatus('error');
                    setTimeout(() => {
                      setSaveStatus('');
                    }, 3000);
                    return;
                  }
                  
                  const queryParams = new URLSearchParams({
                    store_id: storeId
                  }).toString();
                  
                  // Import standard SlotConfiguration
                  const { SlotConfiguration } = await import('@/api/entities');
                  
                  // Get existing configurations
                  const configurations = await SlotConfiguration.findAll({ 
                    store_id: storeId, 
                    is_active: true 
                  });
                  
                  // Find the Cart configuration specifically
                  const existingConfig = configurations?.find(cfg => 
                    cfg.configuration?.page_name === 'Cart' && 
                    cfg.configuration?.slot_type === 'cart_layout'
                  );
                  
                  if (existingConfig?.id) {
                    // Delete the configuration from database
                    await SlotConfiguration.delete(existingConfig.id);
                    console.log('✅ Deleted configuration from database');
                  }
                  
                  // Configuration will be reset in database
                  
                  // Reset all state to defaults
                  setMicroSlotOrders({});
                  setMicroSlotSpans({});
                  setCustomSlots({});
                  // Reset to default templates and text
                  setSlotContent({
                    ...MICRO_SLOT_TEMPLATES,  // Include all templates
                    // Override with default text values
                    'emptyCart.title': 'Your cart is empty',
                    'emptyCart.text': "Looks like you haven't added anything to your cart yet.",
                    'header.title': 'My Cart',
                    'coupon.title': 'Apply Coupon',
                    'coupon.input.placeholder': 'Enter coupon code',
                    'coupon.applied.title': 'Applied: ',
                    'coupon.applied.description': '20% off your order',
                    'orderSummary.title': 'Order Summary',
                    'orderSummary.subtotal.label': 'Subtotal',
                    'orderSummary.discount.label': 'Discount',
                    'orderSummary.tax.label': 'Tax',
                    'orderSummary.total.label': 'Total',
                  });
                  setElementClasses({
                    'header.title': 'text-3xl font-bold text-gray-900',
                    'emptyCart.title': 'text-xl font-semibold',
                    'emptyCart.text': 'text-gray-600',
                    'emptyCart.button': '',
                    'coupon.title': 'text-lg font-semibold',
                    'coupon.applied.title': 'text-sm font-medium text-green-800',
                    'coupon.applied.description': 'text-xs text-green-600',
                    'orderSummary.title': 'text-lg font-semibold',
                    'orderSummary.subtotal.label': '',
                    'orderSummary.discount.label': '',
                    'orderSummary.tax.label': '',
                    'orderSummary.total.label': 'text-lg font-semibold',
                  });
                  setComponentSizes({
                    'emptyCart.icon': 64,
                    'emptyCart.button': 'default',
                    'cartItem.image': 80,
                  });
                  
                  // Show success message
                  setSaveStatus('saved');
                  setTimeout(() => {
                    setSaveStatus('');
                  }, 2000);
                  
                  // Close modal
                  setShowResetModal(false);
                  
                } catch (error) {
                  console.error('❌ Failed to reset configuration:', error);
                  setSaveStatus('error');
                  setTimeout(() => {
                    setSaveStatus('');
                  }, 3000);
                }
              }}
            >
              Reset Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Custom Slot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the custom slot <strong>"{deleteConfirm.slotLabel}"</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log('User confirmed deletion for:', deleteConfirm.slotId);
                if (deleteConfirm.slotId) {
                  handleDeleteCustomSlot(deleteConfirm.slotId);
                }
                setDeleteConfirm({ show: false, slotId: null, slotLabel: '' });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}