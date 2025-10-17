import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Compact inline collapsible translation editor for attribute values
 */
export default function AttributeValueTranslations({
  attributeValue,
  selectedLanguages,
  onTranslationChange,
  onDelete
}) {
  const { availableLanguages } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const translations = attributeValue.translations || {};
  const code = attributeValue.code;

  // Filter languages by selected languages
  const filteredLanguages = availableLanguages.filter(lang =>
    selectedLanguages?.includes(lang.code)
  );

  // Get translation completeness
  const getTranslationStatus = () => {
    const translatedCount = filteredLanguages.filter(lang => {
      const translation = translations[lang.code];
      return translation && translation.label && translation.label.trim().length > 0;
    }).length;

    return {
      count: translatedCount,
      total: filteredLanguages.length,
      isComplete: translatedCount === filteredLanguages.length
    };
  };

  const status = getTranslationStatus();

  // Get label for a specific language
  const getLabel = (langCode) => {
    return translations[langCode]?.label || '';
  };

  // Update translation
  const handleTranslationChange = (langCode, value) => {
    const updatedTranslations = {
      ...translations,
      [langCode]: {
        ...(translations[langCode] || {}),
        label: value
      }
    };
    onTranslationChange(attributeValue.tempId || attributeValue.id, updatedTranslations);
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      {/* Collapsed Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}

          <span className="text-sm text-gray-900">
            {getLabel('en') || code} <span className="text-gray-500">({code})</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className={`flex items-center gap-1 text-xs font-medium ${
            status.isComplete ? 'text-green-600' : 'text-gray-500'
          }`}>
            {status.isComplete && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            {status.count}/{status.total}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(attributeValue.tempId || attributeValue.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {filteredLanguages.map((lang) => {
            const isRTL = lang.is_rtl || false;
            const value = getLabel(lang.code);

            return (
              <div
                key={lang.code}
                className="flex items-center gap-3 px-3 py-2 border-b border-gray-200 last:border-b-0 bg-white"
              >
                <label className="text-sm font-medium text-gray-700 w-12 flex-shrink-0">
                  {lang.code === 'en' ? 'En' : lang.code === 'nl' ? 'NL' : lang.code.toUpperCase()}
                </label>
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => handleTranslationChange(lang.code, e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={`flex-1 h-8 text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={value || getLabel('en')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
