/**
 * Clean CategorySlotsEditor - Error-free version based on CartSlotsEditor.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Grid,
  List,
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

// Simple ErrorBoundary component to handle context issues
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
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

  // State management - Initialize with empty config to avoid React error #130
  const [categoryLayoutConfig, setCategoryLayoutConfig] = useState({
    page_name: 'Category',
    slot_type: 'category_layout',
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: 'category'
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

  // Configuration initialization hook
  const { initializeConfig, configurationLoadedRef } = useConfigurationInitialization(
    'category', 'Category', 'category_layout', getSelectedStoreId, getDraftOrStaticConfiguration, loadDraftStatus
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

  // Mock categoryContext for editor preview - matches what Category.jsx provides
  const mockCategoryContext = {
    category: {
      id: 1,
      name: 'Electronics',
      description: 'Browse our latest electronics and gadgets',
      slug: 'electronics'
    },
    products: [
      {
        id: 1,
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        compare_price: 249.99,
        images: ['/sample-headphones.jpg'],
        stock_status: 'in_stock',
        rating: 4.5,
        attributes: { color: 'Black', brand: 'TechCorp' }
      },
      {
        id: 2,
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced camera',
        price: 799.99,
        images: ['/sample-phone.jpg'],
        stock_status: 'in_stock',
        rating: 4.8,
        attributes: { color: 'Blue', brand: 'PhoneTech' }
      },
      {
        id: 3,
        name: 'Tablet',
        description: 'Portable tablet perfect for work and entertainment',
        price: 299.99,
        images: ['/sample-tablet.jpg'],
        stock_status: 'in_stock',
        rating: 4.3,
        attributes: { color: 'Silver', brand: 'TabletPro' }
      }
    ],
    allProducts: [], // Will be set same as products
    filters: {
      color: [
        { value: 'Black', label: 'Black', count: 1 },
        { value: 'Blue', label: 'Blue', count: 1 },
        { value: 'Silver', label: 'Silver', count: 1 }
      ],
      brand: [
        { value: 'TechCorp', label: 'TechCorp', count: 1 },
        { value: 'PhoneTech', label: 'PhoneTech', count: 1 },
        { value: 'TabletPro', label: 'TabletPro', count: 1 }
      ]
    },
    filterableAttributes: [
      { code: 'color', name: 'Color', is_filterable: true },
      { code: 'brand', name: 'Brand', is_filterable: true }
    ],
    sortOption: 'default',
    currentPage: 1,
    totalPages: 1,
    subcategories: [],
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Electronics', url: '/electronics' }
    ],
    selectedFilters: {},
    priceRange: {},
    currencySymbol: '$',
    settings: { currency_symbol: '$', enable_inventory: true },
    store: { id: 1, name: 'Demo Store', code: 'demo' },
    taxes: [],
    selectedCountry: null,
    handleFilterChange: (filters) => console.log('Filter change:', filters),
    handleSortChange: (sort) => console.log('Sort change:', sort),
    handlePageChange: (page) => console.log('Page change:', page),
    clearFilters: () => console.log('Clear filters'),
    formatDisplayPrice: (price) => `$${price}`,
    getProductImageUrl: (product) => product?.images?.[0] || '/placeholder-product.jpg',
    navigate: (url) => console.log('Navigate to:', url),
    onProductClick: (product) => console.log('Product click:', product.name)
  };

  // Set allProducts same as products for filter counting
  mockCategoryContext.allProducts = mockCategoryContext.products;

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

  // Use generic reset layout handler
  const { handleResetLayout } = useResetLayoutHandler(
    'category',
    baseHandleResetLayout,
    categoryLayoutConfig,
    {
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
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

  // Category-specific view mode adjustments
  const categoryAdjustmentRules = {
    filters: {
      colSpan: {
        shouldAdjust: (currentValue) => {
          // Check if colSpan needs to be converted from number to object format
          return typeof currentValue === 'number';
        },
        newValue: {
          grid: 3,
          list: 12
        }
      }
    },
    products: {
      colSpan: {
        shouldAdjust: (currentValue) => {
          // Check if colSpan needs to be converted from number to object format
          return typeof currentValue === 'number';
        },
        newValue: {
          grid: 9,
          list: 12
        }
      }
    }
  };

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
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4 inline mr-1.5" />
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1.5" />
                  List View
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
                        customSlotRenderer={(slot) => {
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

            <CmsBlockRenderer position="category_above_products" />

            <CmsBlockRenderer position="category_below_products" />
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

export default CategorySlotsEditor;