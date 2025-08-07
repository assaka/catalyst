
import React, { useState, useEffect, useRef } from "react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, Upload, Search, AlertTriangle, ImageIcon, Plus, Trash2 } from "lucide-react";
import FlashMessage from "../storefront/FlashMessage";
import apiClient from "@/api/client";
import MediaBrowser from "@/components/cms/MediaBrowser";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';

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
    image_url: "",
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
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [currentAttributeCode, setCurrentAttributeCode] = useState(null);
  
  // Product image system state
  const [savingBaseImage, setSavingBaseImage] = useState(false);
  const [additionalImages, setAdditionalImages] = useState({});
  const baseImageInputRef = useRef(null);

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
        image_url: product.image_url || "",
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
          url_key: product.seo.url_key || product.slug || "",
          meta_robots_tag: product.seo.meta_robots_tag !== undefined && product.seo.meta_robots_tag !== null ? product.seo.meta_robots_tag : "null" // Initialize from product or "null" for default
        } : { meta_title: "", meta_description: "", meta_keywords: "", url_key: product.slug || "", meta_robots_tag: "null" }, // Default for seo if product.seo is null/undefined
        related_product_ids: Array.isArray(product.related_product_ids) ? product.related_product_ids : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        featured: product.featured || false
      });
      
      // Initialize additional images from product data
      const additionalImagesData = {};
      for (let i = 0; i < 9; i++) {
        const imageKey = `image_${i}`;
        if (product[imageKey]) {
          additionalImagesData[imageKey] = {
            url: product[imageKey],
            label: `Image ${i + 1}`,
            inputRef: React.createRef(),
            saving: false
          };
        }
      }
      setAdditionalImages(additionalImagesData);
      
      // Set original URL key for slug change detection
      setOriginalUrlKey(product.seo?.url_key || product.slug || "");
      // If product has a URL key or slug, consider it manually set
      setHasManuallyEditedUrlKey(!!(product.seo?.url_key || product.slug));
      setIsEditingUrlKey(!!(product.seo?.url_key || product.slug));
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
    if ((attributeType === 'file' || attributeType === 'image') && value && value.target && value.target.files[0]) {
      const file = value.target.files[0];
      setUploadingImage(true);
      try {
        const storeId = getSelectedStoreId();
        const response = await apiClient.uploadFile('/storage/upload', file, {
          folder: 'products',
          public: 'true',
          store_id: storeId
        });
        
        if (response.success) {
          const fileData = {
            name: file.name,
            url: response.data?.publicUrl || response.data?.url,
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
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setFlashMessage({ type: 'error', message: error.message || 'Failed to upload file' });
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

  const handleMediaInsert = (htmlContent) => {
    if (currentAttributeCode) {
      // Extract URL from HTML content
      const urlMatch = htmlContent.match(/src="([^"]+)"/);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        // Extract filename from URL
        const filename = url.split('/').pop().split('?')[0];
        
        // Create file data object similar to uploaded files
        const fileData = {
          name: filename,
          url: url,
          size: 0, // Size unknown for library items
          type: 'image'
        };
        
        setFormData(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [currentAttributeCode]: fileData
          }
        }));
        
        setFlashMessage({ type: 'success', message: 'Image selected from library!' });
      }
      setShowMediaBrowser(false);
      setCurrentAttributeCode(null);
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

  // Product Image System Handlers
  const handleBaseImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSavingBaseImage(true);
    try {
      const storeId = getSelectedStoreId();
      const response = await apiClient.uploadFile('/storage/upload', file, {
        folder: 'product/images',
        public: 'true',
        store_id: storeId
      });

      if (response.success) {
        const newImageUrl = response.data.url;
        setFormData(prev => ({ ...prev, image_url: newImageUrl }));
        
        // Auto-save if editing existing product
        if (product && product.id) {
          await saveProductImage('image_url', newImageUrl);
        }
        
        toast.success('Base image uploaded successfully');
      } else {
        toast.error('Failed to upload base image');
      }
    } catch (error) {
      console.error('Error uploading base image:', error);
      toast.error('Failed to upload base image');
    } finally {
      setSavingBaseImage(false);
    }
  };

  const handleRemoveBaseImage = async () => {
    const oldImageUrl = formData.image_url;
    setFormData(prev => ({ ...prev, image_url: '' }));
    
    // Auto-save if editing existing product
    if (product && product.id) {
      try {
        await saveProductImage('image_url', '');
        toast.success('Base image removed');
      } catch (error) {
        console.error('Error removing base image:', error);
        setFormData(prev => ({ ...prev, image_url: oldImageUrl }));
        toast.error('Failed to remove base image');
      }
    }
  };

  const handleAddNewImage = () => {
    const existingKeys = Object.keys(additionalImages);
    let nextIndex = 0;
    
    // Find the next available image slot (image_0, image_1, etc.)
    while (existingKeys.includes(`image_${nextIndex}`) && nextIndex < 9) {
      nextIndex++;
    }
    
    if (nextIndex >= 9) {
      toast.error('Maximum 9 additional images allowed');
      return;
    }
    
    const imageKey = `image_${nextIndex}`;
    setAdditionalImages(prev => ({
      ...prev,
      [imageKey]: {
        url: '',
        label: `Image ${nextIndex + 1}`,
        inputRef: React.createRef(),
        saving: false
      }
    }));
  };

  const handleAdditionalImageUrlChange = (imageKey, url) => {
    setAdditionalImages(prev => ({
      ...prev,
      [imageKey]: {
        ...prev[imageKey],
        url
      }
    }));
  };

  const handleAdditionalImageUpload = async (imageKey, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAdditionalImages(prev => ({
      ...prev,
      [imageKey]: {
        ...prev[imageKey],
        saving: true
      }
    }));

    try {
      const storeId = getSelectedStoreId();
      const response = await apiClient.uploadFile('/storage/upload', file, {
        folder: 'product/images',
        public: 'true',
        store_id: storeId
      });

      if (response.success) {
        const newImageUrl = response.data.url;
        setAdditionalImages(prev => ({
          ...prev,
          [imageKey]: {
            ...prev[imageKey],
            url: newImageUrl,
            saving: false
          }
        }));
        
        // Auto-save if editing existing product
        if (product && product.id) {
          await saveProductImage(imageKey, newImageUrl);
        }
        
        toast.success(`${additionalImages[imageKey].label} uploaded successfully`);
      } else {
        toast.error(`Failed to upload ${additionalImages[imageKey].label}`);
      }
    } catch (error) {
      console.error(`Error uploading ${imageKey}:`, error);
      toast.error(`Failed to upload ${additionalImages[imageKey].label}`);
    } finally {
      setAdditionalImages(prev => ({
        ...prev,
        [imageKey]: {
          ...prev[imageKey],
          saving: false
        }
      }));
    }
  };

  const handleRemoveAdditionalImage = async (imageKey) => {
    const oldImageUrl = additionalImages[imageKey]?.url;
    
    setAdditionalImages(prev => {
      const newImages = { ...prev };
      delete newImages[imageKey];
      return newImages;
    });
    
    // Auto-save if editing existing product
    if (product && product.id && oldImageUrl) {
      try {
        await saveProductImage(imageKey, '');
        toast.success(`${additionalImages[imageKey]?.label || 'Image'} removed`);
      } catch (error) {
        console.error(`Error removing ${imageKey}:`, error);
        // Restore the image on failure
        setAdditionalImages(prev => ({
          ...prev,
          [imageKey]: {
            url: oldImageUrl,
            label: `Image ${imageKey.replace('image_', '')} ${parseInt(imageKey.replace('image_', '')) + 1}`,
            inputRef: React.createRef(),
            saving: false
          }
        }));
        toast.error('Failed to remove image');
      }
    }
  };

  const saveProductImage = async (field, value) => {
    if (!product || !product.id) return;
    
    try {
      const storeId = getSelectedStoreId();
      const updateData = {
        ...formData,
        [field]: value
      };
      
      // Also include additional images data
      Object.entries(additionalImages).forEach(([key, imageData]) => {
        updateData[key] = imageData.url || '';
      });
      
      const response = await apiClient.put(`/products/${product.id}`, updateData, {
        'x-store-id': storeId
      });
      
      if (!response.success) {
        throw new Error('Failed to save product image');
      }
    } catch (error) {
      console.error('Error saving product image:', error);
      throw error;
    }
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

      // Use the same token lookup logic as apiClient
      const token = localStorage.getItem('store_owner_auth_token') ||
                   localStorage.getItem('customer_auth_token') ||
                   localStorage.getItem('auth_token') ||
                   localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   sessionStorage.getItem('token') ||
                   sessionStorage.getItem('authToken');
      
      if (!token) {
        console.error('❌ No authentication token available for redirect creation');
        console.log('Available localStorage keys:', Object.keys(localStorage));
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
        // Product image system - base image and additional images
        image_url: formData.image_url || null,
        image_0: additionalImages.image_0 || null,
        image_1: additionalImages.image_1 || null,
        image_2: additionalImages.image_2 || null,
        image_3: additionalImages.image_3 || null,
        image_4: additionalImages.image_4 || null,
        image_5: additionalImages.image_5 || null,
        image_6: additionalImages.image_6 || null,
        image_7: additionalImages.image_7 || null,
        image_8: additionalImages.image_8 || null,
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

        {/* Product Images - Direct Storage System */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Image Section */}
            <div>
              <Label className="text-base font-medium">Base Image</Label>
              <p className="text-sm text-gray-500 mb-3">Main product image displayed in listings and product pages</p>
              
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    value={formData.image_url || ''}
                    onChange={(e) => handleInputChange("image_url", e.target.value)}
                    placeholder="Enter image URL or upload an image"
                    disabled={loading}
                  />
                </div>
                
                <input
                  type="file"
                  ref={baseImageInputRef}
                  onChange={handleBaseImageUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={loading || savingBaseImage}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => baseImageInputRef.current?.click()}
                  disabled={loading || savingBaseImage}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {savingBaseImage ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              
              {/* Base Image Preview */}
              {formData.image_url && (
                <div className="mt-3 relative inline-block">
                  <img 
                    src={formData.image_url} 
                    alt="Base product image" 
                    className={`w-32 h-32 object-cover rounded-lg border ${savingBaseImage ? 'opacity-50' : ''}`}
                  />
                  {savingBaseImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => handleRemoveBaseImage()}
                    disabled={loading || savingBaseImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {savingBaseImage && (
                    <p className="text-xs text-blue-600 mt-1">Saving image...</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Additional Images Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base font-medium">Additional Images</Label>
                  <p className="text-sm text-gray-500">Extra product images for gallery and detailed views</p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewImage}
                  disabled={loading || Object.keys(additionalImages).length >= 9}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </Button>
              </div>

              {/* Additional Images List */}
              <div className="space-y-4">
                {Object.entries(additionalImages).map(([key, imageData]) => (
                  <div key={key} className="flex gap-4 items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{imageData.label}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={imageData.url || ''}
                          onChange={(e) => handleAdditionalImageUrlChange(key, e.target.value)}
                          placeholder="Enter image URL or upload an image"
                          disabled={loading}
                          className="flex-1"
                        />
                        
                        <input
                          type="file"
                          ref={imageData.inputRef}
                          onChange={(e) => handleAdditionalImageUpload(key, e)}
                          accept="image/*"
                          className="hidden"
                          disabled={loading || imageData.saving}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageData.inputRef.current?.click()}
                          disabled={loading || imageData.saving}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAdditionalImage(key)}
                          disabled={loading || imageData.saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {imageData.saving && (
                        <p className="text-xs text-blue-600 mt-1">Saving image...</p>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {imageData.url && (
                      <div className="relative">
                        <img 
                          src={imageData.url} 
                          alt={`Additional product image ${key}`}
                          className={`w-20 h-20 object-cover rounded border ${imageData.saving ? 'opacity-50' : ''}`}
                        />
                        {imageData.saving && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {Object.keys(additionalImages).length === 0 && (
                  <div className="text-center text-gray-500 py-8 border border-dashed rounded-lg">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No additional images added</p>
                    <p className="text-xs">Click "Add Image" to add more product images</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Image Attributes - Grouped above Inventory & Stock */}
        {selectedAttributes.length > 0 && (() => {
          const imageAttributes = selectedAttributes.filter(attr => 
            attr.type === 'image' || (
              attr.type === 'file' && 
              attr.file_settings?.allowed_extensions?.some(ext => 
                ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext.toLowerCase())
              )
            )
          );
          
          if (imageAttributes.length === 0) return null;
          
          const attributesWithImages = imageAttributes.filter(attr => {
            const value = formData.attributes[attr.code];
            return value && (typeof value === 'object' ? value.url : value);
          });
          const attributesWithoutImages = imageAttributes.filter(attr => {
            const value = formData.attributes[attr.code];
            return !value || !(typeof value === 'object' ? value.url : value);
          });

          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🖼️</span>
                  Product Image Attributes
                  <Badge variant="outline" className="ml-2">
                    {attributesWithImages.length}/{imageAttributes.length} with images
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attributes with images */}
                {attributesWithImages.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-green-700">Images Added ({attributesWithImages.length})</h5>
                    <div className="grid md:grid-cols-2 gap-4">
                      {attributesWithImages.map(attribute => {
                        const attributeValue = formData.attributes[attribute.code];
                        const imageUrl = typeof attributeValue === 'object' ? attributeValue.url : attributeValue;
                        
                        return (
                          <div key={attribute.id} className="border rounded-lg p-4 bg-green-50">
                            <div className="flex items-start justify-between mb-3">
                              <Label className="font-medium text-green-800">{attribute.name}</Label>
                              <button
                                type="button"
                                onClick={() => handleAttributeValueChange(attribute.code, null)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {imageUrl && (
                              <div className="mb-3">
                                <img 
                                  src={imageUrl} 
                                  alt={attribute.name}
                                  className="w-full h-32 object-cover rounded border"
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="file"
                                  id={`img_attr_${attribute.code}`}
                                  onChange={(e) => handleAttributeValueChange(attribute.code, e, attribute.type)}
                                  accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',') || 'image/*'}
                                  className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  disabled={uploadingImage}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentAttributeCode(attribute.code);
                                    setShowMediaBrowser(true);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  Library
                                </Button>
                              </div>
                              {attribute.file_settings && (
                                <p className="text-xs text-gray-500">
                                  Max: {attribute.file_settings.max_file_size}MB • 
                                  Allowed: {attribute.file_settings.allowed_extensions?.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Attributes without images */}
                {attributesWithoutImages.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Upload Images ({attributesWithoutImages.length})</h5>
                    <div className="grid md:grid-cols-2 gap-4">
                      {attributesWithoutImages.map(attribute => (
                        <div key={attribute.id} className="border rounded-lg p-4 bg-gray-50">
                          <Label htmlFor={`img_attr_${attribute.code}`} className="font-medium mb-2 block">
                            {attribute.name}
                          </Label>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                id={`img_attr_${attribute.code}`}
                                onChange={(e) => handleAttributeValueChange(attribute.code, e, attribute.type)}
                                accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',') || 'image/*'}
                                className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={uploadingImage}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentAttributeCode(attribute.code);
                                  setShowMediaBrowser(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <ImageIcon className="w-4 h-4" />
                                Library
                              </Button>
                            </div>
                            {uploadingImage && (
                              <p className="text-sm text-blue-600">Uploading image...</p>
                            )}
                            {attribute.file_settings && (
                              <p className="text-xs text-gray-500">
                                Max: {attribute.file_settings.max_file_size}MB • 
                                Allowed: {attribute.file_settings.allowed_extensions?.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

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
              <div className="space-y-6">
                {/* Image Attributes Section - for attributes with type 'image' */}
                {(() => {
                  const imageAttributes = selectedAttributes.filter(attr => 
                    attr.type === 'image' || (
                      attr.type === 'file' && 
                      attr.file_settings?.allowed_extensions?.some(ext => 
                        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext.toLowerCase())
                      )
                    )
                  );
                  const attributesWithImages = imageAttributes.filter(attr => {
                    const value = formData.attributes[attr.code];
                    return value && (typeof value === 'object' ? value.url : value);
                  });
                  const attributesWithoutImages = imageAttributes.filter(attr => {
                    const value = formData.attributes[attr.code];
                    return !value || !(typeof value === 'object' ? value.url : value);
                  });

                  if (imageAttributes.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg flex items-center">
                        <span className="mr-2">🖼️</span>
                        Image Attributes
                        <Badge variant="outline" className="ml-2">
                          {attributesWithImages.length}/{imageAttributes.length} with images
                        </Badge>
                      </h4>
                      
                      {/* Attributes with images */}
                      {attributesWithImages.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="font-medium text-green-700">Images Added ({attributesWithImages.length})</h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            {attributesWithImages.map(attribute => {
                              const attributeValue = formData.attributes[attribute.code];
                              const imageUrl = typeof attributeValue === 'object' ? attributeValue.url : attributeValue;
                              
                              return (
                                <div key={attribute.id} className="border rounded-lg p-4 bg-green-50">
                                  <div className="flex items-start justify-between mb-3">
                                    <Label className="font-medium text-green-800">{attribute.name}</Label>
                                    <button
                                      type="button"
                                      onClick={() => handleAttributeValueChange(attribute.code, null)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remove image"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  {imageUrl && (
                                    <div className="mb-3">
                                      <img 
                                        src={imageUrl} 
                                        alt={attribute.name}
                                        className="w-full h-32 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <input
                                        type="file"
                                        id={`attr_${attribute.code}`}
                                        onChange={(e) => handleAttributeValueChange(attribute.code, e, attribute.type)}
                                        accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',')}
                                        className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        disabled={uploadingImage}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setCurrentAttributeCode(attribute.code);
                                          setShowMediaBrowser(true);
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <ImageIcon className="w-4 h-4" />
                                        Library
                                      </Button>
                                    </div>
                                    
                                    {uploadingImage && (
                                      <p className="text-sm text-blue-600">Uploading image...</p>
                                    )}
                                    
                                    {typeof attributeValue === 'object' && attributeValue.name && (
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">{attributeValue.name}</span>
                                        {attributeValue.size && (
                                          <span className="ml-2">
                                            ({(attributeValue.size / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {attribute.file_settings && (
                                      <p className="text-xs text-gray-500">
                                        Max: {attribute.file_settings.max_file_size}MB. 
                                        Types: {attribute.file_settings.allowed_extensions?.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Attributes without images */}
                      {attributesWithoutImages.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="font-medium text-amber-700">Add Images ({attributesWithoutImages.length})</h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            {attributesWithoutImages.map(attribute => (
                              <div key={attribute.id} className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50">
                                <Label className="font-medium text-amber-800 mb-3 block">{attribute.name}</Label>
                                
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="file"
                                      id={`attr_${attribute.code}`}
                                      onChange={(e) => handleAttributeValueChange(attribute.code, e, attribute.type)}
                                      accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',')}
                                      className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                      disabled={uploadingImage}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setCurrentAttributeCode(attribute.code);
                                        setShowMediaBrowser(true);
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                      Library
                                    </Button>
                                  </div>
                                  
                                  {uploadingImage && (
                                    <p className="text-sm text-blue-600">Uploading image...</p>
                                  )}
                                  
                                  {attribute.file_settings && (
                                    <p className="text-xs text-gray-500">
                                      Max: {attribute.file_settings.max_file_size}MB. 
                                      Types: {attribute.file_settings.allowed_extensions?.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Non-Image Attributes Section */}
                {(() => {
                  const nonImageAttributes = selectedAttributes.filter(attr => 
                    // Exclude ALL image-related attributes (handled in top Images section)
                    !(
                      attr.type === 'image' || 
                      (attr.type === 'file' && 
                        attr.file_settings?.allowed_extensions?.some(ext => 
                          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext.toLowerCase())
                        )
                      )
                    )
                  );

                  if (nonImageAttributes.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Other Attributes</h4>
                      {nonImageAttributes.map(attribute => {
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
                                <div className="flex gap-2">
                                  <input
                                    type="file"
                                    id={`attr_${attribute.code}`}
                                    onChange={(e) => handleAttributeValueChange(attribute.code, e, attribute.type)}
                                    accept={attribute.file_settings?.allowed_extensions?.map(ext => `.${ext}`).join(',')}
                                    className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    disabled={uploadingImage}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentAttributeCode(attribute.code);
                                      setShowMediaBrowser(true);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    Library
                                  </Button>
                                </div>
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
                  );
                })()}
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
                  <Label htmlFor="url_key">URL Key (Slug)</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-url-key"
                      checked={isEditingUrlKey}
                      onCheckedChange={(checked) => {
                        setIsEditingUrlKey(checked);
                        if (!checked) {
                          // Revert to original URL key or auto-generate from name
                          if (product && originalUrlKey) {
                            // Editing existing product - revert to original
                            setFormData(prev => ({
                              ...prev,
                              seo: { ...prev.seo, url_key: originalUrlKey }
                            }));
                          } else {
                            // New product - regenerate from name
                            const generatedUrlKey = slugify(formData.name);
                            setFormData(prev => ({
                              ...prev,
                              seo: { ...prev.seo, url_key: generatedUrlKey }
                            }));
                          }
                          setHasManuallyEditedUrlKey(false);
                          setShowSlugChangeWarning(false);
                        }
                      }}
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
                    ? "Showing the product slug. Auto-generated from product name. Enable editing to customize."
                    : "Custom URL key (slug) for this product. Changes will affect the product's URL."
                  }
                </p>
              </div>

              {showSlugChangeWarning && hasManuallyEditedUrlKey && isEditingUrlKey && (
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

        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : (product ? "Update Product" : "Create Product")}</Button>
        </div>
      </form>
      
      {/* Media Browser Dialog */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onInsert={handleMediaInsert}
        allowMultiple={false}
        uploadFolder="product"
      />
    </div>
  );
}
