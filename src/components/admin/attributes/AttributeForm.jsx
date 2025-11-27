import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SaveButton from '@/components/ui/save-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Wand2, Trash2, ChevronDown, ChevronUp, Languages } from "lucide-react";
import AttributeValueTranslations from "./AttributeValueTranslations";
import api from "@/utils/api";
import { useTranslation } from "@/contexts/TranslationContext";

export default function AttributeForm({ attribute, onSubmit, onCancel }) {
  const { availableLanguages, currentLanguage } = useTranslation();
  const defaultLanguage = currentLanguage || 'nl'; // Use current language or fallback to 'nl'

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "text",
    is_required: false,
    is_filterable: false,
    is_searchable: false,
    is_usable_in_conditions: false,
    filter_type: "multiselect",
    file_settings: {
      allowed_extensions: ["pdf", "doc", "docx", "txt", "png", "jpg"],
      max_file_size: 5,
    },
    translations: {},
    store_id: "", // This will be set on the server-side or from a context
  });
  const [attributeValues, setAttributeValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newValueCode, setNewValueCode] = useState("");
  const [newValueLabel, setNewValueLabel] = useState("");
  const [nextTempId, setNextTempId] = useState(1);
  const [showTranslations, setShowTranslations] = useState(false);

  useEffect(() => {
    if (attribute) {
      // Create a deep copy of translations to avoid mutating the original
      const translations = attribute.translations
        ? JSON.parse(JSON.stringify(attribute.translations))
        : {};

      // Use 'label' field from normalized tables (not 'name')
      // Clean up empty descriptions
      Object.keys(translations).forEach(lang => {
        if (translations[lang].description === "") {
          delete translations[lang].description;
        }
      });

      // Use the default language (NL) for the main name field
      // Fallback order: defaultLanguage -> en -> attribute.name
      const attributeName = translations[defaultLanguage]?.label
        || translations.en?.label
        || attribute.name;

      // Ensure default language translation is populated
      if (!translations[defaultLanguage]) {
        translations[defaultLanguage] = { label: attribute.name };
      } else if (!translations[defaultLanguage].label) {
        translations[defaultLanguage].label = attribute.name;
      }

      console.log('Loading attribute with translations:', {
        attributeName,
        defaultLanguage,
        translations,
        originalTranslations: attribute.translations
      });

      setFormData({
        ...attribute,
        name: attributeName,
        translations: translations,
        file_settings: attribute.file_settings || {
          allowed_extensions: ["pdf", "doc", "docx", "txt", "png", "jpg"],
          max_file_size: 5,
        },
      });

      // Load attribute values
      if (attribute.values && Array.isArray(attribute.values)) {
        setAttributeValues(attribute.values);
      }
    }
  }, [attribute, defaultLanguage]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-configure file settings when switching to image type
      if (field === 'type' && value === 'image') {
        newData.file_settings = {
          allowed_extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
          max_file_size: 10, // Larger default for images
        };
      }
      // Auto-configure file settings when switching to file type
      else if (field === 'type' && value === 'file') {
        newData.file_settings = {
          allowed_extensions: ["pdf", "doc", "docx", "txt", "png", "jpg"],
          max_file_size: 5,
        };
      }

      return newData;
    });
  };

  // Add new attribute value
  const addAttributeValue = () => {
    if (newValueCode && newValueLabel) {
      const newValue = {
        tempId: `temp-${nextTempId}`,
        code: newValueCode,
        sort_order: attributeValues.length,
        translations: {
          en: {
            label: newValueLabel
          }
        },
        metadata: {}
      };
      setAttributeValues([...attributeValues, newValue]);
      setNewValueCode("");
      setNewValueLabel("");
      setNextTempId(nextTempId + 1);
    }
  };

  // Remove attribute value
  const removeAttributeValue = (valueId) => {
    setAttributeValues(attributeValues.filter(v =>
      (v.id || v.tempId) !== valueId
    ));
  };

  // Update attribute value translations
  const handleValueTranslationChange = (valueId, translations) => {
    setAttributeValues(attributeValues.map(v => {
      if ((v.id || v.tempId) === valueId) {
        return { ...v, translations };
      }
      return v;
    }));
  };

  // Update attribute label translations
  const handleAttributeTranslationChange = (langCode, value) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: {
          ...(prev.translations[langCode] || {}),
          label: value
        }
      }
    }));
  };

  const handleFileSettingsChange = (field, value) => {
    const parsedValue = Array.isArray(value)
      ? value
      : value
          .split(",")
          .map((ext) => ext.trim())
          .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      file_settings: { ...prev.file_settings, [field]: parsedValue },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setLoading(true);
    try {
      // For select/multiselect attributes, handle values BEFORE the main attribute
      // so that loadData() in the parent will include the updated values
      if (formData.type === 'select' || formData.type === 'multiselect') {
        const attributeId = attribute?.id;

        if (attributeId) {
          // Save each attribute value
          for (const value of attributeValues) {
            const valueData = {
              code: value.code,
              translations: value.translations || {},
              metadata: value.metadata || {},
              sort_order: value.sort_order || 0
            };

            console.log('Saving attribute value:', { valueId: value.id, valueData });

            if (value.id && !String(value.id).startsWith('temp-')) {
              // Update existing value
              await api.put(`/attributes/${attributeId}/values/${value.id}`, valueData);
            } else {
              // Create new value
              await api.post(`/attributes/${attributeId}/values`, valueData);
            }
          }

          // Delete removed values (if editing existing attribute)
          if (attribute?.values && attribute.values.length > 0) {
            const currentValueIds = attributeValues
              .filter(v => v.id && !String(v.id).startsWith('temp-'))
              .map(v => v.id);

            const removedValues = attribute.values.filter(oldVal =>
              oldVal.id && !currentValueIds.includes(oldVal.id)
            );

            console.log('Deleting removed values:', removedValues.map(v => v.id));

            for (const removedValue of removedValues) {
              await api.delete(`/attributes/${attributeId}/values/${removedValue.id}`);
            }
          }
        }
      }

      // Submit the attribute (this will trigger loadData in parent and close form)
      const savedAttribute = await onSubmit(formData);

      // For NEW attributes, save values after creation
      if (!attribute?.id && savedAttribute?.id) {
        if ((formData.type === 'select' || formData.type === 'multiselect') && attributeValues.length > 0) {
          for (const value of attributeValues) {
            const valueData = {
              code: value.code,
              translations: value.translations || {},
              metadata: value.metadata || {},
              sort_order: value.sort_order || 0
            };
            await api.post(`/attributes/${savedAttribute.id}/values`, valueData);
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error submitting attribute:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attribute Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Attribute Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Color, Size"
                required
              />

              {/* Manage Translation Section */}
              <button
                type="button"
                onClick={() => setShowTranslations(!showTranslations)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                <Languages className="w-4 h-4" />
                Manage Translations
                {showTranslations ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showTranslations && (
                <div className="mt-3 space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {availableLanguages.map((lang) => {
                    const isRTL = lang.is_rtl || false;
                    // Get value from translations using 'label' field
                    const value = formData.translations[lang.code]?.label || '';

                    return (
                      <div key={lang.code} className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 w-16 flex-shrink-0">
                          {lang.code === 'en' ? 'En' : lang.code === 'nl' ? 'NL' : lang.code.toUpperCase()}
                        </label>
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => handleAttributeTranslationChange(lang.code, e.target.value)}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          className={`flex-1 h-9 text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                          placeholder={`${lang.native_name} translation`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="code">Attribute Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="e.g., color, size"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Input Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="multiselect">Multiselect</SelectItem>
                  <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_required">Required</Label>
              <Switch
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  handleInputChange("is_required", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_filterable">Use in Layered Navigation</Label>
                <p className="text-xs text-gray-500">Show as filter option on category pages</p>
              </div>
              <Switch
                id="is_filterable"
                checked={formData.is_filterable}
                onCheckedChange={(checked) =>
                  handleInputChange("is_filterable", checked)
                }
              />
            </div>
            {formData.is_filterable && (
              <div>
                <Label htmlFor="filter_type">Filter Input Type</Label>
                <Select
                  value={formData.filter_type}
                  onValueChange={(value) =>
                    handleInputChange("filter_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiselect">Multiselect</SelectItem>
                    <SelectItem value="slider">Slider</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_searchable">Use in Search</Label>
              <Switch
                id="is_searchable"
                checked={formData.is_searchable}
                onCheckedChange={(checked) =>
                  handleInputChange("is_searchable", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_usable_in_conditions">Use for Rule Condition</Label>
                <p className="text-xs text-gray-500">Use in cart/catalog rules and promotions</p>
              </div>
              <Switch
                id="is_usable_in_conditions"
                checked={formData.is_usable_in_conditions}
                onCheckedChange={(checked) =>
                  handleInputChange("is_usable_in_conditions", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {(formData.type === "select" || formData.type === "multiselect") && (
        <Card>
          <CardHeader>
            <CardTitle>Attribute Options & Translations</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage options with multi-language support
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Existing attribute values with translations */}
            {attributeValues.map((value) => (
              <AttributeValueTranslations
                key={value.id || value.tempId}
                attributeValue={{
                  ...value,
                  label: value.translations?.en?.label || value.code
                }}
                onTranslationChange={handleValueTranslationChange}
                onDelete={removeAttributeValue}
              />
            ))}

            {/* Add new option */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">Add New Option</Label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="newValueLabel" className="text-xs text-gray-600">
                    Label (English)
                  </Label>
                  <Input
                    id="newValueLabel"
                    placeholder="e.g., Red"
                    value={newValueLabel}
                    onChange={(e) => setNewValueLabel(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAttributeValue();
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="newValueCode" className="text-xs text-gray-600">
                    Code (URL-friendly)
                  </Label>
                  <Input
                    id="newValueCode"
                    placeholder="e.g., red"
                    value={newValueCode}
                    onChange={(e) => setNewValueCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAttributeValue();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addAttributeValue}
                  disabled={!newValueCode || !newValueLabel}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                After adding, expand the option to manage translations for all languages
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(formData.type === "file" || formData.type === "image") && (
        <Card>
          <CardHeader>
            <CardTitle>{formData.type === 'image' ? 'Image Settings' : 'File Settings'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="allowed_extensions">
                Allowed Extensions (comma-separated)
              </Label>
              <Input
                id="allowed_extensions"
                value={
                  formData.file_settings.allowed_extensions?.join(", ") || ""
                }
                onChange={(e) =>
                  handleFileSettingsChange("allowed_extensions", e.target.value)
                }
                placeholder="e.g., png, jpg, pdf"
              />
            </div>
            <div>
              <Label htmlFor="max_file_size">Max File Size (MB)</Label>
              <Input
                id="max_file_size"
                type="number"
                value={formData.file_settings.max_file_size || 5}
                onChange={(e) =>
                  handleFileSettingsChange("max_file_size", e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SaveButton
          type="submit"
          loading={loading}
          success={saveSuccess}
          defaultText={attribute ? "Update Attribute" : "Create Attribute"}
        />
      </div>
    </form>
  );
}