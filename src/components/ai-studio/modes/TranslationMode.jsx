import React, { useState } from 'react';
import { Languages, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TranslationMode - AI-powered bulk translation
 */
const TranslationMode = ({ context }) => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguages, setTargetLanguages] = useState([]);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const entityTypes = [
    { id: 'products', label: 'Products', count: 0 },
    { id: 'categories', label: 'Categories', count: 0 },
    { id: 'cms_pages', label: 'CMS Pages', count: 0 },
    { id: 'cms_blocks', label: 'CMS Blocks', count: 0 }
  ];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'it', name: 'Italian' }
  ];

  const handleTranslate = async () => {
    setIsProcessing(true);
    // TODO: Implement translation API call
    console.log('Translating:', { sourceLanguage, targetLanguages, selectedEntities });
    setTimeout(() => setIsProcessing(false), 2000);
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
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {/* Entity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select content to translate
            </label>
            <div className="space-y-2">
              {entityTypes.map((entity) => (
                <label
                  key={entity.id}
                  className={cn(
                    "flex items-center p-3 border rounded-lg cursor-pointer",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    "border-gray-200 dark:border-gray-700"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedEntities.includes(entity.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntities([...selectedEntities, entity.id]);
                      } else {
                        setSelectedEntities(selectedEntities.filter(id => id !== entity.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {entity.label}
                  </span>
                  {entity.count > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                      {entity.count} items
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source Language
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className={cn(
                "w-full p-2 border rounded-md",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              )}
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Languages
            </label>
            <div className="space-y-2">
              {availableLanguages
                .filter(lang => lang.code !== sourceLanguage)
                .map((lang) => (
                  <label
                    key={lang.code}
                    className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={targetLanguages.includes(lang.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTargetLanguages([...targetLanguages, lang.code]);
                        } else {
                          setTargetLanguages(targetLanguages.filter(code => code !== lang.code));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {lang.name}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={selectedEntities.length === 0 || targetLanguages.length === 0 || isProcessing}
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
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Translating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Translate Content
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Translations will be reviewed before applying to your store
        </p>
      </div>
    </div>
  );
};

export default TranslationMode;
