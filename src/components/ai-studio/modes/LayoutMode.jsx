import React, { useState } from 'react';
import { Layout, Send, Loader2, Code, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiService from '@/utils/aiService';

/**
 * LayoutMode - AI-powered layout config generation
 * Generates and modifies *_config.js files
 */
const LayoutMode = ({ context }) => {
  const [selectedConfig, setSelectedConfig] = useState('homepage');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState(null);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const configTypes = [
    { id: 'homepage', label: 'Homepage', file: 'homepage-config.js', icon: '🏠' },
    { id: 'product', label: 'Product Page', file: 'product-config.js', icon: '📦' },
    { id: 'category', label: 'Category Page', file: 'category-config.js', icon: '📂' },
    { id: 'cart', label: 'Cart Page', file: 'cart-config.js', icon: '🛒' },
    { id: 'checkout', label: 'Checkout Page', file: 'checkout-config.js', icon: '💳' },
    { id: 'account', label: 'Account Page', file: 'account-config.js', icon: '👤' },
    { id: 'header', label: 'Header', file: 'header-config.js', icon: '🔝' },
    { id: 'success', label: 'Success Page', file: 'success-config.js', icon: '✅' }
  ];

  const examplePrompts = [
    'Add a hero section with video background',
    'Create a featured products carousel',
    'Add a newsletter signup with discount offer',
    'Insert customer testimonials section',
    'Add trust badges and security icons'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setGeneratedConfig(null);

    try {
      const result = await aiService.generateLayout(prompt, selectedConfig);
      setGeneratedConfig(result.config);
      setCreditsUsed(result.creditsDeducted);
    } catch (err) {
      console.error('Layout generation error:', err);
      setError(err.message || 'Failed to generate layout');
    } finally {
      setIsProcessing(false);
    }
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
      <div className="flex-1 overflow-auto">
        {!generatedConfig ? (
          // Input Form
          <div className="p-4 space-y-4">
            {/* Config Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select page layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {configTypes.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => setSelectedConfig(config.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 border rounded-lg transition-colors text-left",
                      selectedConfig === config.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{config.label}</p>
                      <p className="text-xs text-gray-500 truncate">{config.file}</p>
                    </div>
                  </button>
                ))}
              </div>
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

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Layout...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Layout (40 credits)
                </>
              )}
            </button>
          </div>
        ) : (
          // Show Generated Config
          <div className="p-4 space-y-4">
            {/* Config Info */}
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                Generated {configTypes.find(c => c.id === selectedConfig)?.label} Layout
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                File: {configTypes.find(c => c.id === selectedConfig)?.file}
              </p>
            </div>

            {/* Code View */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  Generated Configuration
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedConfig)}
                  className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto max-h-96">
                <code>{generatedConfig}</code>
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGeneratedConfig(null);
                  setPrompt('');
                  setError(null);
                  setCreditsUsed(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save to file
                  alert('Save to file coming soon!');
                }}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Save to File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Preview in visual editor after saving</span>
          {creditsUsed && (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              -{creditsUsed} credits used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayoutMode;
