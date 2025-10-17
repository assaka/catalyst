import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Wand2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/TranslationContext';
import { toast } from 'sonner';
import api from '@/utils/api';

/**
 * Accordion row for managing custom option rule translations
 */
export default function CustomOptionTranslationRow({ rule, onUpdate, selectedLanguages }) {
  const { availableLanguages } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [translations, setTranslations] = useState(rule.translations || {});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState({});

  const filteredLanguages = availableLanguages.filter(lang => selectedLanguages?.includes(lang.code));

  // Get translation status
  const getTranslationStatus = () => {
    const translatedCount = filteredLanguages.filter(lang => {
      const translation = translations[lang.code];
      return translation && translation.display_label && translation.display_label.trim().length > 0;
    }).length;

    return {
      count: translatedCount,
      total: filteredLanguages.length,
      isComplete: translatedCount === filteredLanguages.length
    };
  };

  const status = getTranslationStatus();

  // Handle translation change
  const handleTranslationChange = (langCode, value) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] || {}),
        display_label: value
      }
    }));
  };

  // Save translations
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/custom-option-rules/${rule.id}`, {
        translations
      });
      toast.success('Custom option translations updated successfully');
      if (onUpdate) onUpdate(rule.id, translations);
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error('Failed to save translations');
    } finally {
      setSaving(false);
    }
  };

  // AI translate from one language to another
  const handleAITranslate = async (fromLang, toLang) => {
    const sourceText = translations[fromLang]?.display_label;
    if (!sourceText || !sourceText.trim()) {
      toast.error(`No ${fromLang.toUpperCase()} text found`);
      return;
    }

    const translatingKey = `display_label-${toLang}`;
    try {
      setTranslating(prev => ({ ...prev, [translatingKey]: true }));

      const response = await api.post('/translations/ai-translate', {
        text: sourceText,
        fromLang,
        toLang
      });

      if (response && response.success && response.data) {
        handleTranslationChange(toLang, response.data.translated);
        toast.success(`Display label translated to ${toLang.toUpperCase()}`);
      }
    } catch (error) {
      console.error('AI translate error:', error);
      toast.error(`Failed to translate display label`);
    } finally {
      setTranslating(prev => ({ ...prev, [translatingKey]: false }));
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Collapsed Header */}
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {translations.en?.display_label || rule.display_label || rule.name || 'Unnamed Rule'}
            </p>
            <p className="text-xs text-gray-500">
              {rule.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className={`flex items-center gap-1 text-xs font-medium ${
            status.isComplete ? 'text-green-600' : 'text-gray-500'
          }`}>
            {status.isComplete && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            {status.count}/{status.total}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="bg-white">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">Display Label</p>
            </div>
            <div className="p-4 space-y-3">
              {filteredLanguages.map((lang) => {
                const isRTL = lang.is_rtl || false;
                const value = translations[lang.code]?.display_label || '';
                const translatingKey = `display_label-${lang.code}`;

                return (
                  <div
                    key={lang.code}
                    className="flex items-center gap-3"
                  >
                    <label className="text-sm font-medium text-gray-700 w-12 flex-shrink-0">
                      {lang.code === 'en' ? 'En' : lang.code === 'nl' ? 'NL' : lang.code.toUpperCase()}
                    </label>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleTranslationChange(lang.code, e.target.value)}
                        dir={isRTL ? 'rtl' : 'ltr'}
                        className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                        placeholder={`${lang.native_name} display label`}
                      />
                    </div>
                    {lang.code !== 'en' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAITranslate('en', lang.code)}
                        disabled={translating[translatingKey] || !translations.en?.display_label}
                        className="flex-shrink-0"
                      >
                        <Wand2 className={`w-4 h-4 ${translating[translatingKey] ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="px-4 py-3 bg-gray-50 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Translations
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
