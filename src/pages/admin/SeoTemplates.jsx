import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2 } from "lucide-react";

export default function SeoTemplates() {
  const [templates, setTemplates] = useState([
    { id: 1, type: 'product', titleTemplate: '{product_name} | {category} | {store_name}' },
    { id: 2, type: 'category', titleTemplate: '{category_name} - Page {page_number} | {store_name}' }
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">SEO Templates</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-type">Page Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select page type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Pages</SelectItem>
                  <SelectItem value="category">Category Pages</SelectItem>
                  <SelectItem value="cms">CMS Pages</SelectItem>
                  <SelectItem value="brand">Brand Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title-template">Title Template</Label>
              <Input 
                id="title-template" 
                placeholder="{product_name} | {category} | {store_name}"
              />
              <p className="text-sm text-muted-foreground">
                Available variables: {'{product_name}'}, {'{category}'}, {'{store_name}'}, {'{price}'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description-template">Description Template</Label>
              <Textarea 
                id="description-template"
                placeholder="Shop {product_name} in {category}. {product_description}"
              />
            </div>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Existing Templates</h3>
            {templates.map(template => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium capitalize">{template.type}</span>
                  <p className="text-sm text-muted-foreground">{template.titleTemplate}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}