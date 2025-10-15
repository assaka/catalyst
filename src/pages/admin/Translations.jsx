import React, { useState, useEffect } from 'react';
import { Plus, Search, Globe, Edit2, Trash2, Save, X, Wand2, Check, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useTranslation } from '../../contexts/TranslationContext';

export default function Translations() {
  const { availableLanguages, currentLanguage, changeLanguage } = useTranslation();

  const [activeTab, setActiveTab] = useState('ui-labels');
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [labels, setLabels] = useState([]);
  const [filteredLabels, setFilteredLabels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [bulkTranslations, setBulkTranslations] = useState({});
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = ['common', 'navigation', 'product', 'checkout', 'account', 'admin'];

  /**
   * Load UI labels for selected language
   */
  const loadLabels = async (lang) => {
    try {
      setLoading(true);
      const response = await api.get(`/translations/ui-labels?lang=${lang}`);

      if (response && response.success && response.data && response.data.labels) {
        // Flatten nested objects into separate label entries
        const labelsArray = [];

        const flattenObject = (obj, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // Recursively flatten nested objects
              flattenObject(value, fullKey);
            } else {
              // This is a leaf node - create a label entry
              const category = fullKey.split('.')[0] || 'common';
              const stringValue = String(value || '');

              // Determine if this is a system or custom translation
              // System translations typically come from the API with predefined keys
              // Custom translations are user-added (we'll check if it exists in response metadata)
              const type = response.data.customKeys?.includes(fullKey) ? 'custom' : 'system';

              labelsArray.push({
                key: fullKey,
                value: stringValue,
                category,
                type
              });
            }
          });
        };

        flattenObject(response.data.labels);

        setLabels(labelsArray);
        setFilteredLabels(labelsArray);
      } else {
        showMessage('Unexpected response format', 'error');
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
      showMessage(`Failed to load translations: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter labels based on search and category
   */
  useEffect(() => {
    let filtered = labels;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(label => {
        const keyMatch = label.key.toLowerCase().includes(searchQuery.toLowerCase());
        const valueStr = typeof label.value === 'string' ? label.value : JSON.stringify(label.value);
        const valueMatch = valueStr.toLowerCase().includes(searchQuery.toLowerCase());
        return keyMatch || valueMatch;
      });
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(label => label.category === categoryFilter);
    }

    setFilteredLabels(filtered);
  }, [searchQuery, categoryFilter, labels]);

  /**
   * Save label translation
   */
  const saveLabel = async (key, value, category = 'common', type = 'system') => {
    try {
      setSaving(true);
      const response = await api.post('/translations/ui-labels', {
        key,
        language_code: selectedLanguage,
        value,
        category,
        type
      });

      if (response && response.success) {
        showMessage('Translation saved successfully', 'success');

        // Update local state directly instead of reloading
        const updatedLabels = labels.map(label =>
          label.key === key ? { ...label, value, category, type } : label
        );
        setLabels(updatedLabels);

        // Clear translation cache in storefront
        try {
          const channel = new BroadcastChannel('translations_update');
          channel.postMessage({ type: 'clear_translations_cache', language: selectedLanguage });
          channel.close();
        } catch (e) {
          console.warn('BroadcastChannel not supported:', e);
        }

        // Close edit mode
        setEditingKey(null);
        setEditValue('');
      }
    } catch (error) {
      console.error('Failed to save label:', error);
      showMessage('Failed to save translation', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete label translation
   */
  const deleteLabel = async (key) => {
    if (!confirm('Are you sure you want to delete this translation?')) {
      return;
    }

    try {
      await api.delete(`/translations/ui-labels/${encodeURIComponent(key)}/${selectedLanguage}`);
      showMessage('Translation deleted successfully', 'success');
      await loadLabels(selectedLanguage);
    } catch (error) {
      console.error('Failed to delete label:', error);
      showMessage('Failed to delete translation', 'error');
    }
  };

  /**
   * AI translate all missing labels
   */
  const aiTranslateAll = async () => {
    if (!confirm(`AI translate all missing labels to ${selectedLanguage}? This may take a few minutes.`)) {
      return;
    }

    try {
      setAiTranslating(true);

      // Get English labels as source
      const enResponse = await api.get('/translations/ui-labels?lang=en');
      const enLabels = enResponse.data.labels;

      // Find missing translations
      const currentLabelKeys = new Set(labels.map(l => l.key));
      const missingKeys = Object.keys(enLabels).filter(key => !currentLabelKeys.has(key));

      if (missingKeys.length === 0) {
        showMessage('No missing translations found', 'info');
        setAiTranslating(false);
        return;
      }

      // Translate in batches
      const batchSize = 10;
      let translated = 0;

      for (let i = 0; i < missingKeys.length; i += batchSize) {
        const batch = missingKeys.slice(i, i + batchSize);
        const translationPromises = batch.map(async (key) => {
          try {
            const response = await api.post('/translations/ai-translate', {
              text: enLabels[key],
              fromLang: 'en',
              toLang: selectedLanguage
            });

            if (response && response.success && response.data) {
              return {
                key,
                language_code: selectedLanguage,
                value: response.data.translated,
                category: key.split('.')[0] || 'common'
              };
            }
          } catch (error) {
            console.error(`Failed to translate ${key}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(translationPromises);
        const validResults = batchResults.filter(r => r !== null);

        // Save batch
        if (validResults.length > 0) {
          await api.post('/translations/ui-labels/bulk', { labels: validResults });
          translated += validResults.length;
        }
      }

      showMessage(`Successfully translated ${translated} labels`, 'success');
      await loadLabels(selectedLanguage);
    } catch (error) {
      console.error('AI translation failed:', error);
      showMessage('AI translation failed', 'error');
    } finally {
      setAiTranslating(false);
    }
  };


  /**
   * Add bulk translations
   */
  const addBulkTranslations = async () => {
    const baseKey = bulkTranslations.baseKey;
    if (!baseKey) {
      showMessage('Base key is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const category = bulkTranslations.category || 'common';
      const fullKey = category ? `${category}.${baseKey}` : baseKey;

      const languages = availableLanguages || [];
      const translationsToSave = [];

      if (autoTranslate) {
        // Auto-translate: get the source value from the first filled language or use a specific one
        let sourceValue = null;
        let sourceLang = selectedLanguage;

        // Try to find a value from the form
        for (const lang of languages) {
          const value = bulkTranslations[lang.code];
          if (value && value.trim()) {
            sourceValue = value.trim();
            sourceLang = lang.code;
            break;
          }
        }

        if (!sourceValue) {
          showMessage('Please enter at least one translation value', 'error');
          setSaving(false);
          return;
        }

        // Auto-translate to all languages
        for (const lang of languages) {
          let translatedValue = sourceValue;

          if (lang.code !== sourceLang) {
            try {
              const response = await api.post('/translations/ai-translate', {
                text: sourceValue,
                fromLang: sourceLang,
                toLang: lang.code
              });
              if (response && response.success && response.data) {
                translatedValue = response.data.translated;
              }
            } catch (error) {
              console.error(`Failed to translate to ${lang.code}:`, error);
              // Skip this language if translation fails
              continue;
            }
          }

          translationsToSave.push({
            key: fullKey,
            language_code: lang.code,
            value: translatedValue,
            category,
            type: 'custom'
          });
        }
      } else {
        // Manual mode: only save languages with values
        for (const lang of languages) {
          const value = bulkTranslations[lang.code];
          if (value && value.trim()) {
            translationsToSave.push({
              key: fullKey,
              language_code: lang.code,
              value: value.trim(),
              category,
              type: 'custom'
            });
          }
        }
      }

      if (translationsToSave.length === 0) {
        showMessage('Please add at least one translation', 'error');
        setSaving(false);
        return;
      }

      // Save in bulk
      await api.post('/translations/ui-labels/bulk', { labels: translationsToSave });

      if (autoTranslate) {
        showMessage(`Successfully added and auto-translated to ${translationsToSave.length} languages`, 'success');
      } else {
        showMessage(`Successfully added translations in ${translationsToSave.length} languages`, 'success');
      }

      // Add to local state for current language
      const currentLangTranslation = translationsToSave.find(t => t.language_code === selectedLanguage);
      if (currentLangTranslation) {
        const newLabelEntry = {
          key: fullKey,
          value: currentLangTranslation.value,
          category,
          type: 'custom'
        };
        setLabels([...labels, newLabelEntry]);
      }

      // Clear form
      setBulkTranslations({});
      setShowBulkAddForm(false);
      setAutoTranslate(false);

      // Clear translation cache
      try {
        const channel = new BroadcastChannel('translations_update');
        channel.postMessage({ type: 'clear_translations_cache' });
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    } catch (error) {
      console.error('Failed to add bulk translations:', error);
      showMessage('Failed to add translations', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Show message
   */
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Load labels when language changes
  useEffect(() => {
    loadLabels(selectedLanguage);
  }, [selectedLanguage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Translations</h1>
        <p className="text-gray-600">
          Manage multilingual content for your store
        </p>
      </div>

      {/* Message banner */}
      {message && (
        <div className={`
          mb-6 p-4 rounded-lg flex items-center gap-3
          ${message.type === 'success' ? 'bg-green-50 text-green-800' : ''}
          ${message.type === 'error' ? 'bg-red-50 text-red-800' : ''}
          ${message.type === 'info' ? 'bg-blue-50 text-blue-800' : ''}
        `}>
          {message.type === 'success' && <Check className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ui-labels')}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${activeTab === 'ui-labels'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            UI Labels
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${activeTab === 'entities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Products & Content
          </button>
        </div>
      </div>

      {/* UI Labels Tab */}
      {activeTab === 'ui-labels' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Language selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {(availableLanguages || []).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native_name || lang.name || lang.code} ({lang.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search labels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={aiTranslateAll}
                disabled={aiTranslating || selectedLanguage === 'en'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {aiTranslating ? 'Translating...' : 'AI Translate All'}
              </button>

              <button
                onClick={() => setShowBulkAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Translation
              </button>
            </div>
          </div>

          {/* Bulk Add form */}
          {showBulkAddForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Translation in Multiple Languages</h3>
                <button
                  onClick={() => setShowBulkAddForm(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={bulkTranslations.category || 'common'}
                    onChange={(e) => setBulkTranslations({ ...bulkTranslations, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-mono border-r border-gray-300">
                      {bulkTranslations.category || 'common'}.
                    </span>
                    <input
                      type="text"
                      placeholder="button_submit"
                      value={bulkTranslations.baseKey || ''}
                      onChange={(e) => setBulkTranslations({ ...bulkTranslations, baseKey: e.target.value })}
                      className="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="autoTranslate"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoTranslate" className="text-sm text-blue-900 cursor-pointer">
                  Auto-translate to all active languages using AI (just fill in one language)
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {autoTranslate ? `Source Translation (${selectedLanguage})` : 'Translations by Language'}
                </label>
                {autoTranslate ? (
                  // Auto-translate mode: only show selected language input
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      {(availableLanguages || []).find(l => l.code === selectedLanguage)?.native_name || selectedLanguage} ({selectedLanguage})
                    </label>
                    <textarea
                      placeholder={`Enter ${selectedLanguage} translation to auto-translate...`}
                      value={bulkTranslations[selectedLanguage] || ''}
                      onChange={(e) => setBulkTranslations({ ...bulkTranslations, [selectedLanguage]: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be automatically translated to all {(availableLanguages || []).length - 1} other active languages
                    </p>
                  </div>
                ) : (
                  // Manual mode: show all language inputs
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(availableLanguages || []).map((lang) => (
                      <div key={lang.code} className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          {lang.native_name || lang.name} ({lang.code})
                        </label>
                        <textarea
                          placeholder={`Enter ${lang.code} translation...`}
                          value={bulkTranslations[lang.code] || ''}
                          onChange={(e) => setBulkTranslations({ ...bulkTranslations, [lang.code]: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addBulkTranslations}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : (autoTranslate ? 'Add & Auto-translate' : 'Add Translations')}
                </button>
                <button
                  onClick={() => setShowBulkAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Labels table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading translations...</div>
            ) : filteredLabels.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No translations found. {selectedLanguage !== 'en' && 'Try using AI Translate All to get started.'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Key</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLabels.map((label) => (
                    <tr key={label.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {label.key}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {label.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          label.type === 'custom'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {label.type || 'system'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingKey === label.key ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-900">
                            {typeof label.value === 'object' ? JSON.stringify(label.value) : String(label.value || '')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {editingKey === label.key ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                saveLabel(label.key, editValue, label.category, label.type);
                              }}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingKey(label.key);
                                setEditValue(label.value);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit translation"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {label.type === 'custom' && (
                              <button
                                onClick={() => deleteLabel(label.key)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete custom translation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredLabels.length} of {labels.length} labels
            </span>
            <span>
              Language: {(availableLanguages || []).find(l => l.code === selectedLanguage)?.native_name || selectedLanguage}
            </span>
          </div>
        </div>
      )}

      {/* Entities Tab */}
      {activeTab === 'entities' && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Entity Translations
          </h3>
          <p>
            Translate products, categories, and CMS content directly from their edit pages.
          </p>
        </div>
      )}
    </div>
  );
}
