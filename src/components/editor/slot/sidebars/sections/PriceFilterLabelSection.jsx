import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Price Filter Label Section - controls for price filter label
 */
const PriceFilterLabelSection = ({ styles, onStyleChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium">Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.priceLabelColor}
            onChange={(e) => onStyleChange('priceLabelColor', e.target.value, 'price_filter_label')}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.priceLabelColor}
            onChange={(e) => onStyleChange('priceLabelColor', e.target.value, 'price_filter_label')}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Font Size</Label>
        <Input
          value={styles.priceLabelFontSize}
          onChange={(e) => onStyleChange('priceLabelFontSize', e.target.value, 'price_filter_label')}
          className="text-xs h-7 mt-1"
          placeholder="0.875rem"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Font Weight</Label>
        <select
          value={styles.priceLabelFontWeight}
          onChange={(e) => onStyleChange('priceLabelFontWeight', e.target.value, 'price_filter_label')}
          className="w-full mt-1 h-7 text-xs border border-gray-300 rounded-md"
        >
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </select>
      </div>
    </div>
  );
};

export default PriceFilterLabelSection;
