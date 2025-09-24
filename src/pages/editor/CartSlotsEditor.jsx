/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  Eye
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import {
  useSlotConfiguration,
  useTimestampFormatting,
  useDraftStatusManagement,
  useConfigurationChangeDetection,
  useBadgeRefresh,
  useClickOutsidePanel,
  usePreviewModeHandlers,
  usePublishPanelHandlers,
  useConfigurationInitialization,
  usePublishHandler,
  useResetLayoutHandler,
  useSaveConfigurationHandler,
  usePublishPanelHandlerWrappers,
  useEditorInitialization,
  useViewModeAdjustments
} from '@/hooks/useSlotConfiguration';
import {
  HierarchicalSlotRenderer,
  EditorToolbar,
  AddSlotModal,
  ResetLayoutModal,
  FilePickerModalWrapper,
  EditModeControls,
  CodeModal,
  PublishPanelToggle,
  TimestampsRow,
  ResponsiveContainer
} from '@/components/editor/slot/SlotComponents';
import {
  CartHeaderSlot,
  CartItemsSlot,
  CartSummarySlot,
  CartCouponSlot,
  CartEmptyStateSlot
} from '@/components/editor/slot/slotComponentsCart';
import slotConfigurationService from '@/services/slotConfigurationService';


// Main CartSlotsEditor component - mirrors Cart.jsx structure exactly

const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'emptyCart'
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

  // Basic editor state
  const isDragOperationActiveRef = useRef(false);
  const [viewMode, setViewMode] = useState(propViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSlotBorders, setShowSlotBorders] = useState(true);
  const [localSaveStatus, setLocalSaveStatus] = useState('');
  const [currentViewport, setCurrentViewport] = useState('desktop');
  const [isResizing, setIsResizing] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showFilePickerModal, setShowFilePickerModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const lastResizeEndTime = useRef(0);
  const publishPanelRef = useRef(null);

  // Use extracted hooks
  const { formatTimeAgo } = useTimestampFormatting();
  const {
    draftConfig, setDraftConfig,
    latestPublished, setLatestPublished,
    setConfigurationStatus,
    hasUnsavedChanges, setHasUnsavedChanges,
    loadDraftStatus
  } = useDraftStatusManagement(getSelectedStoreId(), 'cart');

  // Database configuration hook with generic functions and handler factories
  const {
    handleResetLayout: resetLayoutFromHook,
    handlePublishConfiguration,
    getDraftConfiguration,
    createSlot,
    handleSlotDrop: slotDropHandler,
    handleSlotDelete: slotDeleteHandler,
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

  // Configuration initialization hook
  const { initializeConfig, configurationLoadedRef } = useConfigurationInitialization(
    'cart', 'Cart', 'cart_layout', getSelectedStoreId, getDraftConfiguration, loadDraftStatus
  );

  // Use generic editor initialization
  useEditorInitialization(initializeConfig, setCartLayoutConfig);

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, cartLayoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, 'cart');

  // Compute when Publish button should be enabled
  // Only enable if there are actual unsaved changes to publish
  const canPublish = hasUnsavedChanges;

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    cartLayoutConfig,
    setCartLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'cart'
  );

  // Use generic save configuration handler
  const { saveConfiguration } = useSaveConfigurationHandler(
    'cart',
    baseSaveConfiguration,
    cartLayoutConfig,
    {
      setConfigurationStatus,
      updateLastSavedConfig
    }
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

  // Sample cart data for editor preview
  const sampleCartContext = {
    cartItems: viewMode === 'withProducts' ? [
      {
        id: 1,
        product_id: 1,
        quantity: 2,
        price: 29.99,
        product: { id: 1, name: 'Sample Product 1', image_url: '/sample-product.jpg' },
        selected_options: []
      },
      {
        id: 2,
        product_id: 2,
        quantity: 1,
        price: 49.99,
        product: { id: 2, name: 'Sample Product 2', image_url: '/sample-product2.jpg' },
        selected_options: [{ name: 'Size', value: 'Large', price: 5.00 }]
      }
    ] : [],
    subtotal: 109.97,
    discount: 10.00,
    tax: 8.00,
    total: 107.97,
    currencySymbol: '$',
    appliedCoupon: null,
    couponCode: '',
    setCouponCode: () => {},
    handleApplyCoupon: () => {},
    handleRemoveCoupon: () => {},
    updateQuantity: () => {},
    removeItem: () => {},
    handleCheckout: () => {},
    calculateItemTotal: (item) => item.price * item.quantity,
    safeToFixed: (value) => value.toFixed(2)
  };

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
  const handleSlotDelete = handlerFactory.createSlotDeleteHandler(slotDeleteHandler);
  const baseHandleResetLayout = handlerFactory.createResetLayoutHandler(resetLayoutFromHook, setLocalSaveStatus);

  // Use generic reset layout handler
  const { handleResetLayout } = useResetLayoutHandler(
    'cart',
    baseHandleResetLayout,
    cartLayoutConfig,
    {
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );
  const handleCreateSlot = handlerFactory.createSlotCreateHandler(createSlot);

  // Use generic publish handler
  const { handlePublish, publishStatus } = usePublishHandler(
    'cart',
    cartLayoutConfig,
    handlePublishConfiguration,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );

  // Click outside and preview mode handlers
  useClickOutsidePanel(showPublishPanel, publishPanelRef, setShowPublishPanel);
  usePreviewModeHandlers(showPreview, setIsSidebarVisible, setSelectedElement, setShowPublishPanel);

  // Publish panel handlers
  const basePublishPanelHandlers = usePublishPanelHandlers(
    'cart', getSelectedStoreId, getDraftConfiguration, setCartLayoutConfig, slotConfigurationService
  );

  // Use generic publish panel handler wrappers
  const { handlePublishPanelPublished, handlePublishPanelReverted } = usePublishPanelHandlerWrappers(
    'cart',
    basePublishPanelHandlers,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setDraftConfig,
      setConfigurationStatus,
      setHasUnsavedChanges,
      setLatestPublished,
      setPageConfig: setCartLayoutConfig,
      updateLastSavedConfig
    }
  );

  // Cart-specific view mode adjustments
  const cartAdjustmentRules = {
    content_area: {
      colSpan: {
        shouldAdjust: (currentValue) => {
          // Check if colSpan needs to be converted from number to object format
          return typeof currentValue === 'number';
        },
        newValue: {
          emptyCart: 12,
          withProducts: 'col-span-12 sm:col-span-12 lg:col-span-8'
        }
      }
    }
  };

  // Use generic view mode adjustments
  useViewModeAdjustments(cartLayoutConfig, setCartLayoutConfig, viewMode, cartAdjustmentRules);

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
                  onClick={() => setViewMode('emptyCart')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'emptyCart'
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
                <EditModeControls
                  localSaveStatus={localSaveStatus}
                  publishStatus={publishStatus}
                  saveConfiguration={saveConfiguration}
                  onPublish={handlePublish}
                  hasChanges={canPublish}
                />
              )}
            </div>

            {/* Preview and Publish Buttons - Far Right */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant={showPreview ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1.5"
                title={showPreview ? "Exit Preview" : "Preview without editing tools"}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Exit Preview" : "Preview"}
              </Button>

              <PublishPanelToggle
                hasUnsavedChanges={hasUnsavedChanges}
                showPublishPanel={showPublishPanel}
                onTogglePublishPanel={setShowPublishPanel}
                onClosePublishPanel={() => {
                  setIsSidebarVisible(false);
                  setSelectedElement(null);
                }}
              />
            </div>
          </div>
        </div>
        {/* Cart Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 cart-page"
          style={{ backgroundColor: '#f9fafb' }}
        >
          {/* Timestamps Row */}
          <TimestampsRow
            draftConfig={draftConfig}
            latestPublished={latestPublished}
            formatTimeAgo={formatTimeAgo}
            currentViewport={currentViewport}
            onViewportChange={setCurrentViewport}
          />

          {!showPreview && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <EditorToolbar
                showSlotBorders={showSlotBorders}
                onToggleBorders={() => setShowSlotBorders(!showSlotBorders)}
                onResetLayout={() => setShowResetModal(true)}
                onShowCode={() => setShowCodeModal(true)}
                onAddSlot={() => setShowAddSlotModal(true)}
              />
            </div>
          )}

          <ResponsiveContainer
            viewport={currentViewport}
            className="bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

            <div className="grid grid-cols-12 gap-2 auto-rows-min">
              {cartLayoutConfig && cartLayoutConfig.slots && Object.keys(cartLayoutConfig.slots).length > 0 ? (
                <HierarchicalSlotRenderer
                  slots={cartLayoutConfig.slots}
                  parentId={null}
                  mode={showPreview ? 'view' : mode}
                  viewMode={viewMode}
                  showBorders={showPreview ? false : showSlotBorders}
                  currentDragInfo={currentDragInfo}
                  setCurrentDragInfo={setCurrentDragInfo}
                  onElementClick={showPreview ? null : handleElementClick}
                  onGridResize={showPreview ? null : handleGridResize}
                  onSlotHeightResize={showPreview ? null : handleSlotHeightResize}
                  onSlotDrop={showPreview ? null : handleSlotDrop}
                  onSlotDelete={showPreview ? null : handleSlotDelete}
                  onResizeStart={showPreview ? null : () => setIsResizing(true)}
                  onResizeEnd={showPreview ? null : () => {
                    lastResizeEndTime.current = Date.now();
                    setTimeout(() => setIsResizing(false), 100);
                  }}
                  selectedElementId={showPreview ? null : (selectedElement ? selectedElement.getAttribute('data-slot-id') : null)}
                  setPageConfig={setCartLayoutConfig}
                  saveConfiguration={saveConfiguration}
                  saveTimeoutRef={saveTimeoutRef}
                  customSlotRenderer={(slot) => {
                    const componentMap = {
                      'header_title': CartHeaderSlot,
                      'empty_cart_container': CartEmptyStateSlot,
                      'cart_items_container': CartItemsSlot,
                      'coupon_container': CartCouponSlot,
                      'order_summary_container': CartSummarySlot
                    };
                    const SlotComponent = componentMap[slot.id];
                    if (SlotComponent) {
                      return (
                        <SlotComponent
                          cartContext={sampleCartContext}
                          content={slot.content}
                          config={{ viewMode }}
                        />
                      );
                    }
                    return null;
                  }}
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* EditorSidebar - only show in edit mode and not in preview */}
      {mode === 'edit' && !showPreview && isSidebarVisible && selectedElement && (
        <EditorSidebar
          selectedElement={selectedElement}
          slotId={selectedElement?.getAttribute ? selectedElement.getAttribute('data-slot-id') : null}
          slotConfig={(() => {
            const slotId = selectedElement?.getAttribute ? selectedElement.getAttribute('data-slot-id') : null;
            const config = cartLayoutConfig && cartLayoutConfig.slots && slotId ? cartLayoutConfig.slots[slotId] : null;
            console.log('🏗️ CartSlotsEditor: Passing slotConfig to EditorSidebar:', { slotId, config, cartLayoutConfig });
            return config;
          })()}
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

      {/* Floating Publish Panel */}
      {showPublishPanel && (
        <div ref={publishPanelRef} className="fixed top-20 right-6 z-50 w-80">
          <PublishPanel
            draftConfig={draftConfig}
            storeId={getSelectedStoreId()}
            pageType="cart"
            onPublished={handlePublishPanelPublished}
            onReverted={handlePublishPanelReverted}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      )}

      {/* Code Modal */}
      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        configuration={cartLayoutConfig}
        localSaveStatus={localSaveStatus}
        onSave={async (newConfiguration) => {
          console.log('🎯 CodeModal onSave called with configuration:', newConfiguration);
          setCartLayoutConfig(newConfiguration);
          setHasUnsavedChanges(true);
          console.log('🚀 Calling saveConfiguration...');
          await saveConfiguration(newConfiguration);
          console.log('✅ Save completed, closing modal');
          setShowCodeModal(false);
        }}
      />
    </div>
  );
};

export default CartSlotsEditor;
