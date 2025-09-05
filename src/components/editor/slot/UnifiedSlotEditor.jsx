/**
 * UnifiedSlotEditor - Replaces the old GenericSlotEditor with our new unified system
 * This wrapper provides the UI for switching between layout/preview/code modes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GenericSlotEditor from '@/components/editor/slot/GenericSlotEditor';
import { getPageConfig } from '@/components/editor/slot/page-configs';
import { SlotStorage } from '@/components/editor/slot/slot-utils';
import Editor from "@monaco-editor/react";
import {
  Eye,
  Code,
  Layout,
  ShoppingCart,
  Package,
  Grid,
  FileText,
  Save,
  Download,
  Upload
} from 'lucide-react';

export default function UnifiedSlotEditor({
  pageName = 'Cart',
  slotType = 'cart_layout',
  pageId = null,
  onClose = () => {},
}) {
  const [mode, setMode] = useState('layout'); // 'layout', 'preview', 'code'
  const [cartPreviewMode, setCartPreviewMode] = useState('empty');
  const [pageConfig, setPageConfig] = useState(null);
  const [slotConfig, setSlotConfig] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Map old page names to new page types
  const pageTypeMap = {
    'Cart': 'cart',
    'Category': 'category',
    'Product': 'product',
    'Homepage': 'homepage',
    'Checkout': 'checkout'
  };
  
  const pageType = pageTypeMap[pageName] || pageName.toLowerCase();
  
  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      // First try to load from database
      const storeId = localStorage.getItem('selectedStoreId');
      let config = null;
      
      if (storeId) {
        config = await SlotStorage.loadFromDatabase(pageType, storeId);
      }
      
      // Fallback to localStorage
      if (!config) {
        config = SlotStorage.load(pageType);
      }
      
      setSlotConfig(config);
      setPageConfig(getPageConfig(pageType));
      
      // Set code content for code mode
      if (config) {
        setCodeContent(JSON.stringify(config, null, 2));
      }
    };
    
    loadConfig();
  }, [pageType]);
  
  // Handle save from editor
  const handleSave = useCallback(async (config) => {
    console.log(`Saving ${pageType} configuration:`, config);
    
    // Save to localStorage
    SlotStorage.save(pageType, config);
    
    // Save to database
    const storeId = localStorage.getItem('selectedStoreId');
    if (storeId) {
      await SlotStorage.saveToDatabase(pageType, storeId, config);
    }
    
    setSlotConfig(config);
    setHasUnsavedChanges(false);
    
    // Update code view
    setCodeContent(JSON.stringify(config, null, 2));
  }, [pageType]);
  
  // Handle code save
  const handleCodeSave = useCallback(() => {
    try {
      const config = JSON.parse(codeContent);
      handleSave(config);
    } catch (error) {
      alert('Invalid JSON: ' + error.message);
    }
  }, [codeContent, handleSave]);
  
  // Get sample data for preview
  const getSampleData = () => {
    if (pageType === 'cart') {
      if (cartPreviewMode === 'empty') {
        return {
          cartItems: [],
          subtotal: 0,
          total: 0
        };
      } else {
        return {
          cartItems: [
            { 
              id: 1, 
              quantity: 2,
              price: 29.99,
              product: {
                id: 1,
                name: "Premium Cotton T-Shirt", 
                price: 29.99,
                images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop"]
              },
            },
            { 
              id: 2, 
              quantity: 1,
              price: 79.99,
              product: {
                id: 2,
                name: "Classic Denim Jeans", 
                price: 79.99,
                images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop"]
              },
            }
          ],
          subtotal: 139.97,
          tax: 11.20,
          total: 151.17,
          currencySymbol: '$'
        };
      }
    } else if (pageType === 'category') {
      return {
        category: { name: 'Electronics', description: 'Latest gadgets' },
        products: [
          { id: 1, name: 'Product 1', price: 99.99 },
          { id: 2, name: 'Product 2', price: 149.99 },
          { id: 3, name: 'Product 3', price: 199.99 },
        ]
      };
    }
    return {};
  };
  
  // Render the editor
  const renderEditor = () => {
    return (
      <GenericSlotEditor
        pageType={pageType}
        pageConfig={pageConfig}
        data={getSampleData()}
        mode="editor"
        onSave={handleSave}
        className="p-4"
      />
    );
  };
  
  const renderPreview = () => {
    return (
      <GenericSlotEditor
        pageType={pageType}
        pageConfig={pageConfig}
        data={getSampleData()}
        mode="display"
        className="p-4"
      />
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">
              {pageName} Page Editor
            </h1>
            <p className="text-sm text-gray-600">
              {mode === 'layout' && 'Drag to reorder, click to edit'}
              {mode === 'preview' && 'Preview your changes'}
              {mode === 'code' && 'Edit configuration as JSON'}
            </p>
          </div>
          
          {/* Mode switcher */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'layout' ? 'default' : 'outline'}
              onClick={() => setMode('layout')}
              size="sm"
            >
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </Button>
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => setMode('preview')}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant={mode === 'code' ? 'default' : 'outline'}
              onClick={() => setMode('code')}
              size="sm"
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {mode === 'layout' && (
          <div className="h-full">
            {renderEditor()}
          </div>
        )}
        
        {mode === 'preview' && (
          <div className="h-full">
            {/* Preview mode toggle for cart */}
            {pageType === 'cart' && (
              <div className="bg-white border-b p-3 flex justify-end gap-2">
                <button
                  onClick={() => setCartPreviewMode('empty')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    cartPreviewMode === 'empty'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                  Empty Cart
                </button>
                <button
                  onClick={() => setCartPreviewMode('withProducts')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    cartPreviewMode === 'withProducts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" />
                  With Products
                </button>
              </div>
            )}
            {renderPreview()}
          </div>
        )}
        
        {mode === 'code' && (
          <div className="h-full p-4">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={codeContent}
                  onChange={(value) => {
                    setCodeContent(value || '');
                    setHasUnsavedChanges(true);
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {(mode === 'code' && hasUnsavedChanges) && (
        <div className="bg-white border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setHasUnsavedChanges(false)}>
            Cancel
          </Button>
          <Button onClick={handleCodeSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}