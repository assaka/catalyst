/**
 * useCustomizations Hook
 * React hook for integrating customizations into components
 */

import { useState, useEffect, useCallback } from 'react';
import customizationEngine from '@/core/CustomizationEngine';
import eventSystem from '@/core/EventSystem';

export const useCustomizations = (options = {}) => {
  const {
    storeId,
    componentName,
    selectors = [],
    autoInit = true,
    context = {}
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [appliedCustomizations, setAppliedCustomizations] = useState([]);
  const [componentReplacement, setComponentReplacement] = useState(null);
  const [error, setError] = useState(null);

  // Initialize customizations
  const initialize = useCallback(async () => {
    if (!storeId || isInitialized) return;

    try {
      const result = await customizationEngine.initialize(storeId, {
        component: componentName,
        selectors,
        context
      });

      if (result.success) {
        setIsInitialized(true);
        setAppliedCustomizations(result.customizationsApplied || 0);
        setError(null);
      } else {
        setError(result.error);
      }

    } catch (error) {
      console.error('❌ Error initializing customizations:', error);
      setError(error.message);
    }
  }, [storeId, componentName, selectors, context, isInitialized]);

  // Check for component replacement
  const checkComponentReplacement = useCallback(() => {
    if (!componentName) return;
    
    const replacement = customizationEngine.getComponentReplacement(componentName);
    setComponentReplacement(replacement);
  }, [componentName]);

  // Listen for customization events
  useEffect(() => {
    const handlePreviewToggle = (event) => {
      setIsPreviewMode(event.isPreview);
    };

    const handleCustomizationApplied = (event) => {
      if (event.targetComponent === componentName || event.targetComponent === '*') {
        setAppliedCustomizations(prev => prev + 1);
      }
    };

    const handleComponentReplacement = (event) => {
      if (event.targetComponent === componentName) {
        setComponentReplacement({
          component: event.replacementComponent,
          props: event.props,
          isPreview: event.isPreview
        });
      }
    };

    eventSystem.on('customization.previewToggle', handlePreviewToggle);
    eventSystem.on('customization.applied', handleCustomizationApplied);
    eventSystem.on('component.replacement', handleComponentReplacement);

    return () => {
      eventSystem.off('customization.previewToggle', handlePreviewToggle);
      eventSystem.off('customization.applied', handleCustomizationApplied);
      eventSystem.off('component.replacement', handleComponentReplacement);
    };
  }, [componentName]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInit) {
      initialize();
    }
  }, [autoInit, initialize]);

  // Check for component replacement on component name change
  useEffect(() => {
    checkComponentReplacement();
  }, [checkComponentReplacement]);

  // Apply inline customizations (for dynamic content)
  const applyInlineCustomization = useCallback(async (customization) => {
    try {
      await customizationEngine.applyCustomization(customization, isPreviewMode);
      setAppliedCustomizations(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error applying inline customization:', error);
      setError(error.message);
    }
  }, [isPreviewMode]);

  // Get custom styles for this component
  const getCustomStyles = useCallback((baseStyles = {}) => {
    // This would be enhanced to merge custom styles with base styles
    // For now, it returns the base styles with customization context
    return {
      ...baseStyles,
      '--customization-component': componentName,
      '--customization-preview': isPreviewMode ? 'true' : 'false'
    };
  }, [componentName, isPreviewMode]);

  // Get custom props for this component
  const getCustomProps = useCallback((baseProps = {}) => {
    // This would be enhanced to merge custom props with base props
    return {
      ...baseProps,
      'data-customizable': componentName,
      'data-preview-mode': isPreviewMode
    };
  }, [componentName, isPreviewMode]);

  return {
    // State
    isInitialized,
    isPreviewMode,
    appliedCustomizations,
    componentReplacement,
    error,
    
    // Actions
    initialize,
    applyInlineCustomization,
    
    // Utilities
    getCustomStyles,
    getCustomProps,
    
    // Checks
    hasReplacement: !!componentReplacement,
    isCustomizable: isInitialized && !!componentName
  };
};

// Higher-order component for automatic customization integration
export const withCustomizations = (WrappedComponent, options = {}) => {
  return function CustomizationWrapper(props) {
    const {
      isInitialized,
      isPreviewMode,
      componentReplacement,
      getCustomStyles,
      getCustomProps
    } = useCustomizations({
      componentName: options.componentName || WrappedComponent.displayName || WrappedComponent.name,
      storeId: props.storeId || options.storeId,
      ...options
    });

    // Return replacement component if exists
    if (componentReplacement && !componentReplacement.isPreview) {
      const ReplacementComponent = componentReplacement.component;
      return (
        <ReplacementComponent
          {...props}
          {...componentReplacement.props}
          isReplacement={true}
          originalComponent={WrappedComponent}
        />
      );
    }

    // Return wrapped component with customization props
    return (
      <WrappedComponent
        {...getCustomProps(props)}
        style={getCustomStyles(props.style)}
        isCustomizable={isInitialized}
        isPreviewMode={isPreviewMode}
      />
    );
  };
};

// Hook for component-specific customization management
export const useComponentCustomization = (componentName, storeId) => {
  const [customizations, setCustomizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomizations = useCallback(async () => {
    if (!storeId || !componentName) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/customizations?store_id=${storeId}&component=${componentName}`);
      const data = await response.json();
      
      if (data.success) {
        setCustomizations(data.data.customizations);
      }
    } catch (error) {
      console.error('❌ Error loading component customizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, componentName]);

  const createCustomization = useCallback(async (customizationData) => {
    if (!storeId) return;

    try {
      const response = await fetch('/api/customizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...customizationData,
          targetComponent: componentName,
          storeId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCustomizations();
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Error creating customization:', error);
      throw error;
    }
  }, [storeId, componentName, loadCustomizations]);

  useEffect(() => {
    loadCustomizations();
  }, [loadCustomizations]);

  return {
    customizations,
    isLoading,
    loadCustomizations,
    createCustomization
  };
};

export default useCustomizations;