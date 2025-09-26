import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * ProductTabs Component
 * Renders product tabs with content from the productTabs data
 */
export default function ProductTabs({ productTabs = [], product = null, className = '' }) {
  const [activeTab, setActiveTab] = useState(0);

  // Filter out inactive or invalid tabs
  const validTabs = productTabs.filter(tab =>
    tab &&
    tab.is_active !== false &&
    (tab.title || tab.name)
  );

  // Add default Description tab if product has description and no description tab exists
  const hasDescriptionTab = validTabs.some(tab =>
    tab.title?.toLowerCase().includes('description') ||
    tab.name?.toLowerCase().includes('description')
  );

  const tabsToRender = [...validTabs];

  // Add default description tab if product has description and no description tab exists
  if (product?.description && !hasDescriptionTab) {
    tabsToRender.unshift({
      id: 'description',
      title: 'Description',
      content: product.description,
      is_active: true
    });
  }

  // Don't render if no tabs
  if (tabsToRender.length === 0) {
    return null;
  }

  // Generate tab values for Radix UI
  const firstTab = tabsToRender[0];
  const defaultValue = firstTab?.id?.toString() || firstTab?.title || 'tab-0';

  return (
    <div className={`product-tabs ${className}`}>
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-auto">
          {tabsToRender.map((tab, index) => {
            const tabId = tab.id?.toString() || tab.title || `tab-${index}`;
            const tabTitle = tab.title || tab.name || `Tab ${index + 1}`;

            return (
              <TabsTrigger
                key={tabId}
                value={tabId}
                className="text-sm font-medium"
              >
                {tabTitle}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabsToRender.map((tab, index) => {
          const tabId = tab.id?.toString() || tab.title || `tab-${index}`;
          const tabContent = tab.content || tab.description || '';

          return (
            <TabsContent
              key={tabId}
              value={tabId}
              className="mt-6"
            >
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: tabContent }}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';