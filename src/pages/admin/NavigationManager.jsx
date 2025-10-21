/**
 * Navigation Manager
 * Manage admin sidebar navigation order and visibility
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '@/api/client';

// Sortable Item Component
const SortableItem = ({ item, index, isChild, onMoveUp, onMoveDown, onToggleVisibility, onUpdateOrder, onUpdateParent, onToggleCollapse, isCollapsed, hasChildren, canMoveUp, canMoveDown, availableParents }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-lg border ${
        item.is_visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
      } ${isChild ? 'ml-8' : ''}`}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="flex items-center text-gray-400 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Collapse Toggle (only for parent items) */}
      {hasChildren ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          className="p-0 h-6 w-6"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      ) : (
        <div className="w-6" />
      )}

      {/* Order Position Input */}
      <Input
        type="number"
        min="1"
        value={item.order_position}
        onChange={(e) => onUpdateOrder(e.target.value)}
        className="w-20 text-center"
      />

      {/* Parent Selector */}
      <Select
        value={item.parent_key || 'none'}
        onValueChange={(value) => onUpdateParent(value === 'none' ? null : value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Parent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Top Level</SelectItem>
          {availableParents.map(parent => (
            <SelectItem key={parent.key} value={parent.key}>
              {parent.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Item Details */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{item.label}</span>
          {item.is_core && (
            <Badge variant="secondary" className="text-xs">Core</Badge>
          )}
          {item.plugin_id && (
            <Badge variant="outline" className="text-xs">Plugin</Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {item.route} • {item.icon}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onMoveUp}
          disabled={!canMoveUp}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onMoveDown}
          disabled={!canMoveDown}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleVisibility}
        >
          {item.is_visible ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </Button>
      </div>
    </div>
  );
};

const NavigationManager = () => {
  const [navItems, setNavItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadNavigationItems();
  }, []);

  const loadNavigationItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('admin/navigation');

      // Flatten the tree into a flat array for editing, preserving parent info
      const flattenTree = (items, parent_key = null, result = []) => {
        items.forEach(item => {
          const { children, ...itemWithoutChildren } = item;
          result.push({
            ...itemWithoutChildren,
            parent_key: item.parent_key || parent_key,
            children: children || []
          });
          if (children && children.length > 0) {
            flattenTree(children, item.key, result);
          }
        });
        return result;
      };

      // Handle both hierarchical (from backend) and flat array responses
      let items;

      // Check if response has data property (axios wraps responses)
      const data = response.data || response;

      if (data.navigation && Array.isArray(data.navigation)) {
        // Backend returns {success: true, navigation: [...]}
        items = flattenTree(data.navigation);
      } else if (Array.isArray(data)) {
        // Fallback: direct array
        items = data;
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Invalid response format');
      }

      const sortedItems = items.sort((a, b) => a.order_position - b.order_position);
      setNavItems(sortedItems);
      setOriginalItems(JSON.parse(JSON.stringify(sortedItems)));
    } catch (error) {
      console.error('Error loading navigation:', error);
      alert('Failed to load navigation items: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setNavItems((items) => {
      const draggedItem = items.find(item => item.key === active.id);
      const targetItem = items.find(item => item.key === over.id);

      if (!draggedItem || !targetItem) {
        return items;
      }

      // Check if user is trying to drop ON an item (to make it a child)
      // vs dropping BETWEEN items (to reorder at same level)
      const dropOnItem = event.collisions?.[0]?.data?.droppableContainer?.id === over.id;

      const newItems = [...items];
      const draggedIndex = newItems.findIndex(item => item.key === active.id);
      const targetIndex = newItems.findIndex(item => item.key === over.id);

      if (dropOnItem && targetItem.key !== draggedItem.parent_key) {
        // Dropping ON an item - make it a child of that item
        console.log(`Making ${draggedItem.label} a child of ${targetItem.label}`);
        newItems[draggedIndex] = {
          ...draggedItem,
          parent_key: targetItem.key
        };

        // Recalculate order positions for children of new parent
        const siblings = newItems.filter(item =>
          item.parent_key === targetItem.key && item.key !== draggedItem.key
        );
        const newOrder = siblings.length + 1;
        newItems[draggedIndex].order_position = newOrder * 10;

      } else {
        // Dropping BETWEEN items - reorder at same level
        const movedItems = arrayMove(newItems, draggedIndex, targetIndex);

        // Update order positions
        movedItems.forEach((item, idx) => {
          item.order_position = (idx + 1) * 10;
        });

        return movedItems;
      }

      return newItems;
    });

    setHasChanges(true);
  };

  const toggleCollapse = (key) => {
    setCollapsedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;

    const newItems = [...navItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;

    // Update order positions
    newItems.forEach((item, idx) => {
      item.order_position = idx + 1;
    });

    setNavItems(newItems);
    setHasChanges(true);
  };

  const moveDown = (index) => {
    if (index === navItems.length - 1) return;

    const newItems = [...navItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;

    // Update order positions
    newItems.forEach((item, idx) => {
      item.order_position = idx + 1;
    });

    setNavItems(newItems);
    setHasChanges(true);
  };

  const toggleVisibility = (index) => {
    const newItems = [...navItems];
    newItems[index].is_visible = !newItems[index].is_visible;
    setNavItems(newItems);
    setHasChanges(true);
  };

  const updateOrderPosition = (index, value) => {
    const newPosition = parseInt(value);
    if (isNaN(newPosition) || newPosition < 1) return;

    const newItems = [...navItems];
    newItems[index].order_position = newPosition;

    // Re-sort by order position
    newItems.sort((a, b) => a.order_position - b.order_position);

    setNavItems(newItems);
    setHasChanges(true);
  };

  const updateParent = (index, newParentKey) => {
    const newItems = [...navItems];
    const item = newItems[index];

    // Set new parent
    item.parent_key = newParentKey;

    // Calculate new order_position based on hierarchical numbering:
    // - Top-level items (parent_key = null): 1, 10, 20, 30, 40, 50... (+10 increment)
    // - Child items: parent_position + 1, parent_position + 2, parent_position + 3... (+1 increment)

    if (newParentKey === null) {
      // Moving to top level
      const topLevelItems = newItems.filter(i =>
        i.parent_key === null && i.key !== item.key
      );

      if (topLevelItems.length > 0) {
        const maxTopLevelOrder = Math.max(...topLevelItems.map(i => i.order_position || 0));
        item.order_position = maxTopLevelOrder + 10;
      } else {
        item.order_position = 1;
      }
    } else {
      // Moving to be a child of a parent
      const parent = newItems.find(i => i.key === newParentKey);
      const siblings = newItems.filter(i =>
        i.parent_key === newParentKey && i.key !== item.key
      );

      if (siblings.length > 0) {
        // Add after the last sibling (increment by 1)
        const maxSiblingOrder = Math.max(...siblings.map(s => s.order_position || 0));
        item.order_position = maxSiblingOrder + 1;
      } else if (parent) {
        // First child: parent_position + 1
        item.order_position = (parent.order_position || 0) + 1;
      } else {
        // Fallback
        item.order_position = 1;
      }
    }

    setNavItems(newItems);
    setHasChanges(true);
  };

  // Get available parent options for an item (only top-level items)
  const getAvailableParents = (itemKey) => {
    // Only return top-level items (parent_key = null) that are not the item itself
    return navItems.filter(item =>
      item.parent_key === null && item.key !== itemKey
    );
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      // Send updates to backend - include parent_key to preserve hierarchy
      await apiClient.post('admin/navigation/reorder', {
        items: navItems.map(item => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          route: item.route,
          parent_key: item.parent_key,
          order_position: item.order_position,
          is_visible: item.is_visible
        }))
      });

      alert('Navigation order saved successfully!');
      setOriginalItems(JSON.parse(JSON.stringify(navItems)));
      setHasChanges(false);

      // Reload to confirm
      await loadNavigationItems();
    } catch (error) {
      console.error('Error saving navigation order:', error);
      alert('Failed to save changes: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setNavItems(JSON.parse(JSON.stringify(originalItems)));
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Navigation Manager</h1>
        <p className="text-gray-600">Manage the order and visibility of admin sidebar items</p>
      </div>

      {hasChanges && (
        <Card className="mb-6 border-l-4 border-l-blue-600 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-800 font-medium">You have unsaved changes</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetChanges} disabled={saving}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={saveChanges} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Navigation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={navItems.map(item => item.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  // Check if this is a child item
                  const isChild = !!item.parent_key;

                  // Check if parent is collapsed
                  const parentCollapsed = item.parent_key && collapsedItems.has(item.parent_key);

                  // Check if this item has children
                  const hasChildren = navItems.some(child => child.parent_key === item.key);

                  // Check if this item is collapsed
                  const isCollapsed = collapsedItems.has(item.key);

                  // Don't render child items if their parent is collapsed
                  if (parentCollapsed) {
                    return null;
                  }

                  return (
                    <SortableItem
                      key={item.key}
                      item={item}
                      index={index}
                      isChild={isChild}
                      hasChildren={hasChildren}
                      isCollapsed={isCollapsed}
                      canMoveUp={index > 0}
                      canMoveDown={index < navItems.length - 1}
                      onMoveUp={() => moveUp(index)}
                      onMoveDown={() => moveDown(index)}
                      onToggleVisibility={() => toggleVisibility(index)}
                      onUpdateOrder={(value) => updateOrderPosition(index, value)}
                      onUpdateParent={(value) => updateParent(index, value)}
                      onToggleCollapse={() => toggleCollapse(item.key)}
                      availableParents={getAvailableParents(item.key)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Tips:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Drag items by the grip handle to reorder them</li>
          <li>• Use the up/down arrows for precise positioning</li>
          <li>• Use the parent dropdown to change an item's hierarchy level</li>
          <li>• Click chevron icons to expand/collapse parent items with children</li>
          <li>• Click the eye icon to show/hide items from the sidebar</li>
          <li>• Enter a specific number to jump to that position</li>
          <li>• Core items are built-in, Plugin items are added by plugins</li>
          <li>• Changes are not saved until you click "Save Changes"</li>
        </ul>
      </div>
    </div>
  );
};

export default NavigationManager;
