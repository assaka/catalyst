import React, { useState } from 'react';
import { Code2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CodeEditorMode - AI-powered code editing with RFC 6902 patches
 * Will extract logic from AIContextWindow.jsx
 */
const CodeEditorMode = ({ context }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sourceCode = context?.sourceCode || '';
  const filePath = context?.filePath || '';

  const handleGenerate = async () => {
    setIsProcessing(true);
    // TODO: Extract and implement logic from AIContextWindow.jsx
    console.log('Generating patch:', prompt);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const promptTemplates = [
    "Add a new function called {name} that {description}",
    "Remove the {element} named {name}",
    "Change the variable {oldName} to {newName}",
    "Add error handling to the {function} function",
    "Refactor this code to use async/await"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Code Editor
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Describe code changes in natural language
        </p>
        {filePath && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
            {filePath}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your changes
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a new async function called fetchUserData that takes a userId parameter and returns user information..."
              className={cn(
                "w-full p-3 text-sm border rounded-md resize-none",
                "focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={6}
              disabled={isProcessing}
            />
          </div>

          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick templates
            </label>
            <div className="flex flex-wrap gap-2">
              {promptTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(template)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded border",
                    "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
                    "border-gray-200 dark:border-gray-600",
                    "text-gray-700 dark:text-gray-300",
                    "transition-colors"
                  )}
                  disabled={isProcessing}
                >
                  {template.split(' ').slice(0, 4).join(' ')}...
                </button>
              ))}
            </div>
          </div>

          {/* Source Code Preview (if available) */}
          {sourceCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current code
              </label>
              <div className={cn(
                "p-3 text-xs font-mono rounded-md border overflow-auto max-h-40",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-200 dark:border-gray-600",
                "text-gray-800 dark:text-gray-200"
              )}>
                <pre>{sourceCode.substring(0, 500)}{sourceCode.length > 500 ? '...' : ''}</pre>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing}
            className={cn(
              "w-full py-3 px-4 rounded-md font-medium",
              "bg-orange-600 hover:bg-orange-700",
              "text-white",
              "disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
              "transition-colors"
            )}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating Patch...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Patch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Generates RFC 6902 JSON Patches using AST analysis for safe code modifications
        </p>
      </div>
    </div>
  );
};

export default CodeEditorMode;
