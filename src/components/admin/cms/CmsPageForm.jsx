
import React, { useState, useEffect, useRef } from "react";
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
import { X, Plus, Search, AlertTriangle, ImagePlus } from "lucide-react"; // Added ImagePlus icon
import { Badge } from "@/components/ui/badge";
import {
  Accordion, // Added Accordion components
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import MediaBrowser from './MediaBrowser';

// Ensure 'products' is part of the props as it's used in the component
export default function CmsPageForm({ page, stores, products, onSubmit, onCancel }) {
  const { getSelectedStoreId } = useStoreSelection();
  const contentTextareaRef = useRef(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [showSlugChangeWarning, setShowSlugChangeWarning] = useState(false);
  const [createRedirect, setCreateRedirect] = useState(true);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  
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
    meta_robots_tag: "index, follow", // Default to a common, SEO-friendly value
    translations: {
      en: {
        title: "",
        content: ""
      }
    }
  });

  useEffect(() => {
    if (page) {
      // Initialize translations with existing data or empty structure
      const translations = page.translations || {
        en: {
          title: page.title || '',
          content: page.content || ''
        }
      };

      setFormData({
        title: translations.en?.title || page.title || "",
        slug: page.slug || "",
        content: translations.en?.content || page.content || "",
        is_active: page.is_active ?? true,
        store_id: page.store_id || getSelectedStoreId() || "",
        related_product_ids: page.related_product_ids || [],
        // Populate new SEO fields from page data, providing defaults if not present
        meta_title: page.meta_title || "",         // Populate meta_title
        meta_description: page.meta_description || "", // Populate meta_description
        meta_keywords: page.meta_keywords || "",
        meta_robots_tag: page.meta_robots_tag || "index, follow",
        translations: translations
      });

      // Set original slug for slug change detection
      setOriginalSlug(page.slug || "");
      // If page has a slug, consider it manually set
      setHasManuallyEditedSlug(!!(page.slug));
      setIsEditingSlug(!!(page.slug));
    } else {
      // For new pages, automatically use the selected store ID
      const storeId = getSelectedStoreId();
      setFormData(prev => ({ ...prev, store_id: storeId || "" }));
    }
  }, [page, stores]);

  // This handleInputChange is refactored to accept an event object for named inputs
  // and direct values for components like Select/Switch or specific logic like slug generation.
  // It handles both scenarios to preserve existing functionality.
  const handleInputChange = (eOrField, value) => {
    if (typeof eOrField === 'string') { // Old signature: handleInputChange("field", value)
      const field = eOrField;
      const val = value;

      // Special handling for title to update slug (only if not manually edited)
      if (field === 'title') {
        if (!hasManuallyEditedSlug) {
          const newSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          setFormData(prev => ({
            ...prev,
            title: val,
            slug: newSlug,
            translations: {
              ...prev.translations,
              en: {
                ...prev.translations?.en,
                title: val
              }
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            title: val,
            translations: {
              ...prev.translations,
              en: {
                ...prev.translations?.en,
                title: val
              }
            }
          }));
        }
      } else if (field === 'slug') {
        // Direct slug edit
        setHasManuallyEditedSlug(true);

        if (page && originalSlug && val !== originalSlug) {
          setShowSlugChangeWarning(true);
        } else if (val === originalSlug) {
          setShowSlugChangeWarning(false);
        }

        setFormData(prev => ({
          ...prev,
          [field]: val,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: val,
        }));
      }
    } else { // New signature: handleInputChange(e) for named inputs
      const { name, value } = eOrField.target;

      // Check for slug changes in event handler
      if (name === 'slug') {
        setHasManuallyEditedSlug(true);

        if (page && originalSlug && value !== originalSlug) {
          setShowSlugChangeWarning(true);
        } else if (value === originalSlug) {
          setShowSlugChangeWarning(false);
        }
      }

      // Bidirectional syncing for title and content
      if (name === 'title' || name === 'content') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          translations: {
            ...prev.translations,
            en: {
              ...prev.translations?.en,
              [name]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
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

  const handleMediaInsert = (htmlContent) => {
    if (contentTextareaRef.current) {
      const textarea = contentTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content || '';
      
      // Insert HTML at cursor position or replace selection
      const newContent = 
        currentContent.substring(0, start) + 
        htmlContent + 
        currentContent.substring(end);
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Set cursor position after inserted content
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + htmlContent.length;
        textarea.focus();
      }, 0);
    }
  };

  const createRedirectForSlugChange = async () => {
    if (!page || !originalSlug || formData.slug === originalSlug) {
      return;
    }

    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        console.warn('No store ID available for redirect creation');
        return;
      }

      // Use the same token lookup logic as apiClient
      const token = localStorage.getItem('store_owner_auth_token') ||
                   localStorage.getItem('customer_auth_token') ||
                   localStorage.getItem('auth_token') ||
                   localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   sessionStorage.getItem('token') ||
                   sessionStorage.getItem('authToken');
      
      if (!token) {
        console.error('❌ No authentication token available for redirect creation');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        return;
      }

      console.log('Creating redirect for slug change:', {
        old_slug: originalSlug,
        new_slug: formData.slug,
        entity_type: 'cms_page',
        entity_id: page.id
      });

      const response = await fetch('/api/redirects/slug-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: storeId,
          entity_type: 'cms_page',
          entity_id: page.id,
          old_slug: originalSlug,
          new_slug: formData.slug,
          entity_path_prefix: '/page'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Redirect created successfully:', result.message);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create redirect:', response.status, errorText);
        
        // Still allow the form submission to continue
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
        }
      }
    } catch (error) {
      console.error('❌ Error creating redirect:', error);
      // Don't throw - allow form submission to continue
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Always create redirect if slug changed (essential for SEO)
    if (page && originalSlug && formData.slug !== originalSlug) {
      await createRedirectForSlugChange();
    }

    // Prepare payload with translations
    const payload = {
      ...formData,
      translations: formData.translations || {
        en: {
          title: formData.title,
          content: formData.content
        }
      }
    };

    console.log('🔍 CmsPageForm: Submitting payload:', {
      title: payload.title,
      content: payload.content?.substring(0, 50),
      translations: payload.translations
    });

    onSubmit(payload);
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
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-slug"
                checked={isEditingSlug}
                onCheckedChange={(checked) => {
                  setIsEditingSlug(checked);
                  if (!checked) {
                    // Revert to original slug or auto-generate from title
                    if (page && originalSlug) {
                      // Editing existing page - revert to original
                      setFormData(prev => ({ ...prev, slug: originalSlug }));
                    } else {
                      // New page - regenerate from title
                      const generatedSlug = formData.title.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      setFormData(prev => ({ ...prev, slug: generatedSlug }));
                    }
                    setHasManuallyEditedSlug(false);
                    setShowSlugChangeWarning(false);
                  }
                }}
              />
              <Label htmlFor="edit-slug" className="text-sm">
                Enable editing
              </Label>
            </div>
          </div>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={(e) => handleInputChange(e)}
            placeholder="Auto-generated from page title"
            disabled={!isEditingSlug}
            className={!isEditingSlug ? "bg-gray-50 text-gray-600" : ""}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {!isEditingSlug 
              ? "Auto-generated from page title. Enable editing to customize."
              : "Custom URL slug for this page. Changes will affect the page's URL."
            }
          </p>
        </div>
      </div>

      {showSlugChangeWarning && hasManuallyEditedSlug && isEditingSlug && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-3">
              <div>
                <strong>URL Slug Change Detected</strong>
                <p className="text-sm mt-1">
                  Changing the URL slug from "<code className="bg-amber-100 px-1 rounded">{originalSlug}</code>" to 
                  "<code className="bg-amber-100 px-1 rounded">{formData.slug}</code>" will change the page's URL.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-redirect-cms"
                  checked={createRedirect}
                  onCheckedChange={setCreateRedirect}
                />
                <Label htmlFor="create-redirect-cms" className="text-sm font-medium">
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
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="content">Content (HTML)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMediaBrowser(true)}
            className="flex items-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Insert Media
          </Button>
        </div>
        <Textarea
          ref={contentTextareaRef}
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

      {/* Active switch section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center space-x-2">
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

      {/* Media Browser Dialog */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onInsert={handleMediaInsert}
        allowMultiple={true}
      />
    </form>
  );
}
