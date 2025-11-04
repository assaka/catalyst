import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/api/entities";
import { Category } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { Attribute } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import { useTranslation } from "@/contexts/TranslationContext";
import { getAttributeLabel, getAttributeValueLabel } from "@/utils/attributeUtils";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CreditCard, Banknote, CheckCircle, AlertCircle, Languages, X, ChevronsUpDown, Check, Building2, Truck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import FlashMessage from "@/components/storefront/FlashMessage";
import { CountrySelect } from "@/components/ui/country-select";
import TranslationFields from "@/components/admin/TranslationFields";

export default function PaymentMethods() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { currentLanguage } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [showTranslations, setShowTranslations] = useState(false);

  // Conditions data
  const [categories, setCategories] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showAttributeSetSelect, setShowAttributeSetSelect] = useState(false);
  const [skuInput, setSkuInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'credit_card',
    payment_flow: 'offline',
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
    conditions: {
      categories: [],
      attribute_sets: [],
      skus: [],
      attribute_conditions: []
    },
    translations: {}
  });

  // Local formatPrice helper that uses selectedStore's currency
  const formatPrice = (value, decimals = 2) => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    const symbol = selectedStore?.currency_symbol || selectedStore?.settings?.currency_symbol || store?.currency_symbol || store?.settings?.currency_symbol || '$';
    return `${symbol}${num.toFixed(decimals)}`;
  };

  const quickAddMethods = [
    {
      name: "Stripe (Online Payments)",
      code: "stripe",
      type: "stripe",
      payment_flow: "online",
      description: "Accept credit cards, debit cards, and more via Stripe.",
      icon_url: "https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-fed4f31ce.svg",
      icon: "stripe"
    },
    {
      name: "Cash on Delivery",
      code: "cod",
      type: "cash_on_delivery",
      payment_flow: "offline",
      description: "Pay with cash upon delivery.",
      icon_url: "",
      icon: "banknote"
    },
    {
      name: "Bank Transfer",
      code: "bank_transfer",
      type: "bank_transfer",
      payment_flow: "offline",
      description: "Pay via a manual bank transfer.",
      icon_url: "",
      icon: "building"
    }
  ];

  useEffect(() => {
    if (selectedStore) {
      loadPaymentMethods();
      loadConditionsData();
    }
  }, [selectedStore, currentLanguage]);

  const loadConditionsData = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const [attributeSetsData, attributesData, categoriesData] = await Promise.all([
        AttributeSet.filter({ store_id: storeId }).catch(() => []),
        Attribute.filter({ store_id: storeId }).catch(() => []),
        Category.filter({ store_id: storeId }).catch(() => [])
      ]);

      // Transform attribute values into options format
      const transformedAttributes = (attributesData || []).map(attr => {
        if (attr.values && Array.isArray(attr.values)) {
          return {
            ...attr,
            options: attr.values.map(v => ({
              value: v.code,
              label: getAttributeValueLabel(v, currentLanguage)
            }))
          };
        }
        return attr;
      });

      setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);
      setAttributes(transformedAttributes);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error loading conditions data:", error);
      setAttributeSets([]);
      setAttributes([]);
      setCategories([]);
    }
  };

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

    setSaveSuccess(false);
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
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

    // Parse conditions if it's a string
    let conditions = method.conditions || {};
    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch (e) {
        conditions = {};
      }
    }

    // Ensure conditions has all required fields
    conditions = {
      categories: conditions.categories || [],
      attribute_sets: conditions.attribute_sets || [],
      skus: conditions.skus || [],
      attribute_conditions: conditions.attribute_conditions || []
    };

    setFormData({
      name: method.name,
      code: method.code,
      type: method.type || 'other',
      payment_flow: method.payment_flow || 'offline',
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
      conditions: conditions,
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
      payment_flow: 'offline',
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
      conditions: {
        categories: [],
        attribute_sets: [],
        skus: [],
        attribute_conditions: []
      },
      translations: {}
    });
  };

  // Conditions handlers
  const handleConditionChange = (conditionType, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [conditionType]: value
      }
    }));
  };

  const handleMultiSelectToggle = (condition, id) => {
    const currentValues = formData.conditions[condition] || [];
    const newValues = currentValues.includes(id)
      ? currentValues.filter(item => item !== id)
      : [...currentValues, id];

    handleConditionChange(condition, newValues);
  };

  const handleSkuAdd = () => {
    const trimmedSku = skuInput.trim();
    if (trimmedSku && !formData.conditions.skus?.includes(trimmedSku)) {
      const currentSkus = formData.conditions.skus || [];
      handleConditionChange('skus', [...currentSkus, trimmedSku]);
      setSkuInput('');
    }
  };

  const handleSkuRemove = (skuToRemove) => {
    const currentSkus = formData.conditions.skus || [];
    handleConditionChange('skus', currentSkus.filter(sku => sku !== skuToRemove));
  };

  const handleSkuKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkuAdd();
    }
  };

  const addAttributeCondition = () => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    handleConditionChange('attribute_conditions', [...currentConditions, { attribute_code: '', attribute_value: '' }]);
  };

  const removeAttributeCondition = (index) => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    handleConditionChange('attribute_conditions', currentConditions.filter((_, i) => i !== index));
  };

  const updateAttributeCondition = (index, field, value) => {
    const currentConditions = formData.conditions.attribute_conditions || [];
    const updatedConditions = [...currentConditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value,
      // Reset attribute_value when attribute_code changes
      ...(field === 'attribute_code' ? { attribute_value: '' } : {})
    };
    handleConditionChange('attribute_conditions', updatedConditions);
  };

  const getSelectedCategoryNames = () => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(cat => cat && formData.conditions.categories?.includes(cat.id)).map(cat => cat.name);
  };

  const getSelectedAttributeSetNames = () => {
    if (!Array.isArray(attributeSets)) return [];
    return attributeSets.filter(set => set && formData.conditions.attribute_sets?.includes(set.id)).map(set => set.name);
  };

  const getSelectableAttributes = () => {
    if (!Array.isArray(attributes)) return [];
    const usableAttributes = attributes.filter(attr => attr && attr.is_usable_in_conditions);
    return usableAttributes.length > 0 ? usableAttributes : attributes.slice(0, 20);
  };

  const getAttributeOptions = (attributeCode) => {
    if (!Array.isArray(attributes)) return [];
    const attribute = attributes.find(attr => attr && attr.code === attributeCode);
    return attribute?.options || [];
  };

  const renderConditionValueInput = (condition, index) => {
    const selectedAttr = attributes.find(attr => attr.code === condition.attribute_code);
    const hasOptions = selectedAttr && (selectedAttr.type === 'select' || selectedAttr.type === 'multiselect') && selectedAttr.options?.length > 0;

    if (hasOptions) {
      return (
        <Select
          value={condition.attribute_value}
          onValueChange={(value) => updateAttributeCondition(index, 'attribute_value', value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {selectedAttr.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        placeholder="Value"
        value={condition.attribute_value}
        onChange={(e) => updateAttributeCondition(index, 'attribute_value', e.target.value)}
        className="flex-1"
      />
    );
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
              {quickAddMethods.map(method => {
                // Render appropriate icon based on method type
                const renderIcon = () => {
                  if (method.icon_url) {
                    return <img src={method.icon_url} alt={method.name} className="h-8 w-auto object-contain" />;
                  }

                  switch (method.icon) {
                    case 'stripe':
                      return <CreditCard className="h-6 w-6 text-blue-600" />;
                    case 'banknote':
                      return <Banknote className="h-6 w-6 text-green-600" />;
                    case 'building':
                      return <Building2 className="h-6 w-6 text-indigo-600" />;
                    default:
                      return <CreditCard className="h-6 w-6 text-gray-600" />;
                  }
                };

                return (
                  <Button
                    key={method.code}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => handleQuickAdd(method)}
                    disabled={saving || !store}
                  >
                    {renderIcon()}
                    <span className="text-xs font-medium">{method.name}</span>
                  </Button>
                );
              })}
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
                        <Badge variant={method.payment_flow === 'online' ? 'default' : 'outline'} className={method.payment_flow === 'online' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                          {method.payment_flow === 'online' ? 'Online' : 'Offline'}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="payment_flow">Payment Flow</Label>
                    <Select value={formData.payment_flow} onValueChange={(value) => setFormData({ ...formData, payment_flow: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online (requires webhook confirmation)</SelectItem>
                        <SelectItem value="offline">Offline (immediate confirmation)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Online: Stripe, PayPal (wait for webhook). Offline: Bank transfer, Cash on delivery (immediate).
                    </p>
                  </div>
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

                {/* Conditions (Optional) */}
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Conditions (Optional)</h3>
                    <p className="text-sm text-gray-600">
                      Optionally specify conditions to control when this payment method is available. If no conditions are specified, the payment method will always be available.
                    </p>
                  </div>

                  {/* Categories */}
                  <div>
                    <Label>Categories</Label>
                    <Popover open={showCategorySelect} onOpenChange={setShowCategorySelect}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={`w-full justify-between ${formData.conditions.categories?.length ? '' : 'text-muted-foreground'}`}
                        >
                          {formData.conditions.categories?.length
                            ? `${formData.conditions.categories.length} categories selected`
                            : "Select categories..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  onSelect={() => handleMultiSelectToggle('categories', category.id)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      formData.conditions.categories?.includes(category.id) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formData.conditions.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getSelectedCategoryNames().map((name, index) => {
                          const categoryId = categories.find(c => c && c.name === name)?.id;
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {name}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  if (categoryId) handleMultiSelectToggle('categories', categoryId);
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Attribute Sets */}
                  <div>
                    <Label>Attribute Sets</Label>
                    <Popover open={showAttributeSetSelect} onOpenChange={setShowAttributeSetSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={`w-full justify-between ${formData.conditions.attribute_sets?.length ? '' : 'text-muted-foreground'}`}
                        >
                          {formData.conditions.attribute_sets?.length
                            ? `${formData.conditions.attribute_sets.length} attribute sets selected`
                            : "Select attribute sets..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search attribute sets..." />
                          <CommandEmpty>No attribute sets found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {attributeSets.map((set) => (
                                <CommandItem
                                  key={set.id}
                                  onSelect={() => handleMultiSelectToggle('attribute_sets', set.id)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      formData.conditions.attribute_sets?.includes(set.id) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {set.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formData.conditions.attribute_sets?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getSelectedAttributeSetNames().map((name, index) => {
                          const setId = attributeSets.find(s => s && s.name === name)?.id;
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {name}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  if (setId) handleMultiSelectToggle('attribute_sets', setId);
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Attribute Conditions */}
                  <div>
                    <Label>Specific Attribute Values</Label>
                    <p className="text-sm text-gray-500 mb-3">Show this payment method when products have specific attribute values</p>

                    <div className="space-y-3">
                      {formData.conditions.attribute_conditions?.map((condition, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Select
                            value={condition.attribute_code}
                            onValueChange={(value) => updateAttributeCondition(index, 'attribute_code', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSelectableAttributes().map(attr => (
                                <SelectItem key={attr.id} value={attr.code}>
                                  {getAttributeLabel(attr, currentLanguage)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {renderConditionValueInput(condition, index)}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttributeCondition(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addAttributeCondition}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Attribute Condition
                      </Button>
                    </div>
                  </div>

                  {/* SKUs */}
                  <div>
                    <Label>SKUs</Label>
                    <div className="space-y-2">
                      {formData.conditions.skus?.map((sku, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-mono">{sku}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSkuRemove(sku)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Input
                          id="skus"
                          value={skuInput}
                          onChange={(e) => setSkuInput(e.target.value)}
                          onKeyPress={handleSkuKeyPress}
                          placeholder="Enter SKU and press Enter or click Add"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSkuAdd}
                          disabled={!skuInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Add individual SKUs. This payment method will be available for products matching any of these SKUs.
                    </p>
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
                  <SaveButton
                    type="submit"
                    loading={saving}
                    success={saveSuccess}
                    defaultText={editingMethod ? "Update" : "Create"}
                  />
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}