import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Check, X, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import CodeEditor from './CodeEditor';
import apiClient from '@/api/client';

/**
 * Preview System Component
 * Live preview of code changes with patch application workflow
 * Shows before/after comparison and validation results
 */
const PreviewSystem = ({ 
  originalCode = '', 
  currentCode = '',
  patch = null, 
  fileName = '',
  onApplyPatch,
  onRejectPatch,
  hasManualEdits = false,
  manualEditResult = null,
  className 
}) => {
  const [previewCode, setPreviewCode] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const [diff, setDiff] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState('live'); // 'live', 'patch'
  const [visualPreview, setVisualPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [patchHistory, setPatchHistory] = useState([]);
  const [showPatchHistory, setShowPatchHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Generate visual preview by compiling and rendering the component
  const generateVisualPreview = useCallback(async (codeToRender) => {
    if (!codeToRender || !fileName.match(/\.(jsx?|tsx?)$/)) {
      setVisualPreview(null);
      setPreviewError('Visual preview only supports React components (.jsx, .tsx files)');
      return;
    }

    try {
      setPreviewError(null);
      
      // For React components, attempt to render them
      if (fileName.match(/\.(jsx|tsx)$/)) {
        // Remove imports and exports for preview rendering
        let componentCode = codeToRender
          .replace(/^import\s+.*$/gm, '') // Remove import statements
          .replace(/^export\s+default\s+.*$/gm, '') // Remove export default
          .replace(/^export\s+\{.*\}.*$/gm, '') // Remove named exports
          .trim();

        // Extract component name from the code
        const componentMatch = componentCode.match(/(?:const|function)\s+(\w+)\s*[=\(]/);
        const componentName = componentMatch ? componentMatch[1] : 'PreviewComponent';

        // Simple JSX to React.createElement transformation
        // This is a basic transformation for common JSX patterns
        const transformJSX = (code) => {
          return code
            // Transform self-closing tags: <div /> -> React.createElement('div')
            .replace(/<(\w+)\s*\/>/g, "React.createElement('$1')")
            // Transform opening tags: <div> -> React.createElement('div', null,
            .replace(/<(\w+)([^>]*)>/g, (match, tag, props) => {
              if (props.trim()) {
                // Basic props handling - this is simplified
                const propsObj = props.includes('=') ? `{${props.replace(/(\w+)="([^"]*)"/g, '$1: "$2"')}}` : 'null';
                return `React.createElement('${tag}', ${propsObj}, `;
              }
              return `React.createElement('${tag}', null, `;
            })
            // Transform closing tags: </div> -> )
            .replace(/<\/\w+>/g, ')')
            // Handle string content between tags
            .replace(/>\s*([^<>{}]+)\s*</g, (match, content) => {
              const trimmed = content.trim();
              return trimmed ? `>, "${trimmed}", <` : '>, <';
            });
        };

        // Try to create a simpler preview for JSX components
        const PreviewComponent = () => {
          try {
            // For now, show a placeholder for JSX components that can't be easily transformed
            return React.createElement('div', {
              className: 'p-4 bg-gray-50 border rounded text-center'
            }, [
              React.createElement('div', { key: 'icon', className: 'text-2xl mb-2' }, '⚛️'),
              React.createElement('div', { key: 'title', className: 'font-medium text-gray-700' }, componentName),
              React.createElement('div', { key: 'desc', className: 'text-sm text-gray-500 mt-1' }, 'React Component Preview'),
              React.createElement('div', { key: 'note', className: 'text-xs text-gray-400 mt-2' }, 'Visual preview for JSX components coming soon')
            ]);
          } catch (error) {
            return React.createElement('div', {
              className: 'p-4 bg-red-50 border border-red-200 rounded text-red-700'
            }, 'Preview Error: ' + error.message);
          }
        };

        setVisualPreview(() => PreviewComponent);
      } else {
        // For non-React files, show a message
        setPreviewError('Visual preview is only available for React components');
      }
    } catch (error) {
      console.error('Visual preview generation failed:', error);
      setPreviewError(`Preview compilation failed: ${error.message}`);
      setVisualPreview(null);
    }
  }, [fileName]);

  // Generate preview when patch changes or manual edits are detected
  useEffect(() => {
    if (hasManualEdits && currentCode !== originalCode) {
      // For manual edits, show the current edited code as preview
      setPreviewCode(currentCode);
      setValidationResult({
        isValid: true,
        message: 'Manual edits detected',
        type: 'manual'
      });
      // Generate simple diff for manual edits
      if (manualEditResult) {
        setDiff({
          type: 'manual',
          changes: manualEditResult.changeCount,
          summary: manualEditResult.summary,
          hunks: manualEditResult.summary?.hunks || [],
          oldFileName: 'original',
          newFileName: 'modified'
        });
      }
      // Generate visual preview for manual edits
      if (previewMode === 'live') {
        generateVisualPreview(currentCode);
      }
    } else if (patch && originalCode) {
      // For AI-generated patches, use the API to generate preview
      generatePreview();
    } else {
      setPreviewCode('');
      setValidationResult(null);
      setDiff(null);
      setVisualPreview(null);
      setPreviewError(null);
    }
  }, [patch, originalCode, currentCode, hasManualEdits, manualEditResult, previewMode, generateVisualPreview]);

  // Generate preview from patch
  const generatePreview = useCallback(async () => {
    if (!patch || !originalCode) return;

    setIsGenerating(true);
    try {
      const data = await apiClient.post('ai-context/generate-preview', {
        sourceCode: originalCode,
        changes: patch,
        filePath: fileName
      });

      if (data.success) {
        setPreviewCode(data.data.previewCode);
        setDiff(data.data.diff);
        setValidationResult(data.data.validation);
        // Generate visual preview for AI-generated patches
        if (previewMode === 'live') {
          generateVisualPreview(data.data.previewCode);
        }
      } else {
        setValidationResult({
          isValid: false,
          errors: [{ message: data.message || 'Failed to generate preview' }]
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [{ message: `Preview generation failed: ${error.message}` }]
      });
    } finally {
      setIsGenerating(false);
    }
  }, [patch, originalCode, fileName, previewMode, generateVisualPreview]);

  // Apply patch to original code
  const handleApplyPatch = useCallback(async () => {
    if (!patch || !originalCode) return;

    try {
      const data = await apiClient.post('ai-context/apply-patch', {
        patch,
        sourceCode: originalCode,
        filePath: fileName
      });

      if (data.success) {
        onApplyPatch?.(data.data.modifiedCode, data.data);
      } else {
        setValidationResult({
          isValid: false,
          errors: [{ message: data.message || 'Failed to apply patch' }]
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [{ message: `Patch application failed: ${error.message}` }]
      });
    }
  }, [patch, originalCode, fileName, onApplyPatch]);

  // Download preview as file
  const downloadPreview = useCallback(() => {
    if (!previewCode) return;

    const blob = new Blob([previewCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'preview.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [previewCode, fileName]);

  // Load patch history for the current file
  const loadPatchHistory = useCallback(async () => {
    if (!fileName) return;
    
    setLoadingHistory(true);
    try {
      const data = await apiClient.get(`ast-diffs/file/${fileName}`);
      if (data.success) {
        setPatchHistory(data.data.overlays || []);
      }
    } catch (error) {
      console.error('Failed to load patch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [fileName]);

  // Save patch to persistent storage
  const savePatchToPersistentStorage = useCallback(async () => {
    if (!patch || !originalCode || !previewCode || !fileName) return;

    try {
      const data = await apiClient.post('ast-diffs/create', {
        filePath: fileName,
        originalCode: originalCode,
        modifiedCode: previewCode,
        changeSummary: `AI-generated changes for: ${fileName}`,
        changeType: 'modification'
      });

      if (data.success) {
        console.log('Patch saved to persistent storage:', data.data.id);
        // Reload patch history to show the new patch
        loadPatchHistory();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to save patch to persistent storage:', error);
    }
  }, [patch, originalCode, previewCode, fileName, loadPatchHistory]);

  // Revert a specific patch from history
  const revertPatch = useCallback(async (patchId) => {
    try {
      const data = await apiClient.post(`ast-diffs/${patchId}/revert`);
      if (data.success) {
        console.log('Patch reverted successfully:', patchId);
        // Reload patch history to reflect the revert
        loadPatchHistory();
        return true;
      }
    } catch (error) {
      console.error('Failed to revert patch:', error);
    }
    return false;
  }, [loadPatchHistory]);

  // Apply a specific patch from history
  const applyStoredPatch = useCallback(async (patchId) => {
    try {
      const data = await apiClient.post(`ast-diffs/${patchId}/apply`);
      if (data.success) {
        console.log('Stored patch applied successfully:', patchId);
        // Reload patch history to reflect the application
        loadPatchHistory();
        return true;
      }
    } catch (error) {
      console.error('Failed to apply stored patch:', error);
    }
    return false;
  }, [loadPatchHistory]);

  // Load patch history when file changes
  useEffect(() => {
    if (fileName && showPatchHistory) {
      loadPatchHistory();
    }
  }, [fileName, showPatchHistory, loadPatchHistory]);

  // Render diff view
  const renderDiffView = () => {
    if (!diff || !diff.hunks) return null;

    return (
      <div className="h-full overflow-auto font-mono text-sm">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {diff.oldFileName} → {diff.newFileName}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {diff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex} className="p-2">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
              </div>
              
              <div className="space-y-0">
                {hunk.changes.map((change, changeIndex) => (
                  <div
                    key={changeIndex}
                    className={cn(
                      "px-2 py-0.5 text-xs leading-relaxed",
                      change.type === 'add' && "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                      change.type === 'del' && "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200",
                      change.type === 'normal' && "bg-gray-50 dark:bg-gray-800"
                    )}
                  >
                    <span className={cn(
                      "inline-block w-4 text-center mr-2",
                      change.type === 'add' && "text-green-600",
                      change.type === 'del' && "text-red-600",
                      change.type === 'normal' && "text-gray-400"
                    )}>
                      {change.type === 'add' ? '+' : change.type === 'del' ? '-' : ' '}
                    </span>
                    <span>{change.content}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <div className={cn("w-8 bg-gray-100 dark:bg-gray-800 border-l flex flex-col", className)}>
        <button
          onClick={() => setIsVisible(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Show Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-white dark:bg-gray-900 border-l", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Preview
          </h3>
          
          {/* Preview Mode Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded p-0.5">
            <button
              onClick={() => {
                setPreviewMode('live');
                // Trigger visual preview generation when switching to live mode
                if (previewCode || currentCode) {
                  generateVisualPreview(previewCode || currentCode);
                }
              }}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors font-medium",
                previewMode === 'live' 
                  ? "bg-blue-500 text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              )}
              title="Visual rendering without deployment"
            >
              🔴 Live Preview
            </button>
            <button
              onClick={() => setPreviewMode('patch')}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors font-medium",
                previewMode === 'patch' 
                  ? "bg-orange-500 text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              )}
              title="Review changes before production deployment"
            >
              📋 Patch Review
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {previewCode && (
            <button
              onClick={downloadPreview}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Download Preview"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Hide Preview"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Status */}
      {validationResult && (
        <div className={cn(
          "p-2 border-b text-sm",
          validationResult.isValid 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        )}>
          <div className="flex items-center">
            {validationResult.isValid ? (
              <Check className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            )}
            <span className={cn(
              validationResult.isValid 
                ? "text-green-700 dark:text-green-400" 
                : "text-red-700 dark:text-red-400"
            )}>
              {validationResult.type === 'manual' 
                ? `Live preview (${diff?.changes || 0} changes)`
                : validationResult.isValid ? "Code is valid" : "Validation errors found"
              }
            </span>
          </div>
          
          {!validationResult.isValid && validationResult.errors && (
            <div className="mt-1 space-y-1">
              {validationResult.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-400">
                  • {error.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isGenerating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Generating preview...</p>
            </div>
          </div>
        ) : !patch && !hasManualEdits ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No changes to preview</p>
              <p className="text-xs mt-1">Make changes in the AI Context Window or Code Editor to see a preview</p>
            </div>
          </div>
        ) : previewMode === 'live' ? (
          // Live Preview Mode - Visual rendering without deployment
          <div className="h-full overflow-auto">
            {/* File Preview Bar */}
            <div className="sticky top-0 p-2 bg-blue-50 dark:bg-blue-900/20 border-b text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between z-10">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                🔴 Live Preview • No deployment
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-300 font-mono">
                  {fileName}
                </span>
                {hasManualEdits && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-800 rounded text-orange-700 dark:text-orange-300">
                    Manual Edits
                  </span>
                )}
              </div>
            </div>
            
            {previewError ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-orange-600 dark:text-orange-400 p-4">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">{previewError}</p>
                </div>
              </div>
            ) : visualPreview ? (
              <div className="p-4">
                <div 
                  id="visual-preview-container"
                  className="min-h-[400px] border-2 border-blue-200 rounded bg-white shadow-sm"
                >
                  {/* Visual preview will be rendered here by React */}
                  {visualPreview && React.createElement(visualPreview)}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Generating live preview...</p>
                  <p className="text-xs mt-1">Compiling React component</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Patch Review Mode - Show detailed diff and changes for approval
          <div className="h-full flex flex-col">
            {/* File Preview Bar for Patch Review */}
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border-b text-xs text-orange-600 dark:text-orange-400 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                📋 Patch Review • Review before production deployment
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-800 rounded text-orange-700 dark:text-orange-300 font-mono">
                  {fileName}
                </span>
                {patch && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 rounded text-yellow-700 dark:text-yellow-300">
                    Pending Changes
                  </span>
                )}
              </div>
            </div>
            
            {diff ? (
              <div className="flex-1 overflow-auto">
                {renderDiffView()}
              </div>
            ) : (
              <div className="flex-1 flex">
                {/* Original Code */}
                <div className="flex-1 border-r">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b text-xs text-gray-600 dark:text-gray-400">
                    ❌ Original Code
                  </div>
                  <CodeEditor
                    value={originalCode}
                    fileName={fileName}
                    readOnly={true}
                    className="h-full"
                  />
                </div>
                
                {/* Modified Code */}
                <div className="flex-1">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b text-xs text-gray-600 dark:text-gray-400">
                    ✅ Modified Code (for production)
                  </div>
                  <CodeEditor
                    value={previewCode}
                    fileName={fileName}
                    readOnly={true}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons and Patch History */}
      {patch && previewCode && !hasManualEdits && (
        <div className="border-t bg-gray-50 dark:bg-gray-800">
          {/* Action Buttons */}
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPatchHistory(!showPatchHistory)}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="View patch history"
              >
                <span className="text-xs">📋</span> History ({patchHistory.length})
              </button>
              
              <button
                onClick={savePatchToPersistentStorage}
                className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Save patch to history"
              >
                💾 Save Patch
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onRejectPatch?.()}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-700 dark:text-red-400 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <X className="w-4 h-4 inline mr-1" />
                Reject
              </button>
              
              <button
                onClick={handleApplyPatch}
                disabled={validationResult && !validationResult.isValid}
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-colors",
                  validationResult && !validationResult.isValid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                <Check className="w-4 h-4 inline mr-1" />
                Apply Changes
              </button>
            </div>
          </div>
          
          {/* Patch History Panel */}
          {showPatchHistory && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Patch History • {fileName}
                  </h4>
                  {loadingHistory && (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {patchHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <div className="text-xs">No saved patches for this file</div>
                    <div className="text-xs mt-1">Save the current patch to see it here</div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {patchHistory.map((historyPatch) => (
                      <div
                        key={historyPatch.id}
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded text-xs bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              historyPatch.status === 'applied' ? "bg-green-500" :
                              historyPatch.status === 'reverted' ? "bg-red-500" :
                              "bg-blue-500"
                            )} />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {historyPatch.changeSummary || 'Untitled Change'}
                            </span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(historyPatch.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {historyPatch.patchPreview && (
                          <div className="mb-2 text-gray-600 dark:text-gray-400">
                            {historyPatch.patchPreview.substring(0, 100)}
                            {historyPatch.patchPreview.length > 100 && '...'}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-gray-500 dark:text-gray-400">
                            {historyPatch.affectedSymbols?.length > 0 && (
                              <span>Affects: {historyPatch.affectedSymbols.slice(0, 2).join(', ')}{historyPatch.affectedSymbols.length > 2 && '...'}</span>
                            )}
                          </div>
                          
                          <div className="flex space-x-1">
                            {historyPatch.status === 'pending' && (
                              <button
                                onClick={() => applyStoredPatch(historyPatch.id)}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                title="Apply this patch"
                              >
                                Apply
                              </button>
                            )}
                            
                            {historyPatch.status === 'applied' && (
                              <button
                                onClick={() => revertPatch(historyPatch.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Revert this patch"
                              >
                                Revert
                              </button>
                            )}
                            
                            <span className={cn(
                              "px-2 py-1 text-xs rounded",
                              historyPatch.status === 'applied' ? "bg-green-100 text-green-700" :
                              historyPatch.status === 'reverted' ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {historyPatch.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Manual Edit Status */}
      {hasManualEdits && previewCode && (
        <div className="p-3 border-t bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <Check className="w-4 h-4 inline mr-2" />
            Showing live preview of manual edits
          </div>
          {manualEditResult && (
            <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              {manualEditResult.summary?.additions && `+${manualEditResult.summary.additions} additions`}
              {manualEditResult.summary?.deletions && ` -${manualEditResult.summary.deletions} deletions`}
              {manualEditResult.summary?.modifications && ` ~${manualEditResult.summary.modifications} modifications`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewSystem;