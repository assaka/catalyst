
import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Upload, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CategoryForm({ category, onSubmit, onCancel, parentCategories }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    parent_id: "",
    sort_order: 0,
    is_active: true,
    hide_in_menu: false,
    // New SEO fields
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    meta_robots_tag: "index, follow" // Default value
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image_url: category.image_url || "",
        parent_id: category.parent_id || "",
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== undefined ? category.is_active : true,
        hide_in_menu: category.hide_in_menu || false,
        // New SEO fields
        meta_title: category.meta_title || "",
        meta_description: category.meta_description || "",
        meta_keywords: category.meta_keywords || "",
        meta_robots_tag: category.meta_robots_tag || "index, follow"
      });
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: value
      };

      // Auto-generate slug from name if 'name' field is being updated
      if (name === "name") {
        const generatedSlug = value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        newState.slug = generatedSlug;
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0,
        // Convert empty string to null for UUID fields
        parent_id: formData.parent_id || null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter category name"
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug || ''}
            onChange={handleInputChange}
            placeholder="url-friendly-name"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Category description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="image_url">Category Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="image_url"
            name="image_url"
            value={formData.image_url || ''}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(prev => ({ ...prev, image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop" }))}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            value={formData.sort_order || 0}
            onChange={handleInputChange}
            placeholder="0"
          />
        </div>

      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="is_active" className="text-sm font-medium">
            Active Status
          </Label>
          <p className="text-sm text-gray-500">
            Active categories are visible to customers
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="hide_in_menu" className="text-sm font-medium">
            Hide from Menu
          </Label>
          <p className="text-sm text-gray-500">
            Hidden categories won't appear in navigation
          </p>
        </div>
        <Switch
          id="hide_in_menu"
          checked={formData.hide_in_menu}
          onCheckedChange={(value) => setFormData(prev => ({ ...prev, hide_in_menu: value }))}
        />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="seo">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-500" />
              <span>SEO Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4 bg-gray-50 rounded-b-lg">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                name="meta_title"
                value={formData.meta_title || ''}
                onChange={handleInputChange}
                placeholder="{{category_name}} - {{store_name}}"
              />
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Category Variables:</strong> {{category_name}}, {{category_description}}</p>
                <p className="mt-1"><strong>Global Variables:</strong> {{store_name}}, {{site_name}}, {{store_description}}, {{base_url}}, {{year}}, {{currency}}</p>
                <p className="mt-1 text-xs text-blue-600">💡 Both {{variable}} and {variable} syntax supported</p>
              </div>
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description || ''}
                onChange={handleInputChange}
                placeholder="Shop {{category_name}} at {{store_name}}. {{category_description}}"
                rows={3}
              />
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Category Variables:</strong> {{category_name}}, {{category_description}}</p>
                <p className="mt-1"><strong>Global Variables:</strong> {{store_name}}, {{site_name}}, {{store_description}}, {{base_url}}, {{year}}, {{currency}}</p>
                <p className="mt-1 text-xs text-blue-600">💡 Both {{variable}} and {variable} syntax supported</p>
              </div>
            </div>
            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                name="meta_keywords"
                value={formData.meta_keywords || ''}
                onChange={handleInputChange}
                placeholder="Comma-separated keywords"
              />
            </div>
            <div>
              <Label htmlFor="meta_robots_tag">Robots Meta Tag</Label>
              <Select
                value={formData.meta_robots_tag || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, meta_robots_tag: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select robots tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Default (Index, Follow)</SelectItem>
                  <SelectItem value="index, follow">Index, Follow</SelectItem>
                  <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                  <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                  <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
        >
          {loading ? "Saving..." : (category ? "Update Category" : "Create Category")}
        </Button>
      </div>
    </form>
  );
}
