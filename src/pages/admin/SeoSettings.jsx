import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export default function SeoSettings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">SEO Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global SEO Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-title">Site Title</Label>
            <Input id="site-title" placeholder="Your Store Name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title-separator">Title Separator</Label>
            <Input id="title-separator" placeholder="|" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-description">Default Meta Description</Label>
            <Textarea id="meta-description" placeholder="Default description for pages" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="auto-generate" />
            <Label htmlFor="auto-generate">Auto-generate meta tags</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="sitemap" />
            <Label htmlFor="sitemap">Enable XML Sitemap</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}