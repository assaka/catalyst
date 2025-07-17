
import React, { useState, useEffect } from "react";
import { Category } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities"; // Added User import
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

import CategoryForm from "../components/categories/CategoryForm";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  // const [stores, setStores] = useState([]); // Removed stores state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [currentStore, setCurrentStore] = useState(null); // Added currentStore state

  useEffect(() => {
    loadCategories(); // Renamed loadData to loadCategories
  }, []);

  const loadCategories = async () => { // Renamed from loadData
    setLoading(true);
    try {
      const user = await User.me(); // Fetch current user
      const stores = await Store.findAll(); // Filter stores by user's email
      if (stores && Array.isArray(stores) && stores.length > 0) { // Added check for stores array
        const store = stores[0]; // Assuming one store per user for this multi-tenancy setup
        setCurrentStore(store);
        // Load categories only for the current store
        const categoriesData = await Category.filter({ store_id: store.id }, "sort_order");
        setCategories(categoriesData || []); // Ensure categoriesData is an array
      } else {
        // No store found for the user, so no categories to display
        setCurrentStore(null);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setCurrentStore(null); // Reset store on error
      setCategories([]); // Reset categories on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      if (currentStore) { // Use currentStore for category assignment
          categoryData.store_id = currentStore.id;
      } else {
          console.error("Cannot create category: No store associated with the user.");
          // Optionally, display a user-friendly error message
          return; // Prevent category creation if no store is set
      }
      
      await Category.create(categoryData);
      await loadCategories(); // Updated function name
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      await Category.update(selectedCategory.id, categoryData);
      await loadCategories(); // Updated function name
      setShowCategoryForm(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await Category.delete(categoryId);
        await loadCategories(); // Updated function name
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
    } catch (error) {
      console.error("Error updating category visibility:", error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || // Added optional chaining
    category?.description?.toLowerCase().includes(searchQuery.toLowerCase()) // Added optional chaining
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Determine if adding a category is possible (i.e., a store is assigned to the user)
  const canAddCategory = !!currentStore;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Organize your product categories</p>
            {currentStore && (
              <p className="text-sm text-gray-500 mt-1">
                Currently managing categories for store: <span className="font-semibold">{currentStore.name}</span>
              </p>
            )}
            {!currentStore && !loading && (
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
            disabled={!canAddCategory} // Disable button if no store
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
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

        {filteredCategories.length === 0 && (
          <Card className="material-elevation-1 border-0">
            <CardContent className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : canAddCategory 
                    ? "Start by creating your first product category"
                    : "You need to set up a store first before adding categories."}
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                disabled={!canAddCategory} // Disable button if no store
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Category Form Dialog */}
        <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              stores={currentStore ? [currentStore] : []} // Passed currentStore as an array
              onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
              onCancel={() => {
                setShowCategoryForm(false);
                setSelectedCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
