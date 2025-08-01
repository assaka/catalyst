import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CmsBlockForm({ block, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    identifier: '',
    content: '',
    is_active: true,
    placement: ['content'], // Array of placement locations
  });

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        identifier: block.identifier || '',
        content: block.content || '',
        is_active: block.is_active !== false,
        placement: Array.isArray(block.placement) ? block.placement : 
                  typeof block.placement === 'string' ? [block.placement] : ['content'],
      });
    }
  }, [block]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlacementChange = (placement, checked) => {
    setFormData(prev => ({
      ...prev,
      placement: checked 
        ? [...prev.placement, placement]
        : prev.placement.filter(p => p !== placement)
    }));
  };

  const placementOptions = [
    // Global positions
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
    { value: 'sidebar', label: 'Sidebar' },
    
    // Homepage specific
    { value: 'homepage_above_hero', label: 'Homepage - Above Hero' },
    { value: 'homepage_below_hero', label: 'Homepage - Below Hero' },
    { value: 'homepage_above_featured', label: 'Homepage - Above Featured Products' },
    { value: 'homepage_below_featured', label: 'Homepage - Below Featured Products' },
    { value: 'homepage_above_content', label: 'Homepage - Above Content' },
    { value: 'homepage_below_content', label: 'Homepage - Below Content' },
    
    // Product page specific
    { value: 'product_above_title', label: 'Product - Above Title' },
    { value: 'product_below_title', label: 'Product - Below Title' },
    { value: 'product_above_price', label: 'Product - Above Price' },
    { value: 'product_below_price', label: 'Product - Below Price' },
    { value: 'product_above_cart_button', label: 'Product - Above Add to Cart' },
    { value: 'product_below_cart_button', label: 'Product - Below Add to Cart' },
    { value: 'product_above_description', label: 'Product - Above Description' },
    { value: 'product_below_description', label: 'Product - Below Description' },
    
    // Category page specific
    { value: 'category_above_products', label: 'Category - Above Products' },
    { value: 'category_below_products', label: 'Category - Below Products' },
    { value: 'category_above_filters', label: 'Category - Above Filters' },
    { value: 'category_below_filters', label: 'Category - Below Filters' },
    
    // Cart page specific
    { value: 'cart_above_items', label: 'Cart - Above Items' },
    { value: 'cart_below_items', label: 'Cart - Below Items' },
    { value: 'cart_above_total', label: 'Cart - Above Total' },
    { value: 'cart_below_total', label: 'Cart - Below Total' },
    
    // Checkout page specific
    { value: 'checkout_above_form', label: 'Checkout - Above Form' },
    { value: 'checkout_below_form', label: 'Checkout - Below Form' },
    { value: 'checkout_above_payment', label: 'Checkout - Above Payment' },
    { value: 'checkout_below_payment', label: 'Checkout - Below Payment' },
    
    // Generic content positions
    { value: 'before_content', label: 'Before Main Content' },
    { value: 'content', label: 'Content Area' },
    { value: 'after_content', label: 'After Main Content' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{block ? 'Edit CMS Block' : 'Create CMS Block'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Block Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter block title"
              required
            />
          </div>

          <div>
            <Label htmlFor="identifier">Identifier</Label>
            <Input
              id="identifier"
              value={formData.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              placeholder="unique-block-identifier"
            />
            <p className="text-sm text-gray-500 mt-1">
              Unique identifier for this block (auto-generated from title if empty)
            </p>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter block content (HTML allowed)"
              rows={8}
            />
          </div>

          <div>
            <Label>Placement Locations</Label>
            <p className="text-sm text-gray-500 mb-4">Select where this block should appear</p>
            
            {/* Global Positions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Global Positions</h4>
              <div className="grid grid-cols-3 gap-2">
                {placementOptions.slice(0, 3).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Homepage Positions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Homepage</h4>
              <div className="grid grid-cols-2 gap-2">
                {placementOptions.slice(3, 9).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Page Positions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Product Pages</h4>
              <div className="grid grid-cols-2 gap-2">
                {placementOptions.slice(9, 17).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Page Positions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Category Pages</h4>
              <div className="grid grid-cols-2 gap-2">
                {placementOptions.slice(17, 21).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart & Checkout Positions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cart & Checkout</h4>
              <div className="grid grid-cols-2 gap-2">
                {placementOptions.slice(21, 29).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Generic Content Positions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generic Content</h4>
              <div className="grid grid-cols-3 gap-2">
                {placementOptions.slice(29).map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${option.value}`}
                      checked={formData.placement.includes(option.value)}
                      onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                    />
                    <Label htmlFor={`placement-${option.value}`} className="text-xs font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
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
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {block ? 'Update' : 'Create'} Block
        </Button>
      </div>
    </form>
  );
}