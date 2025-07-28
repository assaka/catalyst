
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus } from 'lucide-react';

export default function ProductLabelForm({ label, attributes, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    background_color: '#FF0000',
    text_color: '#FFFFFF',
    position: 'top-right',
    conditions: {
      attribute_conditions: [],
      price_conditions: {}
    },
    is_active: true,
    priority: 0,
    sort_order: 0,
  });

  useEffect(() => {
    if (label) {
      setFormData({
        name: label.name || '',
        text: label.text || '',
        background_color: label.background_color || '#FF0000',
        text_color: label.color || label.text_color || '#FFFFFF', // Handle both field names
        position: label.position || 'top-right',
        conditions: label.conditions || {
          attribute_conditions: [],
          price_conditions: {}
        },
        is_active: label.is_active !== false,
        priority: label.priority || 0,
        sort_order: label.sort_order || 0,
      });
    }
  }, [label]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [type]: {
          ...prev.conditions[type],
          [field]: value
        }
      }
    }));
  };

  const addAttributeCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        attribute_conditions: [
          ...prev.conditions.attribute_conditions,
          { attribute_code: '', attribute_value: '' }
        ]
      }
    }));
  };

  const removeAttributeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        attribute_conditions: prev.conditions.attribute_conditions.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAttributeCondition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        attribute_conditions: prev.conditions.attribute_conditions.map((cond, i) => 
          i === index ? { ...cond, [field]: value } : cond
        )
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const positionOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'center-left', label: 'Center Left' },
    { value: 'center-right', label: 'Center Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-center', label: 'Bottom Center' }
  ];
  
  const renderConditionValueInput = (condition, index) => {
    const selectedAttr = attributes.find(attr => attr.code === condition.attribute_code);
    const hasOptions = selectedAttr && (selectedAttr.type === 'select' || selectedAttr.type === 'multiselect') && selectedAttr.options?.length > 0;
    
    if (hasOptions) {
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
    
    return (
      <Input
        placeholder="Value"
        value={condition.attribute_value}
        onChange={(e) => updateAttributeCondition(index, 'attribute_value', e.target.value)}
        className="flex-1"
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="name">Label Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Sale Label, New Product"
              required
            />
          </div>

          <div>
            <Label htmlFor="text">Display Text *</Label>
            <Input
              id="text"
              value={formData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              placeholder="e.g., SALE, NEW, 50% OFF"
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
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <div>
            <Label htmlFor="position">Position on Image</Label>
            <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positionOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="background_color">Background Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  className="w-12 h-10 p-1 rounded"
                />
                <Input
                  value={formData.background_color}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  placeholder="#FF0000"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="text_color">Text Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="text_color"
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  className="w-12 h-10 p-1 rounded"
                />
                <Input
                  value={formData.text_color}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (only one label shown per product)</p>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Higher priority labels are favored when sort order is equal</p>
            </div>
          </div>

          <div>
            <Label>Preview</Label>
            <div className="relative w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
              <img 
                src="https://placehold.co/200x200?text=Product"
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute px-2 py-1 text-xs font-bold rounded shadow-lg ${
                  formData.position.includes('top') ? 'top-2' : 
                  formData.position.includes('bottom') ? 'bottom-2' : 'top-1/2 transform -translate-y-1/2'
                } ${
                  formData.position.includes('left') ? 'left-2' :
                  formData.position.includes('right') ? 'right-2' : 'left-1/2 transform -translate-x-1/2'
                }`}
                style={{
                  backgroundColor: formData.background_color,
                  color: formData.text_color
                }}
              >
                {formData.text || 'TEXT'}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-6">
          <div>
            <Label>Attribute Conditions</Label>
            <p className="text-sm text-gray-500 mb-3">Show this label when products have specific attribute values</p>
            
            <div className="space-y-3">
              {formData.conditions.attribute_conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Select 
                    value={condition.attribute_code} 
                    onValueChange={(value) => updateAttributeCondition(index, 'attribute_code', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const usableAttributes = attributes.filter(a => a.is_usable_in_conditions);
                        
                        // Fallback to all attributes if no attributes are marked as usable
                        // Also show all attributes if they exist but none have is_usable_in_conditions = true
                        const attributesToShow = usableAttributes.length > 0 ? usableAttributes : attributes.slice(0, 20); // Limit to first 20 to prevent UI issues
                        
                        return attributesToShow.map(attr => (
                          <SelectItem key={attr.id} value={attr.code}>
                            {attr.name}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  
                  {renderConditionValueInput(condition, index)}
                  
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

          <div>
            <Label>Price Conditions</Label>
            <p className="text-sm text-gray-500 mb-3">Show this label based on pricing or product age</p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_sale_price"
                  checked={formData.conditions.price_conditions.has_sale_price || false}
                  onCheckedChange={(checked) => handleConditionChange('price_conditions', 'has_sale_price', checked)}
                />
                <Label htmlFor="has_sale_price">Product has sale price</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_new"
                  checked={formData.conditions.price_conditions.is_new || false}
                  onCheckedChange={(checked) => handleConditionChange('price_conditions', 'is_new', checked)}
                />
                <Label htmlFor="is_new">Product is new (created within</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.conditions.price_conditions.days_since_created || ''}
                  onChange={(e) => handleConditionChange('price_conditions', 'days_since_created', parseInt(e.target.value) || 30)}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">days)</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          {label ? 'Update Label' : 'Create Label'}
        </Button>
      </div>
    </form>
  );
}
