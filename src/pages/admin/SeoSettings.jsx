import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Settings, FileText } from "lucide-react";
import { SeoSetting } from '@/api/entities';
import { useStore } from '@/components/storefront/StoreProvider';
import { useToast } from "@/hooks/use-toast";

export default function SeoSettings() {
  const { store } = useStore();
  const { toast } = useToast();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // HTML Sitemap Settings
  const [enableHtmlSitemap, setEnableHtmlSitemap] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [maxProducts, setMaxProducts] = useState(20);
  const [productSort, setProductSort] = useState('-updated_date');
  const [seoSettingsId, setSeoSettingsId] = useState(null);

  useEffect(() => {
    if (store?.id) {
      loadSettings();
    }
  }, [store?.id]);

  const loadSettings = async () => {
    try {
      const settings = await SeoSetting.filter({ store_id: store.id });
      if (settings && settings.length > 0) {
        const s = settings[0];
        setSeoSettingsId(s.id);
        setEnableHtmlSitemap(s.enable_html_sitemap ?? true);
        setIncludeCategories(s.html_sitemap_include_categories ?? true);
        setIncludeProducts(s.html_sitemap_include_products ?? true);
        setIncludePages(s.html_sitemap_include_pages ?? true);
        setMaxProducts(s.html_sitemap_max_products ?? 20);
        setProductSort(s.html_sitemap_product_sort ?? '-updated_date');
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const data = {
        store_id: store.id,
        enable_html_sitemap: enableHtmlSitemap,
        html_sitemap_include_categories: includeCategories,
        html_sitemap_include_products: includeProducts,
        html_sitemap_include_pages: includePages,
        html_sitemap_max_products: maxProducts,
        html_sitemap_product_sort: productSort
      };

      if (seoSettingsId) {
        await SeoSetting.update(seoSettingsId, data);
      } else {
        const created = await SeoSetting.create(data);
        setSeoSettingsId(created.id);
      }

      setSaveSuccess(true);
      toast({
        title: "Success",
        description: "HTML sitemap settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>HTML Sitemap Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure what appears in your HTML sitemap page for visitors and search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-html-sitemap"
              checked={enableHtmlSitemap}
              onCheckedChange={setEnableHtmlSitemap}
            />
            <Label htmlFor="enable-html-sitemap">Enable HTML Sitemap</Label>
          </div>

          {enableHtmlSitemap && (
            <>
              <div className="pl-6 space-y-4 border-l-2 border-gray-200">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-categories"
                    checked={includeCategories}
                    onCheckedChange={setIncludeCategories}
                  />
                  <Label htmlFor="include-categories">Include Categories</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-products"
                    checked={includeProducts}
                    onCheckedChange={setIncludeProducts}
                  />
                  <Label htmlFor="include-products">Include Products</Label>
                </div>

                {includeProducts && (
                  <div className="pl-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-products">Maximum Products to Display</Label>
                      <Input
                        id="max-products"
                        type="number"
                        min="1"
                        max="100"
                        value={maxProducts}
                        onChange={(e) => setMaxProducts(parseInt(e.target.value) || 20)}
                        placeholder="20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-sort">Product Sort Order</Label>
                      <select
                        id="product-sort"
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="-updated_date">Recently Updated</option>
                        <option value="updated_date">Oldest Updated</option>
                        <option value="-created_date">Newest First</option>
                        <option value="created_date">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="-name">Name (Z-A)</option>
                        <option value="-price">Price (High to Low)</option>
                        <option value="price">Price (Low to High)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-pages"
                    checked={includePages}
                    onCheckedChange={setIncludePages}
                  />
                  <Label htmlFor="include-pages">Include CMS Pages</Label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Public URL:</strong> /public/{store?.slug || 'your-store'}/sitemap
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Admin Preview:</strong> /admin/html-sitemap
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end mt-8">
        <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Save Settings"
        />
      </div>
    </div>
  );
}