import React, { useState } from 'react';
import { Layout, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LayoutMode - AI-powered layout config generation
 * Generates and modifies *_config.js files
 */
const LayoutMode = ({ context }) => {
  const [selectedConfig, setSelectedConfig] = useState('homepage');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const configTypes = [
    { id: 'homepage', label: 'Homepage', file: 'homepage-config.js' },
    { id: 'product', label: 'Product Page', file: 'product-config.js' },
    { id: 'category', label: 'Category Page', file: 'category-config.js' },
    { id: 'cart', label: 'Cart Page', file: 'cart-config.js' },
    { id: 'checkout', label: 'Checkout Page', file: 'checkout-config.js' },
    { id: 'account', label: 'Account Page', file: 'account-config.js' },
    { id: 'header', label: 'Header', file: 'header-config.js' },
    { id: 'success', label: 'Success Page', file: 'success-config.js' }
  ];

  const examplePrompts = [
    'Add a hero section with video background',
    'Create a featured products carousel',
    'Add a newsletter signup with discount offer',
    'Insert customer testimonials section',
    'Add trust badges and security icons'
  ];

  const handleGenerate = async () => {
    setIsProcessing(true);
    // TODO: Implement layout generation API call
    console.log('Generating layout:', { selectedConfig, prompt });
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Layout className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Layout Generator
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate or modify page layouts using AI
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Config Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select page layout
            </label>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className={cn(
                "w-full p-2 border rounded-md",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              )}
            >
              {configTypes.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.label} ({config.file})
                </option>
              ))}
            </select>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe the changes or additions
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Add a hero section with video background and call-to-action button..."
              className={cn(
                "w-full p-3 text-sm border rounded-md resize-none",
                "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500"
              )}
              rows={6}
              disabled={isProcessing}
            />
          </div>

          {/* Example Prompts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick examples
            </label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full border",
                    "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
                    "border-gray-200 dark:border-gray-600",
                    "text-gray-700 dark:text-gray-300",
                    "transition-colors"
                  )}
                  disabled={isProcessing}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing}
            className={cn(
              "w-full py-3 px-4 rounded-md font-medium",
              "bg-purple-600 hover:bg-purple-700",
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
                Generate Layout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Generated layouts can be previewed in the visual editor before saving
        </p>
      </div>
    </div>
  );
};

export default LayoutMode;
