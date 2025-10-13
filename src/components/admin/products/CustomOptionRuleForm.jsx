import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Category } from '@/api/entities';
import { AttributeSet } from '@/api/entities';
import { Attribute } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { X, ChevronsUpDown, Check, Languages } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TranslationFields from "@/components/admin/TranslationFields";

import { useAlertTypes } from '@/hooks/useAlert';
export default function CustomOptionRuleForm({ rule, onSubmit, onCancel }) {
  const { showError, showWarning, showInfo, showSuccess, AlertComponent } = useAlertTypes();
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  
  const [formData, setFormData] = useState({
    name: '',
    display_label: 'Custom Options',
    is_active: true,
    conditions: {
      categories: [],
      attribute_sets: [],
      skus: [],
      attribute_conditions: []
    },
    optional_product_ids: [],
    store_id: '',
    translations: {}
  });

  const [customOptionProducts, setCustomOptionProducts] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Multi-select states
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showAttributeSetSelect, setShowAttributeSetSelect] = useState(false);
  const [showAttributeConditionForm, setShowAttributeConditionForm] = useState(false);
  const [newAttributeCondition, setNewAttributeCondition] = useState({ attribute_code: '', attribute_value: '' });

  // Load static data using selected store
  useEffect(() => {
    const loadStaticData = async () => {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        console.warn('No store selected');
        return;
      }

      try {
        // Set store ID in form data
        setFormData(prev => ({ ...prev, store_id: storeId }));
        
        // Load store-specific data
        const [attributeSetsData, attributesData, categoriesData] = await Promise.all([
          AttributeSet.filter({ store_id: storeId }).catch(() => []),
          Attribute.filter({ store_id: storeId }).catch(() => []),
          Category.filter({ store_id: storeId }).catch(() => [])
        ]);
        
        setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);
        setAttributes(Array.isArray(attributesData) ? attributesData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error("Error loading static data:", error);
        setAttributeSets([]);
        setAttributes([]);
        setCategories([]);
      }
    };

    if (selectedStore) {
      loadStaticData();
    }
  }, [selectedStore]);

  // Load custom option products whenever store_id changes
  useEffect(() => {
    const loadProductsForStore = async () => {
      if (!formData.store_id) {
        setCustomOptionProducts([]);
        return;
      }
      setLoading(true);
      try {
        const { Product } = await import('@/api/entities');
        const products = await Product.filter({ 
          is_custom_option: true, 
          status: 'active',
          store_id: formData.store_id 
        });

        setCustomOptionProducts(Array.isArray(products) ? products : []);
      } catch (error) {
        console.error("Error loading custom option products:", error);
        setCustomOptionProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProductsForStore();
  }, [formData.store_id]);

  // Populate form data when a rule is passed (for editing)
  useEffect(() => {
    if (rule) {
      // Handle translations with backward compatibility
      let translations = rule.translations || {};

      // Ensure English translation exists (backward compatibility)
      if (!translations.en || (!translations.en.display_label && rule.display_label)) {
        translations.en = {
          display_label: rule.display_label || 'Custom Options'
        };
      }

      setFormData({
        name: rule.name || '',
        display_label: rule.display_label || 'Custom Options',
        is_active: rule.is_active !== false,
        conditions: rule.conditions || { categories: [], attribute_sets: [], skus: [], attribute_conditions: [] },
        optional_product_ids: Array.isArray(rule.optional_product_ids) ? rule.optional_product_ids : [],
        store_id: rule.store_id || '',
        translations: translations
      });
    }
  }, [rule]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const handleProductToggle = (productId) => {
    const currentIds = formData.optional_product_ids || [];
    const newIds = currentIds.includes(productId)
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId];
    
    handleInputChange('optional_product_ids', newIds);
  };

  const handleSkuInputChange = (skuString) => {
    const skus = skuString.split(',').map(sku => sku.trim()).filter(sku => sku);
    handleConditionChange('skus', skus);
  };

  const handleAttributeConditionAdd = () => {
    if (newAttributeCondition.attribute_code && newAttributeCondition.attribute_value) {
      const currentConditions = formData.conditions.attribute_conditions || [];
      const updatedConditions = [...currentConditions, { ...newAttributeCondition }];
      
      handleConditionChange('attribute_conditions', updatedConditions);
      setNewAttributeCondition({ attribute_code: '', attribute_value: '' });
      setShowAttributeConditionForm(false);
    }
  };

  const handleAttributeConditionRemove = (index) => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    const updatedConditions = currentConditions.filter((_, i) => i !== index);
    handleConditionChange('attribute_conditions', updatedConditions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      showWarning('Please fill in all required fields and add at least one condition (category, attribute set, SKU, or attribute condition).');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryNames = () => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(cat => cat && formData.conditions.categories?.includes(cat.id)).map(cat => cat.name);
  };

  const getSelectedProductNames = () => {
    if (!Array.isArray(customOptionProducts)) return [];
    return customOptionProducts.filter(prod => prod && formData.optional_product_ids?.includes(prod.id)).map(prod => prod.name);
  };

  const getSelectedAttributeSetNames = () => {
    if (!Array.isArray(attributeSets)) return [];
    return attributeSets.filter(set => set && formData.conditions.attribute_sets?.includes(set.id)).map(set => set.name);
  };

  const getSelectableAttributes = () => {
    if (!Array.isArray(attributes)) return [];
    return attributes.filter(attr => attr && (attr.type === 'select' || attr.type === 'multiselect'));
  };

  const getAttributeOptions = (attributeCode) => {
    if (!Array.isArray(attributes)) return [];
    const attribute = attributes.find(attr => attr && attr.code === attributeCode);
    return attribute?.options || [];
  };

  // Validate that rule has meaningful conditions to prevent it from applying to all products
  const hasValidConditions = () => {
    const { categories, attribute_sets, skus, attribute_conditions } = formData.conditions || {};
    return (
      (categories && categories.length > 0) ||
      (attribute_sets && attribute_sets.length > 0) ||
      (skus && skus.length > 0) ||
      (attribute_conditions && attribute_conditions.length > 0)
    );
  };

  const isFormValid = formData.name && 
                     formData.optional_product_ids?.length > 0 && 
                     formData.store_id &&
                     hasValidConditions();


  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="translations">
        <AccordionItem value="translations">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5 text-gray-500" />
              <span>Display Label Translation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4 bg-gray-50 rounded-b-lg">
            <TranslationFields
              translations={formData.translations}
              onChange={(newTranslations) => {
                setFormData(prev => ({ ...prev, translations: newTranslations }));
              }}
              fields={[
                { name: 'display_label', label: 'Display Label', type: 'text', required: true }
              ]}
            />
            <p className="text-sm text-gray-500">
              Translate the label shown to customers when these custom options appear (e.g., "Custom Options", "Add-ons", "Extras")
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>{rule ? "Edit Custom Option Rule" : "Create Custom Option Rule"}</CardTitle>
          <p className="text-sm text-gray-600">
            Configure which custom options are available for products based on categories, attribute sets, or other conditions.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter rule name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="display_label">Display Label *</Label>
                <Input
                  id="display_label"
                  value={formData.display_label}
                  onChange={(e) => handleInputChange('display_label', e.target.value)}
                  placeholder="Label shown to customers"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {/* Custom Options Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle>Available Custom Options</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading custom option products...</div>
                ) : customOptionProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customOptionProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.optional_product_ids.includes(product.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleProductToggle(product.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.optional_product_ids.includes(product.id)}
                            onChange={() => handleProductToggle(product.id)}
                            className="rounded"
                          />
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            <p className="text-sm font-medium text-green-600">${product.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No custom option products available for the selected store.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Enable "Set as Custom Option" on products and ensure they are assigned to the selected store to make them available here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Conditions (Required)</h3>
              <p className="text-sm text-gray-600">
                At least one condition must be specified to define which products should show these custom options.
                {!hasValidConditions() && (
                  <span className="text-red-600 font-medium"> Please add at least one condition below.</span>
                )}
              </p>

              {/* Categories */}
              <div>
                <Label>Categories</Label>
                <Popover open={showCategorySelect} onOpenChange={setShowCategorySelect}>
                  <PopoverTrigger asChild>
                    <Button
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

              {/* Attribute Conditions */}
              <div>
                <Label>Specific Attribute Values</Label>
                <div className="space-y-2">
                  {formData.conditions.attribute_conditions?.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {attributes.find(attr => attr && attr.code === condition.attribute_code)?.name || condition.attribute_code}
                        : {condition.attribute_value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAttributeConditionRemove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {!showAttributeConditionForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAttributeConditionForm(true)}
                    >
                      Add Attribute Condition
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newAttributeCondition.attribute_code}
                        onChange={(e) => setNewAttributeCondition(prev => ({ ...prev, attribute_code: e.target.value, attribute_value: '' }))}
                        className="flex-1 px-2 py-1 border rounded"
                      >
                        <option value="">Select Attribute</option>
                        {getSelectableAttributes().map(attr => (
                          <option key={attr.code} value={attr.code}>{attr.name}</option>
                        ))}
                      </select>
                      
                      {newAttributeCondition.attribute_code && (
                        <select
                          value={newAttributeCondition.attribute_value}
                          onChange={(e) => setNewAttributeCondition(prev => ({ ...prev, attribute_value: e.target.value }))}
                          className="flex-1 px-2 py-1 border rounded"
                        >
                          <option value="">Select Value</option>
                          {getAttributeOptions(newAttributeCondition.attribute_code).map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                      
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAttributeConditionAdd} disabled={!newAttributeCondition.attribute_code || !newAttributeCondition.attribute_value}>Add</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAttributeConditionForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SKUs */}
              <div>
                <Label htmlFor="skus">SKUs</Label>
                <Input
                  id="skus"
                  value={formData.conditions.skus?.join(', ') || ''}
                  onChange={(e) => handleSkuInputChange(e.target.value)}
                  placeholder="Enter SKUs separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter multiple SKUs separated by commas (e.g., "SKU-001, SKU-002, SKU-003"). Custom options will appear on products matching any of these SKUs.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? "Saving..." : (rule ? "Update Rule" : "Create Rule")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}