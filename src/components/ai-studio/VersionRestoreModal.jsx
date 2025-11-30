import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import CodeEditor from './CodeEditor';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Shield,
  FileCode,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

/**
 * VersionRestoreModal
 * Confirms and executes plugin version restoration with preview
 * Features:
 * - Preview changes before restore
 * - Automatic backup creation
 * - Safety warnings
 * - File-by-file diff preview
 * - Restore progress tracking
 */
const VersionRestoreModal = ({
  pluginId,
  versionId,
  currentVersionId,
  onClose,
  onSuccess,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [version, setVersion] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [versionState, setVersionState] = useState(null);
  const [currentState, setCurrentState] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [createBackup, setCreateBackup] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load version details and comparison
  useEffect(() => {
    loadData();
  }, [pluginId, versionId, currentVersionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const storeId = localStorage.getItem('selectedStoreId');
      const headers = {
        'Content-Type': 'application/json',
        ...(storeId && storeId !== 'undefined' ? { 'x-store-id': storeId } : {})
      };

      // Load version details first
      const versionResponse = await fetch(`/api/plugins/${pluginId}/versions/${versionId}`, { headers });

      if (!versionResponse.ok) {
        throw new Error('Failed to load version data');
      }

      const versionData = await versionResponse.json();
      setVersion(versionData.version);
      setVersionState(versionData.version.reconstructed_state || versionData.version.snapshot?.snapshot_data || {});

      // Load current version (or get from API if not provided)
      let actualCurrentVersionId = currentVersionId;
      if (!actualCurrentVersionId) {
        const currentResponse = await fetch(`/api/plugins/${pluginId}/versions/current`, { headers });
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          actualCurrentVersionId = currentData.version?.id;
          setCurrentVersion(currentData.version);
          setCurrentState(currentData.version.reconstructed_state || currentData.version.snapshot?.snapshot_data || {});
        }
      } else {
        const currentResponse = await fetch(`/api/plugins/${pluginId}/versions/${actualCurrentVersionId}`, { headers });
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentVersion(currentData.version);
          setCurrentState(currentData.version.reconstructed_state || currentData.version.snapshot?.snapshot_data || {});
        }
      }

      // Load comparison
      if (actualCurrentVersionId && actualCurrentVersionId !== versionId) {
        const comparisonResponse = await fetch(
          `/api/plugins/${pluginId}/versions/compare?from=${actualCurrentVersionId}&to=${versionId}`,
          { headers }
        );
        if (comparisonResponse.ok) {
          const comparisonData = await comparisonResponse.json();
          setComparison(comparisonData.comparison);

          // Auto-select first changed component for preview
          if (comparisonData.comparison?.summary?.length > 0) {
            setSelectedComponent(comparisonData.comparison.summary[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load version data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute restore
  const handleRestore = async () => {
    try {
      setRestoring(true);
      setError(null);
      const storeId = localStorage.getItem('selectedStoreId');

      const response = await fetch(
        `/api/plugins/${pluginId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(storeId && storeId !== 'undefined' ? { 'x-store-id': storeId } : {})
          },
          body: JSON.stringify({
            create_backup: createBackup,
            created_by: null, // TODO: Add user context
            created_by_name: 'System'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore version');
      }

      setSuccess(true);

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to restore version:', error);
      setError(error.message);
    } finally {
      setRestoring(false);
    }
  };

  // Get component display name
  const getComponentDisplayName = (type) => {
    const names = {
      hooks: 'Hooks',
      events: 'Events',
      scripts: 'Scripts',
      widgets: 'Widgets',
      controllers: 'Controllers',
      entities: 'Entities',
      manifest: 'Manifest',
      metadata: 'Metadata'
    };
    return names[type] || type;
  };

  // Get actual code from component in a state
  const getComponentCodeFromState = (state, componentType) => {
    if (!state) return '';

    const componentData = state[componentType];
    if (!componentData || componentData.length === 0) {
      return '// No data';
    }

    // Format component data as readable code
    if (componentType === 'hooks') {
      return componentData.map((hook, i) =>
        `// Hook ${i + 1}: ${hook.hook_name || 'unnamed'}\n` +
        `// Type: ${hook.hook_type || 'filter'}\n` +
        (hook.handler_function || '// No handler')
      ).join('\n\n' + '='.repeat(50) + '\n\n');
    } else if (componentType === 'events') {
      return componentData.map((event, i) =>
        `// Event ${i + 1}: ${event.event_name || 'unnamed'}\n` +
        (event.listener_function || '// No listener')
      ).join('\n\n' + '='.repeat(50) + '\n\n');
    } else if (componentType === 'scripts') {
      return componentData.map((script, i) =>
        `// Script ${i + 1}: ${script.file_name || 'unnamed'}\n` +
        (script.file_content || '// No content')
      ).join('\n\n' + '='.repeat(50) + '\n\n');
    } else if (componentType === 'widgets') {
      return componentData.map((widget, i) =>
        `// Widget ${i + 1}: ${widget.widget_name || 'unnamed'}\n` +
        (widget.component_code || '// No component code')
      ).join('\n\n' + '='.repeat(50) + '\n\n');
    } else if (componentType === 'controllers') {
      return componentData.map((ctrl, i) =>
        `// Controller ${i + 1}: ${ctrl.controller_name || 'unnamed'}\n` +
        (ctrl.handler_code || '// No handler')
      ).join('\n\n' + '='.repeat(50) + '\n\n');
    }

    return JSON.stringify(componentData, null, 2);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : error ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <RotateCcw className="w-6 h-6 text-primary" />
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {success ? 'Version Restored!' : 'Restore Version'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {success
                    ? 'Plugin has been restored successfully'
                    : 'Review changes and confirm restoration'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} disabled={restoring}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Version info */}
          {!success && version && currentVersion && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-xs text-orange-600 font-medium mb-1">Current Version</p>
                <p className="font-mono text-sm font-semibold">{currentVersion.version_number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentVersion.commit_message || 'No message'}
                </p>
              </div>

              <div className="text-muted-foreground">
                <RotateCcw className="w-4 h-4" />
              </div>

              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Restore To</p>
                <p className="font-mono text-sm font-semibold">{version.version_number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {version.commit_message || 'No message'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading version details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <p className="text-sm font-medium text-red-600 mb-2">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button className="mt-4" onClick={loadData}>
                  Retry
                </Button>
              </div>
            </div>
          ) : success ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium text-green-600 mb-2">
                  Version Restored Successfully!
                </p>
                <p className="text-sm text-muted-foreground">
                  Plugin has been restored to version {version?.version_number}
                </p>
                {createBackup && (
                  <p className="text-xs text-muted-foreground mt-2">
                    A backup was created before restoration
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Warning banner */}
              <div className="bg-orange-50 border-t border-b border-orange-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      Important: Review Changes Before Restoring
                    </p>
                    <p className="text-xs text-orange-700">
                      Restoring will replace your current plugin configuration with the selected
                      version. All current unsaved changes will be lost. Make sure to review the
                      changes below before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup option */}
              <div className="border-b p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="create-backup"
                    checked={createBackup}
                    onCheckedChange={setCreateBackup}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="create-backup"
                      className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-green-600" />
                      Create automatic backup before restoring
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: A snapshot of your current version will be created and tagged as
                      'backup' before restoration. You can always revert to this backup later.
                    </p>
                  </div>
                </div>
              </div>

              {/* Changes preview */}
              {comparison && comparison.summary && comparison.summary.length > 0 ? (
                <div className="flex-1 flex overflow-hidden">
                  {/* Component list */}
                  <div className="w-56 border-r bg-muted/30 overflow-y-auto">
                    <div className="p-3 border-b bg-muted">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Changes ({comparison.summary.length})
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {comparison.summary.map((component, index) => {
                        const isSelected = selectedComponent?.component_type === component.component_type;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedComponent(component)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {getComponentDisplayName(component.component_type)}
                                </p>
                                <p className="text-xs opacity-75">
                                  {component.operations_count || 0} ops
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview diff */}
                  <div className="flex-1 overflow-hidden">
                    {selectedComponent ? (
                      <CodeEditor
                        originalCode={getComponentCodeFromState(currentState, selectedComponent.component_type)}
                        value={getComponentCodeFromState(versionState, selectedComponent.component_type)}
                        enableDiffDetection={true}
                        readOnly={true}
                        language="javascript"
                        fileName={`${getComponentDisplayName(selectedComponent.component_type)}.js`}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">
                          Select a component to preview changes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">No changes detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This version appears identical to your current version
                    </p>
                  </div>
                </div>
              )}

              {/* Stats */}
              {comparison && comparison.files_changed > 0 && (
                <div className="border-t p-3 bg-muted/30">
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-muted-foreground">
                      {comparison.files_changed} files will change
                    </span>
                    {comparison.lines_added > 0 && (
                      <span className="text-green-600">
                        +{comparison.lines_added} additions
                      </span>
                    )}
                    {comparison.lines_deleted > 0 && (
                      <span className="text-red-600">
                        -{comparison.lines_deleted} deletions
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {createBackup && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    Backup will be created automatically
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={restoring}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRestore}
                  disabled={restoring || loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {restoring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore Version
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionRestoreModal;
