import React, { useState, useEffect, useRef, useMemo } from 'react';
import Handlebars from 'handlebars';

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

/**
 * ProductTabs Component
 * Renders product tabs with content from config template
 */
export default function ProductTabs({ productTabs = [], product = null, className = '', slotConfig = null }) {
  const containerRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Prepare tabs data with active state
  const tabsData = useMemo(() => {
    if (!productTabs || productTabs.length === 0) return [];

    const validTabs = productTabs.filter(tab =>
      tab && tab.is_active !== false && (tab.title || tab.name)
    );

    // Add default description tab if needed
    const hasDescriptionTab = validTabs.some(tab =>
      tab.title?.toLowerCase().includes('description') ||
      tab.name?.toLowerCase().includes('description')
    );

    const tabsToRender = [...validTabs];
    if (product?.description && !hasDescriptionTab) {
      tabsToRender.unshift({
        id: 'description',
        title: 'Description',
        content: product.description,
        is_active: true,
        tab_type: 'description'
      });
    }

    return tabsToRender.map((tab, index) => ({
      ...tab,
      id: tab.id?.toString() || tab.title || `tab-${index}`,
      title: tab.title || tab.name || `Tab ${index + 1}`,
      isActive: index === activeTabIndex
    }));
  }, [productTabs, product, activeTabIndex]);

  // Attach tab click handlers
  useEffect(() => {
    if (!containerRef.current) return;

    const handleClick = (e) => {
      const tabButton = e.target.closest('[data-action="switch-tab"]');
      if (!tabButton) return;

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

  // Get template from slotConfig or use default
  const template = slotConfig?.content || `
    <div class="product-tabs w-full">
      <div class="tabs-list grid w-full grid-cols-1 md:grid-cols-auto border-b border-gray-200">
        {{#each tabs}}
          <button
            class="py-2 px-4 text-sm font-medium transition-colors {{#if this.isActive}}border-b-2 border-blue-500 text-blue-600{{else}}text-gray-600 hover:text-gray-900{{/if}}"
            data-action="switch-tab"
            data-tab-id="{{this.id}}">
            {{this.title}}
          </button>
        {{/each}}
      </div>

      <div class="tabs-content mt-6">
        {{#each tabs}}
          <div
            class="tab-content {{#unless this.isActive}}hidden{{/unless}}"
            data-tab-content="{{this.id}}">
            <div class="prose max-w-none text-gray-700 leading-relaxed">
              {{#if (eq this.tab_type "text")}}
                {{{this.content}}}
              {{/if}}

              {{#if (eq this.tab_type "description")}}
                {{{../product.description}}}
              {{/if}}

              {{#if (eq this.tab_type "attributes")}}
                {{#if ../product.attributes}}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {{#each ../product.attributes}}
                      <div class="flex justify-between py-2 border-b border-gray-100">
                        <span class="font-medium capitalize">{{@key}}</span>
                        <span>{{this}}</span>
                      </div>
                    {{/each}}
                  </div>
                {{else}}
                  <p class="text-gray-500">No specifications available for this product.</p>
                {{/if}}
              {{/if}}

              {{#if (eq this.tab_type "attribute_sets")}}
                <div class="space-y-6">
                  {{#if this.attribute_set_ids}}
                    {{#each this.attribute_set_ids}}
                      <div class="border-b border-gray-100 pb-4">
                        <h4 class="font-medium text-gray-900 mb-2">Attribute Set {{@index}}</h4>
                        <p class="text-gray-500">Attribute set content would be displayed here.</p>
                      </div>
                    {{/each}}
                  {{else}}
                    <p class="text-gray-500">No attribute sets configured for this tab.</p>
                  {{/if}}
                </div>
              {{/if}}
            </div>
          </div>
        {{/each}}
      </div>
    </div>
  `;

  const compiledTemplate = Handlebars.compile(template);
  const html = compiledTemplate({ tabs: tabsData, product });

  return (
    <div ref={containerRef} className={`product-tabs ${className}`}
         dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';