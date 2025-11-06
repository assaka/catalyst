
// Re-export URL utilities from urlUtils.js
export { createPublicUrl, createAdminUrl, createProductUrl, createCategoryUrl } from './urlUtils';

export function createPageUrl(pageName: string) {
    // Use /admin prefix for admin pages
    // Convert to lowercase and replace both spaces and underscores with dashes
    const page = pageName.toLowerCase().replace(/[ _]/g, '-');
    return `/admin/${page}`;
}

// Create store-aware URLs for storefront pages
export function createStoreUrl(storeSlug: string, pageName: string) {
    const page = pageName.toLowerCase().replace(/ /g, '-');
    return `/${storeSlug}/${page}`;
}

// Get store slug from current URL
export function getStoreSlugFromUrl(pathname: string): string | null {
    const storeSlugMatch = pathname.match(/^\/([^\/]+)\/(storefront|productdetail|cart|checkout|order-success|ordersuccess)/);
    return storeSlugMatch ? storeSlugMatch[1] : null;
}