/**
 * Clean CategorySlotsEditor - Error-free version based on CartSlotsEditor structure
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure matching CartSlotsEditor
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  CategoryHeaderSlot,
  CategoryBreadcrumbsSlot,
  CategoryActiveFiltersSlot,
  CategoryFiltersSlot,
  CategoryProductsSlot,
  CategorySortingSlot,
  CategoryPaginationSlot,
  CategoryLayeredNavigationSlot,
  CategoryProductItemCardSlot
} from '@/components/editor/slot/slotComponentsCategory';
import slotConfigurationService from '@/services/slotConfigurationService';

// Main CategorySlotsEditor component - mirrors CartSlotsEditor structure exactly
const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // State management - Initialize with empty config to avoid React error
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

  // Filter state management
  const [selectedFilters, setSelectedFilters] = useState({});
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

  // Create default slots function for category layout
  const createDefaultSlots = useCallback(async () => {
    try {
      const configModule = await import('@/components/editor/slot/configs/category-config');

      const categoryConfig = configModule.categoryConfig || configModule.default;

      if (!categoryConfig || !categoryConfig.slots) {
        console.error('❌ Invalid category config - no slots found');
        return null;
      }

      const defaultConfig = {
        page_name: 'Category',
        slot_type: 'category_layout',
        slots: categoryConfig.slots,
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0',
          pageType: 'category'
        },
        cmsBlocks: categoryConfig.cmsBlocks || []
      };

      return defaultConfig;
    } catch (error) {
      console.error('❌ Failed to load category config:', error);
      return null;
    }
  }, []);

  // Use generic editor initialization with createDefaultSlots
  useEditorInitialization(initializeConfig, setCategoryLayoutConfig, createDefaultSlots);

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, categoryLayoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, 'category');

  // Compute when Publish button should be enabled
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

  // Sample category data for editor preview
  const sampleCategoryContext = {
    category: {
      id: 1,
      name: 'Sample Category',
      description: 'Browse our collection of products',
      image: '/sample-category.jpg'
    },
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Electronics', url: '/electronics' },
      { name: 'Sample Category', url: null }
    ],
    products: viewMode === 'grid' ? [
      { id: 1, name: 'iPhone 15 Pro', price: 999.99, images: ['/sample-product.jpg'], attributes: { color: 'Blue', size: 'M', brand: 'Apple' } },
      { id: 2, name: 'Galaxy S24', price: 899.99, images: ['/sample-product.jpg'], attributes: { color: 'Red', size: 'L', brand: 'Samsung' } },
      { id: 3, name: 'Pixel 8', price: 699.99, images: ['/sample-product.jpg'], attributes: { color: 'Green', size: 'S', brand: 'Google' } },
      { id: 4, name: 'OnePlus 12', price: 799.99, images: ['/sample-product.jpg'], attributes: { color: 'Purple', size: 'XL', brand: 'OnePlus' } },
      { id: 5, name: 'iPhone 15', price: 799.99, images: ['/sample-product.jpg'], attributes: { color: 'Yellow', size: 'M', brand: 'Apple' } },
      { id: 6, name: 'Galaxy S24+', price: 999.99, images: ['/sample-product.jpg'], attributes: { color: 'Blue', size: 'L', brand: 'Samsung' } }
    ] : [
      { id: 1, name: 'iPhone 15 Pro', price: 999.99, images: ['/sample-product.jpg'], description: 'Latest iPhone with Pro features', attributes: { color: 'Blue', size: 'M', brand: 'Apple' } },
      { id: 2, name: 'Galaxy S24', price: 899.99, images: ['/sample-product.jpg'], description: 'Samsung flagship smartphone', attributes: { color: 'Red', size: 'L', brand: 'Samsung' } },
      { id: 3, name: 'Pixel 8', price: 699.99, images: ['/sample-product.jpg'], description: 'Google Pixel with AI features', attributes: { color: 'Green', size: 'S', brand: 'Google' } }
    ],
    allProducts: viewMode === 'grid' ? [
      { id: 1, name: 'iPhone 15 Pro', price: 999.99, images: ['/sample-product.jpg'], attributes: { color: 'Blue', size: 'M', brand: 'Apple' } },
      { id: 2, name: 'Galaxy S24', price: 899.99, images: ['/sample-product.jpg'], attributes: { color: 'Red', size: 'L', brand: 'Samsung' } },
      { id: 3, name: 'Pixel 8', price: 699.99, images: ['/sample-product.jpg'], attributes: { color: 'Green', size: 'S', brand: 'Google' } },
      { id: 4, name: 'OnePlus 12', price: 799.99, images: ['/sample-product.jpg'], attributes: { color: 'Purple', size: 'XL', brand: 'OnePlus' } },
      { id: 5, name: 'iPhone 15', price: 799.99, images: ['/sample-product.jpg'], attributes: { color: 'Yellow', size: 'M', brand: 'Apple' } },
      { id: 6, name: 'Galaxy S24+', price: 999.99, images: ['/sample-product.jpg'], attributes: { color: 'Blue', size: 'L', brand: 'Samsung' } },
      { id: 7, name: 'Pixel 8 Pro', price: 999.99, images: ['/sample-product.jpg'], attributes: { color: 'Yellow', size: 'S', brand: 'Google' } },
      { id: 8, name: 'OnePlus 12 Pro', price: 899.99, images: ['/sample-product.jpg'], attributes: { color: 'Purple', size: 'XL', brand: 'OnePlus' } }
    ] : [
      { id: 1, name: 'iPhone 15 Pro', price: 999.99, images: ['/sample-product.jpg'], description: 'Latest iPhone with Pro features', attributes: { color: 'Blue', size: 'M', brand: 'Apple' } },
      { id: 2, name: 'Galaxy S24', price: 899.99, images: ['/sample-product.jpg'], description: 'Samsung flagship smartphone', attributes: { color: 'Red', size: 'L', brand: 'Samsung' } },
      { id: 3, name: 'Pixel 8', price: 699.99, images: ['/sample-product.jpg'], description: 'Google Pixel with AI features', attributes: { color: 'Green', size: 'S', brand: 'Google' } },
      { id: 4, name: 'OnePlus 12', price: 799.99, images: ['/sample-product.jpg'], description: 'OnePlus flagship with fast charging', attributes: { color: 'Purple', size: 'XL', brand: 'OnePlus' } },
      { id: 5, name: 'iPhone 15', price: 799.99, images: ['/sample-product.jpg'], description: 'Standard iPhone model', attributes: { color: 'Yellow', size: 'M', brand: 'Apple' } }
    ],
    filters: {
      color: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
      size: ['S', 'M', 'L', 'XL'],
      price: { min: 0, max: 100 }
    },
    filterableAttributes: [
      {
        code: 'color',
        name: 'Color',
        is_filterable: true,
        use_for_filter: true,
        options: [
          { value: 'Red', label: 'Red' },
          { value: 'Blue', label: 'Blue' },
          { value: 'Green', label: 'Green' },
          { value: 'Yellow', label: 'Yellow' },
          { value: 'Purple', label: 'Purple' }
        ]
      },
      {
        code: 'size',
        name: 'Size',
        is_filterable: true,
        use_for_filter: true,
        options: [
          { value: 'S', label: 'Small' },
          { value: 'M', label: 'Medium' },
          { value: 'L', label: 'Large' },
          { value: 'XL', label: 'Extra Large' }
        ]
      },
      {
        code: 'brand',
        name: 'Brand',
        is_filterable: true,
        use_for_filter: true,
        options: [
          { value: 'Apple', label: 'Apple' },
          { value: 'Samsung', label: 'Samsung' },
          { value: 'Google', label: 'Google' },
          { value: 'OnePlus', label: 'OnePlus' }
        ]
      }
    ],
    sortOption: 'name-asc',
    currentPage: 1,
    totalPages: 3,
    currencySymbol: '$',
    selectedFilters: selectedFilters,
    productLabels: [],
    handleFilterChange: (filters) => {
      setSelectedFilters(filters);
    },
    handleSortChange: () => {},
    handlePageChange: () => {},
    clearFilters: () => {
      setSelectedFilters({});
    }
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
    filters_container: {
      colSpan: {
        shouldAdjust: (currentValue) => {
          return typeof currentValue === 'number';
        },
        newValue: {
          grid: 'col-span-12 lg:col-span-3',
          list: 'col-span-12 lg:col-span-3'
        }
      }
    },
    products_container: {
      colSpan: {
        shouldAdjust: (currentValue) => {
          return typeof currentValue === 'number';
        },
        newValue: {
          grid: 'col-span-12 lg:col-span-9',
          list: 'col-span-12 lg:col-span-9'
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
      <div className="flex flex-col">
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
                <div className="flex items-center gap-2">
                  <EditModeControls
                    localSaveStatus={localSaveStatus}
                    publishStatus={publishStatus}
                    saveConfiguration={saveConfiguration}
                    onPublish={handlePublish}
                    hasChanges={canPublish}
                  />

                  {/* Temporary button to load default config */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const defaultConfig = await createDefaultSlots();
                      if (defaultConfig) {
                        setCategoryLayoutConfig(defaultConfig);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    className="text-xs"
                  >
                    Load Default Config
                  </Button>
                </div>
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
          className="bg-gray-50 category-page overflow-y-auto max-h-[calc(100vh-80px)]"
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
                {(() => {
                  // Log specific slot types to debug
                  if (categoryLayoutConfig?.slots) {
                    // Log ALL slots to see what's there
                    Object.keys(categoryLayoutConfig.slots).forEach(slotId => {
                      const slot = categoryLayoutConfig.slots[slotId];
                      console.info(`🔍 SLOT [${slotId}]:`, {
                        type: slot.type,
                        parentId: slot.parentId,
                        viewMode: slot.viewMode,
                        position: slot.position,
                        colSpan: slot.colSpan,
                        className: slot.className,
                        styles: slot.styles,
                        hasStyles: slot.styles && Object.keys(slot.styles).length > 0
                      });
                    });
                  }

                  return categoryLayoutConfig && categoryLayoutConfig.slots && Object.keys(categoryLayoutConfig.slots).length > 0;
                })() ? (
                  <HierarchicalSlotRenderer
                    slots={categoryLayoutConfig.slots}
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
                    setPageConfig={setCategoryLayoutConfig}
                    saveConfiguration={saveConfiguration}
                    saveTimeoutRef={saveTimeoutRef}
                    customSlotRenderer={(slot) => {


                      // Let layered_navigation be handled by the component mapping

                      // Handle breadcrumbs content specifically
                      if (slot.id === 'breadcrumbs_content') {
                        return (
                          <CategoryBreadcrumbsSlot
                            categoryData={sampleCategoryContext}
                            categoryContext={sampleCategoryContext}
                            content={slot.content}
                            className={slot.className}
                            styles={slot.styles}
                            config={{ viewMode }}
                          />
                        );
                      }

                      // Handle product_items specifically (the main products container)
                      if (slot.id === 'product_items') {
                        return (
                          <CategoryProductItemCardSlot
                            categoryData={sampleCategoryContext}
                            categoryContext={sampleCategoryContext}
                            content={{ itemsToShow: 3 }}
                            config={{ viewMode }}
                          />
                        );
                      }

                      const componentMap = {
                        // Breadcrumbs and headers
                        'breadcrumbs_content': CategoryBreadcrumbsSlot,
                        'category_title': CategoryHeaderSlot,
                        'category_header': CategoryHeaderSlot,
                        'category_description': CategoryHeaderSlot,

                        // Filters and navigation
                        'filters_container': CategoryFiltersSlot,
                        'layered_navigation': CategoryLayeredNavigationSlot,
                        'active_filters': CategoryActiveFiltersSlot,

                        // Products
                        'products_container': CategoryProductsSlot,
                        'products_grid': CategoryProductsSlot,
                        'product_items': CategoryProductItemCardSlot,
                        'product_item_card': CategoryProductItemCardSlot,
                        'product_template': CategoryProductItemCardSlot,

                        // Sorting and controls
                        'sort_controls': CategorySortingSlot,
                        'sorting_controls': CategorySortingSlot,
                        'product_count_info': CategorySortingSlot,
                        'sort_selector': CategorySortingSlot,

                        // Pagination
                        'pagination_controls': CategoryPaginationSlot,
                        'pagination_container': CategoryPaginationSlot
                      };

                      const SlotComponent = componentMap[slot.id];

                      if (SlotComponent) {
                        return (
                          <SlotComponent
                            categoryData={sampleCategoryContext}
                            categoryContext={sampleCategoryContext}
                            content={slot.content}
                            className={slot.className}
                            styles={slot.styles}
                            config={{ viewMode }}
                          />
                        );
                      }

                      // Handle CMS block slots
                      if (slot.type === 'cms_block') {
                        const cmsPosition = slot.metadata?.cmsPosition;
                        return (
                          <div className={`relative ${slot.className || "w-full"}`}>
                            <CmsBlockRenderer position={cmsPosition} />
                            {/* Development dummy content when no CMS blocks exist */}
                            <div className="min-h-[60px] bg-purple-50 border-2 border-purple-200 border-dashed rounded-md p-4 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-purple-600 font-medium text-sm mb-1">
                                  {slot.metadata?.displayName || `CMS Block: ${cmsPosition}`}
                                </div>
                                <div className="text-purple-500 text-xs">
                                  Dummy content for development - Position: {cmsPosition}
                                </div>
                              </div>
                            </div>
                            {/* Editor overlay for CMS block identification */}
                            {mode === 'edit' && !showPreview && (
                              <div className="absolute top-0 right-0 bg-purple-600 text-white px-2 py-1 rounded-bl text-xs font-medium z-10">
                                CMS Block
                              </div>
                            )}
                          </div>
                        );
                      }

                      // For slots without specific components, render basic content
                      if (slot.type === 'text' && slot.content) {
                        return (
                          <div
                            className={slot.className || "p-2"}
                            dangerouslySetInnerHTML={{ __html: slot.content }}
                          />
                        );
                      }

                      // For container slots, render children if they exist
                      if (slot.type === 'container') {
                        return (
                          <div className={slot.className || "w-full"}>
                            {/* Container content would be rendered by HierarchicalSlotRenderer */}
                          </div>
                        );
                      }

                      return null;
                    }}
                  />
                ) : (
                  <div className="col-span-12 text-center py-12 text-gray-500">
                    {categoryLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
                  </div>
                )}
              </div>

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
          setCategoryLayoutConfig(newConfiguration);
          setHasUnsavedChanges(true);
          await saveConfiguration(newConfiguration);
          setShowCodeModal(false);
        }}
      />
    </div>
  );
};

export default CategorySlotsEditor;