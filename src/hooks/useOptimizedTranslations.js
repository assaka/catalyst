import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { storefrontClient } from '../api/storefront-client';

/**
 * Optimized Translation Hooks
 * Prevents N+1 queries by batching translation requests
 */

/**
 * Fetch multiple product translations in a single batch request
 * Instead of N individual queries, makes 1 query for all products
 *
 * @param {string[]} productIds - Array of product IDs
 * @param {string} language - Language code
 * @returns {object} React Query result with translations map
 *
 * @example
 * const { data: translations } = useBatchProductTranslations(['id1', 'id2'], 'en');
 * // translations = { id1: { name: '...', description: '...' }, id2: { ... } }
 */
export function useBatchProductTranslations(productIds, language = 'en') {
  return useQuery({
    queryKey: [...queryKeys.translation.all, 'products-batch', productIds.sort(), language],
    queryFn: async () => {
      if (!productIds || productIds.length === 0) {
        return {};
      }

      const response = await storefrontClient.get('/api/translations/products/batch', {
        params: {
          ids: productIds.join(','),
          lang: language,
        },
      });

      return response.data.data || {};
    },
    staleTime: 300000, // 5 minutes - product translations rarely change
    enabled: productIds && productIds.length > 0,
    placeholderData: {}, // Return empty object while loading
  });
}

/**
 * Fetch multiple category translations in a single batch request
 *
 * @param {string[]} categoryIds - Array of category IDs
 * @param {string} language - Language code
 */
export function useBatchCategoryTranslations(categoryIds, language = 'en') {
  return useQuery({
    queryKey: [...queryKeys.translation.all, 'categories-batch', categoryIds.sort(), language],
    queryFn: async () => {
      if (!categoryIds || categoryIds.length === 0) {
        return {};
      }

      const response = await storefrontClient.get('/api/translations/categories/batch', {
        params: {
          ids: categoryIds.join(','),
          lang: language,
        },
      });

      return response.data.data || {};
    },
    staleTime: 600000, // 10 minutes - categories rarely change
    enabled: categoryIds && categoryIds.length > 0,
    placeholderData: {},
  });
}

/**
 * Fetch multiple attribute translations in a single batch request
 *
 * @param {string[]} attributeIds - Array of attribute IDs
 * @param {string} language - Language code
 */
export function useBatchAttributeTranslations(attributeIds, language = 'en') {
  return useQuery({
    queryKey: [...queryKeys.translation.all, 'attributes-batch', attributeIds.sort(), language],
    queryFn: async () => {
      if (!attributeIds || attributeIds.length === 0) {
        return {};
      }

      const response = await storefrontClient.get('/api/translations/attributes/batch', {
        params: {
          ids: attributeIds.join(','),
          lang: language,
        },
      });

      return response.data.data || {};
    },
    staleTime: 600000, // 10 minutes
    enabled: attributeIds && attributeIds.length > 0,
    placeholderData: {},
  });
}

/**
 * Fetch multiple attribute value translations in a single batch request
 *
 * @param {string[]} valueIds - Array of attribute value IDs
 * @param {string} language - Language code
 */
export function useBatchAttributeValueTranslations(valueIds, language = 'en') {
  return useQuery({
    queryKey: [...queryKeys.translation.all, 'attribute-values-batch', valueIds.sort(), language],
    queryFn: async () => {
      if (!valueIds || valueIds.length === 0) {
        return {};
      }

      const response = await storefrontClient.get('/api/translations/attribute-values/batch', {
        params: {
          ids: valueIds.join(','),
          lang: language,
        },
      });

      return response.data.data || {};
    },
    staleTime: 600000, // 10 minutes
    enabled: valueIds && valueIds.length > 0,
    placeholderData: {},
  });
}

/**
 * Ultimate optimization: Fetch ALL entity translations in one request
 * Use this when you need translations for products, categories, and attributes together
 *
 * @param {object} params
 * @param {string[]} params.productIds
 * @param {string[]} params.categoryIds
 * @param {string[]} params.attributeIds
 * @param {string[]} params.attributeValueIds
 * @param {string} params.language
 *
 * @example
 * const { data } = useAllTranslationsBatch({
 *   productIds: ['p1', 'p2'],
 *   attributeIds: ['a1', 'a2'],
 *   language: 'en'
 * });
 * // data = {
 * //   products: { p1: {...}, p2: {...} },
 * //   attributes: { a1: {...}, a2: {...} },
 * //   categories: {},
 * //   attribute_values: {}
 * // }
 */
export function useAllTranslationsBatch({
  productIds = [],
  categoryIds = [],
  attributeIds = [],
  attributeValueIds = [],
  language = 'en',
}) {
  const hasAnyIds =
    productIds.length > 0 ||
    categoryIds.length > 0 ||
    attributeIds.length > 0 ||
    attributeValueIds.length > 0;

  return useQuery({
    queryKey: [
      ...queryKeys.translation.all,
      'all-batch',
      productIds.sort(),
      categoryIds.sort(),
      attributeIds.sort(),
      attributeValueIds.sort(),
      language,
    ],
    queryFn: async () => {
      const params = { lang: language };

      if (productIds.length > 0) params.product_ids = productIds.join(',');
      if (categoryIds.length > 0) params.category_ids = categoryIds.join(',');
      if (attributeIds.length > 0) params.attribute_ids = attributeIds.join(',');
      if (attributeValueIds.length > 0) params.attribute_value_ids = attributeValueIds.join(',');

      const response = await storefrontClient.get('/api/translations/all/batch', { params });

      return response.data.data || {
        products: {},
        categories: {},
        attributes: {},
        attribute_values: {},
      };
    },
    staleTime: 300000, // 5 minutes
    enabled: hasAnyIds,
    placeholderData: {
      products: {},
      categories: {},
      attributes: {},
      attribute_values: {},
    },
  });
}

/**
 * Prefetch translations for upcoming pages (pagination optimization)
 *
 * @example
 * const { prefetchProductTranslations } = usePrefetchTranslations();
 *
 * // On page 1, prefetch page 2 translations
 * useEffect(() => {
 *   if (nextPageProductIds.length > 0) {
 *     prefetchProductTranslations(nextPageProductIds, 'en');
 *   }
 * }, [nextPageProductIds]);
 */
export function usePrefetchTranslations() {
  const queryClient = useQueryClient();

  const prefetchProductTranslations = async (productIds, language = 'en') => {
    if (!productIds || productIds.length === 0) return;

    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.translation.all, 'products-batch', productIds.sort(), language],
      queryFn: async () => {
        const response = await storefrontClient.get('/api/translations/products/batch', {
          params: {
            ids: productIds.join(','),
            lang: language,
          },
        });
        return response.data.data || {};
      },
      staleTime: 300000,
    });
  };

  const prefetchCategoryTranslations = async (categoryIds, language = 'en') => {
    if (!categoryIds || categoryIds.length === 0) return;

    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.translation.all, 'categories-batch', categoryIds.sort(), language],
      queryFn: async () => {
        const response = await storefrontClient.get('/api/translations/categories/batch', {
          params: {
            ids: categoryIds.join(','),
            lang: language,
          },
        });
        return response.data.data || {};
      },
      staleTime: 600000,
    });
  };

  return {
    prefetchProductTranslations,
    prefetchCategoryTranslations,
  };
}

/**
 * Helper hook to extract product IDs from a products array
 * Useful for preparing batch translation requests
 *
 * @param {object[]} products - Array of product objects
 * @returns {string[]} Array of product IDs
 */
export function useExtractProductIds(products) {
  if (!products || !Array.isArray(products)) return [];
  return products.map((p) => p.id).filter(Boolean);
}

/**
 * Helper hook to extract attribute IDs from products
 * Extracts all unique attribute IDs from product attribute values
 *
 * @param {object[]} products - Array of product objects with attributeValues
 * @returns {object} { attributeIds, attributeValueIds }
 */
export function useExtractAttributeIds(products) {
  if (!products || !Array.isArray(products)) {
    return { attributeIds: [], attributeValueIds: [] };
  }

  const attributeIds = new Set();
  const attributeValueIds = new Set();

  products.forEach((product) => {
    if (product.attributeValues && Array.isArray(product.attributeValues)) {
      product.attributeValues.forEach((pav) => {
        if (pav.Attribute?.id) {
          attributeIds.add(pav.Attribute.id);
        }
        if (pav.value?.id) {
          attributeValueIds.add(pav.value.id);
        }
      });
    }
  });

  return {
    attributeIds: Array.from(attributeIds),
    attributeValueIds: Array.from(attributeValueIds),
  };
}
