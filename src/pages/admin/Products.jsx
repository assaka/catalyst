
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Tax } from "@/api/entities";
import { Attribute } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import { getPrimaryImageUrl } from "@/utils/imageUtils";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  CheckSquare,
  Square,
  Settings,
  Tag,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import ProductForm from "@/components/admin/products/ProductForm";
import ProductFilters from "@/components/admin/products/ProductFilters";
import { getCategoryName as getTranslatedCategoryName, getProductName, getProductShortDescription } from "@/utils/translationUtils";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`ProductsPage: Rate limit hit, retrying in ${delayTime.toFixed(0)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function Products() {
  const navigate = useNavigate();
  const { selectedStore, getSelectedStoreId, availableStores } = useStoreSelection();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priceRange: "all"
  });
  
  // Bulk action states
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  useEffect(() => {
    document.title = "Products - Admin Dashboard";
    if (selectedStore) {
      console.log('🚀 Products: useEffect triggered, loading data...');
      loadData();
    } else {
      console.log('⚠️ Products: No selected store, skipping data load');
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadData();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);

  const loadData = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Products: Starting data load for store:', storeId);

      // Build filters for products API - load products using admin API
      const productFilters = { 
        store_id: storeId, 
        order_by: "-created_date",
        _t: Date.now() // Cache-busting timestamp
      };

      console.log('📋 Products: Using filters:', productFilters);

      // First, load other data and get initial product batch
      console.log('🚀 Products: Loading initial data...');
      
      const [firstProductBatch, categoriesData, taxesData, attributesData, attributeSetsData] = await Promise.all([
        retryApiCall(() => {
          console.log('📦 Loading all products at once...');
          return Product.findPaginated(1, 10000, productFilters);
        }).catch((error) => {
          console.error('❌ Product.findPaginated failed:', error);
          return { data: [], pagination: { total: 0, total_pages: 0, current_page: 1 } };
        }),
        retryApiCall(() => Category.findAll({ store_id: storeId, limit: 1000 })).catch((error) => {
          console.error('❌ Category.findAll failed:', error);
          return [];
        }),
        retryApiCall(() => Tax.filter({ store_id: storeId, limit: 1000 })).catch((error) => {
          console.error('❌ Tax.filter failed:', error);
          return [];
        }),
        retryApiCall(() => Attribute.filter({ store_id: storeId, limit: 1000 })).catch((error) => {
          console.error('❌ Attribute.filter failed:', error);
          return [];
        }),
        retryApiCall(() => AttributeSet.filter({ store_id: storeId, limit: 1000 })).catch((error) => {
          console.error('❌ AttributeSet.filter failed:', error);
          return [];
        })
      ]);

      console.log('✅ Products: Initial data loaded');
      console.log('📦 First batch:', firstProductBatch.data?.length || 0, 'products');

      // Set other data immediately
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTaxes(Array.isArray(taxesData) ? taxesData : []);
      setAttributes(Array.isArray(attributesData) ? attributesData : []);
      setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);

      // Collect all products
      let allProducts = Array.isArray(firstProductBatch.data) ? [...firstProductBatch.data] : [];
      const totalProductsInStore = firstProductBatch.pagination?.total || 0;
      const totalPages = firstProductBatch.pagination?.total_pages || 1;
      
      console.log('📊 Total products in store:', totalProductsInStore);
      console.log('📄 Total pages:', totalPages);

      // Check if we need to load more products (should be rare with limit 10000)
      if (totalPages > 1) {
        console.log('🔄 Loading remaining products in batches...');
        console.log('⚠️  Warning: Store has more than 10,000 products, loading in batches');
        
        // Load pages 2 onwards in smaller batches to avoid timeout
        const batchSize = 2; // Load 2 pages at a time to avoid timeout with large datasets
        
        for (let page = 2; page <= totalPages; page += batchSize) {
          const pagesToLoad = [];
          const endPage = Math.min(page + batchSize - 1, totalPages);
          
          console.log(`📦 Loading pages ${page} to ${endPage}...`);
          
          // Create promises for this batch
          for (let p = page; p <= endPage; p++) {
            pagesToLoad.push(
              retryApiCall(() => Product.findPaginated(p, 10000, productFilters))
                .catch((error) => {
                  console.error(`❌ Failed to load page ${p}:`, error);
                  return { data: [] };
                })
            );
          }
          
          // Load this batch of pages
          const batchResults = await Promise.all(pagesToLoad);
          
          // Add products from each page
          for (const result of batchResults) {
            if (result.data && Array.isArray(result.data)) {
              allProducts = [...allProducts, ...result.data];
            }
          }
          
          console.log(`✅ Batch complete. Total products loaded: ${allProducts.length}`);
          
          // Update UI with current progress - force re-render
          setProducts([...allProducts]); // Create new array to force React re-render
          setTotalItems(totalProductsInStore);
          setTotalPages(Math.ceil(allProducts.length / itemsPerPage));
          
          // Small delay to ensure UI updates properly
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        console.log('✅ All products loaded in single request');
      }
      
      console.log('✅ All products loaded:', allProducts.length, 'products');
      
      // Final state update - ensure fresh array reference
      setProducts([...allProducts]); // Force React re-render with new array reference
      setTotalItems(totalProductsInStore);
      setTotalPages(Math.ceil(allProducts.length / itemsPerPage));
      setCurrentPage(1);

      console.log('✅ Products: Data loading completed successfully');

    } catch (error) {
      console.error("❌ Products: Error loading data:", error);
      console.error("❌ Error details:", error.message, error.stack);
      setProducts([]);
      setCategories([]);
      setTaxes([]);
      setAttributes([]);
      setAttributeSets([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      console.log('🏁 Products: Setting loading to false');
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    // Debug: Log what we're receiving from ProductForm
    console.log('🔍 Products.jsx handleCreateProduct: Received productData:', {
      name: productData.name,
      translations: productData.translations
    });

    try {
      const result = await Product.create({ ...productData, store_id: storeId });
      console.log('✅ Product.create result:', result);
      await loadData();
      setShowProductForm(false);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const { id, ...updateData } = productData;

      // Debug: Log what we're updating
      console.log('🔍 Products.jsx handleUpdateProduct: Updating product:', {
        id,
        name: updateData.name,
        translations: updateData.translations
      });

      const result = await Product.update(id, updateData);
      console.log('✅ Product.update result:', result);
      await loadData();
      setShowProductForm(false);
      setSelectedProduct(null);

    } catch (error) {
      console.error("Error updating product:", error);
      await loadData();
      throw error;
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await Product.delete(productId);
        await loadData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  // Bulk action handlers
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(paginatedProducts.map(p => p.id));
      setSelectedProducts(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    const count = selectedProducts.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected product${count > 1 ? 's' : ''}?`)) {
      try {
        const deletePromises = Array.from(selectedProducts).map(id => Product.delete(id));
        await Promise.all(deletePromises);
        setSelectedProducts(new Set());
        setShowBulkActions(false);
        await loadData();
      } catch (error) {
        console.error("Error deleting products:", error);
      }
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedProducts.size === 0) return;
    
    // Prevent double execution
    if (bulkActionInProgress) {
      console.log('⚠️ Bulk action already in progress, skipping');
      return;
    }
    
    setBulkActionInProgress(true);
    console.log('🔄 Starting bulk status change to:', newStatus);
    console.log('📋 Selected products:', Array.from(selectedProducts));
    console.log('🔍 Current filters before change:', filters);
    
    try {
      const updatePromises = Array.from(selectedProducts).map(id => {
        // Find product in full products array, not just paginated/filtered ones
        const product = products.find(p => p.id === id);
        if (!product) {
          console.warn(`❌ Product with id ${id} not found in products array`);
          return Promise.resolve();
        }
        console.log(`📝 Updating product "${product.name}" (${product.sku}) from "${product.status}" to "${newStatus}"`);
        return Product.update(id, { status: newStatus })
          .then(result => {
            console.log(`✅ Successfully updated product ${id} to ${newStatus}`);
            console.log('📋 API Response:', JSON.stringify(result, null, 2));
            return result;
          })
          .catch(error => {
            console.error(`❌ Failed to update product ${id}:`, error);
            throw error;
          });
      });
      
      await Promise.all(updatePromises);
      console.log('✅ All product updates completed');
      
      // Verify updates by fetching the specific products that were updated
      console.log('🔍 Verifying updates by fetching updated products...');
      for (const id of selectedProducts) {
        try {
          const updatedProduct = await Product.findById(id);
          console.log(`📋 Product ${id} current status in database:`, updatedProduct?.status || 'NOT FOUND');
        } catch (error) {
          console.error(`❌ Failed to verify product ${id}:`, error);
        }
      }
      
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      
      // Temporarily removing filter reset to debug backend update issue
      console.log('🔄 NOT resetting filters to debug backend update issue');
      
      console.log('🔄 Reloading data...');
      await loadData();
      console.log('✅ Data reload completed');
    } catch (error) {
      console.error("❌ Error updating product statuses:", error);
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkCategoryChange = async (categoryId) => {
    if (selectedProducts.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedProducts).map(id => {
        const product = paginatedProducts.find(p => p.id === id);
        const newCategories = categoryId ? [categoryId] : [];
        return Product.update(id, { ...product, category_ids: newCategories });
      });
      await Promise.all(updatePromises);
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      await loadData();
    } catch (error) {
      console.error("Error updating product categories:", error);
    }
  };

  const handleBulkAttributeSetChange = async (attributeSetId) => {
    if (selectedProducts.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedProducts).map(id => {
        const product = paginatedProducts.find(p => p.id === id);
        return Product.update(id, { ...product, attribute_set_id: attributeSetId });
      });
      await Promise.all(updatePromises);
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      await loadData();
    } catch (error) {
      console.error("Error updating product attribute sets:", error);
    }
  };

  const handleStatusChange = async (product, newStatus) => {
    try {
      await Product.update(product.id, { status: newStatus });
      
      // Reset status filter to "all" to show updated product regardless of its new status
      setFilters(prev => ({ ...prev, status: "all" }));
      
      await loadData();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  // Client-side filtering for search and filters (all data is loaded)
  const filteredProducts = products.filter(product => {
    // Search filter - use translation utilities
    const productName = getProductName(product);
    const productShortDesc = getProductShortDescription(product);
    const matchesSearch = !searchQuery.trim() ||
      productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productShortDesc?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = filters.status === "all" || product.status === filters.status;
    
    // Category filter
    const matchesCategory = filters.category === "all" || 
      (product.category_ids && product.category_ids.includes(filters.category));
    
    // Price range filter
    let matchesPriceRange = true;
    if (filters.priceRange !== "all") {
      const price = parseFloat(product.price || 0);
      switch (filters.priceRange) {
        case "under50":
          matchesPriceRange = price < 50;
          break;
        case "50-200":
          matchesPriceRange = price >= 50 && price <= 200;
          break;
        case "over200":
          matchesPriceRange = price > 200;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriceRange;
  });

  // Debug logging for filtering
  const statusBreakdown = products.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  
  const filteredStatusBreakdown = filteredProducts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('🔍 Products filtering debug:');
  console.log('  📊 Total products:', products.length);
  console.log('  📊 Filtered products:', filteredProducts.length);
  console.log('  🔍 Search query:', searchQuery);
  console.log('  🔍 Filters:', filters);
  console.log('  📋 Status breakdown (all):', statusBreakdown);
  console.log('  📋 Status breakdown (filtered):', filteredStatusBreakdown);

  // Client-side pagination for display
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  
  // Calculate pagination based on filtered results
  const calculatedTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Memoized calculations for bulk actions
  const isAllSelected = useMemo(() => {
    return paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length;
  }, [selectedProducts, paginatedProducts]);
  
  const isPartiallySelected = useMemo(() => {
    return selectedProducts.size > 0 && selectedProducts.size < paginatedProducts.length;
  }, [selectedProducts, paginatedProducts]);

  // Handle page changes (client-side only)
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Enhanced pagination component
  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const pages = [];
      
      // Always show previous page if exists
      if (currentPage > 1) {
        pages.push(currentPage - 1);
      }
      
      // Always show current page (non-clickable, highlighted)
      pages.push(currentPage);
      
      // Show next 3 pages if they exist
      for (let i = 1; i <= 3 && currentPage + i <= totalPages; i++) {
        pages.push(currentPage + i);
      }
      
      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
        </p>
        
        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {/* Page Numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={currentPage === page ? undefined : () => onPageChange(page)}
              disabled={currentPage === page}
              className={currentPage === page ? "bg-blue-600 text-white cursor-default" : ""}
            >
              {page}
            </Button>
          ))}

          {/* Show ellipsis and last page if there are more pages */}
          {currentPage + 3 < totalPages && (
            <>
              <span className="px-2 text-gray-500">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>

          {/* Page Dropdown */}
          <div className="ml-4">
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => onPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder={currentPage} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Info */}
          <span className="ml-4 text-sm text-gray-600">
            of {totalPages} pages
          </span>
        </div>
      </div>
    );
  };

  const getCategoryName = (categoryIds) => {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return "Uncategorized";
    }

    const category = categories.find(cat => cat && categoryIds.includes(cat.id));
    return category ? getTranslatedCategoryName(category) : "Uncategorized";
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
            disabled={!selectedStore}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          </div>
        </div>

        <Card className="material-elevation-1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ProductFilters
                filters={filters}
                setFilters={setFilters}
                categories={categories}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1 border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Products ({filteredProducts.length})</span>
              {(searchQuery || Object.values(filters).some(f => f !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ status: "all", category: "all", priceRange: "all" });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedProducts.length > 0 ? (
              <>
                {/* Bulk Actions Bar */}
                {showBulkActions && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-800">
                          {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Change Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                              <Edit className="w-4 h-4 mr-2" />
                              Set as Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FolderOpen className="w-4 h-4 mr-2" />
                              Move to Category
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleBulkCategoryChange(null)}>
                              Remove from categories
                            </DropdownMenuItem>
                            {categories.map((category) => (
                              <DropdownMenuItem
                                key={category.id}
                                onClick={() => handleBulkCategoryChange(category.id)}
                              >
                                <Tag className="w-4 h-4 mr-2" />
                                {getTranslatedCategoryName(category)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4 mr-2" />
                              Change Attribute Set
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {attributeSets.map((attributeSet) => (
                              <DropdownMenuItem 
                                key={attributeSet.id} 
                                onClick={() => handleBulkAttributeSetChange(attributeSet.id)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                {attributeSet.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedProducts(new Set());
                            setShowBulkActions(false);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-12">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {isAllSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : isPartiallySelected ? (
                              <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleSelectProduct(product.id)}
                              className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {selectedProducts.has(product.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={getPrimaryImageUrl(product.images)}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      // Hide broken image and show icon instead
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{getProductName(product)}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {getProductShortDescription(product)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900">${product.price}</span>
                            {product.compare_price && (
                              <span className="block text-sm text-green-600">
                                Sale: ${product.compare_price}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`font-medium ${
                              product.stock_quantity < 10 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={statusColors[product.status]}>
                              {product.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Get store info - try selectedStore first, then find from availableStores
                                      let storeInfo = selectedStore;
                                      
                                      // If selectedStore doesn't have slug, try to find the full store data
                                      if (!storeInfo?.slug && product.store_id) {
                                        storeInfo = availableStores?.find(s => s.id === product.store_id);
                                      }
                                      
                                      // If still no store info, try using the first available store
                                      if (!storeInfo?.slug && availableStores?.length > 0) {
                                        storeInfo = availableStores[0];
                                      }
                                      
                                      const storeCode = storeInfo?.slug;
                                      const productSlug = product.seo?.url_key || product.slug || product.id;
                                      
                                      if (storeCode && productSlug) {
                                        // Open in new tab to view the storefront product page
                                        const url = `/public/${storeCode}/product/${productSlug}`;
                                        window.open(url, '_blank');
                                      } else {
                                        console.error('Missing store slug or product slug:', { 
                                          storeSlug: storeCode, 
                                          productSlug
                                        });
                                      }
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setShowProductForm(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {product.status === 'active' ? (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(product, 'inactive')}
                                    >
                                      <EyeOff className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(product, 'active')}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {renderPagination(currentPage, calculatedTotalPages, handlePageChange)}
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || Object.values(filters).some(f => f !== "all")
                    ? "Try adjusting your search terms or filters"
                    : "Start by adding your first product to your catalog"}
                </p>
                <Button
                  onClick={() => {
                    setSelectedProduct(null);
                    setShowProductForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                  disabled={!selectedStore}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={selectedProduct}
              categories={categories}
              stores={[]}
              taxes={taxes}
              attributes={attributes.filter(attr => attr.type !== 'image')}
              attributeSets={attributeSets}
              onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
              onCancel={() => {
                setShowProductForm(false);
                setSelectedProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
