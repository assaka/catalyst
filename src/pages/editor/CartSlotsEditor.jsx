/**
 * Clean CartSlotsEditor - Error-free version based on Cart.jsx
 * - Resizing and dragging with minimal complexity
 * - Click to open EditorSidebar
 * - Maintainable structure
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
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
import {
  CartHeaderSlot,
  CartItemsSlot,
  CartSummarySlot,
  CartCouponSlot,
  CartEmptyStateSlot
} from '@/components/editor/slot/slotComponentsCart';
import slotConfigurationService from '@/services/slotConfigurationService';
import { runDragDropTests } from '@/utils/dragDropTester';


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

        // Try to get the status and unpublished changes from draft configuration
        try {
          const storeId = getSelectedStoreId();
          if (storeId) {
            // Get draft configuration
            const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'cart');
            if (draftResponse && draftResponse.success && draftResponse.data) {
              setDraftConfig(draftResponse.data); // Store the full draft config
              setConfigurationStatus(draftResponse.data.status);
              // Set hasUnsavedChanges based on database field
              setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);
            }

            // Get latest published configuration for timestamp
            try {
              const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'cart', 1);
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
          // Debug: Log what we're setting
          console.log('🏗️ CartSlotsEditor: Setting initial config');
          if (finalConfig.slots && finalConfig.slots.header_title) {
            console.log('📍 header_title parentId:', finalConfig.slots.header_title.parentId);
          }
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

  // Detect changes in configuration
  useEffect(() => {
    if (configurationLoadedRef.current && cartLayoutConfig) {
      const currentConfig = JSON.stringify(cartLayoutConfig);
      if (lastSavedConfigRef.current === null) {
        // Initial load - save the initial state
        lastSavedConfigRef.current = currentConfig;
      } else if (currentConfig !== lastSavedConfigRef.current) {
        // Configuration has changed
        setHasUnsavedChanges(true);
      }
    }
  }, [cartLayoutConfig]);

  // Refresh badge status when hasUnsavedChanges changes
  useEffect(() => {
    if (configurationLoadedRef.current && hasUnsavedChanges) {
      // When user makes changes, refresh the badge to show "Unpublished"
      if (window.slotFileSelectorRefresh) {
        // Small delay to ensure the database is updated first
        setTimeout(() => {
          window.slotFileSelectorRefresh('cart');
        }, 500);
      }
    }
  }, [hasUnsavedChanges]);

  // Compute when Publish button should be enabled
  // Only enable if there are actual unsaved changes to publish
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
    const slotConfig = cartLayoutConfig && cartLayoutConfig.slots ? cartLayoutConfig.slots[slotId] : null;
    return {
      elementClasses: slotConfig?.className || '',
      elementStyles: slotConfig?.styles || {}
    };
  }, [cartLayoutConfig]);

  // Save configuration using the generic factory
  const baseSaveConfiguration = createSaveConfigurationHandler(
    cartLayoutConfig,
    setCartLayoutConfig,
    setLocalSaveStatus,
    getSelectedStoreId,
    'cart'
  );

  // Wrap save configuration to track saved state
  const saveConfiguration = useCallback(async (...args) => {
    const result = await baseSaveConfiguration(...args);
    if (result !== false) {
      // Don't clear hasUnsavedChanges when saving to draft - the draft still needs to be published
      // hasUnsavedChanges should only be cleared after successful publish, not save
      setConfigurationStatus('draft'); // Saving creates a draft
      lastSavedConfigRef.current = JSON.stringify(cartLayoutConfig);

      // Refresh the SlotEnabledFileSelector badge status after saving changes
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh('cart');
      }
    }
    return result;
  }, [baseSaveConfiguration, cartLayoutConfig]);


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

  // Wrap reset layout to also reset unsaved changes flag
  const handleResetLayout = useCallback(async () => {
    const result = await baseHandleResetLayout();
    setHasUnsavedChanges(false); // Reset should clear unsaved changes flag
    setConfigurationStatus('draft'); // Reset creates a draft
    lastSavedConfigRef.current = JSON.stringify(cartLayoutConfig);

    // Refresh the SlotEnabledFileSelector badge status after reset
    if (window.slotFileSelectorRefresh) {
      window.slotFileSelectorRefresh('cart');
    }

    return result;
  }, [baseHandleResetLayout, cartLayoutConfig]);
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
      lastSavedConfigRef.current = JSON.stringify(cartLayoutConfig);

      // Refresh the SlotEnabledFileSelector badge status
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh('cart');
      }

      setTimeout(() => setPublishStatus(''), 3000);
    } catch (error) {
      console.error('❌ Failed to publish configuration:', error);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(''), 5000);
    }
  }, [handlePublishConfiguration, cartLayoutConfig]);

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
        const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'cart');
        if (draftResponse && draftResponse.success && draftResponse.data) {
          setDraftConfig(draftResponse.data);
          setConfigurationStatus(draftResponse.data.status);
          setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);
        }

        // Update latest published
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'cart', 1);
        if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
          setLatestPublished(publishedResponse.data[0]);
        }

        // Refresh the SlotEnabledFileSelector badge status
        if (window.slotFileSelectorRefresh) {
          window.slotFileSelectorRefresh('cart');
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
            setCartLayoutConfig(finalConfig);
            lastSavedConfigRef.current = JSON.stringify(finalConfig);
          }
        } else if (revertedConfig && revertedConfig.status === 'draft' && !revertedConfig.current_edit_id) {
          // Previous draft state was restored
          setDraftConfig(revertedConfig);
          setConfigurationStatus(revertedConfig.status);
          setHasUnsavedChanges(revertedConfig.has_unpublished_changes || false);

          // Reload the cart layout configuration from the restored draft
          const configToUse = await getDraftOrStaticConfiguration();
          if (configToUse) {
            const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
            setCartLayoutConfig(finalConfig);
            lastSavedConfigRef.current = JSON.stringify(finalConfig);
          }
        } else {
          // Normal revert draft creation
          const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, 'cart');
          if (draftResponse && draftResponse.success && draftResponse.data) {
            setDraftConfig(draftResponse.data);
            setConfigurationStatus(draftResponse.data.status);
            setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);

            // Also reload the cart layout configuration
            const configToUse = await getDraftOrStaticConfiguration();
            if (configToUse) {
              const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
              setCartLayoutConfig(finalConfig);
              lastSavedConfigRef.current = JSON.stringify(finalConfig);
            }
          }
        }

        // Update latest published after revert/undo
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, 'cart', 1);
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

  // Dynamically adjust content area colSpan based on view mode
  useEffect(() => {
    if (cartLayoutConfig && cartLayoutConfig.slots && cartLayoutConfig.slots.content_area) {
      const currentColSpan = cartLayoutConfig.slots.content_area.colSpan;

      // Check if colSpan is already in the new object format
      if (typeof currentColSpan === 'object' && currentColSpan !== null) {
        // Already in object format, no need to update
        return;
      }

      // Convert old number format to new Tailwind responsive format
      if (typeof currentColSpan === 'number') {
        const newColSpanObject = {
          emptyCart: 12,
          withProducts: 'col-span-12 sm:col-span-12 lg:col-span-8'
        };

        setCartLayoutConfig(prevConfig => ({
          ...prevConfig,
          slots: {
            ...prevConfig.slots,
            content_area: {
              ...prevConfig.slots.content_area,
              colSpan: newColSpanObject
            }
          }
        }));
      }
    }
  }, [viewMode, cartLayoutConfig]);

  // Close sidebar and panels when entering preview mode
  useEffect(() => {
    if (showPreview) {
      setIsSidebarVisible(false);
      setSelectedElement(null);
      setShowPublishPanel(false);
    }
  }, [showPreview]);

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
