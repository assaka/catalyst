
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removed unused imports: Badge, Checkbox
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const blockTemplates = {
  banner: {
    name: 'Banner',
    content: `<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
  <h2 class="text-3xl font-bold mb-4">Special Offer!</h2>
  <p class="text-xl mb-6">Get 20% off on all products</p>
  <a href="#" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">Shop Now</a>
</div>`
  },
  hero: {
    name: 'Hero Section',
    content: `<div class="bg-gray-900 text-white py-20">
  <div class="max-w-4xl mx-auto text-center px-4">
    <h1 class="text-5xl font-bold mb-6">Welcome to Our Store</h1>
    <p class="text-xl mb-8">Discover amazing products at unbeatable prices</p>
    <a href="#" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">Explore Products</a>
  </div>
</div>`
  },
  promo: {
    name: 'Promotion',
    content: `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
  <h3 class="text-2xl font-bold text-yellow-800 mb-2">Limited Time Offer</h3>
  <p class="text-yellow-700 mb-4">Free shipping on orders over $50</p>
  <span class="bg-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">Code: FREESHIP</span>
</div>`
  },
  newsletter: {
    name: 'Newsletter Signup',
    content: `<div class="bg-blue-50 p-8 rounded-lg text-center">
  <h3 class="text-2xl font-bold text-blue-900 mb-4">Stay Updated</h3>
  <p class="text-blue-700 mb-6">Subscribe to our newsletter for exclusive offers and updates</p>
  <div class="flex max-w-md mx-auto gap-2">
    <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-2 border border-blue-200 rounded-lg">
    <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Subscribe</button>
  </div>
</div>`
  }
};

export default function CmsBlockForm({ block, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    identifier: '',
    content: '',
    is_active: true,
    placement: {
      pages: ['storefront_home'],
      position: 'before_content',
      sort_order: 0
    },
    // store_id removed - as per outline removing 'stores' prop and any related functionality
  });

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        identifier: block.identifier || '',
        content: block.content || '',
        is_active: block.is_active !== false,
        placement: block.placement || {
          pages: ['storefront_home'],
          position: 'before_content',
          sort_order: 0
        },
        // store_id removed from useEffect load logic
      });
    }
  }, [block]); // 'stores' dependency removed

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAvailablePositions = (selectedPages) => {
    // Base positions available for all pages
    const basePositions = [
      { value: 'header', label: 'Header Area' },
      { value: 'before_content', label: 'Before Main Content' },
      { value: 'after_content', label: 'After Main Content' },
      { value: 'sidebar', label: 'Sidebar' },
      { value: 'footer', label: 'Footer Area' }
    ];

    // Additional positions for specific pages
    const additionalPositions = [];

    // Product page specific positions
    if (selectedPages.includes('storefront_cart')) {
      additionalPositions.push(
        { value: 'below_add_to_cart', label: 'Below Add to Cart' },
        { value: 'above_add_to_cart', label: 'Above Add to Cart' },
        { value: 'above_product_tabs', label: 'Above Product Tabs' }
      );
    }

    return [...basePositions, ...additionalPositions];
  };

  const handlePageChange = (page, checked) => {
    const currentPages = formData.placement.pages || [];
    const updatedPages = checked
      ? [...currentPages, page]
      : currentPages.filter(p => p !== page);

    const availablePositions = getAvailablePositions(updatedPages);
    const currentPosition = formData.placement.position;
    let newPosition = currentPosition;

    // Reset position if it's no longer available for the selected pages
    if (!availablePositions.find(pos => pos.value === currentPosition)) {
      newPosition = 'before_content';
    }

    setFormData(prev => ({
      ...prev,
      placement: {
        ...prev.placement,
        pages: updatedPages,
        position: newPosition
      }
    }));
  };

  const handleTemplateSelect = (templateKey) => {
    const template = blockTemplates[templateKey];
    setFormData(prev => ({
      ...prev,
      content: template.content,
      title: prev.title || template.name,
      identifier: prev.identifier || templateKey
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="placement">Placement</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="title">Block Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter block title"
              required
            />
          </div>

          <div>
            <Label htmlFor="identifier">Identifier *</Label>
            <Input
              id="identifier"
              value={formData.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              placeholder="unique-block-identifier"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Unique identifier used in templates (e.g., storefront-hero, sidebar-banner)
            </p>
          </div>

          {/* Store selection UI removed as the 'stores' prop and 'store_id' state were removed */}
          {/*
          <div>
            <Label htmlFor="store">Store</Label>
            <Select value={formData.store_id} onValueChange={(value) => handleInputChange('store_id', value)}>
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
          </div>
          */}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </TabsContent>

        <TabsContent value="placement" className="space-y-6">
          <div>
            <Label>Show on Pages</Label>
            <p className="text-sm text-gray-500 mb-3">Select which pages this block should appear on</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-home"
                  checked={formData.placement.pages.includes('storefront_home')}
                  onChange={(e) => handlePageChange('storefront_home', e.target.checked)}
                />
                <Label htmlFor="page-home" className="text-sm font-normal">Home Page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-category"
                  checked={formData.placement.pages.includes('storefront_category')}
                  onChange={(e) => handlePageChange('storefront_category', e.target.checked)}
                />
                <Label htmlFor="page-category" className="text-sm font-normal">Category Pages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-product"
                  checked={formData.placement.pages.includes('storefront_product')}
                  onChange={(e) => handlePageChange('storefront_product', e.target.checked)}
                />
                <Label htmlFor="page-product" className="text-sm font-normal">Product Pages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-cart"
                  checked={formData.placement.pages.includes('storefront_cart')}
                  onChange={(e) => handlePageChange('storefront_cart', e.target.checked)}
                />
                <Label htmlFor="page-cart" className="text-sm font-normal">Cart Page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-checkout"
                  checked={formData.placement.pages.includes('storefront_checkout')}
                  onChange={(e) => handlePageChange('storefront_checkout', e.target.checked)}
                />
                <Label htmlFor="page-checkout" className="text-sm font-normal">Checkout Page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="page-all"
                  checked={formData.placement.pages.includes('all_pages')}
                  onChange={(e) => handlePageChange('all_pages', e.target.checked)}
                />
                <Label htmlFor="page-all" className="text-sm font-normal">All Pages</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="position">Position on Page</Label>
            <Select
              value={formData.placement.position}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                placement: { ...prev.placement, position: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {getAvailablePositions(formData.placement.pages).map(position => (
                  <SelectItem key={position.value} value={position.value}>
                    {position.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.placement.sort_order}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                placement: { ...prev.placement, sort_order: parseInt(e.target.value) || 0 }
              }))}
              placeholder="0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Lower numbers appear first. Use this to control the order when multiple blocks are in the same position.
            </p>
          </div>
          {/* Placement Preview section removed */}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div>
            <Label htmlFor="content">HTML Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter HTML content..."
              rows={15}
              className="font-mono text-sm"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              You can use HTML and Tailwind CSS classes for styling
            </p>
          </div>

          {formData.content && (
            <div>
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div>
            <Label>Quick Start Templates</Label>
            <p className="text-sm text-gray-500 mb-4">
              Choose a template to get started quickly. You can customize it in the Content tab.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(blockTemplates).map(([key, template]) => (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTemplateSelect(key)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <div dangerouslySetInnerHTML={{ __html: template.content }} />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          {block ? 'Update Block' : 'Create Block'}
        </Button>
      </div>
    </form>
  );
}
