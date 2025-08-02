
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
import { Upload, Search, AlertTriangle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';

export default function CategoryForm({ category, onSubmit, onCancel, parentCategories }) {
  const { getSelectedStoreId } = useStoreSelection();
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
  const [originalSlug, setOriginalSlug] = useState("");
  const [showSlugChangeWarning, setShowSlugChangeWarning] = useState(false);
  const [createRedirect, setCreateRedirect] = useState(true);

  useEffect(() => {
    if (category) {
      const categoryData = {
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
      };
      setFormData(categoryData);
      setOriginalSlug(category.slug || "");
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
        
        // Check if this is an edit and slug will change
        if (category && originalSlug && generatedSlug !== originalSlug) {
          setShowSlugChangeWarning(true);
        }
      }
      
      // Direct slug edit
      if (name === "slug" && category && originalSlug && value !== originalSlug) {
        setShowSlugChangeWarning(true);
      } else if (name === "slug" && value === originalSlug) {
        setShowSlugChangeWarning(false);
      }
      
      return newState;
    });
  };

  const createRedirectForSlugChange = async () => {
    if (!category || !originalSlug || formData.slug === originalSlug) {
      return;
    }

    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const response = await fetch('/api/redirects/slug-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          store_id: storeId,
          entity_type: 'category',
          entity_id: category.id,
          old_slug: originalSlug,
          new_slug: formData.slug,
          entity_path_prefix: '/category'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Redirect created:', result.message);
      } else {
        console.error('Failed to create redirect:', await response.text());
      }
    } catch (error) {
      console.error('Error creating redirect:', error);
    }
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

      // Create redirect before updating if slug changed and user opted in
      if (showSlugChangeWarning && createRedirect) {
        await createRedirectForSlugChange();
      }

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

      {showSlugChangeWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-3">
              <div>
                <strong>URL Slug Change Detected</strong>
                <p className="text-sm mt-1">
                  Changing the URL slug from "<code className="bg-amber-100 px-1 rounded">{originalSlug}</code>" to 
                  "<code className="bg-amber-100 px-1 rounded">{formData.slug}</code>" will change the category's URL.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-redirect"
                  checked={createRedirect}
                  onCheckedChange={setCreateRedirect}
                />
                <Label htmlFor="create-redirect" className="text-sm font-medium">
                  Create automatic redirect from old URL to new URL (Recommended)
                </Label>
              </div>
              <p className="text-xs text-amber-700">
                {createRedirect 
                  ? "✅ A redirect will be created to prevent broken links and maintain SEO."
                  : "⚠️ No redirect will be created. Visitors to the old URL will see a 404 error."
                }
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
          <Label htmlFor="parent_id">Parent Category</Label>
          <Select
            value={formData.parent_id || "none"}
            onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === "none" ? null : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parent (Root Category)</SelectItem>
              {parentCategories && parentCategories
                .filter(cat => cat.id !== category?.id) // Don't allow selecting self as parent
                .map((parentCat) => (
                  <SelectItem key={parentCat.id} value={parentCat.id}>
                    {parentCat.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>

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

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Template Variables</h4>
              <p className="text-sm text-blue-800 mb-2">
                You can use these variables in your meta title and description templates:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div><code>{'{{store_name}}'}</code> - Your store name</div>
                <div><code>{'{{page_title}}'}</code> - Current page title</div>
                <div><code>{'{{category_name}}'}</code> - Category name</div>
              </div>
            </div>
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                name="meta_title"
                value={formData.meta_title || ''}
                onChange={handleInputChange}
                placeholder="{{category_name}} - {{store_name}}"
              />
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
