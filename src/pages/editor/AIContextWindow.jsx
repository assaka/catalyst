import React, { useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Maximize2, Minimize2, ShoppingCart, Package, CreditCard, CheckCircle, Grid3X3, Menu, User, LogIn } from 'lucide-react';
import SlotEnabledFileSelector from '@/components/editor/ai-context/SlotEnabledFileSelector';
import HeaderSlotsEditor from '@/pages/editor/HeaderSlotsEditor';
import CartSlotsEditor from '@/pages/editor/CartSlotsEditor';
import CategorySlotsEditor from '@/pages/editor/CategorySlotsEditor';
import ProductSlotsEditor from '@/pages/editor/ProductSlotsEditor';
import AccountSlotsEditor from '@/pages/editor/AccountSlotsEditor';
import LoginSlotsEditor from '@/pages/editor/LoginSlotsEditor';
import slotConfigurationService from '@/services/slotConfigurationService';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * AI Context Window Page - Slot Editor Interface
 * Main interface for slot-based page layout editing
 */

// Define the slot-enabled files with their metadata
const slotEnabledFiles = [
  {
    id: 'header',
    name: 'Header',
    path: 'src/pages/editor/HeaderSlotsEditor.jsx',
    pageType: 'header',
    icon: Menu,
    description: 'Header and navigation customization',
    color: 'text-indigo-500'
  },
  {
    id: 'cart',
    name: 'Cart',
    path: 'src/pages/editor/CartSlotsEditor.jsx',
    pageType: 'cart',
    icon: ShoppingCart,
    description: 'Shopping cart page with slot customization',
    color: 'text-blue-500'
  },
  {
    id: 'category',
    name: 'Category',
    path: 'src/pages/editor/CategorySlotsEditor.jsx',
    pageType: 'category',
    icon: Grid3X3,
    description: 'Product category listing page',
    color: 'text-green-500'
  },
  {
    id: 'product',
    name: 'Product',
    path: 'src/pages/editor/ProductSlotsEditor.jsx',
    pageType: 'product',
    icon: Package,
    description: 'Product detail page with customizable slots',
    color: 'text-purple-500'
  },
  {
    id: 'account',
    name: 'Account',
    path: 'src/pages/editor/AccountSlotsEditor.jsx',
    pageType: 'account',
    icon: User,
    description: 'Customer account page customization',
    color: 'text-pink-500'
  },
  {
    id: 'login',
    name: 'Login',
    path: 'src/pages/editor/LoginSlotsEditor.jsx',
    pageType: 'login',
    icon: LogIn,
    description: 'Login and registration page customization',
    color: 'text-teal-500'
  },
  {
    id: 'checkout',
    name: 'Checkout',
    path: 'src/pages/editor/CheckoutSlotsEditor.jsx',
    pageType: 'checkout',
    icon: CreditCard,
    description: 'Checkout flow with payment integration',
    color: 'text-orange-500',
    comingSoon: true
  },
  {
    id: 'success',
    name: 'Success',
    path: 'src/pages/editor/SuccessSlotsEditor.jsx',
    pageType: 'success',
    icon: CheckCircle,
    description: 'Order confirmation and success page',
    color: 'text-emerald-500',
    comingSoon: true
  }
];

const AIContextWindowPage = () => {
  const { getSelectedStoreId } = useStoreSelection();

  // State management
  const [selectedSlotEditor, setSelectedSlotEditor] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle slot editor selection from SlotEnabledFileSelector
  const handleFileSelect = useCallback((slotFile) => {
    console.log('Slot editor selected:', slotFile);
    setSelectedSlotEditor(slotFile);
  }, []);

  return (
    <div className={`min-h-full flex flex-col bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Editable Pages
          </h1>
        </div>

        {/* Slot Editor Status */}
        <div className="flex items-center space-x-4">
          {selectedSlotEditor && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Editing: {selectedSlotEditor.name}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {isFullscreen ? (
          // Fullscreen mode - single panel without ResizablePanelGroup
          <div className="h-full w-full">
            <div className="h-full flex flex-col">
              {selectedSlotEditor ? (
                <>
                  {/* Slot Editor Header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center px-4 py-2">
                        {(() => {
                          const IconComponent = selectedSlotEditor.icon;
                          return (
                            <div className="flex items-center text-sm font-medium">
                              {IconComponent && (
                                <IconComponent className={`w-4 h-4 mr-2 ${selectedSlotEditor.color}`} />
                              )}
                              <span className="text-gray-900 dark:text-gray-100">{selectedSlotEditor.name} Editor</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">- {selectedSlotEditor.description}</span>
                            </div>
                          );
                        })()}
                      </div>
                      <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Slot Editor Content */}
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const handleSave = async (configToSave) => {
                        try {
                          const storeId = getSelectedStoreId();
                          const response = await slotConfigurationService.saveConfiguration(storeId, configToSave, selectedSlotEditor.pageType);
                          console.log('✅ Configuration saved successfully:', response);
                          return response;
                        } catch (error) {
                          console.error(`❌ Failed to save ${selectedSlotEditor.pageType} configuration:`, error);
                          throw error;
                        }
                      };

                      switch (selectedSlotEditor.pageType) {
                        case 'header':
                          return (
                            <HeaderSlotsEditor
                              mode="edit"
                              viewMode="desktop"
                              onSave={handleSave}
                            />
                          );
                        case 'category':
                          return (
                            <CategorySlotsEditor
                              mode="edit"
                              viewMode="grid"
                              onSave={handleSave}
                            />
                          );
                        case 'cart':
                          return (
                            <CartSlotsEditor
                              mode="edit"
                              viewMode="emptyCart"
                              slotType={selectedSlotEditor.pageType}
                              onSave={handleSave}
                            />
                          );
                        case 'product':
                          return (
                            <ProductSlotsEditor
                              mode="edit"
                              viewMode="default"
                              onSave={handleSave}
                            />
                          );
                        case 'account':
                          return (
                            <AccountSlotsEditor
                              mode="edit"
                              viewMode="overview"
                              onSave={handleSave}
                            />
                          );
                        case 'login':
                          return (
                            <LoginSlotsEditor
                              mode="edit"
                              viewMode="login"
                              onSave={handleSave}
                            />
                          );
                        default:
                          // For other slot types, use CartSlotsEditor for now
                          return (
                            <CartSlotsEditor
                              mode="edit"
                              viewMode="emptyCart"
                              slotType={selectedSlotEditor.pageType}
                              onSave={handleSave}
                            />
                          );
                      }
                    })()}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                    <p className="text-lg mb-2">Select a slot editor from the left panel</p>
                    <p className="text-sm">Choose Cart, Category, Product, Checkout, or Success to start editing page layouts with the slot system.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Normal mode with ResizablePanelGroup
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel
              defaultSize={14}
              minSize={14}
              maxSize={14}
            >
              <SlotEnabledFileSelector
                onFileSelect={handleFileSelect}
                selectedFile={selectedSlotEditor}
                className="h-full"
                files={slotEnabledFiles}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
              defaultSize={86}
              minSize={40}
              maxSize={60}
            >
              <div className="h-full flex flex-col">
                {selectedSlotEditor ? (
                  <>
                    {/* Slot Editor Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 h-10">
                        <div className="flex items-center px-4 py-1">
                          {(() => {
                            const IconComponent = selectedSlotEditor.icon;
                            return (
                              <div className="flex items-center text-sm font-medium">
                                {IconComponent && (
                                  <IconComponent className={`w-4 h-4 mr-2 ${selectedSlotEditor.color}`} />
                                )}
                                <span className="text-gray-900 dark:text-gray-100">{selectedSlotEditor.name} Editor</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">- {selectedSlotEditor.description}</span>
                              </div>
                            );
                          })()}
                        </div>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Slot Editor Content */}
                    <div className="flex-1 overflow-hidden">
                      {(() => {
                        const handleSave = async (configToSave) => {
                          try {
                            const storeId = getSelectedStoreId();
                            const response = await slotConfigurationService.saveConfiguration(storeId, configToSave, selectedSlotEditor.pageType);
                            console.log('✅ Configuration saved successfully:', response);
                            return response;
                          } catch (error) {
                            console.error(`❌ Failed to save ${selectedSlotEditor.pageType} configuration:`, error);
                            throw error;
                          }
                        };

                        switch (selectedSlotEditor.pageType) {
                          case 'header':
                            return (
                              <HeaderSlotsEditor
                                mode="edit"
                                viewMode="desktop"
                                onSave={handleSave}
                              />
                            );
                          case 'category':
                            return (
                              <CategorySlotsEditor
                                mode="edit"
                                viewMode="grid"
                                onSave={handleSave}
                              />
                            );
                          case 'cart':
                            return (
                              <CartSlotsEditor
                                mode="edit"
                                viewMode="emptyCart"
                                slotType={selectedSlotEditor.pageType}
                                onSave={handleSave}
                              />
                            );
                          case 'product':
                            return (
                              <ProductSlotsEditor
                                mode="edit"
                                viewMode="default"
                                onSave={handleSave}
                              />
                            );
                          case 'account':
                            return (
                              <AccountSlotsEditor
                                mode="edit"
                                viewMode="overview"
                                onSave={handleSave}
                              />
                            );
                          case 'login':
                            return (
                              <LoginSlotsEditor
                                mode="edit"
                                viewMode="login"
                                onSave={handleSave}
                              />
                            );
                          default:
                            // For other slot types, use CartSlotsEditor for now
                            return (
                              <CartSlotsEditor
                                mode="edit"
                                viewMode="emptyCart"
                                slotType={selectedSlotEditor.pageType}
                                onSave={handleSave}
                              />
                            );
                        }
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                      <p className="text-lg mb-2">Select a slot editor from the left panel</p>
                      <p className="text-sm">Choose Cart, Category, Product, Checkout, or Success to start editing page layouts with the slot system.</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Version history functionality available in UnifiedSlotEditor */}
    </div>
  );
};

export default AIContextWindowPage;