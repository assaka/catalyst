import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { ShippingMethodType } from '@/api/entities';
export default function ShippingMethodForm({ method, storeId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    shipping_method_type_id: '',
    configuration: {},
    availability: 'all',
    countries: [],
  });

  const [loading, setLoading] = useState(false);
  const [shippingMethodTypes, setShippingMethodTypes] = useState([]);
  const [selectedMethodType, setSelectedMethodType] = useState(null);

  // Load shipping method types on component mount
  useEffect(() => {
    const loadShippingMethodTypes = async () => {
      try {
        const types = await ShippingMethodType.filter({ store_id: storeId, is_active: true });
        setShippingMethodTypes(types || []);
      } catch (error) {
        console.error('Error loading shipping method types:', error);
        setShippingMethodTypes([]);
      }
    };

    if (storeId) {
      loadShippingMethodTypes();
    }
  }, [storeId]);

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || '',
        is_active: method.is_active !== false,
        shipping_method_type_id: method.shipping_method_type_id || '',
        configuration: method.configuration || {},
        availability: method.availability || 'all',
        countries: Array.isArray(method.countries) ? method.countries : [],
      });
      
      // Find and set the selected method type
      if (method.shipping_method_type_id && shippingMethodTypes.length > 0) {
        const methodType = shippingMethodTypes.find(type => type.id === method.shipping_method_type_id);
        setSelectedMethodType(methodType);
      }
    }
  }, [method, shippingMethodTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!storeId) {
      alert('No store selected');
      return;
    }

    try {
      await onSubmit({ ...formData, store_id: storeId });
    } catch (error) {
      console.error('Error submitting shipping method:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigurationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      configuration: { ...prev.configuration, [field]: value }
    }));
  };

  const handleMethodTypeChange = (typeId) => {
    const methodType = shippingMethodTypes.find(type => type.id === typeId);
    setSelectedMethodType(methodType);
    setFormData(prev => ({
      ...prev,
      shipping_method_type_id: typeId,
      configuration: {} // Reset configuration when type changes
    }));
  };

  const renderConfigurationFields = () => {
    if (!selectedMethodType || !selectedMethodType.configuration_schema?.fields) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-gray-700">Configuration</h4>
        {selectedMethodType.configuration_schema.fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === 'text' && (
              <Input
                id={field.name}
                value={formData.configuration[field.name] || field.default_value || ''}
                onChange={(e) => handleConfigurationChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'password' && (
              <Input
                id={field.name}
                type="password"
                value={formData.configuration[field.name] || field.default_value || ''}
                onChange={(e) => handleConfigurationChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={formData.configuration[field.name] || field.default_value || 0}
                onChange={(e) => handleConfigurationChange(field.name, parseFloat(e.target.value) || 0)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'select' && field.options && (
              <Select
                value={formData.configuration[field.name] || field.default_value || ''}
                onValueChange={(value) => handleConfigurationChange(field.name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === 'boolean' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={formData.configuration[field.name] || field.default_value || false}
                  onCheckedChange={(checked) => handleConfigurationChange(field.name, checked)}
                />
                <Label htmlFor={field.name}>{field.label}</Label>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Standard Shipping, Express Delivery"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div>
            <Label htmlFor="shipping_method_type_id">Shipping Method Type</Label>
            <Select
              value={formData.shipping_method_type_id}
              onValueChange={handleMethodTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipping method type" />
              </SelectTrigger>
              <SelectContent>
                {shippingMethodTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderConfigurationFields()}

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
                placeholder="Select countries..."
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!storeId}>
              {method ? 'Update Method' : 'Create Method'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}