// Universal redirect checking utility
export const checkForRedirect = async (path, storeId) => {
  if (!storeId || !path) return null;
  
  try {
    const response = await fetch(`/api/redirects/check?store_id=${storeId}&path=${encodeURIComponent(path)}`);
    if (response.ok) {
      const data = await response.json();
      return data.found ? data.to_url : null;
    }
  } catch (error) {
    console.warn('Error checking for redirect:', error);
  }
  return null;
};

// Check multiple path variations for a redirect
export const checkMultiplePathsForRedirect = async (paths, storeId) => {
  for (const path of paths) {
    const redirectTo = await checkForRedirect(path, storeId);
    if (redirectTo) {
      return redirectTo;
    }
  }
  return null;
};

// Extract the slug from a redirect URL
export const extractSlugFromRedirectUrl = (redirectUrl, prefix) => {
  // Remove common prefixes
  const prefixes = ['/category/', '/c/', '/product/', '/p/', '/page/'];
  let slug = redirectUrl;
  
  for (const p of prefixes) {
    if (slug.startsWith(p)) {
      slug = slug.substring(p.length);
      break;
    }
  }
  
  // If a specific prefix was requested, remove it too
  if (prefix && slug.startsWith(prefix)) {
    slug = slug.substring(prefix.length);
  }
  
  return slug;
};

// Get possible URL paths for different content types
export const getPossiblePaths = (type, slug) => {
  switch (type) {
    case 'category':
      return [`/category/${slug}`, `/c/${slug}`];
    case 'product':
      return [`/product/${slug}`, `/p/${slug}`];
    case 'cms':
      return [`/page/${slug}`, `/${slug}`];
    default:
      return [`/${slug}`];
  }
};