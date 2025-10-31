import React, { useState, useEffect } from 'react';
import { Wand2, Languages, Globe, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../utils/api';
import { toast } from 'sonner';

/**
 * TranslationWizard - Interactive wizard for translating content
 *
 * Features:
 * - Step-by-step guided translation
 * - Quick questions to determine what to translate
 * - Preview before translating
 * - Progress tracking
 */
export default function TranslationWizard({ isOpen, onClose, storeId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [translationCost, setTranslationCost] = useState(0.1); // Default fallback

  // Wizard state
  const [config, setConfig] = useState({
    whatToTranslate: null, // 'all', 'ui-labels', 'products', 'categories', 'cms', etc.
    fromLanguage: 'en',
    toLanguages: [],
    specificItems: [],
    singleField: null,
    preview: null
  });

  const [stats, setStats] = useState(null);
  const [translationResult, setTranslationResult] = useState(null);

  // Load languages and translation cost on mount
  useEffect(() => {
    if (isOpen) {
      loadLanguages();
      loadTranslationCost();
    }
  }, [isOpen]);

  const loadTranslationCost = async () => {
    try {
      const response = await api.get('/api/service-credit-costs/key/ai_translation');
      if (response.data.success && response.data.service) {
        setTranslationCost(response.data.service.cost_per_unit);
      }
    } catch (error) {
      console.error('Error loading translation cost:', error);
      // Keep using default fallback value
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await api.get('/api/languages');
      setLanguages(response.data.data.filter(l => l.is_active));
    } catch (error) {
      console.error('Error loading languages:', error);
      toast.error('Failed to load languages');
    }
  };

  // Get preview of what will be translated
  const getPreview = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/translations/preview', {
        store_id: storeId,
        what: config.whatToTranslate,
        fromLang: config.fromLanguage,
        toLanguages: config.toLanguages,
        specificItems: config.specificItems,
        singleField: config.singleField
      });
      setStats(response.data.data);
      setStep(3);
    } catch (error) {
      console.error('Error getting preview:', error);
      toast.error('Failed to get translation preview');
    } finally {
      setLoading(false);
    }
  };

  // Execute translation
  const executeTranslation = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/translations/wizard-execute', {
        store_id: storeId,
        what: config.whatToTranslate,
        fromLang: config.fromLanguage,
        toLanguages: config.toLanguages,
        specificItems: config.specificItems,
        singleField: config.singleField
      });
      setTranslationResult(response.data.data);
      setStep(4);
      toast.success('Translation completed!');
    } catch (error) {
      console.error('Error executing translation:', error);
      toast.error('Translation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setConfig({
      whatToTranslate: null,
      fromLanguage: 'en',
      toLanguages: [],
      specificItems: [],
      singleField: null,
      preview: null
    });
    setStats(null);
    setTranslationResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Translation Wizard</h2>
                <p className="text-blue-100 text-sm">Step {step} of 4</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: What to translate */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  What would you like to translate?
                </h3>
                <p className="text-gray-600 mb-6">Choose what content you want to translate</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Everything */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'all' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'all'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌍</div>
                    <div className="font-semibold">Everything</div>
                    <div className="text-sm text-gray-600">Translate all content types</div>
                  </button>

                  {/* UI Labels */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'ui-labels' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'ui-labels'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔤</div>
                    <div className="font-semibold">UI Labels</div>
                    <div className="text-sm text-gray-600">Buttons, menus, labels</div>
                  </button>

                  {/* Products */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'product' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'product'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <div className="font-semibold">Products</div>
                    <div className="text-sm text-gray-600">Product names & descriptions</div>
                  </button>

                  {/* Categories */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'category' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'category'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <div className="font-semibold">Categories</div>
                    <div className="text-sm text-gray-600">Category names & descriptions</div>
                  </button>

                  {/* CMS Content */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'cms' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'cms'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">📄</div>
                    <div className="font-semibold">CMS Content</div>
                    <div className="text-sm text-gray-600">Pages & blocks</div>
                  </button>

                  {/* Single Field */}
                  <button
                    onClick={() => setConfig({ ...config, whatToTranslate: 'single-field' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.whatToTranslate === 'single-field'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="font-semibold">Single Field</div>
                    <div className="text-sm text-gray-600">Just one field type</div>
                  </button>
                </div>

                {/* Single field options */}
                {config.whatToTranslate === 'single-field' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Which field?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setConfig({ ...config, singleField: 'name' })}
                        className={`p-2 text-sm border rounded ${
                          config.singleField === 'name'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        Names only
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, singleField: 'description' })}
                        className={`p-2 text-sm border rounded ${
                          config.singleField === 'description'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        Descriptions only
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, singleField: 'short_description' })}
                        className={`p-2 text-sm border rounded ${
                          config.singleField === 'short_description'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        Short descriptions
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, singleField: 'title' })}
                        className={`p-2 text-sm border rounded ${
                          config.singleField === 'title'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        Titles only
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!config.whatToTranslate || (config.whatToTranslate === 'single-field' && !config.singleField)}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Language selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-blue-600" />
                  Choose languages
                </h3>
                <p className="text-gray-600 mb-6">Select source and target languages</p>

                {/* From language */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">From language:</label>
                  <select
                    value={config.fromLanguage}
                    onChange={(e) => setConfig({ ...config, fromLanguage: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.native_name} ({lang.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* To languages */}
                <div>
                  <label className="block text-sm font-medium mb-2">To languages (select multiple):</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {languages
                      .filter(lang => lang.code !== config.fromLanguage)
                      .map(lang => (
                        <label
                          key={lang.code}
                          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                            config.toLanguages.includes(lang.code)
                              ? 'bg-blue-50 border-2 border-blue-600'
                              : 'bg-gray-50 border-2 border-transparent hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={config.toLanguages.includes(lang.code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig({ ...config, toLanguages: [...config.toLanguages, lang.code] });
                              } else {
                                setConfig({ ...config, toLanguages: config.toLanguages.filter(l => l !== lang.code) });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium">{lang.native_name}</span>
                          <span className="text-xs text-gray-500">({lang.code.toUpperCase()})</span>
                        </label>
                      ))}
                  </div>

                  {config.toLanguages.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Selected: {config.toLanguages.length} language{config.toLanguages.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={getPreview}
                  disabled={config.toLanguages.length === 0 || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading preview...
                    </>
                  ) : (
                    <>
                      Preview <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && stats && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Review & Confirm
                </h3>
                <p className="text-gray-600 mb-6">Here's what will be translated</p>

                {/* Summary card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">{stats.totalItems || 0}</div>
                      <div className="text-sm text-gray-600">Total items</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">{stats.toTranslate || 0}</div>
                      <div className="text-sm text-gray-600">To translate</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-600">{stats.alreadyTranslated || 0}</div>
                      <div className="text-sm text-gray-600">Already translated</div>
                    </div>
                  </div>
                </div>

                {/* Details by entity type */}
                {stats.byEntityType && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700">Breakdown by type:</h4>
                    {Object.entries(stats.byEntityType).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{data.icon}</span>
                          <div>
                            <div className="font-medium">{data.name}</div>
                            <div className="text-xs text-gray-500">
                              {data.toTranslate} items need translation
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{data.totalItems} total</div>
                          <div className="text-xs text-gray-500">
                            {data.alreadyTranslated} already done
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estimated time */}
                {stats.estimatedMinutes && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span>⏱️</span>
                      <span className="font-medium">
                        Estimated time: {stats.estimatedMinutes} minutes
                      </span>
                    </div>
                  </div>
                )}

                {/* Credit cost estimate */}
                {stats.toTranslate > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>💰</span>
                        <span className="font-medium">
                          Estimated cost: {(stats.toTranslate * translationCost).toFixed(2)} credits
                        </span>
                      </div>
                      <div className="text-sm text-blue-600">
                        {stats.toTranslate} translations × {translationCost} credits each
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={executeTranslation}
                  disabled={loading || stats.toTranslate === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Start Translation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && translationResult && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Translation Complete!</h3>
                <p className="text-gray-600">Your content has been successfully translated</p>
              </div>

              {/* Results summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {translationResult.translated || 0}
                    </div>
                    <div className="text-sm text-gray-600">Translated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {translationResult.skipped || 0}
                    </div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {translationResult.failed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {/* Credits used */}
                {translationResult.translated > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800 font-medium">💰 Credits Used:</span>
                      <span className="text-blue-900 font-bold">
                        {(translationResult.translated * translationCost).toFixed(2)} credits
                      </span>
                    </div>
                  </div>
                )}

                {/* Details by entity type */}
                {translationResult.byEntity && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(translationResult.byEntity).map(([type, data]) => (
                      <div key={type} className="flex justify-between text-sm p-2 bg-white rounded">
                        <span className="font-medium">{data.name || type}</span>
                        <span className="text-gray-600">
                          {data.translated} / {data.total} translated
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Errors */}
              {translationResult.errors && translationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                  <div className="space-y-1 text-sm text-red-700 max-h-40 overflow-y-auto">
                    {translationResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx}>• {error.message || error.error}</div>
                    ))}
                    {translationResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 mt-2">
                        ... and {translationResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={resetWizard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Translate More
                </Button>
                <Button
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
