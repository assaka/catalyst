import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Simple Visual A/B Test Editor
 * No code, no JSON - just point and click!
 */
export default function SimpleVariantEditor({ variant, onChange, pageType = 'product' }) {
  const [changes, setChanges] = useState(variant?.config?.changes || []);

  // Common elements that users typically test
  const elementTemplates = {
    product: [
      { id: 'add_to_cart_button', name: '🛒 Add to Cart Button', type: 'button' },
      { id: 'buy_now_button', name: '⚡ Buy Now Button', type: 'button' },
      { id: 'product_title', name: '📝 Product Title', type: 'text' },
      { id: 'product_price', name: '💰 Product Price', type: 'text' },
      { id: 'product_description', name: '📄 Product Description', type: 'text' },
      { id: 'trust_badges', name: '✓ Trust Badges', type: 'component' },
      { id: 'urgency_timer', name: '⏰ Urgency Timer', type: 'component' },
      { id: 'product_image', name: '🖼️ Product Image', type: 'image' },
    ],
    home: [
      { id: 'hero_title', name: '🎯 Hero Title', type: 'text' },
      { id: 'hero_subtitle', name: '📝 Hero Subtitle', type: 'text' },
      { id: 'hero_cta_button', name: '🔘 Hero CTA Button', type: 'button' },
      { id: 'featured_products', name: '⭐ Featured Products', type: 'component' },
    ],
    cart: [
      { id: 'checkout_button', name: '✅ Checkout Button', type: 'button' },
      { id: 'cart_title', name: '🛒 Cart Title', type: 'text' },
      { id: 'shipping_banner', name: '🚚 Free Shipping Banner', type: 'component' },
    ],
  };

  const availableElements = elementTemplates[pageType] || elementTemplates.product;

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
    // Convert simple changes to slot override format
    const slot_overrides = {};

    changesArray.forEach(change => {
      if (!change.element) return;

      const element = availableElements.find(e => e.id === change.element);
      if (!element) return;

      const override = {};

      // Build override based on change type
      if (change.changeType === 'text' && change.value) {
        override.content = change.value;
      }

      if (change.changeType === 'style' || element.type === 'button') {
        override.styles = {};
        if (change.color) override.styles.color = change.color;
        if (change.bgColor) override.styles.backgroundColor = change.bgColor;
        if (change.fontSize) override.styles.fontSize = `${change.fontSize}px`;
      }

      if (change.changeType === 'visibility') {
        override.enabled = change.show;
      }

      if (Object.keys(override).length > 0) {
        slot_overrides[change.element] = override;
      }
    });

    // Update parent component
    onChange({
      ...variant,
      config: {
        ...variant.config,
        changes: changesArray,
        slot_overrides,
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">What do you want to change?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select elements and modify them - no coding required!
              </p>
            </div>
            <Button onClick={addChange} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Change
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {changes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">
                No changes yet. Click "Add Change" to start!
              </p>
              <Button onClick={addChange} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Change
              </Button>
            </div>
          ) : (
            changes.map((change, index) => (
              <Card key={change.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Change #{index + 1}</Badge>
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
                  {/* Element Selector */}
                  <div className="space-y-2">
                    <Label>What element?</Label>
                    <Select
                      value={change.element}
                      onValueChange={(value) => updateChange(change.id, 'element', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an element..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableElements.map((el) => (
                          <SelectItem key={el.id} value={el.id}>
                            {el.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                        <SelectItem value="text">Change Text</SelectItem>
                        <SelectItem value="style">Change Style (Color/Size)</SelectItem>
                        <SelectItem value="visibility">Show/Hide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Change */}
                  {change.changeType === 'text' && (
                    <div className="space-y-2">
                      <Label>New Text</Label>
                      <Input
                        placeholder="Enter new text..."
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
                  {change.element && (
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
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {changes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-sm mb-2">✨ Summary</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {changes.map((change, i) => {
                const element = availableElements.find(e => e.id === change.element);
                if (!element) return null;
                return (
                  <li key={change.id}>
                    {i + 1}. {element.name}: {change.changeType === 'text' && change.value}
                    {change.changeType === 'style' && 'Style changes'}
                    {change.changeType === 'visibility' && (change.show ? 'Show' : 'Hide')}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
