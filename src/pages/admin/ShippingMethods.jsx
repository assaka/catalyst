import React, { useState, useEffect } from "react";
import { ShippingMethod } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import FlashMessage from "@/components/storefront/FlashMessage";
import {
  Truck,
  Plus,
  Search,
  ChevronDown,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import ShippingMethodForm from "@/components/admin/shipping/ShippingMethodForm";

const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
};


export default function ShippingMethodsPage() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  // Local state for store settings to avoid reload on changes
  const [localStoreSettings, setLocalStoreSettings] = useState(selectedStore?.settings || {});

  // Local formatPrice helper that uses selectedStore's currency
  const formatPrice = (value, decimals = 2) => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    const symbol = selectedStore?.currency_symbol || selectedStore?.settings?.currency_symbol || '$';
    return `${symbol}${num.toFixed(decimals)}`;
  };

  useEffect(() => {
    if (selectedStore) {
      loadData();
      // Sync local settings with context when store changes
      setLocalStoreSettings(selectedStore.settings || {});
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
      console.warn("ShippingMethodsPage: No store selected.");
      setMethods([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const shippingMethods = await retryApiCall(() => ShippingMethod.filter({ store_id: storeId }, "-created_date"));
      setMethods(Array.isArray(shippingMethods) ? shippingMethods : []);
    } catch (error) {
      console.error("Error loading shipping methods data:", error);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (key, value) => {
        if (!selectedStore) {
            console.warn("No store selected to update settings.");
            return;
        }

        // Create a deep copy of the settings object
        const newSettings = { ...localStoreSettings };
        newSettings[key] = value;

        // Update local state immediately for instant UI feedback
        setLocalStoreSettings(newSettings);

        try {
            const { Store } = await import("@/api/entities");
            await Store.update(selectedStore.id, { settings: newSettings });

            // Clear any potential cache
            try {
                localStorage.removeItem('storeProviderCache');
                sessionStorage.removeItem('storeProviderCache');
            } catch (e) {
                console.warn('Failed to clear cache:', e);
            }

            setFlashMessage({ type: 'success', message: 'Shipping settings saved successfully!' });
        } catch (error) {
            // Revert local state on error
            setLocalStoreSettings(selectedStore.settings || {});
            console.error("Failed to update setting:", error);
            setFlashMessage({ type: 'error', message: 'Failed to update shipping settings.' });
        }
    };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedMethod) {
        await ShippingMethod.update(selectedMethod.id, formData);
        setFlashMessage({ type: 'success', message: 'Shipping method updated successfully!' });
      } else {
        await ShippingMethod.create(formData);
        setFlashMessage({ type: 'success', message: 'Shipping method created successfully!' });
      }
      
      setShowForm(false);
      setSelectedMethod(null);
      await loadData();
    } catch (error) {
      console.error('Error saving shipping method:', error);
      setFlashMessage({ type: 'error', message: 'Failed to save shipping method.' });
    }
  };

  const handleEdit = (method) => {
    setSelectedMethod(method);
    setShowForm(true);
  };

  const handleDelete = async (methodId) => {
    if (window.confirm("Are you sure you want to delete this shipping method?")) {
      await ShippingMethod.delete(methodId);
      await loadData();
      setFlashMessage({ type: 'success', message: 'Shipping method deleted.' });
    }
  };

  const filteredMethods = methods.filter((method) =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipping Methods</h1>
            <p className="text-gray-600 mt-1">Manage how you ship orders to your customers.</p>
          </div>
          <Button
            onClick={() => {
              setSelectedMethod(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Shipping Method
          </Button>
        </div>

        <Card className="mb-8 material-elevation-1 border-0">
            <CardHeader>
                <CardTitle>Global Shipping Settings</CardTitle>
                <CardDescription>Settings that apply to all shipping methods.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                        <Label htmlFor="hide_shipping_costs" className="font-medium">Hide Shipping Costs on Storefront</Label>
                        <p className="text-sm text-gray-500">Enable this to hide all shipping costs from customers.</p>
                    </div>
                    <Switch
                        id="hide_shipping_costs"
                        checked={!!localStoreSettings.hide_shipping_costs}
                        onCheckedChange={(c) => handleSettingsChange('hide_shipping_costs', c)}
                        disabled={!selectedStore}
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="material-elevation-1 border-0">
          <CardHeader>
            <CardTitle>Your Shipping Methods</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : filteredMethods.length > 0 ? (
              <div className="space-y-4">
                {filteredMethods.map((method) => (
                  <Card key={method.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Truck className="w-8 h-8 text-gray-500" />
                      <div>
                        <h3 className="font-semibold text-lg">{method.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Badge variant={method.is_active ? "default" : "secondary"}>
                            {method.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span>•</span>
                          <span>
                            {method.type === 'flat_rate' ? `${formatPrice(parseFloat(method.flat_rate_cost || 0))} Flat Rate` :
                             `Free over ${formatPrice(parseFloat(method.free_shipping_min_order || 0))}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ChevronDown className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(method)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(method.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping methods found</h3>
                <p className="text-gray-600">Create your first shipping method to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedMethod ? "Edit Shipping Method" : "Add New Shipping Method"}
              </DialogTitle>
            </DialogHeader>
            <ShippingMethodForm
              storeId={getSelectedStoreId()}
              method={selectedMethod}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}