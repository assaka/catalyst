import { useState, useEffect } from 'react';
import SectionHeader from './components/SectionHeader';
import FilterHeadingSection from './sections/FilterHeadingSection';
import FilterLabelsSection from './sections/FilterLabelsSection';
import PriceFilterLabelSection from './sections/PriceFilterLabelSection';
import FilterOptionsSection from './sections/FilterOptionsSection';
import CounterBadgesSection from './sections/CounterBadgesSection';
import ContainerSection from './sections/ContainerSection';

/**
 * Specialized sidebar for LayeredNavigation filter styling
 * Orchestrates individual section components
 */
const LayeredNavigationSidebar = ({
  slotId,
  slotConfig,
  allSlots = {},
  onClassChange,
  onTextChange
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

  return (
    <div className="space-y-0">
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
  );
};

export default LayeredNavigationSidebar;
