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
    { value: 'header', label: 'Header' },
    { value: 'before_content', label: 'Before Content' },
    { value: 'content', label: 'Content Area' },
    { value: 'after_content', label: 'After Content' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'footer', label: 'Footer' }
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
            <p className="text-sm text-gray-500 mb-3">Select where this block should appear</p>
            <div className="grid grid-cols-2 gap-3">
              {placementOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`placement-${option.value}`}
                    checked={formData.placement.includes(option.value)}
                    onCheckedChange={(checked) => handlePlacementChange(option.value, checked)}
                  />
                  <Label htmlFor={`placement-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
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