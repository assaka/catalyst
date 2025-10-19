import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { useTranslation } from '@/contexts/TranslationContext';
import { toast } from 'sonner';
import api from '@/utils/api';

/**
 * Accordion row for managing stock label translations
 */
export default function StockLabelTranslationRow({ storeId, stockSettings, onUpdate, selectedLanguages }) {
  const { availableLanguages } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [translations, setTranslations] = useState(stockSettings?.translations || {});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [translating, setTranslating] = useState({});

  const filteredLanguages = availableLanguages.filter(lang => selectedLanguages?.includes(lang.code));

  // Stock label fields to translate
  const labelFields = [
    { key: 'in_stock_label', label: 'In Stock Label', placeholder: 'In Stock' },
    { key: 'out_of_stock_label', label: 'Out of Stock Label', placeholder: 'Out of Stock' },
    { key: 'low_stock_label', label: 'Low Stock Label', placeholder: 'Low stock, {just {quantity} left}' }
  ];

  // Get translation status
  const getTranslationStatus = () => {
    const translatedCount = filteredLanguages.filter(lang => {
      const translation = translations[lang.code];
      if (!translation) return false;

      // Check if all required fields have translations
      return labelFields.every(field => {
        const value = translation[field.key];
        return value && value.trim().length > 0;
      });
    }).length;

    return {
      count: translatedCount,
      total: filteredLanguages.length,
      isComplete: translatedCount === filteredLanguages.length
    };
  };

  const status = getTranslationStatus();

  // Handle translation change
  const handleTranslationChange = (langCode, field, value) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] || {}),
        [field]: value
      }
    }));
  };

  // Save translations
  const handleSave = async () => {
    if (!storeId) {
      toast.error('No store selected');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);

      // Update store settings with new stock label translations
      // The backend merges settings, so we only send the stock_settings part we want to update
      await api.put(`/stores/${storeId}`, {
        settings: {
          stock_settings: {
            ...stockSettings,
            translations
          }
        }
      });

      toast.success('Stock label translations updated successfully');
      if (onUpdate) onUpdate(translations);
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving stock label translations:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save translations');
      setSaving(false);
    }
  };

  // AI translate field from one language to another
  const handleAITranslate = async (field, fromLang, toLang) => {
    const sourceText = translations[fromLang]?.[field];
    if (!sourceText || !sourceText.trim()) {
      toast.error(`No ${fromLang.toUpperCase()} text found for ${field}`);
      return;
    }

    const translatingKey = `${field}-${toLang}`;
    try {
      setTranslating(prev => ({ ...prev, [translatingKey]: true }));

      const response = await api.post('/translations/ai-translate', {
        text: sourceText,
        fromLang,
        toLang
      });

      if (response && response.success && response.data) {
        handleTranslationChange(toLang, field, response.data.translated);
        toast.success(`${field} translated to ${toLang.toUpperCase()}`);
      }
    } catch (error) {
      console.error('AI translate error:', error);
      toast.error(`Failed to translate ${field}`);
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
              Stock Status Labels
            </p>
            <p className="text-xs text-gray-500">
              In Stock, Out of Stock, Low Stock
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
          {/* Help Text */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">{'{quantity}'}</code> placeholders in your labels.
              Example: <code className="bg-blue-100 px-1 rounded">"Only {'{quantity}'} left!"</code> → "Only 3 left!"
            </p>
          </div>

          {labelFields.map((field) => (
            <div key={field.key} className="border-b border-gray-200 last:border-b-0 bg-white">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{field.label}</p>
              </div>
              <div className="p-4 space-y-3">
                {filteredLanguages.map((lang) => {
                  const isRTL = lang.is_rtl || false;
                  const value = translations[lang.code]?.[field.key] || '';
                  const translatingKey = `${field.key}-${lang.code}`;

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
                          onChange={(e) => handleTranslationChange(lang.code, field.key, e.target.value)}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                          placeholder={field.placeholder}
                        />
                      </div>
                      {lang.code !== 'en' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAITranslate(field.key, 'en', lang.code)}
                          disabled={translating[translatingKey] || !translations.en?.[field.key]}
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
          ))}

          {/* Save Button */}
          <div className="px-4 py-3 bg-gray-50 flex justify-end">
            <SaveButton
              onClick={handleSave}
              loading={saving}
              success={saveSuccess}
              defaultText="Save Translations"
            />
          </div>
        </div>
      )}
    </div>
  );
}
