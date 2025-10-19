import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Bot, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function SeoRobots() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Sitemap: https://example.com/sitemap.xml`);

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
        <Bot className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Robots.txt Configuration</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The robots.txt file tells search engines which pages to crawl and which to avoid.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Robots.txt Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="robots-content">File Content</Label>
            <Textarea 
              id="robots-content"
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <SaveButton
              onClick={handleSave}
              loading={saving}
              success={saveSuccess}
              defaultText="Save Changes"
            />
            <Button variant="outline">Preview</Button>
            <Button variant="outline">Validate</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="block-crawlers" />
            <Label htmlFor="block-crawlers">Block all crawlers (maintenance mode)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="block-images" />
            <Label htmlFor="block-images">Prevent image indexing</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="block-js-css" />
            <Label htmlFor="block-js-css">Block JS/CSS crawling</Label>
          </div>
          
          <div className="space-y-2">
            <Label>Crawl Delay (seconds)</Label>
            <input 
              type="number" 
              min="0" 
              max="60" 
              defaultValue="0"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-sm text-muted-foreground">
              Delay between requests for crawlers (0 = no delay)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}