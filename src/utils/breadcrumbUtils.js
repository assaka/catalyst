import { createCategoryUrl, createProductUrl, createCmsPageUrl } from "./urlUtils";

/**
 * Generic breadcrumb builder for different page types
 */
export const buildBreadcrumbItems = (pageType, pageData, storeCode, categories = [], settings = {}) => {
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
};

/**
 * Build breadcrumbs for category pages
 * Returns parent categories and current category (current is not clickable)
 */
export const buildCategoryBreadcrumbs = (currentCategory, storeCode, categories = [], settings = {}) => {
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
      url: cat.id === currentCategory.id ? null : createCategoryUrl(storeCode, categoryPath.join('/')), // Current category not clickable
      isCurrent: cat.id === currentCategory.id
    };
  });
};

/**
 * Build breadcrumbs for product pages
 * Returns category hierarchy and the product (product is not clickable)
 * Respects the show_category_in_breadcrumb setting
 */
export const buildProductBreadcrumbs = (product, storeCode, categories = [], settings = {}) => {
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
      // Only filter out root categories (level 0 or no parent)
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
    url: null, // Current product not clickable
    isCurrent: true
  });

  return breadcrumbs;
};

/**
 * Build breadcrumbs for CMS pages
 * Returns a simple breadcrumb structure including current page
 */
export const buildCmsBreadcrumbs = (cmsPage, storeCode, settings = {}) => {
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
    url: null, // Current page not clickable
    isCurrent: true
  });

  return breadcrumbs;
};

/**
 * Add home/store link to breadcrumbs
 */
export const addHomeBreadcrumb = (breadcrumbs, storeName = 'Home', storeUrl = '/') => {
  return [
    {
      name: storeName,
      url: storeUrl
    },
    ...breadcrumbs
  ];
};

/**
 * Format breadcrumbs for display
 */
export const formatBreadcrumbsForDisplay = (breadcrumbs, options = {}) => {
  const {
    maxItems = 5,
    showEllipsis = true,
    ellipsisText = '...'
  } = options;

  if (!breadcrumbs || breadcrumbs.length <= maxItems) {
    return breadcrumbs;
  }

  if (!showEllipsis) {
    return breadcrumbs.slice(-maxItems);
  }

  // Show first item, ellipsis, and last few items
  const firstItem = breadcrumbs[0];
  const lastItems = breadcrumbs.slice(-(maxItems - 2));

  return [
    firstItem,
    { name: ellipsisText, url: null, isEllipsis: true },
    ...lastItems
  ];
};