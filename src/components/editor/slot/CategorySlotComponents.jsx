/**
 * Category Slot Components
 * Register category-specific slot components with the unified registry
 */

import React, { useRef, useEffect, Fragment } from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStore } from '@/components/storefront/StoreProvider';
import { UnifiedSlotRenderer } from './UnifiedSlotRenderer';
import { processVariables } from '@/utils/variableProcessor';
import { Home } from 'lucide-react';
import { buildBreadcrumbs } from '@/utils/breadcrumbUtils';

// Simple Category Breadcrumbs Component - reads colors from category-config.js metadata
const CategoryBreadcrumbs = createSlotComponent({
  name: 'CategoryBreadcrumbs',
  render: (props) => {
    const { slot, categoryContext } = props;
    const { category, store, categories = [], settings = {} } = categoryContext || {};

    // Get colors from slot metadata (set in category-config.js)
    const itemTextColor = slot?.metadata?.itemTextColor || '#A855F7';
    const itemHoverColor = slot?.metadata?.itemHoverColor || '#9333EA';
    const activeItemColor = slot?.metadata?.activeItemColor || '#DC2626';
    const separatorColor = slot?.metadata?.separatorColor || '#9CA3AF';
    const fontSize = slot?.metadata?.fontSize || '0.875rem';
    const fontWeight = slot?.metadata?.fontWeight || '400';

    // Build breadcrumbs
    const breadcrumbItems = buildBreadcrumbs('category', category, store?.slug || store?.code, categories, settings);

    if (!breadcrumbItems || breadcrumbItems.length === 0) return null;

    return (
      <nav className="flex items-center space-x-2 text-sm mb-6">
        {/* Home Link */}
        <a
          href="/"
          style={{ color: itemTextColor, fontSize, fontWeight }}
          className="flex items-center hover:underline"
          onMouseEnter={(e) => e.target.style.color = itemHoverColor}
          onMouseLeave={(e) => e.target.style.color = itemTextColor}
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </a>
        <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>/</span>

        {/* Breadcrumb Items */}
        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            {item.url ? (
              <a
                href={item.url}
                style={{ color: itemTextColor, fontSize, fontWeight }}
                className="hover:underline whitespace-nowrap"
                onMouseEnter={(e) => e.target.style.color = itemHoverColor}
                onMouseLeave={(e) => e.target.style.color = itemTextColor}
              >
                {item.name}
              </a>
            ) : (
              <span
                style={{ color: activeItemColor, fontSize, fontWeight: '500' }}
                className="whitespace-nowrap"
              >
                {item.name}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>/</span>
            )}
          </Fragment>
        ))}
      </nav>
    );
  }
});

// Simple Product Breadcrumbs Component - reads colors from product-config.js metadata
const ProductBreadcrumbs = createSlotComponent({
  name: 'ProductBreadcrumbs',
  render: (props) => {
    const { slot, productContext } = props;
    const { product, store, categories = [], settings = {} } = productContext || {};

    // Get colors from slot metadata (set in product-config.js)
    const itemTextColor = slot?.metadata?.itemTextColor || '#22C55E';
    const itemHoverColor = slot?.metadata?.itemHoverColor || '#16A34A';
    const activeItemColor = slot?.metadata?.activeItemColor || '#DC2626';
    const separatorColor = slot?.metadata?.separatorColor || '#9CA3AF';
    const fontSize = slot?.metadata?.fontSize || '0.875rem';
    const fontWeight = slot?.metadata?.fontWeight || '700';

    // Build breadcrumbs
    const breadcrumbItems = buildBreadcrumbs('product', product, store?.slug || store?.code, categories, settings);

    if (!breadcrumbItems || breadcrumbItems.length === 0) return null;

    return (
      <nav className="flex items-center space-x-2 text-sm mb-6">
        {/* Home Link */}
        <a
          href="/"
          style={{ color: itemTextColor, fontSize, fontWeight }}
          className="flex items-center hover:underline"
          onMouseEnter={(e) => e.target.style.color = itemHoverColor}
          onMouseLeave={(e) => e.target.style.color = itemTextColor}
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </a>
        <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>/</span>

        {/* Breadcrumb Items */}
        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            {item.url ? (
              <a
                href={item.url}
                style={{ color: itemTextColor, fontSize, fontWeight }}
                className="hover:underline whitespace-nowrap"
                onMouseEnter={(e) => e.target.style.color = itemHoverColor}
                onMouseLeave={(e) => e.target.style.color = itemTextColor}
              >
                {item.name}
              </a>
            ) : (
              <span
                style={{ color: activeItemColor, fontSize, fontWeight: '500' }}
                className="whitespace-nowrap"
              >
                {item.name}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span style={{ color: separatorColor, fontSize, margin: '0 0.5rem' }}>/</span>
            )}
          </Fragment>
        ))}
      </nav>
    );
  }
});

// Active Filters Component with processVariables
const ActiveFilters = createSlotComponent({
  name: 'ActiveFilters',
  render: ({ slot, className, styles, categoryContext, variableContext, context }) => {
    const containerRef = useRef(null);

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
  render: ({ slot, className, styles, categoryContext, variableContext, context, onSlotUpdate, allSlots }) => {
    const containerRef = useRef(null);

    console.log('🔍🔍🔍 LayeredNavigation CALLED - context:', context);

    if (context === 'editor') {
      // Editor version - render filter elements as individual editable slot instances
      const filters = categoryContext?.filters || { attributes: [] };

      console.log('🔍 LayeredNavigation render in EDITOR mode:', {
        hasFilters: !!filters,
        attributesCount: filters?.attributes?.length,
        attributes: filters?.attributes,
        hasCategoryContext: !!categoryContext,
        filterableAttributesCount: categoryContext?.filterableAttributes?.length,
        allFilters: filters
      });

      // Get shared attribute filter label configuration from category-config.js
      const attributeFilterLabelSlot = allSlots?.attribute_filter_label || {};
      const sharedLabelClassName = attributeFilterLabelSlot.className || 'font-semibold text-base text-gray-900';
      const sharedLabelStyles = attributeFilterLabelSlot.styles || {};

      // Create dynamic slot instances for filter elements
      const filterSlotInstances = {};

      // Filter heading
      filterSlotInstances['filter_heading_instance'] = {
        id: 'filter_heading_instance',
        type: 'text',
        content: 'Filter By',
        className: 'text-lg font-semibold text-gray-900 mb-4',
        styles: {},
        parentId: 'layered_navigation',
        metadata: {
          microslot: true,
          editable: true,
          resizable: true,
          draggable: true,
          htmlTag: 'h3'
        }
      };

      // Shared Attribute Filter Label (editable, mirrors to all attribute filters)
      // This renders the attribute_filter_label slot from category-config.js for editing
      if (attributeFilterLabelSlot.id) {
        filterSlotInstances['attribute_filter_label'] = {
          ...attributeFilterLabelSlot,
          content: attributeFilterLabelSlot.content || 'All Attribute Labels',
          parentId: 'layered_navigation',
          metadata: {
            ...attributeFilterLabelSlot.metadata,
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true,
            isSharedConfig: true, // Mark this as the shared config source
            displayName: 'All Attribute Filter Labels (Brand, Color, Size, Material)'
          }
        };
      }

      // Price filter section
      if (filters.price) {
        filterSlotInstances['price_filter_title'] = {
          id: 'price_filter_title',
          type: 'text',
          content: 'Price',
          className: 'font-semibold text-base text-gray-900 mb-3',
          styles: {},
          parentId: 'layered_navigation',
          metadata: {
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true
          }
        };
      }

      // Attribute filters (Brand, Color, Size, Material, etc.)
      // Use shared configuration from attribute_filter_label slot in category-config.js
      filters.attributes?.forEach((attribute, attrIndex) => {
        // Filter group title - uses shared label configuration
        filterSlotInstances[`filter_title_${attribute.code}`] = {
          id: `filter_title_${attribute.code}`,
          type: 'text',
          content: attribute.label,
          className: sharedLabelClassName + ' mb-3', // Apply shared className from config
          styles: { ...sharedLabelStyles }, // Apply shared styles from config
          parentId: 'layered_navigation',
          metadata: {
            attributeCode: attribute.code,
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true,
            mirroredFrom: 'attribute_filter_label' // Track that this mirrors the shared config
          }
        };

        // Filter options
        attribute.options?.forEach((option, optIndex) => {
          filterSlotInstances[`filter_option_${attribute.code}_${optIndex}`] = {
            id: `filter_option_${attribute.code}_${optIndex}`,
            type: 'text',
            content: `${option.label} (${option.count})`,
            className: 'text-gray-700 text-sm',
            styles: {},
            parentId: 'layered_navigation',
            metadata: {
              attributeCode: attribute.code,
              optionValue: option.value,
              microslot: true,
              editable: true,
              resizable: true,
              draggable: true
            }
          };
        });
      });

      // Render filter slots using UnifiedSlotRenderer
      const filterSlotValues = Object.values(filterSlotInstances);
      console.log('🔍 Filter slot instances created:', filterSlotValues.length);

      if (filterSlotValues.length === 0) {
        return (
          <div className={className || slot.className} style={styles || slot.styles}>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded bg-gray-50">
              <p className="text-gray-500 text-sm">No filters available. Check filterableAttributes in database.</p>
            </div>
          </div>
        );
      }

      return (
        <div
          className={className || slot.className}
          style={{
            ...(styles || slot.styles),
            border: '2px solid #10b981',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            minHeight: '200px'
          }}
        >
          <div className="text-green-700 font-bold mb-2">🔍 FILTERS CONTAINER (29 slots)</div>
          <div className="space-y-4">
            {filterSlotValues.map((filterSlot) => (
              <UnifiedSlotRenderer
                key={filterSlot.id}
                slots={{ [filterSlot.id]: filterSlot }}
                parentId={filterSlot.id}
                context={context}
                categoryData={categoryContext}
                variableContext={variableContext}
                onSlotUpdate={onSlotUpdate}
              />
            ))}
          </div>
        </div>
      );
    }

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

          // Set attributes if they're missing
          if (!minSlider.getAttribute('min') || minSlider.getAttribute('min') === 'null') {
            minSlider.setAttribute('min', min);
            maxSlider.setAttribute('min', min);
          }
          if (!minSlider.getAttribute('max') || minSlider.getAttribute('max') === 'null') {
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

          updatePriceSliderTrack();
        }
      };

      // Initialize max visible attributes
      const initMaxVisibleAttributes = () => {
        const filterContents = containerRef.current?.querySelectorAll('[data-max-visible]');

        filterContents?.forEach(filterContent => {
          const maxVisibleAttr = filterContent.getAttribute('data-max-visible');
          const maxVisible = parseInt(maxVisibleAttr);
          const attributeCode = filterContent.getAttribute('data-attribute-code');

          // Only apply if maxVisible is a valid number and > 0
          // If not set or invalid, don't limit (show all)
          if (!maxVisibleAttr || maxVisibleAttr === '' || maxVisibleAttr === 'null' || maxVisibleAttr === 'undefined' || isNaN(maxVisible) || maxVisible <= 0) {
            return;
          }

          const allOptions = filterContent.querySelectorAll('.filter-option');
          const showMoreBtn = filterContent.querySelector('.show-more-btn');

          // Hide options beyond max visible
          let hiddenCount = 0;
          allOptions.forEach((option, index) => {
            if (index >= maxVisible) {
              option.classList.add('hidden');
              hiddenCount++;
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
  render: ({ slot, className, styles, context, categoryContext, variableContext, allSlots, onSlotUpdate }) => {
    const containerRef = useRef(null);

    if (context === 'editor') {
      // Editor version - render products as individual editable slot instances
      const storeContext = useStore();
      const storeSettings = storeContext?.settings || null;
      const gridClasses = getGridClasses(storeSettings);

      // Get sample products from categoryContext
      const products = categoryContext?.products?.slice(0, 6) || [];

      if (products.length === 0) {
        return (
          <div
            className={`${className || slot.className || ''}`}
            style={styles || slot.styles}
          >
            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              Product Items Grid - No products available
            </div>
          </div>
        );
      }

      // Create dynamic slot instances for each product element
      const productSlotInstances = {};

      products.forEach((product, productIndex) => {
        // Product card container
        productSlotInstances[`product_card_${productIndex}`] = {
          id: `product_card_${productIndex}`,
          type: 'container',
          className: 'group overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-lg transition-shadow p-4 product-card',
          styles: {},
          parentId: 'product_items',
          metadata: {
            productId: product.id,
            productIndex,
            hierarchical: true
          }
        };

        // Product image
        productSlotInstances[`product_image_${productIndex}`] = {
          id: `product_image_${productIndex}`,
          type: 'image',
          content: product.images?.[0] || 'https://placehold.co/400x400?text=Product',
          className: 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105',
          styles: {},
          parentId: `product_card_${productIndex}`,
          metadata: {
            productId: product.id,
            productIndex,
            alt: product.name,
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true
          }
        };

        // Product name
        productSlotInstances[`product_name_${productIndex}`] = {
          id: `product_name_${productIndex}`,
          type: 'text',
          content: product.name,
          className: 'font-semibold mb-2',
          styles: {
            fontSize: '1.125rem',
            color: '#DC2626',
            fontWeight: '600'
          },
          parentId: `product_card_${productIndex}`,
          metadata: {
            productId: product.id,
            productIndex,
            htmlTag: 'h3',
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true,
            editableProperties: ['fontSize', 'color', 'fontWeight', 'textAlign']
          }
        };

        // Product price
        productSlotInstances[`product_price_${productIndex}`] = {
          id: `product_price_${productIndex}`,
          type: 'text',
          content: product.price_formatted || `$${product.price}`,
          className: 'text-lg font-bold text-red-600',
          styles: {},
          parentId: `product_card_${productIndex}`,
          metadata: {
            productId: product.id,
            productIndex,
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true
          }
        };

        // Product compare price (if exists)
        if (product.compare_price) {
          productSlotInstances[`product_compare_price_${productIndex}`] = {
            id: `product_compare_price_${productIndex}`,
            type: 'text',
            content: product.compare_price_formatted || `$${product.compare_price}`,
            className: 'text-sm text-gray-500 line-through',
            styles: {},
            parentId: `product_card_${productIndex}`,
            metadata: {
              productId: product.id,
              productIndex,
              microslot: true,
              editable: true,
              resizable: true,
              draggable: true
            }
          };
        }

        // Add to cart button
        productSlotInstances[`product_add_to_cart_${productIndex}`] = {
          id: `product_add_to_cart_${productIndex}`,
          type: 'button',
          content: 'Add to Cart',
          className: 'bg-blue-600 text-white border-0 hover:bg-blue-700 transition-colors duration-200 px-4 py-2 rounded-md font-medium',
          styles: {
            fontSize: '0.875rem',
            backgroundColor: '#2563EB',
            color: '#FFFFFF'
          },
          parentId: `product_card_${productIndex}`,
          metadata: {
            productId: product.id,
            productIndex,
            microslot: true,
            editable: true,
            resizable: true,
            draggable: true,
            editableProperties: ['fontSize', 'backgroundColor', 'color', 'borderRadius', 'padding']
          }
        };
      });

      // Render slots using UnifiedSlotRenderer - each product card gets its own isolated slot tree
      return (
        <div
          className={`grid ${gridClasses} gap-4 ${className || slot.className || ''}`}
          style={styles || slot.styles}
        >
          {products.map((product, productIndex) => {
            // Filter slots for this specific product
            const productSpecificSlots = {};
            Object.keys(productSlotInstances).forEach(key => {
              if (key.endsWith(`_${productIndex}`)) {
                productSpecificSlots[key] = productSlotInstances[key];
              }
            });

            return (
              <UnifiedSlotRenderer
                key={`product_${productIndex}`}
                slots={productSpecificSlots}
                parentId={`product_card_${productIndex}`}
                context={context}
                productData={{ product }}
                categoryData={categoryContext}
                variableContext={variableContext}
                onSlotUpdate={onSlotUpdate}
              />
            );
          })}
        </div>
      );
    }

    // Storefront version - uses template with processVariables
    const storeContext = useStore();
    const storeSettings = storeContext?.settings || null;
    const gridClasses = getGridClasses(storeSettings);

    // Use template from slot.content or fallback
    // NOTE: No wrapper div needed - grid classes are applied to the container element
    const template = slot?.content || `
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
registerSlotComponent('CategoryBreadcrumbs', CategoryBreadcrumbs);
registerSlotComponent('ProductBreadcrumbs', ProductBreadcrumbs);
registerSlotComponent('ActiveFilters', ActiveFilters);
registerSlotComponent('LayeredNavigation', LayeredNavigation);
registerSlotComponent('SortSelector', SortSelector);
registerSlotComponent('PaginationComponent', PaginationComponent);
registerSlotComponent('ProductCountInfo', ProductCountInfo);
registerSlotComponent('CmsBlockRenderer', CmsBlockComponent);
registerSlotComponent('ProductItemsGrid', ProductItemsGrid);

export {
  CategoryBreadcrumbs,
  ProductBreadcrumbs,
  ActiveFilters,
  LayeredNavigation,
  SortSelector,
  PaginationComponent,
  ProductCountInfo,
  CmsBlockComponent,
  ProductItemsGrid
};