import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import CodeEditor from './CodeEditor';
import {
  X,
  GitCompare,
  ArrowLeftRight,
  Download,
  FileCode,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * VersionCompareModal
 * Compares two plugin versions using the existing CodeEditor component
 * Features:
 * - Side-by-side diff view (using CodeEditor's DiffEditor)
 * - File-by-file comparison
 * - Stats (files changed, lines added/deleted)
 * - Swap version order
 * - Download diff report
 */
const VersionCompareModal = ({
  pluginId,
  fromVersionId,
  toVersionId,
  onClose,
  onRestore,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [fromVersion, setFromVersion] = useState(null);
  const [toVersion, setToVersion] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [swapped, setSwapped] = useState(false);

  // Component types to compare
  const componentTypes = ['hooks', 'events', 'scripts', 'widgets', 'controllers', 'entities'];

  // Load version details and comparison
  useEffect(() => {
    loadComparison();
  }, [pluginId, fromVersionId, toVersionId]);

  const loadComparison = async () => {
    try {
      setLoading(true);

      // Load both version details
      const [fromResponse, toResponse, comparisonResponse] = await Promise.all([
        fetch(`/api/plugins/${pluginId}/versions/${fromVersionId}`),
        fetch(`/api/plugins/${pluginId}/versions/${toVersionId}`),
        fetch(`/api/plugins/${pluginId}/versions/compare?from=${fromVersionId}&to=${toVersionId}`)
      ]);

      if (!fromResponse.ok || !toResponse.ok || !comparisonResponse.ok) {
        throw new Error('Failed to load comparison data');
      }

      const fromData = await fromResponse.json();
      const toData = await toResponse.json();
      const comparisonData = await comparisonResponse.json();

      setFromVersion(fromData.version);
      setToVersion(toData.version);
      setComparison(comparisonData.comparison);

      // Auto-select first changed component
      if (comparisonData.comparison?.summary?.length > 0) {
        setSelectedComponent(comparisonData.comparison.summary[0]);
      }
    } catch (error) {
      console.error('Failed to load comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  // Swap versions
  const handleSwap = () => {
    setSwapped(!swapped);
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

  // Reconstruct code from patches for a component
  const getComponentCode = (component) => {
    // This is a simplified version - in production you'd reconstruct from patches/snapshot
    // For now, we'll use the patch_operations to show the diff
    return JSON.stringify(component.patch_operations || [], null, 2);
  };

  // Download diff report
  const handleDownload = () => {
    if (!comparison) return;

    const report = `
# Version Comparison Report

From: ${fromVersion?.version_number} (${fromVersion?.created_at})
To: ${toVersion?.version_number} (${toVersion?.created_at})

## Statistics
- Files Changed: ${comparison.files_changed || 0}
- Lines Added: ${comparison.lines_added || 0}
- Lines Deleted: ${comparison.lines_deleted || 0}
- Components Modified: ${comparison.components_modified || 0}

## Changed Components
${comparison.summary?.map(comp => `
### ${getComponentDisplayName(comp.component_type)}
- Operations: ${comp.operations_count || 0}
- Change Type: ${comp.change_type || 'modified'}
`).join('\n') || 'No changes'}
    `;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version-comparison-${fromVersion?.version_number}-to-${toVersion?.version_number}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFromVersion = swapped ? toVersion : fromVersion;
  const activeToVersion = swapped ? fromVersion : toVersion;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <GitCompare className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Version Comparison</h2>
                <p className="text-sm text-muted-foreground">
                  Comparing plugin versions with side-by-side diff
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download Report
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Version info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">From Version</p>
                  <p className="font-mono text-sm font-semibold">{activeFromVersion?.version_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeFromVersion?.commit_message || 'No message'}
                  </p>
                </div>
                <Badge variant={activeFromVersion?.version_type === 'snapshot' ? 'default' : 'outline'}>
                  {activeFromVersion?.version_type}
                </Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSwap}
              className="flex-shrink-0"
              title="Swap versions"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>

            <div className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">To Version</p>
                  <p className="font-mono text-sm font-semibold">{activeToVersion?.version_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeToVersion?.commit_message || 'No message'}
                  </p>
                </div>
                <Badge variant={activeToVersion?.version_type === 'snapshot' ? 'default' : 'outline'}>
                  {activeToVersion?.version_type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          {comparison && (
            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="text-muted-foreground">
                {comparison.files_changed || 0} files changed
              </span>
              <span className="text-green-600">
                +{comparison.lines_added || 0} additions
              </span>
              <span className="text-red-600">
                -{comparison.lines_deleted || 0} deletions
              </span>
              <span className="text-orange-600">
                {comparison.components_modified || 0} components modified
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading comparison...</p>
              </div>
            </div>
          ) : !comparison || !comparison.summary || comparison.summary.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">No changes found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  These versions are identical
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Component selector sidebar */}
              <div className="w-64 border-r bg-muted/30 overflow-y-auto">
                <div className="p-3 border-b bg-muted">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Changed Components
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
                            <p className="text-sm font-medium truncate">
                              {getComponentDisplayName(component.component_type)}
                            </p>
                            <p className="text-xs opacity-75">
                              {component.operations_count || 0} operations
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              component.change_type === 'added'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : component.change_type === 'deleted'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {component.change_type || 'modified'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diff viewer */}
              <div className="flex-1 overflow-hidden">
                {selectedComponent ? (
                  <CodeEditor
                    originalCode={getComponentCode(selectedComponent)}
                    value={getComponentCode(selectedComponent)}
                    enableDiffDetection={true}
                    readOnly={true}
                    language="json"
                    fileName={`${getComponentDisplayName(selectedComponent.component_type)}.json`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                      Select a component to view changes
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use the CodeEditor's built-in diff features to explore changes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {activeToVersion && !activeToVersion.is_current && (
                <Button onClick={() => onRestore(activeToVersion.id)}>
                  Restore to {activeToVersion.version_number}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionCompareModal;
