import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Loader2, Info, ChevronDown, ChevronUp, Edit, X, ChevronsUpDown, Check, Save } from "lucide-react";
import SaveButton from "@/components/ui/save-button.jsx";
import { SeoTemplate, Category, AttributeSet, Attribute } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import FlashMessage from "@/components/storefront/FlashMessage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { clearSeoTemplatesCache } from "@/utils/cacheUtils";

export default function SeoTemplates() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showVariables, setShowVariables] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Conditions data
  const [categories, setCategories] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showAttributeSetSelect, setShowAttributeSetSelect] = useState(false);

  // Form state for new template
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    meta_robots: '',
    conditions: {
      categories: [],
      attribute_sets: [],
      attribute_conditions: []
    }
  });

  useEffect(() => {
    if (selectedStore) {
      loadTemplates();
    }
  }, [selectedStore]);

  useEffect(() => {
    const loadConditionsData = async () => {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      try {
        const [attributeSetsData, attributesData, categoriesData] = await Promise.all([
          AttributeSet.filter({ store_id: storeId }).catch(() => []),
          Attribute.filter({ store_id: storeId }).catch(() => []),
          Category.filter({ store_id: storeId }).catch(() => [])
        ]);

        setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Transform attributes to include options for select/multiselect types
        const transformedAttributes = (Array.isArray(attributesData) ? attributesData : []).map(attr => ({
          ...attr,
          options: attr.values?.map(v => ({
            value: v.code,
            label: v.translations?.[0]?.value || v.code
          })) || []
        }));
        setAttributes(transformedAttributes);
      } catch (error) {
        console.error("Error loading conditions data:", error);
        setAttributeSets([]);
        setCategories([]);
        setAttributes([]);
      }
    };

    loadConditionsData();
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

    // Parse conditions if it's a string
    let conditions = template.conditions || {};
    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch (e) {
        conditions = {};
      }
    }

    // Ensure conditions has all required fields
    conditions = {
      categories: conditions.categories || [],
      attribute_sets: conditions.attribute_sets || [],
      attribute_conditions: conditions.attribute_conditions || []
    };

    // Populate form with template data
    setFormData({
      name: template.name || '',
      type: template.type || '',
      meta_title: template.template?.meta_title || template.meta_title || '',
      meta_description: template.template?.meta_description || template.meta_description || '',
      meta_keywords: template.template?.meta_keywords || template.meta_keywords || '',
      meta_robots: template.template?.meta_robots || template.meta_robots || '',
      conditions: conditions
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
      meta_robots: '',
      conditions: {
        categories: [],
        attribute_sets: [],
        attribute_conditions: []
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Conditions handlers
  const handleConditionChange = (conditionType, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [conditionType]: value
      }
    }));
  };

  const handleMultiSelectToggle = (condition, id) => {
    const currentValues = formData.conditions[condition] || [];
    const newValues = currentValues.includes(id)
      ? currentValues.filter(item => item !== id)
      : [...currentValues, id];

    handleConditionChange(condition, newValues);
  };

  const getSelectedCategoryNames = () => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(cat => cat && formData.conditions.categories?.includes(cat.id)).map(cat => cat.name);
  };

  const getSelectedAttributeSetNames = () => {
    if (!Array.isArray(attributeSets)) return [];
    return attributeSets.filter(set => set && formData.conditions.attribute_sets?.includes(set.id)).map(set => set.name);
  };

  // Attribute Conditions handlers
  const addAttributeCondition = () => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    handleConditionChange('attribute_conditions',
      [...currentConditions, { attribute_code: '', attribute_value: '' }]);
  };

  const removeAttributeCondition = (index) => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    handleConditionChange('attribute_conditions',
      currentConditions.filter((_, i) => i !== index));
  };

  const updateAttributeCondition = (index, field, value) => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    const updatedConditions = [...currentConditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value,
      // Reset attribute_value when attribute_code changes
      ...(field === 'attribute_code' ? { attribute_value: '' } : {})
    };
    handleConditionChange('attribute_conditions', updatedConditions);
  };

  const getSelectableAttributes = () => {
    return attributes.filter(attr => attr && attr.code);
  };

  const getAttributeLabel = (attr) => {
    return attr.translations?.[0]?.value || attr.label || attr.code;
  };

  const renderConditionValueInput = (condition, index) => {
    const selectedAttr = attributes.find(attr => attr.code === condition.attribute_code);
    const hasOptions = selectedAttr &&
      (selectedAttr.type === 'select' || selectedAttr.type === 'multiselect') &&
      selectedAttr.options?.length > 0;

    if (hasOptions) {
      // Render dropdown for select/multiselect attributes
      return (
        <Select
          value={condition.attribute_value}
          onValueChange={(value) => updateAttributeCondition(index, 'attribute_value', value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {selectedAttr.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Render text input for other attribute types
    return (
      <Input
        placeholder="Value"
        value={condition.attribute_value}
        onChange={(e) => updateAttributeCondition(index, 'attribute_value', e.target.value)}
        className="flex-1"
      />
    );
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
        meta_robots: formData.meta_robots
      };

      if (editingTemplate) {
        // Update existing template
        const templateData = {
          name: formData.name || editingTemplate.name,
          type: formData.type,
          template: template,
          conditions: formData.conditions,
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
          conditions: formData.conditions,
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
        meta_robots: '',
        conditions: {
          categories: [],
          attribute_sets: []
        }
      });

      // Reload templates
      await loadTemplates();

      // Clear storefront cache for instant updates
      if (storeId) clearSeoTemplatesCache(storeId);
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

      // Clear storefront cache for instant updates
      const storeId = getSelectedStoreId();
      if (storeId) clearSeoTemplatesCache(storeId);
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
              <Label htmlFor="meta-robots">Meta Robots</Label>
              <Select
                value={formData.meta_robots}
                onValueChange={(value) => handleInputChange('meta_robots', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meta robots directive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">index, follow (Default - Allow indexing and crawling)</SelectItem>
                  <SelectItem value="noindex, nofollow">noindex, nofollow (Block indexing and crawling)</SelectItem>
                  <SelectItem value="index, nofollow">index, nofollow (Allow indexing, block crawling)</SelectItem>
                  <SelectItem value="noindex, follow">noindex, follow (Block indexing, allow crawling)</SelectItem>
                  <SelectItem value="none">none (Same as noindex, nofollow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditions (Optional) */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Conditions (Optional)</h3>
                <p className="text-sm text-gray-600">
                  Optionally specify conditions to control when this SEO template is applied. If no conditions are specified, the template will apply to all pages of the selected type.
                </p>
              </div>

              {/* Categories */}
              <div>
                <Label>Categories</Label>
                <Popover open={showCategorySelect} onOpenChange={setShowCategorySelect}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between ${formData.conditions.categories?.length ? '' : 'text-muted-foreground'}`}
                    >
                      {formData.conditions.categories?.length
                        ? `${formData.conditions.categories.length} categories selected`
                        : "Select categories..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => handleMultiSelectToggle('categories', category.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.conditions.categories?.includes(category.id) ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {formData.conditions.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSelectedCategoryNames().map((name, index) => {
                      const categoryId = categories.find(c => c && c.name === name)?.id;
                      return (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {name}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              if (categoryId) handleMultiSelectToggle('categories', categoryId);
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Attribute Sets */}
              <div>
                <Label>Attribute Sets</Label>
                <Popover open={showAttributeSetSelect} onOpenChange={setShowAttributeSetSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between ${formData.conditions.attribute_sets?.length ? '' : 'text-muted-foreground'}`}
                    >
                      {formData.conditions.attribute_sets?.length
                        ? `${formData.conditions.attribute_sets.length} attribute sets selected`
                        : "Select attribute sets..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search attribute sets..." />
                      <CommandEmpty>No attribute sets found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {attributeSets.map((set) => (
                            <CommandItem
                              key={set.id}
                              onSelect={() => handleMultiSelectToggle('attribute_sets', set.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.conditions.attribute_sets?.includes(set.id) ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {set.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {formData.conditions.attribute_sets?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSelectedAttributeSetNames().map((name, index) => {
                      const setId = attributeSets.find(s => s && s.name === name)?.id;
                      return (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {name}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              if (setId) handleMultiSelectToggle('attribute_sets', setId);
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Specific Attribute Values */}
              <div>
                <Label>Specific Attribute Values</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Apply this template when products have specific attribute values
                </p>

                <div className="space-y-3">
                  {formData.conditions.attribute_conditions?.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                      {/* Attribute Code Select */}
                      <Select
                        value={condition.attribute_code}
                        onValueChange={(value) => updateAttributeCondition(index, 'attribute_code', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectableAttributes().map(attr => (
                            <SelectItem key={attr.id} value={attr.code}>
                              {getAttributeLabel(attr)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Attribute Value Input (dynamic based on attribute type) */}
                      {renderConditionValueInput(condition, index)}

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttributeCondition(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add New Condition Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAttributeCondition}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute Condition
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4 mb-8">
        <SaveButton
            onClick={handleAddTemplate}
            loading={saving}
            defaultText={editingTemplate ? "Update Template" : "Add Template"}
            loadingText={editingTemplate ? "Updating..." : "Adding..."}
            icon={editingTemplate ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        />
        {editingTemplate && (
            <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
        )}
      </div>
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