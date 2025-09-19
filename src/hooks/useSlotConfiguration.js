/**
 * useSlotConfiguration - Custom hook for managing slot configuration save/load
 * Reusable across all page editors (Cart, Product, Category, etc.)
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { SlotManager } from '@/utils/slotUtils';
import {
  GridResizeHandle,
  GridColumn,
  EditableElement,
  HierarchicalSlotRenderer
} from '@/components/editor/slot/SlotComponents';

// Helper function to dynamically load page-specific config
async function loadPageConfig(pageType) {
  let config;
  switch (pageType) {
    case 'cart':
      const { cartConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = cartConfig;
      break;
    case 'category':
      const { categoryConfig } = await import('@/components/editor/slot/configs/category-config');
      config = categoryConfig;
      break;
    case 'product':
      const { productConfig } = await import('@/components/editor/slot/configs/product-config');
      config = productConfig;
      break;
    case 'checkout':
      const { checkoutConfig } = await import('@/components/editor/slot/configs/checkout-config');
      config = checkoutConfig;
      break;
    case 'success':
      const { successConfig } = await import('@/components/editor/slot/configs/success-config');
      config = successConfig;
      break;
    default:
      const { cartConfig: fallbackConfig } = await import('@/components/editor/slot/configs/cart-config');
      config = fallbackConfig;
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
  selectedStore,
  updateConfiguration,
  onSave,
  microSlotDefinitions
}) {
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [resetStatus, setResetStatus] = useState(''); // '', 'resetting', 'reset', 'error'
  const saveStatusTimeoutRef = useRef(null);
  const justSavedRef = useRef(false);

  // Generic save configuration function
  const saveConfiguration = useCallback(async ({
    slotContent
  }) => {
    console.log(`💾 ===== SAVE CONFIGURATION STARTED (${pageName}) =====`);
    setSaveStatus('saving');

    // Create slot configuration directly
    const slots = {};

    // Combine all slot data into the slots structure
    const allSlotIds = new Set([
      ...Object.keys(slotContent || {})
    ]);

    // Process each slot with content only - styles/classes now come from slot config
    allSlotIds.forEach(id => {
      slots[id] = {
        content: slotContent[id] || '',
        metadata: {
          lastModified: new Date().toISOString()
        }
      };
    });

    const config = {
      page_name: pageName,
      slot_type: slotType,
      slots,
      metadata: {
        lastModified: new Date().toISOString(),
        version: '1.0',
        pageType: pageType
      }
    };

    try {
      const storeId = selectedStore?.id;

      if (!storeId) {
        console.warn('⚠️ No store ID available, cannot save to database');
        return;
      }

      if (storeId && updateConfiguration) {
        try {
          // Set flag to prevent reload after save
          justSavedRef.current = true;
          await updateConfiguration(config);
        } catch (error) {
          console.error('❌ Failed to save configuration:', error);
          throw error;
        }
      } else {
        console.warn('⚠️ Cannot save - missing storeId or updateConfiguration function');
      }

      // Call the parent onSave callback
      onSave?.(config);

      // Show saved status
      setSaveStatus('saved');

      // Clear status after 2 seconds
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);

      return true;
    } catch (error) {
      console.error('❌ Failed to save configuration to database:', error);

      if (error.response?.status === 413) {
        console.error('❌ Payload too large! Configuration size exceeds server limit');
        alert('Configuration is too large to save to database. Try removing some custom slots or content.');
      } else if (error.response?.status === 400) {
        console.error('❌ Bad request:', error.response?.data?.error);
      }

      setSaveStatus('saved'); // Still show saved for localStorage

      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 2000);

      return true;
    }
  }, [pageName, slotType, pageType, selectedStore, updateConfiguration, onSave]);

  // Generic load configuration function
  const loadConfiguration = useCallback(async ({
    setSlotContent
  }) => {
    try {
      const storeId = selectedStore?.id;
      console.log(`📥 Load attempt (${pageName}) - Store ID check:`, {
        selectedStore,
        storeId,
        hasStoreId: !!storeId
      });

      if (!storeId) {
        console.log('No store ID found, initializing with default configuration');

        const defaultSpans = {};
        Object.entries(microSlotDefinitions || {}).forEach(([key, def]) => {
          defaultSpans[key] = { ...def.defaultSpans };
        });
        console.log('🎯 LOAD DEBUG: Initialized defaults (no store ID)');
        return;
      }

      // Load from database
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const endpoint = `${apiBaseUrl}/api/public/slot-configurations?store_id=${storeId}`;

      console.log(`📥 Loading configurations from public endpoint (${pageName}):`, endpoint);

      const response = await fetch(endpoint);
      let configurations = [];

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Load Response data:', data);

        if (data.success && data.data) {
          configurations = data.data;
        }
      } else {
        console.warn('⚠️ Failed to load from public endpoint:', response.status, response.statusText);
      }

      console.log('📥 Load Configurations array:', configurations);

      // Find the configuration for this page type
      const pageConfig = configurations?.find(cfg =>
        cfg.configuration?.page_name === pageName &&
        cfg.configuration?.slot_type === slotType
      );

      if (pageConfig) {
        const dbRecord = pageConfig;
        console.log('📦 Full database record:', dbRecord);
        const config = dbRecord.configuration;

        if (!config) {
          console.error('⚠️ No configuration found in database record');
          return;
        }

        // Load from config.slots structure - only content, styles/classes now in slot config
        if (config.slots) {
          console.log('📥 Loading from slots structure:', config.slots);
          const loadedContent = {};

          Object.entries(config.slots).forEach(([slotId, slotData]) => {
            if (slotData.content !== undefined) {
              loadedContent[slotId] = slotData.content;
            }
          });

          console.log('📥 Loaded content:', loadedContent);

          if (setSlotContent) {
            setSlotContent(prev => ({ ...prev, ...loadedContent }));
          }
        }

        console.log(`✅ Configuration loaded successfully (${pageName})`);
      } else {
        console.log('No configuration found in database, initializing with defaults');

          const defaultSpans = {};
          Object.entries(microSlotDefinitions || {}).forEach(([key, def]) => {
            defaultSpans[key] = { ...def.defaultSpans };
          });
      }
    } catch (error) {
      console.error(`Failed to load configuration from database (${pageName}):`, error);
     }
  }, [pageName, slotType, selectedStore, microSlotDefinitions]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }
  }, []);

  // Apply draft configuration to component state
  const applyDraftConfiguration = useCallback((draftConfig, setters) => {
    if (!draftConfig?.configuration) return;

    // Skip reload if we just saved to prevent overriding user changes
    if (justSavedRef.current) {
      console.log('🚫 Skipping config reload - just saved');
      justSavedRef.current = false;
      return;
    }

    const config = draftConfig.configuration;
    console.log('🔄 LOADING CONFIG STRUCTURE CHECK:', {
      configKeys: Object.keys(config),
      hasSlotContent: !!config.slotContent,
      hasNewStructure: !!config.slots,
      slots: config.slots,
      fullConfig: config
    });

    // Load from the slots structure (the only structure we should use)
    if (config.slots) {
      const extractedContent = {};

      Object.entries(config.slots).forEach(([slotId, slotData]) => {
        if (slotData?.content !== undefined) {
          extractedContent[slotId] = slotData.content;
        }
      });

      console.log('📦 Loading from slots structure:', {
        content: extractedContent
      });

    } else {
      console.warn('⚠️ No slots structure found in configuration');
    }

  }, [microSlotDefinitions]);

  // Helper function for view mode changes
  const updateSlotsForViewMode = useCallback((requiredSlots, flashMessageContent, setters) => {
   setters.setSlotContent?.(prev => ({
      ...prev,
      'flashMessage.content': flashMessageContent
    }));
  }, []);

  // Generic reset layout function
  const handleResetLayout = useCallback(async () => {
    try {
      setResetStatus('resetting');

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

      setResetStatus('reset');
      setTimeout(() => setResetStatus(''), 3000);

      console.log(`✅ ${pageType} layout reset to clean configuration from ${pageType}-config.js`);

      return cleanConfig;
    } catch (error) {
      console.error(`❌ Failed to reset ${pageType} layout:`, error);
      setResetStatus('error');
      setTimeout(() => setResetStatus(''), 5000);
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
        console.log(`✅ ${pageType} configuration published successfully`);

        // Create a new draft based on the published configuration
        try {
          const publishedConfig = draftConfig.configuration; // The configuration that was just published
          await slotConfigurationService.createDraftFromPublished(storeId, publishedConfig, pageType);
          console.log(`✅ New draft created based on published ${pageType} configuration`);
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
    console.log('📂 Loading static configuration as template...');

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

    console.log(`📦 Using static ${pageType} configuration as template`);
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
        console.log('💾 Attempting to load saved configuration from database...');
        const savedConfig = await slotConfigurationService.getDraftConfiguration(storeId, pageType);

        if (savedConfig && savedConfig.success && savedConfig.data && savedConfig.data.configuration) {
          console.log('📄 Database configuration found:', savedConfig.data.configuration);
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

          console.log('🔄 Merged database config with static config to preserve viewMode arrays');
        }
      } catch (dbError) {
        console.log('📝 No saved configuration found, will use static config as fallback:', dbError.message);
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

  // Generic slot drop handler
  const handleSlotDrop = useCallback((draggedSlotId, targetSlotId, dropPosition, slots) => {
    console.log(`🎯 START: handleSlotDrop(${draggedSlotId}, ${targetSlotId}, ${dropPosition})`);

    // Debug: Check if slots have parentId values
    if (slots[draggedSlotId]) {
      console.log(`📍 DEBUG: ${draggedSlotId} slot data:`, {
        parentId: slots[draggedSlotId].parentId,
        position: slots[draggedSlotId].position,
        type: slots[draggedSlotId].type
      });
    }

    if (draggedSlotId === targetSlotId) {
      console.log('⚠️ ABORT: Cannot drop slot onto itself');
      return null;
    }

    // ONLY allow drops into containers - reject all other drop targets
    const targetSlot = slots[targetSlotId];
    if (!targetSlot || !['container', 'grid', 'flex'].includes(targetSlot.type)) {
      console.log(`🚫 REJECT: Cannot drop into ${targetSlot?.type || 'unknown'} slot - only containers allowed`);
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

    // Since we only allow drops into containers, it's always an "inside" operation
    newParentId = targetSlotId;
    newPosition = findAvailablePosition(newParentId, 1, 1);

    console.log(`📦 Dropping ${draggedSlotId} into container ${targetSlotId}`);

    // Debug logging for drag operations
    console.log(`🔄 Drag operation: ${draggedSlotId} ${dropPosition} ${targetSlotId}`);
    console.log(`   Old: parentId=${originalProperties.parentId}, position=${JSON.stringify(originalProperties.position)}`);
    console.log(`   New: parentId=${newParentId}, position=${JSON.stringify(newPosition)}`);

    // Check if position actually changed
    const oldPos = originalProperties.position;
    const positionChanged =
      originalProperties.parentId !== newParentId ||
      oldPos?.col !== newPosition.col ||
      oldPos?.row !== newPosition.row;

    if (!positionChanged) {
      console.log('⚠️ NOTICE: Position unchanged, but continuing with drag operation');
    }

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

    // No need for complex shifting - findAvailablePosition handles conflicts

    // Validate the updated configuration before applying
    if (!validateSlotConfiguration(updatedSlots)) {
      console.error('❌ Configuration validation failed after drag, reverting changes');
      return null;
    }

    console.log('✅ SUCCESS: Drag operation completed, returning updated slots');
    return updatedSlots;
  }, [validateSlotConfiguration]);

  // Generic slot delete handler
  const handleSlotDelete = useCallback((slotId, slots) => {
    console.log('🗑️ Deleting slot:', slotId);

    // Don't allow deleting critical layout containers
    if (['main_layout', 'header_container', 'content_area', 'sidebar_area'].includes(slotId)) {
      console.warn('⚠️ Cannot delete critical layout container:', slotId);
      return null;
    }

    // Use SlotManager to delete the slot and its children
    const updatedSlots = SlotManager.deleteSlot(slots, slotId);

    console.log('✅ Slot deleted successfully');
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
    console.log('📋 handleClassChange called:', { slotId, className, styles, isAlignmentChange, slots });
    const updatedSlots = { ...slots };

    if (updatedSlots[slotId]) {
      // Merge existing styles with new styles
      const existingStyles = updatedSlots[slotId].styles || {};
      const mergedStyles = { ...existingStyles, ...styles };

      // Define categories of classes
      const alignmentClasses = ['text-left', 'text-center', 'text-right'];
      const allClasses = className.split(' ').filter(Boolean);
      console.log('📋 Processing classes:', { alignmentClasses, allClasses, isAlignmentChange });

      if (isAlignmentChange || allClasses.some(cls => alignmentClasses.includes(cls))) {
        // For alignment changes, only alignment goes to parent, everything else to element
        const alignmentClassList = allClasses.filter(cls => alignmentClasses.includes(cls));
        const elementClassList = allClasses.filter(cls => !alignmentClasses.includes(cls));
        console.log('📋 Alignment change detected:', { alignmentClassList, elementClassList });

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
        console.log('📋 Updated slot for alignment:', updatedSlots[slotId]);
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
          console.log('🔧 createClassChangeHandler called:', { slotId, className, styles, isAlignmentChange });
          setPageConfig(prevConfig => {
            console.log('🔧 Previous config before classChangeHandler:', prevConfig);
            const updatedSlots = classChangeHandler(slotId, className, styles, isAlignmentChange, prevConfig?.slots || {});
            const updatedConfig = {
              ...prevConfig,
              slots: updatedSlots
            };
            console.log('🔧 Updated config after classChangeHandler:', updatedConfig);

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
    saveConfiguration,
    loadConfiguration,
    applyDraftConfiguration,
    updateSlotsForViewMode,
    handleResetLayout,
    handlePublishConfiguration,
    loadStaticConfiguration,
    getDraftOrStaticConfiguration,
    saveStatus,
    resetStatus,
    justSavedRef,
    cleanup,
    // Generic slot management functions
    validateSlotConfiguration,
    createSlot,
    handleSlotDrop,
    handleSlotDelete,
    handleGridResize,
    handleSlotHeightResize,
    handleTextChange,
    handleClassChange,
    // Generic UI components
    GridResizeHandle,
    GridColumn,
    EditableElement,
    HierarchicalSlotRenderer,
    // Generic handler factories
    createElementClickHandler,
    createSaveConfigurationHandler,
    createHandlerFactory
  };
}