/**
 * SimplifiedSlotsWorkspace - Clean, easy-to-understand slot management interface
 * Combines simple slot management with clear visual preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  X, 
  RefreshCw, 
  Settings, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Lightbulb
} from 'lucide-react';

// Import our simplified components
import SimpleSlotManager from './SimpleSlotManager.jsx';
import SlotPreview from './SlotPreview.jsx';
import { ComponentSlotDefinitions, ValidationUtils } from './types.js';

// Import slot system and API
import { SlotConfiguration } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

const SimplifiedSlotsWorkspace = ({
  componentName = 'ProductCard',
  userId,
  storeId,
  initialUserConfig = null,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State management - much simpler!
  const [currentConfig, setCurrentConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Store context
  const { selectedStore } = useStoreSelection();
  const effectiveStoreId = storeId || selectedStore?.id;

  // Get component definition
  const componentDef = ComponentSlotDefinitions[componentName] || {
    name: componentName,
    displayName: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  // Default configuration (what the component looks like without customization)
  const defaultConfig = {
    version: '1.0',
    slots: {},
    metadata: {
      component: componentName,
      generatedAt: new Date().toISOString()
    }
  };

  // Initialize - load existing configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let userConfig = initialUserConfig;

        // Load from database if not provided
        if (!userConfig && userId && effectiveStoreId) {
          try {
            const response = await SlotConfiguration.findActiveByUserStore(userId, effectiveStoreId);
            if (response && response.configuration) {
              userConfig = response.configuration;
            }
          } catch (loadError) {
            console.warn('Could not load existing configuration:', loadError);
            // Continue with empty config
          }
        }

        // Use empty config if nothing found
        if (!userConfig) {
          userConfig = { version: '1.0', slots: {}, metadata: {} };
        }

        setCurrentConfig(userConfig);
        setOriginalConfig(JSON.parse(JSON.stringify(userConfig)));
        
        console.log('✅ Slot configuration loaded:', userConfig);

      } catch (error) {
        console.error('❌ Error loading slot configuration:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, [componentName, userId, effectiveStoreId, initialUserConfig]);

  // Handle configuration changes
  const handleConfigChange = useCallback((newConfig) => {
    setCurrentConfig(newConfig);
    
    // Check if changes were made
    const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(hasChanges);
  }, [originalConfig]);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!userId || !effectiveStoreId || !currentConfig) {
      setError(new Error('Missing required information to save'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Validate configuration
      const validation = ValidationUtils.validateConfiguration(currentConfig);
      if (!validation.valid) {
        throw new Error(`Configuration is invalid: ${validation.errors.join(', ')}`);
      }

      // Save to database
      const configData = {
        user_id: userId,
        store_id: effectiveStoreId,
        configuration: currentConfig,
        version: currentConfig.version || '1.0',
        is_active: true
      };

      const response = await SlotConfiguration.createOrUpdate(configData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save configuration');
      }

      // Update local state
      setOriginalConfig(JSON.parse(JSON.stringify(currentConfig)));
      setHasUnsavedChanges(false);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Emit events
      eventSystem.emit('slotsWorkspace.saved', {
        componentName,
        config: currentConfig
      });

      // Call parent callback
      onSave(currentConfig);

      console.log('✅ Configuration saved successfully');

    } catch (error) {
      console.error('❌ Error saving configuration:', error);
      setError(error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, effectiveStoreId, currentConfig, componentName, onSave]);

  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!shouldDiscard) return;
    }
    
    onCancel();
  }, [hasUnsavedChanges, onCancel]);

  const handleReset = useCallback(() => {
    const shouldReset = window.confirm(
      'This will reset all your customizations. Are you sure?'
    );
    if (!shouldReset) return;
    
    setCurrentConfig(JSON.parse(JSON.stringify(originalConfig)));
    setHasUnsavedChanges(false);
  }, [originalConfig]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-medium">Loading your slot configuration...</p>
          <p className="text-sm text-gray-600">This won't take long</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentConfig) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-700">Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`simplified-slots-workspace ${className}`}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Settings className="w-7 h-7 text-blue-600" />
                Customize {componentDef.displayName}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Add, arrange, and enhance slots to customize how your component looks and behaves
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Unsaved Changes
                </Badge>
              )}
              
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasUnsavedChanges}
                title="Reset to last saved version"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCancel}
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Changes saved successfully!</strong> Your customizations are now active.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Side - Slot Manager */}
        <div className="space-y-6">
          <SimpleSlotManager
            config={currentConfig}
            componentName={componentName}
            onChange={handleConfigChange}
          />
        </div>

        {/* Right Side - Live Preview */}
        <div className="space-y-6">
          <SlotPreview
            defaultConfig={defaultConfig}
            userConfig={currentConfig}
            componentName={componentName}
            componentProps={componentDef.defaultProps}
          />

          {/* Quick Tips */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Changes appear instantly in the preview</li>
                    <li>• Use "Enhance" to add custom styling or behavior</li>
                    <li>• Reorder slots to change your layout</li>
                    <li>• Don't forget to save your changes!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedSlotsWorkspace;