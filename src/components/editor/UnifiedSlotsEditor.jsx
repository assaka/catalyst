/**
 * UnifiedSlotsEditor - Unified editor component for all slot-based pages
 *
 * Features:
 * - Common editor functionality for Product, Cart, and Category pages
 * - AI enhancement ready with screenshot analysis support
 * - Consistent UI patterns and behavior
 * - Extensible through configuration objects
 *
 * Design Philosophy:
 * - Single source of truth for editor logic
 * - Page-specific behavior through configuration
 * - AI-ready architecture for customization assistance
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/UnifiedSlotComponents'; // Register unified components
import slotConfigurationService from '@/services/slotConfigurationService';

/**
 * UnifiedSlotsEditor - Core editor component
 *
 * @param {Object} config - Editor configuration object
 * @param {string} config.pageType - Type of page (product, cart, category)
 * @param {string} config.pageName - Display name for the page
 * @param {string} config.slotType - Type of slot configuration
 * @param {string} config.defaultViewMode - Default view mode
 * @param {Array} config.viewModes - Available view modes
 * @param {Object} config.slotComponents - Page-specific slot components
 * @param {Function} config.generateContext - Function to generate page context
 * @param {Function} config.createDefaultSlots - Function to create default slots
 * @param {Object} config.viewModeAdjustments - View mode specific adjustments
 * @param {Function} config.customSlotRenderer - Custom slot rendering logic
 * @param {Array} config.cmsBlockPositions - CMS block positions for the page
 * @param {Object} aiConfig - AI enhancement configuration
 * @param {boolean} aiConfig.enabled - Whether AI enhancement is enabled
 * @param {Function} aiConfig.onScreenshotAnalysis - Handler for screenshot analysis
 * @param {Function} aiConfig.onStyleGeneration - Handler for AI style generation
 */
const UnifiedSlotsEditor = ({
  config,
  aiConfig = { enabled: false },
  mode = 'edit',
  onSave,
  viewMode: propViewMode
}) => {
  // Extract configuration
  const {
    pageType,
    pageName,
    slotType,
    defaultViewMode,
    viewModes,
    slotComponents,
    generateContext,
    createDefaultSlots,
    viewModeAdjustments,
    customSlotRenderer,
    cmsBlockPositions = []
  } = config;

  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // State management - Initialize with empty config
  const [layoutConfig, setLayoutConfig] = useState({
    page_name: pageName,
    slot_type: slotType,
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: pageType
    },
    cmsBlocks: []
  });

  // Basic editor state
  const isDragOperationActiveRef = useRef(false);
  const publishPanelRef = useRef(null);
  const lastResizeEndTime = useRef(0);
  const [viewMode, setViewMode] = useState(propViewMode || defaultViewMode);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSlotBorders, setShowSlotBorders] = useState(true);
  const [localSaveStatus, setLocalSaveStatus] = useState('');
  const [currentViewport, setCurrentViewport] = useState('desktop');
  const [isResizing, setIsResizing] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI Enhancement State
  const [aiEnhancementMode, setAiEnhancementMode] = useState(false);
  const [screenshotAnalysis, setScreenshotAnalysis] = useState(null);
  const [aiGeneratedStyles, setAiGeneratedStyles] = useState(null);

  // Page context state
  const [pageContext, setPageContext] = useState(null);

  // Generate page context
  useEffect(() => {
    if (generateContext) {
      const context = generateContext(viewMode, selectedStore);
      setPageContext(context);
    }
  }, [generateContext, viewMode, selectedStore]);

  // Use extracted hooks
  const { formatTimeAgo } = useTimestampFormatting();
  const {
    draftConfig, setDraftConfig,
    latestPublished, setLatestPublished,
    setConfigurationStatus,
    hasUnsavedChanges, setHasUnsavedChanges,
    loadDraftStatus
  } = useDraftStatusManagement(getSelectedStoreId(), pageType);

  // Database configuration hook
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
    createElementClickHandler,
    createSaveConfigurationHandler,
    createHandlerFactory
  } = useSlotConfiguration({
    pageType,
    pageName,
    slotType,
    selectedStore,
    updateConfiguration: async (config) => {
      const storeId = getSelectedStoreId();
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, config, slotType);
      }
    },
    onSave
  });

  // Configuration initialization hook
  const { initializeConfig, configurationLoadedRef } = useConfigurationInitialization(
    pageType, pageName, slotType, getSelectedStoreId, getDraftConfiguration, loadDraftStatus
  );

  // Use generic editor initialization with createDefaultSlots if provided
  useEditorInitialization(initializeConfig, setLayoutConfig, createDefaultSlots);

  // Configuration change detection
  const { updateLastSavedConfig } = useConfigurationChangeDetection(
    configurationLoadedRef, layoutConfig, setHasUnsavedChanges
  );

  // Badge refresh
  useBadgeRefresh(configurationLoadedRef, hasUnsavedChanges, pageType);

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    layoutConfig,
    setLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    pageType
  );

  // Use generic save configuration handler
  const { saveConfiguration } = useSaveConfigurationHandler(
    pageType,
    baseSaveConfiguration,
    layoutConfig,
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
    pageType, getSelectedStoreId, getDraftConfiguration, setLayoutConfig, slotConfigurationService
  );

  // Use generic publish panel handler wrappers
  const { handlePublishPanelPublished, handlePublishPanelReverted } = usePublishPanelHandlerWrappers(
    pageType,
    basePublishPanelHandlers,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setDraftConfig,
      setConfigurationStatus,
      setHasUnsavedChanges,
      setLatestPublished,
      setPageConfig: setLayoutConfig,
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
  const handlerFactory = createHandlerFactory(setLayoutConfig, saveConfiguration);

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
    pageType,
    baseHandleResetLayout,
    layoutConfig,
    {
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );

  const handleCreateSlot = handlerFactory.createSlotCreateHandler(createSlot);

  // Use generic publish handler
  const { handlePublish, publishStatus } = usePublishHandler(
    pageType,
    layoutConfig,
    handlePublishConfiguration,
    {
      setIsSidebarVisible,
      setSelectedElement,
      setHasUnsavedChanges,
      setConfigurationStatus,
      updateLastSavedConfig
    }
  );

  // Use generic view mode adjustments if provided
  if (viewModeAdjustments) {
    useViewModeAdjustments(layoutConfig, setLayoutConfig, viewMode, viewModeAdjustments);
  }

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedElement(null);
    setIsSidebarVisible(false);
  }, []);

  // AI Enhancement Functions
  const handleScreenshotUpload = useCallback(async (file) => {
    if (!aiConfig.enabled || !aiConfig.onScreenshotAnalysis) return;

    try {
      const analysis = await aiConfig.onScreenshotAnalysis(file, layoutConfig, pageContext);
      setScreenshotAnalysis(analysis);
      setAiEnhancementMode(true);
    } catch (error) {
      console.error('Screenshot analysis failed:', error);
    }
  }, [aiConfig, layoutConfig, pageContext]);

  const handleApplyAiStyles = useCallback(async () => {
    if (!aiConfig.enabled || !aiConfig.onStyleGeneration || !screenshotAnalysis) return;

    try {
      const generatedStyles = await aiConfig.onStyleGeneration(screenshotAnalysis, layoutConfig);
      setAiGeneratedStyles(generatedStyles);

      // Apply generated styles to layout configuration
      const updatedConfig = {
        ...layoutConfig,
        slots: {
          ...layoutConfig.slots,
          ...generatedStyles.slots
        }
      };

      setLayoutConfig(updatedConfig);
      setHasUnsavedChanges(true);
      await saveConfiguration(updatedConfig);

      setAiEnhancementMode(false);
      setScreenshotAnalysis(null);
      setAiGeneratedStyles(null);
    } catch (error) {
      console.error('AI style generation failed:', error);
    }
  }, [aiConfig, screenshotAnalysis, layoutConfig, saveConfiguration, setHasUnsavedChanges]);

  // Render view mode tabs
  const renderViewModeTabs = () => {
    if (!viewModes || viewModes.length <= 1) return null;

    return (
      <div className="flex bg-gray-100 rounded-lg p-1">
        {viewModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === mode.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <mode.icon className="w-4 h-4 inline mr-1.5" />
            {mode.label}
          </button>
        ))}
      </div>
    );
  };

  // Show loading state if page context is required but not loaded
  if (generateContext && !pageContext) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-gray-600">Loading {pageName.toLowerCase()} editor...</div>
        </div>
      </div>
    );
  }

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
              {renderViewModeTabs()}

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

              {/* AI Enhancement Toggle */}
              {aiConfig.enabled && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setAiEnhancementMode(!aiEnhancementMode)}
                    variant={aiEnhancementMode ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    🤖 AI Enhance
                  </Button>
                  {aiEnhancementMode && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleScreenshotUpload(file);
                      }}
                      className="hidden"
                      id="screenshot-upload"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Preview and Publish Buttons - Far Right */}
            <div className="flex items-center gap-2 ml-4">
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

        {/* Page Layout - Hierarchical Structure */}
        <div
          className={`bg-gray-50 ${pageType}-page overflow-y-auto max-h-[calc(100vh-80px)]`}
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

          {/* AI Enhancement Panel */}
          {aiEnhancementMode && screenshotAnalysis && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-900">AI Enhancement Ready</h3>
                  <Button
                    onClick={() => setAiEnhancementMode(false)}
                    variant="ghost"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>
                <p className="text-sm text-blue-700 mb-3">{screenshotAnalysis.summary}</p>
                <div className="flex gap-2">
                  <Button onClick={handleApplyAiStyles} size="sm">
                    Apply AI Styles
                  </Button>
                  <label htmlFor="screenshot-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Upload New Screenshot</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          )}

          <ResponsiveContainer
            viewport={currentViewport}
            className="bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              {/* Flash Messages Area */}
              <div id="flash-messages-area"></div>

              {/* CMS Blocks Above */}
              {cmsBlockPositions.map(position =>
                position.includes('above') && (
                  <CmsBlockRenderer key={position} position={position} />
                )
              )}

              {/* Main Grid Layout */}
              <div className="grid grid-cols-12 gap-2 auto-rows-min">
                {layoutConfig && layoutConfig.slots && Object.keys(layoutConfig.slots).length > 0 ? (
                  <UnifiedSlotRenderer
                    slots={layoutConfig.slots}
                    parentId={null}
                    viewMode={viewMode}
                    viewportMode={currentViewport}
                    context="editor"
                    productData={pageContext}
                    mode={showPreview ? 'view' : mode}
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
                    setPageConfig={setLayoutConfig}
                    saveConfiguration={saveConfiguration}
                  />
                ) : (
                  <div className="col-span-12 text-center py-12 text-gray-500">
                    {layoutConfig ? 'No slots configured' : 'Loading configuration...'}
                  </div>
                )}
              </div>

              {/* CMS Blocks Below */}
              {cmsBlockPositions.map(position =>
                position.includes('below') && (
                  <CmsBlockRenderer key={position} position={position} />
                )
              )}
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
            const config = layoutConfig && layoutConfig.slots && slotId ? layoutConfig.slots[slotId] : null;
            return config;
          })()}
          allSlots={layoutConfig?.slots || {}}
          onClearSelection={handleClearSelection}
          onClassChange={handleClassChange}
          onInlineClassChange={handleClassChange}
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
            pageType={pageType}
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
        onCreateSlot={handleCreateSlot}
        onShowFilePicker={() => {
          setShowAddSlotModal(false);
          // TODO: Implement file picker modal
        }}
        pageType={pageType}
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
        configuration={layoutConfig}
        localSaveStatus={localSaveStatus}
        onSave={async (newConfiguration) => {
          setLayoutConfig(newConfiguration);
          setHasUnsavedChanges(true);
          await saveConfiguration(newConfiguration);
          setShowCodeModal(false);
        }}
      />
    </div>
  );
};

export default UnifiedSlotsEditor;