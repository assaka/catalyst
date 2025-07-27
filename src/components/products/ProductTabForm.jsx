import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function ProductTabForm({ tab, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab) {
      setFormData({
        name: tab.name || "",
        content: tab.content || "",
        sort_order: tab.sort_order || 0,
        is_active: tab.is_active ?? true,
      });
    }
  }, [tab]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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