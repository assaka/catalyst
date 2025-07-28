import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";

export default function AttributeForm({ attribute, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "text",
    is_required: false,
    is_filterable: false,
    is_searchable: false,
    is_usable_in_conditions: false,
    filter_type: "multiselect",
    options: [],
    file_settings: {
      allowed_extensions: ["pdf", "doc", "docx", "txt", "png", "jpg"],
      max_file_size: 5,
    },
    store_id: "", // This will be set on the server-side or from a context
  });
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState({ label: "", value: "" });

  useEffect(() => {
    if (attribute) {
      setFormData({
        ...attribute,
        options: attribute.options || [],
        file_settings: attribute.file_settings || {
          allowed_extensions: ["pdf", "doc", "docx", "txt", "png", "jpg"],
          max_file_size: 5,
        },
      });
    }
  }, [attribute]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index][field] = value;
    handleInputChange("options", updatedOptions);
  };

  const addOption = () => {
    if (newOption.label && newOption.value) {
      handleInputChange("options", [...formData.options, newOption]);
      setNewOption({ label: "", value: "" });
    }
  };

  const removeOption = (index) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    handleInputChange("options", updatedOptions);
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
    setLoading(true);
    try {
      await onSubmit(formData);
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
              <Label htmlFor="is_filterable">Use in Layered Navigation</Label>
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
              <Label htmlFor="is_usable_in_conditions" className="pr-4">Use for Rule Condition</Label>
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
            <CardTitle>Attribute Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Input
                  placeholder="Label (e.g., Red)"
                  value={option.label}
                  onChange={(e) =>
                    handleOptionChange(index, "label", e.target.value)
                  }
                />
                <Input
                  placeholder="Value (e.g., red)"
                  value={option.value}
                  onChange={(e) =>
                    handleOptionChange(index, "value", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeOption(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-4 items-center pt-4 border-t">
              <Input
                placeholder="New Label"
                value={newOption.label}
                onChange={(e) =>
                  setNewOption({ ...newOption, label: e.target.value })
                }
              />
              <Input
                placeholder="New Value"
                value={newOption.value}
                onChange={(e) =>
                  setNewOption({ ...newOption, value: e.target.value })
                }
              />
              <Button type="button" onClick={addOption}>
                <Plus className="w-4 h-4 mr-2" /> Add Option
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.type === "file" && (
        <Card>
          <CardHeader>
            <CardTitle>File Settings</CardTitle>
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
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {loading
            ? "Saving..."
            : attribute
            ? "Update Attribute"
            : "Create Attribute"}
        </Button>
      </div>
    </form>
  );
}