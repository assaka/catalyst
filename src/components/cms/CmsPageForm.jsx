
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { X, Plus, Search } from "lucide-react"; // Added Search icon
import { Badge } from "@/components/ui/badge";
import {
  Accordion, // Added Accordion components
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Ensure 'products' is part of the props as it's used in the component
export default function CmsPageForm({ page, stores, products, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    is_active: true,
    store_id: "",
    related_product_ids: [],
    // New SEO fields
    meta_title: "",       // Added meta_title
    meta_description: "", // Added meta_description
    meta_keywords: "",
    meta_robots_tag: "index, follow" // Default to a common, SEO-friendly value
  });

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || "",
        slug: page.slug || "",
        content: page.content || "",
        is_active: page.is_active ?? true,
        store_id: page.store_id || (stores[0]?.id || ""),
        related_product_ids: page.related_product_ids || [],
        // Populate new SEO fields from page data, providing defaults if not present
        meta_title: page.meta_title || "",         // Populate meta_title
        meta_description: page.meta_description || "", // Populate meta_description
        meta_keywords: page.meta_keywords || "",
        meta_robots_tag: page.meta_robots_tag || "index, follow"
      });
    } else {
      // For new pages, ensure store_id is pre-selected if stores exist
      // Other fields will retain their initial useState defaults.
      setFormData(prev => ({ ...prev, store_id: stores[0]?.id || "" }));
    }
  }, [page, stores]);

  // This handleInputChange is refactored to accept an event object for named inputs
  // and direct values for components like Select/Switch or specific logic like slug generation.
  // It handles both scenarios to preserve existing functionality.
  const handleInputChange = (eOrField, value) => {
    if (typeof eOrField === 'string') { // Old signature: handleInputChange("field", value)
      const field = eOrField;
      const val = value;

      // Special handling for title to update slug
      if (field === 'title') {
        const newSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setFormData(prev => ({
          ...prev,
          title: val,
          slug: newSlug,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: val,
        }));
      }
    } else { // New signature: handleInputChange(e) for named inputs
      const { name, value } = eOrField.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const related_product_ids = prev.related_product_ids.includes(productId)
        ? prev.related_product_ids.filter(id => id !== productId)
        : [...prev.related_product_ids, productId];
      return { ...prev, related_product_ids };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title" // Added name prop for consistency
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)} // Keep specific handler for slug generation
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            name="slug" // Added name prop for consistency
            value={formData.slug}
            onChange={(e) => handleInputChange(e)} // Use generic handler
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Content (HTML)</Label>
        <Textarea
          id="content"
          name="content" // Added name prop for consistency
          value={formData.content}
          onChange={(e) => handleInputChange(e)} // Use generic handler
          rows={10}
        />
      </div>

      <div>
        <Label>Related Products</Label>
        <div className="border rounded-md p-2 h-48 overflow-y-auto">
          {products.map(product => (
            <div
              key={product.id}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                formData.related_product_ids.includes(product.id) ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleProductToggle(product.id)}
            >
              <span>{product.name}</span>
              {formData.related_product_ids.includes(product.id) && <X className="w-4 h-4" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {formData.related_product_ids.map(id => {
            const product = products.find(p => p.id === id);
            return product ? <Badge key={id}>{product.name}</Badge> : null;
          })}
        </div>
      </div>

      {/* Store and Active switch section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="store_id">Store *</Label>
          <Select
            value={formData.store_id}
            onValueChange={(value) => handleInputChange("store_id", value)} // Keep specific handler for Select
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleInputChange("is_active", checked)} // Keep specific handler for Switch
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      {/* SEO Settings Accordion */}
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
                onChange={handleInputChange} // Use generic handler
              />
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description || ''}
                onChange={handleInputChange} // Use generic handler
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                name="meta_keywords"
                value={formData.meta_keywords || ''}
                onChange={handleInputChange} // Use generic handler
              />
            </div>
            <div>
              <Label htmlFor="meta_robots_tag">Robots Meta Tag</Label>
              <Select
                value={formData.meta_robots_tag || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, meta_robots_tag: value }))} // Direct update for Select
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

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {page ? "Update Page" : "Create Page"}
        </Button>
      </div>
    </form>
  );
}
