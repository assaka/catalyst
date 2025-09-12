import { useState, useCallback, useRef, useEffect } from 'react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { formatPrice } from '@/components/editor/slot/editor-utils';

/**
 * Generic hook for managing slot editor state across different page types
 * Replaces the cart-specific state management in CartSlotsEditor
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.pageType - Page type ('cart', 'category', 'product', etc.)
 * @param {Array} options.defaultMajorSlots - Default major slot configuration
 * @param {Object} options.microSlotDefinitions - Micro-slot definitions for this page type
 * @param {Object} options.defaultSlotContent - Default content for slots
 * @param {string} options.slotType - Slot type identifier (e.g., 'cart_layout')
 * @param {function} options.onConfigLoad - Callback when configuration is loaded
 */
export function useSlotEditor({
  pageType = 'generic',
  defaultMajorSlots = [],
  microSlotDefinitions = {},
  defaultSlotContent = {},
  slotType = 'page_layout',
  onConfigLoad = null
}) {
  const { selectedStore } = useStoreSelection();
  const currentStoreId = selectedStore?.id;
  const justSavedRef = useRef(false);

  // Core state management
  const [isResizingIcon, setIsResizingIcon] = useState(null);
  const [isResizingButton, setIsResizingButton] = useState(null);

  // Content and styling state
  const [slotContent, setSlotContent] = useState(defaultSlotContent);
  const [editingComponent, setEditingComponent] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [activeDragSlot, setActiveDragSlot] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const saveStatusTimeoutRef = useRef(null);

  // Modal and dialog state
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentParentSlot, setCurrentParentSlot] = useState(null);
  const [newSlotType, setNewSlotType] = useState('text');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotContent, setNewSlotContent] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ 
    show: false, 
    slotId: null, 
    slotLabel: '' 
  });

  // Element styling state
  const [elementClasses, setElementClasses] = useState({});
  const [elementStyles, setElementStyles] = useState({});
  const [componentSizes, setComponentSizes] = useState({});

  // Save configuration function
  const saveConfiguration = useCallback(async () => {
    console.log(`💾 ===== SAVE CONFIGURATION STARTED (${pageType.toUpperCase()}) =====`);
    setSaveStatus('saving');
    
    try {
      // Create config in new slots structure
      const slots = {};
      
      // Combine all slot data into the slots structure
      const allSlotIds = new Set([
        ...Object.keys(slotContent || {}),
        ...Object.keys(elementStyles || {}),
        ...Object.keys(elementClasses || {})
      ]);
      
      // Add base slot IDs from wrapper IDs (remove -wrapper suffix)
      Object.keys(elementClasses || {}).forEach(key => {
        if (key.endsWith('-wrapper')) {
          const baseSlotId = key.replace('-wrapper', '');
          allSlotIds.add(baseSlotId);
        }
      });
      
      console.log(`💾 All slot IDs for ${pageType} save:`, Array.from(allSlotIds));
      
      // Process each slot
      allSlotIds.forEach(id => {
        // Skip processing wrapper IDs themselves
        if (id.endsWith('-wrapper')) {
          return;
        }
        
        // Check for parent wrapper classes (for alignment and other parent styles)
        const wrapperId = `${id}-wrapper`;
        const parentClassName = elementClasses[wrapperId] || '';
        
        slots[id] = {
          content: slotContent[id] || '',
          styles: elementStyles[id] || {},
          className: elementClasses[id] || '',
          parentClassName: parentClassName,
          metadata: {
            lastModified: new Date().toISOString()
          }
        };
      });
      
      const config = {
        page_name: pageType.charAt(0).toUpperCase() + pageType.slice(1),
        slot_type: slotType,
        slots,
        metadata: {
          lastModified: new Date().toISOString(),
          version: '1.0',
          pageType: pageType
        }
      };
      
      const configString = JSON.stringify(config);
      console.log(`💾 Final ${pageType} config size:`, configString.length, 'characters');
      
      justSavedRef.current = true;
      
      // Check if draft exists, create or update accordingly
      const draftExists = await slotConfigurationService.draftExists(currentStoreId, pageType);
      let result;
      
      if (draftExists) {
        console.log(`💾 Updating existing ${pageType} draft configuration...`);
        result = await slotConfigurationService.updateDraftConfiguration(currentStoreId, pageType, config);
      } else {
        console.log(`💾 Creating new ${pageType} draft configuration...`);
        result = await slotConfigurationService.createDraftConfiguration(currentStoreId, pageType, config);
      }
      
      if (result) {
        console.log(`💾 ${pageType.charAt(0).toUpperCase() + pageType.slice(1)} configuration saved successfully!`);
        setSaveStatus('saved');
        
        // Clear save status after 2 seconds
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('');
        }, 2000);
      } else {
        throw new Error(`Failed to save ${pageType} configuration`);
      }
    } catch (error) {
      console.error(`💾 Error saving ${pageType} configuration:`, error);
      setSaveStatus('error');
      
      // Clear error status after 3 seconds
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  }, [
    pageType,
    slotType,
    slotContent,
    currentStoreId,
    microSlotDefinitions
  ]);

  // Load configuration function
  const loadConfiguration = useCallback(async () => {
    if (!currentStoreId) return;
    
    try {
      console.log(`📥 Loading ${pageType} configuration...`);
      
      const queryParams = new URLSearchParams({
        store_id: currentStoreId,
        page_type: pageType
      });
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const endpoint = `${apiBaseUrl}/api/slot-configurations?${queryParams.toString()}`;
      console.log(`📥 Fetching from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📥 ${pageType} configurations loaded:`, data);
        
        const configurations = Array.isArray(data) ? data : (data.configurations || []);
        
        const pageConfig = configurations?.find(cfg => 
          cfg.configuration?.page_name === pageType.charAt(0).toUpperCase() + pageType.slice(1) && 
          cfg.configuration?.slot_type === slotType
        );
        
        if (pageConfig?.configuration) {
          const config = pageConfig.configuration;
          console.log(`📥 Found ${pageType} config:`, config);
          
          // Load component sizes
          if (config.componentSizes) {
            setComponentSizes(config.componentSizes);
          }
          
          // Load slot content, styles, and classes from the slots structure
          if (config.slots) {
            const loadedContent = {};
            const loadedStyles = {};
            const loadedClasses = {};
            
            Object.entries(config.slots).forEach(([slotId, slotData]) => {
              if (slotData?.content !== undefined) {
                loadedContent[slotId] = slotData.content;
              }
              if (slotData?.styles) {
                loadedStyles[slotId] = slotData.styles;
              }
              if (slotData?.className) {
                loadedClasses[slotId] = slotData.className;
              }
              // Load parentClassName as wrapper classes
              if (slotData?.parentClassName) {
                const wrapperId = `${slotId}-wrapper`;
                loadedClasses[wrapperId] = slotData.parentClassName;
              }
            });
            
            // Merge with existing content (preserving any defaults)
            setSlotContent(prev => ({ ...prev, ...loadedContent }));
            setElementStyles(prev => ({ ...prev, ...loadedStyles }));
            setElementClasses(prev => ({ ...prev, ...loadedClasses }));
          }
          
          // Call onConfigLoad callback if provided
          if (onConfigLoad) {
            onConfigLoad(config);
          }
        } else {
          console.log(`📥 No ${pageType} configuration found, using defaults`);
        }
      } else {
        console.error(`📥 Failed to load ${pageType} configurations:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`📥 Error loading ${pageType} configurations:`, error);
    }
  }, [currentStoreId, pageType, slotType, onConfigLoad]);

  const handleTextChange = useCallback((slotId, newText) => {
    setSlotContent(prev => {
      const updated = { ...prev, [slotId]: newText };
      
      // Auto-save after text change
      setTimeout(() => {
        saveConfiguration();
      }, 500);
      
      return updated;
    });
  }, [saveConfiguration]);

  const handleClassChange = useCallback((slotId, newClass, newStyles = null) => {
    if (newClass !== undefined) {
      setElementClasses(prev => ({ ...prev, [slotId]: newClass }));
    }
    
    if (newStyles) {
      if (Array.isArray(newStyles)) {
        // newStyles is an array of style keys to clear
        setElementStyles(prev => {
          const updated = { ...prev };
          const currentStyles = updated[slotId] || {};
          newStyles.forEach(styleKey => {
            delete currentStyles[styleKey];
          });
          updated[slotId] = currentStyles;
          return updated;
        });
      } else {
        // newStyles is a style object to merge
        setElementStyles(prev => ({
          ...prev,
          [slotId]: { ...(prev[slotId] || {}), ...newStyles }
        }));
      }
    }
    
    // Auto-save after class/style change
    setTimeout(() => {
      saveConfiguration();
    }, 500);
  }, [saveConfiguration]);

  const handleSizeChange = useCallback((slotId, newSize) => {
    setComponentSizes(prev => {
      const updated = { ...prev, [slotId]: newSize };
      
      // Auto-save after size change
      setTimeout(() => {
        saveConfiguration();
      }, 100);
      
      return updated;
    });
  }, [saveConfiguration]);

  // Force save event handler
  useEffect(() => {
    const handleForceSave = () => {
      console.log(`🔄 Force save triggered for ${pageType}`);
      saveConfiguration();
    };

    window.addEventListener(`force-save-${pageType}-layout`, handleForceSave);

    return () => {
      window.removeEventListener(`force-save-${pageType}-layout`, handleForceSave);
    };
  }, [saveConfiguration, pageType]);

  // Load configuration on mount and store change
  useEffect(() => {
    if (currentStoreId && !justSavedRef.current) {
      loadConfiguration();
    }
    justSavedRef.current = false;
  }, [currentStoreId, loadConfiguration]);

  return {
    // State
    isResizingIcon,
    setIsResizingIcon,
    isResizingButton,
    setIsResizingButton,
    slotContent,
    setSlotContent,
    editingComponent,
    setEditingComponent,
    tempCode,
    setTempCode,
    activeDragSlot,
    setActiveDragSlot,
    saveStatus,
    setSaveStatus,
    showAddSlotDialog,
    setShowAddSlotDialog,
    showResetModal,
    setShowResetModal,
    currentParentSlot,
    setCurrentParentSlot,
    newSlotType,
    setNewSlotType,
    newSlotName,
    setNewSlotName,
    newSlotContent,
    setNewSlotContent,
    deleteConfirm,
    setDeleteConfirm,
    elementClasses,
    setElementClasses,
    elementStyles,
    setElementStyles,
    componentSizes,
    setComponentSizes,
    
    // Functions
    saveConfiguration,
    loadConfiguration,
    handleTextChange,
    handleClassChange,
    handleSizeChange,
    
    // Utilities
    formatPrice,
    currentStoreId
  };
}