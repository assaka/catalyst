import React, { useMemo } from 'react';
import { useAIWorkspace, PAGE_TYPES, DEFAULT_VIEW_MODES } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import slotConfigurationService from '@/services/slotConfigurationService';

// Import page-specific editors
import HeaderSlotsEditor from '@/pages/editor/HeaderSlotsEditor';
import CartSlotsEditor from '@/pages/editor/CartSlotsEditor';
import CategorySlotsEditor from '@/pages/editor/CategorySlotsEditor';
import ProductSlotsEditor from '@/pages/editor/ProductSlotsEditor';
import AccountSlotsEditor from '@/pages/editor/AccountSlotsEditor';
import LoginSlotsEditor from '@/pages/editor/LoginSlotsEditor';
import CheckoutSlotsEditor from '@/pages/editor/CheckoutSlotsEditor';
import SuccessSlotsEditor from '@/pages/editor/SuccessSlotsEditor';

import { slotEnabledFiles } from '@/components/editor/slot/slotEnabledFiles';
import { Package } from 'lucide-react';

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
    setIsLoading
  } = useAIWorkspace();

  const { getSelectedStoreId } = useStoreSelection();

  // Get current page info for display
  const currentPage = useMemo(() => {
    return slotEnabledFiles.find(f => f.pageType === selectedPageType);
  }, [selectedPageType]);

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
