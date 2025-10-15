import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processVariables } from '@/utils/variableProcessor';
import { getCurrentLanguage } from '@/utils/translationUtils';

/**
 * ProductTabs Component
 * Renders product tabs with content from config template
 */
export default function ProductTabs({ productTabs = [], product = null, className = '', slotConfig = null }) {
  console.log('🚀 ProductTabs component loaded!', { productTabsCount: productTabs?.length, hasProduct: !!product });

  const containerRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const currentLang = getCurrentLanguage();

  console.log('🌐 ProductTabs current language:', currentLang);
  console.log('🔍 DEBUGGING - localStorage language:', localStorage.getItem('catalyst_language'));
  console.log('🔍 DEBUGGING - Browser language:', navigator.language);

  // Prepare tabs data with active state
  const tabsData = useMemo(() => {
    if (!productTabs || productTabs.length === 0) return [];

    console.log('🏪 ProductTabs: Processing tabs for rendering:', {
      currentLang,
      tabCount: productTabs.length,
      tabs: productTabs.map(tab => ({
        id: tab.id,
        name: tab.name,
        hasTranslations: !!tab.translations,
        translationKeys: Object.keys(tab.translations || {}),
        enTranslation: tab.translations?.en,
        nlTranslation: tab.translations?.nl,
        currentLangTranslation: tab.translations?.[currentLang]
      }))
    });

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

      console.log(`📑 ProductTabs: Tab "${tab.name}" translation:`, {
        currentLang,
        originalName: tab.name,
        translatedTitle,
        translatedContent: translatedContent?.substring(0, 50) + '...',
        usedLang: tab.translations?.[currentLang] ? currentLang : 'en (fallback)'
      });

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
                {{#if this.content}}
                  <div>{{{this.content}}}</div>
                {{else}}
                  <div>{{{../product.description}}}</div>
                {{/if}}
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

  // Debug: Check if template has content rendering logic
  const hasContentLogic = template.includes('{{{this.content}}}') || template.includes('{{this.content}}');
  console.log('🔧 ProductTabs: Template has content logic?', hasContentLogic);
  console.log('🔧 ProductTabs: Template sample:', template.substring(template.indexOf('tab_type'), template.indexOf('tab_type') + 500));

  const html = processVariables(template, variableContext);

  console.log('🔧 ProductTabs: Processed HTML length:', html?.length);
  console.log('🔧 ProductTabs: First 500 chars of HTML:', html?.substring(0, 500));

  // Check if tab content is in the HTML
  const hasTabContent = html?.includes('dit is nederlandse text') || html?.includes('hello this is a text');
  console.log('🔧 ProductTabs: Contains tab content?', hasTabContent);

  // Log a section around where content should be
  const contentIndex = html?.indexOf('tab-panel');
  if (contentIndex > -1) {
    console.log('🔧 ProductTabs: Tab panel HTML (800 chars):', html?.substring(contentIndex, contentIndex + 800));
  }

  return (
    <>
      {/* DEBUG: Visual indicator for language and translation status */}
      <div style={{
        background: 'red',
        color: 'white',
        padding: '20px',
        margin: '10px 0',
        border: '5px solid yellow',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        🔍 DEBUG INFO - Current Language: {currentLang} |
        localStorage: {localStorage.getItem('catalyst_language') || 'not set'} |
        Tabs loaded: {tabsData.length}
        {tabsData.map((tab, idx) => (
          <div key={tab.id} style={{ marginTop: '10px', borderTop: '2px solid yellow', paddingTop: '10px' }}>
            <div>Tab {idx + 1}: {tab.title}</div>
            <div>ID: {tab.id} | Type: {tab.tab_type} | Active: {tab.isActive ? 'YES' : 'NO'}</div>
            <div>Has Content: {tab.content ? 'YES' : 'NO'} | Content Length: {tab.content?.length || 0}</div>
            <div>Content Preview: {tab.content ? tab.content.substring(0, 100) : 'EMPTY'}</div>
            <div>Has NL Translation: {tab.translations?.nl ? 'YES' : 'NO'}</div>
          </div>
        ))}
      </div>
      <div ref={containerRef} className={`product-tabs ${className}`}
           dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';
