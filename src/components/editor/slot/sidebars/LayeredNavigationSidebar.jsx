import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Specialized sidebar for LayeredNavigation filter styling
 * Provides controls for:
 * - Filter labels (heading, attribute labels, price filter label)
 * - Filter options (checkbox color, text color, background on hover)
 * - Counter badges (background color, text color)
 * - Container padding and background
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

  const SectionHeader = ({ title, section, children }) => (
    <div className="border-b border-gray-200">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        {expandedSections[section] ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-3 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );

  const handleStyleChange = (property, value, targetSlotId) => {
    // Update local state
    setFilterStyles(prev => ({ ...prev, [property]: value }));

    // Update the target slot via onClassChange
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
      {/* Filter Heading Section */}
      <SectionHeader title="Filter Heading" section="filterHeading">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.headingColor}
                onChange={(e) => handleStyleChange('headingColor', e.target.value, 'filter_heading')}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.headingColor}
                onChange={(e) => handleStyleChange('headingColor', e.target.value, 'filter_heading')}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Font Size</Label>
            <Input
              value={filterStyles.headingFontSize}
              onChange={(e) => handleStyleChange('headingFontSize', e.target.value, 'filter_heading')}
              className="text-xs h-7 mt-1"
              placeholder="1.125rem"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Font Weight</Label>
            <select
              value={filterStyles.headingFontWeight}
              onChange={(e) => handleStyleChange('headingFontWeight', e.target.value, 'filter_heading')}
              className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
            >
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </div>
      </SectionHeader>

      {/* Attribute Filter Labels Section */}
      <SectionHeader title="Attribute Filter Labels" section="filterLabels">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.labelColor}
                onChange={(e) => handleStyleChange('labelColor', e.target.value, 'attribute_filter_label')}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.labelColor}
                onChange={(e) => handleStyleChange('labelColor', e.target.value, 'attribute_filter_label')}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Font Size</Label>
            <Input
              value={filterStyles.labelFontSize}
              onChange={(e) => handleStyleChange('labelFontSize', e.target.value, 'attribute_filter_label')}
              className="text-xs h-7 mt-1"
              placeholder="0.875rem"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Font Weight</Label>
            <select
              value={filterStyles.labelFontWeight}
              onChange={(e) => handleStyleChange('labelFontWeight', e.target.value, 'attribute_filter_label')}
              className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
            >
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </div>
      </SectionHeader>

      {/* Price Filter Label Section */}
      <SectionHeader title="Price Filter Label" section="priceLabel">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.priceLabelColor}
                onChange={(e) => handleStyleChange('priceLabelColor', e.target.value, 'price_filter_label')}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.priceLabelColor}
                onChange={(e) => handleStyleChange('priceLabelColor', e.target.value, 'price_filter_label')}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Font Size</Label>
            <Input
              value={filterStyles.priceLabelFontSize}
              onChange={(e) => handleStyleChange('priceLabelFontSize', e.target.value, 'price_filter_label')}
              className="text-xs h-7 mt-1"
              placeholder="0.875rem"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Font Weight</Label>
            <select
              value={filterStyles.priceLabelFontWeight}
              onChange={(e) => handleStyleChange('priceLabelFontWeight', e.target.value, 'price_filter_label')}
              className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
            >
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </div>
      </SectionHeader>

      {/* Filter Options Section */}
      <SectionHeader title="Filter Options" section="filterOptions">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Text Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.optionTextColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, optionTextColor: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.optionTextColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, optionTextColor: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Hover Background</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.optionHoverBg}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, optionHoverBg: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.optionHoverBg}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, optionHoverBg: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Checkbox Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.checkboxColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, checkboxColor: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.checkboxColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, checkboxColor: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>
        </div>
      </SectionHeader>

      {/* Counter Badges Section */}
      <SectionHeader title="Counter Badges" section="counters">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.counterBgColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, counterBgColor: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.counterBgColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, counterBgColor: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Text Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.counterTextColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, counterTextColor: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.counterTextColor}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, counterTextColor: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Font Size</Label>
            <Input
              value={filterStyles.counterFontSize}
              onChange={(e) => setFilterStyles(prev => ({ ...prev, counterFontSize: e.target.value }))}
              className="text-xs h-7 mt-1"
              placeholder="0.75rem"
            />
          </div>
        </div>
      </SectionHeader>

      {/* Container Section */}
      <SectionHeader title="Container" section="container">
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={filterStyles.containerBg}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, containerBg: e.target.value }))}
                className="w-8 h-7 rounded border border-gray-300"
              />
              <Input
                value={filterStyles.containerBg}
                onChange={(e) => setFilterStyles(prev => ({ ...prev, containerBg: e.target.value }))}
                className="text-xs h-7"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Padding</Label>
            <Input
              value={filterStyles.containerPadding}
              onChange={(e) => setFilterStyles(prev => ({ ...prev, containerPadding: e.target.value }))}
              className="text-xs h-7 mt-1"
              placeholder="1rem"
            />
          </div>
        </div>
      </SectionHeader>
    </div>
  );
};

export default LayeredNavigationSidebar;
