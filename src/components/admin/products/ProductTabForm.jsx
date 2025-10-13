import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Languages } from "lucide-react";
import TranslationFields from "@/components/admin/TranslationFields";

export default function ProductTabForm({ tab, attributes = [], attributeSets = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    tab_type: "text",
    content: "",
    attribute_ids: [],
    attribute_set_ids: [],
    sort_order: 0,
    is_active: true,
    translations: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab) {
      // Handle translations with backward compatibility
      let translations = tab.translations || {};

      // Ensure English translation exists (backward compatibility)
      if (!translations.en || (!translations.en.name && tab.name)) {
        translations.en = {
          name: tab.name || "",
          content: tab.content || ""
        };
      }

      setFormData({
        name: tab.name || "",
        tab_type: tab.tab_type || "text",
        content: tab.content || "",
        attribute_ids: tab.attribute_ids || [],
        attribute_set_ids: tab.attribute_set_ids || [],
        sort_order: tab.sort_order || 0,
        is_active: tab.is_active ?? true,
        translations: translations,
      });
    }
  }, [tab]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, itemId, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [field]: isChecked 
        ? [...prev[field], itemId]
        : prev[field].filter(id => id !== itemId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0
      };

      // If editing, include the ID
      if (tab && tab.id) {
        submitData.id = tab.id;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting product tab:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="translations">
        <AccordionItem value="translations">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5 text-gray-500" />
              <span>Tab Translations (Name & Content)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4 bg-gray-50 rounded-b-lg">
            <TranslationFields
              translations={formData.translations}
              onChange={(newTranslations) => {
                setFormData(prev => ({ ...prev, translations: newTranslations }));
              }}
              fields={[
                { name: 'name', label: 'Tab Name', type: 'text', required: true },
                { name: 'content', label: 'Tab Content', type: 'textarea', rows: 6, condition: formData.tab_type === 'text' }
              ]}
            />
            <p className="text-sm text-gray-500">
              Note: Content translation only applies when Tab Type is "Text Content"
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="material-elevation-1 border-0">
        <CardHeader>
          <CardTitle>{tab ? 'Edit Product Tab' : 'Add Product Tab'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Tab Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter tab name (e.g., Features, Specifications)"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              This will be displayed as the tab title on product pages
            </p>
          </div>

          <div>
            <Label htmlFor="tab_type">Tab Type *</Label>
            <Select value={formData.tab_type} onValueChange={(value) => handleInputChange("tab_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tab type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Content</SelectItem>
                <SelectItem value="description">Product Description</SelectItem>
                <SelectItem value="attributes">Specific Attributes</SelectItem>
                <SelectItem value="attribute_sets">Attribute Sets</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Choose how this tab will display content on product pages
            </p>
          </div>

          {formData.tab_type === 'text' && (
            <div>
              <Label htmlFor="content">Tab Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Enter the content for this tab..."
                rows={8}
              />
              <p className="text-sm text-gray-500 mt-1">
                You can use HTML for formatting. This content will be displayed when the tab is clicked.
              </p>
            </div>
          )}

          {formData.tab_type === 'attributes' && (
            <div>
              <Label>Select Attributes</Label>
              <div className="grid grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {attributes.length > 0 ? (
                  attributes.map((attribute) => (
                    <div key={attribute.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.id}`}
                        checked={formData.attribute_ids.includes(attribute.id)}
                        onCheckedChange={(checked) => handleArrayChange("attribute_ids", attribute.id, checked)}
                      />
                      <Label htmlFor={`attr-${attribute.id}`} className="text-sm cursor-pointer">
                        {attribute.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-2">No attributes available</p>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selected attributes will be displayed in this tab for each product
              </p>
            </div>
          )}

          {formData.tab_type === 'attribute_sets' && (
            <div>
              <Label>Select Attribute Sets</Label>
              <div className="grid grid-cols-1 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {attributeSets.length > 0 ? (
                  attributeSets.map((attributeSet) => (
                    <div key={attributeSet.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`set-${attributeSet.id}`}
                        checked={formData.attribute_set_ids.includes(attributeSet.id)}
                        onCheckedChange={(checked) => handleArrayChange("attribute_set_ids", attributeSet.id, checked)}
                      />
                      <Label htmlFor={`set-${attributeSet.id}`} className="text-sm cursor-pointer">
                        {attributeSet.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No attribute sets available</p>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                All attributes from selected sets will be displayed in this tab for each product
              </p>
            </div>
          )}

          {formData.tab_type === 'description' && (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                This tab will automatically display the product's description. No additional configuration needed.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleInputChange("sort_order", e.target.value)}
              placeholder="0"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Lower numbers appear first. Use this to control tab order.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Saving...' : (tab ? 'Update Tab' : 'Create Tab')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}