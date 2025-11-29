import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useAIWorkspace, PAGE_TYPES, DEFAULT_VIEW_MODES } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import slotConfigurationService from '@/services/slotConfigurationService';

// Import page-specific editors (legacy)
import HeaderSlotsEditor from '@/pages/editor/HeaderSlotsEditor';
import CartSlotsEditor from '@/pages/editor/CartSlotsEditor';
import CategorySlotsEditor from '@/pages/editor/CategorySlotsEditor';
import ProductSlotsEditor from '@/pages/editor/ProductSlotsEditor';
import AccountSlotsEditor from '@/pages/editor/AccountSlotsEditor';
import LoginSlotsEditor from '@/pages/editor/LoginSlotsEditor';
import CheckoutSlotsEditor from '@/pages/editor/CheckoutSlotsEditor';
import SuccessSlotsEditor from '@/pages/editor/SuccessSlotsEditor';

// Import new stable editor
import WorkspaceSlotEditor from './WorkspaceSlotEditor';

// Import configs for default slots
import { productConfig } from '@/components/editor/slot/configs/product-config';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';
import { cartConfig } from '@/components/editor/slot/configs/cart-config';
import { checkoutConfig } from '@/components/editor/slot/configs/checkout-config';
import { accountConfig } from '@/components/editor/slot/configs/account-config';
import { loginConfig } from '@/components/editor/slot/configs/login-config';
import { successConfig } from '@/components/editor/slot/configs/success-config';
import { headerConfig } from '@/components/editor/slot/configs/header-config';

import { slotEnabledFiles } from '@/components/editor/slot/slotEnabledFiles';
import { Package, Loader2 } from 'lucide-react';

// Simple ID generator (no external dependencies)
const generateSlotId = () => `slot_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;

/**
 * WorkspaceCanvas - Editor canvas component for AI Workspace
 * Renders the appropriate slot editor based on selected page type
 */

const WorkspaceCanvas = () => {
  const {
    selectedPageType,
    editorMode,
    viewMode,
    updateConfiguration,
    markAsSaved,
    setIsLoading,
    currentConfiguration,
    registerSlotHandlers,
    useStableEditor,
    selectedSlotId,
    setSelectedSlotId
  } = useAIWorkspace();

  const { getSelectedStoreId } = useStoreSelection();
  const slotsRef = useRef(currentConfiguration?.slots || {});
  const [slots, setSlots] = useState({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const storeId = getSelectedStoreId();

  // Get default config for page type
  const getDefaultConfigForPage = useCallback((pageType) => {
    switch (pageType) {
      case PAGE_TYPES.PRODUCT: return productConfig;
      case PAGE_TYPES.CATEGORY: return categoryConfig;
      case PAGE_TYPES.CART: return cartConfig;
      case PAGE_TYPES.CHECKOUT: return checkoutConfig;
      case PAGE_TYPES.ACCOUNT: return accountConfig;
      case PAGE_TYPES.LOGIN: return loginConfig;
      case PAGE_TYPES.SUCCESS: return successConfig;
      case PAGE_TYPES.HEADER: return headerConfig;
      default: return productConfig;
    }
  }, []);

  // Load slots configuration when using stable editor
  useEffect(() => {
    const loadSlots = async () => {
      if (!useStableEditor || !storeId) return;

      setIsLoadingSlots(true);
      try {
        const defaultConfig = getDefaultConfigForPage(selectedPageType);
        const response = await slotConfigurationService.getDraftConfiguration(
          storeId,
          selectedPageType,
          defaultConfig
        );

        if (response?.data?.configuration?.slots) {
          setSlots(response.data.configuration.slots);
          updateConfiguration(response.data.configuration);
        } else if (defaultConfig?.slots) {
          setSlots(defaultConfig.slots);
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        // Fall back to default config
        const defaultConfig = getDefaultConfigForPage(selectedPageType);
        if (defaultConfig?.slots) {
          setSlots(defaultConfig.slots);
        }
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedPageType, storeId, useStableEditor, getDefaultConfigForPage, updateConfiguration]);

  // Handle slots change from the new editor - auto-save
  const handleSlotsChange = useCallback(async (newSlots) => {
    setSlots(newSlots);

    // Update context
    updateConfiguration({ slots: newSlots });

    // Auto-save to draft
    try {
      const config = currentConfiguration || {};
      await slotConfigurationService.updateDraftConfiguration(
        config.id,
        { ...config, slots: newSlots },
        storeId
      );
      console.log('AI Workspace: Slots auto-saved');
    } catch (error) {
      console.error('Error auto-saving slots:', error);
    }
  }, [currentConfiguration, storeId, updateConfiguration]);

  // Keep slotsRef in sync with current configuration
  useEffect(() => {
    slotsRef.current = currentConfiguration?.slots || {};
  }, [currentConfiguration]);

  // Get current page info for display
  const currentPage = useMemo(() => {
    return slotEnabledFiles.find(f => f.pageType === selectedPageType);
  }, [selectedPageType]);

  /**
   * Create a new slot with given properties
   */
  const createSlot = useCallback((type, content, parentId, options = {}, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const newId = generateSlotId();

    const newSlot = {
      id: newId,
      type,
      content: content || '',
      parentId: parentId || null,
      className: options.className || '',
      styles: options.styles || {},
      colSpan: options.colSpan || 12,
      rowSpan: options.rowSpan || 1,
      position: options.position || { col: 1, row: 1 },
      metadata: options.metadata || {}
    };

    return {
      ...slots,
      [newId]: newSlot
    };
  }, []);

  /**
   * Delete a slot by ID
   */
  const handleSlotDelete = useCallback((slotId, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const newSlots = { ...slots };
    delete newSlots[slotId];
    return newSlots;
  }, []);

  /**
   * Update slot classes and styles
   */
  const handleClassChange = useCallback((slotId, className, styles, metadata, merge = false, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const slot = slots[slotId];
    if (!slot) return slots;

    return {
      ...slots,
      [slotId]: {
        ...slot,
        className: merge ? `${slot.className} ${className}`.trim() : className,
        styles: merge ? { ...slot.styles, ...styles } : styles,
        ...(metadata && { metadata: { ...slot.metadata, ...metadata } })
      }
    };
  }, []);

  /**
   * Update slot text content
   */
  const handleTextChange = useCallback((slotId, newText, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const slot = slots[slotId];
    if (!slot) return slots;

    return {
      ...slots,
      [slotId]: {
        ...slot,
        content: newText
      }
    };
  }, []);

  /**
   * Handle slot drag and drop
   */
  const handleSlotDrop = useCallback((slotId, targetId, position, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const slot = slots[slotId];
    if (!slot) return slots;

    const targetSlot = slots[targetId];

    let newParentId;
    if (position === 'inside') {
      newParentId = targetId;
    } else {
      newParentId = targetSlot?.parentId || null;
    }

    return {
      ...slots,
      [slotId]: {
        ...slot,
        parentId: newParentId
      }
    };
  }, []);

  /**
   * Update slot configuration properties
   */
  const updateSlotConfig = useCallback((slotId, updates, currentSlots) => {
    const slots = currentSlots || slotsRef.current;
    const slot = slots[slotId];
    if (!slot) return slots;

    return {
      ...slots,
      [slotId]: {
        ...slot,
        ...updates
      }
    };
  }, []);

  // Register slot handlers with context for AI access
  useEffect(() => {
    const handlers = {
      createSlot,
      handleSlotDelete,
      handleClassChange,
      handleTextChange,
      handleSlotDrop,
      updateSlotConfig
    };
    registerSlotHandlers(handlers);
  }, [createSlot, handleSlotDelete, handleClassChange, handleTextChange, handleSlotDrop, updateSlotConfig, registerSlotHandlers]);

  // Handle save from editor
  const handleSave = async (configToSave) => {
    try {
      setIsLoading(true);
      const storeId = getSelectedStoreId();
      const response = await slotConfigurationService.saveConfiguration(
        storeId,
        configToSave,
        selectedPageType
      );
      console.log('AI Workspace: Configuration saved successfully:', response);
      markAsSaved();
      return response;
    } catch (error) {
      console.error(`AI Workspace: Failed to save ${selectedPageType} configuration:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate editor based on page type
  const renderEditor = () => {
    const mode = editorMode ? 'edit' : 'preview';
    const currentViewMode = viewMode || DEFAULT_VIEW_MODES[selectedPageType];

    const editorProps = {
      mode,
      viewMode: currentViewMode,
      onSave: handleSave
    };

    switch (selectedPageType) {
      case PAGE_TYPES.HEADER:
        return <HeaderSlotsEditor {...editorProps} />;

      case PAGE_TYPES.PRODUCT:
        return <ProductSlotsEditor {...editorProps} />;

      case PAGE_TYPES.CATEGORY:
        return <CategorySlotsEditor {...editorProps} />;

      case PAGE_TYPES.CART:
        return <CartSlotsEditor {...editorProps} slotType={selectedPageType} />;

      case PAGE_TYPES.ACCOUNT:
        return <AccountSlotsEditor {...editorProps} />;

      case PAGE_TYPES.LOGIN:
        return <LoginSlotsEditor {...editorProps} />;

      case PAGE_TYPES.CHECKOUT:
        return <CheckoutSlotsEditor {...editorProps} />;

      case PAGE_TYPES.SUCCESS:
        return <SuccessSlotsEditor {...editorProps} />;

      default:
        // Fallback to product editor
        return <ProductSlotsEditor {...editorProps} />;
    }
  };

  // Loading state for stable editor
  if (useStableEditor && isLoadingSlots) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-sm text-gray-500">Loading slots...</p>
        </div>
      </div>
    );
  }

  // Empty state when no editor mode and showing preview
  if (!editorMode && !currentPage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400 max-w-md px-4">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg mb-2">Click "Editor" to start editing</p>
          <p className="text-sm">
            Toggle editor mode to select a page and start customizing your layout.
            Use the AI assistant to describe changes you want to make.
          </p>
        </div>
      </div>
    );
  }

  // New stable editor
  if (useStableEditor) {
    return (
      <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900 overflow-auto">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPage?.name || selectedPageType} Layout
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag to reorder, resize from edges, click to select
              </p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              {Object.keys(slots).length} slots
            </div>
          </div>

          <WorkspaceSlotEditor
            slots={slots}
            onSlotsChange={handleSlotsChange}
            onSlotSelect={setSelectedSlotId}
            selectedSlotId={selectedSlotId}
            className="min-h-[600px]"
          />
        </div>
      </div>
    );
  }

  // Legacy editor
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>
    </div>
  );
};

export default WorkspaceCanvas;
