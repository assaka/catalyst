import { createCategoryUrl, createProductUrl, createCmsPageUrl } from "./urlUtils";

/**
 * Generic breadcrumb builder for different page types
 */
export const buildBreadcrumbItems = (pageType, pageData, storeCode, categories = []) => {
  switch (pageType) {
    case 'category':
      return buildCategoryBreadcrumbs(pageData, storeCode, categories);

    case 'product':
      return buildProductBreadcrumbs(pageData, storeCode, categories);

    case 'cms':
      return buildCmsBreadcrumbs(pageData, storeCode);

    default:
      return [];
  }
};

/**
 * Build breadcrumbs for category pages
 * Returns parent categories and current category (current is not clickable)
 */
export const buildCategoryBreadcrumbs = (currentCategory, storeCode, categories = []) => {
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

  // Filter out root categories (categories with no parent_id or level 0)
  const filteredChain = categoryChain.filter(cat => cat.parent_id !== null && cat.level > 0);

  // Convert to breadcrumb items
  return filteredChain.map((cat, index) => ({
    name: cat.name,
    url: cat.id === currentCategory.id ? null : createCategoryUrl(storeCode, cat.slug), // Current category not clickable
    isCurrent: cat.id === currentCategory.id
  }));
};

/**
 * Build breadcrumbs for product pages
 * Returns category hierarchy and the product (product is not clickable)
 */
export const buildProductBreadcrumbs = (product, storeCode, categories = []) => {
  if (!product || !categories) return [];

  // Find the primary category for the product
  let primaryCategory = null;
  if (product.category_ids && product.category_ids.length > 0) {
    // Use the first category as primary, or find the deepest category
    const productCategories = categories.filter(cat =>
      product.category_ids.includes(cat.id)
    );

    if (productCategories.length > 0) {
      // Find the category with the highest level (deepest in hierarchy)
      primaryCategory = productCategories.reduce((deepest, current) =>
        (current.level || 0) > (deepest.level || 0) ? current : deepest
      );
    }
  }

  const breadcrumbs = [];

  if (primaryCategory) {
    // Build category breadcrumbs (all categories should be clickable for product pages)
    let category = primaryCategory;
    const categoryChain = [primaryCategory];

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

    // Filter out root categories and add to breadcrumbs
    const filteredChain = categoryChain.filter(cat => cat.parent_id !== null && cat.level > 0);
    filteredChain.forEach(cat => {
      breadcrumbs.push({
        name: cat.name,
        url: createCategoryUrl(storeCode, cat.slug),
        isCurrent: false
      });
    });
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
export const buildCmsBreadcrumbs = (cmsPage, storeCode) => {
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