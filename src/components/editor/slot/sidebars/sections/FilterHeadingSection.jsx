import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Filter Heading Section - controls for filter heading style
 * Saves to filter_heading slot
 */
const FilterHeadingSection = ({ styles, onStyleChange, onTextChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium">Heading Text</Label>
        <Input
          value={styles.headingText || 'Filter By'}
          onChange={(e) => onTextChange && onTextChange('filter_heading', e.target.value)}
          className="text-xs h-7 mt-1"
          placeholder="Filter By"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.headingColor}
            onChange={(e) => onStyleChange('headingColor', e.target.value, 'filter_heading')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.headingColor}
            onChange={(e) => onStyleChange('headingColor', e.target.value, 'filter_heading')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Font Size</Label>
        <Input
          value={styles.headingFontSize}
          onChange={(e) => onStyleChange('headingFontSize', e.target.value, 'filter_heading')}
          className="text-xs h-7 mt-1"
          placeholder="1.125rem"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Font Weight</Label>
        <select
          value={styles.headingFontWeight}
          onChange={(e) => onStyleChange('headingFontWeight', e.target.value, 'filter_heading')}
          className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
        >
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
          <option value="700">Bold</option>
        </select>
      </div>
    </div>
  );
};

export default FilterHeadingSection;
