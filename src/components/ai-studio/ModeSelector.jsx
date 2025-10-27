import React from 'react';
import { cn } from '@/lib/utils';
import { Package, Languages, Layout, Code2 } from 'lucide-react';
import { AI_STUDIO_MODES } from '@/contexts/AIStudioContext';

/**
 * ModeSelector - Tab interface for switching between AI Studio modes
 */
const ModeSelector = ({ currentMode, onModeChange, className }) => {
  const modes = [
    {
      id: AI_STUDIO_MODES.PLUGIN,
      label: 'Plugin',
      icon: Package,
      description: 'Create or edit plugins',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: AI_STUDIO_MODES.TRANSLATION,
      label: 'Translation',
      icon: Languages,
      description: 'Bulk translate content',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: AI_STUDIO_MODES.LAYOUT,
      label: 'Layout',
      icon: Layout,
      description: 'Generate page layouts',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: AI_STUDIO_MODES.CODE,
      label: 'Code',
      icon: Code2,
      description: 'Edit code with AI',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className={cn('flex items-center border-b border-gray-200 dark:border-gray-700', className)}>
      <div className="flex space-x-1 px-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5',
                'text-sm font-medium',
                'transition-all duration-150',
                'border-b-2 -mb-px',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              )}
              title={mode.description}
            >
              <Icon className={cn('w-4 h-4', isActive && mode.color)} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
