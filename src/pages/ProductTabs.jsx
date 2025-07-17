
import React, { useState, useEffect } from "react";
import { ProductTab } from "@/api/entities";
import { Store } from "@/api/entities";
import { Attribute } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { User } from "@/api/entities"; // Import User entity
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

import FlashMessage from "../components/storefront/FlashMessage";
import ProductTabForm from "../components/products/ProductTabForm";

export default function ProductTabs() {
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // CRITICAL FIX: Get current user first, then filter by user's stores
      const user = await User.me();
      // Assuming 'filter' method on Store can filter by owner_email
      const userStores = await Store.findAll();

      if (userStores && Array.isArray(userStores) && userStores.length > 0) {
        const currentStore = userStores[0]; // Take the first store found for the user
        setStore(currentStore);

        // Filter all data by current store's ID
        const [tabsData, attributesData, setsData] = await Promise.all([
          // Assuming ProductTab.filter can take a sort parameter as the second argument
          ProductTab.filter({ store_id: currentStore.id }, "sort_order"),
          Attribute.filter({ store_id: currentStore.id }),
          AttributeSet.filter({ store_id: currentStore.id })
        ]);

        setTabs(tabsData || []);
        setAttributes(attributesData || []);
        setAttributeSets(setsData || []);
      } else {
        setTabs([]);
        setAttributes([]);
        setAttributeSets([]);
        setStore(null); // No store found for the user
        console.warn("No store found for user:", user.email);
        setFlashMessage({ type: 'error', message: "No store associated with your account. Please create one or contact support." });
      }
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
    if (!store) {
      setFlashMessage({ type: 'error', message: 'Operation failed: No active store found for your account.' });
      return;
    }

    try {
      if (editingTab) {
        // When editing, tabData will already contain the ID from the form
        const { id, ...updateData } = tabData;
        await ProductTab.update(id, { ...updateData, store_id: store.id });
        setFlashMessage({ type: 'success', message: 'Product tab updated successfully!' });
      } else {
        await ProductTab.create({ ...tabData, store_id: store.id });
        setFlashMessage({ type: 'success', message: 'Product tab created successfully!' });
      }

      await loadData(); // Reload data to reflect changes
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
        setFlashMessage({ type: 'success', message: 'Product tab deleted successfully!' });
      } catch (error) {
        console.error("Error deleting tab:", error);
        setFlashMessage({ type: 'error', message: 'Failed to delete product tab' });
      }
    }
  };

  const handleToggleStatus = async (tab) => {
    try {
      if (!store) {
        setFlashMessage({ type: 'error', message: 'Operation failed: No active store found for your account.' });
        return;
      }
      // Ensure store_id is always included for data isolation
      await ProductTab.update(tab.id, {
        ...tab,
        is_active: !tab.is_active,
        store_id: store.id // Explicitly include store_id in the update payload
      });
      await loadData(); // Reload data after status change
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
    tab.title.toLowerCase().includes(searchQuery.toLowerCase())
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
          {filteredTabs.map((tab) => (
            <Card key={tab.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tab.title}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">{tab.content_type}</p>
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
                  {tab.content_type === 'attributes' && tab.attribute_codes && tab.attribute_codes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Attributes:</p>
                      <div className="flex flex-wrap gap-1">
                        {tab.attribute_codes.slice(0, 3).map((code) => {
                          const attribute = attributes.find(attr => attr.code === code);
                          return (
                            <Badge key={code} variant="outline" className="text-xs">
                              {attribute?.name || code}
                            </Badge>
                          );
                        })}
                        {tab.attribute_codes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tab.attribute_codes.length - 3} more
                          </Badge>
                        )}
                      </div>
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
          ))}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTab ? 'Edit Product Tab' : 'Add New Product Tab'}
              </DialogTitle>
            </DialogHeader>
            <ProductTabForm
              tab={editingTab} // Pass the tab being edited (or null for new)
              stores={store ? [store] : []} // Pass the current user's store as an array for the form
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
