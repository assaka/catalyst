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
  console.log('🍞 buildProductBreadcrumbs called:', {
    hasProduct: !!product,
    productName: product?.name,
    categoryIds: product?.category_ids,
    categoriesCount: categories?.length,
    storeCode,
    showCategoryInBreadcrumb: settings?.show_category_in_breadcrumb,
    settingsKeys: settings ? Object.keys(settings) : 'no settings',
    fullSettings: settings
  });

  if (!product) return [];

  const breadcrumbs = [];

  if (settings?.show_category_in_breadcrumb !== false && product.category_ids && product.category_ids.length > 0 && categories && categories.length > 0) {
    // Find the deepest category (the one that has no children in the product's category list)
    let deepestCategory = null;
    let maxDepth = -1;

    for (const categoryId of product.category_ids) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        // Calculate depth by walking up the parent chain
        let depth = 0;
        let current = category;
        while (current?.parent_id) {
          depth++;
          current = categories.find(c => c.id === current.parent_id);
          if (!current) break;
        }

        if (depth > maxDepth) {
          maxDepth = depth;
          deepestCategory = category;
        }
      }
    }

    console.log('🏷️ Category search:', {
      allCategoryIds: product.category_ids,
      deepestCategory: deepestCategory?.name,
      maxDepth,
      allCategories: categories.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id }))
    });

    if (deepestCategory) {
      let category = deepestCategory;
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

      console.log('🔗 Category chain:', categoryChain.map(c => c.name));

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

  console.log('🍞 Final breadcrumbs:', breadcrumbs);

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