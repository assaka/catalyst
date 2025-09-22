import React, { Fragment } from 'react';
import { createCategoryUrl, createProductUrl, createCmsPageUrl } from '@/utils/urlUtils';

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
    breadcrumbItems = buildBreadcrumbItems(pageType, pageData, storeCode, categories, settings);
  }

  // Internal breadcrumb building functions
  function buildBreadcrumbItems(pageType, pageData, storeCode, categories = [], settings = {}) {
    switch (pageType) {
      case 'category':
        return buildCategoryBreadcrumbs(pageData, storeCode, categories, settings);
      case 'product':
        return buildProductBreadcrumbs(pageData, storeCode, categories, settings);
      case 'cms':
        return buildCmsBreadcrumbs(pageData, storeCode, settings);
      default:
        return [];
    }
  }

  function buildCategoryBreadcrumbs(currentCategory, storeCode, categories = [], settings = {}) {
    if (!currentCategory || !categories) return [];

    // Build hierarchy from current category up to root
    let category = currentCategory;
    const categoryChain = [currentCategory];

    // Find parent categories
    while (category?.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      if (parent) {
        categoryChain.unshift(parent);
        category = parent;
      } else {
        break;
      }
    }

    // Filter out root categories (categories with no parent_id)
    const filteredChain = categoryChain.filter(cat => cat.parent_id !== null);

    // Convert to breadcrumb items with full category paths
    return filteredChain.map((cat, index) => {
      // Build the full category path from root to this category
      const categoryPath = [];
      const categoryChainUpToCurrent = filteredChain.slice(0, index + 1);
      categoryChainUpToCurrent.forEach(c => categoryPath.push(c.slug));

      return {
        name: cat.name,
        url: cat.id === currentCategory.id ? null : createCategoryUrl(storeCode, categoryPath.join('/')),
        isCurrent: cat.id === currentCategory.id
      };
    });
  }

  function buildProductBreadcrumbs(product, storeCode, categories = [], settings = {}) {
    if (!product) return [];

    const breadcrumbs = [];

    // Add category hierarchy if product has categories and setting is enabled
    if (settings?.show_category_in_breadcrumb && product.category_ids && product.category_ids.length > 0 && categories) {
      // Find the primary category for the product
      const primaryCategoryId = product.category_ids[0];
      const primaryCategory = categories.find(c => c.id === primaryCategoryId);

      if (primaryCategory) {
        // Build category hierarchy
        let category = primaryCategory;
        const categoryChain = [category];

        // Find parent categories
        while (category?.parent_id) {
          const parent = categories.find(c => c.id === category.parent_id);
          if (parent) {
            categoryChain.unshift(parent);
            category = parent;
          } else {
            break;
          }
        }

        // Add all categories to breadcrumbs (all categories clickable)
        const filteredChain = categoryChain.filter(cat => cat.parent_id !== null);
        filteredChain.forEach((cat, index) => {
          // Build the full category path from root to this category
          const categoryPath = [];
          const categoryChainUpToCurrent = filteredChain.slice(0, index + 1);
          categoryChainUpToCurrent.forEach(c => categoryPath.push(c.slug));

          breadcrumbs.push({
            name: cat.name,
            url: createCategoryUrl(storeCode, categoryPath.join('/')),
            isCurrent: false
          });
        });
      }
    }

    // Add the current product as the last breadcrumb (not clickable)
    breadcrumbs.push({
      name: product.name,
      url: null,
      isCurrent: true
    });

    return breadcrumbs;
  }

  function buildCmsBreadcrumbs(cmsPage, storeCode, settings = {}) {
    if (!cmsPage) return [];

    const breadcrumbs = [];

    // Add parent pages if hierarchical structure exists
    if (cmsPage.parent_page) {
      breadcrumbs.push({
        name: cmsPage.parent_page.title,
        url: createCmsPageUrl(storeCode, cmsPage.parent_page.slug),
        isCurrent: false
      });
    }

    // Add current page (not clickable)
    breadcrumbs.push({
      name: cmsPage.title || cmsPage.name,
      url: null,
      isCurrent: true
    });

    return breadcrumbs;
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
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              {item.name}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}