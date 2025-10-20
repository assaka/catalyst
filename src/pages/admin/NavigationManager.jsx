/**
 * Navigation Manager
 * Manage admin sidebar navigation order and visibility
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  RotateCcw
} from 'lucide-react';
import apiClient from '@/api/client';

const NavigationManager = () => {
  const [navItems, setNavItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadNavigationItems();
  }, []);

  const loadNavigationItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('admin/navigation');

      // Flatten the tree into a flat array for editing
      const flattenTree = (items, result = []) => {
        items.forEach(item => {
          const { children, ...itemWithoutChildren } = item;
          result.push(itemWithoutChildren);
          if (children && children.length > 0) {
            flattenTree(children, result);
          }
        });
        return result;
      };

      // Handle both hierarchical (from backend) and flat array responses
      let items;
      if (response.navigation && Array.isArray(response.navigation)) {
        // Backend returns {success: true, navigation: [...]}
        items = flattenTree(response.navigation);
      } else if (Array.isArray(response.data)) {
        // Fallback: direct array
        items = response.data;
      } else {
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

  const saveChanges = async () => {
    try {
      setSaving(true);

      // Send updates to backend
      await apiClient.post('admin/navigation/reorder', {
        items: navItems.map(item => ({
          key: item.key,
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
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  item.is_visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                }`}
              >
                {/* Drag Handle Visual */}
                <div className="flex items-center text-gray-400">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Order Position Input */}
                <Input
                  type="number"
                  min="1"
                  value={item.order_position}
                  onChange={(e) => updateOrderPosition(index, e.target.value)}
                  className="w-20 text-center"
                />

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
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveDown(index)}
                    disabled={index === navItems.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVisibility(index)}
                  >
                    {item.is_visible ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Tips:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use the up/down arrows to reorder items</li>
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
