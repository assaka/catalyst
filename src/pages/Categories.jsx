
import React, { useState, useEffect } from "react";
import { Category } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import { clearCategoriesCache } from "@/utils/cacheUtils";
import { 
  Tag, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Folder,
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
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import CategoryForm from "../components/categories/CategoryForm";

export default function Categories() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (selectedStore) {
      loadCategories();
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadCategories();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);

  const loadCategories = async (page = currentPage) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const filters = { 
        store_id: storeId, 
        order_by: "sort_order"
      };
      
      // Add search filter if present
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      const result = await Category.findPaginated(page, itemsPerPage, filters);
      
      setCategories(result.data || []);
      setTotalItems(result.pagination.total);
      setTotalPages(result.pagination.total_pages);
      setCurrentPage(result.pagination.current_page);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      await Category.create({ ...categoryData, store_id: storeId });
      await loadCategories();
      setShowCategoryForm(false);
      // Clear storefront cache for instant updates
      clearCategoriesCache(storeId);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    const storeId = getSelectedStoreId();
    try {
      await Category.update(selectedCategory.id, categoryData);
      await loadCategories(); // Updated function name
      setShowCategoryForm(false);
      setSelectedCategory(null);
      // Clear storefront cache for instant updates
      clearCategoriesCache(storeId);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await Category.delete(categoryId);
        await loadCategories(); // Updated function name
        // Clear storefront cache for instant updates
        const storeId = getSelectedStoreId();
        if (storeId) clearCategoriesCache(storeId);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await Category.update(category.id, { 
        ...category, 
        is_active: !category.is_active 
      });
      await loadCategories(); // Updated function name
      // Clear storefront cache for instant updates
      const storeId = getSelectedStoreId();
      if (storeId) clearCategoriesCache(storeId);
    } catch (error) {
      console.error("Error updating category status:", error);
    }
  };

  const handleToggleMenuVisibility = async (category) => {
    try {
      await Category.update(category.id, { 
        ...category, 
        hide_in_menu: !category.hide_in_menu 
      });
      await loadCategories(); // Updated function name
      // Clear storefront cache for instant updates
      const storeId = getSelectedStoreId();
      if (storeId) clearCategoriesCache(storeId);
    } catch (error) {
      console.error("Error updating category visibility:", error);
    }
  };

  // Server-side filtering, so use categories directly
  const paginatedCategories = categories;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Reset to first page and reload data when search changes
  useEffect(() => {
    if (selectedStore) {
      loadCategories(1); // Always load first page when search changes
    }
  }, [searchQuery]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCategories(page);
  };

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
      <div className="flex items-center justify-center space-x-2 mt-8">
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
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Determine if adding a category is possible (i.e., a store is assigned to the user)
  const canAddCategory = !!selectedStore;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Organize your product categories</p>
            {selectedStore && (
              <p className="text-sm text-gray-500 mt-1">
                Currently managing categories for store: <span className="font-semibold">{selectedStore.name}</span>
              </p>
            )}
            {!selectedStore && !loading && (
              <p className="text-sm text-red-500 mt-1">
                No store found for your account. Please set up a store to add categories.
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
            disabled={!selectedStore}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <Card className="material-elevation-1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!canAddCategory && filteredCategories.length === 0} // Disable search if no store and no categories
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {totalItems > 0 && (
                <>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} categories</>
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
            {paginatedCategories.map((category) => (
            <Card key={category.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {category.hide_in_menu ? (
                        <Folder className="w-6 h-6 text-white" />
                      ) : (
                        <FolderOpen className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-500">/{category.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(category)}
                      >
                        {category.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleMenuVisibility(category)}
                      >
                        {category.hide_in_menu ? (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show in Menu
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide from Menu
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {category.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {category.hide_in_menu && (
                    <Badge variant="outline">Hidden from Menu</Badge>
                  )}
                  <Badge variant="outline">
                    Order: {category.sort_order || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {renderPagination(currentPage, totalPages, handlePageChange)}
        </div>

        {categories.length === 0 && !loading && (
          <Card className="material-elevation-1 border-0">
            <CardContent className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : "Start by creating your first product category"}
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                disabled={!selectedStore}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Category Form Dialog */}
        <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <CategoryForm
                category={selectedCategory}
                onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setSelectedCategory(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
