import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SeoCanonical() {
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
        <Link2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Canonical URLs</h1>
      </div>

      <Alert>
        <AlertDescription>
          Canonical URLs help prevent duplicate content issues by specifying the preferred version of a page.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Canonical Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-canonical" defaultChecked />
            <Label htmlFor="auto-canonical">Auto-generate canonical URLs</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="https-canonical" defaultChecked />
            <Label htmlFor="https-canonical">Force HTTPS in canonical URLs</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="www-canonical" />
            <Label htmlFor="www-canonical">Include www in canonical URLs</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="trailing-slash" />
            <Label htmlFor="trailing-slash">Add trailing slash to canonical URLs</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical-domain">Canonical Domain</Label>
            <Input id="canonical-domain" placeholder="https://example.com" />
            <p className="text-sm text-muted-foreground">
              Override the default domain for all canonical URLs
            </p>
          </div>
          
          <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Save Settings"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Canonical URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page-url">Page URL</Label>
            <Input id="page-url" placeholder="/products/example-product" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="canonical-url">Canonical URL</Label>
            <Input id="canonical-url" placeholder="https://example.com/products/main-product" />
          </div>
          
          <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Add Custom Canonical"
          />
        </CardContent>
      </Card>
    </div>
  );
}