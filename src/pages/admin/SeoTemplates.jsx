import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Loader2, Info, ChevronDown, ChevronUp, Edit, X } from "lucide-react";
import { SeoTemplate } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import FlashMessage from "@/components/storefront/FlashMessage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SeoTemplates() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showVariables, setShowVariables] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form state for new template
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    twitter_title: '',
    twitter_description: ''
  });

  useEffect(() => {
    if (selectedStore) {
      loadTemplates();
    }
  }, [selectedStore]);

  const loadTemplates = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await SeoTemplate.filter({ store_id: storeId });
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading SEO templates:', error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to load SEO templates'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);

    // Populate form with template data
    setFormData({
      name: template.name || '',
      type: template.type || '',
      meta_title: template.template?.meta_title || template.meta_title || '',
      meta_description: template.template?.meta_description || template.meta_description || '',
      meta_keywords: template.template?.meta_keywords || template.meta_keywords || '',
      og_title: template.template?.og_title || template.og_title || '',
      og_description: template.template?.og_description || template.og_description || '',
      twitter_title: template.template?.twitter_title || template.twitter_title || '',
      twitter_description: template.template?.twitter_description || template.twitter_description || ''
    });

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      twitter_title: '',
      twitter_description: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTemplate = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      setFlashMessage({
        type: 'error',
        message: 'No store selected'
      });
      return;
    }

    // Validation
    if (!formData.type || !formData.meta_title) {
      setFlashMessage({
        type: 'error',
        message: 'Please select a page type and enter a title template'
      });
      return;
    }

    setSaving(true);
    try {
      // Build template JSON from form fields
      const template = {
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
        og_title: formData.og_title,
        og_description: formData.og_description,
        twitter_title: formData.twitter_title,
        twitter_description: formData.twitter_description
      };

      if (editingTemplate) {
        // Update existing template
        const templateData = {
          name: formData.name || editingTemplate.name,
          type: formData.type,
          template: template,
          store_id: storeId
        };

        await SeoTemplate.update(editingTemplate.id, templateData);

        setFlashMessage({
          type: 'success',
          message: 'SEO template updated successfully'
        });
      } else {
        // Create new template
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const templateData = {
          name: formData.name || `${formData.type} Template - ${timestamp}`,
          type: formData.type,
          template: template,
          store_id: storeId
        };

        await SeoTemplate.create(templateData);

        setFlashMessage({
          type: 'success',
          message: 'SEO template added successfully'
        });
      }

      // Reset form and editing state
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
        twitter_title: '',
        twitter_description: ''
      });

      // Reload templates
      await loadTemplates();
    } catch (error) {
      console.error('Error saving SEO template:', error);

      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save SEO template';

      setFlashMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await SeoTemplate.delete(templateId);
      await loadTemplates();

      setFlashMessage({
        type: 'success',
        message: 'SEO template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting SEO template:', error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to delete SEO template'
      });
    }
  };

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          onClose={() => setFlashMessage(null)}
        />
      )}

      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">SEO Templates</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name (Optional)</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Product Page Template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-type">Page Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Pages</SelectItem>
                  <SelectItem value="category">Category Pages</SelectItem>
                  <SelectItem value="cms_page">CMS Pages</SelectItem>
                  <SelectItem value="homepage">Homepage</SelectItem>
                  <SelectItem value="blog_post">Blog Posts</SelectItem>
                  <SelectItem value="brand">Brand Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title-template">Meta Title Template *</Label>
              <Input
                id="title-template"
                value={formData.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                placeholder="{{product_name}} | {{store_name}}"
              />
            </div>

            {/* Variable Reference */}
            <Collapsible open={showVariables} onOpenChange={setShowVariables}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {showVariables ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {showVariables ? 'Hide' : 'Show'} Available Variables
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-4 border rounded bg-muted/50">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Common Variables (All Page Types)
                    </h4>
                    <ul className="text-xs space-y-1 ml-6">
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{store_name}}'}</code> - Your store name</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{store_description}}'}</code> - Store description</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{site_name}}'}</code> - Site name (same as store_name)</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{base_url}}'}</code> - Base URL of your site</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{current_url}}'}</code> - Current page URL</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{separator}}'}</code> - Title separator (e.g., |)</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{year}}'}</code> - Current year (e.g., 2025)</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{month}}'}</code> - Current month name</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{day}}'}</code> - Current day</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{currency}}'}</code> - Store currency</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{{language_code}}'}</code> - Current language code</li>
                    </ul>
                  </div>

                  {formData.type === 'product' && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Product Page Variables</h4>
                      <ul className="text-xs space-y-1 ml-6">
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{product_name}}'}</code> - Product name (translated)</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{product_description}}'}</code> - Product description</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{category_name}}'}</code> - Product's category name</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{sku}}'}</code> - Product SKU</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{price}}'}</code> - Product price (formatted)</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{brand}}'}</code> - Product brand</li>
                      </ul>
                    </div>
                  )}

                  {formData.type === 'category' && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Category Page Variables</h4>
                      <ul className="text-xs space-y-1 ml-6">
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{category_name}}'}</code> - Category name (translated)</li>
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{category_description}}'}</code> - Category description</li>
                      </ul>
                    </div>
                  )}

                  {formData.type === 'cms_page' && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">CMS Page Variables</h4>
                      <ul className="text-xs space-y-1 ml-6">
                        <li><code className="bg-background px-1 py-0.5 rounded">{'{{page_title}}'}</code> - Page title</li>
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: You can use both single and double curly braces (e.g., {'{product_name}'} or {'{{product_name}}'})
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <Label htmlFor="description-template">Meta Description Template</Label>
              <Textarea
                id="description-template"
                value={formData.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                placeholder="Shop {{name}} in {{category}}. {{description}}"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords-template">Meta Keywords Template</Label>
              <Input
                id="keywords-template"
                value={formData.meta_keywords}
                onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                placeholder="{{name}}, {{category}}, {{brand}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og-title-template">OpenGraph Title (Optional)</Label>
              <Input
                id="og-title-template"
                value={formData.og_title}
                onChange={(e) => handleInputChange('og_title', e.target.value)}
                placeholder="Defaults to meta title if empty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og-description-template">OpenGraph Description (Optional)</Label>
              <Textarea
                id="og-description-template"
                value={formData.og_description}
                onChange={(e) => handleInputChange('og_description', e.target.value)}
                placeholder="Defaults to meta description if empty"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-title-template">Twitter Card Title (Optional)</Label>
              <Input
                id="twitter-title-template"
                value={formData.twitter_title}
                onChange={(e) => handleInputChange('twitter_title', e.target.value)}
                placeholder="Defaults to OG title if empty"
              />
              <p className="text-sm text-muted-foreground">
                Separate title for Twitter cards (falls back to OG title if not set)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-description-template">Twitter Card Description (Optional)</Label>
              <Textarea
                id="twitter-description-template"
                value={formData.twitter_description}
                onChange={(e) => handleInputChange('twitter_description', e.target.value)}
                placeholder="Defaults to OG description if empty"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddTemplate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTemplate ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingTemplate ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Template
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </>
                    )}
                  </>
                )}
              </Button>
              {editingTemplate && (
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No templates found. Add your first template above.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <div key={template.id} className="flex items-start justify-between p-4 border rounded hover:bg-accent/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{template.type}</span>
                      {template.name && (
                        <span className="text-sm text-muted-foreground">- {template.name}</span>
                      )}
                    </div>
                    <p className="text-sm mb-1">
                      <strong>Title:</strong> {template.template?.meta_title || template.meta_title}
                    </p>
                    {(template.template?.meta_description || template.meta_description) && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Description:</strong> {template.template?.meta_description || template.meta_description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}