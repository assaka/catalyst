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

  // Quick settings state
  const [blockAllCrawlers, setBlockAllCrawlers] = useState(false);
  const [blockImages, setBlockImages] = useState(false);
  const [blockJsCss, setBlockJsCss] = useState(false);
  const [crawlDelay, setCrawlDelay] = useState(0);

  // Apply quick settings to robots.txt content
  const applyQuickSettings = () => {
    let lines = [];

    if (blockAllCrawlers) {
      // Maintenance mode - block everything
      lines.push('User-agent: *');
      lines.push('Disallow: /');
      lines.push('');
      lines.push('# Site is in maintenance mode');
    } else {
      // Default rules
      lines.push('User-agent: *');
      lines.push('Allow: /');
      lines.push('Disallow: /admin/');
      lines.push('Disallow: /api/');
      lines.push('Disallow: /cart');
      lines.push('Disallow: /checkout');

      // Add image blocking
      if (blockImages) {
        lines.push('');
        lines.push('# Block image indexing');
        lines.push('User-agent: Googlebot-Image');
        lines.push('Disallow: /');
        lines.push('');
        lines.push('User-agent: *');
        lines.push('Disallow: /*.jpg$');
        lines.push('Disallow: /*.jpeg$');
        lines.push('Disallow: /*.gif$');
        lines.push('Disallow: /*.png$');
        lines.push('Disallow: /*.svg$');
        lines.push('Disallow: /*.webp$');
      }

      // Add JS/CSS blocking
      if (blockJsCss) {
        lines.push('');
        lines.push('# Block JS/CSS crawling');
        lines.push('Disallow: /*.js$');
        lines.push('Disallow: /*.css$');
      }

      // Add crawl delay
      if (crawlDelay > 0) {
        lines.push('');
        lines.push(`Crawl-delay: ${crawlDelay}`);
      }

      lines.push('');
      lines.push('Sitemap: https://example.com/sitemap.xml');
    }

    setRobotsTxt(lines.join('\n'));
  };

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
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="block-crawlers" className="cursor-pointer">
              Block all crawlers (maintenance mode)
            </Label>
            <Switch
              id="block-crawlers"
              checked={blockAllCrawlers}
              onCheckedChange={(checked) => {
                setBlockAllCrawlers(checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="block-images" className="cursor-pointer">
              Prevent image indexing
            </Label>
            <Switch
              id="block-images"
              checked={blockImages}
              onCheckedChange={(checked) => {
                setBlockImages(checked);
              }}
              disabled={blockAllCrawlers}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="block-js-css" className="cursor-pointer">
              Block JS/CSS crawling
            </Label>
            <Switch
              id="block-js-css"
              checked={blockJsCss}
              onCheckedChange={(checked) => {
                setBlockJsCss(checked);
              }}
              disabled={blockAllCrawlers}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crawl-delay">Crawl Delay (seconds)</Label>
            <input
              id="crawl-delay"
              type="number"
              min="0"
              max="60"
              value={crawlDelay}
              onChange={(e) => setCrawlDelay(parseInt(e.target.value) || 0)}
              disabled={blockAllCrawlers}
              className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Delay between requests for crawlers (0 = no delay)
            </p>
          </div>

          <Button
            onClick={applyQuickSettings}
            className="w-full"
            variant="secondary"
          >
            Apply Quick Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}