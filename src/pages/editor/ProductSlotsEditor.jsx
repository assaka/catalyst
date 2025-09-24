/**
 * Clean ProductSlotsEditor - Based on CategorySlotsEditor structure
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure matching CategorySlotsEditor
 */

import { useState, useEffect, useRef, useCallback } from "react";
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

  // Generate mock product context for preview
  const [productContext, setProductContext] = useState(null);

  useEffect(() => {
    const mockContext = generateMockProductContext();
    setProductContext(mockContext);
  }, []);

  // Slot configuration hooks
  const {
    slotConfigurations,
    setSlotConfigurations,
    draftStatus,
    setDraftStatus,
    publishedConfig,
    setPublishedConfig,
    hasDraftConfiguration,
    setHasDraftConfiguration,
    lastModified,
    setLastModified,
    lastPublished,
    setLastPublished,
    configChangeCount,
    setConfigChangeCount,
    isUnlocked,
    setIsUnlocked
  } = useSlotConfiguration('product');

  const {
    formattedLastModified,
    formattedLastPublished
  } = useTimestampFormatting(lastModified, lastPublished);

  const {
    updateDraftStatus,
    getStatusBadgeText,
    getStatusBadgeVariant
  } = useDraftStatusManagement(draftStatus, hasDraftConfiguration);

  const {
    shouldShowChangeIndicator
  } = useConfigurationChangeDetection(configChangeCount);

  const {
    refreshBadge
  } = useBadgeRefresh(selectedStore?.id, 'product');

  const {
    handleClickOutside
  } = useClickOutsidePanel(setShowPublishPanel);

  const {
    handlePreviewModeToggle,
    handleViewportChange
  } = usePreviewModeHandlers(mode, setCurrentViewport, currentViewport);

  const {
    handleTogglePublishPanel,
    handleClosePublishPanel
  } = usePublishPanelHandlers(setShowPublishPanel, showPublishPanel);

  const {
    initializeConfiguration
  } = useConfigurationInitialization(
    selectedStore,
    'product',
    setSlotConfigurations,
    setDraftStatus,
    setPublishedConfig,
    setHasDraftConfiguration,
    setLastModified,
    setLastPublished,
    setProductLayoutConfig
  );

  const {
    handlePublish
  } = usePublishHandler(
    selectedStore,
    'product',
    slotConfigurations,
    setDraftStatus,
    setLastPublished,
    setConfigChangeCount,
    refreshBadge
  );

  const {
    handleResetLayout
  } = useResetLayoutHandler(
    selectedStore,
    'product',
    setSlotConfigurations,
    setDraftStatus,
    setConfigChangeCount,
    setProductLayoutConfig,
    setShowResetModal
  );

  const {
    saveConfiguration
  } = useSaveConfigurationHandler(
    selectedStore,
    'product',
    slotConfigurations,
    productLayoutConfig,
    setLocalSaveStatus,
    updateDraftStatus,
    setConfigChangeCount
  );

  const {
    handlePublishWithSave,
    handleCancelPublish,
    handleResetLayoutWithModal
  } = usePublishPanelHandlerWrappers(
    saveConfiguration,
    handlePublish,
    handleClosePublishPanel,
    handleResetLayout,
    setShowResetModal
  );

  const {
    handleEditorInitialization
  } = useEditorInitialization(
    selectedStore,
    initializeConfiguration
  );

  const {
    getResponsiveClasses,
    getViewportSpecificClasses
  } = useViewModeAdjustments(currentViewport, viewMode);

  // Initialize editor when component mounts or store changes
  useEffect(() => {
    handleEditorInitialization();
  }, [handleEditorInitialization]);

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

  // Handle class changes from sidebar
  const handleClassChange = useCallback((slotId, newClassName, styles = {}, metadata = null) => {
    console.log('🎨 ProductSlotsEditor: Class change requested:', { slotId, newClassName, styles, metadata });

    setSlotConfigurations(prev => {
      const updated = {
        ...prev,
        [slotId]: {
          ...prev[slotId],
          className: newClassName,
          styles: { ...(prev[slotId]?.styles || {}), ...styles },
          ...(metadata && { metadata: { ...(prev[slotId]?.metadata || {}), ...metadata } })
        }
      };
      console.log('🔄 ProductSlotsEditor: Updated slot configurations:', updated);
      return updated;
    });

    // Auto-save after a delay
    setTimeout(() => saveConfiguration(), 500);
  }, [saveConfiguration, setSlotConfigurations]);

  // Handle inline class changes (alignment, quick styles)
  const handleInlineClassChange = useCallback((slotId, newClassName, styles = {}, immediate = false) => {
    console.log('⚡ ProductSlotsEditor: Inline class change:', { slotId, newClassName, styles, immediate });

    setSlotConfigurations(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        className: newClassName,
        styles: { ...(prev[slotId]?.styles || {}), ...styles }
      }
    }));

    // Auto-save immediately or after delay
    if (immediate) {
      saveConfiguration();
    } else {
      setTimeout(() => saveConfiguration(), 300);
    }
  }, [saveConfiguration, setSlotConfigurations]);

  // Handle text content changes
  const handleTextChange = useCallback((slotId, newContent) => {
    console.log('📝 ProductSlotsEditor: Text change requested:', { slotId, newContent });

    setSlotConfigurations(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        content: newContent
      }
    }));

    // Auto-save after a delay
    setTimeout(() => saveConfiguration(), 1000);
  }, [saveConfiguration, setSlotConfigurations]);

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

              {/* Hierarchical Slot Renderer */}
              <HierarchicalSlotRenderer
                slotConfigurations={slotConfigurations}
                isEditMode={mode === 'edit'}
                showBorders={showSlotBorders}
                onElementClick={handleElementClick}
                isDragOperationActiveRef={isDragOperationActiveRef}
                currentDragInfo={currentDragInfo}
                setCurrentDragInfo={setCurrentDragInfo}
                context={productContext}
                pageType="product"
                slotComponents={{
                  ProductGallerySlot,
                  ProductInfoSlot,
                  ProductOptionsSlot,
                  ProductActionsSlot,
                  ProductTabsSlot,
                  ProductRecommendationsSlot,
                  ProductBreadcrumbsSlot
                }}
                validateConfiguration={validateSlotConfiguration}
              />

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