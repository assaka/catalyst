import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, Wand2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Inline collapsible translation editor for attribute values
 * Similar to EntityTranslationTabs but inline/collapsible
 */
export default function AttributeValueTranslations({
  attributeValue,
  onTranslationChange,
  onAiTranslate
}) {
  const { availableLanguages } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');

  const translations = attributeValue.translations || {};
  const code = attributeValue.code;

  // Get translation completeness
  const getTranslationStatus = () => {
    const translatedCount = availableLanguages.filter(lang => {
      if (lang.code === 'en') return true; // English always counts
      const translation = translations[lang.code];
      return translation && translation.label && translation.label.trim().length > 0;
    }).length;

    return {
      count: translatedCount,
      total: availableLanguages.length,
      isComplete: translatedCount === availableLanguages.length,
      isPartial: translatedCount > 1 && translatedCount < availableLanguages.length
    };
  };

  const status = getTranslationStatus();
  const activeLang = availableLanguages.find(l => l.code === activeLanguage) || availableLanguages[0];
  const isRTL = activeLang?.is_rtl || false;

  // Get label for a specific language
  const getLabel = (langCode) => {
    if (langCode === 'en') {
      return translations.en?.label || attributeValue.label || '';
    }
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

  // AI translate current language
  const handleAiTranslate = async () => {
    if (activeLanguage === 'en') return;
    if (onAiTranslate) {
      await onAiTranslate(attributeValue.tempId || attributeValue.id, activeLanguage);
    }
  };

  // Status color
  const getStatusColor = () => {
    if (status.isComplete) return 'text-green-600';
    if (status.isPartial) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (status.isComplete) return '🟢';
    if (status.isPartial) return '🟡';
    return '🔴';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{getLabel('en') || code}</span>
              <span className="text-xs text-gray-500 font-mono">({code})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusIcon()} {status.count}/{status.total}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Language tabs */}
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {availableLanguages.map((lang) => {
                const isActive = lang.code === activeLanguage;
                const hasContent = getLabel(lang.code).trim().length > 0;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLanguage(lang.code)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                      transition-colors whitespace-nowrap
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : hasContent
                          ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-200 border-dashed'
                      }
                    `}
                  >
                    <span>{lang.native_name}</span>
                    {hasContent && lang.code !== 'en' && (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Translation content */}
          <div className="space-y-3">
            {/* English reference if not editing English */}
            {activeLanguage !== 'en' && getLabel('en') && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">English (reference):</div>
                <div className="text-sm text-gray-700 font-medium">
                  {getLabel('en')}
                </div>
              </div>
            )}

            {/* Translation input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  Label in {activeLang?.native_name}
                </Label>
                {activeLanguage !== 'en' && onAiTranslate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAiTranslate}
                    className="h-7 px-2 text-xs"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI Translate
                  </Button>
                )}
              </div>

              <Input
                type="text"
                value={getLabel(activeLanguage)}
                onChange={(e) => handleTranslationChange(activeLanguage, e.target.value)}
                disabled={activeLanguage === 'en'}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={`
                  ${isRTL ? 'text-right' : 'text-left'}
                  ${activeLanguage === 'en' ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
                placeholder={`Enter label in ${activeLang?.native_name}...`}
              />

              {activeLanguage === 'en' && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Edit the main label field above to change English content
                </p>
              )}

              {isRTL && activeLanguage !== 'en' && (
                <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Right-to-Left (RTL) language
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
