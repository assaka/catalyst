
import React, { useState, useEffect } from "react";
import { Attribute } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import {
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  List,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import AttributeForm from "../components/attributes/AttributeForm";
import AttributeSetForm from "../components/attributes/AttributeSetForm";

export default function Attributes() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [attributes, setAttributes] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [showSetForm, setShowSetForm] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      loadData();
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
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Filter attributes and attribute sets by selected store
      const [attributesData, setsData] = await Promise.all([
        Attribute.filter({ store_id: storeId }),
        AttributeSet.filter({ store_id: storeId })
      ]);

      setAttributes(attributesData || []);
      setAttributeSets(setsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setAttributes([]);
      setAttributeSets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAttribute = async (attributeData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      await Attribute.create({ ...attributeData, store_id: storeId });
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error("Error creating attribute:", error);
    }
  };

  const handleUpdateAttribute = async (attributeData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      const { id, ...updateData } = attributeData;
      await Attribute.update(id, { ...updateData, store_id: storeId });
      await loadData();
      setShowForm(false);
      setEditingAttribute(null);
    } catch (error) {
      console.error("Error updating attribute:", error);
    }
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (window.confirm("Are you sure you want to delete this attribute?")) {
      try {
        await Attribute.delete(attributeId);
        await loadData();
      } catch (error) {
        console.error("Error deleting attribute:", error);
      }
    }
  };

  const handleCreateSet = async (setData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      await AttributeSet.create({ ...setData, store_id: storeId });
      await loadData();
      setShowSetForm(false);
    } catch (error) {
      console.error("Error creating attribute set:", error);
    }
  };

  const handleUpdateSet = async (setData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error("No store selected");
    }

    try {
      const { id, ...updateData } = setData;
      await AttributeSet.update(id, { ...updateData, store_id: storeId });
      await loadData();
      setShowSetForm(false);
      setEditingSet(null);
    } catch (error) {
      console.error("Error updating attribute set:", error);
    }
  };

  const handleDeleteAttributeSet = async (attributeSetId) => {
    if (window.confirm("Are you sure you want to delete this attribute set?")) {
      try {
        await AttributeSet.delete(attributeSetId);
        await loadData();
      } catch (error) {
        console.error("Error deleting attribute set:", error);
      }
    }
  };

  const filteredAttributes = attributes.filter(attribute =>
    attribute.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attribute.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttributeSets = attributeSets.filter(attributeSet =>
    attributeSet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttributeTypeColor = (type) => {
    const colors = {
      text: "bg-blue-100 text-blue-700",
      number: "bg-green-100 text-green-700",
      select: "bg-purple-100 text-purple-700",
      multiselect: "bg-pink-100 text-pink-700",
      boolean: "bg-orange-100 text-orange-700",
      date: "bg-indigo-100 text-indigo-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NoStoreSelected message="Please select a store to manage attributes and attribute sets" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attributes & Sets</h1>
            <p className="text-gray-600 mt-1">Manage product attributes and attribute sets</p>
          </div>
        </div>

        {/* Search */}
        <Card className="material-elevation-1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search attributes and sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attributes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Attributes
            </TabsTrigger>
            <TabsTrigger value="sets" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Attribute Sets
            </TabsTrigger>
          </TabsList>

          {/* Attributes Tab */}
          <TabsContent value="attributes">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Attributes ({filteredAttributes.length})</h2>
              <Button
                onClick={() => {
                  setEditingAttribute(null); // Reset for new creation
                  setShowForm(true); // Open attribute form
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Attribute
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttributes.map((attribute) => (
                <Card key={attribute.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{attribute.name}</CardTitle>
                        <p className="text-sm text-gray-500 font-mono">{attribute.code}</p>
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
                              setEditingAttribute(attribute); // Set attribute for editing
                              setShowForm(true); // Open attribute form
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAttribute(attribute.id)}
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
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getAttributeTypeColor(attribute.type)}>
                          {attribute.type}
                        </Badge>
                        {attribute.is_required && (
                          <Badge variant="outline" className="text-red-600">Required</Badge>
                        )}
                        {attribute.is_filterable && (
                          <Badge variant="outline" className="text-blue-600">Filterable</Badge>
                        )}
                        {attribute.is_searchable && (
                          <Badge variant="outline" className="text-green-600">Searchable</Badge>
                        )}
                      </div>

                      {attribute.options && attribute.options.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Options:</p>
                          <div className="flex flex-wrap gap-1">
                            {attribute.options.slice(0, 3).map((option, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {option.label}
                              </Badge>
                            ))}
                            {attribute.options.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{attribute.options.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAttributes.length === 0 && (
              <Card className="material-elevation-1 border-0">
                <CardContent className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attributes found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Start by creating your first product attribute"}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingAttribute(null); // Reset for new creation
                      setShowForm(true); // Open attribute form
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attribute Sets Tab */}
          <TabsContent value="sets">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Attribute Sets ({filteredAttributeSets.length})</h2>
              <Button
                onClick={() => {
                  setEditingSet(null); // Reset for new creation
                  setShowSetForm(true); // Open attribute set form
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Attribute Set
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAttributeSets.map((attributeSet) => (
                <Card key={attributeSet.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{attributeSet.name}</CardTitle>
                        <p className="text-sm text-gray-500">{attributeSet.description}</p>
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
                              setEditingSet(attributeSet); // Set attribute set for editing
                              setShowSetForm(true); // Open attribute set form
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAttributeSet(attributeSet.id)}
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
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {attributeSet.is_default && (
                          <Badge className="bg-green-100 text-green-700">Default</Badge>
                        )}
                        <Badge variant="outline">
                          {attributeSet.attribute_ids?.length || 0} attributes
                        </Badge>
                      </div>

                      {attributeSet.attribute_ids && attributeSet.attribute_ids.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Attributes:</p>
                          <div className="flex flex-wrap gap-1">
                            {attributes
                              .filter(attr => attributeSet.attribute_ids.includes(attr.id))
                              .slice(0, 4)
                              .map((attr) => (
                                <Badge key={attr.id} variant="outline" className="text-xs">
                                  {attr.name}
                                </Badge>
                              ))}
                            {attributeSet.attribute_ids.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{attributeSet.attribute_ids.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAttributeSets.length === 0 && (
              <Card className="material-elevation-1 border-0">
                <CardContent className="text-center py-12">
                  <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attribute sets found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Start by creating your first attribute set"}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingSet(null); // Reset for new creation
                      setShowSetForm(true); // Open attribute set form
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute Set
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Attribute Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
              </DialogTitle>
            </DialogHeader>
            <AttributeForm
              attribute={editingAttribute}
              onSubmit={editingAttribute ? handleUpdateAttribute : handleCreateAttribute}
              onCancel={() => {
                setShowForm(false);
                setEditingAttribute(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Attribute Set Form Dialog */}
        <Dialog open={showSetForm} onOpenChange={setShowSetForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSet ? 'Edit Attribute Set' : 'Add New Attribute Set'}
              </DialogTitle>
            </DialogHeader>
            <AttributeSetForm
              attributeSet={editingSet}
              attributes={attributes}
              onSubmit={editingSet ? handleUpdateSet : handleCreateSet}
              onCancel={() => {
                setShowSetForm(false);
                setEditingSet(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
