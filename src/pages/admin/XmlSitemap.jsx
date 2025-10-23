import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Switch } from "@/components/ui/switch";
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { SeoSetting } from '@/api/entities';
import { useStore } from '@/components/storefront/StoreProvider';
import FlashMessage from '@/components/storefront/FlashMessage';

export default function XmlSitemap() {
    const { store } = useStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [sitemapXml, setSitemapXml] = useState('');
    const [flashMessage, setFlashMessage] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        totalUrls: 0,
        products: 0,
        categories: 0,
        pages: 0
    });

    // Settings
    const [seoSettingId, setSeoSettingId] = useState(null);
    const [settings, setSettings] = useState({
        sitemap_include_products: true,
        sitemap_include_categories: true,
        sitemap_include_pages: true
    });

    // Load existing settings
    useEffect(() => {
        const loadSettings = async () => {
            if (!store?.id) return;

            try {
                setLoading(true);
                const result = await SeoSetting.filter({ store_id: store.id });

                if (result && result.length > 0) {
                    const existingSettings = result[0];
                    setSeoSettingId(existingSettings.id);
                    setSettings({
                        sitemap_include_products: existingSettings.sitemap_include_products ?? true,
                        sitemap_include_categories: existingSettings.sitemap_include_categories ?? true,
                        sitemap_include_pages: existingSettings.sitemap_include_pages ?? true
                    });
                }
            } catch (error) {
                console.error('Error loading SEO settings:', error);
                setFlashMessage({ type: 'error', message: 'Failed to load sitemap settings' });
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [store?.id]);

    // Generate sitemap whenever settings change or on mount
    useEffect(() => {
        if (store?.id && !loading) {
            generateSitemap();
        }
    }, [store?.id, loading]);

    // Helper function to safely format dates
    const formatDate = (dateValue) => {
        try {
            if (!dateValue) return new Date().toISOString().split('T')[0];
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    };

    const generateSitemap = async () => {
        if (!store?.id) return;

        try {
            setGenerating(true);
            const [products, categories, pages] = await Promise.all([
                Product.filter({ status: 'active' }),
                Category.filter({ is_active: true }),
                CmsPage.filter({ is_active: true })
            ]);

            let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${window.location.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;

            let urlCount = 1; // Homepage
            let categoryCount = 0;
            let productCount = 0;
            let pageCount = 0;

            // Add categories
            if (settings.sitemap_include_categories && categories?.length > 0) {
                categories.forEach(category => {
                    const lastmod = formatDate(category.updatedAt || category.updated_date || category.createdAt || category.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/category/${category.slug || category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
                    categoryCount++;
                });
            }

            // Add products
            if (settings.sitemap_include_products && products?.length > 0) {
                products.forEach(product => {
                    const lastmod = formatDate(product.updatedAt || product.updated_date || product.createdAt || product.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
                    productCount++;
                });
            }

            // Add CMS pages
            if (settings.sitemap_include_pages && pages?.length > 0) {
                pages.forEach(page => {
                    const lastmod = formatDate(page.updatedAt || page.updated_date || page.createdAt || page.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
                    pageCount++;
                });
            }

            xml += '\n</urlset>';
            setSitemapXml(xml);

            setStats({
                totalUrls: urlCount + categoryCount + productCount + pageCount,
                categories: categoryCount,
                products: productCount,
                pages: pageCount
            });
        } catch (error) {
            console.error('Error generating sitemap:', error);
            setFlashMessage({ type: 'error', message: 'Failed to generate sitemap' });
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!store?.id) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            const payload = {
                store_id: store.id,
                sitemap_include_products: settings.sitemap_include_products,
                sitemap_include_categories: settings.sitemap_include_categories,
                sitemap_include_pages: settings.sitemap_include_pages
            };

            if (seoSettingId) {
                await SeoSetting.update(seoSettingId, payload);
            } else {
                const created = await SeoSetting.create(payload);
                setSeoSettingId(created.id);
            }

            setSaveSuccess(true);
            setFlashMessage({ type: 'success', message: 'Sitemap settings saved successfully' });

            // Regenerate sitemap with new settings
            await generateSitemap();

            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving sitemap settings:', error);
            setFlashMessage({ type: 'error', message: 'Failed to save sitemap settings' });
        } finally {
            setSaving(false);
        }
    };

    const downloadSitemap = () => {
        const blob = new Blob([sitemapXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-6 w-6" />
                    <h1 className="text-3xl font-bold">XML Sitemap</h1>
                </div>
                <p>Loading sitemap settings...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {flashMessage && (
                <FlashMessage
                    type={flashMessage.type}
                    message={flashMessage.message}
                    onClose={() => setFlashMessage(null)}
                />
            )}

            <div className="flex items-center gap-2 mb-6">
                <FileText className="h-6 w-6" />
                <h1 className="text-3xl font-bold">XML Sitemap</h1>
            </div>

            {/* Statistics Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Sitemap Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUrls}</div>
                            <div className="text-sm text-muted-foreground">Total URLs</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.categories}</div>
                            <div className="text-sm text-muted-foreground">Categories</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.products}</div>
                            <div className="text-sm text-muted-foreground">Products</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pages}</div>
                            <div className="text-sm text-muted-foreground">CMS Pages</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Sitemap Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Configure what content types should be included in your XML sitemap.
                            Changes will regenerate the sitemap automatically.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="include-products">Include Products</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add all active products to the sitemap
                                </p>
                            </div>
                            <Switch
                                id="include-products"
                                checked={settings.sitemap_include_products}
                                onCheckedChange={(checked) => {
                                    setSettings({ ...settings, sitemap_include_products: checked });
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="include-categories">Include Categories</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add all active categories to the sitemap
                                </p>
                            </div>
                            <Switch
                                id="include-categories"
                                checked={settings.sitemap_include_categories}
                                onCheckedChange={(checked) => {
                                    setSettings({ ...settings, sitemap_include_categories: checked });
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="include-pages">Include CMS Pages</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add all active CMS pages to the sitemap
                                </p>
                            </div>
                            <Switch
                                id="include-pages"
                                checked={settings.sitemap_include_pages}
                                onCheckedChange={(checked) => {
                                    setSettings({ ...settings, sitemap_include_pages: checked });
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={generateSitemap}
                    disabled={generating}
                    variant="outline"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Regenerating...' : 'Regenerate Sitemap'}
                </Button>
                <Button
                    onClick={downloadSitemap}
                    disabled={!sitemapXml || generating}
                    variant="outline"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download XML
                </Button>
            </div>

            {/* Preview Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Sitemap Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                        <pre className="text-xs">
                            {sitemapXml || 'Generating sitemap...'}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
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
