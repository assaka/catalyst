import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Container Section - controls for container background and padding
 */
const ContainerSection = ({ styles, onStyleChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium">Background Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={styles.containerBg}
            onChange={(e) => onStyleChange('containerBg', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300"
          />
          <Input
            value={styles.containerBg}
            onChange={(e) => onStyleChange('containerBg', e.target.value)}
            className="text-xs h-7"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Padding</Label>
        <Input
          value={styles.containerPadding}
          onChange={(e) => onStyleChange('containerPadding', e.target.value)}
          className="text-xs h-7 mt-1"
          placeholder="1rem"
        />
      </div>
    </div>
  );
};

export default ContainerSection;
