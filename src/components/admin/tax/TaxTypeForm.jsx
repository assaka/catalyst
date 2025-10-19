import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import SaveButton from '@/components/ui/save-button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

import { useAlertTypes } from '@/hooks/useAlert';
export default function TaxTypeForm({ taxType, stores, onSubmit, onCancel }) {
  const { showError, showWarning, showInfo, showSuccess, AlertComponent } = useAlertTypes();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_default: false,
    country_rates: [],
    store_id: stores[0]?.id || ""
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [newRate, setNewRate] = useState("");

  const availableCountries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "NL", name: "Netherlands" },
    { code: "BE", name: "Belgium" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" }
  ];

  useEffect(() => {
    if (taxType) {
      setFormData({
        name: taxType.name || "",
        description: taxType.description || "",
        is_default: taxType.is_default || false,
        country_rates: taxType.country_rates || [],
        store_id: taxType.store_id || stores[0]?.id || ""
      });
    }
  }, [taxType, stores]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCountryRate = () => {
    if (newCountry && newRate) {
      const rate = parseFloat(newRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        showWarning('Please enter a valid tax rate between 0 and 100');
        return;
      }

      const existingIndex = formData.country_rates.findIndex(cr => cr.country === newCountry);
      
      if (existingIndex >= 0) {
        // Update existing rate
        const updatedRates = [...formData.country_rates];
        updatedRates[existingIndex] = { country: newCountry, rate };
        setFormData(prev => ({ ...prev, country_rates: updatedRates }));
      } else {
        // Add new rate
        setFormData(prev => ({
          ...prev,
          country_rates: [...prev.country_rates, { country: newCountry, rate }]
        }));
      }

      setNewCountry("");
      setNewRate("");
    }
  };

  const handleRemoveCountryRate = (country) => {
    setFormData(prev => ({
      ...prev,
      country_rates: prev.country_rates.filter(cr => cr.country !== country)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setLoading(true);

    try {
      if (formData.country_rates.length === 0) {
        showWarning('Please add at least one country tax rate');
        return;
      }

      await onSubmit(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error submitting tax type:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (countryCode) => {
    const country = availableCountries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="material-elevation-1 border-0">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Tax Type Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Standard VAT, Reduced VAT"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe when this tax type should be used"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="is_default" 
                checked={formData.is_default}
                onCheckedChange={(checked) => handleInputChange("is_default", checked)}
              />
              <Label htmlFor="is_default">Set as default tax type</Label>
            </div>

            <div>
              <Label htmlFor="store">Store</Label>
              <Select value={formData.store_id} onValueChange={(value) => handleInputChange("store_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Country Tax Rates */}
        <Card className="material-elevation-1 border-0">
          <CardHeader>
            <CardTitle>Country Tax Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={newCountry} onValueChange={setNewCountry}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries
                    .filter(country => !formData.country_rates.find(cr => cr.country === country.code))
                    .map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Tax rate %"
                className="w-24"
              />
              <Button type="button" onClick={handleAddCountryRate} disabled={!newCountry || !newRate}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.country_rates.map((countryRate) => (
                <div key={countryRate.country} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{getCountryName(countryRate.country)}</span>
                    <Badge variant="outline" className="ml-2">
                      {countryRate.rate}%
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCountryRate(countryRate.country)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {formData.country_rates.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No country rates added yet</p>
                <p className="text-xs">Add at least one country tax rate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SaveButton
          type="submit"
          loading={loading}
          success={saveSuccess}
          disabled={formData.country_rates.length === 0}
          defaultText={taxType ? "Update Tax Type" : "Create Tax Type"}
        />
      </div>
    </form>
  );
}