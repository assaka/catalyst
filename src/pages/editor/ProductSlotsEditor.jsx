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
  const lastResizeEndTime = useRef(0);
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

  // Use generic editor initialization
  useEditorInitialization(initializeConfig, setProductLayoutConfig);

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, productLayoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, 'product');

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    productLayoutConfig,
    setProductLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'product'
  );

  // Use generic save configuration handler
  const { saveConfiguration } = useSaveConfigurationHandler(
    'product',
    baseSaveConfiguration,
    productLayoutConfig,
    {
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );

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


  // Handle element selection using generic factory
  const handleElementClick = createElementClickHandler(
    isResizing,
    lastResizeEndTime,
    setSelectedElement,
    setIsSidebarVisible
  );

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedElement(null);
    setIsSidebarVisible(false);
  }, []);

  // Use the handlers from the main hook
  const handleClassChange = classChangeHandler;
  const handleInlineClassChange = classChangeHandler; // Same handler
  const handleTextChange = textChangeHandler;

  // Simple handler functions
  const handleClickOutside = useCallback((event) => {
    // Prevent closing when clicking on toolbar or panels
    if (event.target.closest('.editor-toolbar') || event.target.closest('.publish-panel')) {
      return;
    }
  }, []);

  const handlePreviewModeToggle = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);

  const handleViewportChange = useCallback((viewport) => {
    setCurrentViewport(viewport);
  }, []);

  // Status badge functions and computed values
  const getStatusBadgeText = useCallback(() => {
    if (hasUnsavedChanges) {
      return 'Unsaved Changes';
    }
    if (draftConfig?.status === 'published') {
      return 'Published';
    }
    return 'Draft';
  }, [hasUnsavedChanges, draftConfig?.status]);

  const getResponsiveClasses = useCallback(() => {
    const baseClasses = 'transition-all duration-300';
    switch (currentViewport) {
      case 'mobile':
        return `${baseClasses} max-w-sm mx-auto`;
      case 'tablet':
        return `${baseClasses} max-w-2xl mx-auto`;
      default:
        return `${baseClasses} max-w-full`;
    }
  }, [currentViewport]);

  // Formatted timestamps
  const formattedLastModified = useMemo(() => {
    return draftConfig?.updated_at ? formatTimeAgo(new Date(draftConfig.updated_at)) : 'Never';
  }, [draftConfig?.updated_at, formatTimeAgo]);

  const formattedLastPublished = useMemo(() => {
    return latestPublished?.updated_at ? formatTimeAgo(new Date(latestPublished.updated_at)) : 'Never';
  }, [latestPublished?.updated_at, formatTimeAgo]);

  // Publish panel toggle handlers
  const handleTogglePublishPanel = useCallback(() => {
    setShowPublishPanel(!showPublishPanel);
  }, [showPublishPanel]);

  const handlePublishWithSave = useCallback(async () => {
    return await handlePublishPanelPublished();
  }, [handlePublishPanelPublished]);

  const handleCancelPublish = useCallback(() => {
    setShowPublishPanel(false);
  }, []);

  const handleResetLayout = resetLayoutFromHook;

  // Missing state variables and computed values
  const slotConfigurations = useMemo(() => {
    return productLayoutConfig?.slots || {};
  }, [productLayoutConfig?.slots]);

  const draftStatus = useMemo(() => {
    return draftConfig?.status || 'draft';
  }, [draftConfig?.status]);

  const hasDraftConfiguration = useMemo(() => {
    return draftConfig != null;
  }, [draftConfig]);

  const configChangeCount = useMemo(() => {
    return hasUnsavedChanges ? 1 : 0;
  }, [hasUnsavedChanges]);

  // Use generic publish handler
  const { handlePublish, publishStatus } = usePublishHandler(
    'product',
    productLayoutConfig,
    handlePublishConfiguration,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );

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
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'pr-80' : ''
    }`} onClick={handleClickOutside}>
      {/* Main Editor Area */}
      <div className="flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              {/* View Mode Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('default')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'default'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" />
                  Default View
                </button>
              </div>

              {/* Edit mode controls */}
              {mode === 'edit' && (
                <EditModeControls
                  localSaveStatus={localSaveStatus}
                  publishStatus={publishStatus}
                  saveConfiguration={saveConfiguration}
                  onPublish={handlePublish}
                  hasChanges={hasUnsavedChanges}
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

        {/* Product Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 product-page overflow-y-auto max-h-[calc(100vh-80px)]"
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
              {/* Flash Messages Area */}
              <div id="flash-messages-area"></div>

              {/* CMS Block - Product Above */}
              <CmsBlockRenderer position="product_above" />

              {/* Product Grid Layout */}
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {productLayoutConfig && productLayoutConfig.slots && Object.keys(productLayoutConfig.slots).length > 0 ? (
                  <HierarchicalSlotRenderer
                    slots={productLayoutConfig.slots}
                    parentId={null}
                    mode={showPreview ? 'view' : mode}
                    viewMode={viewMode}
                    showBorders={showPreview ? false : showSlotBorders}
                    currentDragInfo={currentDragInfo}
                    setCurrentDragInfo={setCurrentDragInfo}
                    onElementClick={showPreview ? null : handleElementClick}
                    onGridResize={showPreview ? null : gridResizeHandler}
                    onSlotHeightResize={showPreview ? null : slotHeightResizeHandler}
                    onSlotDrop={showPreview ? null : slotDropHandler}
                    onSlotDelete={showPreview ? null : slotDeleteHandler}
                    onResizeStart={showPreview ? null : () => setIsResizing(true)}
                    onResizeEnd={showPreview ? null : () => {
                      lastResizeEndTime.current = Date.now();
                      setTimeout(() => setIsResizing(false), 100);
                    }}
                    selectedElementId={showPreview ? null : (selectedElement ? selectedElement.getAttribute('data-slot-id') : null)}
                    setPageConfig={setProductLayoutConfig}
                    saveConfiguration={saveConfiguration}
                    context={productContext}
                    slotComponents={{
                      ProductGallerySlot,
                      ProductInfoSlot,
                      ProductOptionsSlot,
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
              </div>

              {/* CMS Block - Product Below */}
              <CmsBlockRenderer position="product_below" />
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
            const config = productLayoutConfig && productLayoutConfig.slots && slotId ? productLayoutConfig.slots[slotId] : null;
            console.log('🏗️ ProductSlotsEditor: Passing slotConfig to EditorSidebar:', { slotId, config, productLayoutConfig });
            return config;
          })()}
          allSlots={productLayoutConfig?.slots || {}}
          onClearSelection={handleClearSelection}
          onClassChange={handleClassChange}
          onInlineClassChange={handleInlineClassChange}
          onTextChange={handleTextChange}
          isVisible={isSidebarVisible}
        />
      )}

      {/* Floating Publish Panel */}
      {showPublishPanel && (
        <div ref={publishPanelRef} className="fixed top-20 right-6 z-50 w-80">
          <PublishPanel
            draftConfig={draftConfig}
            storeId={getSelectedStoreId()}
            pageType="product"
            onPublished={handlePublishPanelPublished}
            onReverted={handlePublishPanelReverted}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      )}

      {/* Add Slot Modal */}
      <AddSlotModal
        isOpen={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onAddSlot={(slotData) => {
          console.log('Adding slot:', slotData);
          setShowAddSlotModal(false);
        }}
        pageType="product"
      />

      {/* Reset Layout Confirmation Modal */}
      <ResetLayoutModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetLayout}
        isResetting={localSaveStatus === 'saving'}
      />

      {/* Code Modal */}
      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        configuration={productLayoutConfig}
        localSaveStatus={localSaveStatus}
        onSave={async (newConfiguration) => {
          console.log('🎯 CodeModal onSave called with configuration:', newConfiguration);
          setProductLayoutConfig(newConfiguration);
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

export default ProductSlotsEditor;