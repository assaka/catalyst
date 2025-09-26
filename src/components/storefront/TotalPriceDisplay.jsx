import React from 'react';

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
  currencySymbol = '$',
  showTitle = true,
  compact = false
}) => {
  // Use productContext if provided, otherwise use individual props
  const actualProduct = product || productContext?.product;
  const actualOptions = selectedOptions.length > 0 ? selectedOptions : (productContext?.selectedOptions || []);
  const actualQuantity = quantity !== 1 ? quantity : (productContext?.quantity || 1);
  const actualCurrency = currencySymbol !== '$' ? currencySymbol : (productContext?.currencySymbol || '$');
  const actualTotalPrice = totalPrice !== null ? totalPrice : (productContext?.totalPrice || 0);

  if (!actualProduct) {
    return null;
  }

  // Calculate base price (use sale price if available)
  let basePrice = parseFloat(actualProduct.price || 0);
  if (actualProduct.compare_price && parseFloat(actualProduct.compare_price) > 0 && parseFloat(actualProduct.compare_price) !== parseFloat(actualProduct.price)) {
    basePrice = Math.min(parseFloat(actualProduct.price), parseFloat(actualProduct.compare_price));
  }

  // Calculate if we should show the total price breakdown
  const basePriceTotal = basePrice * actualQuantity;
  const shouldShowTotal = actualTotalPrice > basePriceTotal || actualOptions.length > 0;

  // Don't render if conditions aren't met
  if (!shouldShowTotal) {
    return null;
  }

  const containerClass = compact
    ? "bg-gray-50 rounded p-3 space-y-1"
    : "border-t pt-4 mb-4";

  const innerClass = compact
    ? "space-y-1"
    : "bg-gray-50 rounded-lg p-4 space-y-2";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {showTitle && !compact && (
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Price Breakdown
          </h3>
        )}

        {/* Base Product */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {actualProduct.name} × {actualQuantity}
          </span>
          <span className="font-medium">
            {actualCurrency}{basePriceTotal.toFixed(2)}
          </span>
        </div>

        {/* Selected Options */}
        {actualOptions.length > 0 && (
          <>
            <div className={compact ? "pt-1" : "border-t pt-2 mt-2"}>
              {!compact && (
                <div className="text-sm font-medium text-gray-700 mb-1">Selected Options:</div>
              )}
              {actualOptions.map((option, index) => {
                const optionPrice = parseFloat(option.price || 0);
                const optionTotal = optionPrice * actualQuantity;

                return (
                  <div key={option.id || index} className={`flex justify-between items-center text-sm ${compact ? '' : 'pl-4'}`}>
                    <span className="text-gray-600">
                      {option.name || option.label || `Option ${index + 1}`} × {actualQuantity}
                    </span>
                    <span className="font-medium">
                      +{actualCurrency}{optionTotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Total */}
        <div className={compact ? "pt-1 border-t" : "border-t pt-2 mt-2"}>
          <div className="flex justify-between items-center">
            <span className={compact ? "font-bold text-gray-900" : "text-lg font-bold text-gray-900"}>
              Total Price:
            </span>
            <span className={compact ? "font-bold text-green-600" : "text-lg font-bold text-green-600"}>
              {actualCurrency}{actualTotalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPriceDisplay;