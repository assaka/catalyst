import React, { Fragment } from 'react';
import { Home } from 'lucide-react';
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

  // Configuration from category-config.js
  breadcrumbConfig = {},
  breadcrumbStyles = {},

  // Styling options (backward compatibility)
  className = "flex items-center space-x-2 text-sm text-gray-600 mb-6",
  ariaLabel = "Breadcrumb"
}) {
  // Extract config with defaults
  const {
    enabled = true,
    showHomeLink = true,
    homeLabel = 'Home',
    separator = '/',
    showCategoryInBreadcrumb = true,
    maxDepth = null,
    truncateLength = null
  } = breadcrumbConfig;

  // Extract styles with defaults
  const {
    containerBgColor = 'transparent',
    containerPadding = '0',
    containerMargin = '0 0 1.5rem 0',
    itemTextColor = '#4B5563', // gray-600
    itemHoverColor = '#1F2937', // gray-800
    activeItemColor = '#1F2937', // gray-800
    separatorColor = '#9CA3AF', // gray-400
    fontSize = '0.875rem',
    fontWeight = '400'
  } = breadcrumbStyles;

  // Debug: Log what we're rendering
  console.log('🎨 BreadcrumbRenderer rendering with:', {
    breadcrumbConfig,
    breadcrumbStyles,
    itemTextColor,
    itemHoverColor,
    activeItemColor
  });

  // If disabled, return null
  if (!enabled) {
    return null;
  }

  // Determine breadcrumb items to render
  let breadcrumbItems = items;

  // If no pre-built items provided, generate them from page data
  if (!breadcrumbItems && pageType && pageData && storeCode) {
    // Merge showCategoryInBreadcrumb into settings
    const mergedSettings = {
      ...settings,
      show_category_in_breadcrumb: showCategoryInBreadcrumb
    };
    breadcrumbItems = buildBreadcrumbs(pageType, pageData, storeCode, categories, mergedSettings);
  }

  if (!breadcrumbItems || breadcrumbItems.length === 0) {
    return null;
  }

  // Apply maxDepth if specified
  if (maxDepth && breadcrumbItems.length > maxDepth) {
    breadcrumbItems = breadcrumbItems.slice(-maxDepth);
  }

  // Apply truncateLength if specified
  const truncateText = (text) => {
    if (truncateLength && text.length > truncateLength) {
      return text.substring(0, truncateLength) + '...';
    }
    return text;
  };

  // Container styles
  const containerStyles = {
    backgroundColor: containerBgColor,
    padding: containerPadding,
    margin: containerMargin
  };

  return (
    <nav
      className={className}
      style={containerStyles}
      aria-label={ariaLabel}
    >
      {/* Home Icon/Link */}
      {showHomeLink && (
        <>
          <a
            href="/"
            style={{
              color: itemTextColor,
              fontSize,
              fontWeight
            }}
            className="flex items-center hover:underline"
            onMouseEnter={(e) => e.target.style.color = itemHoverColor}
            onMouseLeave={(e) => e.target.style.color = itemTextColor}
          >
            <Home className="w-4 h-4 mr-1" />
            {homeLabel}
          </a>
          <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>{separator}</span>
        </>
      )}

      {/* Breadcrumb Items */}
      {breadcrumbItems.map((item, index) => (
        <Fragment key={index}>
          {item.url ? (
            <a
              href={item.url}
              style={{
                color: itemTextColor,
                fontSize,
                fontWeight
              }}
              className="hover:underline whitespace-nowrap"
              onMouseEnter={(e) => e.target.style.color = itemHoverColor}
              onMouseLeave={(e) => e.target.style.color = itemTextColor}
            >
              {truncateText(item.name)}
            </a>
          ) : (
            <span
              style={{
                color: activeItemColor,
                fontSize,
                fontWeight: '500'
              }}
              className="whitespace-nowrap"
            >
              {truncateText(item.name)}
            </span>
          )}
          {index < breadcrumbItems.length - 1 && (
            <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>{separator}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}