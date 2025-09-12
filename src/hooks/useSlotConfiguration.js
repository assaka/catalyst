/**
 * useSlotConfiguration - Custom hook for managing slot configuration save/load
 * Reusable across all page editors (Cart, Product, Category, etc.)
 */

import { useCallback, useState, useRef } from 'react';

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
        styles: extractedStyles,
        content: extractedContent,
        classes: extractedClasses
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

  return {
    saveConfiguration,
    loadConfiguration,
    applyDraftConfiguration,
    updateSlotsForViewMode,
    saveStatus,
    justSavedRef,
    cleanup
  };
}