import { useState, useEffect, useCallback, useRef } from 'react';
import slotConfigurationService from '@/services/slotConfigurationService';

const useDraftConfiguration = (storeId, pageType = 'cart') => {
  const [draftConfig, setDraftConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef(null);
  const currentConfigRef = useRef(null);

  // Load or create draft configuration
  const loadDraftConfiguration = useCallback(async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await slotConfigurationService.getDraftConfiguration(storeId, pageType);

      console.log('📝 EDITOR: Draft config loaded:', response);
      console.log('📝 EDITOR: cart_items slot:', response.data?.configuration?.slots?.cart_items);
      console.log('📝 EDITOR: order_summary slot:', response.data?.configuration?.slots?.order_summary);

      if (response.success) {
        setDraftConfig(response.data);
        currentConfigRef.current = response.data;
        setHasUnsavedChanges(false);
      } else {
        setError(response.error || 'Failed to load draft configuration');
      }
    } catch (err) {
      console.error('Error loading draft configuration:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, pageType]);

  // Auto-save configuration with debouncing
  const saveConfiguration = useCallback(async (configuration, immediate = false) => {
    if (!draftConfig?.id || !configuration) return;
    
    const delay = immediate ? 0 : 2000; // 2 second debounce unless immediate
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set up save with debounce
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);

      console.log('💾 EDITOR: Saving draft config...');
      console.log('💾 EDITOR: cart_items before save:', configuration?.slots?.cart_items);
      console.log('💾 EDITOR: order_summary before save:', configuration?.slots?.order_summary);

      try {
        const response = await slotConfigurationService.updateDraftConfiguration(
          draftConfig.id,
          configuration,
          storeId
        );
        
        if (response.success) {
          console.log('✅ EDITOR: Draft saved successfully');
          console.log('✅ EDITOR: cart_items after save:', response.data?.configuration?.slots?.cart_items);
          console.log('✅ EDITOR: order_summary after save:', response.data?.configuration?.slots?.order_summary);

          setDraftConfig(response.data);
          currentConfigRef.current = response.data;
          setHasUnsavedChanges(false);
          setError(null);
        } else {
          setError(response.error || 'Failed to save configuration');
        }
      } catch (err) {
        console.error('Error saving draft configuration:', err);
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    }, delay);
    
    // Mark as having unsaved changes
    if (!immediate) {
      setHasUnsavedChanges(true);
    }
  }, [draftConfig?.id]);

  // Update configuration in memory and trigger auto-save
  const updateConfiguration = useCallback((newConfiguration) => {
    if (!draftConfig) return;
    
    // Update local state immediately for responsive UI
    const updatedConfig = {
      ...draftConfig,
      configuration: newConfiguration,
      updated_at: new Date().toISOString()
    };
    
    setDraftConfig(updatedConfig);
    
    // Trigger auto-save
    saveConfiguration(newConfiguration);
  }, [draftConfig, saveConfiguration]);

  // Force immediate save
  const saveImmediately = useCallback((configuration) => {
    if (configuration) {
      saveConfiguration(configuration, true);
    } else if (draftConfig?.configuration) {
      saveConfiguration(draftConfig.configuration, true);
    }
  }, [saveConfiguration, draftConfig?.configuration]);

  // Initialize on mount
  useEffect(() => {
    loadDraftConfiguration();
  }, [loadDraftConfiguration]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        // Try to save immediately
        if (draftConfig?.configuration) {
          saveConfiguration(draftConfig.configuration, true);
        }
        
        // Show warning to user
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, draftConfig, saveConfiguration]);

  return {
    // State
    draftConfig,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    
    // Actions
    updateConfiguration,
    saveImmediately,
    reloadDraft: loadDraftConfiguration,
    
    // Getters
    getConfiguration: () => draftConfig?.configuration || null,
    getDraftId: () => draftConfig?.id || null,
    getVersionNumber: () => draftConfig?.version_number || null
  };
};

export default useDraftConfiguration;