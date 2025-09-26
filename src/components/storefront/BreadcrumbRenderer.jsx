import React, { Fragment } from 'react';
import { buildBreadcrumbs } from '@/utils/breadcrumbUtils';

/**
 * Unified breadcrumb renderer component
 * Used across CategorySlotRenderer, ProductDetail, and other components
 * Can render pre-built breadcrumb items OR build breadcrumbs from page data
 */
export default function BreadcrumbRenderer({
  // Option 1: Pre-built items (for backward compatibility)
  items,

  // Option 2: Auto-generate from page data
  pageType,         // 'category', 'product', 'cms'
  pageData,         // category, product, or cms page object
  storeCode,        // store code for URL generation
  categories,       // categories array (needed for hierarchy building)
  settings,         // settings object (for show_category_in_breadcrumb, etc.)

  // Styling options
  className = "flex items-center space-x-1 text-sm text-gray-500 mb-4",
  ariaLabel = "Breadcrumb"
}) {
  // Determine breadcrumb items to render
  let breadcrumbItems = items;

  // If no pre-built items provided, generate them from page data
  if (!breadcrumbItems && pageType && pageData && storeCode) {
    breadcrumbItems = buildBreadcrumbs(pageType, pageData, storeCode, categories, settings);
  }

  if (!breadcrumbItems || breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={className} aria-label={ariaLabel}>
      {breadcrumbItems.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="text-gray-400 mx-1">/</span>}
          {item.url ? (
            <a
              href={item.url}
              className="text-gray-500 hover:text-gray-700 hover:underline whitespace-nowrap"
            >
              {item.name}
            </a>
          ) : (
            <span className="text-gray-900 font-medium whitespace-nowrap">
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}