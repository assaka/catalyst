import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processVariables } from '@/utils/variableProcessor';
import { getCurrentLanguage } from '@/utils/translationUtils';

/**
 * ProductTabs Component
 * Renders product tabs with content from config template
 */
export default function ProductTabs({ productTabs = [], product = null, settings = {}, className = '', slotConfig = null }) {
  const containerRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const currentLang = getCurrentLanguage();

  // Prepare tabs data with active state
  const tabsData = useMemo(() => {
    if (!productTabs || productTabs.length === 0) return [];

    const validTabs = productTabs.filter(tab =>
      tab && tab.is_active !== false
    );

    // Add default description tab if needed
    const hasDescriptionTab = validTabs.some(tab => {
      // Get translated title/name from translations JSON
      const translatedTitle = tab.translations?.[currentLang]?.name || tab.translations?.en?.name;
      return translatedTitle?.toLowerCase().includes('description');
    });

    const tabsToRender = [...validTabs];
    if (product?.description && !hasDescriptionTab) {
      tabsToRender.unshift({
        id: 'description',
        translations: {
          en: { name: 'Description' },
          [currentLang]: { name: 'Description' }
        },
        content: product.description,
        is_active: true,
        tab_type: 'description'
      });
    }

    const mappedTabs = tabsToRender.map((tab, index) => {
      // Get translated title and content from translations JSON, fallback to original name field
      const translatedTitle = tab.translations?.[currentLang]?.name || tab.translations?.en?.name || tab.name || 'No Tab Name';
      const translatedContent = tab.translations?.[currentLang]?.content || tab.translations?.en?.content || tab.content || '';

      return {
        ...tab,
        id: tab.id?.toString() || `tab-${index}`,
        title: translatedTitle,
        isActive: index === activeTabIndex,
        content: translatedContent,
        tab_type: tab.tab_type || 'text'
      };
    });

    return mappedTabs;
  }, [productTabs, product, activeTabIndex, currentLang]);

  // Render attributes dynamically (processVariables doesn't support {{@key}})
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all attribute containers (there might be multiple for desktop/mobile)
    const attributesContainers = containerRef.current.querySelectorAll('[data-attributes-container]');
    if (!attributesContainers || attributesContainers.length === 0) return;

    const attributes = product?.attributes;

    // Attributes should be an array of {code, label, value, ...}
    let attributesArray = [];
    if (Array.isArray(attributes)) {
      // New normalized format from API (already translated)
      attributesArray = attributes;
    } else if (attributes && typeof attributes === 'object') {
      // Old format - convert to array
      attributesArray = Object.entries(attributes).map(([key, value]) => ({
        code: key,
        label: key.replace(/_/g, ' '),
        value: String(value ?? ''),
        type: 'text'
      }));
    }

    if (!attributesArray || attributesArray.length === 0) {
      attributesContainers.forEach(container => {
        container.innerHTML = '<p class="text-gray-500">No specifications available for this product.</p>';
      });
      return;
    }

    // Get attribute label color from theme settings
    const attributeLabelColor = settings?.theme?.product_tabs_attribute_label_color || '#16A34A';

    const attributesHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${attributesArray.map(attr => {
          // For color attributes with hex metadata, show a color swatch
          const colorSwatch = attr.metadata?.hex
            ? `<span class="inline-block w-4 h-4 rounded border border-gray-300 ml-2" style="background-color: ${attr.metadata.hex}"></span>`
            : '';

          return `
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="font-bold capitalize" style="color: ${attributeLabelColor};">${attr.label}</span>
              <span>${attr.value}${colorSwatch}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Populate all attribute containers (desktop and mobile)
    attributesContainers.forEach(container => {
      container.innerHTML = attributesHTML;
    });
  }, [product, tabsData, activeTabIndex, settings, currentLang]);

  // Attach tab click handlers
  useEffect(() => {
    if (!containerRef.current) return;

    const handleClick = (e) => {
      // Handle desktop tab switching
      const tabButton = e.target.closest('[data-action="switch-tab"]');
      if (tabButton) {
        const tabId = tabButton.getAttribute('data-tab-id');
        const tabIndex = tabsData.findIndex(tab => tab.id === tabId);

        if (tabIndex !== -1) {
          setActiveTabIndex(tabIndex);

          // Update UI immediately
          const allTabs = containerRef.current.querySelectorAll('[data-action="switch-tab"]');
          const allContents = containerRef.current.querySelectorAll('[data-tab-content]');

          allTabs.forEach((btn, idx) => {
            if (idx === tabIndex) {
              btn.classList.add('border-blue-500', 'text-blue-600');
              btn.classList.remove('text-gray-600');
            } else {
              btn.classList.remove('border-blue-500', 'text-blue-600');
              btn.classList.add('text-gray-600');
            }
          });

          allContents.forEach((content, idx) => {
            if (idx === tabIndex) {
              content.classList.remove('hidden');
            } else {
              content.classList.add('hidden');
            }
          });
        }
        return;
      }

      // Handle mobile accordion toggle
      const accordionButton = e.target.closest('[data-action="toggle-accordion"]');
      if (accordionButton) {
        const accordionIndex = accordionButton.getAttribute('data-accordion-index');
        const accordionContent = containerRef.current.querySelector(`[data-accordion-content="${accordionIndex}"]`);
        const chevron = accordionButton.querySelector('.accordion-chevron');

        if (accordionContent) {
          // Toggle visibility
          const isHidden = accordionContent.classList.contains('hidden');

          if (isHidden) {
            accordionContent.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
          } else {
            accordionContent.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
          }
        }
      }
    };

    containerRef.current.addEventListener('click', handleClick);
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [tabsData]);

  if (!tabsData || tabsData.length === 0) {
    return null;
  }

  // Get template from slotConfig or use default with theme styling
  // IMPORTANT: Always use the code template, ignore slotConfig to ensure latest styling
  const template = `
    <div class="w-full">
      <!-- Desktop: Tab Navigation - Hidden on mobile -->
      <div class="hidden md:block border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          {{#each tabs}}
            {{#if this.isActive}}
            <button
              class="py-2 px-1 border-b-2 transition-colors duration-200"
              style="font-size: {{settings.theme.product_tabs_title_size}}; font-weight: {{settings.theme.product_tabs_font_weight}}; text-decoration: {{settings.theme.product_tabs_text_decoration}}; color: {{settings.theme.product_tabs_title_color}}; border-color: {{settings.theme.product_tabs_title_color}}; background-color: {{settings.theme.product_tabs_active_bg}};"
              data-action="switch-tab"
              data-tab-id="{{this.id}}">
              {{this.title}}
            </button>
            {{else}}
            <button
              class="py-2 px-1 border-b-2 border-transparent transition-colors duration-200"
              style="font-size: {{settings.theme.product_tabs_title_size}}; font-weight: {{settings.theme.product_tabs_font_weight}}; text-decoration: {{settings.theme.product_tabs_text_decoration}}; color: {{settings.theme.product_tabs_inactive_color}}; background-color: {{settings.theme.product_tabs_inactive_bg}};"
              onmouseover="this.style.color='{{settings.theme.product_tabs_hover_color}}'; this.style.backgroundColor='{{settings.theme.product_tabs_hover_bg}}';"
              onmouseout="this.style.color='{{settings.theme.product_tabs_inactive_color}}'; this.style.backgroundColor='{{settings.theme.product_tabs_inactive_bg}}';"
              data-action="switch-tab"
              data-tab-id="{{this.id}}">
              {{this.title}}
            </button>
            {{/if}}
          {{/each}}
        </nav>
      </div>

      <!-- Desktop: Tab Content - Hidden on mobile -->
      <div class="hidden md:block mt-6">
        {{#each tabs}}
          <div
            class="tab-panel {{#if this.isActive}}{{else}}hidden{{/if}}"
            data-tab-content="{{this.id}}"
            data-tab-index="{{@index}}"
            data-tab-type="{{this.tab_type}}"
            data-tab-text-content="{{this.content}}">
            <div class="prose max-w-none text-gray-800 leading-relaxed tab-content-container p-6 border"
                 style="background-color: {{settings.theme.product_tabs_content_bg}}; border-radius: {{settings.theme.product_tabs_border_radius}}; border-color: {{settings.theme.product_tabs_border_color}};">
              {{#if (eq this.tab_type "text")}}
                <div>{{{this.content}}}</div>
              {{/if}}

              {{#if (eq this.tab_type "description")}}
                {{#if this.content}}
                  <div>{{{this.content}}}</div>
                {{else}}
                  <div>{{{../product.description}}}</div>
                {{/if}}
              {{/if}}

              {{#if (eq this.tab_type "attributes")}}
                <div id="attributes-placeholder" data-attributes-container></div>
              {{/if}}
            </div>
          </div>
        {{/each}}
      </div>

      <!-- Mobile: Accordion - Hidden on desktop -->
      <div class="md:hidden space-y-2">
        {{#each tabs}}
          <div class="border" data-accordion-item="{{@index}}" style="background-color: {{settings.theme.product_tabs_inactive_bg}}; border-radius: {{settings.theme.product_tabs_border_radius}}; border-color: {{settings.theme.product_tabs_border_color}};">
            <!-- Accordion Header -->
            <button
              class="w-full flex items-center justify-between p-4 text-left transition-colors duration-200"
              style="color: {{settings.theme.product_tabs_title_color}}; background-color: {{settings.theme.product_tabs_active_bg}}; border-top-left-radius: {{settings.theme.product_tabs_border_radius}}; border-top-right-radius: {{settings.theme.product_tabs_border_radius}};"
              onmouseover="this.style.backgroundColor='{{settings.theme.product_tabs_hover_bg}}';"
              onmouseout="this.style.backgroundColor='{{settings.theme.product_tabs_active_bg}}';"
              data-action="toggle-accordion"
              data-accordion-index="{{@index}}">
              <span style="font-size: {{settings.theme.product_tabs_title_size}}; font-weight: {{settings.theme.product_tabs_font_weight}}; text-decoration: {{settings.theme.product_tabs_text_decoration}};">{{this.title}}</span>
              <svg
                class="w-5 h-5 transition-transform duration-200 accordion-chevron"
                style="color: {{settings.theme.product_tabs_title_color}};"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Accordion Content -->
            <div class="accordion-content {{#if @first}}{{else}}hidden{{/if}} p-4 pt-0 border-t"
                 data-accordion-content="{{@index}}"
                 data-tab-type="{{this.tab_type}}"
                 data-tab-text-content="{{this.content}}"
                 style="border-color: {{settings.theme.product_tabs_border_color}};">
              <div class="prose max-w-none text-gray-800 leading-relaxed tab-content-container p-6"
                   style="background-color: {{settings.theme.product_tabs_content_bg}};">
                {{#if (eq this.tab_type "text")}}
                  <div>{{{this.content}}}</div>
                {{/if}}

                {{#if (eq this.tab_type "description")}}
                  {{#if this.content}}
                    <div>{{{this.content}}}</div>
                  {{else}}
                    <div>{{{../product.description}}}</div>
                  {{/if}}
                {{/if}}

                {{#if (eq this.tab_type "attributes")}}
                  <div id="attributes-placeholder-mobile" data-attributes-container></div>
                {{/if}}
              </div>
            </div>
          </div>
        {{/each}}
      </div>
    </div>
  `;

  // Use settings from props (passed from productContext)
  // Only include theme settings to avoid passing large translation objects
  const themeSettings = settings?.theme || {};

  const variableContext = {
    tabs: tabsData,
    product,
    settings: {
      theme: themeSettings
    }
  };

  const html = processVariables(template, variableContext);

  return (
    <div ref={containerRef} className={`product-tabs ${className}`}
         dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';
