import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient from '@/api/client';

const PluginSettingsDialog = ({ plugin, open, onOpenChange, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [navEnabled, setNavEnabled] = useState(false);
  const [navLabel, setNavLabel] = useState('');
  const [navIcon, setNavIcon] = useState('Package');
  const [navRoute, setNavRoute] = useState('');
  const [navParentKey, setNavParentKey] = useState('');
  const [navOrder, setNavOrder] = useState(100);

  // Parent options for dropdown
  const parentOptions = [
    { value: '', label: 'None (Standalone)' },
    { value: 'catalog', label: 'Catalog' },
    { value: 'products', label: 'Products (under Catalog)' },
    { value: 'sales', label: 'Sales' },
    { value: 'orders', label: 'Orders (under Sales)' },
    { value: 'customers', label: 'Customers (under Sales)' },
    { value: 'content', label: 'Content' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'seo', label: 'SEO' },
  ];

  // Load plugin settings when dialog opens
  useEffect(() => {
    if (plugin && open) {
      const adminNav = plugin.manifest?.adminNavigation || {};
      setNavEnabled(adminNav.enabled || false);
      setNavLabel(adminNav.label || plugin.name);
      setNavIcon(adminNav.icon || 'Package');
      setNavRoute(adminNav.route || `/admin/plugin/${plugin.id}`);
      setNavParentKey(adminNav.parentKey || '');
      setNavOrder(adminNav.order || 100);
    }
  }, [plugin, open]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const navigationSettings = {
        enabled: navEnabled,
        label: navLabel,
        icon: navIcon,
        route: navRoute,
        parentKey: navParentKey || null,
        order: parseInt(navOrder),
      };

      await apiClient.put(`/admin/plugins/${plugin.id}/navigation`, {
        adminNavigation: navigationSettings
      });

      // Notify parent component
      if (onSave) {
        await onSave();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving plugin settings:', error);
      alert('Failed to save settings: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!plugin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plugin Settings - {plugin.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Navigation Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-lg font-semibold">Admin Navigation</h3>
                <p className="text-sm text-gray-600">Configure where this plugin appears in the admin sidebar</p>
              </div>
              <Switch
                checked={navEnabled}
                onCheckedChange={setNavEnabled}
              />
            </div>

            {navEnabled && (
              <div className="space-y-4 pl-4">
                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor="nav-label">Navigation Label</Label>
                  <Input
                    id="nav-label"
                    value={navLabel}
                    onChange={(e) => setNavLabel(e.target.value)}
                    placeholder="My Plugin"
                  />
                  <p className="text-xs text-gray-500">The text shown in the sidebar</p>
                </div>

                {/* Icon */}
                <div className="space-y-2">
                  <Label htmlFor="nav-icon">Icon Name</Label>
                  <Input
                    id="nav-icon"
                    value={navIcon}
                    onChange={(e) => setNavIcon(e.target.value)}
                    placeholder="Package"
                  />
                  <p className="text-xs text-gray-500">Lucide icon name (e.g., Package, Settings, Users)</p>
                </div>

                {/* Route */}
                <div className="space-y-2">
                  <Label htmlFor="nav-route">Route</Label>
                  <Input
                    id="nav-route"
                    value={navRoute}
                    onChange={(e) => setNavRoute(e.target.value)}
                    placeholder="/admin/my-plugin"
                  />
                  <p className="text-xs text-gray-500">The URL path for this plugin's admin page</p>
                </div>

                {/* Parent Key */}
                <div className="space-y-2">
                  <Label htmlFor="nav-parent">Parent Category</Label>
                  <Select value={navParentKey} onValueChange={setNavParentKey}>
                    <SelectTrigger id="nav-parent">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Where to place this item in the sidebar hierarchy
                  </p>
                </div>

                {/* Order Position */}
                <div className="space-y-2">
                  <Label htmlFor="nav-order">Order Position</Label>
                  <Input
                    id="nav-order"
                    type="number"
                    value={navOrder}
                    onChange={(e) => setNavOrder(e.target.value)}
                    placeholder="100"
                    min="1"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first (e.g., 10 appears before 100)</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {navEnabled && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">{navLabel}</span>
                <span className="text-gray-500">({navIcon})</span>
                {navParentKey && (
                  <span className="text-gray-400">→ {parentOptions.find(p => p.value === navParentKey)?.label}</span>
                )}
                <span className="ml-auto text-gray-400">Order: {navOrder}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PluginSettingsDialog;
