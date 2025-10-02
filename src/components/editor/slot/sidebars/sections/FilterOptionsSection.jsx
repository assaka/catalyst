import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Filter Options Section - controls for filter option styling (text, hover, checkbox)
 * Saves to filter_option_styles slot
 */
const FilterOptionsSection = ({ styles, onStyleChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium">Text Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.optionTextColor}
            onChange={(e) => onStyleChange('optionTextColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.optionTextColor}
            onChange={(e) => onStyleChange('optionTextColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Hover Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.optionHoverColor}
            onChange={(e) => onStyleChange('optionHoverColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.optionHoverColor}
            onChange={(e) => onStyleChange('optionHoverColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Count Badge Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.optionCountColor}
            onChange={(e) => onStyleChange('optionCountColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.optionCountColor}
            onChange={(e) => onStyleChange('optionCountColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Font Size</Label>
        <Input
          value={styles.optionFontSize}
          onChange={(e) => onStyleChange('optionFontSize', e.target.value, 'filter_option_styles')}
          className="text-xs h-7 mt-1"
          placeholder="0.875rem"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Font Weight</Label>
        <select
          value={styles.optionFontWeight}
          onChange={(e) => onStyleChange('optionFontWeight', e.target.value, 'filter_option_styles')}
          className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
        >
          <option value="300">Light</option>
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </select>
      </div>

      <div>
        <Label className="text-xs font-medium">Checkbox Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.checkboxColor}
            onChange={(e) => onStyleChange('checkboxColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.checkboxColor}
            onChange={(e) => onStyleChange('checkboxColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Active Filter Background</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.activeFilterBgColor}
            onChange={(e) => onStyleChange('activeFilterBgColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.activeFilterBgColor}
            onChange={(e) => onStyleChange('activeFilterBgColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Active Filter Text Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.activeFilterTextColor}
            onChange={(e) => onStyleChange('activeFilterTextColor', e.target.value, 'filter_option_styles')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.activeFilterTextColor}
            onChange={(e) => onStyleChange('activeFilterTextColor', e.target.value, 'filter_option_styles')}
            className="text-xs h-7"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterOptionsSection;
