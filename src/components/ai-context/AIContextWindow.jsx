import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, RefreshCw, AlertCircle, CheckCircle, Code, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AI Context Window Component
 * Natural language to RFC 6902 JSON Patch converter
 * Integrates with AST analysis for safe code modifications
 */
const AIContextWindow = ({ 
  sourceCode = '', 
  filePath = '',
  onPatchGenerated,
  onPreviewGenerated,
  className 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  // Generate patch from natural language
  const generatePatch = useCallback(async () => {
    if (!prompt.trim() || !sourceCode.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-context/nl-to-patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          sourceCode,
          filePath,
          context: {
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setLastResult(data.data);
        setSuggestions(data.data.suggestions || []);
        onPatchGenerated?.(data.data.patch);
        
        // Generate preview
        if (data.data.preview) {
          onPreviewGenerated?.(data.data.preview);
        }
      } else {
        setError(data.message || 'Failed to generate patch');
      }
    } catch (error) {
      setError(`Request failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [prompt, sourceCode, filePath, onPatchGenerated, onPreviewGenerated]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generatePatch();
    }
  }, [generatePatch]);

  // Clear current state
  const clearState = useCallback(() => {
    setLastResult(null);
    setError(null);
    setSuggestions([]);
    setPrompt('');
  }, []);

  // Apply suggestion to prompt
  const applySuggestion = useCallback((suggestion) => {
    setPrompt(suggestion);
  }, []);

  // Common prompt templates
  const promptTemplates = [
    "Add a new function called {name} that {description}",
    "Remove the {element} named {name}",
    "Change the variable {oldName} to {newName}",
    "Move the {element} to {location}",
    "Add error handling to the {function} function",
    "Refactor this code to use async/await",
    "Add TypeScript types to this function",
    "Extract this logic into a separate function",
    "Add JSDoc comments to all functions",
    "Convert this class component to hooks"
  ];

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-gray-900 border-l", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          AI Context Window
        </h3>
        <button
          onClick={clearState}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Clear"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Prompt Input Area */}
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Describe your changes in natural language:
          </label>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., Add a new async function called fetchUserData that takes a userId parameter and returns user information..."
              className={cn(
                "w-full p-2 text-sm border rounded-md resize-none",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={1}
              disabled={isProcessing}
            />
            
            <button
              onClick={generatePatch}
              disabled={!prompt.trim() || !sourceCode.trim() || isProcessing}
              className={cn(
                "absolute right-2 bottom-2 p-1.5 rounded-md",
                "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300",
                "text-white disabled:text-gray-500",
                "transition-colors duration-150"
              )}
              title="Generate patch (Ctrl+Enter)"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Press Ctrl+Enter to generate patch
          </div>
        </div>

        {/* Prompt Templates */}
        <div className="p-3 border-b">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Templates:
          </label>
          <div className="flex flex-wrap gap-1">
            {promptTemplates.slice(0, 5).map((template, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(template)}
                className={cn(
                  "px-2 py-1 text-xs rounded border",
                  "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
                  "text-gray-700 dark:text-gray-300 transition-colors"
                )}
                disabled={isProcessing}
              >
                {template.split(' ').slice(0, 4).join(' ')}...
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-auto">
          {/* Error Display */}
          {error && (
            <div className="p-3 m-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Success Result */}
          {lastResult && (
            <div className="p-3 space-y-3">
              {/* Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Patch Generated Successfully
                  </span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">
                  Confidence: {Math.round((lastResult.confidence || 0.8) * 100)}%
                  {lastResult.patch && (
                    <span className="ml-2">
                      • {lastResult.patch.length} operation{lastResult.patch.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Patch Operations */}
              {lastResult.patch && lastResult.patch.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                  <div className="flex items-center mb-2">
                    <Code className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      RFC 6902 Patch Operations
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lastResult.patch.map((operation, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2"
                      >
                        <div className="font-mono text-xs">
                          <span className="text-blue-600 dark:text-blue-400">{operation.op}</span>
                          <span className="text-gray-500 mx-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{operation.path}</span>
                        </div>
                        {operation.value && (
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 p-1 rounded">
                            {typeof operation.value === 'string' 
                              ? operation.value.length > 50 
                                ? operation.value.substring(0, 50) + '...'
                                : operation.value
                              : JSON.stringify(operation.value)
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {lastResult.conflicts && lastResult.conflicts.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Potential Conflicts Detected
                    </span>
                  </div>
                  <div className="space-y-1">
                    {lastResult.conflicts.map((conflict, index) => (
                      <div key={index} className="text-xs text-yellow-600 dark:text-yellow-500">
                        • {conflict.message || conflict}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-t">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Suggestions
                </span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                  >
                    {suggestion.message || suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!lastResult && !error && !isProcessing && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Describe the changes you want to make</p>
                <p className="text-xs mt-1">I'll generate RFC 6902 JSON patches for safe code modification</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Powered by AST analysis and AI-driven code understanding
        </div>
      </div>
    </div>
  );
};

export default AIContextWindow;