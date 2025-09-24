/**
 * Clean ProductSlotsEditor - Based on CategorySlotsEditor structure
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure matching CategorySlotsEditor
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Package,
  Eye
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { generateMockProductContext } from '@/utils/mockProductData';
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
  ProductGallerySlot,
  ProductInfoSlot,
  ProductOptionsSlot,
  ProductActionsSlot,
  ProductTabsSlot,
  ProductRecommendationsSlot,
  ProductBreadcrumbsSlot
} from '@/components/editor/slot/slotComponentsProduct';
import slotConfigurationService from '@/services/slotConfigurationService';

// Main ProductSlotsEditor component - mirrors CategorySlotsEditor structure exactly
const ProductSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'default'
}) => {
  console.log('🚀 ProductSlotsEditor COMPONENT LOADED');
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // State management - Initialize with empty config to avoid React error
  const [productLayoutConfig, setProductLayoutConfig] = useState({
    page_name: 'Product Detail',
    slot_type: 'product_layout',
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: 'product'
    },
    cmsBlocks: []
  });

  // Basic editor state
  const isDragOperationActiveRef = useRef(false);
  const publishPanelRef = useRef(null);
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
  const [isUnlocked, setIsUnlocked] = useState(true);

  // Generate mock product context for preview
  const [productContext, setProductContext] = useState(null);

  useEffect(() => {
    const mockContext = generateMockProductContext();
    setProductContext(mockContext);
  }, []);

  // Use extracted hooks
  const { formatTimeAgo } = useTimestampFormatting();
  const {
    draftConfig, setDraftConfig,
    latestPublished, setLatestPublished,
    setConfigurationStatus,
    hasUnsavedChanges, setHasUnsavedChanges,
    loadDraftStatus
  } = useDraftStatusManagement(getSelectedStoreId(), 'product');

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
    pageType: 'product',
    pageName: 'Product Detail',
    slotType: 'product_layout',
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, 'product_layout');
      }
    },
    onSave
  });

  // Configuration initialization hook
  const { initializeConfig, configurationLoadedRef } = useConfigurationInitialization(
    'product', 'Product Detail', 'product_layout', getSelectedStoreId, getDraftConfiguration, loadDraftStatus
  );

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, productLayoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, 'product');

  // Click outside and preview mode handlers
  useClickOutsidePanel(showPublishPanel, publishPanelRef, setShowPublishPanel);
  usePreviewModeHandlers(showPreview, setIsSidebarVisible, setSelectedElement, setShowPublishPanel);

  // Publish panel handlers
  const basePublishPanelHandlers = usePublishPanelHandlers(
    'product', getSelectedStoreId, getDraftConfiguration, setProductLayoutConfig, slotConfigurationService
  );

  // Use generic publish panel handler wrappers
  const { handlePublishPanelPublished, handlePublishPanelReverted } = usePublishPanelHandlerWrappers(
    'product',
    basePublishPanelHandlers,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setDraftConfig,
      setConfigurationStatus,
      setHasUnsavedChanges,
      setLatestPublished,
      setPageConfig: setProductLayoutConfig,
      updateLastSavedConfig
    }
  );

  // Initialize editor when component mounts or store changes
  useEffect(() => {
    initializeConfig();
  }, [initializeConfig]);

  // Handle element selection for sidebar
  const handleElementClick = useCallback((event) => {
    if (isResizing || isDragOperationActiveRef.current) return;

    event.stopPropagation();
    const clickedElement = event.currentTarget;

    console.log('🎯 ProductSlotsEditor: Element clicked:', {
      tagName: clickedElement.tagName,
      className: clickedElement.className,
      slotId: clickedElement.getAttribute('data-slot-id'),
      element: clickedElement
    });

    setSelectedElement(clickedElement);
    setIsSidebarVisible(true);
  }, [isResizing]);

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedElement(null);
    setIsSidebarVisible(false);
  }, []);

  // Use the handlers from the main hook
  const handleClassChange = classChangeHandler;
  const handleInlineClassChange = classChangeHandler; // Same handler
  const handleTextChange = textChangeHandler;

  // Component validation function
  const validateSlotConfiguration = useCallback((config) => {
    const errors = [];

    if (!config.slots || Object.keys(config.slots).length === 0) {
      errors.push('No slots defined');
    }

    // Check for required product page slots
    const requiredSlots = ['product_title', 'product_price', 'add_to_cart_button'];
    for (const slot of requiredSlots) {
      if (!config.slots[slot]) {
        errors.push(`Missing required slot: ${slot}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  if (!productContext) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading product editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" onClick={handleClickOutside}>
      {/* Editor Toolbar */}
      <EditorToolbar
        mode={mode}
        viewMode={viewMode}
        currentViewport={currentViewport}
        showSlotBorders={showSlotBorders}
        localSaveStatus={localSaveStatus}
        onPreviewModeToggle={handlePreviewModeToggle}
        onViewportChange={handleViewportChange}
        onToggleSlotBorders={() => setShowSlotBorders(!showSlotBorders)}
        onAddSlot={() => setShowAddSlotModal(true)}
        onFilePicker={() => setShowFilePickerModal(true)}
        onShowCode={() => setShowCodeModal(true)}
        pageType="product"
        availableViews={[
          { id: 'default', label: 'Default View', icon: Package }
        ]}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Edit Mode Controls */}
          {mode === 'edit' && (
            <EditModeControls
              isUnlocked={isUnlocked}
              onToggleUnlock={() => setIsUnlocked(!isUnlocked)}
              statusBadgeText={getStatusBadgeText()}
              statusBadgeVariant={getStatusBadgeVariant()}
              shouldShowChangeIndicator={shouldShowChangeIndicator()}
            />
          )}

          {/* Product Detail Preview */}
          <ResponsiveContainer currentViewport={currentViewport}>
            <div className={`min-h-screen bg-white ${getResponsiveClasses()}`}>
              {/* Flash Messages Area */}
              <div id="flash-messages-area"></div>

              {/* CMS Block - Product Above */}
              <CmsBlockRenderer position="product_above" />

              {/* Check if configuration is loaded */}
              {(() => {
                return productLayoutConfig && productLayoutConfig.slots && Object.keys(productLayoutConfig.slots).length > 0;
              })() ? (
                <HierarchicalSlotRenderer
                  slots={productLayoutConfig.slots}
                  parentId={null}
                  mode={mode}
                  viewMode={viewMode}
                  showBorders={showSlotBorders}
                  currentDragInfo={currentDragInfo}
                  setCurrentDragInfo={setCurrentDragInfo}
                  onElementClick={handleElementClick}
                  onGridResize={gridResizeHandler}
                  onSlotHeightResize={slotHeightResizeHandler}
                  onSlotDrop={slotDropHandler}
                  onSlotDelete={slotDeleteHandler}
                  onResizeStart={() => setIsResizing(true)}
                  onResizeEnd={() => {
                    setTimeout(() => setIsResizing(false), 100);
                  }}
                  selectedElementId={selectedElement && typeof selectedElement.getAttribute === 'function' ? selectedElement.getAttribute('data-slot-id') : null}
                  setPageConfig={setProductLayoutConfig}
                  saveConfiguration={createSaveConfigurationHandler(setProductLayoutConfig, updateLastSavedConfig)}
                  context={productContext}
                  slotComponents={{
                    ProductGallerySlot,
                    ProductInfoSlot,
                    ProductOptionsSlot,
                    ProductActionsSlot,
                    ProductTabsSlot,
                    ProductRecommendationsSlot,
                    ProductBreadcrumbsSlot,
                    // Render function fallback for unknown slots
                    defaultSlotRenderer: (slot, context) => {
                      // For container slots, render children if they exist
                      if (slot.type === 'container') {
                        return (
                          <div className={slot.className || "w-full"}>
                            {/* Container content would be rendered by HierarchicalSlotRenderer */}
                          </div>
                        );
                      }

                      return null;
                    }
                  }}
                />
              ) : (
                <div className="col-span-12 text-center py-12 text-gray-500">
                  {productLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
                </div>
              )}

              {/* CMS Block - Product Below */}
              <CmsBlockRenderer position="product_below" />
            </div>
          </ResponsiveContainer>

          {/* Timestamps Row */}
          <TimestampsRow
            formattedLastModified={formattedLastModified}
            formattedLastPublished={formattedLastPublished}
          />
        </div>

        {/* Publish Panel Toggle */}
        <PublishPanelToggle
          showPublishPanel={showPublishPanel}
          onTogglePublishPanel={handleTogglePublishPanel}
          draftStatus={draftStatus}
          hasDraftConfiguration={hasDraftConfiguration}
        />

        {/* Publish Panel */}
        {showPublishPanel && (
          <PublishPanel
            onPublish={handlePublishWithSave}
            onCancel={handleCancelPublish}
            onResetLayout={handleResetLayoutWithModal}
            draftStatus={draftStatus}
            lastModified={formattedLastModified}
            lastPublished={formattedLastPublished}
            pageType="product"
            configChangeCount={configChangeCount}
          />
        )}

        {/* Editor Sidebar */}
        {mode === 'edit' && (
          <EditorSidebar
            selectedElement={selectedElement}
            onClearSelection={handleClearSelection}
            onClassChange={handleClassChange}
            onInlineClassChange={handleInlineClassChange}
            onTextChange={handleTextChange}
            slotId={selectedElement?.getAttribute?.('data-slot-id')}
            slotConfig={selectedElement ? slotConfigurations[selectedElement.getAttribute('data-slot-id')] : null}
            allSlots={slotConfigurations}
            isVisible={isSidebarVisible}
          />
        )}
      </div>

      {/* Modals */}
      <AddSlotModal
        isOpen={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onAddSlot={(slotData) => {
          console.log('Adding slot:', slotData);
          setShowAddSlotModal(false);
        }}
        pageType="product"
      />

      <FilePickerModalWrapper
        isOpen={showFilePickerModal}
        onClose={() => setShowFilePickerModal(false)}
        pageType="product"
      />

      <ResetLayoutModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetLayout}
        pageType="product"
      />

      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        slotConfigurations={slotConfigurations}
        pageType="product"
      />
    </div>
  );
};

export default ProductSlotsEditor;