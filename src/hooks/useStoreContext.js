import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to detect store context from custom domain or URL path
 *
 * Returns:
 * - type: 'custom_domain' | 'url_path' | null
 * - domain: The custom domain (if applicable)
 * - storeCode: The store code from URL path (if applicable)
 * - isCustomDomain: Boolean indicating if on custom domain
 */
export const useStoreContext = () => {
  const location = useLocation();

  return useMemo(() => {
    const hostname = window.location.hostname;

    // Check if on custom domain (not platform domains)
    const isPlatformDomain =
      hostname.includes('vercel.app') ||
      hostname.includes('onrender.com') ||
      hostname.includes('localhost') ||
      hostname.includes('127.0.0.1');

    if (!isPlatformDomain) {
      // Custom domain detected
      return {
        type: 'custom_domain',
        domain: hostname,
        storeCode: null,
        isCustomDomain: true
      };
    }

    // Extract store code from URL path (/public/:storeCode)
    const pathMatch = location.pathname.match(/^\/public\/([^\/]+)/);
    if (pathMatch) {
      return {
        type: 'url_path',
        domain: null,
        storeCode: pathMatch[1],
        isCustomDomain: false
      };
    }

    // No store context detected
    return {
      type: null,
      domain: null,
      storeCode: null,
      isCustomDomain: false
    };
  }, [location.pathname]);
};

/**
 * Hook to get the base URL for the current store context
 *
 * Returns the base URL for routing (empty string for custom domains, /public/:storeCode for URL paths)
 */
export const useStoreBaseUrl = () => {
  const storeContext = useStoreContext();

  return useMemo(() => {
    if (storeContext.isCustomDomain) {
      return ''; // No prefix for custom domains
    }

    if (storeContext.storeCode) {
      return `/public/${storeContext.storeCode}`;
    }

    return '';
  }, [storeContext]);
};

export default useStoreContext;
