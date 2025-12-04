/**
 * Domain Configuration - Single Source of Truth (Backend)
 *
 * This file centralizes all domain-related logic for the backend.
 * Import from here instead of duplicating domain checks across files.
 */

// Platform domains - these are our main application domains
const PLATFORM_DOMAINS = [
  'dainostore.com',
  'daino.ai',
  'daino.store'
];

// Development/staging domains
const DEV_DOMAINS = [
  'localhost',
  '127.0.0.1'
];

// Hosting provider domains
const HOSTING_DOMAINS = [
  'vercel.app',
  'onrender.com'
];

/**
 * Check if hostname is a platform domain (dainostore.com, daino.ai, daino.store)
 * @param {string} hostname
 * @returns {boolean}
 */
function isPlatformDomain(hostname) {
  if (!hostname) return false;
  return PLATFORM_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a development environment
 * @param {string} hostname
 * @returns {boolean}
 */
function isDevDomain(hostname) {
  if (!hostname) return false;
  return DEV_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a hosting provider domain (vercel.app, onrender.com)
 * @param {string} hostname
 * @returns {boolean}
 */
function isHostingDomain(hostname) {
  if (!hostname) return false;
  return HOSTING_DOMAINS.some(domain => hostname.includes(domain));
}

/**
 * Check if hostname is a custom store domain (not platform, dev, or hosting)
 * @param {string} hostname
 * @returns {boolean}
 */
function isCustomDomain(hostname) {
  if (!hostname) return false;
  return !isPlatformDomain(hostname) &&
         !isDevDomain(hostname) &&
         !isHostingDomain(hostname);
}

/**
 * Check if hostname is allowed (platform, dev, or hosting domain)
 * Used for CORS and other security checks
 * @param {string} hostname
 * @returns {boolean}
 */
function isAllowedDomain(hostname) {
  return isPlatformDomain(hostname) ||
         isDevDomain(hostname) ||
         isHostingDomain(hostname);
}

/**
 * Get all platform domain variants (with and without www)
 * @returns {string[]}
 */
function getAllPlatformDomainVariants() {
  const variants = [];
  PLATFORM_DOMAINS.forEach(domain => {
    variants.push(domain);
    variants.push(`www.${domain}`);
  });
  return variants;
}

module.exports = {
  PLATFORM_DOMAINS,
  DEV_DOMAINS,
  HOSTING_DOMAINS,
  isPlatformDomain,
  isDevDomain,
  isHostingDomain,
  isCustomDomain,
  isAllowedDomain,
  getAllPlatformDomainVariants
};
