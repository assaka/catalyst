import React, { useState } from 'react';
import { Languages, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * TranslationMode - AI-powered entity translation
 * Handles: Products, Categories, CMS Pages, CMS Blocks, Attributes, etc.
 * Natural language: "translate all products to French and German"
 */
const TranslationMode = ({ context }) => {
  const { getSelectedStoreId } = useStoreSelection();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const entityTypes = [
    { id: 'products', label: 'Products', icon: '📦', example: 'Translate all products to French' },
    { id: 'categories', label: 'Categories', icon: '📂', example: 'Translate categories to German and Spanish' },
    { id: 'cms_pages', label: 'CMS Pages', icon: '📄', example: 'Translate all CMS pages to Dutch' },
    { id: 'cms_blocks', label: 'CMS Blocks', icon: '🧱', example: 'Translate CMS blocks to Italian' },
    { id: 'attributes', label: 'Attributes', icon: '🏷️', example: 'Translate product attributes to French' },
    { id: 'product_tabs', label: 'Product Tabs', icon: '📑', example: 'Translate product tabs to German' }
  ];

  const examplePrompts = [
    'Translate all products to French, German, and Spanish',
    'Translate categories to Dutch and Italian',
    'Translate all CMS content to French',
    'Create blog article about winter sale and translate to all active languages',
    'Translate product attributes to German'
  ];

  const handleTranslate = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Call AI to parse the prompt and execute translations
      const response = await apiClient.post('/ai/translate-entities', {
        prompt: prompt.trim(),
        storeId: getSelectedStoreId()
      });

      if (response.success) {
        setResult(response.data);
        setCreditsUsed(response.creditsDeducted);
      } else {
        setError(response.message || 'Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to translate entities');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Entity Translation
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Translate products, categories, CMS content, and more using natural language
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!result ? (
          // Input Form
          <div className="p-4 space-y-4">
            {/* Entity Type Guide */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What can you translate?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {entityTypes.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-lg">{entity.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {entity.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Natural Language Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What do you want to translate?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Translate all products to French, German, and Spanish..."
                className={cn(
                  "w-full p-3 text-sm border rounded-md resize-none",
                  "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                  "placeholder-gray-400 dark:placeholder-gray-500"
                )}
                rows={4}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                AI will understand your request and translate the appropriate entities
              </p>
            </div>

            {/* Example Prompts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Example prompts
              </label>
              <div className="space-y-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded border",
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
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={!prompt.trim() || isProcessing}
              className={cn(
                "w-full py-3 px-4 rounded-md font-medium",
                "bg-green-600 hover:bg-green-700",
                "text-white",
                "disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
                "transition-colors"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Translate (20 credits)
                </>
              )}
            </button>
          </div>
        ) : (
          // Show Translation Results
          <div className="p-4 space-y-4">
            {/* Success Summary */}
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    Translation Complete
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {result.summary || 'Entities translated successfully'}
                  </p>
                </div>
              </div>
            </div>

            {/* Translation Details */}
            {result.details && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Translation Details:
                </h3>
                <div className="space-y-2">
                  {result.details.map((detail, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {detail.entityType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {detail.count} items
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Translated to: {detail.languages.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={() => {
                setResult(null);
                setPrompt('');
                setError(null);
                setCreditsUsed(null);
              }}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Translate More Content
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>AI understands which entities to translate</span>
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

export default TranslationMode;
