import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeader from './components/SectionHeader';
import FilterHeadingSection from './sections/FilterHeadingSection';
import FilterLabelsSection from './sections/FilterLabelsSection';
import PriceFilterLabelSection from './sections/PriceFilterLabelSection';
import FilterOptionsSection from './sections/FilterOptionsSection';
import CounterBadgesSection from './sections/CounterBadgesSection';
import ContainerSection from './sections/ContainerSection';
import UnifiedSlotRenderer from '../UnifiedSlotRenderer';

/**
 * Specialized sidebar for LayeredNavigation filter styling
 * Orchestrates individual section components
 */
const LayeredNavigationSidebar = ({
  slotId,
  slotConfig,
  allSlots = {},
  onClassChange,
  onTextChange,
  onClearSelection
}) => {
  const [expandedSections, setExpandedSections] = useState({
    filterHeading: true,
    filterLabels: true,
    priceLabel: true,
    filterOptions: true,
    counters: true,
    container: true
  });

  const [filterStyles, setFilterStyles] = useState({
    // Filter Heading
    headingColor: '#111827',
    headingFontSize: '1.125rem',
    headingFontWeight: '600',

    // Attribute Filter Labels
    labelColor: '#374151',
    labelFontSize: '0.875rem',
    labelFontWeight: '500',

    // Price Filter Label
    priceLabelColor: '#374151',
    priceLabelFontSize: '0.875rem',
    priceLabelFontWeight: '500',

    // Filter Options
    optionTextColor: '#4B5563',
    optionHoverBg: '#F3F4F6',
    checkboxColor: '#3B82F6',

    // Counter Badges
    counterBgColor: '#E5E7EB',
    counterTextColor: '#6B7280',
    counterFontSize: '0.75rem',

    // Container
    containerBg: '#FFFFFF',
    containerPadding: '1rem'
  });

  // Load existing styles from child slots
  useEffect(() => {
    if (!allSlots) return;

    const updates = {};

    // Filter Heading
    const filterHeading = allSlots['filter_heading'];
    if (filterHeading) {
      if (filterHeading.styles?.color) updates.headingColor = filterHeading.styles.color;
      if (filterHeading.styles?.fontSize) updates.headingFontSize = filterHeading.styles.fontSize;
      if (filterHeading.styles?.fontWeight) updates.headingFontWeight = filterHeading.styles.fontWeight;
    }

    // Attribute Filter Label
    const attrLabel = allSlots['attribute_filter_label'];
    if (attrLabel) {
      if (attrLabel.styles?.color) updates.labelColor = attrLabel.styles.color;
      if (attrLabel.styles?.fontSize) updates.labelFontSize = attrLabel.styles.fontSize;
      if (attrLabel.styles?.fontWeight) updates.labelFontWeight = attrLabel.styles.fontWeight;
    }

    // Price Filter Label
    const priceLabel = allSlots['price_filter_label'];
    if (priceLabel) {
      if (priceLabel.styles?.color) updates.priceLabelColor = priceLabel.styles.color;
      if (priceLabel.styles?.fontSize) updates.priceLabelFontSize = priceLabel.styles.fontSize;
      if (priceLabel.styles?.fontWeight) updates.priceLabelFontWeight = priceLabel.styles.fontWeight;
    }

    if (Object.keys(updates).length > 0) {
      setFilterStyles(prev => ({ ...prev, ...updates }));
    }
  }, [allSlots]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleStyleChange = (property, value, targetSlotId) => {
    // Update local state
    setFilterStyles(prev => ({ ...prev, [property]: value }));

    // Update the target slot via onClassChange (only if targetSlotId is provided)
    if (targetSlotId && allSlots[targetSlotId]) {
      const targetSlot = allSlots[targetSlotId];
      const styles = { ...targetSlot.styles };

      // Map property to CSS property
      const cssPropertyMap = {
        headingColor: 'color',
        headingFontSize: 'fontSize',
        headingFontWeight: 'fontWeight',
        labelColor: 'color',
        labelFontSize: 'fontSize',
        labelFontWeight: 'fontWeight',
        priceLabelColor: 'color',
        priceLabelFontSize: 'fontSize',
        priceLabelFontWeight: 'fontWeight',
        counterBgColor: 'backgroundColor',
        counterTextColor: 'color',
        counterFontSize: 'fontSize'
      };

      const cssProperty = cssPropertyMap[property];
      if (cssProperty) {
        styles[cssProperty] = value;

        // Call onClassChange to update database
        if (onClassChange) {
          onClassChange(targetSlotId, targetSlot.className || '', styles, targetSlot.metadata || {});
        }
      }
    }
  };

  // Get child label slots for preview
  const childLabelSlots = {};
  if (allSlots) {
    Object.values(allSlots).forEach(childSlot => {
      if (childSlot.parentId === 'layered_navigation' &&
          (childSlot.id.includes('filter_label') || childSlot.id === 'filter_heading')) {
        childLabelSlots[childSlot.id] = childSlot;
      }
    });
  }

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col editor-sidebar" style={{ zIndex: 1000 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Filter Styling
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-0">
        {/* Preview Section - Editable Filter Labels */}
        {Object.keys(childLabelSlots).length > 0 && (
        <div className="border-b border-gray-200">
          <div className="p-3 bg-blue-50">
            <div className="text-xs text-blue-700 font-bold mb-2">
              📝 FILTER LABEL PREVIEW (Click to edit):
            </div>
            <div className="text-xs text-gray-600 mb-3">
              Edit styles below → They'll be applied to filters on publish
            </div>
            <div className="space-y-2">
              {Object.values(childLabelSlots).map((childSlot) => (
                <div
                  key={childSlot.id}
                  className="bg-white p-2 rounded border border-gray-300 hover:border-blue-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {childSlot.metadata?.displayName || childSlot.id}
                  </div>
                  <UnifiedSlotRenderer
                    slots={{ [childSlot.id]: childSlot }}
                    parentId={null}
                    context="editor"
                    variableContext={{}}
                    mode="edit"
                    showBorders={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Heading */}
      <SectionHeader
        title="Filter Heading"
        section="filterHeading"
        expanded={expandedSections.filterHeading}
        onToggle={toggleSection}
      >
        <FilterHeadingSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>

      {/* Attribute Filter Labels */}
      <SectionHeader
        title="Attribute Filter Labels"
        section="filterLabels"
        expanded={expandedSections.filterLabels}
        onToggle={toggleSection}
      >
        <FilterLabelsSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>

      {/* Price Filter Label */}
      <SectionHeader
        title="Price Filter Label"
        section="priceLabel"
        expanded={expandedSections.priceLabel}
        onToggle={toggleSection}
      >
        <PriceFilterLabelSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>

      {/* Filter Options */}
      <SectionHeader
        title="Filter Options"
        section="filterOptions"
        expanded={expandedSections.filterOptions}
        onToggle={toggleSection}
      >
        <FilterOptionsSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>

      {/* Counter Badges */}
      <SectionHeader
        title="Counter Badges"
        section="counters"
        expanded={expandedSections.counters}
        onToggle={toggleSection}
      >
        <CounterBadgesSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>

      {/* Container */}
      <SectionHeader
        title="Container"
        section="container"
        expanded={expandedSections.container}
        onToggle={toggleSection}
      >
        <ContainerSection
          styles={filterStyles}
          onStyleChange={handleStyleChange}
        />
      </SectionHeader>
      </div>
    </div>
  );
};

export default LayeredNavigationSidebar;
