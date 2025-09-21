/**
 * CategorySlotEditor - Category page layout editor using slot system
 * Based on CartSlotsEditor architecture with category-specific components
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Grid,
  List,
  Loader2,
  Rocket,
  Eye
} from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useSlotConfiguration } from '@/hooks/useSlotConfiguration';
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
import slotConfigurationService from '@/services/slotConfigurationService';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';

// Main CategorySlotEditor component
const CategorySlotEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  // Store context for database operations
  const { selectedStore, getSelectedStoreId } = useStoreSelection();

  // Global state to track current drag operation
  const [currentDragInfo, setCurrentDragInfo] = useState(null);

  // State management - Initialize with empty config
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

  // Track if configuration has been loaded once
  const configurationLoadedRef = useRef(false);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [configurationStatus, setConfigurationStatus] = useState(null); // 'draft' or 'published'
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draftConfig, setDraftConfig] = useState(null);
  const [latestPublished, setLatestPublished] = useState(null);
  const lastResizeEndTime = useRef(0);
  const lastSavedConfigRef = useRef(null);
  const publishPanelRef = useRef(null);

  // Sample data for category preview
  const sampleCategoryData = {
    category: {
      id: 1,
      name: 'Electronics',
      description: 'Latest electronic gadgets and accessories',
      parent: 'Products'
    },
    products: [
      { id: 1, name: 'Smartphone X', price: 999, description: 'Latest flagship phone', image: 'https://via.placeholder.com/200' },
      { id: 2, name: 'Laptop Pro', price: 1499, description: 'High-performance laptop', image: 'https://via.placeholder.com/200' },
      { id: 3, name: 'Wireless Earbuds', price: 199, description: 'Premium sound quality', image: 'https://via.placeholder.com/200' },
      { id: 4, name: 'Smart Watch', price: 399, description: 'Health & fitness tracker', image: 'https://via.placeholder.com/200' },
      { id: 5, name: 'Tablet Plus', price: 799, description: '12-inch display tablet', image: 'https://via.placeholder.com/200' },
      { id: 6, name: 'Power Bank', price: 49, description: '20000mAh capacity', image: 'https://via.placeholder.com/200' },
    ]
  };

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

  // Initialize category configuration - ONCE on mount only
  useEffect(() => {
    let isMounted = true;

    const initializeConfig = async () => {
      if (!isMounted || configurationLoadedRef.current) return;

      try {
        console.log('🔄 CategorySlotEditor: Starting configuration initialization...');

        // Use the hook function to get configuration (either draft or static)
        const configToUse = await getDraftOrStaticConfiguration();

        if (!configToUse) {
          throw new Error('Failed to load category configuration');
        }

        // Try to get the status and unpublished changes from draft configuration
        try {
          const storeId = getSelectedStoreId();
          if (storeId) {
            // Get draft configuration
            const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'category');
            if (draftResponse && draftResponse.success && draftResponse.data) {
              setDraftConfig(draftResponse.data); // Store the full draft config
              setConfigurationStatus(draftResponse.data.status);
              // Set hasUnsavedChanges based on database field
              setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);
            }

            // Get latest published configuration for timestamp
            try {
              const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'category', 1);
              if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
                setLatestPublished(publishedResponse.data[0]);
              }
            } catch (publishedError) {
              console.log('Could not get latest published version:', publishedError);
            }
          }
        } catch (error) {
          console.log('Could not determine configuration status:', error);
          setConfigurationStatus('published'); // Default to published if we can't determine
          setHasUnsavedChanges(false);
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
          console.log('🏗️ CategorySlotEditor: Setting initial config');
          setCategoryLayoutConfig(finalConfig);
          configurationLoadedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Failed to initialize category configuration:', error);
        // Set a minimal fallback configuration
        setTimeout(() => {
          if (isMounted) {
            setCategoryLayoutConfig({
              page_name: 'Category',
              slot_type: 'category_layout',
              slots: {},
              metadata: {
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                version: '1.0',
                pageType: 'category',
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

  // Detect changes in configuration
  useEffect(() => {
    if (configurationLoadedRef.current && categoryLayoutConfig) {
      const currentConfig = JSON.stringify(categoryLayoutConfig);
      if (lastSavedConfigRef.current === null) {
        // Initial load - save the initial state
        lastSavedConfigRef.current = currentConfig;
      } else if (currentConfig !== lastSavedConfigRef.current) {
        // Configuration has changed
        setHasUnsavedChanges(true);
      }
    }
  }, [categoryLayoutConfig]);

  // Refresh badge status when hasUnsavedChanges changes
  useEffect(() => {
    if (configurationLoadedRef.current && hasUnsavedChanges) {
      // When user makes changes, refresh the badge to show "Unpublished"
      if (window.slotFileSelectorRefresh) {
        // Small delay to ensure the database is updated first
        setTimeout(() => {
          window.slotFileSelectorRefresh('category');
        }, 500);
      }
    }
  }, [hasUnsavedChanges]);

  // Compute when Publish button should be enabled
  const canPublish = hasUnsavedChanges;

  // Timestamp formatting functions
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return formatDate(dateString);
  };

  // Helper functions for slot styling
  const getSlotStyling = useCallback((slotId) => {
    const slotConfig = categoryLayoutConfig && categoryLayoutConfig.slots ? categoryLayoutConfig.slots[slotId] : null;
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [categoryLayoutConfig]);

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    categoryLayoutConfig,
    setCategoryLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'category'
  );

  // Wrap save configuration to track saved state
  const saveConfiguration = useCallback(async (...args) => {
    const result = await baseSaveConfiguration(...args);
    if (result !== false) {
      setConfigurationStatus('draft'); // Saving creates a draft
      lastSavedConfigRef.current = JSON.stringify(categoryLayoutConfig);

      // Refresh the SlotEnabledFileSelector badge status after saving changes
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh('category');
      }
    }
    return result;
  }, [baseSaveConfiguration, categoryLayoutConfig]);


  // Handle element selection using generic factory
  const handleElementClick = createElementClickHandler(
    isResizing,
    lastResizeEndTime,
    setSelectedElement,
    setIsSidebarVisible
  );

  // Create handler factory with page-specific dependencies
  const handlerFactory = createHandlerFactory(setCategoryLayoutConfig, saveConfiguration);

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

  // Wrap reset layout to also reset unsaved changes flag
  const handleResetLayout = useCallback(async () => {
    const result = await baseHandleResetLayout();
    setHasUnsavedChanges(false); // Reset should clear unsaved changes flag
    setConfigurationStatus('draft'); // Reset creates a draft
    lastSavedConfigRef.current = JSON.stringify(categoryLayoutConfig);

    // Refresh the SlotEnabledFileSelector badge status after reset
    if (window.slotFileSelectorRefresh) {
      window.slotFileSelectorRefresh('category');
    }

    return result;
  }, [baseHandleResetLayout, categoryLayoutConfig]);

  const handleCreateSlot = handlerFactory.createSlotCreateHandler(createSlot);

  // Publish status state
  const [publishStatus, setPublishStatus] = useState('');

  // Handle publish configuration
  const handlePublish = useCallback(async () => {
    console.log('🚀 handlePublish called - closing sidebar');
    setPublishStatus('publishing');

    // Close sidebar when publishing
    setIsSidebarVisible(false);
    setSelectedElement(null);

    try {
      await handlePublishConfiguration();
      setPublishStatus('published');
      setHasUnsavedChanges(false);  // Mark as saved after successful publish
      setConfigurationStatus('draft'); // Set to draft since new draft was created based on published
      lastSavedConfigRef.current = JSON.stringify(categoryLayoutConfig);

      // Refresh the SlotEnabledFileSelector badge status
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh('category');
      }

      setTimeout(() => setPublishStatus(''), 3000);
    } catch (error) {
      console.error('❌ Failed to publish configuration:', error);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(''), 5000);
    }
  }, [handlePublishConfiguration, categoryLayoutConfig]);

  // Handle publish panel callbacks
  const handlePublishPanelPublished = useCallback(async (publishedConfig) => {
    console.log('📋 handlePublishPanelPublished called - closing sidebar');
    // Close sidebar when publishing from panel
    setIsSidebarVisible(false);
    setSelectedElement(null);

    // Reload draft configuration to get updated state
    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'category');
        if (draftResponse && draftResponse.success && draftResponse.data) {
          setDraftConfig(draftResponse.data);
          setConfigurationStatus(draftResponse.data.status);
          setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);
        }

        // Update latest published
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'category', 1);
        if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
          setLatestPublished(publishedResponse.data[0]);
        }

        // Refresh the SlotEnabledFileSelector badge status
        if (window.slotFileSelectorRefresh) {
          window.slotFileSelectorRefresh('category');
        }
      }
    } catch (error) {
      console.error('Failed to reload draft after publish:', error);
    }
  }, [getSelectedStoreId]);

  const handlePublishPanelReverted = useCallback(async (revertedConfig) => {
    // Handle revert or undo revert
    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        if (revertedConfig === null) {
          // Draft was completely deleted (no previous draft to restore)
          setDraftConfig(null);
          setConfigurationStatus('published');
          setHasUnsavedChanges(false);

          // Reload from latest published configuration
          const configToUse = await getDraftOrStaticConfiguration();
          if (configToUse) {
            const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
            setCategoryLayoutConfig(finalConfig);
            lastSavedConfigRef.current = JSON.stringify(finalConfig);
          }
        } else if (revertedConfig && revertedConfig.status === 'draft' && !revertedConfig.current_edit_id) {
          // Previous draft state was restored
          setDraftConfig(revertedConfig);
          setConfigurationStatus(revertedConfig.status);
          setHasUnsavedChanges(revertedConfig.has_unpublished_changes || false);

          // Reload the category layout configuration from the restored draft
          const configToUse = await getDraftOrStaticConfiguration();
          if (configToUse) {
            const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
            setCategoryLayoutConfig(finalConfig);
            lastSavedConfigRef.current = JSON.stringify(finalConfig);
          }
        } else {
          // Normal revert draft creation
          const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'category');
          if (draftResponse && draftResponse.success && draftResponse.data) {
            setDraftConfig(draftResponse.data);
            setConfigurationStatus(draftResponse.data.status);
            setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);

            // Also reload the category layout configuration
            const configToUse = await getDraftOrStaticConfiguration();
            if (configToUse) {
              const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
              setCategoryLayoutConfig(finalConfig);
              lastSavedConfigRef.current = JSON.stringify(finalConfig);
            }
          }
        }

        // Update latest published after revert/undo
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'category', 1);
        if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
          setLatestPublished(publishedResponse.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to reload configuration after revert/undo:', error);
    }
  }, [getSelectedStoreId, getDraftOrStaticConfiguration]);

  // Handle click outside to close publish panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPublishPanel && publishPanelRef.current && !publishPanelRef.current.contains(event.target)) {
        // Check if the click is on the publish button itself
        const publishButton = event.target.closest('button');
        const isPublishButton = publishButton && publishButton.textContent.includes('Publish');

        if (!isPublishButton) {
          setShowPublishPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPublishPanel]);

  // Close sidebar and panels when entering preview mode
  useEffect(() => {
    if (showPreview) {
      setIsSidebarVisible(false);
      setSelectedElement(null);
      setShowPublishPanel(false);
    }
  }, [showPreview]);

  // Pass sample data to slot components for rendering
  const slotData = {
    ...sampleCategoryData,
    config: { viewMode }
  };

  // Main render
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
          className="bg-gray-50 category-page"
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
              {categoryLayoutConfig && categoryLayoutConfig.slots && Object.keys(categoryLayoutConfig.slots).length > 0 ? (
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
                    // Add a small delay to prevent click events from firing immediately after resize
                    setTimeout(() => setIsResizing(false), 100);
                  }}
                  selectedElementId={showPreview ? null : (selectedElement ? selectedElement.getAttribute('data-slot-id') : null)}
                  setPageConfig={setCategoryLayoutConfig}
                  saveConfiguration={saveConfiguration}
                  saveTimeoutRef={saveTimeoutRef}
                  pageConfig={categoryConfig}
                  data={slotData}
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
            console.log('🏗️ CategorySlotEditor: Passing slotConfig to EditorSidebar:', { slotId, config, categoryLayoutConfig });
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

export default CategorySlotEditor;