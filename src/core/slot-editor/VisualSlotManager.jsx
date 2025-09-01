/**
 * VisualSlotManager - Visual interface for managing slot configurations
 * Provides drag-and-drop reordering, slot creation wizard, and JavaScript integration
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Code, 
  Settings,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Copy,
  Zap,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ComponentSlotDefinitions } from './types.js';

const VisualSlotManager = ({
  config = { version: '1.0', slots: {}, metadata: {} },
  componentName = 'ProductCard',
  onChange = () => {},
  availableSlots = [],
  className = ''
}) => {
  // State management
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [newSlot, setNewSlot] = useState({
    id: '',
    enabled: true,
    order: 1,
    component: '',
    props: {},
    customJs: '',
    customCss: ''
  });

  // Get component definition
  const componentDef = ComponentSlotDefinitions[componentName] || {
    availableSlots: [],
    defaultProps: {}
  };

  // Convert config to manageable slot array
  const slotsArray = useMemo(() => {
    const slots = Object.entries(config.slots || {}).map(([id, slotConfig]) => ({
      id,
      ...slotConfig,
      customJs: slotConfig.customJs || '',
      customCss: slotConfig.customCss || ''
    }));
    
    // Sort by order
    return slots.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [config.slots]);

  // Available slots that haven't been added yet
  const availableSlotsToAdd = useMemo(() => {
    const usedSlots = Object.keys(config.slots || {});
    return componentDef.availableSlots.filter(slotId => !usedSlots.includes(slotId));
  }, [config.slots, componentDef.availableSlots]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = slotsArray.findIndex(slot => slot.id === active.id);
    const newIndex = slotsArray.findIndex(slot => slot.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newSlots = arrayMove(slotsArray, oldIndex, newIndex);

    // Update order values
    const updatedSlots = {};
    newSlots.forEach((slot, index) => {
      const { id, ...slotData } = slot;
      updatedSlots[id] = {
        ...slotData,
        order: index + 1
      };
    });

    onChange({
      ...config,
      slots: updatedSlots
    });
  }, [slotsArray, config, onChange]);

  // Handle slot property changes
  const updateSlot = useCallback((slotId, updates) => {
    const updatedSlots = {
      ...config.slots,
      [slotId]: {
        ...config.slots[slotId],
        ...updates
      }
    };

    onChange({
      ...config,
      slots: updatedSlots
    });
  }, [config, onChange]);

  // Handle slot deletion
  const deleteSlot = useCallback((slotId) => {
    const { [slotId]: deletedSlot, ...remainingSlots } = config.slots;
    
    onChange({
      ...config,
      slots: remainingSlots
    });
  }, [config, onChange]);

  // Handle adding new slot
  const handleAddSlot = useCallback(() => {
    if (!newSlot.id) return;

    const slotConfig = {
      enabled: newSlot.enabled,
      order: Math.max(...Object.values(config.slots).map(s => s.order || 0), 0) + 1,
      component: newSlot.component || undefined,
      props: newSlot.props || {},
      customJs: newSlot.customJs || undefined,
      customCss: newSlot.customCss || undefined
    };

    // Remove undefined values
    Object.keys(slotConfig).forEach(key => {
      if (slotConfig[key] === undefined || slotConfig[key] === '') {
        delete slotConfig[key];
      }
    });

    const updatedSlots = {
      ...config.slots,
      [newSlot.id]: slotConfig
    };

    onChange({
      ...config,
      slots: updatedSlots
    });

    // Reset form
    setNewSlot({
      id: '',
      enabled: true,
      order: 1,
      component: '',
      props: {},
      customJs: '',
      customCss: ''
    });
    setShowAddSlot(false);
  }, [newSlot, config, onChange]);

  // Move slot up/down
  const moveSlot = useCallback((slotId, direction) => {
    const currentSlot = slotsArray.find(s => s.id === slotId);
    if (!currentSlot) return;

    const currentIndex = slotsArray.findIndex(s => s.id === slotId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= slotsArray.length) return;

    const targetSlot = slotsArray[newIndex];
    
    // Swap orders
    updateSlot(slotId, { order: targetSlot.order });
    updateSlot(targetSlot.id, { order: currentSlot.order });
  }, [slotsArray, updateSlot]);

  // Sortable slot item component
  const SortableSlotItem = ({ slot, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: slot.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`mb-3 transition-all ${isDragging ? 'shadow-lg rotate-2 z-50' : 'hover:shadow-md'} ${!slot.enabled ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <div
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-5 h-5" />
            </div>

              {/* Slot info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{slot.id}</h4>
                  <Badge variant={slot.enabled ? 'success' : 'secondary'} className="text-xs">
                    {slot.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {slot.required && (
                    <Badge variant="warning" className="text-xs">Required</Badge>
                  )}
                  {slot.customJs && (
                    <Badge variant="info" className="text-xs">JS</Badge>
                  )}
                  {slot.customCss && (
                    <Badge variant="info" className="text-xs">CSS</Badge>
                  )}
                </div>
                
                {slot.component && (
                  <p className="text-xs text-gray-600">Component: {slot.component}</p>
                )}
                
                <div className="text-xs text-gray-500">Order: {slot.order}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSlot(slot.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSlot(slot.id, 'down')}
                  disabled={index === slotsArray.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSlot(slot.id, { enabled: !slot.enabled })}
                  title={slot.enabled ? 'Disable slot' : 'Enable slot'}
                >
                  {slot.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSlot(slot)}
                  title="Edit slot"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSlot(slot.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete slot"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    );
  };

  // Add slot dialog
  const AddSlotDialog = () => (
    <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Slot</DialogTitle>
          <DialogDescription>
            Configure a new slot for your {componentName} component
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="props">Properties</TabsTrigger>
            <TabsTrigger value="code">Custom Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slotId">Slot ID</Label>
                <Select value={newSlot.id} onValueChange={(value) => setNewSlot({...newSlot, id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a slot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlotsToAdd.map(slotId => (
                      <SelectItem key={slotId} value={slotId}>{slotId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="component">Custom Component</Label>
                <Input
                  id="component"
                  placeholder="e.g., MyCustomComponent"
                  value={newSlot.component}
                  onChange={(e) => setNewSlot({...newSlot, component: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newSlot.enabled}
                onCheckedChange={(checked) => setNewSlot({...newSlot, enabled: checked})}
              />
              <Label htmlFor="enabled">Enable this slot</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="props" className="space-y-4">
            <div>
              <Label htmlFor="props">Slot Properties (JSON)</Label>
              <Textarea
                id="props"
                placeholder='{"className": "my-custom-class", "style": {"color": "red"}}'
                value={JSON.stringify(newSlot.props, null, 2)}
                onChange={(e) => {
                  try {
                    const props = JSON.parse(e.target.value || '{}');
                    setNewSlot({...newSlot, props});
                  } catch {
                    // Invalid JSON, keep the text but don't update props
                  }
                }}
                className="font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Properties to pass to the slot component in JSON format
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="space-y-4">
            <div>
              <Label htmlFor="customJs">Custom JavaScript</Label>
              <Textarea
                id="customJs"
                placeholder="// Custom JavaScript code for this slot
console.log('Slot mounted:', slotId);

// Access slot element: slotElement
// Access slot data: slotData"
                value={newSlot.customJs}
                onChange={(e) => setNewSlot({...newSlot, customJs: e.target.value})}
                className="font-mono text-sm"
                rows={8}
              />
            </div>
            
            <div>
              <Label htmlFor="customCss">Custom CSS</Label>
              <Textarea
                id="customCss"
                placeholder="/* Custom CSS styles for this slot */
.my-slot {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 1rem;
  border-radius: 8px;
}"
                value={newSlot.customCss}
                onChange={(e) => setNewSlot({...newSlot, customCss: e.target.value})}
                className="font-mono text-sm"
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowAddSlot(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddSlot} disabled={!newSlot.id}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Edit slot dialog
  const EditSlotDialog = () => {
    if (!selectedSlot) return null;

    const handleSave = () => {
      updateSlot(selectedSlot.id, {
        enabled: selectedSlot.enabled,
        component: selectedSlot.component || undefined,
        props: selectedSlot.props || {},
        customJs: selectedSlot.customJs || undefined,
        customCss: selectedSlot.customCss || undefined
      });
      setSelectedSlot(null);
    };

    return (
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Slot: {selectedSlot.id}</DialogTitle>
            <DialogDescription>
              Modify the configuration for this slot
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="props">Properties</TabsTrigger>
              <TabsTrigger value="code">Custom Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="editComponent">Custom Component</Label>
                <Input
                  id="editComponent"
                  placeholder="e.g., MyCustomComponent"
                  value={selectedSlot.component || ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, component: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="editEnabled"
                  checked={selectedSlot.enabled}
                  onCheckedChange={(checked) => setSelectedSlot({...selectedSlot, enabled: checked})}
                />
                <Label htmlFor="editEnabled">Enable this slot</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="props" className="space-y-4">
              <div>
                <Label htmlFor="editProps">Slot Properties (JSON)</Label>
                <Textarea
                  id="editProps"
                  value={JSON.stringify(selectedSlot.props || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const props = JSON.parse(e.target.value || '{}');
                      setSelectedSlot({...selectedSlot, props});
                    } catch {
                      // Invalid JSON, keep the text but don't update props
                    }
                  }}
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <div>
                <Label htmlFor="editCustomJs">Custom JavaScript</Label>
                <Textarea
                  id="editCustomJs"
                  value={selectedSlot.customJs || ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, customJs: e.target.value})}
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>
              
              <div>
                <Label htmlFor="editCustomCss">Custom CSS</Label>
                <Textarea
                  id="editCustomCss"
                  value={selectedSlot.customCss || ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, customCss: e.target.value})}
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={`visual-slot-manager ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Visual Slot Manager
              <Badge variant="outline">{slotsArray.length} slots</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedEditor(!showAdvancedEditor)}
                title={showAdvancedEditor ? 'Hide JSON' : 'Show JSON'}
              >
                <Code className="w-4 h-4" />
                {showAdvancedEditor ? 'Hide JSON' : 'Show JSON'}
              </Button>
              
              <Button
                onClick={() => setShowAddSlot(true)}
                disabled={availableSlotsToAdd.length === 0}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>How to use:</strong> Drag slots to reorder them, toggle visibility with the eye icon, 
                click edit to modify properties or add custom JavaScript/CSS. Order determines display sequence.
              </div>
            </div>
          </div>

          {/* Slots list */}
          {slotsArray.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slotsArray.map(slot => slot.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-[100px] rounded-lg transition-colors">
                  {slotsArray.map((slot, index) => (
                    <SortableSlotItem key={slot.id} slot={slot} index={index} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Slots Configured</h3>
              <p className="text-gray-600 mb-4">
                Start by adding slots to customize your {componentName} component.
              </p>
              <Button onClick={() => setShowAddSlot(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Slot
              </Button>
            </div>
          )}

          {/* Advanced JSON editor */}
          {showAdvancedEditor && (
            <Card className="mt-4">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Advanced JSON Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(config, null, 2)}
                  onChange={(e) => {
                    try {
                      const newConfig = JSON.parse(e.target.value);
                      onChange(newConfig);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={12}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Direct JSON editing - changes are applied immediately if valid
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddSlotDialog />
      <EditSlotDialog />
    </div>
  );
};

export default VisualSlotManager;