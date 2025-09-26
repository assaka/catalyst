import { createCategoryUrl, createProductUrl, createCmsPageUrl } from './urlUtils';

/**
 * Builds breadcrumb items based on page type and data
 * @param {string} pageType - 'category', 'product', or 'cms'
 * @param {object} pageData - The page data (category, product, or cms page object)
 * @param {string} storeCode - Store code for URL generation
 * @param {array} categories - Array of all categories (needed for hierarchy)
 * @param {object} settings - Store settings (for show_category_in_breadcrumb, etc.)
 * @returns {array} Array of breadcrumb items { name, url, isCurrent }
 */
export function buildBreadcrumbs(pageType, pageData, storeCode, categories = [], settings = {}) {
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

/**
 * Builds breadcrumbs for a category page
 */
export function buildCategoryBreadcrumbs(currentCategory, storeCode, categories = [], settings = {}) {
  if (!currentCategory || !categories) return [];

  let category = currentCategory;
  const categoryChain = [currentCategory];

  while (category?.parent_id) {
    const parent = categories.find(c => c.id === category.parent_id);
    if (parent) {
      categoryChain.unshift(parent);
      category = parent;
    } else {
      break;
    }
  }

  const filteredChain = categoryChain.filter(cat => cat.parent_id !== null);

  return filteredChain.map((cat, index) => {
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

/**
 * Builds breadcrumbs for a product page
 */
export function buildProductBreadcrumbs(product, storeCode, categories = [], settings = {}) {
  if (!product) return [];

  const breadcrumbs = [];

  if (settings?.show_category_in_breadcrumb && product.category_ids && product.category_ids.length > 0 && categories) {
    const primaryCategoryId = product.category_ids[0];
    const primaryCategory = categories.find(c => c.id === primaryCategoryId);

    if (primaryCategory) {
      let category = primaryCategory;
      const categoryChain = [category];

      while (category?.parent_id) {
        const parent = categories.find(c => c.id === category.parent_id);
        if (parent) {
          categoryChain.unshift(parent);
          category = parent;
        } else {
          break;
        }
      }

      const filteredChain = categoryChain.filter(cat => cat.parent_id !== null);
      filteredChain.forEach((cat, index) => {
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

  breadcrumbs.push({
    name: product.name,
    url: null,
    isCurrent: true
  });

  return breadcrumbs;
}

/**
 * Builds breadcrumbs for a CMS page
 */
export function buildCmsBreadcrumbs(cmsPage, storeCode, settings = {}) {
  if (!cmsPage) return [];

  const breadcrumbs = [];

  if (cmsPage.parent_page) {
    breadcrumbs.push({
      name: cmsPage.parent_page.title,
      url: createCmsPageUrl(storeCode, cmsPage.parent_page.slug),
      isCurrent: false
    });
  }

  breadcrumbs.push({
    name: cmsPage.title || cmsPage.name,
    url: null,
    isCurrent: true
  });

  return breadcrumbs;
}