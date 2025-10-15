import React from 'react';
import { formatPrice, safeNumber } from '@/utils/priceUtils';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Total Price Display Component
 * Shows itemized breakdown of product pricing when options are selected
 * Reusable for product detail, cart, and checkout pages
 */
const TotalPriceDisplay = ({
  productContext,
  // Alternative props for cart/checkout usage
  product = null,
  selectedOptions = [],
  quantity = 1,
  totalPrice = null,
  showTitle = true,
  compact = false,
  settings = null
}) => {
  const { t } = useTranslation();
  // Use productContext if provided, otherwise use individual props
  const actualProduct = product || productContext?.product;
  const actualOptions = selectedOptions.length > 0 ? selectedOptions : (productContext?.selectedOptions || []);
  const actualQuantity = quantity !== 1 ? quantity : (productContext?.quantity || 1);
  const actualTotalPrice = safeNumber(totalPrice !== null ? totalPrice : (productContext?.totalPrice || 0));
  const actualSettings = settings || productContext?.settings || {};

  if (!actualProduct) {
    return null;
  }

  // Calculate base price (use sale price if available)
  let basePrice = safeNumber(actualProduct.price);
  if (actualProduct.compare_price && safeNumber(actualProduct.compare_price) > 0 && safeNumber(actualProduct.compare_price) !== safeNumber(actualProduct.price)) {
    basePrice = Math.min(safeNumber(actualProduct.price), safeNumber(actualProduct.compare_price));
  }

  // Calculate if we should show the total price breakdown
  const basePriceTotal = basePrice * actualQuantity;
  // Always show the total price (removed conditional display)
  const shouldShowTotal = true;

  const containerClass = compact
    ? "bg-gray-50 rounded p-3 space-y-1"
    : "border-t pt-4 mb-4";

  const innerClass = compact
    ? "space-y-1"
    : "bg-gray-50 rounded-lg py-4 space-y-2";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {showTitle && !compact && (
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            {actualOptions.length > 0 ? t('product.price_breakdown', 'Price Breakdown') : t('product.total_price', 'Total Price')}
          </h3>
        )}

        {/* Base Product */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {actualProduct.name} × {actualQuantity}
          </span>
          <span className="font-medium">
            {formatPrice(basePriceTotal)}
          </span>
        </div>

        {/* Selected Options */}
        {actualOptions.length > 0 && (
          <>
            <div className={compact ? "pt-1" : "border-t pt-2 mt-2"}>
              {!compact && (
                <div className="text-sm font-medium text-gray-700 mb-1">{t('product.selected_options', 'Selected Options')}:</div>
              )}
              {actualOptions.map((option, index) => {
                const optionPrice = safeNumber(option.price);
                const optionTotal = optionPrice * actualQuantity;

                return (
                  <div key={option.id || index} className={`flex justify-between items-center text-sm ${compact ? '' : 'pl-4'}`}>
                    <span className="text-gray-600">
                      {option.name || option.label || `Option ${index + 1}`} × {actualQuantity}
                    </span>
                    <span className="font-medium">
                      +{formatPrice(optionTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Total - Always show for transparency */}
        <div className={compact ? "pt-1 border-t" : "border-t pt-2 mt-2"}>
          <div className="flex justify-between items-center">
            <span className={compact ? "font-bold text-gray-900" : "text-lg font-bold text-gray-900"}>
              {t('product.total_price', 'Total Price')}:
            </span>
            <span className={compact ? "font-bold text-green-600" : "text-lg font-bold text-green-600"}>
              {formatPrice(actualTotalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPriceDisplay;
