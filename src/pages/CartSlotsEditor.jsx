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
import { ShoppingCart, Minus, Plus, Trash2, Tag, GripVertical, Edit, X, Save, Code, RefreshCw, Copy, Check, FileCode, Maximize2, Eye, EyeOff, Undo2, Redo2, LayoutGrid, AlignJustify, AlignLeft, GripHorizontal, GripVertical as ResizeVertical } from "lucide-react";
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
  
  // Preset color options
  const textColors = [
    { label: 'Black', value: 'text-black' },
    { label: 'Gray', value: 'text-gray-600' },
    { label: 'Red', value: 'text-red-600' },
    { label: 'Blue', value: 'text-blue-600' },
    { label: 'Green', value: 'text-green-600' },
    { label: 'Yellow', value: 'text-yellow-600' },
    { label: 'Purple', value: 'text-purple-600' },
  ];
  
  const bgColors = [
    { label: 'None', value: '' },
    { label: 'Gray', value: 'bg-gray-100' },
    { label: 'Red', value: 'bg-red-100' },
    { label: 'Blue', value: 'bg-blue-100' },
    { label: 'Green', value: 'bg-green-100' },
    { label: 'Yellow', value: 'bg-yellow-100' },
    { label: 'Purple', value: 'bg-purple-100' },
  ];
  
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
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">Edit Text & Style</h3>
        
        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Text Content</label>
          <input
            type="text"
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Style Options */}
        <div className="space-y-4">
          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <div className="flex gap-2 flex-wrap">
              {textColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleClassToggle(color.value, 'text-color')}
                  className={`px-3 py-1 rounded border ${tempClass.includes(color.value) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <span className={color.value}>{color.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium mb-1">Background Color</label>
            <div className="flex gap-2 flex-wrap">
              {bgColors.map(color => (
                <button
                  key={color.value || 'none'}
                  onClick={() => handleClassToggle(color.value, 'bg-color')}
                  className={`px-3 py-1 rounded border ${color.value} ${tempClass.includes(color.value) || (!color.value && !bgColors.slice(1).some(c => tempClass.includes(c.value))) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {color.label}
                </button>
              ))}
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
        
        {/* Preview */}
        <div className="mt-4 p-4 border rounded">
          <p className="text-sm text-gray-500 mb-1">Preview:</p>
          <div className={tempClass}>{tempText}</div>
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
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
            onChange(tempText, tempClass);
            onClose();
          }}>
            Apply
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

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        slotRef.current = el;
      }}
      style={style}
      className={`relative ${getGridSpanClass()} ${isDragging ? 'z-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit button only - no drag icon needed */}
      {onEdit && isHovered && !isDragging && (
        <button
          onClick={() => onEdit(id)}
          className="absolute right-1 top-1 p-1 bg-gray-100/80 rounded transition-opacity z-10 hover:bg-gray-200"
          title="Edit micro-slot"
        >
          <Edit className="w-3 h-3 text-gray-600" />
        </button>
      )}
      
      {/* Span controls - moved inside to avoid conflicts */}
      {onSpanChange && (isHovered || isDragging) && (
        <div className="absolute bottom-1 left-1 flex gap-1 transition-opacity z-10">
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
        className={`${isDragging ? 'ring-2 ring-blue-400 cursor-grabbing' : isDraggable && !isResizing ? 'hover:ring-1 hover:ring-gray-300 cursor-grab' : ''} rounded transition-all relative z-1`}
        {...(isDraggable && !isResizing ? listeners : {})}
        {...(isDraggable && !isResizing ? attributes : {})}
      >
        {children}
        
        {/* Resize handles */}
        {onSpanChange && !isDragging && (isHovered || isResizing) && (
          <>
            {/* Right edge */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-blue-500/20 hover:bg-blue-500/30"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
            {/* Bottom edge */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize bg-blue-500/20 hover:bg-blue-500/30"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
            {/* Bottom-right corner */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-500 rounded-sm" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Parent slot container with micro-slots
function ParentSlot({ id, name, children, microSlotOrder, onMicroSlotReorder, onEdit, isDraggable = true, gridCols = 12 }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit button only - drag entire section */}
      {onEdit && isHovered && !isDragging && (
        <button
          onClick={() => onEdit(id)}
          className="absolute right-2 top-2 p-1.5 bg-blue-100/90 rounded transition-opacity z-10 hover:bg-blue-200"
          title="Edit section"
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
      )}
      
      {/* Section label */}
      <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-medium text-gray-500">
        {name} (12 column grid)
      </div>
      
      {/* Micro-slots container - draggable area */}
      <div 
        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white relative z-1 ${isDraggable && !isDragging ? 'cursor-grab' : isDragging ? 'cursor-grabbing' : ''}`}
        {...(isDraggable ? listeners : {})}
        {...(isDraggable ? attributes : {})}
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
  // State for major slot order
  const [majorSlots, setMajorSlots] = useState(['header', 'cartItems', 'coupon', 'orderSummary', 'recommendedProducts']);
  
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

  // Load saved configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // First try to load from localStorage
        const localConfig = localStorage.getItem('cart_slots_layout_config');
        if (localConfig) {
          const config = JSON.parse(localConfig);
          console.log('Loading saved configuration from localStorage:', config);
          
          if (config.majorSlots) setMajorSlots(config.majorSlots);
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
            
            if (dbConfig.majorSlots) setMajorSlots(dbConfig.majorSlots);
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
  const handleMajorDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setMajorSlots((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
    setActiveDragSlot(null);
  }, []);

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
      }
      
      return newOrders;
    });
  }, []);
  
  // Handle span change for a micro-slot
  const handleSpanChange = useCallback((parentId, microSlotId, newSpans) => {
    setMicroSlotSpans(prev => ({
      ...prev,
      [parentId]: {
        ...prev[parentId],
        [microSlotId]: newSpans
      }
    }));
  }, []);
  
  // Handle text content change
  const handleTextChange = useCallback((slotId, newText) => {
    setTextContent(prev => ({
      ...prev,
      [slotId]: newText
    }));
  }, []);
  
  // Handle class change for elements
  const handleClassChange = useCallback((slotId, newClass) => {
    setElementClasses(prev => ({
      ...prev,
      [slotId]: newClass
    }));
  }, []);
  
  // Handle component size change
  const handleSizeChange = useCallback((slotId, newSize) => {
    setComponentSizes(prev => ({
      ...prev,
      [slotId]: newSize
    }));
  }, []);

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
      <ParentSlot
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
                  <div className="text-xs text-gray-500">Icon: {iconSize}px (drag corner to resize)</div>
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
                  <InlineEdit
                    value={textContent[slotId]}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    className="text-xl font-semibold block border-b-2 border-dashed border-gray-300 pb-1"
                    tag="h2"
                    richText
                  />
                  <span className="absolute -top-5 left-0 text-xs text-blue-600">Click to edit with rich text</span>
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
                  <InlineEdit
                    value={textContent[slotId]}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    className="text-gray-600 block border-2 border-dashed border-gray-300 p-2 rounded"
                    tag="div"
                    richText
                  />
                  <span className="absolute -top-2 left-2 text-xs bg-white px-1 text-blue-600">Click to edit with rich text</span>
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
                  <div className="text-xs text-gray-500">Button: {buttonSize} (drag corner to resize)</div>
                </div>
              </MicroSlot>
            );
          }
          return null;
        })}
      </ParentSlot>
    );
  };

  // Render header with micro-slots
  const renderHeader = () => {
    const microSlots = microSlotOrders.header || MICRO_SLOT_DEFINITIONS.header.microSlots;
    const spans = microSlotSpans.header || MICRO_SLOT_DEFINITIONS.header.defaultSpans;
    
    return (
      <ParentSlot
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
                  <InlineEdit
                    value={textContent[slotId]}
                    onChange={(newText) => handleTextChange(slotId, newText)}
                    className="text-3xl font-bold text-gray-900 block border-b-2 border-dashed border-gray-300 pb-2"
                    tag="h1"
                    richText
                  />
                  <span className="absolute -top-5 left-0 text-xs text-blue-600">Click to edit with rich text</span>
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
      </ParentSlot>
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
          title="Cart Editor - Micro Slots"
          description="Edit cart layout with micro-slot precision"
          keywords="cart, editor, micro-slots"
        />
        
        {/* Instructions and Save Button */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100">
                <GripVertical className="w-3 h-3 mr-1" />
                Sections
              </Badge>
              <span className="text-sm text-blue-800">Drag to reorder sections</span>
              <span className="mx-2 text-blue-400">•</span>
              <Badge variant="secondary" className="bg-purple-100">
                <Move className="w-3 h-3 mr-1" />
                Grid Slots
              </Badge>
              <span className="text-sm text-blue-800">Drag & resize within 12-column grid</span>
              <span className="mx-2 text-blue-400">•</span>
              <Badge variant="secondary" className="bg-green-100">
                W/H
              </Badge>
              <span className="text-sm text-blue-800">Hover to adjust width (1-12) and height (1-4)</span>
              </div>
              <Button 
                onClick={() => {
                  // Save all configuration
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
                  onSave(config);
                  // Show success message (optional)
                  console.log('Layout configuration saved!', config);
                }}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Layout
              </Button>
            </div>
          </div>
        </div>
        
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
                  if (slotId === 'header') {
                    return <div key={slotId}>{renderHeader()}</div>;
                  }
                  if (slotId === 'cartItems' && cartItems.length === 0) {
                    return <div key={slotId}>{renderEmptyCart()}</div>;
                  }
                  // Add other slots here...
                  return null;
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