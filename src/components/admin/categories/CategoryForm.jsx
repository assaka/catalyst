
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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, AlertTriangle, Image as ImageIcon, X, Languages } from "lucide-react";
import MediaBrowser from '@/components/admin/cms/MediaBrowser';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import TranslationFields from '@/components/admin/TranslationFields';

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
    translations: {},
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
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    if (category) {
      // If translations exist, use them; otherwise create from old columns
      let translations = category.translations || {};

      // Ensure English translation exists (backward compatibility)
      if (!translations.en || (!translations.en.name && category.name)) {
        translations.en = {
          name: category.name || "",
          description: category.description || ""
        };
      }

      const categoryData = {
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image_url: category.image_url || "",
        parent_id: category.parent_id || "",
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== undefined ? category.is_active : true,
        hide_in_menu: category.hide_in_menu || false,
        translations: translations,
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

      // Auto-generate slug from name if 'name' field is being updated and slug editing is disabled
      if (name === "name" && !isEditingSlug) {
        const generatedSlug = value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        newState.slug = generatedSlug;
        
        // Check if this is an edit and slug will change
        if (category && originalSlug && generatedSlug !== originalSlug) {
          setShowSlugChangeWarning(true);
        }
      }
      
      // Direct slug edit - only when editing is enabled
      if (name === "slug") {
        setHasManuallyEditedSlug(true);
        if (category && originalSlug && value !== originalSlug) {
          setShowSlugChangeWarning(true);
        } else if (value === originalSlug) {
          setShowSlugChangeWarning(false);
        }
      }
      
      return newState;
    });
  };

  const handleMediaInsert = async (htmlContent) => {
    // For category image, we expect a single image
    // Extract the URL from the HTML content
    const urlMatch = htmlContent.match(/src="([^"]+)"/);
    if (urlMatch && urlMatch[1]) {
      const newImageUrl = urlMatch[1];
      setFormData(prev => ({ ...prev, image_url: newImageUrl }));
      
      // If editing an existing category, auto-save the image
      if (category && category.id) {
        setSavingImage(true);
        try {
          const storeId = getSelectedStoreId();
          const response = await apiClient.put(`/categories/${category.id}`, {
            ...formData,
            image_url: newImageUrl,
            parent_id: formData.parent_id || null,
            sort_order: parseInt(formData.sort_order) || 0
          });
          
          if (response.success) {
            toast.success('Category image updated successfully');
          } else {
            toast.error('Failed to update category image');
            // Revert the image URL on failure
            setFormData(prev => ({ ...prev, image_url: formData.image_url }));
          }
        } catch (error) {
          console.error('Error saving category image:', error);
          toast.error('Failed to update category image');
          // Revert the image URL on failure
          setFormData(prev => ({ ...prev, image_url: formData.image_url }));
        } finally {
          setSavingImage(false);
        }
      }
    }
    setShowMediaBrowser(false);
  };

  const createRedirectForSlugChange = async () => {
    if (!category || !originalSlug || formData.slug === originalSlug) {
      return;
    }

    try {
      console.log('🔍 Starting redirect creation process');
      console.log('Current URL:', window.location.href);
      console.log('Current page context:', {
        isAdmin: window.location.pathname.includes('/admin'),
        isCategory: window.location.pathname.includes('/categories'),
        userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
      });

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
      
      console.log('🔑 Token check:', {
        localStorage_token: !!localStorage.getItem('token'),
        localStorage_authToken: !!localStorage.getItem('authToken'),
        localStorage_auth_token: !!localStorage.getItem('auth_token'),
        localStorage_store_owner_auth_token: !!localStorage.getItem('store_owner_auth_token'),
        sessionStorage_token: !!sessionStorage.getItem('token'),
        sessionStorage_authToken: !!sessionStorage.getItem('authToken'),
        finalToken: !!token,
        tokenStart: token?.substring(0, 20)
      });
      
      if (!token) {
        console.error('❌ No authentication token available for redirect creation');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        console.log('Available sessionStorage keys:', Object.keys(sessionStorage));
        return;
      }

      console.log('Creating redirect for slug change:', {
        old_slug: originalSlug,
        new_slug: formData.slug,
        entity_type: 'category',
        entity_id: category.id
      });

      const response = await fetch('/api/redirects/slug-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        console.log('✅ Redirect created successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create redirect:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText
        });
        
        // Still allow the form submission to continue
        if (response.status === 401) {
          console.error('🔑 Authentication failed - token may be expired');
          console.log('Current token (first 20 chars):', token?.substring(0, 20));
        }
      }
    } catch (error) {
      console.error('❌ Error creating redirect:', error);
      // Don't throw - allow form submission to continue
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

      // Always create redirect if slug changed (essential for SEO)
      console.log('🔍 Checking redirect creation conditions:', {
        hasCategory: !!category,
        originalSlug,
        currentSlug: formData.slug,
        slugChanged: formData.slug !== originalSlug,
        shouldCreateRedirect: category && originalSlug && formData.slug !== originalSlug
      });
      
      if (category && originalSlug && formData.slug !== originalSlug) {
        console.log('🚀 Creating redirect for slug change');
        await createRedirectForSlugChange();
      } else {
        console.log('❌ Skipping redirect creation');
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
      <Accordion type="single" collapsible className="w-full" defaultValue="translations">
        <AccordionItem value="translations">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5 text-gray-500" />
              <span>Category Translations (Name & Description)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4 bg-gray-50 rounded-b-lg">
            <TranslationFields
              translations={formData.translations}
              onChange={(newTranslations) => {
                setFormData(prev => ({ ...prev, translations: newTranslations }));
                // Auto-update slug from English name if not manually edited
                if (!isEditingSlug && newTranslations.en && newTranslations.en.name) {
                  const generatedSlug = newTranslations.en.name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                  setFormData(prev => ({ ...prev, slug: generatedSlug }));

                  // Check if this is an edit and slug will change
                  if (category && originalSlug && generatedSlug !== originalSlug) {
                    setShowSlugChangeWarning(true);
                  }
                }
              }}
              fields={[
                { name: 'name', label: 'Category Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea', rows: 4 }
              ]}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-slug"
              checked={isEditingSlug}
              onCheckedChange={(checked) => {
                setIsEditingSlug(checked);
                if (!checked) {
                  // Revert to original slug or auto-generate from name
                  if (category && originalSlug) {
                    // Editing existing category - revert to original
                    setFormData(prev => ({ ...prev, slug: originalSlug }));
                  } else {
                    // New category - regenerate from translations.en.name
                    const categoryName = formData.translations?.en?.name || '';
                    const generatedSlug = categoryName.toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
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
          value={formData.slug || ''}
          onChange={handleInputChange}
          placeholder="Auto-generated from category name"
          disabled={!isEditingSlug}
          className={!isEditingSlug ? "bg-gray-50 text-gray-600" : ""}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {!isEditingSlug
            ? "Auto-generated from category name. Enable editing to customize."
            : "Custom URL slug for this category. Changes will affect the category's URL."
          }
        </p>
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
        <Label htmlFor="image_url">Category Image</Label>
        
        <div className="flex gap-2">
          <Input
            id="image_url"
            name="image_url"
            value={formData.image_url || ''}
            onChange={handleInputChange}
            placeholder="Enter URL or select from library"
            className="flex-1"
          />
          
          {/* Select Image button - opens Media Library */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowMediaBrowser(true);
              sessionStorage.removeItem('mediaBrowserShowUpload');
            }}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Select Image
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Select an image from the media library or enter an external URL
        </p>
        
        {/* Image preview if URL exists */}
        {formData.image_url && (
          <div className="mt-3 relative inline-block">
            <img 
              src={formData.image_url} 
              alt="Category" 
              className={`w-32 h-32 object-cover rounded-lg border ${savingImage ? 'opacity-50' : ''}`}
            />
            {savingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
              disabled={savingImage}
            >
              <X className="h-4 w-4" />
            </Button>
            {savingImage && (
              <p className="text-xs text-blue-600 mt-1">Saving image...</p>
            )}
          </div>
        )}
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

      {/* Media Browser Dialog */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onInsert={handleMediaInsert}
        allowMultiple={false}
        uploadFolder="category"
      />
    </form>
  );
}
