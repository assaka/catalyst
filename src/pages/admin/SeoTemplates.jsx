import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Loader2 } from "lucide-react";
import { SeoTemplate } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import FlashMessage from "@/components/storefront/FlashMessage";

export default function SeoTemplates() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);

  // Form state for new template
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: ''
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
      const templateData = {
        ...formData,
        name: formData.name || `${formData.type} Template`,
        store_id: storeId
      };

      await SeoTemplate.create(templateData);

      // Reset form
      setFormData({
        name: '',
        type: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: ''
      });

      // Reload templates
      await loadTemplates();

      setFlashMessage({
        type: 'success',
        message: 'SEO template added successfully'
      });
    } catch (error) {
      console.error('Error adding SEO template:', error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to add SEO template'
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
          type={flashMessage.type}
          message={flashMessage.message}
          onClose={() => setFlashMessage(null)}
        />
      )}

      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">SEO Templates</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Template</CardTitle>
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
                  <SelectItem value="cms">CMS Pages</SelectItem>
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
                placeholder="{{name}} | {{category}} | {{store_name}}"
              />
              <p className="text-sm text-muted-foreground">
                Available variables: {'{{name}}'}, {'{{category}}'}, {'{{store_name}}'}, {'{{price}}'}
              </p>
            </div>

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

            <Button onClick={handleAddTemplate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </>
              )}
            </Button>
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
                      <strong>Title:</strong> {template.meta_title}
                    </p>
                    {template.meta_description && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Description:</strong> {template.meta_description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}