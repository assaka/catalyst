import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Type, Box, Code, Image, Layers, Palette, Layout, Move, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * WorkspaceSlotSidebar - Properties panel for editing selected slot
 * Opens when a slot is selected in the WorkspaceSlotEditor
 */
const WorkspaceSlotSidebar = ({
  slot,
  slots,
  onSlotChange,
  onClose,
  onDelete
}) => {
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    layout: true,
    styling: false,
    advanced: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle property change
  const handleChange = useCallback((field, value) => {
    if (!slot) return;

    const updatedSlot = { ...slot };

    // Handle nested fields like position.col
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedSlot[parent] = {
        ...updatedSlot[parent],
        [child]: value
      };
    } else {
      updatedSlot[field] = value;
    }

    onSlotChange(slot.id, updatedSlot);
  }, [slot, onSlotChange]);

  // Handle colSpan change
  const handleColSpanChange = useCallback((value) => {
    if (!slot) return;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > 12) return;

    const updatedSlot = {
      ...slot,
      colSpan: typeof slot.colSpan === 'object'
        ? { ...slot.colSpan, default: numValue }
        : numValue
    };

    onSlotChange(slot.id, updatedSlot);
  }, [slot, onSlotChange]);

  // Get current colSpan value
  const currentColSpan = useMemo(() => {
    if (!slot?.colSpan) return 12;
    if (typeof slot.colSpan === 'number') return slot.colSpan;
    if (typeof slot.colSpan === 'object') {
      const def = slot.colSpan.default;
      if (typeof def === 'number') return def;
      if (typeof def === 'string') {
        const match = def.match(/col-span-(\d+)/);
        return match ? parseInt(match[1], 10) : 12;
      }
    }
    return 12;
  }, [slot?.colSpan]);

  // Get slot type icon
  const getTypeIcon = () => {
    switch (slot?.type) {
      case 'text':
      case 'html':
        return <Type className="h-4 w-4" />;
      case 'component':
        return <Code className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'container':
      case 'grid':
      case 'flex':
        return <Layers className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  if (!slot) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Select a slot to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-sm font-medium truncate max-w-[150px]">
            {slot.metadata?.displayName || slot.id}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
            {slot.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content Section */}
        <Section
          title="Content"
          icon={<Type className="h-4 w-4" />}
          isExpanded={expandedSections.content}
          onToggle={() => toggleSection('content')}
        >
          {slot.type === 'component' ? (
            <div className="space-y-2">
              <Label className="text-xs">Component</Label>
              <div className="text-sm font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                {slot.component || slot.metadata?.component || 'Unknown'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Content</Label>
              <Textarea
                value={slot.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                className="text-xs font-mono min-h-[80px]"
                placeholder="Enter content..."
              />
            </div>
          )}
        </Section>

        {/* Layout Section */}
        <Section
          title="Layout"
          icon={<Layout className="h-4 w-4" />}
          isExpanded={expandedSections.layout}
          onToggle={() => toggleSection('layout')}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Width (cols)</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={currentColSpan}
                onChange={(e) => handleColSpanChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Row</Label>
              <Input
                type="number"
                min="0"
                value={slot.position?.row ?? 0}
                onChange={(e) => handleChange('position.row', parseInt(e.target.value, 10) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Col Start</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={slot.position?.col || 1}
                onChange={(e) => handleChange('position.col', parseInt(e.target.value, 10) || 1)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Section>

        {/* Styling Section */}
        <Section
          title="Styling"
          icon={<Palette className="h-4 w-4" />}
          isExpanded={expandedSections.styling}
          onToggle={() => toggleSection('styling')}
        >
          <div className="space-y-2">
            <Label className="text-xs">CSS Classes</Label>
            <Textarea
              value={slot.className || ''}
              onChange={(e) => handleChange('className', e.target.value)}
              className="text-xs font-mono min-h-[60px]"
              placeholder="Tailwind classes..."
            />
          </div>
        </Section>

        {/* Advanced Section */}
        <Section
          title="Advanced"
          icon={<Code className="h-4 w-4" />}
          isExpanded={expandedSections.advanced}
          onToggle={() => toggleSection('advanced')}
        >
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Slot ID</Label>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1 break-all">
                {slot.id}
              </div>
            </div>
            <div>
              <Label className="text-xs">Parent ID</Label>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1">
                {slot.parentId || '(root)'}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Slot
        </Button>
      </div>
    </div>
  );
};

/**
 * Collapsible section component
 */
const Section = ({ title, icon, isExpanded, onToggle, children }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
    >
      {isExpanded ? (
        <ChevronDown className="h-3 w-3 text-gray-400" />
      ) : (
        <ChevronRight className="h-3 w-3 text-gray-400" />
      )}
      {icon}
      <span className="text-sm font-medium">{title}</span>
    </button>
    {isExpanded && (
      <div className="px-3 pb-3 pt-1">
        {children}
      </div>
    )}
  </div>
);

export default WorkspaceSlotSidebar;
