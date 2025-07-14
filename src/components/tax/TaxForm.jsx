import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export default function TaxForm({ tax, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    country_rates: [{ country: 'US', rate: 0 }]
  });

  useEffect(() => {
    if (tax) {
      setFormData({
        name: tax.name || '',
        description: tax.description || '',
        is_default: tax.is_default || false,
        country_rates: tax.country_rates && tax.country_rates.length > 0 
          ? tax.country_rates 
          : [{ country: 'US', rate: 0 }]
      });
    }
  }, [tax]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('[components/tax/TaxForm.js] Failed to save tax rule:', error);
    }
  };

  const addCountryRate = () => {
    setFormData(prev => ({
      ...prev,
      country_rates: [...prev.country_rates, { country: '', rate: 0 }]
    }));
  };

  const removeCountryRate = (index) => {
    setFormData(prev => ({
      ...prev,
      country_rates: prev.country_rates.filter((_, i) => i !== index)
    }));
  };

  const updateCountryRate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      country_rates: prev.country_rates.map((rate, i) => 
        i === index ? { ...rate, [field]: field === 'rate' ? parseFloat(value) || 0 : value } : rate
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Tax Rule Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Standard VAT, Sales Tax"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this tax rule"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
        />
        <Label htmlFor="is_default">Set as default tax rule</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Tax Rates by Country</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCountryRate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Country
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.country_rates.map((rate, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor={`country-${index}`}>Country Code</Label>
                <Input
                  id={`country-${index}`}
                  value={rate.country}
                  onChange={(e) => updateCountryRate(index, 'country', e.target.value)}
                  placeholder="e.g., US, GB, DE"
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`rate-${index}`}>Tax Rate (%)</Label>
                <Input
                  id={`rate-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rate.rate}
                  onChange={(e) => updateCountryRate(index, 'rate', e.target.value)}
                  required
                />
              </div>
              {formData.country_rates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCountryRate(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {tax ? 'Update' : 'Create'} Tax Rule
        </Button>
      </div>
    </form>
  );
}