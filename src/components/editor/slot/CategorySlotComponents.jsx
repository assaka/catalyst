/**
 * Category Slot Components
 * Register category-specific slot components with the unified registry
 */

import React, { useRef, useEffect } from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import BreadcrumbRendererComponent from '@/components/storefront/BreadcrumbRenderer';
import { useStore } from '@/components/storefront/StoreProvider';
import { UnifiedSlotRenderer } from './UnifiedSlotRenderer';
import { processVariables } from '@/utils/variableProcessor';

// Breadcrumb Navigation Component
const BreadcrumbRenderer = createSlotComponent({
  name: 'BreadcrumbRenderer',
  render: ({ slot, className, styles, categoryContext, variableContext }) => {
    // Get configuration from slot metadata
    const breadcrumbConfig = slot?.metadata?.breadcrumbConfig || {};

    // Get styles from breadcrumb_styles slot
    const breadcrumbStyles =
      categoryContext?.breadcrumbStyles || // Directly passed
      categoryContext?.slots?.breadcrumb_styles?.styles || // From slots
      {}; // Fallback

    const {
      category,
      breadcrumbs = [],
      store,
      categories = [],
      settings = {}
    } = categoryContext || {};

    // Use the actual BreadcrumbRenderer component with configuration
    return (
      <BreadcrumbRendererComponent
        items={breadcrumbs.length > 0 ? breadcrumbs : undefined}
        pageType="category"
        pageData={category}
        storeCode={store?.slug || store?.code}
        categories={categories}
        settings={settings}
        breadcrumbConfig={breadcrumbConfig}
        breadcrumbStyles={breadcrumbStyles}
        className={className || slot?.className}
      />
    );
  }
});

// Active Filters Component with processVariables
const ActiveFilters = createSlotComponent({
  name: 'ActiveFilters',
  render: ({ slot, className, styles, categoryContext, variableContext, context }) => {
    const containerRef = useRef(null);

    console.log('🔍 ActiveFilters component rendering:', {
      hasVariableContext: !!variableContext,
      activeFiltersCount: variableContext?.activeFilters?.length,
      activeFilters: variableContext?.activeFilters,
      slotContent: slot?.content?.substring(0, 100)
    });

    // Use template from slot.content or fallback
    const template = slot?.content || `
      {{#if activeFilters}}
        <div class="mb-4">
          <div class="flex flex-wrap gap-2">
            {{#each activeFilters}}
              <div class="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span>{{this.label}}: {{this.value}}</span>
                <button class="ml-1 hover:text-blue-900"
                        data-action="remove-filter"
                        data-filter-type="{{this.type}}"
                        data-filter-value="{{this.value}}">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            {{/each}}
            {{#if (gt activeFilters.length 1)}}
              <button class="text-sm text-red-600 hover:text-red-800 underline ml-2"
                      data-action="clear-all-filters">
                Clear All
              </button>
            {{/if}}
          </div>
        </div>
      {{/if}}
    `;

    const html = processVariables(template, variableContext);

    console.log('🔍 ActiveFilters processed HTML:', html.substring(0, 200));

    // Attach event listeners in storefront
    useEffect(() => {
      if (!containerRef.current || context === 'editor') return;

      const handleClick = (e) => {
        const removeBtn = e.target.closest('[data-action="remove-filter"]');
        const clearAllBtn = e.target.closest('[data-action="clear-all-filters"]');

        if (removeBtn && categoryContext?.handleFilterChange) {
          const filterType = removeBtn.getAttribute('data-filter-type');
          const filterValue = removeBtn.getAttribute('data-filter-value');
          const attributeCode = removeBtn.getAttribute('data-attribute-code');

          // Get current filters
          const currentFilters = categoryContext.selectedFilters || {};

          if (filterType === 'attribute' && attributeCode) {
            // Remove this specific value from the attribute's array
            const currentValues = currentFilters[attributeCode] || [];
            const newValues = currentValues.filter(v => v !== filterValue);

            const newFilters = { ...currentFilters };
            if (newValues.length > 0) {
              newFilters[attributeCode] = newValues;
            } else {
              delete newFilters[attributeCode];
            }

            categoryContext.handleFilterChange(newFilters);
          }
        } else if (clearAllBtn && categoryContext?.clearFilters) {
          categoryContext.clearFilters();
        }
      };

      containerRef.current.addEventListener('click', handleClick);
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('click', handleClick);
        }
      };
    }, [categoryContext, context]);

    return (
      <div ref={containerRef} className={className || slot.className} style={styles || slot.styles}
           dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
});

// Layered Navigation Component with processVariables
const LayeredNavigation = createSlotComponent({
  name: 'LayeredNavigation',
  render: ({ slot, className, styles, categoryContext, variableContext, context }) => {
    const containerRef = useRef(null);

    // Use template from slot.content or fallback
    const template = slot?.content || `
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">Filter By</h3>
        <div>
          <h4 class="font-medium text-gray-700 mb-2">Price</h4>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" class="mr-2" />
              <span class="text-sm">Under $25</span>
            </label>
          </div>
        </div>
      </div>
    `;

    const html = processVariables(template, variableContext);

    // Attach event listeners in storefront
    useEffect(() => {
      if (!containerRef.current || context === 'editor') return;

      const handleChange = (e) => {
        const checkbox = e.target.closest('[data-action="toggle-filter"]');
        if (!checkbox || !categoryContext?.handleFilterChange) return;

        const filterType = checkbox.getAttribute('data-filter-type');
        const filterValue = checkbox.getAttribute('data-filter-value');
        const attributeCode = checkbox.getAttribute('data-attribute-code');

        // Get current filters from categoryContext
        const currentFilters = categoryContext.selectedFilters || {};

        if (filterType === 'attribute' && attributeCode) {
          // Handle attribute filter (color, size, brand, etc.)
          const currentValues = currentFilters[attributeCode] || [];
          let newValues;

          if (checkbox.checked) {
            newValues = [...currentValues, filterValue];
          } else {
            newValues = currentValues.filter(v => v !== filterValue);
          }

          const newFilters = { ...currentFilters };
          if (newValues.length > 0) {
            newFilters[attributeCode] = newValues;
          } else {
            delete newFilters[attributeCode];
          }

          categoryContext.handleFilterChange(newFilters);
        }
      };

      const updatePriceSliderTrack = () => {
        const minSlider = containerRef.current.querySelector('#price-slider-min');
        const maxSlider = containerRef.current.querySelector('#price-slider-max');
        const rangeTrack = containerRef.current.querySelector('#price-range-track');

        if (!minSlider || !maxSlider || !rangeTrack) return;

        // Get min/max from attributes (now clean numbers without currency)
        let min = parseInt(minSlider.getAttribute('min'));
        let max = parseInt(minSlider.getAttribute('max'));

        // If still not found, use current slider values as boundaries
        if (!min || isNaN(min)) {
          min = 0;
        }
        if (!max || isNaN(max)) {
          max = 100;
        }

        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        console.log('🔍 updatePriceSliderTrack:', { min, max, minValue, maxValue });

        const percentMin = ((minValue - min) / (max - min)) * 100;
        const percentMax = ((maxValue - min) / (max - min)) * 100;
        rangeTrack.style.left = percentMin + '%';
        rangeTrack.style.width = (percentMax - percentMin) + '%';
      };

      const handlePriceSlider = (e) => {
        const slider = e.target.closest('[data-action="price-slider"]');
        if (!slider || !categoryContext?.handleFilterChange) return;

        const sliderType = slider.getAttribute('data-slider-type');
        const value = parseInt(slider.value);

        const minSlider = containerRef.current.querySelector('#price-slider-min');
        const maxSlider = containerRef.current.querySelector('#price-slider-max');
        const selectedMin = containerRef.current.querySelector('#selected-min');
        const selectedMax = containerRef.current.querySelector('#selected-max');

        if (!minSlider || !maxSlider) return;

        let minValue = parseInt(minSlider.value);
        let maxValue = parseInt(maxSlider.value);

        // Update values based on which slider moved
        if (sliderType === 'min') {
          minValue = Math.min(value, maxValue);
          minSlider.value = minValue;
        } else {
          maxValue = Math.max(value, minValue);
          maxSlider.value = maxValue;
        }

        // Update display
        if (selectedMin) selectedMin.textContent = minValue;
        if (selectedMax) selectedMax.textContent = maxValue;

        // Update the colored track between thumbs
        updatePriceSliderTrack();

        // Update filters
        const currentFilters = categoryContext.selectedFilters || {};
        const newFilters = { ...currentFilters };
        newFilters.priceRange = [minValue, maxValue];
        categoryContext.handleFilterChange(newFilters);
      };

      // Initialize slider track position and values on mount
      const initSlider = () => {
        const minSlider = containerRef.current?.querySelector('#price-slider-min');
        const maxSlider = containerRef.current?.querySelector('#price-slider-max');

        if (minSlider && maxSlider) {
          console.log('🔍 Initial slider HTML attributes:', {
            minAttr: minSlider.getAttribute('min'),
            maxAttr: minSlider.getAttribute('max'),
            minValue: minSlider.getAttribute('value'),
            maxValue: maxSlider.getAttribute('value'),
            minDataMin: minSlider.dataset.min,
            minDataMax: minSlider.dataset.max,
            outerHTML: minSlider.outerHTML.substring(0, 200)
          });

          // Get min/max from attributes or data attributes (now clean numbers)
          let min = parseInt(minSlider.getAttribute('min'));
          let max = parseInt(minSlider.getAttribute('max'));

          // Fallback to value attributes if min/max not set
          if (!min || isNaN(min)) {
            min = parseInt(minSlider.getAttribute('value')) || 0;
          }
          if (!max || isNaN(max)) {
            max = parseInt(maxSlider.getAttribute('value')) || 100;
          }

          console.log('🔍 Calculated min/max:', { min, max });

          // Set attributes if they're missing
          if (!minSlider.getAttribute('min') || minSlider.getAttribute('min') === 'null') {
            console.log('🔍 Setting min attribute to:', min);
            minSlider.setAttribute('min', min);
            maxSlider.setAttribute('min', min);
          }
          if (!minSlider.getAttribute('max') || minSlider.getAttribute('max') === 'null') {
            console.log('🔍 Setting max attribute to:', max);
            minSlider.setAttribute('max', max);
            maxSlider.setAttribute('max', max);
          }

          // Set initial values
          if (!minSlider.value || minSlider.value === '0' || minSlider.value === '50') {
            minSlider.value = min;
          }
          if (!maxSlider.value || maxSlider.value === '0' || maxSlider.value === '50') {
            maxSlider.value = max;
          }

          console.log('🔍 Price slider initialized:', {
            minValue: minSlider.value,
            maxValue: maxSlider.value,
            minAttr: min,
            maxAttr: max,
            htmlMin: minSlider.getAttribute('min'),
            htmlMax: minSlider.getAttribute('max')
          });

          updatePriceSliderTrack();
        }
      };

      // Initialize max visible attributes
      const initMaxVisibleAttributes = () => {
        const filterContents = containerRef.current?.querySelectorAll('[data-max-visible]');

        filterContents?.forEach(filterContent => {
          const maxVisible = parseInt(filterContent.getAttribute('data-max-visible'));
          const attributeCode = filterContent.getAttribute('data-attribute-code');

          console.log('🔍 Init max visible for:', attributeCode, 'max:', maxVisible);

          // Only apply if maxVisible is a valid number and > 0
          if (!maxVisible || isNaN(maxVisible) || maxVisible <= 0) {
            return;
          }

          const allOptions = filterContent.querySelectorAll('.filter-option');
          const showMoreBtn = filterContent.querySelector('.show-more-btn');

          // Hide options beyond max visible
          allOptions.forEach((option, index) => {
            if (index >= maxVisible) {
              option.classList.add('hidden');
            }
          });

          // Show "Show More" button if there are hidden options
          if (allOptions.length > maxVisible && showMoreBtn) {
            showMoreBtn.classList.remove('hidden');
          }
        });
      };

      setTimeout(() => {
        initSlider();
        initMaxVisibleAttributes();
      }, 100);

      // Handle filter section toggle (collapse/expand)
      const handleToggleSection = (e) => {
        const button = e.target.closest('[data-action="toggle-filter-section"]');
        if (!button) return;

        const section = button.getAttribute('data-section');
        const filterSection = button.closest('[data-filter-section]');
        const filterContent = filterSection?.querySelector('.filter-content');
        const chevron = button.querySelector('.filter-chevron');

        if (filterContent) {
          const isHidden = filterContent.style.display === 'none';
          filterContent.style.display = isHidden ? 'block' : 'none';

          if (chevron) {
            if (isHidden) {
              chevron.classList.add('rotate-180');
            } else {
              chevron.classList.remove('rotate-180');
            }
          }
        }
      };

      // Handle Show More / Show Less toggle
      const handleShowMore = (e) => {
        const button = e.target.closest('[data-action="toggle-show-more"]');
        if (!button) return;

        const attributeCode = button.getAttribute('data-attribute-code');
        const filterContent = containerRef.current.querySelector(`[data-attribute-code="${attributeCode}"]`);

        if (!filterContent) return;

        const maxVisible = parseInt(filterContent.getAttribute('data-max-visible')) || 5;
        const allOptions = filterContent.querySelectorAll('.filter-option');
        const isShowingMore = button.textContent.trim() === 'Show More';

        allOptions.forEach((option, index) => {
          if (index >= maxVisible) {
            if (isShowingMore) {
              option.classList.remove('hidden');
            } else {
              option.classList.add('hidden');
            }
          }
        });

        button.textContent = isShowingMore ? 'Show Less' : 'Show More';
      };

      containerRef.current.addEventListener('change', handleChange);
      containerRef.current.addEventListener('input', handlePriceSlider);
      containerRef.current.addEventListener('click', handleToggleSection);
      containerRef.current.addEventListener('click', handleShowMore);

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('change', handleChange);
          containerRef.current.removeEventListener('input', handlePriceSlider);
          containerRef.current.removeEventListener('click', handleToggleSection);
          containerRef.current.removeEventListener('click', handleShowMore);
        }
      };
    }, [categoryContext, context]);

    return (
      <div ref={containerRef} className={className || slot.className} style={styles || slot.styles}
           dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
});

// Sort Selector Component with processVariables
const SortSelector = createSlotComponent({
  name: 'SortSelector',
  render: ({ slot, className, styles, categoryContext, variableContext, context }) => {
    const containerRef = useRef(null);

    // Use template from slot.content or fallback
    const template = slot?.content || `
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700 font-medium">Sort by:</label>
        <select class="border border-gray-300 rounded px-3 py-1.5 text-sm"
                data-action="change-sort">
          <option value="position">Position</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="price_asc">Price (Low to High)</option>
        </select>
      </div>
    `;

    const html = processVariables(template, variableContext);

    // Attach event listeners in storefront
    useEffect(() => {
      if (!containerRef.current || context === 'editor') return;

      const selectElement = containerRef.current.querySelector('[data-action="change-sort"]');
      if (!selectElement) return;

      const handleChange = (e) => {
        if (categoryContext?.handleSortChange) {
          categoryContext.handleSortChange(e.target.value);
        }
      };

      selectElement.addEventListener('change', handleChange);
      return () => {
        selectElement.removeEventListener('change', handleChange);
      };
    }, [categoryContext, context]);

    return (
      <div ref={containerRef} className={className || slot.className} style={styles || slot.styles}
           dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
});

// Pagination Component with processVariables
const PaginationComponent = createSlotComponent({
  name: 'PaginationComponent',
  render: ({ slot, className, styles, categoryContext, variableContext, context }) => {
    const containerRef = useRef(null);

    // Use template from slot.content or fallback
    const template = slot?.content || `
      <div class="flex justify-center mt-8">
        <nav class="flex items-center gap-1">
          <button class="px-3 py-2 border rounded hover:bg-gray-50"
                  data-action="go-to-page"
                  data-page="prev">
            Previous
          </button>
          <span class="px-3 py-2">1 of 10</span>
          <button class="px-3 py-2 border rounded hover:bg-gray-50"
                  data-action="go-to-page"
                  data-page="next">
            Next
          </button>
        </nav>
      </div>
    `;

    const html = processVariables(template, variableContext);

    // Attach event listeners in storefront
    useEffect(() => {
      if (!containerRef.current || context === 'editor') return;

      const handleClick = (e) => {
        const button = e.target.closest('[data-action="go-to-page"]');
        if (!button || !categoryContext?.handlePageChange) return;

        const page = button.getAttribute('data-page');
        if (page === 'prev' || page === 'next') {
          // Handle prev/next
          const currentPage = categoryContext.currentPage || 1;
          const newPage = page === 'prev' ? currentPage - 1 : currentPage + 1;
          categoryContext.handlePageChange(newPage);
        } else {
          // Handle specific page number
          const pageNum = parseInt(page, 10);
          if (!isNaN(pageNum)) {
            categoryContext.handlePageChange(pageNum);
          }
        }
      };

      containerRef.current.addEventListener('click', handleClick);
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('click', handleClick);
        }
      };
    }, [categoryContext, context]);

    return (
      <div ref={containerRef} className={className || slot.className} style={styles || slot.styles}
           dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
});

// CMS Block Renderer (already exists, just register it)
const CmsBlockComponent = createSlotComponent({
  name: 'CmsBlockRenderer',
  render: ({ slot, className, styles }) => {
    const position = slot.metadata?.cmsPosition || slot.id || 'default';
    return (
      <div className={className || slot.className} style={styles || slot.styles}>
        <CmsBlockRenderer position={position} />
      </div>
    );
  }
});

// Helper function to generate grid classes from store settings
const getGridClasses = (storeSettings) => {
  const gridConfig = storeSettings?.product_grid;

  if (!gridConfig) {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  }

  const breakpoints = gridConfig.breakpoints || {};
  const customBreakpoints = gridConfig.customBreakpoints || [];
  let classes = [];

  // Standard breakpoints
  Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
    if (columns > 0) {
      if (breakpoint === 'default') {
        if (columns === 1) classes.push('grid-cols-1');
        else if (columns === 2) classes.push('grid-cols-2');
      } else {
        if (columns === 1) classes.push(`${breakpoint}:grid-cols-1`);
        else if (columns === 2) classes.push(`${breakpoint}:grid-cols-2`);
        else if (columns === 3) classes.push(`${breakpoint}:grid-cols-3`);
        else if (columns === 4) classes.push(`${breakpoint}:grid-cols-4`);
        else if (columns === 5) classes.push(`${breakpoint}:grid-cols-5`);
        else if (columns === 6) classes.push(`${breakpoint}:grid-cols-6`);
      }
    }
  });

  // Custom breakpoints
  customBreakpoints.forEach(({ name, columns }) => {
    if (name && columns > 0) {
      if (columns === 1) classes.push(`${name}:grid-cols-1`);
      else if (columns === 2) classes.push(`${name}:grid-cols-2`);
      else if (columns === 3) classes.push(`${name}:grid-cols-3`);
      else if (columns === 4) classes.push(`${name}:grid-cols-4`);
      else if (columns === 5) classes.push(`${name}:grid-cols-5`);
      else if (columns === 6) classes.push(`${name}:grid-cols-6`);
    }
  });

  return classes.length > 0 ? classes.join(' ') : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
};

// Product Count Info Component
const ProductCountInfo = createSlotComponent({
  name: 'ProductCountInfo',
  render: ({ slot, className, styles, categoryContext, variableContext }) => {
    // Use template from slot.content or fallback
    const template = slot?.content || `
      <div class="text-sm text-gray-600">
        Showing {{pagination.start}}-{{pagination.end}} of {{pagination.total}} products
      </div>
    `;

    const html = processVariables(template, variableContext);

    return (
      <div className={className || slot.className} style={styles || slot.styles}
           dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
});

// Product Items Grid - Renders with dynamic grid from admin settings
const ProductItemsGrid = createSlotComponent({
  name: 'ProductItemsGrid',
  render: ({ slot, className, styles, context, categoryContext, variableContext }) => {
    const containerRef = useRef(null);

    if (context === 'editor') {
      // Editor version - simplified container for slot arrangement
      return (
        <div
          className={`${className || slot.className || ''}`}
          style={styles || slot.styles}
        >
          {/* In editor, let the grid system handle layout - just show placeholder */}
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            Product Items Grid
            <div className="text-xs mt-1">Configure grid layout in Admin → Store → Theme & Layout</div>
          </div>
        </div>
      );
    }

    // Storefront version - uses template with processVariables
    const storeContext = useStore();
    const storeSettings = storeContext?.settings || null;
    const gridClasses = getGridClasses(storeSettings);

    // Use template from slot.content or fallback
    const template = slot?.content || `
      <div class="products-grid-container">
        {{#each products}}
          <div class="group overflow-hidden rounded-lg border bg-card p-4 product-card"
               data-product-id="{{this.id}}">
            <div class="relative overflow-hidden mb-4">
              <img src="{{this.image_url}}" alt="{{this.name}}"
                   class="w-full h-48 object-cover" />
            </div>
            <h3 class="font-semibold text-lg mb-2">{{this.name}}</h3>
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-lg font-bold text-green-600">{{this.formatted_price}}</span>
            </div>
            <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-md"
                    data-action="add-to-cart"
                    data-product-id="{{this.id}}">
              Add to Cart
            </button>
          </div>
        {{/each}}
      </div>
    `;

    const html = processVariables(template, variableContext);

    // Attach event listeners in storefront
    useEffect(() => {
      if (!containerRef.current || context === 'editor') return;

      const handleClick = (e) => {
        const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
        if (!addToCartBtn) return;

        const productId = addToCartBtn.getAttribute('data-product-id');
        if (productId && categoryContext?.onProductClick) {
          categoryContext.onProductClick(productId);
        }
      };

      containerRef.current.addEventListener('click', handleClick);
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('click', handleClick);
        }
      };
    }, [categoryContext, context]);

    return (
      <div
        ref={containerRef}
        className={`grid ${gridClasses} gap-4 ${className || slot.className || ''}`}
        style={styles || slot.styles}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
});

// Register all components
registerSlotComponent('BreadcrumbRenderer', BreadcrumbRenderer);
registerSlotComponent('ActiveFilters', ActiveFilters);
registerSlotComponent('LayeredNavigation', LayeredNavigation);
registerSlotComponent('SortSelector', SortSelector);
registerSlotComponent('PaginationComponent', PaginationComponent);
registerSlotComponent('ProductCountInfo', ProductCountInfo);
registerSlotComponent('CmsBlockRenderer', CmsBlockComponent);
registerSlotComponent('ProductItemsGrid', ProductItemsGrid);

export {
  BreadcrumbRenderer,
  ActiveFilters,
  LayeredNavigation,
  SortSelector,
  PaginationComponent,
  ProductCountInfo,
  CmsBlockComponent,
  ProductItemsGrid
};