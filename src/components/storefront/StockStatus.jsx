import React from 'react';

/**
 * Stock Status Display Component
 * Shows dynamic stock status based on product data and settings
 * Reusable for product detail, product cards, etc.
 */
const StockStatus = ({
  productContext,
  // Alternative props for other usage
  product = null,
  settings = null,
  compact = false
}) => {
  // Use productContext if provided, otherwise use individual props
  const actualProduct = product || productContext?.product;
  const actualSettings = settings || productContext?.settings;

  if (!actualProduct) {
    return null;
  }

  // Helper function to get stock label based on settings and quantity
  const getStockLabel = (product, settings) => {
    // Check if stock labels should be shown at all
    const showStockLabel = settings?.stock_settings?.show_stock_label !== false;
    if (!showStockLabel) return null;

    // Default behavior if no stock settings are found
    if (!settings?.stock_settings) {
      if (product.stock_quantity <= 0 && !product.infinite_stock) {
        return "Out of Stock";
      }
      return "In Stock";
    }

    const stockSettings = settings.stock_settings;

    // Handle infinite stock
    if (product.infinite_stock) {
      const label = stockSettings.in_stock_label || "In Stock";
      // Remove quantity placeholder if present, as it's not applicable
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
    }

    // Handle out of stock
    if (product.stock_quantity <= 0) {
      return stockSettings.out_of_stock_label || "Out of Stock";
    }

    // Check if stock quantity should be hidden
    const hideStockQuantity = settings?.hide_stock_quantity === true;

    // Handle low stock
    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      const label = stockSettings.low_stock_label || "Low stock, just {quantity} left";
      if (hideStockQuantity) {
        // Remove quantity placeholder when hiding stock quantity
        return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
      }
      // Replace {quantity} with actual number
      return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
        if (match === '{({quantity})}') {
          return `(${product.stock_quantity})`;
        }
        if (match === '({quantity})') {
          return `(${product.stock_quantity})`;
        }
        return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
      });
    }

    // Handle regular in stock
    const label = stockSettings.in_stock_label || "In Stock";
    if (hideStockQuantity) {
      // Remove quantity placeholder when hiding stock quantity
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
    }
    // Replace {quantity} with actual number
    return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
      if (match === '{({quantity})}') {
        return `(${product.stock_quantity})`;
      }
      if (match === '({quantity})') {
        return `(${product.stock_quantity})`;
      }
      return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
    });
  };

  // Helper function to get stock variant (for styling)
  const getStockVariant = (product, settings) => {
    if (product.infinite_stock) return "outline";
    if (product.stock_quantity <= 0) return "destructive";

    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      return "secondary"; // Warning color for low stock
    }

    return "outline"; // Default for in stock
  };

  const stockLabel = getStockLabel(actualProduct, actualSettings);
  const stockVariant = getStockVariant(actualProduct, actualSettings);

  if (!stockLabel) {
    return null;
  }

  // Style classes based on variant
  let badgeClasses = "w-fit inline-flex items-center px-2 py-1 rounded-full text-xs";

  if (stockVariant === 'destructive') {
    badgeClasses += " bg-red-100 text-red-800";
  } else if (stockVariant === 'secondary') {
    badgeClasses += " bg-yellow-100 text-yellow-800";
  } else {
    badgeClasses += " bg-green-100 text-green-800";
  }

  if (compact) {
    badgeClasses += " text-xs";
  }

  return (
    <span className={badgeClasses}>
      {stockLabel}
    </span>
  );
};

export default StockStatus;