
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
import { X, Upload, Search, AlertTriangle, ImageIcon, Plus, Trash2, ChevronRight, ChevronDown, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import FlashMessage from "@/components/storefront/FlashMessage";
import apiClient from "@/api/client";
import MediaBrowser from "@/components/admin/cms/MediaBrowser";
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [initialExpansionDone, setInitialExpansionDone] = useState(false);

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
    images: [], // JSON array of {attribute_code, filepath, filesize}
    type: "simple", // Product type: simple, configurable, bundle, etc.
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
    configurable_attributes: [], // Array of attribute IDs for configurable products
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

  // Simplified product image system state
  const imageInputRef = useRef(null);

  // Configurable product variant management state
  const [variants, setVariants] = useState([]);
  const [availableVariants, setAvailableVariants] = useState([]);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [showAttributeManager, setShowAttributeManager] = useState(false);
  const [attributeSearch, setAttributeSearch] = useState('');
  const [updatedAttributes, setUpdatedAttributes] = useState(passedAttributes || []);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

  // Sync updatedAttributes with passedAttributes when it changes
  useEffect(() => {
    if (passedAttributes && passedAttributes.length > 0) {
      setUpdatedAttributes(passedAttributes);
    }
  }, [passedAttributes]);

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
        type: product.type || "simple", // Product type
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
        configurable_attributes: Array.isArray(product.configurable_attributes) ? product.configurable_attributes : [], // Configurable attributes
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
      // Additional images initialization removed - now using simplified images array
      
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
            type: "simple", // Default to simple product
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
            configurable_attributes: [], // Default empty for new products
            attributes: {},
            seo: { meta_title: "", meta_description: "", meta_keywords: "", url_key: "", meta_robots_tag: "null" }, // Default for new product
            related_product_ids: [],
            tags: [],
            featured: false
        });
    }
  }, [product, passedAttributeSets]);

  // Auto-expand categories that contain selected items
  useEffect(() => {
    if (categories && categories.length > 0 && formData.category_ids.length > 0 && !initialExpansionDone) {
      const categoriesToExpand = new Set();
      
      // For each selected category, find and expand all its parent categories
      formData.category_ids.forEach(selectedId => {
        const findParents = (categoryId) => {
          const category = categories.find(c => c.id === categoryId);
          if (category && category.parent_id) {
            categoriesToExpand.add(category.parent_id);
            findParents(category.parent_id);
          }
        };
        findParents(selectedId);
      });
      
      if (categoriesToExpand.size > 0) {
        setExpandedCategories(categoriesToExpand);
        setInitialExpansionDone(true);
      }
    }
  }, [categories, formData.category_ids, initialExpansionDone]);

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


  // Product Image System Handlers - Simplified unified system
  const generateImagePath = (filename) => {
    // Create hierarchical path: first_char/second_char/filename
    const cleanFilename = filename.toLowerCase().replace(/[^a-zA-Z0-9.-]/g, '');
    const firstChar = cleanFilename.charAt(0) || 'a';
    const secondChar = cleanFilename.charAt(1) || 'a';
    return `${firstChar}/${secondChar}/${cleanFilename}`;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const storeId = getSelectedStoreId();
      
      // Generate hierarchical path
      const hierarchicalPath = generateImagePath(file.name);
      
      const response = await apiClient.uploadFile('/storage/upload', file, {
        folder: `product/images/${hierarchicalPath}`,
        public: 'true',
        store_id: storeId
      });

      if (response.success) {
        const newImage = {
          attribute_code: `image_${formData.images.length}`,
          filepath: hierarchicalPath,
          filesize: file.size,
          url: response.data.url
        };
        
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, newImage]
        }));
        
        // Auto-save if editing existing product
        if (product && product.id) {
          try {
            await saveProductImages([...formData.images, newImage]);
            toast.success('Image uploaded and saved successfully');
          } catch (saveError) {
            console.error('Failed to auto-save image:', saveError);
            toast.warning('Image uploaded but not yet saved. Click "Update Product" to save.');
          }
        } else {
          // For new products, just show upload success
          toast.success('Image uploaded successfully. Click "Create Product" to save.');
        }
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async (index) => {
    const oldImages = [...formData.images];
    const newImages = formData.images.filter((_, i) => i !== index);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    
    // Auto-save if editing existing product
    if (product && product.id) {
      try {
        await saveProductImages(newImages);
        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Error removing image:', error);
        setFormData(prev => ({ ...prev, images: oldImages }));
        toast.error('Failed to remove image');
      }
    }
  };

  const saveProductImages = async (imagesArray) => {
    if (!product || !product.id) return;

    try {
      const storeId = getSelectedStoreId();
      // Only send the images field for instant save
      const updateData = {
        images: imagesArray
      };

      console.log('🔄 Auto-saving product images:', {
        productId: product.id,
        storeId,
        imagesCount: imagesArray.length,
        images: imagesArray
      });

      const response = await apiClient.put(`/products/${product.id}`, updateData);

      console.log('✅ Auto-save response:', response);

      if (!response.success) {
        throw new Error('Failed to save product images');
      }

      // Update local state with saved data to ensure consistency
      if (response.data && response.data.images) {
        setFormData(prev => ({
          ...prev,
          images: response.data.images
        }));
      }
    } catch (error) {
      console.error('❌ Error saving product image:', error);
      throw error;
    }
  };

  // Load existing variants for configurable products
  useEffect(() => {
    if (product && product.id && formData.type === 'configurable') {
      loadProductVariants();
    }
  }, [product?.id, formData.type]);

  const loadProductVariants = async () => {
    if (!product || !product.id) return;

    setLoadingVariants(true);
    try {
      const response = await apiClient.get(`/configurable-products/${product.id}/variants`);

      if (response.success && response.data) {
        setVariants(response.data);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load product variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  const loadAvailableVariants = async () => {
    if (!product || !product.id) return;

    setLoadingVariants(true);
    try {
      const response = await apiClient.get(`/configurable-products/${product.id}/available-variants`);

      if (response.success && response.data) {
        setAvailableVariants(response.data);
      }
    } catch (error) {
      console.error('Error loading available variants:', error);
      toast.error('Failed to load available variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleAddVariants = async (selectedVariantIds, attributeValuesMap) => {
    if (!product || !product.id || selectedVariantIds.length === 0) return;

    setLoadingVariants(true);
    try {
      const response = await apiClient.post(`/configurable-products/${product.id}/variants`, {
        variant_ids: selectedVariantIds,
        attribute_values_map: attributeValuesMap
      });

      if (response.success) {
        await loadProductVariants();
        setShowVariantSelector(false);
        // Don't show toast here - let the calling function handle it
      } else {
        throw new Error(response.message || 'Failed to add variants');
      }
    } catch (error) {
      console.error('Error adding variants:', error);
      // Re-throw with the error message from API
      throw error;
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleRemoveVariant = async (variantId) => {
    if (!product || !product.id) return;

    if (!confirm('Are you sure you want to remove this variant?')) return;

    setLoadingVariants(true);
    try {
      const response = await apiClient.delete(`/configurable-products/${product.id}/variants/${variantId}`);

      if (response.success) {
        toast.success('Variant removed successfully');
        await loadProductVariants();
      } else {
        toast.error(response.message || 'Failed to remove variant');
      }
    } catch (error) {
      console.error('Error removing variant:', error);
      toast.error('Failed to remove variant');
    } finally {
      setLoadingVariants(false);
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
        // Product images - unified system (JSON array with attribute_code, filepath, filesize)
        images: Array.isArray(formData.images) ? formData.images : [],
        category_ids: Array.isArray(formData.category_ids) ? formData.category_ids : [],
        type: formData.type || "simple", // Product type
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
        configurable_attributes: Array.isArray(formData.configurable_attributes) ? formData.configurable_attributes : [], // Configurable attributes
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
    passedAttributes.filter(attr => attr && selectedAttributeSet.attribute_ids.includes(attr.id)) :
    // If no attribute set is selected, show all available attributes
    passedAttributes || [];

  return (
    <div>
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
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
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="flex-1 min-h-[200px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing & Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {formData.type === 'configurable' ? (
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Configurable Product Pricing:</strong> Price and stock are determined by the selected variant.
                    Assign variants in the "Configurable Product Settings" section below.
                  </AlertDescription>
                </Alert>
              ) : (
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
                      className={formData.compare_price && parseFloat(formData.compare_price) >= parseFloat(formData.price) ? "border-red-500" : ""}
                    />
                    {formData.compare_price && parseFloat(formData.compare_price) >= parseFloat(formData.price) ? (
                      <p className="text-xs text-red-600 mt-1">⚠️ Sale price should be lower than regular price (${formData.price})</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Leave empty if no sale price</p>
                    )}
                  </div>
                </div>
              )}
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="mt-4">
                <Label htmlFor="product_type">Product Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Product</SelectItem>
                    <SelectItem value="configurable">Configurable Product</SelectItem>
                    <SelectItem value="bundle">Bundle Product</SelectItem>
                    <SelectItem value="grouped">Grouped Product</SelectItem>
                    <SelectItem value="virtual">Virtual Product</SelectItem>
                    <SelectItem value="downloadable">Downloadable Product</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'simple' && 'A standard product with a single SKU'}
                  {formData.type === 'configurable' && 'A product with multiple variations (e.g., different sizes, colors)'}
                  {formData.type === 'bundle' && 'A collection of products sold together'}
                  {formData.type === 'grouped' && 'A set of related simple products'}
                  {formData.type === 'virtual' && 'A non-physical product (e.g., service, warranty)'}
                  {formData.type === 'downloadable' && 'A digital product available for download'}
                </p>
              </div>

              {formData.type !== 'configurable' && (
                <>
                  <Separator className="my-4" />

                  {/* Compact Inventory & Stock Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Inventory & Stock</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="manage_stock"
                          checked={formData.manage_stock}
                          onCheckedChange={(checked) => handleInputChange("manage_stock", checked)}
                        />
                        <Label htmlFor="manage_stock" className="text-sm cursor-pointer">Manage Stock</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="infinite_stock"
                          checked={formData.infinite_stock}
                          onCheckedChange={(checked) => handleInputChange("infinite_stock", checked)}
                          disabled={!formData.manage_stock}
                        />
                        <Label htmlFor="infinite_stock" className={`text-sm cursor-pointer ${!formData.manage_stock ? 'text-gray-400' : ''}`}>
                          Infinite Stock
                        </Label>
                      </div>
                    </div>

                    {formData.manage_stock && !formData.infinite_stock && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="stock_quantity" className="text-sm">Stock Quantity</Label>
                            <Input
                              id="stock_quantity"
                              type="number"
                              value={formData.stock_quantity}
                              onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                              min="0"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="low_stock_threshold" className="text-sm">Low Stock Alert</Label>
                            <Input
                              id="low_stock_threshold"
                              type="number"
                              value={formData.low_stock_threshold}
                              onChange={(e) => handleInputChange("low_stock_threshold", e.target.value)}
                              min="0"
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="allow_backorders"
                            checked={formData.allow_backorders}
                            onCheckedChange={(checked) => handleInputChange("allow_backorders", checked)}
                          />
                          <Label htmlFor="allow_backorders" className="text-sm cursor-pointer">
                            Allow Backorders
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Selection - Collapsible */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">Categories</span>
                {formData.category_ids.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {formData.category_ids.length} selected
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Label htmlFor="categories">Product Categories</Label>
              
              {/* Selected Categories as Labels */}
              {formData.category_ids.length > 0 && (
                <div className="mt-2 mb-3 flex flex-wrap gap-2">
                  {formData.category_ids.map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    return (
                      <Badge 
                        key={categoryId} 
                        variant="secondary" 
                        className="px-2 py-1 flex items-center gap-1 hover:bg-gray-200 transition-colors"
                      >
                        <span>{category.name}</span>
                        <button
                          type="button"
                          onClick={() => handleInputChange("category_ids", formData.category_ids.filter(id => id !== categoryId))}
                          className="ml-1 hover:text-red-600 transition-colors"
                          aria-label={`Remove ${category.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <div className="space-y-2 mt-2">
                {categories && categories.length > 0 ? (
                  <>
                    <div className="flex justify-end gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Expand all categories that have children
                          const allParentIds = categories
                            .filter(cat => categories.some(c => c.parent_id === cat.id))
                            .map(cat => cat.id);
                          setExpandedCategories(new Set(allParentIds));
                        }}
                        className="text-xs"
                      >
                        Expand All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedCategories(new Set())}
                        className="text-xs"
                      >
                        Collapse All
                      </Button>
                    </div>
                    <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                    {(() => {
                      // Build hierarchical structure for better display
                      const categoryMap = new Map();
                      const rootCategories = [];
                      
                      // Create a map of all categories
                      categories.forEach(cat => {
                        categoryMap.set(cat.id, { ...cat, children: [] });
                      });
                      
                      // Build tree structure
                      categories.forEach(cat => {
                        const catNode = categoryMap.get(cat.id);
                        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
                          categoryMap.get(cat.parent_id).children.push(catNode);
                        } else {
                          rootCategories.push(catNode);
                        }
                      });
                      
                      // Toggle category expansion
                      const toggleCategory = (categoryId) => {
                        setExpandedCategories(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(categoryId)) {
                            newSet.delete(categoryId);
                          } else {
                            newSet.add(categoryId);
                          }
                          return newSet;
                        });
                      };

                      // Render categories hierarchically with collapse/expand
                      const renderCategories = (cats, level = 0) => {
                        return cats.map(category => {
                          const hasChildren = category.children && category.children.length > 0;
                          const isExpanded = expandedCategories.has(category.id);
                          
                          return (
                            <React.Fragment key={category.id}>
                              <div 
                                className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded"
                                style={{ paddingLeft: `${level * 20 + (hasChildren ? 0 : 20)}px` }}
                              >
                                {hasChildren && (
                                  <button
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                )}
                                <input
                                  type="checkbox"
                                  id={`category-${category.id}`}
                                  checked={formData.category_ids.includes(category.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleInputChange("category_ids", [...formData.category_ids, category.id]);
                                    } else {
                                      handleInputChange("category_ids", formData.category_ids.filter(id => id !== category.id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label 
                                  htmlFor={`category-${category.id}`} 
                                  className="flex-1 cursor-pointer text-sm font-normal flex items-center"
                                >
                                  {category.name}
                                  {category.is_active === false && (
                                    <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>
                                  )}
                                </Label>
                              </div>
                              {hasChildren && isExpanded && 
                                renderCategories(category.children, level + 1)}
                            </React.Fragment>
                          );
                        });
                      };
                      
                      return renderCategories(rootCategories);
                    })()}
                  </div>
                  </>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">No categories available</p>
                    <p className="text-xs text-gray-400 mt-1">Create categories first to assign products to them</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Product Images - Unified Storage System */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="product-images">
            <AccordionTrigger>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">Product Images</span>
                {formData.images.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
            
            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={image.attribute_code || index} className="relative group border rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageRemove(index)}
                    disabled={loading || uploadingImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    <p className="truncate">{image.filepath}</p>
                    <p>{(image.filesize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
              
              {/* Add Image Button - Always on the right */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading || uploadingImage}
                />
                <div className="h-32 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700">
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mb-2"></div>
                      <span className="text-xs">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Add Image</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Empty state */}
            {formData.images.length === 0 && (
              <div className="text-center text-gray-500 py-12 border border-dashed rounded-lg">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No product images</p>
                <p className="text-sm">Click "Add Image" to upload your first product image</p>
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Images will be stored with hierarchical paths (e.g., /h/a/hamid.png) and saved instantly when uploaded.
            </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="attributes">
            <AccordionTrigger>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">Attributes</span>
                {selectedAttributes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedAttributes.length} attribute{selectedAttributes.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
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
                  const nonImageAttributes = selectedAttributes.filter(attr => {
                    // Exclude ALL image-related attributes (handled in top Images section)
                    
                    // Check if it's explicitly an image type
                    if (attr.type === 'image') return false;
                    
                    // Check if it's a file type with image extensions
                    if (attr.type === 'file' && 
                        attr.file_settings?.allowed_extensions?.some(ext => 
                          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext.toLowerCase())
                        )
                    ) return false;
                    
                    // Check if the attribute code or name contains image-related keywords
                    const lowerCode = (attr.code || '').toLowerCase();
                    const lowerName = (attr.name || '').toLowerCase();
                    const imageKeywords = ['image', 'gallery', 'picture', 'photo', 'thumbnail', 'thumb', 'banner', 'logo'];
                    
                    if (imageKeywords.some(keyword => 
                      lowerCode.includes(keyword) || lowerName.includes(keyword)
                    )) {
                      return false;
                    }
                    
                    return true;
                  });

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
                                value={(typeof attributeValue === 'object' && attributeValue?.value) ? attributeValue.value : (attributeValue || "")}
                                onValueChange={(v) => handleAttributeValueChange(attribute.code, v)}
                              >
                                <SelectTrigger><SelectValue placeholder={`Select ${attribute.name}`} /></SelectTrigger>
                                <SelectContent>
                                  {attribute.options.filter(o => o.value !== "").map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : attribute.type === 'multiselect' && attribute.options ? (
                              <div className="space-y-2">
                                <div className="text-sm text-gray-600 mb-2">Select multiple options:</div>
                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                  {attribute.options.filter(o => o.value !== "").map(option => {
                                    const isSelected = Array.isArray(attributeValue) 
                                      ? attributeValue.some(val => (typeof val === 'object' ? val.value : val) === option.value)
                                      : (typeof attributeValue === 'object' && attributeValue?.value) 
                                        ? attributeValue.value === option.value 
                                        : attributeValue === option.value;
                                    
                                    return (
                                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const currentValues = Array.isArray(attributeValue) ? attributeValue : [];
                                            const currentStringValues = currentValues.map(val => typeof val === 'object' ? val.value : val);
                                            
                                            let newValues;
                                            if (e.target.checked) {
                                              // Add the value if not already present
                                              if (!currentStringValues.includes(option.value)) {
                                                newValues = [...currentValues, option.value];
                                              } else {
                                                newValues = currentValues;
                                              }
                                            } else {
                                              // Remove the value
                                              newValues = currentValues.filter(val => 
                                                (typeof val === 'object' ? val.value : val) !== option.value
                                              );
                                            }
                                            handleAttributeValueChange(attribute.code, newValues);
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{option.label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {Array.isArray(attributeValue) && attributeValue.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    {attributeValue.length} option{attributeValue.length !== 1 ? 's' : ''} selected
                                  </div>
                                )}
                              </div>
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Configurable Product Settings - Only show when product type is configurable */}
        {formData.type === 'configurable' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurable Product Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription className="text-sm">
                  Configurable products allow you to create a parent product with multiple variant options (e.g., different sizes, colors).
                  First, select which attributes will be used for configuration, then assign simple products as variants.
                </AlertDescription>
              </Alert>

              {/* Select Configurable Attributes */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-base font-semibold">1. Select Configurable Attributes</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose which attributes customers will use to select variants (e.g., Size, Color).
                      Only attributes marked as "configurable" are available.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAttributeManager(!showAttributeManager)}
                    className="flex items-center gap-2"
                  >
                    {showAttributeManager ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {showAttributeManager ? 'Hide' : 'Manage'} Attributes
                  </Button>
                </div>

                {/* Inline Attribute Manager */}
                {showAttributeManager && (
                  <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Mark attributes as configurable</h4>
                      <Badge variant="secondary" className="text-xs">
                        {updatedAttributes.filter(attr => attr.is_configurable).length} configurable
                      </Badge>
                    </div>

                    <Input
                      placeholder="Search attributes..."
                      value={attributeSearch}
                      onChange={(e) => setAttributeSearch(e.target.value)}
                      className="w-full"
                    />

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {updatedAttributes
                        .filter(attr => {
                          const isSuitableType = attr.type === 'select' || attr.type === 'multiselect';
                          const matchesSearch = attributeSearch === '' ||
                            attr.name.toLowerCase().includes(attributeSearch.toLowerCase()) ||
                            attr.code.toLowerCase().includes(attributeSearch.toLowerCase());
                          return isSuitableType && matchesSearch;
                        })
                        .map(attribute => (
                          <div
                            key={attribute.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              attribute.is_configurable ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{attribute.name}</span>
                                <Badge variant="outline" className="text-xs">{attribute.code}</Badge>
                                <Badge variant="secondary" className="text-xs">{attribute.type}</Badge>
                              </div>
                              {attribute.options && attribute.options.length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {attribute.options.slice(0, 3).map(o => o.label).join(', ')}
                                  {attribute.options.length > 3 && ` +${attribute.options.length - 3} more`}
                                </div>
                              )}
                            </div>
                            <Switch
                              checked={attribute.is_configurable}
                              onCheckedChange={async (checked) => {
                                try {
                                  await apiClient.put(`/attributes/${attribute.id}`, {
                                    is_configurable: checked
                                  });
                                  const updated = updatedAttributes.map(attr =>
                                    attr.id === attribute.id ? { ...attr, is_configurable: checked } : attr
                                  );
                                  setUpdatedAttributes(updated);
                                  toast.success(`${attribute.name} ${checked ? 'marked' : 'unmarked'} as configurable`);
                                } catch (error) {
                                  console.error('Error updating attribute:', error);
                                  toast.error('Failed to update attribute');
                                }
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {updatedAttributes && updatedAttributes.filter(attr => attr.is_configurable).length > 0 ? (
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <p className="text-sm text-gray-600">
                      Select which attributes will be used for this product's variants:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {updatedAttributes.filter(attr => attr.is_configurable).map(attribute => {
                        const isSelected = formData.configurable_attributes.includes(attribute.id);
                        return (
                          <Badge
                            key={attribute.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (isSelected) {
                                handleInputChange("configurable_attributes", formData.configurable_attributes.filter(id => id !== attribute.id));
                              } else {
                                handleInputChange("configurable_attributes", [...formData.configurable_attributes, attribute.id]);
                              }
                            }}
                          >
                            {attribute.name}
                            {isSelected && <X className="w-3 h-3 ml-1.5" />}
                          </Badge>
                        );
                      })}
                    </div>
                    {formData.configurable_attributes.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {formData.configurable_attributes.length} attribute{formData.configurable_attributes.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50 text-center py-6">
                    <p className="text-sm text-gray-500">No configurable attributes available.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use "Manage Attributes" above to mark attributes as configurable.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Manage Variants Section */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">2. Manage Product Variants</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Add simple products as variants of this configurable product. Each variant represents a specific combination of the selected attributes.
                  </p>
                </div>

                {!product || !product.id ? (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-800 text-sm">
                      Please save this product first before adding variants.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {/* Current Variants List */}
                    {loadingVariants ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading variants...</p>
                      </div>
                    ) : variants.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <span className="font-medium text-sm">Assigned Variants ({variants.length})</span>
                        </div>
                        <div className="divide-y max-h-96 overflow-y-auto">
                          {variants.map((variantRelation) => {
                            const variant = variantRelation.variant;
                            if (!variant) return null;

                            return (
                              <div key={variantRelation.id} className="p-4 flex items-start space-x-4 hover:bg-gray-50">
                                {/* Variant Image */}
                                <div className="flex-shrink-0">
                                  <img
                                    src={variant.images?.[0]?.url || 'https://placehold.co/80x80?text=No+Image'}
                                    alt={variant.name}
                                    className="w-20 h-20 object-cover rounded border"
                                  />
                                </div>

                                {/* Variant Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{variant.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">SKU: {variant.sku}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Price: ${variant.price}
                                    </Badge>
                                    <Badge variant={variant.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                                      Stock: {variant.infinite_stock ? '∞' : variant.stock_quantity}
                                    </Badge>
                                  </div>

                                  {/* Attribute Values */}
                                  {variantRelation.attribute_values && Object.keys(variantRelation.attribute_values).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {Object.entries(variantRelation.attribute_values).map(([key, value]) => (
                                        <Badge key={key} variant="outline" className="text-xs">
                                          {key}: {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Remove Button */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVariant(variant.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Add Variant Buttons - Always shown for configurable products */}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
                      {variants.length === 0 && (
                        <p className="text-sm text-gray-600">
                          No variants assigned yet. Add simple products as variants to create your configurable product options.
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant={showVariantSelector ? "default" : "outline"}
                          onClick={() => {
                            console.log('Configurable attributes:', formData.configurable_attributes);
                            if (!showVariantSelector) {
                              // Opening variant selector - close quick create and load variants
                              setShowQuickCreate(false);
                              loadAvailableVariants();
                              setShowVariantSelector(true);
                            } else {
                              // Closing variant selector
                              setShowVariantSelector(false);
                            }
                          }}
                          disabled={loadingVariants || !formData.configurable_attributes || formData.configurable_attributes.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {showVariantSelector ? 'Hide' : 'Add Existing Products'}
                        </Button>
                        <Button
                          type="button"
                          variant={showQuickCreate ? "default" : "outline"}
                          onClick={() => {
                            console.log('Configurable attributes:', formData.configurable_attributes);
                            if (!showQuickCreate) {
                              // Opening quick create - close variant selector
                              setShowVariantSelector(false);
                              setShowQuickCreate(true);
                            } else {
                              // Closing quick create
                              setShowQuickCreate(false);
                            }
                          }}
                          disabled={!formData.configurable_attributes || formData.configurable_attributes.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {showQuickCreate ? 'Hide' : 'Quick Create Variants'}
                        </Button>
                      </div>
                      {(!formData.configurable_attributes || formData.configurable_attributes.length === 0) && (
                        <p className="text-xs text-amber-600">
                          Please select configurable attributes first (step 1 above). Click the badge pills to select attributes.
                        </p>
                      )}
                    </div>

                    {/* Inline Quick Create Variants */}
                    {showQuickCreate && formData.configurable_attributes.length > 0 && (
                      <div className="border rounded-lg p-4 bg-green-50 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Quick Create Variants</h4>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setShowQuickCreate(false);
                            setSelectedAttributeValues({});
                            setFlashMessage(null); // Clear message when closing
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Flash Message inside Quick Create card */}
                        {flashMessage && (
                          <div className={`${flashMessage.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'} border-l-4 p-3 rounded`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {flashMessage.type === 'success' ? (
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 mr-2" />
                                )}
                                <p className="text-sm font-medium">{flashMessage.message}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFlashMessage(null)}
                                className="p-1 h-auto hover:bg-transparent"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-600">
                          Select attribute values to create. Products will be created for all combinations of selected values.
                        </p>

                        {updatedAttributes.filter(attr => formData.configurable_attributes.includes(attr.id)).map(attr => (
                          <div key={attr.id} className="space-y-2">
                            <Label className="text-sm font-medium">{attr.name}</Label>
                            <div className="flex flex-wrap gap-2">
                              {attr.options && attr.options.map(opt => {
                                const isSelected = selectedAttributeValues[attr.code]?.includes(opt.value);
                                return (
                                  <Badge
                                    key={opt.value}
                                    variant={isSelected ? "default" : "outline"}
                                    className="cursor-pointer px-3 py-1.5 hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setSelectedAttributeValues(prev => {
                                        const currentValues = prev[attr.code] || [];
                                        if (isSelected) {
                                          // Deselect
                                          return {
                                            ...prev,
                                            [attr.code]: currentValues.filter(v => v !== opt.value)
                                          };
                                        } else {
                                          // Select
                                          return {
                                            ...prev,
                                            [attr.code]: [...currentValues, opt.value]
                                          };
                                        }
                                      });
                                    }}
                                  >
                                    {opt.label}
                                    {isSelected && <X className="w-3 h-3 ml-1.5" />}
                                  </Badge>
                                );
                              })}
                            </div>
                            {selectedAttributeValues[attr.code]?.length > 0 && (
                              <p className="text-xs text-gray-600">
                                {selectedAttributeValues[attr.code].length} value{selectedAttributeValues[attr.code].length !== 1 ? 's' : ''} selected
                              </p>
                            )}
                          </div>
                        ))}

                        {Object.keys(selectedAttributeValues).some(key => selectedAttributeValues[key]?.length > 0) && (
                          <Alert>
                            <AlertDescription className="text-sm">
                              <strong>Note:</strong> This will create {Object.entries(selectedAttributeValues)
                                .filter(([, values]) => values && values.length > 0)
                                .reduce((total, [, values]) => total * values.length, 1)} simple products
                              based on selected combinations. Each product will be named: "{product?.name || 'Product'} - [Attribute Values]"
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQuickCreate(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={async () => {
                              setQuickCreateLoading(true);
                              try {
                                // Generate combinations from selected values only
                                const selectedAttrs = updatedAttributes
                                  .filter(attr => formData.configurable_attributes.includes(attr.id))
                                  .filter(attr => selectedAttributeValues[attr.code]?.length > 0);

                                if (selectedAttrs.length === 0) {
                                  toast.error('Please select at least one attribute value');
                                  setQuickCreateLoading(false);
                                  return;
                                }

                                const combinations = [];
                                const generateCombinations = (index, current) => {
                                  if (index === selectedAttrs.length) {
                                    combinations.push({...current});
                                    return;
                                  }
                                  const attr = selectedAttrs[index];
                                  const selectedValues = selectedAttributeValues[attr.code] || [];
                                  selectedValues.forEach(value => {
                                    const option = attr.options.find(o => o.value === value);
                                    if (option) {
                                      generateCombinations(index + 1, {
                                        ...current,
                                        [attr.code]: option.value,
                                        [`${attr.code}_label`]: option.label
                                      });
                                    }
                                  });
                                };
                                generateCombinations(0, {});

                                // Create simple products for each combination
                                const variantIds = [];
                                const attributeValuesMap = {};
                                const errors = [];
                                let incrementCounter = 1;
                                const totalVariants = combinations.length;

                                for (let i = 0; i < combinations.length; i++) {
                                  const combo = combinations[i];
                                  const variantName = `${product.name} - ${Object.entries(combo)
                                    .filter(([key]) => key.endsWith('_label'))
                                    .map(([, val]) => val)
                                    .join(' / ')}`;

                                  const variantSku = `${product.sku}-${Object.entries(combo)
                                    .filter(([key]) => !key.endsWith('_label'))
                                    .map(([, val]) => val)
                                    .join('-')}`;

                                  // Generate slug from variant name with increment to prevent duplicates
                                  const baseSlug = variantName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/^-+|-+$/g, '');
                                  const variantSlug = `${baseSlug}-${incrementCounter}`;
                                  incrementCounter++;

                                  // Build attributes object with the selected values
                                  const variantAttributes = {};
                                  Object.entries(combo)
                                    .filter(([key]) => !key.endsWith('_label'))
                                    .forEach(([key, value]) => {
                                      variantAttributes[key] = value;
                                    });

                                  // Wrap individual product creation in try-catch
                                  try {
                                    // Create simple product with attribute values
                                    const response = await apiClient.post('/products', {
                                      name: variantName,
                                      slug: variantSlug,
                                      sku: variantSku,
                                      type: 'simple',
                                      store_id: product.store_id,
                                      status: 'active',
                                      price: product.price || 0,
                                      attribute_set_id: product.attribute_set_id,
                                      category_ids: product.category_ids || [],
                                      attributes: variantAttributes
                                    });

                                    console.log('Product creation response:', response);

                                    if (response.success && response.data) {
                                      console.log('Adding variant ID:', response.data.id);
                                      variantIds.push(response.data.id);
                                      // Store attribute values (without _label keys)
                                      attributeValuesMap[response.data.id] = Object.fromEntries(
                                        Object.entries(combo).filter(([key]) => !key.endsWith('_label'))
                                      );
                                    } else {
                                      console.warn('Response not successful or missing data:', response);
                                    }
                                  } catch (productError) {
                                    console.error(`Failed to create variant "${variantName}":`, productError);

                                    // Parse the error message
                                    let errorMsg = productError.data?.message || productError.message || 'Unknown error';

                                    // Handle specific database constraint errors
                                    if (errorMsg.includes('duplicate key value violates unique constraint')) {
                                      if (errorMsg.includes('products_sku_store_id_key')) {
                                        errorMsg = `SKU "${variantSku}" already exists`;
                                      } else if (errorMsg.includes('products_slug_store_id_key')) {
                                        errorMsg = `Slug "${variantSlug}" already exists`;
                                      } else {
                                        errorMsg = 'Duplicate product detected';
                                      }
                                    }

                                    errors.push({
                                      variant: variantName,
                                      error: errorMsg
                                    });
                                  }
                                }

                                // Log final results
                                console.log('Quick Create Results:', {
                                  totalVariants,
                                  successCount: variantIds.length,
                                  errorCount: errors.length,
                                  variantIds,
                                  errors
                                });

                                // Add all variants to configurable product if any were created
                                if (variantIds.length > 0) {
                                  await handleAddVariants(variantIds, attributeValuesMap);
                                }

                                // Show appropriate message based on results
                                if (variantIds.length === 0 && errors.length > 0) {
                                  // All failed
                                  const firstError = errors[0];
                                  setFlashMessage({
                                    type: 'error',
                                    message: `Failed to create variants. ${firstError.error}${errors.length > 1 ? ` (and ${errors.length - 1} more error${errors.length > 1 ? 's' : ''})` : ''}`
                                  });
                                } else if (variantIds.length > 0 && errors.length > 0) {
                                  // Partial success
                                  setFlashMessage({
                                    type: 'success',
                                    message: `Created ${variantIds.length} of ${totalVariants} variants. ${errors.length} failed: ${errors[0].error}`
                                  });
                                } else if (variantIds.length > 0) {
                                  // Full success
                                  const variantNames = variantIds.map((id, idx) => {
                                    const combo = combinations.find((c, i) => {
                                      // Find the combination that matches this successful variant
                                      return Object.keys(attributeValuesMap).includes(id.toString());
                                    });
                                    return Object.entries(attributeValuesMap[id])
                                      .map(([key, val]) => val)
                                      .join(' / ');
                                  }).join(', ');

                                  setFlashMessage({
                                    type: 'success',
                                    message: `Successfully created ${variantIds.length} variant${variantIds.length !== 1 ? 's' : ''}`
                                  });
                                } else {
                                  // No variants created, no specific errors (shouldn't happen)
                                  setFlashMessage({
                                    type: 'error',
                                    message: 'No variants were created. Please try again.'
                                  });
                                }

                                // Don't close the card - keep it open so user can see the message
                                // Just reset selected values so they can create more if needed
                                setSelectedAttributeValues({});

                                // Refresh variants list
                                await loadProductVariants();
                              } catch (error) {
                                // This catch is for unexpected errors (like network issues, loadProductVariants failure, etc.)
                                console.error('Unexpected Quick Create error:', error);
                                setFlashMessage({
                                  type: 'error',
                                  message: `Unexpected error: ${error.message || 'Failed to complete operation. Please try again.'}`
                                });
                              } finally{
                                setQuickCreateLoading(false);
                              }
                            }}
                            disabled={quickCreateLoading}
                          >
                            {quickCreateLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Variants...
                              </>
                            ) : (
                              'Create Variants'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Inline Variant Selector */}
                    {showVariantSelector && (
                      <div className="border rounded-lg p-4 bg-green-50 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Add Existing Products as Variants</h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowVariantSelector(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <Input
                          placeholder="Search by name or SKU..."
                          onChange={(e) => {
                            const term = e.target.value.toLowerCase();
                            if (term) {
                              const filtered = availableVariants.filter(v =>
                                v.name.toLowerCase().includes(term) || v.sku.toLowerCase().includes(term)
                              );
                              // Handle filtered list
                            }
                          }}
                        />

                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {availableVariants.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                              No available products. All simple products may already be assigned.
                            </p>
                          ) : (
                            availableVariants.slice(0, 10).map(variant => (
                              <div key={variant.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                <img
                                  src={variant.images?.[0]?.url || 'https://placehold.co/50x50?text=No+Image'}
                                  alt={variant.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{variant.name}</p>
                                  <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={async () => {
                                    await handleAddVariants([variant.id], {});
                                    toast.success('Variant added');
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        {availableVariants.length > 10 && (
                          <p className="text-xs text-gray-500 text-center">
                            Showing first 10 of {availableVariants.length} products. Use search to find more.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="settings">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Settings</span>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="seo">
            <AccordionTrigger>
              <span className="text-lg font-semibold">SEO</span>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
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
