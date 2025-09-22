/**
 * useSlotConfiguration - Custom hook for managing slot configuration save/load
 * Reusable across all page editors (Cart, Product, Category, etc.)
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { slotConfigurationService as apiService } from '@/lib/api/slot-configuration-service';
import { SlotManager } from '@/utils/slotUtils';
import { createDefaultConfiguration, hasDefaultSlots } from '@/utils/defaultSlotConfigurations';

// ===============================
// UTILITY HOOKS FOR SLOT EDITORS
// ===============================

/**
 * Generic hook for loading layout configurations
 * @param {Object} store - The store object containing store.id
 * @param {string} pageType - The type of page (e.g., 'cart', 'category', 'product')
 * @param {string} configModulePath - Path to the fallback config module (e.g., '@/components/editor/slot/configs/cart-config')
 * @returns {Object} - { layoutConfig, configLoaded, reloadConfig }
 */
export function useLayoutConfig(store, pageType, configModulePath) {
    const [layoutConfig, setLayoutConfig] = useState(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    const loadLayoutConfig = async () => {
        if (!store?.id) {
            return;
        }
        if (configLoaded && layoutConfig) {
            return;
        }

        try {
            // Load published configuration using the new versioning API
            const response = await apiService.getPublishedConfiguration(store.id, pageType);

            // Check for various "no published config" scenarios
            if (response.success && response.data &&
                response.data.configuration &&
                response.data.configuration.slots &&
                Object.keys(response.data.configuration.slots).length > 0) {

                const publishedConfig = response.data;
                setLayoutConfig(publishedConfig.configuration);
                setConfigLoaded(true);

            } else {
                // Any scenario where we don't have a valid published configuration
                const noConfigReasons = [];
                if (!response.success) noConfigReasons.push('API response not successful');
                if (!response.data) noConfigReasons.push('No response data');
                if (response.data && !response.data.configuration) noConfigReasons.push('No configuration in response');
                if (response.data?.configuration && !response.data.configuration.slots) noConfigReasons.push('No slots in configuration');
                if (response.data?.configuration?.slots && Object.keys(response.data.configuration.slots).length === 0) noConfigReasons.push('Empty slots object');

                // Fallback to config module
                const configModule = await import(configModulePath);
                const config = configModule.default || configModule[`${pageType}Config`];

                const fallbackConfig = {
                    slots: { ...config.slots },
                    metadata: {
                        ...config.metadata,
                        fallbackUsed: true,
                        fallbackReason: `No valid published configuration: ${noConfigReasons.join(', ')}`
                    }
                };

                setLayoutConfig(fallbackConfig);
                setConfigLoaded(true);
            }
        } catch (error) {
            console.error(`❌ Error loading published ${pageType} slot configuration:`, error);
            console.error('❌ Error type:', error.constructor.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Network status:', navigator.onLine ? 'Online' : 'Offline');

            if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
                console.error('🔌 Backend connectivity issue detected');
            }

            console.warn(`⚠️ Falling back to ${pageType}-config.js due to error`);

            // Fallback to config module
            try {
                const configModule = await import(configModulePath);
                const config = configModule.default || configModule[`${pageType}Config`];

                const fallbackConfig = {
                    slots: { ...config.slots },
                    metadata: {
                        ...config.metadata,
                        fallbackUsed: true,
                        fallbackReason: `Error loading configuration: ${error.message}`
                    }
                };

                setLayoutConfig(fallbackConfig);
                setConfigLoaded(true);
            } catch (importError) {
                console.error(`❌ Failed to import fallback config from ${configModulePath}:`, importError);
                // Set empty config if fallback also fails
                setLayoutConfig({ slots: {}, metadata: { fallbackUsed: true, fallbackReason: 'Failed to load any configuration' } });
                setConfigLoaded(true);
            }
        }
    };

    useEffect(() => {
        loadLayoutConfig();

        // Listen for configuration updates from editor
        const handleStorageChange = (e) => {
            if (e.key === 'slot_config_updated' && e.newValue) {
                const updateData = JSON.parse(e.newValue);
                if (updateData.storeId === store?.id && updateData.pageType === pageType) {
                    loadLayoutConfig();
                    // Clear the notification
                    localStorage.removeItem('slot_config_updated');
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [store?.id]);

    return {
        layoutConfig,
        configLoaded,
        reloadConfig: loadLayoutConfig
    };
}

// Timestamp formatting utilities
export const useTimestampFormatting = () => {
  const formatDate = useCallback((dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatTimeAgo = useCallback((dateString) => {
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
  }, [formatDate]);

  return { formatDate, formatTimeAgo };
};

// Draft status management hook
export const useDraftStatusManagement = (storeId, pageType) => {
  const [draftConfig, setDraftConfig] = useState(null);
  const [latestPublished, setLatestPublished] = useState(null);
  const [configurationStatus, setConfigurationStatus] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadDraftStatus = useCallback(async () => {
    try {
      if (storeId) {
        // Get draft configuration
        const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);
        if (draftResponse && draftResponse.success && draftResponse.data) {
          setDraftConfig(draftResponse.data);
          setConfigurationStatus(draftResponse.data.status);
          setHasUnsavedChanges(draftResponse.data.has_unpublished_changes || false);
        }

        // Get latest published configuration for timestamp
        try {
          const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, pageType, 1);
          if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
            setLatestPublished(publishedResponse.data[0]);
          }
        } catch (publishedError) {
          console.log('Could not get latest published version:', publishedError);
        }
      }
    } catch (error) {
      console.log('Could not determine configuration status:', error);
      setConfigurationStatus('published');
      setHasUnsavedChanges(false);
    }
  }, [storeId, pageType]);

  return {
    draftConfig, setDraftConfig,
    latestPublished, setLatestPublished,
    configurationStatus, setConfigurationStatus,
    hasUnsavedChanges, setHasUnsavedChanges,
    loadDraftStatus
  };
};

// Configuration change detection hook
export const useConfigurationChangeDetection = (configurationLoadedRef, pageConfig, setHasUnsavedChanges) => {
  const lastSavedConfigRef = useRef(null);

  useEffect(() => {
    if (configurationLoadedRef.current && pageConfig) {
      const currentConfig = JSON.stringify(pageConfig);
      if (lastSavedConfigRef.current === null) {
        // Initial load - save the initial state
        lastSavedConfigRef.current = currentConfig;
      } else if (currentConfig !== lastSavedConfigRef.current) {
        // Configuration has changed
        setHasUnsavedChanges(true);
      }
    }
  }, [pageConfig, configurationLoadedRef, setHasUnsavedChanges]);

  const updateLastSavedConfig = useCallback((config) => {
    lastSavedConfigRef.current = JSON.stringify(config);
  }, []);

  return { lastSavedConfigRef, updateLastSavedConfig };
};

// Badge refresh hook
export const useBadgeRefresh = (configurationLoadedRef, hasUnsavedChanges, pageType) => {
  useEffect(() => {
    if (configurationLoadedRef.current && hasUnsavedChanges) {
      if (window.slotFileSelectorRefresh) {
        setTimeout(() => {
          window.slotFileSelectorRefresh(pageType);
        }, 500);
      }
    }
  }, [hasUnsavedChanges, configurationLoadedRef, pageType]);
};

// Generic publish hook
export const usePublishHandler = (pageType, pageConfig, handlePublishConfiguration, setters) => {
  const [publishStatus, setPublishStatus] = useState('');

  const handlePublish = useCallback(async () => {
    console.log(`🚀 handlePublish called for ${pageType} - closing sidebar`);
    setPublishStatus('publishing');

    // Close sidebar when publishing
    setters.setIsSidebarVisible(false);
    setters.setSelectedElement(null);

    try {
      await handlePublishConfiguration();
      setPublishStatus('published');
      setters.setHasUnsavedChanges(false);  // Mark as saved after successful publish
      setters.setConfigurationStatus('draft'); // Set to draft since new draft was created based on published
      setters.updateLastSavedConfig(pageConfig);

      // Refresh the SlotEnabledFileSelector badge status
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh(pageType);
      }

      setTimeout(() => setPublishStatus(''), 3000);
    } catch (error) {
      console.error(`❌ Failed to publish ${pageType} configuration:`, error);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(''), 5000);
    }
  }, [handlePublishConfiguration, pageConfig, pageType, setters]);

  return { handlePublish, publishStatus };
};

// Generic reset layout hook
export const useResetLayoutHandler = (pageType, baseHandleResetLayout, pageConfig, setters) => {
  const handleResetLayout = useCallback(async () => {
    const result = await baseHandleResetLayout();
    setters.setHasUnsavedChanges(false); // Reset should clear unsaved changes flag
    setters.setConfigurationStatus('draft'); // Reset creates a draft
    setters.updateLastSavedConfig(pageConfig);

    // Refresh the SlotEnabledFileSelector badge status after reset
    if (window.slotFileSelectorRefresh) {
      window.slotFileSelectorRefresh(pageType);
    }

    return result;
  }, [baseHandleResetLayout, pageConfig, pageType, setters]);

  return { handleResetLayout };
};

// Generic save configuration hook
export const useSaveConfigurationHandler = (pageType, baseSaveConfiguration, pageConfig, setters) => {
  const saveConfiguration = useCallback(async (...args) => {
    const result = await baseSaveConfiguration(...args);
    if (result !== false) {
      // Don't clear hasUnsavedChanges when saving to draft - the draft still needs to be published
      // hasUnsavedChanges should only be cleared after successful publish, not save
      setters.setConfigurationStatus('draft'); // Saving creates a draft
      setters.updateLastSavedConfig(pageConfig);

      // Refresh the SlotEnabledFileSelector badge status after saving changes
      if (window.slotFileSelectorRefresh) {
        window.slotFileSelectorRefresh(pageType);
      }
    }
    return result;
  }, [baseSaveConfiguration, pageConfig, pageType, setters]);

  return { saveConfiguration };
};

// Generic publish panel handlers wrapper
export const usePublishPanelHandlerWrappers = (pageType, baseHandlers, setters) => {
  const handlePublishPanelPublished = useCallback(async (publishedConfig) => {
    // Close sidebar when publishing from panel
    setters.setIsSidebarVisible(false);
    setters.setSelectedElement(null);

    try {
      const result = await baseHandlers.handlePublishPanelPublished(publishedConfig);
      if (result) {
        if (result.draftConfig !== undefined) setters.setDraftConfig(result.draftConfig);
        if (result.configurationStatus) setters.setConfigurationStatus(result.configurationStatus);
        if (result.hasUnsavedChanges !== undefined) setters.setHasUnsavedChanges(result.hasUnsavedChanges);
        if (result.latestPublished) setters.setLatestPublished(result.latestPublished);
      }
    } catch (error) {
      console.error(`Failed to handle publish panel published for ${pageType}:`, error);
    }
  }, [baseHandlers.handlePublishPanelPublished, pageType, setters]);

  const handlePublishPanelReverted = useCallback(async (revertedConfig) => {
    try {
      const result = await baseHandlers.handlePublishPanelReverted(revertedConfig);
      if (result) {
        if (result.draftConfig !== undefined) setters.setDraftConfig(result.draftConfig);
        if (result.configurationStatus) setters.setConfigurationStatus(result.configurationStatus);
        if (result.hasUnsavedChanges !== undefined) setters.setHasUnsavedChanges(result.hasUnsavedChanges);
        if (result.latestPublished) setters.setLatestPublished(result.latestPublished);
        if (result.pageConfig) {
          setters.setPageConfig(result.pageConfig);
          setters.updateLastSavedConfig(result.pageConfig);
        }
      }
    } catch (error) {
      console.error(`Failed to handle publish panel reverted for ${pageType}:`, error);
    }
  }, [baseHandlers.handlePublishPanelReverted, pageType, setters]);

  return { handlePublishPanelPublished, handlePublishPanelReverted };
};

// Click outside panel handler
export const useClickOutsidePanel = (showPanel, panelRef, setShowPanel) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPanel && panelRef.current && !panelRef.current.contains(event.target)) {
        const publishButton = event.target.closest('button');
        const isPublishButton = publishButton && publishButton.textContent.includes('Publish');

        if (!isPublishButton) {
          setShowPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel, panelRef, setShowPanel]);
};

// Preview mode handler
export const usePreviewModeHandlers = (showPreview, setIsSidebarVisible, setSelectedElement, setShowPublishPanel) => {
  useEffect(() => {
    if (showPreview) {
      setIsSidebarVisible(false);
      setSelectedElement(null);
      setShowPublishPanel(false);
    }
  }, [showPreview, setIsSidebarVisible, setSelectedElement, setShowPublishPanel]);
};

// Publish panel handlers hook
export const usePublishPanelHandlers = (pageType, getSelectedStoreId, getDraftOrStaticConfiguration, setPageConfig, slotConfigurationService) => {
  const handlePublishPanelPublished = useCallback(async () => {
    console.log(`📋 handlePublishPanelPublished called for ${pageType} - closing sidebar`);

    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);
        if (draftResponse && draftResponse.success && draftResponse.data) {
          // Return the updated draft data for the editor to handle
          return {
            draftConfig: draftResponse.data,
            configurationStatus: draftResponse.data.status,
            hasUnsavedChanges: draftResponse.data.has_unpublished_changes || false
          };
        }

        // Update latest published
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, pageType, 1);
        if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
          return {
            latestPublished: publishedResponse.data[0]
          };
        }

        // Refresh the SlotEnabledFileSelector badge status
        if (window.slotFileSelectorRefresh) {
          window.slotFileSelectorRefresh(pageType);
        }
      }
    } catch (error) {
      console.error('Failed to reload draft after publish:', error);
      throw error;
    }
  }, [pageType, getSelectedStoreId]);

  const handlePublishPanelReverted = useCallback(async (revertedConfig) => {
    try {
      const storeId = getSelectedStoreId();
      if (storeId) {
        if (revertedConfig === null) {
          // Draft was completely deleted
          const configToUse = await getDraftOrStaticConfiguration();
          if (configToUse) {
            const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
            return {
              draftConfig: null,
              configurationStatus: 'published',
              hasUnsavedChanges: false,
              pageConfig: finalConfig
            };
          }
        } else if (revertedConfig && revertedConfig.status === 'draft' && !revertedConfig.current_edit_id) {
          // Previous draft state was restored
          const configToUse = await getDraftOrStaticConfiguration();
          if (configToUse) {
            const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
            return {
              draftConfig: revertedConfig,
              configurationStatus: revertedConfig.status,
              hasUnsavedChanges: revertedConfig.has_unpublished_changes || false,
              pageConfig: finalConfig
            };
          }
        } else {
          // Normal revert draft creation
          const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);
          if (draftResponse && draftResponse.success && draftResponse.data) {
            const configToUse = await getDraftOrStaticConfiguration();
            if (configToUse) {
              const finalConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
              return {
                draftConfig: draftResponse.data,
                configurationStatus: draftResponse.data.status,
                hasUnsavedChanges: draftResponse.data.has_unpublished_changes || false,
                pageConfig: finalConfig
              };
            }
          }
        }

        // Update latest published after revert/undo
        const publishedResponse = await slotConfigurationService.getVersionHistory(storeId, pageType, 1);
        if (publishedResponse && publishedResponse.success && publishedResponse.data && publishedResponse.data.length > 0) {
          return {
            latestPublished: publishedResponse.data[0]
          };
        }
      }
    } catch (error) {
      console.error('Failed to reload configuration after revert/undo:', error);
      throw error;
    }
  }, [pageType, getSelectedStoreId, getDraftOrStaticConfiguration]);

  return { handlePublishPanelPublished, handlePublishPanelReverted };
};

// Configuration initialization hook
export const useConfigurationInitialization = (pageType, pageName, slotType, getSelectedStoreId, getDraftOrStaticConfiguration, loadDraftStatus) => {
  const configurationLoadedRef = useRef(false);

  const initializeConfig = useCallback(async () => {
    if (configurationLoadedRef.current) return null;

    try {
      // Use the hook function to get configuration (either draft or static)
      const configToUse = await getDraftOrStaticConfiguration();

      if (!configToUse) {
        throw new Error(`Failed to load ${pageType} configuration`);
      }

      // Load draft status
      await loadDraftStatus();

      // Transform database config if needed
      let finalConfig = configToUse;
      if (configToUse.slots && Object.keys(configToUse.slots).length > 0) {
        const dbConfig = slotConfigurationService.transformFromSlotConfigFormat(configToUse);
        if (dbConfig && dbConfig.slots && Object.keys(dbConfig.slots).length > 0) {
          finalConfig = dbConfig;
        }
      } else {
        finalConfig = {
          ...configToUse,
          slots: {}
        };
      }

      configurationLoadedRef.current = true;
      return finalConfig;

    } catch (error) {
      console.error(`❌ Failed to initialize ${pageType} configuration:`, error);

      // Set a minimal fallback configuration - let the editor handle defaults
      const fallbackConfig = {
        page_name: pageName,
        slot_type: slotType,
        slots: {},
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0',
          pageType: pageType,
          error: 'Failed to load configuration'
        },
        cmsBlocks: []
      };

      configurationLoadedRef.current = true;
      return fallbackConfig;
    }
  }, [pageType, pageName, slotType, getDraftOrStaticConfiguration, loadDraftStatus]);

  return { initializeConfig, configurationLoadedRef };
};

// Generic editor initialization hook
export const useEditorInitialization = (initializeConfig, setPageConfig, createDefaultSlots = null) => {
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      let finalConfig = await initializeConfig();

      if (finalConfig && isMounted) {
        // If createDefaultSlots is provided (for CategorySlotsEditor), check if we need default slots
        if (createDefaultSlots && (!finalConfig.slots || Object.keys(finalConfig.slots).length === 0)) {
          finalConfig = {
            ...finalConfig,
            slots: createDefaultSlots()
          };
        }

        setPageConfig(finalConfig);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [initializeConfig, setPageConfig, createDefaultSlots]);
};

// Generic view mode adjustments hook
export const useViewModeAdjustments = (pageConfig, setPageConfig, viewMode, adjustmentRules) => {
  useEffect(() => {
    if (!pageConfig || !pageConfig.slots || !adjustmentRules) return;

    let hasChanges = false;
    const updatedSlots = { ...pageConfig.slots };

    // Apply adjustment rules
    Object.entries(adjustmentRules).forEach(([slotId, rules]) => {
      if (updatedSlots[slotId]) {
        Object.entries(rules).forEach(([property, adjustmentConfig]) => {
          const currentValue = updatedSlots[slotId][property];

          // Check if adjustment is needed based on the current value type
          if (adjustmentConfig.shouldAdjust && adjustmentConfig.shouldAdjust(currentValue)) {
            updatedSlots[slotId] = {
              ...updatedSlots[slotId],
              [property]: adjustmentConfig.newValue
            };
            hasChanges = true;
          }
        });
      }
    });

    // Apply changes if any were made
    if (hasChanges) {
      setPageConfig(prevConfig => ({
        ...prevConfig,
        slots: updatedSlots
      }));
    }
  }, [viewMode, pageConfig, setPageConfig, adjustmentRules]);
};

export const filterSlotsByViewMode = (childSlots, viewMode) => {
  return childSlots.filter(slot => {
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true; // Show if no viewMode specified
    }
    return slot.viewMode.includes(viewMode);
  });
};

export const sortSlotsByGridCoordinates = (filteredSlots) => {
  return filteredSlots.sort((a, b) => {
    // Use grid coordinates (col, row) - all slots should have these now
    const hasGridCoordsA = a.position && (a.position.col !== undefined && a.position.row !== undefined);
    const hasGridCoordsB = b.position && (b.position.col !== undefined && b.position.row !== undefined);

    if (hasGridCoordsA && hasGridCoordsB) {
      // Sort by row first, then by column
      const rowA = a.position.row;
      const rowB = b.position.row;

      if (rowA !== rowB) {
        return rowA - rowB;
      }

      // Same row, sort by column
      const colA = a.position.col;
      const colB = b.position.col;
      if (colA !== colB) {
        return colA - colB;
      }
    }

    // Default: maintain original order for slots without coordinates
    return 0;
  });
};

// Helper function to dynamically load page-specific config
async function loadPageConfig(pageType) {
  let config;
  switch (pageType) {
    case 'cart': {
      const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = cartConfig;
      break;
    }
    case 'category': {
      const { categoryConfig } = await import('@/components/editor/slot/configs/category-config');
      config = categoryConfig;
      break;
    }
    case 'product': {
      const { productConfig } = await import('@/components/editor/slot/configs/product-config');
      config = productConfig;
      break;
    }
    case 'checkout': {
      const { checkoutConfig } = await import('@/components/editor/slot/configs/checkout-config');
      config = checkoutConfig;
      break;
    }
    case 'success': {
      const { successConfig } = await import('@/components/editor/slot/configs/success-config');
      config = successConfig;
      break;
    }
    default: {
      const { cartConfig: fallbackConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = fallbackConfig;
    }
  }
  return config;
}

// Helper function to create clean slots from config
function createCleanSlots(config) {
  const cleanSlots = {};
  if (config.slots) {
    Object.entries(config.slots).forEach(([key, slot]) => {
      // Only copy serializable properties, ensure no undefined values
      cleanSlots[key] = {
        id: slot.id || key,
        type: slot.type || 'container',
        content: slot.content || '',
        className: slot.className || '',
        parentClassName: slot.parentClassName || '',
        styles: slot.styles ? { ...slot.styles } : {},
        parentId: slot.parentId === undefined ? null : slot.parentId,
        layout: slot.layout || null,
        gridCols: slot.gridCols || null,
        colSpan: slot.colSpan || 12,
        rowSpan: slot.rowSpan || 1,
        position: slot.position ? { ...slot.position } : null,
        viewMode: slot.viewMode ? [...slot.viewMode] : [],
        metadata: slot.metadata ? { ...slot.metadata } : {}
      };
    });
  }
  return cleanSlots;
}

export function useSlotConfiguration({
  pageType,
  pageName,
  slotType,
  selectedStore
}) {

  // Generic reset layout function
  const handleResetLayout = useCallback(async () => {
    try {

      // Load the clean static configuration for this page type
      const config = await loadPageConfig(pageType);

      if (!config || !config.slots) {
        throw new Error(`${pageType} configuration is invalid or missing slots`);
      }

      // Create clean slots
      const cleanSlots = createCleanSlots(config);

      const cleanConfig = {
        page_name: config.page_name || pageName,
        slot_type: config.slot_type || slotType,
        slots: cleanSlots,
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0',
          pageType: pageType
        },
        cmsBlocks: config.cmsBlocks ? [...config.cmsBlocks] : []
      };

      // Save the clean config to database (this will overwrite any existing draft)
      // Pass isReset=true to set has_unpublished_changes = false
      const storeId = selectedStore?.id;
      if (storeId) {
        await slotConfigurationService.saveConfiguration(storeId, cleanConfig, pageType, true);
      }


      return cleanConfig;
    } catch (error) {
      console.error(`❌ Failed to reset ${pageType} layout:`, error);
      throw error;
    }
  }, [selectedStore, pageType, pageName, slotType]);

  // Generic publish configuration function
  const handlePublishConfiguration = useCallback(async () => {
    try {
      const storeId = selectedStore?.id;
      if (!storeId) {
        throw new Error('No store selected');
      }

      // Get the current draft configuration
      const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);

      if (!draftResponse.success || !draftResponse.data) {
        throw new Error('No draft configuration found to publish');
      }

      const draftConfig = draftResponse.data;

      // Publish the draft configuration
      const publishResponse = await slotConfigurationService.publishDraft(draftConfig.id);

      if (publishResponse.success) {

        // Create a new draft based on the published configuration
        try {
          const publishedConfig = draftConfig.configuration; // The configuration that was just published
          await slotConfigurationService.createDraftFromPublished(storeId, publishedConfig, pageType);
        } catch (draftError) {
          console.warn(`⚠️ Failed to create new draft after publish:`, draftError);
          // Don't fail the entire publish operation if draft creation fails
        }

        return publishResponse;
      } else {
        throw new Error('Failed to publish configuration');
      }
    } catch (error) {
      console.error(`❌ Failed to publish ${pageType} configuration:`, error);
      throw error;
    }
  }, [selectedStore, pageType]);

  // Generic load static configuration function
  const loadStaticConfiguration = useCallback(async () => {

    const config = await loadPageConfig(pageType);

    if (!config || !config.slots) {
      throw new Error(`${pageType} configuration is invalid or missing slots`);
    }

    const cleanSlots = createCleanSlots(config);

    const configToUse = {
      page_name: config.page_name || pageName,
      slot_type: config.slot_type || slotType,
      slots: cleanSlots,
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0',
        pageType: pageType
      },
      cmsBlocks: config.cmsBlocks ? [...config.cmsBlocks] : []
    };

    return configToUse;
  }, [pageType, pageName, slotType]);

  // Generic get draft or static configuration
  const getDraftOrStaticConfiguration = useCallback(async () => {
    const storeId = selectedStore?.id;
    let configToUse = null;

    // Always load the static configuration first to get the base structure
    const staticConfig = await loadStaticConfiguration();

    // Try to load from database and merge with static config
    if (storeId) {
      try {
        const savedConfig = await slotConfigurationService.getDraftConfiguration(storeId, pageType, staticConfig);

        if (savedConfig && savedConfig.success && savedConfig.data && savedConfig.data.configuration) {
          const dbConfig = savedConfig.data.configuration;

          // Merge saved config with static config, preserving viewMode and metadata from static
          const mergedSlots = {};

          // Start with static config slots to ensure all viewMode arrays are preserved
          Object.entries(staticConfig.slots).forEach(([slotId, staticSlot]) => {
            const savedSlot = dbConfig.slots?.[slotId];

            mergedSlots[slotId] = {
              ...staticSlot, // Start with static slot (includes viewMode, metadata, etc.)
              ...(savedSlot ? {
                // Only override with saved properties that should be persisted
                content: savedSlot.content !== undefined ? savedSlot.content : staticSlot.content,
                className: savedSlot.className !== undefined ? savedSlot.className : staticSlot.className,
                parentClassName: savedSlot.parentClassName !== undefined ? savedSlot.parentClassName : staticSlot.parentClassName,
                parentId: savedSlot.parentId !== undefined ? savedSlot.parentId : staticSlot.parentId,
                styles: savedSlot.styles ? { ...staticSlot.styles, ...savedSlot.styles } : staticSlot.styles,
                colSpan: savedSlot.colSpan !== undefined ? savedSlot.colSpan : staticSlot.colSpan,
                rowSpan: savedSlot.rowSpan !== undefined ? savedSlot.rowSpan : staticSlot.rowSpan,
                position: savedSlot.position ? { ...staticSlot.position, ...savedSlot.position } : staticSlot.position
              } : {})
            };
          });

          // Add any new slots that exist in database but not in static config
          if (dbConfig.slots) {
            Object.entries(dbConfig.slots).forEach(([slotId, savedSlot]) => {
              if (!staticConfig.slots[slotId]) {
                mergedSlots[slotId] = savedSlot;
              }
            });
          }

          configToUse = {
            ...staticConfig,
            ...dbConfig,
            slots: mergedSlots
          };

        }
      } catch (dbError) {
        // No saved configuration found, will use static config as fallback
      }
    }

    // If no saved config found or merging failed, use the static configuration
    if (!configToUse) {
      configToUse = staticConfig;
    }

    return configToUse;
  }, [selectedStore, pageType, loadStaticConfiguration]);

  // Generic validation function for slot configurations
  const validateSlotConfiguration = useCallback((slots) => {
    if (!slots || typeof slots !== 'object') return false;

    // Check for required properties in each slot
    for (const [slotId, slot] of Object.entries(slots)) {
      if (!slot.id || slot.id !== slotId) {
        console.error(`❌ Slot ${slotId} has invalid or missing id`);
        return false;
      }

      if (!slot.type) {
        console.error(`❌ Slot ${slotId} missing type`);
        return false;
      }

      // Ensure viewMode is always an array
      if (slot.viewMode && !Array.isArray(slot.viewMode)) {
        console.error(`❌ Slot ${slotId} has invalid viewMode (not an array)`);
        return false;
      }

      // Validate parentId references
      if (slot.parentId && slot.parentId !== null && !slots[slot.parentId]) {
        console.error(`❌ Slot ${slotId} references non-existent parent ${slot.parentId}`);
        return false;
      }
    }

    // Ensure main_layout has null parentId
    if (slots.main_layout && slots.main_layout.parentId !== null) {
      console.error('❌ main_layout must have parentId: null');
      return false;
    }

    return true;
  }, []);

  // Generic slot creation function
  const createSlot = useCallback((slotType, content = '', parentId = 'main_layout', additionalProps = {}, slots) => {
    const newSlotId = `new_${slotType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newSlot = {
      id: newSlotId,
      type: slotType,
      content: content,
      className: slotType === 'container' ? 'p-4 border border-gray-200 rounded' :
                slotType === 'text' ? 'text-base text-gray-900' :
                slotType === 'image' ? 'w-full h-auto' : '',
      parentClassName: '',
      styles: slotType === 'container' ? { minHeight: '80px' } : {},
      parentId: parentId,
      position: { col: 1, row: 1 },
      colSpan: slotType === 'container' ? 12 : 6, // Containers full width, others half width
      rowSpan: 1,
      viewMode: ['emptyCart', 'withProducts'], // Show in both modes by default
      isCustom: true, // Mark as custom slot for deletion
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        hierarchical: true,
        ...additionalProps
      }
    };

    const updatedSlots = { ...slots };
    updatedSlots[newSlotId] = newSlot;

    // No need to update order - slots use grid coordinates

    return { updatedSlots, newSlotId };
  }, []);

  // Helper function to get the parent of a parent
  const getParentOfParent = (slots, slotId) => {
    const slot = slots[slotId];
    if (!slot || !slot.parentId) return null;
    const parent = slots[slot.parentId];
    return parent?.parentId || null;
  };

  // Generic slot drop handler
  const handleSlotDrop = useCallback((draggedSlotId, targetSlotId, dropPosition, slots) => {

    if (draggedSlotId === targetSlotId) {
      return null;
    }

    const targetSlot = slots[targetSlotId];
    if (!targetSlot) {
      return null;
    }

    // Prevent moving critical layout containers
    if (draggedSlotId === 'main_layout') {
      return null;
    }

    // Also prevent moving other root containers into wrong places
    if (['header_container', 'content_area', 'sidebar_area'].includes(draggedSlotId) &&
        dropPosition !== 'after' && dropPosition !== 'before') {
      return null;
    }


    // Create a deep clone to avoid mutations
    const updatedSlots = JSON.parse(JSON.stringify(slots));
    const draggedSlot = updatedSlots[draggedSlotId];
    const updatedTargetSlot = updatedSlots[targetSlotId];

    if (!draggedSlot || !updatedTargetSlot) {
      console.error('❌ Slot not found:', { draggedSlotId, targetSlotId });
      return null;
    }

    // Store ALL original properties to preserve them
    const originalProperties = {
      id: draggedSlot.id,
      type: draggedSlot.type,
      content: draggedSlot.content,
      className: draggedSlot.className,
      parentClassName: draggedSlot.parentClassName,
      parentId: draggedSlot.parentId,  // CRITICAL: Must preserve parentId!
      styles: draggedSlot.styles || {},
      layout: draggedSlot.layout,
      gridCols: draggedSlot.gridCols,
      colSpan: draggedSlot.colSpan,
      rowSpan: draggedSlot.rowSpan,
      viewMode: draggedSlot.viewMode,
      metadata: draggedSlot.metadata || {},
      position: draggedSlot.position || {}
    };

    // Calculate new position based on drop zone
    let newParentId, newPosition;

    // Helper function to find next available position in a container
    const findAvailablePosition = (parentId, preferredRow = 1, preferredCol = 1) => {
      const siblings = Object.values(updatedSlots).filter(slot =>
        slot.parentId === parentId && slot.id !== draggedSlotId
      );

      // Try the preferred position first
      let row = preferredRow;
      let col = preferredCol;

      // Find an available position by checking for conflicts
      let positionFound = false;
      for (let r = row; r <= row + 10 && !positionFound; r++) {
        for (let c = col; c <= 12 && !positionFound; c++) {
          const hasConflict = siblings.some(sibling =>
            sibling.position?.row === r && sibling.position?.col === c
          );
          if (!hasConflict) {
            row = r;
            col = c;
            positionFound = true;
          }
        }
        col = 1; // Reset column for next row
      }

      return { col, row };
    };

    // Determine if this is container-to-container or intra-container reordering
    const isContainerTarget = ['container', 'grid', 'flex'].includes(targetSlot.type);
    const currentParent = originalProperties.parentId;
    const targetParent = targetSlot.parentId;

    if (dropPosition === 'inside' && isContainerTarget) {
      // Check if this is really a cross-container move or accidental parent hit
      if (originalProperties.parentId && targetSlotId === getParentOfParent(slots, originalProperties.parentId)) {
        // User dragged to grandparent container - likely trying to reorder within current parent
        newParentId = originalProperties.parentId;

        // Find an early position in the container (row 1)
        const siblings = Object.values(slots).filter(slot =>
          slot.parentId === originalProperties.parentId && slot.id !== draggedSlotId
        );
        const minRow = Math.min(...siblings.map(s => s.position?.row || 1));
        newPosition = { col: 1, row: Math.max(1, minRow - 1) };

      } else {
        // Genuine container-to-container move
        newParentId = targetSlotId;
        newPosition = findAvailablePosition(newParentId, 1, 1);
      }

    } else if ((dropPosition === 'before' || dropPosition === 'after') && currentParent === targetParent) {
      // Intra-container reordering - same parent, different position
      newParentId = currentParent;

      if (dropPosition === 'before') {
        // Take target's position, shift target and others down/right
        newPosition = {
          col: targetSlot.position?.col || 1,
          row: targetSlot.position?.row || 1
        };
      } else { // after
        // Place after target - use next available position
        const targetPos = targetSlot.position || { col: 1, row: 1 };

        // Try placing in next column, but ensure it's different from current position
        let newCol = targetPos.col + 1;
        let newRow = targetPos.row;

        // If at end of row or same as current position, go to next row
        if (newCol > 12 || (newCol === originalProperties.position?.col && newRow === originalProperties.position?.row)) {
          newCol = 1;
          newRow = targetPos.row + 1;
        }

        newPosition = { col: newCol, row: newRow };
      }

    } else if ((dropPosition === 'before' || dropPosition === 'after') && currentParent !== targetParent) {
      // Different parents - move to target's parent container
      newParentId = targetParent;

      // Use position relative to target
      if (dropPosition === 'before') {
        newPosition = {
          col: targetSlot.position?.col || 1,
          row: targetSlot.position?.row || 1
        };
      } else {
        const targetPos = targetSlot.position || { col: 1, row: 1 };
        // For cross-container moves, place after target
        if (targetPos.col < 12) {
          newPosition = { col: targetPos.col + 1, row: targetPos.row };
        } else {
          newPosition = { col: 1, row: targetPos.row + 1 };
        }
      }

    } else {
      // Invalid drop - should only be for "inside" on non-containers
      return null;
    }

    // Position validation completed

    // Update dragged slot position while preserving ALL essential properties
    updatedSlots[draggedSlotId] = {
      ...originalProperties,
      parentId: newParentId,
      position: newPosition,
      metadata: {
        ...originalProperties.metadata,
        lastModified: new Date().toISOString()
      }
    };

    // Ensure we preserve viewMode array properly
    if (Array.isArray(originalProperties.viewMode)) {
      updatedSlots[draggedSlotId].viewMode = [...originalProperties.viewMode];
    }

    // Handle slot shifting for intra-container reordering
    if (currentParent === newParentId && (dropPosition === 'before' || dropPosition === 'after')) {
      // Shift other slots in the same container to make room
      Object.keys(updatedSlots).forEach(slotId => {
        if (slotId !== draggedSlotId) {
          const slot = updatedSlots[slotId];
          if (slot.parentId === newParentId && slot.position) {
            const needsShift = (
              slot.position.row > newPosition.row ||
              (slot.position.row === newPosition.row && slot.position.col >= newPosition.col)
            );

            if (needsShift) {
              // Shift this slot forward
              if (slot.position.col < 12) {
                slot.position = {
                  ...slot.position,
                  col: slot.position.col + 1
                };
              } else {
                // Move to next row if at end of columns
                slot.position = {
                  col: 1,
                  row: slot.position.row + 1
                };
              }
            }
          }
        }
      });
    }

    // Validate the updated configuration before applying
    if (!validateSlotConfiguration(updatedSlots)) {
      console.error('❌ Configuration validation failed after drag, reverting changes');
      return null;
    }

    return updatedSlots;
  }, [validateSlotConfiguration]);

  // Generic slot delete handler
  const handleSlotDelete = useCallback((slotId, slots) => {

    // Don't allow deleting critical layout containers
    if (['main_layout', 'header_container', 'content_area', 'sidebar_area'].includes(slotId)) {
      console.warn('⚠️ Cannot delete critical layout container:', slotId);
      return null;
    }

    // Use SlotManager to delete the slot and its children
    const updatedSlots = SlotManager.deleteSlot(slots, slotId);
    return updatedSlots;
  }, []);

  // Generic grid resize handler
  const handleGridResize = useCallback((slotId, newColSpan, slots) => {
    const updatedSlots = { ...slots };

    if (updatedSlots[slotId]) {
      // Update hierarchical slot colSpan
      updatedSlots[slotId] = {
        ...updatedSlots[slotId],
        colSpan: newColSpan
      };
    }

    return updatedSlots;
  }, []);

  // Generic slot height resize handler
  const handleSlotHeightResize = useCallback((slotId, newHeight, slots) => {
    const updatedSlots = { ...slots };

    if (updatedSlots[slotId]) {
      // Calculate row span based on height (rough approximation: 40px per row)
      const estimatedRowSpan = Math.max(1, Math.round(newHeight / 40));

      // Update the slot's height and rowSpan
      updatedSlots[slotId] = {
        ...updatedSlots[slotId],
        rowSpan: estimatedRowSpan,
        styles: {
          ...updatedSlots[slotId].styles,
          minHeight: `${newHeight}px`
        }
      };
    }

    return updatedSlots;
  }, []);

  // Generic text change handler
  const handleTextChange = useCallback((slotId, newText, slots) => {
    const updatedSlots = { ...slots };

    if (updatedSlots[slotId]) {
      updatedSlots[slotId] = {
        ...updatedSlots[slotId],
        content: newText,
        metadata: {
          ...updatedSlots[slotId].metadata,
          lastModified: new Date().toISOString()
        }
      };
    }

    return updatedSlots;
  }, []);

  // Generic class change handler
  const handleClassChange = useCallback((slotId, className, styles, isAlignmentChange = false, slots) => {

    const updatedSlots = { ...slots };

    if (updatedSlots[slotId]) {
      // Merge existing styles with new styles
      const existingStyles = updatedSlots[slotId].styles || {};
      const mergedStyles = { ...existingStyles, ...styles };

      // Define categories of classes
      const alignmentClasses = ['text-left', 'text-center', 'text-right'];
      const allClasses = className.split(' ').filter(Boolean);

      if (isAlignmentChange || allClasses.some(cls => alignmentClasses.includes(cls))) {
        // For alignment changes, only alignment goes to parent, everything else to element
        const alignmentClassList = allClasses.filter(cls => alignmentClasses.includes(cls));
        const elementClassList = allClasses.filter(cls => !alignmentClasses.includes(cls));

        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          className: elementClassList.join(' '),
          parentClassName: alignmentClassList.join(' '),
          styles: mergedStyles,
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
      } else {
        // For text styling (bold, italic, colors), keep existing parentClassName
        // and only update className for the text element
        updatedSlots[slotId] = {
          ...updatedSlots[slotId],
          className: className,
          styles: mergedStyles,
          metadata: {
            ...updatedSlots[slotId].metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
    }

    return updatedSlots;
  }, []);

  // Generic element click handler
  const createElementClickHandler = useCallback((isResizing, lastResizeEndTime, setSelectedElement, setIsSidebarVisible) => {
    return useCallback((slotId, element) => {
      // Don't open sidebar if currently resizing or within 200ms of resize end
      const timeSinceResize = Date.now() - lastResizeEndTime.current;
      if (isResizing || timeSinceResize < 200) {
        return;
      }

      // If element is a ResizeWrapper, find the actual content element inside
      let actualElement = element;

      if (element && element.classList && element.classList.contains('resize-none')) {
        // This is a ResizeWrapper child, look for the actual content element
        const button = element.querySelector('button');
        const svg = element.querySelector('svg');
        const input = element.querySelector('input');

        // Use the most specific element found
        actualElement = button || svg || input || element;
      }

      setSelectedElement(actualElement);
      setIsSidebarVisible(true);
    }, [isResizing, lastResizeEndTime, setSelectedElement, setIsSidebarVisible]);
  }, []);

  // Generic handler factories that take page-specific dependencies
  const createSaveConfigurationHandler = useCallback((pageConfig, setPageConfig, setLocalSaveStatus, getSelectedStoreId, slotType) => {
    return useCallback(async (configToSave = pageConfig) => {
      if (!configToSave) return;

      // Validate configuration before saving
      if (!validateSlotConfiguration(configToSave.slots)) {
        console.error('❌ Cannot save invalid configuration');
        setLocalSaveStatus('error');
        setTimeout(() => setLocalSaveStatus(''), 5000);
        return;
      }

      setLocalSaveStatus('saving');

      try {
        const storeId = getSelectedStoreId();
        if (storeId) {
          await slotConfigurationService.saveConfiguration(storeId, configToSave, slotType);
        }

        setLocalSaveStatus('saved');
        setTimeout(() => setLocalSaveStatus(''), 3000);
      } catch (error) {
        console.error('❌ Save failed:', error);
        setLocalSaveStatus('error');
        setTimeout(() => setLocalSaveStatus(''), 5000);
      }
    }, [pageConfig, setPageConfig, setLocalSaveStatus, getSelectedStoreId, slotType]);
  }, [validateSlotConfiguration]);

  const createHandlerFactory = useCallback((setPageConfig, saveConfigurationHandler) => {
    return {
      createTextChangeHandler: (textChangeHandler) =>
        useCallback((slotId, newText) => {
          setPageConfig(prevConfig => {
            const updatedSlots = textChangeHandler(slotId, newText, prevConfig?.slots || {});
            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots
            };

            // Auto-save
            saveConfigurationHandler(updatedConfig);
            return updatedConfig;
          });
        }, [textChangeHandler, saveConfigurationHandler]),

      createClassChangeHandler: (classChangeHandler) =>
        useCallback((slotId, className, styles, isAlignmentChange = false) => {
          setPageConfig(prevConfig => {
            const updatedSlots = classChangeHandler(slotId, className, styles, isAlignmentChange, prevConfig?.slots || {});
            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots
            };

            // Auto-save
            saveConfigurationHandler(updatedConfig);
            return updatedConfig;
          });
        }, [classChangeHandler, saveConfigurationHandler]),

      createGridResizeHandler: (gridResizeHandler, saveTimeoutRef) =>
        useCallback((slotId, newColSpan) => {
          setPageConfig(prevConfig => {
            const updatedSlots = gridResizeHandler(slotId, newColSpan, prevConfig?.slots || {});
            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots
            };

            // Debounced auto-save - clear previous timeout and set new one
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
              saveConfigurationHandler(updatedConfig);
            }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

            return updatedConfig;
          });
        }, [gridResizeHandler, saveConfigurationHandler]),

      createSlotHeightResizeHandler: (slotHeightResizeHandler, saveTimeoutRef) =>
        useCallback((slotId, newHeight) => {
          setPageConfig(prevConfig => {
            const updatedSlots = slotHeightResizeHandler(slotId, newHeight, prevConfig?.slots || {});
            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots
            };

            // Debounced auto-save - clear previous timeout and set new one
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
              saveConfigurationHandler(updatedConfig);
            }, 500); // Wait 0.5 seconds after resize stops for more responsive feel

            return updatedConfig;
          });
        }, [slotHeightResizeHandler, saveConfigurationHandler]),

      createSlotDropHandler: (slotDropHandler, isDragOperationActiveRef) =>
        useCallback(async (draggedSlotId, targetSlotId, dropPosition) => {
          // Mark drag operation as active to prevent config reloads
          isDragOperationActiveRef.current = true;

          const updatedConfig = await new Promise((resolve) => {
            setPageConfig(prevConfig => {
              if (!prevConfig?.slots) {
                console.error('❌ No valid configuration to update');
                resolve(null);
                return prevConfig;
              }

              // Use the hook function to handle the drop logic
              const updatedSlots = slotDropHandler(draggedSlotId, targetSlotId, dropPosition, prevConfig.slots);

              if (!updatedSlots) {
                resolve(null);
                return prevConfig;
              }

              const newConfig = {
                ...prevConfig,
                slots: updatedSlots,
                metadata: {
                  ...prevConfig.metadata,
                  lastModified: new Date().toISOString()
                }
              };

              resolve(newConfig);
              return newConfig;
            });
          });

          if (updatedConfig) {
            try {
              await saveConfigurationHandler(updatedConfig);
              // Mark drag operation as complete after save
              setTimeout(() => {
                isDragOperationActiveRef.current = false;
              }, 2000); // 2 second protection after save
            } catch (error) {
              console.error('❌ Failed to save configuration:', error);
              isDragOperationActiveRef.current = false;
            }
          } else {
            console.warn('⚠️ No updated configuration to save - drag operation was cancelled');
            isDragOperationActiveRef.current = false;
          }
        }, [slotDropHandler, saveConfigurationHandler]),

      createSlotCreateHandler: (createSlot) =>
        useCallback((slotType, content = '', parentId = 'main_layout', additionalProps = {}) => {
          setPageConfig(prevConfig => {
            const { updatedSlots, newSlotId } = createSlot(slotType, content, parentId, additionalProps, prevConfig?.slots || {});

            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots,
              metadata: {
                ...prevConfig.metadata,
                lastModified: new Date().toISOString()
              }
            };

            // Auto-save the new slot
            saveConfigurationHandler(updatedConfig);
            return updatedConfig;
          });
        }, [createSlot, saveConfigurationHandler]),

      createSlotDeleteHandler: (handleSlotDelete) =>
        useCallback((slotId) => {
          setPageConfig(prevConfig => {
            const updatedSlots = handleSlotDelete(slotId, prevConfig?.slots || {});

            if (!updatedSlots) {
              console.warn('⚠️ Slot deletion was cancelled');
              return prevConfig;
            }

            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots,
              metadata: {
                ...prevConfig.metadata,
                lastModified: new Date().toISOString()
              }
            };

            // Auto-save the updated configuration
            saveConfigurationHandler(updatedConfig);
            return updatedConfig;
          });
        }, [handleSlotDelete, saveConfigurationHandler]),

      createResetLayoutHandler: (resetLayoutFromHook, setLocalSaveStatus) =>
        useCallback(async () => {
          setLocalSaveStatus('saving');

          try {
            const newConfig = await resetLayoutFromHook();
            setPageConfig(newConfig);

            setLocalSaveStatus('saved');
            setTimeout(() => setLocalSaveStatus(''), 3000);
          } catch (error) {
            console.error('❌ Failed to reset layout:', error);
            setLocalSaveStatus('error');
            setTimeout(() => setLocalSaveStatus(''), 5000);
          }
        }, [resetLayoutFromHook, setLocalSaveStatus])
    };
  }, []);

  return {
    handleResetLayout,
    handlePublishConfiguration,
    getDraftOrStaticConfiguration,
    createSlot,
    handleSlotDrop,
    handleSlotDelete,
    handleGridResize,
    handleSlotHeightResize,
    handleTextChange,
    handleClassChange,
    createElementClickHandler,
    createSaveConfigurationHandler,
    createHandlerFactory
  };
}