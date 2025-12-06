/**
 * Domain Configuration - Single Source of Truth
 *
 * This file centralizes all domain-related logic for the frontend.
 * Import from here instead of duplicating domain checks across files.
 */

// Platform domains - these are our main application domains
export const PLATFORM_DOMAINS = [
  'dainostore.com',
  'daino.ai',
  'daino.store'
];

// Development/staging domains
export const DEV_DOMAINS = [
  'localhost',
  '127.0.0.1'
];

// Hosting provider domains
export const HOSTING_DOMAINS = [
  'vercel.app',
  'onrender.com'
];

/**
 * Check if hostname is a platform domain (dainostore.com, daino.ai, daino.store)
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean}
 */
export function isPlatformDomain(hostname = window.location.hostname) {
  return PLATFORM_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a development environment
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean}
 */
export function isDevDomain(hostname = window.location.hostname) {
  return DEV_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a hosting provider domain (vercel.app, onrender.com)
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean}
 */
export function isHostingDomain(hostname = window.location.hostname) {
  return HOSTING_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a custom store domain (not platform, dev, or hosting)
 * Custom domains are actual store domains like www.myshop.com
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean}
 */
export function isCustomDomain(hostname = window.location.hostname) {
  return !isPlatformDomain(hostname) &&
         !isDevDomain(hostname) &&
         !isHostingDomain(hostname);
}

/**
 * Check if we should use /public/:slug URL pattern
 * This is true for platform domains, dev domains, and hosting domains
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean}
 */
export function usePublicUrlPattern(hostname = window.location.hostname) {
  return !isCustomDomain(hostname);
}

/**
 * Get all platform domain variants (with and without www)
 * Useful for CORS and allowlists
 * @returns {string[]}
 */
export function getAllPlatformDomainVariants() {
  const variants = [];
  PLATFORM_DOMAINS.forEach(domain => {
    variants.push(domain);
    variants.push(`www.${domain}`);
  });
  return variants;
}

// ============================================================================
// Store Context Configuration - Single Source of Truth
// ============================================================================

/**
 * Paths that should NEVER load store context from localStorage
 * Add new paths here when they should render without store data
 */
export const NO_STORE_CONTEXT_PATHS = [
  '/admin/auth',
  '/auth',
  '/admin/onboarding',
  '/landing',
  '/Landing'
];

/**
 * Path prefixes that should skip StoreProvider (use StoreSelectionContext instead)
 * Admin pages use their own store context from localStorage
 */
export const SKIP_STORE_PROVIDER_PREFIXES = [
  '/admin',
  '/editor',
  '/plugins',
  '/ai-workspace'
];

/**
 * Check if the current page should skip loading store context
 * This is the SINGLE SOURCE OF TRUTH for this decision.
 *
 * Use this in:
 * - StoreProvider (to skip store initialization)
 * - Layout (to skip StoreProvider wrapper)
 * - Any component that needs to know if store context is available
 *
 * @param {string} pathname - Current path (e.g., location.pathname)
 * @param {string} hostname - Optional hostname, defaults to window.location.hostname
 * @returns {boolean} - true if store context should be skipped
 */
export function shouldSkipStoreContext(pathname, hostname = window.location.hostname) {
  // Check explicit paths that never need store context
  if (NO_STORE_CONTEXT_PATHS.includes(pathname)) {
    return true;
  }

  // Admin/editor pages use StoreSelectionContext, not StoreProvider
  if (SKIP_STORE_PROVIDER_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  // Platform domain homepage shows Landing page (no store context)
  const isPlatform = isPlatformDomain(hostname);
  if (isPlatform && pathname === '/') {
    return true;
  }

  return false;
}
