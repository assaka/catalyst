import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Facebook, Twitter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SeoSocial() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 500));

    setSaveSuccess(true);
    setSaving(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Social Media & Schema</h1>
      </div>

      <Tabs defaultValue="opengraph">
        <TabsList>
          <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
          <TabsTrigger value="twitter">Twitter Card</TabsTrigger>
          <TabsTrigger value="schema">Schema Markup</TabsTrigger>
        </TabsList>

        <TabsContent value="opengraph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og-title">Default OG Title</Label>
                <Input id="og-title" placeholder="Your Store Name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og-description">Default OG Description</Label>
                <Textarea id="og-description" placeholder="Your store description for social sharing" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og-image">Default OG Image</Label>
                <Input id="og-image" type="file" accept="image/*" />
                <p className="text-sm text-muted-foreground">
                  Recommended: 1200x630px for optimal display
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og-type">Default OG Type</Label>
                <Select defaultValue="website">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Open Graph Settings"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Card Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Card Type</Label>
                <Select defaultValue="summary_large_image">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter-site">Twitter Username</Label>
                <Input id="twitter-site" placeholder="@yourstore" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter-creator">Creator Username</Label>
                <Input id="twitter-creator" placeholder="@creator" />
              </div>
              
              <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Twitter Settings"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Markup Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schema-type">Organization Type</Label>
                <Select defaultValue="Organization">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Organization">Organization</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="LocalBusiness">Local Business</SelectItem>
                    <SelectItem value="OnlineStore">Online Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" placeholder="Your Company Name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="org-logo">Organization Logo</Label>
                <Input id="org-logo" placeholder="https://example.com/logo.png" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-range">Price Range</Label>
                <Input id="price-range" placeholder="$$" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="opening-hours">Opening Hours</Label>
                <Textarea 
                  id="opening-hours" 
                  placeholder="Mo-Fr 09:00-18:00&#10;Sa 10:00-16:00"
                />
              </div>
              
              <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Schema Settings"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}