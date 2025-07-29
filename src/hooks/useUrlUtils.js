/**
 * React hooks for URL utilities
 */
import { useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  parseFilterParams, 
  generateBreadcrumbs, 
  createCanonicalUrl,
  getCurrentUrlType,
  getStoreSlugFromPublicUrl,
  parseProductUrl,
  parseCategoryUrl,
  parseBrandUrl,
  parseCollectionUrl,
  parseSearchUrl
} from '@/utils/urlUtils';

/**
 * Hook to get current URL context and metadata
 */
export function useUrlContext() {
  const location = useLocation();
  
  return useMemo(() => {
    const urlType = getCurrentUrlType();
    const storeSlug = getStoreSlugFromPublicUrl(location.pathname);
    const productData = parseProductUrl(location.pathname);
    const categoryData = parseCategoryUrl(location.pathname);
    const brandData = parseBrandUrl(location.pathname);
    const collectionData = parseCollectionUrl(location.pathname);
    const searchData = parseSearchUrl(location.pathname);
    
    // Determine page type
    let pageType = 'unknown';
    if (productData) pageType = 'product';
    else if (categoryData) pageType = 'category';
    else if (brandData) pageType = 'brand';
    else if (collectionData) pageType = 'collection';
    else if (searchData) pageType = 'search';
    else if (location.pathname.endsWith('/cart')) pageType = 'cart';
    else if (location.pathname.endsWith('/checkout')) pageType = 'checkout';
    else if (location.pathname.includes('/account') || location.pathname.includes('/my-account')) pageType = 'account';
    else if (location.pathname.includes('/orders') || location.pathname.includes('/my-orders')) pageType = 'orders';
    else if (storeSlug && (location.pathname === `/public/${storeSlug}` || location.pathname === `/public/${storeSlug}/` || location.pathname.endsWith('/shop'))) pageType = 'storefront';
    
    return {
      urlType,
      storeSlug,
      pageType,
      productData,
      categoryData,
      brandData,
      collectionData,
      searchData,
      pathname: location.pathname,
      search: location.search
    };
  }, [location.pathname, location.search]);
}

/**
 * Hook to manage filter parameters for layered navigation
 */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters = useMemo(() => {
    return parseFilterParams(searchParams);
  }, [searchParams]);
  
  const updateFilter = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else if (Array.isArray(value)) {
      newParams.set(key, value.join(','));
    } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      newParams.set(key, `${value.min}-${value.max}`);
    } else {
      newParams.set(key, value.toString());
    }
    
    // Reset page when filters change
    if (key !== 'page') {
      newParams.delete('page');
    }
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  const clearFilter = useCallback((key) => {
    updateFilter(key, null);
  }, [updateFilter]);
  
  const clearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    // Preserve non-filter parameters like UTM
    const preserveParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
                           'gclid', 'fbclid', 'ref', 'referrer', 'affiliate_id'];
    
    preserveParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        newParams.set(param, value);
      }
    });
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    hasFilters: Object.keys(filters).length > 0
  };
}

/**
 * Hook to generate breadcrumbs for current page
 */
export function useBreadcrumbs() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    return generateBreadcrumbs(location.pathname, searchParams);
  }, [location.pathname, searchParams]);
}

/**
 * Hook to get canonical URL for SEO
 */
export function useCanonicalUrl() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    return createCanonicalUrl(location.pathname, searchParams);
  }, [location.pathname, searchParams]);
}

/**
 * Hook to manage pagination
 */
export function usePagination() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const setPage = useCallback((page) => {
    const newParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', page.toString());
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  return {
    currentPage,
    setPage
  };
}

/**
 * Hook to manage sorting
 */
export function useSorting() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentSort = searchParams.get('sort') || 'default';
  
  const setSort = useCallback((sort) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'default') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sort);
    }
    // Reset page when sort changes
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  return {
    currentSort,
    setSort
  };
}