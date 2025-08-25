import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { detectManualEdit, createDebouncedDiffDetector } from '@/services/diff-detector';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { normalizeFilePath } from '@/utils/storeContext';
import apiClient from '@/api/client';
// Simple hash function to replace crypto-js for debugging
const simpleHash = (str) => {
  let hash = 0;
  if (!str || str.length === 0) return 'null';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

/**
 * Monaco Code Editor with AST-aware autocomplete
 * Integrates with AI Context Window for intelligent code editing
 */
const CodeEditor = ({ 
  value = '', 
  onChange, 
  language = 'javascript',
  fileName = '',
  theme = 'vs-dark',
  readOnly = false,
  className,
  onCursorPositionChange,
  onSelectionChange,
  onManualEdit, // Callback for when manual edits are detected
  onCodeChange, // Callback for when code changes (for preview updates)
  originalCode = '', // Original code baseline for diff detection
  enableDiffDetection = false // Enable manual edit detection
}) => {
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [astData, setAstData] = useState(null);
  const [completionProvider, setCompletionProvider] = useState(null);
  const [diffResult, setDiffResult] = useState(null); // Current diff result
  const [isDiffMode, setIsDiffMode] = useState(false); // Show diff indicators in editor
  const [savedPatches, setSavedPatches] = useState([]); // Previous patches from database
  const [patchSaveStatus, setPatchSaveStatus] = useState(null); // Status of patch saving
  const [showRevertedIndicator, setShowRevertedIndicator] = useState(false); // Show "Back to Original" indicator
  const astAnalysisRef = useRef(null);
  const diffDetectorRef = useRef(null);
  const originalCodeRef = useRef(originalCode);
  const autoSaveTimeoutRef = useRef(null);
  
  // Get store context for API calls that require store_id
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');
  
  // Create API config with store headers
  const getApiConfig = useCallback(() => {
    const headers = {};
    if (storeId && storeId !== 'undefined') {
      headers['x-store-id'] = storeId;
    }
    return { headers };
  }, [storeId]);

  // Initialize diff detection system
  useEffect(() => {
    if (enableDiffDetection && originalCode) {
      originalCodeRef.current = originalCode;
      
      // Create debounced diff detector with initial original code
      if (diffDetectorRef.current) {
        // Clean up existing detector
        diffDetectorRef.current = null;
      }
      
      diffDetectorRef.current = createDebouncedDiffDetector((diffResult) => {
        setDiffResult(diffResult);
        onManualEdit?.(diffResult);
        
        // Show "Back to Original" indicator briefly when user reverts to baseline
        if (!diffResult.hasChanges && diffResult.revertedToOriginal) {
          setShowRevertedIndicator(true);
          setTimeout(() => setShowRevertedIndicator(false), 3000); // Hide after 3 seconds
        }
        
        // ENHANCED DEBUGGING: Log detailed comparison info
        console.log('🔍 DETAILED AUTO-SAVE DEBUG:', {
          fileName,
          diffResult: {
            hasChanges: diffResult.hasChanges,
            changeCount: diffResult.changeCount,
            revertedToOriginal: diffResult.revertedToOriginal,
            summary: diffResult.summary?.stats
          },
          originalCode: {
            length: originalCode.length,
            hash: simpleHash(originalCode),
            preview: originalCode?.substring(0, 100) + '...'
          },
          currentEditor: {
            available: !!editorInstance,
            method: 'editorInstance?.getValue()'
          }
        });
        
        // Get current editor content for additional verification
        const currentEditorContent = editorInstance?.getValue() || value;
        const isIdenticalToOriginal = originalCode === currentEditorContent;
        
        console.log('🔍 CONTENT COMPARISON CHECK:', {
          originalLength: originalCode?.length || 0,
          currentLength: currentEditorContent?.length || 0,
          lengthDifference: Math.abs((originalCode?.length || 0) - (currentEditorContent?.length || 0)),
          isIdentical: isIdenticalToOriginal,
          firstLineOriginal: originalCode?.split('\n')[0] || 'null',
          firstLineCurrent: currentEditorContent?.split('\n')[0] || 'null',
          diagnosis: isIdenticalToOriginal ? '❌ FRONTEND ISSUE: Editor content = original baseline' : '✅ Content differs, should detect changes'
        });

        // Auto-save patch only if there are actual changes (not when reverted to original)
        if (diffResult.hasChanges && diffResult.changeCount > 0) {
          console.log('🔥 Auto-save triggered:', {
            fileName,
            hasChanges: diffResult.hasChanges,
            changeCount: diffResult.changeCount,
            originalCodeLength: originalCode.length,
            summary: diffResult.summary?.stats
          });
          autoSavePatch(diffResult);
        } else {
          console.log('🔇 Auto-save skipped:', {
            fileName,
            hasChanges: diffResult.hasChanges,
            changeCount: diffResult.changeCount,
            reason: !diffResult.hasChanges ? 'No changes detected' : 'Change count is 0',
            troubleshooting: {
              check1: 'Is originalCode prop set to the correct database baseline?',
              check2: 'Is the editor content actually different from originalCode?',
              check3: 'Is diff detection logic working correctly?',
              check4: 'Are there JS errors preventing proper diff calculation?'
            }
          });
        }
      }, 500, originalCode);
      
      console.log('🔍 Diff detection enabled for file:', fileName, 'with baseline length:', originalCode.length);
    }
    
    return () => {
      // Cleanup on unmount
      if (diffDetectorRef.current) {
        diffDetectorRef.current = null;
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [enableDiffDetection, originalCode, fileName, onManualEdit]);

  // Update original code reference when it changes
  useEffect(() => {
    if (originalCode !== originalCodeRef.current) {
      originalCodeRef.current = originalCode;
      // Update the detector's baseline if it exists
      if (diffDetectorRef.current && diffDetectorRef.current.setOriginal) {
        diffDetectorRef.current.setOriginal(originalCode);
      }
      // Reset diff result when original code changes
      setDiffResult(null);
    }
  }, [originalCode]);

  // Load previous patches when fileName changes
  useEffect(() => {
    if (fileName && enableDiffDetection) {
      loadPreviousPatches();
    }
  }, [fileName, enableDiffDetection]);

  // Load previous patches from database
  const loadPreviousPatches = useCallback(async () => {
    if (!fileName) return;

    try {
      // Normalize file path and get API config with store context
      const normalizedFileName = normalizeFilePath(fileName);
      console.log(`📋 Loading previous hybrid customization patches for ${normalizedFileName}...`);
      
      const apiConfig = getApiConfig();
      const response = await apiClient.get(`hybrid-patches/${encodeURIComponent(normalizedFileName)}`, apiConfig);
      
      if (response.success && response.data) {
        const patches = response.data.patches || [];
        setSavedPatches(patches);
        console.log(`✅ Loaded ${patches.length} previous hybrid customization patches for ${fileName}`);
      } else {
        setSavedPatches([]);
        console.log(`📋 No previous hybrid customization patches found for ${fileName}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load hybrid customization patches for ${fileName}:`, error.message);
      setSavedPatches([]);
    }
  }, [fileName, getApiConfig]);

  // Auto-save patches when manual edits are detected
  const autoSavePatch = useCallback(async (diffResult) => {
    console.log('🚀 AutoSavePatch called:', {
      fileName: fileName || 'NO_FILENAME',
      hasChanges: diffResult?.hasChanges || false,
      originalCodeLength: originalCode?.length || 0,
      storeId: storeId || 'NO_STORE_ID',
      diffResult: diffResult ? 'PROVIDED' : 'MISSING'
    });
    
    if (!fileName || !diffResult.hasChanges || !originalCode) {
      console.log('❌ AutoSavePatch early return:', {
        fileName: !fileName ? 'MISSING' : 'OK',
        hasChanges: !diffResult.hasChanges ? 'FALSE' : 'TRUE',
        originalCode: !originalCode ? 'MISSING' : 'OK'
      });
      return;
    }

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounce auto-save by 3 seconds to avoid too frequent saves
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('⏰ Auto-save timeout triggered for:', fileName);
        setPatchSaveStatus({ status: 'saving', message: 'Auto-saving patch...' });
        
        // Get current code from the editor
        const currentCode = editorInstance?.getValue() || value;
        
        // Normalize file path and get API config with store context
        const normalizedFileName = normalizeFilePath(fileName);
        const apiConfig = getApiConfig();
        
        const payload = {
          filePath: normalizedFileName,
          modified_code: currentCode,  // Simplified: only send the current/modified code
          changeSummary: `Manual edit: ${diffResult.changeCount} changes (${diffResult.summary?.stats?.additions || 0} additions, ${diffResult.summary?.stats?.deletions || 0} deletions)`,
          changeType: 'manual_edit'
        };
        
        console.log('📤 Sending auto-save request:', {
          endpoint: 'hybrid-patches/create',
          filePath: normalizedFileName,
          modifiedCodeLength: currentCode.length,
          changeSummary: payload.changeSummary,
          apiConfig: apiConfig
        });
        
        const response = await apiClient.post('hybrid-patches/create', payload, apiConfig);

        console.log('📥 Auto-save API response:', response);
        
        if (response.success) {
          console.log('💾 Auto-saved hybrid customization:', response.data.id);
          setPatchSaveStatus({ 
            status: 'success', 
            message: 'Changes auto-saved to hybrid customization',
            data: response.data 
          });
          
          // Add to saved patches list
          setSavedPatches(prev => [response.data, ...prev]);
          
          // Clear status after 2 seconds
          setTimeout(() => setPatchSaveStatus(null), 2000);
        } else {
          console.error('❌ Auto-save failed:', response);
          setPatchSaveStatus({ 
            status: 'error', 
            message: `Save failed: ${response.message}` 
          });
        }
      } catch (error) {
        console.error('❌ Error auto-saving patch:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setPatchSaveStatus({ 
          status: 'error', 
          message: `Save error: ${error.message}` 
        });
      }
    }, 3000);
  }, [fileName, originalCode, editorInstance, value, getApiConfig]);

  // Apply a saved patch
  const applyPatch = useCallback(async (patchId) => {
    try {
      setPatchSaveStatus({ status: 'applying', message: 'Applying patch...' });
      
      const apiConfig = getApiConfig();
      const response = await apiClient.post(`ast-diffs/${patchId}/apply`, {}, apiConfig);
      
      if (response.success) {
        console.log('✅ Applied patch:', patchId);
        setPatchSaveStatus({ 
          status: 'success', 
          message: 'Patch applied successfully' 
        });
        
        // Refresh patches to get updated status
        loadPreviousPatches();
        
        // Clear status after 2 seconds
        setTimeout(() => setPatchSaveStatus(null), 2000);
      } else {
        setPatchSaveStatus({ 
          status: 'error', 
          message: `Apply failed: ${response.message}` 
        });
      }
    } catch (error) {
      console.error('Error applying patch:', error);
      setPatchSaveStatus({ 
        status: 'error', 
        message: `Apply error: ${error.message}` 
      });
    }
  }, [loadPreviousPatches, getApiConfig]);

  // Revert a saved patch
  const revertPatch = useCallback(async (patchId) => {
    try {
      setPatchSaveStatus({ status: 'reverting', message: 'Reverting patch...' });
      
      const apiConfig = getApiConfig();
      const response = await apiClient.post(`ast-diffs/${patchId}/revert`, {}, apiConfig);
      
      if (response.success) {
        console.log('↩️ Reverted patch:', patchId);
        setPatchSaveStatus({ 
          status: 'success', 
          message: 'Patch reverted successfully' 
        });
        
        // Refresh patches to get updated status
        loadPreviousPatches();
        
        // Clear status after 2 seconds
        setTimeout(() => setPatchSaveStatus(null), 2000);
      } else {
        setPatchSaveStatus({ 
          status: 'error', 
          message: `Revert failed: ${response.message}` 
        });
      }
    } catch (error) {
      console.error('Error reverting patch:', error);
      setPatchSaveStatus({ 
        status: 'error', 
        message: `Revert error: ${error.message}` 
      });
    }
  }, [loadPreviousPatches, getApiConfig]);

  // Delete a saved patch
  const deletePatch = useCallback(async (patchId) => {
    try {
      setPatchSaveStatus({ status: 'deleting', message: 'Deleting patch...' });
      
      const apiConfig = getApiConfig();
      const response = await apiClient.delete(`ast-diffs/${patchId}`, apiConfig);
      
      if (response.success) {
        console.log('🗑️ Deleted patch:', patchId);
        setPatchSaveStatus({ 
          status: 'success', 
          message: 'Patch deleted successfully' 
        });
        
        // Remove from saved patches list
        setSavedPatches(prev => prev.filter(p => p.id !== patchId));
        
        // Clear status after 2 seconds
        setTimeout(() => setPatchSaveStatus(null), 2000);
      } else {
        setPatchSaveStatus({ 
          status: 'error', 
          message: `Delete failed: ${response.message}` 
        });
      }
    } catch (error) {
      console.error('Error deleting patch:', error);
      setPatchSaveStatus({ 
        status: 'error', 
        message: `Delete error: ${error.message}` 
      });
    }
  }, [getApiConfig]);

  // Configure Monaco loader
  useEffect(() => {
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
      }
    });
  }, []);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
    setIsLoading(false);

    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: true },
      suggest: {
        snippetsPreventQuickSuggestions: false,
        showIcons: true,
        showWords: true,
        showFunctions: true,
        showVariables: true,
        showClasses: true,
        showKeywords: true
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      wordBasedSuggestions: true,
      tabCompletion: 'on'
    });

    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      onCursorPositionChange?.({
        line: e.position.lineNumber - 1, // Convert to 0-based
        column: e.position.column - 1
      });
    });

    // Set up selection tracking
    editor.onDidChangeCursorSelection((e) => {
      onSelectionChange?.({
        startLine: e.selection.startLineNumber - 1,
        startColumn: e.selection.startColumn - 1,
        endLine: e.selection.endLineNumber - 1,
        endColumn: e.selection.endColumn - 1,
        selectedText: editor.getModel().getValueInRange(e.selection)
      });
    });

    // Set up content change tracking for AST analysis
    editor.onDidChangeModelContent(() => {
      // Debounce AST analysis
      if (astAnalysisRef.current) {
        clearTimeout(astAnalysisRef.current);
      }
      astAnalysisRef.current = setTimeout(() => {
        analyzeCode(editor.getValue());
      }, 1000);
    });

    // Initial AST analysis
    if (value) {
      analyzeCode(value);
    }
  }, [value, onCursorPositionChange, onSelectionChange]);

  // Analyze code using AST service
  const analyzeCode = useCallback(async (code) => {
    if (!code.trim()) return;

    try {
      const response = await fetch('/api/ai-context/analyze-ast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
        },
        body: JSON.stringify({
          sourceCode: code,
          filePath: fileName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAstData(data.data);
          updateIntelliSense(data.data);
        }
      }
    } catch (error) {
      console.error('AST analysis failed:', error);
    }
  }, [fileName]);

  // Update IntelliSense with AST data
  const updateIntelliSense = useCallback((astData) => {
    if (!monacoInstance || !editorInstance) return;

    // Dispose existing provider
    if (completionProvider) {
      completionProvider.dispose();
    }

    // Create custom completion provider
    const provider = monacoInstance.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        // Get completions from backend
        try {
          const response = await fetch('/api/ai-context/code-completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
            },
            body: JSON.stringify({
              sourceCode: model.getValue(),
              filePath: fileName,
              position: {
                line: position.lineNumber - 1,
                column: position.column - 1
              },
              context: {
                astData: astData,
                textUntilPosition
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return {
                suggestions: data.data.completions.map(completion => ({
                  label: completion.label,
                  kind: getCompletionKind(completion.kind),
                  detail: completion.detail,
                  documentation: completion.documentation,
                  insertText: completion.insertText || completion.label,
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column
                  }
                }))
              };
            }
          }
        } catch (error) {
          console.error('Completion request failed:', error);
        }

        // Fallback to local AST-based completions
        return {
          suggestions: generateLocalCompletions(astData, textUntilPosition, position)
        };
      }
    });

    setCompletionProvider(provider);
  }, [monacoInstance, editorInstance, completionProvider, language, fileName]);

  // Get Monaco completion kind from string
  const getCompletionKind = useCallback((kindString) => {
    if (!monacoInstance) return 0;
    
    const kinds = {
      'function': monacoInstance.languages.CompletionItemKind.Function,
      'method': monacoInstance.languages.CompletionItemKind.Method,
      'variable': monacoInstance.languages.CompletionItemKind.Variable,
      'field': monacoInstance.languages.CompletionItemKind.Field,
      'class': monacoInstance.languages.CompletionItemKind.Class,
      'interface': monacoInstance.languages.CompletionItemKind.Interface,
      'keyword': monacoInstance.languages.CompletionItemKind.Keyword,
      'snippet': monacoInstance.languages.CompletionItemKind.Snippet,
      'text': monacoInstance.languages.CompletionItemKind.Text
    };

    return kinds[kindString] || monacoInstance.languages.CompletionItemKind.Text;
  }, [monacoInstance]);

  // Generate local completions from AST data
  const generateLocalCompletions = useCallback((astData, textUntilPosition, position) => {
    if (!astData || !monacoInstance) return [];

    const suggestions = [];

    // Add symbols from AST
    if (astData.symbols) {
      astData.symbols.forEach(symbol => {
        suggestions.push({
          label: symbol.name,
          kind: getCompletionKind(symbol.type),
          detail: `${symbol.type} (line ${symbol.line})`,
          insertText: symbol.name,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        });
      });
    }

    // Add functions
    if (astData.functions) {
      astData.functions.forEach(func => {
        const params = func.parameters.join(', ');
        suggestions.push({
          label: func.name,
          kind: monacoInstance.languages.CompletionItemKind.Function,
          detail: `function ${func.name}(${params})`,
          insertText: `${func.name}(${func.parameters.map((_, i) => `\${${i + 1}:${func.parameters[i]}}`).join(', ')})`,
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        });
      });
    }

    // Add variables
    if (astData.variables) {
      astData.variables.forEach(variable => {
        suggestions.push({
          label: variable.name,
          kind: monacoInstance.languages.CompletionItemKind.Variable,
          detail: `${variable.type} ${variable.name}`,
          insertText: variable.name,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        });
      });
    }

    // Add imports
    if (astData.imports) {
      astData.imports.forEach(imp => {
        if (imp.defaultImport) {
          suggestions.push({
            label: imp.defaultImport,
            kind: monacoInstance.languages.CompletionItemKind.Module,
            detail: `import from ${imp.modulePath}`,
            insertText: imp.defaultImport,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          });
        }
      });
    }

    return suggestions;
  }, [monacoInstance, getCompletionKind]);

  // Setup syntax highlighting and language features
  useEffect(() => {
    if (!monacoInstance) return;

    // Register additional languages if needed
    const supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx', 'json', 'css', 'html'];
    
    // Configure TypeScript/JavaScript language features
    if (language === 'typescript' || language === 'javascript') {
      monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monacoInstance.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monacoInstance.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: language === 'tsx' ? monacoInstance.languages.typescript.JsxEmit.React : undefined,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types']
      });

      // Add React types if it's a React file
      if (language === 'jsx' || language === 'tsx' || fileName.includes('.jsx') || fileName.includes('.tsx')) {
        const reactTypes = `
          declare module 'react' {
            export interface ComponentProps<T> {
              children?: React.ReactNode;
            }
            export const useState: <T>(initial: T) => [T, (value: T) => void];
            export const useEffect: (effect: () => void, deps?: any[]) => void;
            export const useCallback: <T extends Function>(callback: T, deps: any[]) => T;
            export const useMemo: <T>(factory: () => T, deps: any[]) => T;
          }
        `;
        
        monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
          reactTypes,
          'react.d.ts'
        );
      }
    }
  }, [monacoInstance, language, fileName]);

  // Handle value changes
  const handleChange = useCallback((value) => {
    onChange?.(value);
    
    // Trigger manual edit detection if enabled
    if (enableDiffDetection && diffDetectorRef.current) {
      diffDetectorRef.current(value);
    }
    
    // Notify about code changes for preview updates
    onCodeChange?.(value, fileName);
  }, [onChange, enableDiffDetection, onCodeChange, fileName]);

  // Get file language from extension
  const getLanguageFromFileName = useCallback((fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'xml': 'xml',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };
    return languageMap[ext] || 'plaintext';
  }, []);

  // Update language when filename changes
  const effectiveLanguage = fileName ? getLanguageFromFileName(fileName) : language;

  return (
    <div className={cn("h-full w-full relative", className)}>
      {/* Editor Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-gray-400">Loading editor...</div>
        </div>
      )}

      {/* Diff Mode Controls */}
      {enableDiffDetection && diffResult && diffResult.hasChanges && (
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2">
          <button
            onClick={() => setIsDiffMode(!isDiffMode)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isDiffMode 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={isDiffMode ? 'Hide diff indicators' : 'Show diff indicators'}
          >
            {isDiffMode ? 'Hide Diff' : 'Show Diff'}
          </button>
          
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {diffResult.changeCount} change{diffResult.changeCount !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-1 text-xs">
            {diffResult.summary?.stats?.additions > 0 && (
              <span className="text-green-600 dark:text-green-400">+{diffResult.summary.stats.additions}</span>
            )}
            {diffResult.summary?.stats?.deletions > 0 && (
              <span className="text-red-600 dark:text-red-400">-{diffResult.summary.stats.deletions}</span>
            )}
          </div>
        </div>
      )}

      {/* Saved Patches Panel */}
      {enableDiffDetection && savedPatches.length > 0 && (
        <div className="absolute top-2 left-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3 max-w-sm">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Previous Patches ({savedPatches.length})
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {savedPatches.slice(0, 5).map((patch) => (
              <div key={patch.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {patch.changeSummary || 'Manual edit'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {patch.createdAt ? 
                      (() => {
                        const date = new Date(patch.createdAt);
                        return isNaN(date.getTime()) ? 'Recent' : date.toLocaleTimeString();
                      })() 
                      : 'Recent'
                    } • {patch.status}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {patch.status === 'pending' && (
                    <button
                      onClick={() => applyPatch(patch.id)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      title="Apply patch"
                    >
                      Apply
                    </button>
                  )}
                  {patch.status === 'applied' && (
                    <button
                      onClick={() => revertPatch(patch.id)}
                      className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                      title="Revert patch"
                    >
                      Revert
                    </button>
                  )}
                  <button
                    onClick={() => deletePatch(patch.id)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete patch"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {savedPatches.length > 5 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{savedPatches.length - 5} more patches
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height="100%"
        language={effectiveLanguage}
        theme={theme}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: {
            enabled: true
          },
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always'
        }}
      />

      {/* Status Indicators */}
      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
        {/* Patch Save Status */}
        {patchSaveStatus && (
          <div className={`text-white text-xs px-2 py-1 rounded ${
            patchSaveStatus.status === 'success' ? 'bg-green-500' :
            patchSaveStatus.status === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}>
            {patchSaveStatus.status === 'saving' && (
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
            )}
            {patchSaveStatus.message}
          </div>
        )}
        
        {/* Manual Edit Indicator */}
        {enableDiffDetection && diffResult && diffResult.hasChanges && (
          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-90 animate-pulse">
            Manual Edit Detected
          </div>
        )}
        
        {/* Back to Original Indicator */}
        {enableDiffDetection && showRevertedIndicator && (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded opacity-75 animate-pulse">
            Back to Original
          </div>
        )}
        
        {/* Saved Patches Count */}
        {enableDiffDetection && savedPatches.length > 0 && (
          <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded opacity-75">
            {savedPatches.length} Patch{savedPatches.length !== 1 ? 'es' : ''}
          </div>
        )}
        
        {/* AST Data Indicator */}
        {astData && (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded opacity-75">
            AST Active
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;