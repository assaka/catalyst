import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * TranslationFields Component
 *
 * A reusable component for managing multilingual content in admin forms.
 * Displays tabs for each active language and allows editing translations.
 *
 * @param {Object} translations - Current translations object { en: {...}, es: {...} }
 * @param {Function} onChange - Callback when translations change
 * @param {Array} fields - Field definitions [{ name: 'name', label: 'Name', type: 'text', required: true }]
 * @param {String} defaultLanguage - Default language to show (default: 'en')
 *
 * @example
 * <TranslationFields
 *   translations={formData.translations}
 *   onChange={(newTranslations) => setFormData({ ...formData, translations: newTranslations })}
 *   fields={[
 *     { name: 'name', label: 'Product Name', type: 'text', required: true },
 *     { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
 *     { name: 'short_description', label: 'Short Description', type: 'textarea', rows: 2 }
 *   ]}
 * />
 */
export default function TranslationFields({
  translations = {},
  onChange,
  fields = [],
  defaultLanguage = 'en',
  className = ''
}) {
  const { availableLanguages } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);
  const [localTranslations, setLocalTranslations] = useState(translations);

  // Update local state when translations prop changes
  useEffect(() => {
    setLocalTranslations(translations);
  }, [translations]);

  // Ensure all active languages have an entry
  useEffect(() => {
    const updated = { ...localTranslations };
    let hasChanges = false;

    availableLanguages.forEach(lang => {
      if (!updated[lang.code]) {
        updated[lang.code] = {};
        fields.forEach(field => {
          updated[lang.code][field.name] = '';
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setLocalTranslations(updated);
    }
  }, [availableLanguages, fields]);

  const handleFieldChange = (languageCode, fieldName, value) => {
    const updated = {
      ...localTranslations,
      [languageCode]: {
        ...(localTranslations[languageCode] || {}),
        [fieldName]: value
      }
    };
    setLocalTranslations(updated);
    onChange(updated);
  };

  const getFieldValue = (languageCode, fieldName) => {
    return localTranslations[languageCode]?.[fieldName] || '';
  };

  const isLanguageComplete = (languageCode) => {
    const langData = localTranslations[languageCode];
    if (!langData) return false;

    const requiredFields = fields.filter(f => f.required);
    return requiredFields.every(field => {
      const value = langData[field.name];
      return value && value.trim() !== '';
    });
  };

  const getLanguageName = (code) => {
    const lang = availableLanguages.find(l => l.code === code);
    return lang ? lang.native_name || lang.name : code.toUpperCase();
  };

  if (availableLanguages.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          No languages configured. Please add languages in the Languages settings.
        </p>
      </div>
    );
  }

  return (
    <div className={`translation-fields ${className}`}>
      {/* Language Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex flex-wrap gap-2">
          {availableLanguages.map(lang => {
            const isComplete = isLanguageComplete(lang.code);
            const isActive = activeLanguage === lang.code;
            const isDefault = lang.code === defaultLanguage;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLanguage(lang.code)}
                className={`
                  px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${isDefault ? 'font-bold' : ''}
                `}
              >
                <span className="flex items-center gap-2">
                  {lang.native_name || lang.name}
                  {isDefault && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {!isDefault && isComplete && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                  {!isDefault && !isComplete && (
                    <span className="text-amber-500 text-xs">⚠</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Translation Fields for Active Language */}
      <div className="translation-content space-y-4">
        {fields.map(field => {
          const value = getFieldValue(activeLanguage, field.name);
          const isRequired = field.required && activeLanguage === defaultLanguage;

          return (
            <div key={field.name} className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {field.hint && (
                  <span className="text-gray-500 text-xs ml-2">({field.hint})</span>
                )}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={value}
                  onChange={(e) => handleFieldChange(activeLanguage, field.name, e.target.value)}
                  rows={field.rows || 4}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} in ${getLanguageName(activeLanguage)}`}
                  required={isRequired}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : field.type === 'richtext' ? (
                <div className="relative">
                  <textarea
                    value={value}
                    onChange={(e) => handleFieldChange(activeLanguage, field.name, e.target.value)}
                    rows={field.rows || 6}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} in ${getLanguageName(activeLanguage)}`}
                    required={isRequired}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    HTML supported. Preview will be available in a future update.
                  </div>
                </div>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={value}
                  onChange={(e) => handleFieldChange(activeLanguage, field.name, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} in ${getLanguageName(activeLanguage)}`}
                  required={isRequired}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {field.helper && (
                <p className="mt-1 text-xs text-gray-500">{field.helper}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Translation Status Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Translation Status:</strong>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableLanguages.map(lang => {
              const isComplete = isLanguageComplete(lang.code);
              return (
                <span
                  key={lang.code}
                  className={`px-2 py-1 rounded text-xs ${
                    isComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {lang.code.toUpperCase()}: {isComplete ? 'Complete' : 'Incomplete'}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TranslationIndicator Component
 *
 * Shows a badge indicating translation status in grid rows.
 *
 * @param {Object} translations - Translations object
 * @param {Array} requiredLanguages - Languages that must have translations
 *
 * @example
 * <TranslationIndicator
 *   translations={product.translations}
 *   requiredLanguages={['en', 'es', 'fr']}
 * />
 */
export function TranslationIndicator({ translations = {}, requiredLanguages = ['en'] }) {
  const translatedCount = Object.keys(translations).filter(
    code => requiredLanguages.includes(code) && translations[code] && Object.keys(translations[code]).length > 0
  ).length;

  const totalRequired = requiredLanguages.length;
  const isComplete = translatedCount === totalRequired;

  if (translatedCount === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
        <span className="mr-1">⚠</span> No translations
      </span>
    );
  }

  if (isComplete) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
        <span className="mr-1">✓</span> {translatedCount}/{totalRequired}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
      <span className="mr-1">◐</span> {translatedCount}/{totalRequired}
    </span>
  );
}

/**
 * TranslationHelper Component
 *
 * Shows helper text and tips for managing translations.
 */
export function TranslationHelper() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      <h4 className="font-semibold mb-2">Translation Tips:</h4>
      <ul className="list-disc list-inside space-y-1">
        <li>Fill in the <strong>Default language (EN)</strong> first - it's required</li>
        <li>Other languages are optional but recommended for multilingual stores</li>
        <li>Use the <strong>✓</strong> indicator to see which languages are complete</li>
        <li>You can use the AI Translation feature to auto-translate after saving</li>
      </ul>
    </div>
  );
}
