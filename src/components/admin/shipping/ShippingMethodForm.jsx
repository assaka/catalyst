import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SaveButton from '@/components/ui/save-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { Textarea } from '@/components/ui/textarea';
import { Languages } from 'lucide-react';
import TranslationFields from '@/components/admin/TranslationFields';

import { useAlertTypes } from '@/hooks/useAlert';
export default function ShippingMethodForm({ method, storeId, onSubmit, onCancel }) {
  const { showError, showWarning, showInfo, showSuccess, AlertComponent } = useAlertTypes();
  const [showTranslations, setShowTranslations] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    type: 'flat_rate',
    flat_rate_cost: 0,
    free_shipping_min_order: 0,
    weight_ranges: [],
    price_ranges: [],
    availability: 'all',
    countries: [],
    min_delivery_days: 1,
    max_delivery_days: 7,
    sort_order: 0,
    translations: {}
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (method) {
      let translations = method.translations || {};
      if (!translations.en) {
        translations.en = {
          name: method.name || '',
          description: method.description || ''
        };
      }

      setFormData({
        name: method.name || '',
        description: method.description || '',
        is_active: method.is_active !== false,
        type: method.type || 'flat_rate',
        flat_rate_cost: method.flat_rate_cost || 0,
        free_shipping_min_order: method.free_shipping_min_order || 0,
        weight_ranges: method.weight_ranges || [],
        price_ranges: method.price_ranges || [],
        availability: method.availability || 'all',
        countries: Array.isArray(method.countries) ? method.countries : [],
        min_delivery_days: method.min_delivery_days || 1,
        max_delivery_days: method.max_delivery_days || 7,
        sort_order: method.sort_order || 0,
        translations: translations
      });
    }
  }, [method]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId) {
      showWarning('No store selected');
      return;
    }

    setSaveSuccess(false);
    setLoading(true);
    try {
      await onSubmit({ ...formData, store_id: storeId });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error submitting shipping method:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWeightRange = () => {
    setFormData(prev => ({
      ...prev,
      weight_ranges: [...prev.weight_ranges, { min_weight: 0, max_weight: 0, cost: 0 }]
    }));
  };

  const updateWeightRange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      weight_ranges: prev.weight_ranges.map((range, i) => 
        i === index ? { ...range, [field]: parseFloat(value) || 0 } : range
      )
    }));
  };

  const removeWeightRange = (index) => {
    setFormData(prev => ({
      ...prev,
      weight_ranges: prev.weight_ranges.filter((_, i) => i !== index)
    }));
  };

  const addPriceRange = () => {
    setFormData(prev => ({
      ...prev,
      price_ranges: [...prev.price_ranges, { min_price: 0, max_price: 0, cost: 0 }]
    }));
  };

  const updatePriceRange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      price_ranges: prev.price_ranges.map((range, i) => 
        i === index ? { ...range, [field]: parseFloat(value) || 0 } : range
      )
    }));
  };

  const removePriceRange = (index) => {
    setFormData(prev => ({
      ...prev,
      price_ranges: prev.price_ranges.filter((_, i) => i !== index)
    }));
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'flat_rate':
        return (
          <div>
            <Label htmlFor="flat_rate_cost">Flat Rate Cost ($) *</Label>
            <Input
              id="flat_rate_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.flat_rate_cost}
              onChange={(e) => handleInputChange('flat_rate_cost', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 9.99"
              required
            />
          </div>
        );

      case 'free_shipping':
        return (
          <div>
            <Label htmlFor="free_shipping_min_order">Minimum Order Amount for Free Shipping ($)</Label>
            <Input
              id="free_shipping_min_order"
              type="number"
              step="0.01"
              min="0"
              value={formData.free_shipping_min_order}
              onChange={(e) => handleInputChange('free_shipping_min_order', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 50.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              Orders above this amount will qualify for free shipping. Set to 0 for always free.
            </p>
          </div>
        );

      case 'weight_based':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Weight-Based Pricing</Label>
              <Button type="button" onClick={addWeightRange} size="sm">
                Add Weight Range
              </Button>
            </div>
            {formData.weight_ranges.map((range, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded">
                <div>
                  <Label className="text-xs">Min Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={range.min_weight}
                    onChange={(e) => updateWeightRange(index, 'min_weight', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={range.max_weight}
                    onChange={(e) => updateWeightRange(index, 'max_weight', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={range.cost}
                    onChange={(e) => updateWeightRange(index, 'cost', e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeWeightRange(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        );

      case 'price_based':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Price-Based Shipping</Label>
              <Button type="button" onClick={addPriceRange} size="sm">
                Add Price Range
              </Button>
            </div>
            {formData.price_ranges.map((range, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded">
                <div>
                  <Label className="text-xs">Min Order Value ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={range.min_price}
                    onChange={(e) => updatePriceRange(index, 'min_price', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Order Value ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={range.max_price}
                    onChange={(e) => updatePriceRange(index, 'max_price', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Shipping Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={range.cost}
                    onChange={(e) => updatePriceRange(index, 'cost', e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removePriceRange(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{method ? 'Edit Shipping Method' : 'Add New Shipping Method'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <Label htmlFor="name">Method Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  name: newName,
                  translations: {
                    ...prev.translations,
                    en: { ...prev.translations.en, name: newName }
                  }
                }));
              }}
              placeholder="e.g., Standard Shipping, Express Delivery"
              required
            />
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
            >
              <Languages className="w-4 h-4" />
              {showTranslations ? 'Hide translations' : 'Manage translations'}
            </button>
          </div>

          {showTranslations && (
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-blue-900">Shipping Method Translations</h3>
              </div>
              <TranslationFields
                translations={formData.translations}
                onChange={(newTranslations) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: newTranslations,
                    name: newTranslations.en?.name || prev.name,
                    description: newTranslations.en?.description || prev.description
                  }));
                }}
                fields={[
                  { name: 'name', label: 'Method Name', type: 'text', required: true },
                  { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false }
                ]}
              />
            </div>
          )}

          {!showTranslations && (
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const newDescription = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    description: newDescription,
                    translations: {
                      ...prev.translations,
                      en: { ...prev.translations.en, description: newDescription }
                    }
                  }));
                }}
                placeholder="Brief description of this shipping method"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div>
            <Label htmlFor="type">Shipping Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat_rate">Flat Rate</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                <SelectItem value="weight_based">Weight Based</SelectItem>
                <SelectItem value="price_based">Price Based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderTypeSpecificFields()}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_delivery_days">Min Delivery Days</Label>
              <Input
                id="min_delivery_days"
                type="number"
                min="1"
                value={formData.min_delivery_days}
                onChange={(e) => handleInputChange('min_delivery_days', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="max_delivery_days">Max Delivery Days</Label>
              <Input
                id="max_delivery_days"
                type="number"
                min="1"
                value={formData.max_delivery_days}
                onChange={(e) => handleInputChange('max_delivery_days', parseInt(e.target.value) || 7)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="Order in which this method appears (0 = first)"
            />
          </div>

          <div>
            <Label htmlFor="availability">Availability</Label>
            <Select
              value={formData.availability}
              onValueChange={(value) => handleInputChange('availability', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="specific_countries">Specific Countries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.availability === 'specific_countries' && (
            <div>
              <Label htmlFor="countries">Allowed Countries</Label>
              <CountrySelect
                value={formData.countries}
                onChange={(countries) => handleInputChange('countries', countries)}
                multiple={true}
                placeholder="Select countries where this shipping method is available..."
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <SaveButton
              type="submit"
              loading={loading}
              success={saveSuccess}
              disabled={!storeId}
              defaultText={method ? "Update Method" : "Create Method"}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}