import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Settings
} from 'lucide-react';

const SlotEnabledFileSelector = ({
  onFileSelect,
  selectedFile = null,
  className = '',
  refreshTrigger = 0 // Add refresh trigger prop
}) => {
  const { selectedStore } = useStoreSelection();
  const [slotFiles, setSlotFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(null);

  // Define the slot-enabled files with their metadata
  const slotEnabledFiles = [
    {
      id: 'cart',
      name: 'Shopping cart',
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
  }, [selectedStore?.id, refreshTrigger]);

  const loadSlotFiles = async () => {
    setLoading(true);
    try {
      // Check which files actually exist in the codebase
      const existingFiles = [];

      for (const file of slotEnabledFiles) {
        try {
          // Check if file exists by attempting to fetch baselines
          const data = await apiClient.get('extensions/baselines');
          if (data?.success && data?.data?.files) {
            const fileExists = data.data.files.some(f => f.file_path === file.path);
            if (fileExists) {
              existingFiles.push({
                ...file,
                exists: true,
                hasSlotConfig: false // Will be updated below
              });
            }
          }
        } catch (error) {
          // File doesn't exist or API error - skip this file
          console.warn(`Could not verify existence of ${file.path}`);
        }
      }

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
                console.log(`📊 ${file.pageType} unpublished changes:`, {
                  hasConfig,
                  hasUnpublishedChanges: file.hasUnpublishedChanges,
                  draftData: draftResponse?.data
                });
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
      console.log('🎯 Handling slot-enabled file click:', file.name);

      // Ensure draft exists for this file
      const draftResult = await slotConfigurationService.ensureDraftExists(
        selectedStore.id,
        file.pageType,
        file.name
      );

      console.log('📋 Draft check result:', {
        exists: draftResult.exists,
        created: draftResult.created,
        draftId: draftResult.draft?.id,
        fileName: file.name,
        pageType: file.pageType
      });

      // Create enhanced file object with slot configuration
      const fileWithDraft = {
        name: file.name,
        path: file.path,
        type: 'file',
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

      // Still pass the file, but without slot config
      const fallbackFile = {
        name: file.name,
        path: file.path,
        type: 'file',
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

      console.log(`🔄 Refreshing ${pageType} status:`, { hasUnpublishedChanges });

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
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Slot-Enabled Pages</h3>
            <p className="text-xs text-muted-foreground">
              Select a page to customize its slots
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
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
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all hover:bg-muted/50 cursor-pointer ${
                  isCurrentFile ? 'bg-primary/10 border-primary' : 'border-border'
                }`}
                onClick={() => handleFileClick(file)}
              >
                {/* File Icon */}
                <div className="flex-shrink-0">
                  <IconComponent className={`w-5 h-5 ${file.color}`} />
                </div>

                {/* File Info */}
                <div>
                  <span className="font-medium text-sm">{file.name}</span>
                  {/* Unpublished Changes Indicator */}
                  {file.hasUnpublishedChanges && (
                      <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-1.5 py-0.5"
                      >
                        Unpublished
                      </Badge>
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
    </Card>
  );
};

export default SlotEnabledFileSelector;