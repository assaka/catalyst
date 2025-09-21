import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import apiClient from '@/api/client';
import slotConfigurationService from '@/services/slotConfigurationService';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import {
  ShoppingCart,
  Package,
  CreditCard,
  CheckCircle,
  Grid3X3,
  RefreshCw,
  Loader2
} from 'lucide-react';

const SlotEnabledFileSelector = ({
  onFileSelect,
  selectedFile = null,
  className = '',
  refreshTrigger = 0, // Add refresh trigger prop
  files = null // Accept files array as prop
}) => {
  const { selectedStore } = useStoreSelection();
  const [slotFiles, setSlotFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(null);

  // Define the slot-enabled files with their metadata
  const slotEnabledFiles = [
    {
      id: 'cart',
      name: 'Cart',
      path: 'src/pages/editor/CartSlotsEditor.jsx',
      pageType: 'cart',
      icon: ShoppingCart,
      description: 'Shopping cart page with slot customization',
      color: 'text-blue-500'
    },
    {
      id: 'category',
      name: 'Category',
      path: 'src/pages/editor/CategorySlotsEditor.jsx',
      pageType: 'category',
      icon: Grid3X3,
      description: 'Product category listing page',
      color: 'text-green-500'
    },
    {
      id: 'product',
      name: 'Product',
      path: 'src/pages/editor/ProductSlotsEditor.jsx',
      pageType: 'product',
      icon: Package,
      description: 'Product detail page with customizable slots',
      color: 'text-purple-500'
    },
    {
      id: 'checkout',
      name: 'Checkout',
      path: 'src/pages/editor/CheckoutSlotsEditor.jsx',
      pageType: 'checkout',
      icon: CreditCard,
      description: 'Checkout flow with payment integration',
      color: 'text-orange-500'
    },
    {
      id: 'success',
      name: 'Success',
      path: 'src/pages/editor/SuccessSlotsEditor.jsx',
      pageType: 'success',
      icon: CheckCircle,
      description: 'Order confirmation and success page',
      color: 'text-emerald-500'
    }
  ];

  useEffect(() => {
    loadSlotFiles();
  }, [selectedStore?.id, refreshTrigger, files]);

  const loadSlotFiles = async () => {
    setLoading(true);
    try {
      // Use files prop if provided, otherwise use default slotEnabledFiles
      const filesToProcess = files || slotEnabledFiles;

      // Mark all files as existing since we're not checking file_baselines anymore
      const existingFiles = filesToProcess.map(file => ({
        ...file,
        exists: true,
        hasSlotConfig: false // Will be updated below
      }));

      // Check slot configuration status for existing files
      if (selectedStore?.id) {
        for (const file of existingFiles) {
          try {
            const hasConfig = await slotConfigurationService.hasDraftConfiguration(
              selectedStore.id,
              file.pageType
            );
            file.hasSlotConfig = hasConfig;

            // Check for unpublished changes
            if (hasConfig) {
              try {
                const draftResponse = await slotConfigurationService.getDraftConfiguration(
                  selectedStore.id,
                  file.pageType
                );
                file.hasUnpublishedChanges = draftResponse?.data?.has_unpublished_changes || false;
              } catch (error) {
                console.warn(`Could not check unpublished changes for ${file.pageType}:`, error);
                file.hasUnpublishedChanges = false;
              }
            } else {
              file.hasUnpublishedChanges = false;
            }
          } catch (error) {
            console.warn(`Could not check slot config for ${file.pageType}:`, error);
            file.hasUnpublishedChanges = false;
          }
        }
      }

      setSlotFiles(existingFiles);
    } catch (error) {
      console.error('Error loading slot files:', error);
      // Fallback to showing all files without existence verification
      setSlotFiles(slotEnabledFiles.map(file => ({
        ...file,
        exists: true,
        hasSlotConfig: false,
        hasUnpublishedChanges: false
      })));
    }
    setLoading(false);
  };


  const handleFileClick = async (file) => {
    if (!selectedStore?.id) {
      console.warn('No store selected');
      return;
    }

    setLoadingDraft(file.id);

    try {

      // Ensure draft exists for this file
      const draftResult = await slotConfigurationService.ensureDraftExists(
        selectedStore.id,
        file.pageType,
        file.name
      );

      // Create enhanced file object with slot configuration, preserving all original properties
      const fileWithDraft = {
        ...file, // Keep all original properties (id, pageType, icon, color, description, etc.)
        slotConfiguration: {
          hasDraft: true,
          draftId: draftResult.draft.id,
          created: draftResult.created,
          pageType: file.pageType,
          configuration: draftResult.draft.configuration
        }
      };

      // Update the slot config status in our local state
      setSlotFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === file.id ? {
            ...f,
            hasSlotConfig: true,
            hasUnpublishedChanges: draftResult.draft.has_unpublished_changes || false
          } : f
        )
      );

      onFileSelect && onFileSelect(fileWithDraft);

    } catch (error) {
      console.error('❌ Error handling slot configuration:', error);

      // Still pass the file, but without slot config, preserving all original properties
      const fallbackFile = {
        ...file, // Keep all original properties (id, pageType, icon, color, description, etc.)
        slotConfiguration: { error: error.message }
      };

      onFileSelect && onFileSelect(fallbackFile);
    } finally {
      setLoadingDraft(null);
    }
  };


  const handleRefresh = () => {
    loadSlotFiles();
  };

  // Method to refresh unpublished status for a specific page type
  const refreshPageStatus = async (pageType) => {
    if (!selectedStore?.id) return;

    try {
      const draftResponse = await slotConfigurationService.getDraftConfiguration(
        selectedStore.id,
        pageType
      );
      const hasUnpublishedChanges = draftResponse?.data?.has_unpublished_changes || false;

      // Update the specific file's status
      setSlotFiles(prevFiles =>
        prevFiles.map(file =>
          file.pageType === pageType
            ? { ...file, hasUnpublishedChanges }
            : file
        )
      );
    } catch (error) {
      console.warn(`Could not refresh status for ${pageType}:`, error);
      // Set to false if we can't fetch the status
      setSlotFiles(prevFiles =>
        prevFiles.map(file =>
          file.pageType === pageType
            ? { ...file, hasUnpublishedChanges: false }
            : file
        )
      );
    }
  };

  // Expose the refresh function to parent components
  React.useEffect(() => {
    if (window.slotFileSelectorRefresh) {
      window.slotFileSelectorRefresh = refreshPageStatus;
    } else {
      window.slotFileSelectorRefresh = refreshPageStatus;
    }
  }, [selectedStore?.id]);

  if (loading) {
    return (
      <Card className={`h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-muted-foreground">Loading slot-enabled files...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}

      <div className="flex items-center justify-between border-b bg-gray-50 dark:bg-gray-800 px-2 py-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Editable Pages
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs px-3 py-2">
        Select to customize
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {slotFiles.map((file) => {
            const IconComponent = file.icon;
            const isCurrentFile = selectedFile?.path === file.path;

            return (
              <div
                key={file.id}
                className={`flex justify-between items-center rounded-lg border transition-all hover:bg-muted/50 cursor-pointer p-2 ${
                  isCurrentFile ? 'bg-primary/10 border-primary' : 'border-border'
                }`}
                onClick={() => handleFileClick(file)}
              >
                {/* File Icon */}
                <div className="flex gap-2">
                  <IconComponent className={`w-5 h-5 ${file.color}`} />
                  <span className="font-medium text-sm">{file.name}</span>
                </div>

                {/* File Info */}
                <div className="flex justify-between">
                  {/* Unpublished Changes Indicator */}
                  {file.hasUnpublishedChanges && (
                      <span className="flex w-3 h-3 me-3 bg-yellow-300 rounded-full" title="Dot"></span>
                  )}
                  {/* Loading indicator */}
                  {loadingDraft === file.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SlotEnabledFileSelector;