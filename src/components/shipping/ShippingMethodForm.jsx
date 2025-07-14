import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';

export default function ShippingMethodForm({ method, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    type: 'flat_rate',
    flat_rate_cost: 0,
    free_shipping_min_order: 0,
    availability: 'all',
    countries: [],
    store_id: ''
  });

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStores();
  }, []);

  const loadUserStores = async () => {
    try {
      // CRITICAL FIX: Only load current user's stores
      const user = await User.me();
      const userStores = await Store.filter({ owner_email: user.email });
      
      setStores(Array.isArray(userStores) ? userStores : []);
      
      // Set default store if available and no method is being edited
      if (!method && userStores && userStores.length > 0) {
        setFormData(prev => ({ ...prev, store_id: userStores[0].id }));
      }
    } catch (error) {
      console.error("Error loading user stores:", error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || '',
        is_active: method.is_active !== false,
        type: method.type || 'flat_rate',
        flat_rate_cost: method.flat_rate_cost || 0,
        free_shipping_min_order: method.free_shipping_min_order || 0,
        availability: method.availability || 'all',
        countries: Array.isArray(method.countries) ? method.countries : [],
        store_id: method.store_id || ''
      });
    }
  }, [method]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.store_id) {
      alert('Please select a store');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting shipping method:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <Label htmlFor="store_id">Store *</Label>
            <Select
              value={formData.store_id}
              onValueChange={(value) => handleInputChange('store_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {stores.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No stores found. Please create a store first.</p>
            )}
          </div>

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
            <Label htmlFor="type">Shipping Type</Label>
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
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'flat_rate' && (
            <div>
              <Label htmlFor="flat_rate_cost">Shipping Cost</Label>
              <Input
                id="flat_rate_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.flat_rate_cost}
                onChange={(e) => handleInputChange('flat_rate_cost', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {formData.type === 'free_shipping' && (
            <div>
              <Label htmlFor="free_shipping_min_order">Minimum Order Amount for Free Shipping</Label>
              <Input
                id="free_shipping_min_order"
                type="number"
                step="0.01"
                min="0"
                value={formData.free_shipping_min_order}
                onChange={(e) => handleInputChange('free_shipping_min_order', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

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
            <Button type="submit" disabled={stores.length === 0}>
              {method ? 'Update Method' : 'Create Method'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}