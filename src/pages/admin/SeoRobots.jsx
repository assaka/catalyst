import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Bot, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';

export default function SeoRobots() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  // Import custom rules from products, categories, and CMS pages
  const importCustomRules = async () => {
    setGenerating(true);
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        alert('Please select a store first');
        return;
      }

      // Fetch products, categories, and pages with noindex/nofollow tags
      const [products, categories, pages] = await Promise.all([
        Product.filter({ store_id: storeId, "seo.meta_robots_tag": "noindex, nofollow" }),
        Category.filter({ store_id: storeId, meta_robots_tag: "noindex, nofollow" }),
        CmsPage.filter({ store_id: storeId, meta_robots_tag: "noindex, nofollow" })
      ]);

      // Build default rules
      const domain = selectedStore?.custom_domain || selectedStore?.domain || 'https://example.com';
      const defaultRules = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /checkout/',
        'Disallow: /cart/',
        'Disallow: /account/',
        'Disallow: /login',
        `Sitemap: ${domain}/sitemap.xml`
      ].join('\n');

      let newContent = [defaultRules];

      // Add custom rules for products
      if (products && products.length > 0) {
        newContent.push('\n# Disallowed Products (noindex/nofollow)');
        products.forEach(p => newContent.push(`Disallow: /products/${p.slug || p.id}`));
      }

      // Add custom rules for categories
      if (categories && categories.length > 0) {
        newContent.push('\n# Disallowed Categories (noindex/nofollow)');
        categories.forEach(c => newContent.push(`Disallow: /categories/${c.slug}`));
      }

      // Add custom rules for CMS pages
      if (pages && pages.length > 0) {
        newContent.push('\n# Disallowed CMS Pages (noindex/nofollow)');
        pages.forEach(p => newContent.push(`Disallow: /pages/${p.slug}`));
      }

      setRobotsTxt(newContent.join('\n'));
    } catch (error) {
      console.error("Error importing custom rules:", error);
      alert('Failed to import custom rules. Please try again.');
    } finally {
      setGenerating(false);
    }
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
          Use <strong>Import Custom Rules</strong> to automatically add products, categories, and CMS pages marked with noindex/nofollow tags.
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
          
          <div className="flex flex-wrap gap-2">
            <SaveButton
              onClick={handleSave}
              loading={saving}
              success={saveSuccess}
              defaultText="Save Changes"
            />
            <Button
              variant="outline"
              onClick={importCustomRules}
              disabled={generating || !selectedStore}
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Import Custom Rules
            </Button>
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