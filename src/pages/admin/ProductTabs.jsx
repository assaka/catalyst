
import React, { useState, useEffect } from "react";
import { ProductTab } from "@/api/entities";
import { Store } from "@/api/entities";
import { Attribute } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { User } from "@/api/entities"; // Import User entity
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import FlashMessage from "@/components/storefront/FlashMessage";
import ProductTabForm from "@/components/admin/products/ProductTabForm";

export default function ProductTabs() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [tabs, setTabs] = useState([]); // Renamed from productTabs
  const [attributes, setAttributes] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [store, setStore] = useState(null); // Holds the single active store for the user
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTab, setEditingTab] = useState(null); // Renamed from selectedTab
  const [showForm, setShowForm] = useState(false); // Renamed from showTabForm
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      loadData();
    }
  }, [selectedStore]);

  // Cache clearing utility function
  const clearProductTabsCache = () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      // Clear the specific cache entry for product tabs
      const cacheKey = `product-tabs-${storeId}`;

      // Get existing cache
      const cached = localStorage.getItem('storeProviderCache');
      if (cached) {
        try {
          const cacheObj = JSON.parse(cached);
          // Remove the product tabs cache entry
          delete cacheObj[cacheKey];
          // Save back to localStorage
          localStorage.setItem('storeProviderCache', JSON.stringify(cacheObj));
          console.log('🧹 Cleared product tabs cache for store:', storeId);
        } catch (parseError) {
          // If parsing fails, clear entire cache as fallback
          localStorage.removeItem('storeProviderCache');
          console.log('🧹 Cleared entire storefront cache due to parse error');
        }
      }
    } catch (error) {
      console.error('Failed to clear product tabs cache:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const storeId = getSelectedStoreId();
      console.log('🏪 Admin ProductTabs: Loading data for store:', storeId);
      if (!storeId) {
        console.warn("No store selected");
        setLoading(false);
        return;
      }

      setStore(selectedStore);

      // Filter all data by current store's ID
      const [tabsData, attributesData, setsData] = await Promise.all([
        // Assuming ProductTab.filter can take a sort parameter as the second argument
        ProductTab.filter({ store_id: storeId }, "sort_order"),
        Attribute.filter({ store_id: storeId }),
        AttributeSet.filter({ store_id: storeId })
      ]);

      console.log('📋 Admin ProductTabs: Loaded tabs data:', tabsData);
      console.log('📋 Admin ProductTabs: Tabs count:', tabsData?.length || 0);

      setTabs(tabsData || []);
      setAttributes(attributesData || []);
      setAttributeSets(setsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setTabs([]);
      setAttributes([]);
      setAttributeSets([]);
      setStore(null);
      setFlashMessage({ type: 'error', message: "Failed to load data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Combined create and update into a single handleSubmit function
  const handleSubmit = async (tabData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      setFlashMessage({ type: 'error', message: 'Operation failed: No store selected.' });
      return;
    }

    try {
      if (editingTab) {
        // When editing, tabData will already contain the ID from the form
        const { id, ...updateData } = tabData;
        await ProductTab.update(id, { ...updateData, store_id: storeId });
        setFlashMessage({ type: 'success', message: 'Product tab updated successfully!' });
      } else {
        await ProductTab.create({ ...tabData, store_id: storeId });
        setFlashMessage({ type: 'success', message: 'Product tab created successfully!' });
      }

      await loadData(); // Reload data to reflect changes
      clearProductTabsCache(); // Clear frontend cache so storefront shows changes immediately
      setShowForm(false);
      setEditingTab(null);
    } catch (error) {
      console.error("Error submitting tab:", error);
      setFlashMessage({ type: 'error', message: `Failed to ${editingTab ? 'update' : 'create'} product tab` });
    }
  };

  const handleDeleteTab = async (tabId) => {
    if (window.confirm("Are you sure you want to delete this product tab?")) {
      try {
        await ProductTab.delete(tabId);
        await loadData(); // Reload data after deletion
        clearProductTabsCache(); // Clear frontend cache so storefront shows changes immediately
        setFlashMessage({ type: 'success', message: 'Product tab deleted successfully!' });
      } catch (error) {
        console.error("Error deleting tab:", error);
        setFlashMessage({ type: 'error', message: 'Failed to delete product tab' });
      }
    }
  };

  const handleToggleStatus = async (tab) => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        setFlashMessage({ type: 'error', message: 'Operation failed: No store selected.' });
        return;
      }
      // Ensure store_id is always included for data isolation
      await ProductTab.update(tab.id, {
        ...tab,
        is_active: !tab.is_active,
        store_id: storeId // Explicitly include store_id in the update payload
      });
      await loadData(); // Reload data after status change
      clearProductTabsCache(); // Clear frontend cache so storefront shows changes immediately
      setFlashMessage({
        type: 'success',
        message: `Product tab ${tab.is_active ? 'deactivated' : 'activated'} successfully!`
      });
    } catch (error) {
      console.error("Error updating tab status:", error);
      setFlashMessage({ type: 'error', message: 'Failed to update tab status' });
    }
  };

  // Filter tabs based on search query (using the new 'tabs' state)
  const filteredTabs = tabs.filter(tab =>
    (tab.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Display a message if no store is found for the user
  if (!store && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Tabs</h1>
          <p className="text-lg text-gray-700">
            It looks like there's no store associated with your account.
          </p>
          <p className="text-gray-600 mt-2">
            To manage product tabs, you must have an active store. Please ensure you have created one or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Tabs</h1>
            <p className="text-gray-600 mt-1">Configure product detail page tabs</p>
          </div>
          <Button
            onClick={() => {
              setEditingTab(null); // Set editingTab to null for new tab creation
              setShowForm(true); // Open the form dialog
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product Tab
          </Button>
        </div>

        {/* Search */}
        <Card className="material-elevation-1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search product tabs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            console.log('🎨 Rendering tabs grid. filteredTabs:', filteredTabs);
            return filteredTabs.map((tab) => {
              console.log('🎨 Rendering individual tab:', tab);
              return (
            <Card key={tab.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tab.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {tab.tab_type === 'text' && 'Text Content'}
                        {tab.tab_type === 'description' && 'Product Description'}
                        {tab.tab_type === 'attributes' && 'Specific Attributes'}
                        {tab.tab_type === 'attribute_sets' && 'Attribute Sets'}
                        {!tab.tab_type && 'Text Content'}
                      </p>
                      <p className="text-sm text-gray-400">Sort Order: {tab.sort_order || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(tab)}
                    >
                      {tab.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTab(tab); // Set editingTab to the current tab for editing
                        setShowForm(true); // Open the form dialog
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTab(tab.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tab.tab_type === 'text' && tab.content && (
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {tab.content}
                      </p>
                    </div>
                  )}

                  {tab.tab_type === 'description' && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-blue-700">
                        Displays product description automatically
                      </p>
                    </div>
                  )}

                  {tab.tab_type === 'attributes' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Selected Attributes:</p>
                      {tab.attribute_ids && tab.attribute_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tab.attribute_ids.slice(0, 3).map((attrId, idx) => {
                            const attr = attributes.find(a => a.id === attrId);
                            return (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {attr?.name || `Attr ${attrId.slice(0, 8)}`}
                              </Badge>
                            );
                          })}
                          {tab.attribute_ids.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tab.attribute_ids.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No attributes selected</p>
                      )}
                    </div>
                  )}

                  {tab.tab_type === 'attribute_sets' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Selected Attribute Sets:</p>
                      {tab.attribute_set_ids && tab.attribute_set_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tab.attribute_set_ids.slice(0, 2).map((setId, idx) => {
                            const attrSet = attributeSets.find(s => s.id === setId);
                            return (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {attrSet?.name || `Set ${setId.slice(0, 8)}`}
                              </Badge>
                            );
                          })}
                          {tab.attribute_set_ids.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tab.attribute_set_ids.length - 2} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No attribute sets selected</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge variant={tab.is_active ? "default" : "secondary"}>
                      {tab.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      Order: {tab.sort_order || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
              );
            });
          })()}
        </div>

        {filteredTabs.length === 0 && (
          <Card className="material-elevation-1 border-0">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No product tabs found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Start by creating your first product tab"}
              </p>
              <Button
                onClick={() => {
                  setEditingTab(null); // Ensure null for new tab
                  setShowForm(true); // Open the form
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product Tab
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTab ? 'Edit Product Tab' : 'Add New Product Tab'}
              </DialogTitle>
            </DialogHeader>
            <ProductTabForm
              tab={editingTab} // Pass the tab being edited (or null for new)
              attributes={attributes}
              attributeSets={attributeSets}
              onSubmit={handleSubmit} // Use the combined handleSubmit function
              onCancel={() => {
                setShowForm(false); // Close the form
                setEditingTab(null); // Clear editingTab state
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
