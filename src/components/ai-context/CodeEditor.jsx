import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { detectManualEdit, createDebouncedDiffDetector } from '@/services/diff-detector';

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
  const astAnalysisRef = useRef(null);
  const diffDetectorRef = useRef(null);
  const originalCodeRef = useRef(originalCode);

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
      }, 500, originalCode);
      
      console.log('🔍 Diff detection enabled for file:', fileName, 'with baseline length:', originalCode.length);
    }
    
    return () => {
      // Cleanup on unmount
      if (diffDetectorRef.current) {
        diffDetectorRef.current = null;
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
  }, [onChange, enableDiffDetection]);

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
      {enableDiffDetection && diffResult && (
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
        {/* Manual Edit Indicator */}
        {enableDiffDetection && diffResult && (
          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-90 animate-pulse">
            Manual Edit Detected
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