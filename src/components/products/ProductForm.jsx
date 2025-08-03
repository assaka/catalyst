
import React, { useState, useEffect } from "react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Upload, Search, AlertTriangle } from "lucide-react"; // Added Search icon
import { UploadFile } from "@/api/integrations";
import FlashMessage from "../storefront/FlashMessage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
};

export default function ProductForm({ product, categories, stores, taxes, attributes: passedAttributes, attributeSets: passedAttributeSets, onSubmit, onCancel }) {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [flashMessage, setFlashMessage] = useState(null);
  const [originalUrlKey, setOriginalUrlKey] = useState("");
  const [showSlugChangeWarning, setShowSlugChangeWarning] = useState(false);
  const [createRedirect, setCreateRedirect] = useState(true);
  const [isEditingUrlKey, setIsEditingUrlKey] = useState(false);
  const [hasManuallyEditedUrlKey, setHasManuallyEditedUrlKey] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    short_description: "",
    price: "",
    compare_price: "",
    cost_price: "",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    category_ids: [],
    images: [],
    status: "active",
    visibility: "visible",
    manage_stock: true,
    stock_quantity: 0,
    allow_backorders: false,
    low_stock_threshold: 5,
    infinite_stock: false,
    is_custom_option: false,
    is_coupon_eligible: false,
    attribute_set_id: "", // Default to empty string for 'None'
    attributes: {},
    seo: {
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      url_key: "",
      meta_robots_tag: "null" // Initialize as "null" string to represent the "Default" option in Select
    },
    related_product_ids: [],
    tags: [],
    featured: false
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (product) {
      // Check if the product's attribute_set_id exists in the provided list.
      // If not, reset it to prevent an invalid state.
      const finalAttrSetId = passedAttributeSets && passedAttributeSets.some(set => set && set.id === product.attribute_set_id)
        ? product.attribute_set_id
        : "";

      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        description: product.description || "",
        short_description: product.short_description || "",
        price: product.price || "",
        compare_price: product.compare_price || "",
        cost_price: product.cost_price || "",
        weight: product.weight || "",
        dimensions: product.dimensions || { length: "", width: "", height: "" },
        category_ids: Array.isArray(product.category_ids) ? product.category_ids : [],
        images: Array.isArray(product.images) ? product.images : [],
        status: product.status || "active",
        visibility: product.visibility || "visible",
        manage_stock: product.manage_stock !== undefined ? product.manage_stock : true,
        stock_quantity: product.stock_quantity !== undefined ? product.stock_quantity : 0,
        allow_backorders: product.allow_backorders || false,
        low_stock_threshold: product.low_stock_threshold !== undefined ? product.low_stock_threshold : 5,
        infinite_stock: product.infinite_stock || false,
        is_custom_option: product.is_custom_option || false,
        is_coupon_eligible: product.is_coupon_eligible || false,
        attribute_set_id: finalAttrSetId, // Use the validated ID
        attributes: product.attributes || product.attribute_values || {},
        seo: product.seo ? { // Ensure product.seo is handled, providing defaults for new fields
          meta_title: product.seo.meta_title || "",
          meta_description: product.seo.meta_description || "",
          meta_keywords: product.seo.meta_keywords || "",
          url_key: product.seo.url_key || "",
          meta_robots_tag: product.seo.meta_robots_tag !== undefined && product.seo.meta_robots_tag !== null ? product.seo.meta_robots_tag : "null" // Initialize from product or "null" for default
        } : { meta_title: "", meta_description: "", meta_keywords: "", url_key: "", meta_robots_tag: "null" }, // Default for seo if product.seo is null/undefined
        related_product_ids: Array.isArray(product.related_product_ids) ? product.related_product_ids : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        featured: product.featured || false
      });
      
      // Set original URL key for slug change detection
      setOriginalUrlKey(product.seo?.url_key || "");
      // If product has a URL key, consider it manually set
      setHasManuallyEditedUrlKey(!!(product.seo?.url_key));
      setIsEditingUrlKey(!!(product.seo?.url_key));
    } else {
        // Reset form for new product
        setFormData({
            name: "",
            sku: "",
            barcode: "",
            description: "",
            short_description: "",
            price: "",
            compare_price: "",
            cost_price: "",
            weight: "",
            dimensions: { length: "", width: "", height: "" },
            category_ids: [],
            images: [],
            status: "active",
            visibility: "visible",
            manage_stock: true,
            stock_quantity: 0,
            allow_backorders: false,
            low_stock_threshold: 5,
            infinite_stock: false,
            is_custom_option: false,
            is_coupon_eligible: false,
            attribute_set_id: "",
            attributes: {},
            seo: { meta_title: "", meta_description: "", meta_keywords: "", url_key: "", meta_robots_tag: "null" }, // Default for new product
            related_product_ids: [],
            tags: [],
            featured: false
        });
    }
  }, [product, passedAttributeSets]);

  const slugify = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      const parts = path.split('.');
      let current = newFormData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      
      // Auto-generate URL key from name if not manually edited
      if (path === 'name' && !hasManuallyEditedUrlKey) {
        const autoUrlKey = slugify(value);
        if (!newFormData.seo) newFormData.seo = {};
        newFormData.seo.url_key = autoUrlKey;
      }
      
      return newFormData;
    });
  };

  const handleSeoChange = (e) => {
    const { name, value } = e.target;
    
    // Check for URL key changes to show redirect warning (only if manually edited)
    if (name === 'seo.url_key') {
      setHasManuallyEditedUrlKey(true);
      
      if (product && originalUrlKey && value !== originalUrlKey) {
        setShowSlugChangeWarning(true);
      } else if (value === originalUrlKey) {
        setShowSlugChangeWarning(false);
      }
    }
    
    handleInputChange(name, value);
  };

  const handleAttributeValueChange = async (attributeCode, value, attributeType) => {
    if (attributeType === 'file' && value && value.target && value.target.files[0]) {
      const file = value.target.files[0];
      setUploadingImage(true);
      try {
        const { file_url } = await UploadFile({ file: file });
        const fileData = {
          name: file.name,
          url: file_url,
          size: file.size,
          type: file.type
        };
        setFormData(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [attributeCode]: fileData
          }
        }));
        setFlashMessage({ type: 'success', message: 'File uploaded successfully!' });
      } catch (error) {
        console.error("Error uploading file:", error);
        setFlashMessage({ type: 'error', message: 'Failed to upload file' });
      } finally {
        setUploadingImage(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attributeCode]: value
        }
      }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file: file });
      setFormData(prev => ({ ...prev, images: [...prev.images, file_url] }));
      setFlashMessage({ type: 'success', message: 'Image uploaded successfully!' });
      event.target.value = '';
    } catch (error) {
      console.error("Error uploading image:", error);
      setFlashMessage({ type: 'error', message: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const createRedirectForSlugChange = async () => {
    if (!product || !originalUrlKey || formData.seo.url_key === originalUrlKey) {
      return;
    }

    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        console.warn('No store ID available for redirect creation');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token available for redirect creation');
        return;
      }

      console.log('Creating redirect for URL key change:', {
        old_slug: originalUrlKey,
        new_slug: formData.seo.url_key,
        entity_type: 'product',
        entity_id: product.id
      });

      const response = await fetch('/api/redirects/slug-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: storeId,
          entity_type: 'product',
          entity_id: product.id,
          old_slug: originalUrlKey,
          new_slug: formData.seo.url_key,
          entity_path_prefix: '/product'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Redirect created successfully:', result.message);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create redirect:', response.status, errorText);
        
        // Still allow the form submission to continue
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
        }
      }
    } catch (error) {
      console.error('❌ Error creating redirect:', error);
      // Don't throw - allow form submission to continue
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedStore && (!stores || stores.length === 0)) {
      setFlashMessage({ type: 'error', message: 'No store available for product creation/update.' });
      setLoading(false);
      return;
    }

    const storeToUse = selectedStore || stores[0];

    try {
      const payload = {
        name: formData.name,
        slug: slugify(formData.name),
        sku: formData.sku,
        barcode: formData.barcode || null,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.price) || 0,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null
        },
        images: Array.isArray(formData.images) ? formData.images : [],
        category_ids: Array.isArray(formData.category_ids) ? formData.category_ids : [],
        status: formData.status,
        visibility: formData.visibility,
        manage_stock: Boolean(formData.manage_stock),
        stock_quantity: formData.infinite_stock ? 999999 : (parseInt(formData.stock_quantity) || 0),
        allow_backorders: Boolean(formData.allow_backorders),
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 0,
        infinite_stock: Boolean(formData.infinite_stock),
        is_custom_option: Boolean(formData.is_custom_option),
        is_coupon_eligible: Boolean(formData.is_coupon_eligible),
        featured: Boolean(formData.featured),
        store_id: storeToUse.id,
        attribute_set_id: formData.attribute_set_id || null, // Ensure null if empty string for API
        attributes: formData.attributes || {},
        seo: {
          meta_title: formData.seo.meta_title || "",
          meta_description: formData.seo.meta_description || "",
          meta_keywords: formData.seo.meta_keywords || "",
          url_key: formData.seo.url_key || "",
          // If "null" string is stored, send "index, follow" as default, otherwise send the stored value.
          meta_robots_tag: formData.seo.meta_robots_tag === "null" ? "index, follow" : formData.seo.meta_robots_tag
        },
        related_product_ids: Array.isArray(formData.related_product_ids) ? formData.related_product_ids : [],
        tags: Array.isArray(formData.tags) ? formData.tags : []
      };

      if (product) {
        payload.id = product.id;
      }

      // Always create redirect if URL key changed (essential for SEO)
      if (product && originalUrlKey && formData.seo.url_key !== originalUrlKey) {
        await createRedirectForSlugChange();
      }

      await onSubmit(payload);
      setFlashMessage({ type: 'success', message: `Product ${product ? 'updated' : 'created'} successfully!` });
    } catch (error) {
      console.error("Error submitting product:", error);
      setFlashMessage({ type: 'error', message: `Failed to ${product ? 'update' : 'create'} product: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const selectedAttributeSet = passedAttributeSets.find(set => set && set.id === formData.attribute_set_id);
  const selectedAttributes = selectedAttributeSet && selectedAttributeSet.attribute_ids ?
    passedAttributes.filter(attr => attr && selectedAttributeSet.attribute_ids.includes(attr.id)) : [];

  return (
    <div>
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode (ISBN, UPC, GTIN, etc.)</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange("short_description", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing & Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="compare_price">Sale Price</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => handleInputChange("compare_price", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty if no sale price</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange("cost_price", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </div>
              </div>

              <Card>
                <CardHeader><CardTitle>Dimensions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="length">Length (cm)</Label>
                      <Input id="length" type="number" step="0.01" value={formData.dimensions.length} onChange={(e) => handleInputChange("dimensions.length", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input id="width" type="number" step="0.01" value={formData.dimensions.width} onChange={(e) => handleInputChange("dimensions.width", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" type="number" step="0.01" value={formData.dimensions.height} onChange={(e) => handleInputChange("dimensions.height", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(v) => handleInputChange("visibility", v)}>
                  <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Inventory & Stock</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="manage_stock"
                checked={formData.manage_stock}
                onCheckedChange={(checked) => handleInputChange("manage_stock", checked)}
              />
              <div>
                <Label htmlFor="manage_stock" className="font-medium">Manage Stock</Label>
                <p className="text-sm text-gray-500">Automatically track inventory quantity</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="infinite_stock"
                checked={formData.infinite_stock}
                onCheckedChange={(checked) => handleInputChange("infinite_stock", checked)}
              />
              <div>
                <Label htmlFor="infinite_stock" className="font-medium">Infinite Stock</Label>
                <p className="text-sm text-gray-500">Product will never go out of stock</p>
              </div>
            </div>

            {formData.manage_stock && !formData.infinite_stock && (
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                  min="0"
                />
              </div>
            )}

            {formData.manage_stock && !formData.infinite_stock && (
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Switch
                  id="allow_backorders"
                  checked={formData.allow_backorders}
                  onCheckedChange={(checked) => handleInputChange("allow_backorders", checked)}
                />
                <div>
                  <Label htmlFor="allow_backorders" className="font-medium">Allow Backorders</Label>
                  <p className="text-sm text-gray-500">Customers can order when out of stock</p>
                </div>
              </div>
            )}

            {formData.manage_stock && !formData.infinite_stock && (
              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => handleInputChange("low_stock_threshold", e.target.value)}
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">Receive alerts when stock falls below this number</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="attribute_set_id">Attribute Set</Label>
              <Select
                value={formData.attribute_set_id || ""}
                onValueChange={(v) => {
                  const finalValue = v === "none-value" ? "" : v;
                  handleInputChange("attribute_set_id", finalValue);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attribute set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-value">None</SelectItem>
                  {passedAttributeSets?.map(set => {
                    if (!set || !set.id) return null;
                    return (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedAttributes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Attribute Values</h4>
                {selectedAttributes.map(attribute => {
                  const attributeValue = formData.attributes[attribute.code];
                  return (
                    <div key={attribute.id}>
                      <Label htmlFor={`attr_${attribute.code}`}>{attribute.name}</Label>
                      {attribute.type === 'select' && attribute.options ? (
                        <Select
                          value={attributeValue || ""}
                          onValueChange={(v) => handleAttributeValueChange(attribute.code, v)}
                        >
                          <SelectTrigger><SelectValue placeholder={`Select ${attribute.name}`} /></SelectTrigger>
                          <SelectContent>
                            {attribute.options.filter(o => o.value !== "").map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : attribute.type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`attr_${attribute.code}`}
                            checked={attributeValue || false}
                            onCheckedChange={(checked) => handleAttributeValueChange(attribute.code, checked)}
                          />
                        </div>
                      ) : attribute.type === 'file' ? (
                        <div className="space-y-2">
                          <input
                            type="file"
                            id={`attr_${attribute.code}`}
                            onChange={(e) => handleAttributeValueChange(attribute.code, e, 'file')}
                            accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',')}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={uploadingImage}
                          />
                          {uploadingImage && (
                            <p className="text-sm text-blue-600">Uploading file...</p>
                          )}
                          {attributeValue && (typeof attributeValue === 'object' ? attributeValue.url : attributeValue) && (
                            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">
                                {typeof attributeValue === 'object' ? attributeValue.name : 'File Link'}
                              </span>
                              {typeof attributeValue === 'object' && attributeValue.size && (
                                <span className="text-xs text-gray-500">
                                  {`(${(attributeValue.size / 1024 / 1024).toFixed(2)} MB)`}
                                </span>
                              )}
                              <a
                                href={typeof attributeValue === 'object' ? attributeValue.url : attributeValue}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </a>
                            </div>
                          )}
                          {attribute.file_settings && (
                            <p className="text-xs text-gray-500">
                              Max size: {attribute.file_settings.max_file_size}MB.
                              Allowed: {attribute.file_settings.allowed_extensions?.join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Input
                          id={`attr_${attribute.code}`}
                          type={attribute.type === 'number' ? 'number' : attribute.type === 'date' ? 'date' : 'text'}
                          value={attributeValue && typeof attributeValue === 'object' ? '' : (attributeValue || "")}
                          onChange={(e) => handleAttributeValueChange(attribute.code, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => {
                  handleInputChange("featured", checked);
                }}
              />
              <div>
                <Label htmlFor="featured" className="font-medium">Featured Product</Label>
                <p className="text-sm text-gray-500">Show this product in featured sections</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="is_custom_option"
                checked={formData.is_custom_option}
                onCheckedChange={(checked) => {
                  handleInputChange("is_custom_option", checked);
                }}
              />
              <div>
                <Label htmlFor="is_custom_option" className="font-medium">Set as Custom Option for Other Products</Label>
                <p className="text-sm text-gray-500">This product can be added as an option to other products via Custom Option Rules</p>
              </div>
            </div>

            {formData.is_custom_option && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> When this option is enabled, this product becomes available in the Custom Option Rules system.
                  You can then create rules that automatically show this product as an additional option on other products based on categories,
                  attribute sets, or other conditions.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="is_coupon_eligible"
                checked={formData.is_coupon_eligible}
                onCheckedChange={(checked) => {
                  handleInputChange("is_coupon_eligible", checked);
                }}
              />
              <div>
                <Label htmlFor="is_coupon_eligible" className="font-medium">Eligible for Coupon-Specific Discounts</Label>
                <p className="text-sm text-gray-500">Allow this product to be selected in coupon restrictions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {categories && categories.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={formData.category_ids.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="seo">
            <AccordionTrigger>
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-500" />
                <span>SEO Settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4 bg-gray-50 rounded-b-lg">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Template Variables</h4>
                <p className="text-sm text-blue-800 mb-2">
                  You can use these variables in your meta title and description templates:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div><code>{'{{store_name}}'}</code> - Your store name</div>
                  <div><code>{'{{page_title}}'}</code> - Current page title</div>
                  <div><code>{'{{product_name}}'}</code> - Product name</div>
                  <div><code>{'{{description}}'}</code> - Page/product description</div>
                  <div><code>{'{{price}}'}</code> - Product price</div>
                  <div><code>{'{{currency}}'}</code> - Product currency</div>
                </div>
              </div>
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input 
                  id="meta_title" 
                  name="seo.meta_title" 
                  value={formData.seo.meta_title || ''} 
                  onChange={handleSeoChange} 
                  placeholder="{{product_name}} - {{store_name}}"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea 
                  id="meta_description" 
                  name="seo.meta_description" 
                  value={formData.seo.meta_description || ''} 
                  onChange={handleSeoChange} 
                  rows={3}
                  placeholder="Shop {{product_name}} at {{store_name}}. {{product_description}}"
                />
              </div>
              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input id="meta_keywords" name="seo.meta_keywords" value={formData.seo.meta_keywords || ''} onChange={handleSeoChange} />
              </div>
              <div>
                <Label htmlFor="meta_robots_tag">Robots Meta Tag</Label>
                <Select
                  value={formData.seo.meta_robots_tag || ""}
                  onValueChange={(value) => handleInputChange('seo.meta_robots_tag', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select robots tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Default (Index, Follow)</SelectItem>
                    <SelectItem value="index, follow">Index, Follow</SelectItem>
                    <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                    <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                    <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="url_key">URL Key</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-url-key"
                      checked={isEditingUrlKey}
                      onCheckedChange={setIsEditingUrlKey}
                    />
                    <Label htmlFor="edit-url-key" className="text-sm">
                      Enable editing
                    </Label>
                  </div>
                </div>
                <Input
                  id="url_key"
                  name="seo.url_key"
                  value={formData.seo.url_key || ""}
                  onChange={handleSeoChange}
                  placeholder="Auto-generated from product name"
                  disabled={!isEditingUrlKey}
                  className={!isEditingUrlKey ? "bg-gray-50 text-gray-600" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {!isEditingUrlKey 
                    ? "Auto-generated from product name. Enable editing to customize."
                    : "Custom URL key for this product. Changes will affect the product's URL."
                  }
                </p>
              </div>

              {showSlugChangeWarning && hasManuallyEditedUrlKey && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <div className="space-y-3">
                      <div>
                        <strong>URL Key Change Detected</strong>
                        <p className="text-sm mt-1">
                          Changing the URL key from "<code className="bg-amber-100 px-1 rounded">{originalUrlKey}</code>" to 
                          "<code className="bg-amber-100 px-1 rounded">{formData.seo.url_key}</code>" will change the product's URL.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="create-redirect-product"
                          checked={createRedirect}
                          onCheckedChange={setCreateRedirect}
                        />
                        <Label htmlFor="create-redirect-product" className="text-sm font-medium">
                          Create automatic redirect from old URL to new URL (Recommended)
                        </Label>
                      </div>
                      <p className="text-xs text-amber-700">
                        {createRedirect 
                          ? "✅ A redirect will be created to prevent broken links and maintain SEO."
                          : "⚠️ No redirect will be created. Visitors to the old URL will see a 404 error."
                        }
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card>
          <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img src={image} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                  <button type="button" onClick={() => handleImageRemove(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : (product ? "Update Product" : "Create Product")}</Button>
        </div>
      </form>
    </div>
  );
}
