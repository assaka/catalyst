import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import { formatPrice } from "@/utils/priceUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CreditCard, Banknote, CheckCircle, AlertCircle, Languages } from "lucide-react";
import FlashMessage from "@/components/storefront/FlashMessage";
import { CountrySelect } from "@/components/ui/country-select";
import TranslationFields from "@/components/admin/TranslationFields";

export default function PaymentMethods() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [showTranslations, setShowTranslations] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'credit_card',
    is_active: true,
    description: '',
    icon_url: '',
    sort_order: 0,
    min_amount: '',
    max_amount: '',
    fee_type: 'none',
    fee_amount: 0,
    availability: 'all',
    countries: [],
    translations: {}
  });

  const quickAddMethods = [
    {
      name: "Stripe (Online Payments)",
      code: "stripe",
      type: "stripe",
      description: "Accept credit cards, debit cards, and more via Stripe.",
      icon_url: "https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-fed4f31ce.svg"
    },
    {
      name: "Cash on Delivery",
      code: "cod",
      type: "cash_on_delivery",
      description: "Pay with cash upon delivery.",
      icon_url: ""
    },
    {
      name: "Bank Transfer",
      code: "bank_transfer",
      type: "bank_transfer",
      description: "Pay via a manual bank transfer.",
      icon_url: ""
    }
  ];

  useEffect(() => {
    if (selectedStore) {
      loadPaymentMethods();
    }
  }, [selectedStore]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        console.warn("No store selected");
        setLoading(false);
        return;
      }
      
      setStore(selectedStore);
      const methods = await PaymentMethod.filter({ store_id: storeId }, 'sort_order');
      setPaymentMethods(methods || []);
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
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        fee_amount: formData.fee_amount ? parseFloat(formData.fee_amount) : 0
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
    let translations = method.translations || {};
    if (!translations.en) {
      translations.en = {
        name: method.name,
        description: method.description || ''
      };
    }

    setFormData({
      name: method.name,
      code: method.code,
      type: method.type || 'other',
      is_active: method.is_active,
      description: method.description || '',
      icon_url: method.icon_url || '',
      sort_order: method.sort_order,
      min_amount: method.min_amount || '',
      max_amount: method.max_amount || '',
      fee_type: method.fee_type || 'none',
      fee_amount: method.fee_amount || 0,
      availability: method.availability || 'all',
      countries: method.countries || [],
      translations: translations
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
      type: 'credit_card',
      is_active: true, 
      description: '', 
      icon_url: '', 
      sort_order: 0,
      min_amount: '', 
      max_amount: '', 
      fee_type: 'none',
      fee_amount: 0,
      availability: 'all',
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
                        method.type === 'stripe' ? (
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
                        <Badge variant={method.type === 'stripe' ? 'default' : 'secondary'}>
                          {method.type}
                        </Badge>
                        <Badge variant={method.is_active ? 'default' : 'secondary'}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {method.type === 'stripe' && (
                          <Badge 
                            variant={store?.stripe_connect_onboarding_complete ? "default" : "outline"}
                            className={store?.stripe_connect_onboarding_complete ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}
                          >
                            {store?.stripe_connect_onboarding_complete ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
                            ) : (
                              <><AlertCircle className="w-3 h-3 mr-1" /> Not Connected</>
                            )}
                          </Badge>
                        )}
                        {method.fee_type && method.fee_type !== 'none' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {method.fee_type === 'fixed'
                              ? `${formatPrice(method.fee_amount || 0)} fee`
                              : `${method.fee_amount || 0}% fee`
                            }
                          </Badge>
                        )}
                        {method.availability === 'specific_countries' && method.countries && method.countries.length > 0 && (
                          <Badge variant="outline">
                            {method.countries.length} Country{method.countries.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {(method.min_amount || method.max_amount) && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {method.min_amount && method.max_amount
                              ? `${formatPrice(method.min_amount)} - ${formatPrice(method.max_amount)}`
                              : method.min_amount
                                ? `Min ${formatPrice(method.min_amount)}`
                                : `Max ${formatPrice(method.max_amount)}`
                            }
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
                      onChange={(e) => {
                        const newName = e.target.value;
                        setFormData({
                          ...formData,
                          name: newName,
                          translations: {
                            ...formData.translations,
                            en: { ...formData.translations.en, name: newName }
                          }
                        });
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTranslations(!showTranslations)}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                    >
                      <Languages className="w-4 h-4" />
                      {showTranslations ? 'Hide translations' : 'Manage translations'}
                    </button>
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

                {showTranslations && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Languages className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-semibold text-blue-900">Payment Method Translations</h3>
                    </div>
                    <TranslationFields
                      translations={formData.translations}
                      onChange={(newTranslations) => {
                        setFormData({
                          ...formData,
                          translations: newTranslations,
                          name: newTranslations.en?.name || formData.name,
                          description: newTranslations.en?.description || formData.description
                        });
                      }}
                      fields={[
                        { name: 'name', label: 'Payment Method Name', type: 'text', required: true },
                        { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false }
                      ]}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="type">Payment Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!showTranslations && (
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => {
                        const newDescription = e.target.value;
                        setFormData({
                          ...formData,
                          description: newDescription,
                          translations: {
                            ...formData.translations,
                            en: { ...formData.translations.en, description: newDescription }
                          }
                        });
                      }}
                      rows={3}
                    />
                  </div>
                )}

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
                  <Label htmlFor="availability">Availability</Label>
                  <Select 
                    value={formData.availability} 
                    onValueChange={(value) => setFormData({ ...formData, availability: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="specific_countries">Specific Countries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.availability === 'specific_countries' && (
                  <div>
                    <Label>Allowed Countries</Label>
                    <CountrySelect
                      value={formData.countries}
                      onChange={(value) => setFormData({ ...formData, countries: value })}
                      placeholder="Select countries where this payment method is available"
                      multiple={true}
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Fee Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fee_type">Fee Type</Label>
                      <Select 
                        value={formData.fee_type} 
                        onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Fee</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.fee_type !== 'none' && (
                      <div>
                        <Label htmlFor="fee_amount">
                          Fee Amount {formData.fee_type === 'percentage' ? '(%)' : '($)'}
                        </Label>
                        <Input
                          id="fee_amount"
                          type="number"
                          step={formData.fee_type === 'percentage' ? '0.01' : '0.01'}
                          min="0"
                          max={formData.fee_type === 'percentage' ? '100' : undefined}
                          value={formData.fee_amount}
                          onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })}
                          placeholder={formData.fee_type === 'percentage' ? 'e.g., 2.5' : 'e.g., 1.99'}
                        />
                        {formData.fee_type === 'percentage' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Percentage of order total charged as fee
                          </p>
                        )}
                        {formData.fee_type === 'fixed' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Fixed amount charged per transaction
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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