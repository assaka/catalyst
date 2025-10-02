import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Filter Options Section - controls for filter option styling (text, hover, checkbox)
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
            onChange={(e) => onStyleChange('optionTextColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.optionTextColor}
            onChange={(e) => onStyleChange('optionTextColor', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Hover Background</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.optionHoverBg}
            onChange={(e) => onStyleChange('optionHoverBg', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.optionHoverBg}
            onChange={(e) => onStyleChange('optionHoverBg', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Checkbox Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.checkboxColor}
            onChange={(e) => onStyleChange('checkboxColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.checkboxColor}
            onChange={(e) => onStyleChange('checkboxColor', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterOptionsSection;
