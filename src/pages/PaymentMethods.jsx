import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CreditCard, Banknote } from "lucide-react";
import FlashMessage from "@/components/storefront/FlashMessage";
import { CountrySelect } from "@/components/ui/country-select";

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    provider: 'manual',
    is_active: true,
    description: '',
    icon_url: '',
    sort_order: 0,
    min_amount: '',
    max_amount: '',
    countries: []
  });

  const quickAddMethods = [
    {
      name: "Stripe (Online Payments)",
      code: "stripe",
      provider: "stripe",
      description: "Accept credit cards, debit cards, and more via Stripe.",
      icon_url: "https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-fed4f31ce.svg"
    },
    {
      name: "Cash on Delivery",
      code: "cod",
      provider: "manual",
      description: "Pay with cash upon delivery.",
      icon_url: ""
    },
    {
      name: "Bank Transfer",
      code: "bank_transfer",
      provider: "manual",
      description: "Pay via a manual bank transfer.",
      icon_url: ""
    }
  ];

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const stores = await Store.filter({ owner_email: user.email });
      
      if (stores && stores.length > 0) {
        const currentStore = stores[0];
        setStore(currentStore);
        const methods = await PaymentMethod.filter({ store_id: currentStore.id }, 'sort_order');
        setPaymentMethods(methods || []);
      } else {
        setPaymentMethods([]);
        setStore(null);
        console.warn("No store found for this user.");
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      setFlashMessage({ type: 'error', message: 'Failed to load payment methods' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!store) {
      setFlashMessage({ type: 'error', message: 'Store not found' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        store_id: store.id,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null
      };

      if (editingMethod) {
        await PaymentMethod.update(editingMethod.id, payload);
        setFlashMessage({ type: 'success', message: 'Payment method updated successfully!' });
      } else {
        await PaymentMethod.create(payload);
        setFlashMessage({ type: 'success', message: 'Payment method created successfully!' });
      }
      
      setShowForm(false);
      setEditingMethod(null);
      resetForm();
      loadPaymentMethods();
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to save payment method' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (method) => {
    setFormData({
      name: method.name,
      code: method.code,
      provider: method.provider,
      is_active: method.is_active,
      description: method.description || '',
      icon_url: method.icon_url || '',
      sort_order: method.sort_order,
      min_amount: method.min_amount || '',
      max_amount: method.max_amount || '',
      countries: method.countries || []
    });
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await PaymentMethod.delete(id);
        setFlashMessage({ type: 'success', message: 'Payment method deleted successfully!' });
        loadPaymentMethods();
      } catch (error) {
        setFlashMessage({ type: 'error', message: 'Failed to delete payment method' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', 
      code: '', 
      provider: 'manual',
      is_active: true, 
      description: '', 
      icon_url: '', 
      sort_order: 0,
      min_amount: '', 
      max_amount: '', 
      countries: []
    });
  };

  const handleQuickAdd = async (method) => {
    try {
      if (!store) {
        setFlashMessage({ type: 'error', message: 'Store not found. Please ensure store data is loaded.' });
        return;
      }

      setSaving(true);
      const payload = {
        ...method,
        store_id: store.id,
        is_active: true,
        sort_order: paymentMethods.length + 1,
        countries: method.countries || []
      };
      await PaymentMethod.create(payload);
      setFlashMessage({ type: 'success', message: `${method.name} payment method added successfully!` });
      loadPaymentMethods();
    } catch (error) {
      setFlashMessage({ type: 'error', message: `Failed to add payment method: ${error.message || 'Unknown error'}` });
      console.error("Error quick adding payment method:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-2">Configure payment options for your customers</p>
        </div>

        <Card className="material-elevation-1 border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Quick Add Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickAddMethods.map(method => (
                <Button
                  key={method.code}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 text-center"
                  onClick={() => handleQuickAdd(method)}
                  disabled={saving || !store}
                >
                  {method.icon_url ? (
                    <img src={method.icon_url} alt={method.name} className="h-8 w-auto object-contain" />
                  ) : (
                    <Banknote className="h-6 w-6 text-gray-600" />
                  )}
                  <span className="text-xs">{method.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Configured Payment Methods</h2>
          <Button
            onClick={() => {
              resetForm();
              setEditingMethod(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!store}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Method
          </Button>
        </div>

        <div className="grid gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id} className="material-elevation-1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {method.icon_url ? (
                        <img src={method.icon_url} alt={method.name} className="w-8 h-8 object-contain" />
                      ) : (
                        method.provider === 'stripe' ? (
                          <CreditCard className="w-6 h-6 text-gray-600" />
                        ) : (
                          <Banknote className="w-6 h-6 text-gray-600" />
                        )
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{method.name}</h3>
                      <p className="text-gray-600">{method.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={method.provider === 'stripe' ? 'default' : 'secondary'}>
                          {method.provider}
                        </Badge>
                        <Badge variant={method.is_active ? 'default' : 'secondary'}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {method.countries && method.countries.length > 0 && (
                          <Badge variant="outline">
                            {method.countries.length} Country{method.countries.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(method.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {paymentMethods.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              No payment methods configured yet. Add one using the buttons above.
            </div>
          )}
          {paymentMethods.length === 0 && !loading && !store && (
            <div className="text-center text-red-500 py-4">
              No store found for your user. Please ensure a store is created to manage payment methods.
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Offline Method</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="icon_url">Icon URL</Label>
                  <Input
                    id="icon_url"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_amount">Min Amount</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      step="0.01"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_amount">Max Amount</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      step="0.01"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Available Countries</Label>
                  <CountrySelect
                    value={formData.countries}
                    onChange={(value) => setFormData({ ...formData, countries: value })}
                    placeholder="Select countries (leave empty for all countries)"
                    multiple={true}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMethod(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : (editingMethod ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}