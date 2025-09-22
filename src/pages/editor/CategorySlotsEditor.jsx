/**
 * Clean CategorySlotsEditor - Error-free version based on CartSlotsEditor.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import {
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
import { CategorySlotRenderer } from '@/components/storefront/CategorySlotRenderer';
import slotConfigurationService from '@/services/slotConfigurationService';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';

// Simple ErrorBoundary component to handle context issues
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.warn('CategorySlotRenderer error in editor (expected):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Preview mode temporarily unavailable. Use Preview button for full preview.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}


// Main CategorySlotsEditor component - mirrors CartSlotsEditor.jsx structure exactly

const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // Validation function now provided by useSlotConfiguration hook

  // State management - Initialize with config from category-config.js
  const [categoryLayoutConfig, setCategoryLayoutConfig] = useState({
    page_name: categoryConfig.page_name,
    slot_type: categoryConfig.slot_type,
    slots: categoryConfig.slots,
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: 'category'
    },
    cmsBlocks: categoryConfig.cmsBlocks || [],
    views: categoryConfig.views,
    microslots: categoryConfig.microslots
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
  } = useDraftStatusManagement(getSelectedStoreId(), 'category');

  // Database configuration hook with generic functions and handler factories
  const {
    handleResetLayout: resetLayoutFromHook,
    handlePublishConfiguration,
    getDraftOrStaticConfiguration,
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
    pageType: 'category',
    pageName: 'Category',
    slotType: 'category_layout',
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, 'category_layout');
      }
    },
    onSave
  });

  // Configuration initialization hook with base config
  const { initializeConfig, configurationLoadedRef } = useConfigurationInitialization(
    'category', 'Category', 'category_layout', getSelectedStoreId, getDraftOrStaticConfiguration, loadDraftStatus, categoryConfig
  );

  // Use generic editor initialization
  useEditorInitialization(initializeConfig, setCategoryLayoutConfig);

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, categoryLayoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, 'category');

  // Compute when Publish button should be enabled
  // Only enable if there are actual unsaved changes to publish
  const canPublish = hasUnsavedChanges;

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    categoryLayoutConfig,
    setCategoryLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'category'
  );

  // Use generic save configuration handler
  const { saveConfiguration } = useSaveConfigurationHandler(
    'category',
    baseSaveConfiguration,
    categoryLayoutConfig,
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
  const handlerFactory = createHandlerFactory(setCategoryLayoutConfig, saveConfiguration);

  // Generate mock category context for editor preview
  const mockCategoryContext = React.useMemo(() => {
    const sampleProducts = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Sample Product ${i + 1}`,
      description: `Description for sample product ${i + 1}`,
      price: 99.99 + (i * 50),
      compare_price: i % 2 ? 99.99 + (i * 50) + 20 : null,
      images: [`https://images.unsplash.com/photo-150574042${i}928-5e560c06d30e?w=400&h=400&fit=crop`],
      stock_status: 'in_stock',
      rating: 4.0 + (i % 10) * 0.1,
      attributes: { color: ['Black', 'Blue', 'White'][i % 3], brand: `Brand${i + 1}` }
    }));

    return {
      category: {
        id: 1,
        name: 'Sample Category',
        description: 'This is a sample category for the editor preview',
        slug: 'sample-category'
      },
      products: sampleProducts,
      allProducts: sampleProducts,
      filters: {},
      filterableAttributes: [],
      sortOption: 'default',
      currentPage: 1,
      totalPages: 1,
      subcategories: [],
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Sample Category', url: '/sample' }],
      selectedFilters: {},
      settings: { currency_symbol: '$' },
      store: { id: 1, name: 'Demo Store', code: 'demo' },
      handleFilterChange: () => {},
      handleSortChange: () => {},
      handlePageChange: () => {},
      clearFilters: () => {},
      formatDisplayPrice: (price) => `$${price}`,
      getProductImageUrl: (product) => product?.images?.[0] || '/placeholder-product.jpg',
      navigate: () => {},
      onProductClick: () => {}
    };
  }, []);

  // Create all handlers using the factory
  const handleTextChange = handlerFactory.createTextChangeHandler(textChangeHandler);
  const handleClassChange = handlerFactory.createClassChangeHandler(classChangeHandler);

  // Debounced save ref
  const saveTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    const timeoutId = saveTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Custom product mirroring function
  const mirrorProductChanges = (slotId, updatedConfig) => {
    // Check if the modified slot is a product element
    const productMatch = slotId.match(/^product_(\d+)_(.+)$/);
    if (!productMatch) return updatedConfig;

    const [, productNumber, elementType] = productMatch;
    const updatedSlot = updatedConfig.slots[slotId];

    // Mirror the changes to other product elements of the same type
    const newConfig = { ...updatedConfig };
    Object.keys(newConfig.slots).forEach(otherSlotId => {
      const otherProductMatch = otherSlotId.match(/^product_(\d+)_(.+)$/);
      if (otherProductMatch && otherProductMatch[2] === elementType && otherProductMatch[1] !== productNumber) {
        // Mirror structure and styling, but keep unique content
        newConfig.slots[otherSlotId] = {
          ...newConfig.slots[otherSlotId],
          className: updatedSlot.className,
          styles: updatedSlot.styles,
          colSpan: updatedSlot.colSpan,
          viewMode: updatedSlot.viewMode,
          // Keep original content and parentId
          content: newConfig.slots[otherSlotId].content,
          parentId: newConfig.slots[otherSlotId].parentId,
          id: otherSlotId
        };
      }
    });

    return newConfig;
  };

  // Custom slot drop handler with product mirroring
  const handleSlotDropWithMirroring = (dropResult) => {
    const result = handlerFactory.createSlotDropHandler(slotDropHandler, isDragOperationActiveRef)(dropResult);

    // Apply mirroring if a product element was modified
    if (dropResult.slotId) {
      setCategoryLayoutConfig(prevConfig => mirrorProductChanges(dropResult.slotId, prevConfig));
    }

    return result;
  };

  // Create all handlers using the factory
  const handleGridResize = handlerFactory.createGridResizeHandler(gridResizeHandler, saveTimeoutRef);
  const handleSlotHeightResize = handlerFactory.createSlotHeightResizeHandler(slotHeightResizeHandler, saveTimeoutRef);
  const handleSlotDrop = handleSlotDropWithMirroring;
  const handleSlotDelete = handlerFactory.createSlotDeleteHandler(slotDeleteHandler);
  const baseHandleResetLayout = handlerFactory.createResetLayoutHandler(resetLayoutFromHook, setLocalSaveStatus);

  // Use generic reset layout handler with base config
  const { handleResetLayout } = useResetLayoutHandler(
    'category',
    baseHandleResetLayout,
    categoryLayoutConfig,
    {
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    },
    categoryConfig
  );
  const handleCreateSlot = handlerFactory.createSlotCreateHandler(createSlot);

  // Use generic publish handler
  const { handlePublish, publishStatus } = usePublishHandler(
    'category',
    categoryLayoutConfig,
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
    'category', getSelectedStoreId, getDraftOrStaticConfiguration, setCategoryLayoutConfig, slotConfigurationService
  );

  // Use generic publish panel handler wrappers
  const { handlePublishPanelPublished, handlePublishPanelReverted } = usePublishPanelHandlerWrappers(
    'category',
    basePublishPanelHandlers,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setDraftConfig,
      setConfigurationStatus,
      setHasUnsavedChanges,
      setLatestPublished,
      setPageConfig: setCategoryLayoutConfig,
      updateLastSavedConfig
    }
  );

  // Generate view mode adjustment rules from category config
  const categoryAdjustmentRules = Object.keys(categoryConfig.slots).reduce((rules, slotId) => {
    const slotConfig = categoryConfig.slots[slotId];
    const slotName = slotId.replace(/_container$/, '').replace(/_/g, '');

    // Generate rules for slots that have responsive colSpan
    if (slotConfig.colSpan && typeof slotConfig.colSpan === 'object') {
      rules[slotName] = {
        colSpan: {
          shouldAdjust: (currentValue) => typeof currentValue === 'number',
          newValue: slotConfig.colSpan
        }
      };
    }

    return rules;
  }, {});

  // Use generic view mode adjustments
  useViewModeAdjustments(categoryLayoutConfig, setCategoryLayoutConfig, viewMode, categoryAdjustmentRules);

  // Main render - Clean and maintainable
  return (
    <div className={`min-h-screen bg-gray-50 ${
      isSidebarVisible ? 'pr-80' : ''
    }`}>
      {/* Main Editor Area */}
      <div className="flex flex-col h-screen">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              {/* View Mode Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {categoryConfig.views.map((view) => {
                  const IconComponent = view.icon;
                  return (
                    <button
                      key={view.id}
                      onClick={() => setViewMode(view.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === view.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 inline mr-1.5" />
                      {view.label}
                    </button>
                  );
                })}
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
        {/* Category Layout - Hierarchical Structure */}
        <div
          className="bg-gray-50 category-page flex-1 overflow-y-auto"
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

            {categoryLayoutConfig && categoryLayoutConfig.slots && Object.keys(categoryLayoutConfig.slots).length > 0 ? (
              showPreview ? (
                // Preview mode: Use CategorySlotRenderer exactly like storefront
                <CategorySlotRenderer
                  slots={categoryLayoutConfig.slots}
                  parentId={null}
                  viewMode={viewMode}
                  categoryContext={mockCategoryContext}
                />
              ) : (
                // Edit mode: Use CategorySlotRenderer with editing overlay
                <div className="relative">
                  {/* Render the actual content using CategorySlotRenderer */}
                  <ErrorBoundary>
                    <CategorySlotRenderer
                      slots={categoryLayoutConfig.slots}
                      parentId={null}
                      viewMode={viewMode}
                      categoryContext={mockCategoryContext}
                    />
                  </ErrorBoundary>

                  {/* Overlay HierarchicalSlotRenderer for editing capabilities */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="grid grid-cols-12 gap-2 auto-rows-min h-full">
                      <HierarchicalSlotRenderer
                        slots={categoryLayoutConfig.slots}
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
                        onSlotDelete={handleSlotDelete}
                        onResizeStart={() => setIsResizing(true)}
                        onResizeEnd={() => {
                          lastResizeEndTime.current = Date.now();
                          setTimeout(() => setIsResizing(false), 100);
                        }}
                        selectedElementId={selectedElement ? selectedElement.getAttribute('data-slot-id') : null}
                        setPageConfig={setCategoryLayoutConfig}
                        saveConfiguration={saveConfiguration}
                        saveTimeoutRef={saveTimeoutRef}
                        customSlotRenderer={() => {
                          // Return invisible content for overlay - just for editing structure
                          return (
                            <div
                              className="w-full h-full bg-transparent pointer-events-auto"
                              style={{
                                minHeight: '20px',
                                border: showSlotBorders ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'
                              }}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="col-span-12 text-center py-12 text-gray-500">
                {categoryLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
              </div>
            )}

            {/* Render CMS blocks from configuration */}
            {categoryConfig.cmsBlocks.map((position) => (
              <CmsBlockRenderer key={position} position={position} />
            ))}
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
            const config = categoryLayoutConfig && categoryLayoutConfig.slots && slotId ? categoryLayoutConfig.slots[slotId] : null;
            console.log('🏗️ CategorySlotsEditor: Passing slotConfig to EditorSidebar:', { slotId, config, categoryLayoutConfig });
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
            pageType="category"
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
        configuration={categoryLayoutConfig}
        localSaveStatus={localSaveStatus}
        onSave={async (newConfiguration) => {
          console.log('🎯 CodeModal onSave called with configuration:', newConfiguration);
          setCategoryLayoutConfig(newConfiguration);
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

// PropTypes for validation
CategorySlotsEditor.propTypes = {
  mode: PropTypes.string,
  onSave: PropTypes.func,
  viewMode: PropTypes.string
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default CategorySlotsEditor;