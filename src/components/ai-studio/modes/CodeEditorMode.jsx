import React, { useState } from 'react';
import { Code2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiService from '@/utils/aiService';

/**
 * CodeEditorMode - AI-powered code editing with RFC 6902 patches
 * Works with plugin code and other code stored in database
 * Generates safe modifications using AST analysis
 */
const CodeEditorMode = ({ context }) => {
  const [prompt, setPrompt] = useState('');
  const [sourceCode, setSourceCode] = useState(context?.sourceCode || '');
  const [filePath, setFilePath] = useState(context?.filePath || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPatch, setGeneratedPatch] = useState(null);
  const [error, setError] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const promptTemplates = [
    "Add a new function called {name} that {description}",
    "Remove the {element} named {name}",
    "Change the variable {oldName} to {newName}",
    "Add error handling to the {function} function",
    "Refactor this code to use async/await",
    "Add TypeScript types to this function",
    "Extract this logic into a separate function",
    "Add JSDoc comments to all functions"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || !sourceCode.trim()) return;

    setIsProcessing(true);
    setError(null);
    setGeneratedPatch(null);

    try {
      const result = await aiService.generateCodePatch(prompt, sourceCode, filePath || 'untitled.js');
      setGeneratedPatch(result.patch);
      setCreditsUsed(result.creditsDeducted);
    } catch (err) {
      console.error('Code patch generation error:', err);
      setError(err.message || 'Failed to generate code patch');
    } finally {
      setIsProcessing(false);
    }
  };

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
          Describe code changes in natural language - AI generates RFC 6902 patches
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* File Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File Path (optional)
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g., src/components/MyComponent.jsx"
              className={cn(
                "w-full p-2 text-sm border rounded-md",
                "focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              disabled={isProcessing}
            />
          </div>

          {/* Source Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source Code
            </label>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="Paste your code here..."
              className={cn(
                "w-full p-3 text-xs font-mono border rounded-md resize-none",
                "focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={10}
              disabled={isProcessing}
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your changes
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a new async function called fetchUserData that takes a userId parameter..."
              className={cn(
                "w-full p-3 text-sm border rounded-md resize-none",
                "focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={4}
              disabled={isProcessing}
            />
          </div>

          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick templates
            </label>
            <div className="flex flex-wrap gap-2">
              {promptTemplates.slice(0, 4).map((template, index) => (
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

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !sourceCode.trim() || isProcessing}
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
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Patch...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Patch (25 credits)
              </>
            )}
          </button>

          {/* Generated Patch */}
          {generatedPatch && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  RFC 6902 JSON Patch
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedPatch)}
                  className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto max-h-64">
                <code>{generatedPatch}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>AST-based safe code modifications</span>
          {creditsUsed && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              -{creditsUsed} credits used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorMode;
