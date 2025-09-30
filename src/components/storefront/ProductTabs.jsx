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
                className="text-3xl font-medium"
              >
                {tabTitle}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabsToRender.map((tab, index) => {
          const tabId = tab.id?.toString() || tab.title || `tab-${index}`;

          return (
            <TabsContent
              key={tabId}
              value={tabId}
              className="mt-6"
            >
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                {/* Text content tab */}
                {tab.tab_type === 'text' && tab.content && (
                  <div dangerouslySetInnerHTML={{ __html: tab.content }} />
                )}

                {/* Description tab */}
                {tab.tab_type === 'description' && product?.description && (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                )}

                {/* Attributes tab */}
                {tab.tab_type === 'attributes' && (
                  product?.attributes && Object.keys(product.attributes).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span>{String(value ?? '')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No specifications available for this product.</p>
                  )
                )}

                {/* Attribute Sets tab */}
                {tab.tab_type === 'attribute_sets' && (
                  <div className="space-y-6">
                    {tab.attribute_set_ids && tab.attribute_set_ids.length > 0 ? (
                      tab.attribute_set_ids.map((setId, idx) => (
                        <div key={setId} className="border-b border-gray-100 pb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Attribute Set {idx + 1}</h4>
                          <p className="text-gray-500">Attribute set content would be displayed here.</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No attribute sets configured for this tab.</p>
                    )}
                  </div>
                )}

                {/* Default content tab (fallback) */}
                {(!tab.tab_type || tab.tab_type === 'text') && !tab.content && (
                  <div dangerouslySetInnerHTML={{ __html: tab.content || tab.description || '' }} />
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// For slot system registration
ProductTabs.displayName = 'ProductTabs';