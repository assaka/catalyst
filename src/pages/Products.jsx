
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Tax } from "@/api/entities";
import { Attribute } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
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
  X
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

import ProductForm from "../components/products/ProductForm";
import ProductFilters from "../components/products/ProductFilters";

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
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
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

  useEffect(() => {
    document.title = "Products - Admin Dashboard";
    if (selectedStore) {
      loadData();
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

  const loadData = async (page = currentPage) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Build filters for products API
      const productFilters = { 
        store_id: storeId, 
        order_by: "-created_date"
      };
      
      // Add search filter if present
      if (searchQuery.trim()) {
        productFilters.search = searchQuery.trim();
      }
      
      // Add status filter
      if (filters.status !== "all") {
        productFilters.status = filters.status;
      }
      
      // Add category filter
      if (filters.category !== "all") {
        productFilters.category_id = filters.category;
      }

      // Load products with pagination and other data without pagination (for form dropdowns)
      const [productsResult, categoriesData, taxesData, attributesData, attributeSetsData] = await Promise.all([
        retryApiCall(() => Product.findPaginated(page, itemsPerPage, productFilters)).catch(() => ({ data: [], pagination: { total: 0, total_pages: 0, current_page: page } })),
        retryApiCall(() => Category.filter({ store_id: storeId, limit: 1000 })).catch(() => []),
        retryApiCall(() => Tax.filter({ store_id: storeId, limit: 1000 })).catch(() => []),
        retryApiCall(() => Attribute.filter({ store_id: storeId, limit: 1000 })).catch(() => []),
        retryApiCall(() => AttributeSet.filter({ store_id: storeId, limit: 1000 })).catch(() => [])
      ]);

      setProducts(Array.isArray(productsResult.data) ? productsResult.data : []);
      setTotalItems(productsResult.pagination.total);
      setTotalPages(productsResult.pagination.total_pages);
      setCurrentPage(productsResult.pagination.current_page);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTaxes(Array.isArray(taxesData) ? taxesData : []);
      setAttributes(Array.isArray(attributesData) ? attributesData : []);
      setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);

    } catch (error) {
      console.error("Error loading data:", error);
      setProducts([]);
      setCategories([]);
      setTaxes([]);
      setAttributes([]);
      setAttributeSets([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      await Product.create({ ...productData, store_id: storeId });
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

      await Product.update(id, updateData);
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

  const handleStatusChange = async (product, newStatus) => {
    try {
      await Product.update(product.id, { ...product, status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  // Server-side filtering, so use products directly
  const paginatedProducts = products;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadData(page);
  };

  // Reset to first page and reload data when search or filters change
  useEffect(() => {
    if (selectedStore) {
      loadData(1); // Always load first page when search/filters change
    }
  }, [searchQuery, filters]);

  const getCategoryName = (categoryIds) => {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return "Uncategorized";
    }
    
    const category = categories.find(cat => cat && categoryIds.includes(cat.id));
    return category ? category.name : "Uncategorized";
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
              <span>Products ({totalItems})</span>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
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
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {product.short_description}
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
                                    onClick={() => handleStatusChange(product, 'active')}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(product, 'inactive')}
                                  >
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Deactivate
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} products
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || Object.values(filters).some(f => f !== "all")
                    ? "Try adjusting your search or filters"
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
              attributes={attributes}
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
