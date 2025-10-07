/**
 * Transforms responsive Tailwind classes based on viewport mode for editor simulation
 * Only active in editor context - storefront uses native responsive classes
 */

/**
 * Transform responsive classes based on viewport mode
 * @param {string} className - Original class string
 * @param {string} viewportMode - Current viewport mode ('desktop', 'tablet', 'mobile')
 * @param {string} context - Rendering context ('editor' or 'storefront')
 * @returns {string} Transformed class string
 */
export function transformResponsiveClasses(className, viewportMode = 'desktop', context = 'storefront') {
  // Only transform in editor context
  if (context !== 'editor' || !className) {
    return className;
  }

  // Desktop mode - use classes as-is
  if (viewportMode === 'desktop') {
    return className;
  }

  // Get viewport breakpoint width
  const breakpoints = {
    mobile: 640,   // sm: breakpoint
    tablet: 768,   // md: breakpoint
    desktop: 1024  // lg: breakpoint
  };

  const currentWidth = breakpoints[viewportMode] || breakpoints.desktop;

  // Split classes and transform each one
  const classes = className.split(' ').map(cls => {
    // Handle responsive prefix classes (sm:, md:, lg:, xl:, 2xl:)
    const responsiveMatch = cls.match(/^(sm|md|lg|xl|2xl):(.+)$/);

    if (!responsiveMatch) {
      return cls; // No responsive prefix, keep as-is
    }

    const [, breakpoint, baseClass] = responsiveMatch;

    // Breakpoint pixel values
    const breakpointWidths = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };

    const breakpointWidth = breakpointWidths[breakpoint];

    // If current viewport width >= breakpoint width, apply the class
    if (currentWidth >= breakpointWidth) {
      return baseClass;
    } else {
      // Viewport is smaller than breakpoint, don't apply this class
      return null;
    }
  }).filter(Boolean); // Remove null values

  return classes.join(' ');
}

/**
 * Transform colSpan values based on viewport mode
 * @param {object} colSpan - Original colSpan object (e.g., {grid: 'col-span-12 sm:col-span-9'})
 * @param {string} viewportMode - Current viewport mode
 * @param {string} viewMode - Current view mode (grid/list)
 * @param {string} context - Rendering context
 * @returns {string} Transformed colSpan class string
 */
export function transformColSpan(colSpan, viewportMode = 'desktop', viewMode = 'grid', context = 'storefront') {
  if (context !== 'editor' || !colSpan) {
    return colSpan[viewMode] || colSpan.default || '';
  }

  const colSpanValue = colSpan[viewMode] || colSpan.default || '';
  return transformResponsiveClasses(colSpanValue, viewportMode, context);
}
