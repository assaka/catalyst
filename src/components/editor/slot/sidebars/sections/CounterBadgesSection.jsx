import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Counter Badges Section - controls for filter counter badges
 */
const CounterBadgesSection = ({ styles, onStyleChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium">Background Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.counterBgColor}
            onChange={(e) => onStyleChange('counterBgColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.counterBgColor}
            onChange={(e) => onStyleChange('counterBgColor', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Text Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.counterTextColor}
            onChange={(e) => onStyleChange('counterTextColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.counterTextColor}
            onChange={(e) => onStyleChange('counterTextColor', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Font Size</Label>
        <Input
          value={styles.counterFontSize}
          onChange={(e) => onStyleChange('counterFontSize', e.target.value)}
          className="text-xs h-7 mt-1"
          placeholder="0.75rem"
        />
      </div>
    </div>
  );
};

export default CounterBadgesSection;
