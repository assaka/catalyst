


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
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