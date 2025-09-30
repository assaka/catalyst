import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processVariables } from '@/utils/variableProcessor';

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

  // Render attributes dynamically (processVariables doesn't support {{@key}})
  useEffect(() => {
    if (!containerRef.current || !product?.attributes) return;

    const attributesContainer = containerRef.current.querySelector('[data-attributes-container]');
    if (!attributesContainer) return;

    const attributes = product.attributes;
    if (!attributes || Object.keys(attributes).length === 0) {
      attributesContainer.innerHTML = '<p class="text-gray-500">No specifications available for this product.</p>';
      return;
    }

    const attributesHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${Object.entries(attributes).map(([key, value]) => `
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="font-medium capitalize">${key.replace(/_/g, ' ')}</span>
            <span>${String(value ?? '')}</span>
          </div>
        `).join('')}
      </div>
    `;

    attributesContainer.innerHTML = attributesHTML;
  }, [product]);

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
    <div class="w-full">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          {{#each tabs}}
            <button
              class="py-2 px-1 border-b-2 font-medium text-3xl text-red-600 transition-colors duration-200 {{#if this.isActive}}border-red-600{{else}}border-transparent hover:underline{{/if}}"
              data-action="switch-tab"
              data-tab-id="{{this.id}}">
              {{this.title}}
            </button>
          {{/each}}
        </nav>
      </div>

      <div class="mt-6">
        {{#each tabs}}
          <div
            class="tab-panel {{#unless this.isActive}}hidden{{/unless}}"
            data-tab-content="{{this.id}}">
            <div class="prose max-w-none">
              {{#if (eq this.tab_type "text")}}
                <div>{{{this.content}}}</div>
              {{/if}}

              {{#if (eq this.tab_type "description")}}
                <div>{{{../product.description}}}</div>
              {{/if}}

              {{#if (eq this.tab_type "attributes")}}
                <div id="attributes-placeholder" data-attributes-container></div>
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

  const variableContext = { tabs: tabsData, product };

  console.log('ProductTabs Debug:', {
    tabsData,
    productDescription: product?.description,
    template: template.substring(0, 200),
    slotConfig: slotConfig ? 'present' : 'missing'
  });

  const html = processVariables(template, variableContext);

  console.log('Processed HTML:', html.substring(0, 500));

  return (
    <div ref={containerRef} className={`product-tabs ${className}`}
         dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';
