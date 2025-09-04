
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { X, Search, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export default function ProductOptionRuleForm({ rule, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    display_label: 'Product Options',
    is_active: true,
    conditions: {
      categories: [],
      attribute_sets: [],
      skus: [],
    },
    optional_product_ids: [],
  });

  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allAttributeSets, setAllAttributeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skuSearchTerm, setSkuSearchTerm] = useState('');
  
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        display_label: rule.display_label || 'Product Options',
        is_active: rule.is_active !== false,
        conditions: rule.conditions || { categories: [], attribute_sets: [], skus: [] },
        optional_product_ids: rule.optional_product_ids || [],
      });
    } else {
      // Reset for new form
      setFormData({
        name: '',
        display_label: 'Product Options',
        is_active: true,
        conditions: { categories: [], attribute_sets: [], skus: [] },
        optional_product_ids: [],
      });
    }
  }, [rule]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData, attributeSetsData] = await Promise.all([
          Product.list(),
          Category.list(),
          import('@/api/entities').then(m => m.AttributeSet.list())
        ]);
        setAllProducts(productsData);
        setAllCategories(categoriesData);
        setAllAttributeSets(attributeSetsData);
      } catch (error) {
        console.error("Failed to load data for form", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectToggle = (condition, id) => {
    setFormData(prev => {
        const currentItems = prev.conditions[condition] || [];
        const newItems = currentItems.includes(id)
            ? currentItems.filter(item => item !== id)
            : [...currentItems, id];
        return {
            ...prev,
            conditions: { ...prev.conditions, [condition]: newItems }
        };
    });
  };
  
  const handleAddonToggle = (productId) => {
    setFormData(prev => {
        const currentItems = prev.optional_product_ids || [];
        const newItems = currentItems.includes(productId)
            ? currentItems.filter(id => id !== productId)
            : [...currentItems, productId];
        return { ...prev, optional_product_ids: newItems };
    });
  };

  const handleSkuSelect = (sku) => {
    if (!formData.conditions.skus.includes(sku)) {
      handleMultiSelectToggle('skus', sku);
    }
    setSkuSearchTerm('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
    
  const filteredSkuProducts = skuSearchTerm
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(skuSearchTerm.toLowerCase()) &&
        !formData.conditions.skus.includes(p.sku) &&
        !!p.sku // Only show products with SKUs
      )
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Rule Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="display_label">Display Label *</Label>
          <Input
            id="display_label"
            value={formData.display_label}
            onChange={(e) => handleInputChange('display_label', e.target.value)}
            placeholder="e.g., Choose Your Add-ons"
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

      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="font-medium">Conditions</h3>
        <p className="text-sm text-gray-500">Apply this rule if the product matches these conditions. Leave blank to apply to all products.</p>
        
        {/* Categories Selector */}
        <div className="space-y-2">
          <Label>Apply to Categories</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                Select categories... <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandList className="max-h-60 overflow-y-auto">
                  {allCategories.map(category => (
                    <CommandItem key={category.id} onSelect={() => handleMultiSelectToggle('categories', category.id)}>
                      <Check className={`mr-2 h-4 w-4 ${formData.conditions.categories.includes(category.id) ? "opacity-100" : "opacity-0"}`} />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="pt-1 flex flex-wrap gap-1">
            {formData.conditions.categories.map(id => {
              const item = allCategories.find(c => c.id === id);
              return item ? <Badge key={id} variant="secondary">{item.name} <button type="button" onClick={() => handleMultiSelectToggle('categories', id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"><X className="h-3 w-3" /></button></Badge> : null;
            })}
          </div>
        </div>

        {/* Attribute Sets Selector */}
        <div className="space-y-2">
          <Label>Apply to Attribute Sets</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                Select attribute sets... <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search attribute sets..." />
                <CommandEmpty>No set found.</CommandEmpty>
                <CommandList className="max-h-60 overflow-y-auto">
                  {allAttributeSets.map(set => (
                    <CommandItem key={set.id} onSelect={() => handleMultiSelectToggle('attribute_sets', set.id)}>
                      <Check className={`mr-2 h-4 w-4 ${formData.conditions.attribute_sets.includes(set.id) ? "opacity-100" : "opacity-0"}`} />
                      {set.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="pt-1 flex flex-wrap gap-1">
            {formData.conditions.attribute_sets.map(id => {
              const item = allAttributeSets.find(s => s.id === id);
              return item ? <Badge key={id} variant="secondary">{item.name} <button type="button" onClick={() => handleMultiSelectToggle('attribute_sets', id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"><X className="h-3 w-3" /></button></Badge> : null;
            })}
          </div>
        </div>
        
        {/* SKU Selector */}
        <div className="space-y-2">
            <Label>Apply to SKUs</Label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products to add SKU..."
                    value={skuSearchTerm}
                    onChange={(e) => setSkuSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </PopoverTrigger>
              {filteredSkuProducts.length > 0 && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandList className="max-h-60 overflow-y-auto">
                      {filteredSkuProducts.map(product => (
                        <CommandItem key={product.id} onSelect={() => handleSkuSelect(product.sku)}>
                            <div className="flex items-center space-x-2 overflow-hidden">
                               <img src={product.images?.[0] || 'https://placehold.co/40x40?text=N/A'} alt={product.name} className="w-8 h-8 rounded-sm object-cover flex-shrink-0" />
                               <div className="overflow-hidden">
                                   <p className="text-sm truncate">{product.name}</p>
                                   <p className="text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                               </div>
                           </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            <div className="pt-1 flex flex-wrap gap-1">
                {formData.conditions.skus.map(sku => (
                    <Badge key={sku} variant="secondary">{sku} <button type="button" onClick={() => handleMultiSelectToggle('skus', sku)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"><X className="h-3 w-3" /></button></Badge>
                ))}
            </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Add-on Products</Label>
        <p className="text-sm text-gray-500">
          Select products that will be offered as optional add-ons when the conditions are met.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              Select add-on products... <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search products..." />
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandList className="max-h-60 overflow-y-auto">
                {allProducts.map(product => (
                  <CommandItem key={product.id} onSelect={() => handleAddonToggle(product.id)}>
                    <Check className={`mr-2 h-4 w-4 ${formData.optional_product_ids.includes(product.id) ? "opacity-100" : "opacity-0"}`} />
                    <div className="flex items-center space-x-2 overflow-hidden">
                       <img src={product.images?.[0] || 'https://placehold.co/40x40?text=N/A'} alt={product.name} className="w-8 h-8 rounded-sm object-cover flex-shrink-0" />
                       <div className="overflow-hidden">
                           <p className="text-sm truncate">{product.name}</p>
                           <p className="text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                       </div>
                   </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="pt-1 flex flex-wrap gap-1">
          {formData.optional_product_ids.map(id => {
            const product = allProducts.find(p => p.id === id);
            return product ? (
              <Badge key={id} variant="secondary">
                {product.name}
                <button type="button" onClick={() => handleAddonToggle(id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Rule</Button>
      </div>
    </form>
  );
}
