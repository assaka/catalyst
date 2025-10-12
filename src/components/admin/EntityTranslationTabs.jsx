import React, { useState } from 'react';
import { Globe, Wand2, Save, X, Check, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useTranslation } from '../../contexts/TranslationContext';

/**
 * Entity Translation Tabs Component
 *
 * Provides multi-language translation interface for entities
 * (Products, Categories, CMS Pages, CMS Blocks)
 *
 * @param {string} entityType - Type of entity (product, category, cms_page, cms_block)
 * @param {string} entityId - ID of the entity
 * @param {object} entity - Entity data with translations
 * @param {function} onSave - Callback when translations are saved
 * @param {array} fields - Fields to translate (e.g., ['name', 'description'])
 */
export default function EntityTranslationTabs({
  entityType,
  entityId,
  entity,
  onSave,
  fields = ['name', 'description']
}) {
  const { availableLanguages } = useTranslation();

  const [activeLanguage, setActiveLanguage] = useState('en');
  const [translations, setTranslations] = useState(entity?.translations || {});
  const [saving, setSaving] = useState(false);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [message, setMessage] = useState(null);

  /**
   * Update translation value
   */
  const updateTranslation = (lang, field, value) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [field]: value
      }
    }));
  };

  /**
   * Save translations
   */
  const saveTranslations = async () => {
    try {
      setSaving(true);

      const response = await api.put(
        `/api/translations/entity/${entityType}/${entityId}`,
        {
          language_code: activeLanguage,
          translations: translations[activeLanguage] || {}
        }
      );

      if (response.data.success) {
        showMessage('Translations saved successfully', 'success');
        if (onSave) {
          onSave(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to save translations:', error);
      showMessage('Failed to save translations', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * AI translate all fields to active language
   */
  const aiTranslate = async () => {
    if (activeLanguage === 'en') {
      showMessage('AI translation is not needed for English', 'info');
      return;
    }

    try {
      setAiTranslating(true);

      const response = await api.post('/api/translations/ai-translate-entity', {
        entityType,
        entityId,
        fromLang: 'en',
        toLang: activeLanguage
      });

      if (response.data.success) {
        setTranslations(prev => ({
          ...prev,
          [activeLanguage]: response.data.data.translations[activeLanguage]
        }));
        showMessage(`AI translated to ${activeLanguage}`, 'success');
      }
    } catch (error) {
      console.error('AI translation failed:', error);
      showMessage('AI translation failed', 'error');
    } finally {
      setAiTranslating(false);
    }
  };

  /**
   * Check if language has translations
   */
  const hasTranslations = (lang) => {
    if (!translations[lang]) return false;

    return fields.some(field => {
      const value = translations[lang][field];
      return value && value.trim().length > 0;
    });
  };

  /**
   * Show message
   */
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const activeLang = availableLanguages.find(l => l.code === activeLanguage) || availableLanguages[0];
  const isRTL = activeLang?.is_rtl || false;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Message */}
      {message && (
        <div className={`
          p-4 flex items-center gap-3
          ${message.type === 'success' ? 'bg-green-50 text-green-800 border-b border-green-200' : ''}
          ${message.type === 'error' ? 'bg-red-50 text-red-800 border-b border-red-200' : ''}
          ${message.type === 'info' ? 'bg-blue-50 text-blue-800 border-b border-blue-200' : ''}
        `}>
          {message.type === 'success' && <Check className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:bg-white/50 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Language tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 p-4 overflow-x-auto">
          <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />

          {availableLanguages.map((lang) => {
            const isActive = lang.code === activeLanguage;
            const hasContent = hasTranslations(lang.code);

            return (
              <button
                key={lang.code}
                onClick={() => setActiveLanguage(lang.code)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors whitespace-nowrap
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : hasContent
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200 border-dashed'
                  }
                `}
              >
                <span>{lang.native_name}</span>
                {hasContent && lang.code !== 'en' && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activeLang?.native_name} Translation
            </h3>
            <p className="text-sm text-gray-600">
              {isRTL && (
                <span className="inline-flex items-center gap-1 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  Right-to-Left (RTL) language
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {activeLanguage !== 'en' && (
              <button
                onClick={aiTranslate}
                disabled={aiTranslating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Wand2 className="w-4 h-4" />
                {aiTranslating ? 'Translating...' : 'AI Translate'}
              </button>
            )}

            <button
              onClick={saveTranslations}
              disabled={saving || activeLanguage === 'en'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* English is read-only */}
        {activeLanguage === 'en' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            English is the default language. Edit the main form fields to change English content.
          </div>
        )}

        {/* Translation fields */}
        <div className="space-y-4">
          {fields.map((field) => {
            const value = activeLanguage === 'en'
              ? (entity[field] || '')
              : (translations[activeLanguage]?.[field] || '');

            const enValue = entity.translations?.en?.[field] || entity[field] || '';

            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field.replace('_', ' ')}
                </label>

                {/* Show English reference if not English */}
                {activeLanguage !== 'en' && enValue && (
                  <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">English (reference):</div>
                    <div className="text-sm text-gray-700">
                      {enValue}
                    </div>
                  </div>
                )}

                {field === 'description' || field === 'content' || field === 'short_description' ? (
                  <textarea
                    value={value}
                    onChange={(e) => updateTranslation(activeLanguage, field, e.target.value)}
                    disabled={activeLanguage === 'en'}
                    rows={6}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`
                      w-full px-4 py-3 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${isRTL ? 'text-right' : 'text-left'}
                    `}
                    placeholder={`Enter ${field} in ${activeLang?.native_name}...`}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateTranslation(activeLanguage, field, e.target.value)}
                    disabled={activeLanguage === 'en'}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`
                      w-full px-4 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${isRTL ? 'text-right' : 'text-left'}
                    `}
                    placeholder={`Enter ${field} in ${activeLang?.native_name}...`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Translation status */}
        {activeLanguage !== 'en' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Translation status:
              </span>
              <span className={hasTranslations(activeLanguage) ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {hasTranslations(activeLanguage) ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Translated
                  </span>
                ) : (
                  'Not translated'
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
