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
  const [viewMode, setViewMode] = useState('split'); // 'split', 'preview', 'diff'

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
          summary: manualEditResult.summary
        });
      }
    } else if (patch && originalCode) {
      // For AI-generated patches, use the API to generate preview
      generatePreview();
    } else {
      setPreviewCode('');
      setValidationResult(null);
      setDiff(null);
    }
  }, [patch, originalCode, currentCode, hasManualEdits, manualEditResult]);

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
  }, [patch, originalCode, fileName]);

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
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === 'split' 
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === 'preview' 
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === 'diff' 
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Diff
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
        ) : viewMode === 'diff' ? (
          renderDiffView()
        ) : viewMode === 'split' ? (
          <div className="h-full flex">
            {/* Original Code */}
            <div className="flex-1 border-r">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b text-xs text-gray-600 dark:text-gray-400">
                Original
              </div>
              <CodeEditor
                value={originalCode}
                fileName={fileName}
                readOnly={true}
                className="h-full"
              />
            </div>
            
            {/* Preview Code */}
            <div className="flex-1">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b text-xs text-gray-600 dark:text-gray-400">
                Preview
              </div>
              <CodeEditor
                value={previewCode}
                fileName={fileName}
                readOnly={true}
                className="h-full"
              />
            </div>
          </div>
        ) : (
          // Preview only
          <CodeEditor
            value={previewCode}
            fileName={fileName}
            readOnly={true}
            className="h-full"
          />
        )}
      </div>

      {/* Action Buttons */}
      {patch && previewCode && !hasManualEdits && (
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-800 flex justify-end space-x-2">
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