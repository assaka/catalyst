import React, { useState } from 'react';
import { Send, Package, Upload, Check, Code, Eye, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiService from '@/utils/aiService';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * PluginMode - AI-powered plugin generation
 * Unified workflow: Describe → Generate → Preview → Install
 */
const PluginMode = ({ context }) => {
  const { getSelectedStoreId } = useStoreSelection();
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('commerce');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPlugin, setGeneratedPlugin] = useState(null);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const categories = [
    { id: 'commerce', label: 'Commerce', icon: '🛒' },
    { id: 'marketing', label: 'Marketing', icon: '📢' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'integration', label: 'Integration', icon: '🔗' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setGeneratedPlugin(null);

    try {
      const result = await aiService.generatePlugin(prompt, {
        category,
        storeId: getSelectedStoreId()
      });

      setGeneratedPlugin(result.plugin);
      setCreditsUsed(result.creditsDeducted);
    } catch (err) {
      console.error('Plugin generation error:', err);
      setError(err.message || 'Failed to generate plugin');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstall = async () => {
    // TODO: Implement plugin installation API call
    console.log('Installing plugin:', generatedPlugin);
    alert('Plugin installation coming soon!');
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
          Describe what you want to build, AI will generate a complete plugin
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!generatedPlugin ? (
          // Input Form
          <div className="p-4 space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plugin Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 border rounded-lg transition-colors",
                      category === cat.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your plugin
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a customer wishlist plugin where users can save their favorite products and share lists with others..."
                className={cn(
                  "w-full p-3 text-sm border rounded-md resize-none",
                  "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                  "placeholder-gray-400 dark:placeholder-gray-500"
                )}
                rows={8}
                disabled={isProcessing}
              />
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
                "bg-blue-600 hover:bg-blue-700",
                "text-white",
                "disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
                "transition-colors"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Plugin...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Plugin (50 credits)
                </>
              )}
            </button>
          </div>
        ) : (
          // Preview Generated Plugin
          <div className="p-4 space-y-4">
            {/* Plugin Info */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {generatedPlugin.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {generatedPlugin.description}
                  </p>
                </div>
                <Badge variant="outline">{generatedPlugin.category}</Badge>
              </div>

              {/* Features */}
              {generatedPlugin.features && generatedPlugin.features.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features:
                  </p>
                  <div className="space-y-1">
                    {generatedPlugin.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {generatedPlugin.explanation && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {generatedPlugin.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Code View Toggle */}
            <div>
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showCode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {showCode ? 'Hide' : 'View'} Generated Code
              </button>

              {showCode && generatedPlugin.generatedFiles && (
                <div className="mt-3 space-y-3">
                  {generatedPlugin.generatedFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {file.name}
                        </span>
                      </div>
                      <pre className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                        <code>{file.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGeneratedPlugin(null);
                  setPrompt('');
                  setError(null);
                  setCreditsUsed(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Package className="w-4 h-4" />
                Install Plugin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Uses RAG for better plugin architecture</span>
          {creditsUsed && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              -{creditsUsed} credits used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginMode;
