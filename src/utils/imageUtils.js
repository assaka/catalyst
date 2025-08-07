/**
 * Image utility functions for handling different image data structures
 */

/**
 * Get the primary image URL from a product's images array
 * Supports both legacy string arrays and new object arrays with isPrimary flag
 * @param {Array} images - Array of images (can be strings or objects)
 * @returns {string|null} - Primary image URL or null if no images
 */
export const getPrimaryImageUrl = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  // Handle legacy string array format
  if (typeof images[0] === 'string') {
    return images[0];
  }

  // Handle new object array format
  // First try to find the primary image
  const primaryImage = images.find(img => img?.isPrimary);
  if (primaryImage?.url) {
    return primaryImage.url;
  }

  // Fall back to first image with URL
  const firstImageWithUrl = images.find(img => img?.url);
  return firstImageWithUrl?.url || null;
};

/**
 * Get image URL by index, handling both string and object formats
 * @param {Array} images - Array of images
 * @param {number} index - Index of the image to get
 * @returns {string|null} - Image URL or null if not found
 */
export const getImageUrlByIndex = (images, index) => {
  if (!images || !Array.isArray(images) || images.length === 0 || index < 0 || index >= images.length) {
    return null;
  }

  const image = images[index];
  
  // Handle legacy string format
  if (typeof image === 'string') {
    return image;
  }

  // Handle new object format
  return image?.url || null;
};

/**
 * Get all image URLs from an images array
 * @param {Array} images - Array of images
 * @returns {Array<string>} - Array of image URLs
 */
export const getAllImageUrls = (images) => {
  if (!images || !Array.isArray(images)) {
    return [];
  }

  return images
    .map(image => typeof image === 'string' ? image : image?.url)
    .filter(Boolean);
};

/**
 * Get image alt text, with fallback to product name and index
 * @param {Object|string} image - Image object or URL string
 * @param {string} productName - Product name for fallback
 * @param {number} index - Image index for fallback
 * @returns {string} - Alt text for the image
 */
export const getImageAltText = (image, productName = 'Product', index = 0) => {
  // If image is an object with alt text, use it
  if (typeof image === 'object' && image?.alt) {
    return image.alt;
  }

  // Fall back to product name and index
  return index === 0 ? productName : `${productName} ${index + 1}`;
};

/**
 * Check if product has any images
 * @param {Array} images - Array of images
 * @returns {boolean} - True if product has images
 */
export const hasImages = (images) => {
  return images && Array.isArray(images) && images.length > 0 &&
    (typeof images[0] === 'string' || images[0]?.url);
};