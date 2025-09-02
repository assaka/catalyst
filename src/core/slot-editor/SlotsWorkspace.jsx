/**
 * SlotsWorkspace - Integration layer that orchestrates ConfigurationEditor and ConfigurationPreview
 * Handles state management, API communication, and real-time preview updates
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Save, 
  X, 
  RefreshCw, 
  Settings, 
  Eye, 
  Code, 
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Copy,
  Undo,
  Redo,
  History,
  Zap
} from 'lucide-react';

// Import slot editor components
import ConfigurationEditor from './ConfigurationEditor.jsx';
import ConfigurationPreview from './ConfigurationPreview.jsx';
import GenericSlotEditor from './GenericSlotEditor.jsx';
import { ComponentSlotDefinitions, ValidationUtils } from './types.js';

// Import slot system and API
import { slotRegistry, getSlotSystemState } from '@/core/slot-system';
import { SlotConfiguration } from '@/api/entities'; // Assuming this exists
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

const SlotsWorkspace = ({
  componentName = 'ProductCard',
  userId,
  storeId,
  initialUserConfig = null,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('simple'); // 'simple', 'visual', 'split', 'editor', 'preview'
  const [currentUserConfig, setCurrentUserConfig] = useState(null);
  const [originalUserConfig, setOriginalUserConfig] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // History management
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistorySize] = useState(50);

  // Store context
  const { selectedStore } = useStoreSelection();
  const effectiveStoreId = storeId || selectedStore?.id;

  // Get component definition and default config
  const componentDef = ComponentSlotDefinitions[componentName] || {
    name: componentName,
    displayName: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  const defaultConfig = useMemo(() => {
    const slots = {};
    componentDef.availableSlots.forEach(slotId => {
      const registrySlots = slotRegistry.getSlotsForComponent(componentName.toLowerCase());
      const slotData = registrySlots.find(s => s.slotId === slotId);
      if (slotData) {
        slots[slotId] = {
          enabled: true,
          order: slotData.config.order || 1,
          required: slotData.config.required || false,
          component: slotData.config.defaultComponent,
          props: slotData.config.defaultProps || {}
        };
      }
    });

    return {
      version: '1.0',
      slots,
      metadata: {
        component: componentName,
        generatedAt: new Date().toISOString()
      }
    };
  }, [componentName, componentDef.availableSlots]);

  // Initialize configuration
  useEffect(() => {
    const initializeConfiguration = async () => {
      setLoading(true);
      setError(null);

      try {
        let userConfig = initialUserConfig;

        // Load from database if not provided
        if (!userConfig && userId && effectiveStoreId) {
          const response = await SlotConfiguration.findActiveByUserStore(userId, effectiveStoreId);
          if (response && response.configuration) {
            userConfig = response.configuration;
          }
        }

        // Use default empty config if nothing found
        if (!userConfig) {
          userConfig = { version: '1.0', slots: {}, metadata: {} };
        }

        setCurrentUserConfig(userConfig);
        setOriginalUserConfig(JSON.parse(JSON.stringify(userConfig)));
        
        // Initialize history
        addToHistory(userConfig);

        // Apply hooks
        hookSystem.do('slotsWorkspace.initialized', {
          componentName,
          userConfig,
          defaultConfig,
          userId,
          storeId: effectiveStoreId
        });

        // Emit event
        eventSystem.emit('slotsWorkspace.initialized', {
          componentName,
          userConfig,
          defaultConfig
        });

      } catch (error) {
        console.error('Error initializing slot configuration:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeConfiguration();
  }, [componentName, userId, effectiveStoreId, initialUserConfig, defaultConfig]);

  // History management
  const addToHistory = useCallback((config) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(config)));
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      } else {
        setHistoryIndex(prev => prev + 1);
      }
      
      return newHistory;
    });
  }, [historyIndex, maxHistorySize]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUserConfig(history[newIndex]);
      setHasUnsavedChanges(true);
    }
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUserConfig(history[newIndex]);
      setHasUnsavedChanges(true);
    }
  }, [canRedo, historyIndex, history]);

  // Handle configuration changes
  const handleConfigurationChange = useCallback((newConfig) => {
    setCurrentUserConfig(newConfig);
    
    // Check if changes were made
    const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(originalUserConfig);
    setHasUnsavedChanges(hasChanges);

    // Add to history (debounced)
    const timeoutId = setTimeout(() => {
      addToHistory(newConfig);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [originalUserConfig, addToHistory]);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!userId || !effectiveStoreId || !currentUserConfig) {
      console.error('Missing required data for saving configuration');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Validate configuration before saving
      const validation = ValidationUtils.validateConfiguration(currentUserConfig);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Apply pre-save hooks
      const processedConfig = hookSystem.apply('slotsWorkspace.beforeSave', currentUserConfig, {
        componentName,
        userId,
        storeId: effectiveStoreId,
        originalConfig: originalUserConfig
      });

      // Save to database
      const configData = {
        user_id: userId,
        store_id: effectiveStoreId,
        configuration: processedConfig,
        version: processedConfig.version || '1.0',
        is_active: true
      };

      const response = await SlotConfiguration.createOrUpdate(configData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save configuration');
      }

      // Update local state
      setOriginalUserConfig(JSON.parse(JSON.stringify(processedConfig)));
      setHasUnsavedChanges(false);

      // Apply post-save hooks
      hookSystem.do('slotsWorkspace.afterSave', {
        componentName,
        savedConfig: processedConfig,
        userId,
        storeId: effectiveStoreId
      });

      // Emit events
      eventSystem.emit('slotsWorkspace.saved', {
        componentName,
        config: processedConfig
      });

      // Call parent callback
      onSave(processedConfig);

      console.log('✅ Slot configuration saved successfully');

    } catch (error) {
      console.error('❌ Error saving slot configuration:', error);
      setError(error);
    } finally {
      setSaving(false);
    }
  }, [userId, effectiveStoreId, currentUserConfig, componentName, originalUserConfig, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      onCancel();
    }
  }, [hasUnsavedChanges, onCancel]);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    onCancel();
  }, [onCancel]);

  // Reset to original
  const handleReset = useCallback(() => {
    setCurrentUserConfig(JSON.parse(JSON.stringify(originalUserConfig)));
    setHasUnsavedChanges(false);
    addToHistory(originalUserConfig);
  }, [originalUserConfig, addToHistory]);

  // Handle preview errors
  const handlePreviewError = useCallback((error) => {
    console.error('Preview error:', error);
    // Could show a toast notification here
  }, []);

  // Handle slot configuration save
  const handleSlotSave = useCallback(async (config) => {
    setCurrentUserConfig(config);
    onSave({
      type: 'slot_config',
      config: config,
      componentName: componentName
    });
  }, [componentName, onSave]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading slot configuration...</span>
      </div>
    );
  }

  // Error state
  if (error && !currentUserConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`slots-workspace ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Slot Configuration Editor
              </CardTitle>
              <Badge variant="outline">
                {componentDef.displayName || componentName}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="warning">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="Reset to saved"
              >
                <History className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                title="Save configuration"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCancel}
                title="Cancel editing"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <div className="mb-4">
          <TabsList>
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Simple Mode
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Visual Manager
            </TabsTrigger>
            <TabsTrigger value="split" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <Eye className="w-4 h-4" />
              Split View
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              JSON Editor
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="simple" className="h-full">
          <GenericSlotEditor
            pageName={componentName}
            onSave={handleSlotSave}
            onCancel={onCancel}
          />
        </TabsContent>

        <TabsContent value="visual" className="h-full">
          <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
            <Settings className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Visual Mode Replaced</h3>
            <p className="text-gray-600 mb-4">
              Visual slot editing is now available in Simple Mode with the new generic architecture.
            </p>
            <Button 
              onClick={() => setActiveTab('simple')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Switch to Simple Mode
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="split" className="h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <ConfigurationEditor
              defaultConfig={defaultConfig}
              userConfig={currentUserConfig}
              componentName={componentName}
              onChange={handleConfigurationChange}
              slotDefinitions={componentDef}
            />
            <ConfigurationPreview
              defaultConfig={defaultConfig}
              userConfig={currentUserConfig}
              componentName={componentName}
              componentProps={componentDef.defaultProps}
              storeContext={{ store: selectedStore }}
              onError={handlePreviewError}
            />
          </div>
        </TabsContent>

        <TabsContent value="editor" className="h-full">
          <ConfigurationEditor
            defaultConfig={defaultConfig}
            userConfig={currentUserConfig}
            componentName={componentName}
            onChange={handleConfigurationChange}
            slotDefinitions={componentDef}
          />
        </TabsContent>

        <TabsContent value="preview" className="h-full">
          <ConfigurationPreview
            defaultConfig={defaultConfig}
            userConfig={currentUserConfig}
            componentName={componentName}
            componentProps={componentDef.defaultProps}
            storeContext={{ store: selectedStore }}
            onError={handlePreviewError}
          />
        </TabsContent>
      </Tabs>

      {/* Exit confirmation dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to exit without saving?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
            >
              Exit Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlotsWorkspace;