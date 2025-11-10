import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Search, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Dynamic Variant Editor - Loads REAL elements from your actual slot configurations
 */
export default function DynamicVariantEditor({ variant, onChange, storeId }) {
  const [selectedPage, setSelectedPage] = useState('product');
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState(variant?.config?.changes || []);

  const pageTypes = [
    { value: 'home', label: 'Homepage' },
    { value: 'product', label: 'Product Page' },
    { value: 'category', label: 'Category Page' },
    { value: 'cart', label: 'Cart Page' },
    { value: 'checkout', label: 'Checkout Page' },
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
  ];

  // Fetch REAL slot configuration from database
  const { data: configData, isLoading, refetch } = useQuery({
    queryKey: ['slot-config-for-test', storeId, selectedPage],
    queryFn: async () => {
      const response = await apiClient.get(
        `slot-configurations/published/${storeId}/${selectedPage}`
      );
      return response.data;
    },
    enabled: !!storeId && !!selectedPage,
  });

  const slots = configData?.configuration?.slots || {};

  // Convert slots to searchable array with metadata
  const availableElements = Object.entries(slots).map(([id, slot]) => ({
    id,
    name: getSlotDisplayName(id, slot),
    type: slot.type || 'unknown',
    component: slot.component,
    content: slot.content,
    hasStyles: !!slot.styles && Object.keys(slot.styles).length > 0,
    slot, // Keep original slot data
  }));

  // Filter elements by search term
  const filteredElements = availableElements.filter(el => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      el.id.toLowerCase().includes(search) ||
      el.name.toLowerCase().includes(search) ||
      el.type.toLowerCase().includes(search) ||
      el.content?.toLowerCase().includes(search)
    );
  });

  // Helper: Convert slot ID to human-readable name
  function getSlotDisplayName(id, slot) {
    // Try to extract name from ID (e.g., "add_to_cart_button" -> "Add To Cart Button")
    const formatted = id
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    // Add type emoji
    const emoji = {
      button: '🔘',
      text: '📝',
      image: '🖼️',
      component: '⚙️',
      container: '📦',
    }[slot.type] || '•';

    return `${emoji} ${formatted}`;
  }

  const addChange = () => {
    const newChange = {
      id: Date.now().toString(),
      element: '',
      changeType: 'text',
      value: '',
      color: '#000000',
      bgColor: '#ffffff',
      fontSize: '16',
      show: true,
    };
    const updated = [...changes, newChange];
    setChanges(updated);
    updateVariantConfig(updated);
  };

  const removeChange = (id) => {
    const updated = changes.filter(c => c.id !== id);
    setChanges(updated);
    updateVariantConfig(updated);
  };

  const updateChange = (id, field, value) => {
    const updated = changes.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setChanges(updated);
    updateVariantConfig(updated);
  };

  const updateVariantConfig = (changesArray) => {
    const slot_overrides = {};

    changesArray.forEach(change => {
      if (!change.element) return;

      const element = availableElements.find(e => e.id === change.element);
      if (!element) return;

      const override = {};

      // Text changes
      if (change.changeType === 'text' && change.value) {
        override.content = change.value;
      }

      // Style changes
      if (change.changeType === 'style') {
        override.styles = { ...(element.slot.styles || {}) };
        if (change.color) override.styles.color = change.color;
        if (change.bgColor) override.styles.backgroundColor = change.bgColor;
        if (change.fontSize) override.styles.fontSize = `${change.fontSize}px`;
      }

      // Visibility changes
      if (change.changeType === 'visibility') {
        override.enabled = change.show;
      }

      if (Object.keys(override).length > 0) {
        slot_overrides[change.element] = override;
      }
    });

    onChange({
      ...variant,
      config: {
        ...variant.config,
        changes: changesArray,
        slot_overrides,
      }
    });
  };

  const quickAddElement = (elementId) => {
    const element = availableElements.find(e => e.id === elementId);
    if (!element) return;

    // Smart default based on element type
    const defaultChangeType = element.type === 'button' ? 'style' : 'text';

    const newChange = {
      id: Date.now().toString(),
      element: elementId,
      changeType: defaultChangeType,
      value: element.content || '',
      color: element.slot.styles?.color || '#000000',
      bgColor: element.slot.styles?.backgroundColor || '#ffffff',
      fontSize: parseInt(element.slot.styles?.fontSize) || 16,
      show: true,
    };

    const updated = [...changes, newChange];
    setChanges(updated);
    updateVariantConfig(updated);
  };

  return (
    <div className="space-y-4">
      {/* Page & Element Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Page & Elements</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a page to see real elements from your store
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Page Type Selector */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Page Type</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageTypes.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Search Elements */}
          <div>
            <Label>Search Elements</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Available Elements List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredElements.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm ? 'No elements found matching your search.' : 'No elements found on this page. Make sure you have published a slot configuration for this page.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">
                  {filteredElements.length} elements available
                </Label>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <div className="divide-y">
                  {filteredElements.map((element) => (
                    <div
                      key={element.id}
                      className="p-3 hover:bg-muted/50 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{element.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {element.type}
                          </Badge>
                          <code className="text-xs">{element.id}</code>
                        </div>
                        {element.content && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            "{element.content.substring(0, 50)}..."
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => quickAddElement(element.id)}
                        disabled={changes.some(c => c.element === element.id)}
                      >
                        {changes.some(c => c.element === element.id) ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configured Changes */}
      {changes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your Changes</CardTitle>
              <Badge>{changes.length} changes</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {changes.map((change, index) => {
              const element = availableElements.find(e => e.id === change.element);
              if (!element) return null;

              return (
                <Card key={change.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{element.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChange(change.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Change Type */}
                    <div className="space-y-2">
                      <Label>What to change?</Label>
                      <Select
                        value={change.changeType}
                        onValueChange={(value) => updateChange(change.id, 'changeType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">📝 Change Text</SelectItem>
                          <SelectItem value="style">🎨 Change Style (Color/Size)</SelectItem>
                          <SelectItem value="visibility">👁️ Show/Hide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Change */}
                    {change.changeType === 'text' && (
                      <div className="space-y-2">
                        <Label>New Text</Label>
                        <Input
                          placeholder={element.content || "Enter new text..."}
                          value={change.value}
                          onChange={(e) => updateChange(change.id, 'value', e.target.value)}
                        />
                      </div>
                    )}

                    {/* Style Changes */}
                    {change.changeType === 'style' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={change.color}
                              onChange={(e) => updateChange(change.id, 'color', e.target.value)}
                              className="w-12 h-10"
                            />
                            <Input
                              value={change.color}
                              onChange={(e) => updateChange(change.id, 'color', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Background</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={change.bgColor}
                              onChange={(e) => updateChange(change.id, 'bgColor', e.target.value)}
                              className="w-12 h-10"
                            />
                            <Input
                              value={change.bgColor}
                              onChange={(e) => updateChange(change.id, 'bgColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            value={change.fontSize}
                            onChange={(e) => updateChange(change.id, 'fontSize', e.target.value)}
                            placeholder="16"
                          />
                        </div>
                      </div>
                    )}

                    {/* Visibility Toggle */}
                    {change.changeType === 'visibility' && (
                      <div className="space-y-2">
                        <Label>Display</Label>
                        <Select
                          value={change.show ? 'show' : 'hide'}
                          onValueChange={(value) => updateChange(change.id, 'show', value === 'show')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="show">✅ Show Element</SelectItem>
                            <SelectItem value="hide">❌ Hide Element</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="p-4 bg-gray-50 rounded border-2 border-dashed">
                      <div className="text-xs text-muted-foreground mb-2">Preview:</div>
                      {change.changeType === 'text' && change.value && (
                        <div className="font-medium">{change.value}</div>
                      )}
                      {change.changeType === 'style' && (
                        <Button
                          style={{
                            backgroundColor: change.bgColor,
                            color: change.color,
                            fontSize: `${change.fontSize}px`,
                          }}
                          disabled
                        >
                          Sample Button
                        </Button>
                      )}
                      {change.changeType === 'visibility' && (
                        <Badge variant={change.show ? 'default' : 'secondary'}>
                          {change.show ? 'Visible' : 'Hidden'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
