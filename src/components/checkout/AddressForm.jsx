import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelect } from '@/components/ui/country-select';
import { useStore } from '@/components/storefront/StoreProvider';

export default function AddressForm({ 
  address, 
  onChange, 
  type = 'shipping', 
  errors = {},
  countries = []
}) {
  const { settings } = useStore();
  // This is the fix: check if the setting is explicitly true
  const showPhoneField = settings?.collect_phone_number_at_checkout === true;

  const handleInputChange = (field, value) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${type}_first_name`}>First Name *</Label>
          <Input
            id={`${type}_first_name`}
            value={address.first_name || ''}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            className={errors.first_name ? 'border-red-500' : ''}
          />
          {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
        </div>
        <div>
          <Label htmlFor={`${type}_last_name`}>Last Name *</Label>
          <Input
            id={`${type}_last_name`}
            value={address.last_name || ''}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            className={errors.last_name ? 'border-red-500' : ''}
          />
          {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor={`${type}_email`}>Email Address *</Label>
        <Input
          id={`${type}_email`}
          type="email"
          value={address.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {showPhoneField && (
        <div>
          <Label htmlFor={`${type}_phone`}>Phone Number *</Label>
          <Input
            id={`${type}_phone`}
            type="tel"
            value={address.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      )}

      <div>
        <Label htmlFor={`${type}_street`}>Street Address *</Label>
        <Input
          id={`${type}_street`}
          value={address.street || ''}
          onChange={(e) => handleInputChange('street', e.target.value)}
          className={errors.street ? 'border-red-500' : ''}
        />
        {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`${type}_city`}>City *</Label>
          <Input
            id={`${type}_city`}
            value={address.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label htmlFor={`${type}_state`}>State/Province</Label>
          <Input
            id={`${type}_state`}
            value={address.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={errors.state ? 'border-red-500' : ''}
          />
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>
        <div>
          <Label htmlFor={`${type}_postal_code`}>Postal Code *</Label>
          <Input
            id={`${type}_postal_code`}
            value={address.postal_code || ''}
            onChange={(e) => handleInputChange('postal_code', e.target.value)}
            className={errors.postal_code ? 'border-red-500' : ''}
          />
          {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor={`${type}_country`}>Country *</Label>
        <CountrySelect
          id={`${type}_country`}
          value={address.country || ''}
          onChange={(value) => handleInputChange('country', value)}
          allowedCountries={countries}
        />
        {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
      </div>
    </div>
  );
}