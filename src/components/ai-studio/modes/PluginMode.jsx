import React, { useState } from 'react';
import { Send, Package, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PluginMode - AI-powered plugin generation and editing
 * Merges functionality from PluginAIAssistant.jsx
 */
const PluginMode = ({ context }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    setIsProcessing(true);
    // TODO: Implement plugin generation API call
    console.log('Generating plugin:', prompt);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Plugin Generator
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Describe your plugin or upload a screenshot to generate code
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your plugin
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a shipping rate calculator for FedEx that calculates rates based on weight and dimensions..."
              className={cn(
                "w-full p-3 text-sm border rounded-md resize-none",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={6}
              disabled={isProcessing}
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or upload a screenshot
            </label>
            <div className={cn(
              "border-2 border-dashed rounded-lg p-6",
              "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 dark:hover:border-blue-400",
              "transition-colors cursor-pointer",
              "text-center"
            )}>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing}
            className={cn(
              "w-full py-3 px-4 rounded-md font-medium",
              "bg-blue-600 hover:bg-blue-700",
              "text-white",
              "disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
              "transition-colors"
            )}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Plugin
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Generated plugins can be tested, edited, and published to the Plugins marketplace
        </p>
      </div>
    </div>
  );
};

export default PluginMode;
