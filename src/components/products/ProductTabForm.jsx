
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductTabForm({ tab, stores, attributes, attributeSets, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    content_type: "description",
    attribute_codes: [],
    attribute_set_ids: [],
    sort_order: 0,
    is_active: true,
    store_id: (stores && stores.length > 0) ? stores[0]?.id || "" : ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab) {
      console.log("DEBUG: Loading tab data:", tab);
      console.log("DEBUG: Tab attribute_set_ids:", tab.attribute_set_ids);
      setFormData({
        title: tab.title || "",
        content_type: tab.content_type || "description",
        attribute_codes: tab.attribute_codes || [],
        attribute_set_ids: tab.attribute_set_ids || [],
        sort_order: tab.sort_order || 0,
        is_active: tab.is_active ?? true,
        store_id: tab.store_id || (stores && stores.length > 0 ? stores[0]?.id || "" : "")
      });
    }
  }, [tab, stores]);

  const handleInputChange = (field, value) => {
    console.log(`DEBUG: Changing ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeToggle = (attributeCode) => {
    console.log("DEBUG: Toggling attribute:", attributeCode);
    setFormData(prev => ({
      ...prev,
      attribute_codes: prev.attribute_codes.includes(attributeCode)
        ? prev.attribute_codes.filter(code => code !== attributeCode)
        : [...prev.attribute_codes, attributeCode]
    }));
  };

  const handleAttributeSetToggle = (attributeSetId) => {
    console.log("DEBUG: Toggling attribute set:", attributeSetId);
    console.log("DEBUG: Current attribute_set_ids:", formData.attribute_set_ids);

    setFormData(prev => {
      const newAttributeSetIds = prev.attribute_set_ids.includes(attributeSetId)
        ? prev.attribute_set_ids.filter(id => id !== attributeSetId)
        : [...prev.attribute_set_ids, attributeSetId];

      console.log("DEBUG: New attribute_set_ids:", newAttributeSetIds);

      return {
        ...prev,
        attribute_set_ids: newAttributeSetIds
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0
      };

      console.log("DEBUG: Submitting product tab data:", submitData);
      console.log("DEBUG: Final attribute_set_ids:", submitData.attribute_set_ids);

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting product tab:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="material-elevation-1 border-0">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tab Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter tab title"
                required
              />
            </div>

            <div>
              <Label htmlFor="content_type">Content Type *</Label>
              <Select value={formData.content_type} onValueChange={(value) => handleInputChange("content_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="description">Product Description</SelectItem>
                  <SelectItem value="attributes">Product Attributes</SelectItem>
                  <SelectItem value="reviews">Product Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange("sort_order", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div>
              <Label htmlFor="store">Store</Label>
              <Select value={formData.store_id} onValueChange={(value) => handleInputChange("store_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Attribute Configuration */}
        {formData.content_type === 'attributes' && (
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Attribute Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base font-medium">Attribute Sets</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Select attribute sets to include all their attributes
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {attributeSets.map((attributeSet) => (
                    <div key={attributeSet.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`set-${attributeSet.id}`}
                        checked={formData.attribute_set_ids.includes(attributeSet.id)}
                        onCheckedChange={() => handleAttributeSetToggle(attributeSet.id)}
                      />
                      <Label htmlFor={`set-${attributeSet.id}`} className="text-sm">
                        {attributeSet.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Individual Attributes</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Select specific attributes to include
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {attributes.map((attribute) => (
                    <div key={attribute.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.id}`}
                        checked={formData.attribute_codes.includes(attribute.code)}
                        onCheckedChange={() => handleAttributeToggle(attribute.code)}
                      />
                      <Label htmlFor={`attr-${attribute.id}`} className="text-sm">
                        {attribute.name} ({attribute.code})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {(formData.attribute_codes.length > 0 || formData.attribute_set_ids.length > 0) && (
                <div>
                  <Label className="text-base font-medium">Selected Items</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.attribute_set_ids.map((setId) => {
                      const attributeSet = attributeSets.find(set => set.id === setId);
                      return (
                        <Badge key={setId} variant="default">
                          Set: {attributeSet?.name}
                        </Badge>
                      );
                    })}
                    {formData.attribute_codes.map((code) => {
                      const attribute = attributes.find(attr => attr.code === code);
                      return (
                        <Badge key={code} variant="outline">
                          {attribute?.name || code}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
        >
          {loading ? "Saving..." : (tab ? "Update Tab" : "Create Tab")}
        </Button>
      </div>
    </form>
  );
}
