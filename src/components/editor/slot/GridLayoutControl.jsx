import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

/**
 * GridLayoutControl Component
 *
 * Provides an intuitive interface for configuring responsive grid layouts
 * across mobile, tablet, and desktop breakpoints.
 */
const GridLayoutControl = ({
  currentConfig = { mobile: 1, tablet: 2, desktop: 3 },
  onConfigChange,
  className = ""
}) => {
  const [gridConfig, setGridConfig] = useState(currentConfig);

  // Update internal state when props change
  useEffect(() => {
    setGridConfig(currentConfig);
  }, [currentConfig]);

  // Handle configuration changes
  const handleConfigChange = (device, columns) => {
    console.log('🔧 GridLayoutControl: Configuration change requested', { device, columns, currentConfig: gridConfig });
    const newConfig = {
      ...gridConfig,
      [device]: parseInt(columns)
    };
    setGridConfig(newConfig);

    console.log('🔧 GridLayoutControl: New configuration', newConfig);
    if (onConfigChange) {
      console.log('🔧 GridLayoutControl: Calling onConfigChange callback');
      onConfigChange(newConfig);
    } else {
      console.warn('🔧 GridLayoutControl: No onConfigChange callback provided');
    }
  };

  // Reset to default configuration
  const handleReset = () => {
    const defaultConfig = { mobile: 1, tablet: 2, desktop: 3 };
    setGridConfig(defaultConfig);

    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }
  };

  // Generate visual grid preview
  const generateGridPreview = (columns) => {
    const boxes = Array.from({ length: columns }, (_, i) => (
      <div
        key={i}
        className="bg-blue-200 rounded-sm aspect-square border border-blue-300"
      />
    ));

    return (
      <div className={`grid gap-1 grid-cols-${columns}`} style={{ width: '60px', height: '40px' }}>
        {boxes}
      </div>
    );
  };

  const devices = [
    {
      key: 'mobile',
      label: 'Mobile',
      icon: Smartphone,
      description: '< 640px',
      options: [1, 2],
      value: gridConfig.mobile
    },
    {
      key: 'tablet',
      label: 'Tablet',
      icon: Tablet,
      description: '640px - 1024px',
      options: [1, 2, 3],
      value: gridConfig.tablet
    },
    {
      key: 'desktop',
      label: 'Desktop',
      icon: Monitor,
      description: '> 1024px',
      options: [1, 2, 3, 4, 5],
      value: gridConfig.desktop
    }
  ];

  console.log('🔧 GridLayoutControl: Rendering with config', { gridConfig, currentConfig });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Grid Layout</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-6 px-2 text-xs"
          title="Reset to default (1/2/3)"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {devices.map((device) => {
          const IconComponent = device.icon;

          return (
            <div key={device.key} className="flex items-center space-x-3">
              {/* Device Icon & Label */}
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <IconComponent className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-700">{device.label}</div>
                  <div className="text-xs text-gray-500">{device.description}</div>
                </div>
              </div>

              {/* Grid Preview */}
              <div className="flex-shrink-0">
                {generateGridPreview(device.value)}
              </div>

              {/* Column Selector */}
              <div className="flex-shrink-0 w-16">
                {/* Temporarily using HTML select for debugging */}
                <select
                  value={device.value.toString()}
                  onChange={(e) => {
                    console.log('🔧 HTML Select onChange triggered', { device: device.key, value: e.target.value, currentValue: device.value });
                    handleConfigChange(device.key, e.target.value);
                  }}
                  className="h-8 text-xs border border-gray-300 rounded-md w-full bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onClick={() => console.log('🔧 HTML Select clicked for', device.key)}
                >
                  {device.options.map((option) => (
                    <option key={option} value={option.toString()}>
                      {option} col{option !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {/* Original shadcn Select - commented out for debugging
                <Select
                  value={device.value.toString()}
                  onValueChange={(value) => {
                    console.log('🔧 Select onValueChange triggered', { device: device.key, value, currentValue: device.value });
                    handleConfigChange(device.key, value);
                  }}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    onClick={() => console.log('🔧 SelectTrigger clicked for', device.key)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {device.options.map((option) => (
                      <SelectItem
                        key={option}
                        value={option.toString()}
                        onClick={() => console.log('🔧 SelectItem clicked', { device: device.key, option })}
                      >
                        {option} col{option !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                */}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated CSS Classes Preview (for debugging) */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
        <code>
          grid-cols-{gridConfig.mobile} sm:grid-cols-{gridConfig.tablet} lg:grid-cols-{gridConfig.desktop}
        </code>
      </div>
    </div>
  );
};

export default GridLayoutControl;