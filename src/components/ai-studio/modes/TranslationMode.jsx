import React, { useState } from 'react';
import { Languages, Send, Loader2, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiService from '@/utils/aiService';

/**
 * TranslationMode - AI-powered bulk translation
 */
const TranslationMode = ({ context }) => {
  const [content, setContent] = useState('');
  const [targetLanguages, setTargetLanguages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [error, setError] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const availableLanguages = [
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ];

  const toggleLanguage = (code) => {
    setTargetLanguages(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (!content.trim() || targetLanguages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setTranslations(null);

    try {
      const result = await aiService.translateContent(content, targetLanguages);
      setTranslations(result.translations);
      setCreditsUsed(result.creditsDeducted);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to translate content');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bulk Translation
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Translate content across multiple languages using AI
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!translations ? (
          // Input Form
          <div className="p-4 space-y-4">
            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content to translate
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the text you want to translate..."
                className={cn(
                  "w-full p-3 text-sm border rounded-md resize-none",
                  "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                  "placeholder-gray-400 dark:placeholder-gray-500"
                )}
                rows={6}
                disabled={isProcessing}
              />
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Languages ({targetLanguages.length} selected)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={cn(
                      "flex items-center gap-2 p-2 border rounded-lg transition-colors text-left",
                      targetLanguages.includes(lang.code)
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {targetLanguages.includes(lang.code) && (
                      <Check className="w-4 h-4 text-green-600 ml-auto" />
                    )}
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

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={!content.trim() || targetLanguages.length === 0 || isProcessing}
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
                  Translate to {targetLanguages.length} Language{targetLanguages.length !== 1 ? 's' : ''} (20 credits)
                </>
              )}
            </button>
          </div>
        ) : (
          // Show Translations
          <div className="p-4 space-y-4">
            {/* Original Content */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Original (English)
                </span>
                <button
                  onClick={() => copyToClipboard(content)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                {content}
              </p>
            </div>

            {/* Translated Content */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Translations:
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {translations}
              </p>
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                setTranslations(null);
                setContent('');
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
          <span>AI-powered translations</span>
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
