import React from 'react';
import { Languages, CheckCircle2 } from 'lucide-react';

/**
 * Entity Translation Card Component
 * Displays translation status for a specific entity type
 */
export default function EntityTranslationCard({
  icon,
  name,
  type,
  totalItems,
  translatedItems,
  completionPercentage,
  missingLanguages,
  onTranslate,
  loading = false
}) {
  const isComplete = completionPercentage === 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{totalItems} items</p>
          </div>
        </div>
        {isComplete && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Translation Progress</span>
          <span className="text-xs font-semibold text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completionPercentage === 100
                ? 'bg-green-500'
                : completionPercentage >= 75
                ? 'bg-blue-500'
                : completionPercentage >= 50
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {translatedItems} of {totalItems} fully translated
        </p>
      </div>

      {/* Missing Languages */}
      {missingLanguages && missingLanguages.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Missing translations:</p>
          <div className="flex flex-wrap gap-1">
            {missingLanguages.slice(0, 3).map((lang) => (
              <span
                key={lang.code}
                className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium"
              >
                {lang.code.toUpperCase()}
              </span>
            ))}
            {missingLanguages.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                +{missingLanguages.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onTranslate(type, name, totalItems)}
        disabled={loading || totalItems === 0}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${
          isComplete
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Languages className="w-4 h-4" />
        {isComplete ? 'View Translations' : loading ? 'Loading...' : 'Translate'}
      </button>
    </div>
  );
}
