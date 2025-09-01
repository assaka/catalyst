/**
 * SimpleSlotManager - A clear, intuitive interface for managing component slots
 * Focused on simplicity, visual clarity, and easy slot enhancement
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Settings, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2,
  Sparkles,
  Palette,
  Code2,
  Layout,
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb
} from 'lucide-react';

import { ComponentSlotDefinitions } from './types.js';

const SimpleSlotManager = ({
  config = { version: '1.0', slots: {}, metadata: {} },
  componentName = 'ProductCard',
  onChange = () => {},
  className = ''
}) => {
  // Local state for UI
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  // Get component definition
  const componentDef = ComponentSlotDefinitions[componentName] || {
    displayName: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  // Convert slots to a manageable array
  const activeSlots = useMemo(() => {
    const slotsObj = config.slots || {};
    return Object.entries(slotsObj)
      .map(([id, slotConfig]) => ({
        id,
        ...slotConfig,
        displayName: id.split('.').pop() || id // Get last part for display
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [config.slots]);

  // Available slots that can be added
  const availableSlots = useMemo(() => {
    const used = activeSlots.map(s => s.id);
    return componentDef.availableSlots
      .filter(slotId => !used.includes(slotId))
      .map(slotId => ({
        id: slotId,
        displayName: slotId.split('.').pop() || slotId,
        description: getSlotDescription(slotId)
      }));
  }, [activeSlots, componentDef.availableSlots]);

  // Get friendly description for a slot
  function getSlotDescription(slotId) {
    const descriptions = {
      'container': 'Main wrapper around the entire component',
      'image': 'Product image display area',
      'content': 'Main content area with text and details',
      'name': 'Product name/title display',
      'pricing': 'Price information and discount displays', 
      'actions': 'Action buttons area (add to cart, wishlist)',
      'add_to_cart': 'Add to cart button',
      'header': 'Top section header',
      'sidebar': 'Side panel content',
      'summary': 'Summary information section',
      'checkout': 'Checkout related controls'
    };
    
    const lastPart = slotId.split('.').pop();
    return descriptions[lastPart] || `Customizable ${lastPart} section`;
  }

  // Update a slot's configuration
  const updateSlot = useCallback((slotId, updates) => {
    const newSlots = {
      ...config.slots,
      [slotId]: {
        ...config.slots[slotId],
        ...updates
      }
    };

    onChange({
      ...config,
      slots: newSlots
    });
  }, [config, onChange]);

  // Add a new slot
  const addSlot = useCallback((slotId) => {
    const newOrder = Math.max(...Object.values(config.slots || {}).map(s => s.order || 0), 0) + 1;
    
    const newSlots = {
      ...config.slots,
      [slotId]: {
        enabled: true,
        order: newOrder,
        props: {}
      }
    };

    onChange({
      ...config,
      slots: newSlots
    });
    
    setShowAddDialog(false);
  }, [config, onChange]);

  // Remove a slot
  const removeSlot = useCallback((slotId) => {
    const { [slotId]: removed, ...remainingSlots } = config.slots;
    
    onChange({
      ...config,
      slots: remainingSlots
    });
  }, [config, onChange]);

  // Move slot up/down in order
  const moveSlot = useCallback((slotId, direction) => {
    const currentIndex = activeSlots.findIndex(s => s.id === slotId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeSlots.length) return;
    
    const currentSlot = activeSlots[currentIndex];
    const targetSlot = activeSlots[targetIndex];
    
    // Swap their orders
    updateSlot(currentSlot.id, { order: targetSlot.order });
    updateSlot(targetSlot.id, { order: currentSlot.order });
  }, [activeSlots, updateSlot]);

  // Slot Card Component
  const SlotCard = ({ slot, index }) => (
    <Card className={`mb-4 transition-all hover:shadow-md ${!slot.enabled ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Slot info */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="text-xs px-2">{index + 1}</Badge>
              <div className="text-xs text-gray-500">Order</div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-base">{slot.displayName}</h4>
                <Badge variant={slot.enabled ? 'default' : 'secondary'}>
                  {slot.enabled ? 'Active' : 'Disabled'}
                </Badge>
                
                {slot.component && (
                  <Badge variant="outline" className="text-xs">
                    Custom: {slot.component}
                  </Badge>
                )}
                
                {slot.customCss && (
                  <Badge variant="info" className="text-xs flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    CSS
                  </Badge>
                )}
                
                {slot.customJs && (
                  <Badge variant="warning" className="text-xs flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    JS
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600">{getSlotDescription(slot.id)}</p>
              <div className="text-xs text-gray-400 mt-1">ID: {slot.id}</div>
            </div>
          </div>
          
          {/* Right side - Controls */}
          <div className="flex items-center gap-2">
            {/* Move controls */}
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveSlot(slot.id, 'up')}
                disabled={index === 0}
                title="Move up"
                className="h-6 w-8 p-0"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveSlot(slot.id, 'down')}
                disabled={index === activeSlots.length - 1}
                title="Move down"
                className="h-6 w-8 p-0"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Toggle enabled */}
            <Button
              variant={slot.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => updateSlot(slot.id, { enabled: !slot.enabled })}
              title={slot.enabled ? 'Disable slot' : 'Enable slot'}
              className="flex items-center gap-1"
            >
              {slot.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {slot.enabled ? 'Hide' : 'Show'}
            </Button>
            
            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSlot(slot)}
              title="Enhance slot"
              className="flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Enhance
            </Button>
            
            {/* Delete button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeSlot(slot.id)}
              title="Remove slot"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Add Slot Dialog
  const AddSlotDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Slot to {componentDef.displayName}
          </DialogTitle>
          <DialogDescription>
            Choose which part of your component you want to customize
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All available slots have been added!</p>
            </div>
          ) : (
            availableSlots.map((slot) => (
              <Card key={slot.id} className="hover:bg-blue-50 cursor-pointer transition-colors">
                <CardContent className="p-4" onClick={() => addSlot(slot.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{slot.displayName}</h4>
                      <p className="text-sm text-gray-600">{slot.description}</p>
                      <div className="text-xs text-gray-400 mt-1">{slot.id}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Slot Enhancement Dialog
  const SlotEnhancementDialog = () => {
    if (!editingSlot) return null;

    const [localSlot, setLocalSlot] = useState(editingSlot);

    const handleSave = () => {
      updateSlot(editingSlot.id, {
        component: localSlot.component || undefined,
        customCss: localSlot.customCss || undefined,
        customJs: localSlot.customJs || undefined,
        props: localSlot.props || {}
      });
      setEditingSlot(null);
    };

    return (
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Enhance {localSlot.displayName} Slot
            </DialogTitle>
            <DialogDescription>
              Add custom styling, behavior, or replace with your own component
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Custom Component */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Custom Component (Optional)
              </Label>
              <Input
                placeholder="e.g., MyCustomProductCard"
                value={localSlot.component || ''}
                onChange={(e) => setLocalSlot({...localSlot, component: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                Replace the default slot content with your own React component
              </p>
            </div>

            {/* Custom CSS */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Custom CSS Styles
              </Label>
              <Textarea
                placeholder="/* Add your custom CSS here */
.my-slot {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 1rem;
  border-radius: 8px;
}

.my-slot:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}"
                value={localSlot.customCss || ''}
                onChange={(e) => setLocalSlot({...localSlot, customCss: e.target.value})}
                className="font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-gray-500">
                CSS will be applied to this slot automatically
              </p>
            </div>

            {/* Custom JavaScript */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Custom JavaScript
              </Label>
              <Textarea
                placeholder="// Add your custom JavaScript here
console.log('Slot enhanced:', slotData);

// Add click tracking
slotElement.addEventListener('click', () => {
  analytics.track('slot_clicked', {
    slotId: '${localSlot.id}',
    component: '${componentName}'
  });
});

// Dynamic content updates
if (slotData.product.sale) {
  slotElement.classList.add('sale-item');
}"
                value={localSlot.customJs || ''}
                onChange={(e) => setLocalSlot({...localSlot, customJs: e.target.value})}
                className="font-mono text-sm"
                rows={10}
              />
              <p className="text-xs text-gray-500">
                JavaScript runs when the slot loads. Available variables: slotElement, slotData, slotId
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Apply Enhancement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={`simple-slot-manager ${className}`}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Manage {componentDef.displayName} Slots
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Customize how your component looks and behaves by managing its slots
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {activeSlots.length} Active
              </Badge>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                disabled={availableSlots.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Help Guide */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-2">How to use slots:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>Add slots</strong> to customize different parts of your component</li>
                <li>• <strong>Reorder slots</strong> using the up/down arrows to change layout</li>
                <li>• <strong>Show/Hide slots</strong> to control what appears on your site</li>
                <li>• <strong>Enhance slots</strong> with custom styling, behavior, or components</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slots List */}
      {activeSlots.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Slots Added Yet</h3>
            <p className="text-gray-600 mb-6">
              Start customizing your {componentDef.displayName} by adding some slots
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Slot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-0">
          {activeSlots.map((slot, index) => (
            <SlotCard key={slot.id} slot={slot} index={index} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddSlotDialog />
      <SlotEnhancementDialog />
    </div>
  );
};

export default SimpleSlotManager;