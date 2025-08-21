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
  onPreviewModeChange,
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

        // Try to create an actual visual preview that renders like user browsing
        const PreviewComponent = () => {
          try {
            // Attempt to create a safe, functional component preview
            // We'll parse the JSX and try to render it with mock props and utilities
            
            // Extract the return statement and JSX content
            const returnMatch = componentCode.match(/return\s*\(([\s\S]*?)\);?\s*$/m) || 
                               componentCode.match(/return\s+([\s\S]*?);?\s*$/m);
            
            if (!returnMatch) {
              // If no return statement found, show a fallback preview
              return React.createElement('div', {
                className: 'p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg'
              }, [
                React.createElement('div', { key: 'icon', className: 'text-4xl mb-4' }, '🎨'),
                React.createElement('h3', { key: 'title', className: 'text-lg font-medium text-gray-700 mb-2' }, componentName),
                React.createElement('p', { key: 'desc', className: 'text-sm text-gray-500' }, 'Preview requires a return statement with JSX')
              ]);
            }
            
            let jsxContent = returnMatch[1].trim();
            
            // Remove parentheses if they wrap the entire JSX
            if (jsxContent.startsWith('(') && jsxContent.endsWith(')')) {
              jsxContent = jsxContent.slice(1, -1).trim();
            }
            
            // Simple and safe JSX-like rendering for common patterns
            // This focuses on rendering basic HTML structures with Tailwind classes
            
            // Mock common utilities and props that components might use
            const mockUtils = {
              cn: (...classes) => classes.filter(Boolean).join(' '),
              className: 'mock-class'
            };
            
            // Create a simplified renderer for basic JSX patterns
            const renderSimpleJSX = (jsx) => {
              // Handle basic div structures with classes
              if (jsx.includes('<div') && jsx.includes('className')) {
                // Extract className values and create basic div structures
                const divMatches = jsx.match(/<div[^>]*className=["']([^"']*)["'][^>]*>([\s\S]*?)<\/div>/g);
                
                if (divMatches && divMatches.length > 0) {
                  // Take the outermost div and render it
                  const mainDiv = divMatches[0];
                  const classMatch = mainDiv.match(/className=["']([^"']*)["']/);
                  const className = classMatch ? classMatch[1] : '';
                  const innerContent = mainDiv.replace(/<div[^>]*>|<\/div>/g, '').trim();
                  
                  // Extract text content from JSX
                  const textContent = innerContent
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\{[^}]*\}/g, '[Dynamic Content]')
                    .replace(/\s+/g, ' ')
                    .trim();
                  
                  return React.createElement('div', {
                    className: className,
                    style: { minHeight: '200px' }
                  }, [
                    textContent && React.createElement('div', { key: 'content' }, textContent),
                    // Add some visual indicators for dynamic content
                    React.createElement('div', {
                      key: 'preview-note',
                      className: 'mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600'
                    }, '🎭 Live Preview: Basic layout structure with original CSS classes')
                  ]);
                }
              }
              
              // Handle simple button components
              if (jsx.includes('<button') || jsx.includes('<Button')) {
                return React.createElement('div', {
                  className: 'p-4 space-y-4'
                }, [
                  React.createElement('button', {
                    key: 'preview-btn',
                    className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                  }, 'Sample Button'),
                  React.createElement('div', {
                    key: 'note',
                    className: 'text-xs text-gray-500 bg-gray-50 p-2 rounded'
                  }, '🎭 Button component preview with default styling')
                ]);
              }
              
              // Handle form elements
              if (jsx.includes('<form') || jsx.includes('<input') || jsx.includes('<Input')) {
                return React.createElement('div', {
                  className: 'p-4 space-y-4 max-w-md'
                }, [
                  React.createElement('div', { key: 'form-preview', className: 'space-y-3' }, [
                    React.createElement('input', {
                      key: 'input1',
                      type: 'text',
                      placeholder: 'Sample Input Field',
                      className: 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }),
                    React.createElement('input', {
                      key: 'input2',
                      type: 'email',
                      placeholder: 'email@example.com',
                      className: 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }),
                    React.createElement('button', {
                      key: 'submit',
                      className: 'w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
                    }, 'Submit')
                  ]),
                  React.createElement('div', {
                    key: 'note',
                    className: 'text-xs text-gray-500 bg-gray-50 p-2 rounded'
                  }, '🎭 Form component preview with interactive elements')
                ]);
              }
              
              // Handle card/panel layouts
              if (jsx.includes('card') || jsx.includes('Card') || jsx.includes('panel')) {
                return React.createElement('div', {
                  className: 'p-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow'
                }, [
                  React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900 mb-2'
                  }, 'Sample Card'),
                  React.createElement('p', {
                    key: 'content',
                    className: 'text-gray-600 text-sm mb-3'
                  }, 'This is a preview of your card component layout with sample content.'),
                  React.createElement('button', {
                    key: 'action',
                    className: 'px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
                  }, 'Action'),
                  React.createElement('div', {
                    key: 'note',
                    className: 'mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded'
                  }, '🎭 Card layout preview')
                ]);
              }
              
              // Default: Create a basic layout preview
              return React.createElement('div', {
                className: 'p-6 bg-white border border-gray-200 rounded-lg'
              }, [
                React.createElement('div', {
                  key: 'header',
                  className: 'border-b border-gray-200 pb-4 mb-4'
                }, [
                  React.createElement('h2', {
                    key: 'title',
                    className: 'text-xl font-semibold text-gray-900'
                  }, componentName + ' Preview'),
                  React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-sm text-gray-600 mt-1'
                  }, 'Live preview with basic layout structure')
                ]),
                React.createElement('div', {
                  key: 'content',
                  className: 'space-y-3'
                }, [
                  React.createElement('div', {
                    key: 'sample1',
                    className: 'h-4 bg-gray-200 rounded w-3/4'
                  }),
                  React.createElement('div', {
                    key: 'sample2', 
                    className: 'h-4 bg-gray-200 rounded w-1/2'
                  }),
                  React.createElement('div', {
                    key: 'sample3',
                    className: 'h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-sm'
                  }, 'Interactive Element Placeholder')
                ]),
                React.createElement('div', {
                  key: 'note',
                  className: 'mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded'
                }, '🎭 Live preview with inferred layout structure from your component code')
              ]);
            };
            
            return renderSimpleJSX(jsxContent);
            
          } catch (error) {
            return React.createElement('div', {
              className: 'p-4 bg-red-50 border border-red-200 rounded text-red-700'
            }, [
              React.createElement('div', { key: 'title', className: 'font-medium mb-2' }, 'Preview Error'),
              React.createElement('div', { key: 'error', className: 'text-sm' }, error.message),
              React.createElement('div', {
                key: 'fallback',
                className: 'mt-3 p-3 bg-gray-50 border rounded text-gray-600 text-xs'
              }, 'Try simplifying your component structure for better live preview support.')
            ]);
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

  // Initialize preview mode in global header when component mounts
  useEffect(() => {
    onPreviewModeChange?.(previewMode);
  }, [onPreviewModeChange]); // Only run once on mount

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
            {/* Tab Interface Above File Name */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Code tab - switch to code view if implemented
                    console.log('Code tab clicked');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Code
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('patch');
                    onPreviewModeChange?.('patch');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Diff
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('live');
                    onPreviewModeChange?.('live');
                    if (previewCode || currentCode) {
                      generateVisualPreview(previewCode || currentCode);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                >
                  Live Preview
                </button>
              </div>
              
              {/* File Name Bar */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-500 mr-2">📄</span>
                  File Preview
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono">
                  {fileName}
                </span>
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
            {/* Tab Interface Above File Name */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Code tab - switch to code view if implemented
                    console.log('Code tab clicked');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Code
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('patch');
                    onPreviewModeChange?.('patch');
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                >
                  Diff
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('live');
                    onPreviewModeChange?.('live');
                    if (previewCode || currentCode) {
                      generateVisualPreview(previewCode || currentCode);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Live Preview
                </button>
              </div>
              
              {/* File Name Bar */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-500 mr-2">📄</span>
                  File Preview
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono">
                  {fileName}
                </span>
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