import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PluginForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    long_description: "",
    version: "1.0.0",
    price: 0,
    category: "other",
    icon_url: "",
    screenshots: [],
    commission_rate: 0.3
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === "name") {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        commission_rate: parseFloat(formData.commission_rate) || 0.3
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting plugin:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plugin Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Google Tag Manager"
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">Plugin Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleInputChange("slug", e.target.value)}
            placeholder="e.g., google-tag-manager"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Short Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Brief description of your plugin"
          rows={2}
          required
        />
      </div>

      <div>
        <Label htmlFor="long_description">Detailed Description</Label>
        <Textarea
          id="long_description"
          value={formData.long_description}
          onChange={(e) => handleInputChange("long_description", e.target.value)}
          placeholder="Detailed description, features, installation instructions"
          rows={4}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="version">Version *</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => handleInputChange("version", e.target.value)}
            placeholder="1.0.0"
            required
          />
        </div>

        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="commission_rate">Commission Rate</Label>
          <Input
            id="commission_rate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.commission_rate}
            onChange={(e) => handleInputChange("commission_rate", e.target.value)}
            placeholder="0.30"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="integration">Integration</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="icon_url">Plugin Icon URL</Label>
        <Input
          id="icon_url"
          value={formData.icon_url}
          onChange={(e) => handleInputChange("icon_url", e.target.value)}
          placeholder="https://example.com/icon.png"
        />
      </div>

      <Card className="material-elevation-1 border-0">
        <CardHeader>
          <CardTitle className="text-lg">Submission Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Your plugin will be reviewed before being approved for the marketplace</li>
            <li>• Commission rate determines your earnings (default 30% platform fee)</li>
            <li>• Provide clear documentation and installation instructions</li>
            <li>• Ensure your plugin follows security best practices</li>
            <li>• Free plugins are encouraged and will be featured prominently</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
        >
          {loading ? "Submitting..." : "Submit Plugin"}
        </Button>
      </div>
    </form>
  );
}