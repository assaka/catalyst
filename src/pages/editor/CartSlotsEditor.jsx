/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  ShoppingCart,
  Package,
  Loader2
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
import {
  GridResizeHandle,
  GridColumn,
  EditableElement,
  HierarchicalSlotRenderer,
  EditorToolbar,
  AddSlotModal,
  ResetLayoutModal,
  FilePickerModalWrapper
} from '@/components/editor/slot/SlotComponents';
import slotConfigurationService from '@/services/slotConfigurationService';
import { runDragDropTests } from '@/utils/dragDropTester';


// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly
const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'empty'
}) => {
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // Validation function now provided by useSlotConfiguration hook

  // State management - Initialize with empty config to avoid React error #130
  const [cartLayoutConfig, setCartLayoutConfig] = useState({
    page_name: 'Cart',
    slot_type: 'cart_layout',
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: 'cart'
    },
    cmsBlocks: []
  });

  // Track if configuration has been loaded once
  const configurationLoadedRef = useRef(false);
  const isDragOperationActiveRef = useRef(false);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSlotBorders, setShowSlotBorders] = useState(true);
  const [localSaveStatus, setLocalSaveStatus] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showFilePickerModal, setShowFilePickerModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const lastResizeEndTime = useRef(0);
  
  // Database configuration hook with generic functions and handler factories
  const {
    saveConfiguration: saveToDatabase,
    loadConfiguration: loadFromDatabase,
    saveStatus,
    handleResetLayout: resetLayoutFromHook,
    handlePublishConfiguration,
    getDraftOrStaticConfiguration,
    resetStatus,
    validateSlotConfiguration,
    createSlot,
    handleSlotDrop: slotDropHandler,
    handleGridResize: gridResizeHandler,
    handleSlotHeightResize: slotHeightResizeHandler,
    handleTextChange: textChangeHandler,
    handleClassChange: classChangeHandler,
    // Generic handler factories
    createElementClickHandler,
    createSaveConfigurationHandler,
    createHandlerFactory
  } = useSlotConfiguration({
    pageType: 'cart',
    pageName: 'Cart',
    slotType: 'cart_layout',
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, 'cart_layout');
      }
    },
    onSave
  });

  // Initialize cart configuration - ONCE on mount only
  useEffect(() => {
    let isMounted = true;

    const initializeConfig = async () => {
      if (!isMounted || configurationLoadedRef.current) return;

      try {
        console.log('🔄 CartSlotsEditor: Starting configuration initialization...');

        // Use the hook function to get configuration (either draft or static)
        const configToUse = await getDraftOrStaticConfiguration();

        if (!configToUse) {
          throw new Error('Failed to load cart configuration');
        }

        // Transform database config if needed
        let finalConfig = configToUse;
        if (configToUse.slots && Object.keys(configToUse.slots).length > 0) {
          const dbConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
          if (dbConfig && dbConfig.slots && Object.keys(dbConfig.slots).length > 0) {
            console.log('✅ Found saved configuration in database:', dbConfig);
            finalConfig = dbConfig;
          }
        }

        // Simple one-time initialization
        if (isMounted) {
          setCartLayoutConfig(finalConfig);
          configurationLoadedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Failed to initialize cart configuration:', error);
        // Set a minimal fallback configuration
        setTimeout(() => {
          if (isMounted) {
            setCartLayoutConfig({
            page_name: 'Cart',
            slot_type: 'cart_layout',
            slots: {},
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              version: '1.0',
              pageType: 'cart',
              error: 'Failed to load configuration'
            },
            cmsBlocks: []
          });
          }
        }, 0);
      }
    };

    initializeConfig();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once on mount

  // Helper functions for slot styling
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = cartLayoutConfig && cartLayoutConfig.slots ? cartLayoutConfig.slots[slotId] : null;
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Save configuration using the generic factory
  const saveConfiguration = createSaveConfigurationHandler(
    cartLayoutConfig,
    setCartLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'cart'
  );


  // Handle element selection using generic factory
  const handleElementClick = createElementClickHandler(
    isResizing,
    lastResizeEndTime,
    setSelectedElement,
    setIsSidebarVisible
  );

  // Create handler factory with page-specific dependencies
  const handlerFactory = createHandlerFactory(setCartLayoutConfig, saveConfiguration);

  // Create all handlers using the factory
  const handleTextChange = handlerFactory.createTextChangeHandler(textChangeHandler);
  const handleClassChange = handlerFactory.createClassChangeHandler(classChangeHandler);

  // Debounced save ref
  const saveTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Create all handlers using the factory
  const handleGridResize = handlerFactory.createGridResizeHandler(gridResizeHandler, saveTimeoutRef);
  const handleSlotHeightResize = handlerFactory.createSlotHeightResizeHandler(slotHeightResizeHandler, saveTimeoutRef);
  const handleSlotDrop = handlerFactory.createSlotDropHandler(slotDropHandler, isDragOperationActiveRef);
  const handleResetLayout = handlerFactory.createResetLayoutHandler(resetLayoutFromHook, setLocalSaveStatus);
  const handleCreateSlot = handlerFactory.createSlotCreateHandler(createSlot);

  // Publish status state
  const [publishStatus, setPublishStatus] = useState('');

  // Handle publish configuration
  const handlePublish = useCallback(async () => {
    setPublishStatus('publishing');

    try {
      await handlePublishConfiguration();
      setPublishStatus('published');
      setTimeout(() => setPublishStatus(''), 3000);
    } catch (error) {
      console.error('❌ Failed to publish configuration:', error);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(''), 5000);
    }
  }, [handlePublishConfiguration]);

  // Debug mode - keyboard shortcut to run tests (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        console.log('🐛 Debug mode activated - Running drag and drop tests...');
        await runDragDropTests(handleSlotDrop, validateSlotConfiguration, cartLayoutConfig);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cartLayoutConfig, handleSlotDrop, validateSlotConfiguration]);

  // Main render - Clean and maintainable  
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'pr-80' : ''
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              {/* View Mode Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('empty')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'empty'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                  Empty Cart
                </button>
                <button
                  onClick={() => setViewMode('withProducts')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'withProducts'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" />
                  With Products
                </button>
              </div>

              {/* Edit mode controls */}
              {mode === 'edit' && (
                <>
                  {/* Save Status */}
                  {localSaveStatus && (
                    <div className={`flex items-center gap-2 text-sm ${
                      localSaveStatus === 'saving' ? 'text-blue-600' :
                      localSaveStatus === 'saved' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {localSaveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {localSaveStatus === 'saved' && '✓ Saved'}
                      {localSaveStatus === 'error' && '✗ Save Failed'}
                    </div>
                  )}

                  {/* Publish Status */}
                  {publishStatus && (
                    <div className={`flex items-center gap-2 text-sm ${
                      publishStatus === 'publishing' ? 'text-blue-600' :
                      publishStatus === 'published' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {publishStatus === 'publishing' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {publishStatus === 'published' && '🚀 Published'}
                      {publishStatus === 'error' && '✗ Publish Failed'}
                    </div>
                  )}

                  <Button onClick={() => saveConfiguration()} disabled={localSaveStatus === 'saving'} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>

                </>
              )}
            </div>
          </div>
        </div>
        {/* Cart Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <EditorToolbar
              showSlotBorders={showSlotBorders}
              onToggleBorders={() => setShowSlotBorders(!showSlotBorders)}
              onPublish={handlePublish}
              onResetLayout={() => setShowResetModal(true)}
              onAddSlot={() => setShowAddSlotModal(true)}
            />

            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig && cartLayoutConfig.slots && Object.keys(cartLayoutConfig.slots).length > 0 ? (
                <HierarchicalSlotRenderer
                  slots={cartLayoutConfig.slots}
                  parentId={null}
                  mode={mode}
                  viewMode={viewMode}
                  showBorders={showSlotBorders}
                  currentDragInfo={currentDragInfo}
                  setCurrentDragInfo={setCurrentDragInfo}
                  onElementClick={handleElementClick}
                  onGridResize={handleGridResize}
                  onSlotHeightResize={handleSlotHeightResize}
                  onSlotDrop={handleSlotDrop}
                  onResizeStart={() => setIsResizing(true)}
                  onResizeEnd={() => {
                    lastResizeEndTime.current = Date.now();
                    // Add a small delay to prevent click events from firing immediately after resize
                    setTimeout(() => setIsResizing(false), 100);
                  }}
                  selectedElementId={selectedElement ? selectedElement.getAttribute('data-slot-id') : null}
                />
              ) : (
                <div className="col-span-12 text-center py-12 text-gray-500">
                  {cartLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
                </div>
              )}
            </div>

            <CmsBlockRenderer position="cart_above_items" />

            <CmsBlockRenderer position="cart_below_items" />
          </div>
        </div>
      </div>

      {/* EditorSidebar - only show in edit mode */}
      {mode === 'edit' && isSidebarVisible && selectedElement && (
        <EditorSidebar
          selectedElement={selectedElement}
          slotId={selectedElement?.getAttribute ? selectedElement.getAttribute('data-slot-id') : null}
          slotConfig={cartLayoutConfig && cartLayoutConfig.slots && selectedElement?.getAttribute ? cartLayoutConfig.slots[selectedElement.getAttribute('data-slot-id')] : null}
          onTextChange={handleTextChange}
          onClassChange={handleClassChange}
          onInlineClassChange={handleClassChange}
          onClearSelection={() => {
            setSelectedElement(null);
            setIsSidebarVisible(false);
          }}
          isVisible={true}
        />
      )}

      {/* Add Slot Modal */}
      <AddSlotModal
        isOpen={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onCreateSlot={handleCreateSlot}
        onShowFilePicker={() => setShowFilePickerModal(true)}
      />

      {/* File Picker Modal */}
      <FilePickerModalWrapper
        isOpen={showFilePickerModal}
        onClose={() => setShowFilePickerModal(false)}
        onCreateSlot={handleCreateSlot}
        fileType="image"
      />

      {/* Reset Layout Confirmation Modal */}
      <ResetLayoutModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetLayout}
        isResetting={localSaveStatus === 'saving'}
      />
    </div>
  );
};

export default CartSlotsEditor;
